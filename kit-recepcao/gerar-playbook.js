const PDFDocument = require('pdfkit');
const fs = require('fs');

const OUT = 'C:/Users/otavi/Pictures/ja-agendou/kit-recepcao/Playbook_Recepcao_Profissional.pdf';

const NAVY  = '#0D1B40';
const NAVY2 = '#162354';
const GREEN = '#2ECC71';
const GREEN2= '#27AE60';
const RED   = '#E74C3C';
const WHITE = '#FFFFFF';
const LGRAY = '#F5F7FA';
const MGRAY = '#8A9BB0';
const DGRAY = '#2D3E55';
const BORDER= '#E0E6EF';

const doc = new PDFDocument({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 }, info: {
  Title: 'Playbook da Recepção Profissional — Já Agendou',
  Author: 'Já Agendou',
  Subject: 'Manual completo de processos para recepção odontológica'
}});

doc.pipe(fs.createWriteStream(OUT));

const W = 595.28, H = 841.89, PL = 52, PR = 52, CW = W - PL - PR;
let pageNum = 0;

function newPage() {
  doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  pageNum++;
}

function header(title, subtitle) {
  doc.rect(0, 0, W, 58).fill(NAVY);
  doc.rect(0, 58, W, 4).fill(GREEN);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11)
     .text('PLAYBOOK DA RECEPÇÃO PROFISSIONAL  •  jaagendou.app', PL, 20);
  doc.fillColor(MGRAY).font('Helvetica').fontSize(9).text('Página ' + pageNum, W - 90, 24);
  doc.rect(0, 62, W, H - 62).fill(WHITE);
  if (title) {
    doc.rect(PL, 82, 5, 30).fill(GREEN);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(20)
       .text(title, PL + 14, 82, { width: CW - 14 });
    if (subtitle) {
      doc.fillColor(MGRAY).font('Helvetica').fontSize(11)
         .text(subtitle, PL + 14, 108, { width: CW - 14 });
    }
  }
}

function chapterCover(num, title, desc) {
  doc.rect(0, 0, W, H).fill(NAVY2);
  doc.rect(0, H - 8, W, 8).fill(GREEN);
  doc.circle(W - 60, 60, 200).fill('#0D1B40');
  doc.circle(60, H - 60, 150).fill('#0D1B40');
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(12)
     .text('CAPÍTULO ' + num, PL, 120, { width: CW, align: 'center' });
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(36)
     .text(title, PL, 155, { width: CW, align: 'center', lineGap: 6 });
  doc.rect(PL + 80, 220 + title.split('\n').length * 20, CW - 160, 2).fill(GREEN);
  doc.fillColor(MGRAY).font('Helvetica').fontSize(14)
     .text(desc, PL + 40, 238 + title.split('\n').length * 20, { width: CW - 80, align: 'center', lineGap: 6 });
  doc.fillColor('#3A4F7A').font('Helvetica').fontSize(10)
     .text('© 2026 Já Agendou — jaagendou.app', PL, H - 40, { width: CW, align: 'center' });
}

function h2(text, y) {
  doc.rect(PL, y, 5, 20).fill(GREEN);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(15)
     .text(text, PL + 13, y + 2, { width: CW - 13 });
  return y + 32;
}

function h3(text, y) {
  doc.fillColor(GREEN2).font('Helvetica-Bold').fontSize(11)
     .text('▸ ' + text, PL, y, { width: CW });
  return y + 20;
}

function body(text, y, opts = {}) {
  doc.fillColor(DGRAY).font('Helvetica').fontSize(11);
  const approxH = doc.heightOfString(text, { width: CW, lineGap: 4 }) + 10;
  if (y + approxH > H - 60) { newPage(); header(null); y = 80; }
  doc.text(text, PL, y, { width: CW, lineGap: 4, ...opts });
  return y + approxH;
}

function card(title, content, y, color = LGRAY) {
  doc.font('Helvetica-Bold').fontSize(11);
  const titleH = doc.heightOfString(title, { width: CW - 28 });
  doc.font('Helvetica').fontSize(10);
  const contentH = doc.heightOfString(content, { width: CW - 28, lineGap: 3 });
  const cardH = titleH + contentH + 30;
  if (y + cardH > H - 60) { newPage(); header(null); y = 80; }
  doc.roundedRect(PL, y, CW, cardH, 6).fill(color).stroke(BORDER);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text(title, PL + 14, y + 12, { width: CW - 28 });
  doc.fillColor(DGRAY).font('Helvetica').fontSize(10).text(content, PL + 14, y + 12 + titleH + 4, { width: CW - 28, lineGap: 3 });
  return y + cardH + 10;
}

function checkItem(text, y, sub = '') {
  if (y + 28 > H - 60) { newPage(); header(null); y = 80; }
  doc.circle(PL + 8, y + 8, 7).fill(GREEN);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8).text('✓', PL + 5, y + 4);
  doc.fillColor(DGRAY).font('Helvetica-Bold').fontSize(11).text(text, PL + 22, y, { width: CW - 22 });
  let h = 20;
  if (sub) {
    doc.fillColor(MGRAY).font('Helvetica').fontSize(9).text(sub, PL + 22, y + 15, { width: CW - 22 });
    h = 32;
  }
  return y + h;
}

function rule(y) {
  doc.rect(PL, y, CW, 1).fill(BORDER);
  return y + 12;
}

