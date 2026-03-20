const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { ensureAuthenticated } = require('../middlewares/auth');

const router = express.Router();
router.get('/', ensureAuthenticated, dashboardController.index);

module.exports = router;
