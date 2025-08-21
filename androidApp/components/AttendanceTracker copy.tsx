import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

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
  locationType: 'punchIn' | 'location' | 'locationOff';
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
  type: 'punchIn' | 'location' | 'locationOff';
  fromTime: string;
  toTime: string;
  location?: LocationData;
  address?: string;
  battery?: number | null;
  isCharging?: boolean | null;
  photo?: string;
}

interface AttendanceData {
  [date: string]: AttendanceEntry[];
}

const AttendanceTracker: React.FC = () => {
  // State variables
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
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

  // Refs
  const lastLocationRef = useRef<LocationData | null>(null);
  const locationCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attendanceDataRef = useRef<AttendanceData>({});

  useEffect(() => {
    initializeApp();
  }, []);

  // Force re-render when attendance data changes
  useEffect(() => {
    console.log('Attendance data changed, timeline should refresh');
  }, [attendanceData]);

  // Add a state to force re-renders
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

  const initializeApp = async () => {
    await checkPermissions();
    await loadAttendanceData();
    await getBatteryInfo();
    await checkLocationStatus();
  };

  const checkPermissions = async () => {
    try {
      // Check camera permission
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus);

      // Check location permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(locationStatus);

      if (cameraStatus !== 'granted') {
        Alert.alert('Camera Permission Required', 'Camera permission is required for punch-in/out.');
      }

      if (locationStatus !== 'granted') {
        Alert.alert('Location Permission Required', 'Location permission is required for attendance tracking.');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const loadAttendanceData = async () => {
    try {
      console.log('Loading attendance data from AsyncStorage...');
      const savedData = await AsyncStorage.getItem('attendanceData');
      console.log('Raw saved data from AsyncStorage:', savedData);

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('Parsed attendance data:', parsedData);
        console.log('Available dates in parsed data:', Object.keys(parsedData));
        setAttendanceData(parsedData);
        attendanceDataRef.current = parsedData; // Update the ref
      } else {
        console.log('No saved data found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const saveAttendanceData = async (data: AttendanceData) => {
    try {
      console.log('Saving attendance data to AsyncStorage:', data);
      console.log('Data to be stringified:', JSON.stringify(data));
      await AsyncStorage.setItem('attendanceData', JSON.stringify(data));
      setAttendanceData(data);
      attendanceDataRef.current = data; // Update the ref
      console.log('Attendance data saved and state updated:', data); // Debug log

      // Verify the data was saved correctly
      const verifyData = await AsyncStorage.getItem('attendanceData');
      console.log('Verification - data read back from AsyncStorage:', verifyData);
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
          } else if (types.includes('country')) {
            address.country = component.long_name;
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

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
        accuracy: location.coords.accuracy,
        address: address || undefined,
        batteryLevel: batteryInfo.batteryLevel,
        isCharging: batteryInfo.isCharging,
        locationType: 'location'
      };

      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

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

  const addAttendanceEntry = async (entry: AttendanceEntry) => {
    const today = new Date().toDateString();
    console.log('Adding entry for date:', today);
    console.log('Current attendance data before adding:', attendanceDataRef.current);

    const currentData = { ...attendanceDataRef.current };
    console.log('Copied current data:', currentData);

    if (!currentData[today]) {
      currentData[today] = [];
      console.log('Created new array for today');
    }

    currentData[today].push(entry);
    console.log('Entry added to currentData:', currentData);
    console.log('Total entries for today after adding:', currentData[today].length);
    await saveAttendanceData(currentData);
  };

  const updateLastEntryToTime = async (toTime: string) => {
    const today = new Date().toDateString();
    const currentData = { ...attendanceDataRef.current };

    if (currentData[today] && currentData[today].length > 0) {
      const lastEntry = currentData[today][currentData[today].length - 1];
      console.log('Updating last entry toTime:', lastEntry.type, lastEntry.id, 'from', lastEntry.toTime, 'to', toTime);
      lastEntry.toTime = toTime;
      await saveAttendanceData(currentData);
      forceRefresh(); // Force timeline refresh
    }
  };

  const updatePunchInEntryToTime = async (toTime: string) => {
    const today = new Date().toDateString();
    const currentData = { ...attendanceDataRef.current };

    console.log('updatePunchInEntryToTime - looking for date:', today);
    console.log('Available dates in currentData:', Object.keys(currentData));

    if (currentData[today] && currentData[today].length > 0) {
      // Find the punch-in entry and update its toTime
      for (let i = currentData[today].length - 1; i >= 0; i--) {
        const entry = currentData[today][i];
        if (entry.type === 'punchIn' && entry.id.includes('punchIn')) {
          entry.toTime = toTime;
          console.log('Found punch-in entry, updating toTime from', entry.toTime, 'to', toTime);
          await saveAttendanceData(currentData);
          console.log('Updated punch-in toTime:', toTime); // Debug log
          forceRefresh(); // Force timeline refresh
          break;
        }
      }
    }
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

      if (!location) {
        Alert.alert('Error', 'Could not get location. Please try again.');
        return;
      }

      // Create punch-in entry
      const punchInEntry: AttendanceEntry = {
        id: `punchIn-${Date.now()}`,
        type: 'punchIn',
        fromTime: now,
        toTime: now, // Initially same as fromTime, will be updated during tracking
        location: {
          ...location,
          locationType: 'punchIn'
        },
        address: location.address?.formattedAddress || 'Unknown Location',
        battery: location.batteryLevel,
        isCharging: location.isCharging,
        photo: photoUri || undefined
      };

      console.log('About to add punch-in entry:', punchInEntry);
      await addAttendanceEntry(punchInEntry);
      console.log('Punch-in entry added successfully');

      setIsPunchedIn(true);
      setPunchInTime(now);
      setCurrentLocation(location);
      lastLocationRef.current = location;
      setLastLocationCheck(new Date());

      // Start location tracking
      startLocationTracking();

      Alert.alert('Success', 'Punch In successful! Location tracking started.');
    } catch (error) {
      console.error('Error during punch in:', error);
      Alert.alert('Error', 'Failed to punch in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
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

      // Create punch-out entry
      const punchOutEntry: AttendanceEntry = {
        id: `punchOut-${Date.now()}`,
        type: 'punchIn', // Using punchIn type for consistency
        fromTime: now,
        toTime: now,
        location: location ? {
          ...location,
          locationType: 'punchIn'
        } : undefined,
        address: location?.address?.formattedAddress || 'Unknown Location',
        battery: location?.batteryLevel,
        isCharging: location?.isCharging,
        photo: photoUri || undefined
      };

      await addAttendanceEntry(punchOutEntry);

      // Stop location tracking
      stopLocationTracking();

      setIsPunchedIn(false);
      setPunchInTime(null);
      setCurrentLocation(null);
      lastLocationRef.current = null;
      setLastLocationCheck(null);

      Alert.alert('Success', 'Punch Out successful!');
    } catch (error) {
      console.error('Error during punch out:', error);
      Alert.alert('Error', 'Failed to punch out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = () => {
    // Check location every 5 seconds
    const interval = setInterval(async () => {
      await checkLocationAndUpdate();
    }, 5000);

    setLocationTrackingInterval(interval);
  };

  const stopLocationTracking = () => {
    if (locationTrackingInterval) {
      clearInterval(locationTrackingInterval);
      setLocationTrackingInterval(null);
    }
  };

  const checkLocationAndUpdate = async () => {
    // Check if there's any punch-in entry for today
    const today = new Date().toDateString();
    let todayEntries = attendanceDataRef.current[today] || [];

    // If no entries found for today, try to find any entries from today's date
    if (todayEntries.length === 0) {
      const todayDate = new Date();
      const todayKey = todayDate.toDateString();

      // Check if there are any entries with today's date in any format
      const allDates = Object.keys(attendanceDataRef.current);
      const todayEntriesKey = allDates.find(date => {
        try {
          const dateObj = new Date(date);
          return dateObj.toDateString() === todayKey;
        } catch (e) {
          return false;
        }
      });

      if (todayEntriesKey) {
        console.log('Found entries for today with different date format:', todayEntriesKey);
        todayEntries = attendanceDataRef.current[todayEntriesKey] || [];
      }
    }

    const hasPunchInEntry = todayEntries.some(entry =>
      entry.type === 'punchIn' && entry.id.includes('punchIn')
    );

    console.log('Checking location update, hasPunchInEntry:', hasPunchInEntry, 'entries count:', todayEntries.length, 'entries:', todayEntries);
    console.log('Looking for date:', today);
    console.log('Available dates in attendanceDataRef:', Object.keys(attendanceDataRef.current));

    if (!hasPunchInEntry) {
      console.log('No punch-in entry found, returning early');
      return;
    }

    const now = new Date();
    const locationEnabled = await checkLocationStatus();

    if (!locationEnabled) {
      // Location is off - check if we already have a location off entry
      const today = new Date().toDateString();
      const todayEntries = attendanceDataRef.current[today] || [];
      const hasLocationOffEntry = todayEntries.some(entry =>
        entry.type === 'locationOff' && entry.id.includes('locationOff')
      );

      if (!hasLocationOffEntry) {
        // Location just turned off - create new location off entry
        const locationOffEntry: AttendanceEntry = {
          id: `locationOff-${Date.now()}`,
          type: 'locationOff',
          fromTime: now.toISOString(),
          toTime: now.toISOString(), // Initially same as fromTime
          address: 'Location Service OFF',
          battery: currentBatteryLevel,
          isCharging: isCharging
        };

        console.log('Creating new location off entry:', locationOffEntry);
        await addAttendanceEntry(locationOffEntry);
        console.log('Location off entry added successfully');
        setIsLocationEnabled(false);
      } else {
        // Location still off - update toTime of existing location off entry
        console.log('Location still off, updating existing location off entry toTime');
        await updateLastEntryToTime(now.toISOString());
      }
    } else {
      // Location is on
      const today = new Date().toDateString();
      const todayEntries = attendanceDataRef.current[today] || [];
      const hasLocationOffEntry = todayEntries.some(entry =>
        entry.type === 'locationOff' && entry.id.includes('locationOff')
      );

      if (hasLocationOffEntry) {
        // Check if we already have a location entry after the location off entry
        const locationOffEntryIndex = todayEntries.findIndex(entry =>
          entry.type === 'locationOff' && entry.id.includes('locationOff')
        );

        const hasLocationEntryAfterOff = todayEntries.slice(locationOffEntryIndex + 1).some(entry =>
          entry.type === 'location' && entry.id.includes('location')
        );

        if (!hasLocationEntryAfterOff) {
          // Location just turned on after being off - create new location entry
          const location = await getCurrentLocation();
          if (location) {
            const locationEntry: AttendanceEntry = {
              id: `location-${Date.now()}`,
              type: 'location',
              fromTime: now.toISOString(),
              toTime: now.toISOString(),
              location: location,
              address: location.address?.formattedAddress || 'Unknown Location',
              battery: location.batteryLevel,
              isCharging: location.isCharging
            };

            console.log('Location turned on after being off, creating new location entry:', locationEntry);
            await addAttendanceEntry(locationEntry);
            setCurrentLocation(location);
            lastLocationRef.current = location;
            setIsLocationEnabled(true);
          }
        } else {
          // Location entry already exists after location off - update its toTime
          console.log('Location entry already exists after location off, updating toTime');
          await updateLastEntryToTime(now.toISOString());
        }
      } else {
        // Location still on - update punch-in entry's toTime and check if moved more than 30 meters
        console.log('Location is on, updating punch-in toTime:', now.toISOString());
        await updatePunchInEntryToTime(now.toISOString());

        const location = await getCurrentLocation();
        if (location && lastLocationRef.current) {
          const distance = calculateDistance(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            location.latitude,
            location.longitude
          );

          if (distance > 30) {
            // Moved more than 30 meters - create new location entry
            const locationEntry: AttendanceEntry = {
              id: `location-${Date.now()}`,
              type: 'location',
              fromTime: now.toISOString(),
              toTime: now.toISOString(),
              location: location,
              address: location.address?.formattedAddress || 'Unknown Location',
              battery: location.batteryLevel,
              isCharging: location.isCharging
            };

            await addAttendanceEntry(locationEntry);
            setCurrentLocation(location);
            lastLocationRef.current = location;
          } else {
            // Within 30 meters - update toTime of last entry
            await updateLastEntryToTime(now.toISOString());
          }
        }
      }
    }

    setLastLocationCheck(now);
  };

  const getTodayEntries = () => {
    const today = new Date().toDateString();
    const entries = attendanceData[today] || [];
    console.log('Getting today entries:', entries.length, 'entries', 'for date:', today);
    console.log('Available dates in attendanceData:', Object.keys(attendanceData));
    console.log('All entries for today:', entries);

    // If no entries found for today, try to find any entries from today's date
    if (entries.length === 0) {
      const todayDate = new Date();
      const todayKey = todayDate.toDateString();
      console.log('Trying alternative date format:', todayKey);

      // Check if there are any entries with today's date in any format
      const allDates = Object.keys(attendanceData);
      const todayEntries = allDates.find(date => {
        try {
          const dateObj = new Date(date);
          return dateObj.toDateString() === todayKey;
        } catch (e) {
          return false;
        }
      });

      if (todayEntries) {
        console.log('Found entries for today with different date format:', todayEntries);
        return attendanceData[todayEntries] || [];
      }
    }

    return entries;
  };

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
              setAttendanceData({});
              setIsPunchedIn(false);
              setPunchInTime(null);
              setCurrentLocation(null);
              lastLocationRef.current = null;
              setLastLocationCheck(null);
              stopLocationTracking();
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

  const renderTimelineItem = (entry: AttendanceEntry, index: number) => {
    const isPunchIn = entry.type === 'punchIn' && entry.id.includes('punchIn');
    const isPunchOut = entry.type === 'punchIn' && entry.id.includes('punchOut');
    const isLocation = entry.type === 'location';
    const isLocationOff = entry.type === 'locationOff';

    return (
      <View key={entry.id} style={styles.timelineItem}>
        <View style={styles.timelineHeader}>
          <Text style={[
            styles.timelineType,
            isPunchIn && styles.punchInType,
            isPunchOut && styles.punchOutType,
            isLocation && styles.locationType,
            isLocationOff && styles.locationOffType
          ]}>
            {isPunchIn && '🟢 PUNCH IN'}
            {isPunchOut && '🔴 PUNCH OUT'}
            {isLocation && '📍 LOCATION'}
            {isLocationOff && '⚠️ LOCATION OFF'}
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

          {entry.battery !== null && entry.battery !== undefined && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Battery:</Text>
              <Text style={styles.timelineValue}>
                {Math.round(entry.battery * 100)}% {entry.isCharging ? '🔌' : '🔋'}
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
        {!isPunchedIn ? (
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
        ) : (
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
        )}
      </View>

      {/* Current Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Current Status</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Punch In Time:</Text>
          <Text style={styles.statusValue}>
            {punchInTime ? formatTime(punchInTime) : 'Not punched in'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Current Location:</Text>
          <Text style={styles.statusValue}>
            {currentLocation?.address?.formattedAddress || 'Unknown'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Battery Level:</Text>
          <Text style={styles.statusValue}>
            {currentBatteryLevel !== null ? `${Math.round(currentBatteryLevel * 100)}%` : 'Unknown'}
            {isCharging ? ' 🔌' : ' 🔋'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Location Service:</Text>
          <Text style={[styles.statusValue, { color: isLocationEnabled ? '#4CAF50' : '#f44336' }]}>
            {isLocationEnabled ? '🟢 ON' : '🔴 OFF'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Last Check:</Text>
          <Text style={styles.statusValue}>
            {lastLocationCheck ? lastLocationCheck.toLocaleTimeString() : 'Never'}
          </Text>
        </View>
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
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearData}
            >
              <Text style={styles.clearButtonText}>🗑️ Clear Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {getTodayEntries().length > 0 ? (
          getTodayEntries().map((entry, index) => renderTimelineItem(entry, index))
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  buttonText: {
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
  clearButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
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
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
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
  punchInType: {
    color: '#4CAF50',
  },
  punchOutType: {
    color: '#f44336',
  },
  locationType: {
    color: '#2196F3',
  },
  locationOffType: {
    color: '#FF9800',
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
    width: 80,
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
});

export default AttendanceTracker;
