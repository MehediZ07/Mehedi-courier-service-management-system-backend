import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import qs from 'qs';
import { envVars } from './app/config/env';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';
import { notFound } from './app/middleware/notFound';
import { IndexRoutes } from './app/routes';

const app: Application = express();

app.set('query parser', (str: string) => qs.parse(str));

app.use(cors({
  origin: [envVars.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1', IndexRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Courier System API is running.' });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
