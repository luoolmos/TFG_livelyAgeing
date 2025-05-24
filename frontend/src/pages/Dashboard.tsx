import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import api from '../services/api';
import DataCard from '../components/DataCard';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryData, userData] = await Promise.all([
          api.getDailySummary(),
          api.getUserInfo()
        ]);
        setDailySummary(summaryData);
        setUserInfo(userData);
      } catch (err) {
        setError('Error al cargar los datos');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const latestData = dailySummary[0] || null;

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {userInfo && (
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Información del Usuario
          </Typography>
          <Typography>
            ID de Usuario: {userInfo.userId}
          </Typography>
          <Typography>
            ID de Dispositivo: {userInfo.deviceId}
          </Typography>
          <Typography>
            Última Sincronización: {new Date(userInfo.lastSyncDate).toLocaleDateString()}
          </Typography>
        </Paper>
      )}

      {latestData && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <DataCard
              title="Pasos"
              value={latestData.steps}
              unit="pasos"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DataCard
              title="Frecuencia Cardíaca"
              value={latestData.heartRate}
              unit="bpm"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DataCard
              title="Duración del Sueño"
              value={Math.round(latestData.sleepDuration / 60)}
              unit="horas"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DataCard
              title="Nivel de Estrés"
              value={latestData.stress}
              unit="%"
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;