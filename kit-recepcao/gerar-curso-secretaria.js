const PDFDocument = require('pdfkit');
const fs = require('fs');

const OUTPUT = 'C:/Users/otavi/Pictures/ja-agendou/kit-recepcao/Curso_Secretaria_Odontologica.pdf';

const COR_PRIMARIA = '#0D1B40';
const COR_VERDE = '#2ECC71';
const COR_CINZA = '#F5F5F5';
const COR_TEXTO = '#1A1A2E';

const doc = new PDFDocument({ size: 'A4', margin: 60, bufferPages: true });
doc.pipe(fs.createWriteStream(OUTPUT));

function cabecalho(titulo, subtitulo) {
  doc.rect(0, 0, doc.page.width, 130).fill(COR_PRIMARIA);
  doc.fillColor('#FFFFFF').fontSize(26).font('Helvetica-Bold')
    .text('jaagendou.app', 60, 25, { align: 'left' });
  doc.fontSize(18).font('Helvetica-Bold')
    .text(titulo, 60, 55, { align: 'center', width: doc.page.width - 120 });
  if (subtitulo) {
    doc.fontSize(11).font('Helvetica')
      .text(subtitulo, 60, 85, { align: 'center', width: doc.page.width - 120 });
  }
  doc.moveDown(5);
  doc.fillColor(COR_TEXTO);
}

function tituloModulo(numero, nome) {
  doc.addPage();
  doc.rect(0, 0, doc.page.width, 130).fill(COR_PRIMARIA);
  doc.fillColor(COR_VERDE).fontSize(13).font('Helvetica-Bold')
    .text(`MÓDULO ${numero}`, 60, 30, { align: 'center', width: doc.page.width - 120 });
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
    .text(nome, 60, 55, { align: 'center', width: doc.page.width - 120 });
  doc.moveDown(5);
  doc.fillColor(COR_TEXTO);
}

function secao(titulo) {
  doc.moveDown(1);
  doc.fillColor(COR_PRIMARIA).fontSize(13).font('Helvetica-Bold').text(titulo);
  doc.moveTo(60, doc.y + 4).lineTo(535, doc.y + 4).stroke(COR_VERDE);
  doc.moveDown(0.8);
  doc.fillColor(COR_TEXTO).fontSize(11).font('Helvetica');
}

function paragrafo(texto) {
  doc.fillColor(COR_TEXTO).fontSize(11).font('Helvetica')
    .text(texto, { align: 'justify', lineGap: 4 });
  doc.moveDown(0.6);
}

function item(texto) {
  doc.fillColor(COR_VERDE).fontSize(12).text('✓', { continued: true, width: 20 });
  doc.fillColor(COR_TEXTO).fontSize(11).font('Helvetica')
    .text('  ' + texto, { lineGap: 3 });
}

function boxDestaque(titulo, conteudo) {
  doc.moveDown(0.5);
  const alturaBox = 14 + conteudo.length * 18 + 20;
  if (doc.y + alturaBox > doc.page.height - 70) {
    doc.addPage();
    doc.moveDown(2);
  }
  const y = doc.y;
  doc.rect(55, y, doc.page.width - 110, alturaBox).fill(COR_CINZA);
  doc.fillColor(COR_PRIMARIA).fontSize(11).font('Helvetica-Bold')
    .text(titulo, 70, y + 10);
  conteudo.forEach((linha, i) => {
    doc.fillColor(COR_TEXTO).fontSize(10).font('Helvetica')
      .text('• ' + linha, 70, y + 28 + i * 18);
  });
  doc.y = y + alturaBox + 14;
}

function scriptModelo(titulo, texto) {
  const numLinhas = texto.split('\n').length;
  const alturaEstimada = 16 + numLinhas * 15 + 24;
  if (doc.y + alturaEstimada > doc.page.height - 70) {
    doc.addPage();
    doc.moveDown(2);
  }
  doc.moveDown(0.5);
  const yInicio = doc.y;
  doc.rect(55, yInicio, doc.page.width - 110, 16).fill(COR_PRIMARIA);
  doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold')
    .text('  ' + titulo, 60, yInicio + 3, { width: doc.page.width - 120 });
  doc.moveDown(1.4);
  texto.split('\n').forEach(linha => {
    doc.fillColor(COR_TEXTO).fontSize(10).font('Helvetica')
      .text(linha, 70, doc.y, { lineGap: 3 });
  });
  doc.moveDown(1);
}

