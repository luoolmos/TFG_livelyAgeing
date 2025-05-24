import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, CircularProgress, Box, Button, Chip, Avatar, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WatchIcon from '@mui/icons-material/Watch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import api from '../services/api';

interface User {
  user_id: string | number;
  device_id: string;
  last_sync_date: string;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();
      console.log('response', response);
      setUsers(response as User[]);
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getSyncStatus = (lastSyncDate: string) => {
    const lastSync = new Date(lastSyncDate);
    const now = new Date();
    const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return (
        <Chip
          icon={<CheckCircleIcon color="success" />}
          label="Sincronizado"
          color="success"
          variant="outlined"
        />
      );
    } else {
      return (
        <Chip
          icon={<ErrorIcon color="warning" />}
          label="Desactualizado"
          color="warning"
          variant="outlined"
        />
      );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
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

  return (
    <Box sx={{ background: "#f5f6fa", borderRadius: 3, p: 3, boxShadow: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Lista de Usuarios
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={fetchUsers}
        >
          Actualizar
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Dispositivo</TableCell>
              <TableCell>Última Sincronización</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(users) && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: "#1976d2" }}>
                        {user.user_id[0]?.toUpperCase() || "U"}
                      </Avatar>
                      <Typography>{user.user_id}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Dispositivo Wearable">
                      <WatchIcon color="action" sx={{ mr: 1 }} />
                    </Tooltip>
                    <Typography variant="body2" component="span">{user.device_id}</Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(user.last_sync_date).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getSyncStatus(user.last_sync_date)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No hay usuarios para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserList;