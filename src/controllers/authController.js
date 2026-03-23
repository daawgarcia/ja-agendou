const pool = require('../config/db');
const { comparePassword } = require('../utils/hash');

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

async function verifyPassword(inputPassword, storedValue) {
  if (typeof inputPassword !== 'string' || typeof storedValue !== 'string') {
    return false;
  }

  if (isBcryptHash(storedValue)) {
    return comparePassword(inputPassword, storedValue);
  }

  // Compatibilidade com bases legadas que ainda possuem senha em texto.
  return inputPassword === storedValue;
}

async function loadUserByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM usuarios WHERE email = ? LIMIT 1', [email]);
  if (!rows.length) return null;

  const rawUser = rows[0];
  const clinicaId = rawUser.clinica_id || null;

  let clinica = null;
  if (clinicaId) {
    const [clinicaRows] = await pool.execute('SELECT * FROM clinicas WHERE id = ? LIMIT 1', [clinicaId]);
    clinica = clinicaRows[0] || null;
  }

  return {
    id: rawUser.id,
    nome: rawUser.nome,
    email: rawUser.email,
    senha_hash: rawUser.senha_hash || rawUser.senha || null,
    perfil: rawUser.perfil || 'recepcao',
    status: rawUser.status || 'ativo',
    clinica_id: clinicaId,
    clinica_nome: clinica?.nome || 'Clínica',
    clinica_status: clinica?.status || 'ativo',
  };
}

async function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.render('auth/login', { error: null });
}

async function login(req, res) {
  const email = (req.body.email || '').trim();
  const senha = req.body.senha || req.body.password || '';

  if (!email || !senha) {
    return res.status(400).render('auth/login', { error: 'Informe e-mail e senha.' });
  }

  try {
    const user = await loadUserByEmail(email);
    if (!user) {
      return res.status(401).render('auth/login', { error: 'Usuário ou senha inválidos.' });
    }

    if (user.status !== 'ativo' || user.clinica_status !== 'ativo') {
      return res.status(403).render('auth/login', { error: 'Usuário ou clínica inativa.' });
    }

    const validPassword = await verifyPassword(senha, user.senha_hash);
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