// ===================== CAPA =====================
doc.rect(0, 0, doc.page.width, doc.page.height).fill(COR_PRIMARIA);

doc.fillColor(COR_VERDE).fontSize(13).font('Helvetica-Bold')
  .text('jaagendou.app', 0, 60, { align: 'center', width: doc.page.width });

doc.fillColor('#FFFFFF').fontSize(30).font('Helvetica-Bold')
  .text('Curso', 0, 120, { align: 'center', width: doc.page.width });
doc.fillColor(COR_VERDE).fontSize(36).font('Helvetica-Bold')
  .text('Secretária', 0, 158, { align: 'center', width: doc.page.width });
doc.fillColor('#FFFFFF').fontSize(30).font('Helvetica-Bold')
  .text('Odontológica', 0, 202, { align: 'center', width: doc.page.width });

doc.fillColor('#CCCCCC').fontSize(14).font('Helvetica')
  .text('Do Atendimento à Excelência:', 0, 260, { align: 'center', width: doc.page.width });
doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold')
  .text('Guia Completo para Recepcionistas e Secretárias de Clínicas Odontológicas', 60, 285,
    { align: 'center', width: doc.page.width - 120 });

doc.rect(doc.page.width / 2 - 120, 350, 240, 2).fill(COR_VERDE);

doc.fillColor('#AAAAAA').fontSize(11).font('Helvetica')
  .text('8 Módulos · Scripts Prontos · Exercícios Práticos', 0, 375, { align: 'center', width: doc.page.width });

doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica')
  .text('© 2025 jaagendou.app — Todos os direitos reservados', 0, doc.page.height - 50,
    { align: 'center', width: doc.page.width });

// ===================== SUMÁRIO =====================
doc.addPage();
cabecalho('Sumário do Curso', 'Secretária Odontológica — 8 Módulos');

const modulos = [
  ['01', 'O Papel Estratégico da Secretária na Clínica'],
  ['02', 'Comunicação e Atendimento ao Paciente'],
  ['03', 'WhatsApp Profissional: Scripts e Gestão'],
  ['04', 'Gestão de Agenda e Controle de Faltas'],
  ['05', 'Financeiro Básico: Cobrança e Inadimplência'],
  ['06', 'Documentação, Prontuário e Sigilo'],
  ['07', 'Marketing e Redes Sociais para a Recepção'],
  ['08', 'Produtividade, Estresse e Crescimento Profissional'],
];

modulos.forEach(([num, nome]) => {
  doc.fillColor(COR_CINZA).rect(60, doc.y, doc.page.width - 120, 36).fill();
  doc.fillColor(COR_VERDE).fontSize(12).font('Helvetica-Bold')
    .text(`Módulo ${num}`, 75, doc.y - 28, { continued: true });
  doc.fillColor(COR_TEXTO).fontSize(11).font('Helvetica')
    .text(`  — ${nome}`, { lineGap: 0 });
  doc.moveDown(0.4);
});

doc.moveDown(1);
paragrafo('Cada módulo contém: teoria objetiva, scripts prontos para uso imediato, exercícios práticos e checklists de verificação. O curso foi desenvolvido para ser aplicado no dia seguinte ao estudo — sem enrolação.');

// ===================== MÓDULO 1 =====================
tituloModulo(1, 'O Papel Estratégico da Secretária na Clínica');

secao('Por que a Secretária Define o Sucesso da Clínica');
paragrafo('A secretária é o primeiro e o último ponto de contato do paciente com a clínica. Ela molda a percepção que o paciente terá do dentista, do atendimento e da qualidade do serviço — antes mesmo de sentar na cadeira odontológica.');
paragrafo('Estudos do setor de saúde mostram que 68% dos pacientes que não retornam a uma clínica citam problemas no atendimento como motivo — não a qualidade técnica do dentista. Isso significa que a secretária tem impacto direto na retenção e no faturamento.');

secao('As 5 Funções Estratégicas da Secretária Odontológica');
['Gestora da Agenda — organiza, otimiza e protege o tempo do dentista',
 'Guardiã da Experiência — garante que cada paciente se sinta bem-vindo e valorizado',
 'Filtro de Comunicação — gerencia WhatsApp, telefone e e-mail com profissionalismo',
 'Controladora Financeira — acompanha pagamentos, cobranças e inadimplência',
 'Embaixadora da Marca — representa os valores da clínica em cada interação',
].forEach(f => item(f));

