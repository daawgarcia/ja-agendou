const pool = require('../config/db');
const { hashPassword } = require('../utils/hash');
const { sendEmail, isEmailConfigured } = require('../services/emailService');

const SALES_PACKAGES = {
  pacote_7: { label: '7 dias', price: 'R$ 9,97' },
  pacote_30: { label: '30 dias (1 mês)', price: 'R$ 35,97' },
  pacote_90: { label: '90 dias (3 meses)', price: 'R$ 107,91' },
  pacote_180: { label: '180 dias (6 meses)', price: 'R$ 215,82' },
  pacote_360: { label: '360 dias (1 ano)', price: 'R$ 397,00' },
};

const PAYMENT_METHODS = {
  pix: 'Pix',
  cartao: 'Cartão',
  boleto: 'Boleto',
};

async function notifyTrialSignupForApproval({ nomeDentista, nomeClinica, email, telefone }) {
  const approvalRecipient =
    process.env.TRIAL_APPROVAL_EMAIL
    || process.env.SALES_LEADS_EMAIL
    || 'otavio.garcia@outlook.com';

  if (!isEmailConfigured()) {
    console.warn('SMTP não configurado. Cadastro de teste salvo sem e-mail de aprovação.', {
      nomeDentista,
      nomeClinica,
      email,
    });
    return;
  }

  const textBody = [
    'Novo cadastro de teste aguardando aprovação',
    '',
    `Dentista responsável: ${nomeDentista}`,
    `Clínica: ${nomeClinica}`,
    `E-mail de acesso: ${email}`,
    `Telefone: ${telefone || '-'}`,
    '',
    'Acesse o painel de clínicas para aprovar e liberar o teste.',
  ].join('\n');

  const htmlBody = `
    <h2>Novo cadastro de teste aguardando aprovação</h2>
    <p><strong>Dentista responsável:</strong> ${nomeDentista}</p>
    <p><strong>Clínica:</strong> ${nomeClinica}</p>
    <p><strong>E-mail de acesso:</strong> ${email}</p>
    <p><strong>Telefone:</strong> ${telefone || '-'}</p>
    <p>Acesse o painel de clínicas para aprovar e liberar o teste.</p>
  `;

  const sendResult = await sendEmail({
    to: approvalRecipient,
    subject: `Aprovação pendente de teste - ${nomeClinica}`,
    text: textBody,
    html: htmlBody,
    fromName: 'Ja Agendou Aprovações',
  });

  if (!sendResult.ok) {
    console.error('ERRO AO ENVIAR E-MAIL DE APROVAÇÃO DE TESTE:', sendResult.error || sendResult.reason);
  }
}

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
  const success = req.query.sucesso === '1';
  const error = req.query.erro === 'campos_obrigatorios'
    ? 'Preencha nome, clínica, e-mail, pacote e forma de pagamento.'
    : req.query.erro === 'pacote_invalido'
      ? 'Pacote selecionado inválido. Tente novamente.'
      : req.query.erro === 'pagamento_invalido'
        ? 'Forma de pagamento inválida. Tente novamente.'
        : req.query.erro === 'email_indisponivel'
          ? 'Formulário recebido, mas o envio de e-mail ainda não está configurado no servidor.'
          : req.query.erro === 'envio_falhou'
            ? 'Não foi possível enviar seus dados por e-mail agora. Tente novamente em alguns minutos.'
            : null;

  return res.render('public/venda', {
    success,
    error,
    salesPackages: SALES_PACKAGES,
    paymentMethods: PAYMENT_METHODS,
  });
}

async function submitSalesLead(req, res) {
  const nomeResponsavel = String(req.body.nome_responsavel || '').trim();
  const nomeClinica = String(req.body.nome_clinica || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const telefone = String(req.body.telefone || '').trim();
  const pacote = String(req.body.pacote || '').trim();
  const formaPagamento = String(req.body.forma_pagamento || '').trim();
  const mensagem = String(req.body.mensagem || '').trim();

  if (!nomeResponsavel || !nomeClinica || !email || !pacote || !formaPagamento) {
    return res.redirect('/venda?erro=campos_obrigatorios#contato-comercial');
  }

  const selectedPackage = SALES_PACKAGES[pacote];
  if (!selectedPackage) {
    return res.redirect('/venda?erro=pacote_invalido#contato-comercial');
  }

  const paymentLabel = PAYMENT_METHODS[formaPagamento];
  if (!paymentLabel) {
    return res.redirect('/venda?erro=pagamento_invalido#contato-comercial');
  }

  const salesEmailRecipient = process.env.SALES_LEADS_EMAIL || 'otavio.garcia@outlook.com';

  const textBody = [
    'Novo interesse comercial - Já Agendou',
    '',
    `Responsável: ${nomeResponsavel}`,
    `Clínica: ${nomeClinica}`,
    `E-mail: ${email}`,
    `Telefone: ${telefone || '-'}`,
    `Pacote: ${selectedPackage.label} (${selectedPackage.price})`,
    `Pagamento escolhido: ${paymentLabel}`,
    `Mensagem: ${mensagem || '-'}`,
  ].join('\n');

  const htmlBody = `
    <h2>Novo interesse comercial - Já Agendou</h2>
    <p><strong>Responsável:</strong> ${nomeResponsavel}</p>
    <p><strong>Clínica:</strong> ${nomeClinica}</p>
    <p><strong>E-mail:</strong> ${email}</p>
    <p><strong>Telefone:</strong> ${telefone || '-'}</p>
    <p><strong>Pacote:</strong> ${selectedPackage.label} (${selectedPackage.price})</p>
    <p><strong>Pagamento escolhido:</strong> ${paymentLabel}</p>
    <p><strong>Mensagem:</strong> ${mensagem || '-'}</p>
  `;

  if (!isEmailConfigured()) {
    console.warn('SMTP não configurado. Lead comercial capturado sem envio de e-mail.', {
      nomeResponsavel,
      nomeClinica,
      email,
      pacote,
      formaPagamento,
    });
    return res.redirect('/venda?erro=email_indisponivel#contato-comercial');
  }

  const sendResult = await sendEmail({
    to: salesEmailRecipient,
    subject: `Novo lead comercial - ${nomeClinica}`,
    text: textBody,
    html: htmlBody,
    fromName: 'Ja Agendou Leads',
  });

  if (!sendResult.ok) {
    console.error('ERRO AO ENVIAR LEAD COMERCIAL:', sendResult.error || sendResult.reason);
    return res.redirect('/venda?erro=envio_falhou#contato-comercial');
  }

  return res.redirect('/venda?sucesso=1#contato-comercial');
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

    await notifyTrialSignupForApproval({
      nomeDentista,
      nomeClinica,
      email,
      telefone,
    });

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
  submitSalesLead,
  showDentistSignup,
  submitDentistSignup,
};
