import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  AppState,
} from 'react-native';


import { Camera, CameraType, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import apiService from '../services/apiService';
import websocketService from '../services/websocketService';

const { width, height } = Dimensions.get('window');

// Task names for background processes
const LOCATION_TASK_NAME = 'background-location-task';
const BACKGROUND_FETCH_TASK = 'background-attendance-sync';
const HEARTBEAT_TASK = 'background-heartbeat-task';

// Mode stability configuration
const MODE_STABILITY_CONFIG = {
  REQUIRED_CONSECUTIVE_READINGS: 3, // Mode change करने के लिए consecutive readings
  MIN_MODE_CHANGE_INTERVAL: 2 * 60 * 1000, // 2 minutes minimum between mode changes
  DRIVING_STICK_FACTOR: 1.5, // Driving mode से बाहर निकलने के लिए extra confidence
  STATIONARY_BUFFER_TIME: 1 * 60 * 1000, // 1 minute buffer for stationary detection
};

// Updated speed thresholds for better accuracy
const SPEED_THRESHOLDS = {
  STATIONARY_MAX: 2.0, // km/h - increased from 1.5
  WALKING_MIN: 1.5, // km/h
  WALKING_MAX: 12.0, // km/h - increased from 8
  DRIVING_MIN: 10.0, // km/h - increased from 8
  TRAFFIC_JAM_THRESHOLD: 5.0, // km/h - special threshold for traffic jams
};

// Mode types
type ModeType = 'driving' | 'walking' | 'stationary' | 'locationOff' | 'locationOn';

// Interfaces
interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  toTime?: string;
  accuracy?: number | null;
  address?: AddressDetails;
  batteryLevel?: number | null;
  isCharging?: boolean | null;
  speed?: number | null;
  heading?: number | null;
  mode: ModeType;
}

interface AddressDetails {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
  placeName?: string;
}

interface AttendanceEntry {
  id: string;
  type: 'punchIn' | 'location' | 'locationOff' | 'punchOut';
  fromTime: string;
  toTime: string;
  location?: LocationData;
  address?: string;
  fromBattery?: number | null;
  toBattery?: number | null;
  fromCharging?: boolean | null;
  toCharging?: boolean | null;
  battery?: number | null;
  isCharging?: boolean | null;
  photo?: string;
  mode: ModeType;
}

interface AttendanceData {
  [date: string]: AttendanceEntry[];
}

interface AppPersistence {
  isPunchedIn: boolean;
  punchInTime: string | null;
  lastLocation: LocationData | null;
  lastMode: ModeType | null;
  modeHistory: ModeHistoryEntry[];
  lastModeChangeTime: number | null;
}

interface ModeHistoryEntry {
  mode: ModeType;
  timestamp: number;
  confidence: number;
  speed: number;
  location: { lat: number; lng: number };
}

// API Integration Interfaces
interface User {
  id: string;
  name: string;
  phone: string;
  collegeId: string;
  role: string;
}

interface ApiAttendanceData {
  userId: string;
  collegeId: string;
  date: string;
  entries: AttendanceEntry[];
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
  };
  totalDuration: number;
  isActive: boolean;
  lastActivity: string;
}

// Enhanced mode detection with stability logic
class ModeStabilityManager {
  private modeHistory: ModeHistoryEntry[] = [];
  private lastModeChangeTime: number = 0;
  private currentStableMode: ModeType = 'stationary';

  constructor() {
    this.loadFromStorage();
  }

  async loadFromStorage() {
    try {
      const savedState = await AsyncStorage.getItem('appPersistence');
      if (savedState) {
        const persistence: AppPersistence = JSON.parse(savedState);
        this.modeHistory = persistence.modeHistory || [];
        this.lastModeChangeTime = persistence.lastModeChangeTime || 0;
        this.currentStableMode = persistence.lastMode || 'stationary';
      }
    } catch (error) {
      console.error('Error loading mode stability state:', error);
    }
  }

  async saveToStorage() {
    try {
      const savedState = await AsyncStorage.getItem('appPersistence');
      const persistence: AppPersistence = savedState ? JSON.parse(savedState) : {};
      persistence.modeHistory = this.modeHistory.slice(-10); // Keep last 10 entries
      persistence.lastModeChangeTime = this.lastModeChangeTime;
      await AsyncStorage.setItem('appPersistence', JSON.stringify(persistence));
    } catch (error) {
      console.error('Error saving mode stability state:', error);
    }
  }

  addModeReading(mode: ModeType, speed: number, location: { lat: number; lng: number }, confidence: number = 1.0) {
    const now = Date.now();
    
    // Add to history
    this.modeHistory.push({
      mode,
      timestamp: now,
      confidence,
      speed,
      location
    });

    // Keep only recent history (last 10 minutes)
    this.modeHistory = this.modeHistory.filter(entry => 
      now - entry.timestamp < 10 * 60 * 1000
    );

    this.saveToStorage();
  }

  shouldChangeMode(newMode: ModeType): boolean {
    const now = Date.now();
    
    // Check minimum time interval since last mode change
    if (now - this.lastModeChangeTime < MODE_STABILITY_CONFIG.MIN_MODE_CHANGE_INTERVAL) {
      console.log(`Mode change blocked: Too soon since last change (${Math.round((now - this.lastModeChangeTime) / 1000)}s ago)`);
      return false;
    }

    // Count consecutive readings of the new mode
    const recentReadings = this.modeHistory
      .filter(entry => now - entry.timestamp < 2 * 60 * 1000) // Last 2 minutes
      .slice(-MODE_STABILITY_CONFIG.REQUIRED_CONSECUTIVE_READINGS);

    const consecutiveNewModeCount = recentReadings.filter(entry => entry.mode === newMode).length;
    
    // Special logic for driving mode (make it stickier)
    if (this.currentStableMode === 'driving' && newMode !== 'driving') {
      const requiredReadings = Math.ceil(MODE_STABILITY_CONFIG.REQUIRED_CONSECUTIVE_READINGS * MODE_STABILITY_CONFIG.DRIVING_STICK_FACTOR);
      if (consecutiveNewModeCount < requiredReadings) {
        console.log(`Mode change blocked: Driving mode sticky (need ${requiredReadings}, have ${consecutiveNewModeCount})`);
        return false;
      }
    } else {
      if (consecutiveNewModeCount < MODE_STABILITY_CONFIG.REQUIRED_CONSECUTIVE_READINGS) {
        console.log(`Mode change blocked: Not enough consecutive readings (need ${MODE_STABILITY_CONFIG.REQUIRED_CONSECUTIVE_READINGS}, have ${consecutiveNewModeCount})`);
        return false;
      }
    }

    return true;
  }

  updateMode(newMode: ModeType): boolean {
    if (newMode !== this.currentStableMode && this.shouldChangeMode(newMode)) {
      console.log(`Mode changed from ${this.currentStableMode} to ${newMode}`);
      this.currentStableMode = newMode;
      this.lastModeChangeTime = Date.now();
      this.saveToStorage();
      return true; // Mode actually changed
    }
    return false; // Mode didn't change
  }

  getCurrentMode(): ModeType {
    return this.currentStableMode;
  }

  reset() {
    this.modeHistory = [];
    this.lastModeChangeTime = 0;
    this.currentStableMode = 'stationary';
    this.saveToStorage();
  }
}

// Global instance
const modeStabilityManager = new ModeStabilityManager();

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance * 1000; // Distance in meters
};

