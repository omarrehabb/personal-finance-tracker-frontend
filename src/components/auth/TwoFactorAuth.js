import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Paper, Typography, Box, Container, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const TwoFactorAuth = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { verifyTwoFactor, error: authError } = useAuth();

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!token || token.length !== 6) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await verifyTwoFactor(token);
      
      if (response.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('2FA verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Two-Factor Authentication
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Enter the 6-digit code from your authenticator app to continue.
        </Typography>
        
        <Box component="form" onSubmit={handleVerify} sx={{ mt: 3, width: '100%' }}>
          {authError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {authError}
            </Alert>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="token"
            label="Authentication Code"
            name="token"
            autoComplete="off"
            autoFocus
            value={token}
            onChange={(e) => setToken(e.target.value)}
            inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify and Continue'}
          </Button>
          
          <Button
            fullWidth
            variant="text"
            color="primary"
            onClick={() => navigate('/login')}
            sx={{ mt: 1 }}
          >
            Back to Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default TwoFactorAuth;