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
} from '@mui/material';
import { getMeasurements, getObservations, type Measurement, type Observation } from '../services/api';
import './MeasurementsDashboard.css';

const MeasurementsDashboard: React.FC = () => {
  const [dataType, setDataType] = useState<'measurements' | 'observations'>('measurements');
  const [personId, setPersonId] = useState<string>('');
  const [conceptId, setConceptId] = useState<string>('');
  const [sourceValue, setSourceValue] = useState<string>('');
  const [data, setData] = useState<Measurement[] | Observation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (personId) params.append('person_id', personId);
        if (conceptId) params.append('concept_id', conceptId);
        if (sourceValue) params.append('source_value', sourceValue);

        const response = dataType === 'measurements' 
          ? await getMeasurements(params)
          : await getObservations(params);
        
        setData(response);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [dataType, personId, conceptId, sourceValue]);

  return (
    <Container maxWidth="xl">
      <Box className="measurements-dashboard">
        <Typography 
          variant="h4" 
          component="h1" 
          className="dashboard-title"
        >
          Measurements & Observations Dashboard
        </Typography>

        <Paper className="dashboard-paper">
          <Box className="filters-grid">
            <FormControl className="form-control">
              <InputLabel>Data Type</InputLabel>
              <Select
                value={dataType}
                label="Data Type"
                onChange={(e) => setDataType(e.target.value as 'measurements' | 'observations')}
              >
                <MenuItem value="measurements">Measurements</MenuItem>
                <MenuItem value="observations">Observations</MenuItem>
              </Select>
            </FormControl>

            <TextField
              className="form-control"
              label="Person ID"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
            />

            <TextField
              className="form-control"
              label="Concept ID"
              value={conceptId}
              onChange={(e) => setConceptId(e.target.value)}
            />

            <TextField
              className="form-control"
              label="Source Value"
              value={sourceValue}
              onChange={(e) => setSourceValue(e.target.value)}
            />
          </Box>

          <TableContainer className="table-container">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Person ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Source Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={dataType === 'measurements' ? (item as Measurement).measurement_id : (item as Observation).observation_id}>
                    <TableCell>{dataType === 'measurements' ? (item as Measurement).measurement_id : (item as Observation).observation_id}</TableCell>
                    <TableCell>{item.person_id}</TableCell>
                    <TableCell>{dataType === 'measurements' ? (item as Measurement).measurement_datetime : (item as Observation).observation_datetime}</TableCell>
                    <TableCell>{item.value_as_number}</TableCell>
                    <TableCell>{item.unit_source_value}</TableCell>
                    <TableCell>
                      <Chip
                        label={dataType === 'measurements' ? (item as Measurement).measurement_source_value : (item as Observation).observation_source_value}
                        className={`source-chip ${dataType}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default MeasurementsDashboard; 