// Enhanced mode detection with stability logic
const detectModeFromLocation = async (currentLocation: any, lastLocation: LocationData | null): Promise<ModeType> => {
  try {
    const speed = currentLocation.coords.speed || 0; // m/s
    const speedKmh = speed * 3.6; // Convert to km/h
    const accuracy = currentLocation.coords.accuracy || 0; // meters

    // Check if location services are enabled
    const locationEnabled = await Location.hasServicesEnabledAsync();
    if (!locationEnabled) {
      return 'locationOff';
    }

    let detectedMode: ModeType;
    let confidence = 1.0;

    // Enhanced mode detection logic
    if (!lastLocation) {
      // Initial detection with conservative thresholds
      if (speedKmh < SPEED_THRESHOLDS.STATIONARY_MAX) {
        detectedMode = 'stationary';
      } else if (speedKmh >= SPEED_THRESHOLDS.WALKING_MIN && speedKmh <= SPEED_THRESHOLDS.WALKING_MAX) {
        detectedMode = 'walking';
      } else if (speedKmh > SPEED_THRESHOLDS.DRIVING_MIN) {
        detectedMode = 'driving';
      } else {
        detectedMode = 'stationary';
      }
    } else {
      // Calculate distance from last location
      const distance = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      const minSignificantDistance = Math.max(accuracy * 2, 5);
      
      // Enhanced detection with traffic jam handling
      if (distance < minSignificantDistance) {
        detectedMode = 'stationary';
        confidence = 0.8; // Lower confidence for stationary when GPS is noisy
      } else if (speedKmh < SPEED_THRESHOLDS.STATIONARY_MAX) {
        detectedMode = 'stationary';
      } else if (speedKmh >= SPEED_THRESHOLDS.WALKING_MIN && speedKmh <= SPEED_THRESHOLDS.WALKING_MAX) {
        // Check if we're potentially in traffic jam (previously driving, now slow)
        const currentMode = modeStabilityManager.getCurrentMode();
        if (currentMode === 'driving' && speedKmh < SPEED_THRESHOLDS.TRAFFIC_JAM_THRESHOLD) {
          detectedMode = 'driving'; // Stay in driving mode during traffic jams
          confidence = 0.6; // Lower confidence
        } else {
          detectedMode = 'walking';
        }
      } else if (speedKmh > SPEED_THRESHOLDS.DRIVING_MIN) {
        detectedMode = 'driving';
        confidence = speedKmh > 20 ? 1.0 : 0.8; // Higher confidence for higher speeds
      } else {
        // Fallback based on distance
        detectedMode = distance > 100 ? 'driving' : 'walking';
        confidence = 0.5;
      }
    }

    // Add reading to stability manager
    modeStabilityManager.addModeReading(
      detectedMode, 
      speedKmh, 
      { lat: currentLocation.coords.latitude, lng: currentLocation.coords.longitude }, 
      confidence
    );

    // Get stable mode from manager
    const stableMode = modeStabilityManager.getCurrentMode();
    
    console.log(`Raw detection: ${detectedMode} (${speedKmh.toFixed(1)} km/h), Stable mode: ${stableMode}, Confidence: ${confidence.toFixed(2)}`);

    return stableMode;
  } catch (error) {
    console.error('Error detecting mode:', error);
    return modeStabilityManager.getCurrentMode() || 'stationary';
  }
};

// Enhanced background tracking with better reliability
class BackgroundTrackingManager {
  private static instance: BackgroundTrackingManager;
  private isTrackingActive = false;
  private lastHeartbeat = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  static getInstance(): BackgroundTrackingManager {
    if (!BackgroundTrackingManager.instance) {
      BackgroundTrackingManager.instance = new BackgroundTrackingManager();
    }
    return BackgroundTrackingManager.instance;
  }

