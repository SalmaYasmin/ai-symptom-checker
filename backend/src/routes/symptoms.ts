import express from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import pkg from 'pdfjs-dist/legacy/build/pdf.js';
const { getDocument, GlobalWorkerOptions } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add debug log
console.log('OpenAI API Key length:', process.env.OPENAI_API_KEY?.length || 0);

// Initialize PDF.js worker
GlobalWorkerOptions.workerSrc = path.resolve(__dirname, '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.js');

// Root endpoint
router.get('/', (req, res) => {
  res.json({ message: 'Symptoms API is running' });
});

const upload = multer({
  storage: multer.memoryStorage(), // in-memory; change if saving to disk
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.png', '.jpg', '.jpeg', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, JPEG, and PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Test endpoint
router.get('/test', async (req: Request, res: Response) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, are you working?" }
      ],
      temperature: 0.7,
      max_tokens: 50
    });
    res.json({ message: "Successfully connected to OpenAI API" });
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: "Failed to connect to OpenAI API",
      details: error.message,
      code: error.code
    });
  }
});

// Analyze symptoms endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ error: 'Symptoms must be provided as an array' });
    }

    const symptomsText = symptoms.join(', ');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a medical AI assistant. Analyze the symptoms and provide a structured response with possible conditions, severity assessment, and recommendations. Format your response in a clear, professional manner."
        },
        { 
          role: "user", 
          content: `Please analyze these symptoms: ${symptomsText}. Provide a detailed medical analysis including possible conditions, severity assessment, and recommendations.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content || 'No response generated';

    // Parse the response into sections
    const sections = response.split(/\d+\.\s+(?=Clinical Assessment|Differential Diagnosis|Recommended Diagnostic|Treatment Considerations|Medical Literature)/g)
      .filter(section => section.trim());

    // Extract the differential diagnosis section
    const differentialDiagnosisSection = sections.find(section => 
      section.includes('Differential Diagnosis')
    ) || '';

    // More robust parsing for differential diagnoses
    let diagnoses: string[] = [];
    
    // First try to find diagnoses by ICD-10 codes
    const icd10Matches = differentialDiagnosisSection.match(/\d+\.\s+.*?\(ICD-10:.*?\)/g) || [];
    
    if (icd10Matches.length > 0) {
      // If we found diagnoses with ICD-10 codes, use them as anchors
      icd10Matches.forEach((match, index) => {
        const startIndex = differentialDiagnosisSection.indexOf(match);
        const nextMatch = icd10Matches[index + 1];
        const endIndex = nextMatch ? differentialDiagnosisSection.indexOf(nextMatch) : differentialDiagnosisSection.length;
        
        // Extract the diagnosis and its details
        const diagnosisText = differentialDiagnosisSection.substring(startIndex, endIndex).trim();
        diagnoses.push(diagnosisText);
      });
    } else {
      // Fallback: try to find numbered diagnoses
      const numberedMatches = differentialDiagnosisSection.match(/\d+\.\s+.*?(?=\d+\.|$)/gs) || [];
      diagnoses = numberedMatches.map(match => match.trim()).filter(match => match);
    }
    
    // If still no diagnoses found, try a more aggressive approach
    if (diagnoses.length === 0) {
      // Split by newlines and look for lines that might be diagnoses
      const lines = differentialDiagnosisSection.split('\n').filter(line => line.trim());
      
      let currentDiagnosis = '';
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip the section header
        if (trimmedLine.includes('Differential Diagnosis')) continue;
        
        // If line starts with a number, it's likely a new diagnosis
        if (/^\d+\./.test(trimmedLine)) {
          if (currentDiagnosis) {
            diagnoses.push(currentDiagnosis.trim());
          }
          currentDiagnosis = trimmedLine;
        } else if (currentDiagnosis) {
          // Append to current diagnosis
          currentDiagnosis += '\n' + trimmedLine;
        }
      }
      
      // Add the last diagnosis if there is one
      if (currentDiagnosis) {
        diagnoses.push(currentDiagnosis.trim());
      }
    }

    // Extract other sections
    const clinicalAssessment = sections.find(s => 
      s.includes('Clinical Assessment')
    ) || '';
    
    const diagnosticApproach = sections.find(s => 
      s.includes('Recommended Diagnostic')
    ) || '';
    
    const treatmentConsiderations = sections.find(s => 
      s.includes('Treatment Considerations')
    ) || '';
    
    const references = sections.find(s => 
      s.includes('Medical Literature References')
    ) || '';

    // Return the structured response
    res.json({
      analysis: response,
      structured: {
        clinicalAssessment: clinicalAssessment.split('\n').filter(line => line.trim()),
        differentialDiagnosis: diagnoses,
        diagnosticApproach: diagnosticApproach.split('\n').filter(line => line.trim()),
        treatmentConsiderations: treatmentConsiderations.split('\n').filter(line => line.trim()),
        references: references.split('\n').filter(line => line.trim())
      }
    });
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({ error: 'Failed to analyze symptoms' });
  }
});

// Technical analysis endpoint
router.post('/analyze/technical', upload.array('files', 5), async (req: Request, res: Response) => {
  try {
    const { symptoms } = req.body;
    const files = req.files as Express.Multer.File[];

    const hasSymptoms = symptoms && Array.isArray(symptoms) && symptoms.length > 0;
    const hasFiles = files && files.length > 0;

    if (!hasSymptoms && !hasFiles) {
      return res.status(400).json({ error: 'Please provide either symptoms or diagnostic files (X-ray, PDF, etc.)' });
    }

    const symptomsText = hasSymptoms ? symptoms.join(', ') : '';

    let fileAnalysis = '';
    if (hasFiles) {
      // Process each file
      const fileAnalyses = await Promise.all(files.map(async (file) => {
        const fileType = path.extname(file.originalname).toLowerCase();
        
        if (['.png', '.jpg', '.jpeg'].includes(fileType)) {
          // For images, use GPT-4o to analyze the content
          const base64Image = file.buffer.toString('base64');
          const visionResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a medical imaging specialist. Analyze the medical image and provide detailed observations about any abnormalities, anatomical structures, and potential medical conditions visible in the image. Focus on objective findings and avoid making definitive diagnoses without clinical correlation."
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Please analyze this medical image and describe what you observe, including any abnormalities or notable findings."
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/${fileType.slice(1)};base64,${base64Image}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 500
          });

          return `Image Analysis (${file.originalname}):\n${visionResponse.choices[0].message.content}`;
        } else if (fileType === '.pdf') {
          try {
            // Load the PDF document
            const pdfData = new Uint8Array(file.buffer);
            const loadingTask = getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;
            
            // Extract text from all pages
            let pdfText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              pdfText += pageText + '\n';
            }

            if (!pdfText || pdfText.trim().length === 0) {
              throw new Error('No text content found in PDF');
            }

            // Analyze PDF content using GPT-4o
            const pdfAnalysis = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: "You are a medical report analyst. Analyze the medical report and provide a detailed interpretation of the findings, focusing on abnormal values, trends, and their clinical significance. Format your response in a clear, structured manner."
                },
                {
                  role: "user",
                  content: `Please analyze this medical report and provide a detailed interpretation:\n\n${pdfText}`
                }
              ],
              max_tokens: 1000
            });

            return `PDF Report Analysis (${file.originalname}):\n${pdfAnalysis.choices[0].message.content}`;
          } catch (error: any) {
            console.error('Error analyzing PDF:', error);
            return `PDF Report (${file.originalname}): Error analyzing PDF file - ${error.message}`;
          }
        }
      }));

      fileAnalysis = '\n\nMedical Image/Report Analysis:\n' + fileAnalyses.join('\n\n');
    }

    const userPrompt = hasSymptoms
      ? `Please provide a comprehensive technical analysis of these symptoms: ${symptomsText}.${fileAnalysis} Include all sections as specified in the system message.`
      : `Please analyze the following medical images/reports and provide a comprehensive technical report:${fileAnalysis} Include all sections as specified in the system message.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `You are a medical AI assistant specializing in technical analysis. Provide a detailed technical analysis following this exact structure:

1. Clinical Assessment
   ${hasSymptoms ? '- Presenting Symptoms: Detailed analysis of each symptom' : '- Image/Report Findings: Detailed analysis of the uploaded medical images or reports'}
   - Underlying Pathophysiology: Mechanism of the condition
   - Clinical Patterns & Associations: How findings relate to each other
   - Severity Assessment Criteria: Mild, Moderate, Severe criteria

2. Differential Diagnosis (give me top5 diagnosesin order of likelihood)
  Number each diagnosis (e.g., 1., 2., 3.) and start with the condition name followed by the ICD-10 code in parentheses. For example: 1. Pulmonary Embolism (ICD-10: I26.9)
  For each condition include:
   - ICD-10 code
   - Distinguishing Features
   - Supporting Factors
   - Contradicting Factors
   - Critical Considerations

3. Recommended Diagnostic Approach
   - Initial Laboratory Studies (with rationale)
   - Imaging Studies (with protocol and rationale)
   - Additional Diagnostic Considerations
   - Urgency Level

4. Treatment Considerations
   - First-line Therapeutic Options
   - Specific treatment protocols
   - Monitoring requirements

5. Medical Literature References
   - Include latest guidelines
   - Evidence levels
   - Key references

Format the response in clear sections with proper medical terminology and evidence-based recommendations. Do not use markdown formatting.`
        },
        { 
          role: "user", 
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    // Log the complete raw response from the model
    console.log('Raw GPT-3.5-turbo Response:', JSON.stringify(completion, null, 2));

    const response = completion.choices[0].message.content || 'No response generated';

    // Parse the response into sections
    const sections = response.split(/\d+\.\s+(?=Clinical Assessment|Differential Diagnosis|Recommended Diagnostic|Treatment Considerations|Medical Literature)/g)
      .filter(section => section.trim());

    // Extract the differential diagnosis section
    const differentialDiagnosisSection = sections.find(section => 
      section.includes('Differential Diagnosis')
    ) || '';

    // More robust parsing for differential diagnoses
    let diagnoses: string[] = [];
    
    // First try to find diagnoses by ICD-10 codes
    const icd10Matches = differentialDiagnosisSection.match(/\d+\.\s+.*?\(ICD-10:.*?\)/g) || [];
    
    if (icd10Matches.length > 0) {
      // If we found diagnoses with ICD-10 codes, use them as anchors
      icd10Matches.forEach((match, index) => {
        const startIndex = differentialDiagnosisSection.indexOf(match);
        const nextMatch = icd10Matches[index + 1];
        const endIndex = nextMatch ? differentialDiagnosisSection.indexOf(nextMatch) : differentialDiagnosisSection.length;
        
        // Extract the diagnosis and its details
        const diagnosisText = differentialDiagnosisSection.substring(startIndex, endIndex).trim();
        diagnoses.push(diagnosisText);
      });
    } else {
      // Fallback: try to find numbered diagnoses
      const numberedMatches = differentialDiagnosisSection.match(/\d+\.\s+.*?(?=\d+\.|$)/gs) || [];
      diagnoses = numberedMatches.map(match => match.trim()).filter(match => match);
    }
    
    // If still no diagnoses found, try a more aggressive approach
    if (diagnoses.length === 0) {
      // Split by newlines and look for lines that might be diagnoses
      const lines = differentialDiagnosisSection.split('\n').filter(line => line.trim());
      
      let currentDiagnosis = '';
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip the section header
        if (trimmedLine.includes('Differential Diagnosis')) continue;
        
        // If line starts with a number, it's likely a new diagnosis
        if (/^\d+\./.test(trimmedLine)) {
          if (currentDiagnosis) {
            diagnoses.push(currentDiagnosis.trim());
          }
          currentDiagnosis = trimmedLine;
        } else if (currentDiagnosis) {
          // Append to current diagnosis
          currentDiagnosis += '\n' + trimmedLine;
        }
      }
      
      // Add the last diagnosis if there is one
      if (currentDiagnosis) {
        diagnoses.push(currentDiagnosis.trim());
      }
    }

    // Extract other sections
    const clinicalAssessment = sections.find(s => 
      s.includes('Clinical Assessment')
    ) || '';
    
    const diagnosticApproach = sections.find(s => 
      s.includes('Recommended Diagnostic')
    ) || '';
    
    const treatmentConsiderations = sections.find(s => 
      s.includes('Treatment Considerations')
    ) || '';
    
    const references = sections.find(s => 
      s.includes('Medical Literature References')
    ) || '';

    // Return the structured response
    res.json({
      analysis: response,
      structured: {
        clinicalAssessment: clinicalAssessment.split('\n').filter(line => line.trim()),
        differentialDiagnosis: diagnoses,
        diagnosticApproach: diagnosticApproach.split('\n').filter(line => line.trim()),
        treatmentConsiderations: treatmentConsiderations.split('\n').filter(line => line.trim()),
        references: references.split('\n').filter(line => line.trim())
      }
    });
  } catch (error: any) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({ 
      error: 'Failed to analyze symptoms',
      details: error.message
    });
  }
});

export default router;
