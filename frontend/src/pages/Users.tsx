import React from 'react';
import { Box, Typography } from '@mui/material';
import UserList from '../components/UserList';

const Users: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: 'calc(100vh - 64px)', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: '#232526',
        py: 4,
        px: { xs: 1, sm: 4 }
      }}
    >
      <Typography variant="h4" gutterBottom color="#f5f6fa" fontWeight={700}>
        Usuarios
      </Typography>
      <UserList />
    </Box>
  );
};

export default Users;