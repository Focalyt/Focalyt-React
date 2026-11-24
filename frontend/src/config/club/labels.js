/** Student-friendly display names. Stored values stay the same. */

export const MODE_LABELS = {
  All: 'All',
  'In-Person': 'On campus',
  Online: 'Online',
  Hybrid: 'Both',
};

export const DEFAULT_CLUB_TYPES = ['Creative', 'Sports & Games', 'Social & Impact', 'Tech & Makers'];

export const CATEGORY_LABELS = {
  All: 'All',
  Creative: 'Arts',
  'Sports & Games': 'Sports',
  'Social & Impact': 'Social',
  'Tech & Makers': 'Tech',
};

export const JOIN_METHOD_LABELS = {
  'Open Join': 'Ask to join',
  'Approval Required': 'Ask to join',
};

export const MODE_FILTERS = [
  { value: 'All', label: 'All' },
  { value: 'In-Person', label: 'On campus' },
  { value: 'Online', label: 'Online' },
  { value: 'Hybrid', label: 'Both' },
];

export const CATEGORY_FILTERS = [
  { value: 'All', label: 'All' },
  { value: 'Creative', label: 'Arts' },
  { value: 'Sports & Games', label: 'Sports' },
  { value: 'Social & Impact', label: 'Social' },
  { value: 'Tech & Makers', label: 'Tech' },
];

export const CATEGORY_OPTIONS = CATEGORY_FILTERS.filter((c) => c.value !== 'All');

export function normalizeClubTypes(list) {
  // Empty is allowed — campuses start with zero types until Settings adds some.
  const source = Array.isArray(list) ? list : [];
  const seen = new Set();
  const out = [];
  source.forEach((raw) => {
    const value = String(raw || '').trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(value.slice(0, 60));
  });
  return out;
}

/** Build filter chips from campus-managed club types (plus All). */
export function categoryFiltersFromTypes(clubTypes) {
  const types = normalizeClubTypes(clubTypes);
  return [
    { value: 'All', label: 'All' },
    ...types.map((type) => ({
      value: type,
      label: categoryLabel(type),
    })),
  ];
}

export function categoryOptionsFromTypes(clubTypes) {
  return categoryFiltersFromTypes(clubTypes).filter((item) => item.value !== 'All');
}

export function modeLabel(value) {
  return MODE_LABELS[value] || value;
}

export function categoryLabel(value) {
  return CATEGORY_LABELS[value] || value;
}

export function joinMethodLabel(value) {
  return JOIN_METHOD_LABELS[value] || value;
}
