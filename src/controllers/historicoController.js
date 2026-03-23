const pool = require('../config/db');

async function list(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const pacienteId = req.query.paciente_id || null;
  try {
    const [pacientes] = await pool.execute(
      'SELECT id, nome FROM pacientes WHERE clinica_id = ? ORDER BY nome ASC',
      [clinicaId]
    );
    let query = `SELECT h.*, p.nome AS paciente_nome
      FROM historico h
      INNER JOIN pacientes p ON p.id = h.paciente_id
      WHERE h.clinica_id = ?`;
    const params = [clinicaId];
    if (pacienteId) {
      query += ' AND h.paciente_id = ?';
      params.push(pacienteId);
    }
    query += ' ORDER BY h.data_evento DESC, h.id DESC LIMIT 100';
    const [itens] = await pool.execute(query, params);
    return res.render('historico/index', { itens, pacientes, pacienteId, editHistorico: null });
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível carregar o histórico.' });
  }
}

async function create(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { paciente_id, data_evento, tipo_evento, descricao, profissional, status_historico } = req.body;
  try {
    await pool.execute(
      'INSERT INTO historico (clinica_id, paciente_id, data_evento, tipo_evento, descricao, profissional, status_historico) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [clinicaId, paciente_id, data_evento, tipo_evento || null, descricao || null, profissional || null, status_historico || null]
    );
    return res.redirect('/historico');
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível salvar o histórico.' });
  }
}

async function remove(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM historico WHERE id = ? AND clinica_id = ?', [id, clinicaId]);
    return res.redirect('/historico');
  } catch (err) {
    console.error(err);
    return res.redirect('/historico');
  }
}

module.exports = { list, create, remove };