secao('Mentalidade: De Recepcionista para Profissional Estratégica');
paragrafo('A diferença entre uma recepcionista comum e uma secretária odontológica de alto nível não está no salário — está na mentalidade. A profissional estratégica enxerga cada ligação, cada mensagem e cada agendamento como uma oportunidade de fortalecer a relação da clínica com o paciente.');

boxDestaque('Exercício Prático — Auditoria do Atendimento', [
  'Liste os 3 principais motivos de reclamação dos pacientes na clínica',
  'Identifique qual deles é resolvível por você sem depender do dentista',
  'Crie uma solução simples e aplique essa semana',
  'Registre o resultado e apresente ao dentista',
]);

// ===================== MÓDULO 2 =====================
tituloModulo(2, 'Comunicação e Atendimento ao Paciente');

secao('Os 4 Pilares da Comunicação Eficaz');
['Tom de voz — caloroso, claro e confiante (nem frio nem informal demais)',
 'Escuta ativa — demonstre que ouviu repetindo o que o paciente disse',
 'Linguagem positiva — substitua "não posso" por "posso fazer diferente"',
 'Fechamento — sempre confirme o próximo passo antes de encerrar',
].forEach(f => item(f));

secao('Como Lidar com Diferentes Perfis de Paciente');
paragrafo('**Paciente Ansioso:** Fale devagar, use palavras de tranquilidade ("fica tranquilo", "vamos cuidar bem de você"), ofereça água ao chegar, avise os tempos de espera proativamente.');
paragrafo('**Paciente Impaciente:** Seja direta e objetiva. Não enrole. Se houver atraso, informe o tempo exato — jamais diga "é rapidinho".');
paragrafo('**Paciente Reclamão:** Não contra-argumente. Valide a frustração ("entendo que isso é chato") e ofereça solução imediata. Escale para o dentista apenas se necessário.');
paragrafo('**Paciente Idoso:** Fale mais alto e devagar. Repita informações importantes. Confirme o agendamento por telefone (não só WhatsApp). Tenha paciência — esse perfil é extremamente fiel quando bem atendido.');

secao('Frases Proibidas na Recepção');
boxDestaque('Nunca diga isso para um paciente', [
  '"Não sei" — substitua por "Vou verificar e te respondo agora"',
  '"Não é comigo" — substitua por "Vou resolver isso para você"',
  '"Ele está ocupado" — substitua por "Ele está em atendimento, retorno em X min"',
  '"Você vai ter que esperar" — substitua por "Sua vez é a próxima, tudo bem?"',
  '"É a nossa política" — substitua por "Nosso protocolo é assim por [motivo]"',
]);

secao('Script: Atendimento Presencial Padrão Ouro');
scriptModelo('Recebendo o paciente', 'Secretária: "Bom dia! [NOME DO PACIENTE], seja muito bem-vindo!\nJá te aguardávamos. Pode se sentar, o Dr. [DENTISTA] está finalizando o atendimento anterior.\nPosso te oferecer água ou café enquanto espera?"');

// ===================== MÓDULO 3 =====================
tituloModulo(3, 'WhatsApp Profissional: Scripts e Gestão');

secao('Configurando um WhatsApp Profissional');
['Use o WhatsApp Business (versão profissional gratuita)',
 'Configure uma mensagem de ausência fora do horário',
 'Crie respostas rápidas para as perguntas mais frequentes',
 'Defina horários para resposta e comunique ao paciente',
 'Nunca use stickers ou emojis excessivos em conversas profissionais',
].forEach(f => item(f));

secao('Os 10 Scripts Essenciais para WhatsApp');

