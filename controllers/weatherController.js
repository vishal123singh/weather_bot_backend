import User from '../models/User.js';
import bot from '../bot/bot.js';
import fetch from 'node-fetch';
import Setting from '../models/Setting.js';

// This endpoint will be called by cron-job.org or manually
export async function sendWeather(req, res) {
  try {
    // Get weatherApiKey from DB settings
    const apiKeySetting = await Setting.findOne({ key: 'weatherApiKey' });
    const apiKey = apiKeySetting?.value;
    if (!apiKey) return res.status(500).json({ error: 'Weather API key not set in settings' });

    // Get all subscribed & unblocked users
    const users = await User.find({ subscribed: true, blocked: false });

    const defaultCity = 'London';
    let successfulSends = 0;
    console.log("users", users);
    for (const user of users) {
      const city = user.city || defaultCity;

      try {
        const weatherRes = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}`);
        if (!weatherRes.ok) {
          console.error(`Failed to fetch weather for ${city} (User ${user.telegramId})`);
          continue;
        }

        const weatherData = await weatherRes.json();

        const weatherMessage = `🌤 *Weather for ${weatherData.location.name}, ${weatherData.location.country}:*\n` +
          `${weatherData.current.condition.text}, ${weatherData.current.temp_c}°C (feels like ${weatherData.current.feelslike_c}°C)\n` +
          `💧 Humidity: ${weatherData.current.humidity}%\n💨 Wind: ${weatherData.current.wind_kph} kph`;

        await bot.sendMessage(user.telegramId, weatherMessage, { parse_mode: 'Markdown' });
        successfulSends++;
      } catch (err) {
        console.error(`Error sending to ${user.telegramId}:`, err.message);
      }
    }

    return res.json({ sent: successfulSends, total: users.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
