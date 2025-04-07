import mongoose from 'mongoose';

const symptomSchema = new mongoose.Schema({
  symptoms: [String],
  diagnosis: String,
  recommendations: [String],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Symptom', symptomSchema);