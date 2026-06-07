import { Router } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import * as ctrl from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/me', ctrl.getMe);
router.put('/me/photo', upload.single('photo'), ctrl.updateMyPhoto);
router.put('/me/password', ctrl.updateMyPassword);

router.get('/', adminOnly, ctrl.listUsers);
router.get('/:id', adminOnly, ctrl.getUser);
router.post('/', adminOnly, upload.single('photo'), ctrl.createUser);
router.put('/:id', adminOnly, upload.single('photo'), ctrl.updateUser);
router.delete('/:id', adminOnly, ctrl.deleteUser);

export default router;
