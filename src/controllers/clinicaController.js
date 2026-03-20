const pool = require('../config/db');

async function list(req, res) {
  try {
    const [clinicas] = await pool.execute(
      `SELECT id, nome, slug, email, telefone, status,
              DATE_FORMAT(created_at, '%d/%m/%Y') AS created_at_formatado
       FROM clinicas
       ORDER BY id DESC`
    );

    return res.render('clinicas/index', { clinicas, editClinica: null });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao listar clínicas',
      message: 'Não foi possível carregar as clínicas.'
    });
  }
}

async function create(req, res) {
  const { nome, slug, email, telefone, status } = req.body;

  try {
    await pool.execute(
      `INSERT INTO clinicas (nome, slug, email, telefone, status)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, slug, email || null, telefone || null, status || 'ativo']
    );

    return res.redirect('/clinicas');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao cadastrar clínica',
      message: 'Não foi possível salvar a clínica. Verifique se o slug é único.'
    });
  }
}

async function editForm(req, res) {
  const { id } = req.params;

  try {
    const [clinicas] = await pool.execute(
      `SELECT id, nome, slug, email, telefone, status,
              DATE_FORMAT(created_at, '%d/%m/%Y') AS created_at_formatado
       FROM clinicas
       ORDER BY id DESC`
    );

    const [rows] = await pool.execute(
      `SELECT id, nome, slug, email, telefone, status
       FROM clinicas WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.redirect('/clinicas');
    }

    return res.render('clinicas/index', { clinicas, editClinica: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao editar clínica',
      message: 'Não foi possível carregar a clínica.'
    });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { nome, slug, email, telefone, status } = req.body;

  try {
    await pool.execute(
      `UPDATE clinicas
       SET nome = ?, slug = ?, email = ?, telefone = ?, status = ?
       WHERE id = ?`,
      [nome, slug, email || null, telefone || null, status || 'ativo', id]
    );

    return res.redirect('/clinicas');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao atualizar clínica',
      message: 'Não foi possível atualizar a clínica.'
    });
  }
}

module.exports = { list, create, editForm, update };
