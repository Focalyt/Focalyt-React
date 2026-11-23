import React from 'react';
import { membershipLabel, normalizeMembershipStatus } from '../../../../../config/club/membership';

const TONE = {
  joined: 'pill-Joined',
  approved: 'pill-Joined',
  assigned: 'pill-Joined',
  published: 'pill-Joined',
  issued: 'pill-Joined',
  scheduled: 'pill-Joined',
  open: 'pill-pink',
  pending: 'pill-pending',
  requested: 'pill-pending',
  recommended: 'pill-blush',
  rejected: 'pill-neutral',
  blocked: 'pill-neutral',
  filled: 'pill-neutral',
  none: 'pill-neutral',
};

const MEMBER_KEYS = ['none', 'pending', 'approved', 'joined', 'rejected', 'blocked'];

const POSITION_LABELS = {
  pending: 'Pending',
  recommended: 'Recommended',
  assigned: 'Assigned',
  rejected: 'Rejected',
  open: 'Open',
  filled: 'Filled',
};

export const StatusBadge = ({ status }) => {
  const key = String(status || '').toLowerCase();
  const label = MEMBER_KEYS.includes(key)
    ? membershipLabel(normalizeMembershipStatus(key))
    : POSITION_LABELS[key] || status;
  return <span className={`pill ${TONE[key] || 'pill-neutral'}`}>{label}</span>;
};
