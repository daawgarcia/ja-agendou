const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function resumirDados(dados) {
  const campaigns = (dados.campaigns?.data || []);
  const insights = (dados.insights_totals?.data || []);
  const insightsDiarios = (dados.insights_campaigns_daily?.data || []);

  const campResumo = campaigns.map(c => {
    const ins = insights.find(i => i.campaign_id === c.id) || {};
    return {
      nome: c.name,
      status: c.status,
      objetivo: c.objective,
      gasto: ins.spend || '0',
      impressoes: ins.impressions || '0',
      cliques: ins.clicks || '0',
      ctr: ins.ctr || '0',
      cpc: ins.cpc || '0',
      cpm: ins.cpm || '0',
      frequencia: ins.frequency || '0',
      leads: (ins.actions || []).filter(a => a.action_type === 'lead').reduce((s, a) => s + parseInt(a.value || 0), 0),
    };
  });

  const totalGasto = insights.reduce((s, i) => s + parseFloat(i.spend || 0), 0).toFixed(2);
  const totalLeads = insights.reduce((s, i) => {
    return s + (i.actions || []).filter(a => a.action_type === 'lead').reduce((x, a) => x + parseInt(a.value || 0), 0);
  }, 0);

  return { campanhas: campResumo, totalGasto, totalLeads, moeda: dados.account?.currency || 'BRL' };
}

async function analisarCampanhas(dados) {
  const resumo = resumirDados(dados);

  const prompt = `Você é um especialista em performance de Meta Ads para SaaS B2B, especificamente para o produto "Já Agendou" — um sistema de agendamento odontológico vendido para clínicas dentárias no Brasil.

Analise os dados das campanhas dos últimos 30 dias e gere um relatório em português com:

1. **Resumo geral** — visão rápida do que está acontecendo
2. **Análise por campanha** — o que está bem e o que está ruim em cada uma
3. **Alertas críticos** — problemas que precisam de atenção imediata (frequência alta, CPL elevado, orçamento desperdiçado)
4. **Recomendações acionáveis** — o que fazer agora (pausar, escalar, ajustar criativo, público, etc.)
5. **Prioridade de ações** — lista ordenada do mais urgente para o menos urgente

Contexto do produto:
- Ticket médio: R$ 35-107/mês por clínica
- Público-alvo: donos de clínicas odontológicas, recepcionistas e gestores
- Objetivo principal das campanhas: geração de leads (trial gratuito)
- CPL aceitável: até R$ 15. Acima disso é preocupante. Acima de R$ 30 é crítico.
- CTR esperado: acima de 1.5% é bom. Abaixo de 0.8% é ruim.
- Frequência: acima de 3.5 indica fadiga de criativo.

Dados das campanhas:
${JSON.stringify(resumo, null, 2)}

Seja direto, objetivo e use linguagem simples. Destaque números em negrito. Use emojis para facilitar a leitura visual.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: 'Você é um especialista em tráfego pago e Meta Ads para SaaS brasileiro. Responda sempre em português do Brasil com análises práticas e acionáveis.',
    messages: [{ role: 'user', content: prompt }],
  });

  return {
    analise: response.content[0].text,
    resumo,
    geradoEm: new Date().toLocaleString('pt-BR'),
  };
}

module.exports = { analisarCampanhas };
