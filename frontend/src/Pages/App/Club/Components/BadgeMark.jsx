import React from 'react';
import { isBadgeLogo, resolveBadgeMark } from '../../../../config/club/badgeMarks';

const Glyph = ({ mark }) => {
  if (mark === 'star') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#f6e27a" />
        <circle cx="24" cy="24" r="18" fill="#d4a017" />
        <path fill="#fff8dc" d="M24 10l3.6 8.4 9.1.8-6.9 5.8 2.2 8.8L24 29.4 16 33.8l2.2-8.8-6.9-5.8 9.1-.8z" />
      </svg>
    );
  }
  if (mark === 'ribbon') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="20" r="14" fill="#fc2b5a" />
        <circle cx="24" cy="20" r="9" fill="#fff" />
        <circle cx="24" cy="20" r="6" fill="#e11d48" />
        <path fill="#c2185b" d="M18 30l-4 12 10-6 10 6-4-12z" />
      </svg>
    );
  }
  if (mark === 'torch') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#1d3557" />
        <path fill="#fcbf49" d="M24 8c6 7 2 11 2 16 0-4-6-6-6-12 4 2 4 7 4 7z" />
        <rect x="21" y="24" width="6" height="14" rx="1" fill="#f4ead3" />
        <path fill="#c9a44a" d="M18 38h12l-2 4H20z" />
      </svg>
    );
  }
  if (mark === 'leaf') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#ecfdf3" />
        <circle cx="24" cy="24" r="18" fill="#059669" />
        <path fill="#d1fae5" d="M16 30c8-14 18-16 18-16s0 14-10 20c-4 2-10 0-8-4z" />
        <path stroke="#047857" strokeWidth="1.6" fill="none" d="M19 28c5-4 9-10 12-16" />
      </svg>
    );
  }
  if (mark === 'spark') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#fff1f2" />
        <path fill="#e11d48" d="M24 6l3 12 12 3-12 3-3 12-3-12-12-3 12-3z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#c9a44a" />
      <path fill="#1d3557" d="M24 8l12 6v10c0 8.5-5.4 14.8-12 17-6.6-2.2-12-8.5-12-17V14z" />
      <text x="24" y="28" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
        F
      </text>
    </svg>
  );
};

export const BadgeMark = ({ icon, logoUrl, name, size = 56 }) => {
  const image = logoUrl || (isBadgeLogo(icon) ? icon : '');
  if (image) {
    return (
      <span className="club-badge-mark club-badge-mark--photo" style={{ width: size, height: size }}>
        <img src={image} alt={name || ''} />
      </span>
    );
  }
  const mark = resolveBadgeMark(icon);
  return (
    <span className={`club-badge-mark club-badge-mark--${mark}`} style={{ width: size, height: size }} aria-hidden="true">
      <Glyph mark={mark} />
    </span>
  );
};

export default BadgeMark;