function alert(icon, text, y, bg = '#FFF8E1', border = '#F39C12') {
  const lines = text.split('\n').length;
  const h = lines * 16 + 24;
  if (y + h > H - 60) { newPage(); header(null); y = 80; }
  doc.roundedRect(PL, y, CW, h, 6).fill(bg);
  doc.rect(PL, y, 4, h).fill(border);
  doc.fillColor(DGRAY).font('Helvetica').fontSize(11)
     .text(icon + '  ' + text, PL + 14, y + 12, { width: CW - 20, lineGap: 3 });
  return y + h + 10;
}

// ═══════════════════════════════════════════
// CAPA
// ═══════════════════════════════════════════
pageNum = 1;
doc.rect(0, 0, W, H).fill(NAVY);
doc.rect(0, H - 8, W, 8).fill(GREEN);
doc.circle(W + 20, -20, 300).fill(NAVY2);
doc.circle(-60, H - 60, 200).fill(NAVY2);
doc.roundedRect(PL, 70, 140, 28, 14).fill(GREEN);
doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text('jaagendou.app', PL + 16, 79);
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(48).text('Playbook da', PL, 130, { width: CW });
doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(48).text('Recepção', PL, 183, { width: CW });
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(48).text('Profissional', PL, 236, { width: CW });
doc.rect(PL, 302, 120, 4).fill(GREEN);
doc.fillColor(MGRAY).font('Helvetica').fontSize(14)
   .text('O manual completo de processos, scripts\ne rotinas para sua clínica odontológica.', PL, 320, { width: 420, lineGap: 6 });
const itens = ['Scripts de WhatsApp e telefone', 'Checklists de rotina completos', 'Protocolo de gestão de faltas', 'Guia de onboarding de recepcionista', 'Protocolo de atendimento difícil', 'Métricas e metas da recepção', 'Política de cancelamento', 'Roteiro de cobrança humanizada'];
let iy = 420;
itens.forEach((item, i) => {
  const col = i < 4 ? 0 : 1;
  const row = i % 4;
  const x = PL + col * 250;
  const y = iy + row * 26;
  doc.rect(x, y + 4, 3, 12).fill(GREEN);
  doc.fillColor(WHITE).font('Helvetica').fontSize(11).text(item, x + 12, y, { width: 230 });
});
doc.fillColor('#3A4F7A').font('Helvetica').fontSize(10).text('© 2026 Já Agendou — Todos os direitos reservados', PL, H - 35, { width: CW, align: 'center' });

// ═══════════════════════════════════════════
// SUMÁRIO
// ═══════════════════════════════════════════
newPage(); header('Sumário');
let y = 130;
const sumario = [
  ['Cap. 1', 'A Missão da Recepção', '4'],
  ['Cap. 2', 'Onboarding — Manual para a Nova Recepcionista', '6'],
  ['Cap. 3', 'Scripts de WhatsApp (20 templates)', '10'],
  ['Cap. 4', 'Scripts de Atendimento por Telefone', '16'],
  ['Cap. 5', 'Checklists de Rotina Diária', '20'],
  ['Cap. 6', 'Gestão de Faltas e Reagendamento', '23'],
  ['Cap. 7', 'Como Lidar com o Paciente Difícil', '26'],
  ['Cap. 8', 'Protocolo de Cobrança Humanizada', '29'],
  ['Cap. 9', 'Métricas e Metas da Recepção', '32'],
  ['Cap. 10', 'Política de Cancelamento', '35'],
];
sumario.forEach(([cap, titulo, pg], i) => {
  const bgColor = i % 2 === 0 ? WHITE : LGRAY;
  doc.rect(PL, y, CW, 32).fill(bgColor);
  doc.fillColor(GREEN2).font('Helvetica-Bold').fontSize(10).text(cap, PL + 10, y + 10);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text(titulo, PL + 70, y + 10);
  doc.fillColor(MGRAY).font('Helvetica').fontSize(10).text('pág. ' + pg, W - PR - 50, y + 10);
  y += 34;
});

// ═══════════════════════════════════════════
// CAP 1 — A MISSÃO DA RECEPÇÃO
// ═══════════════════════════════════════════
newPage(); chapterCover(1, 'A Missão\nda Recepção', 'Por que a recepção é o coração financeiro da sua clínica');
newPage(); header('A Missão da Recepção', 'Capítulo 1');
y = 130;
y = h2('A recepção não é um custo — é um centro de resultado', y);
y = body('A maioria das clínicas odontológicas trata a recepção como suporte administrativo. Esse é o erro que mais custa dinheiro no consultório.\n\nA recepção é o primeiro e o último contato do paciente com a clínica. Ela define se o paciente volta, se ele indica para alguém e se a agenda permanece cheia. Uma recepção bem treinada e com processos claros pode aumentar o faturamento da clínica em 20 a 40% — sem contratar mais dentistas, sem investir em mais equipamento.', y);
y += 10;
y = alert('💡', 'Dado de mercado: clínicas com recepção padronizada e roteiros de confirmação reduzem a taxa de faltas de 18% para menos de 7% em média. Cada falta que você evita é uma consulta faturada.', y);
y += 6;
y = h2('Os 3 papéis da recepcionista profissional', y);
const papeis = [
  ['Guardiã da agenda', 'Responsável por manter a agenda cheia, sem buracos e com pacientes confirmados. Isso exige proatividade — não esperar o paciente ligar, mas antecipar.'],
  ['Representante da marca', 'Cada atendimento é uma experiência da clínica. A forma como atende o telefone, responde o WhatsApp e recebe o paciente define a percepção de valor do serviço.'],
  ['Geradora de receita', 'Uma recepcionista bem treinada converte mais orçamentos, reactiva pacientes inativos e preenche horários cancelados — diretamente no faturamento.'],
];
papeis.forEach(([t, d]) => { y = card(t, d, y); });

