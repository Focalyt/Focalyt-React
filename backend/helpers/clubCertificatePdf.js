const puppeteer = require('puppeteer');
const { buildCertificateHtml, resolveCertificateTemplateId, certificateSerial } = require('./clubCertificateTemplates');

function pdfEscape(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildSimplePdf({ title, studentName, issuedAt, clubName, activityName, templateId }) {
  const lines = [
    'Focalyt Club',
    resolveCertificateTemplateId(templateId).toUpperCase(),
    'Certificate',
    `This recognises ${studentName || 'Student'}`,
    title || 'Club Certificate',
    [clubName, activityName].filter(Boolean).join(' · '),
    `Issued ${issuedAt || ''}`,
  ].filter(Boolean);

  const content = lines
    .map((line, idx) => `BT /F1 ${idx === 2 || idx === 3 ? 22 : 14} Tf 72 ${520 - idx * 32} Td (${pdfEscape(line)}) Tj ET`)
    .join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >> endobj',
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(Buffer.byteLength(body));
    body += `${obj}\n`;
  });
  const xref = offsets.length - 1;
  const startxref = Buffer.byteLength(body);
  body += `xref\n0 ${xref + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= xref; i += 1) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer << /Size ${xref + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;
  return Buffer.from(body, 'utf8');
}

async function renderCertificatePdf(fields) {
  const html = buildCertificateHtml(fields);
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      return await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error('Club certificate puppeteer failed, using simple PDF:', err.message);
    return buildSimplePdf(fields);
  }
}

module.exports = { renderCertificatePdf, buildCertificateHtml, resolveCertificateTemplateId, certificateSerial };
