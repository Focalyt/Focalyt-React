import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthUser } from '../auth/authTypes';
import {
  canAccessB2B,
  canAccessB2C,
  isCollegeAdmin,
} from '../auth/permissions';
import { LoginScreen } from '../screens/LoginScreen';
import { CollegeHomeScreen } from '../screens/CollegeHomeScreen';
import { CollegeNoAccessScreen } from '../screens/CollegeNoAccessScreen';
import { CandidateHomeScreen } from '../screens/CandidateHomeScreen';
import { CompanyHomeScreen } from '../screens/CompanyHomeScreen';
import { B2BScreen } from '../screens/B2BScreen';
import { B2CScreen } from '../screens/B2CScreen';

export type B2BInitialTab = 'dashboard' | 'sales' | 'followup';

export type RootStackParamList = {
  Login: undefined;
  CollegeHome: undefined;
  CollegeNoAccess: undefined;
  CandidateHome: undefined;
  CompanyHome: undefined;
  B2B: { initialTab?: B2BInitialTab } | undefined;
  B2C: undefined;
};

const AuthStack = createNativeStackNavigator<Pick<RootStackParamList, 'Login'>>();
const AppStack = createNativeStackNavigator<
  Omit<RootStackParamList, 'Login'>
>();

function homeForCollegeUser(user: AuthUser) {
  if (isCollegeAdmin(user)) return 'B2B' as const;
  const b2b = canAccessB2B(user);
  const b2c = canAccessB2C(user);
  if (b2b && !b2c) return 'B2B' as const;
  if (b2c && !b2b) return 'B2C' as const;
  if (b2b && b2c) return 'CollegeHome' as const;
  return 'CollegeNoAccess' as const;
}

function homeForRole(user: AuthUser) {
  if (user.role === 2) return homeForCollegeUser(user);
  if (user.role === 3) return 'CandidateHome' as const;
  return 'CompanyHome' as const;
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigatorStack({ user }: { user: AuthUser }) {
  const initialRoute = homeForRole(user);
  return (
    <AppStack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <AppStack.Screen name="CollegeHome" component={CollegeHomeScreen} />
      <AppStack.Screen
        name="CollegeNoAccess"
        component={CollegeNoAccessScreen}
      />
      <AppStack.Screen name="CandidateHome" component={CandidateHomeScreen} />
      <AppStack.Screen name="CompanyHome" component={CompanyHomeScreen} />
      <AppStack.Screen
        name="B2B"
        component={B2BScreen}
        initialParams={{ initialTab: 'sales' }}
      />
      <AppStack.Screen name="B2C" component={B2CScreen} />
    </AppStack.Navigator>
  );
}

export function AppNavigator({ user }: { user: AuthUser | null }) {
  return (
    <NavigationContainer>
      {user ? (
        <AppNavigatorStack key={String(user._id)} user={user} />
      ) : (
        <AuthNavigator key="guest" />
      )}
    </NavigationContainer>
  );
}

export function initialRouteForUser(user: AuthUser | null) {
  return user ? homeForRole(user) : 'Login';
}
