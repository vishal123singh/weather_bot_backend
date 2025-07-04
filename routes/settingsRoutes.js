import { Router } from 'express';
import Setting from '../models/Setting.js';
const router = Router();

// Get all settings as key-value pairs
router.get('/', async (req, res) => {
  const settingsArr = await Setting.find();
  const settings = {};
  settingsArr.forEach(s => { settings[s.key] = s.value; });
  res.json(settings);
});

// Update settings (accepts object of key-value pairs)
router.post('/', async (req, res) => {
  const updates = req.body;
  for (const key in updates) {
    await Setting.findOneAndUpdate(
      { key },
      { value: updates[key] },
      { upsert: true, new: true }
    );
  }
  // Return updated settings
  const settingsArr = await Setting.find();
  const settings = {};
  settingsArr.forEach(s => { settings[s.key] = s.value; });
  res.json(settings);
});

export default router;
