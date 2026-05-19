import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { checkAppVersion, type AppVersionCheck } from '../services/appVersionApi';
import { ForceUpdateScreen } from '../screens/ForceUpdateScreen';
import { college } from '../theme/college';

type Props = {
  children: React.ReactNode;
};

export function AppVersionGate({ children }: Props) {
  const [phase, setPhase] = React.useState<
    'checking' | 'ok' | 'blocked' | 'error'
  >('checking');
  const [updateInfo, setUpdateInfo] = React.useState<AppVersionCheck | null>(
    null,
  );

  const runCheck = React.useCallback(async () => {
    setPhase('checking');
    const res = await checkAppVersion();
    if (!res.ok || !res.data) {
      // Network/API fail — allow app (don't block offline users)
      setPhase('ok');
      return;
    }
    if (res.data.updateRequired) {
      setUpdateInfo(res.data);
      setPhase('blocked');
      return;
    }
    setPhase('ok');
  }, []);

  React.useEffect(() => {
    runCheck();
  }, [runCheck]);

  if (phase === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={college.primary} />
      </View>
    );
  }

  if (phase === 'blocked' && updateInfo) {
    return (
      <ForceUpdateScreen
        info={updateInfo}
        checking={false}
        onRecheck={runCheck}
      />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: college.pageBg,
  },
});
