import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthUser } from '../auth/authTypes';
import { LoginScreen } from '../screens/LoginScreen';
import { CollegeHomeScreen } from '../screens/CollegeHomeScreen';
import { CandidateHomeScreen } from '../screens/CandidateHomeScreen';
import { CompanyHomeScreen } from '../screens/CompanyHomeScreen';
import { B2BScreen } from '../screens/B2BScreen';

export type B2BInitialTab = 'dashboard' | 'sales' | 'followup';

export type RootStackParamList = {
  Login: undefined;
  CollegeHome: undefined;
  CandidateHome: undefined;
  CompanyHome: undefined;
  B2B: { initialTab?: B2BInitialTab } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function homeForRole(role: AuthUser['role']) {
  if (role === 2) return 'CollegeHome' as const;
  if (role === 3) return 'CandidateHome' as const;
  return 'CompanyHome' as const; // role 1 (company) default
}

export function AppNavigator({ user }: { user: AuthUser | null }) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteForUser(user)}
        screenOptions={{ headerShown: false }}
      >
        {user ? (
          <>
            <Stack.Screen name="CollegeHome" component={CollegeHomeScreen} />
            <Stack.Screen name="CandidateHome" component={CandidateHomeScreen} />
            <Stack.Screen name="CompanyHome" component={CompanyHomeScreen} />
            <Stack.Screen name="B2B" component={B2BScreen} />
          </>
        ) : null}
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function initialRouteForUser(user: AuthUser | null) {
  return user ? homeForRole(user.role) : 'Login';
}

