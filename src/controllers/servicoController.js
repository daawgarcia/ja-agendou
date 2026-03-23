const pool = require('../config/db');

async function list(req, res) {
  const clinicaId = req.session.user.clinica_id;
  try {
    const [servicos] = await pool.execute(
      'SELECT * FROM servicos WHERE clinica_id = ? ORDER BY nome ASC',
      [clinicaId]
    );
    return res.render('servicos/index', { servicos, editServico: null, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível carregar os serviços.' });
  }
}

async function create(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { nome, valor_padrao, ativo } = req.body;
  try {
    await pool.execute(
      'INSERT INTO servicos (clinica_id, nome, valor_padrao, ativo) VALUES (?, ?, ?, ?)',
      [clinicaId, nome, parseFloat(valor_padrao) || 0, ativo === '0' ? 0 : 1]
    );
    return res.redirect('/servicos');
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível salvar o serviço.' });
  }
}

async function editForm(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    const [servicos] = await pool.execute('SELECT * FROM servicos WHERE clinica_id = ? ORDER BY nome ASC', [clinicaId]);
    const [rows] = await pool.execute('SELECT * FROM servicos WHERE id = ? AND clinica_id = ? LIMIT 1', [id, clinicaId]);
    if (!rows.length) return res.redirect('/servicos');
    return res.render('servicos/index', { servicos, editServico: rows[0], error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível carregar o serviço.' });
  }
}

async function update(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  const { nome, valor_padrao, ativo } = req.body;
  try {
    await pool.execute(
      'UPDATE servicos SET nome = ?, valor_padrao = ?, ativo = ? WHERE id = ? AND clinica_id = ?',
      [nome, parseFloat(valor_padrao) || 0, ativo === '0' ? 0 : 1, id, clinicaId]
    );
    return res.redirect('/servicos');
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível atualizar o serviço.' });
  }
}

async function remove(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM servicos WHERE id = ? AND clinica_id = ?', [id, clinicaId]);
    return res.redirect('/servicos');
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível excluir o serviço.' });
  }
}

module.exports = { list, create, editForm, update, remove };
