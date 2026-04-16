const pool = require('../config/db');
const { comparePassword, hashPassword } = require('../utils/hash');

const MIN_PASSWORD_LENGTH = 12;
let ensureResetColumnsPromise = null;

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

function validatePasswordStrength(senha) {
  if (!senha || senha.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (!/[A-Z]/.test(senha)) {
    return 'A senha deve conter pelo menos uma letra maiúscula.';
  }
  if (!/[a-z]/.test(senha)) {
    return 'A senha deve conter pelo menos uma letra minúscula.';
  }
  if (!/[0-9]/.test(senha)) {
    return 'A senha deve conter pelo menos um número.';
  }
  if (!/[^A-Za-z0-9]/.test(senha)) {
    return 'A senha deve conter pelo menos um caractere especial (ex: @, #, $, !).';
  }
  return null;
}

async function verifyPassword(inputPassword, storedValue) {
  if (typeof inputPassword !== 'string' || typeof storedValue !== 'string') {
    return false;
  }

  if (!isBcryptHash(storedValue)) {
    // Senhas em texto plano não são mais aceitas. O usuário deve redefinir via "Esqueci a senha".
    return false;
  }

  return comparePassword(inputPassword, storedValue);
}

async function hasColumn(tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  return rows.length > 0;
}

async function addColumnIfMissing(tableName, columnName, definitionSql) {
  if (await hasColumn(tableName, columnName)) {
    return;
  }

  await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql}`);
}

async function ensurePasswordResetColumns() {
  if (!ensureResetColumnsPromise) {
    ensureResetColumnsPromise = (async () => {
      await addColumnIfMissing('usuarios', 'reset_password_token', 'VARCHAR(128) NULL AFTER senha_hash');
      await addColumnIfMissing('usuarios', 'reset_password_expiry', 'DATETIME NULL AFTER reset_password_token');
    })().catch((error) => {
      ensureResetColumnsPromise = null;
      throw error;
    });
  }

  return ensureResetColumnsPromise;
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

  const senhaError = validatePasswordStrength(newPassword);
  if (senhaError) {
    return res.status(400).render('usuarios/change-password', {
      error: senhaError,
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
      'SELECT id, senha_hash FROM usuarios WHERE id = ? LIMIT 1',
      [userId]
    );

    const user = rows[0] || null;
    if (!user) {
      return res.status(404).render('usuarios/change-password', {
        error: 'Usuário não encontrado para alterar a senha.',
        success: null,
      });
    }

    const validCurrentPassword = await verifyPassword(currentPassword, user.senha_hash || '');
    if (!validCurrentPassword) {
      return res.status(400).render('usuarios/change-password', {
        error: 'A senha atual informada está incorreta.',
        success: null,
      });
    }

    const newPasswordHash = await hashPassword(newPassword);
    await ensurePasswordResetColumns();
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
