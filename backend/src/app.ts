import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import teamRoutes from './routes/team.routes';
import taskRoutes from './routes/task.routes';
import participationRoutes from './routes/participation.routes';
import rankingRoutes from './routes/ranking.routes';
import campaignRoutes from './routes/campaign.routes';
import newsRoutes from './routes/news.routes';
import leaderRoutes from './routes/leader.routes';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.resolve(env.uploadDir)));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/participations', participationRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/leader', leaderRoutes);

app.use(errorHandler);

export default app;
