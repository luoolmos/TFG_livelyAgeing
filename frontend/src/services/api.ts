import axios from 'axios';
import type { DailySummary, UserInfo } from '../services/api';

const API_BASE_URL = 'http://localhost:5003/api';

export interface User {
  user_id: string | number;
  device_id: string;
  last_sync_date: string;
}

const api = {
  // Obtener resumen diario de datos
  getDailySummary: async (): Promise<DailySummary[]> => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/daily-summary`);
    return response.data;
  },

  // Obtener información del usuario
  getUserInfo: async (): Promise<UserInfo> => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/user-info`);
    return response.data;
  },

  // Obtener lista de usuarios
  getUsers: async (): Promise<User[]> => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/users`);
    console.log('response', response.data);
    return response.data;
  },

  // Obtener datos de pasos
  getSteps: async (): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/steps`);
    return response.data;
  },

  // Obtener datos de sueño
  getSleep: async (): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/sleep`);
    return response.data;
  },

  // Obtener datos de frecuencia cardíaca
  getHeartRate: async (): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/heart-rate`);
    return response.data;
  }
};

export default api; 