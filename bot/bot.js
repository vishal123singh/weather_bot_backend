import dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User.js';
import Setting from '../models/Setting.js';

// Use webhook mode, not polling
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);


// Function to check and set webhook
async function ensureWebhookSet() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const data = await res.json();

    if (!data.result || data.result.url !== webhookUrl) {
      await bot.setWebHook(`${process.env.BASE_URL}/webhook`);
      console.log('Webhook set to:', webhookUrl);
    } else {
      console.log('Webhook already set correctly.');
    }
  } catch (err) {
    console.error('Failed to check/set webhook:', err.message);
  }
}

// Run on start
ensureWebhookSet();

// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// bot.deleteWebHook().then(() => {
//   console.log('Webhook deleted');
// });

// Store pending city inputs: chatId => waitingForCity (boolean)
const pendingCityInputs = new Map();

// /start handler
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  let user = await User.findOne({ telegramId: chatId });
  if (!user) {
    user = new User({ telegramId: chatId });
    await user.save();
  }
  bot.sendMessage(chatId, 'Welcome! Use /subscribe to get daily weather updates.');
});

// /subscribe now prompts for city first
bot.onText(/\/subscribe/, async (msg) => {
  const chatId = msg.chat.id;
  // Mark that this user is about to enter a city
  pendingCityInputs.set(chatId, true);
  bot.sendMessage(chatId, 'Please enter your city to subscribe for weather updates:');
});

bot.onText(/\/unsubscribe/, async (msg) => {
  const chatId = msg.chat.id;
  await User.findOneAndUpdate({ telegramId: chatId }, { subscribed: false });
  bot.sendMessage(chatId, 'You have been unsubscribed from weather updates.');
});


// Fallback command to allow city update anytime
bot.onText(/\/setcity/, (msg) => {
  const chatId = msg.chat.id;
  pendingCityInputs.set(chatId, true);
  bot.sendMessage(chatId, 'Please enter your new city name:');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  // Ignore messages that are Telegram commands (start with '/')
  if (!text || text.startsWith('/')) return;

  // Get or create the user
  let user = await User.findOne({ telegramId: chatId });
  if (!user) {
    user = new User({ telegramId: chatId });
    await user.save();
    bot.sendMessage(chatId, '👋 Welcome! Use /subscribe to get daily weather updates.');
    return;
  }

  // If user is expected to input a city (from /subscribe or /setcity)
  if (pendingCityInputs.has(chatId)) {
    const city = text;
    await User.findOneAndUpdate(
      { telegramId: chatId },
      { subscribed: true, city, blocked: false },
      { new: true }
    );
    pendingCityInputs.delete(chatId);

    bot.sendMessage(chatId, `✅ Subscribed! You’ll now receive daily weather updates for *${city}*.`, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[{ text: '/now' }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });

    bot.sendMessage(chatId, 'If you want the weather update now, tap the button now or send /now.');
    return;
  }

  // If user is not subscribed and sends a random message
  if (!user.subscribed) {
    bot.sendMessage(chatId, '🙋‍♂️ You are not subscribed yet. Use /subscribe to start receiving daily weather updates.');
    return;
  }

  // If user is already subscribed but sends a random message (not /setcity)
  bot.sendMessage(chatId, '✅ You’re already subscribed! Use /setcity if you’d like to change your city.');
});


bot.onText(/\/now/, async (msg) => {
  const chatId = msg.chat.id;

  const user = await User.findOne({ telegramId: chatId });
  if (!user || !user.subscribed || !user.city) {
    return bot.sendMessage(chatId, '❌ You are not subscribed or have not set a city yet. Use /subscribe to get started.');
  }

  // Get weather API key from settings
  const apiKeySetting = await Setting.findOne({ key: 'weatherApiKey' });
  const apiKey = apiKeySetting?.value;

  if (!apiKey) {
    return bot.sendMessage(chatId, '⚠️ Weather API key is not configured.');
  }

  // Fetch weather data from API
  try {
    const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(user.city)}`);
    if (!res.ok) throw new Error('Failed to fetch weather');

    const data = await res.json();

    const message =
      `🌤 *Weather for ${data.location.name}, ${data.location.country}:*\n` +
      `${data.current.condition.text}, ${data.current.temp_c}°C (feels like ${data.current.feelslike_c}°C)\n` +
      `💧 Humidity: ${data.current.humidity}%\n` +
      `💨 Wind: ${data.current.wind_kph} kph`;

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error fetching weather:', err.message);
    bot.sendMessage(chatId, '⚠️ Could not fetch weather right now. Please try again later.');
  }
});


// console.log('🤖 Telegram bot is polling...');

export default bot;
