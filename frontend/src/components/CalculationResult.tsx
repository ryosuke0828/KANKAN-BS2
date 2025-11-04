import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';

interface CalculationResultProps {
  result: {
    totalAmount: number;
    attributeAmounts: {
      [key: string]: number;
    };
    attributeMembers: {
      [key: string]: string[];
    };
  };
  onRecalculate: () => void;
}

const CalculationResult: React.FC<CalculationResultProps> = ({ result, onRecalculate }) => {
  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          計算結果
        </Typography>

        {/* 合計金額 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            支払い合計金額: ¥{result.totalAmount.toLocaleString()}
          </Typography>
        </Box>

        {/* 属性ごとの支払い金額と参加メンバー */}
        <Grid container spacing={3}>
          {Object.keys(result.attributeAmounts)
            .sort()
            .map((attribute) => (
              <Grid item xs={12} sm={6} md={4} key={attribute}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="secondary">
                    {attribute}
                  </Typography>
                  <Typography variant="h5" gutterBottom>
                    ¥{result.attributeAmounts[attribute].toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    参加メンバー:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.75rem' }}>
                    {result.attributeMembers[attribute].map((name, idx) => (
                      <Typography component="li" variant="caption" key={idx}>
                        {name}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
        </Grid>

        {/* 再計算ボタン */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button variant="outlined" size="large" onClick={onRecalculate}>
            再計算
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CalculationResult;
