import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  telegramId: { type: String, unique: true },
  subscribed: { type: Boolean, default: false },
  city: { type: String }, // Add this field
  blocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default model('User', userSchema);

