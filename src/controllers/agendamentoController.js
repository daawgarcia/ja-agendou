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
    const [pacientes] = await pool.execute('SELECT id, nome FROM pacientes WHERE clinica_id = ? ORDER BY nome ASC', [clinicaId]);
    const [dentistas] = await pool.execute('SELECT id, nome FROM dentistas WHERE clinica_id = ? AND ativo = 1 ORDER BY nome ASC', [clinicaId]);
    const [servicos]  = await pool.execute('SELECT id, nome, valor_padrao FROM servicos WHERE clinica_id = ? AND ativo = 1 ORDER BY nome ASC', [clinicaId]);
    return res.render('agendamentos/index', { agendamentos, pacientes, dentistas, servicos, editAgendamento: null });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', { title: 'Erro ao listar agendamentos', message: 'Nao foi possivel carregar os agendamentos.' });
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
    await pool.execute(
      `INSERT INTO agendamentos (clinica_id, paciente_id, dentista_id, servico_id, procedimento, valor_estimado, data, hora_inicio, hora_fim, status, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clinicaId, paciente_id, dentista_id || null, servico_id || null, procedimento || null, parseFloat(valor_estimado) || 0, data, hora_inicio, hora_fim, status || 'agendado', observacoes || null]
    );
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
              a.status, a.observacoes, a.dentista_id, a.servico_id, a.procedimento, a.valor_estimado,
              p.nome AS paciente_nome, p.id AS paciente_id,
              d.nome AS dentista_nome, s.nome AS servico_nome
       FROM agendamentos a
       INNER JOIN pacientes p ON p.id = a.paciente_id
       LEFT JOIN dentistas d ON d.id = a.dentista_id
       LEFT JOIN servicos s ON s.id = a.servico_id
       WHERE a.clinica_id = ?
       ORDER BY a.data DESC, a.hora_inicio ASC`,
      [clinicaId]
    );
    const [pacientes] = await pool.execute('SELECT id, nome FROM pacientes WHERE clinica_id = ? ORDER BY nome ASC', [clinicaId]);
    const [dentistas] = await pool.execute('SELECT id, nome FROM dentistas WHERE clinica_id = ? AND ativo = 1 ORDER BY nome ASC', [clinicaId]);
    const [servicos]  = await pool.execute('SELECT id, nome, valor_padrao FROM servicos WHERE clinica_id = ? AND ativo = 1 ORDER BY nome ASC', [clinicaId]);
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
    return res.render('agendamentos/index', { agendamentos, pacientes, dentistas, servicos, editAgendamento: rows[0] });
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

module.exports = { list, create, editForm, update, remove, moverData };
