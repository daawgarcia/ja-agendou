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
    clinica_licenca_fim_em: clinica?.licenca_fim_em || null,
    clinica_trial_fim_em: clinica?.trial_fim_em || null,
    clinica_desbloqueado_em: clinica?.desbloqueado_em || null,
  };
}

function mapLoginQueryError(errorCode) {
  if (errorCode === 'clinica_pendente') {
    return 'Cadastro recebido. Seu acesso ainda aguarda aprovacao do admin.';
  }
  if (errorCode === 'clinica_inativa') {
    return 'Acesso da clinica inativo. Entre em contato com o suporte.';
  }
  if (errorCode === 'licenca_expirada') {
    return 'Sua licenca expirou. Aguarde o admin renovar o periodo de uso.';
  }
  if (errorCode === 'trial_expirado') {
    return 'Seu periodo gratuito terminou. Aguarde o admin definir sua licenca.';
  }
  return null;
}

async function validateClinicAccess(user) {
  if (user.clinica_status === 'pendente') {
    return {
      allowed: false,
      message: 'Cadastro recebido. Seu acesso ainda aguarda aprovacao do admin.',
    };
  }

  if (user.clinica_status !== 'ativo') {
    return {
      allowed: false,
      message: 'Acesso da clinica inativo. Entre em contato com o suporte.',
    };
  }

  const licenseEnd = user.clinica_licenca_fim_em || user.clinica_trial_fim_em;
  if (licenseEnd) {
    const licenseEndDate = new Date(licenseEnd);
    if (!Number.isNaN(licenseEndDate.getTime()) && Date.now() > licenseEndDate.getTime()) {
      await pool.execute(
        "UPDATE clinicas SET status = 'inativo' WHERE id = ? AND status = 'ativo'",
        [user.clinica_id]
      );

      return {
        allowed: false,
        message: user.clinica_licenca_fim_em
          ? 'Sua licenca expirou. Aguarde o admin renovar o periodo de uso.'
          : 'Seu periodo gratuito terminou. Aguarde o admin definir sua licenca.',
      };
    }
  }

  return { allowed: true, message: null };
}

async function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  const queryError = mapLoginQueryError(req.query.erro);
  return res.render('auth/login', { error: queryError, info: null });
}

async function login(req, res) {
  const email = (req.body.email || '').trim();
  const senha = req.body.senha || req.body.password || '';

  if (!email || !senha) {
    return res.status(400).render('auth/login', { error: 'Informe e-mail e senha.', info: null });
  }

  try {
    const user = await loadUserByEmail(email);
    if (!user) {
      return res.status(401).render('auth/login', { error: 'Usuário ou senha inválidos.', info: null });
    }

    if (user.status !== 'ativo') {
      return res.status(403).render('auth/login', { error: 'Usuário inativo.', info: null });
    }

    const clinicAccess = await validateClinicAccess(user);
    if (!clinicAccess.allowed) {
      return res.status(403).render('auth/login', { error: clinicAccess.message, info: null });
    }

    const validPassword = await verifyPassword(senha, user.senha_hash);
    if (!validPassword) {
      return res.status(401).render('auth/login', { error: 'Usuário ou senha inválidos.', info: null });
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
    return res.status(500).render('auth/login', { error: 'Erro interno ao fazer login.', info: null });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

module.exports = { showLogin, login, logout };
