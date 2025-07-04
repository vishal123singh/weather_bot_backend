
import { Router } from 'express';
import User from '../models/User.js';
const router = Router();


// Get all users
router.get('/', async (req, res) => {
  const users = await User.find();
  res.json(users);
});


// Block a user
router.post('/:id/block', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { blocked: true }, { new: true });
  res.json(user);
});


// Delete a user
router.delete('/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
