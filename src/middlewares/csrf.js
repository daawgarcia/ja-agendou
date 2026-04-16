const crypto = require('crypto');

const CSRF_BODY_FIELD = '_csrf';
const CSRF_HEADER = 'x-csrf-token';

// Prefixos de rotas externas que não enviam o token (webhooks)
const EXEMPT_PREFIXES = ['/webhooks', '/api/webhook-hotmart'];

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function csrfMiddleware(req, res, next) {
  if (!req.session) return next();

  // Garante que a sessão tem um token CSRF
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }

  // Disponibiliza o token para todas as views via res.locals
  res.locals.csrfToken = req.session.csrfToken;

  // Métodos seguros não precisam de validação
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Rotas de webhook externas são isentas
  const path = req.originalUrl.split('?')[0];
  if (EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return next();
  }

  // Valida o token enviado pelo formulário ou header
  const submitted = (req.body && req.body[CSRF_BODY_FIELD]) || req.headers[CSRF_HEADER] || '';

  if (!submitted || submitted !== req.session.csrfToken) {
    return res.status(403).render('partials/error', {
      title: 'Ação bloqueada',
      message: 'Token de segurança inválido. Recarregue a página e tente novamente.',
    });
  }

  return next();
}

module.exports = { csrfMiddleware };
