import { Router } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/task.controller';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.listTasks);
router.get('/:id', ctrl.getTask);
router.get('/:id/window-status', ctrl.getWindowStatus);
router.get('/:id/participations', adminOnly, ctrl.getTaskParticipations);
router.post('/', adminOnly, ctrl.createTask);
router.put('/:id', adminOnly, ctrl.updateTask);
router.delete('/:id', adminOnly, ctrl.deleteTask);

export default router;
