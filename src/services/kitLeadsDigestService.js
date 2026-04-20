const cron = require('node-cron');
const pool = require('../config/db');
const { sendEmail, isEmailConfigured } = require('./emailService');

const DIGEST_RECIPIENT = 'no-reply@jaagendou.app';

async function enviarDigest() {
  try {
    const [leads] = await pool.execute(
      `SELECT id, email, criado_em
       FROM kit_leads
       WHERE digest_enviado = 0
       ORDER BY criado_em ASC`
    );

    if (!leads.length) {
      console.log('[KitLeads] Nenhum lead novo para enviar no digest.');
      return;
    }

    if (!isEmailConfigured()) {
      console.warn('[KitLeads] SMTP não configurado — digest não enviado. Leads:', leads.map(l => l.email));
      return;
    }

    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const linhasHtml = leads.map(l => {
      const hora = new Date(l.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e8edf3;">${l.email}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8edf3;color:#64748b;">${hora}</td>
      </tr>`;
    }).join('');

    const htmlBody = `
      <div style="font-family:Segoe UI,Arial,sans-serif;background:#f4f7fb;padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dbe6f2;border-radius:14px;overflow:hidden;">
          <div style="background:linear-gradient(140deg,#0D1B40,#162354);padding:20px 24px;color:#fff;">
            <h2 style="margin:0;font-size:22px;">📬 Digest de Leads — Kit Recepção</h2>
            <p style="margin:6px 0 0;font-size:13px;opacity:0.8;">${hoje} · ${leads.length} novo${leads.length > 1 ? 's' : ''} lead${leads.length > 1 ? 's' : ''} capturado${leads.length > 1 ? 's' : ''}</p>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 16px;color:#243447;">Esses e-mails foram capturados pelo popup do <strong>kit-recepcao</strong> hoje:</p>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e8edf3;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f0f6ff;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#5a6b7d;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">E-mail</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#5a6b7d;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Hora</th>
                </tr>
              </thead>
              <tbody>${linhasHtml}</tbody>
            </table>
            <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">Esses leads foram marcados como enviados e não aparecerão no próximo digest.</p>
          </div>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: DIGEST_RECIPIENT,
      subject: `[Kit Recepção] ${leads.length} lead${leads.length > 1 ? 's' : ''} novo${leads.length > 1 ? 's' : ''} — ${hoje}`,
      html: htmlBody,
      fromName: 'Já Agendou Leads',
    });

    if (!result.ok) {
      console.error('[KitLeads] Falha ao enviar digest:', result.error || result.reason);
      return;
    }

    const ids = leads.map(l => l.id);
    await pool.execute(
      `UPDATE kit_leads SET digest_enviado = 1 WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );

    console.log(`[KitLeads] Digest enviado com ${leads.length} lead(s) para ${DIGEST_RECIPIENT}`);
  } catch (err) {
    console.error('[KitLeads] Erro no digest:', err);
  }
}

function iniciarKitLeadsDigest() {
  // Roda todo dia às 23:45 (horário de Brasília)
  cron.schedule('45 23 * * *', enviarDigest, { timezone: 'America/Sao_Paulo' });
  console.log('[KitLeads] Digest diário ativo — todo dia às 23:45 (Brasília)');
}

module.exports = { iniciarKitLeadsDigest, enviarDigest };