  async startBackgroundTracking(): Promise<boolean> {
    try {
      // Check if already tracking
      if (this.isTrackingActive) {
        console.log('Background tracking already active, skipping start');
        return true;
      }

      console.log('Starting enhanced background tracking...');

      // Request proper background permissions
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        console.error('Background location permission not granted:', bgStatus);
        Alert.alert('Permission Required', 'Background location permission is required for continuous tracking.');
        return false;
      }

      // Check if location task is already registered
      const isLocationTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (!isLocationTaskRegistered) {
        // Start location updates with optimized settings
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced, // Changed from High to Balanced for better battery
          timeInterval: 10000, // 10 seconds - reduced for better tracking
          distanceInterval: 5, // 5 meters
          deferredUpdatesInterval: 15000, // 15 seconds for deferred updates
          showsBackgroundLocationIndicator: true, // Show indicator on iOS
          foregroundService: {
            notificationTitle: 'Attendance Tracking',
            notificationBody: 'Your location is being tracked for attendance.',
            notificationColor: '#4CAF50',
          },
        });
        console.log('Location updates started');
      } else {
        console.log('Location task already registered, skipping start');
      }

      // Register background fetch with better settings
      try {
        const fetchStatus = await BackgroundFetch.getStatusAsync();
        if (fetchStatus === BackgroundFetch.BackgroundFetchStatus.Available) {
          await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 10000, // 10 seconds
            stopOnTerminate: false,
            startOnBoot: true,
          });
          console.log('Background fetch task registered');
        } else {
          console.log('Background fetch not available, status:', fetchStatus);
        }
      } catch (fetchError) {
        console.log('Background fetch registration error (non-critical):', fetchError);
      }

      // Start heartbeat mechanism
      this.startHeartbeat();

      this.isTrackingActive = true;
      console.log('Enhanced background tracking started successfully');
      return true;
    } catch (error) {
      console.error('Error starting background tracking:', error);
      return false;
    }
  }

  async stopBackgroundTracking(): Promise<void> {
    try {
      // Check if location task is registered before trying to stop it
      const isLocationTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isLocationTaskRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('Location tracking stopped');
      } else {
        console.log('Location task not registered, skipping stop');
      }

      // Check if background fetch task is registered before trying to unregister it
      try {
        const fetchStatus = await BackgroundFetch.getStatusAsync();
        if (fetchStatus !== BackgroundFetch.BackgroundFetchStatus.Denied) {
          await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
          console.log('Background fetch task unregistered');
        } else {
          console.log('Background fetch task not available, skipping unregister');
        }
      } catch (fetchError) {
        console.log('Background fetch unregister error (non-critical):', fetchError);
      }

      this.stopHeartbeat();
      this.isTrackingActive = false;
      console.log('Background tracking stopped');
    } catch (error) {
      console.error('Error stopping background tracking:', error);
      // Even if there's an error, mark tracking as inactive
      this.isTrackingActive = false;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(async () => {
      try {
        this.lastHeartbeat = Date.now();
        await AsyncStorage.setItem('lastHeartbeat', this.lastHeartbeat.toString());
        
        // Check if background tracking is still active
        const isLocationTaskRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        const isFetchTaskRunning = await BackgroundFetch.getStatusAsync();
        
        console.log(`Heartbeat: Location task running: ${isLocationTaskRunning}, Fetch status: ${isFetchTaskRunning}`);
        
        // Restart tracking if it stopped
        if (!isLocationTaskRunning && this.isTrackingActive) {
          console.log('Background tracking detected as stopped, attempting restart...');
          await this.startBackgroundTracking();
        }
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async checkBackgroundHealth(): Promise<boolean> {
    try {
      const lastHeartbeatStr = await AsyncStorage.getItem('lastHeartbeat');
      const lastHeartbeat = lastHeartbeatStr ? parseInt(lastHeartbeatStr) : 0;
      const now = Date.now();
      
      // If last heartbeat was more than 2 minutes ago, consider tracking unhealthy
      const isHealthy = (now - lastHeartbeat) < 2 * 60 * 1000;
      
      if (!isHealthy) {
        console.warn('Background tracking appears unhealthy, last heartbeat:', new Date(lastHeartbeat));
      }
      
      return isHealthy;
    } catch (error) {
      console.error('Error checking background health:', error);
      return false;
    }
  }

  isActive(): boolean {
    return this.isTrackingActive;
  }
}

const backgroundTrackingManager = BackgroundTrackingManager.getInstance();

const updateAttendanceFromBackground = async (location: any, mode: ModeType) => {
  try {
    const attendanceData = await AsyncStorage.getItem('attendanceData');
    const data = attendanceData ? JSON.parse(attendanceData) : {};
    
    const today = new Date().toDateString();
    const todayEntries = data[today] || [];
    
    if (todayEntries.length > 0) {
      const lastEntry = todayEntries[todayEntries.length - 1];
      const now = new Date().toISOString();
      
      // Get current battery info
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();
      const isCharging = batteryState === Battery.BatteryState.CHARGING;
      
      if (lastEntry.mode === mode) {
        // Same mode, update toTime and toBattery
        lastEntry.toTime = now;
        lastEntry.toBattery = batteryLevel;
        lastEntry.toCharging = isCharging;
      } else {
        // Mode changed, create new entry
        const newEntry: AttendanceEntry = {
          id: `location-${Date.now()}`,
          type: 'location',
          fromTime: now,
          toTime: now,
          mode: mode,
          fromBattery: batteryLevel,
          toBattery: batteryLevel,
          fromCharging: isCharging,
          toCharging: isCharging,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: now,
            speed: location.coords.speed,
            heading: location.coords.heading,
            accuracy: location.coords.accuracy,
            mode: mode
          }
        };
        todayEntries.push(newEntry);
      }
      
      data[today] = todayEntries;
      await AsyncStorage.setItem('attendanceData', JSON.stringify(data));
      console.log('Background attendance update completed for mode:', mode);
      
      // Sync background update to backend
      try {
        // Get user data from AsyncStorage
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          
          const apiData = {
            userId: userData.executiveId || userData.id,
            collegeId: userData.collegeId || 'default',
            date: new Date().toISOString().split('T')[0],
            entries: todayEntries,
            deviceInfo: {
              platform: Platform.OS,
              version: Platform.Version?.toString() || 'unknown',
              model: 'unknown'
            },
            totalDuration: todayEntries.reduce((total: number, entry: AttendanceEntry) => {
              if (entry.fromTime && entry.toTime) {
                const fromTime = new Date(entry.fromTime).getTime();
                const toTime = new Date(entry.toTime).getTime();
                return total + (toTime - fromTime);
              }
              return total;
            }, 0),
            isActive: true,
            lastActivity: new Date().toISOString()
          };
          
          console.log('🔄 Syncing background location update to backend...');
          const result = await apiService.syncAttendance(apiData);
          
          if (result.success) {
            console.log('✅ Background location update synced successfully');
          } else {
            console.log('❌ Background location update sync failed:', result.message);
          }
        }
      } catch (error) {
        console.error('❌ Error syncing background location update:', error);
      }
    }
  } catch (error) {
    console.error('Error updating attendance from background:', error);
  }
};

const processBackgroundLocation = async (location: any) => {
  try {
    // Get current app state from AsyncStorage
    const appState = await AsyncStorage.getItem('appPersistence');
    if (!appState) return;
    
    const persistence: AppPersistence = JSON.parse(appState);
    if (!persistence.isPunchedIn) return;

    console.log('Processing background location update...');

    // Process location and update attendance with enhanced mode detection
    const mode = await detectModeFromLocation(location, persistence.lastLocation);
    
    // Update attendance with new location data
    await updateAttendanceFromBackground(location, mode);
    
    // Update persistence with new location
    persistence.lastLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date().toISOString(),
      speed: location.coords.speed,
      heading: location.coords.heading,
      accuracy: location.coords.accuracy,
      mode: mode
    };
    persistence.lastMode = mode;
    
    await AsyncStorage.setItem('appPersistence', JSON.stringify(persistence));
  } catch (error) {
    console.error('Error processing background location:', error);
  }
};

// Enhanced background fetch task
const backgroundFetchTask = async () => {
  try {
    console.log('Enhanced background fetch task running...');
    
    // Update heartbeat
    await AsyncStorage.setItem('lastHeartbeat', Date.now().toString());
    
    // Check if user is punched in
    const appState = await AsyncStorage.getItem('appPersistence');
    if (!appState) return BackgroundFetch.BackgroundFetchResult.NoData;
    
    const persistence: AppPersistence = JSON.parse(appState);
    if (!persistence.isPunchedIn) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Update battery info and sync data
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryState = await Battery.getBatteryStateAsync();
    const isCharging = batteryState === Battery.BatteryState.CHARGING;
    
    // Update last entry with current battery status
    const attendanceData = await AsyncStorage.getItem('attendanceData');
    if (attendanceData) {
      const data = JSON.parse(attendanceData);
      const today = new Date().toDateString();
      const todayEntries = data[today] || [];
      
      if (todayEntries.length > 0) {
        const lastEntry = todayEntries[todayEntries.length - 1];
        lastEntry.toBattery = batteryLevel;
        lastEntry.toCharging = isCharging;
        lastEntry.toTime = new Date().toISOString();
        
        await AsyncStorage.setItem('attendanceData', JSON.stringify(data));
        console.log('Background sync completed successfully');
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    }
    
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Background fetch error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
};

// Register enhanced background tasks
TaskManager.defineTask(BACKGROUND_FETCH_TASK, backgroundFetchTask);

// Enhanced background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async (taskData) => {
  if (taskData.error) {
    console.error('Background location task error:', taskData.error);
    return;
  }
  if (taskData.data) {
    const { locations } = taskData.data as any;
    console.log('Received new locations in background:', locations.length);
    
    // Process the most recent location
    if (locations.length > 0) {
      await processBackgroundLocation(locations[locations.length - 1]);
    }
  }
});

