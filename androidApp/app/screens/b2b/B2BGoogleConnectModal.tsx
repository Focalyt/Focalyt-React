import React from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { saveUser } from '../../auth/authStorage';
import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  getGoogleEmail,
  getOAuthRedirectUri,
} from '../../services/googleAuth';
import { college } from '../../theme/college';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConnected?: () => void;
};

function extractCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const u = new URL(trimmed);
    const fromQuery = u.searchParams.get('code');
    if (fromQuery) return fromQuery;
  } catch {
    // not a URL; fall through to regex
  }

  const m = trimmed.match(/[?&]code=([^&#\s]*)/);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }

  if (/^[A-Za-z0-9_\-/]+$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function B2BGoogleConnectModal({
  visible,
  onClose,
  onConnected,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();

  const [paste, setPaste] = React.useState('');
  const [phase, setPhase] = React.useState<
    'idle' | 'awaitingPaste' | 'exchanging' | 'done' | 'error'
  >('idle');
  const [error, setError] = React.useState<string | null>(null);

  const redirectUri = React.useMemo(() => getOAuthRedirectUri(), []);

  React.useEffect(() => {
    if (visible) {
      setPaste('');
      setError(null);
      setPhase('idle');
    }
  }, [visible]);

  const openBrowser = async () => {
    setError(null);
    try {
      await Linking.openURL(buildGoogleAuthUrl());
      setPhase('awaitingPaste');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Browser open nahi hua');
      setPhase('error');
    }
  };

  const submitCode = async () => {
    const code = extractCode(paste);
    if (!code) {
      setError(
        'Code/URL parse nahi ho saka. Pura redirect URL paste karo ya code value.',
      );
      return;
    }
    if (!user) {
      setError('Login required');
      setPhase('error');
      return;
    }
    setError(null);
    setPhase('exchanging');
    const res = await exchangeGoogleCode(code, user);
    if (res.ok && res.googleAuthToken) {
      const next = { ...user, googleAuthToken: res.googleAuthToken };
      setUser(next);
      try {
        await saveUser(next);
      } catch {
        // not fatal
      }
      setPhase('done');
      onConnected?.();
      setTimeout(() => onClose(), 700);
    } else {
      setError(res.message || 'Google connection failed');
      setPhase('error');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Connect Google Calendar</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {phase === 'done' ? (
              <View style={styles.center}>
                <Text style={styles.success}>✓ Connected!</Text>
                {getGoogleEmail(user) ? (
                  <Text style={styles.doneEmail} numberOfLines={1}>
                    {getGoogleEmail(user)}
                  </Text>
                ) : null}
                <Text style={styles.muted}>
                  Ab follow-ups Google Calendar par sync ho sakte hain.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.stepBox}>
                  <Text style={styles.stepNum}>1</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>
                      Browser me Google sign-in karo
                    </Text>
                    <Text style={styles.stepDesc}>
                      Apne phone ke browser me Google account choose karo aur
                      “Allow” press karo. Google embedded apps me sign-in block
                      karta hai, isliye external browser zaruri hai.
                    </Text>
                    <Pressable
                      style={styles.primaryBtn}
                      onPress={openBrowser}
                      disabled={phase === 'exchanging'}
                    >
                      <Text style={styles.primaryBtnText}>
                        🌐 Open Google Sign-in
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.stepBox}>
                  <Text style={styles.stepNum}>2</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>
                      Redirect URL ya code paste karo
                    </Text>
                    <Text style={styles.stepDesc}>
                      Authorize ke baad browser tumhe{' '}
                      <Text style={styles.code}>{redirectUri}</Text>
                      {' '}par le aayega, address bar me{' '}
                      <Text style={styles.code}>?code=...</Text> dikhega. Pura
                      URL copy karke yahan paste karo (ya sirf code value).
                    </Text>
                    <TextInput
                      value={paste}
                      onChangeText={setPaste}
                      placeholder="https://focalyt.com/?code=4%2F0AVG..."
                      placeholderTextColor={college.icon}
                      style={styles.input}
                      autoCapitalize="none"
                      autoCorrect={false}
                      multiline
                      numberOfLines={3}
                    />
                    <Pressable
                      style={[
                        styles.primaryBtn,
                        styles.successBtn,
                        phase === 'exchanging' && { opacity: 0.7 },
                      ]}
                      onPress={submitCode}
                      disabled={phase === 'exchanging' || !paste.trim()}
                    >
                      {phase === 'exchanging' ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryBtnText}>
                          ✓ Connect Account
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable style={styles.cancelLink} onPress={onClose}>
                  <Text style={styles.cancelLinkText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: college.border,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: '800', color: college.text },
  close: { fontSize: 18, color: college.textMuted, paddingHorizontal: 4 },

  stepBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    backgroundColor: college.primary,
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    overflow: 'hidden',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: college.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: college.textMuted,
    lineHeight: 17,
    marginBottom: 10,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 11,
    backgroundColor: '#e2e8f0',
    color: college.text,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: college.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: college.text,
    minHeight: 64,
    textAlignVertical: 'top',
    marginBottom: 10,
  },

  primaryBtn: {
    backgroundColor: college.primary,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  successBtn: { backgroundColor: '#10b981' },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  muted: {
    color: college.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  success: { color: '#10b981', fontWeight: '800', fontSize: 22 },
  doneEmail: {
    color: college.text,
    fontWeight: '700',
    fontSize: 14,
  },

  error: {
    marginTop: 12,
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 6,
    fontSize: 12,
  },
  cancelLink: { alignSelf: 'center', paddingVertical: 10, marginTop: 6 },
  cancelLinkText: { color: college.textMuted, fontWeight: '600' },
});
