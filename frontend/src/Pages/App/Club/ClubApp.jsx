import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ClubProvider } from '../../../contexts/ClubContext';
import { RoleLayout } from '../../../Component/Layouts/App/Club/layouts/RoleLayout';
import { DiscoverPage } from './DiscoverPage/DiscoverPage';
import { ExploreClubsPage } from './ExploreClubsPage/ExploreClubsPage';
import { ClubHomePage } from './ClubHomePage/ClubHomePage';
import { WhatsOnPage } from './WhatOnPage/WhatsOnPage';
import { MySpacePage } from './MySpacePage/MySpacePage';
import { StudentOverviewPage } from './StudentOverviewPage/StudentOverviewPage';
import { PositionsStudentPage } from './PositionsStudentPage/PositionsStudentPage';
import { RewardsStudentPage } from './RewardStudentPage/RewardsStudentPage';
import { CertificatesStudentPage } from './CertificateStudentPage/CertificatesStudentPage';
import { StudentProfilePage } from './StudentProfilePage/StudentProfilePage';
import { CommunityPage } from './CommunityPage/CommunityPage';
import { AnnouncementsPage } from './AnnouncementsPage/AnnouncementsPage';
import { AdminActivitiesPage } from './AdminActivitiesPage/AdminActivitiesPage';
import { StaffDashboardPage } from './StaffDashboardPage/StaffDashboardPage';
import { StaffClubsPage } from './StaffClubsPage/StaffClubsPage';
import { MembersPage } from './MembersPage/MembersPage';
import { PositionsStaffPage } from './PositionsStaffPage/PositionsStaffPage';
import { RegistrationsPage } from './RegistrationsPage/RegistrationsPage';
import { BudgetsPage } from './BudgetsPage/BudgetsPage';
import { ResultsPage } from './ResultsPage/ResultsPage';
import { CertificatesStaffPage } from './CertificatesStaffPage/CertificatesStaffPage';
import { RewardsStaffPage } from './RewardsStaffPage/RewardsStaffPage';
import { SettingsPage } from './SettingPage/SettingsPage';
import { canAccessInstituteClub, getAuthSession } from '../../../config/club/clubAuthSession';
import { ClubRouteGuard } from './Components/cms/ClubRouteGuard';
import './theme/clubStyles.css';

const page = (permission, Page, roles) => (
  <ClubRouteGuard permission={permission} roles={roles}>
    <Page />
  </ClubRouteGuard>
);

export const ClubPublicRedirect = () => {
  const auth = getAuthSession();
  if (!auth.isLoggedIn) {
    return <Navigate to="/candidate/login?returnUrl=/candidate/club/discover" replace />;
  }
  if (auth.role === 'admin') {
    return <Navigate to="/institute/club/dashboard" replace />;
  }
  if (auth.role === 'company') {
    return <Navigate to="/cmp/club/dashboard" replace />;
  }
  return <Navigate to="/candidate/club/discover" replace />;
};

const ClubApp = ({ mode, basePath }) => {
  const isStaff = mode === 'admin' || mode === 'company';

  if (mode === 'admin' && !canAccessInstituteClub()) {
    return <Navigate to="/institute/registration" replace />;
  }

  return (
    <div className={`focalyt-club-root club-in-portal ${mode === 'admin' ? 'club-admin-standalone' : ''}`}>
      <ClubProvider mode={mode} basePath={basePath}>
        <Routes>
          <Route element={<RoleLayout />}>
            {isStaff ? (
              <>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={page('analytics.view', StaffDashboardPage)} />
                <Route path="institutions" element={<Navigate to="dashboard" replace />} />
                <Route path="clubs" element={page('clubs.view', StaffClubsPage)} />
                <Route path="members" element={page('members.view', MembersPage)} />
                <Route path="positions" element={page('positions.view', PositionsStaffPage)} />
                <Route path="people" element={<Navigate to="dashboard" replace />} />
                <Route path="activities" element={page('activities.view', AdminActivitiesPage)} />
                <Route path="registrations" element={page('registrations.view', RegistrationsPage)} />
                <Route path="budgets" element={page('budgets.view', BudgetsPage)} />
                <Route path="results" element={page('results.view', ResultsPage)} />
                <Route path="certificates" element={page('certificates.view', CertificatesStaffPage)} />
                <Route path="rewards" element={page('rewards.view', RewardsStaffPage)} />
                <Route path="posts" element={page('posts.view', CommunityPage)} />
                <Route path="announcements" element={page('announcements.view', AnnouncementsPage)} />
                <Route path="profile" element={page('profile.edit', StudentProfilePage)} />
                <Route path="settings" element={page('settings.manage', SettingsPage)} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </>
            ) : (
              <>
                <Route index element={<Navigate to="discover" replace />} />
                <Route path="overview" element={page('profile.view', StudentOverviewPage)} />
                <Route path="discover" element={page('clubs.view', DiscoverPage)} />
                <Route path="clubs" element={page('clubs.view', ExploreClubsPage)} />
                <Route path="clubs/:clubId" element={page('clubs.view', ClubHomePage)} />
                <Route path="whats-on" element={page('activities.view', WhatsOnPage)} />
                <Route path="my-space" element={page('profile.view', MySpacePage)} />
                <Route path="positions" element={page('positions.request', PositionsStudentPage)} />
                <Route path="budgets" element={page('budgets.request', BudgetsPage)} />
                <Route path="rewards" element={page('rewards.view', RewardsStudentPage)} />
                <Route path="certificates" element={page('certificates.view', CertificatesStudentPage)} />
                <Route path="community" element={page('posts.view', CommunityPage)} />
                <Route path="announcements" element={page('announcements.view', AnnouncementsPage)} />
                <Route path="profile" element={page('profile.view', StudentProfilePage)} />
                <Route path="*" element={<Navigate to="discover" replace />} />
              </>
            )}
          </Route>
        </Routes>
      </ClubProvider>
    </div>
  );
};

export default ClubApp;
