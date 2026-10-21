import React from 'react';
import './qualificationSetting.css';

const NeoStatusToggle = ({ id, checked, onChange, disabled = false }) => (
  <div className="neo-toggle-container">
    <input
      className="neo-toggle-input"
      id={id}
      type="checkbox"
      checked={!!checked}
      onChange={onChange}
      disabled={disabled}
    />
    <label className="neo-toggle" htmlFor={id}>
      <div className="neo-track">
        <div className="neo-background-layer"></div>
        <div className="neo-grid-layer"></div>
        <div className="neo-spectrum-analyzer">
          <div className="neo-spectrum-bar"></div>
          <div className="neo-spectrum-bar"></div>
          <div className="neo-spectrum-bar"></div>
          <div className="neo-spectrum-bar"></div>
          <div className="neo-spectrum-bar"></div>
        </div>
        <div className="neo-track-highlight"></div>
      </div>

      <div className="neo-thumb">
        <div className="neo-thumb-ring"></div>
        <div className="neo-thumb-core">
          <div className="neo-thumb-icon">
            <div className="neo-thumb-wave"></div>
            <div className="neo-thumb-pulse"></div>
          </div>
        </div>
      </div>

      <div className="neo-gesture-area"></div>

      <div className="neo-interaction-feedback">
        <div className="neo-ripple"></div>
        <div className="neo-progress-arc"></div>
      </div>

      <div className="neo-status">
        <div className="neo-status-indicator">
          <div className="neo-status-dot"></div>
          <div className="neo-status-text"></div>
        </div>
      </div>
    </label>
  </div>
);

export default NeoStatusToggle;
