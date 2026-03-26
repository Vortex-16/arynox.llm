import { Router } from 'express';
import { googleSignIn } from '../controllers/auth.controller';

const router = Router();

router.post('/google', googleSignIn);

export default router;
