const express = require('express');
const reciboController = require('../controllers/reciboController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', ensureAuthenticated, reciboController.list);
router.get('/:id/imprimir', ensureAuthenticated, reciboController.imprimir);
router.post('/', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), reciboController.create);
router.delete('/:id', ensureAuthenticated, ensureRole(['super_admin', 'admin']), reciboController.remove);

module.exports = router;
