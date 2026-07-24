import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import roomRoutes from './routes/roomRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Service health endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'peercode-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// REST API Routes
app.use('/api/rooms', roomRoutes);

// Centralized error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Backend Error]:', err.stack || err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[PeerCode Backend] Express server running on port ${port}`);
  });
}

export default app;
