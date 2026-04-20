const crypto = require('crypto');

const pool = require('../config/db');
const { hashPassword } = require('../utils/hash');
const { sendEmail, isEmailConfigured } = require('../services/emailService');

const SALES_PACKAGES = {
  teste: { label: 'Teste', price: 'Gratuito' },
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

function getSalesLeadRecipients() {
  const primaryRecipient = String(process.env.SALES_LEADS_EMAIL || 'otavio.garcia@outlook.com').trim().toLowerCase();
  const copyRecipient = String(process.env.SALES_LEADS_CC_EMAIL || 'no-reply@jaagendou.app').trim().toLowerCase();

  return {
    to: primaryRecipient,
    cc: copyRecipient && copyRecipient !== primaryRecipient ? copyRecipient : undefined,
  };
}

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

// --- Trial auto-activation helpers ---

function generateTrialPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$!';
  const all = upper + lower + digits + special;

  const arr = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    special[crypto.randomInt(special.length)],
  ];

  for (let i = arr.length; i < 16; i++) {
    arr.push(all[crypto.randomInt(all.length)]);
  }

  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.join('');
}

function getAppUrl(req) {
  return (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

async function sendTrialWelcomeEmail({ nomeResponsavel, email, tempPassword, nomeClinica, trialFim, appUrl }) {
  if (!isEmailConfigured()) {
    console.warn('[Trial] SMTP não configurado — e-mail de boas-vindas não enviado para:', email);
    return { ok: false, skipped: true, reason: 'smtp-not-configured' };
  }

  const trialFimFormatted = trialFim.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const loginUrl = `${appUrl}/login`;

  const textBody = [
    `Olá, ${nomeResponsavel}!`,
    '',
    'Seu teste gratuito de 7 dias no Já Agendou está ativo.',
    '',
    `Clínica: ${nomeClinica}`,
    `Acesso válido até: ${trialFimFormatted}`,
    '',
    '--- Dados de acesso ---',
    `URL: ${loginUrl}`,
    `E-mail: ${email}`,
    `Senha temporária: ${tempPassword}`,
    '',
    'Recomendamos trocar sua senha após o primeiro acesso:',
    `${appUrl}/usuarios/minha-senha`,
    '',
    `Quando o teste encerrar em ${trialFimFormatted}, o acesso fica pausado.`,
    `Para continuar, assine um plano em: ${appUrl}/venda`,
    '',
    'Qualquer dúvida, fale com a gente.',
    '',
    'Equipe Já Agendou',
  ].join('\n');

  const htmlBody = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#f4f7fb;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbe6f2;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(140deg,#154c7d,#1e6cab);padding:22px 24px;color:#ffffff;">
          <h2 style="margin:0 0 6px;font-size:26px;">Bem-vindo ao Já Agendou!</h2>
          <p style="margin:0;font-size:14px;opacity:0.92;">Seu teste gratuito de 7 dias está ativo. Acesse agora.</p>
        </div>
        <div style="padding:24px;color:#243447;line-height:1.55;">
          <p style="margin-top:0;">Olá, <strong>${nomeResponsavel}</strong>!</p>
          <p>Criamos o acesso para a clínica <strong>${nomeClinica}</strong>. Veja seus dados abaixo:</p>

          <div style="background:#f0f6ff;border:1px solid #c3d9f5;border-radius:8px;padding:16px;margin:20px 0;">
            <table style="border-collapse:collapse;width:100%;">
              <tr>
                <td style="padding:5px 0;color:#5a6b7d;font-size:13px;width:130px;">URL de acesso</td>
                <td style="padding:5px 0;"><a href="${loginUrl}" style="color:#1e5b92;font-weight:600;">${loginUrl}</a></td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#5a6b7d;font-size:13px;">E-mail</td>
                <td style="padding:5px 0;font-weight:600;">${email}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#5a6b7d;font-size:13px;">Senha temporária</td>
                <td style="padding:5px 0;font-family:monospace;font-size:16px;font-weight:700;letter-spacing:1px;">${tempPassword}</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#5a6b7d;font-size:13px;">Válido até</td>
                <td style="padding:5px 0;">${trialFimFormatted}</td>
              </tr>
            </table>
          </div>

          <p style="margin:0 0 16px;"><strong>Recomendamos trocar sua senha</strong> após o primeiro acesso, na seção "Minha Senha".</p>

          <p style="margin:20px 0 24px;">
            <a href="${loginUrl}" style="display:inline-block;background:#1e5b92;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:15px;">Acessar minha conta</a>
          </p>

          <p style="color:#5a6b7d;font-size:13px;margin:0;border-top:1px solid #e8edf3;padding-top:16px;">
            Quando seu teste encerrar em <strong>${trialFimFormatted}</strong>, o acesso ficará pausado.
            Para continuar, <a href="${appUrl}/venda" style="color:#1e5b92;">assine um plano</a> — mensal ou anual.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Já Agendou — seu acesso está pronto!',
    text: textBody,
    html: htmlBody,
    fromName: 'Já Agendou',
  });
}

