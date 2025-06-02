import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api';

export interface User {
  user_id: string | number;
  device_id: string;
  last_sync_date: string;
  device_model?: string;
}

export interface Device {
  device_id: string;
  serial_number?: string;
  manufacturer: string;
  model: string;
  token?: string;
}

export interface Measurement {
  measurement_id: number;
  person_id: number;
  measurement_concept_id: number;
  measurement_date: string;
  measurement_datetime: string;
  value_as_number: number;
  unit_concept_id: number;
  measurement_source_value: string;
  unit_source_value: string;
}

export interface Observation {
  observation_id: number;
  person_id: number;
  observation_concept_id: number;
  observation_date: string;
  observation_datetime: string;
  value_as_number: number;
  value_as_string: string;
  unit_concept_id: number;
  observation_source_value: string;
  unit_source_value: string;
}

// Export individual functions
export const getMeasurements = async (params: URLSearchParams): Promise<Measurement[]> => {
  const response = await axios.get(`${API_BASE_URL}/measurements`, { params });
  return response.data;
};

export const getObservations = async (params: URLSearchParams): Promise<Observation[]> => {
  const response = await axios.get(`${API_BASE_URL}/observations`, { params });
  return response.data;
};

const api = {
  // Obtener resumen diario de datos
  getDailySummary: async () => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/daily-summary`);
    return response.data;
  },

  // Obtener información del usuario
  getUserInfo: async () => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/user-info`);
    return response.data;
  },

  // Obtener lista de usuarios
  getUsers: async (): Promise<User[]> => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/users`);
    console.log('response', response.data);
    return response.data;
  },

  // Obtener lista de dispositivos
  getDevices: async (): Promise<Device[]> => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/devices`);
    return response.data;
  },

  // Crear usuario
  addUser: async (user: { name: string; email: string; device_id: string }) => {
    const response = await axios.post(`${API_BASE_URL}/dashboard/users`, user);
    return response.data;
  },

  // Crear dispositivo
  addDevice: async (device: Device) => {
    const response = await axios.post(`${API_BASE_URL}/dashboard/devices`, device);
    return response.data;
  },

  // Obtener datos de pasos
  getSteps: async () => {
    const response = await axios.get(`${API_BASE_URL}/steps`);
    return response.data;
  },

  // Obtener datos de sueño
  getSleep: async () => {
    const response = await axios.get(`${API_BASE_URL}/sleep`);
    return response.data;
  },

  // Obtener datos de frecuencia cardíaca
  getHeartRate: async () => {
    const response = await axios.get(`${API_BASE_URL}/heart-rate`);
    return response.data;
  }
};

export default api;