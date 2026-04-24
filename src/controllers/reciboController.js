const pool = require('../config/db');

async function list(req, res) {
  const clinicaId = req.session.user.clinica_id;
  try {
    const [pacientes] = await pool.execute(
      'SELECT id, nome, telefone, email, cpf, endereco FROM pacientes WHERE clinica_id = ? ORDER BY nome ASC',
      [clinicaId]
    );
    const [recibos] = await pool.execute(
      `SELECT r.*, p.nome AS paciente_nome
       FROM recibos r
       INNER JOIN pacientes p ON p.id = r.paciente_id
       WHERE r.clinica_id = ?
       ORDER BY r.id DESC LIMIT 30`,
      [clinicaId]
    );
    return res.render('recibos/index', { pacientes, recibos, previewRecibo: null, prefill: {} });
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível carregar os recibos.' });
  }
}

async function create(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { paciente_id, data_recibo, valor, descricao, observacoes, documento_pagador } = req.body;
  try {
    const [pacienteRows] = await pool.execute(
      'SELECT * FROM pacientes WHERE id = ? AND clinica_id = ? LIMIT 1',
      [paciente_id, clinicaId]
    );
    if (!pacienteRows.length) return res.redirect('/recibos');
    const paciente = pacienteRows[0];
    const [result] = await pool.execute(
      'INSERT INTO recibos (clinica_id, paciente_id, data_recibo, valor, descricao, observacoes, documento_pagador, criado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [clinicaId, paciente_id, data_recibo, parseFloat(valor) || 0, descricao || null, observacoes || null, documento_pagador || null, req.session.user.id]
    );
    const reciboId = result.insertId;
    const [pacientes] = await pool.execute(
      'SELECT id, nome, telefone, email, cpf, endereco FROM pacientes WHERE clinica_id = ? ORDER BY nome ASC',
      [clinicaId]
    );
    const [recibos] = await pool.execute(
      `SELECT r.*, p.nome AS paciente_nome FROM recibos r INNER JOIN pacientes p ON p.id = r.paciente_id WHERE r.clinica_id = ? ORDER BY r.id DESC LIMIT 30`,
      [clinicaId]
    );
    const previewRecibo = {
      id: reciboId,
      paciente,
      data_recibo,
      valor: parseFloat(valor) || 0,
      descricao: descricao || '',
      observacoes: observacoes || '',
      documento_pagador: documento_pagador || paciente.cpf || '',
    };
    return res.render('recibos/index', { pacientes, recibos, previewRecibo, prefill: {} });
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível gerar o recibo.' });
  }
}

async function imprimir(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, p.nome AS paciente_nome, p.telefone, p.email, p.endereco, p.cpf, c.nome AS clinica_nome
       FROM recibos r
       INNER JOIN pacientes p ON p.id = r.paciente_id
       INNER JOIN clinicas c ON c.id = r.clinica_id
       WHERE r.id = ? AND r.clinica_id = ? LIMIT 1`,
      [id, clinicaId]
    );
    if (!rows.length) return res.redirect('/recibos');
    const recibo = rows[0];
    // Format date
    if (recibo.data_recibo) {
      const d = new Date(recibo.data_recibo);
      recibo.data_fmt = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    }
    return res.render('recibos/imprimir', { recibo, user: req.session.user });
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível abrir o recibo.' });
  }
}

async function remove(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM recibos WHERE id = ? AND clinica_id = ?', [id, clinicaId]);
    return res.redirect('/recibos');
  } catch (err) {
    console.error(err);
    return res.redirect('/recibos');
  }
}

module.exports = { list, create, imprimir, remove };
