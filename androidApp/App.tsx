import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, useNavigation } from '@react-navigation/native';

import { createStackNavigator } from '@react-navigation/stack';
import TimelinePage from './components/TimelinePage';
import LoginPage from './components/LoginPage';
import AttendanceTracker from './components/AttendanceTracker';

const Stack = createStackNavigator();

// Main App Navigator
function MainNavigator({ onLogout }: { onLogout: () => void }) {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        setUserData(JSON.parse(userDataString));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };



  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#2c3e50',
        },
        headerRight: () => (
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setShowMenu(!showMenu)}
            >
              <Text style={styles.menuButtonText}>☰</Text>
            </TouchableOpacity>
            
            {showMenu && (
              <View style={styles.menuContainer}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    (navigation as any).navigate('Home');
                  }}
                >
                  <Text style={styles.menuItemText}>🏠 Home</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    (navigation as any).navigate('Timeline');
                  }}
                >
                  <Text style={styles.menuItemText}>🗺️ Timeline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onLogout();
                  }}
                >
                  <Text style={styles.menuItemText}>🚪 Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ),
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={AttendanceTracker}
        options={{
          title: '🏠 Home',
          headerTitle: () => (
            <View>
              <Text style={styles.headerTitle}>🏠 Home</Text>
              {userData && (
                <Text style={styles.userInfo}>
                  Welcome, {userData.name || userData.phone || 'User'}
                </Text>
              )}
            </View>
          ),
        }}
      />

      <Stack.Screen 
        name="Timeline" 
        component={TimelinePage}
        options={{
          title: '🗺️ Timeline',
          headerTitle: () => (
            <View>
              <Text style={styles.headerTitle}>🗺️ Timeline</Text>
              {userData && (
                <Text style={styles.userInfo}>
                  Welcome, {userData.name || userData.phone || 'User'}
                </Text>
              )}
            </View>
          ),
        }}
      />

    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check login status on app start
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const loginStatus = await AsyncStorage.getItem('isLoggedIn');
      const isLoggedIn = loginStatus === 'true';
      
      if (isLoggedIn) {
        // If user is logged in, check backend for today's attendance status
        console.log('🔍 Checking backend for today\'s attendance status...');
        await checkBackendAttendanceStatus();
      }
      
      setIsLoggedIn(isLoggedIn);
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBackendAttendanceStatus = async () => {
    try {
      // Get user data from AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        console.log('❌ No user data found for backend check');
        return;
      }

      const userData = JSON.parse(userDataString);
      const today = new Date().toISOString().split('T')[0]; // Use ISO format for API
      
      console.log('📅 Checking attendance for date:', today);
      console.log('👤 User ID:', userData.executiveId || userData.id);

      // Import apiService dynamically to avoid circular dependency
      const apiService = require('./services/apiService').default;
      await apiService.initialize();
      
      // Fetch today's attendance data from backend
      const response = await apiService.getAttendanceData(today);
      
      if (response.success && response.data && response.data.entries) {
        console.log('✅ Backend data found:', response.data.entries.length, 'entries');
        
        // Check if user has punched in today
        const hasPunchIn = response.data.entries.some((entry: any) => entry.type === 'punchIn');
        const hasPunchOut = response.data.entries.some((entry: any) => entry.type === 'punchOut');
        
        console.log('📊 Attendance Status - Punch In:', hasPunchIn, 'Punch Out:', hasPunchOut);
        
        // Update local attendance data with backend data
        const attendanceData = {
          [today]: response.data.entries
        };
        
        await AsyncStorage.setItem('attendanceData', JSON.stringify(attendanceData));
        console.log('💾 Local attendance data updated with backend data');
        
        // Set punch-in status in AsyncStorage
        if (hasPunchIn && !hasPunchOut) {
          await AsyncStorage.setItem('isPunchedIn', 'true');
          await AsyncStorage.setItem('punchInTime', response.data.entries.find((e: any) => e.type === 'punchIn')?.fromTime || new Date().toISOString());
          console.log('✅ User is already punched in today');
        } else if (hasPunchIn && hasPunchOut) {
          await AsyncStorage.setItem('isPunchedIn', 'false');
          await AsyncStorage.removeItem('punchInTime');
          console.log('✅ User has completed attendance today');
        } else {
          await AsyncStorage.setItem('isPunchedIn', 'false');
          await AsyncStorage.removeItem('punchInTime');
          console.log('✅ User has not punched in today');
        }
      } else {
        console.log('📭 No attendance data found for today in backend');
        // Clear local punch-in status if no backend data
        await AsyncStorage.setItem('isPunchedIn', 'false');
        await AsyncStorage.removeItem('punchInTime');
      }
    } catch (error) {
      console.error('❌ Error checking backend attendance status:', error);
      // If backend check fails, keep local status
      console.log('🔄 Keeping local attendance status due to backend error');
    }
  };

  const handleLoginSuccess = async () => {
    console.log('🎉 Login success callback triggered');
    setIsLoggedIn(true);
  };

  // Show loading screen while checking login status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('isLoggedIn');
              await AsyncStorage.removeItem('userPhone');
              await AsyncStorage.removeItem('userData');
              await AsyncStorage.removeItem('tempOTP');
              await AsyncStorage.removeItem('tempPhone');
              setIsLoggedIn(false); // This will trigger re-render and show login page
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <NavigationContainer>
      <MainNavigator onLogout={handleLogout} />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  menuButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  menuButtonText: {
    fontSize: 18,
    color: '#333',
  },
  menuContainer: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 150,
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
});
