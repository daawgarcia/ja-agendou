const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/metaAdsController');

router.get( '/login',   ctrl.showLogin);
router.post('/login',   ctrl.handleLogin);
router.get( '/logout',  ctrl.handleLogout);

// Rotas protegidas por senha própria
router.get( '/',            ctrl.requireAuth, ctrl.showDashboard);
router.get( '/api/data',    ctrl.requireAuth, ctrl.apiData);
router.get( '/api/refresh', ctrl.requireAuth, ctrl.apiRefresh);

module.exports = router;
