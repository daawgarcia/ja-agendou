const pool = require('../config/db');

async function index(req, res) {
  const clinicaId = req.session.user.clinica_id;

  try {
    const [[pacientesCount]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM pacientes WHERE clinica_id = ?',
      [clinicaId]
    );

    const [[agendamentosHojeCount]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM agendamentos WHERE clinica_id = ? AND data = CURDATE()',
      [clinicaId]
    );

    const [[confirmadosHojeCount]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM agendamentos WHERE clinica_id = ? AND data = CURDATE() AND status = "confirmado"',
      [clinicaId]
    );

    const [proximosAgendamentos] = await pool.execute(
      `SELECT a.id, DATE_FORMAT(a.data, '%d/%m/%Y') AS data_formatada,
              TIME_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio_formatada,
              TIME_FORMAT(a.hora_fim, '%H:%i') AS hora_fim_formatada,
              a.status, p.nome AS paciente_nome
       FROM agendamentos a
       INNER JOIN pacientes p ON p.id = a.paciente_id
       WHERE a.clinica_id = ?
         AND (a.data > CURDATE() OR (a.data = CURDATE() AND a.hora_inicio >= CURTIME()))
       ORDER BY a.data ASC, a.hora_inicio ASC
       LIMIT 8`,
      [clinicaId]
    );

      const [aniversariantes] = await pool.execute(
        `SELECT id, nome, DATE_FORMAT(data_nascimento, '%d/%m') AS data_nasc_fmt
         FROM pacientes
         WHERE clinica_id = ? AND MONTH(data_nascimento) = MONTH(CURDATE())
         ORDER BY DAY(data_nascimento) ASC LIMIT 5`,
        [clinicaId]
      );

      const [[receitaMes]] = await pool.execute(
        `SELECT COALESCE(SUM(valor), 0) AS total
         FROM recibos
         WHERE clinica_id = ? AND MONTH(data_recibo) = MONTH(CURDATE()) AND YEAR(data_recibo) = YEAR(CURDATE())`,
        [clinicaId]
      );

      return res.render('dashboard/index', {
        stats: {
          pacientes: pacientesCount.total,
          agendamentosHoje: agendamentosHojeCount.total,
          confirmadosHoje: confirmadosHojeCount.total,
          receitaMes: receitaMes.total,
        },
        proximosAgendamentos,
        aniversariantes,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro no dashboard',
      message: 'Não foi possível carregar o dashboard.'
    });
  }
}

module.exports = { index };