const AttendanceTracker: React.FC = () => {
  // State variables
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [currentMode, setCurrentMode] = useState<ModeType>('stationary');
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [loading, setLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<any>(null);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [currentBatteryLevel, setCurrentBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(true);
  const [lastLocationCheck, setLastLocationCheck] = useState<Date | null>(null);
  const [locationTrackingInterval, setLocationTrackingInterval] = useState<NodeJS.Timeout | null>(null);
  const [backgroundTrackingStatus, setBackgroundTrackingStatus] = useState<'active' | 'inactive' | 'unknown'>('unknown');

  // API Integration State Variables
  // Sync Status Variables - COMMENTED FOR PRODUCTION
  // const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  // const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Refs
  const lastLocationRef = useRef<LocationData | null>(null);
  const locationCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attendanceDataRef = useRef<AttendanceData>({});
  const appState = useRef(AppState.currentState);

  // Force re-render when attendance data changes
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Update current time every second for real-time duration
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    initializeApp();
    
    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
      stopLocationTracking();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: any) => {
    console.log('App state changing from', appState.current, 'to', nextAppState);
    
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      console.log('App resumed - checking background tracking health');
      await restoreAppState();
              // await checkBackgroundTrackingHealth(); // COMMENTED FOR PRODUCTION
    } else if (nextAppState.match(/inactive|background/)) {
      // App is going to background
      console.log('App going to background - ensuring tracking continues');
      await saveAppState();
      if (isPunchedIn) {
        await ensureBackgroundTracking();
      }
    }
    appState.current = nextAppState;
  };

  // Background Tracking Health Check - COMMENTED FOR PRODUCTION
  /*
  const checkBackgroundTrackingHealth = async () => {
    try {
      const isHealthy = await backgroundTrackingManager.checkBackgroundHealth();
      setBackgroundTrackingStatus(isHealthy ? 'active' : 'inactive');
      
      if (!isHealthy && isPunchedIn) {
        console.warn('Background tracking unhealthy, attempting restart...');
        await ensureBackgroundTracking();
      }
    } catch (error) {
      console.error('Error checking background tracking health:', error);
    }
  };
  */

  const ensureBackgroundTracking = async () => {
    try {
      if (!backgroundTrackingManager.isActive()) {
        console.log('Starting background tracking...');
        const success = await backgroundTrackingManager.startBackgroundTracking();
        setBackgroundTrackingStatus(success ? 'active' : 'inactive');
        
        if (!success) {
          Alert.alert(
            'Background Tracking Warning', 
            'Background tracking may not work properly. Please keep the app open or check your device settings.',
            [{ text: 'OK' }]
          );
        }
      } else {
        setBackgroundTrackingStatus('active');
      }
    } catch (error) {
      console.error('Error ensuring background tracking:', error);
      setBackgroundTrackingStatus('inactive');
    }
  };

  const saveAppState = async () => {
    try {
      const persistence: AppPersistence = {
        isPunchedIn,
        punchInTime,
        lastLocation: lastLocationRef.current,
        lastMode: currentMode,
        modeHistory: [], // Will be populated by ModeStabilityManager
        lastModeChangeTime: null
      };
      await AsyncStorage.setItem('appPersistence', JSON.stringify(persistence));
      console.log('App state saved successfully');
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  };

  const restoreAppState = async () => {
    try {
      const savedState = await AsyncStorage.getItem('appPersistence');
      if (savedState) {
        const persistence: AppPersistence = JSON.parse(savedState);
        
        if (persistence.isPunchedIn) {
          console.log('Restoring punched in state...');
          setIsPunchedIn(true);
          setPunchInTime(persistence.punchInTime);
          setCurrentMode(persistence.lastMode || 'stationary');
          lastLocationRef.current = persistence.lastLocation;
          
          // Resume location tracking
          console.log('Resuming location tracking...');
          await startLocationTrackingAfterPunchIn();
          
          // Ensure background tracking is active
          await ensureBackgroundTracking();
          
          // Add entry for app resumption
          await addAppResumeEntry();
        }
      }
    } catch (error) {
      console.error('Error restoring app state:', error);
    }
  };

  const addAppResumeEntry = async () => {
    try {
      const now = new Date().toISOString();
      const location = await getCurrentLocation();
      const batteryInfo = await getBatteryInfo();
      
      if (location) {
        const resumeEntry: AttendanceEntry = {
          id: `resume-${Date.now()}`,
          type: 'location',
          fromTime: now,
          toTime: now,
          location: location,
          address: location.address?.formattedAddress || 'Unknown Location',
          fromBattery: batteryInfo.batteryLevel,
          toBattery: batteryInfo.batteryLevel,
          fromCharging: batteryInfo.isCharging,
          toCharging: batteryInfo.isCharging,
          mode: location.mode
        };
        
        await addAttendanceEntry(resumeEntry);
        setCurrentLocation(location);
        lastLocationRef.current = location;
        setCurrentMode(location.mode);
      }
    } catch (error) {
      console.error('Error adding app resume entry:', error);
    }
  };

  const initializeApp = async () => {
    await checkPermissions();
    await loadAttendanceData();
    await getBatteryInfo();
    await checkLocationStatus();
    await setupBackgroundFetch();
    await restoreAppState();
    
    // Initialize API service
    try {
      await apiService.initialize();
      console.log('✅ API Service initialized successfully');
    } catch (error) {
      console.log('⚠️ API Service initialization failed:', error);
    }
  };

  const setupBackgroundFetch = async () => {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      console.log('Background fetch status:', status);
      if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
        console.log('Background fetch is available');
      } else {
        console.log('Background fetch is not available');
      }
    } catch (error) {
      console.error('Error setting up background fetch:', error);
    }
  };

  const checkPermissions = async () => {
    try {
      // Check camera permission
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus);

      // Check foreground location permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(locationStatus);

      // Check background location permission
      const { status: bgLocationStatus } = await Location.requestBackgroundPermissionsAsync();

      if (cameraStatus !== 'granted') {
        Alert.alert('Camera Permission Required', 'Camera permission is required for punch-in/out.');
      }

      if (locationStatus !== 'granted') {
        Alert.alert('Location Permission Required', 'Location permission is required for attendance tracking.');
      }

      if (bgLocationStatus !== 'granted') {
        Alert.alert(
          'Background Location Required', 
          'Background location permission is required for continuous tracking when app is in background.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Location.requestBackgroundPermissionsAsync() }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const loadAttendanceData = async () => {
    try {
      console.log('Loading attendance data from AsyncStorage...');
      const savedData = await AsyncStorage.getItem('attendanceData');

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setAttendanceData(parsedData);
        attendanceDataRef.current = parsedData;
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const saveAttendanceData = async (data: AttendanceData) => {
    try {
      await AsyncStorage.setItem('attendanceData', JSON.stringify(data));
      setAttendanceData(data);
      attendanceDataRef.current = data;
    } catch (error) {
      console.error('Error saving attendance data:', error);
    }
  };

  const getBatteryInfo = async () => {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();

      setCurrentBatteryLevel(batteryLevel);
      setIsCharging(batteryState === Battery.BatteryState.CHARGING);

      return { batteryLevel, isCharging: batteryState === Battery.BatteryState.CHARGING };
    } catch (error) {
      console.error('Error getting battery info:', error);
      return { batteryLevel: null, isCharging: null };
    }
  };

  const checkLocationStatus = async () => {
    try {
      const locationEnabled = await Location.hasServicesEnabledAsync();
      setIsLocationEnabled(locationEnabled);
      return locationEnabled;
    } catch (error) {
      console.error('Error checking location status:', error);
      return false;
    }
  };

  const getAddressFromCoords = async (latitude: number, longitude: number): Promise<AddressDetails | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyB7DDN_gUp2zyrlElXtYpjTEQobYiUB9Lg`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;

        const address: AddressDetails = {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          formattedAddress: result.formatted_address,
          placeName: result.name
        };

        addressComponents.forEach((component: any) => {
          const types = component.types;
          if (types.includes('route')) {
            address.street = component.long_name;
          } else if (types.includes('locality')) {
            address.city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            address.state = component.long_name;
          } else if (types.includes('postal_code')) {
            address.postalCode = component.long_name;
          }
        });

        return address;
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }

    return null;
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const batteryInfo = await getBatteryInfo();
      const address = await getAddressFromCoords(location.coords.latitude, location.coords.longitude);
      
      // Detect mode with enhanced stability logic
      const mode = await detectModeFromLocation(location, lastLocationRef.current);

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
        address: address || undefined,
        batteryLevel: batteryInfo.batteryLevel,
        isCharging: batteryInfo.isCharging,
        mode: mode
      };

      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  const addAttendanceEntry = async (entry: AttendanceEntry) => {
    const today = new Date().toDateString();
    const currentData = { ...attendanceDataRef.current };
    
    if (!currentData[today]) {
      currentData[today] = [];
    }

    currentData[today].push(entry);
    await saveAttendanceData(currentData);
  };

  const updateLastEntryToTime = async (toTime: string, batteryInfo?: { batteryLevel: number | null; isCharging: boolean | null }) => {
    const today = new Date().toDateString();
    const currentData = { ...attendanceDataRef.current };

    if (currentData[today] && currentData[today].length > 0) {
      const lastEntry = currentData[today][currentData[today].length - 1];
      
      lastEntry.toTime = toTime;
      
      if (batteryInfo) {
        lastEntry.toBattery = batteryInfo.batteryLevel;
        lastEntry.toCharging = batteryInfo.isCharging;
      } else {
        getBatteryInfo().then((battery) => {
          lastEntry.toBattery = battery.batteryLevel;
          lastEntry.toCharging = battery.isCharging;
          saveAttendanceData(currentData);
        }).catch(console.error);
      }
      
      if (lastEntry.type === 'location' && currentLocation) {
        lastEntry.location = currentLocation;
        lastEntry.address = currentLocation.address?.formattedAddress || 'Unknown Location';
      }
      
      await saveAttendanceData(currentData);
      forceRefresh();
      
      // Sync updated data to backend
      try {
        // Get user data from AsyncStorage
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          
          const apiData = {
            userId: userData.executiveId || userData.id,
            collegeId: userData.collegeId || 'default',
            date: new Date().toISOString().split('T')[0],
            entries: currentData[today] || [],
            deviceInfo: {
              platform: Platform.OS,
              version: Platform.Version?.toString() || 'unknown',
              model: 'unknown'
            },
            totalDuration: (currentData[today] || []).reduce((total: number, entry: AttendanceEntry) => {
              if (entry.fromTime && entry.toTime) {
                const fromTime = new Date(entry.fromTime).getTime();
                const toTime = new Date(entry.toTime).getTime();
                return total + (toTime - fromTime);
              }
              return total;
            }, 0),
            isActive: true,
            lastActivity: new Date().toISOString()
          };
          
          console.log('🔄 Syncing location update to backend...');
          const result = await apiService.syncAttendance(apiData);
          
          if (result.success) {
            console.log('✅ Location update synced successfully');
          } else {
            console.log('❌ Location update sync failed:', result.message);
          }
        }
      } catch (error) {
        console.error('❌ Error syncing location update:', error);
      }
    }
  };

  const isLastEntrySameMode = (mode: ModeType): boolean => {
    const today = new Date().toDateString();
    const currentData = attendanceDataRef.current;
    
    if (currentData[today] && currentData[today].length > 0) {
      const lastEntry = currentData[today][currentData[today].length - 1];
      return lastEntry.mode.toLowerCase() === mode.toLowerCase();
    }
    return false;
  };

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        setCapturedPhotoUri(photo.uri);
        setCameraModalVisible(false);
        return photo.uri;
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
        return null;
      }
    }
    return null;
  };

  const handlePunchIn = async () => {
    if (cameraPermission !== 'granted') {
      Alert.alert('Camera Permission Required', 'Camera permission is required for punch-in.');
      return;
    }

    setCameraModalVisible(true);
  };

  const confirmPunchIn = async (photoUri: string | null) => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const location = await getCurrentLocation();
      const batteryInfo = await getBatteryInfo();

      if (!location) {
        Alert.alert('Error', 'Could not get location. Please try again.');
        return;
      }

      // Reset mode stability manager for fresh start
      modeStabilityManager.reset();

      // Create punch-in entry
      const punchInEntry: AttendanceEntry = {
        id: `punchIn-${Date.now()}`,
        type: 'punchIn',
        fromTime: now,
        toTime: now,
        location: location,
        address: location.address?.formattedAddress || 'Unknown Location',
        fromBattery: batteryInfo.batteryLevel,
        toBattery: batteryInfo.batteryLevel,
        fromCharging: batteryInfo.isCharging,
        toCharging: batteryInfo.isCharging,
        photo: photoUri || undefined,
        mode: location.mode
      };

      await addAttendanceEntry(punchInEntry);

      // Send to API
      await sendAttendanceEntryToAPI(punchInEntry);

      // Update states
      setIsPunchedIn(true);
      setPunchInTime(now);
      setCurrentLocation(location);
      setCurrentMode(location.mode);
      lastLocationRef.current = location;
      setLastLocationCheck(new Date());

      // Start enhanced location tracking
      await startLocationTrackingAfterPunchIn();
      await ensureBackgroundTracking();

      Alert.alert('Success', `Punch In successful! Mode: ${location.mode.toUpperCase()}`);
    } catch (error) {
      console.error('Error during punch in:', error);
      Alert.alert('Error', 'Failed to punch in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!isPunchedIn) {
      Alert.alert('Error', 'You are not punched in.');
      return;
    }

    if (cameraPermission !== 'granted') {
      Alert.alert('Camera Permission Required', 'Camera permission is required for punch-out.');
      return;
    }

    setCameraModalVisible(true);
  };

  const confirmPunchOut = async (photoUri: string | null) => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const location = await getCurrentLocation();
      const batteryInfo = await getBatteryInfo();

      // Create punch-out entry
      const punchOutEntry: AttendanceEntry = {
        id: `punchOut-${Date.now()}`,
        type: 'punchOut',
        fromTime: now,
        toTime: now,
        location: location || undefined,
        address: location?.address?.formattedAddress || 'Unknown Location',
        fromBattery: batteryInfo.batteryLevel,
        toBattery: batteryInfo.batteryLevel,
        fromCharging: batteryInfo.isCharging,
        toCharging: batteryInfo.isCharging,
        photo: photoUri || undefined,
        mode: location?.mode || 'stationary'
      };

      await addAttendanceEntry(punchOutEntry);

      // Send to API
      await sendAttendanceEntryToAPI(punchOutEntry);

      // Stop all tracking with error handling
      try {
        await stopLocationTracking();
        console.log('Foreground location tracking stopped');
      } catch (error) {
        console.error('Error stopping foreground tracking:', error);
      }

      try {
        await backgroundTrackingManager.stopBackgroundTracking();
        console.log('Background tracking stopped');
      } catch (error) {
        console.error('Error stopping background tracking:', error);
      }
      
      setBackgroundTrackingStatus('inactive');

      // Reset states
      setIsPunchedIn(false);
      setPunchInTime(null);
      setCurrentLocation(null);
      setCurrentMode('stationary');
      lastLocationRef.current = null;
      setLastLocationCheck(null);

      // Reset mode stability manager
      modeStabilityManager.reset();

      // Clear app persistence
      await AsyncStorage.removeItem('appPersistence');

      Alert.alert('Success', 'Punch Out successful!');
    } catch (error) {
      console.error('Error during punch out:', error);
      Alert.alert('Error', 'Failed to punch out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    if (!isPunchedIn) {
      console.log('Not punched in, skipping location tracking');
      return;
    }
    
    console.log('Starting enhanced location tracking interval...');
    
    const interval = setInterval(async () => {
      await checkLocationAndUpdate();
    }, 15000); // 15 seconds

    setLocationTrackingInterval(interval);
    console.log('Enhanced location tracking interval set');
  };

  const startLocationTrackingAfterPunchIn = async () => {
    console.log('Starting location tracking after punch in...');
    
    const interval = setInterval(async () => {
      await checkLocationAndUpdate();
    }, 15000); // 15 seconds

    setLocationTrackingInterval(interval);
    console.log('Location tracking interval set after punch in');
    
    // Start first check immediately
    setTimeout(async () => {
      await checkLocationAndUpdate();
    }, 2000);
  };

  const stopLocationTracking = async () => {
    try {
      if (locationTrackingInterval) {
        clearInterval(locationTrackingInterval);
        setLocationTrackingInterval(null);
        console.log('Foreground location tracking stopped');
      }
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  const checkLocationAndUpdate = async () => {
    const today = new Date().toDateString();
    let todayEntries = attendanceDataRef.current[today] || [];

    const hasPunchInEntry = todayEntries.some(entry => entry.type === 'punchIn');
    const hasPunchOutEntry = todayEntries.some(entry => entry.type === 'punchOut');

    if (!hasPunchInEntry || hasPunchOutEntry) {
      return;
    }

    const now = new Date();
    const locationEnabled = await checkLocationStatus();
    
    let batteryInfo = { batteryLevel: currentBatteryLevel, isCharging: isCharging };
    getBatteryInfo().then((battery) => {
      batteryInfo = battery;
      setCurrentBatteryLevel(battery.batteryLevel);
      setIsCharging(battery.isCharging);
    }).catch(console.error);

    if (!locationEnabled) {
      // Location is off - use stability manager
      const detectedMode = 'locationOff';
      const modeChanged = modeStabilityManager.updateMode(detectedMode);
      
      if (modeChanged || !isLastEntrySameMode('locationOff')) {
        const locationOffEntry: AttendanceEntry = {
          id: `locationOff-${Date.now()}`,
          type: 'locationOff',
          fromTime: now.toISOString(),
          toTime: now.toISOString(),
          address: 'Location Service OFF',
          fromBattery: batteryInfo.batteryLevel,
          toBattery: batteryInfo.batteryLevel,
          fromCharging: batteryInfo.isCharging,
          toCharging: batteryInfo.isCharging,
          mode: 'locationOff'
        };

        await addAttendanceEntry(locationOffEntry);
        setCurrentMode('locationOff');
        setIsLocationEnabled(false);
      } else {
        await updateLastEntryToTime(now.toISOString(), batteryInfo);
      }
    } else {
      const location = await getCurrentLocation();
      
      if (location) {
        const currentStableMode = modeStabilityManager.getCurrentMode();
        const modeChanged = currentStableMode !== currentMode;
        
        if (modeChanged) {
          // Create new entry for mode change
          const newEntry: AttendanceEntry = {
            id: `${currentStableMode}-${Date.now()}`,
            type: 'location',
            fromTime: now.toISOString(),
            toTime: now.toISOString(),
            location: location,
            address: location.address?.formattedAddress || 'Unknown Location',
            fromBattery: batteryInfo.batteryLevel,
            toBattery: batteryInfo.batteryLevel,
            fromCharging: batteryInfo.isCharging,
            toCharging: batteryInfo.isCharging,
            mode: currentStableMode
          };

          await addAttendanceEntry(newEntry);
          setCurrentMode(currentStableMode);
          setCurrentLocation(location);
          lastLocationRef.current = location;
          setIsLocationEnabled(true);
        } else {
          // Same mode, just update existing entry
          await updateLastEntryToTime(now.toISOString(), batteryInfo);
          setCurrentLocation(location);
          lastLocationRef.current = location;
        }
      }
    }

    setLastLocationCheck(now);
  };

  const getTodayEntries = useMemo(() => {
    const today = new Date().toDateString();
    const entries = attendanceData[today] || [];
    return entries;
  }, [attendanceData, refreshKey]);

  // Check today's punch status
  const getTodayPunchStatus = useMemo(() => {
    const today = new Date().toDateString();
    const entries = attendanceData[today] || [];
    
    const hasPunchIn = entries.some(entry => entry.type === 'punchIn');
    const hasPunchOut = entries.some(entry => entry.type === 'punchOut');
    
    return {
      hasPunchIn,
      hasPunchOut,
      canPunchIn: !hasPunchIn,
      canPunchOut: hasPunchIn && !hasPunchOut,
      isCompleted: hasPunchIn && hasPunchOut
    };
  }, [attendanceData, refreshKey]);

    // Clear Data Function - COMMENTED FOR PRODUCTION
  /*
  const handleClearData = () => {
    Alert.alert(
      'Clear Attendance Data',
      'Are you sure you want to clear all attendance data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('attendanceData');
              await AsyncStorage.removeItem('appPersistence');
              await AsyncStorage.removeItem('lastHeartbeat');
              
              setAttendanceData({});
              setIsPunchedIn(false);
              setPunchInTime(null);
              setCurrentLocation(null);
              setCurrentMode('stationary');
              lastLocationRef.current = null;
              setLastLocationCheck(null);
              
              try {
                await stopLocationTracking();
                console.log('Foreground tracking stopped during clear');
              } catch (error) {
                console.error('Error stopping foreground tracking during clear:', error);
              }

              try {
                await backgroundTrackingManager.stopBackgroundTracking();
                console.log('Background tracking stopped during clear');
              } catch (error) {
                console.error('Error stopping background tracking during clear:', error);
              }
              
              setBackgroundTrackingStatus('inactive');
              
              // Reset mode stability manager
              modeStabilityManager.reset();
              
              Alert.alert('Success', 'All attendance data has been cleared.');
            } catch (error) {
              console.error('Error clearing attendance data:', error);
              Alert.alert('Error', 'Failed to clear attendance data.');
            }
          }
        }
      ]
    );
  };
  */

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (fromTime: string, toTime: string) => {
    const from = new Date(fromTime);
    const to = new Date(toTime);
    const diffMs = to.getTime() - from.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Less than 1 min';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours} hr ${minutes} min`;
    }
  };

  const getCurrentDuration = (fromTime: string) => {
    const from = new Date(fromTime);
    const diffMs = currentTime.getTime() - from.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Less than 1 min';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours} hr ${minutes} min`;
    }
  };

  const getModeIcon = (mode: ModeType) => {
    switch (mode) {
      case 'driving': return '🚗';
      case 'walking': return '🚶';
      case 'stationary': return '⏸️';
      case 'locationOff': return '📵';
      case 'locationOn': return '📍';
      default: return '📍';
    }
  };

  const getModeColor = (mode: ModeType) => {
    switch (mode) {
      case 'driving': return '#FF6B35';
      case 'walking': return '#4ECDC4';
      case 'stationary': return '#45B7D1';
      case 'locationOff': return '#F7931E';
      case 'locationOn': return '#96CEB4';
      default: return '#96CEB4';
    }
  };

  // Background Status Color Function - COMMENTED FOR PRODUCTION
  /*
  const getBackgroundStatusColor = (status: 'active' | 'inactive' | 'unknown') => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'inactive': return '#f44336';
      case 'unknown': return '#FF9800';
      default: return '#757575';
    }
  };
  */

  const formatBatteryInfo = (battery: number | null | undefined, isCharging: boolean | null | undefined) => {
    if (battery === null || battery === undefined) return 'Unknown';
    const percentage = Math.round(battery * 100);
    const chargingIcon = isCharging ? '🔌' : '🔋';
    return `${percentage}% ${chargingIcon}`;
  };



  // Sync Attendance Data Function - COMMENTED FOR PRODUCTION
  /*
  const syncAttendanceData = async () => {
    try {
      // Initialize API service first
      await apiService.initialize();
      
      // Get user data from AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        console.log('❌ Cannot sync: No user data found');
        return;
      }

      const userData = JSON.parse(userDataString);
      console.log('🔄 Syncing attendance data...');
      setSyncStatus('syncing');
      
      const today = new Date().toISOString().split('T')[0];
      const todayData = attendanceData[today] || [];
      
      if (todayData.length === 0) {
        console.log('📝 No data to sync for today');
        setSyncStatus('success');
        return;
      }

      const apiData: ApiAttendanceData = {
        userId: userData.executiveId || userData.id,
        collegeId: userData.collegeId || 'default',
        date: today,
        entries: todayData,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version?.toString() || 'unknown',
          model: 'unknown',
        },
        totalDuration: calculateTotalDuration(todayData),
        isActive: isPunchedIn,
        lastActivity: new Date().toISOString(),
      };

      const result = await apiService.syncAttendance(apiData);
      console.log('✅ Attendance data synced successfully:', result);
      
      setSyncStatus('success');
      setLastSyncTime(new Date());
      
      // Send WebSocket update
      if (websocketService.getConnectionStatus().isConnected) {
        websocketService.sendAttendanceUpdate({
          type: 'attendance_synced',
          userId: userData.executiveId || userData.id,
          collegeId: userData.collegeId || 'default',
          date: today,
          entriesCount: todayData.length,
        });
      }
    } catch (error) {
      console.error('❌ Error syncing attendance data:', error);
      setSyncStatus('error');
    }
  };
  */

  const sendAttendanceEntryToAPI = async (entry: AttendanceEntry) => {
    try {
      // Initialize API service first
      await apiService.initialize();
      
      // Get user data from AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        console.log('❌ Cannot send entry: No user data found');
        return;
      }

      const userData = JSON.parse(userDataString);
      console.log('📤 Sending attendance entry to API:', entry.type);
      
      const today = new Date().toISOString().split('T')[0];
      const apiData: ApiAttendanceData = {
        userId: userData.executiveId || userData.id,
        collegeId: userData.collegeId || 'default',
        date: today,
        entries: [entry],
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version?.toString() || 'unknown',
          model: 'unknown',
        },
        totalDuration: 0,
        isActive: isPunchedIn,
        lastActivity: new Date().toISOString(),
      };

      const result = await apiService.syncAttendance(apiData);
      console.log('✅ Attendance entry sent successfully:', result);
      
      // Send WebSocket update
      if (websocketService.getConnectionStatus().isConnected) {
        websocketService.sendAttendanceUpdate({
          type: 'entry_added',
          userId: userData.executiveId || userData.id,
          collegeId: userData.collegeId || 'default',
          date: today,
          entryType: entry.type,
          entryId: entry.id,
        });
      }
    } catch (error) {
      console.error('❌ Error sending attendance entry:', error);
    }
  };

  const calculateTotalDuration = (entries: AttendanceEntry[]): number => {
    let totalDuration = 0;
    
    for (const entry of entries) {
      if (entry.fromTime && entry.toTime) {
        const fromTime = new Date(entry.fromTime).getTime();
        const toTime = new Date(entry.toTime).getTime();
        totalDuration += toTime - fromTime;
      }
    }
    
    return totalDuration;
  };

  const renderTimelineItem = (entry: AttendanceEntry, index: number) => {
    const isPunchIn = entry.type === 'punchIn';
    const isPunchOut = entry.type === 'punchOut';
    const isLocation = entry.type === 'location';
    const isLocationOff = entry.type === 'locationOff';

    const fromBattery = entry.fromBattery !== undefined ? entry.fromBattery : entry.battery;
    const toBattery = entry.toBattery !== undefined ? entry.toBattery : entry.battery;
    const fromCharging = entry.fromCharging !== undefined ? entry.fromCharging : entry.isCharging;
    const toCharging = entry.toCharging !== undefined ? entry.toCharging : entry.isCharging;

    return (
      <View key={entry.id} style={styles.timelineItem}>
        <View style={styles.timelineHeader}>
          <Text style={[
            styles.timelineType,
            { color: getModeColor(entry.mode) }
          ]}>
            {getModeIcon(entry.mode)} {entry.mode.toUpperCase()}
            {isPunchIn && ' - PUNCH IN'}
            {isPunchOut && ' - PUNCH OUT'}
          </Text>
          <Text style={styles.timelineTime}>
            {formatTime(entry.fromTime)} - {formatTime(entry.toTime)}
          </Text>
        </View>

        <View style={styles.timelineContent}>
          {entry.address && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Address:</Text>
              <Text style={styles.timelineValue}>{entry.address}</Text>
            </View>
          )}

          {entry.location && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Coordinates:</Text>
              <Text style={styles.timelineValue}>
                {entry.location.latitude.toFixed(6)}, {entry.location.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {entry.location?.speed !== null && entry.location?.speed !== undefined && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Speed:</Text>
              <Text style={styles.timelineValue}>
                {((entry.location.speed || 0) * 3.6).toFixed(1)} km/h
              </Text>
            </View>
          )}

          {(fromBattery !== null && fromBattery !== undefined) && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Battery From:</Text>
              <Text style={styles.timelineValue}>
                {formatBatteryInfo(fromBattery, fromCharging)}
              </Text>
            </View>
          )}

          {(toBattery !== null && toBattery !== undefined) && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Battery To:</Text>
              <Text style={styles.timelineValue}>
                {formatBatteryInfo(toBattery, toCharging)}
              </Text>
            </View>
          )}

          {(fromBattery !== null && fromBattery !== undefined && 
            toBattery !== null && toBattery !== undefined && 
            fromBattery !== toBattery) && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Battery Change:</Text>
              <Text style={[
                styles.timelineValue,
                { color: toBattery > fromBattery ? '#4CAF50' : '#f44336' }
              ]}>
                {toBattery > fromBattery ? '+' : ''}{Math.round((toBattery - fromBattery) * 100)}%
              </Text>
            </View>
          )}

          {entry.photo && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Photo:</Text>
              <Image source={{ uri: entry.photo }} style={styles.timelinePhoto} />
            </View>
          )}

          <View style={styles.timelineRow}>
            <Text style={styles.timelineLabel}>Duration:</Text>
            <Text style={styles.timelineValue}>
              {entry.fromTime === entry.toTime
                ? getCurrentDuration(entry.fromTime) + ' (Active)'
                : formatDuration(entry.fromTime, entry.toTime)
              }
            </Text>
          </View>
        </View>
      </View>
    );
  };

      return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Attendance Tracker</Text>
          <View style={[styles.statusIndicator, { backgroundColor: isPunchedIn ? '#4CAF50' : '#f44336' }]}>
            <Text style={styles.statusText}>
              {isPunchedIn ? '🟢 ON DUTY' : '🔴 OFF DUTY'}
            </Text>
          </View>
        </View>

      {/* Punch In/Out Buttons */}
      <View style={styles.buttonContainer}>
        {getTodayPunchStatus.isCompleted ? (
          // Already completed for today
          <View style={[styles.button, styles.completedButton]}>
            <Text style={styles.completedButtonText}>✅ ATTENDANCE COMPLETED</Text>
          </View>
        ) : getTodayPunchStatus.canPunchIn ? (
          // Can punch in
          <TouchableOpacity
            style={[styles.button, styles.punchInButton]}
            onPress={handlePunchIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>📸 PUNCH IN</Text>
            )}
          </TouchableOpacity>
        ) : getTodayPunchStatus.canPunchOut ? (
          // Can punch out
          <TouchableOpacity
            style={[styles.button, styles.punchOutButton]}
            onPress={handlePunchOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>📸 PUNCH OUT</Text>
            )}
          </TouchableOpacity>
        ) : (
          // Should not happen, but fallback
          <View style={[styles.button, styles.disabledButton]}>
            <Text style={styles.disabledButtonText}>❌ INVALID STATE</Text>
          </View>
        )}
      </View>

      {/* API Sync Status and Button - COMMENTED FOR PRODUCTION */}
      {/* <View style={styles.syncContainer}>
        <View style={styles.syncStatusRow}>
          <Text style={styles.syncStatusLabel}>API Status:</Text>
          <Text style={[
            styles.syncStatusValue,
            { color: '#4CAF50' }
          ]}>
            🟢 CONNECTED
          </Text>
        </View>
        
        {lastSyncTime && (
          <View style={styles.syncStatusRow}>
            <Text style={styles.syncStatusLabel}>Last Sync:</Text>
            <Text style={styles.syncStatusValue}>
              {lastSyncTime.toLocaleTimeString()}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.syncButton,
            { backgroundColor: syncStatus === 'syncing' ? '#FF9800' : '#2196F3' }
          ]}
          onPress={syncAttendanceData}
          disabled={syncStatus === 'syncing'}
        >
          {syncStatus === 'syncing' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.syncButtonText}>🔄 SYNC DATA</Text>
          )}
        </TouchableOpacity>
      </View> */}

      {/* Enhanced Current Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Current Status</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Today's Status:</Text>
          <Text style={styles.statusValue}>
            {getTodayPunchStatus.isCompleted ? '✅ Completed' : 
             getTodayPunchStatus.hasPunchIn ? '🟡 Punched In' : '🔴 Not Started'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Punch In Time:</Text>
          <Text style={styles.statusValue}>
            {punchInTime ? formatTime(punchInTime) : 'Not punched in'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Current Mode:</Text>
          <Text style={[styles.statusValue, { color: getModeColor(currentMode) }]}>
            {getModeIcon(currentMode)} {currentMode.toUpperCase()}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Last Location:</Text>
          <Text style={styles.statusValue}>
            {(() => {
              const today = new Date().toDateString();
              const todayEntries = attendanceData[today] || [];
              const lastEntry = todayEntries[todayEntries.length - 1];
              return lastEntry?.address || lastEntry?.location?.address?.formattedAddress || 'Unknown';
            })()}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Battery Level:</Text>
          <Text style={styles.statusValue}>
            {currentBatteryLevel !== null ? `${Math.round(currentBatteryLevel * 100)}%` : 'Unknown'}
            {isCharging ? ' 🔌' : ' 🔋'}
          </Text>
        </View>

        {/* Tracking Status - COMMENTED FOR PRODUCTION */}
        {/* <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Location Service:</Text>
          <Text style={[styles.statusValue, { color: isLocationEnabled ? '#4CAF50' : '#f44336' }]}>
            {isLocationEnabled ? '🟢 ON' : '🔴 OFF'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Foreground Tracking:</Text>
          <Text style={[styles.statusValue, { color: locationTrackingInterval ? '#4CAF50' : '#f44336' }]}>
            {locationTrackingInterval ? '🟢 ACTIVE' : '🔴 INACTIVE'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Background Tracking:</Text>
          <Text style={[styles.statusValue, { color: getBackgroundStatusColor(backgroundTrackingStatus) }]}>
            {backgroundTrackingStatus === 'active' ? '🟢 ACTIVE' : 
             backgroundTrackingStatus === 'inactive' ? '🔴 INACTIVE' : '🟡 UNKNOWN'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Last Check:</Text>
          <Text style={styles.statusValue}>
            {lastLocationCheck ? lastLocationCheck.toLocaleTimeString() : 'Never'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Background tracking health check button:</Text>
          <Text style={styles.statusValue}>
            {isPunchedIn && (
              <TouchableOpacity
                style={styles.healthCheckButton}
                onPress={checkBackgroundTrackingHealth}
              >
                <Text style={styles.healthCheckButtonText}>🔍 Check Background Health</Text>
              </TouchableOpacity>
            )}
          </Text>
        </View> */}
      </View>

      {/* Timeline */}
      <View key={refreshKey} style={styles.timelineContainer}>
        <View style={styles.timelineContainerHeader}>
          <Text style={styles.timelineTitle}>📈 Today's Timeline</Text>
          <View style={styles.timelineButtons}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={forceRefresh}
            >
              <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
            {/* Clear Data Button - COMMENTED FOR PRODUCTION */}
            {/* <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearData}
            >
              <Text style={styles.clearButtonText}>🗑️ Clear Data</Text>
            </TouchableOpacity> */}
          </View>
        </View>

        {getTodayEntries.length > 0 ? (
          getTodayEntries.map((entry, index) => renderTimelineItem(entry, index))
        ) : (
          <View style={styles.emptyTimeline}>
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>Punch in to start tracking</Text>
          </View>
        )}
      </View>

      {/* Camera Modal */}
      <Modal
        visible={cameraModalVisible}
        animationType="slide"
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="front"
            ref={(ref) => setCameraRef(ref)}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setCameraModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>❌ Cancel</Text>
                </TouchableOpacity>

                <Text style={styles.cameraTitle}>
                  {isPunchedIn ? 'Punch Out Photo' : 'Punch In Photo'}
                </Text>
              </View>

              <View style={styles.cameraFooter}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={async () => {
                    const photoUri = await takePicture();
                    if (photoUri) {
                      if (isPunchedIn) {
                        await confirmPunchOut(photoUri);
                      } else {
                        await confirmPunchIn(photoUri);
                      }
                    }
                  }}
                >
                  <Text style={styles.captureButtonText}>📸 Capture</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 50 : 80, // Reasonable space for gesture navigation
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  buttonContainer: {
    padding: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchInButton: {
    backgroundColor: '#4CAF50',
  },
  punchOutButton: {
    backgroundColor: '#f44336',
  },
  completedButton: {
    backgroundColor: '#9E9E9E',
  },
  disabledButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  // Health Check Button Styles - COMMENTED FOR PRODUCTION
  /*
  healthCheckButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  healthCheckButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  */
  timelineContainer: {
    padding: 20,
  },
  timelineContainerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // Clear Button Styles - COMMENTED FOR PRODUCTION
  /*
  clearButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  */
  timelineButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Clear Button Text Styles - COMMENTED FOR PRODUCTION
  /*
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  */
  timelineItem: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timelineType: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  timelineTime: {
    fontSize: 12,
    color: '#666',
  },
  timelineContent: {
    gap: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLabel: {
    fontSize: 12,
    color: '#666',
    width: 100,
    marginRight: 10,
  },
  timelineValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  timelinePhoto: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginTop: 5,
  },
  emptyTimeline: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  cancelButton: {
    padding: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // Sync UI Styles - COMMENTED FOR PRODUCTION
  /*
  syncContainer: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncStatusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  syncStatusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  syncButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  */
});

export default AttendanceTracker;