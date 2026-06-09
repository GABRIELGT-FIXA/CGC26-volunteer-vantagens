import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/leader.controller';

const router = Router();

// O controle de acesso (ser líder) é feito no service via requireLeaderTeam
router.use(authenticate);

router.get('/members', ctrl.getTeamMembers);
router.post('/evaluate', ctrl.evaluateMember);

export default router;
