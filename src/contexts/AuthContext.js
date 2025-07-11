// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/auth.service';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasTwoFactor, setHasTwoFactor] = useState(false);

  useEffect(() => {
    // Check if user is authenticated on component mount
    const checkAuth = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        
        if (isAuthenticated) {
          // Get 2FA status
          const twoFactorStatus = await authService.checkTwoFactorStatus();
          setHasTwoFactor(twoFactorStatus.has_2fa);
          
          setCurrentUser({ isAuthenticated: true });
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Authentication check failed');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    setError(null);
    try {
      const response = await authService.login(username, password);
      
      // Check if 2FA is required
      if (response.twoFactorRequired) {
        setHasTwoFactor(true);
        return { success: true, twoFactorRequired: true };
      } else {
        setCurrentUser({ isAuthenticated: true });
        return { success: true, twoFactorRequired: false };
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
      throw err;
    }
  };

  // Verify 2FA token
  const verifyTwoFactor = async (token) => {
    setError(null);
    try {
      const response = await authService.verifyTwoFactor(token);
      
      if (response.success) {
        setCurrentUser({ isAuthenticated: true });
      }
      
      return response;
    } catch (err) {
      console.error('2FA verification error:', err);
      setError('Verification failed. Please try again.');
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed');
    }
  };

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    hasTwoFactor,
    login,
    logout,
    verifyTwoFactor
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;