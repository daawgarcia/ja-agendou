const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas solicitações de recuperação de senha. Tente novamente em 1 hora.' },
});

router.get('/login', authController.showLogin);
router.post('/login', loginLimiter, authController.login);
router.get('/forgot-password', authController.showForgotPassword);
router.post('/forgot-password', forgotLimiter, authController.forgotPassword);
router.get('/reset-password', authController.showResetPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/logout', authController.logout);

module.exports = router;
