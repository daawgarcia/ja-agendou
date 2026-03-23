const pool = require('../config/db');

async function index(req, res) {
  const clinicaId = req.session.user.clinica_id;
  const mesAno = req.query.mes || new Date().toISOString().slice(0, 7); // YYYY-MM
  const dentistaId = req.query.dentista_id || null;
  try {
    const [dentistas] = await pool.execute(
      'SELECT id, nome FROM dentistas WHERE clinica_id = ? AND ativo = 1 ORDER BY nome ASC',
      [clinicaId]
    );
    let query = `
      SELECT DATE_FORMAT(a.data, '%Y-%m') AS mes,
                  COALESCE(d.nome, 'Sem dentista') AS dentista_nome,
                  COUNT(*) AS total_atendidos,
                  COALESCE(SUM(CASE WHEN a.status != 'cancelado' THEN a.valor_estimado ELSE 0 END), 0) AS valor_total
                FROM agendamentos a
                LEFT JOIN dentistas d ON d.id = a.dentista_id
                WHERE a.clinica_id = ? AND DATE_FORMAT(a.data, '%Y-%m') = ?`;
    const params = [clinicaId, mesAno];
    if (dentistaId) { query += ' AND a.dentista_id = ?'; params.push(dentistaId); }
    query += ' GROUP BY d.id, d.nome ORDER BY valor_total DESC';
    const [porDentista] = await pool.execute(query, params);

    const [[receitaMes]] = await pool.execute(
      `SELECT SUM(valor) AS total FROM recibos WHERE clinica_id = ? AND DATE_FORMAT(data_recibo, '%Y-%m') = ?`,
      [clinicaId, mesAno]
    );
    const [[agendados]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM agendamentos WHERE clinica_id = ? AND DATE_FORMAT(data, '%Y-%m') = ? AND status != 'cancelado'`,
      [clinicaId, mesAno]
    );
    const [[cancelados]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM agendamentos WHERE clinica_id = ? AND DATE_FORMAT(data, '%Y-%m') = ? AND status = 'cancelado'`,
      [clinicaId, mesAno]
    );

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
