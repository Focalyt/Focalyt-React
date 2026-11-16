const TEMPLATE_IDS = ['classic', 'honor', 'modern', 'crest'];

const CERTIFICATE_COPY = {
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

function resolveCertificateTemplateId(id) {
  const key = String(id || '').trim().toLowerCase();
  return TEMPLATE_IDS.includes(key) ? key : 'classic';
}

function certificateSerial(id) {
  const raw = String(id || '000000')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-6)
    .toUpperCase()
    .padStart(6, '0');
  return `FC-${raw}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SHEET_CSS = `
  @page { size: A4 landscape; margin: 0; }
  html, body { margin: 0; padding: 0; width: 297mm; height: 210mm; }
  * { box-sizing: border-box; }
  body { background: #ece7dc; }
  .paper {
    position: relative;
    width: 297mm;
    height: 210mm;
    overflow: hidden;
    font-family: Georgia, 'Times New Roman', serif;
  }
  .paper::before {
    content: '';
    position: absolute;
    inset: 8mm;
    pointer-events: none;
  }
  .corner {
    position: absolute;
    width: 16mm;
    height: 16mm;
    z-index: 2;
  }
  .corner.tl { top: 11mm; left: 11mm; border-top: 1.2pt solid; border-left: 1.2pt solid; }
  .corner.tr { top: 11mm; right: 11mm; border-top: 1.2pt solid; border-right: 1.2pt solid; }
  .corner.bl { bottom: 11mm; left: 11mm; border-bottom: 1.2pt solid; border-left: 1.2pt solid; }
  .corner.br { bottom: 11mm; right: 11mm; border-bottom: 1.2pt solid; border-right: 1.2pt solid; }
  .rail, .band { display: none; }
  .inner {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 16mm 28mm 14mm;
  }
  .inner::before {
    content: 'FOCALYT';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42mm;
    letter-spacing: 0.28em;
    opacity: 0.045;
    font-weight: 700;
    pointer-events: none;
  }
  .org {
    margin: 0;
    letter-spacing: 0.46em;
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 700;
  }
  .campus {
    margin: 6px 0 0;
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.78;
  }
  h1 {
    margin: 12px 0 0;
    font-size: 28px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .flourish {
    margin: 10px 0 14px;
    font-size: 16px;
    letter-spacing: 0.4em;
    opacity: 0.7;
  }
  .kicker, .award {
    margin: 0;
    font-size: 14px;
    font-style: italic;
    opacity: 0.82;
  }
  .name {
    margin: 10px 0 12px;
    font-size: 34px;
    font-style: italic;
    font-weight: 400;
    line-height: 1.15;
    padding: 0 8mm 6px;
    border-bottom: 1px solid rgba(0,0,0,0.18);
  }
  .title {
    margin: 10px 0 0;
    font-size: 18px;
    font-weight: 700;
  }
  .extra {
    margin: 6px 0 0;
    font-size: 13px;
    opacity: 0.78;
  }
  .footer {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16mm;
    gap: 12mm;
  }
  .meta { width: 42mm; }
  .meta b { display: block; font-size: 12px; font-weight: 600; }
  .meta small { display: block; margin-top: 4px; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.7; }
  .seal {
    width: 22mm;
    height: 22mm;
    border-radius: 50%;
    border: 1.4pt solid;
    box-shadow: inset 0 0 0 2.2mm currentColor;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    background: rgba(255,255,255,0.35);
  }
  .signs {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-top: 10mm;
    padding: 0 8mm;
  }
  .sign {
    width: 48mm;
    border-top: 1px solid currentColor;
    padding-top: 5px;
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .t-classic { color: #1d3557; background: linear-gradient(180deg, #fffdf7 0%, #f4ead3 100%); }
  .t-classic::before { border: 2.4pt solid #1d3557; box-shadow: inset 0 0 0 1.6mm #c9a44a; }
  .t-classic .corner { color: #c9a44a; border-color: #c9a44a; }
  .t-classic .seal { color: #1d3557; }

  .t-honor { color: #6b4e16; background: linear-gradient(180deg, #fff8e7 0%, #f3e0b0 100%); }
  .t-honor::before { border: 3.2pt solid #b8860b; box-shadow: inset 0 0 0 1.8mm #e6c35c; }
  .t-honor .corner { color: #b8860b; border-color: #b8860b; }
  .t-honor .seal { color: #b8860b; }
  .t-honor h1, .t-honor .name { color: #5b3f0c; }

  .t-modern { color: #1f1235; background: #ffffff; font-family: 'Palatino Linotype', Georgia, serif; }
  .t-modern .rail { display: block; position: absolute; left: 0; top: 0; bottom: 0; width: 9mm; background: linear-gradient(180deg, #FC2B5A, #E11D48); }
  .t-modern::before { border: 1pt solid #ead7e0; left: 14mm; }
  .t-modern .corner { display: none; }
  .t-modern .org, .t-modern .name { color: #E11D48; }
  .t-modern .seal { color: #E11D48; border-color: #E11D48; }

  .t-crest { color: #10233d; background: #ffffff; }
  .t-crest .band {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: absolute;
    left: 0; right: 0; top: 0;
    height: 38mm;
    padding: 0 22mm;
    background: #10233d;
    color: #fff;
    z-index: 1;
  }
  .t-crest .band .org { color: rgba(255,255,255,0.7); margin-bottom: 4px; }
  .t-crest .band h1 { margin: 0; color: #fff; font-size: 24px; }
  .t-crest::before { border: 1.4pt solid #10233d; top: 10mm; }
  .t-crest .inner { padding-top: 42mm; }
  .t-crest .inner h1, .t-crest .inner .org, .t-crest .inner .campus { display: none; }
  .t-crest .corner { color: #10233d; border-color: #c9a44a; }
  .t-crest .seal { color: #FC2B5A; border-color: #FC2B5A; background: #fff; }
`;

function buildCertificateHtml(fields = {}) {
  const templateId = resolveCertificateTemplateId(fields.templateId);
  const copy = CERTIFICATE_COPY[templateId];
  const d = {
    heading: escapeHtml(copy.heading),
    kicker: escapeHtml(copy.kicker),
    award: escapeHtml(copy.award),
    title: escapeHtml(fields.title || 'Club Certificate'),
    studentName: escapeHtml(fields.studentName || 'Student'),
    issuedAt: escapeHtml(fields.issuedAt || ''),
    activityName: escapeHtml(fields.activityName || ''),
    serial: escapeHtml(fields.serial || certificateSerial(fields.certificateId)),
    clubName: escapeHtml(fields.clubName || ''),
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${SHEET_CSS}</style>
</head>
<body>
  <div class="paper t-${templateId}">
    <div class="rail"></div>
    <div class="band">
      <div>
        <p class="org">Focalyt Club</p>
        <h1>${d.heading}</h1>
      </div>
    </div>
    <span class="corner tl"></span>
    <span class="corner tr"></span>
    <span class="corner bl"></span>
    <span class="corner br"></span>
    <div class="inner">
      <p class="org">Focalyt Club</p>
      ${d.clubName ? `<p class="campus">${d.clubName}</p>` : ''}
      <h1>${d.heading}</h1>
      <div class="flourish">✦ · ✦ · ✦</div>
      <p class="kicker">${d.kicker}</p>
      <div class="name">${d.studentName}</div>
      <p class="award">${d.award}</p>
      <p class="title">${d.title}</p>
      ${d.activityName ? `<p class="extra">${d.activityName}</p>` : ''}
      <div class="footer">
        <div class="meta">
          <b>${d.issuedAt || '—'}</b>
          <small>Date of issue</small>
        </div>
        <div class="seal">FC</div>
        <div class="meta">
          <b>${d.serial}</b>
          <small>Certificate no.</small>
        </div>
      </div>
      <div class="signs">
        <div class="sign">Club coordinator</div>
        <div class="sign">Authorised signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  resolveCertificateTemplateId,
  certificateSerial,
  buildCertificateHtml,
};
