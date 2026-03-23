const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const router = express.Router();
router.get('/', ensureAuthenticated, dashboardController.index);
router.post('/agendamentos/:id/status', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), dashboardController.updateStatus);

module.exports = router;
