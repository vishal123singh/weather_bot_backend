import dotenv from 'dotenv';
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import User from '../models/User.js';
import Setting from '../models/Setting.js';

const webhookUrl = `${process.env.BASE_URL}/webhook`;
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { webHook: true });

// Set webhook on startup
bot.setWebHook(webhookUrl).then(() => {
  console.log('✅ Webhook set to:', webhookUrl);
});

// Track pending city input from users
const pendingCityInputs = new Map();

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  let user = await User.findOne({ telegramId: chatId });
  if (!user) {
    user = new User({ telegramId: chatId });
    await user.save();
  }

  bot.sendMessage(chatId, `
👋 Welcome to the *Weather Bot*!
• /subscribe – Get daily weather updates
• /setcity – Change your city
• /now – Get weather now
• /unsubscribe – Stop updates`, {
    parse_mode: 'Markdown'
  });
});

// /subscribe
bot.onText(/\/subscribe/, async (msg) => {
  const chatId = msg.chat.id;
  pendingCityInputs.set(chatId, true);
  bot.sendMessage(chatId, 'Please enter your city to subscribe for weather updates:');
});

// /unsubscribe
bot.onText(/\/unsubscribe/, async (msg) => {
  const chatId = msg.chat.id;
  await User.findOneAndUpdate({ telegramId: chatId }, { subscribed: false });
  bot.sendMessage(chatId, 'You have been unsubscribed.');
});

// /setcity
bot.onText(/\/setcity/, (msg) => {
  const chatId = msg.chat.id;
  pendingCityInputs.set(chatId, true);
  bot.sendMessage(chatId, 'Please enter your new city name:');
});

// /now
bot.onText(/\/now/, async (msg) => {
  const chatId = msg.chat.id;

  const user = await User.findOne({ telegramId: chatId });
  if (!user || !user.subscribed || !user.city) {
    return bot.sendMessage(chatId, '❌ You are not subscribed or have not set a city yet. Use /subscribe.');
  }

  const apiKeySetting = await Setting.findOne({ key: 'weatherApiKey' });
  const apiKey = apiKeySetting?.value;
  if (!apiKey) return bot.sendMessage(chatId, '⚠️ Weather API key not set.');

  try {
    const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(user.city)}`);
    const data = await res.json();

    const message = `🌤 *Weather for ${data.location.name}, ${data.location.country}:*\n` +
      `${data.current.condition.text}, ${data.current.temp_c}°C (feels like ${data.current.feelslike_c}°C)\n` +
      `💧 Humidity: ${data.current.humidity}%\n💨 Wind: ${data.current.wind_kph} kph`;

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(chatId, '⚠️ Could not fetch weather.');
  }
});

// Message handler for city input
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text || text.startsWith('/')) return;

  if (pendingCityInputs.has(chatId)) {
    await User.findOneAndUpdate(
      { telegramId: chatId },
      { subscribed: true, city: text, blocked: false },
      { upsert: true }
    );
    pendingCityInputs.delete(chatId);

    bot.sendMessage(chatId, `✅ Subscribed to weather updates for *${text}*!`, {
      parse_mode: 'Markdown',
    });
    return;
  }

  const user = await User.findOne({ telegramId: chatId });
  if (!user?.subscribed) {
    return bot.sendMessage(chatId, '🙋‍♂️ Use /subscribe to receive daily weather updates.');
  }

  bot.sendMessage(chatId, '✅ You’re already subscribed! Use /setcity to change your city.');
});

export default bot;
