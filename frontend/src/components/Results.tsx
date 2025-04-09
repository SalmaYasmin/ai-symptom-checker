import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText } from '@mui/material';

interface ResultsProps {
  diagnosis: string;
  recommendations: string[];
}

const Results: React.FC<ResultsProps> = ({ diagnosis, recommendations }) => {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Diagnosis
      </Typography>
      <Typography paragraph>
        {diagnosis}
      </Typography>
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
  );
};

export default Results; 