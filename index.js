import dotenv from 'dotenv';
dotenv.config();
import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';


import bot from './bot/bot.js';
import userRoutes from './routes/userRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { sendWeather } from './controllers/weatherController.js';
import authRoutes from './routes/authRoutes.js';
import passport from './config/passport.js';


const app = express();
app.use(cors());
app.use(json());
app.use(passport.initialize());

app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.post('/api/send-weather', sendWeather);

connect(process.env.MONGO_URI).then(() => {
  app.listen(5000, () => console.log("Server running on port 5000"));
});
