import dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User.js';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
    console.log("msg",msg)
  const chatId = msg.chat.id;
  let user = await User.findOne({ telegramId: chatId });
  if (!user) {
    user = new User({ telegramId: chatId });
    await user.save();
  }
  bot.sendMessage(chatId, 'Welcome! Use /subscribe to get daily weather updates.');
});

bot.onText(/\/subscribe/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOneAndUpdate(
    { telegramId: chatId },
    { subscribed: true },
    { new: true, upsert: true }
  );
  bot.sendMessage(chatId, 'You are now subscribed to daily weather updates!');
});

bot.on('message', (msg) => {
  console.log('Received message:', msg);
});

export default bot;
