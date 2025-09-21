import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Box, 
  Container, 
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Divider
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const SetupTwoFactor = () => {
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState(null);
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const navigate = useNavigate();
  const { setupTwoFactor, verifyTwoFactor, error: authError } = useAuth();

  useEffect(() => {
    const fetchSetupData = async () => {
      try {
        const data = await setupTwoFactor();
        setSetupData(data);
      } catch (err) {
        console.error('Error setting up 2FA:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSetupData();
  }, [setupTwoFactor]);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!token || token.length !== 6) {
      setVerifyError('Please enter the 6‑digit code.');
      return;
    }
    
    setVerifying(true);
    setVerifyError('');
    try {
      const response = await verifyTwoFactor(token);
      if (response?.success) {
        navigate('/settings', { state: { message: 'Two‑factor authentication enabled' } });
      } else {
        setVerifyError('Invalid code. Please try again.');
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      setVerifyError('Invalid code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <Container component="main" maxWidth="md" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Set Up Two-Factor Authentication
        </Typography>
        
        {(authError || verifyError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {verifyError || authError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Card sx={{ maxWidth: 350, width: '100%' }}>
            <CardMedia
              component="img"
              image={
                setupData?.qr_svg ||
                setupData?.qr_code ||
                (setupData?.otpauth_url
                  ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(setupData.otpauth_url)}`
                  : undefined)
              }
              alt="QR Code for 2FA setup"
              sx={{ p: 2, objectFit: 'contain' }}
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Scan this QR code with your authenticator app
              </Typography>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              Setup Instructions:
            </Typography>
            
            <Typography variant="body1" paragraph>
              1. Download an authenticator app like Google Authenticator or Authy if you don't already have one.
            </Typography>
            
            <Typography variant="body1" paragraph>
              2. Scan the QR code with your app or enter the secret key manually.
            </Typography>
            
            <Typography variant="body1" paragraph>
              3. Enter the 6-digit code from your app below to verify the setup.
            </Typography>

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Secret Key (if you can't scan the QR code):
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={(theme) => ({ 
                fontFamily: 'monospace', 
                p: 2, 
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100', 
                color: 'text.primary',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                mb: 3,
                wordBreak: 'break-all'
              })}
            >
              {setupData?.secret_key}
            </Typography>

            <Box component="form" onSubmit={handleVerify}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="token"
                label="6-digit verification code"
                name="token"
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
                error={!!verifyError}
                helperText={verifyError || 'Enter the code from your authenticator app'}
              />
              
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={verifying}
                  sx={{ flexGrow: 1 }}
                >
                  {verifying ? 'Verifying...' : 'Verify and Enable 2FA'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => navigate('/settings')}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SetupTwoFactor;
