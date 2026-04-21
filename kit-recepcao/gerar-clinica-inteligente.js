const PDFDocument = require('pdfkit');
const fs = require('fs');

const OUTPUT = 'C:/Users/otavi/Pictures/ja-agendou/kit-recepcao/Clinica_Inteligente_Guia_Completo.pdf';

const COR_PRIMARIA = '#0D1B40';
const COR_OURO = '#C9A84C';
const COR_VERDE = '#2ECC71';
const COR_CINZA = '#F4F4F8';
const COR_TEXTO = '#1A1A2E';

const doc = new PDFDocument({ size: 'A4', margin: 65, bufferPages: true });
doc.pipe(fs.createWriteStream(OUTPUT));

function cabecalhoModulo(modulo, titulo, subtitulo) {
  doc.rect(0, 0, doc.page.width, 140).fill(COR_PRIMARIA);
  doc.fillColor(COR_OURO).fontSize(11).font('Helvetica-Bold')
    .text(`MÓDULO ${modulo}`, 65, 28, { align: 'center', width: doc.page.width - 130 });
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
    .text(titulo, 65, 50, { align: 'center', width: doc.page.width - 130 });
  if (subtitulo) {
    doc.fillColor('#AABBCC').fontSize(11).font('Helvetica')
      .text(subtitulo, 65, 90, { align: 'center', width: doc.page.width - 130 });
  }
  doc.moveDown(5.5);
  doc.fillColor(COR_TEXTO);
}

function secao(titulo) {
  doc.moveDown(1);
  doc.fillColor(COR_PRIMARIA).fontSize(13).font('Helvetica-Bold').text(titulo);
  const y = doc.y + 3;
  doc.moveTo(65, y).lineTo(200, y).stroke(COR_OURO);
  doc.moveTo(204, y).lineTo(530, y).stroke('#DDDDDD');
  doc.moveDown(0.8);
  doc.fillColor(COR_TEXTO).fontSize(11).font('Helvetica');
}

function paragrafo(texto) {
  doc.fillColor(COR_TEXTO).fontSize(11).font('Helvetica')
    .text(texto, { align: 'justify', lineGap: 4 });
  doc.moveDown(0.6);
}

function item(texto, cor) {
  const bullet = cor === 'ouro' ? '◆' : '●';
  const corBullet = cor === 'ouro' ? COR_OURO : COR_VERDE;
  doc.fillColor(corBullet).fontSize(10).text(bullet + ' ', { continued: true, indent: 10, width: 25 });
  doc.fillColor(COR_TEXTO).fontSize(11).font('Helvetica')
    .text(texto, { lineGap: 3 });
}

function boxEstrategia(titulo, itens) {
  doc.moveDown(0.5);
  const altura = 24 + itens.length * 18 + 14;
  if (doc.y + altura > doc.page.height - 70) {
    doc.addPage();
    doc.moveDown(2);
  }
  const startY = doc.y;
  doc.rect(60, startY, doc.page.width - 120, altura).fill(COR_CINZA);
  doc.rect(60, startY, 4, altura).fill(COR_OURO);
  doc.fillColor(COR_PRIMARIA).fontSize(11).font('Helvetica-Bold')
    .text(titulo, 75, startY + 8, { width: doc.page.width - 150 });
  itens.forEach((linha, i) => {
    doc.fillColor(COR_TEXTO).fontSize(10).font('Helvetica')
      .text('→ ' + linha, 75, startY + 26 + i * 18, { width: doc.page.width - 150 });
  });
  doc.y = startY + altura + 14;
}

function metrica(titulo, valor, descricao) {
  if (doc.y + 60 > doc.page.height - 70) {
    doc.addPage();
    doc.moveDown(2);
  }
  doc.moveDown(0.3);
  const y = doc.y;
  doc.rect(60, y, doc.page.width - 120, 52).fill(COR_PRIMARIA);
  doc.fillColor(COR_OURO).fontSize(22).font('Helvetica-Bold')
    .text(valor, 75, y + 8, { continued: true, width: 120 });
  doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold')
    .text('  ' + titulo, { lineGap: 0 });
  doc.fillColor('#AABBCC').fontSize(10).font('Helvetica')
    .text(descricao, 75, y + 34, { width: doc.page.width - 150 });
  doc.y = y + 52 + 14;
}

