import express from 'express';
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

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
      model: 'microsoft/BioGPT',
      inputs: 'What are common symptoms of the flu?',
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7
      }
    });
    res.json({ success: true, message: "API key is working", response: result.generated_text });
  } catch (error) {
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

    const prompt = `As a medical AI assistant, analyze these symptoms: ${symptomsText}.
    
    Provide a structured clinical analysis with:
    1. Possible diagnoses based on current medical literature
    2. Evidence-based recommendations
    3. Severity assessment
    4. When to seek immediate medical attention
    
    Format the response as:
    
    DIAGNOSIS:
    [Clinical assessment based on symptoms]
    
    RECOMMENDATIONS:
    1. [Evidence-based recommendation]
    2. [Evidence-based recommendation]
    3. [Evidence-based recommendation]
    4. [Evidence-based recommendation]
    5. [Evidence-based recommendation]
    
    SEVERITY:
    [Assessment of condition severity]
    
    URGENT CARE NEEDED IF:
    [Specific conditions that require immediate medical attention]`;

    const result = await hf.textGeneration({
      model: 'microsoft/BioGPT',
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true
      }
    });

    // Process the text response
    const responseText = result.generated_text;
    
    // Extract sections using regex
    const diagnosis = responseText.match(/DIAGNOSIS:\s*([\s\S]*?)(?=RECOMMENDATIONS:|$)/)?.[1]?.trim() || 'Unable to determine diagnosis';
    const recommendations = (responseText.match(/RECOMMENDATIONS:\s*([\s\S]*?)(?=SEVERITY:|$)/)?.[1] || '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, ''));
    
    const severity = responseText.match(/SEVERITY:\s*([\s\S]*?)(?=URGENT CARE NEEDED IF:|$)/)?.[1]?.trim() || 'Unable to assess severity';
    const urgentCare = responseText.match(/URGENT CARE NEEDED IF:\s*([\s\S]*?)$/)?.[1]?.trim() || 'Seek medical attention if symptoms worsen';

    res.json({
      diagnosis,
      recommendations: recommendations.length > 0 ? recommendations : ['No specific recommendations available'],
      severity,
      urgentCare,
      disclaimer: "This is an AI-generated analysis and should not replace professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment."
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'An error occurred while analyzing symptoms',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/analyze/technical', async (req, res) => {
  try {
    const { symptoms, patientId } = req.body;
    const symptomsText = symptoms.join(', ');

    const prompt = `You are a medical professional providing a detailed clinical analysis. Based on the reported symptoms: ${symptomsText}, provide a comprehensive medical assessment.

Clinical Analysis Structure:

1. Clinical Assessment:
- Detailed analysis of presenting symptoms
- Potential underlying pathophysiology
- Relevant clinical patterns and associations
- Severity assessment criteria

2. Differential Diagnosis (in order of likelihood):
- List top 3-5 potential diagnoses with ICD-10 codes
- Key distinguishing features for each
- Supporting and contradicting factors
- Critical diagnostic considerations

3. Recommended Diagnostic Approach:
- Initial laboratory studies (specific tests with clinical rationale)
- Imaging studies (modalities and specific views/protocols)
- Additional diagnostic considerations
- Priority/urgency level for each test

4. Treatment Considerations:
- First-line therapeutic options
- Evidence-based treatment protocols
- Specific medication recommendations (including dosing)
- Monitoring parameters
- Potential complications to watch for

5. Medical Literature References:
- Current clinical guidelines
- Relevant research papers
- Evidence level for recommendations

Use precise medical terminology and include specific values, ranges, and criteria where applicable.`;

    const result = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.7,
        top_p: 0.9
      }
    });

    const responseText = result.generated_text;

    // Extract sections using regex
    const clinicalAssessment = extractSection(responseText, "Clinical Assessment:", "Differential Diagnosis:");
    const differentialDiagnosis = extractSection(responseText, "Differential Diagnosis:", "Recommended Diagnostic Approach:");
    const diagnosticApproach = extractSection(responseText, "Recommended Diagnostic Approach:", "Treatment Considerations:");
    const treatmentConsiderations = extractSection(responseText, "Treatment Considerations:", "Medical Literature References:");
    const references = extractSection(responseText, "Medical Literature References:", null);

    // Format recommendations as an array
    const recommendations = treatmentConsiderations
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.match(/^[A-Za-z]/));

    res.json({
      diagnosis: clinicalAssessment,
      technicalAnalysis: `
Differential Diagnosis:
${differentialDiagnosis}

Diagnostic Approach:
${diagnosticApproach}`,
      recommendations: recommendations,
      references: parseReferences(references)
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
});

// Helper function to extract sections from the response
function extractSection(text: string, startMarker: string, endMarker: string | null): string {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const start = startIndex + startMarker.length;
  const end = endMarker ? text.indexOf(endMarker, start) : text.length;
  
  return text.slice(start, end !== -1 ? end : undefined).trim();
}

// Helper function to parse references into structured format
function parseReferences(referencesText: string): Array<{
  title: string;
  authors: string[];
  year: number;
  url: string;
}> {
  const references = referencesText
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(ref => {
      // Attempt to extract year from the reference text
      const yearMatch = ref.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

      // Extract authors if they appear in a standard format
      const authorsMatch = ref.match(/([A-Za-z\s,\.]+)(?:\(|\d{4}|et al)/);
      const authors = authorsMatch 
        ? [authorsMatch[1].trim()]
        : ['Author information pending'];

      return {
        title: ref.trim(),
        authors,
        year,
        url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(ref.trim())}`
      };
    });

  return references;
}

export default router;
