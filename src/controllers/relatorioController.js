const pool = require('../config/db');

async function executeOrFallback(query, params, fallback) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Erro em consulta de relatorio:', error.message);
    return fallback;
  }
}

async function index(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const mesAno = req.query.mes || new Date().toISOString().slice(0, 7); // YYYY-MM
  const dentistaId = req.query.dentista_id || null;
  try {
    const dentistas = await executeOrFallback(
      'SELECT id, nome FROM dentistas WHERE clinica_id = ? AND ativo = 1 ORDER BY nome ASC',
      [clinicaId],
      []
    );
    let query = `
      SELECT COALESCE(d.nome, 'Sem dentista') AS dentista_nome,
             COUNT(*) AS total_atendidos,
             COALESCE(SUM(CASE WHEN a.status != 'cancelado' THEN a.valor_estimado ELSE 0 END), 0) AS valor_total
      FROM agendamentos a
      LEFT JOIN dentistas d ON d.id = a.dentista_id
      WHERE a.clinica_id = ? AND DATE_FORMAT(a.data, '%Y-%m') = ?`;
    const params = [clinicaId, mesAno];
    if (dentistaId) { query += ' AND a.dentista_id = ?'; params.push(dentistaId); }
    query += ' GROUP BY d.id, d.nome ORDER BY valor_total DESC';
    const porDentista = await executeOrFallback(query, params, []);

    const receitaRows = await executeOrFallback(
      `SELECT SUM(valor) AS total FROM recibos WHERE clinica_id = ? AND DATE_FORMAT(data_recibo, '%Y-%m') = ?`,
      [clinicaId, mesAno],
      [{ total: 0 }]
    );
    const agendadosRows = await executeOrFallback(
      `SELECT COUNT(*) AS total FROM agendamentos WHERE clinica_id = ? AND DATE_FORMAT(data, '%Y-%m') = ? AND status != 'cancelado'`,
      [clinicaId, mesAno],
      [{ total: 0 }]
    );
    const canceladosRows = await executeOrFallback(
      `SELECT COUNT(*) AS total FROM agendamentos WHERE clinica_id = ? AND DATE_FORMAT(data, '%Y-%m') = ? AND status = 'cancelado'`,
      [clinicaId, mesAno],
      [{ total: 0 }]
    );

    const receitaMes = receitaRows[0] || { total: 0 };
    const agendados = agendadosRows[0] || { total: 0 };
    const cancelados = canceladosRows[0] || { total: 0 };

    return res.render('relatorios/index', {
      porDentista,
      dentistas,
      mesAno,
      dentistaId,
      stats: {
        receitaMes: receitaMes.total || 0,
        agendados: agendados.total,
        cancelados: cancelados.total,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).render('partials/error', { title: 'Erro', message: 'Não foi possível gerar o relatório.' });
  }
}

async function exportVisual(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const clinicaNome = req.session.user.clinica_nome || 'Clínica';
  const mesAno = req.query.mes || new Date().toISOString().slice(0, 7);
  const dentistaId = req.query.dentista_id || null;
  try {
    // Por dentista
    let qDent = `SELECT COALESCE(d.nome,'Sem dentista') AS dentista, COUNT(*) AS total,
      SUM(CASE WHEN a.status='concluido' OR a.status='atendido' THEN 1 ELSE 0 END) AS atendidos,
      SUM(CASE WHEN a.status='confirmado' THEN 1 ELSE 0 END) AS confirmados,
      SUM(CASE WHEN a.status='cancelado' THEN 1 ELSE 0 END) AS cancelados,
      COALESCE(SUM(CASE WHEN a.status!='cancelado' THEN a.valor_estimado ELSE 0 END),0) AS valor
      FROM agendamentos a LEFT JOIN dentistas d ON d.id=a.dentista_id
      WHERE a.clinica_id=? AND DATE_FORMAT(a.data,'%Y-%m')=?`;
    const pDent = [clinicaId, mesAno];
    if (dentistaId) { qDent += ' AND a.dentista_id=?'; pDent.push(dentistaId); }
    qDent += ' GROUP BY d.id,d.nome ORDER BY valor DESC';
    const dentData = await executeOrFallback(qDent, pDent, []);

    // Por status
    const statusData = await executeOrFallback(
      `SELECT a.status, COUNT(*) AS total FROM agendamentos a WHERE a.clinica_id=? AND DATE_FORMAT(a.data,'%Y-%m')=? GROUP BY a.status ORDER BY total DESC`,
      [clinicaId, mesAno], []);

    // Volume diário
    const dailyData = await executeOrFallback(
      `SELECT DATE_FORMAT(a.data,'%d/%m') AS dia, COUNT(*) AS total FROM agendamentos a WHERE a.clinica_id=? AND DATE_FORMAT(a.data,'%Y-%m')=? GROUP BY a.data ORDER BY a.data`,
      [clinicaId, mesAno], []);

    // Receita diária
    const finData = await executeOrFallback(
      `SELECT DATE_FORMAT(r.data_recibo,'%d/%m') AS dia, SUM(r.valor) AS total FROM recibos r WHERE r.clinica_id=? AND DATE_FORMAT(r.data_recibo,'%Y-%m')=? GROUP BY r.data_recibo ORDER BY r.data_recibo`,
      [clinicaId, mesAno], []);

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Relatório - ${esc(clinicaNome)}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;color:#1a2a3a;padding:30px;max-width:900px;margin:auto;background:#fff}
h1{color:#1e3a5f;font-size:26px;margin-bottom:4px}
.subtitle{color:#4c6c93;font-size:14px;margin-bottom:24px}
.charts{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:30px}
.chart-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px}
.chart-box h3{font-size:14px;color:#1e3a5f;margin-bottom:10px}
canvas{max-height:260px}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}
th{background:#1e3a5f;color:#fff;padding:8px 12px;text-align:left}
td{padding:8px 12px;border-bottom:1px solid #e2e8f0}
tr:nth-child(even) td{background:#f8fafc}
.section{margin-top:28px}
.section h2{font-size:18px;color:#1e3a5f;margin-bottom:12px;border-bottom:2px solid #1e3a5f;padding-bottom:6px}
@media print{body{padding:10px}.charts{break-inside:avoid}}
</style></head><body>
<h1>${esc(clinicaNome)}</h1>
<div class="subtitle">Relatório do mês: ${esc(mesAno)}</div>
<div class="charts">
<div class="chart-box"><h3>Agendamentos por Status</h3><canvas id="c1"></canvas></div>
<div class="chart-box"><h3>Valor por Dentista</h3><canvas id="c2"></canvas></div>
<div class="chart-box"><h3>Volume Diário</h3><canvas id="c3"></canvas></div>
<div class="chart-box"><h3>Receita Diária</h3><canvas id="c4"></canvas></div>
</div>
<div class="section"><h2>Resumo por Dentista</h2>
<table><thead><tr><th>Dentista</th><th>Total</th><th>Confirmados</th><th>Atendidos</th><th>Cancelados</th><th>Valor Est.</th></tr></thead><tbody>
${dentData.map(r => `<tr><td>${esc(r.dentista)}</td><td>${r.total}</td><td>${r.confirmados||0}</td><td>${r.atendidos||0}</td><td>${r.cancelados||0}</td><td>R$ ${Number(r.valor||0).toFixed(2).replace('.',',')}</td></tr>`).join('')}
</tbody></table></div>
<script>
const sL=${JSON.stringify(statusData.map(s=>s.status))},sV=${JSON.stringify(statusData.map(s=>Number(s.total)))};
const sC=sL.map(s=>({concluido:'#22c55e',atendido:'#22c55e',confirmado:'#3b82f6',agendado:'#f59e0b',cancelado:'#ef4444',falta:'#94a3b8'}[s]||'#6b7280'));
new Chart(document.getElementById('c1'),{type:'doughnut',data:{labels:sL,datasets:[{data:sV,backgroundColor:sC}]},options:{plugins:{legend:{position:'bottom'}}}});
const dN=${JSON.stringify(dentData.map(d=>d.dentista))},dV=${JSON.stringify(dentData.map(d=>Number(d.valor||0)))};
new Chart(document.getElementById('c2'),{type:'bar',data:{labels:dN,datasets:[{label:'Valor (R$)',data:dV,backgroundColor:'#1e3a5f'}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
const dyL=${JSON.stringify(dailyData.map(d=>d.dia))},dyV=${JSON.stringify(dailyData.map(d=>Number(d.total)))};
new Chart(document.getElementById('c3'),{type:'line',data:{labels:dyL,datasets:[{label:'Agendamentos',data:dyV,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.1)',fill:true,tension:.3}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
const fL=${JSON.stringify(finData.map(d=>d.dia))},fV=${JSON.stringify(finData.map(d=>Number(d.total||0)))};
new Chart(document.getElementById('c4'),{type:'bar',data:{labels:fL,datasets:[{label:'Receita (R$)',data:fV,backgroundColor:'#22c55e'}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
<\/script>
<p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:30px">Gerado em ${new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} — ${esc(clinicaNome)}</p>
</body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_visual_${mesAno}.html"`);
    return res.send(html);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao gerar relatório visual' });
  }
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = { index, exportVisual };
