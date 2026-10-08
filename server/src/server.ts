import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
}

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectDB, getCookieSecret, validateCloudinaryConfig } from './config';
import { initSocketIO } from './sockets';
import { errorHandler, csrfProtection } from './middleware';
import apiRoutes from './routes';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

initSocketIO(server, CLIENT_URL);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(cookieParser(getCookieSecret()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'EduHub SMS API',
    school: 'Adiya',
    time: new Date().toISOString(),
  });
});

app.use('/api', csrfProtection);
app.use('/api', apiRoutes);
app.use(errorHandler);

async function startServer() {
  await connectDB();
  validateCloudinaryConfig();
  server.listen(PORT, () => {
    console.log(
      `[EduHub SMS] Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`
    );
    console.log(`[EduHub SMS] API Base URL: http://localhost:${PORT}/api`);
  });
}

startServer();
