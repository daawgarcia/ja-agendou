// Coleta os números da LP do ebook Ronco e Apneia no PostHog (últimas 24h vs. 24h anteriores).
// Uso: POSTHOG_PERSONAL_API_KEY=phx_... node scripts/posthog-daily-report.js  → imprime JSON no stdout.

const KEY = (process.env.POSTHOG_PERSONAL_API_KEY || '').trim();
if (!KEY) { console.error('ERRO: defina POSTHOG_PERSONAL_API_KEY'); process.exit(1); }
const HOST = 'https://us.posthog.com';
const PROJECT = 695419;
const LP = '%ebook-ronco-apneia%';

async function hogql(query) {
  const res = await fetch(`${HOST}/api/projects/${PROJECT}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  return json.results.map((row) => Object.fromEntries(json.columns.map((c, i) => [c, row[i]])));
}

// janela: 0 = últimas 24h, 1 = 24h anteriores
const win = (w) => `timestamp > now() - interval ${24 * (w + 1)} hour and timestamp <= now() - interval ${24 * w} hour`;
const onLp = `properties.$current_url like '${LP}'`;

async function resumo(w) {
  const [r] = await hogql(`
    select
      uniqIf(distinct_id, event = '$pageview') as visitantes,
      countIf(event = '$pageview') as pageviews,
      uniqIf(distinct_id, event = 'section_viewed' and properties.section = 'oferta') as viram_oferta,
      uniqIf(distinct_id, event = 'checkout_click') as clicaram_comprar,
      countIf(event = 'checkout_click') as cliques_comprar,
      uniqIf(distinct_id, event = 'exit_popup_shown') as viram_popup,
      round(avgIf(toFloat(properties.$prev_pageview_max_scroll_percentage), event = '$pageleave') * 100, 1) as scroll_medio_pct,
      round(avgIf(toFloat(properties.$prev_pageview_duration), event = '$pageleave'), 1) as tempo_medio_s
    from events where ${win(w)} and ${onLp}`);
  return r;
}

async function main() {
  const out = { gerado_em: new Date().toISOString(), janela: 'últimas 24h', projeto: PROJECT };
  out.hoje = await resumo(0);
  out.ontem = await resumo(1);

  out.secoes = await hogql(`
    select properties.section as secao, toInt(properties.position) as posicao, uniq(distinct_id) as pessoas
    from events where ${win(0)} and event = 'section_viewed' and ${onLp}
    group by secao, posicao order by posicao`);

  out.botoes_comprar = await hogql(`
    select properties.source as botao, count() as cliques, uniq(distinct_id) as pessoas
    from events where ${win(0)} and event = 'checkout_click'
    group by botao order by cliques desc`);

  out.popup_saida = await hogql(`
    select properties.trigger as gatilho, uniq(distinct_id) as pessoas
    from events where ${win(0)} and event = 'exit_popup_shown' and ${onLp}
    group by gatilho order by pessoas desc`);

  out.dispositivos = await hogql(`
    select properties.$device_type as dispositivo, uniq(distinct_id) as visitantes
    from events where ${win(0)} and event = '$pageview' and ${onLp}
    group by dispositivo order by visitantes desc`);

  out.origens = await hogql(`
    select coalesce(properties.utm_source, properties.$referring_domain, '$direct') as origem,
           properties.utm_campaign as campanha, uniq(distinct_id) as visitantes
    from events where ${win(0)} and event = '$pageview' and ${onLp}
    group by origem, campanha order by visitantes desc limit 10`);

  out.cliques_mais_comuns = await hogql(`
    select properties.$el_text as texto, count() as cliques, uniq(distinct_id) as pessoas
    from events where ${win(0)} and event = '$autocapture' and properties.$event_type = 'click' and ${onLp}
    group by texto order by cliques desc limit 10`);

  out.frustracao = await hogql(`
    select event, properties.$el_text as texto, count() as vezes
    from events where ${win(0)} and event in ('$rageclick', '$dead_click') and ${onLp}
    group by event, texto order by vezes desc limit 10`);

  const rec = await fetch(`${HOST}/api/projects/${PROJECT}/session_recordings?date_from=-24h&limit=50`, {
    headers: { Authorization: `Bearer ${KEY}` },
  }).then((r) => r.json());
  out.gravacoes = (rec.results || [])
    .filter((s) => (s.start_url || '').includes('ebook-ronco-apneia'))
    .map((s) => ({
      link: `${HOST}/project/${PROJECT}/replay/${s.id}`,
      duracao_s: s.recording_duration,
      cliques: s.click_count,
      atividade_s: s.active_seconds,
      inicio: s.start_time,
    }))
    .sort((a, b) => b.atividade_s - a.atividade_s)
    .slice(0, 8);
  out.total_gravacoes = out.gravacoes.length;

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
