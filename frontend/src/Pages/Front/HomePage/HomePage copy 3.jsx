import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import FrontLayout from "../../../Component/Layouts/Front/index";
import { PillarProjectLogo } from "./PillarProjectLogos";
import axios from "axios";
import moment from "moment";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Award,
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Building,
  Car,
  Check,
  Cloud,
  Code,
  Cpu,
  Droplet,
  Factory,
  FlaskConical,
  Glasses,
  Globe,
  Handshake,
  Image as ImageIcon,
  Laptop,
  Leaf,
  Lightbulb,
  LineChart,
  MapPin,
  Plane,
  Radio,
  Recycle,
  School,
  Settings2,
  Shield,
  Smartphone,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Target,
  Trees,
  TrendingUp,
  Tractor,
  User,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

const IP_ICON_MAP = {
  award: Award,
  brain: Brain,
  briefcase: Briefcase,
  building: Building,
  "building-factory": Factory,
  car: Car,
  chart: BarChart3,
  check: Check,
  cloud: Cloud,
  code: Code,
  cpu: Cpu,
  droplet: Droplet,
  factory: Factory,
  flask: FlaskConical,
  glasses: Glasses,
  globe: Globe,
  handshake: Handshake,
  laptop: Laptop,
  leaf: Leaf,
  lightbulb: Lightbulb,
  linechart: LineChart,
  plane: Plane,
  radio: Radio,
  recycle: Recycle,
  robot: Bot,
  school: School,
  settings: Settings2,
  shield: Shield,
  smartphone: Smartphone,
  sparkles: Sparkles,
  sprout: Sprout,
  star: Star,
  sun: Sun,
  target: Target,
  trees: Trees,
  trending: TrendingUp,
  tractor: Tractor,
  user: User,
  users: Users,
  wifi: Wifi,
  zap: Zap,
};

function IpIcon({ name, size = 14, className = "" }) {
  const Icon = IP_ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={2} aria-hidden />;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   FOCALYT AURORA (Light Theme) â€” SCOPED STYLES (wrapped in .foc-cyber-home)
   Logo-inspired accents: Purple â†’ Pink
   BG: off-white / cool gray for readability
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Exo+2:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');

html { scroll-behavior: smooth; }

.foc-cyber-home, .foc-cyber-home * { box-sizing: border-box; }

.foc-cyber-home {
  /* these are filled by the active theme below */
  --cyan: #7A2BFF;
  --red: #FF2D7A;
  --bg: #F6F8FF;
  --bg2: #EEF3FF;
  --surface: #FFFFFF;
  --surface2: #F3F6FF;
  --border: rgba(16, 24, 40, .12);
  --border-hi: rgba(16, 24, 40, .18);
  --text: #0B1220;
  --muted: #4B5B78;
  --muted2: #6B7A97;
  --scanline-a: rgba(11,18,32,.00);
  --scanline-b: rgba(11,18,32,.02);
  --grid-line: rgba(11,18,32,.06);
  --orb1: rgba(122,43,255,.16);
  --orb2: rgba(255,45,122,.14);
  --heroGlowC: rgba(122,43,255,.18);
  --heroGlowR: rgba(255,45,122,.16);
  --pillBg: rgba(122,43,255,.06);
  --pillHoverBorder: rgba(122,43,255,.28);
  --pillHoverShadow: rgba(122,43,255,.12);
  --primaryShadow: rgba(122,43,255,.18);
  --primaryShadowHover: rgba(255,45,122,.18);
  --statHoverBorder: rgba(122,43,255,.28);
  --statHoverShadow: rgba(122,43,255,.12);
  --dotShadow: rgba(122,43,255,.16);
  --terminalBg: var(--surface2);
  --cyan-soft: rgba(122,43,255,.08);
  --cyan-dim: rgba(122,43,255,.65);
  --cyan-glow: rgba(122,43,255,.28);

  --r: 14px;
  --ease: cubic-bezier(.4,0,.2,1);
  font-family: 'Exo 2', sans-serif;
  background: var(--bg);
  color: var(--text);
  overflow-x: hidden;
  position: relative;
  min-height: 100%;
  display: flow-root;
}

/* Default + explicit light theme */
:root:not([data-foc-theme]) .foc-cyber-home,
:root[data-foc-theme="light"] .foc-cyber-home,
:root[data-foc-theme="aurora"] .foc-cyber-home {
  --cyan:      #7A2BFF;
  --red:       #FF2D7A;
  --bg:        #F6F8FF;
  --bg2:       #EEF3FF;
  --surface:   #FFFFFF;
  --surface2:  #F3F6FF;
  --border:    rgba(16, 24, 40, .12);
  --border-hi: rgba(16, 24, 40, .18);
  --text:      #0B1220;
  --muted:     #4B5B78;
  --muted2:    #6B7A97;
  --scanline-a: rgba(11,18,32,.00);
  --scanline-b: rgba(11,18,32,.02);
  --grid-line: rgba(11,18,32,.06);
  --orb1: rgba(122,43,255,.16);
  --orb2: rgba(255,45,122,.14);
  --heroGlowC: rgba(122,43,255,.18);
  --heroGlowR: rgba(255,45,122,.16);
  --pillBg: rgba(122,43,255,.06);
  --pillHoverBorder: rgba(122,43,255,.28);
  --pillHoverShadow: rgba(122,43,255,.12);
  --primaryShadow: rgba(122,43,255,.18);
  --primaryShadowHover: rgba(255,45,122,.18);
  --statHoverBorder: rgba(122,43,255,.28);
  --statHoverShadow: rgba(122,43,255,.12);
  --dotShadow: rgba(122,43,255,.16);
  --terminalBg: var(--surface2);
  --cyan-soft: rgba(122,43,255,.08);
  --cyan-dim: rgba(122,43,255,.65);
  --cyan-glow: rgba(122,43,255,.28);
}

/* Theme B â€” Warm Pearl (friendly, less tech) */
:root[data-foc-theme="pearl"] .foc-cyber-home {
  --cyan:      #C06A2B; /* warm amber */
  --red:       #E05A7B; /* soft rose */
  --bg:        #FFF7F1;
  --bg2:       #FFF1E6;
  --surface:   #FFFFFF;
  --surface2:  #FFF6EF;
  --border:    rgba(31, 24, 16, .12);
  --border-hi: rgba(31, 24, 16, .18);
  --text:      #1D1A16;
  --muted:     #5C4E42;
  --muted2:    #7A6A5D;
  --scanline-a: rgba(29,26,22,.00);
  --scanline-b: rgba(29,26,22,.015);
  --grid-line: rgba(29,26,22,.05);
  --orb1: rgba(192,106,43,.16);
  --orb2: rgba(224,90,123,.14);
  --heroGlowC: rgba(192,106,43,.16);
  --heroGlowR: rgba(224,90,123,.14);
  --pillBg: rgba(192,106,43,.06);
  --pillHoverBorder: rgba(192,106,43,.30);
  --pillHoverShadow: rgba(192,106,43,.12);
  --primaryShadow: rgba(192,106,43,.18);
  --primaryShadowHover: rgba(224,90,123,.16);
  --statHoverBorder: rgba(192,106,43,.30);
  --statHoverShadow: rgba(192,106,43,.12);
  --dotShadow: rgba(192,106,43,.14);
  --terminalBg: var(--surface2);
  --cyan-soft: rgba(192,106,43,.08);
  --cyan-dim: rgba(192,106,43,.75);
  --cyan-glow: rgba(192,106,43,.22);
}

/* Theme C â€” Sky + Magenta (bright, energetic, still light) */
:root[data-foc-theme="sky-magenta"] .foc-cyber-home {
  --cyan:      #1BA7FF; /* sky */
  --red:       #FF2DAA; /* magenta */
  --bg:        #F5FBFF;
  --bg2:       #EAF4FF;
  --surface:   #FFFFFF;
  --surface2:  #F1F7FF;
  --border:    rgba(4, 25, 45, .12);
  --border-hi: rgba(4, 25, 45, .18);
  --text:      #061426;
  --muted:     #3E5876;
  --muted2:    #5B7390;
  --scanline-a: rgba(6,20,38,.00);
  --scanline-b: rgba(6,20,38,.018);
  --grid-line: rgba(6,20,38,.055);
  --orb1: rgba(27,167,255,.14);
  --orb2: rgba(255,45,170,.12);
  --heroGlowC: rgba(27,167,255,.22);
  --heroGlowR: rgba(255,45,170,.18);
  --pillBg: rgba(27,167,255,.06);
  --pillHoverBorder: rgba(27,167,255,.30);
  --pillHoverShadow: rgba(27,167,255,.12);
  --primaryShadow: rgba(27,167,255,.18);
  --primaryShadowHover: rgba(255,45,170,.16);
  --statHoverBorder: rgba(27,167,255,.30);
  --statHoverShadow: rgba(27,167,255,.12);
  --dotShadow: rgba(27,167,255,.14);
  --terminalBg: var(--surface2);
  --cyan-soft: rgba(27,167,255,.085);
  --cyan-dim: rgba(27,167,255,.80);
  --cyan-glow: rgba(27,167,255,.22);
}

/* Theme D â€” Quantum Mint (clean cyber, mint + violet) */
:root[data-foc-theme="quantum-mint"] .foc-cyber-home {
  --cyan:      #2AFDAD;
  --red:       #7C3BFF;
  --bg:        #F6FFFB;
  --bg2:       #E9FFF7;
  --surface:   #FFFFFF;
  --surface2:  #F1FFFB;
  --border:    rgba(7, 22, 26, .12);
  --border-hi: rgba(7, 22, 26, .18);
  --text:      #07161A;
  --muted:     #355B61;
  --muted2:    #4C6F75;
  --scanline-a: rgba(7,22,26,.00);
  --scanline-b: rgba(7,22,26,.018);
  --grid-line: rgba(7,22,26,.055);
  --orb1: rgba(42,253,173,.12);
  --orb2: rgba(124,59,255,.12);
  --heroGlowC: rgba(42,253,173,.22);
  --heroGlowR: rgba(124,59,255,.18);
  --pillBg: rgba(42,253,173,.07);
  --pillHoverBorder: rgba(42,253,173,.32);
  --pillHoverShadow: rgba(42,253,173,.12);
  --primaryShadow: rgba(42,253,173,.18);
  --primaryShadowHover: rgba(124,59,255,.18);
  --statHoverBorder: rgba(42,253,173,.32);
  --statHoverShadow: rgba(42,253,173,.12);
  --dotShadow: rgba(42,253,173,.14);
  --terminalBg: var(--surface2);
  --cyan-soft: rgba(42,253,173,.09);
  --cyan-dim: rgba(42,253,173,.82);
  --cyan-glow: rgba(42,253,173,.22);
}

/* Theme E â€” Neon Slate (premium dark, dev-tool vibe) */
:root[data-foc-theme="neon-slate"] .foc-cyber-home {
  --cyan:      #00E5FF;
  --red:       #FF4D9D;
  --bg:        #070B16;
  --bg2:       #090F22;
  --surface:   #0C142C;
  --surface2:  #0F1A36;
  --border:    rgba(0,229,255,.16);
  --border-hi: rgba(0,229,255,.34);
  --text:      #EAF3FF;
  --muted:     #7EA2D1;
  --muted2:    #4E6E9E;
  --scanline-a: rgba(0,229,255,.00);
  --scanline-b: rgba(0,229,255,.013);
  --grid-line: rgba(0,229,255,.045);
  --orb1: rgba(0,229,255,.09);
  --orb2: rgba(255,77,157,.075);
  --heroGlowC: rgba(0,229,255,.55);
  --heroGlowR: rgba(255,77,157,.45);
  --pillBg: rgba(0,229,255,.08);
  --pillHoverBorder: rgba(0,229,255,.65);
  --pillHoverShadow: rgba(0,229,255,.18);
  --primaryShadow: rgba(0,229,255,.35);
  --primaryShadowHover: rgba(255,77,157,.28);
  --statHoverBorder: rgba(0,229,255,.65);
  --statHoverShadow: rgba(0,229,255,.18);
  --dotShadow: rgba(0,229,255,.18);
  --terminalBg: var(--bg);
  --cyan-soft: rgba(0,229,255,.10);
  --cyan-dim: rgba(0,229,255,.86);
  --cyan-glow: rgba(0,229,255,.30);
}

/* Theme F â€” Arctic Hologram (icy light, holo magenta glow) */
:root[data-foc-theme="arctic-holo"] .foc-cyber-home {
  --cyan:      #2BBAFF;
  --red:       #FF2DE2;
  --bg:        #F4FAFF;
  --bg2:       #EAF4FF;
  --surface:   #FFFFFF;
  --surface2:  #F1F8FF;
  --border:    rgba(6, 20, 38, .12);
  --border-hi: rgba(6, 20, 38, .18);
  --text:      #061426;
  --muted:     #3D5A7B;
  --muted2:    #597699;
  --scanline-a: rgba(6,20,38,.00);
  --scanline-b: rgba(6,20,38,.018);
  --grid-line: rgba(6,20,38,.055);
  --orb1: rgba(43,186,255,.13);
  --orb2: rgba(255,45,226,.11);
  --heroGlowC: rgba(43,186,255,.26);
  --heroGlowR: rgba(255,45,226,.20);
  --pillBg: rgba(43,186,255,.06);
  --pillHoverBorder: rgba(43,186,255,.32);
  --pillHoverShadow: rgba(43,186,255,.12);
  --primaryShadow: rgba(43,186,255,.18);
  --primaryShadowHover: rgba(255,45,226,.16);
  --statHoverBorder: rgba(43,186,255,.32);
  --statHoverShadow: rgba(43,186,255,.12);
  --dotShadow: rgba(43,186,255,.14);
  --terminalBg: var(--surface2);
  --cyan-soft: rgba(43,186,255,.09);
  --cyan-dim: rgba(43,186,255,.84);
  --cyan-glow: rgba(43,186,255,.22);
}

/* Theme G â€” Matrix Lime (classic hacker green) */
:root[data-foc-theme="matrix-lime"] .foc-cyber-home {
  --cyan:      #7CFF00;
  --red:       #00E5FF;
  --bg:        #050A08;
  --bg2:       #070E0B;
  --surface:   #09120D;
  --surface2:  #0B1610;
  --border:    rgba(124,255,0,.18);
  --border-hi: rgba(124,255,0,.38);
  --text:      #D9FFE8;
  --muted:     #5DAA80;
  --muted2:    #2F6B4A;
  --scanline-a: rgba(124,255,0,.00);
  --scanline-b: rgba(124,255,0,.014);
  --grid-line: rgba(124,255,0,.05);
  --orb1: rgba(124,255,0,.08);
  --orb2: rgba(0,229,255,.07);
  --heroGlowC: rgba(124,255,0,.42);
  --heroGlowR: rgba(0,229,255,.42);
  --pillBg: rgba(124,255,0,.08);
  --pillHoverBorder: rgba(124,255,0,.70);
  --pillHoverShadow: rgba(124,255,0,.18);
  --primaryShadow: rgba(124,255,0,.34);
  --primaryShadowHover: rgba(0,229,255,.26);
  --statHoverBorder: rgba(124,255,0,.70);
  --statHoverShadow: rgba(124,255,0,.18);
  --dotShadow: rgba(124,255,0,.18);
  --terminalBg: var(--bg);
  --cyan-soft: rgba(124,255,0,.10);
  --cyan-dim: rgba(124,255,0,.86);
  --cyan-glow: rgba(124,255,0,.30);
}

/* Theme H â€” Solarpunk Circuit (teal + solar orange) */
:root[data-foc-theme="solarpunk"] .foc-cyber-home {
  --cyan:      #00C2A8;
  --red:       #FF8A00;
  --bg:        #F7FFFD;
  --bg2:       #ECFFFB;
  --surface:   #FFFFFF;
  --surface2:  #F1FFFC;
  --border:    rgba(6, 27, 26, .12);
  --border-hi: rgba(6, 27, 26, .18);
  --text:      #061B1A;
  --muted:     #2F5B57;
  --muted2:    #4F7773;
  --scanline-a: rgba(6,27,26,.00);
  --scanline-b: rgba(6,27,26,.018);
  --grid-line: rgba(6,27,26,.055);
  --orb1: rgba(0,194,168,.12);
  --orb2: rgba(255,138,0,.12);
  --heroGlowC: rgba(0,194,168,.20);
  --heroGlowR: rgba(255,138,0,.18);
  --pillBg: rgba(0,194,168,.06);
  --pillHoverBorder: rgba(0,194,168,.30);
  --pillHoverShadow: rgba(0,194,168,.12);
  --primaryShadow: rgba(0,194,168,.18);
  --primaryShadowHover: rgba(255,138,0,.16);
  --statHoverBorder: rgba(0,194,168,.30);
  --statHoverShadow: rgba(0,194,168,.12);
  --dotShadow: rgba(0,194,168,.14);
  --terminalBg: var(--surface2);
  --cyan-soft: rgba(0,194,168,.085);
  --cyan-dim: rgba(0,194,168,.84);
  --cyan-glow: rgba(0,194,168,.22);
}

/* Theme J â€” Lavender Cream (soft lilac + teal) */
:root[data-foc-theme="lavender-cream"] .foc-cyber-home {
  --cyan:      #7B61FF;
  --red:       #00B8A9;
  --bg:        #FAF8FF;
  --bg2:       #F3EEFF;
  --surface:   #FFFFFF;
  --surface2:  #F6F2FF;
  --border:    rgba(24, 18, 48, .11);
  --border-hi: rgba(24, 18, 48, .17);
  --text:      #141022;
  --muted:     #4E4A6B;
  --muted2:    #6B6788;
  --scanline-a: rgba(20,16,34,.00);
  --scanline-b: rgba(20,16,34,.016);
  --grid-line: rgba(20,16,34,.05);
  --orb1: rgba(123,97,255,.13);
  --orb2: rgba(0,184,169,.11);
  --heroGlowC: rgba(123,97,255,.20);
  --heroGlowR: rgba(0,184,169,.18);
  --pillBg: rgba(123,97,255,.06);
  --pillHoverBorder: rgba(123,97,255,.30);
  --pillHoverShadow: rgba(123,97,255,.12);
  --primaryShadow: rgba(123,97,255,.18);
  --primaryShadowHover: rgba(0,184,169,.16);
  --statHoverBorder: rgba(123,97,255,.30);
  --statHoverShadow: rgba(123,97,255,.12);
  --dotShadow: rgba(123,97,255,.14);
  --terminalBg: var(--surface2);
  --cyan-soft: rgba(123,97,255,.085);
  --cyan-dim: rgba(123,97,255,.82);
  --cyan-glow: rgba(123,97,255,.22);
}

/* Theme K â€” Sunshine Paper (warm honey + ink blue) */
:root[data-foc-theme="sunshine-paper"] .foc-cyber-home {
  --cyan:      #E8A317;
  --red:       #1E3A5F;
  --bg:        #FFFCF3;
  --bg2:       #FFF6E0;
  --surface:   #FFFFFF;
  --surface2:  #FFF9EC;
  --border:    rgba(28, 22, 12, .11);
  --border-hi: rgba(28, 22, 12, .17);
  --text:      #1A1810;
  --muted:     #5A5345;
  --muted2:    #756C5C;
  --scanline-a: rgba(26,24,16,.00);
  --scanline-b: rgba(26,24,16,.014);
  --grid-line: rgba(26,24,16,.048);
  --orb1: rgba(232,163,23,.14);
  --orb2: rgba(30,58,95,.10);
  --heroGlowC: rgba(232,163,23,.20);
  --heroGlowR: rgba(30,58,95,.14);
  --pillBg: rgba(232,163,23,.07);
  --pillHoverBorder: rgba(232,163,23,.32);
  --pillHoverShadow: rgba(232,163,23,.12);
  --primaryShadow: rgba(232,163,23,.18);
  --primaryShadowHover: rgba(30,58,95,.14);
  --statHoverBorder: rgba(232,163,23,.32);
  --statHoverShadow: rgba(232,163,23,.12);
  --dotShadow: rgba(232,163,23,.14);
  --terminalBg: var(--surface2);
  --cyan-soft: rgba(232,163,23,.09);
  --cyan-dim: rgba(232,163,23,.82);
  --cyan-glow: rgba(232,163,23,.22);
}

/* Theme L â€” Rose Quartz (dusty rose + slate blue) */
:root[data-foc-theme="rose-quartz"] .foc-cyber-home {
  --cyan:      #D65A7A;
  --red:       #3D6AAD;
  --bg:        #FFF8FA;
  --bg2:       #FFEDF3;
  --surface:   #FFFFFF;
  --surface2:  #FFF5F8;
  --border:    rgba(40, 18, 28, .10);
  --border-hi: rgba(40, 18, 28, .16);
  --text:      #1C1418;
  --muted:     #5C4550;
  --muted2:    #78636C;
  --scanline-a: rgba(28,20,24,.00);
  --scanline-b: rgba(28,20,24,.015);
  --grid-line: rgba(28,20,24,.048);
  --orb1: rgba(214,90,122,.12);
  --orb2: rgba(61,106,173,.10);
  --heroGlowC: rgba(214,90,122,.18);
  --heroGlowR: rgba(61,106,173,.16);
  --pillBg: rgba(214,90,122,.06);
  --pillHoverBorder: rgba(214,90,122,.28);
  --pillHoverShadow: rgba(214,90,122,.10);
  --primaryShadow: rgba(214,90,122,.16);
  --primaryShadowHover: rgba(61,106,173,.14);
  --statHoverBorder: rgba(214,90,122,.28);
  --statHoverShadow: rgba(214,90,122,.10);
  --dotShadow: rgba(214,90,122,.12);
  --terminalBg: var(--surface2);
  --cyan-soft: rgba(214,90,122,.075);
  --cyan-dim: rgba(214,90,122,.78);
  --cyan-glow: rgba(214,90,122,.20);
}

/* Theme M â€” Nordic Sage (sage + ice blue) */
:root[data-foc-theme="nordic-sage"] .foc-cyber-home {
  --cyan:      #5B9279;
  --red:       #5B8DEF;
  --bg:        #F7FAF8;
  --bg2:       #ECF4EF;
  --surface:   #FFFFFF;
  --surface2:  #F1F7F3;
  --border:    rgba(12, 28, 22, .10);
  --border-hi: rgba(12, 28, 22, .16);
  --text:      #0F1C17;
  --muted:     #3D5A50;
  --muted2:    #567568;
  --scanline-a: rgba(15,28,23,.00);
  --scanline-b: rgba(15,28,23,.014);
  --grid-line: rgba(15,28,23,.045);
  --orb1: rgba(91,146,121,.12);
  --orb2: rgba(91,141,239,.10);
  --heroGlowC: rgba(91,146,121,.18);
  --heroGlowR: rgba(91,141,239,.16);
  --pillBg: rgba(91,146,121,.06);
  --pillHoverBorder: rgba(91,146,121,.28);
  --pillHoverShadow: rgba(91,146,121,.10);
  --primaryShadow: rgba(91,146,121,.16);
  --primaryShadowHover: rgba(91,141,239,.14);
  --statHoverBorder: rgba(91,146,121,.28);
  --statHoverShadow: rgba(91,146,121,.10);
  --dotShadow: rgba(91,146,121,.12);
  --terminalBg: var(--surface2);
  --cyan-soft: rgba(91,146,121,.075);
  --cyan-dim: rgba(91,146,121,.80);
  --cyan-glow: rgba(91,146,121,.20);
}

/* Theme I â€” Obsidian Burst (exact values provided) */
:root[data-foc-theme="obsidian-burst"] .foc-cyber-home {
  --bg: #000000;
  --bg2: #000000;
  --surface: #0D0D0D;
  --surface2: #0D0D0D;

  /* Primary / Secondary */
  --cyan: #C93060;
  --red: #7B3F9E;

  --text: #FFFFFF;
  --muted: #5A5A6A;
  --muted2: #5A5A6A;

  --border: rgba(201,48,96,.2);
  --border-hi: rgba(201,48,96,.32);

  --scanline-a: rgba(201,48,96,.00);
  --scanline-b: rgba(201,48,96,.012);
  --grid-line: rgba(201,48,96,.05);

  --orb1: rgba(201,48,96,.10);
  --orb2: rgba(123,63,158,.10);
  --heroGlowC: rgba(201,48,96,.55);
  --heroGlowR: rgba(123,63,158,.50);

  --pillBg: rgba(201,48,96,.08);
  --pillHoverBorder: rgba(201,48,96,.55);
  --pillHoverShadow: rgba(201,48,96,.18);
  --primaryShadow: rgba(201,48,96,.35);
  --primaryShadowHover: rgba(123,63,158,.26);
  --statHoverBorder: rgba(201,48,96,.55);
  --statHoverShadow: rgba(201,48,96,.18);
  --dotShadow: rgba(201,48,96,.18);
  --terminalBg: var(--bg);

  --cyan-soft: rgba(201,48,96,.10);
  --cyan-dim: rgba(201,48,96,.86);
  --cyan-glow: rgba(201,48,96,.30);
}

/* Dark cyber theme (previous one) */
:root[data-foc-theme="dark"] .foc-cyber-home {
  --cyan:      #00E5FF;
  --red:       #FC2B5A;
  --bg:        #060E1E;
  --bg2:       #08122A;
  --surface:   #0D1B38;
  --surface2:  #112040;
  --border:    rgba(0,229,255,.14);
  --border-hi: rgba(0,229,255,.32);
  --text:      #E0F0FF;
  --muted:     #4A6FA5;
  --muted2:    #2D4E7A;
  --scanline-a: rgba(0,229,255,.00);
  --scanline-b: rgba(0,229,255,.013);
  --grid-line: rgba(0,229,255,.04);
  --orb1: rgba(0,229,255,.08);
  --orb2: rgba(252,43,90,.07);
  --heroGlowC: rgba(0,229,255,.50);
  --heroGlowR: rgba(252,43,90,.50);
  --pillBg: rgba(0,229,255,.07);
  --pillHoverBorder: #00E5FF;
  --pillHoverShadow: rgba(0,229,255,.18);
  --primaryShadow: rgba(0,229,255,.35);
  --primaryShadowHover: rgba(0,229,255,.6);
  --statHoverBorder: #00E5FF;
  --statHoverShadow: rgba(0,229,255,.18);
  --dotShadow: rgba(0,229,255,.18);
  --terminalBg: var(--bg);
  --cyan-soft: rgba(0,229,255,.08);
  --cyan-dim: rgba(0,229,255,.80);
  --cyan-glow: rgba(0,229,255,.28);
}

/* Beat global/template/Bootstrap (.section/#fff/bg-white) leaking onto homepage */
.foc-cyber-home > section {
  float: none !important;
  width: 100% !important;
  box-sizing: border-box !important;
}
.foc-cyber-home > section.hero {
  background: var(--bg) !important;
  color: var(--text) !important;
}
.foc-cyber-home > section.section {
  padding: 45px 0;
  background: var(--bg) !important;
  color: var(--text) !important;
}
.foc-cyber-home > section.section-alt {
  background: var(--bg2) !important;
  color: var(--text) !important;
}
.foc-cyber-home .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  background: transparent !important;
}
.foc-cyber-home .sh2 {
  color: var(--text) !important;
}
.foc-cyber-home .sh2 .cyan {
  background: linear-gradient(90deg, var(--cyan), var(--red));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
.foc-cyber-home .sh2 .red {
  color: var(--red) !important;
}
.foc-cyber-home .s-body {
  color: var(--muted) !important;
}
.foc-cyber-home h1,
.foc-cyber-home h2,
.foc-cyber-home h3 {
  color: var(--text);
}

.foc-cyber-home::after {
  content: '';
  position: fixed; inset: 0;
  background: repeating-linear-gradient(
    0deg,
    var(--scanline-a),
    var(--scanline-a) 2px,
    var(--scanline-b) 2px,
    var(--scanline-b) 4px
  );
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: multiply;
}

.grid-bg {
  position: relative;
}
.grid-bg::before {
  content: '';
  position: absolute; inset: 0;
  /* Techy background: aurora beams + dot-matrix (no boxes) */
  background-image:
    radial-gradient(circle at 18% 12%, var(--orb1) 0%, transparent 55%),
    radial-gradient(circle at 82% 28%, var(--orb2) 0%, transparent 60%),
    conic-gradient(from 210deg at 50% 35%,
      transparent 0 20%,
      rgba(255,255,255,.00) 20%,
      rgba(255,255,255,.00) 35%,
      rgba(255,255,255,.12) 40%,
      rgba(255,255,255,.00) 52%,
      transparent 52% 100%
    ),
    radial-gradient(var(--grid-line) 1px, transparent 1px);
  background-size:
    100% 100%,
    100% 100%,
    140% 140%,
    18px 18px;
  background-position:
    center,
    center,
    center,
    0 0;
  opacity: .9;
  pointer-events: none;
}

:root[data-foc-theme="dark"] .grid-bg::before,
:root[data-foc-theme="neon-slate"] .grid-bg::before,
:root[data-foc-theme="matrix-lime"] .grid-bg::before,
:root[data-foc-theme="obsidian-burst"] .grid-bg::before {
  /* reduce white beam intensity on dark themes */
  opacity: .55;
  filter: saturate(1.08) contrast(1.05);
}

.hero {
  min-height: calc(100vh - 88px);
  padding: 120px 0 80px;
  position: relative;
  overflow: hidden;
  background: var(--bg);
}
.hero-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.theme-dropdown {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.55);
  backdrop-filter: blur(10px);
  border-radius: 999px;
  box-shadow: 0 18px 44px rgba(11,18,32,.08);
}
:root[data-foc-theme="dark"] .theme-dropdown {
  background: rgba(6,14,30,.35);
  box-shadow: 0 18px 44px rgba(0,0,0,.35);
}
.theme-dot {
  width: 14px;
  height: 14px;
  border-radius: 5px;
  background: linear-gradient(135deg, var(--cyan), var(--red));
  border: 1px solid var(--border);
  box-shadow: 0 8px 18px var(--dotShadow);
  flex: 0 0 auto;
}
.theme-select {
  appearance: none;
  -webkit-appearance: none;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .10em;
  text-transform: uppercase;
  padding: 8px 28px 8px 6px;
  border-radius: 999px;
  cursor: pointer;
  outline: none;
  min-width: 240px;
}
.theme-select:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}
.theme-caret {
  position: relative;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  opacity: .75;
}
.theme-caret::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--muted);
  border-bottom: 2px solid var(--muted);
  transform: translate(-50%, -60%) rotate(45deg);
}
.theme-dropdown:hover .theme-caret::before {
  border-color: var(--text);
}

/* Floating theme switcher (fixed; must stay inside .foc-cyber-home for CSS variables) */
.foc-theme-fab-wrap {
  position: fixed;
  right: 22px;
  bottom: max(24px, env(safe-area-inset-bottom, 0px));
  z-index: 10050;
  font-family: 'Exo 2', sans-serif;
}
.foc-theme-fab__track {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.foc-theme-fab__label {
  pointer-events: none;
  padding: 4px 11px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--text);
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  border: 1px solid var(--border);
  box-shadow: 0 8px 22px color-mix(in srgb, var(--text) 8%, transparent);
  margin-right: 2px;
}
.foc-theme-fab__btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px 11px 13px;
  border-radius: 999px;
  border: 1px solid var(--border-hi);
  background: color-mix(in srgb, var(--surface) 86%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 14px 40px color-mix(in srgb, var(--text) 12%, transparent);
  cursor: pointer;
  color: var(--text);
  outline: none;
  transition: transform 0.2s var(--ease), box-shadow 0.2s var(--ease);
}
.foc-theme-fab__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 48px color-mix(in srgb, var(--primaryShadow) 28%, transparent);
}
.foc-theme-fab__btn:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 3px;
}
.foc-theme-fab__btn-text {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  max-width: 148px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.foc-theme-fab__chev {
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--muted);
  border-bottom: 2px solid var(--muted);
  transform: rotate(45deg);
  margin-top: -5px;
  flex-shrink: 0;
  transition: transform 0.2s var(--ease);
}
.foc-theme-fab__btn[aria-expanded="true"] .foc-theme-fab__chev {
  transform: rotate(-135deg);
  margin-top: 0;
}
.foc-theme-panel {
  position: absolute;
  right: 0;
  bottom: 100%;
  margin-bottom: 8px;
  min-width: 228px;
  max-height: min(50vh, 340px);
  overflow-y: auto;
  padding: 8px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 93%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 20px 56px color-mix(in srgb, var(--text) 14%, transparent);
}
.foc-theme-panel__group {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted2);
  padding: 8px 10px 4px;
}
.foc-theme-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.foc-theme-option:hover {
  background: var(--pillBg);
}
.foc-theme-option.is-active {
  background: var(--cyan-soft);
  box-shadow: inset 0 0 0 1px var(--border-hi);
}
@media (max-width: 480px) {
  .foc-theme-fab-wrap { right: 14px; }
  .foc-theme-fab__btn-text { max-width: 104px; }
}
.hero-orb1 {
  position: absolute; top: -200px; right: -200px;
  width: 700px; height: 700px; border-radius: 50%;
  background: radial-gradient(circle, var(--orb1) 0%, transparent 65%);
  pointer-events: none;
}
.hero-orb2 {
  position: absolute; bottom: -100px; left: -100px;
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, var(--orb2) 0%, transparent 65%);
  pointer-events: none;
}
.hero-inner {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 72px; align-items: center;
  position: relative; z-index: 1;
}
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--cyan-soft);
  border: 1px solid var(--border);
  color: var(--cyan);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: none;
  padding: 5px 14px; border-radius: 2px;
  margin-bottom: 22px;
  margin-top: 22px;
}
.hero-kicker {
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .10em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: center;
  width: 100%;
}
.hero-right {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  margin-top:20px;
}
.hero-right-desc {
  max-width: 520px;
  font-size: 12px;
  line-height: 1.7;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--muted2);
  text-align: center;
  margin-top: -6px;
}
.hero-right-cta {
  margin-top: 6px;
}
.hero-eyebrow .pulse {
  width: 6px; height: 6px; background: var(--cyan);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--cyan);
  animation: foc-blink 1.4s ease-in-out infinite;
}
@keyframes foc-blink { 0%,100%{opacity:1} 50%{opacity:.3} }

.hero-h1 {
  font-family: 'Orbitron', monospace;
  font-size: clamp(36px, 5vw, 62px);
  font-weight: 900;
  line-height: 1.05;
  color: var(--text);
  letter-spacing: .04em;
  margin-bottom: 10px;
}
.hero-h1.hashtag {
  letter-spacing: .02em;
}
.hero-h1 .cyan {
  background: linear-gradient(90deg, var(--cyan), var(--red));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 10px 40px var(--heroGlowC);
}
.hero-h1 .red {
  color: var(--red);
  text-shadow: 0 10px 40px var(--heroGlowR);
}
.hero-sub {
  font-size: 15px; font-weight: 300;
  color: var(--muted); line-height: 1.8;
  margin-bottom: 32px; max-width: 460px;
  font-style: italic;
}
.hero-pills {
  display: flex; gap: 8px; flex-wrap: wrap;
  margin-bottom: 36px;
}
.pill {
  padding: 6px 16px;
  background: var(--pillBg);
  border: 1px solid var(--border);
  border-radius: 2px;
  font-size: 11px; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--cyan); cursor: default;
  transition: .25s;
}
.pill:hover {
  border-color: var(--pillHoverBorder);
  box-shadow: 0 14px 30px var(--pillHoverShadow);
}
.hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
.btn-primary {
  padding: 12px 28px;
  background: linear-gradient(90deg, var(--cyan), var(--red));
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  border: none; border-radius: 4px;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase;
  cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; gap: 8px;
  transition: all .25s var(--ease);
  box-shadow: 0 14px 34px var(--primaryShadow);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 46px var(--primaryShadowHover);
}
.btn-ghost {
  padding: 12px 28px;
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px; font-weight: 500;
  letter-spacing: .06em;
  cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; gap: 8px;
  transition: all .25s var(--ease);
}
.btn-ghost:hover { border-color: var(--cyan); color: var(--cyan); background: var(--cyan-soft); }

.hero-tiles {
  width: 100%;
  display: block;
}
.hero-tiles-inner {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 26px;
  grid-auto-flow: row;
  justify-items: stretch;
  align-items: stretch;
}
.hero-tile {
  position: relative;
  appearance: none;
  -webkit-appearance: none;
  float: none;
  width: 100%;
  grid-column: auto;
  grid-row: auto;
  background: color-mix(in srgb, var(--surface) 78%, var(--bg2) 22%);
  border: 2px solid var(--cyan);
  border-radius: 14px;
  padding: 34px 18px;
  min-height: 132px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: transform .18s var(--ease), box-shadow .22s var(--ease), border-color .22s var(--ease), background .22s var(--ease);
  box-shadow:
    0 0 0 1px var(--border-hi) inset,
    0 18px 44px color-mix(in srgb, var(--text) 14%, transparent);
}
.hero-tile::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 16px;
  background: linear-gradient(90deg, rgba(255,255,255,.65), rgba(255,255,255,.25));
  filter: blur(10px);
  opacity: .15;
  pointer-events: none;
}
.hero-tile:hover {
  transform: translateY(-2px);
  border-color: var(--cyan);
  box-shadow:
    0 0 0 1px var(--border-hi) inset,
    0 0 26px var(--heroGlowC),
    0 0 22px var(--heroGlowR),
    0 22px 60px color-mix(in srgb, var(--text) 22%, transparent);
}
.hero-tile:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 4px;
}
.hero-tile-text {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  letter-spacing: .10em;
  text-transform: uppercase;
  font-size: clamp(16px, 1.35vw, 22px);
  line-height: 1.15;
  color: var(--text);
  text-shadow: 0 1px 0 color-mix(in srgb, var(--surface) 40%, transparent),
    0 10px 28px color-mix(in srgb, var(--text) 18%, transparent);
}
.hero-tile-text span { display: block; }
.terminal-line {
  font-family: 'Courier New', monospace;
  font-size: 11px; color: var(--cyan);
  background: var(--terminalBg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 14px;
  display: flex; align-items: center; gap: 8px;
}
.terminal-line::before { content: 'â€º'; color: var(--red); font-size: 14px; }

.marquee-bar {
  background: var(--surface);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  margin-top: 12px;
  padding: 12px 0; overflow: hidden;
  position: relative;
}
@media(max-width:768px) {
  .marquee-bar { margin-top: 8px; }
}
.marquee-bar::before, .marquee-bar::after {
  content: '';
  position: absolute; top: 0; bottom: 0; width: 120px;
  z-index: 2; pointer-events: none;
}
.marquee-bar::before {
  left: 0;
  background: linear-gradient(90deg, var(--surface), transparent);
}
.marquee-bar::after {
  right: 0;
  background: linear-gradient(-90deg, var(--surface), transparent);
}
.marquee-track {
  display: flex; animation: foc-scroll 28s linear infinite;
  width: max-content;
}
.marquee-item {
  display: flex; align-items: center; gap: 10px;
  padding: 0 32px;
  font-size: 10px; font-weight: 600;
  letter-spacing: .14em; text-transform: uppercase;
  color: var(--muted); white-space: nowrap;
  border-right: 1px solid var(--border);
}
.marquee-item .mdot {
  width: 4px; height: 4px;
  background: linear-gradient(90deg, var(--cyan), var(--red));
  border-radius: 50%;
  box-shadow: 0 10px 22px var(--dotShadow);
}
@keyframes foc-scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

/* Partner marquees (#csr / #govt) â€” scroll down = RTL drift; opposite on second row */
@keyframes partner-marquee-rtl {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes partner-marquee-ltr {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}
.partner-strip {
  margin-top: 22px;
  padding: 12px 0 14px;
  position: relative;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface2) 92%, var(--surface));
  overflow: hidden;
}
.partner-strip--csr {
  border-color: color-mix(in srgb, var(--red) 22%, var(--border));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--red) 08%, transparent);
}
.partner-strip--govt {
  margin-top: 28px;
  border-color: color-mix(in srgb, var(--cyan) 22%, var(--border));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--cyan) 08%, transparent);
}
.partner-strip-label {
  display: block;
  text-align: center;
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 10px;
  padding: 0 16px;
}
.partner-strip--csr .partner-strip-label { color: color-mix(in srgb, var(--red) 55%, var(--muted)); }
.partner-strip--govt .partner-strip-label { color: color-mix(in srgb, var(--cyan) 55%, var(--muted)); }
.partner-strip-wrap {
  position: relative;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, #000 40px, #000 calc(100% - 40px), transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 40px, #000 calc(100% - 40px), transparent);
}
.partner-strip-wrap::before,
.partner-strip-wrap::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 56px;
  z-index: 2;
  pointer-events: none;
}
.partner-strip-wrap::before {
  left: 0;
  background: linear-gradient(90deg, color-mix(in srgb, var(--surface2) 96%, var(--surface)), transparent);
}
.partner-strip-wrap::after {
  right: 0;
  background: linear-gradient(-90deg, color-mix(in srgb, var(--surface2) 96%, var(--surface)), transparent);
}
.partner-strip-track {
  display: flex;
  width: max-content;
  gap: 0;
  animation: partner-marquee-rtl 52s linear infinite;
  will-change: transform;
}
.partner-strip[data-marquee-dir="ltr"] .partner-strip-track {
  animation-name: partner-marquee-ltr;
}
.partner-strip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 28px;
  flex-shrink: 0;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .04em;
  color: var(--text);
  white-space: nowrap;
  border-right: 1px solid var(--border);
  opacity: .92;
}
.partner-strip-item .partner-strip-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--cyan), var(--red));
  flex-shrink: 0;
  box-shadow: 0 0 10px var(--cyan-glow);
}
.partner-strip--govt .partner-strip-item .partner-strip-dot {
  background: linear-gradient(135deg, var(--cyan), #2e7d32);
}
@media (prefers-reduced-motion: reduce) {
  .partner-strip-track { animation: none !important; transform: none !important; }
}

.section { padding: 96px 0; }
.section-alt { background: var(--bg2); }
.section-head { text-align: center; margin-bottom: 30px; }
.stag {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--cyan-soft);
  border: 1px solid var(--border);
  color: var(--cyan);
  font-size: 10px; font-weight: 600;
  letter-spacing: .16em; text-transform: uppercase;
  padding: 5px 14px; border-radius: 2px;
  margin-bottom: 14px;
}
.stag::before { content: '//'; color: var(--red); }
.sh2 {
  font-family: 'Orbitron', monospace;
  font-size: clamp(26px, 4vw, 44px);
  font-weight: 700; color: var(--text);
  line-height: 1.1; letter-spacing: .04em;
}
.sh2 .cyan { color: var(--cyan); text-shadow: 0 0 16px rgba(0,229,255,.4); }
.sh2 .red  { color: var(--red);  text-shadow: 0 0 16px rgba(252,43,90,.4); }
.s-body {
  font-size: 15px; color: var(--muted);
  margin-top: 12px; 
  // max-width: 520px;
  margin-left: auto; margin-right: auto;
  text-align: center;
  line-height: 1.75; font-style: italic;
}

.pillars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.pillar {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 28px 20px;
  position: relative; overflow: hidden;
  transition: .3s var(--ease); cursor: default;
}
.pillar::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: var(--cyan);
  transform: scaleX(0); transform-origin: left;
  transition: .3s var(--ease);
}
.pillar:hover {
  border-color: var(--cyan);
  box-shadow: 0 0 24px var(--cyan-glow), inset 0 0 32px rgba(0,229,255,.03);
  transform: translateY(-4px);
}
.pillar:hover::before { transform: scaleX(1); }
.pillar-num {
  font-family: 'Orbitron', monospace;
  font-size: 44px; font-weight: 900;
  color: rgba(0,229,255,.1); line-height: 1;
  margin-bottom: 8px;
  transition: color .3s;
}
.pillar:hover .pillar-num { color: rgba(0,229,255,.2); }
.pillar-icon { font-size: 26px; margin-bottom: 10px; }
.pillar-title { font-weight: 600; font-size: 14px; color: var(--text); margin-bottom: 6px; }
.pillar-desc { font-size: 12px; color: var(--muted); line-height: 1.65; }

.core-tabs {
  display: flex; gap: 4px; justify-content: center;
  flex-wrap: wrap; margin-bottom: 40px;
}
.ctab {
  padding: 9px 20px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 2px;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px; font-weight: 600;
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--muted); cursor: pointer;
  transition: .2s;
}
.ctab.on {
  background: var(--cyan);
  color: var(--bg);
  border-color: var(--cyan);
  box-shadow: 0 0 16px rgba(0,229,255,.35);
}
.ctab:hover:not(.on) { border-color: var(--cyan); color: var(--cyan); }

/* CSR â€” poster layout (reference design); fonts: Orbitron + Exo 2 like rest of home */
@keyframes csrPosterFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
.csr-ng-section {
  position: relative;
  overflow: hidden;
}
.csr-ng-section .container { position: relative; z-index: 1; max-width: 960px; }

.csr-poster {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  --csr-orange: #f57c00;
  --csr-green: #2e7d32;
  --csr-head-a: #0d1b3e;
  --csr-head-b: #1a3a6e;
  --csr-footer: #0d1b3e;
  --csr-card-shadow: 0 6px 32px rgba(0,0,0,.10);
  background: color-mix(in srgb, var(--surface) 86%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 28px;
  border: 1px solid var(--border);
  box-shadow: 0 12px 64px color-mix(in srgb, var(--text) 12%, transparent);
  overflow: visible;
  animation: csrPosterFadeUp .65s var(--ease) both;
}

.csr-poster-head {
  // background: linear-gradient(135deg, var(--csr-head-a) 0%, var(--csr-head-b) 100%);
  padding: 32px 40px 28px;
  text-align: center;
  position: relative;
  border-radius: 28px 28px 0 0;
  overflow: hidden;
}

.csr-poster-logo-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 50px;
  padding: 8px 20px;
  margin-bottom: 18px;
  box-shadow: 0 2px 12px rgba(0,0,0,.14);
}
.csr-poster-logo-pill img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  border-radius: 8px;
}
.csr-poster-logo-pill span {
  font-family: 'Orbitron', monospace;
  font-weight: 800;
  font-size: 17px;
  color: #0d1b3e;
  letter-spacing: .06em;
}

.csr-poster-h1 {
  margin: 0;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: clamp(22px, 4.6vw, 38px);
  color: #fff;
  line-height: 1.12;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.csr-poster-h1-accent {
  color: #7ec8ff;
  text-shadow: 0 0 20px rgba(96,165,250,.35);
}

.csr-poster-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
}
.csr-poster-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.csr-poster-dots span:nth-child(1) { background: var(--red); }
.csr-poster-dots span:nth-child(2) { background: var(--csr-orange); }
.csr-poster-dots span:nth-child(3) { background: var(--cyan); }

.csr-poster-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 20px;
  padding: 32px 28px;
  position: relative;
  overflow: visible;
}

.csr-poster-hub {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: clamp(120px, 18vw, 140px);
  height: clamp(120px, 18vw, 140px);
  z-index: 10;
  pointer-events: none;
}
.csr-poster-hub-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.csr-poster-hub-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 12px;
}
.csr-poster-hub-kicker {
  margin: 0;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  font-size: 9px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: .1em;
  line-height: 1.35;
}
.csr-poster-hub-title {
  margin: 4px 0 0;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: clamp(13px, 2.2vw, 17px);
  color: #0d1b3e;
  line-height: 1.1;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.csr-poster-hub-title .cyan { color: #1565c0; }

.csr-p-card {
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  font-family: 'Exo 2', sans-serif;
  background: var(--surface);
  border-radius: 18px;
  box-shadow: var(--csr-card-shadow);
  padding: 22px 20px 18px;
  text-align: left;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: transform .25s var(--ease), box-shadow .25s var(--ease);
  animation: csrPosterFadeUp .55s var(--ease) both;
  color: var(--text);
}
.csr-poster-grid > button.csr-p-card:nth-child(2) { animation-delay: .08s; }
.csr-poster-grid > button.csr-p-card:nth-child(3) { animation-delay: .14s; }
.csr-poster-grid > button.csr-p-card:nth-child(4) { animation-delay: .2s; }
.csr-poster-grid > button.csr-p-card:nth-child(5) { animation-delay: .26s; }
.csr-p-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 48px rgba(0,0,0,.14);
}
.csr-p-card:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 3px;
}
.csr-p-card.is-on {
  box-shadow: 0 0 0 2px var(--cyan), var(--csr-card-shadow);
}

.csr-p-card--red { border-top: 4px solid var(--red); }
.csr-p-card--blue { border-top: 4px solid var(--cyan); }
.csr-p-card--orange { border-top: 4px solid var(--csr-orange); }
.csr-p-card--green { border-top: 4px solid var(--csr-green); }

.csr-p-card-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  min-width: 0;
}
.csr-p-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 22px;
  color: #fff;
}
.csr-p-card--red .csr-p-icon-circle { background: var(--red); }
.csr-p-card--blue .csr-p-icon-circle { background: var(--cyan); }
.csr-p-card--orange .csr-p-icon-circle { background: var(--csr-orange); }
.csr-p-card--green .csr-p-icon-circle { background: var(--csr-green); }

.csr-p-card-title {
  margin: 0;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: clamp(12px, 1.6vw, 15px);
  text-transform: uppercase;
  line-height: 1.2;
  letter-spacing: .04em;
  min-width: 0;
  overflow-wrap: anywhere;
}
.csr-p-card--red .csr-p-card-title { color: var(--red); }
.csr-p-card--blue .csr-p-card-title { color: var(--cyan); }
.csr-p-card--orange .csr-p-card-title { color: var(--csr-orange); }
.csr-p-card--green .csr-p-card-title { color: var(--csr-green); }

.csr-p-card-ul {
  list-style: none;
  margin: 0 0 14px;
  padding: 0;
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
}
.csr-p-card-ul li {
  padding-left: 16px;
  position: relative;
  margin-bottom: 4px;
  overflow-wrap: anywhere;
}
.csr-p-card-ul li::before {
  content: 'â€¢';
  position: absolute;
  left: 2px;
  font-size: 14px;
  color: var(--muted2);
}

.csr-p-meta-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}
.csr-p-meta-ico {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  margin-top: 1px;
}
.csr-p-card--red .csr-p-meta-ico--ben,
.csr-p-card--red .csr-p-meta-ico--imp { background: #fde8e8; color: var(--red); }
.csr-p-card--blue .csr-p-meta-ico--ben,
.csr-p-card--blue .csr-p-meta-ico--imp { background: color-mix(in srgb, var(--cyan) 14%, var(--surface)); color: var(--cyan); }
.csr-p-card--orange .csr-p-meta-ico--ben,
.csr-p-card--orange .csr-p-meta-ico--imp { background: #fef3e2; color: var(--csr-orange); }
.csr-p-card--green .csr-p-meta-ico--ben,
.csr-p-card--green .csr-p-meta-ico--imp { background: #e6f4e8; color: var(--csr-green); }

.csr-p-meta-label {
  font-family: 'Orbitron', monospace;
  font-weight: 800;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: 4px;
}
.csr-p-card--red .csr-p-meta-label { color: var(--red); }
.csr-p-card--blue .csr-p-meta-label { color: var(--cyan); }
.csr-p-card--orange .csr-p-meta-label { color: var(--csr-orange); }
.csr-p-card--green .csr-p-meta-label { color: var(--csr-green); }

.csr-p-meta-ul {
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  line-height: 1.45;
  color: var(--muted);
}
.csr-p-meta-ul li {
  padding-left: 12px;
  position: relative;
  margin-bottom: 2px;
  overflow-wrap: anywhere;
}
.csr-p-meta-ul li::before {
  content: 'â€“';
  position: absolute;
  left: 0;
  color: var(--muted2);
  font-weight: 600;
}

.csr-poster-cta-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 0 28px 18px;
  padding: 18px 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--csr-head-a), var(--csr-head-b));
  text-decoration: none !important;
  color: #fff !important;
  transition: transform .2s var(--ease), box-shadow .2s var(--ease);
}
.csr-poster-cta-strip:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(13,27,62,.35);
}
.csr-poster-cta-ico {
  font-size: 26px;
  background: rgba(255,255,255,.12);
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.csr-poster-cta-text {
  margin: 0;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: clamp(12px, 2.2vw, 18px);
  text-transform: uppercase;
  letter-spacing: .08em;
  line-height: 1.2;
}

.csr-poster-footerbar {
  background: var(--csr-footer);
  padding: 14px 28px 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  border-radius: 0 0 28px 28px;
}
.csr-poster-footerbar span {
  color: rgba(255,255,255,.62);
  font-family: 'Exo 2', sans-serif;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.csr-poster-footerbar strong {
  color: #fff;
  font-family: 'Orbitron', monospace;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: .06em;
}

@media(max-width:1024px) {
  .csr-poster-grid { padding: 24px 18px; gap: 16px; }
  .csr-poster-cta-strip { margin-left: 18px; margin-right: 18px; }
}
@media(max-width:640px) {
  .csr-poster-grid { grid-template-columns: 1fr; padding: 16px 14px; }
  .csr-poster-hub { display: none; }
  .csr-poster-head { padding: 24px 18px 22px; }
  .csr-poster-cta-strip { margin-left: 14px; margin-right: 14px; padding: 16px 18px; }
  .csr-poster-footerbar { padding: 12px 14px 16px; }
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 26px;
}
.event-card {
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--ev-accent) 22%, var(--border));
  border-radius: var(--r);
  overflow: hidden;
  position: relative;
  --ev-accent: var(--cyan);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--ev-accent) 12%, rgba(0,0,0,.06));
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.events-grid .event-card:nth-child(4n + 1) { --ev-accent: var(--cyan); border-radius: 14px 20px 14px 16px; }
.events-grid .event-card:nth-child(4n + 2) { --ev-accent: var(--red); border-radius: 18px 12px 22px 14px; }
.events-grid .event-card:nth-child(4n + 3) { --ev-accent: color-mix(in srgb, var(--cyan) 55%, var(--red)); border-radius: 12px 18px 14px 20px; }
.events-grid .event-card:nth-child(4n) { --ev-accent: color-mix(in srgb, var(--red) 70%, #7c3aed); border-radius: 20px 14px 16px 18px; }
.event-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--ev-accent), color-mix(in srgb, var(--ev-accent) 35%, transparent));
  z-index: 2;
  pointer-events: none;
  opacity: 1;
}
.event-thumb {
  height: 160px;
  background: var(--surface2);
  position: relative;
  overflow: hidden;
}
.event-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(1.05) contrast(1.04);
}
.event-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(11,18,32,.35));
  pointer-events: none;
}
.event-status {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 1;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.92);
  color: var(--text);
}
.event-status.closed {
  border-color: rgba(255,45,122,.28);
  color: var(--red);
}
.event-body {
  padding: 16px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.event-title {
  font-family: 'Orbitron', monospace;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .04em;
  color: var(--text);
  line-height: 1.25;
}
.event-subtitle {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.55;
}
.event-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 2px;
}
.event-meta .m {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 10px;
}
.event-meta .m strong {
  display: block;
  font-size: 10px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted2);
  margin-bottom: 4px;
}
.event-meta .m span {
  display: block;
  font-size: 12px;
  color: var(--text);
  line-height: 1.35;
}
.event-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.event-actions a {
  flex: 1;
  text-align: center;
  text-decoration: none;
}
.event-actions .btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: .04em;
  transition: .2s;
}
.event-actions .btn-secondary:hover {
  border-color: var(--cyan);
  color: var(--cyan);
  box-shadow: 0 0 18px var(--cyan-glow);
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 26px;
}
.course-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  overflow: hidden;
  transition: .3s var(--ease);
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.course-card:hover {
  border-color: var(--cyan);
  box-shadow: 0 0 22px var(--cyan-glow);
  transform: translateY(-4px);
}
.course-thumb {
  height: 160px;
  background: var(--surface2);
  position: relative;
  overflow: hidden;
}
.course-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(1.03) contrast(1.03);
}
.course-badge {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 1;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.92);
  color: var(--text);
}
.course-body {
  padding: 16px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.course-title {
  font-family: 'Orbitron', monospace;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .04em;
  color: var(--text);
  line-height: 1.25;
}
.course-sector {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: .08em;
  text-transform: uppercase;
}
.course-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 2px;
}
.course-meta .m {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 10px;
}
.course-meta .m strong {
  display: block;
  font-size: 10px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted2);
  margin-bottom: 4px;
}
.course-meta .m span {
  display: block;
  font-size: 12px;
  color: var(--text);
  line-height: 1.35;
}
.course-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.course-actions a {
  flex: 1;
  text-align: center;
  text-decoration: none;
}

.course-carousel {
  position: relative;
  margin-top: 26px;
}
.course-carousel-viewport {
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  padding: 8px 4px 18px;
  margin: 0 -4px;
}
.course-carousel-viewport::-webkit-scrollbar {
  height: 6px;
}
.course-carousel-viewport::-webkit-scrollbar-thumb {
  background: var(--border-hi);
  border-radius: 99px;
}
.course-carousel-track {
  display: flex;
  gap: 16px;
  padding: 0 52px;
  min-height: 1px;
}
.course-carousel .course-card {
  flex: 0 0 clamp(260px, 72vw, 360px);
  scroll-snap-align: start;
  max-width: 100%;
}
/* Full Course.jsx-style cards inside home carousel */
.course-carousel .course-carousel-item {
  flex: 0 0 clamp(300px, 78vw, 420px);
  scroll-snap-align: start;
  max-width: 100%;
  box-sizing: border-box;
}
.course-carousel .course-carousel-item .card.courseCard {
  width: 100%;
}
.course-carousel .event-carousel-item {
  flex: 0 0 clamp(300px, 78vw, 420px);
  scroll-snap-align: start;
  max-width: 100%;
  box-sizing: border-box;
}

/* Future Ready carousel â€” static card skins (no hover-driven layout) */
.course-carousel .course-card-shell {
  --cc-accent: var(--cyan);
  --cc-accent2: var(--red);
  --cc-surface: #121a28;
  --cc-surface2: #0c1018;
}
.course-carousel .course-card-shell--1 {
  --cc-accent: var(--red);
  --cc-accent2: #f472b6;
  --cc-surface: #221418;
  --cc-surface2: #140c0e;
}
.course-carousel .course-card-shell--2 {
  --cc-accent: #38bdf8;
  --cc-accent2: #818cf8;
  --cc-surface: #0f1f2e;
  --cc-surface2: #081420;
}
.course-carousel .course-card-shell--3 {
  --cc-accent: #a78bfa;
  --cc-accent2: #fb7185;
  --cc-surface: #1a1030;
  --cc-surface2: #0f0820;
}

.course-carousel .course-card-shell .card.courseCard {
  position: relative;
  overflow: hidden;
  border: 2px solid color-mix(in srgb, var(--cc-accent) 55%, rgba(255,255,255,.18)) !important;
  background: linear-gradient(165deg, color-mix(in srgb, var(--cc-accent) 14%, var(--cc-surface)) 0%, var(--cc-surface2) 45%, var(--cc-surface) 100%) !important;
  box-shadow:
    0 12px 40px rgba(0,0,0,.35),
    0 0 0 1px rgba(255,255,255,.06) inset,
    0 -20px 50px color-mix(in srgb, var(--cc-accent) 12%, transparent) inset;
  transform: none;
  will-change: auto;
}
.course-carousel .course-card-shell--0 .card.courseCard {
  border-radius: 20px 10px 22px 14px !important;
  border-left-width: 6px !important;
  border-left-color: color-mix(in srgb, var(--cc-accent) 85%, #fff) !important;
  border-top-color: rgba(255,255,255,.12) !important;
  border-right-color: rgba(255,255,255,.12) !important;
  border-bottom-color: rgba(255,255,255,.12) !important;
}
.course-carousel .course-card-shell--1 .card.courseCard {
  border-radius: 12px 22px 16px 20px !important;
  border-top-width: 6px !important;
  border-top-color: color-mix(in srgb, var(--cc-accent) 90%, #fff) !important;
  border-left-color: rgba(255,255,255,.14) !important;
  border-right-color: rgba(255,255,255,.14) !important;
  border-bottom-color: rgba(255,255,255,.14) !important;
}
.course-carousel .course-card-shell--2 .card.courseCard {
  border-radius: 16px 16px 24px 24px !important;
  border: 1px solid color-mix(in srgb, var(--cc-accent) 48%, rgba(255,255,255,.22)) !important;
  outline: 2px solid color-mix(in srgb, var(--cc-accent) 40%, transparent);
  outline-offset: 3px;
}
.course-carousel .course-card-shell--3 .card.courseCard {
  border-radius: 10px 20px 20px 10px !important;
  border-right-width: 6px !important;
  border-right-color: color-mix(in srgb, var(--cc-accent) 85%, #fff) !important;
  border-top-color: rgba(255,255,255,.12) !important;
  border-left-color: rgba(255,255,255,.12) !important;
  border-bottom-color: rgba(255,255,255,.12) !important;
}

.course-carousel .course-card-shell .card.courseCard::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 1;
  background:
    radial-gradient(120% 55% at 0% 0%, color-mix(in srgb, var(--cc-accent) 28%, transparent), transparent 50%),
    radial-gradient(90% 50% at 100% 100%, color-mix(in srgb, var(--cc-accent2) 18%, transparent), transparent 55%);
}
.course-carousel .course-card-shell--1 .card.courseCard::before {
  background:
    radial-gradient(100% 60% at 100% 0%, color-mix(in srgb, var(--cc-accent) 32%, transparent), transparent 52%),
    radial-gradient(80% 45% at 0% 100%, color-mix(in srgb, var(--cc-accent2) 22%, transparent), transparent 50%);
}
.course-carousel .course-card-shell--2 .card.courseCard::before {
  background: repeating-linear-gradient(
    -12deg,
    transparent,
    transparent 14px,
    color-mix(in srgb, var(--cc-accent) 06%, transparent) 14px,
    color-mix(in srgb, var(--cc-accent) 06%, transparent) 15px
  );
  opacity: 0.9;
}
.course-carousel .course-card-shell--3 .card.courseCard::before {
  background:
    linear-gradient(105deg, transparent 40%, color-mix(in srgb, var(--cc-accent) 12%, transparent) 40%, color-mix(in srgb, var(--cc-accent) 12%, transparent) 42%, transparent 42%),
    radial-gradient(70% 50% at 50% -10%, color-mix(in srgb, var(--cc-accent2) 25%, transparent), transparent 70%);
}

.course-carousel .course-card-shell .card.courseCard > * {
  position: relative;
  z-index: 1;
}

.course-carousel .course-card-shell .card-body {
  padding: 16px 18px 0 !important;
}
.course-carousel .course-card-shell .card-body h4 {
  font-family: 'Orbitron', monospace !important;
  font-size: clamp(14px, 2.8vw, 17px) !important;
  font-weight: 800 !important;
  letter-spacing: 0.04em !important;
  line-height: 1.25 !important;
  color: #f8fafc !important;
  text-shadow: 0 1px 0 color-mix(in srgb, var(--cc-accent) 35%, transparent);
}
.course-carousel .course-card-shell--1 .card-body h4 {
  color: #fff1f2 !important;
  text-shadow: 0 1px 0 color-mix(in srgb, var(--cc-accent) 40%, transparent);
}
.course-carousel .course-card-shell #course_height {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--cc-accent) 22%, rgba(255,255,255,.12));
}

.course-carousel .course-card-shell .bg-img {
  overflow: hidden;
  margin: 10px 12px 0;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--cc-accent) 35%, rgba(255,255,255,.25));
  box-shadow: 0 8px 24px rgba(0,0,0,.35);
}
.course-carousel .course-card-shell--0 .bg-img { border-radius: 10px 18px 12px 14px; margin: 12px 12px 0 10px; }
.course-carousel .course-card-shell--1 .bg-img { border-radius: 16px 10px 14px 18px; margin: 14px 10px 0 12px; }
.course-carousel .course-card-shell--2 .bg-img { border-radius: 14px; margin: 12px 14px 0; }
.course-carousel .course-card-shell--3 .bg-img { border-radius: 18px 10px 16px 12px; margin: 10px 12px 0 14px; }

.course-carousel .course-card-shell .right_obj {
  background: color-mix(in srgb, var(--cc-accent) 10%, #fff) !important;
  border: 1px solid color-mix(in srgb, var(--cc-accent) 45%, #ffd542) !important;
  color: color-mix(in srgb, var(--cc-accent) 85%, #1e293b) !important;
  outline-color: color-mix(in srgb, var(--cc-accent) 25%, #fff) !important;
  font-weight: 800 !important;
}

.course-carousel .course-card-shell--0 .course_card_footer {
  background: linear-gradient(95deg, color-mix(in srgb, var(--cc-accent) 55%, #4c1d95), #FC2B5A) !important;
}
.course-carousel .course-card-shell--1 .course_card_footer {
  background: linear-gradient(95deg, #FC2B5A, color-mix(in srgb, var(--cc-accent) 40%, #9f1239)) !important;
}
.course-carousel .course-card-shell--2 .course_card_footer {
  background: linear-gradient(95deg, #0369a1, color-mix(in srgb, var(--cc-accent) 35%, #0c4a6e)) !important;
}
.course-carousel .course-card-shell--3 .course_card_footer {
  background: linear-gradient(95deg, color-mix(in srgb, var(--cc-accent) 50%, #6d28d9), #FC2B5A) !important;
}

@media (prefers-reduced-motion: reduce) {
  .course-carousel .course-card-shell .card.courseCard,
  .course-carousel .course-card-shell .bg-img,
  .course-carousel .course-card-shell .course_card_footer {
    transition: none !important;
  }
}

.course-carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 4;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(8px);
  color: var(--text);
  font-size: 22px;
  line-height: 1;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 24px color-mix(in srgb, var(--text) 12%, transparent);
  transition: border-color .2s, color .2s, box-shadow .2s;
}
.course-carousel-btn:hover {
  border-color: var(--cyan);
  color: var(--cyan);
  box-shadow: 0 0 20px var(--cyan-glow);
}
.course-carousel-btn:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 3px;
}
.course-carousel-btn--prev { left: 0; }
.course-carousel-btn--next { right: 0; }
.course-carousel-btn:disabled {
  opacity: .35;
  cursor: default;
  pointer-events: none;
}

.area-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 48px;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 56px; align-items: center;
  position: relative; overflow: hidden;
  animation: foc-fadeUp .3s ease;
}
.area-panel::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
}
@keyframes foc-fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
.area-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--cyan-soft);
  border: 1px solid var(--border);
  color: var(--cyan);
  font-size: 10px; font-weight: 600;
  letter-spacing: .14em; text-transform: uppercase;
  padding: 5px 12px; border-radius: 2px;
  margin-bottom: 14px;
}
.area-h {
  font-family: 'Orbitron', monospace;
  font-size: 26px; font-weight: 700;
  color: var(--text); margin-bottom: 12px;
  line-height: 1.15; letter-spacing: .03em;
}
.area-desc { font-size: 14px; color: var(--muted); line-height: 1.8; margin-bottom: 24px; font-style: italic; }
.area-items { display: flex; flex-direction: column; gap: 10px; }
.aitem {
  display: flex; gap: 14px; align-items: flex-start;
  padding: 14px 16px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: .2s;
}
.aitem.on { border-color: var(--cyan); box-shadow: 0 0 10px var(--cyan-glow); }
.aitem:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
.aitem:hover { border-color: var(--cyan); box-shadow: 0 0 10px var(--cyan-glow); }
.aitem-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
.aitem strong { display: block; font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 2px; }
.aitem span { color: var(--muted); font-size: 12px; line-height: 1.55; }
.area-visual {
  border-radius: var(--r);
  background: var(--bg);
  border: 1px solid var(--border);
  height: 340px;
  display: flex; align-items: center; justify-content: center;
  font-size: 90px;
  position: relative; overflow: hidden;
}
.area-visual-img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: calc(var(--r) - 2px);
  filter: saturate(1.05) contrast(1.05);
  animation: foc-visual-pop .22s ease-out;
}
.area-visual-emoji {
  position: relative;
  z-index: 1;
  display: inline-block;
  transform: translateZ(0);
  animation: foc-visual-pop .22s ease-out;
}
@keyframes foc-visual-pop {
  from { opacity: 0; transform: scale(.92); filter: blur(2px); }
  to { opacity: 1; transform: scale(1); filter: blur(0); }
}
.area-visual::after {
  content: '';
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(0,229,255,.07) 0%, transparent 65%),
    linear-gradient(rgba(0,229,255,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,229,255,.025) 1px, transparent 1px);
  background-size: 100%, 30px 30px, 30px 30px;
}

.labs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.lab-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r); padding: 26px 22px;
  transition: .3s var(--ease); cursor: default;
}
.lab-card:hover {
  border-color: var(--cyan);
  box-shadow: 0 0 20px var(--cyan-glow);
  transform: translateY(-4px);
}
.lab-icon-box {
  width: 50px; height: 50px;
  background: var(--cyan-soft);
  border: 1px solid var(--border);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; margin-bottom: 14px;
}
.lab-name { font-family: 'Orbitron', monospace; font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 6px; letter-spacing: .04em; }
.lab-desc { font-size: 12px; color: var(--muted); line-height: 1.65; }

/* FFTLaaS â€” intro matches site; blocks below use soft â€œcuteâ€ shapes (not lab/why cards) */
.fftl-nep {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: fit-content; max-width: 100%; margin: 0 auto 16px;
  padding: 8px 16px;
  background: var(--cyan-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 10px; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: var(--cyan);
}
.fftl-snap {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 32px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r);
  padding: 22px 14px;
}
.fftl-snap-cell { text-align: center; padding: 6px 4px; }
.fftl-snap-k { font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted2); margin-bottom: 6px; }
.fftl-snap-v { font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 700; color: var(--cyan); line-height: 1.25; }
.fftl-snap.fftl-snap--cute {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;
  margin-top: 28px;
  padding: 20px 16px;
  background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%);
  border: 1px solid var(--border);
  border-radius: var(--r);
  box-shadow: 0 4px 24px rgba(16, 24, 40, .06);
}
.fftl-snap--cute .fftl-snap-cell {
  flex: 1 1 104px;
  max-width: 160px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  min-width: 104px;
  box-shadow: 0 2px 10px rgba(16, 24, 40, .05);
  transition: border-color .22s var(--ease), box-shadow .22s var(--ease), transform .22s var(--ease);
}
.fftl-snap--cute .fftl-snap-cell:hover {
  border-color: var(--cyan);
  box-shadow: 0 6px 20px var(--cyan-glow);
  transform: translateY(-2px);
}
.fftl-snap--cute .fftl-snap-k {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted2);
  margin-bottom: 8px;
}
.fftl-snap--cute .fftl-snap-v {
  font-family: 'Orbitron', monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--cyan);
  line-height: 1.3;
  text-shadow: none;
}
.fftl-cute-lab {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 26px 22px;
  margin-top: 10px;
}
.fftl-cute-stack {
  flex: 1 1 200px;
  max-width: 300px;
  text-align: center;
  transition: transform .35s var(--ease);
}
.fftl-cute-stack:nth-child(1) { transform: rotate(-1.2deg); }
.fftl-cute-stack:nth-child(2) { transform: rotate(1deg); }
.fftl-cute-stack:nth-child(3) { transform: rotate(-0.5deg); }
.fftl-cute-stack:hover { transform: rotate(0deg) translateY(-5px); }
.fftl-cute-orbit {
  width: 86px; height: 86px; margin: 0 auto;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 36px; line-height: 1;
  background:
    radial-gradient(circle at 28% 22%, rgba(255,200,230,.18), transparent 42%),
    radial-gradient(circle at 72% 78%, rgba(0,229,255,.22), transparent 48%),
    rgba(14,16,24,.92);
  border: 3px solid rgba(255,255,255,.14);
  box-shadow:
    0 0 0 5px rgba(0,229,255,.07),
    0 14px 32px rgba(0,0,0,.38),
    inset 0 2px 0 rgba(255,255,255,.1);
}
.fftl-cute-puff {
  margin-top: -14px;
  padding: 22px 20px 18px;
  background: linear-gradient(168deg, rgba(255,255,255,.06), rgba(0,0,0,.22));
  border: 2px dashed rgba(0,229,255,.28);
  border-radius: 28px 34px 22px 30px;
  text-align: left;
}
.fftl-cute-puff h4 {
  font-family: 'Orbitron', monospace;
  font-size: 13px; font-weight: 700; color: var(--text);
  margin: 0 0 8px; letter-spacing: .04em;
}
.fftl-cute-puff p { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.65; }
.fftl-cute-values {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px 16px;
  margin-top: 10px;
}
.fftl-cute-sticker {
  position: relative;
  padding: 16px 16px 16px 54px;
  border-radius: 10px 24px 18px 26px;
  background: rgba(255,255,255,.04);
  border: 2px solid rgba(255,182,200,.28);
  box-shadow: 4px 5px 0 rgba(0,0,0,.22);
  transition: transform .28s var(--ease), box-shadow .28s;
}
.fftl-cute-sticker:nth-child(odd) {
  transform: rotate(-1.3deg);
  border-color: rgba(0,229,255,.3);
}
.fftl-cute-sticker:nth-child(even) { transform: rotate(1.1deg); }
.fftl-cute-sticker:hover {
  transform: rotate(0deg) translateY(-3px);
  box-shadow: 5px 7px 0 rgba(0,0,0,.28);
}
.fftl-cute-pin {
  position: absolute; left: 10px; top: 12px;
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  background: rgba(0,0,0,.38);
  border: 2px solid rgba(255,255,255,.12);
}
.fftl-cute-sticker strong {
  display: block;
  font-family: 'Orbitron', monospace;
  font-size: 11px; font-weight: 700;
  letter-spacing: .05em; color: var(--text);
  margin-bottom: 6px;
}
.fftl-cute-sticker p { margin: 0; font-size: 11px; color: var(--muted); line-height: 1.58; }
.fftl-cute-path { margin-top: 12px; max-width: 640px; margin-left: auto; margin-right: auto; }
.fftl-cute-step {
  display: flex; gap: 16px; align-items: flex-start;
  position: relative;
  padding-bottom: 20px;
}
.fftl-cute-step:last-child { padding-bottom: 0; }
.fftl-cute-step::after {
  content: '';
  position: absolute;
  left: 24px;
  top: 52px;
  bottom: 6px;
  width: 0;
  border-left: 3px dotted rgba(0,229,255,.4);
}
.fftl-cute-step:last-child::after { display: none; }
.fftl-cute-ball {
  flex-shrink: 0;
  width: 50px; height: 50px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Orbitron', monospace;
  font-size: 17px; font-weight: 900;
  color: #fff;
  background: linear-gradient(150deg, #ff6b9d, #7c5cff 40%, var(--cyan));
  box-shadow: 0 5px 16px rgba(255,90,150,.4), inset 0 -3px 0 rgba(0,0,0,.18);
  z-index: 1;
}
.fftl-cute-bubble {
  flex: 1;
  padding: 14px 18px 14px 16px;
  border-radius: 8px 22px 22px 20px;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.1);
  position: relative;
}
.fftl-cute-bubble::before {
  content: '';
  position: absolute;
  left: -7px; top: 18px;
  width: 0; height: 0;
  border: 7px solid transparent;
  border-right-color: rgba(255,255,255,.055);
}
.fftl-cute-bubble h4 {
  font-family: 'Orbitron', monospace;
  font-size: 12px; font-weight: 700;
  color: var(--text); margin: 0 0 6px; letter-spacing: .03em;
}
.fftl-cute-bubble p { margin: 0; font-size: 11px; color: var(--muted); line-height: 1.58; }

.roles-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
.role-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 26px 12px; text-align: center;
  cursor: pointer; text-decoration: none;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  transition: .3s var(--ease);
}
.role-card:hover {
  border-color: var(--cyan);
  box-shadow: 0 0 20px var(--cyan-glow);
  transform: translateY(-5px);
}
.role-emoji { font-size: 30px; }
.role-name { font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--text); }
.role-desc { font-size: 11px; color: var(--muted); line-height: 1.5; }
.role-cta { font-size: 11px; color: var(--cyan); font-weight: 600; letter-spacing: .06em; }

.why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.why-card {
  border-radius: var(--r); padding: 28px 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  transition: .3s var(--ease);
}
.why-card:hover {
  border-color: var(--cyan-dim);
  box-shadow: 0 0 18px var(--cyan-glow);
  transform: translateY(-3px);
}
.why-icon { font-size: 30px; margin-bottom: 12px; }
.why-title { font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 7px; letter-spacing: .04em; }
.why-desc { font-size: 12px; color: var(--muted); line-height: 1.65; }

.projects-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.proj-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r); padding: 24px 20px;
  transition: .3s var(--ease);
  position: relative; overflow: hidden;
}
.proj-card::before {
  content: '';
  position: absolute; top: 0; left: 0; width: 3px; height: 100%;
  background: var(--cyan);
  opacity: 0; transition: .3s;
}
.proj-card:hover { border-color: var(--border-hi); transform: translateY(-4px); box-shadow: 0 0 18px var(--cyan-glow); }
.proj-card:hover::before { opacity: 1; }
.proj-partner { font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--cyan); margin-bottom: 8px; }
.proj-title { font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 12px; line-height: 1.3; letter-spacing: .02em; }
.proj-meta { display: flex; flex-direction: column; gap: 6px; }
.proj-row { display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: var(--muted); }
.proj-row strong { color: var(--cyan); font-weight: 600; min-width: 52px; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; }

.reach-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r); padding: 28px 20px;
  text-align: center; transition: .3s var(--ease);
}
.stat-card:hover { border-color: var(--cyan); box-shadow: 0 0 20px var(--cyan-glow); }
.sc-num {
  font-family: 'Orbitron', monospace;
  font-size: 40px; font-weight: 700;
  color: var(--cyan); line-height: 1;
  text-shadow: 0 0 16px rgba(0,229,255,.4);
  margin-bottom: 6px;
}
.sc-lbl { font-size: 12px; color: var(--muted); letter-spacing: .08em; }
.states-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r); padding: 36px;
}
.states-head {
  font-family: 'Orbitron', monospace;
  font-size: 14px; font-weight: 600; color: var(--text);
  margin-bottom: 20px; letter-spacing: .06em;
}
.states-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.state-chip {
  padding: 6px 18px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 2px;
  font-size: 11px; font-weight: 500;
  letter-spacing: .06em;
  color: var(--muted);
  transition: .2s;
}
.state-chip:hover { border-color: var(--cyan); color: var(--cyan); }
.states-note { margin-top: 16px; font-size: 11px; color: var(--muted2); font-style: italic; }

.partners-flex { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.partner-chip {
  padding: 8px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 2px; font-size: 11px;
  font-weight: 500; letter-spacing: .06em;
  color: var(--muted); transition: .2s;
}
.partner-chip:hover { border-color: var(--cyan); color: var(--cyan); }

.cta-block {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px; padding: 72px 60px;
  text-align: center; position: relative; overflow: hidden;
}
.cta-block::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--red), var(--cyan), var(--red));
}
.cta-block::after {
  content: '';
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(0,229,255,.05) 0%, transparent 65%);
  pointer-events: none;
}
.cta-h {
  font-family: 'Orbitron', monospace;
  font-size: clamp(24px, 4vw, 44px);
  font-weight: 700; color: var(--text);
  margin-bottom: 10px; position: relative; z-index: 1;
  letter-spacing: .04em;
}
.cta-sub { font-size: 14px; color: var(--muted); margin-bottom: 36px; position: relative; z-index: 1; font-style: italic; }
.cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
.cta-contact { color: var(--muted2); font-size: 12px; margin-top: 28px; position: relative; z-index: 1; letter-spacing: .04em; }

.partner-with-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 10px;
}
.partner-with-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 22px 18px;
  text-align: left;
  transition: border-color .2s ease, box-shadow .28s ease;
}
.partner-with-card:hover {
  border-color: color-mix(in srgb, var(--cyan) 38%, var(--border));
  box-shadow: 0 10px 32px var(--pillHoverShadow);
}
.partner-with-card .pwc-ico { font-size: 24px; margin-bottom: 12px; line-height: 1; }
.partner-with-card .pwc-title {
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--cyan);
  margin-bottom: 10px;
}
.partner-with-card .pwc-desc { font-size: 13px; color: var(--muted); line-height: 1.55; margin: 0; }
.partner-with-highlights {
  margin-top: 28px;
  display: grid;
  gap: 12px;
  max-width: 760px;
  margin-left: auto;
  margin-right: auto;
}
.pwh-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.5;
}
.pwh-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--cyan), var(--red));
  box-shadow: 0 0 12px var(--cyan-glow);
}

.footer { background: var(--bg); border-top: 1px solid var(--border); padding: 56px 0 32px; }
.footer-inner { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
.footer-brand-logo {
  font-family: 'Orbitron', monospace;
  font-size: 24px; font-weight: 900;
  letter-spacing: .1em;
  display: block; margin-bottom: 12px;
  color: var(--text);
}
.footer-brand-logo .f { color: var(--cyan); text-shadow: 0 10px 24px rgba(122,43,255,.18); }
.footer-brand p { font-size: 13px; color: var(--muted); line-height: 1.75; }
.footer-col h4 {
  font-family: 'Orbitron', monospace;
  font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .16em;
  color: var(--cyan); margin-bottom: 18px;
}
.footer-col a {
  display: block; font-size: 12px;
  color: var(--muted); text-decoration: none;
  margin-bottom: 10px; transition: .2s;
  letter-spacing: .04em;
}
.footer-col a:hover { color: var(--text); }
.footer-bottom {
  margin-top: 48px; padding-top: 24px;
  border-top: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; color: var(--muted2); letter-spacing: .06em;
}
.footer-bottom a { color: var(--muted); text-decoration: none; }

/* â”€â”€ Four Pillars of Impact â”€â”€ */
.foc-cyber-home #about .container {
  position: relative;
  z-index: 1;
}
.foc-cyber-home .ip-pillars-wrap {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}
.foc-cyber-home .ip-shell {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #dde3ea;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(10, 34, 64, 0.08);
  font-family: 'DM Sans', 'Exo 2', sans-serif;
}
.foc-cyber-home .ip-shell-panel {
  background: #ffffff;
  position: relative;
}
.foc-cyber-home .ip-shell-panel .ip-three-col,
.foc-cyber-home .ip-shell-panel .ip-col,
.foc-cyber-home .ip-shell-panel .ip-projects,
.foc-cyber-home .ip-shell-panel .ip-proj-card,
.foc-cyber-home .ip-shell-panel .ip-card-info {
  background-color: #ffffff;
  background-image: none;
}
.foc-cyber-home .ip-tab-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0;
  background: transparent;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.foc-cyber-home .ip-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 10px;
  border: 1.5px solid #c5d4e8;
  background: #ffffff;
  color: #0a2240;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  cursor: pointer;
  white-space: nowrap;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(10, 34, 64, 0.08);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s, background 0.2s, color 0.2s;
}
.foc-cyber-home .ip-tab-btn:hover {
  border-color: #7eb8f7;
  box-shadow: 0 4px 14px rgba(10, 34, 64, 0.14);
  transform: translateY(-1px);
}
.foc-cyber-home .ip-tab-btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
}
.foc-cyber-home .ip-tab-num {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800;
  border: 1.5px solid #94a3b8;
  color: #0a2240;
  background: #f0f4f8;
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.foc-cyber-home .ip-tab-btn.is-on {
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(10, 34, 64, 0.22);
  transform: translateY(-1px);
}
.foc-cyber-home .ip-tab-btn.p1.is-on { background: #0a2240; }
.foc-cyber-home .ip-tab-btn.p2.is-on { background: #4c1d95; }
.foc-cyber-home .ip-tab-btn.p3.is-on { background: #6d28d9; }
.foc-cyber-home .ip-tab-btn.p4.is-on { background: #15803d; }
.foc-cyber-home .ip-tab-btn.is-on .ip-tab-num {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.55);
  color: #ffffff;
}
.foc-cyber-home .ip-tab-btn.p1.is-on .ip-tab-num { background: #4fc3f7; border-color: #4fc3f7; color: #0a2240; }
.foc-cyber-home .ip-tab-btn.p2.is-on .ip-tab-num { background: #a78bfa; border-color: #a78bfa; color: #1e1b4b; }
.foc-cyber-home .ip-tab-btn.p3.is-on .ip-tab-num { background: #c4b5fd; border-color: #c4b5fd; color: #4c1d95; }
.foc-cyber-home .ip-tab-btn.p4.is-on .ip-tab-num { background: #86efac; border-color: #86efac; color: #052e16; }

.foc-cyber-home .ip-hdr {
  padding: 1.5rem 1.75rem 1.25rem;
  position: relative;
  overflow: hidden;
  color: #fff;
}
.foc-cyber-home .ip-hdr.p1 { background: linear-gradient(135deg, #0a2240 0%, #123a6e 100%); }
.foc-cyber-home .ip-hdr.p2 { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); }
.foc-cyber-home .ip-hdr.p3 { background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%); }
.foc-cyber-home .ip-hdr.p4 { background: linear-gradient(135deg, #052e16 0%, #166534 100%); }
.foc-cyber-home .ip-hdr-top { display: flex; align-items: flex-start; gap: 1.25rem; }
.foc-cyber-home .ip-hdr-left { flex: 1; min-width: 0; }
.foc-cyber-home .ip-brand-badge {
  display: inline-flex; align-items: center; gap: 7px;
  border-radius: 8px; padding: 5px 12px 5px 10px; margin-bottom: 10px;
  font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 0.3px;
}
.foc-cyber-home .ip-hdr.p1 .ip-brand-badge { background: #2e7d32; }
.foc-cyber-home .ip-hdr.p2 .ip-brand-badge { background: #7c3aed; }
.foc-cyber-home .ip-hdr.p3 .ip-brand-badge { background: #4c1d95; }
.foc-cyber-home .ip-hdr.p4 .ip-brand-badge { background: #15803d; }
.foc-cyber-home .ip-pillar-tag {
  display: inline-block; color: #fff; font-size: 10px; font-weight: 700;
  letter-spacing: 2px; text-transform: uppercase; padding: 3px 10px; border-radius: 3px; margin-bottom: 7px;
}
.foc-cyber-home .ip-hdr.p1 .ip-pillar-tag { background: #1a6abf; }
.foc-cyber-home .ip-hdr.p2 .ip-pillar-tag { background: #7c3aed; }
.foc-cyber-home .ip-hdr.p3 .ip-pillar-tag { background: #6d28d9; }
.foc-cyber-home .ip-hdr.p4 .ip-pillar-tag { background: #16a34a; }
.foc-cyber-home .ip-hdr .ip-hdr-title {
  font-size: clamp(1.4rem, 3vw, 1.95rem);
  font-weight: 800;
  color: #ffffff;
  line-height: 1.15;
  margin: 0 0 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}
.foc-cyber-home .ip-hdr .ip-hdr-title .ip-accent { color: #7dd3fc; }
.foc-cyber-home .ip-hdr .ip-hdr-title .ip-accent2 { color: #c4b5fd; }
.foc-cyber-home .ip-hdr .ip-hdr-title .ip-accent4 { color: #bbf7d0; }
.foc-cyber-home .ip-hdr .ip-hdr-sub {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #e3f2fd;
  letter-spacing: 0.02em;
}
.foc-cyber-home .ip-hdr.p2 .ip-hdr-sub,
.foc-cyber-home .ip-hdr.p3 .ip-hdr-sub { color: #ede9fe; }
.foc-cyber-home .ip-hdr.p4 .ip-hdr-sub { color: #dcfce7; }
.foc-cyber-home .ip-hdr .ip-hdr-desc {
  font-size: 14px;
  line-height: 1.75;
  max-width: 680px;
  margin: 0;
  color: #f1f5f9;
  font-weight: 400;
  opacity: 1;
}
.foc-cyber-home .ip-hdr.p1 .ip-hdr-desc { color: #f0f7ff; }
.foc-cyber-home .ip-hdr.p2 .ip-hdr-desc,
.foc-cyber-home .ip-hdr.p3 .ip-hdr-desc { color: #f5f3ff; }
.foc-cyber-home .ip-hdr.p4 .ip-hdr-desc { color: #ecfdf5; }
.foc-cyber-home .ip-hdr-icons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  flex-shrink: 0;
}
.foc-cyber-home .ip-icon-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.foc-cyber-home .ip-icon-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  max-width: 56px;
}
.foc-cyber-home .ip-hdr .ip-ic {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.foc-cyber-home .ip-hdr .ip-icon-pill span {
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  line-height: 1.25;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.foc-cyber-home .ip-three-col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 1rem 1.15rem 1.25rem;
  background: #ffffff;
}
.foc-cyber-home .ip-three-col.p1 { border-top: 3px solid #1a6abf; }
.foc-cyber-home .ip-three-col.p2 { border-top: 3px solid #7c3aed; }
.foc-cyber-home .ip-three-col.p3 { border-top: 3px solid #6d28d9; }
.foc-cyber-home .ip-three-col.p4 { border-top: 3px solid #16a34a; }
.foc-cyber-home .ip-col {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border: 1px solid #dde3ea;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(10, 34, 64, 0.05);
}
.foc-cyber-home .ip-col-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  margin: 0;
  border-bottom: 2px solid;
}
.foc-cyber-home .ip-three-col.p1 .ip-col-head { background: #f0f7ff; border-bottom-color: #1a6abf; }
.foc-cyber-home .ip-three-col.p2 .ip-col-head { background: #f5f3ff; border-bottom-color: #7c3aed; }
.foc-cyber-home .ip-three-col.p3 .ip-col-head { background: #f5f3ff; border-bottom-color: #6d28d9; }
.foc-cyber-home .ip-three-col.p4 .ip-col-head { background: #f0fdf4; border-bottom-color: #16a34a; }
.foc-cyber-home .ip-col-ico {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.foc-cyber-home .ip-col-ico.blue { background: #e6f1fb; color: #185fa5; }
.foc-cyber-home .ip-col-ico.purple { background: #ede9fe; color: #6d28d9; }
.foc-cyber-home .ip-col-ico.green { background: #dcfce7; color: #15803d; }
.foc-cyber-home .ip-col-ico.orange { background: #fff3e0; color: #e65100; }
.foc-cyber-home .ip-col-title {
  font-size: 12px; font-weight: 800; letter-spacing: 1.2px;
  text-transform: uppercase; color: #0a2240; line-height: 1.3;
}
.foc-cyber-home .ip-col-body {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px 11px 14px;
  flex: 1;
}
.foc-cyber-home .ip-three-col.p1 .ip-col-body { background: #fafcff; }
.foc-cyber-home .ip-three-col.p2 .ip-col-body,
.foc-cyber-home .ip-three-col.p3 .ip-col-body { background: #fcfbff; }
.foc-cyber-home .ip-three-col.p4 .ip-col-body { background: #f9fefb; }
.foc-cyber-home .ip-col--focus .ip-col-body {
  background: #ffffff;
}
.foc-cyber-home .ip-col--focus .ip-col-title {
  font-size: 13px;
  letter-spacing: 1.4px;
}
.foc-cyber-home .ip-col--focus .ip-col-head {
  padding: 13px 14px;
}
.foc-cyber-home .ip-focus-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.foc-cyber-home .ip-focus-list li {
  font-size: 14.5px;
  color: #152536;
  padding: 11px 13px;
  border: 1px solid #d8e2ef;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 11px;
  line-height: 1.45;
  font-weight: 500;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(10, 34, 64, 0.04);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.foc-cyber-home .ip-focus-list li:hover {
  border-color: #b5d4f4;
  box-shadow: 0 3px 10px rgba(10, 34, 64, 0.08);
}
.foc-cyber-home .ip-focus-ico {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.foc-cyber-home .ip-focus-text {
  flex: 1;
  min-width: 0;
}
.foc-cyber-home .ip-three-col.p1 .ip-focus-ico { background: #e6f1fb; color: #185fa5; }
.foc-cyber-home .ip-three-col.p2 .ip-focus-ico { background: #ede9fe; color: #6d28d9; }
.foc-cyber-home .ip-three-col.p3 .ip-focus-ico { background: #ede9fe; color: #5b21b6; }
.foc-cyber-home .ip-three-col.p4 .ip-focus-ico { background: #dcfce7; color: #15803d; }
.foc-cyber-home .ip-three-col.p1 .ip-focus-list li { border-left: 4px solid #1a6abf; }
.foc-cyber-home .ip-three-col.p2 .ip-focus-list li { border-left: 4px solid #7c3aed; }
.foc-cyber-home .ip-three-col.p3 .ip-focus-list li { border-left: 4px solid #6d28d9; }
.foc-cyber-home .ip-three-col.p4 .ip-focus-list li { border-left: 4px solid #16a34a; }
.foc-cyber-home .ip-check {
  display: flex; align-items: flex-start; gap: 9px;
  font-size: 14px; color: #1e2d3d; padding: 10px 12px;
  border: 1px solid #e2e8f0; border-radius: 8px;
  line-height: 1.5; font-weight: 500; background: #ffffff;
}
.foc-cyber-home .ip-three-col.p1 .ip-check { border-left: 3px solid #1a6abf; }
.foc-cyber-home .ip-three-col.p2 .ip-check,
.foc-cyber-home .ip-three-col.p3 .ip-check { border-left: 3px solid #7c3aed; }
.foc-cyber-home .ip-three-col.p4 .ip-check { border-left: 3px solid #16a34a; }
.foc-cyber-home .ip-chk {
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;
}
.foc-cyber-home .ip-three-col.p1 .ip-chk { background: #e6f1fb; color: #185fa5; }
.foc-cyber-home .ip-three-col.p2 .ip-chk, .foc-cyber-home .ip-three-col.p3 .ip-chk { background: #ede9fe; color: #6d28d9; }
.foc-cyber-home .ip-three-col.p4 .ip-chk { background: #dcfce7; color: #15803d; }
.foc-cyber-home .ip-snap {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0; border-radius: 8px;
  background: #ffffff;
}
.foc-cyber-home .ip-three-col.p1 .ip-snap { border-left: 3px solid #1a6abf; }
.foc-cyber-home .ip-three-col.p2 .ip-snap,
.foc-cyber-home .ip-three-col.p3 .ip-snap { border-left: 3px solid #7c3aed; }
.foc-cyber-home .ip-three-col.p4 .ip-snap { border-left: 3px solid #16a34a; }
.foc-cyber-home .ip-snap-ico {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
}
.foc-cyber-home .ip-three-col.p1 .ip-snap-ico { background: #fff3e0; color: #e65100; }
.foc-cyber-home .ip-three-col.p2 .ip-snap-ico, .foc-cyber-home .ip-three-col.p3 .ip-snap-ico { background: #ede9fe; color: #6d28d9; }
.foc-cyber-home .ip-three-col.p4 .ip-snap-ico { background: #dcfce7; color: #15803d; }
.foc-cyber-home .ip-snap-text { font-size: 14px; color: #1e2d3d; line-height: 1.5; font-weight: 500; }

.foc-cyber-home .ip-sec-head {
  margin: 14px 1.25rem 0;
  border: 1px solid #dde3ea;
  border-radius: 8px;
  padding: 9px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(10, 34, 64, 0.06);
}
.foc-cyber-home .ip-sec-head.p1 { background: #f0f4f8; }
.foc-cyber-home .ip-sec-head.p2, .foc-cyber-home .ip-sec-head.p3 { background: #f5f3ff; }
.foc-cyber-home .ip-sec-head.p4 { background: #f0fdf4; }
.foc-cyber-home .ip-sec-head-ico {
  width: 18px; height: 18px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px;
}
.foc-cyber-home .ip-sec-head.p1 .ip-sec-head-ico { background: #0a2240; }
.foc-cyber-home .ip-sec-head.p2 .ip-sec-head-ico, .foc-cyber-home .ip-sec-head.p3 .ip-sec-head-ico { background: #4c1d95; }
.foc-cyber-home .ip-sec-head.p4 .ip-sec-head-ico { background: #14532d; }
.foc-cyber-home .ip-sec-head-label {
  font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
}
.foc-cyber-home .ip-sec-head.p1 .ip-sec-head-label { color: #0a2240; }
.foc-cyber-home .ip-sec-head.p2 .ip-sec-head-label, .foc-cyber-home .ip-sec-head.p3 .ip-sec-head-label { color: #4c1d95; }
.foc-cyber-home .ip-sec-head.p4 .ip-sec-head-label { color: #14532d; }

.foc-cyber-home .ip-projects { display: flex; flex-direction: column; gap: 16px; padding: 1.25rem 1.5rem 1.5rem; }
.foc-cyber-home .ip-proj-card {
  border: 1px solid #dde3ea; border-radius: 12px; overflow: hidden;
  background: #fff; display: flex; flex-direction: row; align-items: stretch;
  min-height: 148px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.foc-cyber-home .ip-proj-card:hover {
  border-color: #b5c9e0;
  box-shadow: 0 6px 24px rgba(10, 34, 64, 0.1);
}
.foc-cyber-home .ip-proj-card--reverse { flex-direction: row-reverse; }
.foc-cyber-home .ip-photo {
  width: 38%; min-width: 200px; max-width: 280px; background: #f0f4f8;
  position: relative; overflow: hidden; flex-shrink: 0;
}
.foc-cyber-home .ip-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.foc-cyber-home .ip-photo-ph {
  width: 100%; height: 100%; min-height: 148px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 12px;
}
.foc-cyber-home .ip-photo-ph svg { color: #b5d4f4; }
.foc-cyber-home .ip-photo-ph span { font-size: 11px; color: #6b7c8f; text-align: center; line-height: 1.4; }
.foc-cyber-home .ip-proj-num {
  position: absolute; top: 10px; left: 10px; width: 26px; height: 26px; border-radius: 50%;
  color: #fff; font-size: 10px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.foc-cyber-home .ip-proj-card--reverse .ip-proj-num { left: auto; right: 10px; }
.foc-cyber-home .ip-hdr.p1 ~ .ip-three-col ~ .ip-sec-head ~ .ip-projects .ip-proj-num,
.foc-cyber-home .ip-shell .ip-proj-num.p1 { background: #0a2240; }
.foc-cyber-home .ip-proj-num.p1 { background: #0a2240; }
.foc-cyber-home .ip-proj-num.p2, .foc-cyber-home .ip-proj-num.p3 { background: #4c1d95; }
.foc-cyber-home .ip-proj-num.p4 { background: #14532d; }
.foc-cyber-home .ip-card-info {
  flex: 1; padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; min-width: 0;
  justify-content: center;
}
.foc-cyber-home .ip-proj-card--reverse .ip-card-info { padding-left: 20px; padding-right: 18px; }
.foc-cyber-home .ip-proj-top { display: flex; align-items: flex-start; gap: 10px; }
.foc-cyber-home .ip-proj-logo {
  width: 40px; height: 40px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  padding: 0; overflow: hidden; background: transparent;
}
.foc-cyber-home .ip-proj-logo--wide { width: 52px; height: 40px; }
.foc-cyber-home .ip-proj-logo svg { width: 100%; height: 100%; display: block; }
.foc-cyber-home .ip-proj-name { font-size: 14px; font-weight: 700; color: #0a2240; line-height: 1.35; margin: 0; }
.foc-cyber-home .ip-proj-desc { font-size: 12.5px; color: #3d4f63; line-height: 1.6; margin: 0; }
.foc-cyber-home .ip-chips {
  display: flex; flex-wrap: wrap; gap: 7px;
  margin-top: 8px; padding-top: 10px;
  border-top: 1px dashed #dde3ea;
}
.foc-cyber-home .ip-chip {
  font-size: 10px; padding: 5px 12px; border-radius: 50px;
  display: inline-flex; align-items: center; gap: 5px; line-height: 1.3;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(10, 34, 64, 0.08);
  transition: transform 0.15s, box-shadow 0.15s;
}
.foc-cyber-home .ip-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(10, 34, 64, 0.12);
}
.foc-cyber-home .ip-chip.tg.p1 { background: #e6f1fb; color: #0c447c; border: 1px solid #b5d4f4; }
.foc-cyber-home .ip-chip.cv.p1 { background: #e1f5ee; color: #085041; border: 1px solid #9fe1cb; }
.foc-cyber-home .ip-chip.if.p1 { background: #fff3e0; color: #b45309; border: 1px solid #ffcc80; }
.foc-cyber-home .ip-chip.tg.p2, .foc-cyber-home .ip-chip.tg.p3 { background: #ede9fe; color: #4c1d95; border: 1px solid #c4b5fd; }
.foc-cyber-home .ip-chip.cv.p2, .foc-cyber-home .ip-chip.cv.p3 { background: #e0f2fe; color: #0c4a6e; border: 1px solid #7dd3fc; }
.foc-cyber-home .ip-chip.if.p2, .foc-cyber-home .ip-chip.if.p3 { background: #fef9c3; color: #713f12; border: 1px solid #fde047; }
.foc-cyber-home .ip-chip.tg.p4 { background: #dcfce7; color: #14532d; border: 1px solid #86efac; }
.foc-cyber-home .ip-chip.cv.p4 { background: #e0f2fe; color: #0c4a6e; border: 1px solid #7dd3fc; }
.foc-cyber-home .ip-chip.if.p4 { background: #fef9c3; color: #713f12; border: 1px solid #fde047; }

.foc-cyber-home .ip-impact-row {
  padding: 0.8rem 1.25rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.foc-cyber-home .ip-impact-row.p1 { background: #0a2240; }
.foc-cyber-home .ip-impact-row.p2, .foc-cyber-home .ip-impact-row.p3 { background: #1e1b4b; }
.foc-cyber-home .ip-impact-row.p4 { background: #052e16; }
.foc-cyber-home .ip-imp-val { font-size: 12px; font-weight: 800; text-align: center; }
.foc-cyber-home .ip-impact-row.p1 .ip-imp-val { color: #4fc3f7; }
.foc-cyber-home .ip-impact-row.p2 .ip-imp-val, .foc-cyber-home .ip-impact-row.p3 .ip-imp-val { color: #a78bfa; }
.foc-cyber-home .ip-impact-row.p4 .ip-imp-val { color: #86efac; }
.foc-cyber-home .ip-imp-lbl { font-size: 8.5px; margin-top: 2px; line-height: 1.3; text-align: center; }
.foc-cyber-home .ip-impact-row.p1 .ip-imp-lbl { color: #e3f2fd; }
.foc-cyber-home .ip-impact-row.p2 .ip-imp-lbl, .foc-cyber-home .ip-impact-row.p3 .ip-imp-lbl { color: #ede9fe; }
.foc-cyber-home .ip-impact-row.p4 .ip-imp-lbl { color: #dcfce7; }

.foc-cyber-home .ip-footer {
  padding: 7px 1.25rem; display: flex; align-items: center;
  justify-content: space-between; gap: 10px; flex-wrap: wrap;
  border-top: 2px solid;
}
.foc-cyber-home .ip-footer.p1 { background: #f0f4f8; border-top-color: #1a6abf; }
.foc-cyber-home .ip-footer.p2, .foc-cyber-home .ip-footer.p3 { background: #f5f3ff; border-top-color: #7c3aed; }
.foc-cyber-home .ip-footer.p3 { border-top-color: #6d28d9; }
.foc-cyber-home .ip-footer.p4 { background: #f0fdf4; border-top-color: #16a34a; }
.foc-cyber-home .ip-footer-tagline { font-size: 11px; font-weight: 700; color: #0a2240; }
.foc-cyber-home .ip-footer-tags { display: flex; gap: 5px; flex-wrap: wrap; }
.foc-cyber-home .ip-ftag { font-size: 9px; padding: 2px 7px; border-radius: 50px; }
.foc-cyber-home .ip-ftag.p1 { background: #e6f1fb; color: #0c447c; border: 1px solid #b5d4f4; }
.foc-cyber-home .ip-ftag.p2, .foc-cyber-home .ip-ftag.p3 { background: #ede9fe; color: #4c1d95; border: 1px solid #c4b5fd; }
.foc-cyber-home .ip-ftag.p4 { background: #dcfce7; color: #14532d; border: 1px solid #86efac; }

/* Override section theme text on dark pillar header (section.color was forcing dark --text) */
.foc-cyber-home > section.section .ip-hdr .ip-hdr-title {
  color: #ffffff !important;
}
.foc-cyber-home > section.section .ip-hdr .ip-hdr-title .ip-accent { color: #7dd3fc !important; }
.foc-cyber-home > section.section .ip-hdr .ip-hdr-title .ip-accent2 { color: #c4b5fd !important; }
.foc-cyber-home > section.section .ip-hdr .ip-hdr-title .ip-accent4 { color: #bbf7d0 !important; }
.foc-cyber-home > section.section .ip-hdr .ip-hdr-sub { color: #e3f2fd !important; }
.foc-cyber-home > section.section .ip-hdr.p2 .ip-hdr-sub,
.foc-cyber-home > section.section .ip-hdr.p3 .ip-hdr-sub { color: #ede9fe !important; }
.foc-cyber-home > section.section .ip-hdr.p4 .ip-hdr-sub { color: #dcfce7 !important; }
.foc-cyber-home > section.section .ip-hdr .ip-hdr-desc { color: #f0f7ff !important; }
.foc-cyber-home > section.section .ip-hdr.p2 .ip-hdr-desc,
.foc-cyber-home > section.section .ip-hdr.p3 .ip-hdr-desc { color: #f5f3ff !important; }
.foc-cyber-home > section.section .ip-hdr.p4 .ip-hdr-desc { color: #ecfdf5 !important; }
.foc-cyber-home > section.section .ip-hdr .ip-icon-pill span { color: #ffffff !important; }

@media(max-width:900px) {
  .foc-cyber-home .ip-three-col { grid-template-columns: 1fr; gap: 14px; }
  .foc-cyber-home .ip-col { border-right: none; border-bottom: none; }
  .foc-cyber-home .ip-hdr-top { flex-direction: column; }
  .foc-cyber-home .ip-hdr-icons { align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
  .foc-cyber-home .ip-impact-row { grid-template-columns: repeat(2, 1fr); }
}
@media(max-width:600px) {
  .foc-cyber-home .ip-tab-nav { gap: 8px; }
  .foc-cyber-home .ip-tab-btn {
    flex: 1 1 calc(50% - 4px);
    justify-content: center;
    padding: 10px 12px;
    font-size: 10px;
  }
  .foc-cyber-home .ip-proj-card,
  .foc-cyber-home .ip-proj-card--reverse { flex-direction: column; }
  .foc-cyber-home .ip-photo {
    width: 100%; min-width: 0; max-width: none; height: 160px; order: -1;
  }
  .foc-cyber-home .ip-proj-card--reverse .ip-proj-num { left: 10px; right: auto; }
  .foc-cyber-home .ip-card-info { padding: 14px 16px; }
  .foc-cyber-home .ip-tab-btn { padding: 12px 14px; font-size: 10px; }
}

@media(max-width:1024px) {
  .labs-grid { grid-template-columns: repeat(2,1fr); }
  .fftl-snap { grid-template-columns: repeat(3, 1fr); }
  .fftl-cute-values { grid-template-columns: repeat(2, 1fr); }
  .reach-grid { grid-template-columns: repeat(2,1fr); }
  .roles-grid { grid-template-columns: repeat(3,1fr); }
  .pillars { grid-template-columns: repeat(2,1fr); }
  .footer-inner { grid-template-columns: 1fr 1fr; }
  .partner-with-grid { grid-template-columns: repeat(2, 1fr); }
}
@media(max-width:768px) {
  .hero-inner, .area-panel, .why-grid, .projects-grid { grid-template-columns: 1fr; }
  .hero-tiles { gap: 18px; margin-top: 18px; }
  .hero-tile { min-height: 110px; padding: 26px 14px; }
  .labs-grid, .roles-grid { grid-template-columns: repeat(2,1fr); }
  .fftl-snap { grid-template-columns: repeat(2, 1fr); }
  .fftl-snap--cute { gap: 10px; padding: 16px 12px; }
  .fftl-snap--cute .fftl-snap-cell { flex: 1 1 calc(50% - 10px); max-width: none; min-width: 0; padding: 12px 10px; }
  .fftl-snap--cute .fftl-snap-v { font-size: 11px; }
  .fftl-cute-values { grid-template-columns: 1fr; }
  .fftl-cute-stack { max-width: none; }
  .cta-block { padding: 40px 24px; }
  .area-panel { padding: 28px 20px; }
  .csr-poster-grid { grid-template-columns: 1fr; }
  .csr-poster-hub { display: none; }
  .csr-poster-cta-strip { margin-left: 14px; margin-right: 14px; }
  .events-grid { grid-template-columns: 1fr; }
  .course-carousel-track { padding: 0 44px; }
  .course-carousel-btn { width: 38px; height: 38px; font-size: 18px; }
  .footer-inner { grid-template-columns: 1fr; }
  .pillars { grid-template-columns: 1fr; }
  .hero-topbar { flex-direction: column; align-items: flex-start; gap: 10px; }
  .partner-with-grid { grid-template-columns: 1fr; }
}
@media(max-width:480px) {
  .labs-grid, .roles-grid, .why-grid { grid-template-columns: 1fr; }
  .pillars { grid-template-columns: 1fr; }
}

/* â”€â”€ Geographic reach map (Leaflet) â”€â”€ */
@keyframes focMapPinPulse {
  0%, 100% { transform: scale(1); }
  45% { transform: scale(1.12); }
}
@keyframes focMapRingExpand {
  0% { transform: scale(0.55); opacity: 0.75; }
  100% { transform: scale(2.1); opacity: 0; }
}
.foc-india-map-card {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface2);
  box-shadow: 0 18px 56px color-mix(in srgb, var(--text) 10%, transparent);
}
.foc-india-map-inner {
  width: 100%;
  height: min(52vh, 540px);
  min-height: 300px;
  z-index: 0;
}
.foc-leaflet-pin-wrap {
  background: transparent !important;
  border: none !important;
}
.foc-leaflet-pin {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: focMapPinPulse 2.5s ease-in-out infinite;
}
.foc-leaflet-pin-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--cyan), var(--red));
  border: 2px solid #fff;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.35);
  position: relative;
  z-index: 2;
}
.foc-leaflet-pin-ring {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--cyan) 50%, transparent);
  animation: focMapRingExpand 2.5s ease-out infinite;
}
.foc-map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 22px;
}
.foc-map-legend-chip {
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--cyan) 8%, var(--surface));
  color: var(--muted);
}
.foc-map-attrib {
  margin: 14px 0 0;
  text-align: center;
  font-family: 'Exo 2', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--muted);
  line-height: 1.5;
}
.foc-map-attrib a {
  color: color-mix(in srgb, var(--cyan) 75%, var(--muted));
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--cyan) 35%, transparent);
}
.foc-map-attrib a:hover {
  color: var(--cyan);
  border-bottom-color: var(--cyan);
}
.leaflet-container.foc-india-map-inner {
  font-family: 'Exo 2', sans-serif;
}
.leaflet-container.foc-india-map-inner .leaflet-control-container {
  display: none;
}
.leaflet-popup-content-wrapper {
  border-radius: 12px !important;
  border: 1px solid var(--border);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--text) 12%, transparent) !important;
}
@media (prefers-reduced-motion: reduce) {
  .foc-leaflet-pin,
  .foc-leaflet-pin-ring {
    animation: none !important;
  }
}
@media (max-width: 768px) {
  .foc-india-map-inner {
    height: min(48vh, 420px);
    min-height: 260px;
  }
}
`;

const PILLARS = [
  { num: "01", icon: "ðŸŽ“", title: "Future-Ready Skills", desc: "Advanced AI, ML, Cloud, Drone Pilot, Robotics â€” industry-aligned programs for next-gen careers." },
  { num: "02", icon: "ðŸ”¬", title: "Future Ready Schools/Colleges", desc: "State-of-the-art hands-on labs installed in schools & colleges across India." },
  { num: "03", icon: "ðŸ’¼", title: "Future Ready MSME", desc: "Bridging skills and industry demand â€” global tech careers in emerging fields." },
  { num: "04", icon: "ðŸŒ±", title: "Future Ready Environment", desc: "Government & CSR initiatives for skill development, education, and employment." },
];

const CORE_AREAS = [
  {
    key: "skills",
    label: "Future Ready Skills",
    badge: "Skill Development",
    title: "Building Tomorrow's Workforce",
    emoji: "ðŸš€",
    desc: "Industry-aligned skilling initiatives designed to equip youth, students, and professionals with future-ready capabilities across emerging technologies and high-growth sectors. We collaborate with leading corporates, government bodies, sector skill councils, universities, and academic institutions to deliver scalable, employment-oriented learning programs with measurable socio-economic impact.",
    beneficiaries: ["Final-year college students", "Unemployed youth", "11th and 12th class students", "Rural youth"],
    impact: [
      "Multi-state project implementation",
      "Thousands of beneficiaries trained and impacted",
      "Strong ecosystem of CSR, government, and industry partnerships",
      "Focus on employability, digital inclusion, and workforce transformation",
    ],
    items: [
      {
        icon: "ðŸ¤–",
        title: "Samsung Innovation Campus (CSR)",
        desc: "Future technology skilling initiative focused on AI, Big Data, and Coding for university students across North India in collaboration with industry and academic partners â€” Target: Final-year college students â€” Coverage: Punjab & Haryana â€” Impact: Future-ready digital workforce development.",
        img: "/Assets/images/futureready/samsung.jpeg",
      },
      {
        icon: "âš¡",
        title: "ESDM Skill Development Program",
        desc: "Large-scale employability initiative in electronics manufacturing, telecom infrastructure, and digital connectivity sectors under government-led skilling programs â€” Target: Unemployed youth â€” Coverage: Multi-state implementation â€” Impact: Industry-led training and placement opportunities.",
      },
      {
        icon: "ðŸŒ",
        title: "IoT Training Program for School Students",
        desc: "IoT training designed for underprivileged Govt. school students of Class 11th and 12th to prepare them for high-growth emerging sectors-based careers through practical and project-oriented training â€” Target: 11th and 12th class students â€” Coverage: Delhi-NCR â€” Impact: Career building in emerging sectors.",
        img: "/Assets/images/futureready/iot.jpeg",
      },
      {
        icon: "ðŸ“±",
        title: "Rural Youth Livelihood Program",
        desc: "Vocational and technical skilling initiative enabling rural youth to access sustainable livelihood opportunities in mobile repair and allied sectors â€” Target: Rural youth â€” Coverage: Uttarakhand and adjoining regions â€” Impact: Employment and livelihood generation.",
      },
    ],
  },
  {
    key: "schools",
    label: "Future Ready Schools & Colleges",
    badge: "Education Technology",
    title: "Transforming Learning for the Future",
    emoji: "ðŸ«",
    desc: "Future-focused learning ecosystems designed to equip schools, colleges, and academic institutions with emerging technology exposure, innovation-driven education models, and hands-on experiential learning infrastructure. We partner with educational institutions, CSR organizations, industry leaders, and government stakeholders to create scalable future technology learning environments aligned with next-generation workforce requirements.",
    beneficiaries: [
      "Government school students (Class 11â€“12)",
      "Schools & colleges in Tier 2 and Tier 3 cities",
      "Engineering, Polytechnic, BCA & MCA students",
      "Teachers & institutional trainers",
    ],
    impact: [
      "Technology labs across schools and institutions",
      "Thousands of students exposed to future technologies",
      "Strong CSR, academic, and industry collaborations",
      "Affordable and scalable implementation models",
      "Increased innovation, STEM participation, and practical learning adoption",
    ],
    items: [
      {
        icon: "ðŸ“¡",
        title: "IoT Lab Setup under Ericsson CSR",
        desc: "Technology-enabled innovation labs established in government schools to provide hands-on exposure to IoT, AI, Robotics, and emerging technologies for school students â€” Target: Government school students (Class 11â€“12) â€” Coverage: Delhi NCR â€” Impact: Digital inclusion and future technology exposure.",
        img: "/Assets/images/futureready/iot.jpeg",
      },
      {
        icon: "ðŸ†",
        title: "Center of Excellence (CoE) in Emerging Technologies",
        desc: "Integrated innovation and advanced learning ecosystem for students, faculty, startups, MSMEs, and institutions â€” developed with premier partners including IIT Ropar for research support, innovation mentorship, and ecosystem development â€” Impact: Regional hub bridging academia, industry, startups, and government.",
      },
      {
        icon: "ðŸ”¬",
        title: "Future Technology Labs as a Service (FTLaaS)",
        desc: "Affordable subscription-based future technology lab ecosystem enabling schools and colleges to access practical learning infrastructure without heavy capital investment â€” Target: Schools & colleges in Tier 2 and Tier 3 cities â€” Coverage: Punjab, Haryana & Chandigarh region â€” Impact: Democratizing access to future technology education.",
      },
      {
        icon: "ðŸŽ“",
        title: "Industry-Aligned College Innovation Programs",
        desc: "Skill-integrated practical learning initiatives designed for higher education institutions to bridge the gap between academics and industry requirements â€” Target: Engineering, Polytechnic, BCA & MCA students â€” Coverage: Multi-institution model â€” Impact: Employability, innovation, and industry readiness.",
      },
      {
        icon: "ðŸ‘©â€ðŸ«",
        title: "Faculty Development & Innovation Enablement",
        desc: "Capacity-building initiatives empowering educators with emerging technology knowledge, lab operations capability, and experiential teaching methodologies â€” Target: Teachers & institutional trainers â€” Coverage: Schools, colleges & technical institutes â€” Impact: Sustainable future-ready academic ecosystems.",
      },
    ],
  },
  {
    key: "msme",
    label: "Future Ready MSME",
    badge: "Enterprise Upskilling",
    title: "Empowering MSMEs for the Digital & Smart Manufacturing Era",
    emoji: "ðŸ­",
    desc: "Future Ready MSME initiatives are designed to support Micro, Small & Medium Enterprises (MSMEs) in adopting emerging technologies, improving workforce capabilities, and accelerating digital transformation for sustainable business growth. We collaborate with industry bodies, technology partners, government agencies, incubation ecosystems, and academic institutions to enable MSMEs with future-focused innovation, digital infrastructure, operational efficiency, and workforce readiness aligned with Industry 4.0 and smart manufacturing ecosystems.",
    beneficiaries: [
      "Manufacturing & service MSMEs",
      "Industrial MSMEs & factory workforce",
      "Technicians, operators & industrial workforce",
      "Entrepreneurs & startups",
    ],
    impact: [
      "Multi-sector MSME ecosystem engagement",
      "Lean manufacturing & Zero Defect implementation support",
      "Industry-focused digital transformation initiatives",
      "Workforce productivity & capability enhancement",
      "Enabling MSMEs for Industry 4.0 and future manufacturing ecosystems",
    ],
    items: [
      {
        icon: "ðŸ’»",
        title: "MSME Digital Transformation Program",
        desc: "Technology enablement initiative supporting MSMEs in adopting digital tools, automation systems, cloud platforms, and operational intelligence for business efficiency and competitiveness â€” Target: Manufacturing & service MSMEs â€” Coverage: Multi-state implementation â€” Impact: Digital adoption & operational transformation.",
      },
      {
        icon: "ðŸ­",
        title: "Smart Manufacturing & Industry 4.0 Initiative",
        desc: "Advanced skilling and implementation support focused on smart manufacturing systems, IoT-enabled production environments, robotics integration, and Industry 4.0 readiness â€” Target: Industrial MSMEs & factory workforce â€” Coverage: Industrial clusters & manufacturing hubs â€” Impact: Productivity enhancement & smart factory readiness.",
      },
      {
        icon: "âœ…",
        title: "Lean Management & Zero Defect Manufacturing Program",
        desc: "Industry improvement initiative aligned with Ministry of MSME programs focused on Lean Manufacturing Competitiveness, Zero Defect practices, process optimization, waste reduction, quality enhancement, and operational excellence â€” Target: Manufacturing MSMEs & industrial units â€” Coverage: MSME industrial clusters â€” Impact: Quality improvement, productivity enhancement & global manufacturing competitiveness.",
      },
      {
        icon: "ðŸ”§",
        title: "MSME Workforce Upskilling Program",
        desc: "Employment-oriented workforce development initiative designed to equip MSME employees and technicians with future-ready technical and digital skills across emerging sectors â€” Target: Technicians, operators & industrial workforce â€” Coverage: Regional & cluster-based deployment â€” Impact: Workforce readiness & employability enhancement.",
      },
      {
        icon: "ðŸ’¡",
        title: "Entrepreneurship & Innovation Enablement Program",
        desc: "Innovation-led ecosystem initiative supporting startups and aspiring entrepreneurs through mentorship, incubation support, digital business enablement, and market readiness programs â€” Target: Entrepreneurs & startups â€” Coverage: Innovation ecosystems & academic clusters â€” Impact: Innovation, entrepreneurship & business growth.",
      },
    ],
  },
  {
    key: "env",
    label: "Future Ready Environment",
    badge: "Sustainability & Impact",
    title: "Building Sustainable Communities for a Greener Tomorrow",
    emoji: "ðŸŒ¿",
    desc: "Future Ready Environment initiatives promote environmental sustainability, climate resilience, green innovation, and community-driven ecological transformation through technology-enabled and impact-oriented interventions. We collaborate with corporates, government agencies, educational institutions, environmental organizations, local communities, and technology partners to create scalable sustainability ecosystems aligned with global sustainable development goals.",
    beneficiaries: [
      "Schools, colleges & ITI students",
      "School students, youth & communities",
      "SHGs, tribal households & rural communities",
      "Youth, entrepreneurs & rural communities",
    ],
    impact: [
      "Community-driven environmental sustainability initiatives",
      "Environmental awareness among thousands of students & youth",
      "Promotion of organic farming and sustainable rural livelihoods",
      "Awareness and adoption of green technologies & sustainable practices",
      "VR-enabled experiential learning for social impact education",
    ],
    items: [
      {
        icon: "â™»ï¸",
        title: "Panasonic CSR â€“ Harit Umang Program",
        desc: "Large-scale environmental awareness initiative focused on promoting eco-conscious behavior and sustainability awareness among students and youth through practical engagement on E-Waste, Plastic Waste, Renewable Energy, and Biodiversity themes â€” Target: Schools, colleges & ITI students â€” Coverage: North India â€” Impact: Environmental awareness & youth-led green action.",
      },
      {
        icon: "ðŸ¥½",
        title: "VR-Based Road Safety Education Program",
        desc: "Immersive road safety awareness initiative using Virtual Reality (VR) technology to educate students and communities about safe road behavior, traffic awareness, accident prevention, and responsible mobility practices â€” Target: School students, youth & communities â€” Coverage: Urban & semi-urban regions â€” Impact: Behavioral change & road safety awareness.",
      },
      {
        icon: "ðŸŒ¾",
        title: "Organic Farming & Sustainable Livelihood Initiative",
        desc: "Community-driven agritech and organic farming initiative empowering Scheduled Tribe communities and Self Help Groups (SHGs) through sustainable agriculture practices, household training, environmental awareness, and livelihood enhancement â€” Target: SHGs, tribal households & rural communities â€” Coverage: Uttarakhand â€” Impact: Organic farming, sustainable livelihoods & rural environmental development.",
        img: "/Assets/images/futureready/aadigram.jpeg",
      },
      {
        icon: "â˜€ï¸",
        title: "Renewable Energy & Solar Awareness Program",
        desc: "Green energy initiative promoting renewable energy adoption, solar ecosystem awareness, and sustainable energy practices through training, demonstrations, and community engagement programs â€” Target: Students, youth & rural communities â€” Coverage: Rural & regional implementation â€” Impact: Clean energy awareness & sustainable energy adoption.",
      },
      {
        icon: "ðŸŒ±",
        title: "Sustainable Green Entrepreneurship Program",
        desc: "Innovation-driven initiative supporting green entrepreneurship, eco-friendly livelihood opportunities, sustainable rural enterprises, and environmentally responsible business models â€” Target: Youth, entrepreneurs & rural communities â€” Coverage: Rural innovation ecosystems â€” Impact: Sustainable livelihoods & green economic growth.",
      },
    ],
  },
];

const PILLAR_TABS = [
  { key: "skills", num: 1, pid: "p1", label: "Future Ready Skills" },
  { key: "schools", num: 2, pid: "p2", label: "Future Ready Schools and Colleges" },
  { key: "msme", num: 3, pid: "p3", label: "Future Ready MSME" },
  { key: "env", num: 4, pid: "p4", label: "Future Ready Environment" },
];

const PILLAR_UI = {
  skills: {
    pid: "p1",
    brandBadge: "ESDM Skill Development Program",
    pillarTag: "Pillar 1",
    title: "Future Ready",
    titleAccent: "Skills",
    accentClass: "accent",
    sub: "Building Tomorrow's Workforce",
    desc: "Industry-aligned skilling initiatives designed to equip youth, students, and professionals with future-ready capabilities across emerging technologies and high-growth sectors. We collaborate with leading corporates, government bodies, sector skill councils, universities, and academic institutions to deliver scalable, employment-oriented learning programs.",
    headerIcons: [
      [{ icon: "cpu", label: "Electronics & Mfg" }, { icon: "sparkles", label: "Emerging Tech" }, { icon: "brain", label: "AI & Data" }],
      [{ icon: "award", label: "Employability" }, { icon: "target", label: "Impact" }],
    ],
    focusAreas: [
      { icon: "brain", text: "Artificial Intelligence (AI)" },
      { icon: "chart", text: "Data Analytics & Big Data" },
      { icon: "code", text: "Coding & Programming" },
      { icon: "wifi", text: "IoT & Smart Technologies" },
      { icon: "robot", text: "Robotics" },
      { icon: "plane", text: "Drones" },
      { icon: "glasses", text: "Virtual Reality" },
      { icon: "radio", text: "Telecom & Digital Infrastructure" },
      { icon: "cpu", text: "Electronics Manufacturing" },
      { icon: "settings", text: "Industry 4.0" },
      { icon: "users", text: "Employability & Workforce Readiness" },
    ],
    approach: [
      "Industry-aligned curriculum",
      "Hands-on practical learning",
      "Placement-linked training models",
      "CSR & government implementation expertise",
      "Scalable delivery across urban & rural regions",
      "Outcome-driven impact measurement",
    ],
    impactSnapshot: [
      { icon: "globe", text: "Multi-state project implementation" },
      { icon: "users", text: "Thousands of beneficiaries trained & impacted" },
      { icon: "handshake", text: "Strong CSR, government & industry partnerships" },
      { icon: "smartphone", text: "Focus on employability & digital inclusion" },
    ],
    projectsLabel: "Project Highlights",
    projects: [
      {
        num: 1,
        name: "Samsung Innovation Campus (CSR)",
        desc: "Future technology skilling focused on AI, Big Data, and Coding for university students across North India in collaboration with industry and academic partners.",
        img: "/Assets/public_assets/images/homepage/sic.jpg",
        logoKey: "samsung",
        chips: { target: "Final-year college students", coverage: "Punjab & Haryana", impact: "Future-ready digital workforce" },
      },
      {
        num: 2,
        name: "ESDM Skill Development Program",
        desc: "Large-scale employability initiative in electronics manufacturing, telecom infrastructure, and digital connectivity sectors under government-led skilling programs.",
        img: "/Assets/public_assets/images/homepage/esdm.jpg",
        logoKey: "esdm",
        chips: { target: "Unemployed youth", coverage: "Multi-state", impact: "Industry-led training & placement" },
      },
      {
        num: 3,
        name: "IoT Training Program for School Students",
        desc: "IoT training for underprivileged Govt. School Students of Class 11â€“12 for high-growth emerging sector careers through practical, project-oriented training.",
        img: "/Assets/images/futureready/iot.jpeg",
        logoKey: "iot",
        chips: { target: "Class 11th & 12th students", coverage: "Delhi-NCR", impact: "Career building in emerging sectors" },
      },
      {
        num: 4,
        name: "Rural Youth Livelihood Program",
        desc: "Vocational and technical skilling enabling rural youth to access sustainable livelihood opportunities in mobile repair and allied sectors.",
        logoKey: "rural-youth",
        chips: { target: "Rural youth", coverage: "Uttarakhand & adjoining regions", impact: "Employment & livelihood generation" },
      },
    ],
    impactRow: [
      { val: "Multi-state", lbl: "Project Implementation" },
      { val: "1000s+", lbl: "Beneficiaries Trained" },
      { val: "Strong", lbl: "CSR & Govt Ecosystem" },
      { val: "100%", lbl: "Outcome-driven Focus" },
    ],
    footerTagline: "Building Tomorrow's Workforce â€” Together.",
    footerTags: ["Electronics & Manufacturing", "Emerging Tech & Digital", "Outcome-driven Impact"],
  },
  schools: {
    pid: "p2",
    brandBadge: "Future Ready Schools & Colleges",
    pillarTag: "Pillar 2",
    title: "Future Ready",
    titleAccent: "Schools & Colleges",
    accentClass: "accent2",
    sub: "Transforming Learning for the Future",
    desc: "Future-focused learning ecosystems designed to equip schools, colleges, and academic institutions with emerging technology exposure, innovation-driven education models, and hands-on experiential learning infrastructure.",
    headerIcons: [
      [{ icon: "brain", label: "AI" }, { icon: "robot", label: "Robotics" }, { icon: "wifi", label: "IoT" }],
      [{ icon: "plane", label: "Drones" }, { icon: "flask", label: "STEM Labs" }, { icon: "glasses", label: "VR" }],
    ],
    focusAreas: [
      { icon: "brain", text: "Artificial Intelligence (AI)" },
      { icon: "robot", text: "Robotics & Automation" },
      { icon: "wifi", text: "Internet of Things (IoT)" },
      { icon: "plane", text: "Drone Technology" },
      { icon: "flask", text: "STEM Innovation Labs" },
      { icon: "sprout", text: "Agri-Tech" },
      { icon: "school", text: "Industry-Oriented Practical Learning" },
      { icon: "users", text: "Teacher Enablement & Capacity Building" },
      { icon: "lightbulb", text: "Innovation & Entrepreneurship Exposure" },
    ],
    approach: [
      "Experiential and project-based learning",
      "Future technology lab setup & management",
      "Curriculum-aligned practical modules",
      "Faculty training and ecosystem support",
      "Subscription-based scalable lab models",
      "Internship & industry immersion opportunities",
      "Industry-aligned certification tracks",
      "Student innovation & hackathons",
      "Startup incubation & mentoring",
    ],
    impactSnapshot: [
      { icon: "users", text: "5,000+ Students Impacted" },
      { icon: "flask", text: "25+ Future Technology Labs Deployed" },
      { icon: "building", text: "100+ Schools & Colleges Partnered" },
      { icon: "target", text: "5+ States Covered" },
      { icon: "handshake", text: "Strong CSR, Academic & Industry Collaborations" },
    ],
    projectsLabel: "Our Key Initiatives",
    projects: [
      {
        num: 1,
        name: "IoT Lab Setup under Ericsson CSR",
        desc: "Technology-enabled innovation labs in government schools for hands-on exposure to IoT, AI, Robotics, and emerging technologies for school students.",
        img: "/Assets/public_assets/images/homepage/iot_lab.jpeg",
        logoKey: "ericsson",
        chips: { target: "Govt. school students", coverage: "Delhi NCR", impact: "Future tech exposure" },
      },
      {
        num: 2,
        name: "Center of Excellence (CoE) in Emerging Technologies",
        desc: "Advanced learning ecosystem for students, faculty & startups with industry-oriented labs, applied research, and incubation support. Developed with IIT Ropar.",
        logoKey: "coe",
        chips: { target: "Institutions & Faculty", coverage: "Pan India", impact: "Innovation & research" },
      },
      {
        num: 3,
        name: "Future Technology Labs as a Service (FTLaaS)",
        desc: "Affordable subscription-based future technology labs enabling schools and colleges in Tier 2 & 3 cities to access practical learning infrastructure.",
        img: "/Assets/public_assets/images/homepage/fftl_lab.jpg",
        logoKey: "ftlaas",
        chips: { target: "Schools & Colleges", coverage: "Tier 2 & Tier 3 Cities", impact: "Access to future tech" },
      },
      {
        num: 4,
        name: "Industry-Aligned College Innovation Programs",
        desc: "Skill-integrated practical learning for higher education institutions bridging the gap between academics and industry requirements.",
        logoKey: "college-innovation",
        chips: { target: "Colleges & Students", coverage: "Across India", impact: "Industry readiness" },
      },
      {
        num: 5,
        name: "Faculty Development & Innovation Enablement",
        desc: "Capacity-building initiatives empowering educators with emerging technology knowledge, lab operations capability, and experiential teaching methodologies.",
        logoKey: "faculty-dev",
        chips: { target: "Faculty & Educators", coverage: "Across India", impact: "Future-ready faculty" },
      },
    ],
    impactRow: [
      { val: "5,000+", lbl: "Students Impacted" },
      { val: "25+", lbl: "Tech Labs Deployed" },
      { val: "100+", lbl: "Schools & Colleges" },
      { val: "5+", lbl: "States Covered" },
    ],
    footerTagline: "Transforming Learning for the Future.",
    footerTags: ["AI & Robotics", "IoT & STEM Labs", "Industry-Aligned Education"],
  },
  msme: {
    pid: "p3",
    brandBadge: "Future Ready MSME",
    pillarTag: "Pillar 3",
    title: "Future Ready",
    titleAccent: "MSME",
    accentClass: "accent2",
    sub: "Empowering MSMEs for the Digital & Smart Manufacturing Era",
    desc: "Future Ready MSME initiatives are designed to support Micro, Small & Medium Enterprises in adopting emerging technologies, improving workforce capabilities, and accelerating digital transformation for sustainable business growth.",
    headerIcons: [
      [{ icon: "settings", label: "Industry 4.0" }, { icon: "robot", label: "Robotics" }, { icon: "cloud", label: "Cloud" }],
      [{ icon: "brain", label: "AI Ops" }, { icon: "trending", label: "Growth" }],
    ],
    focusAreas: [
      { icon: "settings", text: "Industry 4.0 & Smart Manufacturing" },
      { icon: "laptop", text: "Digital Transformation for MSMEs" },
      { icon: "brain", text: "AI for Business Operations" },
      { icon: "wifi", text: "IoT & Industrial Automation" },
      { icon: "robot", text: "Robotics & Process Optimization" },
      { icon: "chart", text: "Data Analytics & Business Intelligence" },
      { icon: "cloud", text: "Cloud & Digital Infrastructure" },
      { icon: "shield", text: "Cybersecurity & Digital Readiness" },
      { icon: "car", text: "EV & Emerging Manufacturing Ecosystems" },
      { icon: "radio", text: "Telecom & Electronics Ecosystem" },
      { icon: "users", text: "Workforce Upskilling & Productivity" },
      { icon: "lightbulb", text: "Innovation, Incubation & Entrepreneurship" },
    ],
    approach: [
      "Industry-aligned MSME transformation models",
      "Technology-driven operational improvement",
      "Practical hands-on workshops & implementation",
      "Lean manufacturing & quality excellence",
      "Capacity building for MSME workforce & leadership",
      "Digital adoption & smart infrastructure",
      "Innovation-driven business acceleration",
      "Outcome-oriented productivity & growth measurement",
    ],
    impactSnapshot: [
      { icon: "factory", text: "Multi-sector MSME ecosystem engagement" },
      { icon: "award", text: "Lean manufacturing & Zero Defect implementation" },
      { icon: "laptop", text: "Industry-focused digital transformation initiatives" },
      { icon: "users", text: "Workforce productivity & capability enhancement" },
      { icon: "trending", text: "Enabling MSMEs for Industry 4.0 ecosystems" },
    ],
    projectsLabel: "Flagship Initiatives",
    projects: [
      {
        num: "01",
        name: "MSME Digital Transformation Program",
        desc: "Technology enablement initiative supporting MSMEs in adopting digital tools, automation systems, cloud platforms, and operational intelligence for business efficiency and competitiveness.",
        img: "/Assets/public_assets/images/homepage/msme.png",
        logoKey: "msme-digital",
        chips: { target: "Manufacturing & service MSMEs", coverage: "Multi-state", impact: "Digital adoption & transformation" },
      },
      {
        num: "02",
        name: "Smart Manufacturing & Industry 4.0 Initiative",
        desc: "Advanced skilling and implementation support focused on smart manufacturing systems, IoT-enabled production environments, robotics integration, and Industry 4.0 readiness.",
        logoKey: "industry-40",
        chips: { target: "Industrial MSMEs & factory workforce", coverage: "Industrial clusters", impact: "Smart factory readiness" },
      },
      {
        num: "03",
        name: "Lean Management & Zero Defect Manufacturing Program",
        desc: "Industry improvement initiative aligned with Ministry of MSME programs focused on Lean Manufacturing Competitiveness, Zero Defect practices, process optimization, and operational excellence.",
        logoKey: "lean-zero",
        chips: { target: "Manufacturing MSMEs & industrial units", coverage: "MSME industrial clusters", impact: "Quality & productivity enhancement" },
      },
      {
        num: "04",
        name: "MSME Workforce Upskilling Program",
        desc: "Employment-oriented workforce development initiative designed to equip MSME employees and technicians with future-ready technical and digital skills across emerging sectors.",
        logoKey: "workforce-upskill",
        chips: { target: "Technicians & operators", coverage: "Regional & cluster-based", impact: "Workforce readiness & employability" },
      },
      {
        num: "05",
        name: "Entrepreneurship & Innovation Enablement Program",
        desc: "Innovation-led ecosystem initiative supporting startups and aspiring entrepreneurs through mentorship, incubation support, digital business enablement, and market readiness programs.",
        logoKey: "entrepreneurship",
        chips: { target: "Entrepreneurs & Startups", coverage: "Innovation ecosystems", impact: "Innovation & business growth" },
      },
    ],
    impactRow: [
      { val: "Multi-sector", lbl: "MSME Engagement" },
      { val: "Zero Defect", lbl: "Implementation Support" },
      { val: "Industry 4.0", lbl: "Readiness Focus" },
      { val: "Strong", lbl: "Industry & Tech Partnerships" },
    ],
    footerTagline: "Innovate. Transform. Grow.",
    footerTags: ["Industry 4.0", "Digital Transformation", "Lean Manufacturing"],
  },
  env: {
    pid: "p4",
    brandBadge: "Future Ready Environment",
    pillarTag: "Pillar 4",
    title: "Future Ready",
    titleAccent: "Environment",
    accentClass: "accent4",
    sub: "Building Sustainable Communities for a Greener Tomorrow",
    desc: "Future Ready Environment initiatives promote environmental sustainability, climate resilience, green innovation, and community-driven ecological transformation through technology-enabled and impact-oriented interventions.",
    headerIcons: [
      [{ icon: "leaf", label: "Protect Nature" }, { icon: "droplet", label: "Conserve Resources" }, { icon: "recycle", label: "Reduce Waste" }],
      [{ icon: "sun", label: "Clean Energy" }, { icon: "handshake", label: "Communities" }],
    ],
    focusAreas: [
      { icon: "leaf", text: "Environmental Sustainability & Climate Action" },
      { icon: "school", text: "Green Skills & Sustainability Education" },
      { icon: "sun", text: "Renewable Energy & Solar Ecosystems" },
      { icon: "recycle", text: "Waste Management & Circular Economy" },
      { icon: "droplet", text: "Water Conservation & Resource Management" },
      { icon: "sprout", text: "Smart Agriculture & Agri-Tech Solutions" },
      { icon: "tractor", text: "Organic Farming & Sustainable Agriculture" },
      { icon: "car", text: "Green Mobility & EV Awareness" },
      { icon: "glasses", text: "VR-Based Road Safety Education" },
      { icon: "zap", text: "Carbon Reduction & Energy Efficiency" },
      { icon: "globe", text: "Eco-Innovation & Sustainable Technologies" },
      { icon: "users", text: "Community Awareness & Behavioral Change" },
      { icon: "trees", text: "Biodiversity & Ecological Conservation" },
      { icon: "briefcase", text: "ESG & Sustainability Capacity Building" },
    ],
    approach: [
      "Community-driven sustainability initiatives",
      "Technology-enabled environmental solutions",
      "Awareness, training & behavioral transformation",
      "VR-enabled immersive learning experiences",
      "School, college & youth engagement models",
      "Corporate CSR & government expertise",
      "Sustainable infrastructure & green ecosystem",
      "Scalable rural and urban deployment frameworks",
      "Measurable environmental and social impact",
      "Partnership-led sustainability innovation",
    ],
    impactSnapshot: [
      { icon: "users", text: "Community-driven environmental sustainability initiatives" },
      { icon: "school", text: "Environmental awareness among thousands of students & youth" },
      { icon: "tractor", text: "Promotion of organic farming & sustainable rural livelihoods" },
      { icon: "sun", text: "Focus on renewable energy, conservation & climate resilience" },
      { icon: "handshake", text: "Strong collaboration with CSR, government & sustainability partners" },
      { icon: "glasses", text: "VR-enabled experiential learning for social impact education" },
    ],
    projectsLabel: "Flagship Initiatives",
    projects: [
      {
        num: 1,
        name: "Panasonic CSR â€“ Harit Umang Program",
        desc: "Large-scale environmental awareness initiative promoting eco-conscious behavior on E-Waste, Plastic Waste, Renewable Energy, and Biodiversity among students and youth.",
        img: "/Assets/public_assets/images/homepage/panasonic.jpg",
        logoKey: "panasonic-harit",
        chips: { target: "Schools, Colleges & ITI Students", coverage: "North India", impact: "Environmental awareness & youth-led green action" },
      },
      {
        num: 2,
        name: "VR-Based Road Safety Education Program",
        desc: "Immersive road safety awareness initiative using Virtual Reality to educate students and communities about safe road behavior, traffic awareness, and responsible mobility practices.",
        logoKey: "vr-safety",
        chips: { target: "School students, youth & communities", coverage: "Urban & semi-urban regions", impact: "Behavioral change & road safety" },
      },
      {
        num: 3,
        name: "Organic Farming & Sustainable Livelihood Initiative",
        desc: "Community-driven agritech initiative empowering Scheduled Tribe communities and Self Help Groups through sustainable agriculture, household training, and livelihood enhancement programs.",
        img: "/Assets/images/futureready/aadigram.jpeg",
        logoKey: "organic-farming",
        chips: { target: "SHGs, Tribal Households & Rural Communities", coverage: "Uttarakhand", impact: "Organic farming & rural development" },
      },
      {
        num: 4,
        name: "Renewable Energy & Solar Awareness Program",
        desc: "Green energy initiative promoting renewable energy adoption, solar ecosystem awareness, and sustainable energy practices through training, demonstrations, and community engagement.",
        logoKey: "renewable-solar",
        chips: { target: "Students, youth & rural communities", coverage: "Rural & regional implementation", impact: "Clean energy awareness & adoption" },
      },
      {
        num: 5,
        name: "Sustainable Green Entrepreneurship Program",
        desc: "Innovation-driven initiative supporting green entrepreneurship, eco-friendly livelihood opportunities, sustainable rural enterprises, and environmentally responsible business models.",
        logoKey: "green-entrepreneurship",
        chips: { target: "Youth, entrepreneurs & rural communities", coverage: "Rural innovation ecosystems", impact: "Sustainable livelihoods & green growth" },
      },
    ],
    impactRow: [
      { val: "Community-driven", lbl: "Sustainability Initiatives" },
      { val: "1000s+", lbl: "Students & Youth Reached" },
      { val: "Strong", lbl: "CSR & Govt Partnerships" },
      { val: "VR-enabled", lbl: "Experiential Learning" },
    ],
    footerTagline: "Together for Nature. Together for the Future.",
    footerTags: ["Building Green Communities", "Protecting Our Planet", "Reduce. Reuse. Recycle."],
  },
};

const GOVT_INITIATIVES_AREAS = [
  {
    key: "mobilization",
    label: "Mobilization",
    badge: "Outreach & Enrollment",
    title: "Reaching the Right Learners",
    emoji: "ðŸ“£",
    beneficiaries: ["Unemployed youth", "10th & 12th pass-out students", "Final-year college students", "DDU-GKY aspirants"],
    impact: ["Wider enrollment into flagship govt. skilling schemes", "Stronger last-mile connect with underserved communities"],
    items: [
      {
        icon: "ðŸŽ¯",
        title: "Candidate Mobilization Drives",
        desc: "Grassroots outreach and enrollment for electronics manufacturing, hospitality, mobile repairing, and emerging-tech programmes.",
      },
      {
        icon: "ðŸ“±",
        title: "DDU-GKY Â· Ministry of Rural Development (Uttarakhand)",
        desc: "Mobilizing 10th & 12th pass-out students for mobile handset repairing and placement in the mobile manufacturing industry.",
      },
      {
        icon: "ðŸ½ï¸",
        title: "Tourism & Hospitality SSC Â· Ministry of Tourism",
        desc: "Enrollment drives for Food & Beverage Services training â€” Uttarakhand, Himachal Pradesh & Ghaziabad â€” target: 12th pass-out students.",
      },
    ],
  },
  {
    key: "training-centers",
    label: "Training Centers",
    badge: "Infrastructure & Labs",
    title: "Future-Ready Training Infrastructure",
    emoji: "ðŸ«",
    beneficiaries: ["Affordable private schools (tier 2 & 3)", "Class 11th & 12th Govt. school students", "Colleges & ITIs"],
    impact: ["Future-ready skills infrastructure at scale", "Hands-on IoT and emerging-tech exposure"],
    items: [
      {
        icon: "ðŸ“¡",
        title: "TSSC & Ericsson â€” Govt. School IoT Labs",
        desc: "10 Govt. schools in Delhi NCR â€” AI, IoT, Drone, Robotics â€” hands-on IoT training for Class 11th & 12th Govt. school students.",
        img: "/Assets/images/futureready/iot.jpeg",
      },
      {
        icon: "ðŸ¤–",
        title: "30+ Leading Schools & Colleges",
        desc: "Future Ready Skills covering AI, Drone, IoT and Robotics â€” Punjab, Haryana, Chandigarh â€” affordable private schools in tier 2 & tier 3 cities.",
      },
      {
        icon: "ðŸ†",
        title: "Future Technology Labs",
        desc: "Institutional lab infrastructure for early exposure to future technologies and improved STEM outcomes.",
      },
    ],
  },
  {
    key: "training-delivery",
    label: "Training Delivery",
    badge: "Program Execution",
    title: "Delivering Industry-Aligned Skilling",
    emoji: "ðŸŽ“",
    beneficiaries: ["Final-year college students", "Unemployed youth", "12th pass-out students", "MSME workforce"],
    impact: ["2,500 candidates â€” Samsung Innovation Campus", "10,000+ youth in electronics manufacturing (3 years)", "Lean & ZED-aligned MSME capacity"],
    items: [
      {
        icon: "ðŸ¤–",
        title: "Samsung Innovation Campus (CSR)",
        desc: "Samsung Â· Telecom Sector Skill Council Â· 17 leading universities & colleges â€” AI, Big Data, Coding & Programming â€” Punjab & Haryana â€” expected impact: 2,500 candidates.",
        img: "/Assets/images/futureready/samsung.jpeg",
      },
      {
        icon: "âš¡",
        title: "TSSC & Ministry of Electronics & IT",
        desc: "OSP Fiber Installation, Testing & Commissioning Supervisor; Digital Cable Networkâ€“Access â€” Uttar Pradesh, Punjab, Haryana, Gujarat, M.P., Andhra Pradesh â€” 10,000+ youth in 3 years.",
      },
      {
        icon: "âœ…",
        title: "Lean Management & ZED (MSME)",
        desc: "Quality, production & export capabilities, workplace safety, and digital empowerment â€” Derabassi, Rajpura, Chandigarh, Baddi, Mohali.",
      },
    ],
  },
  {
    key: "employability",
    label: "Employability",
    badge: "Placement & Livelihoods",
    title: "From Training to Employment",
    emoji: "ðŸ’¼",
    beneficiaries: ["Trained youth", "SHG & tribal households", "ITI, schools & colleges"],
    impact: ["Training & placement in partner industries", "17,000 ST communities & 1,000 SHGs â€” agritech & livelihoods", "10,000 students â€” eco-awareness & greener careers"],
    items: [
      {
        icon: "ðŸ­",
        title: "Electronics & Manufacturing Placement",
        desc: "Trained & placed youth in electronic manufacturing and mobile handset industries across partner geographies.",
      },
      {
        icon: "ðŸŒ¾",
        title: "Patanjali Â· Ministry of Tribal Affairs",
        desc: "Empowering 17,000 Scheduled Tribe communities & 1,000 SHGs through sustainable agritech â€” livelihoods, income generation & environmental outcomes â€” Uttarakhand.",
        img: "/Assets/images/futureready/aadigram.jpeg",
      },
      {
        icon: "â™»ï¸",
        title: "Eco-Awareness & Greener Livelihoods",
        desc: "E-waste, plastic waste, renewable energy & biodiversity themes â€” expected impact among 10,000 students across North India.",
      },
    ],
  },
];

const TECH_LABS = [
  { icon: "ðŸ¤–", name: "Robotics", desc: "Hands-on robotics fostering innovation, critical thinking and real-world problem-solving." },
  { icon: "ðŸ§ ", name: "Artificial Intelligence", desc: "AI tools and techniques preparing learners for cutting-edge technology careers." },
  { icon: "ðŸ¥½", name: "AR & VR", desc: "Immersive learning with Augmented and Virtual Reality â€” the classroom of the future." },
  { icon: "ðŸš", name: "Drone Technology", desc: "Build, program & operate drones for agriculture, logistics and surveillance." },
  { icon: "ðŸŒ", name: "Internet of Things", desc: "Smart device connectivity for home automation, factories and healthcare applications." },
  { icon: "â˜ï¸", name: "Cloud Computing", desc: "Modern cloud infrastructure skills for next-generation technical professionals." },
];

/** Future Technology Lab as a Service (FFTLaaS) â€” aligned with school technical proposal */
const FFTLAA_TECH_PILLARS = [
  { icon: "ðŸ§ ", name: "Artificial Intelligence", desc: "Practical-linked AI track with theory, demonstration, and hands-on milestones across four quarters â€” aligned with your academic calendar." },
  { icon: "ðŸ¤–", name: "Robotics", desc: "Build and program with reusable, class-wise project kits â€” typically groups of 5â€“8 students per kit for collaborative lab time." },
  { icon: "ðŸŒ", name: "Internet of Things", desc: "Connected sensors, automation, and smart systems so learners ship real projects, not one-off demos." },
];

const FFTLAA_VALUE_PROPS = [
  { icon: "ðŸ”­", title: "Emerging technologies", desc: "Students work with AI, robotics, and IoT the way industry does â€” immersive, current, and skills-first." },
  { icon: "ðŸ› ï¸", title: "Hands-on by design", desc: "Learn by doing: build, test, and present outcomes every quarter with Show & Tell and exhibition days." },
  { icon: "ðŸ‘©â€ðŸ«", title: "Expert-backed integration", desc: "Curriculum, pacing, and assessments slot into your timetable with Focalyt curriculum and specialist support." },
  { icon: "ðŸ“š", title: "Continuous teacher growth", desc: "Quarterly Train-the-Trainer (offline, cluster level), manuals, and optional online master-trainer support by plan." },
  { icon: "ðŸ…", title: "Training & certification", desc: "Structured pathways for student and teacher certification as part of the annual subscription model." },
  { icon: "ðŸ’³", title: "Plans that fit your scale", desc: "BASIC, GROWTH, and PREMIUM tiers â€” from starter access to deeper on-site trainer support and audits." },
];

const FFTLAA_PROGRAM_SNAPSHOT = [
  { k: "Grades", v: "2nd â€“ 12th" },
  { k: "Quarters", v: "4 / year" },
  { k: "Lab sessions", v: "24 / year" },
  { k: "Per quarter", v: "6 sessions" },
  { k: "Session length", v: "60â€“90 min" },
  { k: "Delivery", v: "Annual model" },
];

const FFTLAA_JOURNEY = [
  { step: 1, title: "Select your plan", desc: "School chooses subscription tier, billing band, and number of candidates for the Future Technology Lab." },
  { step: 2, title: "Purchase order & sign-up", desc: "Academic window and commercial terms are finalized between Focalyt and your institute." },
  { step: 3, title: "Academic alignment", desc: "We co-design timetable slots, session calendar, and curriculum plan around exams and breaks." },
  { step: 4, title: "Launch on campus", desc: "FFTLaaS goes live at your premises â€” Future Ready School branding included on eligible plans." },
  { step: 5, title: "Train-the-Trainer", desc: "Quarterly TTT builds faculty confidence; kits, LMS, and trainer touchpoints roll in per your package." },
  { step: 6, title: "Kits & year-round rhythm", desc: "Quarterly reusable project kits at school; exhibitions, inter-school events, and quality checks keep momentum." },
];

const ROLES = [
  { emoji: "ðŸŽ’", name: "STUDENT", desc: "Aspiring to launch your career", href: "/candidate/login" },
  { emoji: "ðŸ”", name: "JOB SEEKER", desc: "Find jobs and internships", href: "/candidate/login" },
  { emoji: "ðŸ¢", name: "EMPLOYER", desc: "Seeking skilled talent", href: "/candidate/login" },
  { emoji: "ðŸ«", name: "INSTITUTE", desc: "Schools and colleges", href: "/candidate/login" },
  { emoji: "ðŸ‘©â€ðŸ«", name: "SKILL-EDUCATOR", desc: "Passionate for training", href: "/candidate/login" },
];

const WHY = [
  { icon: "ðŸŽ“", title: "IIT Alumni Curriculum", desc: "Programs and curriculum crafted by IIT alumni for maximum industry relevance." },
  { icon: "ðŸ“ˆ", title: "Basics to Professional", desc: "Structured learning from foundational concepts through to professional mastery." },
  { icon: "ðŸ›ï¸", title: "Govt. Skill Certification", desc: "Government of India recognized skill certification for your credentials." },
  { icon: "ðŸ’¡", title: "Projects & Internships", desc: "Real-world projects and paid internships with industry partners." },
  { icon: "ðŸ› ï¸", title: "Practical Training", desc: "Hands-on sessions with state-of-the-art lab equipment." },
  { icon: "ðŸ‘¥", title: "50,000+ Learners", desc: "A thriving community of learners trained across India." },
];

const PROJECTS = [
  {
    partner: "Samsung Â· TSSC Â· 17 Universities & Colleges",
    title: "Samsung Innovation Campus (CSR)",
    tech: "AI, Big Data, Coding & Programming",
    target: "Final-year college students",
    locations: "Punjab, Haryana",
    impact: "Expected impact: 2,500 candidates â€” early exposure to future technologies; future-ready skills & employability",
  },
  {
    partner: "TSSC Â· Ministry of Electronics & IT",
    title: "Electronics manufacturing skilling (ESDM-aligned)",
    tech: "OSP Fiber Installation, Testing & Commissioning Supervisor; Digital Cable Networkâ€“Access",
    target: "Unemployed youth",
    locations: "Uttar Pradesh, Punjab, Haryana, Gujarat, M.P., Andhra Pradesh",
    impact: "Impacted 10,000+ youth in 3 years â€” training & placement in electronic manufacturing companies",
  },
  {
    partner: "Tourism & Hospitality SSC Â· Ministry of Tourism",
    title: "Hospitality sector training & placement",
    tech: "Food & Beverage Services",
    target: "12th pass-out students",
    locations: "Uttarakhand, Himachal Pradesh, Ghaziabad",
    impact: "Youth trained & placed in the hospitality sector",
  },
  {
    partner: "Ministry of Rural Development (Uttarakhand) Â· DDU-GKY",
    title: "Mobile manufacturing skilling",
    tech: "Mobile handset repairing",
    target: "10th & 12th pass-out students",
    locations: "Uttarakhand",
    impact: "Youth trained & placed in the mobile manufacturing industry",
  },
  {
    partner: "Ericsson Â· TSSC",
    title: "Govt. school IoT labs",
    tech: "AI, IoT, Drone, Robotics",
    target: "Class 11th & 12th Govt. school students",
    locations: "10 Govt. schools, Delhi NCR",
    impact: "Future-ready skills through hands-on IoT training",
  },
  {
    partner: "Schools Â· Colleges Â· ITI",
    title: "Future Ready Environment â€” eco awareness",
    tech: "E-waste, plastic waste, renewable energy, biodiversity",
    target: "ITI, schools & colleges",
    locations: "North India",
    impact: "Expected impact: eco-awareness among 10,000 students â€” greener future themes",
  },
  {
    partner: "Patanjali Â· Ministry of Tribal Affairs",
    title: "Tribal & SHG agritech empowerment",
    tech: "SHG training, household training, agritech",
    target: "SHG & tribal households",
    locations: "Uttarakhand",
    impact: "17,000 Scheduled Tribe communities & 1,000 SHGs â€” livelihoods, income generation & environment",
  },
];

const HERO_TILES = [
  { key: "skills", icon: "âš¡", title: "Future Ready Skills" },
  { key: "schools", icon: "ðŸ«", title: "Future Ready Schools & Colleges" },
  { key: "msme", icon: "ðŸ­", title: "Future Ready MSMES" },
  { key: "env", icon: "ðŸŒ¿", title: "Future Ready Environment" },
];

const STATS = [
  { num: "10L+", label: "Students Community" },
  { num: "10K+", label: "Partners Nationwide" },
  { num: "11+", label: "States Covered" },
  { num: "50K+", label: "Future Ready Skills" },
];

const STATES = ["Punjab", "Haryana", "Himachal Pradesh", "Uttar Pradesh", "Uttarakhand", "Rajasthan", "Odisha", "Tamilnadu", "Chhattisgarh", "Gujarat", "Andhra Pradesh"];

const MARQUEE = [
  "AI & ML",
  "Robotics",
  "Drone Pilot",
  "IoT",
  "AR & VR",
  "Cloud",
  "Cyber Security",
  "Big Data",
  "Data Science",
  "AgriTech",
  "EV",
  "Industry 4.0",
];

const SIC_PARTNERS = ["Chandigarh University", "Amity University", "Central University of Haryana", "Lovely Professional University", "SGT University", "Rayat-Bahra University", "APIIT SD India", "G.M.N. College Ambala", "SIET Nilokheri", "MRSPTU"];

/** Regions shown on home geographic map (aligned with pan-India / partner footprint). */
const WORK_LOCATIONS = [
  { id: "ncr", label: "NCR & Uttar Pradesh", sub: "Ghaziabad Â· NCR skilling & outreach", lat: 28.6692, lng: 77.4538 },
  { id: "uk", label: "Uttarakhand", sub: "Rural & tribal development programmes", lat: 30.3165, lng: 78.0322 },
  { id: "hp", label: "Himachal Pradesh", sub: "Hospitality & tourism skilling", lat: 31.1048, lng: 77.1734 },
  { id: "blr", label: "Karnataka", sub: "Industry & campus partnerships", lat: 12.9716, lng: 77.5946 },
  { id: "mum", label: "Maharashtra", sub: "Corporate & institutional networks", lat: 19.076, lng: 72.8777 },
  { id: "hyd", label: "Telangana", sub: "TSSC-aligned future-tech tracks", lat: 17.385, lng: 78.4867 },
  { id: "chn", label: "Tamil Nadu", sub: "Manufacturing & services corridors", lat: 13.0827, lng: 80.2707 },
];

/** Leaflet view clamp â€” India only. Tighter SW/NE so frame stays subcontinental (not Middle East / SE Asia). */
const INDIA_MAX_BOUNDS = L.latLngBounds(L.latLng(5.8, 68.2), L.latLng(37.1, 97.4));

/** Partner-with-us section â€” narrative aligned with company profile / pillars on site. */
const PARTNER_PROFILE_HIGHLIGHTS = [
  "CSR & industry tracks with Samsung, Ericsson, Patanjali and foundations including Focal Skill Foundation & Samsung Innovation Campus.",
  "Government & SSC alignment â€” Ministry of Electronics & IT, Ministry of Tourism, Tribal Affairs, Rural Development (Uttarakhand), Telecom Sector Skill Council (TSSC), and Tourism & Hospitality Sector Skill Council.",
  "Institutional scale â€” 30+ partner schools & colleges, hands-on Future Technology Labs, and placement-linked skilling across states.",
];

const IMPACT_NUMBERS = [
  { num: "2,500", label: "Candidates (Samsung Innovation Campus)" },
  { num: "10,000", label: "Youth Impacted (ESDM in 3 years)" },
  { num: "30+", label: "Partner Schools & Colleges" },
  { num: "10", label: "Govt. Schools (IoT Labs, Delhi NCR)" },
  { num: "10,000", label: "Students (Eco-awareness initiatives)" },
  { num: "17,000", label: "ST Communities Empowered" },
  { num: "1,000", label: "SHGs Empowered" },
];

const IMPACT_PARTNERS = [
  "Samsung",
  "Telecom Sector Skill Council (TSSC)",
  "Ministry of Electronics & IT (Govt. of India)",
  "Tourism & Hospitality Sector Skill Council",
  "Ministry of Tourism",
  "Ministry of Rural Development (Uttarakhand)",
  "Ericsson",
  "Ministry of Tribal Affairs",
  "Patanjali",
];

/** CSR / corporate & implementing partners â€” marquee under #csr */
const CSR_MARQUEE_PARTNERS = [
  "Samsung",
  "Ericsson",
  "Panasonic",
  "Patanjali",
  "Focal Skill Foundation",
  "Samsung Innovation Campus",
  "Leading Universities & Colleges",
];

/** Government & sector-skill bodies â€” marquee under #govt (Focalyt profile PDF, Apr 2026) */
const GOVT_MARQUEE_PARTNERS = [
  "Ministry of Electronics & Information Technology (Govt. of India)",
  "Telecom Sector Skill Council (TSSC)",
  "Tourism & Hospitality Sector Skill Council",
  "Ministry of Tourism",
  "Ministry of Rural Development (Uttarakhand)",
  "Ministry of Tribal Affairs",
];

const FOC_HOME_THEME_STORAGE_KEY = "foc-homepage-theme";

/** Id values must match :root[data-foc-theme="â€¦"] in STYLES. */
const FOC_HOME_THEMES = [
  { id: "aurora", label: "Aurora", tone: "light" },
  { id: "pearl", label: "Warm Pearl", tone: "light" },
  { id: "sky-magenta", label: "Sky Magenta", tone: "light" },
  { id: "quantum-mint", label: "Quantum Mint", tone: "light" },
  { id: "arctic-holo", label: "Arctic Holo", tone: "light" },
  { id: "solarpunk", label: "Solarpunk", tone: "light" },
  { id: "lavender-cream", label: "Lavender Cream", tone: "light" },
  { id: "sunshine-paper", label: "Sunshine Paper", tone: "light" },
  { id: "rose-quartz", label: "Rose Quartz", tone: "light" },
  { id: "nordic-sage", label: "Nordic Sage", tone: "light" },
  { id: "neon-slate", label: "Neon Slate", tone: "dark" },
  { id: "matrix-lime", label: "Matrix Lime", tone: "dark" },
  { id: "obsidian-burst", label: "Obsidian", tone: "dark" },
  { id: "dark", label: "Cyber Dark", tone: "dark" },
];

function getInitialFocHomeTheme() {
  if (typeof window === "undefined") return "aurora";
  try {
    const raw = window.localStorage.getItem(FOC_HOME_THEME_STORAGE_KEY);
    if (raw && FOC_HOME_THEMES.some((t) => t.id === raw)) return raw;
  } catch {
    /* private mode */
  }
  return "aurora";
}

const OA_B = {
  navy: "#0d2240",
  teal: "#0e7c6b",
  green: "#16a34a",
  orange: "#f97316",
  purple: "#7c3aed",
  blue: "#1d4ed8",
  gold: "#d97706",
  light: "#f0f4f8",
  border: "#e2e8f0",
  muted: "#64748b",
};

const OA_TABS = [
  { id: "mob", label: "Mobilisation", icon: "bi-people-fill", accent: OA_B.teal },
  { id: "tc", label: "Training Centers", icon: "bi-building-fill", accent: OA_B.navy },
  { id: "tr", label: "Trainers", icon: "bi-person-workspace", accent: OA_B.blue },
  { id: "td", label: "Training Delivery", icon: "bi-journal-bookmark-fill", accent: OA_B.purple },
  { id: "ac", label: "Assessments & Certifications", icon: "bi-patch-check-fill", accent: OA_B.green },
  { id: "pe", label: "Placements & Employment", icon: "bi-briefcase-fill", accent: OA_B.orange },
  { id: "el", label: "Entrepreneurship & Livelihoods", icon: "bi-graph-up-arrow", accent: OA_B.gold },
];

/* â”€â”€ Our Approach fragment (merge into HomePage.jsx; OA_B & OA_TABS defined above) â”€â”€ */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SHARED MICRO-COMPONENTS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const OA_Check = ({ text, color = OA_B.teal }) => (
  <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:5 }}>
    <i className="bi bi-check-circle-fill" style={{ color, fontSize:13, flexShrink:0, marginTop:2 }} />
    <span style={{ fontSize:12, color:"#334155", lineHeight:1.45 }}>{text}</span>
  </div>
);

const OA_StatBadge = ({ val, label, color = OA_B.teal, icon }) => (
  <div style={{ textAlign:"center", padding:"12px 8px" }}>
    <div style={{ width:38, height:38, borderRadius:10, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 6px" }}>
      <i className={`bi ${icon}`} style={{ color, fontSize:18 }} />
    </div>
    <div style={{ fontFamily:"'Sora',sans-serif", fontSize:18, fontWeight:800, color, lineHeight:1 }}>{val}</div>
    <div style={{ fontSize:10, color: OA_B.muted, marginTop:3, lineHeight:1.3 }}>{label}</div>
  </div>
);

const OA_PhotoSlot = ({ id, label, color = OA_B.teal, aspect = "4/3" }) => {
  const ref = useRef();
  const [src, setSrc] = useState(null);
  return (
    <div
      onClick={() => ref.current.click()}
      style={{ borderRadius:12, overflow:"hidden", aspectRatio: aspect, position:"relative", cursor:"pointer",
        background: src ? "transparent" : `${color}12`, border:`1.5px dashed ${color}44`,
        display:"flex", alignItems:"center", justifyContent:"center" }}
    >
      {src
        ? <img src={src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
        : <div style={{ textAlign:"center", padding:12 }}>
            <i className="bi bi-camera-fill" style={{ fontSize:20, color:`${color}88` }} />
            <div style={{ fontSize:9.5, color:`${color}88`, marginTop:4, fontWeight:600 }}>{label}</div>
          </div>
      }
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.35)", opacity:0, transition:"opacity .15s",
        display:"flex", alignItems:"center", justifyContent:"center", borderRadius:12 }}
        className="photo-hover-ov"
      >
        <i className="bi bi-upload" style={{ color:"#fff", fontSize:18 }} />
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }}
        onChange={e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setSrc(ev.target.result); r.readAsDataURL(f); }}
      />
    </div>
  );
};

const OA_SectionHeader = ({ badge, title, titleGreen, subtitle, accent }) => (
  <div style={{ marginBottom:24 }}>
    <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:`${accent}18`, color:accent,
      fontSize:10, fontWeight:800, letterSpacing:"1.5px", textTransform:"uppercase",
      padding:"4px 13px", borderRadius:50, border:`1px solid ${accent}33`, marginBottom:12 }}>
      <i className="bi bi-circle-fill" style={{ fontSize:7 }} />{badge}
    </div>
    <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:26, fontWeight:800, lineHeight:1.1, color: OA_B.navy, margin:0 }}>
      {title}<br />
      <span style={{ color: accent }}>{titleGreen}</span>
    </h2>
    {subtitle && <p style={{ fontSize:13, color: OA_B.muted, marginTop:8, lineHeight:1.65, maxWidth:520 }}>{subtitle}</p>}
  </div>
);

const OA_CardGrid = ({ items, cols = 3, accent }) => (
  <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:12 }}>
    {items.map((card, i) => (
      <div key={i} style={{ background:"#fff", border:`1px solid ${OA_B.border}`, borderRadius:14,
        overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"3px 14px 0", display:"flex", alignItems:"center", gap:8,
          background:`${card.color || accent}10`, borderBottom:`1px solid ${OA_B.border}` }}>
          <div style={{ width:32, height:32, borderRadius:8, background:`${card.color||accent}18`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <i className={`bi ${card.icon}`} style={{ color: card.color||accent, fontSize:16 }} />
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:800, color: OA_B.muted, letterSpacing:"1px", textTransform:"uppercase" }}>
              {String(i+1).padStart(2,"0")}
            </div>
            <div style={{ fontSize:12, fontWeight:800, color: OA_B.navy, lineHeight:1.2 }}>{card.title}</div>
          </div>
        </div>
        <OA_PhotoSlot id={`${card.title}-${i}`} label="Upload photo" color={card.color||accent} aspect="16/9" />
        <div style={{ padding:"10px 14px 14px", flex:1 }}>
          <p style={{ fontSize:11, color: OA_B.muted, lineHeight:1.55, marginBottom:8 }}>{card.desc}</p>
          <div style={{ fontSize:10, fontWeight:700, color: card.color||accent, letterSpacing:"0.5px",
            textTransform:"uppercase", marginBottom:6 }}>Key Features</div>
          {card.features.map((f, fi) => <OA_Check key={fi} text={f} color={card.color||accent} />)}
        </div>
      </div>
    ))}
  </div>
);

const OA_CtaBar = ({ text, greenText, btnText, accent }) => (
  <div style={{ background: OA_B.navy, borderRadius:14, padding:"18px 24px",
    display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginTop:24 }}>
    <div>
      <div style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:800, color:"#fff" }}>{text}</div>
      <div style={{ fontSize:13, color: accent, fontWeight:600, marginTop:3 }}>{greenText}</div>
    </div>
    <button style={{ background: accent, color:"#fff", border:"none", borderRadius:50,
      padding:"10px 24px", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:800,
      cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
      {btnText} <i className="bi bi-arrow-right" />
    </button>
  </div>
);

const OA_InfoRow = ({ items, accent }) => (
  <div style={{ display:"flex", gap:6, flexWrap:"wrap", margin:"16px 0" }}>
    {items.map((it, i) => (
      <div key={i} style={{ display:"flex", alignItems:"center", gap:6, background:`${accent}10`,
        border:`1px solid ${accent}22`, borderRadius:8, padding:"6px 12px" }}>
        <i className={`bi ${it.icon}`} style={{ color: accent, fontSize:15 }} />
        <div>
          <div style={{ fontSize:11, fontWeight:700, color: OA_B.navy }}>{it.title}</div>
          <div style={{ fontSize:10, color: OA_B.muted }}>{it.sub}</div>
        </div>
      </div>
    ))}
  </div>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PANEL 1 â€” MOBILISATION
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function OA_Mobilisation() {
  const A = OA_B.teal;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:24, marginBottom:24 }}>
        <div>
          <OA_SectionHeader badge="Mobilisation" title="Reaching Communities." titleGreen="Empowering Futures."
            subtitle="Focalyt conducts structured community mobilisation to identify, counsel, and enroll eligible candidates in government-supported skill development and livelihood programs." accent={A} />
          <OA_InfoRow accent={A} items={[
            { icon:"bi-people",       title:"Community Driven",      sub:"On-ground outreach" },
            { icon:"bi-bullseye",     title:"Right Information",     sub:"To right beneficiaries" },
            { icon:"bi-arrow-up-circle", title:"Awareness to",       sub:"Empowerment" },
          ]} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { icon:"bi-people-fill",    color:A,         title:"Community Meetings & Awareness", desc:"Engaging communities through group meetings and awareness sessions." },
              { icon:"bi-house-door-fill",color:OA_B.blue,    title:"Door-to-Door Mobilisation", desc:"Reaching every doorstep to inform, counsel, and motivate beneficiaries." },
              { icon:"bi-megaphone-fill", color:OA_B.orange,  title:"Information Dissemination", desc:"Spreading key information through pamphlets, posters, and digital channels." },
              { icon:"bi-flag-fill",      color:OA_B.purple,  title:"Banner Displays & Announcements", desc:"Creating visibility through banners, wall paintings, and public drives." },
              { icon:"bi-building-fill",  color:OA_B.green,   title:"Village-level Stakeholder Engagement", desc:"Collaborating with local leaders, functionaries, and institutions." },
              { icon:"bi-chat-dots-fill", color:OA_B.gold,    title:"Career Counselling & Guidance", desc:"Helping beneficiaries understand career pathways and opportunities." },
              { icon:"bi-clipboard-check-fill", color:A,   title:"Candidate Screening & Enrollment", desc:"Verifying eligibility and supporting smooth enrollment." },
              { icon:"bi-mortarboard-fill",color:OA_B.blue,   title:"Outreach in Schools & Colleges", desc:"Conducting sessions to create awareness and engage students." },
            ].map((act, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10,
                background:"#fff", border:`1px solid ${OA_B.border}`, borderRadius:10, padding:"10px 12px" }}>
                <div style={{ width:34, height:34, borderRadius:9, background:`${act.color}15`,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <i className={`bi ${act.icon}`} style={{ color:act.color, fontSize:16 }} />
                </div>
                <div>
                  <div style={{ fontSize:11.5, fontWeight:700, color:OA_B.navy, marginBottom:2 }}>{act.title}</div>
                  <div style={{ fontSize:10.5, color:OA_B.muted, lineHeight:1.4 }}>{act.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <OA_PhotoSlot id="mob-hero" label="Upload mobilisation photo" color={A} aspect="4/3" />

          <div style={{ background:`${A}10`, border:`1px solid ${A}22`, borderRadius:12, padding:"14px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
              <i className="bi bi-people-fill" style={{ color:A, fontSize:14 }} />
              <span style={{ fontSize:10, fontWeight:800, color:A, letterSpacing:"1.5px", textTransform:"uppercase" }}>Target Beneficiaries</span>
            </div>
            {["Unemployed youth","School & college students","Women & SHGs","Tribal & rural communities","MSME workforce & entrepreneurs","Aspirational & underserved communities"]
              .map((t,i) => <OA_Check key={i} text={t} color={A} />)}
          </div>

          <div style={{ background:"#fff", border:`1px solid ${OA_B.border}`, borderRadius:12, padding:"14px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
              <i className="bi bi-graph-up" style={{ color:OA_B.orange, fontSize:14 }} />
              <span style={{ fontSize:10, fontWeight:800, color:OA_B.orange, letterSpacing:"1.5px", textTransform:"uppercase" }}>Outcomes & Impact</span>
            </div>
            {["Increased community awareness & participation","Higher enrollment & candidate engagement","Improved understanding of training opportunities","Better alignment between beneficiary aspirations","Stronger community & institutional partnerships"]
              .map((t,i) => <OA_Check key={i} text={t} color={OA_B.orange} />)}
          </div>

          <div style={{ background:"#fff", border:`1px solid ${OA_B.border}`, borderRadius:12, padding:"14px" }}>
            <div style={{ fontSize:10, fontWeight:800, color:OA_B.navy, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:10 }}>Our Approach</div>
            <p style={{ fontSize:11, color:OA_B.muted, lineHeight:1.6, marginBottom:10 }}>
              Our mobilisation model combines on-ground outreach with counselling and stakeholder engagement to ensure effective participation and informed enrollment.
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {[{icon:"bi-broadcast",label:"Outreach"},{icon:"bi-chat-heart",label:"Counselling"},{icon:"bi-person-check",label:"Enrollment"}].map((s,i)=>(
                <span key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, flex:1 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${A}15`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <i className={`bi ${s.icon}`} style={{ color:A, fontSize:14 }} />
                  </div>
                  <span style={{ fontSize:9.5, color:OA_B.muted, fontWeight:600 }}>{s.label}</span>
                  {i<2 && <i className="bi bi-arrow-right" style={{ position:"absolute", marginLeft:28, color:"#cbd5e1", fontSize:10 }} />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <OA_CtaBar text="Partner with Focalyt for scalable, community-driven mobilisation" greenText="and outreach solutions for government and development initiatives." btnText="Let's Create Impact Together" accent={A} />
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PANEL 2 â€” TRAINING CENTERS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function OA_TrainingCenters() {
  const A = OA_B.navy;
  const centers = [
    { icon:"bi-building-fill",        color:"#0d2240", title:"Academic Institution Based",
      desc:"Training centers within schools, colleges, universities, ITIs integrating skill development with formal education.",
      features:["Campus-based skill labs & classrooms","Integration with academic ecosystem","Future technology & employability training","Easy access for students and youth"] },
    { icon:"bi-building-gear",        color:OA_B.blue,    title:"Industry Led Training Centers",
      desc:"Developed in collaboration with industries to provide practical, job-oriented and placement-linked skill training.",
      features:["Industry-aligned curriculum","Practical & hands-on training","Real equipment & workplace simulation","Placement-focused delivery"] },
    { icon:"bi-geo-alt-fill",         color:OA_B.green,   title:"Remote & Rural Area Centers",
      desc:"Community-based centers close to rural, tribal, and underserved regions to improve accessibility and participation.",
      features:["Local community outreach","Rural & tribal accessibility","Women & SHG participation support","Livelihood-oriented training delivery"] },
    { icon:"bi-truck-front-fill",     color:OA_B.orange,  title:"Mobile Vans as Training Centers",
      desc:"Mobile training vans equipped with digital tools to deliver last-mile skilling and outreach in hard-to-reach areas.",
      features:["Portable & mobile learning setup","Flexible deployment across locations","Digital & practical training support","Awareness & counselling campaigns"] },
    { icon:"bi-stars",                color:OA_B.purple,  title:"Centers of Excellence (CoE)",
      desc:"Advanced training and innovation centers focused on future technologies, high-end skill development and research-oriented learning.",
      features:["Advanced technology labs","Specialized future-ready programs","Industry & institutional collaboration","Innovation & project-based learning"] },
  ];
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:24, marginBottom:20 }}>
        <div>
          <OA_SectionHeader badge="Training Centers" title="Strong Infrastructure." titleGreen="Skilled Futures."
            subtitle="Focalyt builds and operates diverse training centers to ensure accessible, industry-relevant, practical, and inclusive skill development across India." accent={OA_B.teal} />
          <OA_InfoRow accent={OA_B.teal} items={[
            { icon:"bi-building",     title:"Accessible Infrastructure",   sub:"Across geographies" },
            { icon:"bi-briefcase",    title:"Industry Relevant",            sub:"Job-oriented" },
            { icon:"bi-hand-index-thumb", title:"Practical Learning",       sub:"Hands-on focused" },
            { icon:"bi-geo",          title:"Placement Focused",            sub:"Employment linked" },
          ]} />
        </div>
        <OA_PhotoSlot id="tc-hero" label="Upload training center photo" color={OA_B.teal} aspect="1/1" />
      </div>

      <div style={{ fontSize:11, fontWeight:800, color:OA_B.muted, letterSpacing:"2px", textTransform:"uppercase",
        textAlign:"center", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, height:1, background:OA_B.border }} />
        OUR TYPES OF TRAINING CENTERS
        <div style={{ flex:1, height:1, background:OA_B.border }} />
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {centers.map((c, i) => (
          <div key={i} style={{ background:"#fff", border:`1px solid ${OA_B.border}`, borderRadius:14, overflow:"hidden",
            display:"grid", gridTemplateColumns:"180px 1fr 1fr" }}>
            <div style={{ background:`${c.color}10`, padding:"16px 14px", display:"flex", flexDirection:"column", gap:8,
              borderRight:`1px solid ${OA_B.border}` }}>
              <div style={{ width:44, height:44, borderRadius:11, background:`${c.color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <i className={`bi ${c.icon}`} style={{ color:c.color, fontSize:20 }} />
              </div>
              <div style={{ fontSize:10, fontWeight:800, color:OA_B.muted, letterSpacing:"1px" }}>
                {String(i+1).padStart(2,"0")}
              </div>
              <div style={{ fontSize:12.5, fontWeight:800, color:c.color, lineHeight:1.25 }}>{c.title}</div>
              <OA_PhotoSlot id={`tc-${i}`} label="Upload photo" color={c.color} aspect="4/3" />
            </div>
            <div style={{ padding:"16px 14px", borderRight:`1px solid ${OA_B.border}` }}>
              <p style={{ fontSize:11.5, color:OA_B.muted, lineHeight:1.6, marginBottom:10 }}>{c.desc}</p>
              <div style={{ fontSize:10, fontWeight:800, color:c.color, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Key Features</div>
              {c.features.map((f,fi) => <OA_Check key={fi} text={f} color={c.color} />)}
            </div>
            <div style={{ padding:"16px 14px" }}>
              <div style={{ fontSize:10, fontWeight:800, color:OA_B.green, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Advantages</div>
              {(i===0
                ? ["Utilizes existing educational infrastructure","Higher student participation & continuity","Promotes skill integration with academics","Cost-effective & scalable model"]
                : i===1
                ? ["Improves employability & job readiness","Exposure to real industry practices","Better placement opportunities","Strong industry linkage & feedback loop"]
                : i===2
                ? ["Reduces travel barriers for beneficiaries","Encourages rural youth & women participation","Supports local livelihoods & community development","Creates inclusive access to skill training"]
                : i===3
                ? ["Brings training directly to beneficiaries","Ideal for remote & underserved regions","Cost-effective outreach solution","Enables rapid deployment for initiatives"]
                : ["Creates future-ready workforce","Promotes innovation, R&D & applied learning","Supports emerging technologies","Enables high-impact flagship programs"]
              ).map((f,fi) => <OA_Check key={fi} text={f} color={OA_B.green} />)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginTop:18,
        background:`${OA_B.teal}08`, border:`1px solid ${OA_B.teal}22`, borderRadius:12, padding:"14px" }}>
        {[
          { icon:"bi-geo-alt",        label:"Accessibility across geographies" },
          { icon:"bi-briefcase",      label:"Industry relevance & employability" },
          { icon:"bi-people",         label:"Inclusion of underserved communities" },
          { icon:"bi-lightning",      label:"Future-ready skill development" },
          { icon:"bi-hand-index-thumb", label:"Practical & experiential learning" },
          { icon:"bi-arrows-expand",  label:"Scalable Govt. & CSR implementation" },
        ].map((it,i) => (
          <div key={i} style={{ textAlign:"center" }}>
            <div style={{ width:36, height:36, borderRadius:9, background:`${OA_B.teal}18`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 5px" }}>
              <i className={`bi ${it.icon}`} style={{ color:OA_B.teal, fontSize:16 }} />
            </div>
            <div style={{ fontSize:10, color:OA_B.navy, fontWeight:600, lineHeight:1.3 }}>{it.label}</div>
          </div>
        ))}
      </div>
      <OA_CtaBar text="Partner with Focalyt to build future-ready training centers" greenText="and transform lives through quality skill development." btnText="Let's Create Impact Together" accent={OA_B.teal} />
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PANEL 3 â€” TRAINERS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function OA_Trainers() {
  const A = OA_B.blue;
  const types = [
    { n:"01", icon:"bi-person-video3", color:OA_B.teal,   label:"Training of Trainers (ToT)",
      desc:"Capacity building programs to strengthen trainers with right skills, methodologies and tools to deliver high-quality training consistently.",
      features:["Trainer certification & upskilling","Standardized training methodologies","Curriculum orientation & pedagogy training","Technology-enabled training delivery","Assessment & quality monitoring support","Capacity building for large-scale implementation"] },
    { n:"02", icon:"bi-building-gear", color:OA_B.blue,   label:"Industry Experienced Trainers",
      desc:"Industry professionals who bring real-world exposure, practical insights and workplace experience to prepare learners for jobs and careers.",
      features:["Hands-on industry experience","Practical & application-based learning","Exposure to industry standards & practices","Real equipment & workplace simulations","Industry case studies & problem-solving","Placement-oriented training delivery"] },
    { n:"03", icon:"bi-book-half",     color:OA_B.purple, label:"Domain Trainers",
      desc:"Subject matter experts with deep knowledge in specific domains and technologies to deliver specialized and high-quality skill training.",
      features:["Sector-specific expertise & knowledge","Technical training & practical demonstrations","Curriculum-aligned learning delivery","Hands-on skill development approach","Assessment & competency-based training","Specialized training across emerging sectors"] },
    { n:"04", icon:"bi-star-fill",     color:OA_B.orange, label:"Soft Skill & Entrepreneurial Skills Trainers",
      desc:"Trainers who empower learners with essential soft skills and entrepreneurial mindset to thrive in careers, workplaces and business ventures.",
      features:["Communication & interpersonal skills","Personality development & confidence building","Entrepreneurial mindset & business orientation","Workplace etiquette & professionalism","Interview preparation & career readiness","Leadership, teamwork & problem-solving"] },
  ];
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:24, marginBottom:20 }}>
        <div>
          <OA_SectionHeader badge="Trainers" title="Skilled Trainers. Stronger Learning." titleGreen="Better Outcomes."
            subtitle="Focalyt's trainer ecosystem brings together master trainers, industry professionals, domain experts and facilitators to deliver industry-relevant, practical and future-ready training." accent={A} />
          <OA_InfoRow accent={A} items={[
            { icon:"bi-shield-check",     title:"Expertise You Can Trust",          sub:"Certified trainers" },
            { icon:"bi-building-gear",    title:"Industry Relevant",                sub:"Real-world exposure" },
            { icon:"bi-hand-index-thumb", title:"Practical & Experiential",         sub:"Hands-on learning" },
            { icon:"bi-person-check",     title:"Learner Centric",                  sub:"Focused approach" },
            { icon:"bi-lightning",        title:"Future Ready Training",            sub:"Emerging tech" },
            { icon:"bi-bullseye",         title:"Impact Driven",                    sub:"Measurable outcomes" },
          ]} />
        </div>
        <OA_PhotoSlot id="tr-hero" label="Upload trainer photo" color={A} aspect="1/1" />
      </div>

      <div style={{ fontSize:11, fontWeight:800, color:OA_B.muted, letterSpacing:"2px", textTransform:"uppercase",
        textAlign:"center", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, height:1, background:OA_B.border }} />
        OUR TRAINER ECOSYSTEM
        <div style={{ flex:1, height:1, background:OA_B.border }} />
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {types.map((t, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"160px 1fr 1fr",
            background:"#fff", border:`1px solid ${OA_B.border}`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ background:`${t.color}10`, padding:"16px 12px", borderRight:`1px solid ${OA_B.border}`,
              display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ width:42, height:42, borderRadius:10, background:`${t.color}20`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <i className={`bi ${t.icon}`} style={{ color:t.color, fontSize:19 }} />
              </div>
              <div style={{ fontSize:9, fontWeight:800, color:OA_B.muted }}>{t.n}</div>
              <div style={{ fontSize:12, fontWeight:800, color:t.color, lineHeight:1.25 }}>{t.label}</div>
              <OA_PhotoSlot id={`tr-${i}`} label="Upload" color={t.color} aspect="4/3" />
            </div>
            <div style={{ padding:"16px 14px", borderRight:`1px solid ${OA_B.border}` }}>
              <p style={{ fontSize:11.5, color:OA_B.muted, lineHeight:1.6, marginBottom:10 }}>{t.desc}</p>
              <div style={{ fontSize:10, fontWeight:800, color:t.color, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Key Features</div>
              {t.features.slice(0,4).map((f,fi) => <OA_Check key={fi} text={f} color={t.color} />)}
            </div>
            <div style={{ padding:"16px 14px" }}>
              <div style={{ fontSize:10, fontWeight:800, color:t.color, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>More Features</div>
              {t.features.slice(4).map((f,fi) => <OA_Check key={fi} text={f} color={t.color} />)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:`${A}08`, border:`1px solid ${A}22`, borderRadius:12, padding:"14px 18px", marginTop:18 }}>
        <div style={{ fontSize:11, fontWeight:800, color:OA_B.navy, marginBottom:10 }}>OUR COMMITMENT</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
          {[
            { icon:"bi-patch-check",  label:"Quality Training Delivery" },
            { icon:"bi-people",       label:"Inclusive & Impactful Approach" },
            { icon:"bi-bullseye",     label:"Results Oriented Outcomes" },
            { icon:"bi-globe",        label:"Scalable Across Geographies" },
            { icon:"bi-heart",        label:"Empowering Individuals" },
          ].map((it,i) => (
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ width:36, height:36, borderRadius:9, background:`${A}15`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 5px" }}>
                <i className={`bi ${it.icon}`} style={{ color:A, fontSize:16 }} />
              </div>
              <div style={{ fontSize:10, color:OA_B.navy, fontWeight:600, lineHeight:1.3 }}>{it.label}</div>
            </div>
          ))}
        </div>
      </div>
      <OA_CtaBar text="Partner with Focalyt to build a strong trainer network" greenText="and deliver transformative learning experiences." btnText="Let's Create Impact Together" accent={A} />
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PANEL 4 â€” TRAINING DELIVERY
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function OA_TrainingDelivery() {
  const A = OA_B.purple;
  const components = [
    { n:"01", icon:"bi-book",             color:OA_B.teal,   title:"Theory",
      desc:"Structured sessions to build strong conceptual foundations, domain knowledge and understanding of industry concepts.",
      features:["Curriculum-aligned & interactive sessions","Digital & blended learning methodologies","Industry concepts, standards & processes","Future technology & compliance awareness","Communication & workplace readiness"] },
    { n:"02", icon:"bi-tools",            color:OA_B.blue,   title:"Practical",
      desc:"Hands-on practice to strengthen skills, build confidence and ensure application of learning in real-world scenarios.",
      features:["Lab-based & hands-on training","Equipment handling & demonstrations","Simulation-based & problem-solving exercises","Practice-oriented skill development","Technology & tool-based learning"] },
    { n:"03", icon:"bi-building-gear",    color:OA_B.orange, title:"On Job Training (OJT)",
      desc:"Workplace-integrated training that provides real job experience, operational understanding and professional growth.",
      features:["Real work environment & task-based learning","Industry mentorship & supervision","Workplace discipline & professional behavior","Role understanding & workflow exposure","Enhanced employability & job readiness"] },
    { n:"04", icon:"bi-binoculars",       color:OA_B.purple, title:"Industry Exposure",
      desc:"Exposure activities that connect learners with industry, technologies, professionals and career opportunities.",
      features:["Industry visits & exposure sessions","Guest lectures by industry experts","Interaction with professionals & employers","Understanding processes, technologies & trends","Career guidance & employer engagement"] },
    { n:"05", icon:"bi-kanban",           color:OA_B.green,  title:"Capstone Projects",
      desc:"Project-based learning to apply knowledge, solve real-world problems and develop innovative, industry-relevant solutions.",
      features:["Team-based & experiential learning","Problem-solving & critical thinking","Industry & technology-oriented projects","Research, implementation & innovation","Presentation, evaluation & portfolio building"] },
    { n:"06", icon:"bi-award",            color:OA_B.gold,   title:"Extra Curricular Activities",
      desc:"Holistic activities that build personality, leadership, communication, confidence and overall learner development.",
      features:["Group activities, events & competitions","Leadership, teamwork & team-building","Communication & presentation activities","Entrepreneurship & innovation initiatives","Motivation, confidence & holistic development"] },
  ];
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:24, marginBottom:20 }}>
        <div>
          <OA_SectionHeader badge="Training Delivery" title="Comprehensive Learning." titleGreen="Real Skills. Real Impact."
            subtitle="Focalyt's integrated training delivery model blends knowledge, hands-on practice, industry exposure and holistic development to build confident, skilled and future-ready individuals." accent={A} />
          <OA_InfoRow accent={A} items={[
            { icon:"bi-layers",           title:"Blended Learning",       sub:"Multi-mode delivery" },
            { icon:"bi-building-gear",    title:"Industry Aligned",       sub:"Job-oriented" },
            { icon:"bi-hand-index-thumb", title:"Practical Focused",      sub:"Hands-on" },
            { icon:"bi-bullseye",         title:"Outcome Driven",         sub:"Measurable results" },
            { icon:"bi-lightning",        title:"Future Ready",           sub:"Emerging skills" },
          ]} />
        </div>
        <OA_PhotoSlot id="td-hero" label="Upload training delivery photo" color={A} aspect="1/1" />
      </div>

      <div style={{ fontSize:11, fontWeight:800, color:OA_B.muted, letterSpacing:"2px", textTransform:"uppercase",
        textAlign:"center", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, height:1, background:OA_B.border }} />
        OUR TRAINING DELIVERY COMPONENTS
        <div style={{ flex:1, height:1, background:OA_B.border }} />
      </div>

      <OA_CardGrid items={components} cols={3} accent={A} />

      <div style={{ background:`${A}08`, border:`1px solid ${A}22`, borderRadius:12, padding:"14px 18px", marginTop:18 }}>
        <div style={{ fontSize:11, fontWeight:800, color:OA_B.navy, marginBottom:10 }}>THE FOCALYT ADVANTAGE</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
          {[
            { icon:"bi-person-heart",     label:"Learner-Centric Approach" },
            { icon:"bi-mortarboard",      label:"Industry Relevant Curriculum" },
            { icon:"bi-hand-index-thumb", label:"Practical & Experiential" },
            { icon:"bi-briefcase",        label:"Enhanced Employability" },
            { icon:"bi-person-arms-up",   label:"Holistic Development" },
            { icon:"bi-bullseye",         label:"Outcome Driven Delivery" },
          ].map((it,i) => (
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ width:36, height:36, borderRadius:9, background:`${A}15`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 5px" }}>
                <i className={`bi ${it.icon}`} style={{ color:A, fontSize:16 }} />
              </div>
              <div style={{ fontSize:10, color:OA_B.navy, fontWeight:600, lineHeight:1.3 }}>{it.label}</div>
            </div>
          ))}
        </div>
      </div>
      <OA_CtaBar text="Learning Beyond Classrooms." greenText="Building Skills for Real-World Success." btnText="Let's Create Impact Together" accent={A} />
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PANEL 5 â€” ASSESSMENTS & CERTIFICATIONS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function OA_Assessments() {
  const A = OA_B.green;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:24, marginBottom:20 }}>
        <div>
          <OA_SectionHeader badge="Assessments & Certifications" title="Recognizing Skills. Validating Competencies." titleGreen="Enabling Careers."
            subtitle="Focalyt's assessments and certifications ensure credibility, industry alignment and employability. We validate learning outcomes through transparent evaluation and industry-recognized certifications." accent={A} />
          <OA_InfoRow accent={A} items={[
            { icon:"bi-building-gear",  title:"Industry Aligned",          sub:"Standards-based" },
            { icon:"bi-clipboard-data", title:"Transparent Assessments",   sub:"Objective evaluation" },
            { icon:"bi-patch-check",    title:"Recognized Certifications",  sub:"Sector skill councils" },
            { icon:"bi-graph-up",       title:"Better Skills",              sub:"Better future" },
          ]} />
        </div>
        <OA_PhotoSlot id="ac-hero" label="Upload assessment photo" color={A} aspect="1/1" />
      </div>

      <div style={{ fontSize:11, fontWeight:800, color:OA_B.muted, letterSpacing:"2px", textTransform:"uppercase",
        textAlign:"center", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, height:1, background:OA_B.border }} />
        OUR ASSESSMENT & CERTIFICATION ECOSYSTEM
        <div style={{ flex:1, height:1, background:OA_B.border }} />
      </div>

      <OA_CardGrid cols={3} accent={A} items={[
        { n:"01", icon:"bi-patch-check-fill", color:OA_B.teal, title:"Industry Recognised Certification",
          desc:"Industry-recognized certifications that validate technical competencies, practical skills and employability readiness across sectors.",
          features:["Certifications aligned with industry standards","Sector Skill Councils & institutional certifications","Co-branded and project-based certifications","Future-ready technology certifications","Skill competency & employability validation","Recognition across industries and sectors"] },
        { n:"02", icon:"bi-clipboard-data-fill", color:OA_B.blue, title:"Third Party Assessment",
          desc:"Independent and objective assessments conducted by authorized agencies and industry experts to ensure transparency, fairness and quality.",
          features:["Independent and unbiased evaluation","Practical and theory-based assessments","Competency-based skill evaluation","Standardized assessment methodologies","Quality monitoring and compliance support","Sector and job-role aligned evaluation criteria"] },
        { n:"03", icon:"bi-trophy-fill", color:OA_B.gold, title:"Certification Ceremonies",
          desc:"Celebrating achievements, recognizing hard work and motivating learners towards career growth, employment and entrepreneurship.",
          features:["Formal certification distribution events","Industry, institutional & govt. stakeholder participation","Recognition of learner achievements","Community and stakeholder engagement","Motivation, confidence-building & inspiration","Showcase of project outcomes & success stories"] },
      ]} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:16 }}>
        <div style={{ background:"#fff", border:`1px solid ${OA_B.border}`, borderRadius:12, padding:"16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`${A}15`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <i className="bi bi-bullseye" style={{ color:A, fontSize:16 }} />
            </div>
            <div style={{ fontSize:11, fontWeight:800, color:OA_B.navy }}>OUR APPROACH</div>
          </div>
          {["Transparent and standardized evaluation processes","Industry relevance and credibility","Practical competency measurement","Outcome-oriented certification systems","Enhanced employability and career readiness","Quality assurance across programs and geographies"]
            .map((t,i) => <OA_Check key={i} text={t} color={A} />)}
        </div>
        <div style={{ background:"#fff", border:`1px solid ${OA_B.border}`, borderRadius:12, padding:"16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`${OA_B.blue}15`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <i className="bi bi-clipboard-check" style={{ color:OA_B.blue, fontSize:16 }} />
            </div>
            <div style={{ fontSize:11, fontWeight:800, color:OA_B.navy }}>OUR ASSESSMENT METHODOLOGY</div>
          </div>
          {["Theory-based evaluation","Practical skill assessment","Industry-aligned competency checks","Continuous performance monitoring","Third-party validation mechanisms","Project and application-based evaluations"]
            .map((t,i) => <OA_Check key={i} text={t} color={OA_B.blue} />)}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginTop:16 }}>
        {[
          { icon:"bi-patch-check",  label:"Validates Skills & Knowledge",     color:A },
          { icon:"bi-graph-up",     label:"Improves Employability",           color:OA_B.blue },
          { icon:"bi-handshake",    label:"Builds Industry Trust & Confidence",color:OA_B.teal },
          { icon:"bi-door-open",    label:"Opens Doors to Better Opportunities",color:OA_B.orange },
          { icon:"bi-mortarboard",  label:"Encourages Lifelong Learning",     color:OA_B.purple },
        ].map((it,i) => (
          <div key={i} style={{ background:`${it.color}08`, border:`1px solid ${it.color}22`, borderRadius:10, padding:"12px 8px", textAlign:"center" }}>
            <i className={`bi ${it.icon}`} style={{ color:it.color, fontSize:22, display:"block", marginBottom:6 }} />
            <div style={{ fontSize:10.5, fontWeight:700, color:OA_B.navy, lineHeight:1.3 }}>{it.label}</div>
          </div>
        ))}
      </div>
      <OA_CtaBar text="From Learning to Recognition. From Skills to Success." greenText="Partner with Focalyt to empower learners with credible assessments." btnText="Let's Build Futures Together" accent={A} />
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PANEL 6 â€” PLACEMENTS & EMPLOYMENT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function OA_Placements() {
  const A = OA_B.orange;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:24, marginBottom:20 }}>
        <div>
          <OA_SectionHeader badge="Placements & Employment" title="From Skills" titleGreen="to Successful Careers"
            subtitle="Connecting talent with opportunities through strong industry partnerships and end-to-end placement support." accent={A} />
          <OA_InfoRow accent={A} items={[
            { icon:"bi-building",         title:"Industry Connections",    sub:"Strong partnerships" },
            { icon:"bi-briefcase",        title:"Placement Opportunities", sub:"Across sectors" },
            { icon:"bi-check-circle",     title:"Smooth Hiring Process",   sub:"End-to-end support" },
            { icon:"bi-headset",          title:"Continuous Support",      sub:"Post-placement care" },
          ]} />
        </div>
        <OA_PhotoSlot id="pe-hero" label="Upload placement photo" color={A} aspect="1/1" />
      </div>

      <div style={{ fontSize:11, fontWeight:800, color:OA_B.muted, letterSpacing:"2px", textTransform:"uppercase",
        textAlign:"center", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, height:1, background:OA_B.border }} />
        OUR PLACEMENT JOURNEY
        <div style={{ flex:1, height:1, background:OA_B.border }} />
      </div>

      <OA_CardGrid cols={4} accent={A} items={[
        { n:"01", icon:"bi-handshake-fill",  color:OA_B.teal,   title:"Industry Tie-Ups",
          desc:"Strong partnerships with industries and employers to align training with real-world job opportunities.",
          features:["Industry partnerships & collaborations","Placement-linked training programs","Workforce requirement mapping","Sector-specific job opportunities","Long-term employer relationships"] },
        { n:"02", icon:"bi-people-fill",     color:OA_B.blue,   title:"Placement Drives",
          desc:"Regular placement drives, job fairs and interviews to connect skilled candidates with top employers.",
          features:["On-campus & off-campus drives","Employer interaction sessions","Job fairs & recruitment events","Interview preparation support","Profile matching & shortlisting"] },
        { n:"03", icon:"bi-envelope-open-fill",color:OA_B.orange,title:"Offer Letters",
          desc:"End-to-end assistance in offer letter processing and smooth onboarding into the workplace.",
          features:["Offer letter facilitation","Documentation support","Joining process coordination","Employer communication","Placement tracking & reporting"] },
        { n:"04", icon:"bi-person-check-fill",color:OA_B.green,  title:"Hand Holding Support",
          desc:"Continuous support to help candidates adapt, grow and succeed in their careers.",
          features:["Post-placement follow-up","Workplace adjustment support","Career guidance & mentoring","Problem resolution assistance","Long-term career growth support"] },
      ]} />

      <div style={{ background:`${OA_B.navy}08`, border:`1px solid ${OA_B.navy}22`, borderRadius:12, padding:"14px 20px", marginTop:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:OA_B.navy, letterSpacing:"2px", textTransform:"uppercase",
          textAlign:"center", marginBottom:12 }}>OUR IMPACT IN PLACEMENTS</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          <OA_StatBadge val="10,000+" label="Candidates Placed"         color={A}      icon="bi-people-fill" />
          <OA_StatBadge val="500+"    label="Industry Partners"         color={OA_B.blue} icon="bi-handshake" />
          <OA_StatBadge val="35+"     label="Sectors Covered"           color={OA_B.teal} icon="bi-briefcase" />
          <OA_StatBadge val="85%+"    label="Placement Success Rate"    color={OA_B.green} icon="bi-graph-up" />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:16 }}>
        <div style={{ background:`${A}08`, border:`1px solid ${A}22`, borderRadius:12, padding:"16px" }}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:800, color:OA_B.navy, marginBottom:4 }}>
            End-to-End Support for Every Step of Your Career
          </div>
          <p style={{ fontSize:11.5, color:OA_B.muted, lineHeight:1.6 }}>
            We go beyond training to ensure every learner gets the right opportunity and support to build a successful and sustainable career.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[
            { icon:"bi-file-person", color:A,        title:"Career Readiness",     sub:"Resume building, soft skills & interview prep" },
            { icon:"bi-building",    color:OA_B.blue,   title:"Employer Network",      sub:"Access to a wide network of trusted employers" },
            { icon:"bi-person-heart",color:OA_B.purple, title:"Personalized Support",  sub:"One-on-one guidance through the placement journey" },
            { icon:"bi-graph-up",    color:OA_B.green,  title:"Career Growth",         sub:"Continuous guidance for long-term progression" },
          ].map((it,i) => (
            <div key={i} style={{ background:"#fff", border:`1px solid ${OA_B.border}`, borderRadius:10, padding:"10px" }}>
              <i className={`bi ${it.icon}`} style={{ color:it.color, fontSize:18, display:"block", marginBottom:5 }} />
              <div style={{ fontSize:11, fontWeight:700, color:OA_B.navy }}>{it.title}</div>
              <div style={{ fontSize:10, color:OA_B.muted, lineHeight:1.4, marginTop:2 }}>{it.sub}</div>
            </div>
          ))}
        </div>
      </div>
      <OA_CtaBar text="We don't just train. We help you get placed." greenText="Partner with Focalyt to empower talent and drive meaningful employment outcomes." btnText="Partner With Us" accent={A} />
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PANEL 7 â€” ENTREPRENEURSHIP & LIVELIHOODS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function OA_Entrepreneurship() {
  const A = OA_B.gold;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:24, marginBottom:20 }}>
        <div>
          <OA_SectionHeader badge="Entrepreneurship & Livelihoods" title="Empowering Entrepreneurs. Building Livelihoods." titleGreen="Transforming Communities."
            subtitle="Focalyt nurtures entrepreneurial mindset, builds skills, provides mentorship and connects individuals and communities with opportunities to create sustainable enterprises and better livelihoods." accent={A} />
          <OA_InfoRow accent={A} items={[
            { icon:"bi-person-arms-up", title:"Self-Reliance & Empowerment",  sub:"Building independence" },
            { icon:"bi-graph-up-arrow", title:"Enterprise Growth",            sub:"Scaling businesses" },
            { icon:"bi-people",         title:"Community Prosperity",         sub:"Collective impact" },
            { icon:"bi-tree",           title:"Sustainable Livelihoods",      sub:"Long-term outcomes" },
          ]} />
        </div>
        <OA_PhotoSlot id="el-hero" label="Upload entrepreneur photo" color={A} aspect="1/1" />
      </div>

      <div style={{ fontSize:11, fontWeight:800, color:OA_B.muted, letterSpacing:"2px", textTransform:"uppercase",
        textAlign:"center", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, height:1, background:OA_B.border }} />
        OUR ENTREPRENEURSHIP & LIVELIHOOD INITIATIVES
        <div style={{ flex:1, height:1, background:OA_B.border }} />
      </div>

      <OA_CardGrid cols={3} accent={A} items={[
        { icon:"bi-lightbulb-fill",      color:OA_B.teal,   title:"Entrepreneurship Development Programs",
          desc:"Structured programs to build entrepreneurial mindset, business awareness, innovation capabilities and enterprise management skills.",
          features:["Entrepreneurship orientation & awareness","Business planning & enterprise development","Innovation & problem-solving approach","Startup & self-employment readiness","Market understanding & opportunity identification","Entrepreneurial mindset & leadership development"] },
        { icon:"bi-people-fill",         color:OA_B.blue,   title:"SHG & Community Livelihood Support",
          desc:"Working with SHGs, women groups, rural communities and tribal households to strengthen livelihood opportunities and community-based enterprises.",
          features:["SHG capacity building & training","Livelihood & income-generation activities","Community-based enterprise support","Rural & tribal entrepreneurship promotion","Women empowerment initiatives","Skill-based livelihood enhancement programs"] },
        { icon:"bi-person-video",        color:OA_B.purple, title:"Business Mentorship & Handholding",
          desc:"Continuous mentorship and handholding support to aspiring entrepreneurs to help them establish, manage, and sustain enterprises successfully.",
          features:["One-to-one mentoring","Enterprise setup guidance","Business management support","Market & customer insights","Growth & sustainability support","Continuous handholding"] },
        { icon:"bi-currency-rupee",      color:OA_B.orange, title:"Financial Literacy & Digital Empowerment",
          desc:"Financial literacy and digital empowerment initiatives to help beneficiaries understand financial management, digital tools and technology-enabled opportunities.",
          features:["Financial literacy training","Digital payments & tools","Budgeting & financial planning","Digital marketing awareness","Govt. schemes & support info","Tech-enabled entrepreneurship"] },
        { icon:"bi-shop",                color:A,        title:"Market Linkages & Enterprise Exposure",
          desc:"Market linkage initiatives and exposure opportunities to strengthen business visibility and growth potential for entrepreneurs.",
          features:["Market linkage facilitation","Buyer & stakeholder connect","Exposure visits & networking","Product & service promotion","Partnerships & collaborations","Stronger market access"] },
      ]} />

      <div style={{ marginTop:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:OA_B.navy, letterSpacing:"2px", textTransform:"uppercase",
          textAlign:"center", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ flex:1, height:1, background:OA_B.border }} />
          OUR ECOSYSTEM SUPPORT
          <div style={{ flex:1, height:1, background:OA_B.border }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
          {[
            { icon:"bi-book",            color:OA_B.teal,   label:"Knowledge & Skills" },
            { icon:"bi-person-video3",   color:OA_B.blue,   label:"Mentorship & Guidance" },
            { icon:"bi-currency-rupee",  color:OA_B.green,  label:"Financial Inclusion" },
            { icon:"bi-shop",            color:OA_B.orange, label:"Market Access" },
            { icon:"bi-link-45deg",      color:OA_B.purple, label:"Network & Partnerships" },
            { icon:"bi-graph-up-arrow",  color:A,        label:"Sustainable Growth" },
          ].map((it,i) => (
            <div key={i} style={{ background:`${it.color}08`, border:`1px solid ${it.color}22`, borderRadius:10, padding:"12px 8px", textAlign:"center" }}>
              <i className={`bi ${it.icon}`} style={{ color:it.color, fontSize:22, display:"block", marginBottom:6 }} />
              <div style={{ fontSize:10, fontWeight:700, color:OA_B.navy, lineHeight:1.3 }}>{it.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginTop:14 }}>
        <OA_StatBadge val="5,000+" label="Aspiring Entrepreneurs Supported"  color={A}      icon="bi-person-arms-up" />
        <OA_StatBadge val="2,500+" label="Enterprises Facilitated"           color={OA_B.teal} icon="bi-building" />
        <OA_StatBadge val="60%+"   label="Women Entrepreneurs Empowered"     color={OA_B.blue} icon="bi-gender-female" />
        <OA_StatBadge val="35+"    label="Sectors & Livelihood Opportunities" color={OA_B.purple} icon="bi-grid" />
        <OA_StatBadge val="Sustainable" label="Incomes & Stronger Communities" color={OA_B.green} icon="bi-tree" />
      </div>
      <OA_CtaBar text="Empowering Entrepreneurs. Creating Sustainable Livelihoods." greenText="Join hands with Focalyt to turn potential into progress." btnText="Let's Build a Better Future Together" accent={A} />
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CSS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const OA_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');

.oa-wrap * { box-sizing:border-box; margin:0; padding:0; }
.oa-wrap { font-family:'DM Sans',sans-serif; background:#f0f4f8; }

/* â”€â”€ HEADER â”€â”€ */
.oa-header {
  background:#0d2240;
  position:sticky; top:0; z-index:100;
  box-shadow:0 4px 20px rgba(0,0,0,.3);
}

/* â”€â”€ centered title row â”€â”€ */
.oa-title-row {
  padding:14px 20px 12px;
  text-align:center;
  border-bottom:1px solid rgba(255,255,255,.08);
}
.oa-brand-pill {
  display:inline-flex; align-items:center; gap:6px;
  background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.18);
  padding:3px 12px; border-radius:50px; margin-bottom:7px;
}
.oa-brand-pill i  { color:#5eead4; font-size:11px; }
.oa-brand-pill span {
  font-family:'Sora',sans-serif; font-size:10px; font-weight:800;
  color:#fff; letter-spacing:1px; text-transform:uppercase;
}
.oa-main-title {
  font-family:'Sora',sans-serif;
  font-size:18px; font-weight:800; color:#fff; line-height:1.2; margin:0;
}
.oa-main-title span { color:#5eead4; }
.oa-sub-title {
  font-size:11px; color:rgba(255,255,255,.45); margin-top:3px; letter-spacing:.3px;
}

/* â”€â”€ TABS ROW â€” desktop: centered wrap â”€â”€ */
.oa-tabs-row {
  padding:10px 16px 12px;
  display:flex;
  gap:7px;
  justify-content:center;
  flex-wrap:wrap;
  overflow:hidden;
}

/* â”€â”€ base pill tab â”€â”€ */
.oa-tab {
  display:inline-flex; align-items:center; gap:7px;
  padding:8px 15px; border-radius:50px;
  border:1.5px solid rgba(255,255,255,.15);
  background:rgba(255,255,255,.06);
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700;
  color:rgba(255,255,255,.55); cursor:pointer;
  transition:background .18s, color .18s, border-color .18s, box-shadow .18s;
  white-space:nowrap; flex-shrink:0;
}
.oa-tab i { font-size:14px; flex-shrink:0; }
.oa-tab:hover {
  background:rgba(255,255,255,.12);
  color:rgba(255,255,255,.9);
  border-color:rgba(255,255,255,.3);
}
.oa-tab.active {
  color:#fff;
  border-color:transparent;
  box-shadow:0 2px 14px rgba(0,0,0,.3);
}

/* â”€â”€ tab label span â€” hidden on small screens â”€â”€ */
.oa-tab-label { display:inline; }

/* â”€â”€ body â”€â”€ */
.oa-body { padding:24px; max-width:1200px; margin:0 auto; }

.photo-hover-ov:hover { opacity:1 !important; }

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   RESPONSIVE  â‰¤ 768px
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
@media (max-width:768px) {

  /* title */
  .oa-main-title { font-size:14px; }
  .oa-sub-title  { display:none; }
  .oa-title-row  { padding:10px 14px 8px; }

  /* tabs: horizontal scroll strip â€” no wrap */
  .oa-tabs-row {
    flex-wrap:nowrap;
    overflow-x:auto;
    justify-content:flex-start;
    padding:8px 12px 10px;
    gap:6px;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
  }
  .oa-tabs-row::-webkit-scrollbar { display:none; }

  /* icon-only pills on mobile */
  .oa-tab {
    padding:8px 12px;
    font-size:11px;
    gap:0;
  }
  .oa-tab-label { display:none; }

  /* active tab shows label again */
  .oa-tab.active { padding:8px 14px; gap:6px; }
  .oa-tab.active .oa-tab-label { display:inline; }

  /* body padding */
  .oa-body { padding:14px; }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   RESPONSIVE  â‰¤ 480px
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
@media (max-width:480px) {
  .oa-main-title { font-size:13px; }
  .oa-brand-pill span { font-size:9px; }
  .oa-tab { padding:7px 10px; }
  .oa-tab.active { padding:7px 12px; gap:5px; }
  .oa-tab i { font-size:16px; }
  .oa-body { padding:10px; }
}
`;

const OA_PANELS = {
  mob: OA_Mobilisation,
  tc:  OA_TrainingCenters,
  tr:  OA_Trainers,
  td:  OA_TrainingDelivery,
  ac:  OA_Assessments,
  pe:  OA_Placements,
  el:  OA_Entrepreneurship,
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ROOT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function OurApproachSection() {
  const [active, setActive] = useState("mob");
  const Comp      = OA_PANELS[active];
  const activeTab = OA_TABS.find(t => t.id === active);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
      />
      <style>{OA_CSS}</style>
      <div className="oa-wrap">

        {/* â”€â”€ STICKY HEADER â”€â”€ */}
        <div className="oa-header">

          {/* Centered title block */}
          <div className="oa-title-row">
            <div className="oa-brand-pill">
              <i className="bi bi-bullseye" />
              <span>Focalyt</span>
            </div>
            <h1 className="oa-main-title">
              Our Approach â€”{" "}
              <span>Integrated Implementation Ecosystem</span>
            </h1>
            <div className="oa-sub-title">
              Mobilisation Â· Training Centers Â· Trainers Â· Training Delivery Â·
              Assessments Â· Placements Â· Entrepreneurship
            </div>
          </div>

          {/* Pill tabs â€” wrapping on desktop, scrollable on mobile */}
          <div className="oa-tabs-row">
            {OA_TABS.map(t => (
              <button
                key={t.id}
                className={`oa-tab${active === t.id ? " active" : ""}`}
                style={
                  active === t.id
                    ? { background: t.accent, borderColor: t.accent }
                    : {}
                }
                onClick={() => setActive(t.id)}
                aria-label={t.label}
              >
                <i
                  className={`bi ${t.icon}`}
                  style={{ color: active === t.id ? "#fff" : t.accent }}
                />
                <span className="oa-tab-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* â”€â”€ PANEL BODY â”€â”€ */}
        <div className="oa-body">
          <Comp key={active} />
        </div>

      </div>
    </>
  );
}

export default function HomePage() {
  const [activeArea, setActiveArea] = useState("skills");
  const currentArea = CORE_AREAS.find((a) => a.key === activeArea);
  const [hoveredAreaItemIdx, setHoveredAreaItemIdx] = useState(null);
  const [activeGovtArea, setActiveGovtArea] = useState("mobilization");
  const currentGovtArea = GOVT_INITIATIVES_AREAS.find((a) => a.key === activeGovtArea);
  const [hoveredGovtAreaItemIdx, setHoveredGovtAreaItemIdx] = useState(null);
  const [events, setEvents] = useState([]);
  const [expiredEvents, setExpiredEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [uniqueSectors, setUniqueSectors] = useState([]);
  const [videoSrc, setVideoSrc] = useState("");
  const [coursesError, setCoursesError] = useState("");
  const [formData, setFormData] = useState({
    courseName: "",
    sectorName: "",
    projectName: "",
    typeOfProject: "",
  });
  const [jobs, setJobs] = useState([]);
  const [jobsError, setJobsError] = useState("");
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  
  /** Scroll down â†’ CSR strip RTL (right-to-left); scroll up â†’ LTR. Govt strip uses the opposite. */
  const [marqueeScrollDown, setMarqueeScrollDown] = useState(true);
  const lastScrollY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const [focTheme, setFocTheme] = useState(getInitialFocHomeTheme);
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const themeFabRef = useRef(null);
  const courseCarouselRef = useRef(null);
  const eventCarouselRef = useRef(null);
  const jobCarouselRef = useRef(null);
  const indiaMapSectionRef = useRef(null);
  const indiaMapElRef = useRef(null);
  const indiaLeafletMapRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [feeFilter, setFeeFilter] = useState("all");
  
  const scrollCourseCarousel = (direction) => {
    const el = courseCarouselRef.current;
    if (!el) return;
    const step = Math.max(240, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const scrollEventCarousel = (direction) => {
    const el = eventCarouselRef.current;
    if (!el) return;
    const step = Math.max(240, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const scrollJobCarousel = (direction) => {
    const el = jobCarouselRef.current;
    if (!el) return;
    const step = Math.max(240, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const jobExperienceLabel = (job) => {
    if ((job.experience == 0 && job.experienceMonths == 0) || (job.experience == 0 && !job.experienceMonths)) return "Fresher";
    const y = job.experience > 0 ? `${job.experience} ${job.experience === 1 ? "Year" : "Years"}` : "";
    const m = job.experienceMonths > 0 ? `${job.experienceMonths} ${job.experienceMonths === 1 ? "Month" : "Months"}` : "";
    return `${y} ${m}`.trim() || "â€”";
  };

  const handleShare = async (course, courseId, courseName) => {
    const courseUrl = `${window.location.origin}/coursedetails/${courseId}`;
    const detailText = course
      ? [course.duration && `Duration: ${course.duration}`, course.trainingMode && course.trainingMode, course.courseType === "coursejob" ? "Course + Jobs" : "Course"].filter(Boolean).join(" â€¢ ")
      : "";
    const shareText = detailText ? `${courseName} â€” ${detailText}` : `Check out this course: ${courseName}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: courseName, text: shareText, url: courseUrl });
        return;
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }

    navigator.clipboard?.writeText(`${shareText}\n${courseUrl}`).then(() => {
      alert("Course link copied! You can paste it anywhere.");
    });
  };

  const handleShareJob = async (jobId, jobTitle) => {
    const jobUrl = `${window.location.origin}/jobdetailsmore/${jobId}`;
    const shareText = jobTitle ? `Check out this job: ${jobTitle}` : "Check out this job";
    if (navigator.share) {
      try {
        await navigator.share({ title: jobTitle || "Job", text: shareText, url: jobUrl });
        return;
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
    navigator.clipboard?.writeText(`${shareText}\n${jobUrl}`).then(() => {
      alert("Job link copied! You can paste it anywhere.");
    });
  };

  const handleShareEvent = async (eventId, eventName) => {
    const eventUrl = `${window.location.origin}/event`;
    const shareText = eventName ? `Check out this event: ${eventName}` : "Check out this event";
    if (navigator.share) {
      try {
        await navigator.share({ title: eventName || "Event", text: shareText, url: eventUrl });
        return;
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
    navigator.clipboard?.writeText(`${shareText}\n${eventUrl}`).then(() => {
      alert("Event link copied! You can paste it anywhere.");
    });
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (delta > 4) setMarqueeScrollDown(true);
      else if (delta < -4) setMarqueeScrollDown(false);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let el = document.getElementById("foc-cyber-styles");
    if (!el) {
      el = document.createElement("style");
      el.id = "foc-cyber-styles";
      document.head.appendChild(el);
    }
    el.textContent = STYLES;
    return () => {
      const s = document.getElementById("foc-cyber-styles");
      if (s) s.remove();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-foc-theme", focTheme);
    root.style.setProperty("--front-layout-bg", "var(--bg)");
    try {
      window.localStorage.setItem(FOC_HOME_THEME_STORAGE_KEY, focTheme);
    } catch {
      /* ignore */
    }
    return () => {
      root.removeAttribute("data-foc-theme");
      root.style.removeProperty("--front-layout-bg");
    };
  }, [focTheme]);

  useEffect(() => {
    if (!themePanelOpen) return undefined;
    const onDocMouseDown = (e) => {
      if (themeFabRef.current && !themeFabRef.current.contains(e.target)) {
        setThemePanelOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setThemePanelOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [themePanelOpen]);

  useEffect(() => {
    setHoveredAreaItemIdx(null);
  }, [activeArea]);

  useEffect(() => {
    setHoveredGovtAreaItemIdx(null);
  }, [activeGovtArea]);



  useEffect(() => {
    const fetchData = async () => {
      try {
        setCoursesError("");
        let response;
        try {
          response = await axios.get(`${backendUrl}/courses`);
        } catch (error) {
          response = await axios.get("/courses");
        }

        setCourses(Array.isArray(response.data.courses) ? response.data.courses : []);
        setUniqueSectors(Array.isArray(response.data.uniqueSectors) ? response.data.uniqueSectors : []);
      } catch (error) {
        console.error("Error fetching course data:", error);
        setCoursesError("Failed to load courses.");
        setCourses([]);
        setUniqueSectors([]);
      }
    };
    fetchData();
  }, [backendUrl]);
  const getFilteredCourses = () => {
    if (!Array.isArray(courses)) return [];
    // Start with all courses
    let filtered = [...courses];

    // Then filter by sector if not "all"
    if (activeFilter !== "all") {
      const sectorId = activeFilter.replace("id_", "");
      console.log("Filtering by sector ID:", sectorId);

      filtered = filtered.filter(course => {
        if (!course.sectors || !Array.isArray(course.sectors)) {
          return false;
        }

        const hasMatchingSector = course.sectors.some(s => s && s.toString() === sectorId);
        return hasMatchingSector;
      });

      console.log("After sector filter, courses count:", filtered.length);
    }

    // Then filter by search term if it exists
    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      // console.log("Filtering by search term:", term);

      filtered = filtered.filter(course => {
        const nameMatch = course.name && course.name?.toLowerCase().includes(term);
        const qualificationMatch = course.qualification && course.qualification?.toLowerCase().includes(term);
        const durationMatch = course.duration && course.duration?.toLowerCase().includes(term);
        const cityMatch = course.city && course.city?.toLowerCase().includes(term);
        const stateMatch = course.state && course.state?.toLowerCase().includes(term);
        const modeMatch = course.trainingMode && course.trainingMode?.toLowerCase().includes(term);
        const typeMatch = course.courseType && course.courseType?.toLowerCase().includes(term);
        const sectorMatch = course.sectorNames && course.sectorNames?.some(name =>
          name.toLowerCase().includes(term)
        );

        return nameMatch || qualificationMatch || durationMatch || cityMatch ||
          stateMatch || modeMatch || typeMatch || sectorMatch;
      });

      console.log("After search filter, courses count:", filtered.length);
    }
    // âœ… Filter by Fee Type (Paid/Free)
    if (feeFilter !== "all") {
      filtered = filtered.filter(course => course.courseFeeType?.toLowerCase() === feeFilter);
    }

    console.log("Final filtered courses count:", filtered.length);
    return filtered;
  };


  const filteredCourses = getFilteredCourses();
  console.log("filteredCourses",filteredCourses)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setJobsError("");
        let response;
        try {
          response = await axios.get(`${backendUrl}/joblisting`);
        } catch (err) {
          response = await axios.get("/joblisting");
        }
        setJobs(Array.isArray(response.data.recentJobs) ? response.data.recentJobs : []);
        console.log("Response", response.data.recentJobs);
      } catch (error) {
        console.error("Error fetching job listing:", error);
        setJobsError("Failed to load jobs.");
        setJobs([]);
      }
    };
    fetchData();
  }, [backendUrl]);

  useEffect(() => {
    const videoModal = document.getElementById("videoModal");
    if (videoModal) {
      videoModal.addEventListener("hidden.bs.modal", () => {
        setVideoSrc(""); // âœ… Resets video when modal is fully closed
      });
    }
    return () => {
      if (videoModal) {
        videoModal.removeEventListener("hidden.bs.modal", () => setVideoSrc(""));
      }
    };
  }, []);

  useEffect(() => {
    const wrap = indiaMapSectionRef.current;
    const el = indiaMapElRef.current;
    if (!wrap || !el) return undefined;

    const destroyMap = () => {
      if (indiaLeafletMapRef.current) {
        try {
          indiaLeafletMapRef.current.remove();
        } catch {
          /* map already detached */
        }
        indiaLeafletMapRef.current = null;
      }
    };

    let io;
    let started = false;
    let resizeHandler;

    const initMap = () => {
      if (started || indiaLeafletMapRef.current) return;
      started = true;

      const map = L.map(el, {
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: false,
        maxBounds: INDIA_MAX_BOUNDS,
        maxBoundsViscosity: 1.0,
        center: [22.5, 80.0],
        zoom: 5,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "",
        subdomains: "abcd",
        maxZoom: 19,
        noWrap: true,
      }).addTo(map);

      const markers = WORK_LOCATIONS.map((loc, i) => {
        const icon = L.divIcon({
          className: "foc-leaflet-pin-wrap",
          html: `<div class="foc-leaflet-pin" style="animation-delay:${i * 0.12}s"><span class="foc-leaflet-pin-dot"></span><span class="foc-leaflet-pin-ring" style="animation-delay:${i * 0.12}s"></span></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        const m = L.marker([loc.lat, loc.lng], { icon }).addTo(map);
        m.bindPopup(
          `<strong style="font-family:Orbitron,system-ui,sans-serif;font-size:13px">${loc.label}</strong><br/><span style="font-size:12px;opacity:.9">${loc.sub}</span>`
        );
        return m;
      });

      const fitFullIndia = () => {
        const size = map.getSize();
        const w = el.clientWidth || size.x || 800;
        const h = el.clientHeight || size.y || 320;
        const aspect = w / Math.max(h, 1);
        /* Wide + short viewports need large vertical padding so fitBounds picks a lower zoom (full Nâ€“S India). */
        const padCornerY = Math.min(120, Math.max(48, Math.round(h * 0.22)));
        const padCornerX = Math.min(72, Math.max(24, Math.round(20 + aspect * 5)));
        map.fitBounds(INDIA_MAX_BOUNDS, {
          paddingTopLeft: [padCornerX, padCornerY],
          paddingBottomRight: [padCornerX, padCornerY],
          animate: false,
        });
        const floor = 3;
        let z = map.getZoom();
        if (z > floor) {
          map.setZoom(z - 1);
        }
        if (aspect > 2.4 && map.getZoom() > floor) {
          map.setZoom(map.getZoom() - 1);
        }
        map.setMinZoom(Math.max(map.getZoom() - 1, floor));
        map.setMaxZoom(12);
        map.panInsideBounds(INDIA_MAX_BOUNDS, { animate: false });
      };

      fitFullIndia();

      requestAnimationFrame(() => {
        map.invalidateSize();
        requestAnimationFrame(() => {
          map.invalidateSize();
          fitFullIndia();
        });
      });

      indiaLeafletMapRef.current = map;

      resizeHandler = () => {
        map.invalidateSize();
        fitFullIndia();
      };
      window.addEventListener("resize", resizeHandler);
    };

    io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          initMap();
          io?.disconnect();
        }
      },
      { rootMargin: "120px 0px", threshold: 0.05 }
    );
    io.observe(wrap);

    return () => {
      io?.disconnect();
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
      }
      destroyMap();
    };
  }, []);

  const checkRegistrationStatus = (eventDate) => {
    const today = moment();
    const eventEndDate = moment(eventDate);
    return eventEndDate.isBefore(today);
  };

  const getFullUrl = (filePath) => {
    if (!filePath) return "";
    // Already contains full bucket URL
    if (filePath.startsWith(bucketUrl)) return filePath;
    // Is relative path, so prepend bucket URL
    return `${bucketUrl}/${filePath}`;
  };

  const pillarUi = PILLAR_UI[activeArea];
  const hoveredGovtAreaItem = currentGovtArea?.items?.[hoveredGovtAreaItemIdx ?? -1] ?? null;
  const govtAreaVisual = hoveredGovtAreaItem?.img ?? hoveredGovtAreaItem?.icon ?? currentGovtArea?.emoji ?? "ðŸ“£";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/event`);
        console.log("events", response.data.events)

        response.data.events.forEach(event => {
          const fromDate = moment(event.timing.from).format('DD-MM-YYYY');
          const fromTime = moment(event.timing.from).format('hh:mm A');
          const toDate = moment(event.timing.to).format('DD-MM-YYYY');
          const toTime = moment(event.timing.to).format('hh:mm A');
        });
        setEvents(response.data.events);

      } catch (error) {
        console.error("Error fetching events data:", error);
      }
    };
    fetchData();
  }, []);


  const scrollToCoreArea = (areaKey) => {
    if (areaKey) setActiveArea(areaKey);
    const el = document.getElementById("core");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <FrontLayout>
      <div className="foc-cyber-home">
        <section className="hero grid-bg" id="hero">
          <div className="hero-orb1" />
          <div className="hero-orb2" />
          <div className="marquee-bar">
          <div className="marquee-track">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <div key={i} className="marquee-item">
                <span className="mdot" />
                {m}
              </div>
            ))}
          </div>
        </div>
          <div className="container">
            <div className="hero-inner">
              <div>
                <div className="hero-topbar">
                  <div className="hero-eyebrow">
                    <span className="pulse" />
                      UNLOCK YOUR FUTURE WITH FOCALYT
                  </div>
                </div>
                <h1 className="hero-h1 hashtag">#Building Future Ready Minds</h1>
                {/* <p className="hero-sub">
                  Future Tech Driven Socio Economic Impact â€” Job Discovery, Skilling &amp; Upskilling, and Future Technology Labs across India.
                </p>  */}
                {/* <div className="hero-pills">
                  {["AI & ML", "Robotics", "Drone Pilot", "IoT", "AR & VR", "Cloud"].map((t) => (
                    <span key={t} className="pill">
                      {t}
                    </span>
                  ))}
                </div> */}
                <div className="hero-btns">
                  <Link to="/joblisting" className="btn-primary">
                    Explore Jobs â†’
                  </Link>
                  <Link to="/courses" className="btn-ghost">
                    Browse Courses
                  </Link>
                </div>
              </div>

              <div className="hero-right">
                <div className="hero-kicker">Future Tech Driven Socio Economic Impact</div>
                
                <div className="hero-tiles" aria-label="Core focus areas">
                  <div className="hero-tiles-inner">
                    {HERO_TILES.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        className="hero-tile"
                        onClick={() => scrollToCoreArea(t.key)}
                        aria-label={`Open ${t.title}`}
                      >
                        <div className="hero-tile-text">
                          {t.title
                            .replace("Future Ready ", "Future Ready\n")
                            .split("\n")
                            .map((line, i) => (
                              <span key={i}>{line}</span>
                            ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <Link to="/contact" className="btn-primary hero-right-cta">
                  Partner with us â†’
                </Link>
              </div>
            </div>
          </div>
        </section>

       

        <section className="section grid-bg" id="about">
          <div className="container">
            <div className="section-head">
              <div className="stag">What We Do</div>
              <h2 className="sh2">
                Four Pillars of <span className="cyan">Impact</span>
              </h2>
              {/* <p className="s-body">From future-ready skills to social impact â€” Focalyt bridges the gap between learning and opportunity.</p> */}
            </div>
            {/* <div className="pillars">
              {PILLARS.map((p) => (
                <div key={p.num} className="pillar">
                  <div className="pillar-num">{p.num}</div>
                  <div className="pillar-icon">{p.icon}</div>
                  <div className="pillar-title">{p.title}</div>
                  <div className="pillar-desc">{p.desc}</div>
                </div>
              ))}
            </div> */}
            {pillarUi && (
              <div className="ip-pillars-wrap" id="core">
                <nav className="ip-tab-nav" aria-label="Impact pillars">
                  {PILLAR_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`ip-tab-btn ${tab.pid}${activeArea === tab.key ? " is-on" : ""}`}
                      onClick={() => setActiveArea(tab.key)}
                      aria-pressed={activeArea === tab.key}
                    >
                      <span className="ip-tab-num">{tab.num}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
                <div className="ip-shell ip-shell-panel">
                <div key={activeArea}>
                  <header className={`ip-hdr ${pillarUi.pid}`}>
                    <div className="ip-hdr-top">
                      <div className="ip-hdr-left">
                        
                        <h3 className="ip-hdr-title">
                          {pillarUi.title}{" "}
                          <span className={`ip-${pillarUi.accentClass}`}>{pillarUi.titleAccent}</span>
                        </h3>
                        <div className="ip-hdr-sub">{pillarUi.sub}</div>
                        <p className="ip-hdr-desc">{pillarUi.desc}</p>
                      </div>
                      <div className="ip-hdr-icons" aria-hidden="true">
                        {pillarUi.headerIcons.map((row, ri) => (
                          <div className="ip-icon-row" key={ri}>
                            {row.map((ic) => (
                              <div className="ip-icon-pill" key={ic.label}>
                                <div className="ip-ic">
                                  <IpIcon name={ic.icon} size={14} />
                                </div>
                                <span>{ic.label}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </header>
                  <div className={`ip-three-col ${pillarUi.pid}`}>
                    <div className="ip-col ip-col--focus">
                      <div className="ip-col-head">
                        <div className="ip-col-ico blue">
                          <IpIcon name="target" size={13} />
                        </div>
                        <div className="ip-col-title">Key Focus Areas</div>
                      </div>
                      <div className="ip-col-body">
                        <ul className="ip-focus-list">
                          {pillarUi.focusAreas.map((f) => (
                            <li key={f.text}>
                              <span className="ip-focus-ico" aria-hidden="true">
                                <IpIcon name={f.icon} size={13} />
                              </span>
                              <span className="ip-focus-text">{f.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="ip-col">
                      <div className="ip-col-head">
                        <div className="ip-col-ico green">
                          <IpIcon name="lightbulb" size={12} />
                        </div>
                        <div className="ip-col-title">Our Approach</div>
                      </div>
                      <div className="ip-col-body">
                        {pillarUi.approach.map((line) => (
                          <div className="ip-check" key={line}>
                            <div className="ip-chk">
                              <IpIcon name="check" size={10} />
                            </div>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="ip-col">
                      <div className="ip-col-head">
                        <div className="ip-col-ico orange">
                          <IpIcon name="linechart" size={12} />
                        </div>
                        <div className="ip-col-title">Impact Snapshot</div>
                      </div>
                      <div className="ip-col-body">
                        {pillarUi.impactSnapshot.map((s) => (
                          <div className="ip-snap" key={s.text}>
                            <div className="ip-snap-ico">
                              <IpIcon name={s.icon} size={12} />
                            </div>
                            <div className="ip-snap-text">{s.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={`ip-sec-head ${pillarUi.pid}`}>
                    <div className="ip-sec-head-ico">
                      <IpIcon name="star" size={10} />
                    </div>
                    <div className="ip-sec-head-label">{pillarUi.projectsLabel}</div>
                  </div>
                  <div className="ip-projects">
                    {pillarUi.projects.map((proj, idx) => (
                      <article
                        className={`ip-proj-card${idx % 2 === 1 ? " ip-proj-card--reverse" : ""}`}
                        key={proj.name}
                      >
                        <div className="ip-photo">
                          <div className={`ip-proj-num ${pillarUi.pid}`}>{proj.num}</div>
                          {proj.img ? (
                            <img
                              src={proj.img}
                              alt={proj.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const ph = e.currentTarget.nextElementSibling;
                                if (ph) ph.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="ip-photo-ph"
                            style={proj.img ? { display: "none" } : undefined}
                          >
                            <ImageIcon size={22} strokeWidth={1.5} />
                            <span>Project visual</span>
                          </div>
                        </div>
                        <div className="ip-card-info">
                          <div className="ip-proj-top">
                            <div className={`ip-proj-logo${proj.logoKey === "panasonic-harit" ? " ip-proj-logo--wide" : ""}`}>
                              <PillarProjectLogo logoKey={proj.logoKey} />
                            </div>
                            <h4 className="ip-proj-name">{proj.name}</h4>
                          </div>
                          <p className="ip-proj-desc">{proj.desc}</p>
                          <div className="ip-chips">
                            <span className={`ip-chip tg ${pillarUi.pid}`}>
                              <IpIcon name="user" size={9} />
                              {proj.chips.target}
                            </span>
                            <span className={`ip-chip cv ${pillarUi.pid}`}>
                              <IpIcon name="target" size={9} />
                              {proj.chips.coverage}
                            </span>
                            <span className={`ip-chip if ${pillarUi.pid}`}>{proj.chips.impact}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className={`ip-impact-row ${pillarUi.pid}`}>
                    {pillarUi.impactRow.map((row) => (
                      <div className="ip-imp-item" key={row.lbl}>
                        <div className="ip-imp-val">{row.val}</div>
                        <div className="ip-imp-lbl">{row.lbl}</div>
                      </div>
                    ))}
                  </div>
                  <div className={`ip-footer ${pillarUi.pid}`}>
                    <div className="ip-footer-tagline">{pillarUi.footerTagline}</div>
                    <div className="ip-footer-tags">
                      {pillarUi.footerTags.map((tag) => (
                        <span className={`ip-ftag ${pillarUi.pid}`} key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* <section className="section section-alt" id="core">
          <div className="container">
            <div className="section-head">
              <div className="stag">Core Areas</div>
              <h2 className="sh2">
                Our <span className="cyan">Core Areas</span>
              </h2>
              <p className="s-body">Comprehensive interventions across four strategic domains for lasting socio-economic impact.</p>
            </div>
            <div className="core-tabs">
              {CORE_AREAS.map((a) => (
                <button key={a.key} type="button" className={`ctab${activeArea === a.key ? " on" : ""}`} onClick={() => setActiveArea(a.key)}>
                  {a.label}
                </button>
              ))}
            </div>
            {currentArea && (
              <div className="area-panel" key={activeArea}>
                <div>
                  <div className="area-badge">{currentArea.badge}</div>
                  <h3 className="area-h">{currentArea.title}</h3>
                  <p className="area-desc">{currentArea.desc}</p>
                  <div className="area-items">
                    {currentArea.items.map((it, i) => (
                      <div
                        key={i}
                        className={`aitem${hoveredAreaItemIdx === i ? " on" : ""}`}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => setHoveredAreaItemIdx(i)}
                        onMouseLeave={() => setHoveredAreaItemIdx(null)}
                        onFocus={() => setHoveredAreaItemIdx(i)}
                        onBlur={() => setHoveredAreaItemIdx(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setHoveredAreaItemIdx(i);
                        }}
                      >
                        <span className="aitem-icon">{it.icon}</span>
                        <div>
                          <strong>{it.title}</strong>
                          <span>{it.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="area-visual">
                  <span key={String(areaVisual)} className="area-visual-emoji">
                    {areaVisual}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>*/}

        <section className="section grid-bg" id="labs">
          <div className="container">
            <div className="section-head">
              <div className="stag">Future Technology Labs</div>
              <h2 className="sh2">
                Labs for <span className="red">Institutes</span>
              </h2>
              <p className="s-body">Cutting-edge technology labs bringing hands-on learning to schools and colleges across India.</p>
            </div>
            <div className="labs-grid">
              {TECH_LABS.map((lab) => (
                <div key={lab.name} className="lab-card">
                  <div className="lab-icon-box">{lab.icon}</div>
                  <div className="lab-name">{lab.name}</div>
                  <div className="lab-desc">{lab.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section grid-bg" id="labsAsService">
          <div></div>
        </section>

        {/* <section className="section grid-bg" id="labsAsService">
          <div className="container">
            <div className="section-head">
              <div className="stag">FFTLaaS Â· AI + Robotics + IoT</div>
              <h2 className="sh2">
                Future Technology Lab as a <span className="red">Service</span>
              </h2>
              <p className="s-body">
                AI + Robotics + IoT for schools â€” world-class lab outcomes without the capital-heavy build-out. Quarterly rhythm, teacher upskilling, and hands-on kits on an annual subscription.
              </p>
            </div>
            <div className="fftl-nep">Integrated with NEP 2020 Â· Future Ready School</div>
            <p className="s-body">
              Focalyt&apos;s Future Technology Lab as a Service (FFTLaaS) democratizes access to advanced learning: your institution runs an immersive AI, Robotics &amp; IoT program with curriculum alignment, expert support, and flexible plans â€” not the typical friction of owning and maintaining a full lab stack alone.
            </p>

            <div className="section-head" style={{ marginTop: 48, marginBottom: 22 }}>
              <h2 className="sh2">
                Curriculum stack â€” <span className="cyan">one integrated lab</span>
              </h2>
            </div>
            <div className="fftl-cute-lab">
              {FFTLAA_TECH_PILLARS.map((t) => (
                <div key={t.name} className="fftl-cute-stack">
                  <div className="fftl-cute-orbit" aria-hidden="true">
                    {t.icon}
                  </div>
                  <div className="fftl-cute-puff">
                    <h4>{t.name}</h4>
                    <p>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="section-head" style={{ marginTop: 48, marginBottom: 22 }}>
              <h2 className="sh2">
                Why schools choose <span className="cyan">FFTLaaS</span>
              </h2>
            </div>
            <div className="fftl-cute-values">
              {FFTLAA_VALUE_PROPS.map((vp) => (
                <div key={vp.title} className="fftl-cute-sticker">
                  <span className="fftl-cute-pin">{vp.icon}</span>
                  <strong>{vp.title}</strong>
                  <p>{vp.desc}</p>
                </div>
              ))}
            </div>

            <div className="fftl-snap fftl-snap--cute" role="list" aria-label="Program snapshot">
              {FFTLAA_PROGRAM_SNAPSHOT.map((row) => (
                <div key={row.k} className="fftl-snap-cell" role="listitem">
                  <div className="fftl-snap-k">{row.k}</div>
                  <div className="fftl-snap-v">{row.v}</div>
                </div>
              ))}
            </div>

            {/* <div className="section-head" style={{ marginTop: 48, marginBottom: 22 }}>
              <h2 className="sh2">
                Partnership journey â€” <span className="red">launching your FFTL</span>
              </h2>
            </div> */}
            {/* <div className="fftl-cute-path">
              {FFTLAA_JOURNEY.map((j) => (
                <div key={j.step} className="fftl-cute-step">
                  <div className="fftl-cute-ball">{j.step}</div>
                  <div className="fftl-cute-bubble">
                    <h4>{j.title}</h4>
                    <p>{j.desc}</p>
                  </div>
                </div>
              ))}
            </div> 
          </div>
        </section> */}

        <section id="ourApproach" className="home-our-approach">
          <OurApproachSection />
        </section>




        {/* <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div className="stag">Skills for Success</div>
              <h2 className="sh2">
                Who Are <span className="cyan">You?</span>
              </h2>
              <p className="s-body">Focalyt serves everyone in the education-to-employment journey. Choose your path below.</p>
            </div>
            <div className="roles-grid">
              {ROLES.map((r) => (
                <Link key={r.name} to={r.href} className="role-card">
                  <div className="role-emoji">{r.emoji}</div>
                  <div className="role-name">{r.name}</div>
                  <div className="role-desc">{r.desc}</div>
                  <div className="role-cta">Access System â†’</div>
                </Link>
              ))}
            </div>
          </div>
        </section> */}

        {/* <section className="section grid-bg csr-ng-section" id="csr">
          <div className="container">
            <div className="csr-poster">
              <header className="csr-poster-head">
                
                <h2 className="csr-poster-h1">
                  Next Generation
                  <br />
                  <span className="csr-poster-h1-accent">CSR Framework</span>
                </h2>
                <div className="csr-poster-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </header>

              <div className="csr-poster-grid">
                <div className="csr-poster-hub" aria-hidden="true">
                  <svg className="csr-poster-hub-svg" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="70" cy="70" r="68" fill="white" stroke="#e8edf5" strokeWidth="2" />
                    <path d="M70 8 A62 62 0 0 1 132 70" stroke="var(--red)" strokeWidth="7" strokeLinecap="round" fill="none" />
                    <path d="M132 70 A62 62 0 0 1 70 132" stroke="#f57c00" strokeWidth="7" strokeLinecap="round" fill="none" />
                    <path d="M70 132 A62 62 0 0 1 8 70" stroke="#2e7d32" strokeWidth="7" strokeLinecap="round" fill="none" />
                    <path d="M8 70 A62 62 0 0 1 70 8" stroke="#1565c0" strokeWidth="7" strokeLinecap="round" fill="none" />
                  </svg>
                  <div className="csr-poster-hub-text">
                    <p className="csr-poster-hub-kicker">
                      Future
                      <br />
                      Ready
                    </p>
                    <p className="csr-poster-hub-title">
                      CSR
                      <br />
                      <span className="cyan">Impact</span>
                    </p>
                  </div>
                </div>

                {["skills", "schools", "msme", "env"].map((key) => {
                  const a = CORE_AREAS.find((x) => x.key === key);
                  if (!a) return null;
                  const theme = key === "skills" ? "red" : key === "schools" ? "blue" : key === "msme" ? "orange" : "green";
                  return (
                    <button
                      key={a.key}
                      type="button"
                      className={`csr-p-card csr-p-card--${theme}${activeArea === a.key ? " is-on" : ""}`}
                      onClick={() => setActiveArea(a.key)}
                      onMouseLeave={() => setHoveredAreaItemIdx(null)}
                    >
                      <div className="csr-p-card-head">
                        <div className="csr-p-icon-circle" aria-hidden="true">
                          {a.emoji}
                        </div>
                        <h3 className="csr-p-card-title">{a.label}</h3>
                      </div>
                      <ul className="csr-p-card-ul">
                        {a.items.slice(0, 3).map((it) => (
                          <li key={it.title}>{it.title}</li>
                        ))}
                      </ul>
                      <div className="csr-p-meta-row">
                        <div className="csr-p-meta-ico csr-p-meta-ico--ben" aria-hidden="true">
                          ðŸ‘¥
                        </div>
                        <div>
                          <div className="csr-p-meta-label">Target Beneficiaries:</div>
                          <ul className="csr-p-meta-ul">
                            {(a.beneficiaries ?? []).map((b) => (
                              <li key={b}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="csr-p-meta-row">
                        <div className="csr-p-meta-ico csr-p-meta-ico--imp" aria-hidden="true">
                          ðŸ“Š
                        </div>
                        <div>
                          <div className="csr-p-meta-label">Expected Impact:</div>
                          <ul className="csr-p-meta-ul">
                            {(a.impact ?? []).map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

            <aside
              className="partner-strip partner-strip--csr"
              data-marquee-dir={marqueeScrollDown ? "rtl" : "ltr"}
              aria-label="CSR and corporate partners"
            >
              <span className="partner-strip-label">CSR &amp; corporate partners</span>
              <div className="partner-strip-wrap">
                <div className="partner-strip-track">
                  {[...CSR_MARQUEE_PARTNERS, ...CSR_MARQUEE_PARTNERS].map((name, i) => (
                    <div key={`csr-marquee-${i}-${name}`} className="partner-strip-item">
                      <span className="partner-strip-dot" aria-hidden="true" />
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
            </div>
          </div>
        </section>

        <section className="section grid-bg" id="govt">
          <div className="container">
            <div className="section-head">
              <h2 className="sh2">
                Govt <span className="cyan">Initiatives</span>
              </h2>
            </div>
            
             <div className="container">
            
            <div className="core-tabs" id="govt-core">
              {GOVT_INITIATIVES_AREAS.map((a) => (
                <button key={a.key} type="button" className={`ctab${activeGovtArea === a.key ? " on" : ""}`} onClick={() => setActiveGovtArea(a.key)}>
                  {a.label}
                </button>
              ))}
            </div>
            {currentGovtArea && (
              <div className="area-panel" key={activeGovtArea}>
                <div>
                  <div className="area-badge">{currentGovtArea.badge}</div>
                  <h3 className="area-h">{currentGovtArea.title}</h3>
                  <p className="area-desc">{currentGovtArea.desc}</p>
                  <div className="area-items">
                    {currentGovtArea.items.map((it, i) => (
                      <div
                        key={i}
                        className={`aitem${hoveredGovtAreaItemIdx === i ? " on" : ""}`}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => setHoveredGovtAreaItemIdx(i)}
                        onMouseLeave={() => setHoveredGovtAreaItemIdx(null)}
                        onFocus={() => setHoveredGovtAreaItemIdx(i)}
                        onBlur={() => setHoveredGovtAreaItemIdx(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setHoveredGovtAreaItemIdx(i);
                        }}
                      >
                        <span className="aitem-icon">{it.icon}</span>
                        <div>
                          <strong>{it.title}</strong>
                          <span>{it.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="area-visual">
                  {typeof govtAreaVisual === "string" && govtAreaVisual.startsWith("/Assets/images/futureready/") ? (
                    <img className="area-visual-img" src={govtAreaVisual} alt={hoveredGovtAreaItem?.title ?? currentGovtArea?.title ?? "Govt initiative"} />
                  ) : (
                    <span key={String(govtAreaVisual)} className="area-visual-emoji">
                      {govtAreaVisual}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

            <aside
              className="partner-strip partner-strip--govt"
              data-marquee-dir={marqueeScrollDown ? "ltr" : "rtl"}
              aria-label="Government and sector partners"
            >
              <span className="partner-strip-label">Government &amp; sector partners</span>
              <div className="partner-strip-wrap">
                <div className="partner-strip-track">
                  {[...GOVT_MARQUEE_PARTNERS, ...GOVT_MARQUEE_PARTNERS].map((name, i) => (
                    <div key={`govt-marquee-${i}-${name}`} className="partner-strip-item">
                      <span className="partner-strip-dot" aria-hidden="true" />
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section> */}

        <section className="section grid-bg" id="events">
          <div className="container">
            <div className="section-head">
              <div className="stag">Latest Updates</div>
              <h2 className="sh2">
                <span className="cyan">Live Events</span>
              </h2>
              <p className="s-body">Explore our latest events and register to participate.</p>
            </div>

            {events.length > 0 ? (
              <div className="course-carousel">
                <button
                  type="button"
                  className="course-carousel-btn course-carousel-btn--prev"
                  aria-label="Scroll events left"
                  onClick={() => scrollEventCarousel(-1)}
                >
                  â€¹
                </button>
                <div className="course-carousel-viewport" ref={eventCarouselRef}>
                  <div className="course-carousel-track">
                    {events.map((event) => {
                        const isRegistrationClosed = checkRegistrationStatus(event.timing.to);
                        
                        return (
                        <div key={event._id} className="event-carousel-item pb-4 card-padd">
                            <div className="card bg-dark courseCard">
                              <div className="bg-img">
                                <a
                                  href="#"
                                  data-bs-toggle="modal"
                                  data-bs-target="#videoModal"
                                  onClick={(e) => {
                                    e.preventDefault(); // âœ… Prevents default link behavior
                                    setVideoSrc(event.video);
                                  }}
                                  className="pointer img-fluid" 
                                >
                                  <img
                                    src={event.thumbnail}
                                    className="digi"
                                    alt={event.name}
                                  />
                                  <img src="/Assets/public_assets/images/newjoblisting/play.svg" alt="Play" className="group1" />
                                </a>

                                <div className="flag">
                                  {/* <h4
                                    className="text-center text-black fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                    title={event.eventTitle}
                                  >
                                    {event.eventType}
                                  </h4> */}
                                </div>
                                <div className="right_obj shadow shadow-new">Event</div>
                                {/* share removed */}
                                <div className="share-Event REMOVED" style={{ display: "none" }}>
                                  <div className="tooltip-container">
                                    <div className="button-content">
                                      <span className="text">Share</span>
                                      <svg
                                        className="share-icon"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        width="20"
                                        height="20"
                                      >
                                        <path
                                          d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="tooltip-content">
                                      <div className="social-icons">
                                        <a href="#" className="social-icon twitter">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            width="20"
                                            height="20"
                                          >
                                            <path
                                              d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
                                            ></path>
                                          </svg>
                                        </a>
                                        <a href="#" className="social-icon facebook">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            width="20"
                                            height="20"
                                          >
                                            <path
                                              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                            ></path>
                                          </svg>
                                        </a>
                                        <a href="#" className="social-icon linkedin">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            width="20"
                                            height="20"
                                          >
                                            <path
                                              d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                                            ></path>
                                          </svg>
                                        </a>
                                        <a href="" className="social-icon linkedin">
                                          <svg
                                            className="share-icon"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 32 32"
                                            width="20"
                                            height="20"
                                          >
                                            <path
                                              d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16.003c0 2.693.704 5.273 2.032 7.567L2 30l6.611-2.673A13.27 13.27 0 0016.003 29.34C23.367 29.34 29.34 23.366 29.34 16.003 29.34 8.64 23.367 2.667 16.003 2.667zm0 24.027a11.58 11.58 0 01-5.893-1.609l-.423-.25-3.929 1.589.75-4.087-.27-.42a11.412 11.412 0 01-1.714-6.047c0-6.37 5.184-11.553 11.554-11.553 6.37 0 11.553 5.183 11.553 11.553 0 6.37-5.183 11.553-11.553 11.553zm6.308-8.518c-.348-.174-2.067-1.02-2.388-1.137-.32-.118-.553-.174-.785.174-.232.348-.898 1.137-1.103 1.372-.205.232-.38.26-.728.087-.347-.174-1.465-.54-2.79-1.72-1.03-.919-1.726-2.054-1.929-2.4-.2-.348-.022-.535.152-.71.156-.156.348-.406.522-.61.174-.2.232-.348.348-.58.116-.232.058-.435-.029-.609-.087-.174-.785-1.9-1.077-2.607-.285-.686-.576-.593-.785-.603l-.668-.012a1.297 1.297 0 00-.938.435c-.32.348-1.218 1.19-1.218 2.899 0 1.709 1.247 3.36 1.42 3.593.174.232 2.457 3.746 5.956 5.25.833.359 1.482.574 1.987.733.835.266 1.596.228 2.196.139.67-.1 2.067-.844 2.359-1.66.292-.814.292-1.51.204-1.66-.087-.145-.32-.232-.668-.406z"
                                              fill="#25D366"
                                            />
                                          </svg>

                                        </a>
                                      </div>
                                    </div>
                                  </div>

                                </div>
                              </div>

                              <div className="card-body px-0 pb-0">
                                <h4
                                  className="text-center text-white fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                  title={event.eventTitle}
                                >
                                  {event.name}
                                </h4>

                                <div className="row" id="event_height">
                                  <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                    <div className="col-xxl-10 col-xl-10 col-lg-10 col-md-10 col-sm-10 col-10 mx-auto mb-2">
                                      <div className="row">
                                        <h4
                                          className="text-center text-white fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                          title={event.eventTitle}
                                        >
                                          {event.eventTitle}
                                        </h4>
                                        <h5 className={`op-Reg text-center ${isRegistrationClosed ? 'text-danger' : ''}`}>
                                          {isRegistrationClosed ? "Registration Closed" : "Registration Open"}
                                        </h5>
                                        <h6
                                          className="text-center text-white fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                          title={event.eventTitle}
                                        >
                                          Event Date:   {moment(event.timing.from).format("DD-MM-YYYY")} &nbsp;
                                          To: {moment(event.timing.to).format("DD-MM-YYYY")}
                                        </h6>

                                        <h6
                                          className="text-center text-white fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                          title={event.eventTitle}
                                        >
                                          Event Time  {moment(event.timing.from).format("hh:mm A")} &nbsp; To: {moment(event.timing.to).format("hh:mm A")}
                                        </h6>

                                        {/* Location */}
                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                          <div className="row">
                                            <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                              <figure className="text-end">
                                                <img
                                                  src="/Assets/public_assets/images/icons/location-pin.png"
                                                  className="img-fluid new_img p-0"
                                                  draggable="false"
                                                />
                                              </figure>
                                            </div>
                                            <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white events_features ps-0">
                                              <p className="mb-0 text-white">Location</p>
                                              <div className="ellipsis-wrapper">
                                                <p
                                                  className="mb-0 text-white para_ellipsis"
                                                  title={event.location.city ? `${event.location.city}, ${event.location.state}` : 'NA'}
                                                >
                                                  <small className="sub_head">
                                                    {event.location.city
                                                      ? `(${event.location.city}, ${event.location.state})`
                                                      : 'NA'}
                                                  </small>
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Mode */}
                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                          <div className="row">
                                            <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                              <figure className="text-end">
                                                <img
                                                  src="/Assets/public_assets/images/icons/job-mode.png"
                                                  className="img-fluid new_img p-0"
                                                  draggable="false"
                                                />
                                              </figure>
                                            </div>
                                            <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white events_features ps-0">
                                              <p className="mb-0 text-white">Mode</p>
                                              <p className="mb-0 text-white">
                                                <small className="sub_head">({event.eventMode})</small>
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2 text-center">
                                          <a
                                            className={`btn cta-callnow btn-bg-color shr--width w-100 ${isRegistrationClosed ? 'disabled opacity-50 cursor-not-allowed' : ''}`}
                                            href={`/candidate/login?returnUrl=/candidate/candidateevent`} 
                                            onClick={(e) => {
                                              if (isRegistrationClosed) e.preventDefault();
                                            }}
                                          >
                                            Apply Now
                                          </a>
                                        </div>
                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2 text-center">
                                          <button className="btn cta-callnow shr--width w-100">
                                            Guidelines
                                          </button>
                                        </div>

                                      </div>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>
                        );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  className="course-carousel-btn course-carousel-btn--next"
                  aria-label="Scroll events right"
                  onClick={() => scrollEventCarousel(1)}
                >
                  â€º
                </button>
              </div>
            ) : (
              <div className="col-12 text-center py-5">
                <h3 className="text-muted">No Events found</h3>
              </div>
            )}

            {expiredEvents.length > 0 && (
              <>
                <div className="section-head" style={{ marginTop: 34 }}>
                  <h2 className="sh2">
                    Expired <span className="red">Events</span>
                  </h2>
                  <p className="s-body">Recent events whose registration is closed.</p>
                </div>

                <div className="events-grid">
                  {expiredEvents.map((event) => {
                    const closed = true;
                    const dateFrom = event?.timing?.from ? moment(event.timing.from).format("DD-MM-YYYY") : "NA";
                    const dateTo = event?.timing?.to ? moment(event.timing.to).format("DD-MM-YYYY") : "NA";
                    const timeFrom = event?.timing?.from ? moment(event.timing.from).format("hh:mm A") : "NA";
                    const timeTo = event?.timing?.to ? moment(event.timing.to).format("hh:mm A") : "NA";
                    const loc = event?.location?.city ? `${event.location.city}, ${event.location.state}` : "NA";
                    const mode = event?.eventMode ?? "NA";

                    return (
                      <div key={event?._id ?? `${event?.name}-${dateFrom}-expired`} className="event-card">
                        <div className="event-thumb">
                          <img src={event?.thumbnail ?? "/Assets/public_assets/images/newjoblisting/digital_marketing.jpg"} alt={event?.name ?? "Event"} />
                          <div className="event-status closed">Registration Closed</div>
                        </div>

                        <div className="event-body">
                          <div className="event-title" title={event?.eventTitle ?? event?.name}>
                            {event?.name ?? "Event"}
                          </div>
                          <div className="event-subtitle" title={event?.eventTitle}>
                            {event?.eventTitle ?? ""}
                          </div>

                          <div className="event-meta">
                            <div className="m">
                              <strong>Date</strong>
                              <span>
                                {dateFrom} â†’ {dateTo}
                              </span>
                            </div>
                            <div className="m">
                              <strong>Time</strong>
                              <span>
                                {timeFrom} â†’ {timeTo}
                              </span>
                            </div>
                            <div className="m">
                              <strong>Location</strong>
                              <span title={loc}>{loc}</span>
                            </div>
                            <div className="m">
                              <strong>Mode</strong>
                              <span>{mode}</span>
                            </div>
                          </div>

                          <div className="event-actions">
                            <Link to="/event" className="btn-secondary">
                              View Details
                            </Link>
                            <a
                              className={`btn-primary${closed ? " disabled" : ""}`}
                              href={`/candidate/login?returnUrl=/candidate/candidateevent`}
                              onClick={(e) => {
                                if (closed) e.preventDefault();
                              }}
                            >
                              Apply Now â†’
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ marginTop: 18, textAlign: "center" }}>
              <Link to="/event" className="btn-ghost">
                View all events â†’
              </Link>
            </div>
          </div>
        </section>

        <section className="section section-alt" id="impact">
          <div className="container">
            <div className="section-head">
              <div className="stag">Impact</div>
              <h2 className="sh2">
                Our <span className="cyan">Impact</span> &amp; <span className="red">Partners</span>
              </h2>
              <p className="s-body">A snapshot of outcomes delivered with government, CSR and institutional partners.</p>
            </div>

            <div className="reach-grid">
              {IMPACT_NUMBERS.map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="sc-num">{s.num}</div>
                  <div className="sc-lbl">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="states-wrap" style={{ marginTop: 18 }}>
              <div className="states-head">Clients &amp; Partners</div>
              <div className="partners-flex" style={{ marginTop: 14 }}>
                {IMPACT_PARTNERS.map((p) => (
                  <div key={p} className="partner-chip">
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="section grid-bg" id="future-courses">
          <div className="container">
            <div className="section-head">
              <div className="stag">Future Ready</div>
              <h2 className="sh2">
                Live <span className="cyan">Courses</span>
              </h2>
              <p className="s-body">Pick a course track and start building job-ready skills.</p>
            </div>

            {courses.length > 0 ? (
              <div className="course-carousel">
                <button
                  type="button"
                  className="course-carousel-btn course-carousel-btn--prev"
                  aria-label="Scroll courses left"
                  onClick={() => scrollCourseCarousel(-1)}
                >
                  â€¹
                </button>
                <div className="course-carousel-viewport" ref={courseCarouselRef}>
                  <div className="course-carousel-track">
                    {courses.map((course, courseShellIdx) => (
                      <div
                        key={course._id}
                        className={`course-carousel-item pb-4 card-padd course-card-shell course-card-shell--${courseShellIdx % 4}`}
                      >
                          <div className="card bg-dark courseCard">
                            <div className="bg-img">
                              {/* <a
                              href="#"
                              data-bs-target="#videoModal"
                              data-bs-toggle="modal"
                              data-bs-link={course.videos && course.videos[0] ? `${bucketUrl}/${course.videos[0]}` : ""}
                              className="pointer img-fluid"
                            >
                              <img
                                src={course.thumbnail
                                  ? `${bucketUrl}/${course.thumbnail}`
                                  : "/Assets/public_assets/images/newjoblisting/course_img.svg"}
                                className="digi"
                                alt={course.name}
                              />
                              <img
                                src="/Assets/public_assets/images/newjoblisting/play.svg"
                                alt="Play"
                                className="group1"
                              />
                            </a> */}
                              <a
                                href="#"
                                data-bs-toggle="modal"
                                data-bs-target="#videoModal"
                                onClick={(e) => {
                                  e.preventDefault(); // âœ… Prevents default link behavior
                                  setVideoSrc(course.videos && course.videos[0] ? getFullUrl(course.videos[0]) : "");

                                }}
                                className="pointer img-fluid"
                              >
                                <img
                                  src={course.thumbnail ? getFullUrl(course.thumbnail) : "/Assets/public_assets/images/newjoblisting/course_img.svg"}
                                  className="digi"
                                  alt={course.name}
                                />
                                <img src="/Assets/public_assets/images/newjoblisting/play.svg" alt="Play" className="group1" />
                              </a>


                              <div className="flag"></div>
                              <div className="right_obj shadow shadow-new">
                                {course.courseType === 'coursejob' ? 'Course + Jobs' : 'Course'}
                              </div>
                            </div>

                            <div className="card-body px-0 pb-0">
                              <h4
                                className="text-center text-white fw-bolder mb-2 mx-auto text-capitalize ellipsis"
                                title={course.name}
                              >
                                {course.name}
                              </h4>

                              <div className="row" id="course_height">
                                <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                  <div className="col-xxl-10 col-xl-10 col-lg-10 col-md-10 col-sm-10 col-10 mx-auto mb-2">
                                    <div className="row">
                                      {/* Eligibility */}
                                      <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                        <div className="row">
                                          <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                            <figure className="text-end">
                                              <img
                                                src="/Assets/public_assets/images/icons/eligibility.png"
                                                className="img-fluid new_img p-0"
                                                draggable="false"
                                              />
                                            </figure>
                                          </div>
                                          <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">
                                            <p className="mb-0 text-white">Eligibility</p>
                                            <p className="mb-0 text-white">
                                              <small className="sub_head">({course.qualification})</small>
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Duration */}
                                      <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                        <div className="row">
                                          <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                            <figure className="text-end">
                                              <img
                                                src="/Assets/public_assets/images/icons/duration.png"
                                                className="img-fluid new_img p-0"
                                                draggable="false"
                                              />
                                            </figure>
                                          </div>
                                          <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">
                                            <p className="mb-0 text-white">Duration</p>
                                            <p className="mb-0 text-white">
                                              <small className="sub_head">({course.duration})</small>
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Location */}
                                      <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                        <div className="row">
                                          <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                            <figure className="text-end">
                                              <img
                                                src="/Assets/public_assets/images/icons/location-pin.png"
                                                className="img-fluid new_img p-0"
                                                draggable="false"
                                              />
                                            </figure>
                                          </div>
                                          <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">
                                            <p className="mb-0 text-white">Location</p>
                                            <div className="ellipsis-wrapper">
                                              <p
                                                className="mb-0 text-white para_ellipsis"
                                                title={course.city ? `${course.city}, ${course.state}` : 'NA'}
                                              >
                                                <small className="sub_head">
                                                  {course.city
                                                    ? `(${course.city}, ${course.state})`
                                                    : 'NA'}
                                                </small>
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Mode */}
                                      <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                        <div className="row">
                                          <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                            <figure className="text-end">
                                              <img
                                                src="/Assets/public_assets/images/icons/job-mode.png"
                                                className="img-fluid new_img p-0"
                                                draggable="false"
                                              />
                                            </figure>
                                          </div>
                                          <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">
                                            <p className="mb-0 text-white">Mode</p>
                                            <p className="mb-0 text-white">
                                              <small className="sub_head">({course.trainingMode})</small>
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Last Date */}
                                      <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-2 text-center">
                                        <div className="row">
                                          <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 my-auto">
                                            <p className="text-white apply_date">Last Date for apply</p>
                                          </div>
                                          <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 text-white courses_features ps-0">
                                            <p className="color-yellow fw-bold">
                                              {course.lastDateForApply
                                                ? moment(course.lastDateForApply).utcOffset("+05:30").format('MMM DD YYYY')
                                                : 'NA'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>


                                      {/* Action Buttons */}
                                      <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 mb-2 me-2 text-center">
                                        <a
                                          className="btn cta-callnow btn-bg-color shr--width"
                                          href={`/candidate/login?returnUrl=/candidate/course/${course._id}`}
                                        >
                                          Apply Now
                                        </a>
                                      </div>
                                      {/* <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-4 col-sm-4 col-4 mb-2 text-center">
                                        <a href="https://wa.me/918699017301?text=hi" className="btn cta-callnow shr--width">
                                          Chat Now
                                        </a>
                                      </div> */}
                                      {/* <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-4 col-sm-4 col-4 mb-2 text-center">
                                      <button  onClick={() => openChatbot()}   className="btn cta-callnow shr--width">
                                          Chat Now
                                        </button>
                                      </div>   */}
                                      
                                      <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 mb-2 ms-2 text-center">
                                        <button
                                          onClick={() => handleShare(course, course._id, course.name, course.thumbnail)} className="btn cta-callnow shr--width">
                                          {/* <Share2 size={16} className="mr-1" /> */}
                                          Share
                                        </button>
                                      </div>
                                      <div className="col-xxl-12 col-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                        <div className="row pt-2">
                                          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 justify-content-center align-items-center text-center">
                                            <a href="#" data-bs-toggle="modal" data-bs-target="#callbackModal">
                                              <span
                                                className="learnn btn cta-callnow w-100"
                                                style={{ padding: "10px 14px", cursor: "pointer" }}
                                                onClick={() => setFormData({ ...formData, courseName: course.name,sectorName:course.sectorNames,projectName:course.projectName,typeOfProject:course.typeOfProject })}
                                              >
                                                Request for Call Back
                                              </span>

                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Footer */}
                              <div className="col-xxl-12 col-12 col-lg-12 col-md-12 col-sm-12 col-12 course_card_footer">
                                <div className="row py-2">
                                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 justify-content-center align-items-center text-center">
                                    <a href={`/candidate/login?returnUrl=/candidate/course/${course._id}`}>
                                      <span className="learnn pt-1 text-white">Learn More</span>
                                      <img src="/Assets/public_assets/images/link.png" className="align-text-top" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="course-carousel-btn course-carousel-btn--next"
                  aria-label="Scroll courses right"
                  onClick={() => scrollCourseCarousel(1)}
                >
                  â€º
                </button>
              </div>
            ) : (
              <div className="col-12 text-center py-5">
                <h3 className="text-muted">{coursesError || "No courses found matching your criteria"}</h3>
                <p>{coursesError ? "Please check backend API is running." : "Try adjusting your search or filters to find more courses"}</p>
              </div>
            )}
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <Link to="/courses" className="btn-ghost">
                View all courses â†’
              </Link>
            </div>
          </div>
        </section>

        <section className="section grid-bg" id="future-jobs">
          <div className="container">
            <div className="section-head">
              <div className="stag">Future Ready</div>
              <h2 className="sh2">
                Live <span className="cyan">Jobs</span>
              </h2>
              <p className="s-body">Featured openings from our job board â€” apply or explore the full list.</p>
            </div>

            <div className="row">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <div key={job._id} className="col-lg-4 col-md-6 col-sm-12 col-12 pb-4 card-padd">
                    <div className="card bg-dark courseCard">
                      <div className="bg-img">
                        <a
                          href="#"
                          data-bs-toggle="modal"
                          data-bs-target="#videoModal"
                          onClick={(e) => {
                            e.preventDefault();
                            if (job.jobVideo) {
                              setVideoSrc(job.jobVideo);
                            } else {
                              setVideoSrc("");
                            }
                          }}
                          className="pointer img-fluid"
                        >
                          <div
                            className="verified-badge-container"
                            style={{ position: "absolute", top: "10px", right: "10px", width: "60px", height: "60px", zIndex: "10" }}
                          >
                            <span className="wave-ring wave-1"></span>
                            <span className="wave-ring wave-2"></span>
                            <span className="wave-ring wave-3"></span>
                            <img src="/Assets/public_assets/images/verified.png" className="digi verified-badge" alt="" />
                          </div>
                          <img
                            src={job.jobVideoThumbnail ? `${job.jobVideoThumbnail}` : "/Assets/public_assets/images/newjoblisting/course_img.svg"}
                            className="digi"
                            alt={job.title || job.name || "Job"}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/Assets/public_assets/images/newjoblisting/course_img.svg";
                            }}
                          />
                          <img src="/Assets/public_assets/images/newjoblisting/play.svg" alt="Play" className="group1" />
                        </a>
                        <div className="flag"></div>
                        <div className="right_obj shadow shadow-new">
                          {job.courseType === "coursejob" ? "Course + Jobs" : "Jobs"}
                        </div>
                      </div>

                      <div className="card-body px-0 pb-0">
                        <h4
                          className="text-center course-title text-white fw-bolder text-truncate text-capitalize ellipsis mx-auto"
                          style={{ fontSize: "25px!important", fontWeight: "700!important" }}
                        >
                          {job.title}
                        </h4>
                        <h5
                          className="text-center text-white companyname mb-2 mx-auto text-capitalize ellipsis"
                          title={job.name}
                        >
                          ({job.displayCompanyName})
                        </h5>
                        {(job.isFixed && job.amount) || (!job.isFixed && job.min && job.max) ? (
                          <p className="text-center digi-price mb-3 mt-3">
                            <span className="rupee text-white">â‚¹ &nbsp;</span>
                            <span className="r-price text-white">
                              {job.isFixed ? job.amount || "--" : job.min && job.max ? `${job.min}-${job.max}` : "--"}
                            </span>
                          </p>
                        ) : (
                          <p className="text-center digi-price mb-3 mt-3">
                            <span className="r-price text-white">--</span>
                          </p>
                        )}

                        <div className="row">
                          <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                            <div className="col-xxl-10 col-xl-10 col-lg-10 col-md-10 col-sm-10 col-10 mx-auto mb-2">
                              <div className="row">
                                <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                  <div className="row">
                                    <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                      <figure className="text-end">
                                        <img
                                          src="/Assets/public_assets/images/newjoblisting/qualification.png"
                                          className="img-fluid new_img p-0"
                                          draggable="false"
                                          alt=""
                                        />
                                      </figure>
                                    </div>
                                    <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">
                                      <p className="mb-0 text-white" title={job._qualification?.name || "N/A"}>
                                        {job._qualification?.name || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                  <div className="row">
                                    <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                      <figure className="text-end">
                                        <img
                                          src="/Assets/public_assets/images/newjoblisting/fresher.png"
                                          className="img-fluid new_img p-0"
                                          draggable="false"
                                          alt=""
                                        />
                                      </figure>
                                    </div>
                                    <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">
                                      <p className="mb-0 text-white" title={jobExperienceLabel(job)}>
                                        {jobExperienceLabel(job)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                  <div className="row">
                                    <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                      <figure className="text-end">
                                        <img
                                          src="/Assets/public_assets/images/icons/location-pin.png"
                                          className="img-fluid new_img p-0"
                                          draggable="false"
                                          alt=""
                                        />
                                      </figure>
                                    </div>
                                    <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">
                                      <div className="ellipsis-wrapper">
                                        <p
                                          className="mb-0 text-white"
                                          title={job.city ? `${job.city.name}, ${job.state?.name || ""}` : "NA"}
                                        >
                                          {job.city ? `(${job.city.name}, ${job.state?.name || "NA"})` : "NA"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                  <div className="row">
                                    <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                      <figure className="text-end">
                                        <img
                                          src="/Assets/public_assets/images/newjoblisting/onsite.png"
                                          className="img-fluid new_img p-0"
                                          draggable="false"
                                          alt=""
                                        />
                                      </figure>
                                    </div>
                                    <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">
                                      <p className="mb-0 text-white" title={job.work || "N/A"}>
                                        {job.work}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-2 text-center">
                                  <div className="row">
                                    <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 my-auto">
                                      <p className="text-white apply_date">Last Date for apply</p>
                                    </div>
                                    <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 text-white courses_features ps-0">
                                      <p className="color-yellow fw-bold">
                                        {job.validity
                                          ? moment(job.validity).utcOffset("+05:30").format("DD MMM YYYY")
                                          : "NA"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 mb-2 text-center me-1">
                                  <a
                                    className="btn cta-callnow btn-bg-color shr--width"
                                    href={`/candidate/login?returnUrl=/candidate/job/${job._id}`}
                                  >
                                    Apply Now
                                  </a>
                                </div>
                                <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 mb-2 text-center ms-2">
                                  <button
                                    type="button"
                                    onClick={() => handleShareJob(job._id, job.title || job.name)}
                                    className="btn cta-callnow shr--width"
                                  >
                                    Share
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-xxl-12 col-12 col-lg-12 col-md-12 col-sm-12 col-12 course_card_footer">
                          <div className="row py-2">
                            <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 justify-content-center align-items-center text-center">
                              <a href={`/candidate/login?returnUrl=/candidate/job/${job._id}`}>
                                <span className="learnn pt-1 text-white">Learn More</span>
                                <img src="/Assets/public_assets/images/link.png" className="align-text-top" alt="" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5">
                  <h3 className="text-muted">{jobsError || "No jobs to show right now"}</h3>
                  <p>
                    {jobsError
                      ? "Please check that the job listing API is running."
                      : "New openings will appear here when available."}
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: 18, textAlign: "center" }}>
              <Link to="/joblisting" className="btn-ghost">
                View all jobs â†’
              </Link>
            </div>
          </div>
        </section>

        <section className="section section-alt" id="geographic-reach" ref={indiaMapSectionRef}>
          <div className="container">
            <div className="section-head">
              <div className="stag">Pan India</div>
              <h2 className="sh2">
                Where We <span className="cyan">Work</span>
              </h2>
             
            </div>
            <div className="foc-india-map-card">
              <div ref={indiaMapElRef} className="foc-india-map-inner" aria-label="Map of India with Focalyt presence markers" />
            </div>
            <div className="foc-map-legend">
              {WORK_LOCATIONS.map((loc) => (
                <span key={loc.id} className="foc-map-legend-chip">
                  {loc.label}
                </span>
              ))}
            </div>
            <p className="foc-map-attrib">
              Map data Â©{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer noopener">
                OpenStreetMap
              </a>{" "}
              contributors Â· Tiles Â©{" "}
              <a href="https://carto.com/attributions" target="_blank" rel="noreferrer noopener">
                CARTO
              </a>
            </p>
          </div>
        </section>

        <section className="section grid-bg" id="partner-with-us">
          <div className="container">
            <div className="section-head">
              <div className="stag">Partnerships</div>
              <h2 className="sh2">
                Partner With Us For <span className="red">Futureâ€“Tech</span> <span className="cyan">Driven Impact</span>
              </h2>
              <p className="s-body">
                Co-design measurable programmes with our delivery teams â€” from future-ready skills and on-campus labs to CSR,
                MSME adoption and sustainability â€” backed by the same government, industry and institutional network highlighted
                across our profile.
              </p>
            </div>

            <div className="partner-with-grid">
              {PILLARS.map((p) => (
                <div key={p.num} className="partner-with-card">
                  <div className="pwc-ico" aria-hidden="true">
                    {p.icon}
                  </div>
                  <div className="pwc-title">{p.title}</div>
                  <p className="pwc-desc">{p.desc}</p>
                </div>
              ))}
            </div>

            <div className="partner-with-highlights">
              {PARTNER_PROFILE_HIGHLIGHTS.map((line, i) => (
                <div key={`pwh-${i}`} className="pwh-item">
                  <span className="pwh-dot" aria-hidden="true" />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <div className="cta-block" style={{ marginTop: 36 }}>
              <h2 className="cta-h">
                Let&apos;s build your next
                <br />
                programme together
              </h2>
              <p className="cta-sub">
                Future Ready Skills Â· Future Ready Schools Â· Future Ready MSME Â· Future Ready Environment
              </p>
              <div className="cta-btns">
                <Link to="/contact" className="btn-primary">
                  Partner with us â†’
                </Link>
                <Link to="/candidate/login" className="btn-ghost">
                  Candidate login
                </Link>
                <a href="mailto:parveen.bansal@focalyt.com" className="btn-ghost">
                  Email us
                </a>
              </div>
              <p className="cta-contact">For proposals and collaborations â€” we typically respond within 2â€“3 business days.</p>
            </div>
          </div>
        </section>
        {/* <section className="section grid-bg">
          <div className="container">
            <div className="section-head">
              <div className="stag">Why Focalyt</div>
              <h2 className="sh2">
                Why Choose <span className="cyan">Focalyt?</span>
              </h2>
              <p className="s-body">Backed by IIT expertise, government certifications, and 50,000+ success stories across India.</p>
            </div>
            <div className="why-grid">
              {WHY.map((w) => (
                <div key={w.title} className="why-card">
                  <div className="why-icon">{w.icon}</div>
                  <div className="why-title">{w.title}</div>
                  <div className="why-desc">{w.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* <section className="section section-alt" id="projects">
          <div className="container">
            <div className="section-head">
              <div className="stag">Live Projects</div>
              <h2 className="sh2">
                Projects Driving <span className="red">Real Impact</span>
              </h2>
              <p className="s-body tect-center">Executed across India â€” from Samsung campuses to tribal villages in Uttarakhand.</p>
            </div>
            <div className="projects-grid">
              {PROJECTS.map((p, i) => (
                <div key={i} className="proj-card">
                  <div className="proj-partner">{p.partner}</div>
                  <div className="proj-title">{p.title}</div>
                  <div className="proj-meta">
                    <div className="proj-row">
                      <strong>Tech</strong>
                      {p.tech}
                    </div>
                    <div className="proj-row">
                      <strong>For</strong>
                      {p.target}
                    </div>
                    <div className="proj-row">
                      <strong>Where</strong>
                      {p.locations}
                    </div>
                    <div className="proj-row">
                      <strong>Impact</strong>
                      {p.impact}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* <section className="section grid-bg" id="reach">
          <div className="container">
            <div className="section-head">
              <div className="stag">Our Reach</div>
              <h2 className="sh2">
                Impact at <span className="cyan">Scale</span>
              </h2>
              <p className="s-body">Pan India presence with no geographical boundaries for project interventions.</p>
            </div>
            <div className="reach-grid">
              {STATS.map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="sc-num">{s.num}</div>
                  <div className="sc-lbl">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="states-wrap">
              <div className="states-head">// Geographical Presence â€” 11+ States</div>
              <div className="states-chips">
                {STATES.map((s) => (
                  <span key={s} className="state-chip">
                    {s}
                  </span>
                ))}
              </div>
              <div className="states-note">No geographical boundaries for project interventions.</div>
            </div>
          </div>
        </section> */}

        {/* <section className="section section-alt" id="partners">
          <div className="container">
            <div className="section-head">
              <div className="stag">Our Partners</div>
              <h2 className="sh2">
                Trusted by <span className="cyan">Leading Institutions</span>
              </h2>
              <p className="s-body">SIC partners, institutional collaborators, and industry networks across North India.</p>
            </div>
            <div className="partners-flex">
              {SIC_PARTNERS.map((p) => (
                <div key={p} className="partner-chip">
                  {p}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section grid-bg">
          <div className="container">
            <div className="cta-block">
              <h2 className="cta-h">
                PARTNER WITH US FOR
                <br />
                FUTURE TECH DRIVEN IMPACT
              </h2>
              <p className="cta-sub">Future Ready Skills Â· Future Ready Schools Â· Future Ready MSME Â· Future Ready Environment</p>
              <div className="cta-btns">
                <Link to="/candidate/login" className="btn-primary">
                  Get Started â†’
                </Link>
                <a href="mailto:parveen.bansal@focalyt.com" className="btn-ghost">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section> */}

        <div className="foc-theme-fab-wrap" ref={themeFabRef}>
          <div className="foc-theme-fab__track">
            {themePanelOpen && (
              <div className="foc-theme-panel" role="listbox" aria-label="Homepage appearance theme">
                <div className="foc-theme-panel__group">Light</div>
                {FOC_HOME_THEMES.filter((t) => t.tone === "light").map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="option"
                    aria-selected={focTheme === t.id}
                    className={`foc-theme-option${focTheme === t.id ? " is-active" : ""}`}
                    onClick={() => {
                      setFocTheme(t.id);
                      setThemePanelOpen(false);
                    }}
                  >
                    {t.label}
                  </button>
                ))}
                <div className="foc-theme-panel__group">Dark</div>
                {FOC_HOME_THEMES.filter((t) => t.tone === "dark").map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="option"
                    aria-selected={focTheme === t.id}
                    className={`foc-theme-option${focTheme === t.id ? " is-active" : ""}`}
                    onClick={() => {
                      setFocTheme(t.id);
                      setThemePanelOpen(false);
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <span className="foc-theme-fab__label" id="foc-theme-fab-label">
              Theme
            </span>
            <button
              type="button"
              className="foc-theme-fab__btn"
              aria-expanded={themePanelOpen}
              aria-haspopup="listbox"
              aria-labelledby="foc-theme-fab-label"
              onClick={() => setThemePanelOpen((o) => !o)}
            >
              <span className="theme-dot" aria-hidden />
              <span className="foc-theme-fab__btn-text">
                {FOC_HOME_THEMES.find((t) => t.id === focTheme)?.label ?? focTheme}
              </span>
              <span className="foc-theme-fab__chev" aria-hidden />
            </button>
          </div>
        </div>

<style>
          {
            `
            
.bg-img {
    position: relative;
    border-radius: 11px;
    border: 1px solid #ffffff;
    box-shadow: rgb(227, 59, 22, 77%) 0px 0px 0.25em, rgba(24, 86, 201, 0.05) 0px 0.25em 1em;
}
img.group1 {
    width: 75px !important;
    height: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
.course_card_footer img {
    width: 20px;
}
.courses_features p {
    line-height: normal;
    font-size: 16px;
}
.color-yellow {
    color: #FFD542;
}
.btn.shr--width{
  width: 100%;
}
.btn.cta-callnow {
    background: #fff;
    color: #FC2B5A;
    font-family: inter;
    border-radius: 50px;
    font-weight: 500;
    padding: 10px 4px;
    width: 120%;
    font-size: 12px;
    letter-spacing: 1px;
    transition: .3s;
}
.btn.cta-callnow:hover {
    transition: .5s;
    background: #FC2B5A;
    color: #fff;
}
.learnn{
  padding: 10px 14px;
}
.course_card_footer {
    background: #FC2B5A;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
}
.jobs h1 {
    color: #FC2B5A;
    font-size: 45px;
    font-weight: 700;
    font-family: 'INTER', sans-serif;
}

.courseCard{
  border-radius: 12px!important;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
}
video#courseVid {
    width: 100%;
    height: 100%;
    border-radius: 6px;
}
.smallText{
  color: #fff;
  background-color: #FC2B5A!important;
}
button.close {
    z-index: 9;
    background: #fff;
    border: 2px solid #FC2B5A !important;
    font-size: 19px;
    border-radius: 100px;
    height: 38px;
    opacity: 1;
    padding: 0;
    position: absolute;
    right: -13px;
    top: -12px;
    width: 38px;
    -webkit-appearance: none;
    -moz-box-shadow: none;
    -webkit-box-shadow: none;
    box-shadow: none;
    font-weight: 400;
    transition: .3s;
    font-weight: 900;
}
button.close span {
    font-size: 30px;
    line-height: 30px;
    color: #FC2B5A;
    font-weight: 400;
}
.sector--select{
  display: flex;
  align-items: center;

}

@media only screen and (max-width: 1199px) {
    .card {
        width: 100%;
    }
    .card-padd {
        display: flex
;
        justify-content: center;
        padding-left: 0 !important;
    }
}
@media only screen and (max-width: 768px) {
.sector--select{
  display: none;
}
  .jobs-heading {
        font-size: 30px !important;
    }
    .card {
        width: 95% !important;
    }
    
    .jobs-heading {
        font-size: 22px;
    }
}
@media only screen and (max-width: 700px) {
    .card {
        width: 95% !important;
    }
}
@media (max-width: 578px) {
 
    .jobs-heading {
        font-size: 27px !important;
    }
}
@media (max-width: 432px) {
    .jobs-heading {
        font-size: 25px !important;
    }
}
@media (max-width: 392px) {
   
    .courses_features p{
        font-size: 14px;
    }
}
@media (max-width: 375px) {
   
    
}


/* Course.css */

/* Filter Styles */
.filter-container {
    margin: auto;
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
  }
  
  .filter-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: #6b7280;
    font-weight: 500;
  }
  
  .filter-buttonss {
    display: flex;
    overflow-y: hidden;
    overflow-x: auto;
    gap: 12px;
    /* scrollbar-width: none; */
    /* -ms-overflow-style: none; */
    padding-bottom: 8px;
  } 
  /* .filter-buttons{
    
    scrollbar-width: 1px;
    -ms-overflow-style: none;
    padding-bottom: 8px;

    
  } */
  
 
  /* .filter-buttons::-webkit-scrollbar {
    display: none;
  } */
  .filter-button {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 20px;
    font-weight: 500;
    border: 1px solid #e5e7eb;
    background: white;
    color: #374151;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  
  .filter-button:hover {
    border-color: #ec4899;
  }
  
  .filter-button.active {
    background: #ec4899;
    color: white;
    transform: scale(1.05);
  }
  
  .count {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 12px;
    border-radius: 50%;
    background: #f3f4f6;
    color: #374151;
  }
  .verified-badge-container {
    position: relative;
    display: inline-block;
}
    .wave-ring {
    position: absolute;
    top: 0%;
    left: 100%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 2px solid rgba(76, 175, 80, 0.6);
    width: 60px;
    height: 60px;
    pointer-events: none;
    z-index: 1001;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
    animation: wave-expand 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}
.wave-ring.wave-1 {
    animation-delay: 0s;
    border-color: rgba(76, 175, 80, 0.6);
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.4);
}
.wave-ring.wave-2 {
    animation-delay: 0.7s;
    border-color: rgba(76, 175, 80, 0.4);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
}
.wave-ring.wave-3 {
    animation-delay: 1.4s;
    border-color: rgba(76, 175, 80, 0.3);
    box-shadow: 0 0 6px rgba(76, 175, 80, 0.2);
}
.verified-badge {
    width: 50% !important;
    height: 50% !important;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
    z-index: 1002;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 15px rgba(76, 175, 80, 0.5);
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
    object-fit: cover;
    right: -41px;
    top: -10px;
    transform-origin: center center;
}
 @keyframes wave-expand {
    0% {
      width: 60px;
      height: 60px;
      opacity: 0.7;
      transform: translate(-50%, -50%) scale(1);
      border-width: 2px;
    }
    100% {
      width: 60px;
      height: 60px;
      opacity: 0;
      transform: translate(-50%, -50%) scale(3);
      border-width: 1px;
    }
  }
    @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 
        0 8px 32px rgba(236, 72, 153, 0.5),
        0 0 0 0 rgba(236, 72, 153, 0.7),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
    50% {
      box-shadow: 
        0 12px 40px rgba(58, 52, 55, 0.7),
        0 0 0 8px rgba(236, 72, 153, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
  }
  .filter-button.active .count {
    background: #db2777;
    color: white;
  }
  
  .active-indicator {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: #ec4899;
  }
  
  /* Course Card Styles */
  .courseCard {
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.3s ease;
    /* height: 100%; */
  }
  
  .courseCard:hover {
    transform: translateY(-5px);
  }
  
  .bg-img {
    position: relative;
    overflow: hidden;
  }
  
  .bg-img img.digi {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
    
  .group1 {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    opacity: 0.8;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  
  .bg-img:hover .group1 {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  
  .ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  
  .para_ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  
  .courses_features {
    font-size: 0.85rem;
  }
  
  .sub_head {
    opacity: 0.8;
    font-size: 0.75rem;
  }
  
  .color-yellow {
    color: #ffc107;
  }
  
  
  .btn-bg-color {
    background-color: #ec4899;
    color: white;
    border: none;
  }
  
  .btn-bg-color:hover {
    background-color: #db2777;
    color: white;
  }
  
  .cta-callnow {
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .cta-callnow:hover {
    transform: translateY(-2px);
  }
  
  /* Section Styles */
  .section-padding-60 {
    padding: 60px 0;
  }
  
  .jobs-heading {
    color: #333;
    font-weight: 700;
    position: relative;
  }
  .search-container{
    position: relative;
  }
  .search-icon {
    position: absolute;
    left: 5px;
    top: 8px;
    font-size: 16px;
  }
  /* .jobs-heading:after {
    content: '';
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background-color: #ec4899;
    border-radius: 2px;
  }
   */
  /* Modal Styles */
  .modal-content {
    border: none;
    border-radius: 12px;
    /* overflow: hidden; */
  }
  
  .modal-header {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .modal-footer {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .submit_btn {
    background-color: #ec4899;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .submit_btn:hover {
    background-color: #db2777;
  }
.new_img{
    width: 20px!important;
}
.apply_date{
    font-size: 16px;
}

#callbackForm input , #callbackForm select{
  background-color: transparent;
  padding: 7px 12px;
  border: 1px solid ;
  height: 37px;
}
#callbackForm textarea{
  margin-bottom: 20px;
  border: 1px solid ;
}
#callbackForm button{
  border: 1px solid #fc2b5a;
  transition: 0.4s ease-in-out;
}
#callbackForm button:hover{
  border: 1px solid #FC2B5A;
  color: #FC2B5A;
  font-weight: bold;
  background: transparent!important;
  scale: 1.1;
}
.newWidth{
  width: 30%!important;
}
.shadow-new{
  right: 0px!important;
}
  .btn-close {
  --bs-btn-close-bg: url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27 fill=%27%23fff%27%3e%3cpath d=%27M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414%27/%3e%3c/svg%3e");
}

@media (max-width:992px){
  .newWidth{
    width: 100%!important;
  }
}
@media (max-width:768px){
  .bg-img img.digi {
    object-fit: fill;
  }
}
            `
          }
        </style>

<style>
  {

    `
    
.modal-width{
width:25rem;
height:15rem;
}
.shadow {
    box-shadow: 0 .5rem 1rem #00000026 !important;
    box-shadow: var(--bs-box-shadow) !important;
}
.right_obj {
    background: #fff;
    border: 1px dashed #ffd542;
    border-bottom-left-radius: 15px;
    border-right: 0;
    box-shadow: .5px 0 2px #0000004d;
    color: #fc2b5a;
    font-family: inter;
    font-weight: 700;
    outline: 3px solid #fff;
    padding: 2px 10px;
    position: absolute;
    right: 17px;
    top: 30px;
    width: -webkit-fit-content;
    width: fit-content;
    z-index: 1;
}
    .modal-header {
  background-color: #FC2B5A;
  border-bottom: none;
}
    
    `
  }
</style>
      </div>
    </FrontLayout>
  );
}



// import React, { useState, useEffect } from 'react'
// import FrontLayout from '../../../Component/Layouts/Front/index'
// import $ from 'jquery';
// import 'slick-carousel';
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
// import TechnologySlider from '../../../Component/Layouts/Front/TechnologySlider/TechnologySlider';
// import CompanyPartners from '../CompanyPartners/CompanyPartners';
// import CandidateReview from '../CandidateReview/CandidateReview';
// const HomePage = () => {

//   useEffect(() => {
//     // Initialize slick slider
//     $(".how_sliderdual").slick({
//       dots: false,
//       slidesToShow: 1,
//       slidesToScroll: 1,
//       arrows: false,
//       autoplay: true,
//       infinite: true,
//       autoplaySpeed: 2000,
//       responsive: [
//         {
//           breakpoint: 1920,
//           settings: {
//             slidesToShow: 1,
//             slidesToScroll: 1,
//             infinite: true,
//             dots: false
//           }
//         },
//         {
//           breakpoint: 1199,
//           settings: {
//             slidesToShow: 1,
//             slidesToScroll: 1,
//             infinite: true,
//             dots: false
//           }
//         },
//         {
//           breakpoint: 1366,
//           settings: {
//             slidesToShow: 1,
//             slidesToScroll: 1
//           }
//         },
//         {
//           breakpoint: 767,
//           settings: {
//             slidesToShow: 1,
//             slidesToScroll: 1
//           }
//         },
//         {
//           breakpoint: 576,
//           settings: {
//             slidesToShow: 1,
//             slidesToScroll: 1
//           }
//         }
//       ]
//     });

//     // Cleanup function to prevent memory leaks
//     return () => {
//       try {
//         if ($(".how_sliderdual").hasClass('slick-initialized')) {
//           $(".how_sliderdual").slick('unslick');
//         }
//       } catch (error) {
//         console.warn('Error destroying slick slider:', error);
//       }
//     };
//   }, []);

//   return (
//     <FrontLayout>

//       {/* main page display on web for large screens  */}
//       <section className="d-xxl-block d-xl-block d-lg-block d-md-block d-md-block d-sm-none d-none">
//         <div className="home-2_hero-section section-padding-120 mt-5" id="hero">
//           <div className="container">
//             <div className="row row--custom">
//               <div className="col-xxl-6 col-lg-6 col-md-12 col-xs-8 col-12" data-aos-duration="1000" data-aos="fade-left"
//                 data-aos-delay="300">
//                 {/* <!-- <div className="home-2_hero-image-block">
//                 <div className="home-2_hero-image">
//                   <img src="public_assets/images/newpage/index/focalyt2.gif" alt="hero image" className="img-fluid"
//                     draggable="false"/>
//                 </div>
//               </div> --> */}
//                 <div className="home-2_hero-image-block">
//                   <h2 className="tagline">
//                     #Building Future Ready Minds
//                   </h2>
//                 </div>
//                 <div className="images">
//                   <a href="/candidate/login">
//                     <img src="/Assets/public_assets/images/icons/drone.png" alt="drone" className="img1" />
//                   </a>
//                   <a href="/candidate/login">'
//                     <img src="/Assets/public_assets/images/icons/ai.png" alt="ai" className="img1" />
//                   </a>
//                   <a href="/candidate/login">
//                     <img src="/Assets/public_assets/images/icons/robotic.png" alt="robotic" className="img1" />
//                   </a>
//                   <a href="/candidate/login">
//                     <img src="/Assets/public_assets/images/icons/iot.png" alt="iot" className="img1" />
//                   </a>
//                   <a href="/candidate/login">
//                     <img src="/Assets/public_assets/images/icons/ar_vr.png" alt="ar vr" className="img1" />
//                   </a>
//                 </div>
//               </div>

//               <div className="col-xxl-auto col-lg-6 col-md-12 my-auto" data-aos-duration="1000" data-aos="fade-right"
//                 data-aos-delay="300">
//                 <div className="home-2_hero-content mt-5">
//                   <div className="home-2_hero-content-text">
//                     <h4>Unlock Your Future With</h4>
//                     <h1 className="hero-content__title heading-xl text-white mb-0">
//                       FOCALYT
//                     </h1>
//                   </div>
//                 </div>
//                 <div className="border_cta">
//                   <p className="text-white">Job Discovery&nbsp;&nbsp;|&nbsp;&nbsp;Skilling and
//                     Upskilling</p>
//                 </div>
//                 <div className="pt-4 last_cta">
//                   <h3 className="color-pink fw-bolder">ALL IN ONE PLACE!</h3>
//                 </div>
//                 <div className="col-xxl-12 mx-auto mt-xxl-5 mt-xl-3 mt-lg-3 mt-md-3 mt-sm-3 mt-3">
//                   <div className="row justify-content-start" id="features_cta">
//                     <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-6 text-center mb-sm-3 mb-3 cta_cols">
//                       <a href="/joblisting">
//                         <figure className="figure">
//                           <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/job_search.png"
//                             data-src="/Assets/public_assets/images/newpage/index/job_search.png" />
//                           <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/job_search_v.png" src="/Assets/public_assets/images/newpage/index/job_search_v.png" />
//                         </figure>
//                         <h4 className="head">Future Technology Jobs</h4>
//                       </a>
//                     </div>
//                     <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-6 text-center mb-sm-3 mb-3 cta_cols">
//                       <a href="/courses">
//                         <figure className="figure">
//                           <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/skill_course.png"
//                             data-src="/Assets/public_assets/images/newpage/index/skill_course.png" />
//                           <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/skill_course_v.png" src="/Assets/public_assets/images/newpage/index/skill_course_v.png" />
//                         </figure>
//                         <h4 className="head">Future Technology Courses</h4>
//                       </a>
//                     </div>
//                     <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-6 text-center mb-sm-3 mb-3 cta_cols">
//                       <a href="/labs">
//                         <figure className="figure">
//                           <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/Future Technology Labs.png"
//                             data-src="/Assets/public_assets/images/newpage/index/Future Technology Labs.png" />
//                           <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/Future Technology Labs_v.png" src="/Assets/public_assets/images/newpage/index/Future Technology Labs_v.png" />
//                         </figure>
//                         <h4 className="head">Future Technology Labs</h4>
//                       </a>
//                     </div>
//                     {/* <!-- <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-6 text-center mb-sm-3 mb-3 cta_cols">
//                     <figure className="figure">
//                       <img className="Sirv image-main" src="public_assets/images/newpage/index/job_safety.png" data-src="public_assets/images/newpage/index/job_safety.png">
//                       <img className="Sirv image-hover" data-src="public_assets/images/newpage/index/job_safety_v.png">
//                     </figure>
//                     <h4 className="head">Loans &amp; Advances</h4>
//                     <h4 className="head">Loans &amp; Advances</h4>
//                   </div> --> */}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* <!-- CTA's -->
//             <!-- END --> */}
//         </div>

//         {/* carousel  */}
//         <div className='' style={{ background: "#121212" }}>
//           <TechnologySlider />

//         </div>

//       </section>
//       <section className="d-xxl-none d-xl-none d-lg-none d-md-none d-sm-block d-block" id="hero_sm">
//         <div className="home-2_hero-section section-padding-120 mt-5" id="hero">
//           <div className="container">
//             <div className="row row--custom">
//               <div className="col-xxl-6 col-lg-6 col-md-12 col-xs-8 col-12" data-aos-duration="1000" data-aos="fade-left"
//                 data-aos-delay="300">
//                 {/* <!-- <div className="home-2_hero-image-block">
//                 <div className="home-2_hero-image">
//                   <img src="public_assets/images/newpage/index/focalyt2.gif" alt="hero image" className="img-fluid"
//                     draggable="false"/>
//                 </div>
//               </div> --> */}
//                 <div className="home-2_hero-image-block">
//                   <h2 className="tagline">
//                     #Building Future Ready Minds
//                   </h2>
//                 </div>
//                 <div className="images">
//                   <a href="/candidate/login">
//                     <img src="/Assets/public_assets/images/icons/drone.png" alt="drone" className="img1" />
//                   </a>
//                   <a href="/candidate/login">
//                     <img src="/Assets/public_assets/images/icons/ai.png" alt="ai" className="img1" /></a>

//                   <a href="/candidate/login">
//                     <img src="/Assets/public_assets/images/icons/robotic.png" alt="robotic" className="img1" />
//                   </a>
//                   <a href="/candidate/login">
//                     <img src="/Assets/public_assets/images/icons/iot.png" alt="iot" className="img1" />
//                   </a>
//                   <a href="/candidate/login">
//                     <img src="/Assets/public_assets/images/icons/ar_vr.png" alt="ar vr" className="img1" />
//                   </a>
//                 </div>
//               </div>

//               <div className="col-xxl-auto col-lg-6 col-md-12 my-auto" data-aos-duration="1000" data-aos="fade-right"
//                 data-aos-delay="300">
//                 <div className="home-2_hero-content mt-5">
//                   <div className="home-2_hero-content-text">
//                     <h4>Unlock Your Future With</h4>
//                     <h1 className="hero-content__title heading-xl text-white mb-0">
//                       FOCALYT
//                     </h1>
//                   </div>
//                 </div>
//                 <div className="border_cta">
//                   <p className="text-white">Job Discovery&nbsp;&nbsp;|&nbsp;&nbsp;Skilling and
//                     Upskilling</p>
//                 </div>
//                 <div className="pt-4 last_cta">
//                   <h3 className="color-pink fw-bolder">ALL IN ONE PLACE!</h3>
//                 </div>
//                 <div className="col-xxl-12 mx-auto mt-xxl-5 mt-xl-3 mt-lg-3 mt-md-3 mt-sm-3 mt-3">
//                   <div className="row justify-content-start" id="features_cta">
//                     <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-4 col-4 text-center mb-sm-3 mb-3 cta_cols">
//                       <a href="/joblisting">
//                         <figure className="figure">
//                           <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/job_search.png"
//                             data-src="/Assets/public_assets/images/newpage/index/job_search.png" />
//                           <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/job_search_v.png" src="/Assets/public_assets/images/newpage/index/job_search_v.png" />
//                         </figure>
//                         <h4 className="head">Future Technology Jobs</h4>
//                       </a>
//                     </div>
//                     <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-4 col-4 text-center mb-sm-3 mb-3 cta_cols">
//                       <a href="/courses">
//                         <figure className="figure">
//                           <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/skill_course.png"
//                             data-src="/Assets/public_assets/images/newpage/index/skill_course.png" />
//                           <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/skill_course_v.png" src="/Assets/public_assets/images/newpage/index/skill_course_v.png" />
//                         </figure>
//                         <h4 className="head">Future Technology Courses</h4>
//                       </a>
//                     </div>
//                     <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-4 col-4 text-center mb-sm-3 mb-3 cta_cols">
//                       <a href="/labs">
//                         <figure className="figure">
//                           <img className="Sirv image-main" src="/Assets/public_assets/images/newpage/index/Future Technology Labs.png"
//                             data-src="/Assets/public_assets/images/newpage/index/Future Technology Labs.png" />
//                           <img className="Sirv image-hover" data-src="/Assets/public_assets/images/newpage/index/Future Technology Labs_v.png" src="/Assets/public_assets/images/newpage/index/Future Technology Labs_v.png" />
//                         </figure>
//                         <h4 className="head">Future Technology Labs</h4>
//                       </a>
//                     </div>
//                     {/* <!-- <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6 col-6 text-center mb-sm-3 mb-3 cta_cols">
//                     <figure className="figure">
//                       <img className="Sirv image-main" src="public_assets/images/newpage/index/job_safety.png" data-src="public_assets/images/newpage/index/job_safety.png">
//                       <img className="Sirv image-hover" data-src="public_assets/images/newpage/index/job_safety_v.png">
//                     </figure>
//                     <h4 className="head">Loans &amp; Advances</h4>
//                     <h4 className="head">Loans &amp; Advances</h4>
//                   </div> --> */}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* <!-- CTA's -->
//             <!-- END --> */}
//         </div>

//         {/* carousel  */}
//         <div className='' style={{ background: "#121212" }}>
//           <TechnologySlider />

//         </div>

//       </section>


//       <section id="how">

//         <div className="home-2_content-section-1 section-padding-120" id="about">
//           <div className="container">
//             <div className="main-screen">
//               <div className="row row--custom d-xl-block d-lg-block d-md-none d-sm-none d-none">
//                 <div className="faq-4_main-section">
//                   <div className="container">
//                     <div className="row justify-content-center justify-content-lg-between gutter-y-10 ">
//                       <div className="col-xl-6 col-lg-6 "></div>
//                       <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12 mt-0" >
//                         <div className="content m-0">
//                           <div className="content-text-block">
//                             <h2 className="content-title text-capitalize heading-md how_focal color-pink">
//                               What Focalyt Does
//                             </h2>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="col-xl-6 col-lg-6 col-m-6 col-sm-6 col-6 my-auto">
//                         <div className="tab-content">
//                           <div className="tab-pane fade show active" id="general-tab-pane" role="tabpanel"
//                             aria-labelledby="cotent-tab" tabindex="0">
//                             <div className="accordion-style-7-wrapper robo_img ">
//                               <figure>
//                                 <img src="/Assets/public_assets/images/course/courses.jpeg" className="img-fluid"
//                                   draggable="false" />
//                               </figure>
//                             </div>
//                           </div>
//                           <div className="tab-pane fade " id="account-tab-pane" role="tabpanel" aria-labelledby="cotent-tab"
//                             tabindex="0">
//                             <div className="accordion-style-7-wrapper robo_img ">
//                               <figure>
//                                 <img src="/Assets/public_assets/images/course/labs.jpeg" className="img-fluid"
//                                   draggable="false" />
//                               </figure>
//                             </div>
//                           </div>
//                           <div className="tab-pane fade " id="purchasing-tab-pane" role="tabpanel" aria-labelledby="cotent-tab"
//                             tabindex="0">
//                             <div className="accordion-style-7-wrapper robo_img ">
//                               <figure>
//                                 <img src="/Assets/public_assets/images/course/jobs.jpeg" className="img-fluid"
//                                   draggable="false" />
//                               </figure>
//                             </div>
//                           </div>
//                           <div className="tab-pane fade" id="technical-tab-pane" role="tabpanel" aria-labelledby="cotent-tab"
//                             tabindex="0">
//                             <div className="accordion-style-7-wrapper robo_img ">
//                               <figure>
//                                 <img src="/Assets/public_assets/images/course/social_impact.jpg" className="img-fluid"
//                                   draggable="false" />
//                               </figure>
//                             </div>
//                           </div>
//                           <div className="tab-pane fade" id="continous-tab-pane" role="tabpanel" aria-labelledby="cotent-tab"
//                             tabindex="0">
//                             <div className="accordion-style-7-wrapper robo_img ">
//                               <figure>
//                                 <img src="/Assets/public_assets/images/course/iot.jpg" className="img-fluid"
//                                   draggable="false" />
//                               </figure>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="col-xl-6 col-lg-6 col-m-6 col-sm-6 col-6">
//                         <ul className="faq-tab__nav faq-filter-list feature-widget-7-row" role="tablist" id="cotent-tab">
//                           <li className="nav-item" role="presentation">
//                             <button className="nav-link active" id="general-tab-nav" data-bs-toggle="tab"
//                               data-bs-target="#general-tab-pane" type="button" role="tab" aria-controls="general-tab-pane"
//                               aria-selected="true">
//                               <div className="mobile-bg">
//                                 <div className="feature-widget-7">
//                                   <div className="feature-widget-7__icon-wrapper my-auto">
//                                     <h5 className="color-pink fw-bold">1</h5>
//                                   </div>
//                                   <div className="feature-widget-7__body">
//                                     <h5 className="feature-widget-7__title mb-0 color-pink">Future-Ready Courses</h5>
//                                     <p>Advanced courses in AI, Machine Learning, Cloud Computing, Drone Pilot Training, and more to prepare students for future careers.</p>
//                                   </div>
//                                 </div>
//                               </div>

//                             </button>
//                           </li>
//                           <li className="nav-item" role="presentation">
//                             <button className="nav-link " id="account-tab-nav" data-bs-toggle="tab"
//                               data-bs-target="#account-tab-pane" type="button" role="tab" aria-controls="account-tab-pane"
//                               aria-selected="false">
//                               <div className="mobile-bg">
//                                 <div className="feature-widget-7">
//                                   <div className="feature-widget-7__icon-wrapper my-auto">
//                                     <h5 className="color-pink fw-bold">2</h5>
//                                   </div>
//                                   <div className="feature-widget-7__body">
//                                     <h5 className="feature-widget-7__title mb-0 color-pink">Future Technology Labs</h5>
//                                     <p>Set up Future Technology Labs in schools and colleges to provide hands-on learning experiences with cutting-edge technologies.</p>
//                                   </div>
//                                 </div>
//                               </div>
//                             </button>
//                           </li>
//                           <li className="nav-item" role="presentation">
//                             <button className="nav-link " id="purchasing-tab-nav" data-bs-toggle="tab"
//                               data-bs-target="#purchasing-tab-pane" type="button" role="tab"
//                               aria-controls="purchasing-tab-pane" aria-selected="false" >
//                             <div className="mobile-bg">
//                               <div className="feature-widget-7">
//                                 <div className="feature-widget-7__icon-wrapper my-auto">
//                                   <h5 className="color-pink fw-bold">3</h5>
//                                 </div>
//                                 <div className="feature-widget-7__body">
//                                   <h5 className="feature-widget-7__title mb-0 color-pink">Job Opportunities in Future Technology</h5>
//                                   <p>Offer global career opportunities in emerging tech fields by bridging the gap between skills and industry demands.</p>
//                                 </div>
//                               </div>
//                             </div>
//                             </button>
//                           </li>
//                           <li className="nav-item" role="presentation">
//                             <button className="nav-link " id="technical-tab-nav" data-bs-toggle="tab"
//                               data-bs-target="#technical-tab-pane" type="button" role="tab"
//                               aria-controls="technical-tab-pane" aria-selected="false">
//                               <div className="mobile-bg">
//                                 <div className="feature-widget-7">
//                                   <div className="feature-widget-7__icon-wrapper my-auto">
//                                     <h5 className="color-pink fw-bold">4</h5>
//                                   </div>
//                                   <div className="feature-widget-7__body">
//                                     <h5 className="feature-widget-7__title mb-0 color-pink">Social Impact Projects </h5>
//                                     <p>Execute Govt and CSR initiatives focused on skill development, education, and employment to empower underserved communities.</p>
//                                   </div>
//                                 </div>
//                               </div>
//                             </button>
//                           </li>
//                           {/* <!-- <li className="nav-item" role="presentation">
//                     <button className="nav-link " id="continous-tab-nav" data-bs-toggle="tab"
//                       data-bs-target="#continous-tab-pane" type="button" role="tab"
//                       aria-controls="continous-tab-pane" aria-selected="false">
//                       <div className="mobile-bg">
//                         <div className="feature-widget-7">
//                           <div className="feature-widget-7__icon-wrapper my-auto">
//                             <h5 className="color-pink fw-bold">5</h5>
//                           </div>
//                           <div className="feature-widget-7__body">
//                             <h5 className="feature-widget-7__title mb-0 color-pink">Support for Innovation</h5>
//                             <p>Facilitate innovation through tools and platforms that encourage exploration and application of futuristic technologies.</p>
//                           </div>
//                         </div>
//                       </div>
//                     </button>
//                   </li> --> */}
//                         </ul>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="small-screen">
//               <div className="row justify-content-center justify-content-lg-between gutter-y-10 ">
//                 <div className="col-xl-6 col-lg-6 "></div>
//                 <div className="col-lg-6 col-12 d-xl-none d-lg-none d-md-block d-sm-block d-block" data-aos-duration="1000" data-aos="fade-down"
//                   data-aos-delay="300">
//                   <div className="content m-0">
//                     <div className="content-text-block">
//                       <h2 className="content-title heading-md text-capitalize how_focal">
//                         What Focalyt Does
//                       </h2>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="how_sliderdual slider d-xl-none d-lg-none d-md-block d-sm-block d-block" id="how_sliderdual2">
//               <div className="">
//                 <figure>
//                   <img src="/Assets/public_assets/images/course/courses.jpeg" className="img-fluid" draggable="false" />
//                 </figure>
//                 <div className="feature-widget-7 c_bg_color">
//                   <div className="feature-widget-7__icon-wrapper my-auto">
//                     <h5 className="color-pink fw-bold">1</h5>
//                     <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                   </div>
//                   <div className="feature-widget-7__body">
//                     <h5 className="feature-widget-7__title mb-0 color-pink">Future-Ready Courses</h5>
//                     <p>Advanced courses in AI, Machine Learning, Cloud Computing, Drone Pilot Training, and more to prepare students for future careers.</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="">
//                 <figure>
//                   <img src="/Assets/public_assets/images/course/labs.jpeg" className="img-fluid" draggable="false" />
//                 </figure>
//                 <div className="feature-widget-7 c_bg_color">
//                   <div className="feature-widget-7__icon-wrapper my-auto">
//                     <h5 className="color-pink fw-bold">2</h5>
//                     <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                   </div>
//                   <div className="feature-widget-7__body">
//                     <h5 className="feature-widget-7__title mb-0 color-pink">Future Technology Labs</h5>
//                     <p>Set up Future Technology Labs in schools and colleges to provide hands-on learning experiences with cutting-edge technologies.</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="">
//                 <figure>
//                   <img src="/Assets/public_assets/images/course/jobs.jpeg" className="img-fluid" draggable="false" />
//                 </figure>
//                 <div className="feature-widget-7 c_bg_color">
//                   <div className="feature-widget-7__icon-wrapper my-auto">
//                     <h5 className="color-pink fw-bold">3</h5>
//                     <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                   </div>
//                   <div className="feature-widget-7__body">
//                     <h5 className="feature-widget-7__title mb-0 color-pink">Job Opportunities in Future Technology</h5>
//                     <p>Offer global career opportunities in emerging tech fields by bridging the gap between skills and industry demands.</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="">
//                 <figure>
//                   <img src="/Assets/public_assets/images/course/social_impact.jpg" className="img-fluid" draggable="false" />
//                 </figure>
//                 <div className="feature-widget-7 c_bg_color">
//                   <div className="feature-widget-7__icon-wrapper my-auto">
//                     <h5 className="color-pink fw-bold">4</h5>
//                     <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                   </div>
//                   <div className="feature-widget-7__body">
//                     <h5 className="feature-widget-7__title mb-0 color-pink">Social Impact Projects </h5>
//                     <p>Execute Govt and CSR initiatives focused on skill development, education, and employment to empower underserved communities.</p>
//                   </div>
//                 </div>
//               </div>
//               {/* <!-- <div className="">
//       <figure>
//         <img src="public_assets/images/newpage/index/steps/progress.png" className="img-fluid" draggable="false">
//       </figure>
//       <div className="feature-widget-7 c_bg_color">
//         <div className="feature-widget-7__icon-wrapper my-auto">
//           <h5 className="color-pink fw-bold">5</h5>
//           <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//         </div>
//         <div className="feature-widget-7__body">
//           <h5 className="feature-widget-7__title mb-0 color-pink">Continuous Progress</h5>
//           <p>Regularly update your profile, track your skill develop- ment, and connect with opportunities for
//             career growth.</p>
//         </div>
//       </div>
//     </div> --> */}
//             </div>

//           </div>
//         </div>
//       </section>

//       {/* <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//     Home  : Future Technolody Labs Section
//     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ --> */}
//       <section class="">
//         <div class="container">
//           <h2 class="section-title py-md-4 text-center color-pink">Empowering Minds Through Future Technology</h2>
//           <div class="row g-4 pb-5">

//             <div class="col-md-5 large-images" style={{display: 'flex'}}>
//               <div class="row g-4">
//                 <div class="col-12">
//                   <div class="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home1.jpg" alt="Robotics Workshop" class="img-fluid" />
//                   </div>
//                 </div>
//                 <div class="col-12">
//                   <div class="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home2.jpg" alt="Coding Session" class="img-fluid" />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div class="col-md-7 small-images">
//               <div class="row g-4">
//                 <div class="col-md-6">
//                   <div class="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home3.jpg" alt="AI Research" class="img-fluid" />
//                   </div>
//                 </div>
//                 <div class="col-md-6">
//                   <div class="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home4.jpg" alt="Machine Learning" class="img-fluid" />
//                   </div>
//                 </div>
//                 <div class="col-md-6">
//                   <div class="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home5.jpg" alt="Coding Challenge" class="img-fluid" />
//                   </div>
//                 </div>
//                 <div class="col-md-6">
//                   <div class="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home6.jpg" alt="Tech Seminar" class="img-fluid" />
//                   </div>
//                 </div>
//                 <div class="col-md-6">
//                   <div class="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home7.jpg" alt="Team Project" class="img-fluid" />
//                   </div>
//                 </div>
//                 <div class="col-md-6">
//                   <div class="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home8.jpg" alt="Innovation Lab" class="img-fluid" />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//     Home 2 : Feature Section
//     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ --> */}
//       <section id="skills">

//         <div className="home-2_feature-section section-padding">
//           <div className="container">
//             <div className="row justify-content-center text-center">
//               <div className="col-xxl-6 col-lg-7 col-md-9" >
//                 <div className="section-heading">
//                   <h2 className="section-heading__title heading-md fw-light text-uppercase color-pink mb-0">Skills for Success
//                   </h2>
//                   <h3 className="section-heading__title heading-md fw-bolder text-uppercase color-pink ">Today and Tomorrow
//                   </h3>
//                   <h4 className="text-black">Let us know who are you?</h4>
//                 </div>
//               </div>
//             </div>
//             <div className="row justify-content-center gutter-y-default">
//               <div className="col-lg-2 col-md-2 col-sm-12 col-12 mb-2" >
//                 <div id="student" className="role text-center">
//                   <h5 className="text-black fw-bold">STUDENT</h5>
//                   <p className="text-black fw-normal pt-1 px-2">Aspiring to launch your career</p>
//                   {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
//                   <a href="/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
//                   {/* <!-- <figure>
//                   <img src="public_assets/images/newpage/index/student.svg" className="img-fluid" draggable="false">
//                 </figure> --> */}
//                 </div>
//               </div>
//               <div className="col-lg-2 col-md-2 col-sm-12 col-12 mb-2" >
//                 <div id="employer" className="role text-center">
//                   <h5 className="text-black fw-bold">JOB SEEKER</h5>
//                   <p className="text-black fw-normal pt-1 px-2">Find jobs and Internships</p>
//                   {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
//                   <a href="/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
//                   {/* <!-- <figure>
//                   <img src="public_assets/images/newpage/index/employee.svg" className="img-fluid" draggable="false">
//                 </figure> --> */}
//                 </div>
//               </div>
//               <div className="col-lg-2 col-md-2 col-sm-12 col-12 mb-2" >
//                 <div id="employee" className="role text-center">
//                   <h5 className="text-black fw-bold">EMPLOYER</h5>
//                   <p className="text-black fw-normal pt-1 px-2">Seeking skilled talent</p>
//                   {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
//                   <a href="/candidate/login" className="color-pink pt-2">Get Started &gt;</a>

//                   {/* <!-- <figure>
//                   <img src="public_assets/images/newpage/index/employer.svg" className="img-fluid" draggable="false">
//                 </figure> --> */}
//                 </div>
//               </div>
//               <div className="col-lg-2 col-md-2 col-sm-12 col-12 mb-2">
//                 <div id="institute" className="role text-center">
//                   <h5 className="text-black fw-bold">INSTITUTE</h5>
//                   <p className="text-black fw-normal pt-1 px-2">Schools and Colleges</p>
//                   {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
//                   <a href="/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
//                   {/* <!-- <figure>
//                   <img src="public_assets/images/newpage/index/employee.svg" className="img-fluid" draggable="false">
//                 </figure> --> */}
//                 </div>
//               </div>
//               <div className="col-lg-2 col-md-2 col-sm-12 col-12 mb-2">
//                 <div id="educator" className="role text-center">
//                   <h5 className="text-black fw-bold">SKILL-EDUCATOR</h5>
//                   <p className="text-black fw-normal pt-1 px-2">Passionate for Training</p>
//                   {/* <!-- <h6 className="color-pink pt-2">Get Started ></h6> --> */}
//                   <a href="/candidate/login" className="color-pink pt-2">Get Started &gt;</a>
//                   {/* <!-- <figure className="pt-2">
//                   <img src="public_assets/images/newpage/index/skill-educator.svg" className="img-fluid" draggable="false">
//                 </figure> --> */}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//       {/* <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//     Home 2  : Content Section 1
//     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ --> */}



//       {/* <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//     Home 2  : AR & VR
//     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ --> */}
//       <section id="Ar">
//         <div className="home-2_content-section-1 section-padding-120" id="">
//           <div className="container">
//             <div className="row row--custom d-xl-block d-lg-block d-md-none d-sm-none d-none">
//               <div className="faq-4_main-section">
//                 <div className="container">
//                   <div className="main-screen">
//                     <div className="row justify-content-center justify-content-lg-between gutter-y-10 ">
//                       <div className="col-xl-6 col-lg-6 "></div>

//                       <div className="col-lg-6 col-md-12 col-sm-12 col-12 mt-0 aos-init aos-animation" data-aos="fade-down" data-aos-duration="1000" data-aos-once="false">

//                         <div className="content m-0">
//                           <div className="content-text-block">
//                             <h2 className="content-title heading-md  how_focal m-0">
//                               Future Technology Labs for Institute
//                             </h2>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="row justify-content-center justify-content-lg-between gutter-y-10 ">

//                         <div className="col-xl-6 col-lg-6 col-m-6 col-sm-6 col-6 my-auto">
//                           <div className="tab-content">
//                             <div className="tab-pane fade show active" id="general-tab-panes" role="tabpanel"
//                               aria-labelledby="cotent-tab" tabindex="0">
//                               <div className="accordion-style-7-wrapper robo_img">
//                                 <figure>
//                                   <img src="/Assets/public_assets/images/course/robo.jpg" className="img-fluid" draggable="false" />
//                                 </figure>
//                               </div>
//                             </div>
//                             <div className="tab-pane fade " id="account-tab-panes1" role="tabpanel" aria-labelledby="cotent-tab"
//                               tabindex="0">
//                               <div className="accordion-style-7-wrapper robo_img">
//                                 <figure>
//                                   <img src="/Assets/public_assets/images/course/ai.jpg" className="img-fluid"
//                                     draggable="false" />
//                                 </figure>
//                               </div>
//                             </div>
//                             <div className="tab-pane fade " id="purchasing-tab-pane2" role="tabpanel" aria-labelledby="cotent-tab"
//                               tabindex="0">
//                               <div className="accordion-style-7-wrapper robo_img">
//                                 <figure>
//                                   <img src="/Assets/public_assets/images/course/ar_vr.jpg" className="img-fluid"
//                                     draggable="false" />
//                                 </figure>
//                               </div>
//                             </div>
//                             <div className="tab-pane fade" id="technical-tab-pane3" role="tabpanel" aria-labelledby="cotent-tab"
//                               tabindex="0">
//                               <div className="accordion-style-7-wrapper robo_img">
//                                 <figure>
//                                   <img src="/Assets/public_assets/images/course/drone.jpg" className="img-fluid"
//                                     draggable="false" />
//                                 </figure>
//                               </div>
//                             </div>
//                             <div className="tab-pane fade" id="continous-tab-pane4" role="tabpanel" aria-labelledby="cotent-tab"
//                               tabindex="0">
//                               <div className="accordion-style-7-wrapper robo_img">
//                                 <figure>
//                                   <img src="/Assets/public_assets/images/course/iot.jpg" className="img-fluid"
//                                     draggable="false" />
//                                 </figure>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                         <div className="col-xl-6 col-lg-6 col-m-6 col-sm-6 col-6">
//                           <ul className="faq-tab__nav faq-tab__nav2 faq-filter-list feature-widget-7-row" role="tablist"
//                             id="cotent-tab">
//                             <li className="nav-item" role="presentation">
//                               <button className="nav-link active" id="general-tab-nav" data-bs-toggle="tab"
//                                 data-bs-target="#general-tab-panes" type="button" role="tab" aria-controls="general-tab-panes"
//                                 aria-selected="true">
//                                 <div className="mobile-bg">
//                                   <div className="feature-widget-7">
//                                     <div className="feature-widget-7__icon-wrapper my-auto">
//                                       <h5 className="color-pink fw-bold">1</h5>
//                                     </div>
//                                     <div className="feature-widget-7__body">
//                                       <h5 className="feature-widget-7__title mb-0 color-pink">Robotics</h5>
//                                       <p>Empower students with hands-on learning in robotics, fostering innovation and critical thinking.</p>
//                                     </div>
//                                   </div>
//                                 </div>

//                               </button>
//                             </li>
//                             <li className="nav-item new-nav-item" role="presentation">
//                               <button className="nav-link " id="account-tab-nav" data-bs-toggle="tab"
//                                 data-bs-target="#account-tab-panes1" type="button" role="tab"
//                                 aria-controls="account-tab-panes1" aria-selected="false">
//                                 <div className="mobile-bg">
//                                   <div className="feature-widget-7">
//                                     <div className="feature-widget-7__icon-wrapper my-auto">
//                                       <h5 className="color-pink fw-bold">2</h5>
//                                     </div>
//                                     <div className="feature-widget-7__body">
//                                       <h5 className="feature-widget-7__title mb-0 color-pink">Artificial Intelligence</h5>
//                                       <p>Equip learners with AI tools and techniques, preparing them for cutting-edge careers in technology.</p>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </button>
//                             </li>
//                             <li className="nav-item" role="presentation">
//                               <button className="nav-link " id="purchasing-tab-nav" data-bs-toggle="tab"
//                                 data-bs-target="#purchasing-tab-pane2" type="button" role="tab"
//                                 aria-controls="purchasing-tab-pane2" aria-selected="false">
//                               <div className="mobile-bg">
//                                 <div className="feature-widget-7">
//                                   <div className="feature-widget-7__icon-wrapper my-auto">
//                                     <h5 className="color-pink fw-bold">3</h5>
//                                   </div>
//                                   <div className="feature-widget-7__body">
//                                     <h5 className="feature-widget-7__title mb-0 color-pink">AR & VR</h5>
//                                     <p>Introduce students to immersive learning experiences with Augmented and Virtual Reality technologies.</p>
//                                   </div>
//                                 </div>
//                               </div>
//                               </button>
//                             </li>
//                             <li className="nav-item" role="presentation">
//                               <button className="nav-link " id="technical-tab-nav" data-bs-toggle="tab"
//                                 data-bs-target="#technical-tab-pane3" type="button" role="tab"
//                                 aria-controls="technical-tab-pane3" aria-selected="false">
//                                 <div className="mobile-bg">
//                                   <div className="feature-widget-7">
//                                     <div className="feature-widget-7__icon-wrapper my-auto">
//                                       <h5 className="color-pink fw-bold">4</h5>
//                                     </div>
//                                     <div className="feature-widget-7__body">
//                                       <h5 className="feature-widget-7__title mb-0 color-pink">Drone</h5>
//                                       <p>Teach students to build, operate, and program drones, opening up opportunities in industries like agriculture, logistics, and surveillance.</p>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </button>
//                             </li>
//                             <li className="nav-item" role="presentation">
//                               <button className="nav-link " id="continous-tab-nav" data-bs-toggle="tab"
//                                 data-bs-target="#continous-tab-pane4" type="button" role="tab"
//                                 aria-controls="continous-tab-pane4" aria-selected="false">
//                                 <div className="mobile-bg">
//                                   <div className="feature-widget-7">
//                                     <div className="feature-widget-7__icon-wrapper my-auto">
//                                       <h5 className="color-pink fw-bold">5</h5>
//                                     </div>
//                                     <div className="feature-widget-7__body">
//                                       <h5 className="feature-widget-7__title mb-0 color-pink">Internet of Things (IoT)</h5>
//                                       <p>Train students to connect and control devices through IoT, developing skills for smart home technology, industrial automation, and healthcare applications.</p>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </button>
//                             </li>

//                           </ul>
//                         </div>
//                         <div className="row">
//                           <div className="col-lg-6"></div>
//                           <div className="col-lg-6">

//                             <div className="">
//                               <div className="new_link text-center">
//                                 <a href="/labs" className="view_more">View More</a>
//                               </div>
//                             </div>

//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                 </div>
//                 <div className="col-lg-6 col-12 d-xl-none d-lg-none d-md-block d-sm-block d-block">
//                   <div className="content">
//                     <div className="content-text-block">
//                       <h2 className="content-title heading-md text-uppercase how_focal">
//                         How Focalyt Works
//                       </h2>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="how_sliderdual slider d-xl-none d-lg-none d-md-block d-sm-block d-block" id="how_sliderdual">
//                   <div className="">
//                     <figure>
//                       <img src="public_assets/images/course/courses.jpg" className="img-fluid" draggable="false" />
//                     </figure>
//                     <div className="feature-widget-7 c_bg_color">
//                       <div className="feature-widget-7__icon-wrapper my-auto">
//                         <h5 className="color-pink fw-bold">1</h5>
//                         <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                       </div>
//                       <div className="feature-widget-7__body">
//                         <h5 className="feature-widget-7__title mb-0 color-pink">Future-Ready Courses</h5>
//                         <p>Advanced courses in AI, Machine Learning, Cloud Computing, Drone Pilot Training, and more to prepare students for future careers.</p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="">
//                     <figure>
//                       <img src="public_assets/images/course/labs.jpg" className="img-fluid" draggable="false" />
//                     </figure>
//                     <div className="feature-widget-7 c_bg_color">
//                       <div className="feature-widget-7__icon-wrapper my-auto">
//                         <h5 className="color-pink fw-bold">2</h5>
//                         <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                       </div>
//                       <div className="feature-widget-7__body">
//                         <h5 className="feature-widget-7__title mb-0 color-pink">Future Technology Labs</h5>
//                         <p>Set up Future Technology Labs in schools and colleges to provide hands-on learning experiences with cutting-edge technologies.</p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="">
//                     <figure>
//                       <img src="public_assets/images/course/jobs.jpg" className="img-fluid" draggable="false" />
//                     </figure>
//                     <div className="feature-widget-7 c_bg_color">
//                       <div className="feature-widget-7__icon-wrapper my-auto">
//                         <h5 className="color-pink fw-bold">3</h5>
//                         <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                       </div>
//                       <div className="feature-widget-7__body">
//                         <h5 className="feature-widget-7__title mb-0 color-pink">Job Opportunities in Future Technology</h5>
//                         <p>Offer global career opportunities in emerging tech fields by bridging the gap between skills and industry demands.</p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="">
//                     <figure>
//                       <img src="public_assets/images/course/social_impact.jpg" className="img-fluid" draggable="false" />
//                     </figure>
//                     <div className="feature-widget-7 c_bg_color">
//                       <div className="feature-widget-7__icon-wrapper my-auto">
//                         <h5 className="color-pink fw-bold">4</h5>
//                         <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                       </div>
//                       <div className="feature-widget-7__body">
//                         <h5 className="feature-widget-7__title mb-0 color-pink">Social Impact Projects </h5>
//                         <p>Execute Govt and CSR initiatives focused on skill development, education, and employment to empower underserved communities.</p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="">
//                     <figure>
//                       <img src="public_assets/images/newpage/index/steps/progress.png" className="img-fluid" draggable="false" />
//                     </figure>
//                     <div className="feature-widget-7 c_bg_color">
//                       <div className="feature-widget-7__icon-wrapper my-auto">
//                         <h5 className="color-pink fw-bold">5</h5>
//                         <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                       </div>
//                       <div className="feature-widget-7__body">
//                         <h5 className="feature-widget-7__title mb-0 color-pink">Continuous Progress</h5>
//                         <p>Regularly update your profile, track your skill develop- ment, and connect with opportunities for
//                           career growth.</p>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="">
//                     <div className="new_link text-center">
//                       <a href="/futureTechnologyLabs" className="view_more">View More</a>
//                     </div>
//                   </div>
//                   {/* <!-- <div className=" --> */}
//                 </div>

//               </div>

//             </div>
//             <div className="col-lg-6 col-12 d-xl-none d-lg-none d-md-block d-sm-block d-block">
//               <div className="small-screen new-small-screen">
//                 <div className="content m-0">
//                   <div className="content-text-block">
//                     <h2 className="content-title heading-md how_focal pb-4">
//                       Future Technology Labs for Institute
//                     </h2>
//                   </div>
//                 </div>
//               </div>

//             </div>
//             <div className="how_sliderdual slider d-xl-none d-lg-none d-md-block d-sm-block d-block" id="how_sliderdual2">
//               {/* <!-- <div className="">
//             <figure>
//               <img src="public_assets/images/newpage/index/steps/regi.png" className="img-fluid" draggable="false"/>
//             </figure>
//             <div className="feature-widget-7 c_bg_color">
//               <div className="feature-widget-7__icon-wrapper my-auto">
//                 <h5 className="color-pink fw-bold">1</h5>
//                 <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//               </div>
//               <div className="feature-widget-7__body">
//                 <h5 className="feature-widget-7__title mb-0 color-pink">Drone</h5>
//                               <p>Teach students to build, operate, and program drones, opening up opportunities in industries like agriculture, logistics, and surveillance.</p>
//               </div>
//             </div>
//           </div> --> */}
//               <div className="">
//                 <figure>
//                   <img src="/Assets/public_assets/images/course/robo.jpg" className="img-fluid" draggable="false" />
//                 </figure>
//                 <div className="feature-widget-7 c_bg_color">
//                   <div className="feature-widget-7__icon-wrapper my-auto">
//                     <h5 className="color-pink fw-bold">1</h5>
//                     <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                   </div>
//                   <div className="feature-widget-7__body">
//                     <h5 className="feature-widget-7__title mb-0 color-pink">Robotics</h5>
//                     <p>Empower students with hands-on learning in robotics, fostering innovation and critical thinking.</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="">
//                 <figure>
//                   <img src="/Assets/public_assets/images/course/ai.jpg" className="img-fluid" draggable="false" />
//                 </figure>
//                 <div className="feature-widget-7 c_bg_color">
//                   <div className="feature-widget-7__icon-wrapper my-auto">
//                     <h5 className="color-pink fw-bold">2</h5>
//                     <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                   </div>
//                   <div className="feature-widget-7__body">
//                     <h5 className="feature-widget-7__title mb-0 color-pink">Artificial Intelligence</h5>
//                     <p>Equip learners with AI tools and techniques, preparing them for cutting-edge careers in technology.</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="">
//                 <figure>
//                   <img src="/Assets/public_assets/images/course/ar_vr.jpg" className="img-fluid" draggable="false" />
//                 </figure>
//                 <div className="feature-widget-7 c_bg_color">
//                   <div className="feature-widget-7__icon-wrapper my-auto">
//                     <h5 className="color-pink fw-bold">3</h5>
//                     <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                   </div>
//                   <div className="feature-widget-7__body">
//                     <h5 className="feature-widget-7__title mb-0 color-pink">AR & VR</h5>
//                     <p>Introduce students to immersive learning experiences with Augmented and Virtual Reality technologies.</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="">
//                 <figure>
//                   <img src="/Assets/public_assets/images/course/drone.jpg" className="img-fluid" draggable="false" />
//                 </figure>
//                 <div className="feature-widget-7 c_bg_color">
//                   <div className="feature-widget-7__icon-wrapper my-auto">
//                     <h5 className="color-pink fw-bold">4</h5>
//                     <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                   </div>
//                   <div className="feature-widget-7__body">
//                     <h5 className="feature-widget-7__title mb-0 color-pink">Drone</h5>
//                     <p>Teach students to build, operate, and program drones, opening up opportunities in industries like agriculture, logistics, and surveillance.</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="">
//                 <figure>
//                   <img src="/Assets/public_assets/images/course/drone.jpg" className="img-fluid" draggable="false" />
//                 </figure>
//                 <div className="feature-widget-7 c_bg_color">
//                   <div className="feature-widget-7__icon-wrapper my-auto">
//                     <h5 className="color-pink fw-bold">5</h5>
//                     <div id="w-node-d83d018d-71dd-028e-3041-a09e719bb77f-90c98d22" className="line-steps mobile"></div>
//                   </div>
//                   <div className="feature-widget-7__body">
//                     <h5 className="feature-widget-7__title mb-0 color-pink">Internet of Things (IoT)</h5>
//                     <p>Train students to connect and control devices through IoT, developing skills for smart home technology, industrial automation, and healthcare applications.</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//       {/* // <!-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//     // Home 2  : Integration Section
//     //   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ --> */}


//       <section id="whychoose">
//         <div className="section-padding-120">
//           <div className="container">
//             <div className="row">
//               <div className="col-md-12">
//                 <h2 className="whychoosefocal text-center">
//                   Why Choose <span className="linearGradient">
//                     Focalyt?
//                   </span>
//                 </h2>
//               </div>
//               <div className="col-md-12 " >
//                 <div className="row g-4">
//                   <div className="col-md-4">
//                     <div className="why_choose_sec ">
//                       <div className="program-logo">
//                         <img src="/Assets/public_assets/images/course/iit.png" alt="logo" />
//                       </div>
//                       <div className="program-about">
//                         <p className="program-description text-center">
//                           Program &nbsp;&amp;&nbsp;Curriculum made by
//                           IIT Alumni
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="col-md-4">
//                     <div className="why_choose_sec">
//                       <div className="program-logo">
//                         <img src="/Assets/public_assets/images/course/course.png" alt="logo" />
//                       </div>
//                       <div className="program-about">
//                         <p className="program-description text-center">
//                           Training from Basics to
//                           <br />Advance to Professional
//                         </p>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="col-md-4">
//                     <div className="why_choose_sec">
//                       <div className="program-logo">
//                         <img src="/Assets/public_assets/images/course/certificate.png" alt="logo" />
//                       </div>
//                       <div className="program-about">
//                         <p className="program-description text-center">
//                           Govt. of India
//                           <br /> Skill Certification
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="col-md-4">
//                     <div className="why_choose_sec">
//                       <div className="program-logo">
//                         <img src="/Assets/public_assets/images/course/intern.png" alt="logo" />
//                       </div>
//                       <div className="program-about">
//                         <p className="program-description text-center">
//                           Projects &amp; Internships
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="col-md-4">
//                     <div className="why_choose_sec">
//                       <div className="program-logo">
//                         <img src="/Assets/public_assets/images/course/scholarship.png" alt="logo" />
//                       </div>
//                       <div className="program-about">
//                         <p className="program-description text-center">
//                           Practical Training

//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="col-md-4">
//                     <div className="why_choose_sec">
//                       <div className="program-logo">
//                         <img src="/Assets/public_assets/images/course/learn.png" alt="logo" />
//                       </div>
//                       <div className="program-about">
//                         <p className="program-description text-center">
//                           50000+ Learners trained
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* our partners */}
//       <section id="partners">
        
//         <div className="">
//           <div className="container">
//             <div className="row">
//               <div className="col-md-12">
                
//                 <CompanyPartners />
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* <section id="candidateReview">
        
//         <div className="">
//           <div className="container">
//             <div className="row">
//               <div className="col-md-12">
                
//                 <CandidateReview />
//               </div>
//             </div>
//           </div>
//         </div>
//       </section> */}

//       {/* reach us  */}

//       <section id="reach">
//         <div className="section-padding-120">
//           <div className="container">
//             <div className="row g-5 align-items-center justify-content-center">
//               <div className="col-md-12 aos-animation aos-init" data-aos="fade-down" data-aos-duration="1000" data-aos-once="false">
//                 <h2 className="text--heading text-center primary-gradient1">
//                   Our Reach
//                 </h2>
//               </div>
//               <div className="col-md-12">
//                 <div className="row g-5 position-relative">
//                   <div className="globe-background"></div>
//                   <div className="col-md-4 col-6 ">
//                     <div className="inner_reach_section">
//                       <h4 className="reach_header">
//                         Community of
//                         <br />
//                         10,00,000+ Students
//                       </h4>
//                     </div>
//                   </div>
//                   <div className="col-md-4 col-6 position-relative">
//                     <div className="inner_reach_section inner_reach_section1">
//                       <h4 className="reach_header">
//                         Availability <br />
//                         <span className="stu_across">Pan India</span>
//                       </h4>
//                     </div>
//                   </div>
//                   <div className="col-md-4 col-6">
//                     <div className="inner_reach_section">
//                       <h4 className="reach_header">
//                         Partners <br /> 10,000+
//                       </h4>
//                     </div>
//                   </div>
//                   <div className="col-md-4 col-6">
//                     {/* <!-- <div className="inner--socialicon inner_reach_section">
//                     <ul>
//                       <li>
//                         <a href="#">
//                           <img src="public_assets/images/social/facebook.png" alt="">
//                         </a>
//                       </li>
//                       <li>
//                         <a href="#"> 
//                           <img src="public_assets/images/social/instagram.avif" className="insta" alt="">
//                         </a>
//                       </li>
//                       <li>
//                           <a href="#">
//                             <img src="public_assets/images/social/youtube.avif" alt="">
//                           </a>
//                       </li>
//                     </ul>
//                   </div> --> */}
//                   </div>
//                   <div className="col-md-4 col-6">
//                     <div className="inner_reach_section">
//                       <h4 className="reach_header">
//                         Around the World
//                       </h4>
//                     </div>
//                   </div>
//                   <div className="col-md-4 col-6">
//                     <div className="inner_reach_section text-center">
//                       {/* <!-- <h4 className="reach_header">
//                       Google Review
//                     </h4> --> */}
//                       <a href="#"><figure> <img src="/Assets/public_assets/images/icons/google.avif" style={{ width: "100%" }} /></figure></a>
//                       <div className="review-box">
//                         <p> <span id="rating"></span> out of 5 stars from <sapn id="reviews"></sapn> reviews</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//       <style>
//         {
//           `
//     .images a{
//     color : transparent;
//     }
//     `
//         }
//       </style>
//       <style>
//         {
//           `
    
// /* Hero section  */

// .home-2_hero-section .row--custom {
//     --bs-gutter-x: 24px;
//     --bs-gutter-y: 35px;
//     justify-content: center;
//     align-items: center;
//   }
  
//   /* .home-2_hero-image-block {
//     position: relative;
//     margin-left: 27px;
//   } */
//   .home-2_hero-image img {
//     width: 100%;
//   }
//   .home-2_hero-image-shape {
//     position: absolute;
//     right: -9%;
//     top: -14%;
//     width: 17%;
//   }
//   .home-2_hero-image-man-1 {
//     position: absolute;
//     left: -7%;
//     top: 30%;
//     width: 13.3%;
//   }
//   .home-2_hero-image-man-1 img {
//     width: 100%;
//   }
//   .home-2_hero-image-man-2 {
//     position: absolute;
//     right: -7%;
//     bottom: 8%;
//     width: 15%;
//   }
//   .home-2_hero-image-man-2 img {
//     width: 100%;
//   }
//   .home-2_hero-content {
//     max-width: 681px;
//   }
//   .home-2_hero-content-text {
//     text-align: center;
//     margin-bottom: 30px;
//   }

//   .home-2_hero-content-text p {
//     max-width: 590px;
//   }

  
//   .home-2_hero-button-group {
//     display: flex;
//     justify-content: center;
//     flex-wrap: wrap;
//     column-gap: 20px;
//     row-gap: 20px;
//     margin-bottom: 20px;
//   }

//   .home-2_hero-button-group .btn-outline {
//     width: 239px;
//   }
  
//   .home-2_hero-content-button__bottom-text span {
//     display: flex;
//     justify-content: center;
//     column-gap: 10px;
//     font-weight: 600;
//     font-size: 16px;
//     line-height: 1.5;
//     color: #0A102F;
//   }

//   .home-2_hero-content-text h4 {
//     color: #FFD542;
//     font-size: 30px;
//     font-weight: 300;
//     word-wrap: break-word;
//     word-spacing: 5px;
//     text-align: start;
//     margin: 0;
    
// }
// .home-2_hero-content-text h1 {
//    background: -webkit-linear-gradient(99deg, rgba(255,42,86,1) 0%, rgba(255,42,86,1) 0%, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 75%, rgba(255,255,255,1) 100%);
//    background: -o-linear-gradient(99deg, rgba(255,42,86,1) 0%, rgba(255,42,86,1) 0%, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 75%, rgba(255,255,255,1) 100%);
//    background: -moz-linear-gradient(99deg, rgba(255,42,86,1) 0%, rgba(255,42,86,1) 0%, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 75%, rgba(255,255,255,1) 100%);
//    background: linear-gradient(99deg, rgba(255,42,86,1) 0%, rgba(255,42,86,1) 0%, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 75%, rgba(255,255,255,1) 100%); 
//   -webkit-background-clip: text;
//   -webkit-text-fill-color: transparent;
//   transition: .4s ease-in;
// }
// .home-2_hero-content-text h1:hover {
//     background: -webkit-linear-gradient(99deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 0%, rgba(255,42,86,1) 35%, rgba(255,42,86,1) 75%, rgba(255,42,86,1) 100%);
//     background: -o-linear-gradient(99deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 0%, rgba(255,42,86,1) 35%, rgba(255,42,86,1) 75%, rgba(255,42,86,1) 100%);;
//     background: -moz-linear-gradient(99deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 0%, rgba(255,42,86,1) 35%, rgba(255,42,86,1) 75%, rgba(255,42,86,1) 100%);;
//     background: linear-gradient(99deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 0%, rgba(255,42,86,1) 35%, rgba(255,42,86,1) 75%, rgba(255,42,86,1) 100%);; 
//    -webkit-background-clip: text;
//    -webkit-text-fill-color: transparent;
//    transition: .8s ease-out;
//  }
// .last_cta h3 {
//     word-spacing: 4px;
// }
// div#features_cta img {
//     width: 100px;
//     height: auto;
//     text-align: center;
//     margin: 0 auto
// }
// div#features_cta h4 {
//     font-size: 14px;
//     color: #fff;
//     text-align: center;
//     font-weight: 300;
//     word-wrap: break-word;
//     transition: .3s;
// }
// .cta_cols:hover h4.head {
//     transition: .5s!important;
//     color: #FFD542!important;
// }
// .figure {
//     position: relative;
//     /* width: 360px; */
//     /* max-width: 100%; */
//   }
//   .figure img.Sirv.image-hover {
//     position: absolute;
//     top: 0;
//     right: 0;
//     left: 0;
//     bottom: 0;
//     object-fit: contain;
//     opacity: 0;
//     transition: opacity .2s;
//   }
//   .figure:hover img.Sirv.image-hover {
//     opacity: 1;
//   }
// div#features_cta figure {
//     margin: 0;
// }
// .primary-gradient {
//     background-image: linear-gradient(to right, rgba(255,42,86,1) 30%, rgba(255,42,86,1) 0%, rgba(255,255,255,1) 47%, rgba(255,255,255,1) 100%);
//     -webkit-background-clip: text; /* For older versions of Safari/Chrome */
//     background-clip: text;
//     color: transparent; /* Make text transparent */
//     /* font-size: 60px; */
// }
// .color-pink {
//     color: #FC2B5A !important;
// }
// .border_cta {
//     padding: 10px 25px;
//     border-width: 3px !important;
//     border-style: solid !important;
//     background: linear-gradient(rgba(0, 0, 0, 1), rgba(0, 0, 0, 1)) padding-box, linear-gradient(to right, rgba(151, 71, 255, 1), rgba(252, 43, 90, 1)) border-box;
//     border-radius: 15px !important;
//     border: 2px solid transparent !important;
//     width: fit-content;
// }

  
//   /* hero end section  */

//   /* HomePage specific styles */

// .home-2_hero-section {
//   padding-top: 100px;
//   padding-bottom: 60px;
//   background-color: #121212;
//   overflow: hidden;
//   position: relative;
// }



// .home-2_hero-content {
//   display: flex;
//   /* flex-direction: column; */
//   /* align-items: center; */
//   row-gap: 30px;
//   text-align: center;
// }

// .hero-content__title {
//   color: #fff;
//   margin-bottom: 24px;
//   font-style: normal;
//   line-height: 1.04;
// }

// .tagline {
//   font-size: 60px;
//   font-weight: 700;
//   padding-bottom: 20px;
//   color: #FFD542;
//   transform: translateY(20px);
//   animation: slideUp 0.8s ease-out forwards 0.3s;
// }

// .images {
//   display: flex;
//   gap: 20px;
//   transform: translateY(20px);
//   justify-content: space-between;
// }

// .images img {
//   width: 70px;
//   height: 70px;
//   transition: transform 0.3s ease;
// }

// .images img:hover {
//   transform: scale(1.1);
// }

// .partner_col.tech_area_img {
//   height: 100%;
//   padding-block: 14px;
//   /* width: 299px; */
// }

// .tech_area_img img {
//   width: 25%;
// }

// .color-pink {
//   color: #FC2B5A;
// }

// /* CTA Styles */
// #features_cta .cta_cols {
//   text-align: center;
// }

// #features_cta .figure {
//   margin-bottom: 15px;
// }

// #features_cta .head {
//   font-size: 16px;
//   font-weight: 600;
//   color: #fff;
// }

// .hidden {
//   display: none;
// }

// .tech_area_img {
//   padding: 1rem;
//   text-align: center;
// }

// .tech_area_img img {
//   max-width: 100%;
//   height: auto;
//   margin-bottom: 1rem;
// }

// .mobile-tech-area {
//   text-decoration: none;
//   color: inherit;
//   display: block;
// }
// #about .feature-widget-7 {
//   transition: .4s ease;
// }
// #about .active .feature-widget-7 {
//   z-index: 1;
//   background-color: #fff;
//   box-shadow: 0 12px 40px rgba(105,131,160,.2);
//   border-radius: 20px;
//   width: 100%;
//   padding: 10px 20px;
//   transition: .3s ease;
// }
// #about .feature-widget-7:hover {
//   z-index: 1;
//   background-color: #fff;
//   box-shadow: 0 12px 40px rgba(105,131,160,.2);
//   border-radius: 20px;
//   width: 100%;
//   padding: 10px 20px;
//   transition: .3s ease;
// }
// .active .feature-widget-7__icon-wrapper h5 {
//   /* width: 2.175rem;
//   height: 2.175rem; */
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   position: relative;
//   text-align: center;
//   color: #fff;
//   font-weight: 800;
//   font-size: .999rem;
//   -webkit-user-select: none;
//   user-select: none;
//   /* color: #fff!important; */
//   margin: 0 auto!important;
//   /* border: 1px solid #fc2b5a!important; */
//   transition: .3s ease!important;
//   /* border-radius: 50%;
//   background: #fc2b5a; */
//   transition: .3s ease;
// }
// #about .feature-widget-7{
//   padding: 10px 20px;
// }
// .feature-widget-7 {
//   grid-column-gap: 20px;
//   grid-row-gap: 20px;
//   border-radius: 15px;
//   grid-template-rows: auto;
//   grid-template-columns: 40px 1fr;
//   grid-auto-columns: 1fr;
//   align-items: center;
//   padding: 10px 20px;
//   /* padding: 15px 20px; */
//   display: grid;
// }
// .accordion-style-7-wrapper {
//   display: flex
// ;
//   flex-direction: column;
// }
// .robo_img figure img {
//   border-radius: 20px;
//   box-shadow: 10px -10px 10px rgba(128, 128, 128, 0.5);
// }
// .accordion-style-7-wrapper img {
//   width: 80%;
// }
// #how, #earning-option {
//    background-image: url(../../Assets/public_assets/images/newpage/index/bg-stipes.jpg); 
//   // background-image: url(../../../../public/Assets/public_assets/images/newpage/index/bg-stipes.jpg);
//   background-color: #FFFFFF;
//   background-size: cover;
//   background-repeat: no-repeat;
//   background-position: center center;
// }
// #skills, #whychoose, .earning-option, #team {
//   background-image: url(/Assets/public_assets/images/newpage/index/bg_texture.png);
//   // background-image: url(../../../../public/Assets/public_assets/images/newpage/index/bg_texture.png);
//   background-color: rgb(244, 250, 250);
//   background-size: cover;
//   background-repeat: no-repeat;
//   background-position: center center;
// }

// /* skills section  */
// #skills .role {
//   position: relative;
//   transform-style: preserve-3d;
//   perspective: 1000px;
//   /* opacity: 0; */
//   transform: translateY(50px);
//   border-radius: 12px;
//   overflow: hidden;
//   transition: 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
// }
// #student.role {
//   background: rgb(225, 240, 238);
//   transition: 0.3s;
// }
// #student.role:hover {
//   box-shadow: rgb(165, 214, 208) 5px 5px;
//   border-radius: 10px;
// }
// /* #skills .role:hover {
//   transform: scale(1.05);
// } */
// /* #skills .role:hover {
//   transform: scale(1.05) rotateX(5deg) rotateY(5deg);
// } */
// .role {
//   text-align: center;
//   height: 100%;
//   border-radius: 20px;
//   margin: 0px auto;
//   padding: 20px 0px;
// }
// .role {
//   position: relative;
// }
// #skills .role::before {
//   content: "";
//   position: absolute;
//   top: -50%;
//   left: -50%;
//   width: 200%;
//   height: 200%;
//   opacity: 0;
//   pointer-events: none;
//   z-index: 1;
//   background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
//   transition: opacity 0.3s;
// }
// .role p {
//   height: 50px;
// }
// .role h5 {
//   font-size: 16px;
// }
// .color-pink {
//   color: rgb(252, 43, 90) !important;
// }
// #employer.role {
//   background: rgb(191, 206, 255);
//   transition: 0.3s;
// }
// #employer.role:hover {
//   box-shadow: rgb(134, 145, 181) 5px 5px;
//   border-radius: 10px;
// }
// #employee.role {
//   background: rgb(240, 234, 234);
//   transition: 0.3s;
// }
// #employee.role:hover {
//   box-shadow: rgb(184, 158, 158) 5px 5px;
//   border-radius: 10px;
// }
// #institute.role:hover {
//   box-shadow: rgb(171, 157, 157) 5px 5px;
//   border-radius: 10px;
// }
// #institute.role {
//   background: rgb(221, 221, 221);
//   transition: 0.3s;
// }
// #educator.role {
//   background: rgb(241, 221, 221);
//   transition: 0.3s;
// }
// #educator.role:hover {
//   box-shadow: rgb(174, 141, 141) 5px 5px;
//   border-radius: 10px;
// }
// .new_link {
//   width: 50%;
//   margin: auto;
//   background: #FC2B5A;
//   border-radius: 10px;
//   padding: 10px 20px;
//   border: 1px solid #fc2b5a;
//   color: #fff;
// }
// .new_link a {
//   color: #fff;
//   font-weight: 500;
//   /* font-family: 'Inter", sans-serif'; */
//   transition: .8s ease;
// }
// .new_link:hover {
//   border: 1px solid #fc2b5a;
//   color: #000;
//   transition: 0.5s ease;
//   background: transparent;
// }
// .new_link:hover a{
//   color: #000;
// }

// /* why choose focalyt  */


// #whychoose .whychoosefocal {
//   /* opacity: 0;
//   transform: scale(0); */
//   transition: 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
// }
// .whychoosefocal {
//   margin-bottom: 40px;
//   font-weight: 700;
// }
// .why_choose_sec {
//   /* box-shadow: 0px 0px 36px 8px rgba(0, 0, 0, 0.37); */
//   border-radius: 22px;
//   padding:20px;
//   min-height: 205px;
//   transition: .5s;
//   /* height: 200px; */
// }
// .why_choose_sec p.text-white {
//   font-size: 16px;
//   font-weight: 300;
// }
// #whychoose .why_choose_sec p.text-white{
//   font-size: 20px;
//   font-weight: 300;
// }
// #whychoose .program-description{
//   /* color: #fc2b5a; */
//   font-weight: 600;
// }
// .why_choose_sec:hover {
//   box-shadow: 5px 5px rgb(188, 197, 196);
//   transition: .3s ease;
// }
// #whychoose .col-md-4:nth-child(1) .why_choose_sec {
//   background-color: #E1F0EE;
// }
// #whychoose .col-md-4:nth-child(2) .why_choose_sec {
//   background-color: #BFCEFE;
// }
// #whychoose .col-md-4:nth-child(3) .why_choose_sec {
//   background-color: #ded9ff;
// }
// #whychoose .col-md-4:nth-child(4) .why_choose_sec {
//   background-color: #F0EAEA;
// }
// #whychoose .col-md-4:nth-child(5) .why_choose_sec {
//   background-color: #DDDDDD;
// }
// #whychoose .col-md-4:nth-child(6) .why_choose_sec {
//   background-color: #F1DDDD;
// }
// #whychoose .col-md-4:nth-child(1) .why_choose_sec:hover {
//   box-shadow: 0px 5px 15px #E1F0EE;
//   transition: all 0.3s ease;
// }
// #whychoose .col-md-4:nth-child(2) .why_choose_sec:hover {
//   box-shadow: 0px 5px 15px #BFCEFE;
//   transition: all 0.3s ease;
// }
// #whychoose .col-md-4:nth-child(3) .why_choose_sec:hover {
//   /* box-shadow: 0px 5px 15px #ded9ff; */
//   box-shadow: 0px 0px 36px 8px rgba(0,0,0,0,0.3);
//   transition: all 0.3s ease;
// }
// #whychoose .col-md-4:nth-child(4) .why_choose_sec:hover {
//   /* box-shadow: 0px 5px 15px #F0EAEA; */
//   box-shadow: 0px 0px 36px 8px rgba(0,0,0,0,0.3);
//   transition: all 0.3s ease;
// }
// #whychoose .col-md-4:nth-child(5) .why_choose_sec:hover {
//   box-shadow: 0px 0px 36px 8px rgba(0,0,0,0,0.3);
//   /* box-shadow: 0px 5px 15px #DDDDDD; */
//   transition: all 0.3s ease;
// }
// #whychoose .col-md-4:nth-child(6) .why_choose_sec:hover {
//   box-shadow: 0px 0px 36px 8px rgba(0,0,0,0,0.3);
//   /* box-shadow: 0px 5px 15px #F1DDDD; */
//   transition: all 0.3s ease;
// }

// /* reach us  */
// .content h2 {
//     color: #2d3748;
//     font-size: 1.5rem;
//     font-weight: 700;
//     margin-bottom: 1rem;
// }

// .globe-background {
//   /* background-image: url(../../../../Assets/public_assets/images/globe.avif); */
//   background-image: url(/Assets/public_assets/images/globe.avif);
//   background-size: contain;
//   background-repeat: no-repeat;
//   background-position: center center;
//   position: absolute;
//   top: 50%;
//   left: 50%;
//   transform: translate(-50%, -50%);
//   width: 100%;
//   height: 150%;
//   z-index: 10;
//   opacity: 0.2;
// }
// .tabs--menu{
//   display: flex;
//   align-items: center;
//   gap: 5px;
// }
// section#hero_sm .home-2_hero-content-text h1 {
//   font-size: 55px;
//   background: -webkit-linear-gradient(99deg, rgba(255, 42, 86, 1) 0%, rgba(255, 42, 86, 1) 30%, rgba(255, 42, 86, 1) 0%, rgba(255, 255, 255, 1) 75%, rgba(255, 255, 255, 1) 100%);
//   background: -o-linear-gradient(99deg, rgba(255, 42, 86, 1) 0%, rgba(255, 42, 86, 1) 30%, rgba(255, 42, 86, 1) 0%, rgba(255, 255, 255, 1) 75%, rgba(255, 255, 255, 1) 100%);
//   background: -moz-linear-gradient(99deg, rgba(255, 42, 86, 1) 0%, rgba(255, 42, 86, 1) 30%, rgba(255, 42, 86, 1) 0%, rgba(255, 255, 255, 1) 75%, rgba(255, 255, 255, 1) 100%);
//   background: linear-gradient(99deg, rgba(255, 42, 86, 1) 0%, rgba(255, 42, 86, 1) 20%, rgba(255, 42, 86, 1) 0%, rgba(255, 255, 255, 1) 75%, rgba(255, 255, 255, 1) 100%);
//   -webkit-background-clip: text;
//   -webkit-text-fill-color: transparent;
//   transition: .4sease-in;
//   margin-top: 10px;
// }

// /* gallery  */
// .lab-gallery {
//   background-color: #f4f7f6;
//   padding: 60px 0;
// }

// .lab-gallery-item {
//   position: relative;
//   overflow: hidden;
//   border-radius: 12px;
//   box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//   transition: all 0.3s ease;
// }

// .lab-gallery-item:hover {
//   transform: scale(1.03);
//   box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
// }

// .lab-gallery-item img {
//   width: 100%;
//   height: 100%;
//   object-fit: cover;
//   transition: transform 0.3s ease;
// }

// .lab-gallery-item::before {
//   content: '';
//   position: absolute;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
//   background: linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.6));
//   opacity: 0;
//   transition: opacity 0.3s ease;
// }

// .lab-gallery-item:hover::before {
//   opacity: 1;
// }

// .large-images .lab-gallery-item {
//   height: 100%;
// }

// .small-images .lab-gallery-item {
//   height: 100%;
//   /* height: 395px; */
// }


// @media screen and (max-width: 1440px) {
//   .role p {
//       font-size: 13px;
//   }
// }
// @media screen and (max-width: 1366px) {
//   .role p {
//       font-size: 13px;
//   }
// }
// @media screen and (max-width: 1199px) {
//   .role p {
//       font-size: 11px;
//   }
// }
// @media(max-width:992px){
//   .tagline{
//     font-size: 45px;
//   }
//   .home-2_hero-content-text h4 {
//     font-size: 55px;
//     text-align: center;
//   }
//   .home-2_hero-content-text h1:hover{
//     font-size: 60px;
//   }
//   .border_cta{
//     display: flex
//     ;
//         align-items: center;
//         text-align: center;
//         justify-content: center;
//         margin-left: 25%;
//         margin-right: 25%;
//   }
//   .last_cta{
//     text-align: center;
//   }
//   #features_cta{
//     justify-content: center!important;
//   }
//   .home-2_hero-content-text {
//     text-align: initial;
//   }
// .home-2_hero-content-text {
//     margin-bottom: 20px;
//   }
// .home-2_hero-button-group {
//     justify-content: initial;
//     margin-bottom: 20px;
//   }
// .home-2_hero-content-button__bottom-text span {
//   justify-content: initial;
// }
// .home-2_hero-section .row--custom {
//     flex-direction: row-reverse;
//     justify-content: space-between;
//   }
//   .home-2_hero-section {
//     padding-top: 90px;
//     padding-bottom: 40px;
//   }
//    .home-2_hero-content-text h1 {
//     font-size: 60px;
//     text-align: center;
//   }

//   .images .home_images {
//     width: 50px;
//     margin: 8px;
//   }

//   #features_cta img {
//     width: 80px;
//   }

//   .cta_cols {
//     padding: 15px;
//   }

//   .cta_cols h4 {
//     font-size: 13px;
//   }

//   .border_cta {
//     padding: 10px 20px;
//   }

//   .border_cta p {
//     font-size: 15px;
//   }

//   .last_cta h3 {
//     font-size: 22px;
//   }
//   .home-2_hero-content{
//     flex-direction: column;
//   }
// }
// @media  (max-width: 992px) {
  
// }
// @media (min-width: 992px) {
//   .home-2_hero-section .row--custom {
//       flex-direction: row-reverse;
//       justify-content: space-between;
//   }
// }
// /* Mobile Styles */
// @media (max-width: 768px) {
//   .home-2_hero-content-text h4 {
//     font-size: 40px;
//     text-align: center;
//   }
//   section#hero_sm .home-2_hero-content-text h1 {
//     font-size: 40px;
//   }
//   .home-2_hero-content{
//     justify-content: center;
//   }
//   .home-2_hero-section .row--custom{
//     justify-content: start;
//     flex-direction: column-reverse;
//   }
//     .tagline {
//     font-size: 25px;
//     padding-block: 20px;
//   }
//   .tech_area_img img {
//     width: 100%;
//   }
//   .slider_images {
//     width: 90%;
//     margin: 0 auto;
//   }

//   .slider_images img {
//     width: 100%;
//   }
//   .border_cta{
//     margin-left: auto;
//     margin-right: auto;
//   }
// }
// @media (max-width: 768px) {
//   .large-images .lab-gallery-item,
//   .small-images .lab-gallery-item {
//       /* height: auto; */
//       margin-bottom: 20px;
//   }
// }
// @media (max-width: 576px) {
//   .home-2_hero-button-group .btn-outline {
//     width: initial;
//   }
//   .home-2_hero-content-text h4 {
//     font-size: 24px;
//   }

//   .home-2_hero-content-text h1 {
//     font-size: 36px;
//   }

//   .images .home_images {
//     width: 40px;
//     margin: 5px;
//   }

//   #features_cta img {
//     width: 60px;
//   }

//   .cta_cols {
//     padding: 10px;
//   }

//   .cta_cols h4 {
//     font-size: 12px;
//   }

//   .border_cta {
//     padding: 8px 15px;
//   }

//   .border_cta p {
//     font-size: 14px;
//   }

//   .last_cta h3 {
//     font-size: 20px;
//   }

  
//   /* Show mobile view */
//  .home-2_hero-section {
//     padding-top: 120px;
//     padding-bottom: 80px;
//   }
// }
// @media screen and (max-width: 480px) {
//   .slider_images {
//     width: 100%;
//   }
// }

//     `
//         }
//       </style>
//     </FrontLayout>
//   );
// };

// export default HomePage
