import api from './api';

const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login/',
  LOGOUT: '/api/auth/logout/',
  CSRF: '/api/auth/csrf/',
  CHECK_2FA: '/2fa/status/',
  SETUP_2FA: '/2fa/create/',
  VERIFY_2FA: '/2fa/verify/',
  DISABLE_2FA: '/2fa/delete/',
};

class AuthService {
  async login(username, password) {
    try {
      console.log('=== LOGIN DEBUG START ===');
      console.log('Attempting login with username:', username);
      console.log('Password provided:', password ? 'YES' : 'NO');
      
      // First, get the CSRF token
      console.log('Getting CSRF token from:', AUTH_ENDPOINTS.CSRF);
      const csrfResponse = await api.get(AUTH_ENDPOINTS.CSRF);
      console.log('CSRF response status:', csrfResponse.status);
      
      // Submit JSON body to our API login endpoint
      console.log('Submitting login JSON to:', AUTH_ENDPOINTS.LOGIN);
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, { username, password });
      
      console.log('Login response status:', response.status);
      console.log('Login response headers:', response.headers);
      console.log('Login response data:', response.data);
      console.log('Full response object:', response);
      
      // Check if the response indicates authentication failure
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        console.log('Authentication failed - status indicates failure');
        throw new Error('Invalid username or password');
      }
      
      // Our API returns 200 JSON on success
      if (response.status === 200 && response.data?.success) {
        console.log('Login appeared successful, checking response...');
        
        // Check if the response contains error indicators
        if (response.data && typeof response.data === 'string') {
          console.log('Checking response for error indicators...');
          
          // Look for error messages in the HTML response
          if (response.data.includes('Please enter a correct username and password') ||
              response.data.includes('Your username and password didn\'t match') ||
              response.data.includes('Invalid login') ||
              response.data.includes('errorlist') ||
              response.data.includes('alert-danger')) {
            console.log('Login failed - error found in response');
            throw new Error('Invalid username or password');
          }
          
          // Check if we're still on the login form (indicates failed login)
          // Look for the login form specifically
          if (response.data.includes('name="username"') && 
              response.data.includes('name="password"') &&
              response.data.includes('type="password"')) {
            console.log('Login failed - still showing login form');
            throw new Error('Invalid username or password');
          }
          
          // If we get to a different page (like Account Security), login was successful
          if (response.data.includes('Account Security') || 
              response.data.includes('Two-factor authentication')) {
            console.log('Login successful - redirected to account page');
            
            // Check if 2FA is enabled by parsing the HTML response
            const has2FA = response.data.includes('Two-factor authentication is enabled');
            console.log('2FA enabled based on HTML:', has2FA);
            
            console.log('=== LOGIN DEBUG END - SUCCESS ===');
            return {
              success: true,
              twoFactorRequired: has2FA,
            };
          }
        }
        
        console.log('=== LOGIN DEBUG END - SUCCESS ===');
        return { success: true, twoFactorRequired: false };
      }
      
      console.log('Unexpected response status:', response.status);
      throw new Error('Login failed - Invalid credentials');
    } catch (error) {
      console.log('=== LOGIN DEBUG END - ERROR ===');
      console.error('Login service error:', error);
      console.error('Error response:', error.response);
      
      // Check if it's a validation error from the backend
      if (error.response?.status === 400) {
        throw new Error('Invalid username or password');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      }
      
      if (error.response?.status === 403) {
        throw new Error('CSRF validation failed. Please refresh and try again.');
      }
      
      if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      
      // Re-throw the original error if it's not a known case
      throw error;
    }
  }
  
  async logout() {
    try {
      const response = await api.post(AUTH_ENDPOINTS.LOGOUT);
      return response.status === 200;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }
  
  async checkTwoFactorStatus() {
    try {
      const response = await api.get(AUTH_ENDPOINTS.CHECK_2FA);
      return response.data;
    } catch (error) {
      console.error('2FA status check error:', error);
      // Default to no 2FA if endpoint fails
      return { has_2fa: false };
    }
  }
  
  async setupTwoFactor() {
    try {
      const response = await api.get(AUTH_ENDPOINTS.SETUP_2FA);
      return response.data;
    } catch (error) {
      console.error('2FA setup error:', error);
      throw error;
    }
  }
  
  async verifyTwoFactor(token) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.VERIFY_2FA, { token });
      return response.data;
    } catch (error) {
      console.error('2FA verification error:', error);
      throw error;
    }
  }

  async register(username, email, password) {
    try {
      console.log('Sending registration request');
      const response = await api.post('/api/auth/register/', {
        username,
        email,
        password,
        password2: password, // Make sure to include password confirmation
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  async disableTwoFactor() {
    try {
      const response = await api.post(AUTH_ENDPOINTS.DISABLE_2FA);
      return response.data;
    } catch (error) {
      console.error('2FA disable error:', error);
      throw error;
    }
  }
  
  // Helper method to check if user is authenticated and get user data
  async isAuthenticated() {
    try {
      console.log('Checking authentication status...');
      const response = await api.get('/api/profiles/my_profile/');
      console.log('Auth check response status:', response.status);
      console.log('Auth check response data:', response.data);
      if (response.status === 200 && response.data && response.data.user) {
        return { authenticated: true, user: response.data.user };
      }
      return { authenticated: false };
    } catch (error) {
      console.log('Auth check failed:', error.response?.status || error.message);
      return { authenticated: false };
    }
  }
}

const authService = new AuthService();
export default authService;
