const pool = require('../config/db');
const { hashPassword } = require('../utils/hash');

async function index(req, res) {
  const clinicaId = req.session.user.clinica_id;
  try {
    const [usuarios] = await pool.execute(
      `SELECT id, nome, email, perfil, status
       FROM usuarios
       WHERE clinica_id = ?
       ORDER BY id ASC`,
      [clinicaId]
    );
    return res.render('usuarios/index', { usuarios });
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível carregar usuários.' });
  }
}

async function create(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { nome, email, senha, perfil } = req.body;

  if (!nome || !email || !senha) {
    return res.redirect('/usuarios?erro=campos_obrigatorios');
  }

  try {
    const senhaHash = await hashPassword(senha);
    await pool.execute(
      'INSERT INTO usuarios (clinica_id, nome, email, senha_hash, perfil, status) VALUES (?, ?, ?, ?, ?, ?)',
      [clinicaId, nome.trim(), email.trim().toLowerCase(), senhaHash, perfil || 'recepcao', 'ativo']
    );
    return res.redirect('/usuarios');
  } catch (err) {
    console.error(err);
    return res.redirect('/usuarios?erro=email_duplicado');
  }
}

async function toggleStatus(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const { id } = req.params;
  try {
    const [[u]] = await pool.execute('SELECT status FROM usuarios WHERE id = ? AND clinica_id = ?', [id, clinicaId]);
    if (!u) return res.redirect('/usuarios');
    const novoStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    await pool.execute('UPDATE usuarios SET status = ? WHERE id = ? AND clinica_id = ?', [novoStatus, id, clinicaId]);
    return res.redirect('/usuarios');
  } catch (err) {
    console.error(err);
    return res.redirect('/usuarios');
  }
}

module.exports = { index, create, toggleStatus };
