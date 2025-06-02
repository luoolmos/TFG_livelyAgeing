import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
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
    <Box
      sx={{
        maxWidth: 1100,
        width: '100%',
        mx: 'auto',
        mt: 4,
        mb: 4,
        background: '#fff',
        borderRadius: 4,
        boxShadow: '0 4px 24px rgba(60,60,60,0.08)',
        p: { xs: 2, sm: 4 }
      }}
    >
      <Typography variant="h4" gutterBottom fontWeight={700} color="#222">
        Dashboard
      </Typography>
      {userInfo && (
        <Box sx={{ mb: 3, p: 2, background: '#f7f8fa', borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600} color="#1976d2">
            Información del Usuario
          </Typography>
          <Typography color="#333">ID de Usuario: {userInfo.userId}</Typography>
          <Typography color="#333">ID de Dispositivo: {userInfo.deviceId}</Typography>
          <Typography color="#333">Última Sincronización: {new Date(userInfo.lastSyncDate).toLocaleDateString()}</Typography>
        </Box>
      )}
      {latestData && (
        <Grid container spacing={3} mb={2}>
          <Grid item xs={12} sm={6} md={3}>
            <DataCard title="Pasos" value={latestData.steps} unit="pasos" iconColor="#1976d2" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DataCard title="Frecuencia Cardíaca" value={latestData.heartRate} unit="bpm" iconColor="#e53935" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DataCard title="Duración del Sueño" value={Math.round(latestData.sleepDuration / 60)} unit="horas" iconColor="#1976d2" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DataCard title="Nivel de Estrés" value={latestData.stress} unit="%" iconColor="#ffb300" />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;