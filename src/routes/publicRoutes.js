const express = require('express');
const publicController = require('../controllers/publicController');
const ebookWebhookController = require('../controllers/ebookWebhookController');

const router = express.Router();

router.get('/venda', publicController.showSalesPage);
router.get('/kit-recepcao', publicController.showKitRecepcao);
router.post('/kit-recepcao/lead', publicController.submitKitLead);
router.post('/venda/lead', publicController.submitSalesLead);
router.get('/clinica-inteligente', publicController.showClinicaInteligente);
router.get('/ebook-ronco-apneia', publicController.showEbookRoncoApneia);
router.get('/secretaria-elite', publicController.showSecretariaElite);
router.get('/cadastro-dentista', publicController.showDentistSignup);
router.post('/cadastro-dentista', publicController.submitDentistSignup);

// Guia: Ansiedade e Sono (público final)
router.get('/ansiedade-sono', publicController.showAnsiedadeSono);

// Ebook: Destrave o Alinhador
router.get('/destrave-alinhador', publicController.showDestraveAlinhador);

// Ebook: Protocolo Premium Implantes
router.get('/protocolo-implantes', publicController.showProtocoloImplantes);
router.get('/destrave-alinhador/obrigado', publicController.showDestraveAlinhadorObrigado);
// Páginas legais
router.get('/politica-privacidade', publicController.showPoliticaPrivacidade);
router.get('/termos-de-uso', publicController.showTermosUso);
router.get(['/privacidade', '/politica-de-privacidade', '/privacy'], (req, res) => res.redirect(301, '/politica-privacidade'));
router.post('/api/webhook-hotmart-ebook', ebookWebhookController.receive);
router.post('/api/track/checkout-click', publicController.trackCheckoutClick);

module.exports = router;
