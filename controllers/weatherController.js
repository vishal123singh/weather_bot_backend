import User from '../models/User.js';
import bot from '../bot/bot.js';
import fetch from 'node-fetch';
import Setting from '../models/Setting.js';

/**
 * Sends daily weather updates to all subscribed Telegram users.
 * Triggered by cron-job.org or manual HTTP request.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>}
 */
export async function sendWeather(req, res) {
  try {
    // 🔐 Fetch Weather API key from DB settings
    const apiKeySetting = await Setting.findOne({ key: 'weatherApiKey' });
    const apiKey = apiKeySetting?.value;

    if (!apiKey) {
      console.error('❌ Weather API key is not configured in settings.');
      return res.status(500).json({ error: 'Weather API key not set in settings' });
    }

    // 👥 Fetch subscribed and unblocked users
    const users = await User.find({ subscribed: true, blocked: false });
    console.log(`🌍 Sending weather to ${users.length} users`);

    const defaultCity = 'London';
    let successfulSends = 0;

    for (const user of users) {
      const city = typeof user.city === 'string' && user.city.trim().length >= 2
        ? user.city.trim()
        : defaultCity;

      try {
        // 🛰 Fetch current weather data
        const weatherRes = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}`
        );

        if (!weatherRes.ok) {
          console.error(`⚠️ Failed to fetch weather for ${city} (User ${user.telegramId})`);
          continue;
        }

        const weatherData = await weatherRes.json();

        // 📝 Format weather message
        const weatherMessage = `🌤 *Weather for ${weatherData.location.name}, ${weatherData.location.country}:*\n` +
          `${weatherData.current.condition.text}, ${weatherData.current.temp_c}°C (feels like ${weatherData.current.feelslike_c}°C)\n` +
          `💧 Humidity: ${weatherData.current.humidity}%\n💨 Wind: ${weatherData.current.wind_kph} kph`;

        // 📤 Send message via Telegram bot
        await bot.sendMessage(user.telegramId, weatherMessage, { parse_mode: 'Markdown' });
        successfulSends++;

      } catch (err) {
        console.error(`❌ Error sending to ${user.telegramId}:`, err.message);
      }
    }

    return res.json({ sent: successfulSends, total: users.length });

  } catch (err) {
    console.error('🔥 sendWeather internal error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
