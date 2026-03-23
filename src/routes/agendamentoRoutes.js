const express = require('express');
const agendamentoController = require('../controllers/agendamentoController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', ensureAuthenticated, agendamentoController.list);
router.get('/lembretes', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), agendamentoController.lembretes);
router.get('/:id/editar', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), agendamentoController.editForm);
router.post('/', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), agendamentoController.create);
router.put('/:id', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), agendamentoController.update);
router.delete('/:id', ensureAuthenticated, ensureRole(['super_admin', 'admin']), agendamentoController.remove);
router.post('/mover', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), agendamentoController.moverData);
router.post('/:id/lembrete-enviado', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), agendamentoController.marcarLembreteEnviado);
router.post('/:id/lembrete-limpar', ensureAuthenticated, ensureRole(['super_admin', 'admin', 'recepcao']), agendamentoController.limparLembreteEnviado);

module.exports = router;
