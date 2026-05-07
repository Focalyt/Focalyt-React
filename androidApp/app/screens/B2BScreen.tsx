import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import type { B2BInitialTab } from '../navigation/AppNavigator';
import { college } from '../theme/college';
import { B2BDashboardTab } from './b2b/B2BDashboardTab';
import { B2BFollowUpTab } from './b2b/B2BFollowUpTab';
import { B2BSalesTab } from './b2b/B2BSalesTab';

type Tab = B2BInitialTab;

type Props = {
  navigation?: { goBack?: () => void };
  route?: { params?: { initialTab?: Tab } };
};

const TITLE_FOR_TAB: Record<Tab, string> = {
  dashboard: 'B2B Dashboard',
  sales: 'B2B Sales',
  followup: 'B2B Follow-up',
};

export function B2BScreen({ navigation, route }: Props) {
  const initialTab: Tab = route?.params?.initialTab ?? 'dashboard';
  const [tab, setTab] = React.useState<Tab>(initialTab);

  return (
    <View style={styles.page}>
      <AppHeader
        title={TITLE_FOR_TAB[tab]}
        onBackPress={() => navigation?.goBack?.()}
      />

      <View style={styles.tabBar}>
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
      </View>

      <View style={styles.body}>
        {tab === 'dashboard' ? <B2BDashboardTab /> : null}
        {tab === 'sales' ? <B2BSalesTab /> : null}
        {tab === 'followup' ? <B2BFollowUpTab /> : null}
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
});