// ======================== CAPA ========================
doc.rect(0, 0, doc.page.width, doc.page.height).fill(COR_PRIMARIA);

doc.rect(0, 0, doc.page.width, 8).fill(COR_OURO);
doc.rect(0, doc.page.height - 8, doc.page.width, 8).fill(COR_OURO);

doc.fillColor(COR_OURO).fontSize(11).font('Helvetica')
  .text('jaagendou.app  ·  PRODUTO PREMIUM', 0, 40, { align: 'center', width: doc.page.width });

doc.rect(doc.page.width / 2 - 140, 68, 280, 1).fill(COR_OURO);

doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica')
  .text('GUIA COMPLETO PARA DENTISTAS QUE QUEREM ESCALAR', 0, 85,
    { align: 'center', width: doc.page.width });

doc.fillColor(COR_OURO).fontSize(38).font('Helvetica-Bold')
  .text('Clínica', 0, 130, { align: 'center', width: doc.page.width });
doc.fillColor('#FFFFFF').fontSize(38).font('Helvetica-Bold')
  .text('Inteligente', 0, 176, { align: 'center', width: doc.page.width });

doc.rect(doc.page.width / 2 - 160, 230, 320, 1).fill('#FFFFFF').opacity(0.3);
doc.opacity(1);

doc.fillColor('#BBCCDD').fontSize(13).font('Helvetica')
  .text('Gestão · Marketing · Automação · Financeiro', 0, 248,
    { align: 'center', width: doc.page.width });

doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica-Bold')
  .text('Para Dentistas que Querem Escalar Resultados', 0, 275,
    { align: 'center', width: doc.page.width });

doc.rect(doc.page.width / 2 - 140, 308, 280, 1).fill(COR_OURO);

const modulos = ['Gestão Estratégica', 'Finanças Clínicas', 'Marketing Digital',
  'Automação e Sistemas', 'Equipe de Alta Performance', 'Precificação e Lucro',
  'Expansão e Escala', 'Rotina do CEO Dentista'];

doc.fillColor(COR_OURO).fontSize(10).font('Helvetica-Bold')
  .text('10 MÓDULOS', 0, 325, { align: 'center', width: doc.page.width });

modulos.forEach((m, i) => {
  const col = i % 2 === 0 ? doc.page.width / 2 - 220 : doc.page.width / 2 + 10;
  const row = 345 + Math.floor(i / 2) * 20;
  doc.fillColor('#BBCCDD').fontSize(10).font('Helvetica')
    .text('◆ ' + m, col, row, { width: 210 });
});

doc.fillColor(COR_OURO).fontSize(10).font('Helvetica-Bold')
  .text('◆ Ferramentas Práticas', doc.page.width / 2 - 220, 425, { width: 210 });
doc.fillColor(COR_OURO).fontSize(10).font('Helvetica-Bold')
  .text('◆ Templates e Planilhas', doc.page.width / 2 + 10, 425, { width: 210 });

doc.fillColor('#555577').fontSize(9).font('Helvetica')
  .text('© 2025 jaagendou.app — Uso pessoal. Proibida reprodução ou revenda.', 0, doc.page.height - 35,
    { align: 'center', width: doc.page.width });

// ======================== SUMÁRIO ========================
doc.addPage();
doc.rect(0, 0, doc.page.width, 90).fill(COR_PRIMARIA);
doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
  .text('Sumário', 65, 30, { align: 'center', width: doc.page.width - 130 });
doc.fillColor(COR_OURO).fontSize(11).font('Helvetica')
  .text('Clínica Inteligente — 10 Módulos', 65, 60, { align: 'center', width: doc.page.width - 130 });
doc.moveDown(4);

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

sumario.forEach(([num, nome]) => {
  const y = doc.y;
  doc.rect(65, y, doc.page.width - 130, 34).fill(parseInt(num) % 2 === 0 ? COR_CINZA : '#FFFFFF');
  doc.fillColor(COR_OURO).fontSize(12).font('Helvetica-Bold')
    .text(`M${num}`, 75, y + 10, { width: 35 });
  doc.fillColor(COR_TEXTO).fontSize(11).font('Helvetica')
    .text(nome, 110, y + 10, { width: doc.page.width - 185 });
  doc.moveDown(2.8);
});

