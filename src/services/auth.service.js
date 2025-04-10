// src/services/auth.service.js
import api from './api';

const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login/',
  LOGOUT: '/api-auth/logout/',
  CHECK_2FA: '/2fa/status/',
  SETUP_2FA: '/2fa/create/',
  VERIFY_2FA: '/2fa/verify/',
  DISABLE_2FA: '/2fa/delete/',
};

class AuthService {
  async login(username, password) {
    // First, get the CSRF token
    await api.get('/api-auth/login/');
    
    // Now submit the login form with the CSRF token
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/api-auth/login/', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Check if 2FA is enabled
    const twoFactorStatus = await this.checkTwoFactorStatus();
    
    return {
      success: response.status === 200,
      twoFactorRequired: twoFactorStatus.has_2fa,
    };
  }
  
  async logout() {
    const response = await api.post(AUTH_ENDPOINTS.LOGOUT);
    return response.status === 200;
  }
  
  async checkTwoFactorStatus() {
    try {
      const response = await api.get(AUTH_ENDPOINTS.CHECK_2FA);
      return response.data;
    } catch (error) {
      // Default to no 2FA if endpoint fails
      return { has_2fa: false };
    }
  }
  
  async setupTwoFactor() {
    const response = await api.get(AUTH_ENDPOINTS.SETUP_2FA);
    return response.data;
  }
  
  async verifyTwoFactor(token) {
    const response = await api.post(AUTH_ENDPOINTS.VERIFY_2FA, { token });
    return response.data;
  }

  async register(username, email, password) {
  console.log('Sending registration request');
  const response = await api.post('/api/auth/register/', {
    username,
    email,
    password,
    password2: password, // Make sure to include password confirmation
  });
  return response.data;
}
  async disableTwoFactor() {
    const response = await api.post(AUTH_ENDPOINTS.DISABLE_2FA);
    return response.data;
  }
  
  // Helper method to check if user is authenticated
  async isAuthenticated() {
    try {
      // Try to access a protected endpoint
      await api.get('/api/profiles/my_profile/');
      return true;
    } catch (error) {
      return false;
    }
  }
}

const authService = new AuthService();
export default authService;