import React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { focalytLogo } from '../assets/images';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CollegeInputField } from '../components/CollegeInputField';
import {
  apiErrorMessage,
  collegeOtpVerifyLogin,
  collegePasswordLogin,
  collegeResetPassword,
  collegeSendOtp,
  collegeVerifyOtpReset,
  getApiBaseSafe,
} from '../services/collegeApi';
import { college } from '../theme/college';
import { useAuth } from '../auth/AuthContext';
import { saveUser } from '../auth/authStorage';
import type { AuthUser } from '../auth/authTypes';

const WEB_APP_ORIGIN = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000'
  : 'https://REPLACE_WITH_YOUR_PORTAL_ORIGIN';

type Tab = 'login' | 'signup';
type LoginMethod = 'password' | 'otp';

function openWebPath(path: string) {
  if (WEB_APP_ORIGIN.includes('REPLACE_WITH')) return;
  const url = `${WEB_APP_ORIGIN}${path}`;
  Linking.openURL(url).catch(() => {});
}

function ForgotPasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = React.useState(1);
  const [mobile, setMobile] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showNewPw, setShowNewPw] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setStep(1);
    setMobile('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPw(false);
    setError('');
    setSuccess('');
    setBusy(false);
  }, [visible]);

  const onPrimary = async () => {
    setError('');
    setSuccess('');
    if (step === 1) {
      if (!mobile.trim()) {
        setError('Please enter mobile number or email');
        return;
      }
      if (!getApiBaseSafe()) {
        setError('Set API_URL in .env');
        return;
      }
      setBusy(true);
      try {
        const data = await collegeSendOtp(mobile.trim());
        if (data.status === true) {
          setStep(2);
        } else {
          setError(apiErrorMessage(data) || 'Failed to send OTP !!!');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to send OTP !!!');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 2) {
      if (!otp.trim()) {
        setError('Please enter OTP');
        return;
      }
      setBusy(true);
      try {
        const data = await collegeVerifyOtpReset(mobile.trim(), otp.trim());
        if (data.status === true) {
          setSuccess('OTP verified successfully');
          setStep(3);
        } else {
          setError(apiErrorMessage(data) || 'OTP verification failed !!!');
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'OTP verification failed !!!',
        );
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!newPassword) {
      setError('Please enter new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const data = await collegeResetPassword(mobile.trim(), newPassword);
      if (data.status === true) {
        setSuccess(
          typeof data.message === 'string'
            ? data.message
            : 'Password reset successfully',
        );
        setTimeout(onClose, 2000);
      } else {
        setError(apiErrorMessage(data) || 'Failed to reset password !!!');
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to reset password !!!',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalCard}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Forgot Password</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={12}
            >
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            {step === 1 && (
              <CollegeInputField
                iconName="user"
                placeholder="Mobile / Email"
                value={mobile}
                onChangeText={setMobile}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
            {step === 2 && (
              <CollegeInputField
                iconName="key"
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            )}
            {step === 3 && (
              <>
                <CollegeInputField
                  iconName="lock"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPw}
                  showPasswordToggle
                  passwordVisible={showNewPw}
                  onTogglePassword={() => setShowNewPw(v => !v)}
                  autoCapitalize="none"
                />
                <CollegeInputField
                  iconName="lock"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showNewPw}
                  autoCapitalize="none"
                />
              </>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.modalBtn,
                pressed && { backgroundColor: college.modalBtnPressed },
                busy && styles.btnDisabled,
              ]}
              onPress={onPrimary}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalBtnText}>
                  {step === 1
                    ? 'Send OTP'
                    : step === 2
                      ? 'Verify OTP'
                      : 'Reset Password'}
                </Text>
              )}
            </Pressable>

            {error ? <Text style={styles.msgError}>{error}</Text> : null}
            {success ? <Text style={styles.msgOk}>{success}</Text> : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function LoginScreen() {
  const { setUser } = useAuth();
  const [activeTab, setActiveTab] = React.useState<Tab>('login');
  const [loginMethod, setLoginMethod] = React.useState<LoginMethod>('password');
  const [userInput, setUserInput] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [otp, setOtp] = React.useState('');
  const [showOtpField, setShowOtpField] = React.useState(false);
  const [showOtpBtn, setShowOtpBtn] = React.useState(false);
  const [isUserInputDisabled, setIsUserInputDisabled] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [forgotVisible, setForgotVisible] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const setPasswordMode = () => {
    setLoginMethod('password');
    setShowOtpField(false);
    setShowOtpBtn(false);
    setIsUserInputDisabled(false);
    setOtp('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const setOtpMode = () => {
    setLoginMethod('otp');
    setShowOtpField(false);
    setShowOtpBtn(true);
    setIsUserInputDisabled(false);
    setOtp('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const sendOtp = async () => {
    if (!userInput.trim()) {
      setSuccessMessage('');
      setErrorMessage('Please enter mobile number or email');
      return;
    }
    if (!getApiBaseSafe()) {
      setSuccessMessage('');
      setErrorMessage('Set API_URL in androidApp/.env');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const data = await collegeSendOtp(userInput.trim());
      if (data.status === true) {
        setShowOtpBtn(false);
        setShowOtpField(true);
        setIsUserInputDisabled(true);
        setSuccessMessage(
          typeof data.message === 'string' ? data.message : 'OTP sent',
        );
      } else {
        setSuccessMessage('');
        setErrorMessage(apiErrorMessage(data) || 'Failed to send OTP !!!');
      }
    } catch (e) {
      setSuccessMessage('');
      setErrorMessage(
        e instanceof Error ? e.message : 'Failed to send OTP !!!',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (loginMethod === 'password') {
      if (!userInput.trim()) {
        setErrorMessage('Please enter mobile number or email');
        return;
      }
      if (!password) {
        setErrorMessage('Please enter your password');
        return;
      }
      if (!getApiBaseSafe()) {
        setErrorMessage('Set API_URL in androidApp/.env');
        return;
      }
      setSubmitting(true);
      try {
        const data = await collegePasswordLogin(
          userInput.trim(),
          password,
        );
        const userPayload = data.userData as AuthUser | undefined;
        if (data.status === true && userPayload && typeof userPayload === 'object') {
          await saveUser(userPayload);
          setUser(userPayload);
          setSuccessMessage(
            typeof data.message === 'string'
              ? data.message
              : 'Login successful',
          );
        } else {
          setErrorMessage(apiErrorMessage(data) || 'Login failed !!!');
        }
      } catch (e) {
        setErrorMessage(
          e instanceof Error ? e.message : 'Login failed !!!',
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!userInput.trim()) {
      setErrorMessage('Please enter mobile number or email');
      return;
    }
    if (!otp.trim()) {
      setErrorMessage('Please enter OTP');
      return;
    }
    if (!getApiBaseSafe()) {
      setErrorMessage('Set API_URL in androidApp/.env');
      return;
    }
    setSubmitting(true);
    try {
      const data = await collegeOtpVerifyLogin(
        userInput.trim(),
        otp.trim(),
      );
      const userPayload = data.userData as AuthUser | undefined;
      if (data.status === true && userPayload && typeof userPayload === 'object') {
        await saveUser(userPayload);
        setUser(userPayload);
        setSuccessMessage(
          typeof data.message === 'string'
            ? data.message
            : 'Login successful',
        );
      } else {
        setErrorMessage(
          apiErrorMessage(data) || 'OTP verification failed !!!',
        );
      }
    } catch (e) {
      setErrorMessage(
        e instanceof Error ? e.message : 'OTP verification failed !!!',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitMain = async () => {
    if (activeTab !== 'login') return;
    if (loginMethod === 'otp' && showOtpBtn) {
      await sendOtp();
      return;
    }
    await handleLogin();
  };

  const mainCtaLabel =
    loginMethod === 'otp' && showOtpBtn ? 'Send OTP' : 'Login';

  const canSubmitMain = (() => {
    if (submitting) return false;
    if (!getApiBaseSafe()) return false;
    if (!userInput.trim()) return false;
    if (loginMethod === 'password') {
      return password.length > 0;
    }
    if (showOtpBtn) {
      return true;
    }
    return otp.trim().length >= 6;
  })();

  const apiConfigured = !!getApiBaseSafe();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollInner,
          {
            paddingTop: 20 + insets.top,
            paddingBottom: 20 + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <Image
              source={focalytLogo}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Focalyt logo"
            />
          </View>

          <Text style={styles.title}>Institute Portal</Text>
          <Text style={styles.subtitle}>Please login to your account</Text>

          {!apiConfigured ? (
            <Text style={styles.configWarn}>
              Set API_URL in .env (e.g. https://your-backend.com). Restart Metro
              after changing env.
            </Text>
          ) : null}

          <View style={styles.tabBar}>
            <Pressable onPress={() => setActiveTab('login')} style={styles.tabHit}>
              <Text
                style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}
              >
                Login
              </Text>
              {activeTab === 'login' ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
            <Pressable onPress={() => setActiveTab('signup')} style={styles.tabHit}>
              <Text
                style={[styles.tabText, activeTab === 'signup' && styles.tabTextActive]}
              >
                Signup
              </Text>
              {activeTab === 'signup' ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
          </View>

          {activeTab === 'login' ? (
            <View>
              <View style={styles.methodRow}>
                <Pressable
                  style={styles.radioHit}
                  onPress={setPasswordMode}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: loginMethod === 'password' }}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      loginMethod === 'password' && styles.radioOuterOn,
                    ]}
                  >
                    {loginMethod === 'password' ? (
                      <View style={styles.radioInner} />
                    ) : null}
                  </View>
                  <Text style={styles.radioLabel}>Password Login</Text>
                </Pressable>
                <Pressable
                  style={styles.radioHit}
                  onPress={setOtpMode}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: loginMethod === 'otp' }}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      loginMethod === 'otp' && styles.radioOuterOn,
                    ]}
                  >
                    {loginMethod === 'otp' ? (
                      <View style={styles.radioInner} />
                    ) : null}
                  </View>
                  <Text style={styles.radioLabel}>OTP Login</Text>
                </Pressable>
              </View>

              <CollegeInputField
                iconName="user"
                placeholder="Mobile / Email"
                value={userInput}
                onChangeText={setUserInput}
                disabled={loginMethod === 'otp' && isUserInputDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />

              {loginMethod === 'password' ? (
                <CollegeInputField
                  iconName="lock"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  showPasswordToggle
                  passwordVisible={showPassword}
                  onTogglePassword={() => setShowPassword(v => !v)}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={onSubmitMain}
                />
              ) : (
                <View>
                  {isUserInputDisabled ? (
                    <View style={styles.linkRowRight}>
                      <Pressable
                        onPress={() => {
                          setIsUserInputDisabled(false);
                          setShowOtpField(false);
                          setOtp('');
                          setShowOtpBtn(true);
                        }}
                      >
                        <Text style={styles.link}>Change Number/Email</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {showOtpField ? (
                    <CollegeInputField
                      iconName="key"
                      placeholder="Enter OTP"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      returnKeyType="done"
                      onSubmitEditing={onSubmitMain}
                    />
                  ) : null}

                  {showOtpField ? (
                    <View style={styles.linkRowRight}>
                      <Pressable onPress={sendOtp} disabled={submitting}>
                        <Text style={styles.link}>Resend OTP</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              )}

              {loginMethod === 'password' ? (
                <View style={styles.forgotRow}>
                  <Pressable onPress={() => setForgotVisible(true)}>
                    <Text style={styles.link}>Forgot Password?</Text>
                  </Pressable>
                </View>
              ) : null}

              <Text style={styles.terms}>
                I agree to{' '}
                <Text
                  style={styles.link}
                  onPress={() => openWebPath('/terms-of-service')}
                >
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.link}
                  onPress={() => openWebPath('/privacy-policy')}
                >
                  Privacy Policy
                </Text>
                .
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.loginBtn,
                  pressed && { backgroundColor: college.primaryPressed },
                  (!canSubmitMain || submitting) && styles.btnDisabled,
                ]}
                onPress={onSubmitMain}
                disabled={!canSubmitMain || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>{mainCtaLabel}</Text>
                )}
              </Pressable>

              {errorMessage ? (
                <Text style={styles.msgError}>{errorMessage}</Text>
              ) : null}
              {successMessage ? (
                <Text style={styles.msgOk}>{successMessage}</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.signupPlaceholder}>
              <Text style={styles.signupText}>
                College registration uses the same flow as the web institute
                portal. Open the portal in a browser to complete signup, or use
                this tab after we add the native form.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <ForgotPasswordModal
        visible={forgotVisible}
        onClose={() => setForgotVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: college.pageBg,
  },
  scrollInner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: college.cardBg,
    borderRadius: 8,
    padding: 25,
    shadowColor: college.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: college.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: college.textMuted,
    marginBottom: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: college.tabBorder,
    marginBottom: 25,
  },
  tabHit: {
    paddingVertical: 10,
    marginRight: 20,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: college.textMuted,
  },
  tabTextActive: {
    color: college.primary,
    fontWeight: '600',
  },
  tabUnderline: {
    marginTop: 10,
    height: 2,
    backgroundColor: college.primary,
    borderRadius: 1,
  },
  methodRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  radioHit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 25,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: college.border,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterOn: {
    borderColor: college.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: college.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: college.text,
  },
  linkRowRight: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  link: {
    color: college.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  terms: {
    fontSize: 12,
    color: college.textMuted,
    marginBottom: 20,
    lineHeight: 18,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: college.primary,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  btnDisabled: {
    opacity: 0.55,
  },
  msgError: {
    color: college.error,
    fontSize: 14,
    marginTop: 15,
    textAlign: 'center',
  },
  msgOk: {
    color: college.success,
    fontSize: 14,
    marginTop: 15,
    textAlign: 'center',
  },
  signupPlaceholder: {
    paddingVertical: 8,
  },
  signupText: {
    fontSize: 14,
    color: college.textMuted,
    lineHeight: 20,
  },
  configWarn: {
    fontSize: 12,
    color: college.error,
    marginBottom: 12,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: college.cardBg,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: college.tabBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: college.text,
  },
  modalClose: {
    fontSize: 26,
    color: college.icon,
    lineHeight: 28,
  },
  modalBody: {
    padding: 20,
  },
  modalBtn: {
    width: '100%',
    backgroundColor: college.modalBtn,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 46,
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
