import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [currentStep, setCurrentStep] = useState<'phone' | 'otp'>('phone');
  
  const otpInputRefs = useRef<TextInput[]>([]);
  const phoneInputRef = useRef<TextInput>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const validatePhoneNumber = (number: string): boolean => {
    // Check if it's a valid Indian phone number (no spaces needed)
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(number);
  };

  const generateOTP = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const sendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    // Prevent multiple rapid presses
    if (isLoading) return;

    // Prevent keyboard from dismissing
    Keyboard.dismiss();
    
    // Small delay to prevent rapid presses
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsLoading(true);
    
    try {
      const cleanPhoneNumber = phoneNumber; // No spaces to remove
       console.log(cleanPhoneNumber);
             // Make API call to send OTP
       const response = await fetch('https://focalyt.com/api/college/androidApp/login/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: cleanPhoneNumber,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', await response.text());
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (response.ok && data.status === true) {
        // Store phone number for verification
        await AsyncStorage.setItem('tempPhone', cleanPhoneNumber);
        
        setIsOtpSent(true);
        setIsLoading(false);
        setCurrentStep('otp');
        setResendTimer(30); // 30 seconds cooldown
        
        Alert.alert(
          'OTP Sent!',
          `OTP has been sent to ${phoneNumber}`,
          [{ text: 'OK' }]
        );
      } else {
        setIsLoading(false);
        Alert.alert(
          'Error',
          data.message || 'Failed to send OTP. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error sending OTP:', error);
      Alert.alert(
        'Network Error',
        'Failed to send OTP. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const resendOTP = async () => {
    if (resendTimer > 0) {
      Alert.alert('Please Wait', `You can resend OTP in ${resendTimer} seconds`);
      return;
    }

    // Prevent multiple rapid presses
    if (isLoading) return;

    // Prevent keyboard from dismissing
    Keyboard.dismiss();
    
    // Small delay to prevent rapid presses
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsLoading(true);
    
    try {
      const cleanPhoneNumber = phoneNumber; // No spaces to remove
      
             // Make API call to resend OTP
       const response = await fetch('https://focalyt.com/api/college/androidApp/login/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: cleanPhoneNumber,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', await response.text());
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (response.ok && data.status === true) {
        setIsLoading(false);
        setResendTimer(30);
        
        Alert.alert(
          'OTP Resent!',
          `New OTP has been sent to ${phoneNumber}`,
          [{ text: 'OK' }]
        );
      } else {
        setIsLoading(false);
        Alert.alert(
          'Error',
          data.message || 'Failed to resend OTP. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error resending OTP:', error);
      Alert.alert(
        'Network Error',
        'Failed to resend OTP. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTPInternal = async (retryCount = 0) => {
    const enteredOTP = otp.join('');
    if (enteredOTP.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter a 4-digit OTP');
      return;
    }

    // Prevent multiple rapid presses
    if (isLoading) return;

    // Prevent keyboard from dismissing
    Keyboard.dismiss();
    
    // Small delay to prevent rapid presses
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsLoading(true);
    
    // Add a small delay to ensure OTP is processed on server
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const cleanPhoneNumber = phoneNumber; // No spaces to remove
      console.log(cleanPhoneNumber, 'cleanPhoneNumber', enteredOTP,'enteredOTP'); 
             // Make API call to verify OTP
       const response = await fetch('https://focalyt.com/api/college/androidApp/login/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: cleanPhoneNumber,
          otp: enteredOTP,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', await response.text());
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (response.ok && data.status === true) {
        console.log('🎉 Login successful!');
        console.log('📋 Server response data:', JSON.stringify(data, null, 2));
        
        // Store login session and user data
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('userPhone', cleanPhoneNumber);
        
        // Store additional user data if available
        const userData = data.data?.user || data.user;
        
        if (userData) {
          console.log('👤 Real user data from server:', {
            name: userData.name,
            executiveId: userData._id || userData.executiveId,
            email: userData.email,
            phone: userData.mobile || userData.phone,
            status: userData.status,
            role: userData.role
          });
          
          // Create enhanced user data with location tracking fields
          const enhancedUserData = {
            ...userData,
            executiveId: userData._id || userData.executiveId || 'EMP001',
            name: userData.name || 'User',
            email: userData.email || '',
            phone: userData.mobile || userData.phone || cleanPhoneNumber,
            status: userData.status || 'active',
            locationTracking: {},
            totalTrackingPoints: 0,
            lastTrackingUpdate: new Date().toISOString(),
            createdAt: userData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          console.log('🎯 Enhanced user data for storage:', {
            name: enhancedUserData.name,
            executiveId: enhancedUserData.executiveId,
            email: enhancedUserData.email,
            phone: enhancedUserData.phone,
            status: enhancedUserData.status,
            locationTracking: 'initialized',
            totalTrackingPoints: enhancedUserData.totalTrackingPoints
          });
          
          await AsyncStorage.setItem('userData', JSON.stringify(enhancedUserData));
          console.log('✅ Real user data saved to AsyncStorage');
        } else {
          console.log('⚠️ No user data in server response');
          console.log('🔍 Available data keys:', Object.keys(data));
          if (data.data) {
            console.log('🔍 Data.data keys:', Object.keys(data.data));
          }
        }
        
        setIsLoading(false);
        onLoginSuccess();
      } else {
        // If first attempt fails, try once more after a delay
        if (retryCount === 0) {
          setIsLoading(false);
          console.log('First attempt failed, retrying after 2 seconds...');
          setTimeout(() => {
            verifyOTPInternal(1);
          }, 2000);
          return;
        }
        
        setIsLoading(false);
        Alert.alert(
          'Invalid OTP', 
          'Please check the OTP sent to your phone. If the issue persists, try resending the OTP.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error verifying OTP:', error);
      Alert.alert(
        'Network Error',
        'Failed to verify OTP. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const verifyOTP = () => verifyOTPInternal(0);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits and return as XXXXXXXXXX format
    return cleaned.slice(0, 10);
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const goBackToPhone = () => {
    setCurrentStep('phone');
    setOtp(['', '', '', '']);
    setIsOtpSent(false);
    setResendTimer(0);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Focalyt</Text>
          <Text style={styles.subtitle}>
            {currentStep === 'phone' 
              ? 'Enter your phone number to continue' 
              : 'Enter the OTP sent to your phone'
            }
          </Text>
        </View>

        {currentStep === 'phone' ? (
          <View style={styles.phoneSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                                 <TextInput
                   ref={phoneInputRef}
                   style={styles.phoneInput}
                   placeholder="Enter your phone number"
                   value={phoneNumber}
                   onChangeText={handlePhoneChange}
                   keyboardType="phone-pad"
                   maxLength={10} // XXXXXXXXXX format
                   autoFocus
                 />
              </View>
            </View>

                         <TouchableOpacity
               style={[
                 styles.button,
                 (phoneNumber.length !== 10 || isLoading) && styles.buttonDisabled
               ]}
               onPress={sendOTP}
               disabled={phoneNumber.length !== 10 || isLoading}
               activeOpacity={0.7}
             >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.otpSection}>
            <View style={styles.phoneDisplay}>
              <Text style={styles.phoneDisplayText}>
                OTP sent to +91 {phoneNumber}
              </Text>
              <TouchableOpacity onPress={goBackToPhone}>
                <Text style={styles.changePhoneText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.otpContainer}>
              <Text style={styles.label}>Enter OTP</Text>
              <View style={styles.otpInputContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (ref) otpInputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled
                    ]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={index === 0}
                  />
                ))}
              </View>
            </View>

                         <TouchableOpacity
               style={[
                 styles.button,
                 (otp.join('').length !== 4 || isLoading) && styles.buttonDisabled
               ]}
               onPress={verifyOTP}
               disabled={otp.join('').length !== 4 || isLoading}
               activeOpacity={0.7}
             >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>
              <TouchableOpacity
                onPress={resendOTP}
                disabled={resendTimer > 0 || isLoading}
              >
                <Text style={[
                  styles.resendButton,
                  (resendTimer > 0 || isLoading) && styles.resendButtonDisabled
                ]}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneSection: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 55,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  otpSection: {
    width: '100%',
  },
  phoneDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  phoneDisplayText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  changePhoneText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  otpContainer: {
    marginBottom: 30,
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    backgroundColor: '#fff',
  },
  otpInputFilled: {
    borderColor: '#3498db',
    backgroundColor: '#ebf3fd',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  resendButton: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#bdc3c7',
  },
});

export default LoginPage; 