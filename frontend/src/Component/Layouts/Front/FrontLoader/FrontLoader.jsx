import React from "react";
import "./FrontLoader.css";

const FOCALYT_LOGO = "/Assets/images/logo/focalyt_new_logo.png";
const PARTICLE_COUNT = 14;

export default function FrontLoader() {
  return (
    <div className="foc-front-loader-overlay" role="status" aria-live="polite" aria-busy="true" aria-label="Loading Focalyt">
      <div className="foc-front-loader-particles" aria-hidden="true">
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <span key={i} className="foc-front-loader-particle" />
        ))}
      </div>

      <div className="foc-front-loader">
        <div className="foc-front-loader-stage">
          <div className="foc-front-loader-ripples" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="foc-front-loader-blob" aria-hidden="true" />

          <svg className="foc-front-loader-arcs" viewBox="0 0 300 120" aria-hidden="true">
            <defs>
              <linearGradient id="focArcPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9747ff" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#9747ff" stopOpacity="1" />
                <stop offset="100%" stopColor="#b56dff" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="focArcPink" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fc2b5a" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#fc2b5a" stopOpacity="1" />
                <stop offset="100%" stopColor="#ff6b8f" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <circle className="foc-front-arc foc-front-arc--outer" cx="150" cy="60" r="72" />
            <circle className="foc-front-arc foc-front-arc--inner" cx="150" cy="60" r="58" />
          </svg>

          <div className="foc-front-loader-orbit foc-front-loader-orbit--a" aria-hidden="true">
            <span className="foc-front-loader-satellite" />
          </div>
          <div className="foc-front-loader-orbit foc-front-loader-orbit--b" aria-hidden="true">
            <span className="foc-front-loader-satellite foc-front-loader-satellite--pink" />
          </div>

          <div className="foc-front-loader-logo-shell">
            <span className="foc-front-loader-logo-shine" aria-hidden="true" />
            <img src={FOCALYT_LOGO} alt="Focalyt" className="foc-front-loader-logo" />
          </div>
        </div>

        <div className="foc-front-loader-progress" aria-hidden="true">
          <span className="foc-front-loader-progress-track" />
          <span className="foc-front-loader-progress-comet" />
        </div>

        <p className="foc-front-loader-label">
          <span className="foc-front-loader-label-text">Loading</span>
          <span className="foc-front-loader-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </p>
      </div>
    </div>
  );
}