// ═══════════════════════════════════════════
// CAP 2 — ONBOARDING
// ═══════════════════════════════════════════
newPage(); chapterCover(2, 'Onboarding', 'Manual completo para integrar uma nova recepcionista em 5 dias');
newPage(); header('Onboarding da Nova Recepcionista', 'Capítulo 2');
y = 130;
y = h2('Por que ter um processo de onboarding?', y);
y = body('Sem um processo estruturado, a nova recepcionista aprende por tentativa e erro — e os erros custam pacientes. Um onboarding de 5 dias garante que ela opere no padrão da clínica desde o primeiro atendimento real.', y);
y += 10;
const dias = [
  ['Dia 1 — Imersão na clínica', 'Apresentar toda a equipe e os espaços da clínica.\nExplicar a missão, os valores e o padrão de atendimento da clínica.\nMostrar o sistema de agendamento (demonstração sem editar).\nEntregar este Playbook e pedir leitura dos Capítulos 1 e 3.\nObservar atendimento de telefone e WhatsApp junto com a titular.'],
  ['Dia 2 — Sistema e agenda', 'Treinar o sistema de agendamento (cadastro, edição, cancelamento).\nExplicar tipos de consulta e durações de cada procedimento.\nApresentar os dentistas e suas especialidades.\nSimular agendamentos com a supervisora.\nLer Capítulos 4 e 5 deste Playbook.'],
  ['Dia 3 — Atendimento supervisionado', 'Atender telefone com supervisora ao lado (pode ouvir e complementar).\nResponder WhatsApp com revisão antes de enviar.\nPraticar os scripts de confirmação.\nTirar dúvidas ao final do dia.\nLer Capítulos 6 e 7.'],
  ['Dia 4 — Rotina completa', 'Executar abertura da clínica seguindo o checklist (Cap. 5).\nAtender de forma independente com supervisora disponível.\nRegistrar faltas e fazer primeiro contato de reagendamento.\nFechar o dia seguindo o checklist.\nLer Capítulos 8 e 9.'],
  ['Dia 5 — Avaliação e feedback', 'Conversa de 30 min com a gestora: pontos fortes e ajustes.\nDefinir metas do primeiro mês (Cap. 9).\nAssinar o documento de confirmação do treinamento.\nCelebrar — ela já está pronta para operar no padrão da clínica!'],
];
dias.forEach(([titulo, conteudo]) => { y = card(titulo, conteudo, y); });
y += 6;
y = alert('📋', 'Dica: imprima este checklist de onboarding e cole na sala da recepção. Marque cada dia concluído com a nova colaboradora.', y);