const scripts = [
  ['Confirmação de consulta (D-1)',
   'Olá, [NOME]! 😊 Passando para confirmar sua consulta com o Dr. [DENTISTA] amanhã, [DIA] às [HORA].\nConfirme respondendo SIM. Qualquer dúvida, estou aqui!\n[CLÍNICA] | [TELEFONE]'],
  ['Paciente não confirmou — segundo contato',
   'Oi [NOME], ainda não recebemos sua confirmação para amanhã às [HORA].\nSe precisar reagendar, pode falar agora que resolvemos! 😊\n[CLÍNICA]'],
  ['Lembrete pós-consulta (D+1)',
   'Olá [NOME]! Como você está após a consulta de ontem? 😊\nSe tiver alguma dúvida ou desconforto, pode nos chamar. Cuide bem da saúde!\n[CLÍNICA]'],
  ['Paciente faltou — reagendamento',
   'Oi [NOME], notamos que você não pôde comparecer hoje. Sem problema! 😊\nQuando quiser reagendar, é só chamar. Temos horários esta semana ainda.\n[CLÍNICA]'],
  ['Orçamento aprovado — próximos passos',
   'Ótima notícia, [NOME]! Seu orçamento foi aprovado. 🎉\nVamos agendar o início do tratamento. Quando você tem disponibilidade?\n[CLÍNICA]'],
  ['Retorno de avaliação',
   'Oi [NOME]! Há algum tempo que você não passa por aqui. 😊\nQue tal agendar uma avaliação de rotina? Temos horários esta semana.\n[CLÍNICA]'],
  ['Resposta sobre preço',
   'Olá [NOME]! Para passar um valor preciso, precisamos fazer uma avaliação antes. É rápido e sem compromisso.\nQual o melhor horário para você? 😊\n[CLÍNICA]'],
  ['Envio de resultado/foto',
   'Olá [NOME]! Segue o resultado do seu procedimento. 😊\nQualquer dúvida pode me chamar. Até a próxima!\n[CLÍNICA]'],
  ['Cobrança amigável',
   'Oi [NOME], tudo bem? Passando para lembrar que temos um pagamento em aberto de R$[VALOR] referente ao seu tratamento.\nSe tiver qualquer dificuldade, fale com a gente que tentamos ajudar. 😊\n[CLÍNICA]'],
  ['Fechamento do dia',
   'Boa tarde [NOME]! Nossa clínica encerrará o atendimento em 30 minutos.\nSe tiver alguma urgência, pode entrar em contato pelo [TELEFONE]. Até amanhã! 😊\n[CLÍNICA]'],
];

scripts.forEach(([titulo, texto]) => scriptModelo(titulo, texto));

secao('Gestão da Fila de Mensagens');
paragrafo('Nunca deixe uma mensagem sem resposta por mais de 2 horas durante o horário de funcionamento. Use este fluxo:');
boxDestaque('Fluxo de Resposta WhatsApp', [
  '1. Leia e classifique: urgência / agendamento / informação / cobrança',
  '2. Responda urgências imediatamente',
  '3. Agrupe agendamentos e responda em bloco',
  '4. Informe ao dentista qualquer situação clínica relatada pelo paciente',
  '5. Nunca dê diagnóstico ou opinião clínica pelo WhatsApp',
]);

// ===================== MÓDULO 4 =====================
tituloModulo(4, 'Gestão de Agenda e Controle de Faltas');

secao('Estrutura de uma Agenda Inteligente');
paragrafo('Uma agenda bem gerenciada é o principal gerador de receita de uma clínica. Cada horário vazio representa dinheiro perdido — e é responsabilidade direta da secretária minimizar isso.');

['Reserve os primeiros horários do dia para procedimentos mais complexos (dentista mais descansado)',
 'Bloqueie 15 minutos entre consultas longas para o dentista respirar',
 'Mantenha uma lista de pacientes para encaixe imediato em caso de falta',
 'Nunca deixe mais de 2 horários vagos consecutivos sem acionar lista de espera',
 'Confirme TODA agenda do dia seguinte até as 17h',
].forEach(f => item(f));

secao('Protocolo Anti-Falta em 4 Etapas');
boxDestaque('Etapas para reduzir faltas em até 70%', [
  'D-2 (2 dias antes): Confirmação automática via WhatsApp',
  'D-1 (véspera): Ligação ou mensagem personalizada se não confirmou',
  'D-0 manhã: Última mensagem 2h antes da consulta',
  'Falta confirmada: Acionar lista de espera imediatamente',
]);

secao('Planilha de Controle de Faltas');
paragrafo('Mantenha uma planilha com colunas: Data | Paciente | Horário | Confirmou? | Compareceu | Motivo | Reagendou. Analise mensalmente: pacientes com 2+ faltas devem ser abordados com protocolo especial.');

secao('Script: Ligação de Confirmação');
scriptModelo('Confirmação por telefone', 'Secretária: "Boa tarde, falo com [NOME]?\n[SIM] Oi [NOME], aqui é [SEU NOME] da [CLÍNICA]. Ligando para confirmar sua consulta\namanhã às [HORA] com o Dr. [DENTISTA]. Você confirma?\n[SIM] Perfeito! Te esperamos amanhã. Qualquer coisa pode nos chamar. Até logo!\n[NÃO] Sem problema! Quando você consegue reagendar?"');

// ===================== MÓDULO 5 =====================
tituloModulo(5, 'Financeiro Básico: Cobrança e Inadimplência');

