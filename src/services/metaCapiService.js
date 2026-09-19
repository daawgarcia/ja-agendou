const https = require('https');

function sendEvent(eventPayload) {
  const pixelId = process.env.FACEBOOK_PIXEL_ID;
  const accessToken = process.env.META_TOKEN;

  if (!pixelId || !accessToken) return Promise.resolve();

  const body = JSON.stringify({ data: [eventPayload] });
  const apiUrl = new URL(`https://graph.facebook.com/v21.0/${pixelId}/events`);
  apiUrl.searchParams.set('access_token', accessToken);

  return new Promise((resolve) => {
    const req = https.request(apiUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[META CAPI] ${eventPayload.event_name} enviado. Status:`, res.statusCode);
        } else {
          console.error(`[META CAPI] Erro ao enviar ${eventPayload.event_name}:`, res.statusCode, raw);
        }
        resolve();
      });
    });
    req.on('error', (e) => { console.error('[META CAPI] Erro de rede:', e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

module.exports = { sendEvent };
