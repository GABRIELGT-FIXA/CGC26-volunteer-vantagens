import { Router } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/team.controller';

const router = Router();

// Leitura pública — necessário para o formulário de cadastro
router.get('/', ctrl.listTeams);
router.get('/:id', ctrl.getTeam);

// Escrita exige autenticação de admin
router.post('/', authenticate, adminOnly, ctrl.createTeam);
router.put('/:id', authenticate, adminOnly, ctrl.updateTeam);
router.delete('/:id', authenticate, adminOnly, ctrl.deleteTeam);
router.post('/:id/members', authenticate, adminOnly, ctrl.addMember);
router.delete('/:id/members/:userId', authenticate, adminOnly, ctrl.removeMember);

export default router;
