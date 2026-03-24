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

module.exports = { index };