// ======================== INTRODUÇÃO ========================
doc.addPage();
doc.rect(0, 0, doc.page.width, 90).fill(COR_PRIMARIA);
doc.fillColor(COR_OURO).fontSize(11).font('Helvetica-Bold')
  .text('INTRODUÇÃO', 65, 28, { align: 'center', width: doc.page.width - 130 });
doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold')
  .text('Por que sua clínica ainda não escala?', 65, 50, { align: 'center', width: doc.page.width - 130 });
doc.moveDown(4.5);

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

// ======================== MÓDULO 1 ========================
doc.addPage();
cabecalhoModulo('01', 'Gestão Estratégica', 'Pensar como Dono, não como Operário');

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

// ======================== MÓDULO 2 ========================
doc.addPage();
cabecalhoModulo('02', 'Finanças Clínicas', 'Do Faturamento ao Lucro Real');

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
  'Custo hora dentista (pró-labore): R$200/h → R$150',
  'Rateio fixos (R$12.000 fixo / 120h clínicas): R$100/h → R$75',
  'Custo real: R$35 + R$150 + R$75 = R$260',
  'Se cobrar R$200, você trabalha no prejuízo',
]);

secao('Indicadores Financeiros Essenciais para Monitorar Mensalmente');
['Faturamento Bruto — tudo que entrou',
 'Custo de Procedimentos (CPO) — materiais e laboratório',
 'Margem de Contribuição — faturamento menos CPO',
 'Despesas Fixas Totais — o que paga todo mês independente',
 'EBITDA Clínico — lucro antes de impostos e depreciação',
 'Inadimplência — percentual de receita não recebida',
 'Ticket Médio por Paciente — faturamento ÷ pacientes atendidos',
].forEach(f => item(f, 'ouro'));

secao('Controle de Inadimplência');
paragrafo('Inadimplência acima de 5% do faturamento é um sinal de alerta. Implemente: aprovação de crédito antes de iniciar tratamento longo, política clara de parcelamento, cobrança automatizada via WhatsApp e e-mail.');

// ======================== MÓDULO 3 ========================
doc.addPage();
cabecalhoModulo('03', 'Marketing Digital para Dentistas', 'Lotar a Agenda com Estratégia, não com Sorte');

secao('O Funil de Captação de Pacientes');
paragrafo('Todo paciente percorre um caminho antes de marcar consulta: Desconhecido → Consciente do problema → Considerando soluções → Decidido → Cliente → Fiel → Promotor. Seu marketing deve agir em cada etapa.');

['Topo do Funil: Instagram, TikTok, Google (conteúdo e tráfego)',
 'Meio do Funil: WhatsApp, landing pages, avaliações no Google',
 'Fundo do Funil: Atendimento, follow-up, proposta de tratamento',
 'Retenção: Lembretes, retornos programados, programa de fidelidade',
].forEach(f => item(f, 'ouro'));

secao('Instagram para Dentistas: O Que Funciona de Verdade');
paragrafo('Conteúdo que converte para odontologia não é foto de dente perfeito — é conteúdo que responde à dúvida que o paciente tem antes de marcar consulta.');

boxEstrategia('Os 5 tipos de conteúdo com maior conversão', [
  '"Antes e depois" com consentimento e boa iluminação (não precisa de paciente famoso)',
  'Respostas a perguntas frequentes ("Dói fazer canal?", "Quanto custa implante?")',
  'Bastidores da clínica — humaniza e gera confiança',
  'Depoimentos de pacientes (vídeo curto é mais poderoso que texto)',
  'Educação: "3 sinais que você precisa ir ao dentista agora"',
]);

secao('Google Meu Negócio: A Máquina de Captação Gratuita');
paragrafo('Um perfil bem otimizado no Google Meu Negócio pode trazer mais pacientes do que anúncios pagos. 76% das pessoas que pesquisam clínicas no Google visitam ou ligam no mesmo dia.');

['Complete 100% do perfil: horários, serviços, fotos, descrição',
 'Publique pelo menos 2 fotos novas por semana',
 'Responda TODAS as avaliações em até 24 horas',
 'Peça avaliações sistematicamente após cada consulta positiva',
 'Use as palavras-chave corretas: "dentista em [cidade]", "clínica odontológica [bairro]"',
].forEach(f => item(f));