// ═══════════════════════════════════════════
// CAP 3 — SCRIPTS WHATSAPP
// ═══════════════════════════════════════════
newPage(); chapterCover(3, 'Scripts de\nWhatsApp', '20 templates prontos para copiar, personalizar e enviar');
newPage(); header('Scripts de WhatsApp', 'Capítulo 3 — Confirmação e Lembretes');
y = 130;
y = body('Todos os templates usam campos entre [colchetes] para personalização. No WhatsApp Business, cadastre cada um em Ferramentas > Respostas Rápidas com um atalho (ex: /confirma).', y);
y += 8;
const wScripts = [
  ['CONFIRMAÇÃO 48H', 'Lembrete dois dias antes', 'Olá, [NOME]! 😊\n\nPassando para lembrar que sua consulta com [DENTISTA] está agendada para [DATA] às [HORA].\n\nConfirme respondendo SIM ou nos avise se precisar remarcar. 🗓️\n\n[CLINICA] 🦷'],
  ['CONFIRMAÇÃO 24H', 'Lembrete véspera', 'Oi, [NOME]! Sua consulta é amanhã às [HORA] com [DENTISTA].\n\nJá confirmado para você! Qualquer imprevisto, nos avise com antecedência. 😊\n\n[CLINICA]'],
  ['LEMBRETE DIA', 'No dia — 2h antes', 'Oi, [NOME]! Sua consulta é hoje às [HORA]. Estamos te esperando! 😊\n\nEndereço: [ENDEREÇO]. Qualquer dúvida é só chamar.\n\n[CLINICA]'],
  ['PÓS-CONSULTA', 'Retorno após atendimento', 'Olá, [NOME]! Foi ótimo atendê-lo(a) hoje! 😊\n\nSe tiver qualquer dúvida ou desconforto, não hesite em nos chamar. Seu próximo retorno está previsto para [DATA].\n\nCuidado com sua saúde bucal!\n\n[CLINICA] 🦷'],
  ['BOAS-VINDAS', 'Paciente novo', 'Olá, [NOME]! Seja bem-vindo(a) à [CLINICA]! 🎉\n\nEstamos felizes em recebê-lo(a). Sua consulta está confirmada para [DATA] às [HORA] com [DENTISTA].\n\nQualquer dúvida antes da consulta, pode perguntar aqui!\n\n[CLINICA] 🦷'],
  ['REATIVAÇÃO 6M', 'Paciente inativo (6 meses)', 'Olá, [NOME]! Sentimos sua falta por aqui! 🦷\n\nFaz um tempo que não te vemos e gostaríamos de saber como você está. Que tal uma avaliação de rotina? Temos horários disponíveis essa semana.\n\nMe chama aqui ou clique: [LINK]\n\n[CLINICA]'],
  ['REATIVAÇÃO 1A', 'Paciente inativo (1 ano ou mais)', 'Oi, [NOME]! Como você está? 😊\n\nJá faz um bom tempo desde sua última visita. A saúde bucal agradece o cuidado regular — que tal marcarmos uma consulta rápida de rotina?\n\nSem compromisso. Me chama aqui!\n\n[CLINICA]'],
  ['ANIVERSÁRIO', 'Parabéns', 'Feliz aniversário, [NOME]! 🎉🦷\n\nToda a equipe da [CLINICA] deseja muita saúde, alegria e — claro — um sorriso lindo!\n\nAproveite seu dia especial! 😊'],
  ['PÓS-FALTA', 'Após não comparecimento', 'Olá, [NOME]! Tudo bem?\n\nNotamos que você não pôde comparecer hoje. Não tem problema — sabemos que imprevistos acontecem!\n\nGostaria de remarcar? Me fala um horário que funcione e eu verifico aqui.\n\n[CLINICA] 😊'],
  ['REAGENDAMENTO', 'Convite para remarcar', 'Oi, [NOME]! Tenho um horário que pode ser perfeito para você: [DATA] às [HORA] com [DENTISTA].\n\nGostaria de confirmar? É rápido! 😊\n\n[CLINICA]'],
  ['CANCELAMENTO', 'Após cancelamento do paciente', 'Olá, [NOME]! Tudo bem?\n\nAnotamos o cancelamento da sua consulta. Quando quiser agendar novamente, pode me chamar aqui ou ligar. Ficamos à disposição! 😊\n\n[CLINICA]'],
  ['AVALIAÇÃO GOOGLE', 'Pedido de review', 'Oi, [NOME]! Esperamos que esteja bem depois da consulta. 😊\n\nSua opinião é muito importante para nós! Teria 1 minutinho para nos avaliar no Google?\n\n⭐ [LINK_GOOGLE]\n\nMuito obrigado pela confiança!\n\n[CLINICA]'],
  ['INDICAÇÃO', 'Programa de indicação', 'Olá, [NOME]! 😊\n\nSabia que você pode indicar amigos e familiares para a [CLINICA] e ganhar [BENEFICIO]?\n\nÉ simples: só compartilhar nosso contato e pedir que a pessoa mencione seu nome na hora de agendar.\n\nObrigado pela confiança! 🦷'],
  ['OFERTA', 'Promoção especial', 'Olá, [NOME]! Uma novidade para você! 🎉\n\n[CLINICA] está com condições especiais em [PROCEDIMENTO] até [DATA_LIMITE].\n\nQuer saber mais ou já agendar? Me chama aqui! Vagas limitadas! 😊'],
  ['COBRANÇA GENTIL', 'Pagamento pendente', 'Olá, [NOME]! Tudo bem?\n\nPassando para lembrar que existe um valor pendente referente à consulta de [DATA] no valor de R$[VALOR].\n\nPode nos informar quando será possível regularizar? Qualquer dúvida, estou aqui! 😊\n\n[CLINICA]'],
  ['INSTRUÇÕES PÓS', 'Cuidados após procedimento', 'Olá, [NOME]! Aqui vão as orientações pós-[PROCEDIMENTO]: 🦷\n\n• [INSTRUCAO 1]\n• [INSTRUCAO 2]\n• [INSTRUCAO 3]\n\nEm caso de dúvida ou desconforto, nos chame aqui! Boa recuperação! 😊\n\n[CLINICA]'],
  ['ORÇAMENTO', 'Envio de orçamento', 'Olá, [NOME]! Conforme conversamos, segue o orçamento: 📋\n\n• [PROCEDIMENTO 1]: R$[VALOR]\n• [PROCEDIMENTO 2]: R$[VALOR]\n\nCondições: [CONDICOES_PAGAMENTO]\n\nOrçamento válido até [DATA]. Qualquer dúvida, estou aqui! 😊\n\n[CLINICA]'],
  ['LISTA ESPERA', 'Horário disponível — lista de espera', 'Oi, [NOME]! Boa notícia! 😊\n\nAbriu um horário que você estava aguardando: [DATA] às [HORA] com [DENTISTA].\n\nPosso confirmar para você? Responda SIM e já reservo!\n\n[CLINICA]'],
  ['SATISFAÇÃO', 'Pesquisa de satisfação', 'Olá, [NOME]! Tudo bem?\n\nGostaríamos de saber como foi sua experiência conosco. São apenas 2 perguntas rápidas:\n\n1️⃣ De 0 a 10, quanto recomendaria a [CLINICA]?\n2️⃣ O que podemos melhorar?\n\nSua opinião nos ajuda muito! Obrigado! 😊'],
  ['RETORNO PREVENTIVO', 'Lembrete de retorno programado', 'Olá, [NOME]! Como está seu sorriso? 😊🦷\n\nEstá na hora de seu retorno de rotina! Recomendamos a consulta a cada 6 meses para manter a saúde bucal em dia.\n\nQuer agendar? Temos horários disponíveis essa semana!\n\n[CLINICA]'],
];
wScripts.forEach((s, i) => {
  if (y + 100 > H - 60) { newPage(); header('Scripts de WhatsApp', 'Capítulo 3 — continuação'); y = 90; }
  doc.roundedRect(PL, y, CW, 1, 0).fill(BORDER);
  const badgeW = 100;
  doc.roundedRect(PL, y + 8, badgeW, 18, 9).fill(NAVY);
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(8).text(s[0], PL + 8, y + 13, { width: badgeW - 16 });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text((i + 1) + '. ' + s[1], PL + badgeW + 8, y + 10, { width: CW - badgeW - 10 });
  y += 32;
  doc.roundedRect(PL + 10, y, CW - 10, 1, 0).fill('#DCF8C6');
  doc.roundedRect(PL + 10, y + 2, CW - 20, 10, 4).fill('#DCF8C6');
  const msgLines = s[2].split('\n').length;
  const msgH = msgLines * 14 + 16;
  doc.roundedRect(PL + 10, y + 2, CW - 20, msgH, 6).fill('#DCF8C6').stroke('#B5E7A0');
  doc.fillColor('#111111').font('Helvetica').fontSize(9.5)
     .text(s[2], PL + 18, y + 10, { width: CW - 36, lineGap: 3 });
  y += msgH + 16;
});

