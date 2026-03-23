const express = require('express');
const agendamentoController = require('../controllers/agendamentoController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', ensureAuthenticated, agendamentoController.list);
router.get('/:id/editar', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), agendamentoController.editForm);
router.post('/', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), agendamentoController.create);
router.put('/:id', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), agendamentoController.update);
router.delete('/:id', ensureAuthenticated, ensureRole(['super_admin', 'admin']), agendamentoController.remove);
router.post('/mover', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), agendamentoController.moverData);

module.exports = router;