secao('Regras de Ouro do Financeiro na Recepção');
['Nunca inicie um tratamento sem aprovação formal do orçamento',
 'Sempre confirme a forma de pagamento no agendamento',
 'Emita recibo para todo pagamento — protege a clínica e o paciente',
 'Mantenha registro de todos os parcelamentos acordados',
 'Nunca negocie desconto sem autorização do dentista',
].forEach(f => item(f));

secao('Como Cobrar Sem Constranger');
paragrafo('Cobrar é uma habilidade. Faça com naturalidade, sem desculpas. Use linguagem direta mas respeitosa. Nunca deixe o paciente ir embora sem regularizar a situação ou firmar um compromisso claro.');

scriptModelo('Cobrança no caixa', 'Secretária: "Sua consulta ficou em R$[VALOR]. Como você prefere pagar — dinheiro, cartão ou Pix?\n[PARCELADO] Claro! Consigo parcelar em até [X] vezes. Quanto por parcela fica bom para você?"');

scriptModelo('Cobrança de parcela em atraso', 'Secretária: "Oi [NOME], tudo bem? Aqui é [NOME] da [CLÍNICA].\nPassando porque a parcela de R$[VALOR] do dia [DATA] ainda não foi identificada em nosso sistema.\nConsegue regularizar hoje? Posso mandar o Pix agora mesmo."');

secao('Inadimplência Crônica — O Que Fazer');
paragrafo('Paciente com 2 ou mais parcelas em atraso: suspenda novos agendamentos até regularização. Seja gentil mas firme: "Assim que regularizarmos o histórico, agendamos com prazer."');

// ===================== MÓDULO 6 =====================
tituloModulo(6, 'Documentação, Prontuário e Sigilo');

secao('O Prontuário Odontológico é Obrigatório');
paragrafo('Todo paciente atendido deve ter prontuário. É obrigação legal e ética. A secretária não preenche o prontuário clínico, mas é responsável por manter os dados cadastrais atualizados, arquivar documentos e garantir que nenhum prontuário seja extraviado.');

['Nome completo, CPF e data de nascimento',
 'Telefone, e-mail e responsável (para menores)',
 'Convênio ou forma de pagamento',
 'Data de cada consulta e procedimento realizado',
 'Orçamentos assinados e aprovados',
].forEach(f => item(f));

secao('Sigilo Médico: O Que Você Pode e Não Pode Fazer');
boxDestaque('PODE fazer', [
  'Confirmar se o paciente tem consulta agendada (para o próprio paciente)',
  'Informar horário de funcionamento e procedimentos oferecidos',
  'Enviar lembretes de consulta para o número cadastrado do paciente',
]);
boxDestaque('NÃO PODE fazer', [
  'Informar tratamento em andamento para terceiros (incluindo familiares sem autorização)',
  'Mostrar prontuários a pessoas não autorizadas',
  'Discutir casos clínicos fora da clínica ou nas redes sociais',
  'Tirar fotos de prontuários ou documentos sem autorização',
]);

// ===================== MÓDULO 7 =====================
tituloModulo(7, 'Marketing e Redes Sociais para a Recepção');

secao('O Papel da Secretária no Marketing Digital');
paragrafo('Você não precisa ser especialista em marketing, mas precisa entender como seu comportamento impacta a imagem da clínica online. Hoje, uma avaliação no Google ou uma menção no Instagram pode trazer ou afastar dezenas de pacientes.');

secao('Google Meu Negócio: Sua Arma Mais Poderosa');
['Mantenha horários de funcionamento sempre atualizados',
 'Responda TODAS as avaliações — positivas e negativas',
 'Publique fotos da clínica mensalmente',
 'Adicione os serviços oferecidos com preços de referência',
].forEach(f => item(f));

scriptModelo('Resposta a avaliação negativa (Google)', 'Resposta pública: "Olá [NOME], lamentamos muito sua experiência. Nosso objetivo é sempre proporcionar\no melhor atendimento. Gostaríamos de entender o que aconteceu. Por favor, entre em\ncontato conosco pelo [TELEFONE] para que possamos resolver. Atenciosamente, [CLÍNICA]"');

secao('Como Pedir Avaliações aos Pacientes');
scriptModelo('Pedido de avaliação pós-consulta', 'Mensagem WhatsApp D+1: "Oi [NOME]! Tudo bem com você?\nSe o atendimento foi de qualidade, ficaria muito feliz se pudesse deixar uma avaliação no Google.\nIsso nos ajuda muito! 😊 [LINK DO GOOGLE MINHA EMPRESA]\nObrigado, [CLÍNICA]"');

