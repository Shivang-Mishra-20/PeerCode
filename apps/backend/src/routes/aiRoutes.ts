import { Router } from 'express';
import { aiServiceProxy } from '../services/AIServiceProxy';

const router = Router();

// POST /api/rooms/:roomId/ai/generate - Stream AI analysis / review / chat for room
router.post('/:roomId/ai/generate', (req, res) => {
  aiServiceProxy.handleGenerateRequest(req, res);
});

export default router;
