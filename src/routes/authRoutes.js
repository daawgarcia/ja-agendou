const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/forgot-password', authController.showForgotPassword);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password', authController.showResetPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/logout', authController.logout);

module.exports = router;
