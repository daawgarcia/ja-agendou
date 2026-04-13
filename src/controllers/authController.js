const crypto = require('crypto');

const pool = require('../config/db');
const { comparePassword, hashPassword } = require('../utils/hash');
const { isEmailConfigured, sendEmail } = require('../services/emailService');

const PERMANENT_SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'otavio@jaagendou.app').toLowerCase();
const PERMANENT_SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'MESTRE';
const PERMANENT_SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Otavio2805@';
const RESET_PASSWORD_TTL_MINUTES = Number(process.env.RESET_PASSWORD_TTL_MINUTES || 60);
const MIN_PASSWORD_LENGTH = 6;

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

async function ensureMasterClinic() {
  const [rows] = await pool.execute('SELECT id FROM clinicas ORDER BY id ASC LIMIT 1');
  if (rows.length) {
    return rows[0].id;
  }

  const [result] = await pool.execute(
    `INSERT INTO clinicas (nome, slug, email, telefone, status)
     VALUES (?, ?, ?, ?, 'ativo')`,
    ['Conta Mestre', 'conta-mestre', PERMANENT_SUPER_ADMIN_EMAIL, null]
  );

  return result.insertId;
}

async function ensurePermanentSuperAdminAccount(inputEmail) {
  const normalizedEmail = String(inputEmail || '').trim().toLowerCase();
  if (normalizedEmail !== PERMANENT_SUPER_ADMIN_EMAIL) {
    return;
  }

  const clinicaId = await ensureMasterClinic();
  const masterPasswordHash = await hashPassword(PERMANENT_SUPER_ADMIN_PASSWORD);

  const [rows] = await pool.execute('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [PERMANENT_SUPER_ADMIN_EMAIL]);

  if (!rows.length) {
    await pool.execute(
      `INSERT INTO usuarios
       (clinica_id, nome, email, senha_hash, perfil, status)
       VALUES (?, ?, ?, ?, 'super_admin', 'ativo')`,
      [clinicaId, PERMANENT_SUPER_ADMIN_NAME, PERMANENT_SUPER_ADMIN_EMAIL, masterPasswordHash]
    );
    return;
  }

  await pool.execute(
    `UPDATE usuarios
     SET clinica_id = ?,
         nome = ?,
         senha_hash = ?,
         perfil = 'super_admin',
         status = 'ativo'
     WHERE email = ?`,
    [clinicaId, PERMANENT_SUPER_ADMIN_NAME, masterPasswordHash, PERMANENT_SUPER_ADMIN_EMAIL]
  );
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

function mapLoginQueryInfo(infoCode) {
  if (infoCode === 'senha_redefinida') {
    return null;
  }

  return null;
}

function mapLoginQuerySuccess(successCode) {
  if (successCode === 'senha_redefinida') {
    return 'Nova senha salva com sucesso. Entre agora com sua credencial atualizada.';
  }

  return null;
}

function getBaseUrl(req) {
  return (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

function buildResetPasswordUrl(req, token) {
  return `${getBaseUrl(req)}/reset-password?token=${encodeURIComponent(token)}`;
}

async function loadUserByResetToken(token) {
  if (!token) {
    return null;
  }

  const [rows] = await pool.execute(
    `SELECT *
     FROM usuarios
     WHERE reset_password_token = ?
       AND reset_password_expiry IS NOT NULL
       AND reset_password_expiry > NOW()
     LIMIT 1`,
    [token]
  );

  return rows[0] || null;
}

async function clearResetPasswordToken(userId) {
  await pool.execute(
    `UPDATE usuarios
     SET reset_password_token = NULL,
         reset_password_expiry = NULL
     WHERE id = ?`,
    [userId]
  );
}

async function sendResetPasswordEmail({ req, user }) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + RESET_PASSWORD_TTL_MINUTES * 60 * 1000);

  await pool.execute(
    `UPDATE usuarios
     SET reset_password_token = ?,
         reset_password_expiry = ?
     WHERE id = ?`,
    [token, expiry, user.id]
  );

  const resetUrl = buildResetPasswordUrl(req, token);
  const textBody = [
    'Redefina sua senha no Já Agendou',
    '',
    `Olá, ${user.nome}!`,
    'Recebemos uma solicitação para alterar sua senha de acesso.',
    'Para continuar, use o link abaixo e defina uma nova senha:',
    resetUrl,
    '',
    `Esse link expira em ${RESET_PASSWORD_TTL_MINUTES} minutos.`,
    '',
    'Se você não pediu essa alteração, ignore este e-mail e sua senha atual continuará válida.',
  ].join('\n');

  const htmlBody = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#f4f7fb;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbe6f2;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(140deg,#154c7d,#1e6cab);padding:22px 24px;color:#ffffff;">
          <h2 style="margin:0 0 6px;font-size:26px;">Redefina sua senha</h2>
          <p style="margin:0;font-size:14px;opacity:0.92;">Use o link abaixo para voltar a acessar o Já Agendou com segurança.</p>
        </div>
        <div style="padding:24px;color:#243447;line-height:1.55;">
          <p style="margin-top:0;">Olá, <strong>${user.nome}</strong>!</p>
          <p>Recebemos uma solicitação para alterar sua senha de acesso.</p>
          <p>Clique no botão abaixo para definir uma nova senha:</p>
          <p style="margin:20px 0 24px;">
            <a href="${resetUrl}" style="display:inline-block;background:#1e5b92;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">Redefinir senha</a>
          </p>
          <p style="margin:0 0 8px;">Este link expira em ${RESET_PASSWORD_TTL_MINUTES} minutos.</p>
          <p style="margin:0 0 8px;">Se você não pediu essa alteração, ignore este e-mail e sua senha atual continuará válida.</p>
          <p style="margin:0;color:#5a6b7d;font-size:13px;">Se o botão não abrir, use este link: <a href="${resetUrl}">${resetUrl}</a></p>
        </div>
      </div>
    </div>
  `;

  const sendResult = await sendEmail({
    to: user.email,
    subject: 'Já Agendou - Redefinição de senha',
    text: textBody,
    html: htmlBody,
    fromName: 'Já Agendou',
  });

  if (!sendResult.ok) {
    await clearResetPasswordToken(user.id);
    throw sendResult.error || new Error(sendResult.reason || 'Falha ao enviar e-mail de redefinição.');
  }
}

async function validateClinicAccess(user) {
  const isSuperAdmin = user.perfil === 'super_admin';
  const isPermanentSuperAdmin =
    isSuperAdmin && String(user.email || '').toLowerCase() === PERMANENT_SUPER_ADMIN_EMAIL;

  if (isSuperAdmin || isPermanentSuperAdmin) {
    return { allowed: true, message: null };
  }

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

async function registerClinicLastAccess(clinicaId) {
  if (!clinicaId) {
    return;
  }

  await pool.execute(
    'UPDATE clinicas SET ultimo_acesso_em = NOW() WHERE id = ? LIMIT 1',
    [clinicaId]
  );
}

async function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  const queryError = mapLoginQueryError(req.query.erro);
  const queryInfo = mapLoginQueryInfo(req.query.info);
  const querySuccess = mapLoginQuerySuccess(req.query.sucesso);
  return res.render('auth/login', { error: queryError, info: queryInfo, success: querySuccess });
}

async function showForgotPassword(req, res) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  return res.render('auth/forgot-password', { error: null, info: null });
}

async function forgotPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const genericInfoMessage = 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.';

  if (!email) {
    return res.status(400).render('auth/forgot-password', {
      error: 'Informe o e-mail usado no acesso.',
      info: null,
    });
  }

  if (!isEmailConfigured()) {
    return res.status(503).render('auth/forgot-password', {
      error: 'A recuperação de senha não está disponível no momento. Configure o envio de e-mails do sistema.',
      info: null,
    });
  }

  try {
    await ensurePermanentSuperAdminAccount(email);

    const user = await loadUserByEmail(email);
    if (user && user.status === 'ativo') {
      await sendResetPasswordEmail({ req, user });
    }

    return res.render('auth/forgot-password', { error: null, info: genericInfoMessage });
  } catch (error) {
    console.error(error);
    return res.status(500).render('auth/forgot-password', {
      error: 'Não foi possível processar sua solicitação agora. Tente novamente em alguns minutos.',
      info: null,
    });
  }
}

async function showResetPassword(req, res) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  const token = String(req.query.token || '').trim();
  if (!token) {
    return res.status(400).render('auth/reset-password', {
      error: 'Link de redefinição inválido.',
      info: null,
      token: '',
    });
  }

  try {
    const user = await loadUserByResetToken(token);
    if (!user) {
      return res.status(400).render('auth/reset-password', {
        error: 'Este link é inválido ou expirou. Solicite uma nova redefinição.',
        info: null,
        token: '',
      });
    }

    return res.render('auth/reset-password', {
      error: null,
      info: null,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).render('auth/reset-password', {
      error: 'Não foi possível validar o link de redefinição agora.',
      info: null,
      token: '',
    });
  }
}

async function resetPassword(req, res) {
  const token = String(req.body.token || '').trim();
  const senha = String(req.body.senha || req.body.password || '');
  const confirmarSenha = String(req.body.confirmar_senha || req.body.confirmPassword || '');

  if (!token) {
    return res.status(400).render('auth/reset-password', {
      error: 'Link de redefinição inválido.',
      info: null,
      token: '',
    });
  }

  if (!senha || senha.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).render('auth/reset-password', {
      error: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      info: null,
      token,
    });
  }

  if (senha !== confirmarSenha) {
    return res.status(400).render('auth/reset-password', {
      error: 'A confirmação da senha não confere.',
      info: null,
      token,
    });
  }

  try {
    const user = await loadUserByResetToken(token);
    if (!user) {
      return res.status(400).render('auth/reset-password', {
        error: 'Este link é inválido ou expirou. Solicite uma nova redefinição.',
        info: null,
        token: '',
      });
    }

    const senhaHash = await hashPassword(senha);
    await pool.execute(
      `UPDATE usuarios
       SET senha_hash = ?,
           reset_password_token = NULL,
           reset_password_expiry = NULL
       WHERE id = ?`,
      [senhaHash, user.id]
    );

    return res.redirect('/login?sucesso=senha_redefinida');
  } catch (error) {
    console.error(error);
    return res.status(500).render('auth/reset-password', {
      error: 'Não foi possível redefinir sua senha agora. Tente novamente.',
      info: null,
      token,
    });
  }
}

async function login(req, res) {
  const email = (req.body.email || '').trim();
  const senha = req.body.senha || req.body.password || '';

  if (!email || !senha) {
    return res.status(400).render('auth/login', { error: 'Informe e-mail e senha.', info: null });
  }

  try {
    await ensurePermanentSuperAdminAccount(email);

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

    await registerClinicLastAccess(user.clinica_id);

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

module.exports = {
  showLogin,
  login,
  showForgotPassword,
  forgotPassword,
  showResetPassword,
  resetPassword,
  logout,
};
