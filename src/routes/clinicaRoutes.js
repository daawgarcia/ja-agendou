const express = require('express');
const clinicaController = require('../controllers/clinicaController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.list);
router.get('/:id/editar', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.editForm);
router.post('/', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.create);
router.post('/:id/aprovar', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.approveRequest);
router.post('/:id/desbloquear', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.unlockAccess);
router.post('/:id/licenca', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.setLicenseDays);
router.post('/:id/excluir', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.deleteClient);
router.put('/:id', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.update);

module.exports = router;
