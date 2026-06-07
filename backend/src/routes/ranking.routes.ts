import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/ranking.controller';

const router = Router();

router.use(authenticate);

router.get('/individual', ctrl.individualRanking);
router.get('/teams', ctrl.teamsRanking);

export default router;
