import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// const API_BASE_URL = 'http://192.168.1.35:8080/college/androidApp/attendance-tracking';
// const LOGIN_URL = 'http://192.168.1.35:8080/college/androidApp/login';

const API_BASE_URL = 'https://focalyt.com/api/college/androidApp/attendance-tracking';
const LOGIN_URL = 'https://focalyt.com/api/college/androidApp/login';

class ApiService {
  constructor() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
  }

  // Initialize the service
  async initialize() {
    try {
      console.log('🔍 API Service: Starting initialization...');
      
      // Debug: Check all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🔍 All AsyncStorage keys:', allKeys);
      
      // Try to get token from different possible locations
      let token = null;
      
      // First, try to get token from AsyncStorage directly
      token = await AsyncStorage.getItem('token');
      console.log('🔍 Direct token found:', token ? 'YES' : 'NO');
      
      if (!token) {
        // Try to get from userData.token
        const userDataString = await AsyncStorage.getItem('userData');
        console.log('🔍 userData found:', userDataString ? 'YES' : 'NO');
        
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          console.log('🔍 userData content:', JSON.stringify(userData, null, 2));
          
          // Check if token is in userData
          if (userData.token) {
            token = userData.token;
            console.log('🔍 Token found in userData');
          }
        }
      }
      
      // Get userData for user info
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        
        // Set token and user data
        this.token = token;
        this.user = userData;
        this.isAuthenticated = token !== null;
        
        console.log('✅ API Service initialized successfully');
        console.log('✅ Token available:', this.token ? 'YES' : 'NO');
        if (this.token) {
          console.log('✅ Token preview:', this.token.substring(0, 20) + '...');
        }
        return true;
      }
      
      console.log('❌ API Service initialization failed: No userData found');
      return false;
    } catch (error) {
      console.error('API Service initialization error:', error);
      return false;
    }
  }

  // Test connection to backend
  async testConnection() {
    try {
      const response = await fetch(`${LOGIN_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: '1234567890', // Dummy data for connection test
        }),
      });
      
      return response.status === 200 || response.status === 400; // 400 means server is reachable but validation failed
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Login with OTP
  async loginWithOTP(mobile, otp) {
    try {
      const response = await fetch(`${LOGIN_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile,
          otp,
        }),
      });

      const data = await response.json();

      if (data.status && data.token) {
        this.token = data.token;
        this.user = data.user;
        this.isAuthenticated = true;

        // Store in AsyncStorage
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));

        return {
          success: true,
          user: data.user,
          token: data.token,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  }

  // Verify session
  async verifySession() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/get-attendance/${new Date().toDateString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.status === 200;
    } catch (error) {
      console.error('Session verification error:', error);
      return false;
    }
  }

  // Get user data
  async getUserData() {
    return this.user;
  }

  // Sync attendance data
  async syncAttendance(attendanceData) {
    try {
      // Ensure we have the latest token
      if (!this.token) {
        await this.initialize();
      }
      
      console.log('📤 Making API call to:', `${API_BASE_URL}/sync-attendance`);
      console.log('📤 Request data:', JSON.stringify(attendanceData, null, 2));

      const response = await fetch(`${API_BASE_URL}/sync-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      console.log('📤 Response status:', response.status);
      const data = await response.json();
      console.log('📤 Response data:', JSON.stringify(data, null, 2));

      if (data.success) {
        return {
          success: true,
          data: data.data,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Sync failed',
        };
      }
    } catch (error) {
      console.error('Sync attendance error:', error);
      return {
        success: false,
        message: 'Network error during sync',
      };
    }
  }

  // Get attendance data for a specific date
  async getAttendanceData(date) {
    try {
      // Get user data from AsyncStorage to include userId in request
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        console.log('❌ Cannot fetch attendance data: No user data found');
        return {
          success: false,
          message: 'No user data found'
        };
      }

      const userData = JSON.parse(userDataString);
      console.log('🔄 Fetching attendance data for user:', userData.executiveId || userData.id, 'date:', date);

      const response = await fetch(`${API_BASE_URL}/timeline/${date}?userId=${userData.executiveId || userData.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to get attendance data',
        };
      }
    } catch (error) {
      console.error('Get attendance error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  }

  // Get attendance summary
  async getAttendanceSummary(startDate, endDate) {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/attendance-summary?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          data: data.data,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to get attendance summary',
        };
      }
    } catch (error) {
      console.error('Get attendance summary error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  }

  // Update attendance entry
  async updateAttendanceEntry(recordId, entryId, updates) {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/update-entry`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId,
          entryId,
          updates,
        }),
      });

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          data: data.data,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to update entry',
        };
      }
    } catch (error) {
      console.error('Update entry error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  }

  // Delete attendance entry
  async deleteAttendanceEntry(recordId, entryId) {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/delete-entry`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId,
          entryId,
        }),
      });

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          data: data.data,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to delete entry',
        };
      }
    } catch (error) {
      console.error('Delete entry error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  }

  // Logout
  async logout() {
    try {
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;

      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated && this.token !== null;
  }

  // Get authentication token
  getToken() {
    return this.token;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;
