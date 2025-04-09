import React, { useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Header from './components/Header';
import SymptomForm from './components/SymptomForm';
import Results from './components/Results';
import { SymptomAnalysis } from './types';

const API_URL = process.env.REACT_APP_API_URL || 'https://ai-symptom-checker-3sr4.onrender.com';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [results, setResults] = useState<SymptomAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (symptoms: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/symptoms/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze symptoms');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setError('An error occurred while analyzing symptoms. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <SymptomForm onSubmit={handleSubmit} />
        {loading && <p>Analyzing symptoms...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {results && <Results diagnosis={results.diagnosis} recommendations={results.recommendations} />}
      </Container>
    </ThemeProvider>
  );
}

export default App; 