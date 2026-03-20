const express = require('express');
const pacienteController = require('../controllers/pacienteController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', ensureAuthenticated, pacienteController.list);
router.get('/:id/editar', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), pacienteController.editForm);
router.post('/', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), pacienteController.create);
router.put('/:id', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), pacienteController.update);
router.delete('/:id', ensureAuthenticated, ensureRole(['super_admin', 'admin']), pacienteController.remove);

module.exports = router;