// ═══════════════════════════════════════════
// CAP 4 — SCRIPTS TELEFÔNICOS
// ═══════════════════════════════════════════
newPage(); chapterCover(4, 'Scripts\nTelefônicos', 'Roteiros para padronizar cada tipo de ligação');
newPage(); header('Scripts de Atendimento por Telefone', 'Capítulo 4');
y = 130;
y = body('Use estes roteiros como guia — não como texto engessado. O objetivo é garantir que as informações certas sejam passadas na ordem certa, com o tom profissional da clínica.', y);
y += 10;
const telScripts = [
  ['Abertura padrão', '"[CLINICA], bom dia / boa tarde, [NOME] falando. Como posso ajudar?"'],
  ['Novo agendamento', '"Claro! Para agendar, preciso do seu nome completo... [anota]. Qual seria a melhor data para você? Temos [DIA] às [HORA] ou [DIA2] às [HORA2] — qual prefere? Perfeito! Vou confirmar: [NOME], [DATA] às [HORA] com [DENTISTA]. Enviarei confirmação pelo WhatsApp agora. Até lá!"'],
  ['Paciente quer cancelar', '"Tudo bem, [NOME]. Entendo! Posso remarcar para você agora mesmo? Temos [DIA] às [HORA] disponível — funcionaria? [Se não quiser remarcar:] Sem problema! Quando quiser agendar novamente, pode nos chamar. Até logo!"'],
  ['Pergunta sobre preço', '"O valor de [PROCEDIMENTO] começa a partir de R$[VALOR], mas o orçamento exato é feito pelo dentista na avaliação — que é gratuita e sem compromisso. Que tal marcarmos? Você sai com o valor certinho e o plano de tratamento completo."'],
  ['Paciente impaciente / bravo', '"Entendo, [NOME], e me desculpe pela situação. Vou verificar isso agora mesmo para você. [pausa] Aqui está o que posso fazer: [SOLUCAO]. Isso funciona para você?"'],
  ['Informações de endereço e horário', '"Estamos na [ENDERECO]. Nosso horário de funcionamento é [HORARIO]. O estacionamento mais próximo é [INFO_ESTACIONAMENTO]. Tem mais alguma dúvida?"'],
  ['Finalização profissional', '"Posso ajudar com mais alguma coisa? [resposta] Ótimo! Qualquer dúvida estamos à disposição. Tenha um ótimo dia! Até logo!"'],
];
telScripts.forEach(([titulo, script]) => {
  if (y + 80 > H - 60) { newPage(); header('Scripts Telefônicos', 'Capítulo 4 — continuação'); y = 90; }
  doc.rect(PL, y, 5, 20).fill(NAVY);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text(titulo, PL + 13, y + 2, { width: CW - 13 });
  y += 26;
  doc.roundedRect(PL + 10, y, CW - 10, 1, 0);
  const lines = script.split('\n').length + script.length / 80;
  const h = Math.max(lines * 14 + 20, 40);
  doc.roundedRect(PL + 10, y, CW - 20, h, 6).fill(LGRAY).stroke(BORDER);
  doc.fillColor(DGRAY).font('Helvetica').fontSize(10)
     .text(script, PL + 18, y + 10, { width: CW - 36, lineGap: 4 });
  y += h + 16;
});

