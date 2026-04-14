const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');
const adminOnly = ensureRole(['admin', 'super_admin']);

router.get('/minha-senha', ensureAuthenticated, usuarioController.showChangePassword);
router.post('/minha-senha', ensureAuthenticated, usuarioController.changeOwnPassword);
router.get('/', ensureAuthenticated, adminOnly, usuarioController.index);
router.post('/', ensureAuthenticated, adminOnly, usuarioController.create);
router.post('/:id/toggle', ensureAuthenticated, adminOnly, usuarioController.toggleStatus);

module.exports = router;