async function activateTrialAccount({ nomeResponsavel, nomeClinica, email, telefone, req }) {
  const tempPassword = generateTrialPassword();
  const senhaHash = await hashPassword(tempPassword);
  const slug = await generateUniqueSlug(nomeClinica);
  const trialInicio = new Date();
  const trialFim = new Date(trialInicio.getTime() + 7 * 24 * 60 * 60 * 1000);
  const appUrl = getAppUrl(req);

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [clinicaResult] = await connection.execute(
      `INSERT INTO clinicas (nome, slug, email, telefone, status, trial_inicio_em, trial_fim_em)
       VALUES (?, ?, ?, ?, 'ativo', ?, ?)`,
      [nomeClinica, slug, email, telefone || null, trialInicio, trialFim]
    );

    await connection.execute(
      `INSERT INTO usuarios (clinica_id, nome, email, senha_hash, perfil, status)
       VALUES (?, ?, ?, ?, 'admin', 'ativo')`,
      [clinicaResult.insertId, nomeResponsavel, email, senhaHash]
    );

    await connection.commit();

    const emailResult = await sendTrialWelcomeEmail({
      nomeResponsavel,
      email,
      tempPassword,
      nomeClinica,
      trialFim,
      appUrl,
    });

    // Notifica o admin (fire-and-forget, não bloqueia)
    notifyTrialSignupForApproval({ nomeDentista: nomeResponsavel, nomeClinica, email, telefone })
      .catch(err => console.error('[Trial] Falha ao notificar admin:', err));

    const emailSent = Boolean(emailResult && emailResult.ok);
    if (!emailSent && emailResult && !emailResult.skipped) {
      console.error('[Trial] Falha ao enviar e-mail de boas-vindas:', emailResult.error || emailResult.reason);
    }

    return { ok: true, emailSent };
  } catch (err) {
    if (connection) await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return { ok: false, reason: 'email_duplicado' };
    }
    console.error('[Trial] Erro ao ativar conta trial:', err);
    return { ok: false, reason: 'erro_interno' };
  } finally {
    if (connection) connection.release();
  }
}

// --- Fim helpers trial ---

