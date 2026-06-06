import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { SideMenu } from '../components/SideMenu';
import { useCollegeSideMenu } from '../navigation/useCollegeSideMenu';
import { college } from '../theme/college';

export function B2CScreen() {
  const { user } = useAuth();
  const { menuSections, menuOpen, setMenuOpen } = useCollegeSideMenu();

  return (
    <View style={styles.page}>
      <AppHeader title="B2C Sales" onMenuPress={() => setMenuOpen(true)} />

      <View style={styles.body}>
        <Text style={styles.emoji}>🚧</Text>
        <Text style={styles.title}>Under Construction</Text>
        <Text style={styles.subtitle}>
          B2C module is coming soon to the mobile app.
        </Text>
        {user?.collegeName ? (
          <Text style={styles.hint}>{user.collegeName}</Text>
        ) : null}
      </View>

      <SideMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        header={{
          title: user?.name || 'Institute',
          subtitle: user?.collegeName || (user?.email ?? ''),
        }}
        sections={menuSections}
      />
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
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: college.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: college.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  hint: {
    marginTop: 20,
    fontSize: 13,
    color: college.textMuted,
  },
});
