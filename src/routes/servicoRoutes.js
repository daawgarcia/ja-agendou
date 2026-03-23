const express = require('express');
const servicoController = require('../controllers/servicoController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const router = express.Router();
const adminRoles = ['super_admin', 'admin'];

router.get('/', ensureAuthenticated, ensureRole(adminRoles), servicoController.list);
router.get('/:id/editar', ensureAuthenticated, ensureRole(adminRoles), servicoController.editForm);
router.post('/', ensureAuthenticated, ensureRole(adminRoles), servicoController.create);
router.put('/:id', ensureAuthenticated, ensureRole(adminRoles), servicoController.update);
router.delete('/:id', ensureAuthenticated, ensureRole(adminRoles), servicoController.remove);

module.exports = router;