secao('Tráfego Pago: Quando e Como Anunciar');
paragrafo('Meta Ads e Google Ads funcionam para odontologia quando bem segmentados. Regra: não anuncie antes de ter a recepção treinada para converter os leads gerados. Lead perdido é dinheiro jogado fora.');

boxEstrategia('Segmentação ideal para clínica odontológica local', [
  'Raio de 5-8km ao redor da clínica (comportamento de busca por dentista é local)',
  'Público: 25-55 anos, ambos os sexos, interesse em saúde',
  'Objetivo: Mensagens (WhatsApp) ou Ligações — não "alcance"',
  'Orçamento mínimo efetivo: R$30-50/dia por 30 dias para testar',
  'Criativos: use antes/depois reais, não banco de imagens',
]);

// ======================== MÓDULO 4 ========================
doc.addPage();
cabecalhoModulo('04', 'Automação e Sistemas', 'Atender Mais com Menos Esforço');

secao('Por Que Automatizar é Obrigatório Hoje');
paragrafo('Uma clínica que opera manualmente está condenada ao limite humano: você só atende tantos pacientes quantos consegue dar conta pessoalmente. Automação quebra esse teto.');
paragrafo('Não se trata de substituir o atendimento humano — mas de eliminar as tarefas repetitivas que consomem tempo sem agregar valor clínico.');

secao('Os 5 Processos que Devem Ser Automatizados Primeiro');
['Confirmação de consultas (WhatsApp/SMS automático D-1 e D-2)',
 'Lembretes de retorno periódico ("Faz 6 meses que você não vem")',
 'Envio de orçamentos e follow-up de propostas não fechadas',
 'Cobrança de parcelas em atraso (mensagem automática gentil)',
 'Pesquisa de satisfação pós-consulta',
].forEach(f => item(f, 'ouro'));

secao('Ferramentas Recomendadas para Clínicas Odontológicas');
boxEstrategia('Sistemas de Gestão (prontuário + agenda)', [
  'Dental Office — ampla adoção no Brasil',
  'Clinicorp — foco em gestão financeira',
  'Simples Dental — custo-benefício para clínicas menores',
  'Doktor.us — integrações com WhatsApp',
]);
boxEstrategia('Automação de WhatsApp', [
  'Z-API ou Evolution API (para soluções próprias)',
  'Kommo (antigo AmoCRM) — CRM com WhatsApp integrado',
  'Hubspot — para clínicas com volume maior de leads',
]);

secao('CRM para Clínicas: O Que é e Por Que Você Precisa');
paragrafo('CRM (Customer Relationship Management) é simplesmente: um sistema que rastreia cada paciente, seu histórico, suas interações e o próximo passo. Sem CRM, você perde pacientes por esquecimento — não por falta de qualidade.');

metrica('47%', 'Pacientes que não retornam', 'são recuperáveis com uma única mensagem de reativação bem feita.');

secao('Funil de Reativação de Pacientes Inativos');
boxEstrategia('Protocolo para pacientes sem visita há 6+ meses', [
  'D+180: WhatsApp automático — "Faz um tempo que não te vemos..."',
  'D+190: Oferta especial de retorno (desconto na avaliação)',
  'D+200: Ligação manual da secretária',
  'D+210: Última tentativa — e-mail com conteúdo educativo',
  'D+220: Marcar como inativo no sistema (não deletar — pode retornar)',
]);

// ======================== MÓDULO 5 ========================
doc.addPage();
cabecalhoModulo('05', 'Equipe de Alta Performance', 'Contratar, Treinar e Reter Talentos');

secao('O Maior Erro na Contratação de Secretárias');
paragrafo('Contratar pela experiência anterior em clínica odontológica é uma armadilha. Experiência traz hábitos — bons e ruins. Contrate pela atitude e pelo perfil comportamental. Treine o conhecimento técnico.');

['Competência técnica pode ser ensinada em semanas',
 'Atitude e valores levam anos para mudar — ou nunca mudam',
 'Perfil ideal: proativa, comunicativa, organizada, empática, resiliente',
 'Sinal de alerta na entrevista: respostas vagas sobre conflitos passados',
].forEach(f => item(f));

secao('Processo de Onboarding: Os Primeiros 30 Dias');
boxEstrategia('Estrutura de integração de novo colaborador', [
  'Semana 1: Shadowing — observa sem executar, absorve a cultura',
  'Semana 2: Execução supervisionada — faz, você valida',
  'Semana 3: Autonomia parcial — executa, reporta no final do dia',
  'Semana 4: Autonomia total com check-in semanal',
]);

