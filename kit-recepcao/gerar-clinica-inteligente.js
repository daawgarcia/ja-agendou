const PDFDocument = require('pdfkit');
const fs = require('fs');

const OUTPUT = 'C:/Users/otavi/Pictures/ja-agendou/kit-recepcao/Clinica_Inteligente_Guia_Completo.pdf';

// ── Paleta ──────────────────────────────────────────────────────────────────
const NAVY  = '#0D1B40';
const NAVY2 = '#162354';
const OURO  = '#C9A84C';
const VERDE = '#2ECC71';
const CINZA = '#F4F4F8';
const TEXTO = '#1A1A2E';
const MGRAY = '#8A9BB0';
const WHITE = '#FFFFFF';

// ── Geometria A4 ─────────────────────────────────────────────────────────────
const W  = 595.28;
const H  = 841.89;
const ML = 60;          // margem esquerda
const MR = 60;          // margem direita
const TW = W - ML - MR; // 475.28 — largura útil
const BOTTOM_SAFE = H - 72; // não desenhar abaixo daqui

const doc = new PDFDocument({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 }, bufferPages: true });
doc.pipe(fs.createWriteStream(OUTPUT));

// ── Utilitários ──────────────────────────────────────────────────────────────

/** Retorna a altura real de um texto com a fonte/tamanho já configurados */
function measureText(text, width, lineGap = 3) {
  return doc.heightOfString(text, { width, lineGap });
}

/** Adiciona nova página e reinicia doc.y logo abaixo do header */
function newPage() {
  doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
}

/** Garante espaço suficiente; adiciona página se necessário */
function ensureSpace(needed) {
  if (doc.y + needed > BOTTOM_SAFE) {
    newPage();
    doc.y = 80;
  }
}

// ── Componentes de layout ────────────────────────────────────────────────────

function capa() {
  // Fundo
  doc.rect(0, 0, W, H).fill(NAVY);
  // Círculos decorativos
  doc.circle(W + 60, -60, 280).fill(NAVY2);
  doc.circle(-40, H + 40, 220).fill(NAVY2);
  // Barras ouro
  doc.rect(0, 0, W, 6).fill(OURO);
  doc.rect(0, H - 6, W, 6).fill(OURO);
  // Tag produto
  doc.fillColor(OURO).font('Helvetica').fontSize(10)
     .text('jaagendou.app  ·  PRODUTO PREMIUM', 0, 36, { align: 'center', width: W });
  // Linha decorativa
  doc.rect(W / 2 - 130, 58, 260, 1).fill(OURO);
  // Subtítulo acima
  doc.fillColor('#BBCCDD').font('Helvetica').fontSize(12)
     .text('GUIA COMPLETO PARA DENTISTAS QUE QUEREM ESCALAR', 0, 74, { align: 'center', width: W });
  // Título principal
  doc.fillColor(OURO).font('Helvetica-Bold').fontSize(52)
     .text('Clínica', 0, 118, { align: 'center', width: W });
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(52)
     .text('Inteligente', 0, 176, { align: 'center', width: W });
  // Linha
  doc.rect(W / 2 - 150, 242, 300, 1).fillOpacity(0.25).fill(WHITE);
  doc.fillOpacity(1);
  // Subtemas
  doc.fillColor(MGRAY).font('Helvetica').fontSize(12)
     .text('Gestão · Marketing · Automação · Financeiro · Jurídico', 0, 258, { align: 'center', width: W });
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
     .text('Para Dentistas que Querem Escalar Resultados', 0, 282, { align: 'center', width: W });
  // Divisor
  doc.rect(W / 2 - 130, 312, 260, 1).fill(OURO);
  // Lista de módulos
  doc.fillColor(OURO).font('Helvetica-Bold').fontSize(10)
     .text('10 MÓDULOS', 0, 328, { align: 'center', width: W });
  const mods = [
    'Gestão Estratégica', 'Finanças Clínicas', 'Marketing Digital',
    'Automação e Sistemas', 'Equipe de Alta Performance', 'Precificação Inteligente',
    'Expansão e Escala', 'Rotina do CEO Dentista', 'Jurídico e Compliance', 'Plano de 90 Dias',
  ];
  mods.forEach((m, i) => {
    const col = i % 2 === 0 ? W / 2 - 215 : W / 2 + 15;
    const row = 350 + Math.floor(i / 2) * 22;
    doc.fillColor('#BBCCDD').font('Helvetica').fontSize(10).text('◆ ' + m, col, row, { width: 200 });
  });
  // Rodapé
  doc.fillColor('#333355').font('Helvetica').fontSize(9)
     .text('© 2026 jaagendou.app — Uso pessoal. Proibida reprodução ou revenda.', 0, H - 30, { align: 'center', width: W });
}

