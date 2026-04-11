const pool = require('../config/db');

let dashboardSchemaReady = false;

async function ensureDashboardSchemaCompatibility() {
  if (dashboardSchemaReady) return;

  // Keep dashboard resilient on environments with partial/legacy schema.
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS dentistas (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      clinica_id INT UNSIGNED NOT NULL,
      nome VARCHAR(150) NOT NULL,
      email VARCHAR(150) NULL,
      telefone VARCHAR(30) NULL,
      ativo TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_dentistas_clinica_nome (clinica_id, nome)
    )`
  );

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS servicos (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      clinica_id INT UNSIGNED NOT NULL,
      nome VARCHAR(150) NOT NULL,
      valor DECIMAL(10,2) NOT NULL DEFAULT 0,
      ativo TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_servicos_clinica_nome (clinica_id, nome)
    )`
  );

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS recibos (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      clinica_id INT UNSIGNED NOT NULL,
      paciente_id INT UNSIGNED NULL,
      valor DECIMAL(10,2) NOT NULL DEFAULT 0,
      descricao VARCHAR(255) NULL,
      data_recibo DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_recibos_clinica_data (clinica_id, data_recibo)
    )`
  );

  await pool.execute(
    `ALTER TABLE agendamentos
      ADD COLUMN IF NOT EXISTS dentista_id INT UNSIGNED NULL AFTER paciente_id,
      ADD COLUMN IF NOT EXISTS servico_id INT UNSIGNED NULL AFTER dentista_id,
      ADD COLUMN IF NOT EXISTS procedimento VARCHAR(150) NULL AFTER servico_id,
      ADD COLUMN IF NOT EXISTS valor_estimado DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER observacoes`
  );

  dashboardSchemaReady = true;
}

function formatDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfWeek(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function endOfWeek(date) {
  const copy = startOfWeek(date);
  copy.setDate(copy.getDate() + 6);
  return copy;
}

function getWeekLabel(date) {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
}

function buildMonthCalendar(referenceDate, agendamentos, todayIso, selectedDateIso) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const cells = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const iso = formatDateISO(new Date(year, month, day));
    cells.push({
      day,
      iso,
      appointments: agendamentos.filter((item) => item.data === iso),
      isToday: iso === todayIso,
      isSelected: iso === selectedDateIso,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

function getLicenseInfo(clinica) {
  const expirationRaw = clinica?.licenca_fim_em || clinica?.trial_fim_em || null;
  if (!expirationRaw) {
    return {
      hasLicense: false,
      expiresAt: null,
      expiresAtLabel: null,
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
    };
  }

  const now = new Date();
  const expiresAt = new Date(expirationRaw);
  if (Number.isNaN(expiresAt.getTime())) {
    return {
      hasLicense: false,
      expiresAt: null,
      expiresAtLabel: null,
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
    };
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const diffMs = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / millisecondsPerDay);

  return {
    hasLicense: true,
    expiresAt,
    expiresAtLabel: expiresAt.toLocaleDateString('pt-BR'),
    daysRemaining,
    isExpiringSoon: daysRemaining >= 0 && daysRemaining <= 5,
    isExpired: daysRemaining < 0,
  };
}

async function index(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const perfil = req.session.user.perfil;
  const canViewFinancial = perfil !== 'recepcao';
  const selectedDate = parseDateInput(req.query.data);
  const selectedDateIso = formatDateISO(selectedDate);
  const todayIso = formatDateISO(new Date());
  const selectedTab = ['dia', 'semana', 'mes'].includes(req.query.aba) ? req.query.aba : 'dia';
  const dentistaId = req.query.dentista_id || '';
  const statusFilter = req.query.status || '';
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const monthStartIso = formatDateISO(monthStart);
  const monthEndIso = formatDateISO(monthEnd);
  const weekStartIso = formatDateISO(weekStart);
  const weekEndIso = formatDateISO(weekEnd);

  try {
    await ensureDashboardSchemaCompatibility();

    const [[clinicaAccess]] = await pool.execute(
      `SELECT licenca_dias, licenca_fim_em, trial_fim_em
       FROM clinicas
       WHERE id = ?
       LIMIT 1`,
      [clinicaId]
    );

    const licenseInfo = getLicenseInfo(clinicaAccess);

    const [[pacientesCount]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM pacientes WHERE clinica_id = ?',
      [clinicaId]
    );

    const [dentistas] = await pool.execute(
      'SELECT id, nome FROM dentistas WHERE clinica_id = ? AND ativo = 1 ORDER BY nome ASC',
      [clinicaId]
    );

    let agendaQuery = `
      SELECT a.id,
             DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
             DATE_FORMAT(a.data, '%d/%m/%Y') AS data_fmt,
             TIME_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
             TIME_FORMAT(a.hora_fim, '%H:%i') AS hora_fim,
             a.status,
             a.observacoes,
             a.valor_estimado,
             a.paciente_id,
             a.dentista_id,
             a.servico_id,
             p.nome AS paciente_nome,
             COALESCE(p.telefone, '') AS telefone,
             COALESCE(d.nome, 'Sem dentista') AS dentista_nome,
             COALESCE(s.nome, a.procedimento, 'Sem procedimento') AS servico_nome
      FROM agendamentos a
      INNER JOIN pacientes p ON p.id = a.paciente_id
      LEFT JOIN dentistas d ON d.id = a.dentista_id
      LEFT JOIN servicos s ON s.id = a.servico_id
      WHERE a.clinica_id = ?
        AND a.data BETWEEN ? AND ?`;
    const agendaParams = [clinicaId, monthStartIso, monthEndIso];

    if (dentistaId) {
      agendaQuery += ' AND a.dentista_id = ?';
      agendaParams.push(dentistaId);
    }

    if (statusFilter) {
      agendaQuery += ' AND a.status = ?';
      agendaParams.push(statusFilter);
    }

    agendaQuery += ' ORDER BY a.data ASC, a.hora_inicio ASC';

    const [agendamentosMes] = await pool.execute(agendaQuery, agendaParams);

    const agendaDia = agendamentosMes.filter((item) => item.data === selectedDateIso);
    const agendaSemana = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + offset);
      const iso = formatDateISO(currentDate);
      agendaSemana.push({
        iso,
        label: getWeekLabel(currentDate),
        isSelected: iso === selectedDateIso,
        isToday: iso === todayIso,
        appointments: agendamentosMes.filter((item) => item.data === iso),
      });
    }

    const [[receitaMes]] = canViewFinancial
      ? await pool.execute(
        `SELECT COALESCE(SUM(valor), 0) AS total
         FROM recibos
         WHERE clinica_id = ?
           AND data_recibo BETWEEN ? AND ?`,
        [clinicaId, monthStartIso, monthEndIso]
      )
      : [[{ total: 0 }]];

    const [aniversariantes] = await pool.execute(
      `SELECT id,
              nome,
              COALESCE(telefone, '') AS telefone,
              DATE_FORMAT(data_nascimento, '%d/%m') AS data_nasc_fmt
       FROM pacientes
       WHERE clinica_id = ?
         AND MONTH(data_nascimento) = MONTH(?)
       ORDER BY DAY(data_nascimento) ASC
       LIMIT 8`,
      [clinicaId, selectedDateIso]
    );

    const [ultimosRecibos] = canViewFinancial
      ? await pool.execute(
        `SELECT r.id,
                DATE_FORMAT(r.data_recibo, '%d/%m/%Y') AS data_fmt,
                r.valor,
                COALESCE(r.descricao, 'Recibo') AS descricao,
                p.nome AS paciente_nome
         FROM recibos r
         LEFT JOIN pacientes p ON p.id = r.paciente_id
         WHERE r.clinica_id = ?
         ORDER BY r.data_recibo DESC, r.id DESC
         LIMIT 5`,
        [clinicaId]
      )
      : [[]];

    const [producaoDentistas] = await pool.execute(
      `SELECT COALESCE(d.nome, 'Sem dentista') AS dentista_nome,
              COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN a.status != 'cancelado' THEN a.valor_estimado ELSE 0 END), 0) AS valor_total
       FROM agendamentos a
       LEFT JOIN dentistas d ON d.id = a.dentista_id
       WHERE a.clinica_id = ?
         AND a.data BETWEEN ? AND ?
       GROUP BY d.id, d.nome
       ORDER BY total DESC, valor_total DESC
       LIMIT 5`,
      [clinicaId, monthStartIso, monthEndIso]
    );

    const agendaSemanaItems = agendamentosMes.filter(
      (item) => item.data >= weekStartIso && item.data <= weekEndIso
    );

    const statusResumo = {
      agendado: agendamentosMes.filter((item) => item.status === 'agendado').length,
      confirmado: agendamentosMes.filter((item) => item.status === 'confirmado').length,
      concluido: agendamentosMes.filter((item) => item.status === 'concluido').length,
      cancelado: agendamentosMes.filter((item) => item.status === 'cancelado').length,
    };

    return res.render('dashboard/index', {
      filters: {
        selectedDate: selectedDateIso,
        selectedTab,
        dentistaId,
        status: statusFilter,
      },
      canViewFinancial,
      dentistas,
      stats: {
        pacientes: pacientesCount.total,
        agendaDia: agendaDia.length,
        agendaSemana: agendaSemanaItems.length,
        agendaMes: agendamentosMes.length,
        confirmadosDia: agendaDia.filter((item) => item.status === 'confirmado').length,
        receitaMes: receitaMes.total || 0,
      },
      agendaDia,
      agendaSemana,
      agendaMes: agendamentosMes,
      monthCalendar: buildMonthCalendar(selectedDate, agendamentosMes, todayIso, selectedDateIso),
      monthTitle: selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      todayIso,
      selectedDateIso,
      statusResumo,
      licenseInfo,
      aniversariantes,
      ultimosRecibos,
      producaoDentistas,
      weekRangeLabel: `${weekStart.toLocaleDateString('pt-BR')} - ${weekEnd.toLocaleDateString('pt-BR')}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro no dashboard',
      message: 'Não foi possível carregar o dashboard.'
    });
  }
}

async function updateStatus(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatus = ['agendado', 'confirmado', 'concluido', 'cancelado'];

  try {
    if (!allowedStatus.includes(status)) {
      return res.status(400).render('partials/error', {
        title: 'Status invalido',
        message: 'O status informado nao e permitido.'
      });
    }

    await pool.execute(
      'UPDATE agendamentos SET status = ? WHERE id = ? AND clinica_id = ?',
      [status, id, clinicaId]
    );

    return res.redirect(req.get('referer') || '/dashboard');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao atualizar status',
      message: 'Nao foi possivel atualizar o status do agendamento.'
    });
  }
}

module.exports = { index, updateStatus };
