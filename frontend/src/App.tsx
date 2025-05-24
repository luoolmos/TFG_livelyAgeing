import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import Dashboard from './pages/Dashboard';
// Puedes crear y agregar más páginas aquí, por ejemplo:
// import Users from './pages/Users';

const App: React.FC = () => (
  <Router>
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          LivelyAgeing
        </Typography>
        <Button color="inherit" component={Link} to="/">Dashboard</Button>
        {/* <Button color="inherit" component={Link} to="/users">Usuarios</Button> */}
        {/* <Button color="inherit" component={Link} to="/devices">Dispositivos</Button> */}
      </Toolbar>
    </AppBar>
    <Container sx={{ mt: 4 }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* <Route path="/users" element={<Users />} /> */}
        {/* <Route path="/devices" element={<Devices />} /> */}
      </Routes>
    </Container>
  </Router>
);

export default App;