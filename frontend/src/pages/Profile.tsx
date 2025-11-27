import React, { useState } from 'react';
import axios from 'axios'; // 追加
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import api from '../api/axios';

const Profile: React.FC = () => {
  const [slackApiToken, setSlackApiToken] = useState('');
  const [slackChannelId, setSlackChannelId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess(false);

    if (password && password !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);

    const payload: { [key: string]: string } = {};
    if (slackApiToken) payload.slackApiToken = slackApiToken;
    if (slackChannelId) payload.slackChannelId = slackChannelId;
    if (password) payload.password = password;

    if (Object.keys(payload).length === 0) {
      setError('Please fill in at least one field to update.');
      setLoading(false);
      return;
    }

    try {
      await api.put('/users/me', payload);
      setSuccess(true);
      // Clear password fields after successful update
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to update profile.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ marginTop: 4, padding: 4 }}>
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Profile
        </Typography>
        <Box component="form" onSubmit={handleUpdate}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Snackbar
            open={success}
            autoHideDuration={6000}
            onClose={() => setSuccess(false)}
            message="Profile updated successfully!"
          />
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Update Slack Information</Typography>
          <TextField
            margin="normal"
            fullWidth
            id="slackApiToken"
            label="Slack API Token"
            name="slackApiToken"
            value={slackApiToken}
            onChange={(e) => setSlackApiToken(e.target.value)}
            disabled={loading}
            placeholder="xoxb-..."
          />
          <TextField
            margin="normal"
            fullWidth
            id="slackChannelId"
            label="Slack Channel ID"
            name="slackChannelId"
            value={slackChannelId}
            onChange={(e) => setSlackChannelId(e.target.value)}
            disabled={loading}
            placeholder="C0..."
          />

          <Typography variant="subtitle1" sx={{ mt: 4 }}>Change Password</Typography>
          <TextField
            margin="normal"
            fullWidth
            name="password"
            label="New Password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />

          <Box sx={{ position: 'relative', mt: 3 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
            >
              Update Profile
            </Button>
            {loading && (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;
