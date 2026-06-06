import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { clearUser } from '../auth/authStorage';
import { AppHeader } from '../components/AppHeader';
import { college } from '../theme/college';

export function CollegeNoAccessScreen() {
  const { user, setUser } = useAuth();

  const onLogout = async () => {
    await clearUser();
    setUser(null);
  };

  return (
    <View style={styles.page}>
      <AppHeader title="Institute Portal" />
      <View style={styles.body}>
        <Text style={styles.title}>No module access</Text>
        <Text style={styles.subtitle}>
          Your account does not have B2B or B2C permissions. Ask your admin to
          assign access from Access Management on the web portal.
        </Text>
        <Text style={styles.logout} onPress={onLogout}>
          Logout
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: college.pageBg,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: college.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: college.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  logout: {
    marginTop: 28,
    fontSize: 15,
    fontWeight: '600',
    color: college.primary,
    textDecorationLine: 'underline',
  },
});
