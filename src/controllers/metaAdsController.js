const https = require('https');

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
    console.log(`[Meta Ads] OK — ${(campaignsRaw.data || []).length} campanhas`);
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

exports.apiRefresh = async (req, res) => {
  await fetchMetaData();
  res.json({ ok: true, updatedAt: cache.updatedAt });
};

exports.requireAuth = (req, res, next) => {
  if (req.session.metaAdsAuth) return next();
  res.redirect('/meta-ads/login');
};
