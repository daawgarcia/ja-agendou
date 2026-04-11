const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

router.get('/venda', publicController.showSalesPage);
router.post('/venda/lead', publicController.submitSalesLead);
router.get('/cadastro-dentista', publicController.showDentistSignup);
router.post('/cadastro-dentista', publicController.submitDentistSignup);

module.exports = router;
