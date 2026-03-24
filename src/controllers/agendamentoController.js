const pool = require('../config/db');
const { isEmailConfigured, sendEmail } = require('../services/emailService');

function parseDateISO(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
  return value;
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function resolveClinicName(value) {
  const name = String(value || '').trim();
  return name || 'sua clinica';
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!email) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function getWeekRange(dateISO) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startIso = start.toISOString().slice(0, 10);
  const endIso = end.toISOString().slice(0, 10);
  return { startIso, endIso };
}

function buildPatientAppointmentEmail(item) {
  const clinicaNome = resolveClinicName(item.clinica_nome);
  const subject = `Confirmacao de agendamento - ${clinicaNome}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937;">
      <h2 style="margin-bottom:6px;color:#1254a1;">${clinicaNome}</h2>
      <p>Ola <strong>${item.paciente_nome}</strong>, seu agendamento foi confirmado.</p>
      <ul>
        <li><strong>Data:</strong> ${item.data_formatada}</li>
        <li><strong>Horario:</strong> ${item.hora_inicio} - ${item.hora_fim}</li>
        <li><strong>Dentista:</strong> ${item.dentista_nome || 'A definir'}</li>
        <li><strong>Servico:</strong> ${item.servico_nome || 'Nao informado'}</li>
      </ul>
      <p>Se precisar alterar, fale com a secretaria.</p>
      <p>Atenciosamente,<br/><strong>${clinicaNome}</strong></p>
    </div>`;
  const text = `Ola ${item.paciente_nome}, seu agendamento foi confirmado para ${item.data_formatada} as ${item.hora_inicio}. Dentista: ${item.dentista_nome || 'A definir'}. Servico: ${item.servico_nome || 'Nao informado'}. Atenciosamente, ${clinicaNome}.`;
  return { subject, html, text };
}

function buildDentistNewAppointmentEmail(item) {
  const clinicaNome = resolveClinicName(item.clinica_nome);
  const subject = `Novo agendamento na agenda - ${clinicaNome}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937;">
      <h2 style="margin-bottom:6px;color:#1254a1;">${clinicaNome}</h2>
      <p>Voce recebeu um novo agendamento.</p>
      <ul>
        <li><strong>Paciente:</strong> ${item.paciente_nome}</li>
        <li><strong>Data:</strong> ${item.data_formatada}</li>
        <li><strong>Horario:</strong> ${item.hora_inicio} - ${item.hora_fim}</li>
        <li><strong>Servico:</strong> ${item.servico_nome || 'Nao informado'}</li>
        <li><strong>Valor estimado:</strong> R$ ${formatMoney(item.valor_estimado)}</li>
      </ul>
      <p>Atenciosamente,<br/><strong>${clinicaNome}</strong></p>
    </div>`;
  const text = `Novo agendamento: ${item.paciente_nome}, ${item.data_formatada} ${item.hora_inicio}-${item.hora_fim}, servico ${item.servico_nome || 'Nao informado'}. Atenciosamente, ${clinicaNome}.`;
  return { subject, html, text };
}

