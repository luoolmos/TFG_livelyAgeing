import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, CircularProgress, Box, Button, Chip, Avatar, Tooltip
} from '@mui/material';
import WatchIcon from '@mui/icons-material/Watch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import api from '../services/api';

interface User {
  user_id: string | number;
  device_id: string;
  last_sync_date: string;
  device_model: string;
}

const pastelGreen = "#b2f2bb";
const pastelOrange = "#ffe066";
const pastelBlue = "#a5d8ff";
const pastelRed = "#ffa8a8";

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
          icon={<CheckCircleIcon sx={{ color: "#38d39f" }} />}
          label="Sincronizado"
          sx={{
            bgcolor: pastelGreen,
            color: "#222",
            fontWeight: 600,
            borderRadius: 2,
            px: 1.5,
            transition: "all 0.3s",
          }}
        />
      );
    } else {
      return (
        <Chip
          icon={<ErrorIcon sx={{ color: "#ff922b" }} />}
          label="Desactualizado"
          sx={{
            bgcolor: pastelOrange,
            color: "#222",
            fontWeight: 600,
            borderRadius: 2,
            px: 1.5,
            transition: "all 0.3s",
          }}
        />
      );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress color="info" />
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
    <Box
      sx={{
        background: "#232526",
        borderRadius: 4,
        p: { xs: 1, sm: 3 },
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        maxWidth: 1100,
        width: "100%",
        mt: 4,
        mb: 4,
        mx: "auto"
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700} color="#f5f6fa" fontFamily="Inter, Roboto, Arial">
          Usuarios
        </Typography>
      </Box>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          background: "#2d2f36"
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "#a5d8ff", fontWeight: 700, fontSize: "1.1rem" }}>Usuario</TableCell>
              <TableCell sx={{ color: "#a5d8ff", fontWeight: 700, fontSize: "1.1rem" }}>Dispositivo</TableCell>
              <TableCell sx={{ color: "#a5d8ff", fontWeight: 700, fontSize: "1.1rem" }}>Última Sincronización</TableCell>
              <TableCell sx={{ color: "#a5d8ff", fontWeight: 700, fontSize: "1.1rem" }}>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(users) && users.length > 0 ? (
              users.map((user) => (
                <TableRow
                  key={user.user_id}
                  hover
                  sx={{
                    transition: "background 0.3s",
                    "&:hover": { background: "#232526" },
                    height: 72
                  }}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{
                        bgcolor: pastelBlue,
                        color: "#1976d2",
                        fontWeight: 700,
                        width: 44,
                        height: 44,
                        fontSize: "1.3rem"
                      }}>
                        {String(user.device_model)[0]?.toUpperCase() || "D"}
                      </Avatar>
                      <Typography fontWeight={600} fontSize="1.1rem" color="#f5f6fa" fontFamily="Inter, Roboto, Arial">
                        {user.device_model}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Tooltip title="Dispositivo Wearable">
                        <WatchIcon color="info" sx={{ mr: 1 }} />
                      </Tooltip>
                      <Typography variant="body1" color="#f5f6fa"> {user.device_model}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography color="#f5f6fa" fontWeight={500}>
                      {new Date(user.last_sync_date).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getSyncStatus(user.last_sync_date)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="#f5f6fa">No hay usuarios para mostrar.</Typography>
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