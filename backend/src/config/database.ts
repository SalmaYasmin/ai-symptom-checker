import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

//const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/symptom-checker?retryWrites=true&w=majority';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-symptom-checker';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
