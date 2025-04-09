import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';
import symptomRoutes from './routes/symptoms';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ai-symptom-checker-frontend-2hghfc4u8-salmas-projects-a16c76e3.vercel.app',
    'https://splendid-llama-b8b1f9.netlify.app/',
    'https://ai-symptom-checker-3sr4.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/symptoms', symptomRoutes);

// Add a simple test route
app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});