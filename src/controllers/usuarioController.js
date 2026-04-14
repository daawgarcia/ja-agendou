const pool = require('../config/db');
const { comparePassword, hashPassword } = require('../utils/hash');

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

  return inputPassword === storedValue;
}

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

function showChangePassword(req, res) {
  return res.render('usuarios/change-password', {
    error: null,
    success: null,
  });
}

async function changeOwnPassword(req, res) {
  const userId = req.session.user.id;
  const currentPassword = String(req.body.senha_atual || '');
  const newPassword = String(req.body.nova_senha || '');
  const confirmPassword = String(req.body.confirmar_senha || '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).render('usuarios/change-password', {
      error: 'Preencha todos os campos para alterar sua senha.',
      success: null,
    });
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).render('usuarios/change-password', {
      error: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      success: null,
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).render('usuarios/change-password', {
      error: 'A confirmação da nova senha não confere.',
      success: null,
    });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, senha_hash, senha FROM usuarios WHERE id = ? LIMIT 1',
      [userId]
    );

    const user = rows[0] || null;
    if (!user) {
      return res.status(404).render('usuarios/change-password', {
        error: 'Usuário não encontrado para alterar a senha.',
        success: null,
      });
    }

    const storedPassword = user.senha_hash || user.senha || null;
    const validCurrentPassword = await verifyPassword(currentPassword, storedPassword);
    if (!validCurrentPassword) {
      return res.status(400).render('usuarios/change-password', {
        error: 'A senha atual informada está incorreta.',
        success: null,
      });
    }

    const newPasswordHash = await hashPassword(newPassword);
    await pool.execute(
      `UPDATE usuarios
       SET senha_hash = ?,
           reset_password_token = NULL,
           reset_password_expiry = NULL
       WHERE id = ?`,
      [newPasswordHash, userId]
    );

    return res.render('usuarios/change-password', {
      error: null,
      success: 'Sua senha foi atualizada com sucesso.',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).render('usuarios/change-password', {
      error: 'Não foi possível alterar sua senha agora. Tente novamente em alguns minutos.',
      success: null,
    });
  }
}

module.exports = { index, create, toggleStatus, showChangePassword, changeOwnPassword };
