import { Router } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/leader.controller';

const router = Router();
router.use(authenticate);

// Líder (o controle de "ser líder" é feito no service via requireLeaderTeam)
router.get('/votables', ctrl.getVotables);     // todos os participantes (qualquer time) + status do voto
router.post('/evaluate', ctrl.evaluate);        // vota/edita (0–650), 1 por pessoa
router.delete('/evaluate/:userId', ctrl.removeVote); // remove o próprio voto
router.get('/evaluations', ctrl.getMyVotes);    // verificação do líder (votos dele)

// Admin: todas as avaliações
router.get('/all-evaluations', adminOnly, ctrl.listAll);

export default router;
