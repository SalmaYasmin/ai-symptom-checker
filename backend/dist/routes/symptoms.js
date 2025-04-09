"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const inference_1 = require("@huggingface/inference");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
const hf = new inference_1.HfInference(process.env.HUGGINGFACE_API_KEY);
// Root endpoint to list available endpoints
router.get('/', (req, res) => {
    res.json({
        availableEndpoints: {
            testApi: {
                method: 'GET',
                path: '/api/symptoms/test-api',
                description: 'Test Hugging Face API connection'
            },
            analyze: {
                method: 'POST',
                path: '/api/symptoms/analyze',
                description: 'Analyze symptoms and get medical advice'
            }
        }
    });
});
// Test endpoint to verify Hugging Face API key
router.get('/test-api', async (req, res) => {
    try {
        const result = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.2',
            inputs: 'Hello, this is a test message.',
            parameters: {
                max_new_tokens: 50
            }
        });
        res.json({ success: true, message: "API key is working", response: result.generated_text });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Hugging Face API Error:', error);
        res.status(500).json({
            success: false,
            error: 'API key verification failed',
            details: errorMessage
        });
    }
});
router.post('/analyze', async (req, res) => {
    try {
        const { symptoms } = req.body;
        const symptomsText = symptoms.join(', ');
        const prompt = `You are a medical AI assistant. Analyze these symptoms: ${symptomsText}.
    
    Provide a clear and concise response with:
    1. A possible diagnosis (be specific but mention that this is not a substitute for professional medical advice)
    2. A list of 5 specific recommendations
    
    IMPORTANT: Do not use any placeholders like [specific condition] or [Specific recommendation X]. 
    Provide actual medical analysis and real recommendations based on the symptoms provided.
    
    Format your response exactly like this:
    Possible Diagnosis:
    Based on the symptoms provided, it appears to be [ACTUAL CONDITION]. However, this is not a substitute for professional medical advice.

    Recommendations:
    [ACTUAL RECOMMENDATION 1]
    [ACTUAL RECOMMENDATION 2]
    [ACTUAL RECOMMENDATION 3]
    [ACTUAL RECOMMENDATION 4]
    [ACTUAL RECOMMENDATION 5]`;
        const result = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.2',
            inputs: prompt,
            parameters: {
                max_new_tokens: 500,
                temperature: 0.7,
                top_p: 0.9
            }
        });
        // Process the text response to extract diagnosis and recommendations
        const responseText = result.generated_text;
        // Find the last occurrence of "Possible Diagnosis:" and "Recommendations:"
        const lastDiagnosisIndex = responseText.lastIndexOf('Possible Diagnosis:');
        const lastRecommendationsIndex = responseText.lastIndexOf('Recommendations:');
        // Extract the final diagnosis and recommendations sections
        const diagnosisSection = lastDiagnosisIndex !== -1 ?
            responseText.slice(lastDiagnosisIndex + 'Possible Diagnosis:'.length, lastRecommendationsIndex).trim() :
            'Unable to determine diagnosis';
        const recommendationsSection = lastRecommendationsIndex !== -1 ?
            responseText.slice(lastRecommendationsIndex + 'Recommendations:'.length).trim() :
            '';
        // Split recommendations into an array and clean up
        const recommendations = recommendationsSection
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.includes('[ACTUAL') && !line.startsWith('Possible Diagnosis:'));
        res.json({
            diagnosis: diagnosisSection,
            recommendations: recommendations.length > 0 ? recommendations : ['No specific recommendations available']
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'An error occurred while analyzing symptoms',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
