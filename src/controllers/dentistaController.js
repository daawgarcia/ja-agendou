const pool = require('../config/db');

async function list(req, res) {
  const clinicaId = req.session.user.clinica_id;
  try {
    const [dentistas] = await pool.execute(
      'SELECT * FROM dentistas WHERE clinica_id = ? ORDER BY nome ASC',
      [clinicaId]
    );
    const [fechamentos] = await pool.execute(
      `SELECT f.id, DATE_FORMAT(f.data_fechamento, '%d/%m/%Y') AS data_fechamento, d.nome AS dentista_nome
       FROM fechamentos_agenda f
       INNER JOIN dentistas d ON d.id = f.dentista_id
       WHERE f.clinica_id = ?
       ORDER BY f.data_fechamento DESC, d.nome ASC`,
      [clinicaId]
    );
    return res.render('dentistas/index', { dentistas, fechamentos, editDentista: null, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível carregar os dentistas.' });
  }
}

async function create(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { nome, email, ativo } = req.body;
  try {
    await pool.execute(
      'INSERT INTO dentistas (clinica_id, nome, email, ativo) VALUES (?, ?, ?, ?)',
      [clinicaId, nome, email || null, ativo === '0' ? 0 : 1]
    );
    return res.redirect('/dentistas');
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível salvar o dentista.' });
  }
}

async function editForm(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    const [dentistas] = await pool.execute('SELECT * FROM dentistas WHERE clinica_id = ? ORDER BY nome ASC', [clinicaId]);
    const [fechamentos] = await pool.execute(
      `SELECT f.id, DATE_FORMAT(f.data_fechamento, '%d/%m/%Y') AS data_fechamento, d.nome AS dentista_nome
       FROM fechamentos_agenda f
       INNER JOIN dentistas d ON d.id = f.dentista_id
       WHERE f.clinica_id = ?
       ORDER BY f.data_fechamento DESC, d.nome ASC`,
      [clinicaId]
    );
    const [rows] = await pool.execute('SELECT * FROM dentistas WHERE id = ? AND clinica_id = ? LIMIT 1', [id, clinicaId]);
    if (!rows.length) return res.redirect('/dentistas');
    return res.render('dentistas/index', { dentistas, fechamentos, editDentista: rows[0], error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível carregar o dentista.' });
  }
}

async function update(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  const { nome, email, ativo } = req.body;
  try {
    await pool.execute(
      'UPDATE dentistas SET nome = ?, email = ?, ativo = ? WHERE id = ? AND clinica_id = ?',
      [nome, email || null, ativo === '0' ? 0 : 1, id, clinicaId]
    );
    return res.redirect('/dentistas');
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível atualizar o dentista.' });
  }
}

async function remove(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM dentistas WHERE id = ? AND clinica_id = ?', [id, clinicaId]);
    return res.redirect('/dentistas');
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível excluir o dentista.' });
  }
}

async function fechamentos(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { dentista_id, data_fechamento } = req.body;
  try {
    await pool.execute(
      'INSERT IGNORE INTO fechamentos_agenda (clinica_id, dentista_id, data_fechamento) VALUES (?, ?, ?)',
      [clinicaId, dentista_id, data_fechamento]
    );
    return res.redirect('/dentistas');
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível fechar a agenda.' });
  }
}

async function removerFechamento(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM fechamentos_agenda WHERE id = ? AND clinica_id = ?', [id, clinicaId]);
    return res.redirect('/dentistas');
  } catch (err) {
    console.error(err);
    return res.redirect('/dentistas');
  }
}

module.exports = { list, create, editForm, update, remove, fechamentos, removerFechamento };