function headerModulo(num, titulo, sub) {
  doc.rect(0, 0, W, 130).fill(NAVY);
  doc.rect(0, 130, W, 3).fill(OURO);
  doc.fillColor(OURO).font('Helvetica-Bold').fontSize(10)
     .text(`MÓDULO ${num}`, ML, 26, { align: 'center', width: TW });
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
     .text(titulo, ML, 48, { align: 'center', width: TW });
  if (sub) {
    doc.fillColor(MGRAY).font('Helvetica').fontSize(11)
       .text(sub, ML, 88, { align: 'center', width: TW });
  }
  doc.y = 148;
}

function headerSimples(titulo, sub) {
  doc.rect(0, 0, W, 90).fill(NAVY);
  doc.rect(0, 90, W, 3).fill(OURO);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(20)
     .text(titulo, ML, 26, { align: 'center', width: TW });
  if (sub) {
    doc.fillColor(OURO).font('Helvetica').fontSize(11)
       .text(sub, ML, 60, { align: 'center', width: TW });
  }
  doc.y = 108;
}

function rodape() {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.fillColor(MGRAY).font('Helvetica').fontSize(8)
       .text(`jaagendou.app  ·  Clínica Inteligente  ·  ${i + 1}`, 0, H - 18, { align: 'center', width: W });
  }
}

function secao(titulo) {
  ensureSpace(36);
  doc.moveDown(0.8);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13).text(titulo, ML, doc.y, { width: TW });
  const ly = doc.y + 4;
  doc.moveTo(ML, ly).lineTo(ML + 140, ly).stroke(OURO);
  doc.moveTo(ML + 144, ly).lineTo(ML + TW, ly).stroke('#DDDDDD');
  doc.y = ly + 10;
  doc.fillColor(TEXTO).font('Helvetica').fontSize(11);
}

function paragrafo(texto) {
  doc.fillColor(TEXTO).font('Helvetica').fontSize(11)
     .text(texto, ML, doc.y, { width: TW, align: 'justify', lineGap: 4 });
  doc.moveDown(0.5);
}

function item(texto, cor) {
  const bullet = cor === 'ouro' ? '◆' : '•';
  const corBullet = cor === 'ouro' ? OURO : VERDE;
  const INDENT = 18;
  doc.font('Helvetica').fontSize(11);
  const h = measureText(texto, TW - INDENT, 3);
  ensureSpace(h + 4);
  doc.fillColor(corBullet).font('Helvetica-Bold').fontSize(10)
     .text(bullet, ML, doc.y, { width: INDENT });
  const savedY = doc.y;
  doc.fillColor(TEXTO).font('Helvetica').fontSize(11)
     .text(texto, ML + INDENT, savedY - (doc.currentLineHeight() * 1.1), { width: TW - INDENT, lineGap: 3 });
  doc.moveDown(0.2);
}

/**
 * Caixa com fundo cinza, barra ouro lateral e lista de itens.
 * Usa heightOfString para medir cada linha → sem overflow.
 */
function boxEstrategia(titulo, itens) {
  const INNER_W = TW - 24; // largura do texto dentro da caixa (descontando padding e barra)
  const PAD_TOP = 12;
  const PAD_BOT = 14;
  const ITEM_GAP = 5;

  // Medir altura real de cada elemento
  doc.font('Helvetica-Bold').fontSize(11);
  const titleH = measureText(titulo, INNER_W);

  doc.font('Helvetica').fontSize(10);
  const itemHeights = itens.map(t => measureText('→ ' + t, INNER_W, 2));
  const totalItemsH = itemHeights.reduce((a, b) => a + b, 0) + (itens.length - 1) * ITEM_GAP;

  const boxH = PAD_TOP + titleH + 10 + totalItemsH + PAD_BOT;

  doc.moveDown(0.4);
  ensureSpace(boxH + 8);

  const startY = doc.y;

  // Fundo + barra lateral
  doc.rect(ML, startY, TW, boxH).fill(CINZA);
  doc.rect(ML, startY, 4, boxH).fill(OURO);

  // Título
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11)
     .text(titulo, ML + 16, startY + PAD_TOP, { width: INNER_W });

  // Itens
  let iy = startY + PAD_TOP + titleH + 10;
  itens.forEach((linha, i) => {
    doc.fillColor(TEXTO).font('Helvetica').fontSize(10)
       .text('→ ' + linha, ML + 16, iy, { width: INNER_W, lineGap: 2 });
    iy += itemHeights[i] + ITEM_GAP;
  });

  doc.y = startY + boxH + 10;
}

/**
 * Bloco de métrica destacado.
 */
