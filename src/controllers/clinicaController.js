const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function list(req, res) {
  try {
    const [clinicas] = await pool.execute(
      `SELECT id, nome, slug, email, telefone, status,
              licenca_dias,
              licenca_inicio_em,
              licenca_fim_em,
              trial_inicio_em,
              trial_fim_em,
              desbloqueado_em,
              DATE_FORMAT(created_at, '%d/%m/%Y') AS created_at_formatado
       FROM clinicas
       ORDER BY id DESC`
    );

    return res.render('clinicas/index', { clinicas, editClinica: null });
  } catch (error) {
    console.error('ERRO LIST CLINICAS:', error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao listar clínicas',
      message: 'Não foi possível carregar as clínicas.'
    });
  }
}

async function create(req, res) {
  const { nome, slug, email, telefone, status, senha } = req.body;

  try {
    if (!nome || !slug || !email || !senha) {
      return res.status(400).render('partials/error', {
        title: 'Campos obrigatórios',
        message: 'Nome, slug, e-mail e senha são obrigatórios.'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO clinicas (nome, slug, email, telefone, status)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, slug, email, telefone || null, status || 'ativo']
    );

    const clinicaId = result.insertId;
    const senhaHash = await bcrypt.hash(senha, 10);

    await pool.execute(
      `INSERT INTO usuarios
       (clinica_id, nome, email, senha_hash, perfil, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clinicaId, `${nome} Admin`, email, senhaHash, 'admin', 'ativo']
    );

    return res.redirect('/clinicas');
  } catch (error) {
    console.error('ERRO CREATE CLINICA:', error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao cadastrar clínica',
      message: 'Não foi possível salvar a clínica. Verifique se o slug e o e-mail são únicos.'
    });
  }
}

async function editForm(req, res) {
  const { id } = req.params;

  try {
    const [clinicas] = await pool.execute(
      `SELECT id, nome, slug, email, telefone, status,
              DATE_FORMAT(created_at, '%d/%m/%Y') AS created_at_formatado
       FROM clinicas
       ORDER BY id DESC`
    );

    const [rows] = await pool.execute(
      `SELECT id, nome, slug, email, telefone, status
       FROM clinicas
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.redirect('/clinicas');
    }

    return res.render('clinicas/index', { clinicas, editClinica: rows[0] });
  } catch (error) {
    console.error('ERRO EDIT FORM CLINICA:', error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao editar clínica',
      message: 'Não foi possível carregar a clínica.'
    });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { nome, slug, email, telefone, status } = req.body;

  try {
    await pool.execute(
      `UPDATE clinicas
       SET nome = ?, slug = ?, email = ?, telefone = ?, status = ?
       WHERE id = ?`,
      [nome, slug, email || null, telefone || null, status || 'ativo', id]
    );

    return res.redirect('/clinicas');
  } catch (error) {
    console.error('ERRO UPDATE CLINICA:', error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao atualizar clínica',
      message: 'Não foi possível atualizar a clínica.'
    });
  }
}

async function approveRequest(req, res) {
  const { id } = req.params;

  try {
    await pool.execute(
      `UPDATE clinicas
       SET status = 'ativo',
           licenca_dias = IFNULL(licenca_dias, 3),
           licenca_inicio_em = IFNULL(licenca_inicio_em, NOW()),
           licenca_fim_em = IFNULL(licenca_fim_em, DATE_ADD(NOW(), INTERVAL 3 DAY)),
           trial_inicio_em = IFNULL(trial_inicio_em, NOW()),
           trial_fim_em = IFNULL(trial_fim_em, DATE_ADD(NOW(), INTERVAL 3 DAY))
       WHERE id = ? AND status = 'pendente'`,
      [id]
    );

    await pool.execute(
      "UPDATE usuarios SET status = 'ativo' WHERE clinica_id = ?",
      [id]
    );

    return res.redirect('/clinicas');
  } catch (error) {
    console.error('ERRO APPROVE CLINICA:', error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao aprovar cadastro',
      message: 'Nao foi possivel aprovar a solicitacao da clinica.',
    });
  }
}

async function unlockAccess(req, res) {
  const { id } = req.params;

  try {
    await pool.execute(
      `UPDATE clinicas
       SET status = 'ativo',
           desbloqueado_em = NOW()
       WHERE id = ?`,
      [id]
    );

    await pool.execute(
      "UPDATE usuarios SET status = 'ativo' WHERE clinica_id = ?",
      [id]
    );

    return res.redirect('/clinicas');
  } catch (error) {
    console.error('ERRO DESBLOQUEAR CLINICA:', error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao desbloquear acesso',
      message: 'Nao foi possivel desbloquear o acesso da clinica.',
    });
  }
}

async function setLicenseDays(req, res) {
  const { id } = req.params;
  const dias = Number(req.body.licenca_dias);

  if (!Number.isInteger(dias) || dias <= 0) {
    return res.status(400).render('partials/error', {
      title: 'Licenca invalida',
      message: 'Informe um numero de dias maior que zero.',
    });
  }

  try {
    await pool.execute(
      `UPDATE clinicas
       SET status = 'ativo',
           licenca_dias = ?,
           licenca_inicio_em = NOW(),
           licenca_fim_em = DATE_ADD(NOW(), INTERVAL ? DAY)
       WHERE id = ?`,
      [dias, dias, id]
    );

    await pool.execute(
      "UPDATE usuarios SET status = 'ativo' WHERE clinica_id = ?",
      [id]
    );

    return res.redirect('/clinicas');
  } catch (error) {
    console.error('ERRO DEFINIR LICENCA:', error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao definir licenca',
      message: 'Nao foi possivel definir os dias de licenca para a clinica.',
    });
  }
}

module.exports = {
  list,
  create,
  editForm,
  update,
  approveRequest,
  unlockAccess,
  setLicenseDays,
};
