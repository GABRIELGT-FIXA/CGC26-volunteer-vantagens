import { Router } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import * as ctrl from '../controllers/participation.controller';

const router = Router();

router.use(authenticate);

router.get('/my', ctrl.getMyParticipations);
router.get('/audit', adminOnly, ctrl.listForAudit);
router.post('/:taskId/checkin', upload.single('photo'), ctrl.checkIn);
router.post('/:taskId/checkout', upload.single('photo'), ctrl.checkOut);
router.put('/:id/points', adminOnly, ctrl.updatePoints);
router.put('/:id/review', adminOnly, ctrl.reviewParticipation);

export default router;
