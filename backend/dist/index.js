"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./config/database");
const symptoms_1 = __importDefault(require("./routes/symptoms"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Configure CORS
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Connect to MongoDB
(0, database_1.connectDB)();
// Routes
app.use('/api/symptoms', symptoms_1.default);
// Add a simple test route
app.get('/', (req, res) => {
    res.json({ message: 'API is working!' });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
