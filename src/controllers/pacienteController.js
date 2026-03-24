const pool = require('../config/db');
const XLSX = require('xlsx');

/* ---------- helpers ---------- */
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    const d = val;
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  }
  const s = String(val).trim();
  // dd/mm/yyyy
  const br = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2,'0')}-${br[1].padStart(2,'0')}`;
  // yyyy-mm-dd
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

function normSexo(val) {
  if (!val) return null;
  const v = String(val).trim().toUpperCase()[0];
  return ['F','M','O'].includes(v) ? v : null;
}

function clean(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

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
    return res.render('pacientes/index', { pacientes, editPaciente: null, error: null, busca, aniversariantes, importError: req.query.importError || null, importSuccess: req.query.importSuccess || null });
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
    return res.render('pacientes/index', { pacientes, editPaciente: rows[0], error: null, busca: '', aniversariantes: [], importError: null, importSuccess: null });
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

/* ---------- importar Excel / CSV ---------- */
async function importExcel(req, res) {
  const clinicaId = req.session.user.clinica_id;
  if (!req.file) {
    return res.redirect('/pacientes?importError=Nenhum+arquivo+enviado');
  }

  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!rows.length) {
      return res.redirect('/pacientes?importError=Planilha+vazia');
    }

    // Map column headers (flexible matching)
    const map = {
      nome:            ['nome', 'name', 'paciente', 'nome completo', 'nome *'],
      telefone:        ['telefone', 'tel', 'celular', 'phone', 'fone'],
      email:           ['e-mail', 'email', 'mail'],
      data_nascimento: ['data nascimento', 'data_nascimento', 'nascimento', 'dt nascimento', 'aniversário', 'aniversario'],
      cpf:             ['cpf'],
      rg:              ['rg'],
      sexo:            ['sexo', 'sexo (f/m/o)', 'gênero', 'genero'],
      convenio:        ['convênio', 'convenio', 'plano'],
      endereco:        ['endereço', 'endereco', 'end'],
      responsavel:     ['responsável', 'responsavel'],
      observacoes:     ['observações', 'observacoes', 'obs'],
    };

    const keys = Object.keys(rows[0]);
    const colMap = {};
    for (const [field, aliases] of Object.entries(map)) {
      const found = keys.find(k => aliases.includes(k.toLowerCase().trim()));
      if (found) colMap[field] = found;
    }

    if (!colMap.nome) {
      return res.redirect('/pacientes?importError=Coluna+"Nome"+não+encontrada.+Baixe+o+template.');
    }

    let imported = 0, skipped = 0;
    for (const row of rows) {
      const nome = clean(row[colMap.nome]);
      if (!nome) { skipped++; continue; }

      const telefone   = clean(colMap.telefone ? row[colMap.telefone] : null);
      const email      = clean(colMap.email ? row[colMap.email] : null);
      const dataNasc   = parseDate(colMap.data_nascimento ? row[colMap.data_nascimento] : null);
      const cpf        = clean(colMap.cpf ? row[colMap.cpf] : null);
      const rg         = clean(colMap.rg ? row[colMap.rg] : null);
      const sexo       = normSexo(colMap.sexo ? row[colMap.sexo] : null);
      const convenio   = clean(colMap.convenio ? row[colMap.convenio] : null);
      const endereco   = clean(colMap.endereco ? row[colMap.endereco] : null);
      const responsavel = clean(colMap.responsavel ? row[colMap.responsavel] : null);
      const observacoes = clean(colMap.observacoes ? row[colMap.observacoes] : null);

      await pool.execute(
        `INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, cpf, rg, sexo, convenio, endereco, responsavel, observacoes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [clinicaId, nome, telefone, email, dataNasc, cpf, rg, sexo, convenio, endereco, responsavel, observacoes]
      );
      imported++;
    }

    return res.redirect(`/pacientes?importSuccess=${imported}+pacientes+importados` + (skipped ? `+(${skipped}+ignorados)` : ''));
  } catch (error) {
    console.error('Erro importação:', error);
    return res.redirect('/pacientes?importError=Erro+ao+processar+arquivo.+Verifique+o+formato.');
  }
}

module.exports = { list, create, editForm, update, remove, importExcel };
