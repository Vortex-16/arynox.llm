import { Router } from 'express';
import { googleSignIn, emailRegister, emailLogin, completeOnboarding, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/google', googleSignIn);
router.post('/register', emailRegister);
router.post('/login', emailLogin);

// Protected — must be logged in to complete onboarding or fetch profile
router.post('/onboarding', authenticate, completeOnboarding);
router.get('/me', authenticate, getMe);

export default router;
