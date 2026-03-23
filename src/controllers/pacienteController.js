const pool = require('../config/db');

async function list(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const busca = req.query.busca || '';
  try {
    let query = `SELECT id, codigo_cliente, nome, telefone, email, cpf, rg, sexo, convenio, endereco, responsavel,
              DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
              DATE_FORMAT(data_nascimento, '%d/%m/%Y') AS data_nascimento_fmt,
              observacoes
       FROM pacientes WHERE clinica_id = ?`;
    const params = [clinicaId];
    if (busca) { query += ' AND nome LIKE ?'; params.push(`%${busca}%`); }
    query += ' ORDER BY nome ASC';
    const [pacientes] = await pool.execute(query, params);
    const [[{ mes_atual }]] = await pool.execute('SELECT MONTH(CURDATE()) AS mes_atual');
    const [aniversariantes] = await pool.execute(
      `SELECT nome, telefone, DATE_FORMAT(data_nascimento, '%d/%m') AS dia_mes
       FROM pacientes WHERE clinica_id = ? AND MONTH(data_nascimento) = ?
       ORDER BY DAY(data_nascimento) ASC`,
      [clinicaId, mes_atual]
    );
    return res.render('pacientes/index', { pacientes, editPaciente: null, error: null, busca, aniversariantes });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', { title: 'Erro ao listar pacientes', message: 'Não foi possível carregar os pacientes.' });
  }
}

async function create(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { nome, telefone, email, data_nascimento, cpf, rg, sexo, convenio, endereco, responsavel, observacoes } = req.body;
  try {
    await pool.execute(
      `INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, cpf, rg, sexo, convenio, endereco, responsavel, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clinicaId, nome, telefone || null, email || null, data_nascimento || null, cpf || null, rg || null, sexo || null, convenio || null, endereco || null, responsavel || null, observacoes || null]
    );
    return res.redirect('/pacientes');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', { title: 'Erro ao cadastrar paciente', message: 'Não foi possível salvar o paciente.' });
  }
}

async function editForm(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    const [pacientes] = await pool.execute(
      `SELECT id, codigo_cliente, nome, telefone, email, cpf, rg, sexo, convenio, endereco, responsavel,
              DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento, observacoes
       FROM pacientes WHERE clinica_id = ? ORDER BY nome ASC`,
      [clinicaId]
    );
    const [rows] = await pool.execute(
      `SELECT id, codigo_cliente, nome, telefone, email, cpf, rg, sexo, convenio, endereco, responsavel,
              DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento, observacoes
       FROM pacientes WHERE id = ? AND clinica_id = ? LIMIT 1`,
      [id, clinicaId]
    );
    if (!rows.length) return res.redirect('/pacientes');
    return res.render('pacientes/index', { pacientes, editPaciente: rows[0], error: null, busca: '', aniversariantes: [] });
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', { title: 'Erro ao editar paciente', message: 'Não foi possível carregar o paciente.' });
  }
}

async function update(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  const { nome, telefone, email, data_nascimento, cpf, rg, sexo, convenio, endereco, responsavel, observacoes } = req.body;
  try {
    await pool.execute(
      `UPDATE pacientes SET nome = ?, telefone = ?, email = ?, data_nascimento = ?, cpf = ?, rg = ?, sexo = ?, convenio = ?, endereco = ?, responsavel = ?, observacoes = ?
       WHERE id = ? AND clinica_id = ?`,
      [nome, telefone || null, email || null, data_nascimento || null, cpf || null, rg || null, sexo || null, convenio || null, endereco || null, responsavel || null, observacoes || null, id, clinicaId]
    );
    return res.redirect('/pacientes');
  } catch (error) {
    console.error(error);
    return res.status(500).render('partials/error', { title: 'Erro ao atualizar paciente', message: 'Não foi possível atualizar o paciente.' });
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
    return res.status(500).render('partials/error', { title: 'Erro ao excluir paciente', message: 'Não foi possível excluir o paciente.' });
  }
}

module.exports = { list, create, editForm, update, remove };
