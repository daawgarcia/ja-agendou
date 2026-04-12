const express = require('express');
const hotmartWebhookController = require('../controllers/hotmartWebhookController');

const router = express.Router();

router.post('/hotmart', hotmartWebhookController.receive);

module.exports = router;
