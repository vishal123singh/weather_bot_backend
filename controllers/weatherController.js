
import User from '../models/User.js';
import bot from '../bot/bot.js';
import fetch from 'node-fetch';
import Setting from '../models/Setting.js';

// This endpoint will be called by cron-job.org
export async function sendWeather(req, res) {
  try {
    // Get city from settings or use a default
    const city = req.body.city || 'London';
    // Get weatherApiKey from DB settings
    const apiKeySetting = await Setting.findOne({ key: 'weatherApiKey' });
    const apiKey = apiKeySetting?.value;
    if (!apiKey) return res.status(500).json({ error: 'Weather API key not set in settings' });

    // Fetch weather data from weatherapi.com
    const weatherRes = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}`);
    if (!weatherRes.ok) return res.status(500).json({ error: 'Failed to fetch weather data' });
    const weatherData = await weatherRes.json();

    const weatherMessage = `Weather for ${weatherData.location.name}, ${weatherData.location.country}:\n` +
      `${weatherData.current.condition.text}, ${weatherData.current.temp_c}°C (feels like ${weatherData.current.feelslike_c}°C)\n` +
      `Humidity: ${weatherData.current.humidity}%\nWind: ${weatherData.current.wind_kph} kph`;

    const users = await User.find({ subscribed: true, blocked: false });
    for (const user of users) {
      bot.sendMessage(user.telegramId, weatherMessage);
    }
    res.json({ sent: users.length, message: weatherMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
