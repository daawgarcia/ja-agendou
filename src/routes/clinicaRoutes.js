const express = require('express');
const clinicaController = require('../controllers/clinicaController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.list);
router.get('/:id/editar', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.editForm);
router.post('/', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.create);
router.put('/:id', ensureAuthenticated, ensureRole(['super_admin']), clinicaController.update);

module.exports = router;
