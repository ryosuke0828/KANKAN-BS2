import React from 'react';
import { Box, Typography, Slider } from '@mui/material';

interface WeightSliderProps {
  attribute: string;
  value: number;
  onChange: (value: number) => void;
  marks: Array<{ value: number; label: string }>;
}

const WeightSlider: React.FC<WeightSliderProps> = ({ attribute, value, onChange, marks }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography gutterBottom>
        {attribute}: {value}
      </Typography>
      <Slider
        value={value}
        onChange={(_, newValue) => onChange(newValue as number)}
        min={0}
        max={10}
        step={0.5}
        marks={marks}
        valueLabelDisplay="auto"
      />
    </Box>
  );
};

export default WeightSlider;
