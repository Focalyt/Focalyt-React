import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { clearUser } from '../auth/authStorage';
import { AppHeader } from '../components/AppHeader';
import { SideMenu, type SideMenuSection } from '../components/SideMenu';
import type { B2BInitialTab } from '../navigation/AppNavigator';
import { college } from '../theme/college';
import { B2BDashboardTab } from './b2b/B2BDashboardTab';

type Nav = {
  navigate: (route: 'B2B', params?: { initialTab?: B2BInitialTab }) => void;
};

export function CollegeHomeScreen({ navigation }: { navigation: Nav }) {
  const { user, setUser } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const sections: SideMenuSection[] = [
    {
      title: 'Modules',
      items: [
        {
          id: 'b2b',
          label: 'B2B',
          hint: 'Sales, leads & follow-ups',
          accent: '#10b981',
          defaultExpanded: true,
          children: [
            {
              id: 'b2b-dashboard',
              label: 'Dashboard',
              accent: '#3b82f6',
              onPress: () =>
                navigation.navigate('B2B', { initialTab: 'dashboard' }),
            },
            {
              id: 'b2b-sales',
              label: 'Sales',
              accent: '#10b981',
              onPress: () =>
                navigation.navigate('B2B', { initialTab: 'sales' }),
            },
            {
              id: 'b2b-followup',
              label: 'Follow-up',
              accent: '#f59e0b',
              onPress: () =>
                navigation.navigate('B2B', { initialTab: 'followup' }),
            },
          ],
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'logout',
          label: 'Logout',
          accent: '#ef4444',
          onPress: async () => {
            await clearUser();
            setUser(null);
          },
        },
      ],
    },
  ];

  return (
    <View style={styles.page}>
      <AppHeader
        title="Dashboard"
        onMenuPress={() => setMenuOpen(true)}
      />

      <View style={styles.body}>
        <B2BDashboardTab />
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
});