// ═══════════════════════════════════════════
// CAP 5 — CHECKLISTS
// ═══════════════════════════════════════════
newPage(); chapterCover(5, 'Checklists\nde Rotina', 'Abertura, durante o dia e fechamento — nada esquecido');
newPage(); header('Checklists de Rotina Diária', 'Capítulo 5');
y = 130;
y = alert('📋', 'Imprima este checklist e cole na área da recepção. Use marcação física (caneta) — é mais eficiente que digital para rotina diária.', y);
y += 4;
y = h2('Rotina de Abertura (antes das consultas)', y);
const abertura = [
  ['Verificar agenda do dia no sistema', 'Confirmar horários, dentistas e tipo de cada consulta'],
  ['Confirmar consultas da tarde por WhatsApp', 'Use o Script CONFIRMAÇÃO 24H — Cap. 3'],
  ['Checar mensagens e e-mails pendentes', 'Responder antes do primeiro paciente chegar'],
  ['Preparar fichas e prontuários do dia', 'Imprimir ou abrir no sistema'],
  ['Verificar materiais básicos da recepção', 'Caneta, formulários, máquina de cartão carregada'],
  ['Organizar sala de espera', 'Revistas, temperatura, música ambiente'],
  ['Conferir se há pacientes novos', 'Preparar boas-vindas e ficha de cadastro'],
  ['Verificar estoque de água e café', 'Repor se necessário'],
];
abertura.forEach(([t, s]) => { y = checkItem(t, y, s); });
y += 10;
y = h2('Durante o Dia', y);
const durante = [
  ['Registrar chegada de cada paciente no sistema', 'Marcar horário de entrada'],
  ['Receber novos pacientes com protocolo de boas-vindas', 'Oferecer água, apresentar a clínica brevemente'],
  ['Anotar faltas e contatar imediatamente para reagendamento', 'Usar Script PÓS-FALTA — Cap. 3'],
  ['Confirmar consultas do dia seguinte', 'Script CONFIRMAÇÃO 24H'],
  ['Atualizar cadastro de pacientes novos', 'CPF, data de nascimento, WhatsApp, e-mail'],
  ['Receber pagamentos e emitir recibo', 'Conferir troco e máquina de cartão'],
  ['Responder WhatsApp em até 10 minutos', 'Prioridade máxima'],
  ['Preencher planilha de faltas (Cap. 6)', 'Diariamente, sem acúmulo'],
];
durante.forEach(([t, s]) => { y = checkItem(t, y, s); });
newPage(); header('Checklists de Rotina Diária', 'Capítulo 5 — continuação');
y = 100;
y = h2('Rotina de Fechamento (fim do expediente)', y);
const fechamento = [
  ['Conferir agenda do dia seguinte', 'Identificar gaps e pacientes sem confirmação'],
  ['Enviar lembretes de amanhã não enviados ainda', 'Script CONFIRMAÇÃO 24H'],
  ['Registrar todas as faltas do dia', 'Planilha de controle — Cap. 6'],
  ['Fechar caixa e conferir pagamentos', 'Registrar no sistema'],
  ['Organizar recepção para o dia seguinte', 'Mesa limpa, material reposto'],
  ['Bloquear horários indisponíveis no sistema', 'Folgas, reuniões, manutenção'],
  ['Desligar equipamentos não essenciais', 'Computador, impressora, TV'],
  ['Registrar ocorrências do dia para a gestora', 'Pacientes difíceis, problemas, oportunidades'],
];
fechamento.forEach(([t, s]) => { y = checkItem(t, y, s); });

// ═══════════════════════════════════════════
// CAP 6 — GESTÃO DE FALTAS
// ═══════════════════════════════════════════
newPage(); chapterCover(6, 'Gestão de\nFaltas', 'Como reduzir faltas e preencher horários vazios rapidamente');
newPage(); header('Gestão de Faltas e Reagendamento', 'Capítulo 6');
y = 130;
y = h2('Por que as faltas acontecem?', y);
const motivosFaltas = [
  ['Esquecimento', '47% das faltas', 'Resolvido com lembretes 48h e 24h antes'],
  ['Imprevisto de trabalho', '23% das faltas', 'Ofereça horários alternativos no mesmo dia ou seguinte'],
  ['Transporte / logística', '14% das faltas', 'Envie o endereço e opções de transporte com antecedência'],
  ['Medo / ansiedade', '10% das faltas', 'Acolha o paciente com empatia e ofereça suporte'],
  ['Financeiro', '6% das faltas', 'Ofereça parcelamento e negocie antes que vire falta'],
];
motivosFaltas.forEach(([motivo, pct, solucao]) => {
  if (y + 38 > H - 60) { newPage(); header(null); y = 80; }
  doc.roundedRect(PL, y, CW, 36, 6).fill(LGRAY).stroke(BORDER);
  doc.rect(PL, y, 5, 36).fill(RED);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text(motivo, PL + 13, y + 4, { width: 150 });
  doc.fillColor(RED).font('Helvetica-Bold').fontSize(10).text(pct, PL + 13, y + 20, { width: 150 });
  doc.fillColor(DGRAY).font('Helvetica').fontSize(10).text(solucao, PL + 175, y + 13, { width: CW - 185 });
  y += 42;
});
y += 6;
y = h2('Protocolo quando o paciente falta', y);
const protocolo = [
  'Aguardar 15 minutos após o horário marcado.',
  'Ligar para o número cadastrado (1 tentativa).',
  'Se não atender: enviar Script PÓS-FALTA pelo WhatsApp.',
  'Registrar na Planilha de Controle de Faltas.',
  'Se não retornar em 24h: tentar contato novamente.',
  'Oferecer reagendamento com facilidade — sem culpar o paciente.',
];
y = h3('Passo a passo:', y);
protocolo.forEach((p, i) => {
  if (y + 22 > H - 60) { newPage(); header(null); y = 80; }
  doc.circle(PL + 10, y + 8, 10).fill(NAVY);
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(9).text(String(i + 1), PL + 7, y + 4);
  doc.fillColor(DGRAY).font('Helvetica').fontSize(11).text(p, PL + 26, y, { width: CW - 26 });
  y += 24;
});
y += 6;
y = h2('Lista de Encaixe — seu seguro contra faltas', y);
y = body('Mantenha sempre uma lista com 5 a 8 pacientes que topam consulta em cima da hora. Quando alguém falta, ligue imediatamente para os primeiros da lista. Horário vazio = receita perdida que nunca volta.', y);
y += 6;
y = alert('💡', 'Meta: taxa de faltas abaixo de 8%. Com lembretes 48h + 24h implementados, clínicas chegam a 4-5% em 30 dias. Registre sua taxa atual para medir a evolução.', y);

