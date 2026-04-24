const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

router.get('/venda', publicController.showSalesPage);
router.get('/kit-recepcao', publicController.showKitRecepcao);
router.post('/kit-recepcao/lead', publicController.submitKitLead);
router.post('/venda/lead', publicController.submitSalesLead);
router.get('/clinica-inteligente', publicController.showClinicaInteligente);
router.get('/ebook-ronco-apneia', publicController.showEbookRoncoApneia);
router.get('/cadastro-dentista', publicController.showDentistSignup);
router.post('/cadastro-dentista', publicController.submitDentistSignup);

module.exports = router;