function metrica(valor, titulo, descricao) {
  doc.font('Helvetica').fontSize(10);
  const descH = measureText(descricao, TW - 140, 2);
  const boxH = Math.max(60, 16 + descH + 20);

  doc.moveDown(0.3);
  ensureSpace(boxH + 8);

  const y = doc.y;
  doc.rect(ML, y, TW, boxH).fill(NAVY);

  // Valor + título na mesma linha
  doc.fillColor(OURO).font('Helvetica-Bold').fontSize(24)
     .text(valor, ML + 14, y + 12, { width: 120, continued: false });
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(12)
     .text(titulo, ML + 140, y + 16, { width: TW - 155 });

  // Descrição
  doc.fillColor(MGRAY).font('Helvetica').fontSize(10)
     .text(descricao, ML + 14, y + 38, { width: TW - 28, lineGap: 2 });

  doc.y = y + boxH + 10;
}

// ════════════════════════════════════════════════════════════════════════════
// CAPA
// ════════════════════════════════════════════════════════════════════════════
capa();

// ════════════════════════════════════════════════════════════════════════════
// SUMÁRIO
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerSimples('Sumário', 'Clínica Inteligente — 10 Módulos');

const sumario = [
  ['01', 'Gestão Estratégica — Pensar como Dono'],
  ['02', 'Finanças Clínicas — Do Faturamento ao Lucro Real'],
  ['03', 'Marketing Digital para Dentistas'],
  ['04', 'Automação, Sistemas e CRM Odontológico'],
  ['05', 'Equipe de Alta Performance'],
  ['06', 'Precificação Inteligente e Maximização do Lucro'],
  ['07', 'Expansão: Abrindo a Segunda Unidade'],
  ['08', 'Rotina do CEO Dentista'],
  ['09', 'Jurídico, Ética e Compliance para Clínicas'],
  ['10', 'Plano de 90 Dias para Dobrar o Faturamento'],
];

sumario.forEach(([num, nome], i) => {
  const bg = i % 2 === 0 ? WHITE : CINZA;
  doc.rect(ML, doc.y, TW, 34).fill(bg);
  doc.fillColor(OURO).font('Helvetica-Bold').fontSize(12)
     .text(`M${num}`, ML + 10, doc.y - 24, { width: 36 });
  doc.fillColor(TEXTO).font('Helvetica').fontSize(11)
     .text(nome, ML + 50, doc.y - 11, { width: TW - 60 });
  doc.moveDown(2.1);
});

// ════════════════════════════════════════════════════════════════════════════
// INTRODUÇÃO
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerSimples('Introdução', 'Por que sua clínica ainda não escala?');

paragrafo('Você estudou anos para dominar a odontologia. Aperfeiçoou sua técnica. Investiu em equipamentos. E ainda assim, ao final do mês, olha para o extrato e sente que deveria estar ganhando mais — muito mais.');
paragrafo('O problema não é sua habilidade clínica. O problema é que nenhuma faculdade ensina como gerir uma empresa de saúde. E uma clínica odontológica é exatamente isso: uma empresa complexa, com gestão de pessoas, marketing, financeiro, jurídico e operações simultâneas.');
paragrafo('Este guia foi construído para fechar essa lacuna. Cada módulo entrega o que você precisaria aprender em anos de tentativa e erro — condensado em estratégias testadas e aplicáveis imediatamente.');

boxEstrategia('O que você vai dominar neste guia', [
  'Como transformar sua clínica em um negócio previsível e escalável',
  'Estratégias de marketing digital específicas para odontologia',
  'Como precificar corretamente e parar de trabalhar no prejuízo',
  'Automação de processos para atender mais com menos esforço',
  'Como montar e liderar uma equipe de alta performance',
  'O plano de 90 dias para dobrar seu faturamento',
]);

paragrafo('Cada módulo termina com uma ação imediata. Não leia passivamente — aplique. Uma clínica inteligente é construída com decisões inteligentes, tomadas uma de cada vez.');

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO 1 — GESTÃO ESTRATÉGICA
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerModulo('01', 'Gestão Estratégica', 'Pensar como Dono, não como Operário');

secao('O Dentista-Operário vs. o Dentista-Empresário');
paragrafo('A maioria dos dentistas opera no modelo "autônomo glorificado": trabalha dentro do negócio, não sobre ele. Quando você tira férias, o faturamento para. Isso não é um negócio — é um emprego com CNPJ.');
paragrafo('O dentista-empresário constrói sistemas que funcionam independentemente de sua presença. Começa com uma mudança de perspectiva: você não é um dentista que tem uma clínica — você é um empresário da saúde que pratica odontologia.');

secao('As 3 Decisões Estratégicas que Definem o Futuro da Clínica');
['Posicionamento: Quem você quer atender e qual problema você resolve melhor',
 'Modelo de Receita: Consultas avulsas, tratamentos completos, mensalidade, convênio',
 'Modelo de Crescimento: Solo, sociedade, franquia, segunda unidade',
].forEach(f => item(f, 'ouro'));

secao('Diagnóstico Estratégico: Onde sua Clínica Está Agora');
boxEstrategia('Responda honestamente — sem eufemismos', [
  'Qual é seu faturamento médio mensal dos últimos 3 meses?',
  'Qual é seu lucro líquido real (após todos os custos)?',
  'Quantos pacientes novos você capta por mês?',
  'Qual é sua taxa de retorno de pacientes?',
  'Quantas horas por semana você trabalha clinicamente vs. gerencialmente?',
]);

