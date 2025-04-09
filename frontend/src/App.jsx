import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
} from '@mui/material';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box sx={{ my: 4, textAlign: 'center' }}>
            <Typography variant="h4" color="error" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body1">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

function App() {
  console.log('App component rendering');
  
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    console.log('App component mounted');
    // Check API availability on component mount
    const checkApi = async () => {
      try {
        console.log('Checking API health...');
        const response = await fetch('https://ai-symptom-checker-3sr4.onrender.com/api/health');
        console.log('API health response:', response.status);
        if (response.ok) {
          setApiStatus('available');
        } else {
          setApiStatus('unavailable');
          console.error('API health check failed:', response.status);
        }
      } catch (err) {
        console.error('API health check error:', err);
        setApiStatus('unavailable');
      }
    };
    checkApi();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting to analyze symptoms:', symptoms);
      const response = await fetch('https://ai-symptom-checker-3sr4.onrender.com/api/symptoms/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: symptoms.split(',').map(s => s.trim()),
        }),
      });

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to analyze symptoms');
      }

      const data = await response.json();
      console.log('API Response data:', data);
      setDiagnosis(data.diagnosis);
      setRecommendations(data.recommendations);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            AI Symptom Checker
          </Typography>
          
          {apiStatus === 'unavailable' && (
            <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
              Warning: The symptom analysis service is currently unavailable. Please try again later.
            </Typography>
          )}
          
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Enter your symptoms (separated by commas)"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                multiline
                rows={3}
                margin="normal"
                variant="outlined"
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || !symptoms.trim()}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Symptoms'}
              </Button>
            </form>
          </Paper>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          {diagnosis && (
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Diagnosis
              </Typography>
              <Typography paragraph>{diagnosis}</Typography>
            </Paper>
          )}

          {recommendations.length > 0 && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Recommendations
              </Typography>
              <List>
                {recommendations.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Container>
    </ErrorBoundary>
  );
}

export default App; 