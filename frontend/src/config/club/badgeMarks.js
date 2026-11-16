export const BADGE_MARKS = [
  { id: 'crest', label: 'Crest' },
  { id: 'star', label: 'Star' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'torch', label: 'Torch' },
  { id: 'leaf', label: 'Leaf' },
  { id: 'spark', label: 'Spark' },
];

export function resolveBadgeMark(icon) {
  const key = String(icon || '').trim().toLowerCase();
  if (BADGE_MARKS.some((mark) => mark.id === key)) return key;
  if (key === 'fc') return 'crest';
  if (key === 'ev') return 'star';
  return 'crest';
}

export function isBadgeLogo(value) {
  const raw = String(value || '');
  return raw.startsWith('data:image') || raw.startsWith('http://') || raw.startsWith('https://');
}

export function badgeEarned(earnedCodes, badge) {
  const set = earnedCodes instanceof Set ? earnedCodes : new Set((earnedCodes || []).map(String));
  return set.has(String(badge.id)) || set.has(String(badge.code));
}
