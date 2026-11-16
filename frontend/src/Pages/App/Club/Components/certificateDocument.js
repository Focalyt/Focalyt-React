import { clubCmsApi } from '../../../../services/club/clubCmsApi';
import { resolveCertificateTemplateId } from '../../../../config/club/certificateTemplates';
import { buildCertificateHtml } from './certificateHtml';

function isStoredCert(cert) {
  return /^[a-fA-F0-9]{24}$/.test(String(cert?.id || ''));
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fieldsFor(cert, extras = {}) {
  return {
    title: cert.title,
    studentName: extras.studentName || cert.studentName,
    issuedAt: extras.issuedAt || cert.issuedAt,
    clubName: extras.clubName,
    activityName: extras.activityName,
    templateId: resolveCertificateTemplateId(extras.templateId || cert.templateId),
    certificateId: cert.id,
    serial: extras.serial,
  };
}

function htmlFallbackBlob(cert, extras) {
  return new Blob([buildCertificateHtml(fieldsFor(cert, extras))], { type: 'text/html' });
}

export async function printCertificateDocument(cert, extras = {}) {
  const fields = fieldsFor(cert, extras);
  try {
    if (isStoredCert(cert)) {
      const blob = await clubCmsApi.downloadCertificateFile(cert.id, fields.templateId);
      if (blob && blob.type && blob.type.includes('json')) throw new Error('not a pdf');
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.addEventListener('load', () => win.print());
      }
      return;
    }
  } catch {
    // fall through
  }
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(buildCertificateHtml(fields));
  win.document.close();
  win.focus();
  win.print();
}

export async function downloadCertificateDocument(cert, extras = {}) {
  const fields = fieldsFor(cert, extras);
  const baseName = String(cert.title || 'club-certificate').replace(/\s+/g, '-');
  try {
    if (isStoredCert(cert)) {
      const blob = await clubCmsApi.downloadCertificateFile(cert.id, fields.templateId);
      if (blob && blob.type && blob.type.includes('json')) throw new Error('not a pdf');
      saveBlob(blob, `${baseName}.pdf`);
      return;
    }
  } catch {
    // fall through
  }
  saveBlob(htmlFallbackBlob(cert, extras), `${baseName}.html`);
}
