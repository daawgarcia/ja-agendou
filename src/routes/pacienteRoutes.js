const express = require('express');
const multer = require('multer');
const pacienteController = require('../controllers/pacienteController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = express.Router();

router.get('/', ensureAuthenticated, pacienteController.list);
router.get('/json', ensureAuthenticated, pacienteController.getJson);
router.get('/:id/json', ensureAuthenticated, pacienteController.editForm);
router.get('/:id/editar', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), pacienteController.editForm);
router.post('/', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), pacienteController.create);
router.post('/import', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), upload.single('arquivo'), pacienteController.importExcel);
router.put('/:id', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), pacienteController.update);
router.delete('/:id', ensureAuthenticated, ensureRole(['super_admin', 'admin']), pacienteController.remove);

module.exports = router;
