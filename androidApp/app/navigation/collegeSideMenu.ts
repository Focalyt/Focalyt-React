import type { SideMenuSection } from '../components/SideMenu';

type CollegeMenuActions = {
  onB2BSales: () => void;
  onLogout: () => void | Promise<void>;
};

export function buildCollegeSideMenuSections(
  actions: CollegeMenuActions,
): SideMenuSection[] {
  return [
    {
      title: 'Modules',
      items: [
        {
          id: 'b2b',
          label: 'B2B',
          hint: 'Sales, leads & follow-ups',
          accent: '#10b981',
          defaultExpanded: true,
          children: [
            // {
            //   id: 'b2b-dashboard',
            //   label: 'Dashboard',
            //   accent: '#3b82f6',
            //   onPress: actions.onB2BDashboard,
            // },
            {
              id: 'b2b-sales',
              label: 'Sales',
              accent: '#10b981',
              onPress: actions.onB2BSales,
            },
            // {
            //   id: 'b2b-followup',
            //   label: 'Follow-up',
            //   accent: '#f59e0b',
            //   onPress: actions.onB2BFollowup,
            // },
          ],
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'logout',
          label: 'Logout',
          accent: '#ef4444',
          onPress: actions.onLogout,
        },
      ],
    },
  ];
}
