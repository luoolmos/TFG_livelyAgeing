import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import api from '../services/api';
import type { User } from '../services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

const UserSelectorModal: React.FC<Props> = ({ open, onClose, onSelectUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      api.getUsers().then((data) => {
        setUsers(data);
        setLoading(false);
      });
    }
  }, [open]);

  const handleSelect = () => {
    if (selectedUser) {
      onSelectUser(selectedUser);
      // NO llamar a onClose aquí
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 2,
          background: '#fff',
          boxShadow: '0 8px 32px rgba(25, 118, 210, 0.18)',
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(33, 33, 33, 0.18)', // reduce opacity for less blur
          backdropFilter: 'blur(2px)', // subtle blur only
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: '#1976d2', textAlign: 'center' }}>Selecciona un usuario</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Usuario</InputLabel>
            <Select
              value={selectedUser}
              label="Usuario"
              onChange={(e) => setSelectedUser(e.target.value as string)}
            >
              {users.map((user) => (
                <MenuItem key={user.user_id} value={user.user_id}>
                  {user.name
                    ? user.name
                    : user.device_model
                      ? user.device_model
                      : user.user_id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={onClose} color="secondary" variant="outlined">Cancelar</Button>
        <Button onClick={handleSelect} disabled={!selectedUser} color="primary" variant="contained">Seleccionar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserSelectorModal;