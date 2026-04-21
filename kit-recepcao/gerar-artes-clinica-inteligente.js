/**
 * Gerador de Artes para Campanha — Clínica Inteligente
 * Público: Dentistas empreendedores, 28-45 anos
 * Formatos: Feed 1:1 (1080×1080), Stories 9:16 (1080×1920)
 * Variantes: 3 ângulos de copy × 2 formatos = 6 artes
 *
 * Para rodar: node gerar-artes-clinica-inteligente.js
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');

const OUT_DIR = 'C:/Users/otavi/Pictures/ja-agendou/kit-recepcao/artes-clinica-inteligente';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const NAVY  = '#0D1B40';
const NAVY2 = '#162354';
const OURO  = '#C9A84C';
const OURO2 = '#E8C87A';
const WHITE = '#FFFFFF';
const GRAY  = '#AABBCC';
const DARK  = '#050D22';

// Dimensões em pontos PDF (72pt = 1 inch, 1080px ≈ 763pt a 96dpi)
// Usamos 540×540pt para feed e 540×960pt para stories (escala 0.5× de 1080px)
const FEED_W = 540, FEED_H = 540;
const STORY_W = 540, STORY_H = 960;

/* ─────────────────────────────────────────
   Helpers de desenho
───────────────────────────────────────── */
function gradientFundo(doc, w, h) {
  // Fundo degradê simulado com dois rects sobrepostos
  doc.rect(0, 0, w, h).fill(DARK);
  doc.rect(0, 0, w, h / 2).fillOpacity(0.3).fill(NAVY2);
  doc.fillOpacity(1);
  // Linha dourada topo e base
  doc.rect(0, 0, w, 4).fill(OURO);
  doc.rect(0, h - 4, w, 4).fill(OURO);
}

function logo(doc, x, y) {
  doc.roundedRect(x, y, 120, 22, 11).fill(OURO);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9)
     .text('jaagendou.app', x + 10, y + 7);
}

function badge(doc, texto, x, y, w) {
  doc.roundedRect(x, y, w, 20, 10).fill(OURO).fillOpacity(0.15);
  doc.fillOpacity(1);
  doc.rect(x, y, 3, 20).fill(OURO);
  doc.fillColor(OURO).font('Helvetica-Bold').fontSize(8)
     .text(texto, x + 10, y + 6, { width: w - 14 });
}

function linhaOuro(doc, x, y, w) {
  doc.rect(x, y, w * 0.3, 2).fill(OURO);
  doc.rect(x + w * 0.32, y, w * 0.68, 2).fillOpacity(0.2).fill(OURO);
  doc.fillOpacity(1);
}

function precoBox(doc, x, y, w) {
  doc.roundedRect(x, y, w, 64, 8).fill(OURO);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9)
     .text('DE R$397 POR APENAS', x, y + 10, { width: w, align: 'center' });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(28)
     .text('R$ 197', x, y + 22, { width: w, align: 'center' });
  doc.fillColor(NAVY).font('Helvetica').fontSize(8)
     .text('ou 3× de R$69,90 · Acesso imediato', x, y + 52, { width: w, align: 'center' });
}

function ctaBox(doc, x, y, w) {
  doc.roundedRect(x, y, w, 36, 6).fill(OURO);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12)
     .text('QUERO COMEÇAR AGORA →', x, y + 12, { width: w, align: 'center' });
}

/* ─────────────────────────────────────────
   VARIANTE 1 — DOR: "Faturando, mas sem lucro"
   Ângulo: Dentista que trabalha muito e não sobra dinheiro
───────────────────────────────────────── */
function arte_feed_v1() {
  const doc = new PDFDocument({ size: [FEED_W, FEED_H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  doc.pipe(fs.createWriteStream(`${OUT_DIR}/feed_v1_dor_lucro.pdf`));

  gradientFundo(doc, FEED_W, FEED_H);
  logo(doc, 30, 24);
  badge(doc, 'PARA DENTISTAS EMPREENDEDORES', 30, 56, 240);

  doc.fillColor(GRAY).font('Helvetica').fontSize(11)
     .text('Você fatura R$30k, R$50k... mas ao final do mês:', 30, 90, { width: FEED_W - 60 });

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(30)
     .text('Por que não sobra\ndinheiro?', 30, 114, { width: FEED_W - 60, lineGap: 4 });

  linhaOuro(doc, 30, 184, FEED_W - 60);

  const pontos = [
    'Custos ocultos que você não calcula',
    'Precificação abaixo do custo real',
    'Inadimplência sem controle',
    'Sem separação de pró-labore',
  ];
  pontos.forEach((p, i) => {
    doc.fillColor(OURO).font('Helvetica-Bold').fontSize(9).text('◆', 30, 200 + i * 24);
    doc.fillColor(WHITE).font('Helvetica').fontSize(11).text(p, 46, 200 + i * 24, { width: FEED_W - 80 });
  });

  doc.fillColor(GRAY).font('Helvetica').fontSize(10)
     .text('O Clínica Inteligente resolve isso em 10 módulos.', 30, 302, { width: FEED_W - 60 });

  linhaOuro(doc, 30, 322, FEED_W - 60);
  precoBox(doc, 30, 336, FEED_W - 60);
  ctaBox(doc, 30, 412, FEED_W - 60);

  doc.fillColor(GRAY).font('Helvetica').fontSize(8)
     .text('jaagendou.app/clinica-inteligente', 30, FEED_H - 24, { width: FEED_W - 60, align: 'center' });

  doc.end();
  console.log('✓ feed_v1_dor_lucro.pdf');
}

function arte_story_v1() {
  const doc = new PDFDocument({ size: [STORY_W, STORY_H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  doc.pipe(fs.createWriteStream(`${OUT_DIR}/story_v1_dor_lucro.pdf`));

  gradientFundo(doc, STORY_W, STORY_H);
  logo(doc, 40, 50);
  badge(doc, 'PARA DENTISTAS EMPREENDEDORES', 40, 84, 260);

  doc.fillColor(GRAY).font('Helvetica').fontSize(13)
     .text('Você fatura bem, mas ao final do mês:', 40, 200, { width: STORY_W - 80 });

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(38)
     .text('Por que não\nsobra dinheiro?', 40, 232, { width: STORY_W - 80, lineGap: 6 });

  linhaOuro(doc, 40, 340, STORY_W - 80);

  const pontos = [
    'Custos ocultos que você não calcula',
    'Precificação abaixo do custo real',
    'Inadimplência sem controle',
    'Pró-labore fora do planejamento',
    'Falta de visão financeira clara',
  ];
  pontos.forEach((p, i) => {
    doc.fillColor(OURO).font('Helvetica-Bold').fontSize(11).text('◆', 40, 366 + i * 32);
    doc.fillColor(WHITE).font('Helvetica').fontSize(13).text(p, 60, 366 + i * 32, { width: STORY_W - 100 });
  });

  doc.fillColor(OURO2).font('Helvetica-Bold').fontSize(15)
     .text('O Clínica Inteligente resolve isso\nem 10 módulos práticos.', 40, 542, { width: STORY_W - 80, lineGap: 4 });

  linhaOuro(doc, 40, 600, STORY_W - 80);

  // Módulos destaque
  ['Finanças Clínicas', 'Precificação Inteligente', 'Plano de 90 Dias'].forEach((m, i) => {
    doc.roundedRect(40, 620 + i * 44, STORY_W - 80, 36, 6).fill(NAVY2);
    doc.fillColor(OURO).font('Helvetica-Bold').fontSize(9).text(`MÓDULO ${i === 0 ? '02' : i === 1 ? '06' : '10'}`, 54, 630 + i * 44, { continued: true });
    doc.fillColor(WHITE).font('Helvetica').fontSize(11).text('  ' + m);
  });

  linhaOuro(doc, 40, 760, STORY_W - 80);
  precoBox(doc, 40, 776, STORY_W - 80);
  ctaBox(doc, 40, 856, STORY_W - 80);

  doc.fillColor(GRAY).font('Helvetica').fontSize(9)
     .text('jaagendou.app/clinica-inteligente', 40, STORY_H - 30, { width: STORY_W - 80, align: 'center' });

  doc.end();
  console.log('✓ story_v1_dor_lucro.pdf');
}

/* ─────────────────────────────────────────
   VARIANTE 2 — AUTORIDADE: "Guia completo de gestão"
   Ângulo: O guia definitivo que a faculdade não deu
───────────────────────────────────────── */
function arte_feed_v2() {
  const doc = new PDFDocument({ size: [FEED_W, FEED_H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  doc.pipe(fs.createWriteStream(`${OUT_DIR}/feed_v2_autoridade_guia.pdf`));

  gradientFundo(doc, FEED_W, FEED_H);
  logo(doc, 30, 24);

  doc.fillColor(OURO).font('Helvetica-Bold').fontSize(10)
     .text('A FACULDADE NÃO ENSINOU ISSO', 30, 56, { width: FEED_W - 60 });

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(26)
     .text('Guia Completo\nde Gestão para\nDentistas', 30, 80, { width: FEED_W - 60, lineGap: 4 });

  linhaOuro(doc, 30, 162, FEED_W - 60);

  doc.fillColor(GRAY).font('Helvetica').fontSize(10)
     .text('10 módulos · Aplicação imediata', 30, 174, { width: FEED_W - 60 });

  const modulos = [
    ['01', 'Gestão Estratégica'],
    ['02', 'Finanças Clínicas'],
    ['03', 'Marketing Digital'],
    ['06', 'Precificação Inteligente'],
    ['10', 'Plano de 90 Dias'],
  ];
  modulos.forEach(([num, nome], i) => {
    const col = i < 3 ? 0 : 1;
    const row = i < 3 ? i : i - 3;
    const x = 30 + col * 240;
    const y = 200 + row * 30;
    doc.roundedRect(x, y, 220, 24, 5).fill(NAVY2);
    doc.fillColor(OURO).font('Helvetica-Bold').fontSize(8).text(`M${num}`, x + 8, y + 8, { width: 28 });
    doc.fillColor(WHITE).font('Helvetica').fontSize(9).text(nome, x + 36, y + 8, { width: 176 });
  });

  linhaOuro(doc, 30, 328, FEED_W - 60);
  precoBox(doc, 30, 342, FEED_W - 60);
  ctaBox(doc, 30, 418, FEED_W - 60);

  doc.fillColor(GRAY).font('Helvetica').fontSize(8)
     .text('jaagendou.app/clinica-inteligente', 30, FEED_H - 24, { width: FEED_W - 60, align: 'center' });

  doc.end();
  console.log('✓ feed_v2_autoridade_guia.pdf');
}

function arte_story_v2() {
  const doc = new PDFDocument({ size: [STORY_W, STORY_H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  doc.pipe(fs.createWriteStream(`${OUT_DIR}/story_v2_autoridade_guia.pdf`));

  gradientFundo(doc, STORY_W, STORY_H);
  logo(doc, 40, 50);

  doc.fillColor(OURO).font('Helvetica-Bold').fontSize(12)
     .text('A FACULDADE NÃO ENSINOU ISSO', 40, 110, { width: STORY_W - 80 });

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(36)
     .text('Guia Completo\nde Gestão para\nDentistas', 40, 142, { width: STORY_W - 80, lineGap: 6 });

  linhaOuro(doc, 40, 270, STORY_W - 80);

  doc.fillColor(GRAY).font('Helvetica').fontSize(12)
     .text('10 módulos para transformar sua clínica em um negócio escalável.', 40, 286, { width: STORY_W - 80, lineGap: 4 });

  const modulos = [
    ['01', 'Gestão Estratégica — Pensar como Dono'],
    ['02', 'Finanças Clínicas — Do Faturamento ao Lucro'],
    ['03', 'Marketing Digital para Dentistas'],
    ['04', 'Automação e Sistemas (CRM)'],
    ['05', 'Equipe de Alta Performance'],
    ['06', 'Precificação Inteligente'],
    ['07', 'Expansão: Abrindo a 2ª Unidade'],
    ['08', 'Rotina do CEO Dentista'],
    ['09', 'Jurídico e Compliance'],
    ['10', 'Plano de 90 Dias'],
  ];
  modulos.forEach(([num, nome], i) => {
    doc.roundedRect(40, 360 + i * 42, STORY_W - 80, 36, 5).fill(i % 2 === 0 ? NAVY2 : '#0A1530');
    doc.fillColor(OURO).font('Helvetica-Bold').fontSize(9).text(`M${num}`, 54, 371 + i * 42, { width: 28 });
    doc.fillColor(WHITE).font('Helvetica').fontSize(10).text(nome, 82, 371 + i * 42, { width: STORY_W - 130 });
  });

  linhaOuro(doc, 40, 790, STORY_W - 80);
  precoBox(doc, 40, 806, STORY_W - 80);
  ctaBox(doc, 40, 882, STORY_W - 80);

  doc.fillColor(GRAY).font('Helvetica').fontSize(9)
     .text('jaagendou.app/clinica-inteligente', 40, STORY_H - 30, { width: STORY_W - 80, align: 'center' });

  doc.end();
  console.log('✓ story_v2_autoridade_guia.pdf');
}

/* ─────────────────────────────────────────
   VARIANTE 3 — RESULTADO: "+30-50% de faturamento"
   Ângulo: Prova social e métricas concretas
───────────────────────────────────────── */
function arte_feed_v3() {
  const doc = new PDFDocument({ size: [FEED_W, FEED_H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  doc.pipe(fs.createWriteStream(`${OUT_DIR}/feed_v3_resultado_metrica.pdf`));

  gradientFundo(doc, FEED_W, FEED_H);
  logo(doc, 30, 24);
  badge(doc, 'RESULTADOS COMPROVADOS', 30, 56, 200);

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
     .text('Dentistas que aplicaram o método:', 30, 88, { width: FEED_W - 60 });

  const metricas = [
    ['+30–50%', 'Aumento de faturamento em 90 dias'],
    ['–60%',    'Redução de faltas com confirmação automática'],
    ['+40%',    'Novos pacientes via Google otimizado'],
  ];
  metricas.forEach(([valor, desc], i) => {
    const y = 116 + i * 76;
    doc.roundedRect(30, y, FEED_W - 60, 68, 8).fill(NAVY2);
    doc.rect(30, y, 4, 68).fill(OURO);
    doc.fillColor(OURO).font('Helvetica-Bold').fontSize(28).text(valor, 44, y + 8, { width: 160 });
    doc.fillColor(WHITE).font('Helvetica').fontSize(10).text(desc, 44, y + 44, { width: FEED_W - 90 });
  });

  linhaOuro(doc, 30, 350, FEED_W - 60);

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(12)
     .text('Clínica Inteligente — 10 Módulos', 30, 364, { width: FEED_W - 60 });
  doc.fillColor(GRAY).font('Helvetica').fontSize(10)
     .text('Gestão · Finanças · Marketing · Automação · Equipe', 30, 382, { width: FEED_W - 60 });

  precoBox(doc, 30, 406, FEED_W - 60);
  ctaBox(doc, 30, 482, FEED_W - 60);

  doc.fillColor(GRAY).font('Helvetica').fontSize(8)
     .text('jaagendou.app/clinica-inteligente', 30, FEED_H - 24, { width: FEED_W - 60, align: 'center' });

  doc.end();
  console.log('✓ feed_v3_resultado_metrica.pdf');
}

function arte_story_v3() {
  const doc = new PDFDocument({ size: [STORY_W, STORY_H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  doc.pipe(fs.createWriteStream(`${OUT_DIR}/story_v3_resultado_metrica.pdf`));

  gradientFundo(doc, STORY_W, STORY_H);
  logo(doc, 40, 50);
  badge(doc, 'RESULTADOS DE QUEM APLICOU', 40, 90, 280);

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(32)
     .text('Sua clínica pode\nfaturar mais.', 40, 140, { width: STORY_W - 80, lineGap: 6 });
  doc.fillColor(OURO).font('Helvetica-Bold').fontSize(32)
     .text('Em 90 dias.', 40, 214, { width: STORY_W - 80 });

  linhaOuro(doc, 40, 264, STORY_W - 80);

  const metricas = [
    ['+30–50%', 'Aumento de faturamento em 90 dias', 'Clínicas que aplicam o plano completo'],
    ['–60%',    'Redução de faltas', 'Com confirmação automática + lista de espera ativa'],
    ['+40%',    'Novos pacientes', 'Google Meu Negócio otimizado + reativação de inativos'],
  ];
  metricas.forEach(([valor, titulo, desc], i) => {
    const y = 290 + i * 130;
    doc.roundedRect(40, y, STORY_W - 80, 118, 8).fill(NAVY2);
    doc.rect(40, y, 5, 118).fill(OURO);
    doc.fillColor(OURO).font('Helvetica-Bold').fontSize(40).text(valor, 56, y + 14, { width: STORY_W - 100 });
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(14).text(titulo, 56, y + 68, { width: STORY_W - 100 });
    doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(desc, 56, y + 90, { width: STORY_W - 100 });
  });

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(15)
     .text('Clínica Inteligente — 10 Módulos', 40, 700, { width: STORY_W - 80, align: 'center' });

  linhaOuro(doc, 40, 728, STORY_W - 80);

  // Garantia
  doc.roundedRect(40, 744, STORY_W - 80, 40, 8).fill('#0A1530');
  doc.rect(40, 744, 4, 40).fill(OURO);
  doc.fillColor(OURO).font('Helvetica-Bold').fontSize(10).text('GARANTIA', 52, 751, { continued: true });
  doc.fillColor(WHITE).font('Helvetica').fontSize(10).text('  7 dias — risco zero para você');

  precoBox(doc, 40, 800, STORY_W - 80);
  ctaBox(doc, 40, 876, STORY_W - 80);

  doc.fillColor(GRAY).font('Helvetica').fontSize(9)
     .text('jaagendou.app/clinica-inteligente', 40, STORY_H - 30, { width: STORY_W - 80, align: 'center' });

  doc.end();
  console.log('✓ story_v3_resultado_metrica.pdf');
}

/* ─────────────────────────────────────────
   EXECUTAR TUDO
───────────────────────────────────────── */
console.log('\n Gerando artes da campanha Clínica Inteligente...\n');

arte_feed_v1();
arte_story_v1();
arte_feed_v2();
arte_story_v2();
arte_feed_v3();
arte_story_v3();

console.log(`\n✅ 6 artes geradas em: ${OUT_DIR}`);
console.log('\nArtes para uso:');
console.log('  V1 (Dor — "por que não sobra dinheiro"):');
console.log('     feed_v1_dor_lucro.pdf   · story_v1_dor_lucro.pdf');
console.log('  V2 (Autoridade — guia que a faculdade não deu):');
console.log('     feed_v2_autoridade_guia.pdf   · story_v2_autoridade_guia.pdf');
console.log('  V3 (Resultado — métricas concretas +30-50%):');
console.log('     feed_v3_resultado_metrica.pdf · story_v3_resultado_metrica.pdf');
console.log('\nLink da página: https://jaagendou.app/clinica-inteligente');
console.log('Checkout:        https://pay.hotmart.com/M105446275H');
