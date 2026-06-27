import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { SideMenu } from '../components/SideMenu';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useCollegeSideMenu } from '../navigation/useCollegeSideMenu';
import { college } from '../theme/college';
import { B2CSalesTab } from './b2c/B2CSalesTab';

type Props = {
  navigation?: { goBack?: () => void };
};

export function B2CScreen({ navigation: navProp }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { menuSections, menuOpen, setMenuOpen } = useCollegeSideMenu();
  const canGoBack = navigation.canGoBack();

  const openMenu = () => setMenuOpen(true);

  return (
    <View style={styles.page}>
      <AppHeader
        title="Admission New"
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

      <View style={styles.body}>
        <B2CSalesTab />
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
  },
  headerMenuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  menuBun: {
    width: 18,
    height: 2,
    backgroundColor: college.text,
    borderRadius: 1,
  },
  menuBunMid: {
    marginVertical: 1,
  },
});
