const pool = require('../config/db');
const { hashPassword } = require('../utils/hash');

function slugify(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function generateUniqueSlug(baseName) {
  const base = slugify(baseName) || 'clinica';
  let candidate = base;
  let suffix = 1;

  // Guarantee an available slug to avoid duplicate key failures.
  while (true) {
    const [rows] = await pool.execute('SELECT id FROM clinicas WHERE slug = ? LIMIT 1', [candidate]);
    if (!rows.length) {
      return candidate;
    }
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

function showSalesPage(req, res) {
  return res.render('public/venda');
}

function showDentistSignup(req, res) {
  const success = req.query.sucesso === '1';
  const error = req.query.erro === 'email_duplicado'
    ? 'Este e-mail já está em uso. Tente outro e-mail.'
    : req.query.erro === 'campos_obrigatorios'
      ? 'Preencha todos os campos obrigatórios.'
      : null;

  return res.render('public/cadastro-dentista', {
    success,
    error,
  });
}

async function submitDentistSignup(req, res) {
  const nomeDentista = String(req.body.nome_dentista || '').trim();
  const nomeClinica = String(req.body.nome_clinica || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const telefone = String(req.body.telefone || '').trim();
  const senha = req.body.senha || '';

  if (!nomeDentista || !nomeClinica || !email || !senha) {
    return res.redirect('/cadastro-dentista?erro=campos_obrigatorios');
  }

  let connection;
  try {
    const slug = await generateUniqueSlug(nomeClinica);
    const senhaHash = await hashPassword(senha);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [clinicaResult] = await connection.execute(
      `INSERT INTO clinicas (nome, slug, email, telefone, status)
       VALUES (?, ?, ?, ?, 'pendente')`,
      [nomeClinica, slug, email, telefone || null]
    );

    await connection.execute(
      `INSERT INTO usuarios
       (clinica_id, nome, email, senha_hash, perfil, status)
       VALUES (?, ?, ?, ?, 'admin', 'ativo')`,
      [clinicaResult.insertId, nomeDentista, email, senhaHash]
    );

    await connection.commit();
    return res.redirect('/cadastro-dentista?sucesso=1');
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('ERRO CADASTRO DENTISTA:', error);

    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.redirect('/cadastro-dentista?erro=email_duplicado');
    }

    return res.status(500).render('partials/error', {
      title: 'Erro ao enviar cadastro',
      message: 'Nao foi possivel enviar sua solicitacao agora. Tente novamente em alguns minutos.',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  showSalesPage,
  showDentistSignup,
  submitDentistSignup,
};
