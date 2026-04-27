const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/metaAdsController');

router.get( '/login',   ctrl.showLogin);
router.post('/login',   ctrl.handleLogin);
router.get( '/logout',  ctrl.handleLogout);

// Rotas protegidas por senha própria
router.get( '/',               ctrl.requireAuth, ctrl.showDashboard);
router.get( '/relatorio-diario', ctrl.requireAuth, ctrl.showDailyReport);
router.get( '/api/data',       ctrl.requireAuth, ctrl.apiData);
router.get( '/api/refresh',    ctrl.requireAuth, ctrl.apiRefresh);

// Agente IA
router.get( '/agente',                  ctrl.requireAuth, ctrl.showAgente);
router.post('/agente/analisar',         ctrl.requireAuth, ctrl.analisarAgente);
router.post('/agente/executar-semanal', ctrl.requireAuth, ctrl.executarSemanal);

// Aprovação por link de e-mail (sem auth — token é a autenticação)
router.get('/agente/aprovar',  ctrl.aprovarAcao);
router.get('/agente/rejeitar', ctrl.rejeitarAcao);

module.exports = router;
