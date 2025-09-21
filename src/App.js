import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import BankConnectionManager from './components/openBanking/BankConnectionManager';
import TransactionImport from './components/openBanking/TransactionImport';


// Components
import Register from './components/auth/Register';
import NavBar from './components/layout/NavBar';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import TransactionsPage from './components/transactions/TransactionsPage';
import AddTransaction from './components/transactions/AddTransaction';
import TwoFactorAuth from './components/auth/TwoFactorAuth';
import SetupTwoFactor from './components/auth/SetupTwoFactor';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Budget from './components/budgets/Budget';
import Settings from './components/settings/Settings';

// Auth Provider
import { AuthProvider } from './contexts/AuthContext';

// Currency Provider
import { CurrencyProvider } from './contexts/CurrencyContext';

// Helpers to determine theme mode
const getStoredTheme = () => {
  try {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const { theme } = JSON.parse(saved);
      return theme || 'light';
    }
  } catch {}
  return 'light';
};

const getEffectiveMode = (stored) => {
  if (stored === 'auto') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return stored || 'light';
};

function App() {
  const [storedTheme, setStoredTheme] = useState(getStoredTheme());
  const mode = getEffectiveMode(storedTheme);

  useEffect(() => {
    const onThemeChanged = () => setStoredTheme(getStoredTheme());
    window.addEventListener('themeChanged', onThemeChanged);

    const mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const onSystemChange = () => setStoredTheme(getStoredTheme());
    if (mql && mql.addEventListener) mql.addEventListener('change', onSystemChange);

    return () => {
      window.removeEventListener('themeChanged', onThemeChanged);
      if (mql && mql.removeEventListener) mql.removeEventListener('change', onSystemChange);
    };
  }, []);

  const theme = useMemo(() => createTheme({
  palette: {
    mode,
    primary: mode === 'dark' ? {
      main: '#7b88ea',
      light: '#9aa6f2',
      dark: '#5a6fd8',
      contrastText: '#ffffff',
    } : {
      main: '#667eea',
      light: '#8fa4f3',
      dark: '#4c6cd4',
      contrastText: '#ffffff',
    },
    secondary: mode === 'dark' ? {
      main: '#c084f5',
      light: '#d6a8fb',
      dark: '#a66bee',
      contrastText: '#ffffff',
    } : {
      main: '#f093fb',
      light: '#f4b3fc',
      dark: '#ec6bfa',
      contrastText: '#ffffff',
    },
    success: mode === 'dark' ? {
      main: '#22b8a9',
      light: '#4bd1c4',
      dark: '#1a9a8e',
    } : {
      main: '#4dd0e1',
      light: '#7de3f0',
      dark: '#26c6da',
    },
    error: mode === 'dark' ? {
      main: '#f27289',
      light: '#f58ea1',
      dark: '#e24e6a',
    } : {
      main: '#ff6b9d',
      light: '#ff8fb3',
      dark: '#ff4081',
    },
    warning: mode === 'dark' ? {
      main: '#f59e42',
      light: '#f9b266',
      dark: '#d9822a',
    } : {
      main: '#ffa726',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: mode === 'dark' ? {
      main: '#60a5fa',
      light: '#86b9fb',
      dark: '#3b82f6',
    } : {
      main: '#42a5f5',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    background: mode === 'dark' ? {
      default: '#0b1020',
      paper: '#141a2a',
    } : {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: mode === 'dark' ? {
      primary: '#e5e7eb',
      secondary: '#9ca3af',
    } : {
      primary: '#1a202c',
      secondary: '#718096',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12, // More rounded corners
  },
  components: {
    // AppBar enhancements
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1a2235 0%, #232b3e 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(102, 126, 234, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: 0,
        }),
      },
    },
    // Button enhancements (but not for AppBar buttons)
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.95rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out',
          },
          // Override for navbar buttons
          '.MuiAppBar-root &': {
            borderRadius: 0,
          }
        },
        contained: {
          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
          color: '#ffffff', // Ensure white text on all contained buttons
          '&:hover': {
            background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
            color: '#ffffff', // Keep white text on hover
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
            color: '#ffffff',
          },
        },
      },
    },
    // Chip enhancements
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    // Avatar enhancements
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    // Linear Progress enhancements
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        bar: {
          borderRadius: 8,
        },
      },
    },
    // TextField enhancements
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#667eea',
            },
          },
        },
      },
    },
  },
  }), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CurrencyProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-2fa" element={<TwoFactorAuth />} />
            <Route path="/setup-2fa" element={
              <ProtectedRoute>
                <NavBar />
                <SetupTwoFactor />
              </ProtectedRoute>
            } />

            {/* Open Banking Routes */}
            <Route path="/open-banking" element={
              <ProtectedRoute>
                <NavBar />
                <BankConnectionManager />
              </ProtectedRoute>
            } />

            <Route path="/open-banking/import" element={
              <ProtectedRoute>
                <NavBar />
                <TransactionImport />
              </ProtectedRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <NavBar />
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <NavBar />
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/transactions" element={
              <ProtectedRoute>
                <NavBar />
                <TransactionsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/transactions/add" element={
              <ProtectedRoute>
                <NavBar />
                <AddTransaction />
              </ProtectedRoute>
            } />
            
            <Route path="/transactions/edit/:id" element={
              <ProtectedRoute>
                <NavBar />
                <AddTransaction />
              </ProtectedRoute>
            } />
            
            {/* Budget Management Route */}
            <Route path="/budgets" element={
              <ProtectedRoute>
                <NavBar />
                <Budget />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <NavBar />
                <Settings />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;
