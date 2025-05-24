import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
// Puedes crear y agregar más páginas aquí, por ejemplo:
// import Devices from './pages/Devices';

const App: React.FC = () => (
  <Router>
    <AppBar position="static" sx={{ width: '100vw', left: 0, boxShadow: 2 }}>
      <Toolbar sx={{ maxWidth: '100vw', width: '100%', px: { xs: 1, sm: 4 } }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          LivelyAgeing
        </Typography>
        <Button color="inherit" component={Link} to="/">Dashboard</Button>
        <Button color="inherit" component={Link} to="/users">Usuarios</Button>
        {/* <Button color="inherit" component={Link} to="/devices">Dispositivos</Button> */}
      </Toolbar>
    </AppBar>
    <Box sx={{ mt: 4, width: '100vw', minHeight: 'calc(100vh - 64px)', background: '#232526', px: 0 }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        {/* <Route path="/devices" element={<Devices />} /> */}
      </Routes>
    </Box>
  </Router>
);

export default App;