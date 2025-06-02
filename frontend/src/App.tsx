import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import MeasurementsDashboard from './components/MeasurementsDashboard';
// Puedes crear y agregar más páginas aquí, por ejemplo:
// import Devices from './pages/Devices';

const App: React.FC = () => (
  <Router>
    <AppBar position="static" sx={{ background: '#fff', color: '#1976d2', boxShadow: '0 2px 12px rgba(60,60,60,0.07)' }}>
      <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 1, sm: 4 } }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#1976d2', fontFamily: 'Inter, Roboto, Arial' }}>
          LivelyAgeing
        </Typography>
        <Button color="inherit" component={Link} to="/" sx={{ fontWeight: 600, borderRadius: 2, fontFamily: 'Inter, Roboto, Arial' }}>Dashboard</Button>
        <Button color="inherit" component={Link} to="/users" sx={{ fontWeight: 600, borderRadius: 2, fontFamily: 'Inter, Roboto, Arial' }}>Usuarios</Button>
        <Button color="inherit" component={Link} to="/measurements" sx={{ fontWeight: 600, borderRadius: 2, fontFamily: 'Inter, Roboto, Arial' }}>Mediciones</Button>
        {/* <Button color="inherit" component={Link} to="/devices">Dispositivos</Button> */}
      </Toolbar>
    </AppBar>
    <Container maxWidth={false} disableGutters sx={{ mt: 4, px: 0, background: '#f7f8fa', minHeight: 'calc(100vh - 64px)' }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/measurements" element={<MeasurementsDashboard />} />
        {/* <Route path="/devices" element={<Devices />} /> */}
      </Routes>
    </Container>
  </Router>
);

export default App;