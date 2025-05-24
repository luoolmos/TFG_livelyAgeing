import React from 'react';
import { Box, Typography } from '@mui/material';
import UserList from '../components/UserList';

const Users: React.FC = () => {
  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Usuarios
      </Typography>
      <UserList />
    </Box>
  );
};

export default Users;