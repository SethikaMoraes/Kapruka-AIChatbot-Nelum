/**
 * Nelum AI Proxy Express Server Entry Point
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import pathModule from 'path';

import { SERVER_CONFIG } from './config/server.config.js';
import { errorHandlerMiddleware } from './middleware/errorHandler.middleware.js';

// Route imports
import productsRouter from './routes/products.routes.js';
import deliveryRouter from './routes/delivery.routes.js';
import ordersRouter from './routes/orders.routes.js';
import aiRouter from './routes/ai.routes.js';
import voiceRouter from './routes/voice.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathModule.dirname(__filename);
const rootDir = pathModule.resolve(__dirname, '..');

const app = express();
const PORT = SERVER_CONFIG.PORT;

// Enable CORS and parse JSON request bodies
app.use(cors());
app.use(express.json());

// Serve static frontend files from root directory
app.use(express.static(rootDir));

// API router registrations
app.use('/api/products', productsRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/ai', aiRouter);
app.use('/api/voice', voiceRouter);

// Centralized error interceptor middleware
app.use(errorHandlerMiddleware);

// Start listening on configured port
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`NELUM PROXY SERVER STARTED SUCCESSFULLY`);
  console.log(`Serving static files and API endpoints on PORT: ${PORT}`);
  console.log(`==================================================`);
});

export default app;
