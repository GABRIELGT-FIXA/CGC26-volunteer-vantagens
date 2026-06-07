import { Router } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/campaign.controller';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/variables', ctrl.getVariables);
router.get('/', ctrl.listCampaigns);
router.get('/:id', ctrl.getCampaign);
router.post('/', ctrl.createCampaign);
router.put('/:id', ctrl.updateCampaign);
router.delete('/:id', ctrl.cancelCampaign);
router.post('/:id/send-now', ctrl.sendNow);

export default router;
