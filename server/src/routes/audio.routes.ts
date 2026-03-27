import { Router } from 'express';
import { generateAudioOverview } from '../controllers/audio.controller';

const router = Router();

// POST /api/audio/generate
// Gets transcript from Groq LLM → converts to speech via ElevenLabs
router.post('/generate', generateAudioOverview);

export default router;