secao('Planejamento Estratégico Simplificado');
paragrafo('Esqueça o plano de negócios de 50 páginas. Uma clínica precisa de clareza em 4 pontos: onde estou hoje (diagnóstico), onde quero chegar em 12 meses (meta), o que me impede de chegar lá (obstáculos) e o que farei diferente (ações).');

metrica('R$ ?', 'Meta de Faturamento Anual', 'Defina agora. Uma meta específica vale mais que mil planos vagos.');

secao('Ação Imediata — Módulo 01');
boxEstrategia('Faça hoje', [
  'Calcule seu lucro líquido do último mês (não faturamento — lucro)',
  'Escreva em 1 frase seu posicionamento atual',
  'Defina sua meta de faturamento para os próximos 12 meses',
  'Identifique o maior obstáculo que te impede de chegar lá',
]);

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO 2 — FINANÇAS CLÍNICAS
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerModulo('02', 'Finanças Clínicas', 'Do Faturamento ao Lucro Real');

secao('A Ilusão do Faturamento');
paragrafo('Faturar R$50.000/mês parece ótimo — até você descobrir que os custos são R$47.000. O faturamento é vaidade. O lucro é sanidade. Caixa é realidade.');
paragrafo('Muitos dentistas não sabem seu custo real por procedimento. Precificam no feeling, cobram abaixo do mercado ou do necessário, e trabalham mais para faturar mais — sem perceber que estão girando em falso.');

secao('Estrutura de Custos de uma Clínica Odontológica');
['Custos Fixos: aluguel, salários, contador, sistemas, internet, telefone',
 'Custos Variáveis: materiais, laboratório, comissões, manutenção',
 'Custos Ocultos: inadimplência, faltas, retrabalhos, equipamentos parados',
 'Pró-labore: sua remuneração como sócio (muitos esquecem de incluir)',
].forEach(f => item(f));

secao('Como Calcular o Custo Real de um Procedimento');
paragrafo('Fórmula: Custo = (Material + Laboratório) + (Custo Hora do Dentista × Tempo do Procedimento) + (Rateio de Custos Fixos por Hora)');
boxEstrategia('Exemplo prático — Resina Composta', [
  'Material: R$35 (resina, matriz, adesivo)',
  'Tempo clínico: 45 minutos = 0,75h',
  'Custo hora dentista (pró-labore): R$200/h → R$150 para o procedimento',
  'Rateio dos fixos (R$12.000 / 120h clínicas): R$100/h → R$75 para o procedimento',
  'Custo real total: R$35 + R$150 + R$75 = R$260',
  'Conclusão: cobrar R$200 significa trabalhar no prejuízo',
]);

secao('Indicadores Financeiros Essenciais para Monitorar Mensalmente');
['Faturamento Bruto — tudo que entrou no período',
 'Custo de Procedimentos (CPO) — materiais e laboratório diretos',
 'Margem de Contribuição — faturamento menos CPO',
 'Despesas Fixas Totais — o que você paga todo mês independente da produção',
 'EBITDA Clínico — lucro antes de impostos e depreciação',
 'Inadimplência — percentual de receita não recebida',
 'Ticket Médio por Paciente — faturamento ÷ pacientes atendidos',
].forEach(f => item(f, 'ouro'));

secao('Controle de Inadimplência');
paragrafo('Inadimplência acima de 5% do faturamento é um sinal de alerta. Implemente: aprovação de crédito antes de iniciar tratamento longo, política clara de parcelamento, cobrança automatizada via WhatsApp e e-mail.');

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO 3 — MARKETING DIGITAL
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerModulo('03', 'Marketing Digital para Dentistas', 'Lotar a Agenda com Estratégia, não com Sorte');

secao('O Funil de Captação de Pacientes');
paragrafo('Todo paciente percorre um caminho antes de marcar consulta: Desconhecido → Consciente do problema → Considerando soluções → Decidido → Cliente → Fiel → Promotor. Seu marketing deve agir em cada etapa.');
['Topo do Funil: Instagram, TikTok, Google (conteúdo e tráfego)',
 'Meio do Funil: WhatsApp, landing pages, avaliações no Google',
 'Fundo do Funil: Atendimento presencial, follow-up, proposta de tratamento',
 'Retenção: Lembretes automáticos, retornos programados, programa de fidelidade',
].forEach(f => item(f, 'ouro'));

