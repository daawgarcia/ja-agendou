const pool = require('../config/db');

async function list(req, res) {
  const clinicaId = req.session.user.clinica_id;

  try {
    const [agendamentos] = await pool.execute(
      `SELECT a.id,
              DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
              DATE_FORMAT(a.data, '%d/%m/%Y') AS data_formatada,
              TIME_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
              TIME_FORMAT(a.hora_fim, '%H:%i') AS hora_fim,
              a.status, a.observacoes,
              p.nome AS paciente_nome,
              p.id AS paciente_id
       FROM agendamentos a
       INNER JOIN pacientes p ON p.id = a.paciente_id
       WHERE a.clinica_id = ?
       ORDER BY a.data DESC, a.hora_inicio ASC`,
      [clinicaId]
    );

    const [pacientes] = await pool.execute(
      `SELECT id, nome
       FROM pacientes
       WHERE clinica_id = ?
       ORDER BY nome ASC`,
      [clinicaId]
    );

    return res.render('agendamentos/index', {
      agendamentos,
      pacientes,
      editAgendamento: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao listar agendamentos',
      message: 'Não foi possível carregar os agendamentos.'
    });
  }
}

async function create(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { paciente_id, data, hora_inicio, hora_fim, status, observacoes } = req.body;

  try {
    const [pacienteRows] = await pool.execute(
      'SELECT id FROM pacientes WHERE id = ? AND clinica_id = ? LIMIT 1',
      [paciente_id, clinicaId]
    );

    if (!pacienteRows.length) {
      return res.status(403).render('partials/error', {
        title: 'Paciente inválido',
        message: 'O paciente não pertence a esta clínica.'
      });
    }

    await pool.execute(
      `INSERT INTO agendamentos (clinica_id, paciente_id, data, hora_inicio, hora_fim, status, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clinicaId, paciente_id, data, hora_inicio, hora_fim, status || 'agendado', observacoes || null]
    );

    return res.redirect('/agendamentos');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao criar agendamento',
      message: 'Não foi possível criar o agendamento.'
    });
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
              a.status, a.observacoes,
              p.nome AS paciente_nome,
              p.id AS paciente_id
       FROM agendamentos a
       INNER JOIN pacientes p ON p.id = a.paciente_id
       WHERE a.clinica_id = ?
       ORDER BY a.data DESC, a.hora_inicio ASC`,
      [clinicaId]
    );

    const [pacientes] = await pool.execute(
      `SELECT id, nome FROM pacientes WHERE clinica_id = ? ORDER BY nome ASC`,
      [clinicaId]
    );

    const [rows] = await pool.execute(
      `SELECT id, paciente_id,
              DATE_FORMAT(data, '%Y-%m-%d') AS data,
              TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
              TIME_FORMAT(hora_fim, '%H:%i') AS hora_fim,
              status, observacoes
       FROM agendamentos
       WHERE id = ? AND clinica_id = ? LIMIT 1`,
      [id, clinicaId]
    );

    if (!rows.length) {
      return res.redirect('/agendamentos');
    }

    return res.render('agendamentos/index', {
      agendamentos,
      pacientes,
      editAgendamento: rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao editar agendamento',
      message: 'Não foi possível carregar o agendamento.'
    });
  }
}

async function update(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  const { paciente_id, data, hora_inicio, hora_fim, status, observacoes } = req.body;

  try {
    const [pacienteRows] = await pool.execute(
      'SELECT id FROM pacientes WHERE id = ? AND clinica_id = ? LIMIT 1',
      [paciente_id, clinicaId]
    );

    if (!pacienteRows.length) {
      return res.status(403).render('partials/error', {
        title: 'Paciente inválido',
        message: 'O paciente não pertence a esta clínica.'
      });
    }

    await pool.execute(
      `UPDATE agendamentos
       SET paciente_id = ?, data = ?, hora_inicio = ?, hora_fim = ?, status = ?, observacoes = ?
       WHERE id = ? AND clinica_id = ?`,
      [paciente_id, data, hora_inicio, hora_fim, status, observacoes || null, id, clinicaId]
    );

    return res.redirect('/agendamentos');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao atualizar agendamento',
      message: 'Não foi possível atualizar o agendamento.'
    });
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
    return res.status(500).render('partials/error', {
      title: 'Erro ao excluir agendamento',
      message: 'Não foi possível excluir o agendamento.'
    });
  }
}

module.exports = { list, create, editForm, update, remove };
