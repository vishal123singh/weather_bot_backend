// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import passport from './config/passport.js';

import bot from './bot/bot.js'; // Must be imported before webhook to set up handlers
import userRoutes from './routes/userRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { sendWeather } from './controllers/weatherController.js';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

const app = express();

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: Swagger UI documentation
 *     description: Access interactive API documentation here.
 *     tags: [Docs]
 *     responses:
 *       200:
 *         description: Swagger UI served
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());
app.use(json());
app.use(passport.initialize());

/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Telegram bot webhook endpoint
 *     description: Receives updates from Telegram.
 *     tags: [Telegram]
 *     responses:
 *       200:
 *         description: Successfully processed update
 */
app.post('/webhook', (req, res) => {
  console.log('➡️ Telegram webhook hit');
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 🔌 Mount API routes
app.use('/api/users', userRoutes);          // User CRUD
app.use('/api/settings', settingsRoutes);   // System config
app.use('/api/auth', authRoutes);           // Login & OAuth

/**
 * @swagger
 * /api/send-weather:
 *   get:
 *     summary: Send weather update to subscribed users
 *     description: Manually triggers weather update (used by cron or admin)
 *     tags: [Weather]
 *     responses:
 *       200:
 *         description: Weather sent successfully
 */
app.get('/api/send-weather', sendWeather);

// 🔗 Connect MongoDB and start Express server
connect(process.env.MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
