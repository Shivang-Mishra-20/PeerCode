import { Router, Request, Response, NextFunction } from 'express';
import {
  createRoom,
  getRoomById,
  saveSnapshot,
  getLatestSnapshot,
  ServiceError,
} from '../services/roomService';

const router = Router();

// Helper to handle service errors cleanly in route handlers
const handleRouteError = (res: Response, err: unknown, next: NextFunction) => {
  if (err instanceof ServiceError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  next(err);
};

// POST /api/rooms - Create a new room session
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await createRoom(req.body);
    res.status(201).json(room);
  } catch (err) {
    handleRouteError(res, err, next);
  }
});

// GET /api/rooms/:id - Retrieve room details by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await getRoomById(req.params.id);
    res.status(200).json(room);
  } catch (err) {
    handleRouteError(res, err, next);
  }
});

// POST /api/rooms/:id/snapshots - Save code content snapshot
router.post('/:id/snapshots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snapshot = await saveSnapshot(req.params.id, req.body);
    res.status(201).json(snapshot);
  } catch (err) {
    handleRouteError(res, err, next);
  }
});

// GET /api/rooms/:id/snapshots/latest - Retrieve latest code snapshot
router.get('/:id/snapshots/latest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snapshot = await getLatestSnapshot(req.params.id);
    if (!snapshot) {
      res.status(404).json({ error: 'No code snapshot found for this room' });
      return;
    }
    res.status(200).json(snapshot);
  } catch (err) {
    handleRouteError(res, err, next);
  }
});

export default router;
