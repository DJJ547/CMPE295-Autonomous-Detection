import React from 'react';
import HeatmapComponent from '../components/Heatmap';
import { Container, Typography, Box, Paper } from '@mui/material';

export default function HeatmapPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Heatmap Visualization
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Filter the heatmap by detection type to visualize different urban issues across San Francisco.
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <HeatmapComponent />
        </Box>
      </Paper>
    </Container>
  );
}