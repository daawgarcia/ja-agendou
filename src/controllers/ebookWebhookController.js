const pool = require('../config/db');
const { isEmailConfigured, sendEmail } = require('../services/emailService');

const EBOOK_PRODUCT_HOTMART_IDS = new Set(
  (process.env.HOTMART_EBOOK_PRODUCT_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
);

function normalizeValue(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s || null;
}

function readNested(source, paths) {
  for (const path of paths) {
    let current = source;
    for (const part of path.split('.')) {
      if (!current || typeof current !== 'object') { current = null; break; }
      current = current[part];
    }
    const n = normalizeValue(current);
    if (n) return n;
  }
  return null;
}

function isTokenValid(req) {
  const expected = normalizeValue(process.env.HOTMART_EBOOK_WEBHOOK_TOKEN || process.env.HOTMART_WEBHOOK_TOKEN);
  if (!expected) return true;
  const incoming = normalizeValue(
    req.body?.hottok || req.body?.token ||
    req.headers['x-hotmart-hottok'] || req.headers['x-hotmart-token']
  );
  return incoming === expected;
}

async function ensureEbookTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ebook_purchases (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      transaction_code VARCHAR(120) NOT NULL,
      buyer_email VARCHAR(190) NOT NULL,
      buyer_name VARCHAR(190),
      product_name VARCHAR(255),
      amount_cents INT UNSIGNED,
      hotmart_payload LONGTEXT,
      email_sent TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_ebook_transaction (transaction_code),
      INDEX idx_ebook_email (buyer_email)
    )
  `);
}

async function sendEbookDeliveryEmail({ buyerEmail, buyerName, transactionCode }) {
  if (!isEmailConfigured()) {
    console.warn('[Ebook] SMTP não configurado — e-mail de entrega não enviado para:', buyerEmail);
    return { ok: false };
  }

  const ebookUrl = process.env.EBOOK_DOWNLOAD_URL || 'https://jaagendou.app/destrave-alinhador/obrigado';
  const whatsappUrl = `https://wa.me/5511925366081?text=Ol%C3%A1%2C%20comprei%20o%20ebook%20Destrave%20o%20Alinhador%20(${encodeURIComponent(transactionCode)})%20e%20preciso%20de%20suporte.`;

  const html = `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f7fb;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
        <div style="background:linear-gradient(135deg,#0f1f3d,#1a3a6b);padding:28px 32px;color:#fff;text-align:center;">
          <h1 style="margin:0 0 8px;font-size:24px;">Parabéns! Seu ebook está pronto.</h1>
          <p style="margin:0;color:rgba(255,255,255,.75);font-size:14px;">Alinhadores: Da Insegurança ao Consultório Lucrativo</p>
        </div>
        <div style="padding:32px;color:#1e293b;line-height:1.6;">
          <p>Olá, <strong>${buyerName || 'dentista'}</strong>!</p>
          <p>Obrigado pela sua compra. Seu acesso ao ebook <strong>Alinhadores: Da Insegurança ao Consultório Lucrativo</strong> foi confirmado.</p>

          <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
            <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#15803d;">Acesse seu ebook agora</p>
            <a href="${ebookUrl}" style="display:inline-block;background:linear-gradient(135deg,#e85d04,#ff8c00);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;">
              Baixar ebook
            </a>
          </div>

          <p style="font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:16px;margin-top:24px;">
            Código da transação: <strong>${transactionCode}</strong><br/>
            Precisa de ajuda? <a href="${whatsappUrl}" style="color:#1e5b92;">Fale conosco no WhatsApp</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Olá, ${buyerName || 'dentista'}!`,
    '',
    'Seu ebook Alinhadores: Da Insegurança ao Consultório Lucrativo está pronto.',
    '',
    `Acesse aqui: ${ebookUrl}`,
    '',
    `Transação: ${transactionCode}`,
    'Dúvidas? Fale no WhatsApp: https://wa.me/5511925366081',
  ].join('\n');

  return sendEmail({
    to: buyerEmail,
    subject: 'Seu ebook Destrave o Alinhador está pronto!',
    text,
    html,
    fromName: 'Destrave o Alinhador',
  });
}

async function receive(req, res) {
  if (!isTokenValid(req)) {
    return res.status(401).json({ ok: false, message: 'Token inválido.' });
  }

  try {
    await ensureEbookTable();

    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const eventName = normalizeValue(readNested(payload, ['event', 'type', 'data.event'])) || '';
    const upperEvent = eventName.toUpperCase();

    const approvedEvents = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE', 'APPROVED'];
    if (!approvedEvents.includes(upperEvent)) {
      return res.status(200).json({ ok: true, message: `Evento ${eventName} ignorado.` });
    }

    const transaction = normalizeValue(readNested(payload, [
      'purchase.transaction', 'data.purchase.transaction', 'transaction',
    ]));
    const buyerEmail = normalizeValue(readNested(payload, [
      'buyer.email', 'purchase.buyer.email', 'data.buyer.email', 'data.purchase.buyer.email',
    ]));
    const buyerName = normalizeValue(readNested(payload, [
      'buyer.name', 'purchase.buyer.name', 'data.buyer.name', 'data.purchase.buyer.name',
    ]));
    const productName = normalizeValue(readNested(payload, [
      'product.name', 'purchase.product.name', 'data.product.name',
    ]));

    if (!transaction || !buyerEmail) {
      return res.status(200).json({ ok: true, message: 'Dados insuficientes no payload.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, email_sent FROM ebook_purchases WHERE transaction_code = ? LIMIT 1',
      [transaction]
    );

    if (rows.length) {
      return res.status(200).json({ ok: true, message: 'Transação já registrada.' });
    }

    const amountRaw = readNested(payload, [
      'purchase.price.value', 'data.purchase.price.value', 'purchase.price', 'amount',
    ]);
    const amountCents = amountRaw ? Math.round(Number(amountRaw) * 100) : null;

    await pool.execute(
      `INSERT INTO ebook_purchases
        (transaction_code, buyer_email, buyer_name, product_name, amount_cents, hotmart_payload, email_sent)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [transaction, buyerEmail, buyerName, productName, amountCents, JSON.stringify(payload)]
    );

    const emailResult = await sendEbookDeliveryEmail({ buyerEmail, buyerName, transactionCode: transaction });
    const emailSent = Boolean(emailResult && emailResult.ok);

    if (emailSent) {
      await pool.execute(
        'UPDATE ebook_purchases SET email_sent = 1 WHERE transaction_code = ?',
        [transaction]
      );
    }

    console.log('[Ebook Webhook] Compra registrada:', { transaction, buyerEmail, emailSent });

    return res.status(200).json({
      ok: true,
      message: 'Compra do ebook processada.',
      transaction,
      emailSent,
    });
  } catch (err) {
    console.error('[Ebook Webhook] Erro:', err);
    return res.status(500).json({ ok: false, message: 'Erro interno ao processar webhook.' });
  }
}

module.exports = { receive };
