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
  ListItemSecondaryAction,
  IconButton,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  AppBar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import LaunchIcon from '@mui/icons-material/Launch';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import ScienceIcon from '@mui/icons-material/Science';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RecommendIcon from '@mui/icons-material/Recommend';
import config from './config';

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

// TabPanel component to handle tab content
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  console.log('App component rendering');
  
  const [currentTab, setCurrentTab] = useState(0);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [symptomsList, setSymptomsList] = useState([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiErrorDetails, setApiErrorDetails] = useState('');
  const [patientRecords, setPatientRecords] = useState([
    { id: 1, name: 'John Doe', age: 45, lastVisit: '2024-03-20' },
    { id: 2, name: 'Jane Smith', age: 32, lastVisit: '2024-03-19' },
  ]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false);
  const [technicalDiagnosis, setTechnicalDiagnosis] = useState('');
  const [medicalReferences, setMedicalReferences] = useState([]);

  useEffect(() => {
    console.log('App component mounted');
    // Check API availability on component mount
    const checkApi = async () => {
      try {
        console.log('Checking API health...');
        const response = await fetch(`${config.API_URL}/api/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        console.log('API health response:', response.status);
        
        if (response.ok) {
          setApiStatus('available');
          setApiErrorDetails('');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('API health check failed:', response.status, errorData);
          setApiStatus('unavailable');
          setApiErrorDetails(`Status: ${response.status} - ${errorData.message || 'Service unavailable'}`);
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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Reset states when switching tabs
    setDiagnosis('');
    setRecommendations([]);
    setError('');
    setSymptomsList([]);
    setCurrentSymptom('');
  };

  const handleAddSymptom = (e) => {
    e.preventDefault();
    if (currentSymptom.trim()) {
      setSymptomsList([...symptomsList, currentSymptom.trim()]);
      setCurrentSymptom('');
    }
  };

  const handleDeleteSymptom = (indexToDelete) => {
    setSymptomsList(symptomsList.filter((_, index) => index !== indexToDelete));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (symptomsList.length === 0) {
      setError('Please add at least one symptom');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting to analyze symptoms:', symptomsList);
      const response = await fetch(`${config.API_URL}/api/symptoms/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          symptoms: symptomsList,
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

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setIsPatientDialogOpen(true);
    // Reset analysis states
    setSymptomsList([]);
    setDiagnosis('');
    setTechnicalDiagnosis('');
    setRecommendations([]);
    setMedicalReferences([]);
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    if (symptomsList.length === 0) {
      setError('Please add at least one symptom');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting to analyze symptoms (technical):', symptomsList);
      const response = await fetch(`${config.API_URL}/api/symptoms/analyze/technical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          symptoms: symptomsList,
          patientId: selectedPatient?.id,
          requireTechnicalDetails: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to analyze symptoms');
      }

      const data = await response.json();
      setDiagnosis(data.diagnosis);
      setTechnicalDiagnosis(data.technicalAnalysis);
      setRecommendations(data.recommendations);
      setMedicalReferences(data.references || []);
    } catch (err) {
      setError(err.message || 'An error occurred');
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

  const renderPatientView = () => (
    <>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Describe Your Symptoms
        </Typography>
        <form onSubmit={handleAddSymptom}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Enter a symptom"
              value={currentSymptom}
              onChange={(e) => setCurrentSymptom(e.target.value)}
              variant="outlined"
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              disabled={!currentSymptom.trim() || loading}
              sx={{ minWidth: '120px' }}
            >
              <AddIcon /> Add
            </Button>
          </Box>
        </form>

        {symptomsList.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Symptoms:
            </Typography>
            <List>
              {symptomsList.map((symptom, index) => (
                <ListItem key={index}>
                  <ListItemText primary={symptom} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteSymptom(index)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading || symptomsList.length === 0 || apiStatus === 'unavailable'}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Get Analysis'}
        </Button>
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
            Preliminary Assessment
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
    </>
  );

  const renderDoctorView = () => (
    <>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
          Patient Records
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Patient ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Age</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Last Visit</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patientRecords.map((patient) => (
                <TableRow 
                  key={patient.id}
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>{patient.id}</TableCell>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.lastVisit}</TableCell>
                  <TableCell>
                    <Button
                      startIcon={<FolderIcon />}
                      onClick={() => handlePatientSelect(patient)}
                      variant="contained"
                      size="small"
                      sx={{ 
                        backgroundColor: 'secondary.main',
                        '&:hover': { backgroundColor: 'secondary.dark' }
                      }}
                    >
                      View Record
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={isPatientDialogOpen}
        onClose={() => setIsPatientDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <LocalHospitalIcon />
          <Typography variant="h6">
            Patient Record: {selectedPatient?.name}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Patient Info Card */}
            <Grid item xs={12}>
              <Card elevation={2} sx={{ mb: 3, backgroundColor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Patient Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">ID</Typography>
                      <Typography variant="body1">{selectedPatient?.id}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">Age</Typography>
                      <Typography variant="body1">{selectedPatient?.age}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="textSecondary">Last Visit</Typography>
                      <Typography variant="body1">{selectedPatient?.lastVisit}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Symptom Input Section */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Symptom Analysis
                  </Typography>
                  <form onSubmit={handleAddSymptom}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Enter symptom"
                        value={currentSymptom}
                        onChange={(e) => setCurrentSymptom(e.target.value)}
                        variant="outlined"
                        disabled={loading}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        disabled={!currentSymptom.trim() || loading}
                        sx={{ minWidth: '120px' }}
                      >
                        <AddIcon /> Add
                      </Button>
                    </Box>
                  </form>

                  {symptomsList.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Current Symptoms:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {symptomsList.map((symptom, index) => (
                          <Chip
                            key={index}
                            label={symptom}
                            onDelete={() => handleDeleteSymptom(index)}
                            color="primary"
                            variant="outlined"
                            disabled={loading}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Button
                    onClick={handleDoctorSubmit}
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading || symptomsList.length === 0}
                    sx={{ mt: 3 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Symptoms'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Analysis Results Section */}
            {(diagnosis || technicalDiagnosis || recommendations.length > 0 || medicalReferences.length > 0) && (
              <Grid item xs={12}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3 }}>
                      Analysis Results
                    </Typography>

                    <Accordion defaultExpanded>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ backgroundColor: 'primary.light', color: 'white' }}
                      >
                        <MedicalInformationIcon sx={{ mr: 2 }} />
                        <Typography variant="subtitle1">Clinical Assessment</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography paragraph>{diagnosis}</Typography>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ backgroundColor: 'secondary.light', color: 'white' }}
                      >
                        <ScienceIcon sx={{ mr: 2 }} />
                        <Typography variant="subtitle1">Technical Analysis</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography
                          component="pre"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            backgroundColor: 'grey.50',
                            p: 2,
                            borderRadius: 1
                          }}
                        >
                          {technicalDiagnosis}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>

                    {recommendations.length > 0 && (
                      <Accordion>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ backgroundColor: 'success.light', color: 'white' }}
                        >
                          <RecommendIcon sx={{ mr: 2 }} />
                          <Typography variant="subtitle1">Recommended Actions</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            {recommendations.map((recommendation, index) => (
                              <ListItem key={index}>
                                <ListItemText 
                                  primary={recommendation}
                                  sx={{
                                    '& .MuiListItemText-primary': {
                                      fontWeight: index === 0 ? 'bold' : 'normal'
                                    }
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {medicalReferences.length > 0 && (
                      <Accordion>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ backgroundColor: 'info.light', color: 'white' }}
                        >
                          <MenuBookIcon sx={{ mr: 2 }} />
                          <Typography variant="subtitle1">Medical References</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            {medicalReferences.map((ref, index) => (
                              <ListItem key={index}>
                                <ListItemText
                                  primary={
                                    <Link
                                      href={ref.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                    >
                                      {ref.title}
                                      <LaunchIcon fontSize="small" />
                                    </Link>
                                  }
                                  secondary={`${ref.authors.join(', ')} (${ref.year})`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, backgroundColor: 'grey.100' }}>
          <Button 
            onClick={() => setIsPatientDialogOpen(false)}
            variant="contained"
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  return (
    <ErrorBoundary>
      <Container maxWidth="md">
        <Box sx={{ width: '100%' }}>
          <AppBar position="static" color="default" sx={{ mb: 3 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab 
                icon={<PersonIcon />} 
                label="For Patients" 
                iconPosition="start"
              />
              <Tab 
                icon={<LocalHospitalIcon />} 
                label="For Doctors" 
                iconPosition="start"
              />
            </Tabs>
          </AppBar>

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

          <TabPanel value={currentTab} index={0}>
            {renderPatientView()}
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            {renderDoctorView()}
          </TabPanel>
        </Box>
      </Container>
    </ErrorBoundary>
  );
}

export default App; 