import { Router } from 'express';
import { authenticate, adminOnly } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import * as ctrl from '../controllers/news.controller';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.listNews);
router.get('/:id', ctrl.getNews);
router.post('/', adminOnly, upload.single('image'), ctrl.createNews);
router.put('/:id', adminOnly, upload.single('image'), ctrl.updateNews);
router.delete('/:id', adminOnly, ctrl.deleteNews);

export default router;
