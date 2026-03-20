const pool = require('../config/db');

async function list(req, res) {
  const clinicaId = req.session.user.clinica_id;

  try {
    const [pacientes] = await pool.execute(
      `SELECT id, nome, telefone, email,
              DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
              observacoes
       FROM pacientes
       WHERE clinica_id = ?
       ORDER BY nome ASC`,
      [clinicaId]
    );

    return res.render('pacientes/index', {
      pacientes,
      editPaciente: null,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao listar pacientes',
      message: 'Não foi possível carregar os pacientes.'
    });
  }
}

async function create(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { nome, telefone, email, data_nascimento, observacoes } = req.body;

  try {
    await pool.execute(
      `INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, observacoes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clinicaId, nome, telefone || null, email || null, data_nascimento || null, observacoes || null]
    );

    return res.redirect('/pacientes');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao cadastrar paciente',
      message: 'Não foi possível salvar o paciente.'
    });
  }
}

async function editForm(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;

  try {
    const [pacientes] = await pool.execute(
      `SELECT id, nome, telefone, email,
              DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
              observacoes
       FROM pacientes
       WHERE clinica_id = ?
       ORDER BY nome ASC`,
      [clinicaId]
    );

    const [rows] = await pool.execute(
      `SELECT id, nome, telefone, email,
              DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
              observacoes
       FROM pacientes
       WHERE id = ? AND clinica_id = ? LIMIT 1`,
      [id, clinicaId]
    );

    if (!rows.length) {
      return res.redirect('/pacientes');
    }

    return res.render('pacientes/index', {
      pacientes,
      editPaciente: rows[0],
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao editar paciente',
      message: 'Não foi possível carregar o paciente.'
    });
  }
}

async function update(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  const { nome, telefone, email, data_nascimento, observacoes } = req.body;

  try {
    await pool.execute(
      `UPDATE pacientes
       SET nome = ?, telefone = ?, email = ?, data_nascimento = ?, observacoes = ?
       WHERE id = ? AND clinica_id = ?`,
      [nome, telefone || null, email || null, data_nascimento || null, observacoes || null, id, clinicaId]
    );

    return res.redirect('/pacientes');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao atualizar paciente',
      message: 'Não foi possível atualizar o paciente.'
    });
  }
}

async function remove(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;

  try {
    await pool.execute('DELETE FROM pacientes WHERE id = ? AND clinica_id = ?', [id, clinicaId]);
    return res.redirect('/pacientes');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao excluir paciente',
      message: 'Não foi possível excluir o paciente.'
    });
  }
}

module.exports = { list, create, editForm, update, remove };
