const express = require('express');
const dentistaController = require('../controllers/dentistaController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const router = express.Router();
const adminRoles = ['super_admin', 'admin'];

router.get('/', ensureAuthenticated, dentistaController.list);
router.get('/:id/editar', ensureAuthenticated, ensureRole(adminRoles), dentistaController.editForm);
router.post('/', ensureAuthenticated, ensureRole(adminRoles), dentistaController.create);
router.put('/:id', ensureAuthenticated, ensureRole(adminRoles), dentistaController.update);
router.delete('/:id', ensureAuthenticated, ensureRole(adminRoles), dentistaController.remove);
router.post('/fechamentos', ensureAuthenticated, ensureRole(adminRoles), dentistaController.fechamentos);
router.delete('/fechamentos/:id', ensureAuthenticated, ensureRole(adminRoles), dentistaController.removerFechamento);

module.exports = router;
