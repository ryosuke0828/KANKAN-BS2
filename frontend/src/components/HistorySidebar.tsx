import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';

interface CalculationHistory {
  id: number;
  date: string;
  totalAmount: number;
  weights: {
    B3: number;
    B4: number;
    M1: number;
    M2: number;
    D: number;
    P: number;
    Others: number;
  };
  selectedMembers: number[];
  result: {
    totalAmount: number;
    attributeAmounts: {
      [key: string]: number;
    };
    attributeMembers: {
      [key: string]: string[];
    };
  };
}

interface HistorySidebarProps {
  history: CalculationHistory[];
  onHistoryClick: (item: CalculationHistory) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onHistoryClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ width: 320, flexShrink: 0 }}>
      <Paper elevation={3} sx={{ p: 2, position: 'sticky', top: 80 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HistoryIcon sx={{ mr: 1 }} />
          <Typography variant="h6">計算履歴</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {history.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            履歴がありません
          </Typography>
        ) : (
          <List sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto', p: 0 }}>
            {history.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => onHistoryClick(item)}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          ¥{item.totalAmount.toLocaleString()}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(item.date)}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < history.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default HistorySidebar;
