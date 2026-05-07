import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { clearUser } from '../auth/authStorage';
import { college } from '../theme/college';

export function CompanyHomeScreen() {
  const { user, setUser } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.page,
        { paddingTop: 20 + insets.top, paddingBottom: 20 + insets.bottom },
      ]}
    >
      <Text style={styles.title}>Company Portal</Text>
      <Text style={styles.sub}>Welcome, {user?.name ?? 'User'}</Text>
      <Text style={styles.meta}>role: {user?.role}</Text>

      <Pressable
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
        onPress={async () => {
          await clearUser();
          setUser(null);
        }}
      >
        <Text style={styles.btnText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: college.pageBg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: college.text,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: college.textMuted,
    marginBottom: 12,
  },
  meta: {
    color: college.textMuted,
    marginBottom: 16,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: college.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
});

