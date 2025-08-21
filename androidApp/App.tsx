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
function MainNavigator() {
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
              // The login state will be handled by the parent component
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    );
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
                    handleLogout();
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
      setIsLoggedIn(loginStatus === 'true');
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
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

  return (
    <NavigationContainer>
      <MainNavigator />
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
