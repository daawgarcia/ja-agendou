const pool = require('../config/db');

function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  return pool
    .execute(
      'SELECT id, nome, status, licenca_fim_em, trial_fim_em FROM clinicas WHERE id = ? LIMIT 1',
      [req.session.user.clinica_id]
    )
    .then(async ([rows]) => {
      const clinica = rows[0];
      if (!clinica) {
        req.session.destroy(() => {
          res.redirect('/login?erro=clinica_inativa');
        });
        return;
      }

      if (clinica.status === 'pendente') {
        req.session.destroy(() => {
          res.redirect('/login?erro=clinica_pendente');
        });
        return;
      }

      if (clinica.status !== 'ativo') {
        req.session.destroy(() => {
          res.redirect('/login?erro=clinica_inativa');
        });
        return;
      }

      const licenseEnd = clinica.licenca_fim_em || clinica.trial_fim_em;
      if (licenseEnd) {
        const licenseEndDate = new Date(licenseEnd);
        if (!Number.isNaN(licenseEndDate.getTime()) && Date.now() > licenseEndDate.getTime()) {
          await pool.execute(
            "UPDATE clinicas SET status = 'inativo' WHERE id = ? AND status = 'ativo'",
            [clinica.id]
          );

          req.session.destroy(() => {
            res.redirect(`/login?erro=${clinica.licenca_fim_em ? 'licenca_expirada' : 'trial_expirado'}`);
          });
          return;
        }
      }

      req.session.user.clinica_nome = clinica.nome;
      return next();
    })
    .catch((error) => {
      console.error('ERRO AUTH MIDDLEWARE:', error);
      return res.status(500).render('partials/error', {
        title: 'Erro de autenticacao',
        message: 'Nao foi possivel validar seu acesso agora.',
      });
    });
}

function ensureRole(roles = []) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    if (!roles.includes(req.session.user.perfil)) {
      return res.status(403).render('partials/error', {
        title: 'Acesso negado',
        message: 'Você não tem permissão para acessar esta área.'
      });
    }
    return next();
  };
}

function attachUserToViews(req, res, next) {
  res.locals.user = req.session.user || null;
  res.locals.baseUrl = process.env.BASE_URL || '';
  next();
}

module.exports = { ensureAuthenticated, ensureRole, attachUserToViews };
