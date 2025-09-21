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
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    // Check if user is authenticated on component mount
    const checkAuth = async () => {
      try {
        // Check 2FA/session status first (works pre-OTP)
        const twoFactorStatus = await authService.checkTwoFactorStatus();
        if (twoFactorStatus && (twoFactorStatus.has_2fa !== undefined)) {
          setHasTwoFactor(!!twoFactorStatus.has_2fa);
          if (typeof twoFactorStatus.verified !== 'undefined') {
            setOtpVerified(!!twoFactorStatus.verified);
          }
        }

        // Then try to load profile; may 401 pre-OTP
        const auth = await authService.isAuthenticated();
        if (auth.authenticated) {
          setCurrentUser({ isAuthenticated: true, ...auth.user });
          localStorage.setItem('authUser', JSON.stringify(auth.user));
        } else {
          if (twoFactorStatus?.has_2fa && twoFactorStatus?.verified === false) {
            // Keep a minimal user to avoid redirecting to /login; ProtectedRoute can send to /verify-2fa
            setCurrentUser({ isAuthenticated: true });
          } else {
            setCurrentUser(null);
            localStorage.removeItem('authUser');
            setHasTwoFactor(false);
            setOtpVerified(false);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Authentication check failed');
        setCurrentUser(null);
        localStorage.removeItem('authUser');
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
        setOtpVerified(false);
        // Keep a minimal user so ProtectedRoute can route to /verify-2fa without bouncing to /login
        setCurrentUser({ isAuthenticated: true });
        return { success: true, twoFactorRequired: true };
      } else {
        // Fetch user details and persist
        const auth = await authService.isAuthenticated();
        if (auth.authenticated) {
          setCurrentUser({ isAuthenticated: true, ...auth.user });
          localStorage.setItem('authUser', JSON.stringify(auth.user));
        } else {
          setCurrentUser({ isAuthenticated: true });
        }
        setHasTwoFactor(false);
        setOtpVerified(false);
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
        // Mark session as verified immediately to avoid redirect loop
        setHasTwoFactor(true);
        setOtpVerified(true);
        const auth = await authService.isAuthenticated();
        if (auth.authenticated) {
          setCurrentUser({ isAuthenticated: true, ...auth.user });
          localStorage.setItem('authUser', JSON.stringify(auth.user));
        } else {
          setCurrentUser({ isAuthenticated: true });
        }
      }
      
      return response;
    } catch (err) {
      console.error('2FA verification error:', err);
      setError('Verification failed. Please try again.');
      throw err;
    }
  };

  // Setup 2FA (fetch QR and secret)
  const setupTwoFactor = async () => {
    setError(null);
    try {
      const data = await authService.setupTwoFactor();
      return data;
    } catch (err) {
      console.error('2FA setup error:', err);
      setError('Failed to start 2FA setup');
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      localStorage.removeItem('authUser');
      setHasTwoFactor(false);
      setOtpVerified(false);
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
    otpVerified,
    login,
    logout,
    verifyTwoFactor,
    setupTwoFactor
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