secao('Instagram para Dentistas: O Que Funciona de Verdade');
paragrafo('Conteúdo que converte para odontologia não é foto de dente perfeito — é conteúdo que responde à dúvida que o paciente tem antes de marcar consulta.');
boxEstrategia('Os 5 tipos de conteúdo com maior conversão', [
  '"Antes e depois" com consentimento e boa iluminação (não precisa de paciente famoso)',
  'Respostas a perguntas frequentes: "Dói fazer canal?", "Quanto custa implante?"',
  'Bastidores da clínica — humaniza a equipe e gera confiança',
  'Depoimentos de pacientes (vídeo curto é mais poderoso que texto escrito)',
  'Educação: "3 sinais que você precisa ir ao dentista agora"',
]);

secao('Google Meu Negócio: A Máquina de Captação Gratuita');
paragrafo('Um perfil bem otimizado no Google Meu Negócio pode trazer mais pacientes do que anúncios pagos. 76% das pessoas que pesquisam clínicas no Google visitam ou ligam no mesmo dia.');
['Complete 100% do perfil: horários, serviços, fotos, descrição',
 'Publique pelo menos 2 fotos novas por semana',
 'Responda TODAS as avaliações em até 24 horas — positivas e negativas',
 'Peça avaliações sistematicamente após cada consulta positiva',
 'Use palavras-chave corretas: "dentista em [cidade]", "clínica odontológica [bairro]"',
].forEach(f => item(f));

secao('Tráfego Pago: Quando e Como Anunciar');
paragrafo('Meta Ads e Google Ads funcionam para odontologia quando bem segmentados. Regra fundamental: não anuncie antes de ter a recepção treinada para converter os leads gerados. Lead perdido é dinheiro jogado fora.');
boxEstrategia('Segmentação ideal para clínica odontológica local', [
  'Raio de 5–8km ao redor da clínica (busca por dentista é comportamento local)',
  'Público: 25–55 anos, ambos os sexos, interesse em saúde e bem-estar',
  'Objetivo do anúncio: Mensagens (WhatsApp) ou Ligações — nunca "alcance"',
  'Orçamento mínimo efetivo: R$30–50/dia por 30 dias para coletar dados reais',
  'Criativos: use antes/depois reais e depoimentos — não banco de imagens genérico',
]);

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO 4 — AUTOMAÇÃO E SISTEMAS
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerModulo('04', 'Automação e Sistemas', 'Atender Mais com Menos Esforço');

secao('Por Que Automatizar é Obrigatório Hoje');
paragrafo('Uma clínica que opera manualmente está condenada ao limite humano: você só atende tantos pacientes quantos consegue dar conta pessoalmente. Automação quebra esse teto sem precisar contratar mais pessoas.');
paragrafo('Não se trata de substituir o atendimento humano — mas de eliminar tarefas repetitivas que consomem tempo sem agregar valor clínico.');

secao('Os 5 Processos que Devem Ser Automatizados Primeiro');
['Confirmação de consultas (WhatsApp/SMS automático D-1 e D-2)',
 'Lembretes de retorno periódico: "Faz 6 meses que você não vem..."',
 'Envio de orçamentos e follow-up de propostas não fechadas',
 'Cobrança de parcelas em atraso (mensagem automática gentil)',
 'Pesquisa de satisfação pós-consulta (NPS automatizado)',
].forEach(f => item(f, 'ouro'));

secao('Ferramentas Recomendadas para Clínicas Odontológicas');
boxEstrategia('Sistemas de Gestão (prontuário + agenda)', [
  'Dental Office — ampla adoção no Brasil, robusto',
  'Clinicorp — foco em gestão financeira integrada',
  'Simples Dental — custo-benefício para clínicas menores',
  'Doktor.us — integrações nativas com WhatsApp',
]);
boxEstrategia('Automação de WhatsApp e CRM', [
  'Z-API ou Evolution API (para soluções customizadas)',
  'Kommo (antigo AmoCRM) — CRM com WhatsApp integrado ao funil',
  'Hubspot CRM — para clínicas com volume maior de leads',
]);

secao('CRM para Clínicas: O Que é e Por Que Você Precisa');
paragrafo('CRM é simplesmente: um sistema que rastreia cada paciente, seu histórico, suas interações e o próximo passo. Sem CRM, você perde pacientes por esquecimento — não por falta de qualidade clínica.');

metrica('47%', 'Pacientes que não retornam são recuperáveis', 'com uma única mensagem de reativação bem feita e no momento certo.');

secao('Funil de Reativação de Pacientes Inativos');
boxEstrategia('Protocolo para pacientes sem visita há 6+ meses', [
  'D+180: WhatsApp automático — "Faz um tempo que não te vemos, tudo bem?"',
  'D+190: Oferta especial de retorno (desconto na avaliação de rotina)',
  'D+200: Ligação manual da secretária — toque humano no momento certo',
  'D+210: Última tentativa — e-mail com conteúdo educativo de saúde bucal',
  'D+220: Marcar como inativo no sistema (não deletar — pode retornar)',
]);

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO 5 — EQUIPE DE ALTA PERFORMANCE
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerModulo('05', 'Equipe de Alta Performance', 'Contratar, Treinar e Reter Talentos');