// ═══════════════════════════════════════════
// CAP 7 — PACIENTE DIFÍCIL
// ═══════════════════════════════════════════
newPage(); chapterCover(7, 'O Paciente\nDifícil', 'Como lidar com reclamações, estresse e situações delicadas');
newPage(); header('Como Lidar com o Paciente Difícil', 'Capítulo 7');
y = 130;
y = body('Paciente difícil não é inimigo — é uma oportunidade de fidelização. A forma como a recepção lida com conflitos define se o paciente vai embora falando mal ou se torna um defensor da clínica.', y);
y += 10;
const tiposPaciente = [
  ['O paciente impaciente (atraso na consulta)', '"[NOME], peço desculpas pela espera. O [DENTISTA] está concluindo um procedimento e em aproximadamente [X] minutos estará com você. Posso oferecer um café ou água enquanto aguarda?"'],
  ['O paciente bravo com o resultado', '"Entendo como você se sente, [NOME], e me desculpe pela frustração. O mais importante agora é resolver. Vou verificar com o [DENTISTA] para que vocês conversem hoje mesmo. Posso agendar esse momento agora?"'],
  ['O paciente que questiona o preço', '"Entendo, [NOME]. O valor reflete a qualidade dos materiais e o cuidado do tratamento. Posso verificar as opções de parcelamento disponíveis? Muitas vezes conseguimos encaixar no seu orçamento com mais conforto."'],
  ['O paciente que quer cancelar tudo', '"Claro, [NOME], vou anotar. Antes de finalizar, posso perguntar o que aconteceu? Às vezes conseguimos ajustar algo para que você continue o tratamento sem perder o que já foi feito."'],
  ['O paciente ansioso / com medo', '"[NOME], é muito comum se sentir assim e você está no lugar certo. O [DENTISTA] é especialista em pacientes que sentem ansiedade. Vou avisar que você chegou para ele já saber. Quer que eu fique com você até a consulta começar?"'],
];
tiposPaciente.forEach(([tipo, resposta]) => { y = card(tipo, resposta, y); });

// ═══════════════════════════════════════════
// CAP 8 — COBRANÇA
// ═══════════════════════════════════════════
newPage(); chapterCover(8, 'Cobrança\nHumanizada', 'Como receber valores atrasados sem perder o paciente');
newPage(); header('Protocolo de Cobrança Humanizada', 'Capítulo 8');
y = 130;
y = body('Cobrar é constrangedor para a recepção e para o paciente. Com o protocolo certo, você recebe o valor e mantém o relacionamento.', y);
y += 10;
y = h2('Os 3 passos da cobrança humanizada', y);
const cobSteps = [
  ['Passo 1 — Lembrete gentil (até 7 dias)', 'Tom: amigável, sem acusação.\nScript WhatsApp: "Olá, [NOME]! Tudo bem? Passando para lembrar que existe um valor pendente de R$[VALOR] ref. consulta de [DATA]. Quando for possível regularizar, me avisa aqui! 😊 [CLINICA]"'],
  ['Passo 2 — Contato direto (8 a 20 dias)', 'Tom: firme, mas cordial. Ligar — não só WhatsApp.\nScript: "Olá, [NOME]. Estou ligando sobre um valor em aberto de R$[VALOR]. Gostaria de entender se houve algum problema ou se podemos combinar uma data para regularizar. O que seria possível para você?"'],
  ['Passo 3 — Negociação (após 20 dias)', 'Tom: solução, não cobrança.\nScript: "Olá, [NOME]. Sei que às vezes o orçamento aperta. Podemos parcelar o valor de R$[VALOR] em [X] vezes de R$[PARCELA]? Quero que isso não prejudique sua relação com a clínica."'],
];
cobSteps.forEach(([t, c]) => { y = card(t, c, y); });
y += 6;
y = alert('⚠️', 'Nunca ameace, constrange ou exponha o paciente. Cobrança agressiva perde o valor E o paciente. O objetivo é sempre recuperar a relação e o valor juntos.', y, '#FFEBEE', RED);

