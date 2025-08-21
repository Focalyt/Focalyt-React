import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
// BackgroundGeolocation is not working properly, using expo-location only
// import BackgroundGeolocation from 'react-native-background-geolocation';
import * as Location from 'expo-location';
import { Camera, CameraType, CameraView } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';

const { width, height } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number | null;
  speed?: number | null;
  rawSpeed?: number | null;
  heading?: number | null;
  isStationary?: boolean;
  address?: AddressDetails;
  batteryLevel?: number | null;
  isCharging?: boolean | null;
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

interface UserData {
  executiveId: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  locationTracking: {
    [date: string]: LocationData[];
  };
  totalTrackingPoints: number;
  lastTrackingUpdate: string;
  createdAt: string;
  updatedAt: string;
}

// Connectivity and Location Status Tracking
interface ConnectivityStatus {
  isConnected: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
  timestamp: string;
}

interface LocationStatus {
  isLocationEnabled: boolean;
  permissionStatus: Location.PermissionStatus | null;
  timestamp: string;
}

interface StatusPeriod {
  type: 'connectivity' | 'location';
  startTime: string;
  endTime: string | null;
  duration: number; // in minutes
  status: string;
}

// Spoof Location Detection
interface SpoofDetection {
  isSuspicious: boolean;
  indicators: string[];
  confidence: number; // 0-100
  timestamp: string;
}

interface LocationValidation {
  accuracy: boolean;
  speed: boolean;
  timing: boolean;
  sensors: boolean;
  network: boolean;
  overall: boolean;
}

// Attendance status
interface AttendanceStatus {
  isPunchedIn: boolean;
  punchInTime: string | null;
  punchOutTime: string | null;
  todayWorkHours: string;
  currentLocation: string;
  punchInPhoto?: string | null;
  punchOutPhoto?: string | null;
}

// Location tracking configuration
const LOCATION_CONFIG = {
  POSITION_BASED: {
    timeInterval: 60000, // 1 minute (60 seconds * 1000ms)
    distanceInterval: 50, // 50 meters
    name: 'Position Based (1min/50m)'
  },
  FAST: {
    timeInterval: 2000,
    distanceInterval: 5,
    name: 'Fast (2s/5m)'
  },
  NORMAL: {
    timeInterval: 5000,
    distanceInterval: 10,
    name: 'Normal (5s/10m)'
  },
  BATTERY_SAVER: {
    timeInterval: 10000,
    distanceInterval: 20,
    name: 'Battery Saver (10s/20m)'
  },
  PRECISE_TRACKING: {
    timeInterval: 0,
    distanceInterval: 1,
    name: 'Precise (1m)'
  },
  ROUTE_TRACKING: {
    timeInterval: 0,
    distanceInterval: 5,
    name: 'Route (5m)'
  }
};

// Speed filtering constants
const STATIONARY_SPEED_THRESHOLD = 1.0;
const MIN_SPEED_FOR_ACCURATE_READING = 0.5;
const GPS_NOISE_THRESHOLD = 0.3;
const ACCURACY_THRESHOLD = 20;

// Global tracking state
let globalTrackingStatus = false;
let globalLocationSubscription: Location.LocationSubscription | null = null;

// Using expo-location for location tracking

interface LocationTrackerExpoProps {
  onNavigateToTimeline?: () => void;
}

