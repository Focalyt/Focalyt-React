import React from 'react';
import {
  certificateSerial,
  getCertificateCopy,
  getCertificateTemplate,
  resolveCertificateTemplateId,
} from '../../../../config/club/certificateTemplates';

export const CertificateSheet = ({
  templateId,
  title,
  studentName,
  clubName,
  activityName,
  issuedAt,
  serial,
  certificateId,
}) => {
  const resolved = resolveCertificateTemplateId(templateId);
  const template = getCertificateTemplate(resolved);
  const copy = getCertificateCopy(resolved);
  const number = serial || certificateSerial(certificateId);

  return (
    <article className={`club-cert-sheet club-cert-sheet--${resolved}`} aria-label={`${template.label} certificate`}>
      <span className="club-cert-sheet__rail" />
      <div className="club-cert-sheet__band">
        <p>Focalyt Club</p>
        <h3>{copy.heading}</h3>
      </div>
      <span className="club-cert-sheet__corner club-cert-sheet__corner--tl" />
      <span className="club-cert-sheet__corner club-cert-sheet__corner--tr" />
      <span className="club-cert-sheet__corner club-cert-sheet__corner--bl" />
      <span className="club-cert-sheet__corner club-cert-sheet__corner--br" />
      <div className="club-cert-sheet__inner">
        <p className="club-cert-sheet__org">Focalyt Club</p>
        {clubName ? <p className="club-cert-sheet__campus">{clubName}</p> : null}
        <h3>{copy.heading}</h3>
        <span className="club-cert-sheet__flourish">✦ · ✦ · ✦</span>
        <p className="club-cert-sheet__kicker">{copy.kicker}</p>
        <strong className="club-cert-sheet__name">{studentName || 'Student name'}</strong>
        <p className="club-cert-sheet__award">{copy.award}</p>
        <p className="club-cert-sheet__title">{title || 'Certificate title'}</p>
        {activityName ? <p className="club-cert-sheet__extra">{activityName}</p> : null}
        <div className="club-cert-sheet__footer">
          <div>
            <b>{issuedAt || '—'}</b>
            <small>Date of issue</small>
          </div>
          <span className="club-cert-sheet__seal">FC</span>
          <div>
            <b>{number}</b>
            <small>Certificate no.</small>
          </div>
        </div>
        <div className="club-cert-sheet__signs">
          <span>Club coordinator</span>
          <span>Authorised signatory</span>
        </div>
      </div>
    </article>
  );
};

export default CertificateSheet;
