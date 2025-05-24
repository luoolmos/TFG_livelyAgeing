import React from 'react';
import { Box, Typography } from '@mui/material';

const Users: React.FC = () => (
  <Box p={2}>
    <Typography variant="h4" gutterBottom>
      Usuarios
    </Typography>
    {/* Aquí irá la tabla/listado de usuarios */}
  </Box>
);

export default Users;