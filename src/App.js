import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';


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

// Auth Provider
import { AuthProvider } from './contexts/AuthContext';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    }
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-2fa" element={<TwoFactorAuth />} />
            
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
            
            <Route path="/settings/security" element={
              <ProtectedRoute>
                <NavBar />
                <SetupTwoFactor />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;