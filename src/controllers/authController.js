const pool = require('../config/db');
const { comparePassword } = require('../utils/hash');

async function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.render('auth/login', { error: null });
}

async function login(req, res) {
  const { email, senha } = req.body;

  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, u.email, u.senha_hash, u.perfil, u.status, u.clinica_id,
              c.nome AS clinica_nome, c.status AS clinica_status
       FROM usuarios u
       INNER JOIN clinicas c ON c.id = u.clinica_id
       WHERE u.email = ?
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).render('auth/login', { error: 'Usuário ou senha inválidos.' });
    }

    const user = rows[0];

    if (user.status !== 'ativo' || user.clinica_status !== 'ativo') {
      return res.status(403).render('auth/login', { error: 'Usuário ou clínica inativa.' });
    }

    const validPassword = await comparePassword(senha, user.senha_hash);
    if (!validPassword) {
      return res.status(401).render('auth/login', { error: 'Usuário ou senha inválidos.' });
    }

    req.session.user = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      clinica_id: user.clinica_id,
      clinica_nome: user.clinica_nome,
    };

    return res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    return res.status(500).render('auth/login', { error: 'Erro interno ao fazer login.' });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

module.exports = { showLogin, login, logout };