secao('O Maior Erro na Contratação de Secretárias');
paragrafo('Contratar pela experiência anterior em clínica odontológica é uma armadilha. Experiência traz hábitos — bons e ruins. Contrate pela atitude e pelo perfil comportamental. Treine o conhecimento técnico.');
['Competência técnica pode ser ensinada em semanas',
 'Atitude e valores levam anos para mudar — ou nunca mudam',
 'Perfil ideal: proativa, comunicativa, organizada, empática e resiliente',
 'Sinal de alerta na entrevista: respostas vagas sobre conflitos passados',
].forEach(f => item(f));

secao('Processo de Onboarding: Os Primeiros 30 Dias');
boxEstrategia('Estrutura de integração de novo colaborador', [
  'Semana 1: Shadowing — observa sem executar, absorve a cultura e os processos',
  'Semana 2: Execução supervisionada — faz, você valida cada ação',
  'Semana 3: Autonomia parcial — executa sozinho, reporta no final do dia',
  'Semana 4: Autonomia total com check-in semanal para ajustes',
]);

secao('Avaliação de Desempenho Objetiva');
paragrafo('Uma equipe sem feedback não cresce. Implemente avaliações mensais com critérios claros. Não avalie subjetividades — avalie resultados mensuráveis.');
['Taxa de confirmação de consultas (meta: acima de 85%)',
 'Tempo médio de resposta no WhatsApp (meta: menos de 2h)',
 'Número de avaliações Google geradas no mês',
 'Índice de inadimplência do período',
 'Net Promoter Score medido pela recepção',
].forEach(f => item(f, 'ouro'));

secao('Remuneração Estratégica: Fixo + Variável');
paragrafo('Vincular parte da remuneração a resultados alinha incentivos. Exemplo: salário fixo + bônus por meta de confirmações atingida + bônus por avaliações Google geradas. O colaborador sente que controla seus ganhos — e produz mais.');

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO 6 — PRECIFICAÇÃO INTELIGENTE
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerModulo('06', 'Precificação Inteligente', 'Parar de Trabalhar por Menos do que Vale');

secao('A Precificação que a Maioria dos Dentistas Usa (e que está errada)');
paragrafo('Olhar o que o concorrente cobra e copiar com desconto. Esse modelo destrói margens e posiciona você como commodidade — o mais barato do bairro, não o mais competente.');
paragrafo('Precificação estratégica considera: custo real, valor percebido, posicionamento desejado e capacidade do público-alvo. Preço comunica qualidade — e quem cobra barato sinaliza baixo valor.');

secao('Três Estratégias de Precificação');
['Cost-Plus: custo × multiplicador (base mínima — não use como único critério)',
 'Value-Based: baseado no valor entregue ao paciente (implante = novo dente para a vida)',
 'Competitive Anchoring: tabela com 3 opções (bom, melhor, premium)',
].forEach(f => item(f, 'ouro'));

secao('Ancoragem de Preços: A Magia das 3 Opções');
boxEstrategia('Exemplo — Clareamento Dental', [
  'Opção Básica: Clareamento caseiro — R$450 (âncora baixa, de referência)',
  'Opção Recomendada: Clareamento de consultório (2 sessões) — R$890',
  'Opção Premium: Clareamento + protocolo de manutenção 6 meses — R$1.490',
  'Resultado real: 60–70% dos pacientes escolhem a opção do meio — era o objetivo',
]);

secao('Como Apresentar o Orçamento para Aumentar o Fechamento');
paragrafo('O orçamento não é uma nota fiscal — é uma proposta comercial. Apresente em pessoa, explique o valor de cada etapa, antecipe objeções e ofereça opções de parcelamento antes que o paciente pergunte.');
['Nunca envie orçamento só pelo WhatsApp sem explicar pessoalmente',
 'Use a técnica do "sim pequeno": pergunte se o paciente aprovou a proposta antes do preço',
 'Ofereça as opções de pagamento proativamente — nunca espere o paciente perguntar',
 'Crie urgência legítima: "Temos agenda disponível essa semana para iniciar"',
].forEach(f => item(f));

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO 7 — EXPANSÃO
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerModulo('07', 'Expansão', 'Abrindo a Segunda Unidade sem Quebrar a Primeira');

secao('Quando Expandir — e Quando Não Expandir');
paragrafo('O sinal verde para expansão não é "estou lotado" — é "tenho sistema, equipe e lucro consistente há pelo menos 12 meses". Expandir uma clínica sem sistema é multiplicar o caos.');
boxEstrategia('Critérios para estar pronto para expandir', [
  'Lucro líquido estável acima de 25% por 12 meses consecutivos',
  'Processos documentados e replicáveis — manual operacional completo',
  'Equipe capaz de operar sem sua presença diária na clínica 1',
  'Reserva de capital de pelo menos 6 meses de custos fixos totais',
  'Demanda comprovada na região-alvo (não apenas intuição ou otimismo)',
]);

