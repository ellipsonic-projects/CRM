import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { notFoundMiddleware } from './middleware/notFound.middleware';

import { env } from './config/env';

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);

app.use(helmet());

app.use(compression());

app.use(express.json());

app.use(morgan('dev'));

app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
