const https = require('https');
const { analisarCampanhas } = require('../services/adsAgentService');
const { executarAnaliseCompleta, aprovarAcao, rejeitarAcao } = require('../services/adsSchedulerService');

const TOKEN   = process.env.META_TOKEN    || '';
const ACCT    = process.env.META_ACCOUNT  || 'act_831197689419908';
const PASSWORD = process.env.META_DASHBOARD_PASSWORD || 'jaagendou@2025';
const BASE    = 'https://graph.facebook.com/v21.0';

// Cache em memória — atualiza a cada hora
let cache = { data: null, updatedAt: null, error: null };

function apiGet(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const q = new URLSearchParams({ ...params, access_token: TOKEN }).toString();
    https.get(`${BASE}${endpoint}?${q}`, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

async function fetchMetaData() {
  if (!TOKEN) { cache.error = 'META_TOKEN não configurado'; return; }
  console.log(`[Meta Ads] Atualizando dados... ${new Date().toLocaleTimeString('pt-BR')}`);
  try {
    const [account, campaignsRaw, adsetsRaw] = await Promise.all([
      apiGet(`/${ACCT}`, { fields: 'id,name,currency,timezone_name,amount_spent,balance' }),
      apiGet(`/${ACCT}/campaigns`, { fields: 'id,name,objective,status,daily_budget,lifetime_budget,bid_strategy,created_time', limit: 50 }),
      apiGet(`/${ACCT}/adsets`,    { fields: 'id,name,campaign_id,status,optimization_goal,billing_event,daily_budget,lifetime_budget,targeting', limit: 100 }),
    ]);

    const campaignIds = (campaignsRaw.data || []).map(c => c.id);

    const [insightsCampaignsDaily, insightsTotal] = await Promise.all([
      Promise.all(campaignIds.map(id =>
        apiGet(`/${id}/insights`, {
          fields: 'campaign_id,campaign_name,impressions,reach,clicks,ctr,cpc,cpm,spend,frequency,actions',
          date_preset: 'last_30d',
          time_increment: 1,
          limit: 50,
        }).then(r => r.data || []).catch(() => [])
      )).then(arr => arr.flat()),
      apiGet(`/${ACCT}/insights`, {
        fields: 'campaign_id,campaign_name,impressions,reach,clicks,ctr,cpc,cpm,spend,frequency,actions',
        date_preset: 'last_30d',
        limit: 50,
      }).catch(() => ({ data: [] })),
    ]);

    cache = {
      data: {
        account,
        campaigns:              { data: campaignsRaw.data || [] },
        adsets:                 { data: adsetsRaw.data    || [] },
        insights_campaigns_daily: { data: insightsCampaignsDaily },
        insights_totals:          insightsTotal,
      },
      updatedAt: new Date(),
      error: null,
    };
    const campCount = (campaignsRaw.data || []).length;
    if (account.error) console.warn('[Meta Ads] Aviso: erro ao buscar conta:', account.error.message);
    if (campaignsRaw.error) console.warn('[Meta Ads] Aviso: erro ao buscar campanhas:', campaignsRaw.error.message);
    console.log(`[Meta Ads] OK — ${campCount} campanhas, conta: ${account.name || '(erro de conta)'}`);
  } catch (err) {
    cache.error = err.message;
    console.error('[Meta Ads] Erro:', err.message);
  }
}

// Busca inicial + refresh a cada hora
fetchMetaData();
setInterval(fetchMetaData, 60 * 60 * 1000);

// ── Controllers ───────────────────────────────────────────────────────────────
exports.showLogin = (req, res) => {
  if (req.session.metaAdsAuth) return res.redirect('/meta-ads');
  res.render('meta-ads/login', { erro: req.query.erro || null });
};

exports.handleLogin = (req, res) => {
  if ((req.body.password || '').trim() === PASSWORD) {
    req.session.metaAdsAuth = true;
    return res.redirect('/meta-ads');
  }
  res.redirect('/meta-ads/login?erro=1');
};

exports.handleLogout = (req, res) => {
  req.session.metaAdsAuth = false;
  res.redirect('/meta-ads/login');
};

exports.showDashboard = (req, res) => {
  const updatedAt = cache.updatedAt
    ? cache.updatedAt.toLocaleString('pt-BR')
    : 'Nunca';
  const nextUpdateMin = cache.updatedAt
    ? Math.max(0, 60 - Math.round((Date.now() - cache.updatedAt) / 60000))
    : 0;
  res.render('meta-ads/index', { updatedAt, nextUpdateMin, error: cache.error });
};

exports.apiData = (req, res) => {
  if (!cache.data) return res.json({ error: cache.error || 'Aguardando dados...' });
  res.json(cache.data);
};

exports.getCacheData = () => cache.data;

exports.executarSemanal = async (req, res) => {
  if (!cache.data) {
    return res.json({ ok: false, erro: 'Dados não carregados ainda.' });
  }
  try {
    const resultado = await executarAnaliseCompleta(cache.data);
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.json({ ok: false, erro: err.message });
  }
};

function paginaResposta({ titulo, icone, cor, mensagem, campanha, acao }) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title>
  <script src="https://cdn.tailwindcss.com"></script></head>
  <body style="background:#0f1117;font-family:'Segoe UI',system-ui,sans-serif" class="min-h-screen flex items-center justify-center p-6">
    <div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:16px;padding:40px;max-width:480px;width:100%;text-align:center">
      <div style="font-size:56px;margin-bottom:16px">${icone}</div>
      <h1 style="color:${cor};font-size:22px;font-weight:700;margin:0 0 8px">${titulo}</h1>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 16px">${mensagem}</p>
      ${campanha ? `<div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:20px;text-align:left">
        <p style="color:#64748b;font-size:11px;margin:0 0 4px">Campanha</p>
        <p style="color:#e2e8f0;font-size:13px;font-weight:600;margin:0">${campanha}</p>
        <p style="color:#64748b;font-size:11px;margin:8px 0 4px">Ação</p>
        <p style="color:#fbbf24;font-size:13px;margin:0">${acao}</p>
      </div>` : ''}
      <a href="/meta-ads" style="background:#6366f1;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">Ir para o Dashboard</a>
    </div>
  </body></html>`;
}

exports.aprovarAcao = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send(paginaResposta({ titulo: 'Token inválido', icone: '❌', cor: '#f87171', mensagem: 'Nenhum token fornecido.' }));
  try {
    const resultado = await aprovarAcao(token);
    if (!resultado.ok) {
      return res.send(paginaResposta({ titulo: 'Link expirado', icone: '⏰', cor: '#fbbf24', mensagem: resultado.motivo }));
    }
    res.send(paginaResposta({ titulo: 'Ação aprovada!', icone: '✅', cor: '#4ade80', mensagem: 'A ação foi executada com sucesso.', campanha: resultado.campanhaNome, acao: resultado.acao }));
  } catch (err) {
    res.send(paginaResposta({ titulo: 'Erro', icone: '❌', cor: '#f87171', mensagem: `Erro ao executar: ${err.message}` }));
  }
};

exports.rejeitarAcao = (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send(paginaResposta({ titulo: 'Token inválido', icone: '❌', cor: '#f87171', mensagem: 'Nenhum token fornecido.' }));
  const resultado = rejeitarAcao(token);
  if (!resultado.ok) {
    return res.send(paginaResposta({ titulo: 'Link expirado', icone: '⏰', cor: '#fbbf24', mensagem: resultado.motivo }));
  }
  res.send(paginaResposta({ titulo: 'Ação rejeitada', icone: '🚫', cor: '#94a3b8', mensagem: 'A ação foi descartada. Nenhuma alteração foi feita.', campanha: resultado.campanhaNome, acao: resultado.acao }));
};

exports.apiRefresh = async (req, res) => {
  await fetchMetaData();
  res.json({ ok: true, updatedAt: cache.updatedAt });
};

exports.requireAuth = (req, res, next) => {
  if (req.session.metaAdsAuth) return next();
  res.redirect('/meta-ads/login');
};

exports.showAgente = (req, res) => {
  const campanhas = cache.data?.campaigns?.data || [];
  const maisRecente = campanhas.reduce((mais, c) => {
    const d = new Date(c.created_time || 0);
    return d > mais ? d : mais;
  }, new Date(0));
  const diasDesde = maisRecente.getTime() > 0
    ? Math.floor((Date.now() - maisRecente.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  res.render('meta-ads/agente', { resultado: null, erro: null, diasDesde });
};

exports.analisarAgente = async (req, res) => {
  if (!cache.data) {
    return res.render('meta-ads/agente', { resultado: null, erro: 'Dados ainda não carregados. Aguarde e tente novamente.', diasDesde: null });
  }
  try {
    const resultado = await analisarCampanhas(cache.data);
    res.render('meta-ads/agente', { resultado, erro: null, diasDesde: null });
  } catch (err) {
    console.error('[Agente IA]', err.message);
    res.render('meta-ads/agente', { resultado: null, erro: `Erro ao chamar o agente: ${err.message}`, diasDesde: null });
  }
};