secao('Modelos de Expansão: Qual Escolher');
['Unidade própria: maior controle, maior investimento, maior risco',
 'Franquia da sua marca: replicar o modelo para outros dentistas investirem',
 'Sociedade com dentista local: divisão de investimento e expertise de mercado',
 'Locação de sala: menor risco, ideal para testar nova região antes de investir',
].forEach(f => item(f, 'ouro'));

secao('Os 5 Erros mais Comuns na Expansão');
boxEstrategia('Evite essas armadilhas', [
  '1. Tirar caixa da clínica 1 para financiar a abertura da clínica 2',
  '2. Não ter um gestor para a clínica 1 antes de abrir a 2',
  '3. Subestimar o tempo até o break-even (geralmente 8–18 meses)',
  '4. Contratar equipe antes de ter demanda comprovada na nova unidade',
  '5. Não registrar a marca antes de escalar — cria vulnerabilidade jurídica',
]);

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO 8 — ROTINA DO CEO DENTISTA
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerModulo('08', 'Rotina do CEO Dentista', 'Trabalhar no Negócio, não Apenas dentro dele');

secao('O Paradoxo do Dentista Dono');
paragrafo('Você criou um negócio para ter liberdade — e acabou criando um emprego do qual não pode se demitir. A saída não é trabalhar mais horas gerenciais. É criar sistemas que geram informação sem você precisar perguntar.');

secao('A Semana Ideal do Dentista-Empresário');
boxEstrategia('Distribuição recomendada de tempo semanal', [
  'Clínico (atendimento): 60% — o que você ama e que gera receita direta',
  'Gestão operacional: 20% — revisão de KPIs, reuniões de equipe, decisões táticas',
  'Estratégico e desenvolvimento: 15% — marketing, crescimento, parcerias',
  'Aprendizado: 5% — cursos, eventos do setor, leitura de mercado',
]);

secao('Dashboard do CEO — 10 Números para Monitorar Semanalmente');
['Faturamento da semana vs. meta estabelecida',
 'Número de novos pacientes captados',
 'Taxa de confirmação de consultas (%)',
 'Horas clínicas produtivas (com paciente) vs. horas paradas',
 'Avaliações Google recebidas na semana',
 'Mensagens WhatsApp sem resposta ao fechar o dia',
 'Valor total em aberto de cobranças',
 'Custo de aquisição por paciente (gasto em marketing ÷ novos pacientes)',
 'Pacientes inativos há mais de 6 meses',
 'NPS da semana (nota média de satisfação coletada)',
].forEach(f => item(f, 'ouro'));

secao('Reunião Semanal com a Equipe: 30 Minutos que Mudam o Jogo');
paragrafo('Toda segunda-feira, 30 minutos com a secretária e o auxiliar. Pauta fixa: o que foi bem, o que travou, meta da semana. Documente a ata. Execute o combinado. Isso sozinho coloca sua clínica entre as 10% mais bem geridas do Brasil.');

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO 9 — JURÍDICO E COMPLIANCE
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerModulo('09', 'Jurídico, Ética e Compliance', 'Proteger o que Você Construiu');

secao('Os 5 Riscos Jurídicos Mais Comuns em Clínicas');
['Prontuário odontológico incompleto ou sem assinatura do paciente',
 'Fotos de before/after sem Termo de Uso de Imagem assinado',
 'Promessas de resultado em publicidade (proibido pelo CFO)',
 'Contrato de prestação de serviços inexistente ou excessivamente genérico',
 'Sócio sem acordo de quotas registrado em cartório',
].forEach(f => item(f, 'ouro'));

secao('Documentos Obrigatórios na Clínica');
boxEstrategia('Tenha sempre disponível e atualizado', [
  'Prontuário odontológico completo por paciente (obrigatório por lei)',
  'Termo de Consentimento Livre e Esclarecido por tipo de procedimento',
  'Contrato de prestação de serviços assinado antes de iniciar tratamento longo',
  'Termo de Uso de Imagem para fotos e vídeos — essencial para marketing',
  'Plano de gerenciamento de resíduos (PGRSS) atualizado',
  'Alvará de funcionamento e CNES vigentes',
]);

secao('LGPD na Clínica Odontológica');
paragrafo('Dados de saúde são dados sensíveis sob a LGPD. Isso significa: coletar apenas o necessário, guardar com segurança, não compartilhar sem consentimento e ter política de privacidade publicada e acessível aos pacientes.');

secao('Resolvendo Conflitos com Pacientes');
paragrafo('Um paciente insatisfeito que é bem atendido no conflito se torna mais fiel do que um que nunca teve problema. Protocolo: ouça sem interromper, valide a frustração, ofereça solução concreta, execute rapidamente e faça follow-up.');

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO 10 — PLANO DE 90 DIAS
// ════════════════════════════════════════════════════════════════════════════
newPage();
headerModulo('10', 'Plano de 90 Dias', 'Para Dobrar o Faturamento da sua Clínica');

