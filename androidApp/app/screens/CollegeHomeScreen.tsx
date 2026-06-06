import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { SideMenu } from '../components/SideMenu';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useCollegeSideMenu } from '../navigation/useCollegeSideMenu';
import { college } from '../theme/college';

export function CollegeHomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { menuSections, menuOpen, setMenuOpen, access } = useCollegeSideMenu();

  return (
    <View style={styles.page}>
      <AppHeader title="Dashboard" onMenuPress={() => setMenuOpen(true)} />

      <View style={styles.body}>
        <Text style={styles.welcome}>Welcome{user?.name ? `, ${user.name}` : ''}</Text>
        <Text style={styles.hint}>Choose a module to continue</Text>

        <View style={styles.cards}>
          {access.b2b ? (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                styles.cardB2b,
                pressed && styles.cardPressed,
              ]}
              onPress={() =>
                navigation.navigate('B2B', { initialTab: 'sales' })
              }
            >
              <Text style={styles.cardTitle}>B2B Sales</Text>
              <Text style={styles.cardHint}>Leads, follow-ups & cross sale</Text>
            </Pressable>
          ) : null}

          {access.b2c ? (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                styles.cardB2c,
                pressed && styles.cardPressed,
              ]}
              onPress={() => navigation.navigate('B2C')}
            >
              <Text style={styles.cardTitle}>B2C Sales</Text>
              <Text style={styles.cardHint}>Admission & candidate leads</Text>
            </Pressable>
          ) : null}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  welcome: {
    fontSize: 22,
    fontWeight: '700',
    color: college.text,
    marginBottom: 6,
  },
  hint: {
    fontSize: 14,
    color: college.textMuted,
    marginBottom: 24,
  },
  cards: {
    gap: 14,
  },
  card: {
    borderRadius: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: college.tabBorder,
    backgroundColor: college.cardBg,
  },
  cardB2b: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  cardB2c: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: college.text,
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 13,
    color: college.textMuted,
  },
});