const LocationTrackerExpo: React.FC<LocationTrackerExpoProps> = ({ onNavigateToTimeline }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<'POSITION_BASED' | 'FAST' | 'NORMAL' | 'BATTERY_SAVER' | 'PRECISE_TRACKING' | 'ROUTE_TRACKING'>('POSITION_BASED');
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    isPunchedIn: false,
    punchInTime: null,
    punchOutTime: null,
    todayWorkHours: '0 hr 0 min',
    currentLocation: 'Unknown Location'
  });
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [backgroundPermission, setBackgroundPermission] = useState<Location.PermissionStatus | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentConnectivity, setCurrentConnectivity] = useState<ConnectivityStatus | null>(null);
  const [currentLocationStatus, setCurrentLocationStatus] = useState<LocationStatus | null>(null);
  const [statusPeriods, setStatusPeriods] = useState<StatusPeriod[]>([]);
  const [spoofDetection, setSpoofDetection] = useState<SpoofDetection | null>(null);
  const [locationValidation, setLocationValidation] = useState<LocationValidation | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<any>(null);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('front');
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [punchInPhotoUri, setPunchInPhotoUri] = useState<string | null>(null);
  const [punchOutPhotoUri, setPunchOutPhotoUri] = useState<string | null>(null);
  const [photoViewerModalVisible, setPhotoViewerModalVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [currentBatteryLevel, setCurrentBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const [currentTrackingInterval, setCurrentTrackingInterval] = useState<string>('30 min');

  // Refs to track current state for intervals
  const isTrackingRef = useRef(false);
  const isPunchedInRef = useRef(false);

  useEffect(() => {
    checkPermissions();
    loadUserData();
    loadAttendanceStatus();
    loadSavedPhotos();
    loadStatusHistory();
    loadSelectedConfig(); // Load saved tracking config
    getBatteryInfo(); // Initialize battery monitoring
    // Sync with global tracking state
    if (globalTrackingStatus) {
      setIsTracking(true);
      setLocationSubscription(globalLocationSubscription);
    }
    
    // Start status tracking only if already punched in
    if (attendanceStatus.isPunchedIn) {
      startStatusTracking();
    }
  }, []);

  const loadAttendanceStatus = async () => {
    try {
      const savedStatus = await AsyncStorage.getItem('attendanceStatus');
      if (savedStatus) {
        const status = JSON.parse(savedStatus);
        setAttendanceStatus(status);
        
        // Check if it's a new day and clear old photos
        // const today = new Date().toDateString();
        // const lastPunchInDate = status.punchInTime ? new Date(status.punchInTime).toDateString() : null;
        
        // if (lastPunchInDate && lastPunchInDate !== today) {
        //   // It's a new day, clear old photos
        //   await clearPhotos();
        // }
      }
    } catch (error) {
      console.error('Error loading attendance status:', error);
    }
  };

  // Update refs when state changes
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  useEffect(() => {
    isPunchedInRef.current = attendanceStatus.isPunchedIn;
  }, [attendanceStatus.isPunchedIn]);

  // Using expo-location for location tracking

 

  const loadSavedPhotos = async () => {
    try {
      const punchInPhoto = await AsyncStorage.getItem('punchInPhoto');
      const punchOutPhoto = await AsyncStorage.getItem('punchOutPhoto');
      
      if (punchInPhoto) {
        setPunchInPhotoUri(punchInPhoto);
      }
      if (punchOutPhoto) {
        setPunchOutPhotoUri(punchOutPhoto);
      }
      
      // Also load from attendance status if available
      if (attendanceStatus.punchInPhoto) {
        setPunchInPhotoUri(attendanceStatus.punchInPhoto);
      }
      if (attendanceStatus.punchOutPhoto) {
        setPunchOutPhotoUri(attendanceStatus.punchOutPhoto);
      }
    } catch (error) {
      console.error('Error loading saved photos:', error);
    }
  };

  const loadSelectedConfig = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem('selectedTrackingConfig');
      if (savedConfig) {
        setSelectedConfig(savedConfig as any);
      }
    } catch (error) {
      console.error('Error loading selected config:', error);
    }
  };

  const saveSelectedConfig = async (config: string) => {
    try {
      await AsyncStorage.setItem('selectedTrackingConfig', config);
    } catch (error) {
      console.error('Error saving selected config:', error);
    }
  };

  // Debug function to manually trigger location update
  const debugLocationUpdate = async () => {
    try {
      console.log('🔧 Manual location update triggered');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newLocation = await processLocationDataWithAddress(location);
      console.log('🔧 Manual location obtained:', newLocation.latitude, newLocation.longitude);
      setCurrentLocation(newLocation);
      addToLocationHistory(newLocation);
      setLastUpdateTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Error in manual location update:', error);
    }
  };

  // Fallback interval for regular location updates
  let fallbackInterval: NodeJS.Timeout | null = null;

  const startFallbackInterval = () => {
    const config = LOCATION_CONFIG[selectedConfig];
    console.log(`⏰ Checking fallback interval - timeInterval: ${config.timeInterval}ms, isTrackingRef: ${isTrackingRef.current}, isPunchedInRef: ${isPunchedInRef.current}`);
    
    if (config.timeInterval > 0) {
      console.log(`⏰ Starting fallback interval every ${config.timeInterval}ms`);
      fallbackInterval = setInterval(async () => {
        console.log('⏰ Fallback interval triggered - checking conditions...');
        console.log('⏰ isTrackingRef:', isTrackingRef.current, 'isPunchedInRef:', isPunchedInRef.current);
        
        if (isTrackingRef.current && isPunchedInRef.current) {
          console.log('⏰ Fallback interval - conditions met, updating location');
          await debugLocationUpdate();
        } else {
          console.log('⏰ Fallback interval - conditions not met, skipping update');
        }
      }, config.timeInterval);
    } else {
      console.log('⏰ No fallback interval needed (timeInterval is 0)');
    }
  };

  const stopFallbackInterval = () => {
    if (fallbackInterval) {
      console.log('⏰ Stopping fallback interval');
      clearInterval(fallbackInterval);
      fallbackInterval = null;
    }
  };

  const clearPhotos = async () => {
    try {
      await AsyncStorage.removeItem('punchInPhoto');
      await AsyncStorage.removeItem('punchOutPhoto');
      setPunchInPhotoUri(null);
      setPunchOutPhotoUri(null);
    } catch (error) {
      console.error('Error clearing photos:', error);
    }
  };

  const openPhotoViewer = (photoUri: string) => {
    setSelectedPhotoUri(photoUri);
    setPhotoViewerModalVisible(true);
  };

  const refreshTimeline = async () => {
    try {
      // Preserve current attendance status before creating timeline
      const currentAttendanceStatus = { ...attendanceStatus };
      
      // Use current state instead of reloading from AsyncStorage
      const combinedTimeline = await createCombinedTimeline();
      setTimeline(combinedTimeline);
      
      // Restore attendance status if it was reset
      if (attendanceStatus.punchInTime !== currentAttendanceStatus.punchInTime) {
        setAttendanceStatus(currentAttendanceStatus);
      }
    } catch (error) {
      console.error('Error refreshing timeline:', error);
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

  // Global variables to track intervals
  let globalConnectivityInterval: NodeJS.Timeout | null = null;
  let globalLocationInterval: NodeJS.Timeout | null = null;
  let isStatusTrackingActive = false;

  const startStatusTracking = () => {
    // Only start tracking if on duty
    if (!attendanceStatus.isPunchedIn) {
      return;
    }

    // Track connectivity using fetch test
    const checkConnectivity = async () => {
      // Only check if still on duty
      if (!attendanceStatus.isPunchedIn) {
        return;
      }

      try {
        const response = await fetch('https://www.google.com', { 
          method: 'HEAD'
        });
        
        const connectivityStatus: ConnectivityStatus = {
          isConnected: response.ok,
          connectionType: 'internet',
          isInternetReachable: response.ok,
          timestamp: new Date().toISOString()
        };

        setCurrentConnectivity(connectivityStatus);
        addToStatusHistory('connectivity', connectivityStatus);
      } catch (error) {
        const connectivityStatus: ConnectivityStatus = {
          isConnected: false,
          connectionType: 'none',
          isInternetReachable: false,
          timestamp: new Date().toISOString()
        };

        setCurrentConnectivity(connectivityStatus);
        addToStatusHistory('connectivity', connectivityStatus);
      }
    };

    // Track location status
    const trackLocationStatus = async () => {
      // Only check if still on duty
      if (!attendanceStatus.isPunchedIn) {
        return;
      }

      try {
        const locationEnabled = await Location.hasServicesEnabledAsync();
        const permissionStatus = await Location.getForegroundPermissionsAsync();
        
        const locationStatus: LocationStatus = {
          isLocationEnabled: locationEnabled,
          permissionStatus: permissionStatus.status,
          timestamp: new Date().toISOString()
        };

        setCurrentLocationStatus(locationStatus);
        addToStatusHistory('location', locationStatus);
      } catch (error) {
        console.error('Error checking location status:', error);
      }
    };

    // Calculate interval based on current status
    const getConnectivityInterval = () => {
      const isConnected = currentConnectivity?.isConnected;
      const isLocationOn = currentLocationStatus?.isLocationEnabled;
      
      // If both services are working: 30 minutes
      if (isConnected && isLocationOn) {
        return 30 * 60 * 1000; // 30 minutes
      }
      // If any service is down: 10 minutes
      return 10 * 60 * 1000; // 10 minutes
    };

    const getLocationInterval = () => {
      const isConnected = currentConnectivity?.isConnected;
      const isLocationOn = currentLocationStatus?.isLocationEnabled;
      
      // If both services are working: 30 minutes
      if (isConnected && isLocationOn) {
        return 30 * 60 * 1000; // 30 minutes
      }
      // If any service is down: 10 minutes
      return 10 * 60 * 1000; // 10 minutes
    };

    // Start initial tracking
    const startConnectivityTracking = () => {
      const interval = getConnectivityInterval();
      if (globalConnectivityInterval) {
        clearInterval(globalConnectivityInterval);
      }
      globalConnectivityInterval = setInterval(checkConnectivity, interval);
      checkConnectivity(); // Initial check
    };

    const startLocationTracking = () => {
      const interval = getLocationInterval();
      if (globalLocationInterval) {
        clearInterval(globalLocationInterval);
      }
      globalLocationInterval = setInterval(trackLocationStatus, interval);
      trackLocationStatus(); // Initial check
    };

    startConnectivityTracking();
    startLocationTracking();

    // Cleanup function
    return () => {
      if (globalConnectivityInterval) {
        clearInterval(globalConnectivityInterval);
        globalConnectivityInterval = null;
      }
      if (globalLocationInterval) {
        clearInterval(globalLocationInterval);
        globalLocationInterval = null;
      }
      // Cleanup fallback interval
      stopFallbackInterval();
    };
  };

  // Stop status tracking
  const stopStatusTracking = () => {
    
    // Clear existing intervals
    if (globalConnectivityInterval) {
      clearInterval(globalConnectivityInterval);
      globalConnectivityInterval = null;
    }
    if (globalLocationInterval) {
      clearInterval(globalLocationInterval);
      globalLocationInterval = null;
    }
    
    // Reset tracking flag
    isStatusTrackingActive = false;
    
    // Update tracking interval display
    updateTrackingIntervalDisplay();
  };

  // Restart status tracking with new intervals based on current status
  const restartStatusTracking = () => {
    
    // Clear existing intervals
    if (globalConnectivityInterval) {
      clearInterval(globalConnectivityInterval);
      globalConnectivityInterval = null;
    }
    if (globalLocationInterval) {
      clearInterval(globalLocationInterval);
      globalLocationInterval = null;
    }
    
    // Reset tracking flag
    isStatusTrackingActive = false;
    
    // Update tracking interval display
    updateTrackingIntervalDisplay();
    
    // Restart tracking with new intervals
    startStatusTracking();
  };

  // Update tracking interval display
  const updateTrackingIntervalDisplay = () => {
    const isOnDuty = attendanceStatus.isPunchedIn;
    const isConnected = currentConnectivity?.isConnected;
    const isLocationOn = currentLocationStatus?.isLocationEnabled;
    
    if (!isOnDuty) {
      setCurrentTrackingInterval('Not Tracking');
    } else if (isConnected && isLocationOn) {
      setCurrentTrackingInterval('30 min');
    } else {
      setCurrentTrackingInterval('10 min');
    }
  };

  const addToStatusHistory = async (type: 'connectivity' | 'location', status: ConnectivityStatus | LocationStatus) => {
    try {
      // Only track status if on duty (punched in)
      if (!attendanceStatus.isPunchedIn) {
        return;
      }

      const savedHistory = await AsyncStorage.getItem('statusHistory');
      const history = savedHistory ? JSON.parse(savedHistory) : { connectivity: [], location: [] };
      
      if (type === 'connectivity') {
        history.connectivity.push(status);
      } else {
        history.location.push(status);
      }
      
      await AsyncStorage.setItem('statusHistory', JSON.stringify(history));
      calculateStatusPeriods(history);
    } catch (error) {
      console.error('Error saving status history:', error);
    }
  };

  const loadStatusHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('statusHistory');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        calculateStatusPeriods(history);
      }
    } catch (error) {
      console.error('Error loading status history:', error);
    }
  };

  const calculateStatusPeriods = (history: any) => {
    const periods: StatusPeriod[] = [];

    // Calculate connectivity periods
    let currentPeriod: StatusPeriod | null = null;
    
    history.connectivity.forEach((status: ConnectivityStatus) => {
      const statusText = status.isConnected ? 'Connected' : 'Disconnected';
      
      if (!currentPeriod) {
        currentPeriod = {
          type: 'connectivity',
          startTime: status.timestamp,
          endTime: null,
          duration: 0,
          status: statusText
        };
      } else if (currentPeriod.status !== statusText) {
        // End current period
        currentPeriod.endTime = status.timestamp;
        const startTime = new Date(currentPeriod.startTime);
        const endTime = new Date(currentPeriod.endTime);
        currentPeriod.duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        periods.push(currentPeriod);

        // Start new period
        currentPeriod = {
          type: 'connectivity',
          startTime: status.timestamp,
          endTime: null,
          duration: 0,
          status: statusText
        };
      }
    });

    // Add current period if exists
    if (currentPeriod) {
      periods.push(currentPeriod);
    }

    // Calculate location periods
    currentPeriod = null;
    
    history.location.forEach((status: LocationStatus) => {
      const statusText = status.isLocationEnabled ? 'Location ON' : 'Location OFF';
      
      if (!currentPeriod) {
        currentPeriod = {
          type: 'location',
          startTime: status.timestamp,
          endTime: null,
          duration: 0,
          status: statusText
        };
      } else if (currentPeriod.status !== statusText) {
        // End current period
        currentPeriod.endTime = status.timestamp;
        const startTime = new Date(currentPeriod.startTime);
        const endTime = new Date(currentPeriod.endTime);
        currentPeriod.duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        periods.push(currentPeriod);

        // Start new period
        currentPeriod = {
          type: 'location',
          startTime: status.timestamp,
          endTime: null,
          duration: 0,
          status: statusText
        };
      }
    });

    // Add current period if exists
    if (currentPeriod) {
      periods.push(currentPeriod);
    }

    setStatusPeriods(periods.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
  };

  const saveAttendanceStatus = async (status: AttendanceStatus) => {
    try {
      await AsyncStorage.setItem('attendanceStatus', JSON.stringify(status));
    } catch (error) {
      console.error('Error saving attendance status:', error);
    }
  };

  const calculateWorkHours = (punchInTime: string, punchOutTime: string | null): string => {
    if (!punchInTime) return '0 hr 0 min';
    
    const punchIn = new Date(punchInTime);
    const punchOut = punchOutTime ? new Date(punchOutTime) : new Date();
    
    const diffMs = punchOut.getTime() - punchIn.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours} hr ${diffMinutes} min`;
  };

  // Check if user has already punched out today
  const hasAlreadyPunchedOutToday = (): boolean => {
    if (!attendanceStatus.punchOutTime) return false;
    
    const punchOutDate = new Date(attendanceStatus.punchOutTime);
    const today = new Date();
    
    return (
      punchOutDate.getDate() === today.getDate() &&
      punchOutDate.getMonth() === today.getMonth() &&
      punchOutDate.getFullYear() === today.getFullYear()
    );
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
    // Check if user has already punched out today
    if (hasAlreadyPunchedOutToday()) {
      Alert.alert(
        'Punch In Not Allowed',
        'You have already punched out today. Multiple punch-ins on the same date are not allowed.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check camera permission first
    if (cameraPermission !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Camera permission is required to take a photo for punch in.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Open camera modal for photo capture
    setCameraModalVisible(true);
  };

  const confirmPunchIn = async (photoUri: string | null) => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const newStatus: AttendanceStatus = {
        ...attendanceStatus,
        isPunchedIn: true,
        punchInTime: now,
        punchOutTime: null,
        todayWorkHours: '0 hr 0 min'
      };
      
      setAttendanceStatus(newStatus);
      saveAttendanceStatus(newStatus);
      
      // Save photo URI if captured
      if (photoUri) {
        await AsyncStorage.setItem('punchInPhoto', photoUri);
        setPunchInPhotoUri(photoUri);
      }
      
      // Update attendance status with photo URI
      const updatedStatus = {
        ...newStatus,
        punchInPhoto: photoUri
      };
      setAttendanceStatus(updatedStatus);
      saveAttendanceStatus(updatedStatus);
      
      // Start ALL tracking systems when punched in
      
      // 1. Start location tracking
      await startTracking();
      
      // 2. Start status tracking (connectivity & location services)
      restartStatusTracking();
      
      // 3. Get initial battery info
      await getBatteryInfo();
      
      // 4. Get current location immediately and DIRECTLY ADD TO HISTORY (bypassing addToLocationHistory conditions)
      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const processedLocation = await processLocationDataWithAddress(currentLocation);
        
        setCurrentLocation(processedLocation);
        setLastUpdateTime(new Date().toLocaleTimeString());
        
        // DIRECTLY ADD TO LOCATION HISTORY - NO CONDITION CHECKS
        if (userData) {
          
          // Get existing locations for today
          const date = new Date().toDateString();
          const existingDateData = userData.locationTracking[date] || [];
          
          // Spoof Detection
          const previousLocation = existingDateData.length > 0 ? existingDateData[existingDateData.length - 1] : undefined;
          const spoofResult = detectSpoofLocation(processedLocation, previousLocation);
          setSpoofDetection(spoofResult);
          
          // Location Validation
          const validationResult = await validateLocationSources(processedLocation);
          setLocationValidation(validationResult);
          
          // Alert if suspicious activity detected
          if (spoofResult.isSuspicious) {
            Alert.alert(
              '⚠️ Suspicious Location Detected',
              `Confidence: ${spoofResult.confidence}%\n\nIndicators:\n${spoofResult.indicators.join('\n')}`,
              [{ text: 'OK' }]
            );
          }
          
          
          const newHistory = [...locationHistory, processedLocation];
          setLocationHistory(newHistory);
          
          // Add to date-wise tracking
          const updatedDateData = [...existingDateData, processedLocation];
          
          const updatedUserData: UserData = {
            ...userData,
            locationTracking: {
              ...userData.locationTracking,
              [date]: updatedDateData
            },
            totalTrackingPoints: newHistory.length,
            lastTrackingUpdate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          setUserData(updatedUserData);
          
          // Save to AsyncStorage
          try {
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
          } catch (error) {
            console.error('Error saving punch-in location:', error);
          }
        }
        
        // Timeline will update automatically via useEffect when data changes
      } catch (error) {
        console.error('Error getting initial location after punch in:', error);
        Alert.alert('Warning', 'Location capture failed, but punch in was successful. Tracking will continue.');
      }
      
      // 5. Update tracking interval display
      updateTrackingIntervalDisplay();
      
      Alert.alert(
        'Success', 
        'Punch In successful!\n\n✅ Location tracking started\n✅ Battery monitoring active\n✅ Connectivity tracking active\n✅ Status monitoring active'
      );
    } catch (error) {
      console.error('Error during punch in:', error);
      Alert.alert('Error', 'Failed to punch in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    // Check camera permission first
    if (cameraPermission !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Camera permission is required to take a photo for punch out.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Open camera modal for photo capture
    setCameraModalVisible(true);
  };

  const confirmPunchOut = async (photoUri: string | null) => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const workHours = calculateWorkHours(attendanceStatus.punchInTime!, now);
      
      const newStatus: AttendanceStatus = {
        ...attendanceStatus,
        isPunchedIn: false,
        punchOutTime: now,
        todayWorkHours: workHours
      };
      
      setAttendanceStatus(newStatus);
      saveAttendanceStatus(newStatus);
      
      // Save photo URI if captured
      if (photoUri) {
        await AsyncStorage.setItem('punchOutPhoto', photoUri);
        setPunchOutPhotoUri(photoUri);
      }
      
      // Update attendance status with photo URI
      const updatedStatus = {
        ...newStatus,
        punchOutPhoto: photoUri
      };
      setAttendanceStatus(updatedStatus);
      saveAttendanceStatus(updatedStatus);
      
      // Stop ALL tracking systems when punched out
      
      // 1. Stop location tracking
      await stopTracking();
      
      // 2. Stop status tracking
      stopStatusTracking();
      
      // 3. Get final battery info
      await getBatteryInfo();
      
      // 4. Get final location
      try {
        const finalLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const processedLocation = await processLocationDataWithAddress(finalLocation);
        setCurrentLocation(processedLocation);
        addToLocationHistory(processedLocation);
        setLastUpdateTime(new Date().toLocaleTimeString());
        

      } catch (error) {
        console.error('Error getting final location after punch out:', error);
      }
      
      // 5. Update tracking interval display
      updateTrackingIntervalDisplay();
      
      Alert.alert(
        'Success', 
        `Punch Out successful!\n\n⏰ Work hours: ${workHours}\n✅ Location tracking stopped\n✅ Battery monitoring stopped\n✅ Connectivity tracking stopped\n✅ Status monitoring stopped`
      );
    } catch (error) {
      console.error('Error during punch out:', error);
      Alert.alert('Error', 'Failed to punch out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      // Check foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      // Check background permission
      if (Platform.OS === 'ios') {
        const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        setBackgroundPermission(backgroundStatus.status);
      }

              // Check camera permission
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(cameraStatus);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to track your location.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  const initializeUserData = async (): Promise<UserData | null> => {
    // Only check for existing real user data
    try {
      const existingUserData = await AsyncStorage.getItem('userData');
      console.log('🔍 Checking for existing user data:', existingUserData ? 'Found' : 'Not found');
      
      if (existingUserData) {
        const parsed = JSON.parse(existingUserData);
        
        // Check if this is real user data
        const isRealUserData = parsed._id || (parsed.name && parsed.name !== 'Field Sales Executive');
        
        if (isRealUserData) {
          console.log('✅ Found real user data:', {
            name: parsed.name,
            executiveId: parsed.executiveId,
            email: parsed.email,
            phone: parsed.phone,
            status: parsed.status
          });
          
          const enhancedData = {
            ...parsed,
            locationTracking: parsed.locationTracking || {},
            totalTrackingPoints: parsed.totalTrackingPoints || 0,
            lastTrackingUpdate: parsed.lastTrackingUpdate || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          console.log('🎯 Enhanced real user data:', {
            name: enhancedData.name,
            executiveId: enhancedData.executiveId,
            locationTrackingKeys: Object.keys(enhancedData.locationTracking),
            totalTrackingPoints: enhancedData.totalTrackingPoints
          });
          
          return enhancedData;
        } else {
          console.log('⚠️ Found dummy data, ignoring it');
          return null;
        }
      }
    } catch (error) {
      console.log('⚠️ Error checking existing user data:', error);
    }
    
    console.log('⚠️ No real user data found');
    return null;
  };

  const loadUserData = async () => {
    try {
      const savedUserData = await AsyncStorage.getItem('userData');
      console.log('🔍 Raw saved user data from AsyncStorage:', savedUserData);
      
      if (savedUserData) {
        const parsedData = JSON.parse(savedUserData);
        console.log('📋 Parsed user data structure:', JSON.stringify(parsedData, null, 2));
        console.log('👤 User details:', {
          name: parsedData.name,
          executiveId: parsedData.executiveId,
          email: parsedData.email,
          phone: parsedData.phone,
          status: parsedData.status,
          locationTracking: parsedData.locationTracking ? 'exists' : 'missing',
          totalTrackingPoints: parsedData.totalTrackingPoints,
          lastTrackingUpdate: parsedData.lastTrackingUpdate
        });
        
        // Check if this is real user data or dummy data
        const isRealUserData = parsedData._id || (parsedData.name && parsedData.name !== 'Field Sales Executive');
        console.log('🔍 Data type check:', isRealUserData ? 'Real user data' : 'Dummy data');
        
        if (isRealUserData) {
          console.log('✅ Loading real user data from login');
          
          // ✅ Preserve real user data, only add location tracking if missing
          const userDataWithTracking = {
            ...parsedData,
            locationTracking: parsedData.locationTracking || {},
            totalTrackingPoints: parsedData.totalTrackingPoints || 0,
            lastTrackingUpdate: parsedData.lastTrackingUpdate || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          console.log('🎯 Final user data with tracking:', {
            name: userDataWithTracking.name,
            executiveId: userDataWithTracking.executiveId,
            locationTrackingKeys: Object.keys(userDataWithTracking.locationTracking),
            totalTrackingPoints: userDataWithTracking.totalTrackingPoints
          });
          
          setUserData(userDataWithTracking);
          
          // Convert date-wise data to flat array for display
          const allLocations: LocationData[] = [];
          Object.values(userDataWithTracking.locationTracking).forEach((dateLocations: any) => {
            allLocations.push(...dateLocations);
          });
          setLocationHistory(allLocations);
          
          console.log('✅ Loaded existing user data:', userDataWithTracking.name, userDataWithTracking.executiveId);
          console.log('📍 Location history loaded:', allLocations.length, 'points');
          
          // Force timeline refresh after loading data
          setTimeout(() => {
            refreshTimeline();
          }, 200);
        } else {
          console.log('⚠️ Found dummy data, ignoring it - waiting for real login');
          // Don't load dummy data, wait for real login
          setUserData(null);
        }
      } else {
        console.log('⚠️ No user data found in AsyncStorage - waiting for login');
        setUserData(null);
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
      setUserData(null);
    }
  };

  const processLocationData = async (location: any): Promise<LocationData> => {
    const rawSpeed = location.coords.speed || 0;
    let processedSpeed = null;
    let isStationary = true;
    
    // Check if accuracy is good enough for reliable speed reading
    const isAccurateEnough = location.coords.accuracy && location.coords.accuracy <= ACCURACY_THRESHOLD;
    
    if (rawSpeed > GPS_NOISE_THRESHOLD && isAccurateEnough) {
      // Only consider speed if it's above noise threshold and accuracy is good
      if (rawSpeed > MIN_SPEED_FOR_ACCURATE_READING) {
        processedSpeed = rawSpeed;
        isStationary = rawSpeed < STATIONARY_SPEED_THRESHOLD;
      }
    }
    
    // Validate timestamp before saving
    let timestamp = new Date(location.timestamp).toISOString();
    const now = new Date();
    const minDate = new Date(2020, 0, 1); // Jan 1, 2020
    const maxDate = new Date(now.getFullYear() + 1, 11, 31); // Dec 31, next year
    
    const parsedTimestamp = new Date(location.timestamp);
    if (isNaN(parsedTimestamp.getTime()) || parsedTimestamp < minDate || parsedTimestamp > maxDate) {
      console.warn('Invalid timestamp detected, using current time:', location.timestamp);
      timestamp = new Date().toISOString();
    }

    // Get battery information
    const batteryInfo = await getBatteryInfo();
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: timestamp, // Use validated timestamp
      accuracy: location.coords.accuracy,
      speed: processedSpeed,
      rawSpeed: rawSpeed, // Store raw speed for debugging
      heading: location.coords.heading,
      isStationary: isStationary,
      batteryLevel: batteryInfo.batteryLevel,
      isCharging: batteryInfo.isCharging,
    };
  };

  const processLocationDataWithAddress = async (location: any): Promise<LocationData> => {
    const baseData = await processLocationData(location);
    
    // Get address asynchronously
    const address = await getAddressFromCoords(
      location.coords.latitude, 
      location.coords.longitude
    );
    
    return {
      ...baseData,
      address: address || undefined,
    };
  };

  const formatSpeed = (speed: number | null): string => {
    if (!speed || speed < GPS_NOISE_THRESHOLD) {
      return '0.00 km/h (Stationary)';
    }
    if (speed < MIN_SPEED_FOR_ACCURATE_READING) {
      return '0.00 km/h (Low Speed)';
    }
    return `${(speed * 3.6).toFixed(2)} km/h`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hr ${remainingMinutes} min`;
    }
  };

  // Spoof Location Detection Functions
  const detectSpoofLocation = (location: LocationData, previousLocation?: LocationData): SpoofDetection => {
    const indicators: string[] = [];
    let confidence = 0;

    // 1. Accuracy Check
    if (location.accuracy && location.accuracy < 5) {
      indicators.push('Unrealistic accuracy (< 5m)');
      confidence += 20;
    }

    // 2. Speed Check
    if (location.speed && location.speed > 50) { // 50 m/s = 180 km/h
      indicators.push('Impossible speed (> 180 km/h)');
      confidence += 30;
    }

    // 3. Sudden Location Jump
    if (previousLocation) {
      const distance = getDistance(
        previousLocation.latitude,
        previousLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      const timeDiff = (new Date(location.timestamp).getTime() - new Date(previousLocation.timestamp).getTime()) / 1000;
      const speed = distance / timeDiff;
      
      if (speed > 100) { // 100 m/s = 360 km/h
        indicators.push(`Sudden location jump (${speed.toFixed(1)} m/s)`);
        confidence += 40;
      }
    }

    // 4. Unrealistic Coordinates
    if (location.latitude === 0 && location.longitude === 0) {
      indicators.push('Null Island coordinates (0,0)');
      confidence += 50;
    }

    // 5. Repeated Locations
    if (previousLocation && 
        Math.abs(location.latitude - previousLocation.latitude) < 0.000001 &&
        Math.abs(location.longitude - previousLocation.longitude) < 0.000001) {
      indicators.push('Exact same coordinates');
      confidence += 15;
    }

    return {
      isSuspicious: confidence > 30,
      indicators,
      confidence: Math.min(confidence, 100),
      timestamp: new Date().toISOString()
    };
  };

  const validateLocationSources = async (location: LocationData): Promise<LocationValidation> => {
    const validation: LocationValidation = {
      accuracy: true,
      speed: true,
      timing: true,
      sensors: true,
      network: true,
      overall: true
    };

    // Accuracy validation
    if (location.accuracy && location.accuracy > 100) {
      validation.accuracy = false;
    }

    // Speed validation
    if (location.speed && location.speed > 30) { // 30 m/s = 108 km/h
      validation.speed = false;
    }

    // Network-based validation (simplified)
    try {
      const response = await fetch('https://ipapi.co/json/');
      const networkData = await response.json();
      
      const networkDistance = getDistance(
        networkData.latitude,
        networkData.longitude,
        location.latitude,
        location.longitude
      );
      
      if (networkDistance > 50000) { // 50km difference
        validation.network = false;
      }
    } catch (error) {
      // Network validation failed, but not necessarily spoofed
    }

    validation.overall = validation.accuracy && validation.speed && validation.timing && validation.network;
    
    return validation;
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in km
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

  const getAddressFromCoords = async (latitude: number, longitude: number): Promise<AddressDetails | null> => {
    const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    
    // Check cache first
    try {
      const savedCache = await AsyncStorage.getItem('addressCache');
      if (savedCache) {
        const cacheData = JSON.parse(savedCache);
        if (cacheData[cacheKey]) {
          return cacheData[cacheKey];
        }
      }
    } catch (error) {
      console.error('Error loading address cache:', error);
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyB7DDN_gUp2zyrlElXtYpjTEQobYiUB9Lg`
      );
      const data = await response.json();
      
      // console.log('=== GOOGLE MAPS API RESPONSE ===');
      // console.log('Full API Response:', JSON.stringify(data, null, 2));
      
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

        // Parse address components
        let localityFound = false;
        let sublocalityFound = false;
        addressComponents.forEach((component: any) => {
          const types = component.types;
          if (types.includes('route')) {
            address.street = component.long_name;
          } else if (types.includes('locality') && !localityFound) {
            address.city = component.long_name;
            localityFound = true;
          } else if (types.includes('sublocality') && !sublocalityFound) {
            // Use sublocality as primary location name
              address.placeName = component.long_name;
            sublocalityFound = true;
          } else if (types.includes('administrative_area_level_1')) {
            address.state = component.long_name;
          } else if (types.includes('country')) {
            address.country = component.long_name;
          } else if (types.includes('postal_code')) {
            address.postalCode = component.long_name;
          }
        });

        // If no sublocality found, use locality as placeName
        if (!address.placeName && address.city) {
          address.placeName = address.city;
        }

        // Ensure we don't use plus_code as placeName
        if (address.placeName && address.placeName.includes('+')) {
          address.placeName = '';
        }

        

        // Cache the address immediately
        try {
          const savedCache = await AsyncStorage.getItem('addressCache');
          const cacheData = savedCache ? JSON.parse(savedCache) : {};
          cacheData[cacheKey] = address;
          await AsyncStorage.setItem('addressCache', JSON.stringify(cacheData));
        } catch (error) {
          console.error('Error saving address cache:', error);
        }
        
        return address;
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
    
    return null;
  };

  const startTracking = async () => {
    try {
      console.log('🚀 Starting location tracking...');
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        console.log('❌ No permissions - tracking failed');
        return;
      }

      // Use expo-location for reliable tracking
      const config = LOCATION_CONFIG[selectedConfig];
      console.log('⚙️ Using config:', config.name, 'Time interval:', config.timeInterval, 'ms, Distance interval:', config.distanceInterval, 'm');
      
      // Get current location first
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: config.timeInterval || undefined,
        distanceInterval: config.distanceInterval || undefined,
      });

      const newLocation = await processLocationDataWithAddress(location);
      console.log('📍 Initial location obtained:', newLocation.latitude, newLocation.longitude);

      setCurrentLocation(newLocation);
      addToLocationHistory(newLocation);
      setLastUpdateTime(new Date().toLocaleTimeString());

      // Start watching location
      console.log('🔍 Starting watchPositionAsync with config:', {
        timeInterval: config.timeInterval || 'undefined',
        distanceInterval: config.distanceInterval || 'undefined'
      });
      
      // For now, let's use a simpler approach - just use the fallback interval
      // This will help us test if the issue is with watchPositionAsync
      console.log('🔍 Using fallback interval only for now');
      
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: config.timeInterval > 0 ? config.timeInterval : undefined,
          distanceInterval: config.distanceInterval > 0 ? config.distanceInterval : undefined,
          mayShowUserSettingsDialog: true,
        },
        async (location) => {
          console.log('📍 Location update received from watchPositionAsync:', location.coords.latitude, location.coords.longitude);
          console.log('⏰ Update time:', new Date().toLocaleTimeString());
          
          const newLocation = await processLocationDataWithAddress(location);
          console.log('newLocation from watchPositionAsync', newLocation);
          setCurrentLocation(newLocation);
          addToLocationHistory(newLocation);
          setLastUpdateTime(new Date().toLocaleTimeString());
        }
      );

      // Set global tracking state
      globalTrackingStatus = true;
      globalLocationSubscription = subscription;
      
      setLocationSubscription(subscription);
      setIsTracking(true);
      
      // Start fallback interval for time-based updates
      startFallbackInterval();
      
      Alert.alert('Success', `Location tracking started with ${config.name}`);
      console.log('✅ Location tracking started successfully');
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  const stopTracking = async () => {
    try {
      console.log('🛑 Stopping location tracking...');
      
      // Stop expo-location subscription if active
      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
        console.log('✅ Location subscription stopped');
      }
      
      // Stop fallback interval
      stopFallbackInterval();
      
      // Clear global tracking state
      globalTrackingStatus = false;
      globalLocationSubscription = null;
      
      setIsTracking(false);
      Alert.alert('Success', 'Location tracking stopped');
      console.log('✅ Location tracking stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping location tracking:', error);
      Alert.alert('Error', 'Failed to stop location tracking');
    }
  };

  const addToLocationHistory = async (location: LocationData) => {
    // ✅ ALWAYS READ FRESH DATA FROM ASYNCSTORAGE
    let freshUserData: UserData | null = null;
    
    try {
      const savedUserData = await AsyncStorage.getItem('userData');
      if (savedUserData) {
        freshUserData = JSON.parse(savedUserData);
        console.log('🔄 Fresh userData loaded from AsyncStorage');
      } else {
        console.log('❌ No fresh userData found in AsyncStorage');
        return;
      }
    } catch (error) {
      console.error('❌ Error loading fresh userData:', error);
      return;
    }
  
    if (!freshUserData) {
      console.log('❌ No fresh user data - location skipped');
      return;
    }
  
    const todayAttendanceStatus = await AsyncStorage.getItem('attendanceStatus');
    const attendanceStatusData = JSON.parse(todayAttendanceStatus || '{}');
  
    console.log('attendanceStatusData', attendanceStatusData);
  
    // Only track location if on duty (punched in)
    const today = new Date().toDateString();
    const punchInDate = attendanceStatusData.punchInTime ? new Date(attendanceStatusData.punchInTime).toDateString() : null;
    const isCurrentlyPunchedIn = punchInDate === today && attendanceStatusData.isPunchedIn;
    
    if (!isCurrentlyPunchedIn) {
      console.log('❌ Not punched in - location skipped. Punch in date:', punchInDate, 'Today:', today);
      return;
    }
  
    console.log('✅ Location received:', location.latitude, location.longitude);
  
    // ✅ Use FRESH userData instead of stale React state
    const date = new Date().toDateString();
    const existingDateData = freshUserData.locationTracking[date] || [];
    
    console.log('🔍 Existing locations for today:', existingDateData.length);
    console.log('🔍 Fresh userData total tracking points:', freshUserData.totalTrackingPoints);
    
    // Spoof Detection
    const previousLocation = existingDateData.length > 0 ? existingDateData[existingDateData.length - 1] : undefined;
    const spoofResult = detectSpoofLocation(location, previousLocation);
    setSpoofDetection(spoofResult);
    
    // Location Validation
    const validationResult = await validateLocationSources(location);
    setLocationValidation(validationResult);
    
    // Alert if suspicious activity detected
    if (spoofResult.isSuspicious) {
      Alert.alert(
        '⚠️ Suspicious Location Detected',
        `Confidence: ${spoofResult.confidence}%\n\nIndicators:\n${spoofResult.indicators.join('\n')}`,
        [{ text: 'OK' }]
      );
    }
    
    // Check distance from previous location (if exists)
    if (existingDateData.length > 0) {
      const lastLocation = existingDateData[existingDateData.length - 1];
      const distance = getDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      const minDistance = LOCATION_CONFIG[selectedConfig].distanceInterval;
      
      if (distance < minDistance) {
        console.log(`📍 Location skipped - distance too small: ${distance.toFixed(2)}m (min: ${minDistance}m)`);
        return;
      }
      
      console.log(`✅ Location saved - distance: ${distance.toFixed(2)}m (min: ${minDistance}m)`);
    } else {
      console.log('✅ First location of the day - saving');
    }
  
    console.log('Tracking config:', LOCATION_CONFIG[selectedConfig].name);
    console.log('Distance interval:', LOCATION_CONFIG[selectedConfig].distanceInterval, 'meters');
  
    // ✅ Add to date-wise tracking with proper increment
    const updatedDateData = [...existingDateData, location];
    
    // ✅ Create updated userData with incremented count
    const updatedUserData: UserData = {
      ...freshUserData,
      locationTracking: {
        ...freshUserData.locationTracking,
        [date]: updatedDateData
      },
      totalTrackingPoints: freshUserData.totalTrackingPoints + 1, // ✅ Proper increment
      lastTrackingUpdate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // ✅ Update React state with fresh complete history
    const completeHistory: LocationData[] = [];
    Object.values(updatedUserData.locationTracking).forEach((dateLocations: any) => {
      completeHistory.push(...dateLocations);
    });
    
    // Sort by timestamp
    completeHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log('📍 Complete history length BEFORE update:', completeHistory.length - 1);
    console.log('📍 Complete history length AFTER update:', completeHistory.length);
    
    // ✅ Update both React states
    setLocationHistory(completeHistory);
    setUserData(updatedUserData);
    
    // ✅ Save to AsyncStorage
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      console.log('✅ Location saved successfully with', updatedDateData.length, 'locations for today');
      console.log('📍 Total locations in complete history:', completeHistory.length);
      console.log('📍 Updated userData total tracking points:', updatedUserData.totalTrackingPoints);
      
      // Force timeline refresh by updating a dependency
      setLastUpdateTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const getAvailableDates = () => {
    if (!userData) return [];
    return Object.keys(userData.locationTracking).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  // Get the last location from history
  const getLastLocationFromHistory = (): LocationData | null => {
    if (!userData) return null;
    
    const dataToShow = selectedDate 
      ? (userData.locationTracking[selectedDate] || [])
      : locationHistory;
    
    if (dataToShow.length > 0) {
      return dataToShow[dataToShow.length - 1]; // Return the last location
    }
    return null;
  };

  // Get status history for today
  const getTodayStatusHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('statusHistory');

      console.log('savedHistory', savedHistory);
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        const today = new Date().toDateString();
        
        // Filter today's status changes
        const todayConnectivity = history.connectivity?.filter((status: ConnectivityStatus) => {
          const statusDate = new Date(status.timestamp).toDateString();
          return statusDate === today;
        }) || [];
        
        const todayLocationStatus = history.location?.filter((status: LocationStatus) => {
          const statusDate = new Date(status.timestamp).toDateString();
          return statusDate === today;
        }) || [];
        
        return { connectivity: todayConnectivity, location: todayLocationStatus };
      }
    } catch (error) {
      console.error('Error loading status history:', error);
    }
    return { connectivity: [], location: [] };
  };

  // Create combined timeline with punch in/out events
  const createCombinedTimeline = async () => {
    console.log('=== createCombinedTimeline Debug ===');
    console.log('userData exists:', !!userData);
    console.log('attendanceStatus.isPunchedIn:', attendanceStatus.isPunchedIn);
    console.log('attendanceStatus.punchInTime:', attendanceStatus.punchInTime);
    console.log('locationHistory length:', locationHistory.length);
    console.log('selectedDate:', selectedDate);
    
    const statusHistory = await getTodayStatusHistory();
    const timeline: any[] = [];
    
    // Add null check for userData
    if (!userData) {
      console.log('userData is null, returning empty timeline');
      return timeline;
    }
    
    const dataToShow = selectedDate 
      ? (userData.locationTracking[selectedDate] || [])
      : locationHistory;
    
    console.log('dataToShow length:', dataToShow.length);
    console.log('Today date:', new Date().toDateString());
    console.log('userData.locationTracking keys:', Object.keys(userData.locationTracking));
    
    // Add punch in/out events
    if (attendanceStatus.punchInTime) {
      console.log('Adding punch in event to timeline');
      
      // Find the location that was captured during punch in (same timestamp or closest)
      const punchInTime = new Date(attendanceStatus.punchInTime).getTime();
      const punchInLocation = dataToShow.find(location => {
        const locationTime = new Date(location.timestamp).getTime();
        const timeDiff = Math.abs(locationTime - punchInTime);
        return timeDiff < 60000; // Within 1 minute of punch in
      });
      
      timeline.push({
        type: 'punchIn',
        data: {
          time: attendanceStatus.punchInTime,
          photo: punchInPhotoUri,
          location: punchInLocation // Include location in punch in event
        },
        timestamp: punchInTime
      });
    }
    
    if (attendanceStatus.punchOutTime) {
      timeline.push({
        type: 'punchOut',
        data: {
          time: attendanceStatus.punchOutTime,
          photo: punchOutPhotoUri
        },
        timestamp: new Date(attendanceStatus.punchOutTime).getTime()
      });
    }
    
    // Add only significant location points (every 5th point or when address changes)
    console.log('Processing', dataToShow.length, 'location points for timeline');
    let lastAddress = '';
    dataToShow.forEach((location, index) => {
      const currentAddress = location.address?.placeName || location.address?.formattedAddress || '';
      
      // Skip location if it's the same as punch in location (to avoid duplication)
      const punchInTime = attendanceStatus.punchInTime ? new Date(attendanceStatus.punchInTime).getTime() : 0;
      const locationTime = new Date(location.timestamp).getTime();
      const isPunchInLocation = Math.abs(locationTime - punchInTime) < 60000; // Within 1 minute
      
      const isSignificantLocation = 
        index % 5 === 0 || // Every 5th location
        currentAddress !== lastAddress || // Address changed
        index === dataToShow.length - 1; // Last location
      
      if (isSignificantLocation && !isPunchInLocation) {
        console.log('Adding location', index + 1, 'to timeline:', currentAddress);
        timeline.push({
          type: 'location',
          data: location,
          timestamp: new Date(location.timestamp).getTime(),
          index: index + 1,
          isSignificant: true
        });
        lastAddress = currentAddress;
      } else if (isPunchInLocation) {
        console.log('Skipping punch-in location as it will be shown in punch-in event');
      }
    });
    
    console.log('Total timeline items after locations:', timeline.length);
    
    // Add only connectivity status changes (not every check)
    const connectivityChanges: any[] = [];
    statusHistory.connectivity.forEach((status: ConnectivityStatus, index: number) => {
      if (index === 0) {
        // First status
        connectivityChanges.push({
          type: 'connectivity',
          data: status,
          timestamp: new Date(status.timestamp).getTime()
        });
      } else {
        // Only add if status changed from previous
        const previousStatus = statusHistory.connectivity[index - 1];
        if (previousStatus.isConnected !== status.isConnected) {
          connectivityChanges.push({
            type: 'connectivity',
            data: status,
            timestamp: new Date(status.timestamp).getTime()
          });
        }
      }
    });
    timeline.push(...connectivityChanges);
    
    // Add only location service status changes
    const locationServiceChanges: any[] = [];
    statusHistory.location.forEach((status: LocationStatus, index: number) => {
      if (index === 0) {
        // First status
        locationServiceChanges.push({
          type: 'locationService',
          data: status,
          timestamp: new Date(status.timestamp).getTime()
        });
      } else {
        // Only add if status changed from previous
        const previousStatus = statusHistory.location[index - 1];
        if (previousStatus.isLocationEnabled !== status.isLocationEnabled) {
          locationServiceChanges.push({
            type: 'locationService',
            data: status,
            timestamp: new Date(status.timestamp).getTime()
          });
        }
      }
    });
    timeline.push(...locationServiceChanges);
    
    // Sort by timestamp (newest first)
    const sortedTimeline = timeline.sort((a, b) => b.timestamp - a.timestamp);
    console.log('Final timeline length:', sortedTimeline.length);
    console.log('Timeline items:', sortedTimeline.map(item => ({ type: item.type, timestamp: new Date(item.timestamp).toLocaleTimeString() })));
    console.log('=== End createCombinedTimeline Debug ===');
    return sortedTimeline;
  };

  // Load timeline when data changes
  useEffect(() => {
    const loadTimeline = async () => {
      if (!userData) return;
      setLoadingTimeline(true);
      const combinedTimeline = await createCombinedTimeline();
      setTimeline(combinedTimeline);
      setLoadingTimeline(false);
    };
    
    loadTimeline();
  }, [userData, locationHistory, selectedDate, attendanceStatus.punchInTime, attendanceStatus.punchOutTime, lastUpdateTime]);

  const renderHistorySection = () => {
    if (!userData) return null;

      const renderTimelineItem = (item: any, index: number) => {
    const timestamp = new Date(item.timestamp).toLocaleTimeString();
    const toTime = new Date(item.timestamp).toLocaleTimeString();
    
    if (item.type === 'punchIn') {
      const punchData = item.data;
      return (
        <View key={`punchIn-${item.timestamp}-${index}`} style={styles.periodCard}>
          <View style={styles.periodHeader}>
            <Text style={styles.periodType}>
              🟢 PUNCH IN
            </Text>
            <Text style={styles.periodStatus}>
              Work Started
            </Text>
          </View>
          
          <View style={styles.periodDetails}>
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Time:</Text>
              <Text style={styles.periodValue}>{timestamp} to {toTime}</Text>
            </View>
            
            {/* Show location information if available */}
            {punchData.location && (
              <>
                <View style={styles.periodRow}>
                  <Text style={styles.periodLabel}>Location:</Text>
                  <Text style={styles.periodValue}>
                    {punchData.location.address?.placeName || punchData.location.address?.city || 'Unknown Location'}
                  </Text>
                </View>
                
                <View style={styles.periodRow}>
                  <Text style={styles.periodLabel}>Coordinates:</Text>
                  <Text style={styles.periodValue}>
                    {punchData.location.latitude.toFixed(6)}, {punchData.location.longitude.toFixed(6)}
                  </Text>
                </View>
                
                {punchData.location.address?.formattedAddress && (
                  <View style={[styles.periodRow, styles.addressRow]}>
                    <Text style={styles.periodLabel}>Address:</Text>
                    <Text style={[styles.periodValue, styles.addressText]}>
                      {punchData.location.address.formattedAddress}
                    </Text>
                  </View>
                )}
                
                {/* Show battery information if available */}
                {punchData.location.batteryLevel !== null && punchData.location.batteryLevel !== undefined && (
                  <View style={styles.periodRow}>
                    <Text style={styles.periodLabel}>Battery:</Text>
                    <Text style={styles.periodValue}>
                      {Math.round(punchData.location.batteryLevel * 100)}% {punchData.location.isCharging ? '🔌' : '🔋'}
                    </Text>
                  </View>
                )}
              </>
            )}
            
            {punchData.photo && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Photo:</Text>
                <TouchableOpacity onPress={() => {
                  setSelectedPhotoUri(punchData.photo);
                  setPhotoViewerModalVisible(true);
                }}>
                  <Image source={{ uri: punchData.photo }} style={styles.timelinePhoto} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    } else if (item.type === 'punchOut') {
      const punchData = item.data;
      const toTime = new Date(item.timestamp).toLocaleTimeString();
      return (
        <View key={`punchOut-${item.timestamp}-${index}`} style={styles.periodCard}>
          <View style={styles.periodHeader}>
            <Text style={styles.periodType}>
              🔴 PUNCH OUT
            </Text>
            <Text style={styles.periodStatus}>
              Work Ended
            </Text>
          </View>
          
          <View style={styles.periodDetails}>
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Time:</Text>
              <Text style={styles.periodValue}>{timestamp} to {toTime}</Text>
            </View>
            
            <View style={styles.periodRow}>
              <Text style={styles.periodLabel}>Work Hours:</Text>
              <Text style={styles.periodValue}>{attendanceStatus.todayWorkHours}</Text>
            </View>
            
            {punchData.photo && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Photo:</Text>
                <TouchableOpacity onPress={() => {
                  setSelectedPhotoUri(punchData.photo);
                  setPhotoViewerModalVisible(true);
                }}>
                  <Image source={{ uri: punchData.photo }} style={styles.timelinePhoto} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    } else if (item.type === 'location') {
        const location = item.data;
        return (
          <View key={`location-${item.timestamp}-${index}`} style={styles.periodCard}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodType}>
                📍 LOCATION #{item.index}
            </Text>
              <Text style={styles.periodStatus}>
                {location.address?.placeName || location.address?.city || location.address?.formattedAddress?.split(',')[0] || 'Unknown Location'}
            </Text>
            </View>
            
            <View style={styles.periodDetails}>
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Time:</Text>
                <Text style={styles.periodValue}>{timestamp}</Text>
              </View>
              
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Coordinates:</Text>
                <Text style={styles.periodValue}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
              </View>
              
            {location.address && (
                <View style={[styles.periodRow, styles.addressRow]}>
                  <Text style={styles.periodLabel}>Address:</Text>
                  <Text style={[styles.periodValue, styles.addressText]}>
                    {location.address.formattedAddress}
              </Text>
                </View>
              )}
              
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Speed:</Text>
                <Text style={styles.periodValue}>
                  {formatSpeed(location.speed || null)}
            </Text>
              </View>
              
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Accuracy:</Text>
                <Text style={styles.periodValue}>
                  {location.accuracy?.toFixed(2)}m
                </Text>
              </View>
              
              {/* Show battery information if available */}
              {location.batteryLevel !== null && location.batteryLevel !== undefined && (
                <View style={styles.periodRow}>
                  <Text style={styles.periodLabel}>Battery:</Text>
                  <Text style={styles.periodValue}>
                    {Math.round(location.batteryLevel * 100)}% {location.isCharging ? '🔌' : '🔋'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      } else if (item.type === 'connectivity') {
        const status = item.data;
        return (
          <View key={`connectivity-${item.timestamp}-${index}`} style={styles.periodCard}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodType}>
                🌐 CONNECTIVITY
              </Text>
              <Text style={[
                styles.periodStatus,
                { color: status.isConnected ? '#4CAF50' : '#f44336' }
              ]}>
                {status.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </Text>
            </View>
            
            <View style={styles.periodDetails}>
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Time:</Text>
                <Text style={styles.periodValue}>{timestamp}</Text>
              </View>
              
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Type:</Text>
                <Text style={styles.periodValue}>{status.connectionType || 'Unknown'}</Text>
              </View>
              
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Reachable:</Text>
                <Text style={styles.periodValue}>
                  {status.isInternetReachable ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          </View>
        );
      } else if (item.type === 'locationService') {
        const status = item.data;
        return (
          <View key={`locationService-${item.timestamp}-${index}`} style={styles.periodCard}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodType}>
                📍 LOCATION SERVICE
              </Text>
              <Text style={[
                styles.periodStatus,
                { color: status.isLocationEnabled ? '#4CAF50' : '#f44336' }
              ]}>
                {status.isLocationEnabled ? '🟢 Location ON' : '🔴 Location OFF'}
              </Text>
            </View>
            
            <View style={styles.periodDetails}>
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Time:</Text>
                <Text style={styles.periodValue}>{timestamp}</Text>
              </View>
              
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Permission:</Text>
                <Text style={styles.periodValue}>{status.permissionStatus || 'Unknown'}</Text>
              </View>
            </View>
          </View>
        );
      }
    };

    return (
      <View style={styles.history}>
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>📈 Today's Timeline</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshTimeline}
          >
            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
        
        {loadingTimeline ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading timeline...</Text>
          </View>
        ) : timeline.length > 0 ? (
          timeline.map((item, index) => renderTimelineItem(item, index))
        ) : (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataText}>No timeline data available</Text>
            <Text style={styles.noDataSubtext}>Location tracking and status monitoring will begin automatically</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        {userData ? (
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userData.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>{userData.name || 'Employee Name'}</Text>
              <Text style={styles.userId}>ID: {userData.executiveId || 'EMP001'}</Text>
              <Text style={styles.userStatus}>{userData.status || 'Active'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>Please Login</Text>
              <Text style={styles.userId}>No user data available</Text>
              <Text style={styles.userStatus}>Login required</Text>
            </View>
          </View>
        )}
      </View>

      {/* Attendance Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Today's Attendance</Text>
          <View style={[styles.statusIndicator, { backgroundColor: attendanceStatus.isPunchedIn ? '#4CAF50' : '#f44336' }]}>
            <Text style={styles.statusText}>
              {attendanceStatus.isPunchedIn ? '🟢 ON DUTY' : '🔴 OFF DUTY'}
            </Text>
          </View>
        </View>
        
        <View style={styles.timeInfo}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Punch In</Text>
            <Text style={styles.timeValue}>
              {attendanceStatus.punchInTime ? new Date(attendanceStatus.punchInTime).toLocaleTimeString() : '--:--'}
            </Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Punch Out</Text>
            <Text style={styles.timeValue}>
              {attendanceStatus.punchOutTime ? new Date(attendanceStatus.punchOutTime).toLocaleTimeString() : '--:--'}
            </Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Work Hours</Text>
            <Text style={styles.timeValue}>{attendanceStatus.todayWorkHours}</Text>
          </View>
        </View>
        
        {/* Photo Preview Section */}
        <View style={styles.photoSection}>
          <Text style={styles.photoTitle}>📸 Attendance Photos</Text>
          <View style={styles.photoContainer}>
            {attendanceStatus.punchInTime && (
              <View style={styles.photoItem}>
                <Text style={styles.photoLabel}>Punch In</Text>
                {punchInPhotoUri ? (
                  <TouchableOpacity onPress={() => {
                    setSelectedPhotoUri(punchInPhotoUri);
                    setPhotoViewerModalVisible(true);
                  }}>
                    <Image source={{ uri: punchInPhotoUri }} style={styles.photoImage} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoIcon}>📷</Text>
                    <Text style={styles.photoText}>Photo Captured</Text>
                  </View>
                )}
              </View>
            )}
            {attendanceStatus.punchOutTime && (
              <View style={styles.photoItem}>
                <Text style={styles.photoLabel}>Punch Out</Text>
                {punchOutPhotoUri ? (
                  <TouchableOpacity onPress={() => {
                    setSelectedPhotoUri(punchOutPhotoUri);
                    setPhotoViewerModalVisible(true);
                  }}>
                    <Image source={{ uri: punchOutPhotoUri }} style={styles.photoImage} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoIcon}>📷</Text>
                    <Text style={styles.photoText}>Photo Captured</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Current Location Card */}
      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>📍 Last Known Location</Text>
        {(() => {
          const lastLocation = getLastLocationFromHistory();
          return (
            <>
              <Text style={styles.locationText}>
                {lastLocation?.address?.formattedAddress || attendanceStatus.currentLocation}
              </Text>
              {lastLocation && (
                <View style={styles.locationDetails}>
                  <Text style={styles.locationDetail}>
                    📍 Lat: {lastLocation.latitude.toFixed(6)}, Long: {lastLocation.longitude.toFixed(6)}
                  </Text>
                  <Text style={styles.locationDetail}>
                    🚗 Speed: {formatSpeed(lastLocation.speed || null)}
                  </Text>
                  <Text style={styles.locationDetail}>
                    ⏰ Last Update: {new Date(lastLocation.timestamp).toLocaleTimeString()}
                  </Text>
                  {lastLocation.batteryLevel !== null && lastLocation.batteryLevel !== undefined && (
                    <Text style={styles.locationDetail}>
                      🔋 Battery: {Math.round(lastLocation.batteryLevel * 100)}% {lastLocation.isCharging ? '🔌' : ''}
                    </Text>
                  )}
                </View>
              )}
            </>
          );
        })()}
      </View>

      {/* Location Tracking Mode Selection */}
      <View style={styles.trackingModeSection}>
        <Text style={styles.sectionTitle}>⚙️ Location Tracking Mode</Text>
        
        <View style={styles.trackingModeCard}>
          <Text style={styles.trackingModeDescription}>
            Select how frequently you want to track your location. Different modes offer different balances of accuracy, battery life, and data usage.
          </Text>
          
          <View style={styles.trackingModeGrid}>
            {Object.entries(LOCATION_CONFIG).map(([key, config]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.trackingModeButton,
                  selectedConfig === key && styles.selectedTrackingModeButton
                ]}
                onPress={() => {
                  setSelectedConfig(key as any);
                  saveSelectedConfig(key);
                }}
                disabled={isTracking}
              >
                <View style={styles.trackingModeHeader}>
                  <Text style={[
                    styles.trackingModeName,
                    selectedConfig === key && styles.selectedTrackingModeName
                  ]}>
                    {config.name}
                  </Text>
                  {selectedConfig === key && (
                    <Text style={styles.selectedIndicator}>✓</Text>
                  )}
                </View>
                
                <View style={styles.trackingModeDetails}>
                  <View style={styles.trackingModeDetail}>
                    <Text style={[
                      styles.trackingModeLabel,
                      selectedConfig === key && styles.selectedTrackingModeLabel
                    ]}>
                      Time:
                    </Text>
                    <Text style={[
                      styles.trackingModeValue,
                      selectedConfig === key && styles.selectedTrackingModeValue
                    ]}>
                      {config.timeInterval === 0 ? 'Auto' : `${config.timeInterval / 1000}s`}
                    </Text>
                  </View>
                  
                  <View style={styles.trackingModeDetail}>
                    <Text style={[
                      styles.trackingModeLabel,
                      selectedConfig === key && styles.selectedTrackingModeLabel
                    ]}>
                      Distance:
                    </Text>
                    <Text style={[
                      styles.trackingModeValue,
                      selectedConfig === key && styles.selectedTrackingModeValue
                    ]}>
                      {config.distanceInterval}m
                    </Text>
                  </View>
                </View>
                
                {isTracking && selectedConfig === key && (
                  <View style={styles.activeIndicator}>
                    <Text style={styles.activeIndicatorText}>🟢 Active</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {isTracking && (
            <View style={styles.trackingModeWarning}>
              <Text style={styles.trackingModeWarningText}>
                ⚠️ Mode cannot be changed while tracking is active. Stop tracking first to change mode.
              </Text>
            </View>
          )}
          
          <View style={styles.currentModeInfo}>
            <Text style={styles.currentModeLabel}>Current Mode:</Text>
            <Text style={styles.currentModeValue}>
              {LOCATION_CONFIG[selectedConfig].name}
            </Text>
            <Text style={styles.currentModeDetails}>
              Time: {LOCATION_CONFIG[selectedConfig].timeInterval === 0 ? 'Auto' : `${LOCATION_CONFIG[selectedConfig].timeInterval / 1000}s`} | 
              Distance: {LOCATION_CONFIG[selectedConfig].distanceInterval}m
            </Text>
          </View>
          
          {/* Debug Button */}
          {isTracking && (
            <TouchableOpacity
              style={styles.debugButton}
              onPress={debugLocationUpdate}
            >
              <Text style={styles.debugButtonText}>🔧 Manual Location Update</Text>
            </TouchableOpacity>
          )}
          
          {/* Test Fallback Interval Button */}
          {isTracking && (
            <TouchableOpacity
              style={[styles.debugButton, { backgroundColor: '#9c27b0', marginTop: 5 }]}
              onPress={() => {
                console.log('🧪 Testing fallback interval manually');
                startFallbackInterval();
              }}
            >
              <Text style={styles.debugButtonText}>🧪 Test Fallback Interval</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Punch In/Out Buttons */}
      <View style={styles.actionSection}>
        {!attendanceStatus.isPunchedIn ? (
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.punchInButton,
              hasAlreadyPunchedOutToday() && styles.disabledButton
            ]}
            onPress={handlePunchIn}
            disabled={loading || hasAlreadyPunchedOutToday()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : hasAlreadyPunchedOutToday() ? (
              <>
                <Text style={styles.actionButtonIcon}>🚫</Text>
                <Text style={styles.actionButtonText}>ALREADY PUNCHED OUT TODAY</Text>
              </>
            ) : (
              <>
                <Text style={styles.actionButtonIcon}>🟢</Text>
                <Text style={styles.actionButtonText}>PUNCH IN</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.punchOutButton]}
            onPress={handlePunchOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.actionButtonIcon}>🔴</Text>
                <Text style={styles.actionButtonText}>PUNCH OUT</Text>
                <Text style={styles.actionButtonSubtext}>End your work day</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tracking Status Section */}
      <View style={styles.trackingStatusSection}>
        <Text style={styles.sectionTitle}>📊 Tracking Status</Text>
        
        <View style={styles.trackingStatusCard}>
          <View style={styles.trackingStatusHeader}>
            <Text style={styles.trackingStatusTitle}>Current Status</Text>
            <View style={[
              styles.trackingStatusIndicator,
              { backgroundColor: attendanceStatus.isPunchedIn ? '#4CAF50' : '#f44336' }
            ]}>
              <Text style={styles.trackingStatusText}>
                {attendanceStatus.isPunchedIn ? '🟢 TRACKING ACTIVE' : '🔴 TRACKING INACTIVE'}
              </Text>
            </View>
          </View>
          
          <View style={styles.trackingStatusDetails}>
            <View style={styles.trackingStatusRow}>
              <Text style={styles.trackingStatusLabel}>Location Tracking:</Text>
              <Text style={[
                styles.trackingStatusValue,
                { color: isTracking ? '#4CAF50' : '#f44336' }
              ]}>
                {isTracking ? '✅ Active' : '❌ Inactive'}
              </Text>
            </View>
            
            <View style={styles.trackingStatusRow}>
              <Text style={styles.trackingStatusLabel}>Status Monitoring:</Text>
              <Text style={[
                styles.trackingStatusValue,
                { color: attendanceStatus.isPunchedIn ? '#4CAF50' : '#f44336' }
              ]}>
                {attendanceStatus.isPunchedIn ? '✅ Active' : '❌ Inactive'}
              </Text>
            </View>
            
            <View style={styles.trackingStatusRow}>
              <Text style={styles.trackingStatusLabel}>Battery Monitoring:</Text>
              <Text style={[
                styles.trackingStatusValue,
                { color: currentBatteryLevel !== null ? '#4CAF50' : '#f44336' }
              ]}>
                {currentBatteryLevel !== null ? '✅ Active' : '❌ Inactive'}
              </Text>
            </View>
            
            <View style={styles.trackingStatusRow}>
              <Text style={styles.trackingStatusLabel}>Last Update:</Text>
              <Text style={styles.trackingStatusValue}>
                {lastUpdateTime || 'Never'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      {/* Today's History */}
      {renderHistorySection()}

   
      {/* Testing Section - Clear Storage */}
      <View style={styles.testingSection}>
        <Text style={styles.sectionTitle}>🧪 Testing Tools</Text>
        
        <View style={styles.testingCard}>
          <Text style={styles.testingTitle}>Clear Attendance Data</Text>
          <Text style={styles.testingDescription}>
            This will clear attendance data including location history, punch in/out records, and photos. User login information will be preserved. Use for testing only.
          </Text>
          
          <TouchableOpacity
            style={styles.clearDataButton}
            onPress={() => {
              Alert.alert(
                'Clear Attendance Data',
                'This will delete attendance data including:\n• Location history\n• Attendance records\n• Photos\n• Status history\n\nUser login information will be preserved.\n\nThis action cannot be undone. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Clear Attendance Data', 
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        // Clear only attendance-related data, preserve user login data
                        await AsyncStorage.removeItem('attendanceStatus');
                        await AsyncStorage.removeItem('punchInPhoto');
                        await AsyncStorage.removeItem('punchOutPhoto');
                        await AsyncStorage.removeItem('statusHistory');
                        await AsyncStorage.removeItem('selectedTrackingConfig');
                        await AsyncStorage.removeItem('addressCache');
                        
                        // Clear location tracking data from userData but preserve user info
                        const currentUserData = await AsyncStorage.getItem('userData');
                        if (currentUserData) {
                          const userData = JSON.parse(currentUserData);
                          const clearedUserData = {
                            ...userData,
                            locationTracking: {},
                            combinedTimeline: {},
                            totalTrackingPoints: 0,
                            lastTrackingUpdate: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          };
                          await AsyncStorage.setItem('userData', JSON.stringify(clearedUserData));
                        }
                        
                        Alert.alert('Success', 'Attendance data has been cleared successfully. User login information preserved.');
                        
                        // Reset attendance-related state only
                        setLocationHistory([]);
                        setAttendanceStatus({
                          isPunchedIn: false,
                          punchInTime: null,
                          punchOutTime: null,
                          todayWorkHours: '0 hr 0 min',
                          currentLocation: 'Unknown Location'
                        });
                        setPunchInPhotoUri(null);
                        setPunchOutPhotoUri(null);
                        setTimeline([]);
                        setCurrentLocation(null);
                        setLastUpdateTime('');
                        
                        // Reload data (user data will be preserved)
                        loadUserData();
                        loadAttendanceStatus();
                        loadSavedPhotos();
                        loadStatusHistory();
                        getBatteryInfo();
                      } catch (error) {
                        console.error('Error clearing attendance data:', error);
                        Alert.alert('Error', 'Failed to clear attendance data. Please try again.');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.clearDataButtonText}>🗑️ Clear Attendance Data</Text>
          </TouchableOpacity>
        </View>
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
            facing={cameraType}
            ref={(ref) => setCameraRef(ref)}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setCameraModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>
                  {attendanceStatus.isPunchedIn ? 'Punch Out Photo' : 'Punch In Photo'}
                </Text>
                <View style={styles.placeholder} />
              </View>
              
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={async () => {
                    const photoUri = await takePicture();
                    if (photoUri) {
                      if (attendanceStatus.isPunchedIn) {
                        await confirmPunchOut(photoUri);
                      } else {
                        await confirmPunchIn(photoUri);
                      }
                    }
                  }}
                >
                  <Text style={styles.captureButtonText}>📸</Text>
                </TouchableOpacity>
              </View>
                          </View>
            </CameraView>
                  </View>
      </Modal>

      {/* Photo Viewer Modal */}
      <Modal
        visible={photoViewerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoViewerModalVisible(false)}
      >
        <View style={styles.photoViewerOverlay}>
          <View style={styles.photoViewerContainer}>
            <View style={styles.photoViewerHeader}>
              <TouchableOpacity
                style={styles.photoViewerCloseButton}
                onPress={() => setPhotoViewerModalVisible(false)}
              >
                <Text style={styles.photoViewerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedPhotoUri && (
              <Image 
                source={{ uri: selectedPhotoUri }} 
                style={styles.photoViewerImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  userInfo: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 5,
    fontWeight: 'bold',
  },
  permissionStatus: {
    fontSize: 14,
    marginTop: 10,
    fontWeight: 'bold',
  },
  configSection: {
    margin: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  configButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  configExplanation: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333',
  },
  configButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
    minWidth: '30%',
  },
  selectedConfigButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  configButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  selectedConfigButtonText: {
    color: '#fff',
  },
  controls: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  getLocationButton: {
    backgroundColor: '#2196F3',
  },
  exportButton: {
    backgroundColor: '#9C27B0',
  },
  clearButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  updateInfo: {
    margin: 20,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
  },
  updateText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  currentLocation: {
    margin: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  history: {
    margin: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateFilter: {
    marginTop: 10,
    marginBottom: 15,
  },
  dateFilterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  selectedDateButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dateButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  selectedDateButtonText: {
    color: '#fff',
  },
  historyItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  historyText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  headerSection: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  statusCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  locationCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  locationDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  locationDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  actionSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  punchInButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  punchOutButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
  },
  trackingCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    alignItems: 'center',
  },
  trackingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  trackingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  trackingSubtext: {
    fontSize: 12,
    color: '#999',
  },
  permissionCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionLabel: {
    fontSize: 14,
    color: '#666',
  },
  permissionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  historyContent: {
    alignItems: 'center',
  },
  historyCount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  historySubtext: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  viewHistoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  viewHistoryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noHistoryText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  noHistorySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  // Status Tracking Styles
  statusTrackingSection: {
    margin: 20,
  },
  statusHistorySection: {
    marginTop: 15,
  },
  statusHistoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  periodCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  periodStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  periodDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  periodLabel: {
    fontSize: 11,
    color: '#666',
  },
  periodValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  noDataCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  noDataSubtext: {
    fontSize: 11,
    color: '#999',
  },
  // Spoof Detection Styles
  spoofDetectionSection: {
    margin: 20,
  },
  spoofCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  spoofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  spoofTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  spoofConfidence: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  indicatorsSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  indicatorsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  indicatorText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  validationCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  validationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  validationLabel: {
    fontSize: 14,
    color: '#666',
  },
  validationValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Timeline styles
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  timelineTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  statusChangeItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  statusChangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  // Status history styles
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  addressText: {
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 16,
    right:0,
    marginLeft: 10,
  },
  addressRow: {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  // Camera styles
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
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 50,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  captureButtonText: {
    fontSize: 32,
  },
  // Photo styles
  photoSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  photoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  photoItem: {
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  photoIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  photoText: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
  photoImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  // Photo viewer styles
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    backgroundColor: '#fff',
  },
  photoViewerCloseButton: {
    padding: 5,
  },
  photoViewerCloseText: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
  },
  photoViewerImage: {
    flex: 1,
    width: '100%',
  },
  timelinePhoto: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  // Tracking interval styles
  trackingIntervalCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackingIntervalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  trackingIntervalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingIntervalLabel: {
    fontSize: 14,
    color: '#666',
  },
  trackingIntervalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  trackingIntervalInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  // Battery styles
  batteryStatusSection: {
    margin: 20,
  },
  batteryCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  batteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  batteryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  batteryLevel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  batteryDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  batteryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  batteryLabel: {
    fontSize: 14,
    color: '#666',
  },
  batteryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  // Testing styles
  testingSection: {
    margin: 20,
  },
  testingCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  testingDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 15,
  },
  clearDataButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearDataButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Tracking status styles
  trackingStatusSection: {
    margin: 20,
  },
  trackingStatusCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackingStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackingStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  trackingStatusIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  // Tracking mode selection styles
  trackingModeSection: {
    margin: 20,
  },
  trackingModeCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackingModeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  trackingModeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  trackingModeButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    minHeight: 100,
  },
  selectedTrackingModeButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  trackingModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingModeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  selectedTrackingModeName: {
    color: '#2196F3',
  },
  selectedIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  trackingModeDetails: {
    marginTop: 5,
  },
  trackingModeDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  trackingModeLabel: {
    fontSize: 12,
    color: '#666',
  },
  selectedTrackingModeLabel: {
    color: '#2196F3',
  },
  trackingModeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedTrackingModeValue: {
    color: '#2196F3',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeIndicatorText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  trackingModeWarning: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
  },
  trackingModeWarningText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  currentModeInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  currentModeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  currentModeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  currentModeDetails: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trackingStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  trackingStatusDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  trackingStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  trackingStatusLabel: {
    fontSize: 14,
    color: '#666',
  },
  trackingStatusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  // Refresh button styles
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Debug styles
  debugSection: {
    margin: 20,
  },
  debugCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
});

export default LocationTrackerExpo; 