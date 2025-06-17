import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tabs,
  Tab,
  Pagination,
  Button as MuiButton
} from '@mui/material';
import { getMeasurements, getObservations, type Measurement, type Observation } from '../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './MeasurementsDashboard.css';
import MeasurementTypeSelector from './MeasurementTypeSelector';
import type { MeasurementType, MeasurementTypeOption } from './MeasurementTypeSelector';
import UserSelectorModal from './UserSelectorModal';

interface MeasurementsDashboardProps {
  userModalOpen: boolean;
  setUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MeasurementsDashboard: React.FC<MeasurementsDashboardProps> = ({ userModalOpen, setUserModalOpen }) => {
  const [dataType, setDataType] = useState<'measurements' | 'observations'>('measurements');
  const [personId, setPersonId] = useState<string>('');
  const [conceptId, setConceptId] = useState<string>('');
  const [sourceValue, setSourceValue] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [data, setData] = useState<Measurement[] | Observation[]>([]);
  const [step, setStep] = useState<'selectType' | 'selectUser' | 'showData'>('selectType');
  const [measurementType, setMeasurementType] = useState<MeasurementTypeOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [tab, setTab] = useState<'chart' | 'table'>('chart');

  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const paginatedData = data.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (personId) params.append('person_id', personId);
        if (conceptId) params.append('concept_id', conceptId);
        if (sourceValue) params.append('source_value', sourceValue);
        if (dateRange.start) params.append('start_date', dateRange.start);
        if (dateRange.end) params.append('end_date', dateRange.end);
        setLastParams(params.toString());
        const response = dataType === 'measurements' 
          ? await getMeasurements(params)
          : await getObservations(params);
        setData(response);
        setLastResponse(response);
        console.log('API params:', params.toString());
        console.log('API response:', response);
      } catch (error) {
        setError('Error fetching data');
        setLastResponse(error);
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (step === 'showData' && personId && measurementType) {
      fetchData();
    }
    // eslint-disable-next-line
  }, [step, personId, measurementType, dataType, conceptId, sourceValue, dateRange]);

  useEffect(() => {
    if (!measurementType) return;
    // Set dataType and conceptId based on selected type
    setDataType(measurementType.type === 'observation' ? 'observations' : 'measurements');
    setConceptId(String(measurementType.concept_id));
    setSourceValue(measurementType.source_value || '');
  }, [measurementType]);

  // Prepare chart data with correct types
  const measurementData = dataType === 'measurements' ? (data as Measurement[]) : [];
  const observationData = dataType === 'observations' ? (data as Observation[]) : [];

  const chartData = {
    labels: dataType === 'measurements'
      ? measurementData.map(item => item.measurement_datetime && item.measurement_datetime.split('T')[0])
      : observationData.map(item => item.observation_datetime && item.observation_datetime.split('T')[0]),
    datasets: [
      {
        label: dataType === 'measurements' ? 'Measurement Value' : 'Observation Value',
        data: dataType === 'measurements'
          ? measurementData.map(item => item.value_as_number)
          : observationData.map(item => item.value_as_number),
        fill: false,
        borderColor: '#1976d2',
        backgroundColor: '#1976d2',
        tension: 0.2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: dataType === 'measurements' ? 'Measurement Trend' : 'Observation Trend',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const item = dataType === 'measurements' ? measurementData[context.dataIndex] : observationData[context.dataIndex];
            const dateTime = dataType === 'measurements' ? item.measurement_datetime : item.observation_datetime;
            const value = item.value_as_number;
            const date = dateTime ? dateTime.split('T')[0] : '';
            const hour = dateTime && dateTime.includes('T') ? dateTime.split('T')[1].slice(0,5) : '';
            return `Value: ${value} | Date: ${date} ${hour && '| Hour: ' + hour}`;
          }
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Value' } },
    },
  };

  // Botón de refrescar y cambiar usuario
  const handleRefresh = () => {
    if (step === 'showData' && personId && measurementType) {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (personId) params.append('person_id', personId);
      if (conceptId) params.append('concept_id', conceptId);
      if (sourceValue) params.append('source_value', sourceValue);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      (async () => {
        try {
          const response = dataType === 'measurements' 
            ? await getMeasurements(params)
            : await getObservations(params);
          setData(response);
        } catch (error) {
          setError('Error fetching data');
        } finally {
          setLoading(false);
        }
      })();
    }
  };

  const handleChangeUser = () => {
    setStep('selectUser');
    setUserModalOpen(true);
  };

  // Renderizado condicional por pasos
  if (step === 'selectType') {
    return (
      <MeasurementTypeSelector
        onSelect={(type) => {
          setMeasurementType(type);
          setUserModalOpen(true);
          setStep('selectUser');
        }}
      />
    );
  }

  if (step === 'selectUser') {
    return (
      <UserSelectorModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onSelectUser={(userId) => {
          setPersonId(userId);
          setStep('showData');
        }}
      />
    );
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ minWidth: '100vw', px: 0, background: '#f7f8fa', minHeight: '100vh' }}>
      <Box className="measurements-dashboard" sx={{ width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', background: '#f7f8fa' }}>
        {/* Top bar with back button */}
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2 }}>
          <MuiButton variant="outlined" color="primary" sx={{ ml: 2, mt: 2, fontWeight: 600 }} onClick={() => { setStep('selectType'); setTab('chart'); setPage(1); }}>
            ← Elegir otra medición
          </MuiButton>
        </Box>
        <Typography 
          variant="h4" 
          component="h1" 
          className="dashboard-title"
          sx={{ mt: 2, mb: 2, width: '100%', textAlign: 'center' }}
        >
          Measurements Dashboard
        </Typography>
        <Paper className="dashboard-paper" sx={{ width: '90vw', maxWidth: 1600, mx: 'auto', p: 3, boxSizing: 'border-box' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="Gráfica" value="chart" sx={{ fontWeight: 600, fontSize: 16 }} />
            <Tab label="Lista" value="table" sx={{ fontWeight: 600, fontSize: 16 }} />
          </Tabs>
          {/* Date pickers and refresh button */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', justifyContent: 'center' }}>
            <TextField
              className="form-control"
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              sx={{ minWidth: 180 }}
            />
            <TextField
              className="form-control"
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              sx={{ minWidth: 180 }}
            />
            <MuiButton onClick={handleRefresh} variant="contained" color="primary" sx={{ fontWeight: 600 }}>
              Actualizar
            </MuiButton>
          </Box>
          {tab === 'chart' && (
            <Box sx={{ my: 4, width: '100%' }}>
              <Typography variant="h6" sx={{ textAlign: 'center', color: '#1976d2', mb: 1 }}>
                {dateRange.start && dateRange.end
                  ? `Rango: ${dateRange.start} a ${dateRange.end}`
                  : dateRange.start
                    ? `Desde: ${dateRange.start}`
                    : dateRange.end
                      ? `Hasta: ${dateRange.end}`
                      : 'Mostrando la fecha más reciente'}
              </Typography>
              {data.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: '#888', fontSize: 20, py: 6 }}>
                  No hay datos disponibles para este usuario.
                </Typography>
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </Box>
          )}
          {tab === 'table' && (
            <>
              <TableContainer className="table-container" sx={{ width: '100%', borderRadius: 3, boxShadow: '0 2px 12px rgba(60,60,60,0.07)', background: '#fff' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: '#f7f8fa' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16, color: '#1976d2' }}>Person ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16, color: '#1976d2' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16, color: '#1976d2' }}>Valor</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16, color: '#1976d2' }}>Unidad</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16, color: '#1976d2' }}>Tipo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', color: '#888', fontSize: 18, py: 4 }}>
                          No hay datos disponibles para este usuario.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item, idx) => (
                        <TableRow
                          key={dataType === 'measurements' ? (item as Measurement).measurement_id : (item as Observation).observation_id}
                          sx={{ background: idx % 2 === 0 ? '#f7f8fa' : '#fff' }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>{item.person_id}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 15 }}>{dataType === 'measurements' ? (item as Measurement).measurement_datetime : (item as Observation).observation_datetime}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#1976d2', fontSize: 16 }}>{item.value_as_number}</TableCell>
                          <TableCell sx={{ fontSize: 15 }}>{item.unit_source_value}</TableCell>
                          <TableCell>
                            <Chip
                              label={dataType === 'measurements' ? (item as Measurement).measurement_source_value : (item as Observation).observation_source_value}
                              sx={{ fontWeight: 600, fontSize: 15, background: '#e3f0ff', color: '#1976d2', borderRadius: 2 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={Math.ceil(data.length / rowsPerPage)}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                />
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default MeasurementsDashboard;