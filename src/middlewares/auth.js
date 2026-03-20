function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  return next();
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