secao('Por Que 90 Dias e não 12 Meses');
paragrafo('Um plano de 12 meses é vago demais para gerar urgência. Um plano de 30 dias é curto demais para gerar resultado. 90 dias é o prazo ideal: longo o suficiente para ver mudança real, curto o suficiente para manter o foco e a execução.');

secao('Mês 1 — Diagnóstico e Fundação');
boxEstrategia('Semanas 1–4', [
  'Semana 1: Calcular lucro líquido real, custo por procedimento dos top 5 serviços',
  'Semana 2: Auditar agenda — taxa de faltas e horários mais produtivos',
  'Semana 3: Implementar confirmação automática de consultas (D-2 e D-1)',
  'Semana 4: Otimizar Google Meu Negócio e criar protocolo de pedido de avaliações',
]);

secao('Mês 2 — Geração de Demanda');
boxEstrategia('Semanas 5–8', [
  'Semana 5: Criar campanha de reativação para pacientes inativos (>6 meses)',
  'Semana 6: Lançar produção de conteúdo no Instagram (mínimo 3x/semana)',
  'Semana 7: Iniciar tráfego pago (R$30/dia no Meta Ads, monitorar CPL)',
  'Semana 8: Implementar script padronizado de apresentação de orçamentos',
]);

secao('Mês 3 — Otimização e Escala');
boxEstrategia('Semanas 9–12', [
  'Semana 9: Revisar KPIs dos meses 1 e 2, ajustar o que não funcionou',
  'Semana 10: Treinar equipe com base nos gargalos identificados nas métricas',
  'Semana 11: Criar programa de indicação (paciente que indica ganha benefício)',
  'Semana 12: Planejar o próximo trimestre com metas revisadas e mais ambiciosas',
]);

secao('Metas Esperadas ao Final dos 90 Dias');
metrica('+30–50%', 'Aumento de Faturamento', 'Resultado consistente para clínicas que aplicam o plano completo e sem pular etapas.');
metrica('–60%',    'Redução de Faltas',        'Com confirmação automática ativa e lista de encaixe operando em tempo real.');
metrica('+40%',    'Pacientes Novos',           'Via Google Meu Negócio otimizado + campanha de reativação de inativos.');

paragrafo('Estes números são conservadores. Clínicas que implementam todas as estratégias com consistência podem superar esses resultados. A chave não é a perfeição — é a consistência semanal.');

// ════════════════════════════════════════════════════════════════════════════
// ENCERRAMENTO
// ════════════════════════════════════════════════════════════════════════════
newPage();
doc.rect(0, 0, W, H).fill(NAVY);
doc.rect(0, 0, W, 6).fill(OURO);
doc.rect(0, H - 6, W, 6).fill(OURO);
doc.circle(W + 80, -80, 300).fill(NAVY2);
doc.circle(-60, H + 60, 250).fill(NAVY2);

doc.fillColor(OURO).font('Helvetica-Bold').fontSize(40)
   .text('Sua clínica', 0, 110, { align: 'center', width: W });
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(40)
   .text('é um negócio.', 0, 158, { align: 'center', width: W });
doc.fillColor(OURO).font('Helvetica-Bold').fontSize(40)
   .text('Trate como tal.', 0, 206, { align: 'center', width: W });

doc.rect(W / 2 - 120, 264, 240, 2).fillOpacity(0.25).fill(WHITE);
doc.fillOpacity(1);

doc.fillColor('#BBCCDD').font('Helvetica').fontSize(14)
   .text('Você chegou ao final do Guia Clínica Inteligente.', 0, 288, { align: 'center', width: W });
doc.fillColor(WHITE).font('Helvetica').fontSize(14)
   .text('Agora a diferença está na execução.', 0, 316, { align: 'center', width: W });

doc.rect(W / 2 - 120, 358, 240, 2).fill(OURO);

doc.fillColor(OURO).font('Helvetica-Bold').fontSize(13)
   .text('jaagendou.app', 0, 376, { align: 'center', width: W });
doc.fillColor(MGRAY).font('Helvetica').fontSize(11)
   .text('Ferramentas e conteúdo para clínicas odontológicas que querem crescer.', 0, 400, { align: 'center', width: W });

doc.fillColor('#333355').font('Helvetica').fontSize(9)
   .text('© 2026 jaagendou.app — Uso pessoal. Proibida reprodução, revenda ou distribuição não autorizada.', 0, H - 36, { align: 'center', width: W });

// ════════════════════════════════════════════════════════════════════════════
// RODAPÉ EM TODAS AS PÁGINAS
// ════════════════════════════════════════════════════════════════════════════
rodape();

doc.end();
console.log('✅ PDF gerado: ' + OUTPUT);
