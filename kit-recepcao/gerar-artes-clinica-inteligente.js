/**
 * Meta Ads — Clínica Inteligente
 * Público: Dentistas empreendedores, 28–48 anos
 *
 * 9 artes no total:
 *   Feed 1:1   (540×540pt — exportar a 2x para 1080×1080px)
 *   Stories 9:16 (540×960pt — exportar a 2x para 1080×1920px)
 *
 *   V1 — Dor financeira         ("Você fatura bem. Mas por que não sobra?")
 *   V2 — Autoridade / Conteúdo  ("10 módulos que sua faculdade não deu")
 *   V3 — Prova / Resultado      (métricas e depoimento)
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');

const OUT = 'C:/Users/otavi/Pictures/ja-agendou/kit-recepcao/artes-clinica-inteligente';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ── Paleta ────────────────────────────────────────────────────────────────
const NAVY  = '#050E24';
const NAVY2 = '#0D1B40';
const OURO  = '#C9A84C';
const OURO2 = '#E8C87A';
const WHITE = '#FFFFFF';
const GRAY  = '#8A9BB0';
const GREEN = '#2ECC71';
const RED   = '#E74C3C';

// ── Tamanhos (em pt, design a 1x; exportar PDF em 2x para pixels) ─────────
const FW = 540, FH = 540;   // feed
const SW = 540, SH = 960;   // stories

// ── Helpers ───────────────────────────────────────────────────────────────
function novoPDF(w, h, nome) {
  const d = new PDFDocument({ size: [w, h], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  d.pipe(fs.createWriteStream(`${OUT}/${nome}.pdf`));
  return d;
}

function fundo(d, w, h) {
  d.rect(0, 0, w, h).fill(NAVY);
}

function barraOuro(d, w, h, esp = 4) {
  d.rect(0, 0, w, esp).fill(OURO);
  d.rect(0, h - esp, w, esp).fill(OURO);
}

function logoTag(d, x, y, w) {
  d.roundedRect(x, y, w, 24, 12).fill(OURO);
  d.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
   .text('jaagendou.app', x, y + 7, { width: w, align: 'center' });
}

function badgePremium(d, x, y, texto, w) {
  d.roundedRect(x, y, w, 22, 11).fill('rgba(201,168,76,0.15)');
  d.rect(x, y, 3, 22).fill(OURO);
  d.fillColor(OURO).font('Helvetica-Bold').fontSize(9)
   .text(texto, x + 10, y + 6, { width: w - 14 });
}

function linhaDecor(d, x, y, wTotal) {
  d.rect(x, y, wTotal * 0.28, 2).fill(OURO);
  d.rect(x + wTotal * 0.30, y, wTotal * 0.70, 2).fillOpacity(0.18).fill(OURO);
  d.fillOpacity(1);
}

function precoBloco(d, x, y, w, small = false) {
  // PIX
  d.roundedRect(x, y, w, small ? 70 : 86, 10).fill(NAVY2);
  d.rect(x, y, 4, small ? 70 : 86).fill(GREEN);
  const py = y + (small ? 8 : 10);
  d.fillColor(GREEN).font('Helvetica-Bold').fontSize(small ? 8 : 9)
   .text('PIX / BOLETO', x + 14, py, { width: w - 20 });
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(small ? 26 : 32)
   .text('R$ 177', x + 14, py + (small ? 14 : 16), { width: w - 20 });
  d.fillColor(GRAY).font('Helvetica').fontSize(small ? 8 : 9)
   .text('Economize R$20 vs. cartão', x + 14, py + (small ? 44 : 52), { width: w - 20 });
  // Cartão
  const by = y + (small ? 76 : 92);
  d.fillColor(GRAY).font('Helvetica').fontSize(small ? 9 : 10)
   .text('ou cartão 3× de R$69,90', x, by, { width: w, align: 'center' });
}

function ctaButton(d, x, y, w, h2 = 40, texto = 'GARANTIR ACESSO AGORA →') {
  d.roundedRect(x, y, w, h2, h2 / 2).fill(OURO);
  d.fillColor(NAVY).font('Helvetica-Bold').fontSize(12)
   .text(texto, x, y + h2 / 2 - 7, { width: w, align: 'center' });
}

// ════════════════════════════════════════════════════════════════════════════
// V1 — DOR FINANCEIRA: "Você fatura bem. Por que não sobra?"
// ════════════════════════════════════════════════════════════════════════════

function v1Feed() {
  const d = novoPDF(FW, FH, 'feed_v1_dor');
  fundo(d, FW, FH);
  barraOuro(d, FW, FH);

  // Elemento visual de impacto — número grande desbotado
  d.fillColor(OURO).fillOpacity(0.06).font('Helvetica-Bold').fontSize(260)
   .text('R$', -20, 60, { width: FW });
  d.fillOpacity(1);

  logoTag(d, 24, 22, 130);
  badgePremium(d, 24, 58, 'PARA DENTISTAS EMPREENDEDORES', 260);

  // Headline
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(28)
   .text('Você fatura bem.', 24, 106, { width: FW - 48 });
  d.fillColor(OURO).font('Helvetica-Bold').fontSize(28)
   .text('Por que não sobra\ndinheiro?', 24, 140, { width: FW - 48, lineGap: 2 });

  linhaDecor(d, 24, 210, FW - 48);

  // Dores
  const pontos = [
    'Custos ocultos que ninguém calculou',
    'Precificação abaixo do custo real',
    'Inadimplência sem protocolo',
    'Pró-labore esquecido no planejamento',
  ];
  pontos.forEach((p, i) => {
    d.fillColor(OURO).font('Helvetica-Bold').fontSize(14).text('◆', 24, 224 + i * 30);
    d.fillColor(WHITE).font('Helvetica').fontSize(12)
     .text(p, 44, 226 + i * 30, { width: FW - 68 });
  });

  linhaDecor(d, 24, 350, FW - 48);

  // Solução
  d.fillColor(GRAY).font('Helvetica').fontSize(11)
   .text('Clínica Inteligente resolve isso.', 24, 362, { width: FW - 48 });

  precoBloco(d, 24, 388, FW - 48, true);
  ctaButton(d, 24, FH - 56, FW - 48, 40);

  d.end();
  console.log('✓ feed_v1_dor.pdf');
}

function v1Story() {
  const d = novoPDF(SW, SH, 'story_v1_dor');
  fundo(d, SW, SH);
  barraOuro(d, SW, SH, 5);

  // Elemento visual grande
  d.fillColor(OURO).fillOpacity(0.05).font('Helvetica-Bold').fontSize(360)
   .text('R$', -30, 80, { width: SW });
  d.fillOpacity(1);

  logoTag(d, 30, 40, 150);
  badgePremium(d, 30, 80, 'PARA DENTISTAS EMPREENDEDORES', 290);

  // Headline grande
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(42)
   .text('Você fatura bem.', 30, 140, { width: SW - 60 });
  d.fillColor(OURO).font('Helvetica-Bold').fontSize(42)
   .text('Por que não\nsobra dinheiro?', 30, 192, { width: SW - 60, lineGap: 4 });

  linhaDecor(d, 30, 310, SW - 60);

  // Dores
  const pontos = [
    'Custos ocultos que nunca foram calculados',
    'Precificação abaixo do custo real do procedimento',
    'Inadimplência sem protocolo de controle',
    'Pró-labore ausente do planejamento financeiro',
    'Fixos crescem mas faturamento estagna',
  ];
  pontos.forEach((p, i) => {
    const py = 326 + i * 48;
    d.roundedRect(30, py, SW - 60, 40, 8).fill(NAVY2);
    d.rect(30, py, 4, 40).fill(RED);
    d.fillColor(WHITE).font('Helvetica').fontSize(13)
     .text(p, 44, py + 12, { width: SW - 78 });
  });

  linhaDecor(d, 30, 580, SW - 60);

  d.fillColor(OURO).font('Helvetica-Bold').fontSize(17)
   .text('Clínica Inteligente', 30, 598, { width: SW - 60 });
  d.fillColor(GRAY).font('Helvetica').fontSize(13)
   .text('10 módulos para transformar gestão financeira da sua clínica.', 30, 622, { width: SW - 60, lineGap: 3 });

  linhaDecor(d, 30, 672, SW - 60);

  precoBloco(d, 30, 690, SW - 60);
  ctaButton(d, 30, SH - 90, SW - 60, 48, 'GARANTIR ACESSO AGORA →');
  d.fillColor(GRAY).font('Helvetica').fontSize(10)
   .text('🔒 7 dias de garantia · Acesso imediato', 30, SH - 32, { width: SW - 60, align: 'center' });

  d.end();
  console.log('✓ story_v1_dor.pdf');
}

// ════════════════════════════════════════════════════════════════════════════
// V2 — AUTORIDADE: "O guia que sua faculdade nunca deu"
// ════════════════════════════════════════════════════════════════════════════

function v2Feed() {
  const d = novoPDF(FW, FH, 'feed_v2_guia');
  fundo(d, FW, FH);
  barraOuro(d, FW, FH);

  // Grid de módulos como elemento visual
  const mods = ['Gestão', 'Finanças', 'Marketing', 'Automação', 'Equipe', 'Precificação', 'Expansão', 'CEO', 'Jurídico', '90 Dias'];
  mods.forEach((m, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    d.roundedRect(24 + col * 98, 22 + row * 30, 92, 24, 5).fill(NAVY2);
    d.fillColor(OURO).font('Helvetica-Bold').fontSize(7)
     .text(`M${String(i + 1).padStart(2, '0')}`, 30 + col * 98, 28 + row * 30, { width: 20 });
    d.fillColor(WHITE).font('Helvetica').fontSize(8)
     .text(m, 52 + col * 98, 29 + row * 30, { width: 58 });
  });

  // Gradiente sobre o grid
  d.rect(0, 78, FW, 40).fill(NAVY).fillOpacity(0.7);
  d.fillOpacity(1);

  // Tag
  badgePremium(d, 24, 88, 'A FACULDADE NÃO ENSINOU ISSO', 260);

  // Headline
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(24)
   .text('O guia completo de\ngestão para dentistas.', 24, 124, { width: FW - 48, lineGap: 3 });
  d.fillColor(OURO).font('Helvetica-Bold').fontSize(13)
   .text('10 módulos · Aplicação imediata · Sem enrolação', 24, 186, { width: FW - 48 });

  linhaDecor(d, 24, 208, FW - 48);

  // O que tem dentro
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text('O que você recebe:', 24, 220);
  const itens = ['Gestão estratégica e financeira', 'Marketing digital para dentistas', 'Automação e CRM odontológico', 'Plano de 90 dias semana a semana'];
  itens.forEach((t, i) => {
    d.fillColor(GREEN).font('Helvetica-Bold').fontSize(10).text('✓', 24, 242 + i * 24);
    d.fillColor(WHITE).font('Helvetica').fontSize(11).text(t, 42, 242 + i * 24, { width: FW - 66 });
  });

  linhaDecor(d, 24, 344, FW - 48);

  precoBloco(d, 24, 358, FW - 48, true);
  ctaButton(d, 24, FH - 56, FW - 48, 40);

  d.end();
  console.log('✓ feed_v2_guia.pdf');
}

function v2Story() {
  const d = novoPDF(SW, SH, 'story_v2_guia');
  fundo(d, SW, SH);
  barraOuro(d, SW, SH, 5);

  logoTag(d, 30, 40, 150);

  // Headline principal
  d.fillColor(OURO).font('Helvetica-Bold').fontSize(13)
   .text('A FACULDADE NÃO ENSINOU ISSO', 30, 88, { width: SW - 60 });
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(44)
   .text('O guia\ncompleto de\ngestão para\ndentistas.', 30, 114, { width: SW - 60, lineGap: 5 });

  linhaDecor(d, 30, 308, SW - 60);

  // Módulos listados
  const mods = [
    ['01', 'Gestão Estratégica — pensar como dono'],
    ['02', 'Finanças Clínicas — custo real de cada procedimento'],
    ['03', 'Marketing Digital — Instagram e Google que convertem'],
    ['04', 'Automação e CRM — atender mais com menos esforço'],
    ['05', 'Equipe de Alta Performance — contratar e reter'],
    ['06', 'Precificação Inteligente — parar de vender barato'],
    ['07', 'Expansão — abrir a 2ª unidade sem quebrar a 1ª'],
    ['08', 'Rotina do CEO Dentista — trabalhar NO negócio'],
    ['09', 'Jurídico e Compliance — proteger o que construiu'],
    ['10', 'Plano de 90 Dias — semana a semana até dobrar'],
  ];
  mods.forEach(([num, nome], i) => {
    const bg = i % 2 === 0 ? NAVY2 : '#080F28';
    d.roundedRect(30, 326 + i * 44, SW - 60, 38, 6).fill(bg);
    d.fillColor(OURO).font('Helvetica-Bold').fontSize(9)
     .text(`M${num}`, 42, 338 + i * 44, { width: 28 });
    d.fillColor(WHITE).font('Helvetica').fontSize(10)
     .text(nome, 72, 338 + i * 44, { width: SW - 110 });
  });

  linhaDecor(d, 30, 776, SW - 60);

  precoBloco(d, 30, 794, SW - 60);
  ctaButton(d, 30, SH - 90, SW - 60, 48, 'QUERO OS 10 MÓDULOS →');
  d.fillColor(GRAY).font('Helvetica').fontSize(10)
   .text('7 dias de garantia · Acesso imediato após pagamento', 30, SH - 32, { width: SW - 60, align: 'center' });

  d.end();
  console.log('✓ story_v2_guia.pdf');
}

// ════════════════════════════════════════════════════════════════════════════
// V3 — PROVA / RESULTADO: métricas + depoimento
// ════════════════════════════════════════════════════════════════════════════

function v3Feed() {
  const d = novoPDF(FW, FH, 'feed_v3_resultado');
  fundo(d, FW, FH);
  barraOuro(d, FW, FH);

  logoTag(d, 24, 22, 130);
  badgePremium(d, 24, 58, 'RESULTADOS DE QUEM APLICOU', 250);

  // Headline
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
   .text('Em 60 dias ajustei\na tabela de preços.', 24, 92, { width: FW - 48, lineGap: 3 });
  d.fillColor(OURO).font('Helvetica-Bold').fontSize(22)
   .text('Meu lucro dobrou.', 24, 138, { width: FW - 48 });

  // Autoria do depoimento
  d.fillColor(GRAY).font('Helvetica').fontSize(11)
   .text('Dr. Eduardo B. · Clínica Geral, Campinas/SP', 24, 170, { width: FW - 48 });

  linhaDecor(d, 24, 194, FW - 48);

  // 3 métricas lado a lado
  const metricas = [['+30%', 'faturamento'], ['–60%', 'faltas'], ['+40%', 'pacientes']];
  metricas.forEach(([val, label], i) => {
    const x = 24 + i * 164;
    d.roundedRect(x, 208, 152, 76, 10).fill(NAVY2);
    d.rect(x, 208, 4, 76).fill(OURO);
    d.fillColor(OURO).font('Helvetica-Bold').fontSize(28).text(val, x + 14, 222, { width: 134 });
    d.fillColor(WHITE).font('Helvetica').fontSize(11).text(label, x + 14, 258, { width: 134 });
  });

  linhaDecor(d, 24, 298, FW - 48);

  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
   .text('Clínica Inteligente — 10 Módulos', 24, 312, { width: FW - 48 });
  d.fillColor(GRAY).font('Helvetica').fontSize(11)
   .text('Gestão · Finanças · Marketing · Automação · Plano de 90 Dias', 24, 330, { width: FW - 48 });

  linhaDecor(d, 24, 352, FW - 48);

  precoBloco(d, 24, 368, FW - 48, true);
  ctaButton(d, 24, FH - 56, FW - 48, 40);

  d.end();
  console.log('✓ feed_v3_resultado.pdf');
}

function v3Story() {
  const d = novoPDF(SW, SH, 'story_v3_resultado');
  fundo(d, SW, SH);
  barraOuro(d, SW, SH, 5);

  logoTag(d, 30, 40, 150);
  badgePremium(d, 30, 80, 'RESULTADO DE QUEM APLICOU', 280);

  // Número grande de impacto
  d.fillColor(OURO).fillOpacity(0.07).font('Helvetica-Bold').fontSize(300)
   .text('+30', -20, 60, { width: SW + 40 });
  d.fillOpacity(1);

  // Depoimento
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(36)
   .text('"Em 60 dias\nmeu lucro\ndobrou."', 30, 148, { width: SW - 60, lineGap: 5 });
  d.fillColor(OURO).font('Helvetica-Bold').fontSize(13)
   .text('Dr. Eduardo B.', 30, 292, { width: SW - 60 });
  d.fillColor(GRAY).font('Helvetica').fontSize(11)
   .text('Clínica Geral · Campinas, SP', 30, 310, { width: SW - 60 });

  linhaDecor(d, 30, 344, SW - 60);

  // 3 métricas empilhadas
  const metricas = [
    ['+30–50%', 'Aumento de faturamento', 'Clínicas que aplicam o plano completo em 90 dias'],
    ['–60%',    'Redução de faltas',       'Com confirmação automática e lista de encaixe ativa'],
    ['+40%',    'Novos pacientes',         'Google Meu Negócio otimizado + reativação de inativos'],
  ];
  metricas.forEach(([val, titulo, desc], i) => {
    const my = 364 + i * 116;
    d.roundedRect(30, my, SW - 60, 108, 10).fill(NAVY2);
    d.rect(30, my, 5, 108).fill(OURO);
    d.fillColor(OURO).font('Helvetica-Bold').fontSize(36).text(val, 46, my + 14, { width: SW - 80 });
    d.fillColor(WHITE).font('Helvetica-Bold').fontSize(13).text(titulo, 46, my + 60, { width: SW - 80 });
    d.fillColor(GRAY).font('Helvetica').fontSize(10).text(desc, 46, my + 80, { width: SW - 80 });
  });

  linhaDecor(d, 30, 720, SW - 60);

  // Garantia
  d.roundedRect(30, 736, SW - 60, 38, 8).fill(NAVY2);
  d.rect(30, 736, 4, 38).fill(GREEN);
  d.fillColor(GREEN).font('Helvetica-Bold').fontSize(10).text('GARANTIA TOTAL', 44, 744, { continued: true });
  d.fillColor(WHITE).font('Helvetica').fontSize(10).text('  7 dias · risco zero · sem perguntas');

  linhaDecor(d, 30, 784, SW - 60);

  precoBloco(d, 30, 800, SW - 60);
  ctaButton(d, 30, SH - 90, SW - 60, 48, 'QUERO ESSE RESULTADO →');
  d.fillColor(GRAY).font('Helvetica').fontSize(10)
   .text('jaagendou.app/clinica-inteligente', 30, SH - 32, { width: SW - 60, align: 'center' });

  d.end();
  console.log('✓ story_v3_resultado.pdf');
}

// ════════════════════════════════════════════════════════════════════════════
// V4 — URGÊNCIA: Countdown / oferta encerra
// ════════════════════════════════════════════════════════════════════════════

function v4Feed() {
  const d = novoPDF(FW, FH, 'feed_v4_urgencia');
  fundo(d, FW, FH);
  // Barra vermelha no topo (urgência)
  d.rect(0, 0, FW, 5).fill(RED);
  d.rect(0, FH - 5, FW, 5).fill(OURO);

  logoTag(d, 24, 20, 130);

  // Badge urgência
  d.roundedRect(24, 56, 240, 24, 12).fill(RED);
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
   .text('⏰ OFERTA DE LANÇAMENTO — ENCERRA EM BREVE', 30, 63, { width: 228 });

  // Headline
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(26)
   .text('Última chance\nno preço de', 24, 100, { width: FW - 48, lineGap: 4 });
  d.fillColor(OURO).font('Helvetica-Bold').fontSize(56)
   .text('R$177', 24, 158, { width: FW - 48 });
  d.fillColor(GRAY).font('Helvetica').fontSize(12)
   .text('(de R$397 — 50% de desconto real)', 24, 222, { width: FW - 48 });

  linhaDecor(d, 24, 248, FW - 48);

  // O que está incluso
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(12).text('No Clínica Inteligente:', 24, 262);
  const inc = ['10 Módulos completos em PDF', 'Plano de 90 Dias semana a semana', 'Templates, planilhas e checklist jurídico', 'Acesso vitalício + atualizações inclusas'];
  inc.forEach((t, i) => {
    d.fillColor(GREEN).font('Helvetica-Bold').fontSize(10).text('◆', 24, 286 + i * 26);
    d.fillColor(WHITE).font('Helvetica').fontSize(11).text(t, 44, 287 + i * 26, { width: FW - 68 });
  });

  linhaDecor(d, 24, 398, FW - 48);

  d.fillColor(GRAY).font('Helvetica').fontSize(10)
   .text('PIX R$177  ·  Cartão 3× R$69,90', 24, 412, { width: FW - 48, align: 'center' });
  ctaButton(d, 24, FH - 70, FW - 48, 40, 'GARANTIR NO PREÇO DE LANÇAMENTO →');
  d.fillColor(GRAY).font('Helvetica').fontSize(9)
   .text('🔒 7 dias de garantia · Acesso imediato', 24, FH - 20, { width: FW - 48, align: 'center' });

  d.end();
  console.log('✓ feed_v4_urgencia.pdf');
}

function v4Story() {
  const d = novoPDF(SW, SH, 'story_v4_urgencia');
  fundo(d, SW, SH);
  d.rect(0, 0, SW, 6).fill(RED);
  d.rect(0, SH - 6, SW, 6).fill(OURO);

  logoTag(d, 30, 30, 150);

  // Badge urgência
  d.roundedRect(30, 76, SW - 60, 34, 16).fill(RED);
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
   .text('⏰ OFERTA DE LANÇAMENTO', 30, 88, { width: SW - 60, align: 'center' });

  // Headline
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(40)
   .text('Última chance\nno preço de', 30, 138, { width: SW - 60, lineGap: 6 });
  d.fillColor(OURO).font('Helvetica-Bold').fontSize(84)
   .text('R$177', 30, 238, { width: SW - 60 });
  d.fillColor(GRAY).font('Helvetica').fontSize(14)
   .text('de R$397 — 50% de desconto real', 30, 332, { width: SW - 60 });

  linhaDecor(d, 30, 368, SW - 60);

  // 4 bullets
  const inc = [
    '10 Módulos completos — gestão, marketing, financeiro',
    'Plano de 90 Dias semana a semana',
    'Templates de contratos e planilhas de gestão',
    'Acesso vitalício com atualizações inclusas',
  ];
  inc.forEach((t, i) => {
    const iy = 386 + i * 58;
    d.roundedRect(30, iy, SW - 60, 50, 8).fill(NAVY2);
    d.rect(30, iy, 4, 50).fill(GREEN);
    d.fillColor(GREEN).font('Helvetica-Bold').fontSize(16).text('✓', 44, iy + 14);
    d.fillColor(WHITE).font('Helvetica').fontSize(12).text(t, 70, iy + 15, { width: SW - 106 });
  });

  linhaDecor(d, 30, 626, SW - 60);

  // Garantia
  d.roundedRect(30, 644, SW - 60, 46, 10).fill(NAVY2);
  d.rect(30, 644, 5, 46).fill(GREEN);
  d.fillColor(GREEN).font('Helvetica-Bold').fontSize(11).text('GARANTIA 7 DIAS', 46, 652, { continued: true });
  d.fillColor(WHITE).font('Helvetica').fontSize(11).text('  Não gostou? 100% devolvido.');
  d.fillColor(GRAY).font('Helvetica').fontSize(10).text('Sem perguntas. Sem burocracia.', 46, 672, { width: SW - 80 });

  linhaDecor(d, 30, 702, SW - 60);

  // Preço
  d.fillColor(WHITE).font('Helvetica-Bold').fontSize(16).text('PIX / Boleto: R$177', 30, 720, { width: SW - 60, align: 'center' });
  d.fillColor(GRAY).font('Helvetica').fontSize(12).text('Cartão 3× de R$69,90 · Total R$209,70', 30, 744, { width: SW - 60, align: 'center' });

  ctaButton(d, 30, SH - 100, SW - 60, 52, 'GARANTIR AGORA — OFERTA EXPIRA →');
  d.fillColor(GRAY).font('Helvetica').fontSize(10)
   .text('jaagendou.app/clinica-inteligente', 30, SH - 36, { width: SW - 60, align: 'center' });

  d.end();
  console.log('✓ story_v4_urgencia.pdf');
}

// ════════════════════════════════════════════════════════════════════════════
// EXECUTAR
// ════════════════════════════════════════════════════════════════════════════
console.log('\n Gerando artes Meta Ads — Clínica Inteligente...\n');

v1Feed(); v1Story();
v2Feed(); v2Story();
v3Feed(); v3Story();
v4Feed(); v4Story();

console.log(`\n✅ 8 artes geradas em: ${OUT}`);
console.log('\n  V1 Dor financeira:  feed_v1_dor.pdf  · story_v1_dor.pdf');
console.log('  V2 Guia/Autoridade: feed_v2_guia.pdf · story_v2_guia.pdf');
console.log('  V3 Prova/Resultado: feed_v3_resultado.pdf · story_v3_resultado.pdf');
console.log('  V4 Urgência/CTA:    feed_v4_urgencia.pdf  · story_v4_urgencia.pdf');
console.log('\n  Para Meta Ads: export cada PDF como PNG a 2x (1080×1080px / 1080×1920px)');
console.log('  Checkout: https://pay.hotmart.com/M105446275H');