secao('Avaliação de Desempenho Objetiva');
paragrafo('Uma equipe sem feedback não cresce. Implemente avaliações mensais com critérios claros. Não avalie subjetividades — avalie resultados mensuráveis.');

['Taxa de confirmação de consultas (meta: >85%)',
 'Tempo médio de resposta no WhatsApp (meta: <2h)',
 'Avaliações Google geradas no mês',
 'Inadimplência do período',
 'Net Promoter Score da recepção',
].forEach(f => item(f, 'ouro'));

secao('Remuneração Estratégica: Fixo + Variável');
paragrafo('Vincular parte da remuneração a resultados alinha incentivos. Exemplo: salário fixo + bônus por meta de confirmações + bônus por avaliações Google geradas. O colaborador sente que tem controle sobre seus ganhos — e produz mais.');

// ======================== MÓDULO 6 ========================
doc.addPage();
cabecalhoModulo('06', 'Precificação Inteligente', 'Parar de Trabalhar por Menos do que Vale');

secao('A Precificação que a Maioria dos Dentistas Usa (e que está errada)');
paragrafo('Olhar o que o concorrente cobra e copiar com desconto. Esse modelo destrói margens e posiciona você como commodidade — o mais barato do bairro, não o mais competente.');
paragrafo('Precificação estratégica considera: custo real, valor percebido, posicionamento desejado e capacidade do seu público-alvo. Preço comunica qualidade.');

secao('Três Estratégias de Precificação');
['Cost-Plus: custo × multiplicador (base mínima, não ideal)',
 'Value-Based: baseado no valor entregue ao paciente (implante = novo dente para a vida)',
 'Competitive Anchoring: tabela de preços com 3 opções (bom, melhor, premium)',
].forEach(f => item(f, 'ouro'));

secao('Ancoragem de Preços: A Magia das 3 Opções');
boxEstrategia('Exemplo — Clareamento Dental', [
  'Opção Básica: Clareamento caseiro — R$450 (âncora baixa)',
  'Opção Recomendada: Clareamento de consultório (2 sessões) — R$890',
  'Opção Premium: Clareamento + protocolo de manutenção 6 meses — R$1.490',
  'Resultado: 60-70% escolhem a opção do meio — era o objetivo',
]);

secao('Como Apresentar o Orçamento para Aumentar o Fechamento');
paragrafo('O orçamento não é uma nota fiscal — é uma proposta comercial. Apresente em pessoa, explique o valor de cada etapa, antecipe objeções e ofereça opções de parcelamento antes que o paciente pergunte.');

['Nunca envie orçamento só pelo WhatsApp sem explicar',
 'Use a técnica do "sim pequeno" — pergunte se o paciente gostou da proposta antes do preço',
 'Ofereça as opções de pagamento proativamente',
 'Crie urgência legítima: "Temos agenda disponível essa semana"',
].forEach(f => item(f));

// ======================== MÓDULO 7 ========================
doc.addPage();
cabecalhoModulo('07', 'Expansão', 'Abrindo a Segunda Unidade sem Quebrar a Primeira');

secao('Quando Expandir — e Quando Não Expandir');
paragrafo('O sinal verde para expansão não é "estou lotado" — é "tenho sistema, equipe e lucro consistente há pelo menos 12 meses". Expandir uma clínica sem sistema é multiplicar o caos.');

boxEstrategia('Critérios para estar pronto para expandir', [
  'Lucro líquido estável acima de 25% por 12 meses consecutivos',
  'Processos documentados e replicáveis (manual operacional)',
  'Equipe capaz de operar sem sua presença diária',
  'Reserva de capital de pelo menos 6 meses de custos fixos',
  'Demanda comprovada na região-alvo (não apenas intuição)',
]);

secao('Modelos de Expansão: Qual Escolher');
['Unidade própria: maior controle, maior investimento, maior risco',
 'Franquia da sua marca: replicar o modelo para outros dentistas investirem',
 'Sociedade com dentista local: divisão de investimento e expertise',
 'Locação de sala: menor risco, ideal para testar nova região',
].forEach(f => item(f, 'ouro'));