function buildDentistAgendaEmail(dentistaNome, periodoLabel, itens, clinicaNomeInput) {
  const clinicaNome = resolveClinicName(clinicaNomeInput);
  const rowsHtml = itens.map((item) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.data_formatada}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.hora_inicio} - ${item.hora_fim}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.paciente_nome}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.servico_nome || '-'}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.status}</td>
    </tr>`).join('');

  const subject = `Agenda ${periodoLabel} - ${dentistaNome} - ${clinicaNome}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937;">
      <h2 style="margin-bottom:6px;color:#1254a1;">${clinicaNome}</h2>
      <p>Resumo da agenda <strong>${periodoLabel}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:6px 8px;background:#f3f4f6;">Data</th>
            <th style="text-align:left;padding:6px 8px;background:#f3f4f6;">Horario</th>
            <th style="text-align:left;padding:6px 8px;background:#f3f4f6;">Paciente</th>
            <th style="text-align:left;padding:6px 8px;background:#f3f4f6;">Servico</th>
            <th style="text-align:left;padding:6px 8px;background:#f3f4f6;">Status</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <p style="margin-top:12px;">Atenciosamente,<br/><strong>${clinicaNome}</strong></p>
    </div>`;

  const text = itens
    .map((item) => `${item.data_formatada} ${item.hora_inicio}-${item.hora_fim} | ${item.paciente_nome} | ${item.servico_nome || '-'} | ${item.status}`)
    .join('\n') + `\n\nAtenciosamente, ${clinicaNome}.`;

  return { subject, html, text };
}

async function enviarEmailsNovoAgendamento(clinicaId, agendamentoId) {
  if (!isEmailConfigured()) return;

  try {
    const [rows] = await pool.execute(
      `SELECT a.id,
              DATE_FORMAT(a.data, '%d/%m/%Y') AS data_formatada,
              TIME_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
              TIME_FORMAT(a.hora_fim, '%H:%i') AS hora_fim,
              a.valor_estimado,
              p.nome AS paciente_nome,
              COALESCE(p.email, '') AS paciente_email,
              COALESCE(d.nome, '') AS dentista_nome,
              COALESCE(d.email, '') AS dentista_email,
        COALESCE(s.nome, a.procedimento, '') AS servico_nome,
        COALESCE(c.nome, '') AS clinica_nome
       FROM agendamentos a
       INNER JOIN pacientes p ON p.id = a.paciente_id
      INNER JOIN clinicas c ON c.id = a.clinica_id
       LEFT JOIN dentistas d ON d.id = a.dentista_id
       LEFT JOIN servicos s ON s.id = a.servico_id
       WHERE a.id = ? AND a.clinica_id = ?
       LIMIT 1`,
      [agendamentoId, clinicaId]
    );

    if (!rows.length) return;

    const item = rows[0];
    const clinicaNome = resolveClinicName(item.clinica_nome);

    if (item.paciente_email) {
      const payload = buildPatientAppointmentEmail(item);
      const result = await sendEmail({ to: item.paciente_email, ...payload, fromName: clinicaNome });
      if (!result.ok && !result.skipped) {
        console.error('Erro ao enviar e-mail para paciente:', result.error);
      }
    }

    if (item.dentista_email) {
      const payload = buildDentistNewAppointmentEmail(item);
      const result = await sendEmail({ to: item.dentista_email, ...payload, fromName: clinicaNome });
      if (!result.ok && !result.skipped) {
        console.error('Erro ao enviar e-mail para dentista:', result.error);
      }
    }
  } catch (error) {
    console.error('Erro geral de envio automatico de e-mail:', error);
  }
}

async function list(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const busca = (req.query.busca || '').trim();
  try {
    let agendamentoQuery = `SELECT a.id,
              DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
              DATE_FORMAT(a.data, '%d/%m/%Y') AS data_formatada,
              TIME_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
              TIME_FORMAT(a.hora_fim, '%H:%i') AS hora_fim,
              DATE_FORMAT(a.lembrete_enviado_em, '%d/%m %H:%i') AS lembrete_enviado_fmt,
              a.status, a.observacoes, a.dentista_id, a.servico_id, a.procedimento, a.valor_estimado,
              p.nome AS paciente_nome, p.id AS paciente_id, COALESCE(p.telefone,'') AS telefone,
              d.nome AS dentista_nome, s.nome AS servico_nome
       FROM agendamentos a
       INNER JOIN pacientes p ON p.id = a.paciente_id
       LEFT JOIN dentistas d ON d.id = a.dentista_id
       LEFT JOIN servicos s ON s.id = a.servico_id
       WHERE a.clinica_id = ?`;
    const agendamentoParams = [clinicaId];

    if (busca) {
      agendamentoQuery += ' AND (p.nome LIKE ? OR COALESCE(p.telefone, \"\") LIKE ? OR COALESCE(d.nome, \"\") LIKE ?)';
      const pattern = `%${busca}%`;
      agendamentoParams.push(pattern, pattern, pattern);
    }

    agendamentoQuery += ' ORDER BY a.data DESC, a.hora_inicio ASC';

    const [agendamentos] = await pool.execute(agendamentoQuery, agendamentoParams);
    const [pacientes] = await pool.execute('SELECT id, nome, COALESCE(telefone, \"\") AS telefone FROM pacientes WHERE clinica_id = ? ORDER BY nome ASC', [clinicaId]);
    const [dentistas] = await pool.execute('SELECT id, nome, COALESCE(email, \"\") AS email FROM dentistas WHERE clinica_id = ? AND ativo = 1 ORDER BY nome ASC', [clinicaId]);
    const [servicos] = await pool.execute('SELECT id, nome, valor_padrao FROM servicos WHERE clinica_id = ? AND ativo = 1 ORDER BY nome ASC', [clinicaId]);
    return res.render('agendamentos/index', { agendamentos, pacientes, dentistas, servicos, editAgendamento: null, busca });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', { title: 'Erro ao listar agendamentos', message: 'Nao foi possivel carregar os agendamentos.' });
  }
}

async function lembretes(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const dataSelecionada = parseDateISO(req.query.data);

  try {
    const [agendamentos] = await pool.execute(
      `SELECT a.id,
              DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
              DATE_FORMAT(a.data, '%d/%m/%Y') AS data_formatada,
              TIME_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
              TIME_FORMAT(a.hora_fim, '%H:%i') AS hora_fim,
              a.status,
              a.observacoes,
              a.lembrete_enviado_em,
              DATE_FORMAT(a.lembrete_enviado_em, '%d/%m/%Y %H:%i') AS lembrete_enviado_fmt,
              p.nome AS paciente_nome,
              COALESCE(p.telefone, '') AS telefone,
              COALESCE(d.nome, 'Sem dentista') AS dentista_nome,
              COALESCE(s.nome, a.procedimento, 'Sem procedimento') AS servico_nome
       FROM agendamentos a
       INNER JOIN pacientes p ON p.id = a.paciente_id
       LEFT JOIN dentistas d ON d.id = a.dentista_id
       LEFT JOIN servicos s ON s.id = a.servico_id
       WHERE a.clinica_id = ?
         AND a.data = ?
         AND a.status IN ('agendado', 'confirmado')
       ORDER BY a.hora_inicio ASC`,
      [clinicaId, dataSelecionada]
    );

    const [dentistas] = await pool.execute(
      `SELECT id, nome, email
       FROM dentistas
       WHERE clinica_id = ? AND ativo = 1
       ORDER BY nome ASC`,
      [clinicaId]
    );

    const pendentes = agendamentos.filter((item) => !item.lembrete_enviado_em).length;
    const enviados = agendamentos.length - pendentes;

    return res.render('agendamentos/lembretes', {
      dataSelecionada,
      agendamentos,
      dentistas,
      mailConfigured: isEmailConfigured(),
      emailFeedback: {
        status: req.query.email_status || '',
        message: req.query.email_msg || '',
      },
      resumo: {
        total: agendamentos.length,
        pendentes,
        enviados,
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro nos lembretes',
      message: 'Nao foi possivel carregar os lembretes de WhatsApp.'
    });
  }
}

async function enviarAgendaPorEmail(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const clinicaNome = resolveClinicName(req.session.user.clinica_nome);
  const dataSelecionada = parseDateISO(req.body.data || req.query.data);
  const periodo = req.body.periodo === 'semana' ? 'semana' : 'dia';
  const dentistaId = req.body.dentista_id || '';
  const emailOverride = normalizeEmail(req.body.email_override);

  if (!isEmailConfigured()) {
    return res.redirect(`/agendamentos/lembretes?data=${dataSelecionada}&email_status=erro&email_msg=${encodeURIComponent('SMTP nao configurado. Defina as variaveis de e-mail no ambiente.')}`);
  }

  try {
    let rangeStart = dataSelecionada;
    let rangeEnd = dataSelecionada;
    let periodoLabel = `dia ${dataSelecionada}`;

    if (periodo === 'semana') {
      const week = getWeekRange(dataSelecionada);
      rangeStart = week.startIso;
      rangeEnd = week.endIso;
      periodoLabel = `semana ${week.startIso} ate ${week.endIso}`;
    }

    let query = `
      SELECT d.id AS dentista_id,
             d.nome AS dentista_nome,
             COALESCE(d.email, '') AS dentista_email,
             DATE_FORMAT(a.data, '%d/%m/%Y') AS data_formatada,
             TIME_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
             TIME_FORMAT(a.hora_fim, '%H:%i') AS hora_fim,
             a.status,
             p.nome AS paciente_nome,
             COALESCE(s.nome, a.procedimento, 'Sem procedimento') AS servico_nome
      FROM agendamentos a
      INNER JOIN dentistas d ON d.id = a.dentista_id
      INNER JOIN pacientes p ON p.id = a.paciente_id
      LEFT JOIN servicos s ON s.id = a.servico_id
      WHERE a.clinica_id = ?
        AND a.data BETWEEN ? AND ?
        AND a.status IN ('agendado', 'confirmado', 'concluido')
        AND d.ativo = 1`;

    const params = [clinicaId, rangeStart, rangeEnd];

    if (dentistaId) {
      query += ' AND d.id = ?';
      params.push(dentistaId);
    }

    query += ' ORDER BY d.nome ASC, a.data ASC, a.hora_inicio ASC';

    const [rows] = await pool.execute(query, params);

    if (!rows.length) {
      return res.redirect(`/agendamentos/lembretes?data=${dataSelecionada}&email_status=info&email_msg=${encodeURIComponent('Nenhuma agenda encontrada para envio por e-mail no periodo selecionado.')}`);
    }

    const map = new Map();
    const semEmailDentistas = new Set();
    for (const row of rows) {
      const targetEmail = emailOverride && dentistaId && String(row.dentista_id) === String(dentistaId)
        ? emailOverride
        : normalizeEmail(row.dentista_email);

      if (!targetEmail) {
        semEmailDentistas.add(String(row.dentista_id));
        continue;
      }

      if (!map.has(row.dentista_id)) {
        map.set(row.dentista_id, {
          nome: row.dentista_nome,
          email: targetEmail,
          itens: [],
        });
      }
      map.get(row.dentista_id).itens.push(row);
    }

    if (!map.size) {
      return res.redirect(`/agendamentos/lembretes?data=${dataSelecionada}&email_status=info&email_msg=${encodeURIComponent('Nenhum e-mail valido encontrado para envio da agenda.')}`);
    }

    let enviados = 0;
    let falhas = 0;
    const semEmail = semEmailDentistas.size;

    for (const [, dentistData] of map) {
      const payload = buildDentistAgendaEmail(dentistData.nome, periodoLabel, dentistData.itens, clinicaNome);
      const result = await sendEmail({
        to: dentistData.email,
        ...payload,
        fromName: clinicaNome,
      });

      if (result.ok) {
        enviados += 1;
      } else if (!result.skipped) {
        falhas += 1;
        console.error(`Falha ao enviar agenda para ${dentistData.email}:`, result.error);
      }
    }

    const message = `E-mails enviados: ${enviados}. Falhas: ${falhas}. Sem e-mail: ${semEmail}.`;
    const status = falhas > 0 || semEmail > 0 ? 'info' : 'ok';

    return res.redirect(`/agendamentos/lembretes?data=${dataSelecionada}&email_status=${status}&email_msg=${encodeURIComponent(message)}`);
  } catch (error) {
    console.error(error);
    return res.redirect(`/agendamentos/lembretes?data=${dataSelecionada}&email_status=erro&email_msg=${encodeURIComponent('Nao foi possivel enviar os e-mails da agenda.')}`);
  }
}

async function marcarLembreteEnviado(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    await pool.execute(
      'UPDATE agendamentos SET lembrete_enviado_em = NOW() WHERE id = ? AND clinica_id = ?',
      [id, clinicaId]
    );
    return res.redirect(req.get('referer') || '/agendamentos/lembretes');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao marcar lembrete',
      message: 'Nao foi possivel marcar este lembrete como enviado.'
    });
  }
}

async function limparLembreteEnviado(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    await pool.execute(
      'UPDATE agendamentos SET lembrete_enviado_em = NULL WHERE id = ? AND clinica_id = ?',
      [id, clinicaId]
    );
    return res.redirect(req.get('referer') || '/agendamentos/lembretes');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao limpar lembrete',
      message: 'Nao foi possivel reabrir este lembrete.'
    });
  }
}

async function moverData(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { agendamento_id, nova_data } = req.body;
  try {
    if (!agendamento_id || !/^\d{4}-\d{2}-\d{2}$/.test(nova_data)) {
      return res.status(400).json({ ok: false, message: 'Dados invalidos.' });
    }
    await pool.execute(
      "UPDATE agendamentos SET data = ? WHERE id = ? AND clinica_id = ? AND status != 'cancelado'",
      [nova_data, agendamento_id, clinicaId]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
}

async function create(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { paciente_id, dentista_id, servico_id, procedimento, valor_estimado, data, hora_inicio, hora_fim, status, observacoes } = req.body;
  try {
    const [pacienteRows] = await pool.execute('SELECT id FROM pacientes WHERE id = ? AND clinica_id = ? LIMIT 1', [paciente_id, clinicaId]);
    if (!pacienteRows.length) {
      return res.status(403).render('partials/error', { title: 'Paciente invalido', message: 'O paciente nao pertence a esta clinica.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO agendamentos (clinica_id, paciente_id, dentista_id, servico_id, procedimento, valor_estimado, data, hora_inicio, hora_fim, status, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clinicaId, paciente_id, dentista_id || null, servico_id || null, procedimento || null, parseFloat(valor_estimado) || 0, data, hora_inicio, hora_fim, status || 'agendado', observacoes || null]
    );

    await enviarEmailsNovoAgendamento(clinicaId, result.insertId);

    return res.redirect('/agendamentos');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', { title: 'Erro ao criar agendamento', message: 'Nao foi possivel criar o agendamento.' });
  }
}

async function editForm(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    const [agendamentos] = await pool.execute(
      `SELECT a.id,
              DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
              DATE_FORMAT(a.data, '%d/%m/%Y') AS data_formatada,
              TIME_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
              TIME_FORMAT(a.hora_fim, '%H:%i') AS hora_fim,
              DATE_FORMAT(a.lembrete_enviado_em, '%d/%m %H:%i') AS lembrete_enviado_fmt,
              a.status, a.observacoes, a.dentista_id, a.servico_id, a.procedimento, a.valor_estimado,
              p.nome AS paciente_nome, p.id AS paciente_id, COALESCE(p.telefone,'') AS telefone,
              d.nome AS dentista_nome, s.nome AS servico_nome
       FROM agendamentos a
       INNER JOIN pacientes p ON p.id = a.paciente_id
       LEFT JOIN dentistas d ON d.id = a.dentista_id
       LEFT JOIN servicos s ON s.id = a.servico_id
       WHERE a.clinica_id = ?
       ORDER BY a.data DESC, a.hora_inicio ASC`,
      [clinicaId]
    );
    const [pacientes] = await pool.execute('SELECT id, nome, COALESCE(telefone, \"\") AS telefone FROM pacientes WHERE clinica_id = ? ORDER BY nome ASC', [clinicaId]);
    const [dentistas] = await pool.execute('SELECT id, nome, COALESCE(email, \"\") AS email FROM dentistas WHERE clinica_id = ? AND ativo = 1 ORDER BY nome ASC', [clinicaId]);
    const [servicos] = await pool.execute('SELECT id, nome, valor_padrao FROM servicos WHERE clinica_id = ? AND ativo = 1 ORDER BY nome ASC', [clinicaId]);
    const [rows] = await pool.execute(
      `SELECT id, paciente_id, dentista_id, servico_id, procedimento, valor_estimado,
              DATE_FORMAT(data, '%Y-%m-%d') AS data,
              TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
              TIME_FORMAT(hora_fim, '%H:%i') AS hora_fim,
              status, observacoes
       FROM agendamentos WHERE id = ? AND clinica_id = ? LIMIT 1`,
      [id, clinicaId]
    );
    if (!rows.length) return res.redirect('/agendamentos');
    return res.render('agendamentos/index', { agendamentos, pacientes, dentistas, servicos, editAgendamento: rows[0], busca: '' });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', { title: 'Erro ao editar agendamento', message: 'Nao foi possivel carregar o agendamento.' });
  }
}

async function update(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  const { paciente_id, dentista_id, servico_id, procedimento, valor_estimado, data, hora_inicio, hora_fim, status, observacoes } = req.body;
  try {
    const [pacienteRows] = await pool.execute('SELECT id FROM pacientes WHERE id = ? AND clinica_id = ? LIMIT 1', [paciente_id, clinicaId]);
    if (!pacienteRows.length) {
      return res.status(403).render('partials/error', { title: 'Paciente invalido', message: 'O paciente nao pertence a esta clinica.' });
    }
    await pool.execute(
      `UPDATE agendamentos
       SET paciente_id = ?, dentista_id = ?, servico_id = ?, procedimento = ?, valor_estimado = ?,
           data = ?, hora_inicio = ?, hora_fim = ?, status = ?, observacoes = ?
       WHERE id = ? AND clinica_id = ?`,
      [paciente_id, dentista_id || null, servico_id || null, procedimento || null, parseFloat(valor_estimado) || 0, data, hora_inicio, hora_fim, status, observacoes || null, id, clinicaId]
    );
    return res.redirect('/agendamentos');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', { title: 'Erro ao atualizar agendamento', message: 'Nao foi possivel atualizar o agendamento.' });
  }
}

async function remove(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM agendamentos WHERE id = ? AND clinica_id = ?', [id, clinicaId]);
    return res.redirect('/agendamentos');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', { title: 'Erro ao excluir agendamento', message: 'Nao foi possivel excluir o agendamento.' });
  }
}

module.exports = {
  list,
  lembretes,
  enviarAgendaPorEmail,
  marcarLembreteEnviado,
  limparLembreteEnviado,
  create,
  editForm,
  update,
  remove,
  moverData,
};
