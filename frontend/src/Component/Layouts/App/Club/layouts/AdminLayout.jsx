import React from 'react';
import { Outlet } from 'react-router-dom';
import { ToastViewport } from '../../../../../Pages/App/Club/Components/ToastViewport';

export const AdminLayout = () => {
  return (
    <div className="club-portal-shell club-admin-portal">
      <main className="admin-main club-admin-embedded">
        <Outlet />
      </main>
      <ToastViewport />
    </div>
  );
};