secao('Os 5 Erros mais Comuns na Expansão');
boxEstrategia('Evite essas armadilhas', [
  '1. Tirar caixa da clínica 1 para financiar a clínica 2',
  '2. Não ter gestor para a clínica 1 antes de abrir a 2',
  '3. Subestimar o tempo até o break-even (geralmente 8-18 meses)',
  '4. Contratar antes de ter demanda comprovada',
  '5. Não registrar a marca antes de expandir',
]);

// ======================== MÓDULO 8 ========================
doc.addPage();
cabecalhoModulo('08', 'Rotina do CEO Dentista', 'Trabalhar no Negócio, não Apenas dentro dele');

secao('O Paradoxo do Dentista Dono');
paragrafo('Você criou um negócio para ter liberdade — e acabou criando um emprego do qual não pode se demitir. A saída não é trabalhar mais horas gerenciais. É criar sistemas que geram informação sem você precisar perguntar.');

secao('A Semana Ideal do Dentista-Empresário');
boxEstrategia('Distribuição recomendada de tempo', [
  'Clínico (atendimento): 60% do tempo — o que você ama e gera receita',
  'Gestão operacional: 20% — revisão de KPIs, reuniões de equipe, decisões táticas',
  'Estratégico e desenvolvimento: 15% — marketing, crescimento, parcerias',
  'Aprendizado: 5% — cursos, eventos, leitura de mercado',
]);

secao('Dashboard do CEO — 10 Números para Monitorar Semanalmente');
['Faturamento da semana vs. meta',
 'Número de novos pacientes',
 'Taxa de confirmação de consultas',
 'Horas clínicas produtivas (com paciente) vs. horas paradas',
 'Avaliações Google recebidas',
 'Mensagens WhatsApp não respondidas ao fechar o dia',
 'Valor em aberto de cobranças',
 'Custo de aquisição de paciente (gasto marketing ÷ novos pacientes)',
 'Pacientes inativos há mais de 6 meses',
 'NPS da semana (avaliação de satisfação)',
].forEach(f => item(f, 'ouro'));

secao('Reunião Semanal com a Equipe: 30 Minutos que Mudam o Jogo');
paragrafo('Toda segunda-feira, 30 minutos com a secretária e o auxiliar. Pauta fixa: o que foi bem, o que travou, meta da semana. Documente a ata. Execute o combinado. Isso sozinho coloca sua clínica entre as 10% mais bem geridas do Brasil.');

// ======================== MÓDULO 9 ========================
doc.addPage();
cabecalhoModulo('09', 'Jurídico, Ética e Compliance', 'Proteger o que Você Construiu');

secao('Os 5 Riscos Jurídicos Mais Comuns em Clínicas');
['Prontuário odontológico incompleto ou sem assinatura do paciente',
 'Fotos de before/after sem Termo de Uso de Imagem assinado',
 'Promessas de resultado em publicidade (proibido pelo CFO)',
 'Contrato de prestação de serviços inexistente ou genérico',
 'Sócio sem acordo de quotas registrado em cartório',
].forEach(f => item(f, 'ouro'));

secao('Documentos Obrigatórios na Clínica');
boxEstrategia('Tenha sempre disponível e atualizado', [
  'Prontuário odontológico completo (obrigatório por lei)',
  'Termo de Consentimento Livre e Esclarecido por procedimento',
  'Contrato de prestação de serviços assinado antes de iniciar tratamento longo',
  'Termo de Uso de Imagem para fotos e vídeos',
  'Plano de gerenciamento de resíduos (PGRSS) atualizado',
  'Alvará de funcionamento e CNES atualizado',
]);

secao('LGPD na Clínica Odontológica');
paragrafo('Dados de saúde são dados sensíveis sob a LGPD. Isso significa: coletar apenas o necessário, guardar com segurança, não compartilhar sem consentimento e ter política de privacidade publicada e acessível.');

secao('Resolvendo Conflitos com Pacientes');
paragrafo('Um paciente insatisfeito que é bem atendido no conflito se torna mais fiel do que um que nunca teve problema. Protocolo: ouça sem interromper, valide a frustração, ofereça solução concreta, execute rapidamente e faça follow-up.');

// ======================== MÓDULO 10 ========================
doc.addPage();
cabecalhoModulo('10', 'Plano de 90 Dias', 'Para Dobrar o Faturamento da sua Clínica');

