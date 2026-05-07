import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './app/auth/AuthContext';
import { loadUser } from './app/auth/authStorage';
import { AppNavigator } from './app/navigation/AppNavigator';
import type { AuthUser } from './app/auth/authTypes';

export default function App() {
  const [booting, setBooting] = React.useState(true);
  const [initialUser, setInitialUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    (async () => {
      const u = await loadUser();
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
  return <AppNavigator user={user} />;
}
