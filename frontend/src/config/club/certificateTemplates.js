export const CERTIFICATE_TEMPLATES = [
  { id: 'classic', label: 'Classic', hint: 'Ivory paper, navy frame' },
  { id: 'honor', label: 'Distinction', hint: 'Gold ceremonial' },
  { id: 'modern', label: 'Campus', hint: 'Focalyt letterhead' },
  { id: 'crest', label: 'Institute', hint: 'Formal crest' },
];

export const DEFAULT_CERTIFICATE_TEMPLATE_ID = 'classic';

export const CERTIFICATE_COPY = {
  classic: {
    heading: 'Certificate of Participation',
    kicker: 'This is to certify that',
    award: 'has successfully participated in',
  },
  honor: {
    heading: 'Certificate of Excellence',
    kicker: 'This is to certify that',
    award: 'has been awarded this distinction for',
  },
  modern: {
    heading: 'Certificate of Achievement',
    kicker: 'This is to certify that',
    award: 'is hereby recognised for',
  },
  crest: {
    heading: 'Certificate of Merit',
    kicker: 'This is to certify that',
    award: 'has fulfilled the requirements of',
  },
};

export function resolveCertificateTemplateId(id) {
  const key = String(id || '').trim().toLowerCase();
  return CERTIFICATE_TEMPLATES.some((item) => item.id === key) ? key : DEFAULT_CERTIFICATE_TEMPLATE_ID;
}

export function getCertificateTemplate(id) {
  const resolved = resolveCertificateTemplateId(id);
  return CERTIFICATE_TEMPLATES.find((item) => item.id === resolved);
}

export function getCertificateCopy(id) {
  return CERTIFICATE_COPY[resolveCertificateTemplateId(id)];
}

export function certificateSerial(id) {
  const raw = String(id || '000000')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-6)
    .toUpperCase()
    .padStart(6, '0');
  return `FC-${raw}`;
}
