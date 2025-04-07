# AI Symptom Checker

A web and mobile application that uses AI to analyze symptoms and provide medical advice.

## Features

- Symptom analysis using AI
- Web and mobile interfaces
- Real-time diagnosis and recommendations
- User-friendly interface

## Project Structure

```
ai-symptom-checker/
├── backend/           # Node.js backend server
│   ├── src/          # Source code
│   ├── package.json  # Backend dependencies
│   └── tsconfig.json # TypeScript configuration
├── frontend/         # React frontend
│   ├── src/         # Source code
│   ├── package.json # Frontend dependencies
│   └── tsconfig.json # TypeScript configuration
└── README.md        # Project documentation
```

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your environment variables:
   ```
   PORT=5001
   HUGGINGFACE_API_KEY=your_api_key_here
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend (Web)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Mobile App

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

## Technologies Used

- Backend: Node.js, Express, TypeScript
- Frontend: React, TypeScript
- Mobile: React Native, Expo
- AI: Hugging Face API

## License

MIT 