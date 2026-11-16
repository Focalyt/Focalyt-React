export const CLUB_THEME_TEMPLATES = [
  {
    id: 'Sky Magenta',
    label: 'Sky Magenta',
    primary: '#FC2B5A',
    deep: '#C2185B',
    secondary: '#FFE4EC',
    bg: '#FFF0F4',
    motif: 'art',
  },
  {
    id: 'Campus Blue',
    label: 'Campus Blue',
    primary: '#1BA7FF',
    deep: '#0B6FBD',
    secondary: '#DFF1FF',
    bg: '#EAF4FF',
    motif: 'sports',
  },
  {
    id: 'Sunset Gold',
    label: 'Sunset Gold',
    primary: '#F59E0B',
    deep: '#B45309',
    secondary: '#FEF3C7',
    bg: '#FFFBEB',
    motif: 'event',
  },
  {
    id: 'Forest Green',
    label: 'Forest Green',
    primary: '#059669',
    deep: '#047857',
    secondary: '#D1FAE5',
    bg: '#ECFDF5',
    motif: 'kindred',
  },
  {
    id: 'Midnight Plum',
    label: 'Midnight Plum',
    primary: '#7C3AED',
    deep: '#5B21B6',
    secondary: '#EDE9FE',
    bg: '#F5F3FF',
    motif: 'afterhours',
  },
  {
    id: 'Coral Blush',
    label: 'Coral Blush',
    primary: '#FB7185',
    deep: '#E11D48',
    secondary: '#FFE4E6',
    bg: '#FFF1F2',
    motif: 'makers',
  },
];

export const CLUB_THEME_OPTIONS = CLUB_THEME_TEMPLATES.map((template) => template.id);

export function getClubTheme(themeId) {
  return (
    CLUB_THEME_TEMPLATES.find((template) => template.id === themeId) || CLUB_THEME_TEMPLATES[0]
  );
}
