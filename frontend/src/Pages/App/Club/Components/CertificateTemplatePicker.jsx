import React from 'react';
import { CERTIFICATE_TEMPLATES, resolveCertificateTemplateId } from '../../../../config/club/certificateTemplates';

export const CertificateTemplatePicker = ({ value, onChange }) => {
  const selected = resolveCertificateTemplateId(value);
  return (
    <div className="club-cert-chips" role="listbox" aria-label="Certificate templates">
      {CERTIFICATE_TEMPLATES.map((template) => {
        const isOn = selected === template.id;
        return (
          <button
            key={template.id}
            type="button"
            role="option"
            aria-selected={isOn}
            className={`club-cert-chip ${isOn ? 'is-on' : ''}`}
            onClick={() => onChange(template.id)}
          >
            <i className={`club-cert-swatch club-cert-swatch--${template.id}`} aria-hidden="true" />
            <span>
              <strong>{template.label}</strong>
              <em>{template.hint}</em>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CertificateTemplatePicker;
