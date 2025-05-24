import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

interface DataCardProps {
  title: string;
  value: number | string;
  unit?: string;
}

const DataCard: React.FC<DataCardProps> = ({ title, value, unit }) => {
  return (
    <Card sx={{ minWidth: 275, m: 1 }}>
      <CardContent>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div">
          {value}{unit ? ` ${unit}` : ''}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DataCard; 