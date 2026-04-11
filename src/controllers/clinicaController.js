const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendEmail, isEmailConfigured } = require('../services/emailService');

function getLoginUrl(req) {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/login`;
}

async function getClinicAccessContact(clinicaId) {
  const [rows] = await pool.execute(
    `SELECT c.nome AS clinica_nome,
            c.email AS clinica_email,
            u.nome AS usuario_nome,
            u.email AS usuario_email
     FROM clinicas c
     LEFT JOIN usuarios u
       ON u.clinica_id = c.id
      AND u.perfil IN ('admin', 'super_admin')
     WHERE c.id = ?
     ORDER BY CASE WHEN u.perfil = 'admin' THEN 0 ELSE 1 END, u.id ASC
     LIMIT 1`,
    [clinicaId]
  );

  const row = rows[0] || null;
  if (!row) return null;

  return {
    clinicaNome: row.clinica_nome,
    contatoNome: row.usuario_nome || 'Responsável',
    contatoEmail: row.usuario_email || row.clinica_email || null,
  };
}

async function sendAccessReleaseEmail({ req, clinicaId, mode }) {
  if (!isEmailConfigured()) {
    return;
  }

  const contact = await getClinicAccessContact(clinicaId);
  if (!contact || !contact.contatoEmail) {
    return;
  }

  const loginUrl = getLoginUrl(req);
  const releaseCcEmail = (process.env.RELEASE_COPY_EMAIL || 'otavio.garcia@outlook.com').trim().toLowerCase();
  const title = mode === 'unlock'
    ? 'Acesso reativado com sucesso'
    : mode === 'license'
      ? 'Licença atualizada e acesso liberado'
      : 'Acesso liberado com sucesso';
  const subtitle = mode === 'unlock'
    ? 'Seu acesso ao Já Agendou foi reativado e já está disponível para uso.'
    : mode === 'license'
      ? 'Sua licença foi atualizada pelo admin e o acesso já está disponível para uso.'
      : 'Seu cadastro de teste foi aprovado e já está disponível para uso.';

  const textBody = [
    title,
    '',
    `Olá, ${contact.contatoNome}!`,
    subtitle,
    '',
    `Clínica: ${contact.clinicaNome}`,
    `E-mail de acesso: ${contact.contatoEmail}`,
    `Link de acesso: ${loginUrl}`,
    '',
    'Equipe Já Agendou',
  ].join('\n');

  const htmlBody = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#f4f7fb;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbe6f2;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(140deg,#154c7d,#1e6cab);padding:22px 24px;color:#ffffff;">
          <h2 style="margin:0 0 6px;font-size:26px;">${title}</h2>
          <p style="margin:0;font-size:14px;opacity:0.92;">${subtitle}</p>
        </div>
        <div style="padding:24px;color:#243447;line-height:1.55;">
          <p style="margin-top:0;">Olá, <strong>${contact.contatoNome}</strong>!</p>
          <p>Seu acesso da clínica <strong>${contact.clinicaNome}</strong> está liberado.</p>
          <p><strong>E-mail de acesso:</strong> ${contact.contatoEmail}</p>
          <p style="margin:20px 0 24px;">
            <a href="${loginUrl}" style="display:inline-block;background:#1e5b92;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">Acessar o sistema</a>
          </p>
          <p style="margin:0;color:#5a6b7d;font-size:13px;">Se o botão não abrir, use este link: <a href="${loginUrl}">${loginUrl}</a></p>
        </div>
      </div>
    </div>
  `;

  const sendResult = await sendEmail({
    to: contact.contatoEmail,
    cc: releaseCcEmail && releaseCcEmail !== String(contact.contatoEmail || '').toLowerCase()
      ? releaseCcEmail
      : undefined,
    subject: `Já Agendou - ${title}`,
    text: textBody,
    html: htmlBody,
    fromName: 'Já Agendou',
  });

  if (!sendResult.ok) {
    console.error('ERRO AO ENVIAR E-MAIL DE LIBERAÇÃO:', sendResult.error || sendResult.reason);
  }
}

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

    await sendAccessReleaseEmail({ req, clinicaId: Number(id), mode: 'approve' });

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

    await sendAccessReleaseEmail({ req, clinicaId: Number(id), mode: 'unlock' });

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

    await sendAccessReleaseEmail({ req, clinicaId: Number(id), mode: 'license' });

    return res.redirect('/clinicas');
  } catch (error) {
    console.error('ERRO DEFINIR LICENCA:', error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao definir licenca',
      message: 'Nao foi possivel definir os dias de licenca para a clinica.',
    });
  }
}

async function tableExists(connection, tableName) {
  const [rows] = await connection.execute(
    `SELECT 1
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
     LIMIT 1`,
    [tableName]
  );

  return rows.length > 0;
}

async function deleteByClinicaIfExists(connection, tableName, clinicaId) {
  if (!(await tableExists(connection, tableName))) {
    return;
  }
  await connection.execute(`DELETE FROM ${tableName} WHERE clinica_id = ?`, [clinicaId]);
}

async function deleteClient(req, res) {
  const { id } = req.params;
  const clinicaId = Number(id);

  if (!Number.isInteger(clinicaId) || clinicaId <= 0) {
    return res.status(400).render('partials/error', {
      title: 'Cliente inválido',
      message: 'Não foi possível identificar o cliente para exclusão.',
    });
  }

  if (Number(req.session.user.clinica_id) === clinicaId) {
    return res.status(400).render('partials/error', {
      title: 'Ação bloqueada',
      message: 'Você não pode excluir a própria clínica enquanto estiver logado.',
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await deleteByClinicaIfExists(connection, 'agendamentos', clinicaId);
    await deleteByClinicaIfExists(connection, 'pacientes', clinicaId);
    await deleteByClinicaIfExists(connection, 'dentistas', clinicaId);
    await deleteByClinicaIfExists(connection, 'servicos', clinicaId);
    await deleteByClinicaIfExists(connection, 'recibos', clinicaId);
    await deleteByClinicaIfExists(connection, 'historico', clinicaId);
    await deleteByClinicaIfExists(connection, 'configuracoes_clinica', clinicaId);
    await deleteByClinicaIfExists(connection, 'usuarios', clinicaId);

    await connection.execute('DELETE FROM clinicas WHERE id = ?', [clinicaId]);

    await connection.commit();
    return res.redirect('/clinicas');
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('ERRO EXCLUIR CLIENTE:', error);
    return res.status(500).render('partials/error', {
      title: 'Erro ao excluir cliente',
      message: 'Não foi possível excluir o cliente neste momento.',
    });
  } finally {
    if (connection) {
      connection.release();
    }
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
  deleteClient,
};
