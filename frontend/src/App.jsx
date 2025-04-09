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
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiErrorDetails, setApiErrorDetails] = useState('');

  useEffect(() => {
    console.log('App component mounted');
    // Check API availability on component mount
    const checkApi = async () => {
      try {
        console.log('Checking API health...');
        // Try the main API endpoint directly
        const response = await fetch('https://ai-symptom-checker-3sr4.onrender.com/api/symptoms/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            symptoms: ['test'],
          }),
        });
        
        console.log('API health response:', response.status);
        
        if (response.ok) {
          setApiStatus('available');
          setApiErrorDetails('');
        } else {
          // If we get a 400 or 422, it means the API is working but our test request was invalid
          if (response.status === 400 || response.status === 422) {
            setApiStatus('available');
            setApiErrorDetails('');
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('API health check failed:', response.status, errorData);
            setApiStatus('unavailable');
            setApiErrorDetails(`Status: ${response.status} - ${errorData.message || 'Service unavailable'}`);
          }
        }
      } catch (err) {
        console.error('API health check error:', err);
        // Check if it's a CORS error
        if (err.message.includes('CORS')) {
          setApiStatus('unavailable');
          setApiErrorDetails('CORS Error: The API is not configured to accept requests from this domain');
        } else {
          setApiStatus('unavailable');
          setApiErrorDetails(err.message || 'Failed to connect to the service');
        }
      } finally {
        setIsInitialized(true);
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
          'Accept': 'application/json',
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

  if (!isInitialized) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <ErrorBoundary>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            AI Symptom Checker
          </Typography>
          
          {apiStatus === 'unavailable' && (
            <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: '#fff3e0' }}>
              <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
                Warning: The symptom analysis service is currently unavailable.
              </Typography>
              <Typography variant="body2" align="center" sx={{ mb: 1 }}>
                {apiErrorDetails}
              </Typography>
              <Typography variant="body2" align="center">
                Please check back later or contact support if the issue persists.
              </Typography>
            </Paper>
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
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || !symptoms.trim() || apiStatus === 'unavailable'}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Symptoms'}
              </Button>
            </form>
          </Paper>

          {error && (
            <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: '#ffebee' }}>
              <Typography color="error">
                {error}
              </Typography>
            </Paper>
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