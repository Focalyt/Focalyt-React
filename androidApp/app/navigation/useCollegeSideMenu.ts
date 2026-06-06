import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { clearUser } from '../auth/authStorage';
import { getCollegeModuleAccess } from '../auth/permissions';
import type { SideMenuSection } from '../components/SideMenu';
import type { RootStackParamList } from './AppNavigator';
import { buildCollegeSideMenuSections } from './collegeSideMenu';

export function useCollegeSideMenu() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setUser } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const access = React.useMemo(() => getCollegeModuleAccess(user), [user]);

  const menuSections: SideMenuSection[] = React.useMemo(
    () =>
      buildCollegeSideMenuSections(
        {
          onB2BSales: access.b2b
            ? () => navigation.navigate('B2B', { initialTab: 'sales' })
            : undefined,
          onB2C: access.b2c ? () => navigation.navigate('B2C') : undefined,
          onLogout: async () => {
            await clearUser();
            setUser(null);
          },
        },
        access,
      ),
    [access, navigation, setUser],
  );

  return { menuSections, menuOpen, setMenuOpen, access };
}