secao('O Que NÃO Postar nas Redes Sociais da Clínica');
boxDestaque('Conteúdo proibido', [
  'Fotos de procedimentos sem consentimento escrito do paciente',
  'Informações clínicas ou diagnósticos',
  'Comparações com outras clínicas ou dentistas',
  'Promessas de resultados garantidos (proibido pelo CFO)',
  'Preços de procedimentos estéticos sem disclaimers legais',
]);

// ===================== MÓDULO 8 =====================
tituloModulo(8, 'Produtividade, Estresse e Crescimento Profissional');

secao('Organizando Sua Rotina de Trabalho');
paragrafo('A secretária odontológica é multitarefa por natureza — mas multitarefa desordenada gera erros. Use este esquema de prioridades diárias:');

boxDestaque('Rotina Diária Recomendada', [
  '30 min antes: Revisar agenda do dia, confirmar pendências',
  'Manhã: Foco em atendimento presencial e confirmações',
  'Intervalo: Responder mensagens e e-mails acumulados',
  'Tarde: Cobranças, organização de prontuários, lista de amanhã',
  '30 min antes de fechar: Confirmar agenda do dia seguinte',
]);

secao('Lidando com o Estresse da Recepção');
paragrafo('Recepção odontológica é um dos ambientes profissionais mais estressantes: pacientes ansiosos, dentistas com hora marcada, telefone tocando. Isso é real. O que você pode controlar é sua resposta a esses estressores.');
['Faça uma pausa de 5 minutos a cada 2 horas quando possível',
 'Beba água regularmente — desidratação piora o foco e o humor',
 'Separe o que você pode resolver do que não está na sua alçada',
 'Registre situações de conflito e apresente ao dentista calmamente',
 'Reconheça seus limites e peça ajuda quando necessário',
].forEach(f => item(f));

secao('Plano de Desenvolvimento Profissional');
paragrafo('A secretária que se especializa tem emprego garantido e melhor remuneração. Invista em:');
['Curso de atendimento ao cliente e comunicação não-violenta',
 'Curso de Excel básico (planilhas de controle)',
 'Conhecimento básico de anatomia dental (falar com propriedade)',
 'Atualização sobre convênios odontológicos da região',
 'Certificações em gestão de clínicas de saúde',
].forEach(f => item(f));

secao('Seu Checklist de Excelência Profissional');
boxDestaque('Avalie-se mensalmente nestes critérios', [
  '[ ] Agenda do dia confirmada até 17h do dia anterior',
  '[ ] Nenhuma mensagem sem resposta por mais de 2h',
  '[ ] Todos os pagamentos do dia registrados',
  '[ ] Avaliações do Google respondidas esta semana',
  '[ ] Prontuários dos pacientes de hoje atualizados',
  '[ ] Lista de espera atualizada para os próximos 7 dias',
  '[ ] Nenhum conflito não resolvido com paciente ou equipe',
]);

// ===================== ENCERRAMENTO =====================
doc.addPage();
doc.rect(0, 0, doc.page.width, doc.page.height).fill(COR_PRIMARIA);

doc.fillColor(COR_VERDE).fontSize(28).font('Helvetica-Bold')
  .text('Parabéns!', 0, 120, { align: 'center', width: doc.page.width });
doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica')
  .text('Você concluiu o Curso Secretária Odontológica.', 0, 165, { align: 'center', width: doc.page.width });

doc.fillColor('#CCCCCC').fontSize(13).font('Helvetica')
  .text('Agora você tem o conhecimento para ser uma profissional\nde referência na sua clínica.', 60, 220,
    { align: 'center', width: doc.page.width - 120, lineGap: 6 });

doc.rect(doc.page.width / 2 - 100, 290, 200, 2).fill(COR_VERDE);

doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold')
  .text('Continue aprendendo:', 0, 315, { align: 'center', width: doc.page.width });
doc.fillColor('#AAAAAA').fontSize(11).font('Helvetica')
  .text('jaagendou.app — ferramentas para clínicas odontológicas', 0, 340,
    { align: 'center', width: doc.page.width });

doc.fillColor('#555577').fontSize(10).font('Helvetica')
  .text('© 2025 jaagendou.app — Uso pessoal. Proibida a reprodução ou revenda.', 0, doc.page.height - 50,
    { align: 'center', width: doc.page.width });

doc.end();
console.log('PDF gerado: ' + OUTPUT);
