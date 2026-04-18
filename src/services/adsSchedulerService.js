const cron = require('node-cron');
const https = require('https');
const crypto = require('crypto');
const { analisarCampanhas } = require('./adsAgentService');
const { sendEmail } = require('./emailService');

const TOKEN = process.env.META_TOKEN || '';
const ACCT  = process.env.META_ACCOUNT || 'act_831197689419908';
const BASE  = 'https://graph.facebook.com/v21.0';
const REPORT_EMAIL = 'otavio.garcia@outlook.com';
const CPL_LIMITE = 30;

// Ações pendentes de aprovação: token -> { campanhaId, campanhaNome, acao, motivo, expiresAt }
const pendentes = new Map();

function apiPost(endpoint, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ ...body, access_token: TOKEN });
    const url = new URL(`${BASE}${endpoint}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    };
    const req = https.request(options, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function pausarCampanha(campaignId) {
  return apiPost(`/${campaignId}`, { status: 'PAUSED' });
}

function calcularCPL(campanha) {
  if (!campanha.leads || campanha.leads === 0) return null;
  return parseFloat(campanha.gasto) / campanha.leads;
}

function criarTokenAcao({ campanhaId, campanhaNome, acao, motivo }) {
  const token = crypto.randomBytes(24).toString('hex');
  pendentes.set(token, {
    campanhaId,
    campanhaNome,
    acao,
    motivo,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
  });
  return token;
}

function getBaseUrl() {
  return (process.env.BASE_URL || 'https://jaagendou.app').replace(/\/$/, '');
}

function gerarEmailHTML({ analise, acoesPendentes, alertasManuais, resumo, dataExecucao }) {
  const acoesHTML = acoesPendentes.length > 0
    ? acoesPendentes.map(a => `
        <tr>
          <td style="padding:12px 10px;border-bottom:1px solid #2a2d3a;color:#e2e8f0;font-size:13px">${a.campanhaNome}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #2a2d3a;color:#fbbf24;font-size:13px">${a.acao}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #2a2d3a;color:#94a3b8;font-size:13px">${a.motivo}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #2a2d3a">
            <a href="${getBaseUrl()}/meta-ads/agente/aprovar?token=${a.token}" style="background:#16a34a;color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;margin-right:6px">✅ Aprovar</a>
            <a href="${getBaseUrl()}/meta-ads/agente/rejeitar?token=${a.token}" style="background:#dc2626;color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600">❌ Rejeitar</a>
          </td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding:12px;color:#4ade80;text-align:center;font-size:13px">✅ Nenhuma ação necessária esta semana</td></tr>`;

  const alertasHTML = alertasManuais.length > 0
    ? alertasManuais.map(a => `<li style="margin:8px 0;color:#fbbf24;font-size:13px">${a}</li>`).join('')
    : `<li style="color:#4ade80;font-size:13px">Nenhum alerta esta semana.</li>`;

  const analiseFormatada = analise
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^## (.+)$/gm, '<h3 style="color:#a5b4fc;font-size:14px;margin:16px 0 6px">$1</h3>')
    .replace(/^- (.+)$/gm, '<li style="color:#cbd5e1;margin:4px 0">$1</li>')
    .replace(/\n\n/g, '</p><p style="color:#94a3b8;margin:8px 0">');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',system-ui,sans-serif">
  <div style="max-width:700px;margin:0 auto;padding:32px 24px">

    <div style="background:linear-gradient(135deg,#1e1b4b,#1a1d27);border:1px solid #3730a3;border-radius:16px;padding:28px;margin-bottom:24px;text-align:center">
      <div style="font-size:40px;margin-bottom:8px">🤖</div>
      <h1 style="color:#e2e8f0;font-size:22px;margin:0 0 6px">Relatório Semanal — Meta Ads</h1>
      <p style="color:#6366f1;margin:0;font-size:13px">Já Agendou · ${dataExecucao}</p>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
      <div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:12px;padding:16px;text-align:center">
        <p style="color:#64748b;font-size:11px;margin:0 0 4px">Total Gasto (30d)</p>
        <p style="color:#4ade80;font-size:22px;font-weight:700;margin:0">R$ ${parseFloat(resumo.totalGasto).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
      </div>
      <div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:12px;padding:16px;text-align:center">
        <p style="color:#64748b;font-size:11px;margin:0 0 4px">Leads Gerados</p>
        <p style="color:#60a5fa;font-size:22px;font-weight:700;margin:0">${resumo.totalLeads}</p>
      </div>
      <div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:12px;padding:16px;text-align:center">
        <p style="color:#64748b;font-size:11px;margin:0 0 4px">Campanhas</p>
        <p style="color:#a78bfa;font-size:22px;font-weight:700;margin:0">${resumo.campanhas.length}</p>
      </div>
    </div>

    <div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:12px;padding:20px;margin-bottom:24px">
      <h2 style="color:#e2e8f0;font-size:15px;margin:0 0 4px">⚡ Ações Sugeridas pelo Agente</h2>
      <p style="color:#64748b;font-size:12px;margin:0 0 16px">Clique em Aprovar para executar ou Rejeitar para ignorar. Links válidos por 7 dias.</p>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#0f1117">
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-weight:500;font-size:12px">Campanha</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-weight:500;font-size:12px">Ação</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-weight:500;font-size:12px">Motivo</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-weight:500;font-size:12px">Decisão</th>
          </tr>
        </thead>
        <tbody>${acoesHTML}</tbody>
      </table>
    </div>

    <div style="background:#1c1100;border:1px solid #92400e;border-radius:12px;padding:20px;margin-bottom:24px">
      <h2 style="color:#fbbf24;font-size:15px;margin:0 0 12px">🔔 Requer Sua Atenção Manual</h2>
      <ul style="margin:0;padding-left:20px">${alertasHTML}</ul>
    </div>

    <div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:12px;padding:20px;margin-bottom:24px">
      <h2 style="color:#e2e8f0;font-size:15px;margin:0 0 16px">📊 Análise Completa do Agente</h2>
      <div style="font-size:13px;line-height:1.7"><p style="color:#94a3b8;margin:8px 0">${analiseFormatada}</p></div>
    </div>

    <div style="text-align:center;padding-top:16px;border-top:1px solid #1e293b">
      <p style="color:#334155;font-size:11px;margin:0">Já Agendou · Agente IA de Meta Ads · Análise automática semanal</p>
    </div>
  </div>
</body>
</html>`;
}

async function executarAnaliseCompleta(dadosMeta) {
  console.log('[Agente IA] Iniciando análise semanal...');

  const resultado = await analisarCampanhas(dadosMeta);
  const { analise, resumo } = resultado;

  const acoesPendentes = [];
  const alertasManuais = [];

  for (const campanha of resumo.campanhas) {
    if (campanha.status !== 'ACTIVE') continue;

    const cpl = calcularCPL(campanha);
    const campId = dadosMeta.campaigns?.data?.find(c => c.name === campanha.nome)?.id;

    if (cpl !== null && cpl > CPL_LIMITE && campId) {
      const token = criarTokenAcao({
        campanhaId: campId,
        campanhaNome: campanha.nome,
        acao: '⏸ Pausar campanha',
        motivo: `CPL de R$ ${cpl.toFixed(2)} está acima do limite de R$ ${CPL_LIMITE}`,
      });
      acoesPendentes.push({ token, campanhaNome: campanha.nome, acao: '⏸ Pausar campanha', motivo: `CPL R$ ${cpl.toFixed(2)} > limite R$ ${CPL_LIMITE}` });
    }

    if (parseFloat(campanha.frequencia) > 3.5) {
      alertasManuais.push(`🎨 <strong>${campanha.nome}</strong>: frequência ${parseFloat(campanha.frequencia).toFixed(1)} — trocar criativo`);
    }
    if (parseFloat(campanha.ctr) > 0 && parseFloat(campanha.ctr) < 0.5) {
      alertasManuais.push(`📉 <strong>${campanha.nome}</strong>: CTR ${parseFloat(campanha.ctr).toFixed(2)}% — revisar público ou criativo`);
    }
  }

  const dataExecucao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const html = gerarEmailHTML({ analise, acoesPendentes, alertasManuais, resumo, dataExecucao });

  const emailResult = await sendEmail({
    to: REPORT_EMAIL,
    subject: `🤖 Relatório Semanal Meta Ads — ${new Date().toLocaleDateString('pt-BR')}`,
    html,
    fromName: 'Agente IA — Já Agendou',
  });

  if (emailResult.ok) {
    console.log(`[Agente IA] E-mail enviado para ${REPORT_EMAIL} com ${acoesPendentes.length} ação(ões) pendente(s)`);
  } else {
    console.warn('[Agente IA] Falha ao enviar e-mail:', emailResult.reason || emailResult.error?.message);
  }

  return { acoesPendentes, alertasManuais, emailEnviado: emailResult.ok };
}

async function aprovarAcao(token) {
  const acao = pendentes.get(token);
  if (!acao) return { ok: false, motivo: 'Token inválido ou expirado.' };
  if (Date.now() > acao.expiresAt) {
    pendentes.delete(token);
    return { ok: false, motivo: 'Este link expirou (válido por 7 dias).' };
  }
  await pausarCampanha(acao.campanhaId);
  pendentes.delete(token);
  console.log(`[Agente IA] Aprovado: ${acao.campanhaNome} — ${acao.acao}`);
  return { ok: true, campanhaNome: acao.campanhaNome, acao: acao.acao };
}

function rejeitarAcao(token) {
  const acao = pendentes.get(token);
  if (!acao) return { ok: false, motivo: 'Token inválido ou expirado.' };
  pendentes.delete(token);
  console.log(`[Agente IA] Rejeitado: ${acao.campanhaNome} — ${acao.acao}`);
  return { ok: true, campanhaNome: acao.campanhaNome, acao: acao.acao };
}

function iniciarScheduler(getCacheData) {
  cron.schedule('0 8 * * 1', async () => {
    const dados = getCacheData();
    if (!dados) { console.warn('[Agente IA] Scheduler: sem dados, pulando.'); return; }
    try { await executarAnaliseCompleta(dados); } catch (err) { console.error('[Agente IA] Erro:', err.message); }
  }, { timezone: 'America/Sao_Paulo' });

  console.log('[Agente IA] Scheduler ativo — toda segunda-feira às 08:00 (Brasília)');
}

module.exports = { iniciarScheduler, executarAnaliseCompleta, aprovarAcao, rejeitarAcao };
