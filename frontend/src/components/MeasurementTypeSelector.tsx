import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Grid, CircularProgress, Paper } from '@mui/material';
import { getMeasurementTypes } from '../services/api';
import type { MeasurementTypeOption } from '../services/api';

interface Props {
  onSelect: (type: MeasurementTypeOption) => void;
}

const MeasurementTypeSelector: React.FC<Props> = ({ onSelect }) => {
  const [types, setTypes] = useState<MeasurementTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getMeasurementTypes();
        setTypes(result);
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, []);

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f7f8fa 0%, #e3f0ff 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        m: 0,
        p: 0,
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mt: 6, mb: 4, width: '100%', textAlign: 'center', color: '#1976d2', fontWeight: 700 }}
      >
        Selecciona un tipo de medición
      </Typography>
      {loading ? (
        <CircularProgress color="info" />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box sx={{ width: { xs: '100%', md: '80%' }, mt: 2 }}>
          {/* Daily Summary Section */}
          <Typography variant="h6" sx={{ mt: 2, mb: 2, color: '#333', fontWeight: 700, borderBottom: '1px solid #e0e0e0', pb: 1 }}>
            Resumen Diario
          </Typography>
          <Grid container spacing={2} justifyContent="flex-start" alignItems="flex-start">
            <Grid item xs={12} sm={6} md={4} lg={3} key="daily-summary" sx={{ display: 'flex', justifyContent: 'center' }}>
              <Paper elevation={2} sx={{ borderRadius: 3, p: 2, width: '100%', maxWidth: 320, background: '#f9f9f9', boxShadow: '0 2px 8px rgba(60,60,60,0.06)' }}>
                <Button
                  variant="outlined"
                  color="success"
                  size="large"
                  sx={{
                    minWidth: 280,
                    maxWidth: 280,
                    minHeight: 90,
                    maxHeight: 90,
                    fontSize: 22,
                    fontWeight: 600,
                    borderRadius: 2,
                    background: '#fff',
                    color: '#388e3c',
                    border: '1.5px solid #388e3c',
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      background: '#e8f5e9',
                      borderColor: '#388e3c',
                      color: '#388e3c',
                    }
                  }}
                  onClick={() => onSelect({ concept_id: -1, source_value: 'daily_summary', type: 'daily_summary' })}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 22, color: 'inherit', mb: 0.5, textTransform: 'capitalize' }}>
                    Daily Summary
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#888', fontWeight: 400, display: 'block' }}>
                    Resumen diario
                  </Typography>
                </Button>
              </Paper>
            </Grid>
          </Grid>
          {/* Measurements Section */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#333', fontWeight: 700, borderBottom: '1px solid #e0e0e0', pb: 1 }}>
            Measurements
          </Typography>
          <Grid container spacing={2} justifyContent="flex-start" alignItems="flex-start">
            {/* Measurement types */}
            {types.filter(t => t.type === 'measurement').map((type) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={`measurement-${type.concept_id}-${type.source_value}`} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper elevation={2} sx={{ borderRadius: 3, p: 2, width: '100%', maxWidth: 320, background: '#f9f9f9', boxShadow: '0 2px 8px rgba(60,60,60,0.06)' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    sx={{
                      minWidth: 280,
                      maxWidth: 280,
                      minHeight: 90,
                      maxHeight: 90,
                      fontSize: 22,
                      fontWeight: 600,
                      borderRadius: 2,
                      background: '#fff',
                      color: '#1976d2',
                      border: '1.5px solid #1976d2',
                      boxShadow: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        background: '#e3f0ff',
                        borderColor: '#1976d2',
                        color: '#1976d2',
                      }
                    }}
                    onClick={() => onSelect(type)}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 22, color: 'inherit', mb: 0.5, textTransform: 'capitalize' }}>
                      {type.source_value || 'N/A'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888', fontWeight: 400, display: 'block' }}>
                      Concept ID: {type.concept_id}
                    </Typography>
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
          {/* Observations Section */}
          <Typography variant="h6" sx={{ mt: 6, mb: 2, color: '#333', fontWeight: 700, borderBottom: '1px solid #e0e0e0', pb: 1 }}>
            Observations
          </Typography>
          <Grid container spacing={2} justifyContent="flex-start" alignItems="flex-start">
            {types.filter(t => t.type === 'observation').map((type) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={`observation-${type.concept_id}-${type.source_value}`} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper elevation={2} sx={{ borderRadius: 3, p: 2, width: '100%', maxWidth: 320, background: '#f9f9f9', boxShadow: '0 2px 8px rgba(60,60,60,0.06)' }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="large"
                    sx={{
                      minWidth: 280,
                      maxWidth: 280,
                      minHeight: 90,
                      maxHeight: 90,
                      fontSize: 22,
                      fontWeight: 600,
                      borderRadius: 2,
                      background: '#fff',
                      color: '#ff9800',
                      border: '1.5px solid #ff9800',
                      boxShadow: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        background: '#fff8e1',
                        borderColor: '#ff9800',
                        color: '#ff9800',
                      }
                    }}
                    onClick={() => onSelect(type)}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 22, color: 'inherit', mb: 0.5, textTransform: 'capitalize' }}>
                      {type.source_value || 'N/A'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888', fontWeight: 400, display: 'block' }}>
                      Concept ID: {type.concept_id}
                    </Typography>
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default MeasurementTypeSelector;
