import React from 'react';
import { usePermission } from '../../hooks/usePermission';

export const Can = ({ permission, children, fallback = null }) => {
  const { can } = usePermission();
  if (!can(permission)) return fallback;
  return children;
};
