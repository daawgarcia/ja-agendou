const express = require('express');
const historicoController = require('../controllers/historicoController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', ensureAuthenticated, historicoController.list);
router.post('/', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), historicoController.create);
router.delete('/:id', ensureAuthenticated, ensureRole(['super_admin', 'admin']), historicoController.remove);

module.exports = router;
