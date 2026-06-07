import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { upload } from '../middlewares/upload.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import * as ctrl from '../controllers/auth.controller';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

router.post('/check-phone', ctrl.checkPhone);
router.post('/register', upload.single('photo'), ctrl.register);
router.post('/login', authLimiter, ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.post('/security-question', authLimiter, ctrl.securityQuestion);
router.post('/verify-security-answer', authLimiter, ctrl.verifySecurityAnswer);
router.post('/reset-password', ctrl.resetPassword);

export default router;
