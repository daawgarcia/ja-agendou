const nodemailer = require('nodemailer');

let transporter;

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST
      && process.env.SMTP_PORT
      && process.env.SMTP_USER
      && process.env.SMTP_PASS
  );
}

function getTransporter() {
  if (transporter) return transporter;

  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  if (!to) {
    return { ok: false, skipped: true, reason: 'missing-recipient' };
  }

  if (!isEmailConfigured()) {
    return { ok: false, skipped: true, reason: 'smtp-not-configured' };
  }

  const from = 'no-reply@jaagendou.app';

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
