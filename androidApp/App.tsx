import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './app/auth/AuthContext';
import { loadUser, saveUser } from './app/auth/authStorage';
import { refreshUserPermissions } from './app/auth/refreshUserPermissions';
import { AppNavigator } from './app/navigation/AppNavigator';
import { AppVersionGate } from './app/components/AppVersionGate';
import type { AuthUser } from './app/auth/authTypes';

export default function App() {
  const [booting, setBooting] = React.useState(true);
  const [initialUser, setInitialUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    (async () => {
      let u = await loadUser();
      if (u) {
        u = await refreshUserPermissions(u);
        await saveUser(u);
      }
      setInitialUser(u);
      setBooting(false);
    })();
  }, []);

  if (booting) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider initialUser={initialUser}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#f5f5f5"
          translucent={false}
        />
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { user } = useAuth();
  return (
    <AppVersionGate>
      <AppNavigator user={user} />
    </AppVersionGate>
  );
}
