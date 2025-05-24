import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography>
          Bienvenido al panel de control. Aquí verás un resumen de usuarios, dispositivos y actividad reciente.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;