import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import { pool } from './db.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith('change_this')) {
  console.error('Set a strong JWT_SECRET in backend/.env'); process.exit(1);
}
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 120 }));
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, db: true }); }
  catch { res.status(500).json({ ok: false, db: false }); }
});
app.use('/api/auth', authRoutes);
app.use('/api', chatRoutes);
app.listen(process.env.PORT || 4000, () => console.log('Backend on port ' + (process.env.PORT || 4000)));
