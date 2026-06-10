import type { CollegeModuleAccess } from '../auth/permissions';
import type { SideMenuSection } from '../components/SideMenu';

type CollegeMenuActions = {
  onB2BSales?: () => void;
  onB2C?: () => void;
  onLogout: () => void | Promise<void>;
};

export function buildCollegeSideMenuSections(
  actions: CollegeMenuActions,
  access: CollegeModuleAccess,
): SideMenuSection[] {
  const moduleItems: SideMenuSection['items'] = [];

  if (access.b2b && actions.onB2BSales) {
    moduleItems.push({
      id: 'b2b',
      label: 'B2B',
      hint: 'Sales, leads & follow-ups',
      accent: '#10b981',
      defaultExpanded: true,
      children: [
        {
          id: 'b2b-sales',
          label: 'Sales',
          accent: '#10b981',
          onPress: actions.onB2BSales,
        },
      ],
    });
  }

  if (access.b2c && actions.onB2C) {
    moduleItems.push({
      id: 'b2c',
      label: 'B2C',
      hint: 'Admission & candidate leads',
      accent: '#3b82f6',
      onPress: actions.onB2C,
    });
  }

  const sections: SideMenuSection[] = [];

  if (moduleItems.length > 0) {
    sections.push({
      title: 'Modules',
      items: moduleItems,
    });
  }

  sections.push({
    title: 'Account',
    items: [
      {
        id: 'logout',
        label: 'Logout',
        accent: '#ef4444',
        onPress: actions.onLogout,
      },
    ],
  });

  return sections;
}
