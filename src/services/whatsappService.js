const https = require('https');

function getWhatsAppConfig() {
  return {
    baseUrl: process.env.WHATSAPP_BASE_URL || 'https://graph.facebook.com',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || '',
  };
}

function isWhatsAppConfigured() {
  const config = getWhatsAppConfig();
  return Boolean(config.phoneNumberId && config.accessToken);
}

function normalizePhoneForWhatsApp(value) {
  let phone = String(value || '').replace(/\D/g, '');

  if (phone.length === 10 || phone.length === 11) {
    phone = `55${phone}`;
  }

  return phone.length >= 12 ? phone : '';
}

function postJson(url, body, headers) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const request = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
      },
      (response) => {
        let raw = '';

        response.on('data', (chunk) => {
          raw += chunk;
        });

        response.on('end', () => {
          let parsed = null;
          if (raw) {
            try {
              parsed = JSON.parse(raw);
            } catch (error) {
              parsed = { raw };
            }
          }

          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            statusCode: response.statusCode,
            data: parsed,
          });
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

async function sendWhatsAppTextMessage({ to, body }) {
  if (!to) {
    return { ok: false, skipped: true, reason: 'missing-recipient' };
  }

  if (!body) {
    return { ok: false, skipped: true, reason: 'missing-message' };
  }

  if (!isWhatsAppConfigured()) {
    return { ok: false, skipped: true, reason: 'whatsapp-not-configured' };
  }

  const normalizedPhone = normalizePhoneForWhatsApp(to);
  if (!normalizedPhone) {
    return { ok: false, skipped: true, reason: 'invalid-recipient' };
  }

  const config = getWhatsAppConfig();
  const url = `${config.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;

  try {
    const response = await postJson(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body,
        },
      },
      {
        Authorization: `Bearer ${config.accessToken}`,
      }
    );

    if (!response.ok) {
      return {
        ok: false,
        statusCode: response.statusCode,
        error: response.data,
      };
    }

    return {
      ok: true,
      statusCode: response.statusCode,
      data: response.data,
    };
  } catch (error) {
    return { ok: false, error };
  }
}

module.exports = {
  isWhatsAppConfigured,
  normalizePhoneForWhatsApp,
  sendWhatsAppTextMessage,
};