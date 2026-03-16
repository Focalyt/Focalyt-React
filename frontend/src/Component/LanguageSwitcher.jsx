import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  return (
    <div style={{  }}>
      <select
        value={i18n.language}
        onChange={(e) => {
          const lang = e.target.value;
          i18n.changeLanguage(lang);
          localStorage.setItem("lang", lang);
        }}
        style={{
          padding: '6px 12px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          fontWeight: 'bold',
          minWidth: '120px',
          cursor: 'pointer'
        }}
        aria-label="Select language"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी</option>
        <option value="pa">ਪੰਜਾਬੀ</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