function showSalesPage(req, res) {
  const sucesso = req.query.sucesso;
  const successCode = ['trial', 'trial_sem_email', '1'].includes(sucesso) ? sucesso : null;
  const errorCode = String(req.query.erro || '');

  const success = sucesso === 'trial'
    ? 'Pronto! Seu acesso foi criado. Confira seu e-mail — enviamos o login e a senha temporária para você entrar agora mesmo.'
    : sucesso === 'trial_sem_email'
      ? 'Conta criada com sucesso! Não conseguimos enviar o e-mail agora. Entre em contato pelo WhatsApp com seu e-mail de cadastro para receber os dados de acesso.'
      : sucesso === '1'
        ? 'Dados recebidos! Entraremos em contato em breve.'
        : null;

  const error = errorCode === 'campos_obrigatorios'
    ? 'Preencha nome, clínica, e-mail, pacote e, para planos pagos, a forma de pagamento.'
    : errorCode === 'campos_obrigatorios_teste'
      ? 'Preencha nome, clínica, e-mail e telefone para ativar o teste gratuito.'
      : errorCode === 'email_ja_cadastrado'
        ? 'Este e-mail já tem uma conta no Já Agendou. Acesse em /login ou redefina sua senha.'
        : errorCode === 'pacote_invalido'
          ? 'Pacote selecionado inválido. Tente novamente.'
          : errorCode === 'pagamento_invalido'
            ? 'Forma de pagamento inválida. Tente novamente.'
            : errorCode === 'email_indisponivel'
              ? 'Formulário recebido, mas o envio de e-mail ainda não está configurado no servidor.'
              : errorCode === 'envio_falhou'
                ? 'Não foi possível enviar seus dados por e-mail agora. Tente novamente em alguns minutos.'
                : null;

  return res.render('public/venda', {
    success,
    successCode,
    error,
    errorCode,
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
  const origemFormulario = String(req.body.origem_formulario || '').trim();
  const isTrialPackage = pacote === 'teste';

  if (!nomeResponsavel || !nomeClinica || !email || !pacote) {
    return res.redirect('/venda?erro=campos_obrigatorios#contato-comercial');
  }

  if (isTrialPackage && !telefone) {
    return res.redirect('/venda?erro=campos_obrigatorios_teste#contato-comercial');
  }

  const selectedPackage = SALES_PACKAGES[pacote];
  if (!selectedPackage) {
    return res.redirect('/venda?erro=pacote_invalido#contato-comercial');
  }

  // --- Ativação automática do trial gratuito de 7 dias ---
  if (isTrialPackage) {
    const result = await activateTrialAccount({ nomeResponsavel, nomeClinica, email, telefone, req });

    if (result.reason === 'email_duplicado') {
      return res.redirect('/venda?erro=email_ja_cadastrado#contato-comercial');
    }
    if (!result.ok) {
      return res.status(500).render('partials/error', {
        title: 'Erro ao criar conta',
        message: 'Não foi possível criar seu acesso agora. Tente novamente em instantes ou entre em contato pelo WhatsApp.',
      });
    }
    if (!result.emailSent) {
      return res.redirect('/venda?sucesso=trial_sem_email#contato-comercial');
    }
    return res.redirect('/venda?sucesso=trial#contato-comercial');
  }

  // --- Leads comerciais (planos pagos) ---
  const paymentLabel = PAYMENT_METHODS[formaPagamento];
  if (!paymentLabel) {
    return res.redirect('/venda?erro=pagamento_invalido#contato-comercial');
  }

  const salesRecipients = getSalesLeadRecipients();
  const sourceLabel = origemFormulario === 'popup_teste'
    ? 'Popup de licença teste'
    : 'Formulário comercial';

  const textBody = [
    'Novo interesse comercial - Já Agendou',
    '',
    `Origem: ${sourceLabel}`,
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
    <p><strong>Origem:</strong> ${sourceLabel}</p>
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
      nomeResponsavel, nomeClinica, email, pacote, formaPagamento, origemFormulario,
    });
    return res.redirect('/venda?erro=email_indisponivel#contato-comercial');
  }

  const sendResult = await sendEmail({
    to: salesRecipients.to,
    cc: salesRecipients.cc,
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

function showKitRecepcao(req, res) {
  res.render('public/kit-recepcao');
}

async function enviarEmailBonus(email) {
  if (!isEmailConfigured()) return;

  const html = `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:24px 16px;">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#0D1B40 0%,#162354 100%);border-radius:16px 16px 0 0;padding:32px 32px 24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🦷</div>
      <h1 style="color:#2ECC71;font-size:22px;font-weight:900;margin:0 0 6px;">Seu bônus chegou!</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">5 erros que fazem pacientes faltarem — e como evitar</p>
    </div>

    <!-- INTRO -->
    <div style="background:#fff;padding:28px 32px;">
      <p style="color:#2D3E55;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Olá! Você pediu o conteúdo bônus da página do Kit Recepção. <br>Aqui estão <strong>10 dicas práticas</strong> que qualquer consultório odontológico pode aplicar ainda esta semana para reduzir faltas e melhorar o atendimento.
      </p>

      <!-- DICAS -->
      ${[
        ['Confirme consultas com 48h de antecedência', 'Um lembrete por WhatsApp 48 horas antes reduz drasticamente as faltas. Pacientes esquecem — sua recepção não pode esquecer de lembrar.'],
        ['Use um script fixo para confirmação', 'Cada recepcionista que escreve de um jeito passa insegurança. Um texto padrão transmite profissionalismo e reduz erros de informação.'],
        ['Pergunte "pode confirmar?" ao invés de "vai comparecer?"', 'A forma da pergunta influencia a resposta. "Pode confirmar sua presença?" gera mais comprometimento do paciente do que uma pergunta aberta.'],
        ['Registre o motivo de cada falta', 'Sem dados, você não sabe se o problema é preço, distância, esquecimento ou outro fator. Com um registro simples, o padrão aparece em semanas.'],
        ['Tenha uma lista de encaixe sempre pronta', 'Quando um paciente falta, ligue imediatamente para quem está na fila de encaixe. Horário vazio é receita perdida.'],
        ['Padronize a abertura e o fechamento da clínica', 'Um checklist de rotina garante que nada seja esquecido — independente de qual funcionária está de plantão no dia.'],
        ['Treine a recepção para não improvisar no telefone', 'Ligação sem script vira jogo de memória. Com um roteiro de 5 pontos, qualquer atendente passa a mesma informação com o mesmo nível de qualidade.'],
        ['Reative pacientes inativos com uma mensagem simples', 'Pacientes que não voltam em 6 meses precisam de um convite. Um WhatsApp gentil recupera boa parte dessa receita esquecida.'],
        ['Envie instruções pós-consulta por mensagem', 'Reduz ligações de dúvida, aumenta satisfação e mostra cuidado. Leva 10 segundos com um template pronto.'],
        ['Celebre o aniversário do paciente', 'Uma mensagem de parabéns custa zero e cria vínculo real. Paciente que se sente lembrado volta — e indica.'],
      ].map(([titulo, texto], i) => `
        <div style="display:flex;gap:14px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f0f4f8;">
          <div style="width:36px;height:36px;background:#0D1B40;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#2ECC71;font-weight:900;font-size:15px;line-height:36px;text-align:center;">${i + 1}</div>
          <div>
            <strong style="color:#0D1B40;font-size:15px;display:block;margin-bottom:4px;">${titulo}</strong>
            <span style="color:#64748b;font-size:13px;line-height:1.6;">${texto}</span>
          </div>
        </div>
      `).join('')}

      <!-- CTA FINAL -->
      <div style="background:linear-gradient(135deg,#0D1B40,#162354);border-radius:14px;padding:28px;text-align:center;margin-top:8px;">
        <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0 0 6px;">Quer scripts prontos para aplicar essas dicas hoje?</p>
        <p style="color:#fff;font-size:18px;font-weight:900;margin:0 0 18px;">Kit Recepção Profissional — R$9,97</p>
        <a href="https://jaagendou.app/kit-recepcao" style="display:inline-block;background:#2ECC71;color:#0D1B40;font-weight:900;font-size:15px;padding:14px 36px;border-radius:50px;text-decoration:none;">Ver o Kit →</a>
        <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:14px 0 0;">7 dias de garantia · Acesso imediato · Pagamento único</p>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="background:#f0f4f8;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">© 2026 Já Agendou · <a href="https://jaagendou.app" style="color:#94a3b8;">jaagendou.app</a></p>
    </div>

  </div>
  </div>
  `;

  await sendEmail({
    to: email,
    subject: '🦷 Suas 10 dicas para reduzir faltas na clínica (bônus prometido)',
    html,
    fromName: 'Já Agendou',
  });
}

async function submitKitLead(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, reason: 'email_invalido' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT IGNORE INTO kit_leads (email, origem) VALUES (?, ?)',
      [email, 'exit_popup']
    );

    // Só envia o bônus se for um e-mail novo (affectedRows = 0 significa duplicata ignorada)
    if (result.affectedRows > 0) {
      enviarEmailBonus(email).catch(err => console.error('[KitLead] Falha ao enviar bônus:', err));
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[KitLead] Erro ao salvar lead:', err);
    return res.status(500).json({ ok: false, reason: 'erro_interno' });
  }
}

module.exports = {
  showSalesPage,
  submitSalesLead,
  showDentistSignup,
  submitDentistSignup,
  showKitRecepcao,
  submitKitLead,
};
