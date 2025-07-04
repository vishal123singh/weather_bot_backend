import { Schema, model } from 'mongoose';

const adminSchema = new Schema({
  email: { type: String, unique: true },
  password: { type: String }, // hashed
  googleId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default model('Admin', adminSchema);
