/** Brand / initiative logos for Four Pillars project cards (matches creative artwork) */

function LogoWrap({ children, bg = "transparent" }) {
    return (
      <svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect width="34" height="34" rx="8" fill={bg} />
        {children}
      </svg>
    );
  }
  
  export function LogoSamsung() {
    return (
      <LogoWrap bg="#1428A0">
        <text x="17" y="14" textAnchor="middle" fill="white" fontSize="5.5" fontFamily="Orbitron, monospace" fontWeight="800" letterSpacing="0.3">
          SAMSUNG
        </text>
        <rect x="6" y="16" width="22" height="0.7" fill="rgba(255,255,255,0.35)" />
        <text x="17" y="23" textAnchor="middle" fill="#a0b8f0" fontSize="4.2" fontFamily="Orbitron, monospace" fontWeight="700" letterSpacing="0.4">
          INNOVATION
        </text>
        <text x="17" y="28" textAnchor="middle" fill="#a0b8f0" fontSize="3.8" fontFamily="Orbitron, monospace" fontWeight="500">
          CAMPUS
        </text>
      </LogoWrap>
    );
  }
  
  export function LogoEsdm() {
    return (
      <LogoWrap bg="#2e7d32">
        <rect x="9" y="9" width="16" height="16" rx="2.5" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
        <rect x="12" y="12" width="10" height="10" rx="1.5" fill="rgba(255,255,255,0.2)" />
        <line x1="17" y1="12" x2="17" y2="22" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
        <line x1="12" y1="17" x2="22" y2="17" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
        <line x1="5" y1="13" x2="9" y2="13" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5" y1="17" x2="9" y2="17" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="5" y1="21" x2="9" y2="21" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="25" y1="13" x2="29" y2="13" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="25" y1="17" x2="29" y2="17" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="25" y1="21" x2="29" y2="21" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="13" y1="5" x2="13" y2="9" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="17" y1="5" x2="17" y2="9" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="21" y1="5" x2="21" y2="9" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="13" y1="25" x2="13" y2="29" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="17" y1="25" x2="17" y2="29" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="21" y1="25" x2="21" y2="29" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
      </LogoWrap>
    );
  }
  
  export function LogoIot() {
    return (
      <LogoWrap bg="#0277bd">
        <circle cx="17" cy="22" r="2.2" fill="white" />
        <path d="M12 18 Q17 13 22 18" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8.5 14.5 Q17 7 25.5 14.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" />
        <text x="17" y="30.5" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="5" fontFamily="Orbitron, monospace" fontWeight="800" letterSpacing="1">
          IoT
        </text>
      </LogoWrap>
    );
  }
  
  export function LogoRuralYouth() {
    return (
      <LogoWrap bg="#558b2f">
        <line x1="17" y1="28" x2="17" y2="18" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M17 22 Q10 18 9 11 Q15 11 17 18Z" fill="rgba(255,255,255,0.85)" />
        <path d="M17 18 Q19 11 25 10 Q25 17 17 22Z" fill="rgba(255,255,255,0.6)" />
        <line x1="11" y1="28" x2="23" y2="28" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
      </LogoWrap>
    );
  }
  
  export function LogoEricsson() {
    return (
      <LogoWrap bg="#0066cc">
        <circle cx="17" cy="24" r="2" fill="white" />
        <path d="M12 19.5 Q17 14.5 22 19.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 16 Q17 8.5 25.5 16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeLinecap="round" />
        <text x="17" y="10" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="4" fontFamily="Orbitron, monospace" fontWeight="700" letterSpacing="0.5">
          ERICSSON
        </text>
      </LogoWrap>
    );
  }
  
  export function LogoCoe() {
    return (
      <LogoWrap bg="#7c3aed">
        <circle cx="17" cy="15" r="5.5" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
        <circle cx="17" cy="15" r="2.5" fill="rgba(255,255,255,0.85)" />
        <line x1="17" y1="6.5" x2="17" y2="9.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="17" y1="20.5" x2="17" y2="23.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8.5" y1="15" x2="11.5" y2="15" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="22.5" y1="15" x2="25.5" y2="15" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <text x="17" y="30" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="4.5" fontFamily="Orbitron, monospace" fontWeight="800">
          CoE
        </text>
      </LogoWrap>
    );
  }
  
  export function LogoFtlaas() {
    return (
      <LogoWrap bg="#0369a1">
        <rect x="7" y="10" width="20" height="14" rx="2" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" />
        <rect x="10" y="13" width="14" height="8" rx="1" fill="rgba(255,255,255,0.18)" />
        <line x1="10" y1="16" x2="24" y2="16" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
        <line x1="10" y1="18.5" x2="24" y2="18.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
        <text x="17" y="29.5" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="4" fontFamily="Orbitron, monospace" fontWeight="800" letterSpacing="0.3">
          FTLaaS
        </text>
      </LogoWrap>
    );
  }
  
  export function LogoCollegeInnovation() {
    return (
      <LogoWrap bg="#4f46e5">
        <rect x="8" y="20" width="5" height="8" rx="1" fill="rgba(255,255,255,0.5)" />
        <rect x="14.5" y="15" width="5" height="13" rx="1" fill="rgba(255,255,255,0.7)" />
        <rect x="21" y="10" width="5" height="18" rx="1" fill="rgba(255,255,255,0.9)" />
        <polyline points="9,19 15,14 21.5,9" fill="none" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="19" r="1.5" fill="#fde68a" />
        <circle cx="15" cy="14" r="1.5" fill="#fde68a" />
        <circle cx="21.5" cy="9" r="1.5" fill="#fde68a" />
      </LogoWrap>
    );
  }
  
  export function LogoFacultyDev() {
    return (
      <LogoWrap bg="#0f766e">
        <circle cx="17" cy="12" r="4" fill="rgba(255,255,255,0.85)" />
        <path d="M9 27 Q9 20 17 20 Q25 20 25 27" fill="rgba(255,255,255,0.55)" />
        <circle cx="24" cy="20" r="3" fill="rgba(255,255,255,0.7)" />
        <line x1="24" y1="15" x2="24" y2="11" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="21" y1="13" x2="27" y2="13" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
      </LogoWrap>
    );
  }
  
  export function LogoMsmeDigital() {
    return (
      <LogoWrap bg="#4f46e5">
        <rect x="7" y="10" width="20" height="14" rx="2" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" />
        <rect x="10" y="13" width="14" height="8" rx="1" fill="rgba(255,255,255,0.15)" />
        <line x1="10" y1="16" x2="24" y2="16" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <line x1="13" y1="13" x2="13" y2="21" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <circle cx="25" cy="10" r="3" fill="#34d399" />
        <line x1="23.5" y1="10" x2="26.5" y2="10" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="25" y1="8.5" x2="25" y2="11.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </LogoWrap>
    );
  }
  
  export function LogoIndustry40() {
    return (
      <LogoWrap bg="#7c3aed">
        <rect x="14" y="22" width="6" height="3" rx="1" fill="rgba(255,255,255,0.8)" />
        <rect x="15.5" y="16" width="3" height="7" rx="1" fill="rgba(255,255,255,0.7)" />
        <rect x="11" y="11" width="8" height="6" rx="2" fill="rgba(255,255,255,0.55)" />
        <circle cx="17" cy="14" r="2" fill="rgba(255,255,255,0.9)" />
        <line x1="8" y1="22" x2="26" y2="22" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        <text x="17" y="30.5" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="3.8" fontFamily="Orbitron, monospace" fontWeight="700" letterSpacing="0.3">
          INDUSTRY 4.0
        </text>
      </LogoWrap>
    );
  }
  
  export function LogoLeanZero() {
    return (
      <LogoWrap bg="#0f766e">
        <path d="M17 6 L25 9.5 L25 17 Q25 23 17 27 Q9 23 9 17 L9 9.5 Z" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" />
        <polyline points="13,16.5 16,19.5 21.5,13" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </LogoWrap>
    );
  }
  
  export function LogoWorkforceUpskill() {
    return (
      <LogoWrap bg="#0369a1">
        <circle cx="12" cy="11" r="3.5" fill="rgba(255,255,255,0.8)" />
        <circle cx="22" cy="11" r="3.5" fill="rgba(255,255,255,0.6)" />
        <path d="M5 25 Q5 18 12 18 Q17 18 19 21" fill="rgba(255,255,255,0.5)" />
        <path d="M16 25 Q16 20 22 20 Q28 20 28 25" fill="rgba(255,255,255,0.7)" />
        <line x1="22" y1="14" x2="22" y2="17" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      </LogoWrap>
    );
  }
  
  export function LogoEntrepreneurship() {
    return (
      <LogoWrap bg="#d97706">
        <circle cx="17" cy="13" r="5.5" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.4" />
        <path d="M14 18 Q14 21 17 21 Q20 21 20 18" fill="rgba(255,255,255,0.55)" />
        <line x1="15" y1="22.5" x2="19" y2="22.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="15.5" y1="24.5" x2="18.5" y2="24.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="17" y1="5" x2="17" y2="7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="22.5" y1="7.5" x2="21" y2="9" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="11.5" y1="7.5" x2="13" y2="9" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
      </LogoWrap>
    );
  }
  
  export function LogoPanasonicHarit() {
    return (
      <svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect width="17" height="34" rx="8" fill="#00436b" />
        <text x="9" y="22" fill="white" fontSize="14" fontFamily="Orbitron, monospace" fontWeight="900">
          P
        </text>
        <rect width="17" height="34" x="17" rx="8" fill="#2e7d32" />
        <line x1="26" y1="22" x2="26" y2="14" stroke="rgba(255,255,255,0.9)" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M26 18 Q21 15 20 9 Q24 9 26 14Z" fill="rgba(255,255,255,0.85)" />
        <path d="M26 14 Q27 9 31 8 Q31 14 26 18Z" fill="rgba(255,255,255,0.6)" />
      </svg>
    );
  }
  
  export function LogoVrSafety() {
    return (
      <LogoWrap bg="#1d4ed8">
        <rect x="7" y="12" width="20" height="12" rx="4" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" />
        <circle cx="13" cy="18" r="3" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
        <circle cx="21" cy="18" r="3" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
        <line x1="16" y1="18" x2="18" y2="18" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
        <path d="M7 16 L4 14 L4 22 L7 20" fill="rgba(255,255,255,0.4)" />
        <path d="M27 16 L30 14 L30 22 L27 20" fill="rgba(255,255,255,0.4)" />
      </LogoWrap>
    );
  }
  
  export function LogoOrganicFarming() {
    return (
      <LogoWrap bg="#16a34a">
        <circle cx="12" cy="23" r="4" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" />
        <circle cx="12" cy="23" r="1.5" fill="rgba(255,255,255,0.6)" />
        <circle cx="23" cy="24" r="3" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
        <rect x="13" y="16" width="11" height="7" rx="1.5" fill="rgba(255,255,255,0.5)" />
        <rect x="16" y="13" width="6" height="5" rx="1" fill="rgba(255,255,255,0.7)" />
        <path d="M14 13 Q17 8 22 10" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
        <circle cx="22" cy="10" r="1.5" fill="rgba(134,239,172,0.9)" />
      </LogoWrap>
    );
  }
  
  export function LogoRenewableSolar() {
    return (
      <LogoWrap bg="#d97706">
        <circle cx="17" cy="13" r="4" fill="rgba(255,255,255,0.9)" />
        <line x1="17" y1="6" x2="17" y2="8.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="23.2" y1="7.8" x2="21.5" y2="9.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="25.5" y1="13" x2="23" y2="13" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="10.8" y1="7.8" x2="12.5" y2="9.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="8.5" y1="13" x2="11" y2="13" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="8" y="20" width="18" height="8" rx="1.5" fill="rgba(255,255,255,0.55)" />
        <line x1="8" y1="24" x2="26" y2="24" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <line x1="14" y1="20" x2="14" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <line x1="20" y1="20" x2="20" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      </LogoWrap>
    );
  }
  
  export function LogoGreenEntrepreneurship() {
    return (
      <LogoWrap bg="#15803d">
        <rect x="7" y="22" width="4" height="6" rx="1" fill="rgba(255,255,255,0.4)" />
        <rect x="13" y="17" width="4" height="11" rx="1" fill="rgba(255,255,255,0.6)" />
        <rect x="19" y="12" width="4" height="16" rx="1" fill="rgba(255,255,255,0.8)" />
        <line x1="21" y1="12" x2="21" y2="8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M21 10 Q24 7 27 8 Q26 12 21 10Z" fill="rgba(134,239,172,0.9)" />
        <polyline points="9,21 15,16 21,11" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2,1.5" />
      </LogoWrap>
    );
  }
  
  export const PILLAR_PROJECT_LOGOS = {
    samsung: LogoSamsung,
    esdm: LogoEsdm,
    iot: LogoIot,
    "rural-youth": LogoRuralYouth,
    ericsson: LogoEricsson,
    coe: LogoCoe,
    ftlaas: LogoFtlaas,
    "college-innovation": LogoCollegeInnovation,
    "faculty-dev": LogoFacultyDev,
    "msme-digital": LogoMsmeDigital,
    "industry-40": LogoIndustry40,
    "lean-zero": LogoLeanZero,
    "workforce-upskill": LogoWorkforceUpskill,
    entrepreneurship: LogoEntrepreneurship,
    "panasonic-harit": LogoPanasonicHarit,
    "vr-safety": LogoVrSafety,
    "organic-farming": LogoOrganicFarming,
    "renewable-solar": LogoRenewableSolar,
    "green-entrepreneurship": LogoGreenEntrepreneurship,
  };
  
  export function PillarProjectLogo({ logoKey }) {
    const Logo = PILLAR_PROJECT_LOGOS[logoKey];
    if (!Logo) return null;
    return <Logo />;
  }
  