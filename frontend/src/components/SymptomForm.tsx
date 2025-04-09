import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

interface SymptomFormProps {
  onSubmit: (symptoms: string[]) => void;
}

const SymptomForm: React.FC<SymptomFormProps> = ({ onSubmit }) => {
  const [symptoms, setSymptoms] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const symptomList = symptoms.split(',').map(s => s.trim()).filter(s => s);
    onSubmit(symptomList);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
      <TextField
        fullWidth
        label="Enter your symptoms (comma-separated)"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        margin="normal"
        variant="outlined"
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
      >
        Analyze Symptoms
      </Button>
    </Box>
  );
};

export default SymptomForm; 