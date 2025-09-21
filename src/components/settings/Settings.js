import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Alert,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Grid,
  Snackbar
} from '@mui/material';
import {
  Settings as SettingsIcon,
  AttachMoney as CurrencyIcon,
  Notifications as NotificationsIcon,
  Palette as ThemeIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState as useReactState } from 'react';
import authService from '../../services/auth.service';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬' }
];

const THEMES = [
  { value: 'light', name: 'Light Mode', description: 'Clean and bright interface' },
  { value: 'dark', name: 'Dark Mode', description: 'Easy on the eyes' },
  { value: 'auto', name: 'Auto', description: 'Follow system preference' }
];

const Settings = () => {
  const [settings, setSettings] = useState({
    currency: 'USD',
    theme: 'light',
    notifications: true,
    emailNotifications: false,
    autoSync: true,
    language: 'en'
  });
  const [saved, setSaved] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { hasTwoFactor } = useAuth();
  const [updating2fa, setUpdating2fa] = useReactState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    if (location.state?.message) {
      setToastMsg(location.state.message);
      setToastOpen(true);
      // Clear state to avoid showing again on back/forward
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));
    setSaved(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => setSaved(false), 3000);
    
    // Trigger a currency change event for the app
    window.dispatchEvent(new CustomEvent('currencyChanged', { 
      detail: { currency: settings.currency } 
    }));

    // Notify app to update theme immediately
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: settings.theme }
    }));
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === settings.currency);

  return (
    <>
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Avatar sx={{ 
          mr: 2, 
          bgcolor: 'primary.main',
          width: 48,
          height: 48
        }}>
          <SettingsIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1">
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Customize your finance tracker experience
          </Typography>
        </Box>
      </Box>

      {/* Success Message */}
      {saved && (
        <Alert 
          severity="success" 
          icon={<CheckIcon />}
          sx={{ mb: 3 }}
          onClose={() => setSaved(false)}
        >
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={4} alignItems="stretch">
        {/* Currency & Localization */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 0 }}>
              <CurrencyIcon sx={{ mr: 1 }} />
              Currency & Localization
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Currency</InputLabel>
              <Select
                value={settings.currency}
                label="Currency"
                onChange={(e) => handleSettingChange('currency', e.target.value)}
              >
                {CURRENCIES.map((currency) => (
                  <MenuItem key={currency.code} value={currency.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ mr: 1 }}>{currency.flag}</Typography>
                      <Typography sx={{ mr: 2 }}>{currency.symbol}</Typography>
                      <Box>
                        <Typography variant="body2">{currency.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {currency.code}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ 
              p: 2, 
              bgcolor: 'primary.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'primary.200'
            }}>
              <Typography variant="body2" color="primary.main">
                Current: {selectedCurrency?.flag} {selectedCurrency?.symbol} {selectedCurrency?.name}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Appearance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 0 }}>
              <ThemeIcon sx={{ mr: 1 }} />
              Appearance
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={settings.theme}
                label="Theme"
                onChange={(e) => handleSettingChange('theme', e.target.value)}
              >
                {THEMES.map((theme) => (
                  <MenuItem key={theme.value} value={theme.value}>
                    <Box>
                      <Typography variant="body2">{theme.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {theme.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Security & Two-Factor */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 0 }}>
              <SecurityIcon sx={{ mr: 1 }} />
              Security & Two-Factor
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Two-Factor Authentication (TOTP)
                </Typography>
                <Typography variant="caption" color={hasTwoFactor ? 'success.main' : 'text.secondary'}>
                  {hasTwoFactor ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {hasTwoFactor ? (
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={updating2fa}
                    onClick={async () => {
                      try {
                        setUpdating2fa(true);
                        await authService.disableTwoFactor();
                        window.location.reload();
                      } finally {
                        setUpdating2fa(false);
                      }
                    }}
                  >
                    Disable 2FA
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => navigate('/setup-2fa')}
                  >
                    Enable 2FA
                  </Button>
                )}
              </Box>
            </Box>
            
          </Paper>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 0 }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              Notifications
            </Typography>
            
            <List sx={{ py: 0 }}>
              <ListItem
                sx={{ px: 0 }}
                secondaryAction={
                  <Switch
                    edge="end"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    inputProps={{ 'aria-label': 'toggle push notifications' }}
                  />
                }
              >
                <ListItemText
                  primary="Push Notifications"
                  secondary="Get notified about budget alerts and transaction imports"
                />
              </ListItem>

              <ListItem
                sx={{ px: 0 }}
                secondaryAction={
                  <Switch
                    edge="end"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    inputProps={{ 'aria-label': 'toggle email notifications' }}
                  />
                }
              >
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive weekly summaries and important updates"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* (Removed Banking & Security section) */}
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <CurrencyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle2">
                  Currency: {selectedCurrency?.code}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Quick jump to Bank Connections kept or remove if not ready */}
          {/*
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }} onClick={() => navigate('/open-banking')}>
              <CardContent sx={{ textAlign: 'center' }}>
                <SecurityIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle2">Bank Connections</Typography>
              </CardContent>
            </Card>
          </Grid>
          */}
          
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
              onClick={() => navigate('/budgets')}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <NotificationsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle2">
                  Budget Alerts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Removed Two-Factor Auth quick action (not implemented) */}
        </Grid>
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            color: '#ffffff',
            px: 4,
            '&:hover': {
              background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
            }
          }}
        >
          Save Settings
        </Button>
      </Box>
    </Container>
    <Snackbar
      open={toastOpen || saved}
      autoHideDuration={3000}
      onClose={() => { setToastOpen(false); setSaved(false); }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={() => { setToastOpen(false); setSaved(false); }} severity="success" sx={{ width: '100%' }}>
        {toastOpen ? toastMsg : 'Settings saved successfully!'}
      </Alert>
    </Snackbar>
    </>
  );
};

export default Settings;
