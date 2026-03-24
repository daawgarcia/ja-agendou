const nodemailer = require('nodemailer');

let transporter;

function getEmailConfig() {
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST || '';
  const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
  const user = process.env.SMTP_USER || process.env.MAIL_USER || process.env.MAIL_USERNAME || '';
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.MAIL_PASSWORD || '';
  const secureRaw = process.env.SMTP_SECURE || process.env.MAIL_SECURE;
  const secure = typeof secureRaw === 'string'
    ? secureRaw.toLowerCase() === 'true'
    : port === 465;

  return {
    host,
    port,
    user,
    pass,
    secure,
  };
}

function isEmailConfigured() {
  const config = getEmailConfig();
  return Boolean(config.host && config.port && config.user && config.pass);
}

function getTransporter() {
  if (transporter) return transporter;

  const config = getEmailConfig();

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return transporter;
}

function buildFromAddress(fromName) {
  const config = getEmailConfig();
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.MAIL_FROM || config.user || 'no-reply@jaagendou.app';
  const safeName = String(fromName || '').trim().replace(/"/g, '');
  return safeName ? `"${safeName}" <${fromEmail}>` : fromEmail;
}

async function sendEmail({ to, subject, html, text, fromName }) {
  if (!to) {
    return { ok: false, skipped: true, reason: 'missing-recipient' };
  }

  if (!isEmailConfigured()) {
    return { ok: false, skipped: true, reason: 'smtp-not-configured' };
  }

  const from = buildFromAddress(fromName);

  try {
    await getTransporter().sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

module.exports = {
  isEmailConfigured,
  sendEmail,
};
