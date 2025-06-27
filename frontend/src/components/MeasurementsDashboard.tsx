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
import { getMeasurements, getObservations, getDailySummary, type Measurement, type Observation, type DailySummary } from '../services/api';
import api from '../services/api';
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
  const [dailySummaryData, setDailySummaryData] = useState<DailySummary[] | null>(null);
  const [step, setStep] = useState<'selectType' | 'selectUser' | 'showData'>('selectType');
  const [measurementType, setMeasurementType] = useState<MeasurementTypeOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [tab, setTab] = useState<'chart' | 'table'>('chart');
  const [userInfo, setUserInfo] = useState<{ name?: string; device_model?: string; user_id?: string | number } | null>(null);

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

  // Cuando cambia personId, obtener info del usuario
  useEffect(() => {
    if (personId) {
      api.getUsers().then(users => {
        const user = users.find(u => String(u.user_id) === String(personId));
        setUserInfo(user || null);
      });
    } else {
      setUserInfo(null);
    }
  }, [personId]);

  // Manejar selección de tipo daily_summary
  useEffect(() => {
    if (measurementType?.type === 'daily_summary') {
      setStep('selectUser');
    }
  }, [measurementType]);

  // Cuando seleccionas usuario para daily summary
  useEffect(() => {
    if (step === 'showData' && measurementType?.type === 'daily_summary' && personId) {
      getDailySummary(personId).then(setDailySummaryData);
    }
  }, [step, measurementType, personId]);

  // Prepare chart data with correct types
  const measurementData = dataType === 'measurements' ? (data as Measurement[]) : [];
  const observationData = dataType === 'observations' ? (data as Observation[]) : [];

  // Cambiar las labels del chartData para que sean las horas:
  // Ordenar los datos por fecha/hora creciente antes de graficar
  const sortedMeasurementData = dataType === 'measurements'
    ? [...measurementData].sort((a, b) => new Date(a.measurement_datetime).getTime() - new Date(b.measurement_datetime).getTime())
    : [];
  const sortedObservationData = dataType === 'observations'
    ? [...observationData].sort((a, b) => new Date(a.observation_datetime).getTime() - new Date(b.observation_datetime).getTime())
    : [];

  const chartData = {
    labels: dataType === 'measurements'
      ? sortedMeasurementData.map(item => {
          if (!item.measurement_datetime) return '';
          const dt = item.measurement_datetime;
          return dt.includes('T') ? dt.split('T')[1].slice(0,5) : dt;
        })
      : sortedObservationData.map(item => {
          if (!item.observation_datetime) return '';
          const dt = item.observation_datetime;
          return dt.includes('T') ? dt.split('T')[1].slice(0,5) : dt;
        }),
    datasets: [
      {
        label: dataType === 'measurements' ? 'Measurement Value' : 'Observation Value',
        data: dataType === 'measurements'
          ? sortedMeasurementData.map(item => item.value_as_number)
          : sortedObservationData.map(item => item.value_as_number),
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
      x: { title: { display: true, text: 'Hora' } },
      y: { title: { display: false } },
    },
  };

  // Calcular la fecha más reciente de los datos:
  const mostRecentDate = data.length > 0
    ? (dataType === 'measurements'
        ? (data as Measurement[]).reduce((max, item) => item.measurement_datetime > max ? item.measurement_datetime : max, (data[0] as Measurement).measurement_datetime)
        : (data as Observation[]).reduce((max, item) => item.observation_datetime > max ? item.observation_datetime : max, (data[0] as Observation).observation_datetime)
      )
    : '';
  const mostRecentDateOnly = mostRecentDate ? mostRecentDate.split('T')[0] : '';

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

  // Renderizado condicional para daily summary
  if (step === 'showData' && measurementType?.type === 'daily_summary') {
    // Encuentra la fecha más reciente para resaltar
    const mostRecentDate = dailySummaryData && dailySummaryData.length > 0
      ? dailySummaryData.reduce((max, row) => row.date > max ? row.date : max, dailySummaryData[0].date)
      : '';
    return (
      <Container maxWidth={false} disableGutters sx={{ minWidth: '100vw', px: 0, background: '#f7f8fa', minHeight: '100vh' }}>
        <Box className="measurements-dashboard" sx={{ width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', background: '#f7f8fa' }}>
          {/* Botón de volver atrás */}
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2, mt: 2 }}>
            <MuiButton variant="outlined" color="primary" sx={{ ml: 2, fontWeight: 600 }} onClick={() => { setStep('selectType'); }}>
              ← Elegir otra medición
            </MuiButton>
          </Box>
          <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mt: 2 }}>
            {/* Usuario consultado */}
            <Paper elevation={3} sx={{ mb: 3, p: 2, borderRadius: 3, background: 'linear-gradient(90deg, #e3f0ff 0%, #f7f8fa 100%)', boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)', display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1976d2', fontSize: 18, letterSpacing: 0.5 }}>
                Usuario consultado:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#232526', fontSize: 20, letterSpacing: 0.5 }}>
                {userInfo?.name || userInfo?.device_model || personId}
              </Typography>
            </Paper>
            <Typography variant="h4" sx={{ mb: 3, color: '#1976d2', fontWeight: 700, textAlign: 'center', letterSpacing: 1 }}>
              Daily Summary
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(60,60,60,0.07)', background: '#f7f8fa' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#e3f0ff' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#388e3c' }}>Pasos</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#d32f2f' }}>Min HR</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#d32f2f' }}>Max HR</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#d32f2f' }}>Avg HR</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Sueño (min)</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#ff9800' }}>Min RR</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#ff9800' }}>Max RR</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>SpO2 Avg</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Resumen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailySummaryData && dailySummaryData.length > 0 ? (
                    dailySummaryData.map(row => (
                      <TableRow key={row.date} sx={{ background: row.date === mostRecentDate ? '#e3f0ff' : undefined }}>
                        <TableCell sx={{ fontWeight: row.date === mostRecentDate ? 700 : 500 }}>{new Date(row.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip label={row.steps} color="success" variant="outlined" sx={{ fontWeight: 700, fontSize: 15 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.min_hr_bpm} color="error" variant="outlined" sx={{ fontWeight: 700, fontSize: 15 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.max_hr_bpm} color="error" variant="outlined" sx={{ fontWeight: 700, fontSize: 15 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.avg_hr_bpm} color="error" variant="outlined" sx={{ fontWeight: 700, fontSize: 15 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.sleep_duration_minutes} color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: 15 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.min_rr_bpm} color="warning" variant="outlined" sx={{ fontWeight: 700, fontSize: 15 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.max_rr_bpm} color="warning" variant="outlined" sx={{ fontWeight: 700, fontSize: 15 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.spo2_avg} color="info" variant="outlined" sx={{ fontWeight: 700, fontSize: 15 }} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                          {row.summary ? <Box component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: 12, background: '#f7f8fa', borderRadius: 1, p: 1, color: '#333', overflowX: 'auto' }}>{JSON.stringify(row.summary, null, 2)}</Box> : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} sx={{ textAlign: 'center', color: '#888', fontSize: 18, py: 4 }}>
                        No hay daily summarys para este usuario.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Container>
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
              {/* Cabecera de información justo encima de la gráfica */}
              {step === 'showData' && (
                <Box sx={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #e3f0ff 0%, #f7f8fa 100%)',
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(25, 118, 210, 0.08)',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  py: 2,
                  px: { xs: 2, sm: 6 },
                  mb: 3,
                  mt: 0
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: '#1976d2', fontSize: 18 }}>👤 Usuario:</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#232526', fontSize: 18 }}>{userInfo?.name || userInfo?.device_model || personId}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: '#1976d2', fontSize: 18 }}>{dataType === 'measurements' ? '🩺 Medición:' : '📝 Observación:'}</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#232526', fontSize: 18 }}>{measurementType?.source_value}</Typography>
                  </Box>
                  {(() => {
                    const unidad = data.length > 0 ? (dataType === 'measurements' ? (data[0] as Measurement).unit_source_value : (data[0] as Observation).unit_source_value) : '';
                    return unidad && unidad !== 'null' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: '#1976d2', fontSize: 18 }}>📏 Unidad:</Typography>
                        <Typography sx={{ fontWeight: 600, color: '#232526', fontSize: 18 }}>{unidad}</Typography>
                      </Box>
                    ) : null;
                  })()}
                </Box>
              )}
              <Typography variant="h6" sx={{ textAlign: 'center', color: '#1976d2', mb: 1 }}>
                {dateRange.start && dateRange.end
                  ? `Rango consultado: ${dateRange.start} a ${dateRange.end}`
                  : dateRange.start
                    ? `Desde: ${dateRange.start}`
                    : dateRange.end
                      ? `Hasta: ${dateRange.end}`
                      : mostRecentDateOnly
                        ? `Mostrando la fecha más reciente: ${mostRecentDateOnly}`
                        : 'Mostrando la fecha más reciente'}
              </Typography>
              {data.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: '#888', fontSize: 20, py: 6 }}>
                  No hay datos disponibles para este usuario.
                </Typography>
              ) : data.length === 1 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                  <Paper elevation={4} sx={{ p: 4, borderRadius: 4, minWidth: 320, background: 'linear-gradient(90deg, #e3f0ff 0%, #f7f8fa 100%)', boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 700, mb: 1 }}>
                      Valor único registrado
                    </Typography>
                    <Typography variant="h2" sx={{ color: '#232526', fontWeight: 900, fontSize: 64, mb: 1 }}>
                      {dataType === 'measurements' ? (data[0] as Measurement).value_as_number : (data[0] as Observation).value_as_number}
                    </Typography>
                    {(() => {
                      const unidad = dataType === 'measurements' ? (data[0] as Measurement).unit_source_value : (data[0] as Observation).unit_source_value;
                      return unidad && unidad !== 'null' ? (
                        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                          {unidad}
                        </Typography>
                      ) : null;
                    })()}
                    <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
                      <Typography variant="caption" sx={{ color: '#888', fontSize: 16 }}>
                        {dataType === 'measurements' ? new Date((data[0] as Measurement).measurement_datetime).toLocaleDateString() : new Date((data[0] as Observation).observation_datetime).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </Box>
          )}
          {tab === 'table' && (
            <>
              {/* Cabecera de información justo encima de la tabla */}
              {step === 'showData' && (
                <Box sx={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #e3f0ff 0%, #f7f8fa 100%)',
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(25, 118, 210, 0.08)',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  py: 2,
                  px: { xs: 2, sm: 6 },
                  mb: 3,
                  mt: 0
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: '#1976d2', fontSize: 18 }}>👤 Usuario:</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#232526', fontSize: 18 }}>{userInfo?.name || userInfo?.device_model || personId}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: '#1976d2', fontSize: 18 }}>{dataType === 'measurements' ? '🩺 Medición:' : '📝 Observación:'}</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#232526', fontSize: 18 }}>{measurementType?.source_value}</Typography>
                  </Box>
                  {(() => {
                    const unidad = data.length > 0 ? (dataType === 'measurements' ? (data[0] as Measurement).unit_source_value : (data[0] as Observation).unit_source_value) : '';
                    return unidad && unidad !== 'null' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: '#1976d2', fontSize: 18 }}>📏 Unidad:</Typography>
                        <Typography sx={{ fontWeight: 600, color: '#232526', fontSize: 18 }}>{unidad}</Typography>
                      </Box>
                    ) : null;
                  })()}
                </Box>
              )}
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