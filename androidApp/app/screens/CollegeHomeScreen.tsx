import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { clearUser } from '../auth/authStorage';
import { AppHeader } from '../components/AppHeader';
import { SideMenu } from '../components/SideMenu';
import type { B2BInitialTab } from '../navigation/AppNavigator';
import { buildCollegeSideMenuSections } from '../navigation/collegeSideMenu';
import { college } from '../theme/college';
// import { B2BDashboardTab } from './b2b/B2BDashboardTab';

type Nav = {
  navigate: (route: 'B2B', params?: { initialTab?: B2BInitialTab }) => void;
};

export function CollegeHomeScreen({ navigation }: { navigation: Nav }) {
  const { user, setUser } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const sections = React.useMemo(
    () =>
      buildCollegeSideMenuSections({
        onB2BSales: () =>
          navigation.navigate('B2B', { initialTab: 'sales' }),
        onLogout: async () => {
          await clearUser();
          setUser(null);
        },
      }),
    [navigation, setUser],
  );

  return (
    <View style={styles.page}>
      <AppHeader
        title="Dashboard"
        onMenuPress={() => setMenuOpen(true)}
      />

      <View style={styles.body}>
        {/* <B2BDashboardTab /> */}
        <View style={styles.homePlaceholder}>
          <Text style={styles.homePlaceholderTitle}>Welcome</Text>
          <Text style={styles.homePlaceholderText}>
            B2B Sales ke liye menu se Sales kholo.
          </Text>
        </View>
      </View>

      <SideMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        header={{
          title: user?.name || 'Institute',
          subtitle: user?.collegeName || (user?.email ?? ''),
        }}
        sections={sections}
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
  },
  homePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  homePlaceholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: college.text,
    marginBottom: 8,
  },
  homePlaceholderText: {
    fontSize: 14,
    color: college.textMuted,
    textAlign: 'center',
  },
});
