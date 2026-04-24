const express = require('express');
const relatorioController = require('../controllers/relatorioController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'secretaria']), relatorioController.index);
router.get('/export/visual', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'secretaria']), relatorioController.exportVisual);

module.exports = router;