// ═══════════════════════════════════════════
// CAP 9 — MÉTRICAS
// ═══════════════════════════════════════════
newPage(); chapterCover(9, 'Métricas e\nMetas', 'Os números que toda recepção profissional precisa acompanhar');
newPage(); header('Métricas e Metas da Recepção', 'Capítulo 9');
y = 130;
y = body('Você não pode melhorar o que não mede. Estas são as 6 métricas que a recepção deve acompanhar mensalmente e apresentar para a gestora.', y);
y += 10;
const metricas = [
  ['Taxa de Faltas', 'Faltas ÷ Consultas agendadas × 100', 'Meta: abaixo de 8%', 'Semana'],
  ['Taxa de Confirmação', 'Consultas confirmadas ÷ Total enviadas × 100', 'Meta: acima de 85%', 'Semana'],
  ['Tempo de Resposta WhatsApp', 'Média de minutos para primeira resposta', 'Meta: menos de 10 min', 'Dia'],
  ['Taxa de Reagendamento', 'Faltas reagendadas ÷ Total de faltas × 100', 'Meta: acima de 60%', 'Mês'],
  ['Novos Pacientes', 'Cadastros novos no período', 'Benchmark: 10-15% da agenda', 'Mês'],
  ['Satisfação (NPS)', 'Média das notas 0-10 coletadas', 'Meta: acima de 8,5', 'Mês'],
];
doc.rect(PL, y, CW, 28).fill(NAVY);
['Métrica', 'Cálculo', 'Meta', 'Frequência'].forEach((h, i) => {
  const xs = [PL + 8, PL + 140, PL + 330, PL + 440];
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10).text(h, xs[i], y + 9);
});
y += 28;
metricas.forEach((m, i) => {
  const bg = i % 2 === 0 ? WHITE : LGRAY;
  doc.rect(PL, y, CW, 30).fill(bg).stroke(BORDER);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(m[0], PL + 8, y + 10, { width: 128 });
  doc.fillColor(DGRAY).font('Helvetica').fontSize(8.5).text(m[1], PL + 140, y + 10, { width: 186 });
  doc.fillColor(GREEN2).font('Helvetica-Bold').fontSize(9).text(m[2], PL + 330, y + 10, { width: 106 });
  doc.fillColor(MGRAY).font('Helvetica').fontSize(9).text(m[3], PL + 440, y + 10, { width: 80 });
  y += 30;
});

// ═══════════════════════════════════════════
// CAP 10 — POLÍTICA DE CANCELAMENTO
// ═══════════════════════════════════════════
newPage(); chapterCover(10, 'Política de\nCancelamento', 'Como comunicar, aplicar e fazer o paciente respeitar');
newPage(); header('Política de Cancelamento', 'Capítulo 10');
y = 130;
y = body('Ter uma política de cancelamento clara protege a agenda e o faturamento da clínica. Sem ela, o paciente acha que pode cancelar a qualquer hora sem consequência.', y);
y += 10;
y = h2('Política recomendada', y);
y = card('Cancelamentos com menos de 24h de antecedência', 'A clínica poderá cobrar uma taxa de remarcação de R$[VALOR] ou solicitar um sinal para confirmar o próximo agendamento.\n\nExceções: emergências médicas comprovadas e casos de força maior são sempre considerados.', y);
y = card('Como comunicar a política ao paciente', 'Mencionar no momento do agendamento: "Só lembrando que nosso horário tem uma política de cancelamento com 24h de antecedência. Caso precise cancelar, nos avise antes para evitar taxas e conseguirmos oferecer o horário para outro paciente que precisa."\n\nEnviar no WhatsApp de confirmação como lembrete gentil.', y);
y = card('O que fazer quando o paciente cancela em cima da hora pela 2ª vez', 'Na 2ª ocorrência: mencionar a política com cordialidade e registrar.\nNa 3ª ocorrência: exigir sinal de confirmação (30-50% do valor da consulta) para garantir o horário.\nIsso reduz reincidência em mais de 70%.', y);
y += 6;
y = alert('💡', 'Dica: comunique a política como proteção ao paciente ("assim garantimos que seu horário estará reservado") e não como punição. O tom faz toda a diferença na aceitação.', y);

// ═══════════════════════════════════════════
// PÁGINA FINAL — CTA
// ═══════════════════════════════════════════
newPage();
doc.rect(0, 0, W, H).fill(NAVY);
doc.rect(0, H - 8, W, 8).fill(GREEN);
doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(13)
   .text('VOCÊ CHEGOU AO FIM DO PLAYBOOK', PL, 80, { width: CW, align: 'center' });
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(30)
   .text('Agora implemente.\nUma coisa por semana.', PL, 116, { width: CW, align: 'center', lineGap: 8 });
doc.fillColor(MGRAY).font('Helvetica').fontSize(13)
   .text('Não tente mudar tudo de uma vez. Escolha um capítulo, implemente em 7 dias e depois passe para o próximo. Em 10 semanas sua recepção será outra.', PL + 40, 210, { width: CW - 80, align: 'center', lineGap: 5 });
doc.rect(PL + 60, 280, CW - 120, 1).fill('#2A3A6A');
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(16)
   .text('Quer automatizar esses processos?', PL, 300, { width: CW, align: 'center' });
doc.fillColor(MGRAY).font('Helvetica').fontSize(12)
   .text('O Já Agendou integra agenda, lembretes automáticos, WhatsApp e controle de faltas em um único sistema — feito para clínicas odontológicas.', PL + 40, 328, { width: CW - 80, align: 'center', lineGap: 5 });
doc.roundedRect(PL + 80, 400, CW - 160, 52, 10).fill(GREEN);
doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(15)
   .text('Testar grátis por 7 dias — jaagendou.app', PL + 80, 416, { width: CW - 160, align: 'center', link: 'https://jaagendou.app' });
doc.fillColor('#3A4F7A').font('Helvetica').fontSize(10)
   .text('© 2026 Já Agendou — jaagendou.app', PL, H - 40, { width: CW, align: 'center' });

doc.end();
console.log('Playbook gerado: ' + OUT);