secao('Por Que 90 Dias e não 12 Meses');
paragrafo('Um plano de 12 meses é vago demais para gerar urgência. Um plano de 30 dias é curto demais para gerar resultado. 90 dias é o prazo ideal: longo o suficiente para ver mudança real, curto o suficiente para manter o foco.');

secao('Mês 1 — Diagnóstico e Fundação');
boxEstrategia('Semanas 1-4', [
  'Semana 1: Calcular lucro líquido real, custo por procedimento dos top 5 serviços',
  'Semana 2: Auditar agenda (taxa de faltas, horários mais produtivos)',
  'Semana 3: Implementar confirmação automática de consultas',
  'Semana 4: Otimizar Google Meu Negócio e criar protocolo de pedido de avaliações',
]);

secao('Mês 2 — Geração de Demanda');
boxEstrategia('Semanas 5-8', [
  'Semana 5: Criar campanha de reativação para pacientes inativos (>6 meses)',
  'Semana 6: Lançar conteúdo no Instagram (3x/semana mínimo)',
  'Semana 7: Iniciar tráfego pago (R$30/dia no Meta Ads)',
  'Semana 8: Implementar script de apresentação de orçamentos',
]);

secao('Mês 3 — Otimização e Escala');
boxEstrategia('Semanas 9-12', [
  'Semana 9: Revisar KPIs do mês 1 e 2, ajustar o que não funcionou',
  'Semana 10: Treinar equipe com base nos gargalos identificados',
  'Semana 11: Criar programa de indicação (paciente que indica ganha benefício)',
  'Semana 12: Planejar o próximo trimestre com metas revisadas',
]);

secao('Metas Esperadas ao Final dos 90 Dias');
metrica('+30-50%', 'Aumento de Faturamento', 'Resultado consistente para clínicas que aplicam o plano completo.');
metrica('-60%', 'Redução de Faltas', 'Com confirmação automática e lista de espera ativa.');
metrica('+40%', 'Pacientes Novos', 'Via Google Meu Negócio otimizado + reativação de inativos.');

paragrafo('Estes números são conservadores. Clínicas que implementam todas as estratégias consistentemente podem superar esses resultados. A chave não é a perfeição — é a consistência.');

// ======================== ENCERRAMENTO ========================
doc.addPage();
doc.rect(0, 0, doc.page.width, doc.page.height).fill(COR_PRIMARIA);
doc.rect(0, 0, doc.page.width, 6).fill(COR_OURO);
doc.rect(0, doc.page.height - 6, doc.page.width, 6).fill(COR_OURO);

doc.fillColor(COR_OURO).fontSize(32).font('Helvetica-Bold')
  .text('Sua clínica', 0, 100, { align: 'center', width: doc.page.width });
doc.fillColor('#FFFFFF').fontSize(32).font('Helvetica-Bold')
  .text('é um negócio.', 0, 145, { align: 'center', width: doc.page.width });
doc.fillColor(COR_OURO).fontSize(32).font('Helvetica-Bold')
  .text('Trate como tal.', 0, 190, { align: 'center', width: doc.page.width });

doc.rect(doc.page.width / 2 - 120, 245, 240, 2).fill('#FFFFFF').opacity(0.3);
doc.opacity(1);

doc.fillColor('#BBCCDD').fontSize(13).font('Helvetica')
  .text('Você chegou ao final do Guia Clínica Inteligente.', 0, 270,
    { align: 'center', width: doc.page.width });
doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica')
  .text('Agora a diferença está na execução.', 0, 298,
    { align: 'center', width: doc.page.width });

doc.fillColor(COR_OURO).fontSize(11).font('Helvetica-Bold')
  .text('jaagendou.app', 0, 360, { align: 'center', width: doc.page.width });
doc.fillColor('#AAAAAA').fontSize(10).font('Helvetica')
  .text('Ferramentas e conteúdo para clínicas odontológicas que querem crescer.', 0, 380,
    { align: 'center', width: doc.page.width });

doc.fillColor('#444466').fontSize(9).font('Helvetica')
  .text('© 2025 jaagendou.app — Uso pessoal. Proibida reprodução, revenda ou distribuição não autorizada.', 0, doc.page.height - 40,
    { align: 'center', width: doc.page.width });

doc.end();
console.log('PDF gerado: ' + OUTPUT);
