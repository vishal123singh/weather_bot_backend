import { Router } from 'express';
import Setting from '../models/Setting.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Manage application settings
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Retrieve all app settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: string
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const settingsArr = await Setting.find();
    const settings = {};
    settingsArr.forEach(s => {
      settings[s.key] = s.value;
    });
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * @swagger
 * /api/settings:
 *   post:
 *     summary: Update or insert multiple settings
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               weatherApiKey: "your-api-key"
 *               defaultCity: "London"
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Request body must be a JSON object' });
    }

    for (const key in updates) {
      const value = updates[key];
      if (typeof value !== 'string') {
        return res.status(400).json({ error: `Invalid value for ${key}. Must be a string.` });
      }

      await Setting.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      );
    }

    const updatedSettingsArr = await Setting.find();
    const updatedSettings = {};
    updatedSettingsArr.forEach(s => {
      updatedSettings[s.key] = s.value;
    });

    res.json(updatedSettings);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
