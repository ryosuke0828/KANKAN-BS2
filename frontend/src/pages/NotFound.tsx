import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container, LinearProgress } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // カウントダウンタイマー
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 10秒後にホームにリダイレクト
    const redirectTimer = setTimeout(() => {
      navigate('/');
    }, 10000);

    // クリーンアップ
    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  const progress = ((10 - countdown) / 10) * 100;

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon
          sx={{
            fontSize: 120,
            color: 'error.main',
            mb: 3,
          }}
        />
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: '4rem', md: '6rem' },
            fontWeight: 'bold',
            color: 'text.primary',
            mb: 2,
          }}
        >
          404
        </Typography>
        <Typography
          variant="h4"
          component="h2"
          sx={{
            mb: 2,
            color: 'text.secondary',
          }}
        >
          Page Not Found
        </Typography>
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: 'text.secondary',
          }}
        >
          お探しのページは見つかりませんでした。
        </Typography>
        <Box sx={{ width: '100%', maxWidth: 400, mb: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          {countdown}秒後にホーム画面に自動的にリダイレクトされます
        </Typography>
      </Box>
    </Container>
  );
};

export default NotFound;
