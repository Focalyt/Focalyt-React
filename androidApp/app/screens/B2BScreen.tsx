import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { SideMenu } from '../components/SideMenu';
import type { B2BInitialTab, RootStackParamList } from '../navigation/AppNavigator';
import { useCollegeSideMenu } from '../navigation/useCollegeSideMenu';
import { college } from '../theme/college';
// import { B2BDashboardTab } from './b2b/B2BDashboardTab';
// import { B2BFollowUpTab } from './b2b/B2BFollowUpTab';
import { B2BSalesTab } from './b2b/B2BSalesTab';

type Tab = B2BInitialTab;

type Props = {
  navigation?: { goBack?: () => void };
  route?: { params?: { initialTab?: Tab } };
};

export function B2BScreen({ navigation: navProp, route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { menuSections, menuOpen, setMenuOpen } = useCollegeSideMenu();
  const canGoBack = navigation.canGoBack();

  const _initialTab = route?.params?.initialTab;
  void _initialTab;

  const openMenu = () => setMenuOpen(true);

  return (
    <View style={styles.page}>
      <AppHeader
        title="B2B Sales"
        onBackPress={
          canGoBack
            ? () => (navProp?.goBack ? navProp.goBack() : navigation.goBack())
            : undefined
        }
        onMenuPress={!canGoBack ? openMenu : undefined}
        rightSlot={
          canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              onPress={openMenu}
              hitSlop={12}
              style={styles.headerMenuBtn}
            >
              <View style={styles.menuBun} />
              <View style={[styles.menuBun, styles.menuBunMid]} />
              <View style={styles.menuBun} />
            </Pressable>
          ) : null
        }
      />

      <SideMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        header={{
          title: user?.name || 'Institute',
          subtitle: user?.collegeName || (user?.email ?? ''),
        }}
        sections={menuSections}
      />

      {/* <View style={styles.tabBar}>
        <TabButton
          label="Dashboard"
          active={tab === 'dashboard'}
          onPress={() => setTab('dashboard')}
        />
        <TabButton
          label="Sales"
          active={tab === 'sales'}
          onPress={() => setTab('sales')}
        />
        <TabButton
          label="Follow-up"
          active={tab === 'followup'}
          onPress={() => setTab('followup')}
        />
      </View> */}

      <View style={styles.body}>
        {/* {tab === 'dashboard' ? <B2BDashboardTab /> : null} */}
        <B2BSalesTab />
        {/* {tab === 'followup' ? <B2BFollowUpTab /> : null} */}
      </View>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tabBtn}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
      {active ? <View style={styles.tabUnderline} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: college.tabBorder,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: college.textMuted,
  },
  tabTextActive: {
    color: college.primary,
    fontWeight: '700',
  },
  tabUnderline: {
    marginTop: 8,
    height: 2,
    backgroundColor: college.primary,
    borderRadius: 1,
  },
  body: {
    flex: 1,
  },
  headerMenuBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBun: {
    width: 18,
    height: 2,
    borderRadius: 1.5,
    backgroundColor: college.text,
    marginVertical: 2,
  },
  menuBunMid: {
    width: 14,
  },
});
