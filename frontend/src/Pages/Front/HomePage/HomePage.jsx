import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FrontLayout from "../../../Component/Layouts/Front/index";
import { PillarProjectLogo } from "./PillarProjectLogos";
import ZenithXSection from "./ZenithXSection";
import PartnersMediaSection, { ACADEMIC_PARTNERS, CSR_PARTNERS, GOVT_PARTNERS, getPartnerLabel } from "./PartnersMediaSection";
import OurApproachSection from "./OurApproachSection";
import IndustryAutomationSection from "./IndustryAutomationSection";
import { EventCard } from "../Event/Event";
import { CourseCard } from "../Courses/Course";
import { JobCard } from "../Jobs/Jobs";
import { resolveMediaUrl } from "../../../utils/resolveMediaUrl";
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
  Mail,
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
  MessageCircle,
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


const STYLES = `


.foc-cyber-home, .foc-cyber-home * { box-sizing: border-box; }

.foc-cyber-home {
  /* theme tokens — defaults from public/css/style.css :root */
  --cyan: var(--foc-cyan);
  --red: var(--foc-magenta);
  --bg: var(--foc-color-bg);
  --bg2: var(--foc-color-bg-alt);
  --surface: var(--foc-color-surface);
  --surface2: var(--foc-color-surface-2);
  --border: var(--foc-color-border);
  --border-hi: var(--foc-color-border-strong);
  --text: var(--foc-color-text);
  --muted: var(--foc-color-text-muted);
  --muted2: var(--foc-color-text-muted-2);
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

  --r: var(--foc-radius-lg);
  --ease: var(--foc-ease);
  font-family: var(--foc-font-sans);
  background: var(--bg);
  color: var(--text);
  overflow-x: hidden;
  position: relative;
  min-height: 100%;
  display: flow-root;
}

/* Default (Sky Magenta) + explicit light theme */
:root:not([data-foc-theme]) .foc-cyber-home,
:root[data-foc-theme="light"] .foc-cyber-home,
:root[data-foc-theme="sky-magenta"] .foc-cyber-home {
  --cyan:      var(--foc-cyan); /* sky */
  --red:       var(--foc-magenta); /* magenta */
  --bg:        var(--foc-color-bg);
  --bg2:       var(--foc-color-bg-alt);
  --surface:   var(--foc-color-surface);
  --surface2:  var(--foc-color-surface-2);
  --border:    rgba(4, 25, 45, .12);
  --border-hi: rgba(4, 25, 45, .18);
  --text:      var(--foc-color-text);
  --muted:     var(--foc-color-text-muted);
  --muted2:    var(--foc-color-text-muted-2);
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

/* Theme A — Aurora (purple → pink) */
:root[data-foc-theme="aurora"] .foc-cyber-home {
  --cyan:      var(--foc-purple);
  --red:       var(--foc-magenta);
  --bg:        var(--foc-color-bg);
  --bg2:       var(--foc-color-bg-alt);
  --surface:   var(--foc-color-surface);
  --surface2:  var(--foc-color-surface-2);
  --border:    rgba(16, 24, 40, .12);
  --border-hi: rgba(16, 24, 40, .18);
  --text:      var(--foc-color-text);
  --muted:     var(--foc-color-text-muted);
  --muted2:    var(--foc-color-text-muted-2);
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

/* Theme B — Warm Pearl (friendly, less tech) */
:root[data-foc-theme="pearl"] .foc-cyber-home {
  --cyan:      #C06A2B; /* warm amber */
  --red:       #E05A7B; /* soft rose */
  --bg:        #FFF7F1;
  --bg2:       #FFF1E6;
  --surface:   var(--foc-color-surface);
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

/* Theme D — Quantum Mint (clean cyber, mint + violet) */
:root[data-foc-theme="quantum-mint"] .foc-cyber-home {
  --cyan:      #2AFDAD;
  --red:       #7C3BFF;
  --bg:        #F6FFFB;
  --bg2:       #E9FFF7;
  --surface:   var(--foc-color-surface);
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

/* Theme E — Neon Slate (premium dark, dev-tool vibe) */
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

/* Theme F — Arctic Hologram (icy light, holo magenta glow) */
:root[data-foc-theme="arctic-holo"] .foc-cyber-home {
  --cyan:      #2BBAFF;
  --red:       #FF2DE2;
  --bg:        #F4FAFF;
  --bg2:       var(--foc-color-bg-alt);
  --surface:   var(--foc-color-surface);
  --surface2:  #F1F8FF;
  --border:    rgba(6, 20, 38, .12);
  --border-hi: rgba(6, 20, 38, .18);
  --text:      var(--foc-color-text);
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

/* Theme G — Matrix Lime (classic hacker green) */
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

/* Theme H — Solarpunk Circuit (teal + solar orange) */
:root[data-foc-theme="solarpunk"] .foc-cyber-home {
  --cyan:      #00C2A8;
  --red:       #FF8A00;
  --bg:        #F7FFFD;
  --bg2:       #ECFFFB;
  --surface:   var(--foc-color-surface);
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

/* Theme J — Lavender Cream (soft lilac + teal) */
:root[data-foc-theme="lavender-cream"] .foc-cyber-home {
  --cyan:      #7B61FF;
  --red:       #00B8A9;
  --bg:        #FAF8FF;
  --bg2:       #F3EEFF;
  --surface:   var(--foc-color-surface);
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

/* Theme K — Sunshine Paper (warm honey + ink blue) */
:root[data-foc-theme="sunshine-paper"] .foc-cyber-home {
  --cyan:      #E8A317;
  --red:       #1E3A5F;
  --bg:        #FFFCF3;
  --bg2:       #FFF6E0;
  --surface:   var(--foc-color-surface);
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

/* Theme L — Rose Quartz (dusty rose + slate blue) */
:root[data-foc-theme="rose-quartz"] .foc-cyber-home {
  --cyan:      #D65A7A;
  --red:       #3D6AAD;
  --bg:        #FFF8FA;
  --bg2:       #FFEDF3;
  --surface:   var(--foc-color-surface);
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

/* Theme M — Nordic Sage (sage + ice blue) */
:root[data-foc-theme="nordic-sage"] .foc-cyber-home {
  --cyan:      #5B9279;
  --red:       #5B8DEF;
  --bg:        #F7FAF8;
  --bg2:       #ECF4EF;
  --surface:   var(--foc-color-surface);
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

/* Theme I — Obsidian Burst (exact values provided) */
:root[data-foc-theme="obsidian-burst"] .foc-cyber-home {
  --bg: #000000;
  --bg2: #000000;
  --surface: #0D0D0D;
  --surface2: #0D0D0D;

  /* Primary / Secondary */
  --cyan: #C93060;
  --red: #7B3F9E;

  --text: var(--foc-color-surface);
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
  --red:       var(--foc-color-cta);
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
  padding: 15px 0;
  background: var(--bg) !important;
  color: var(--text) !important;
}
.foc-cyber-home > section.section-alt {
  background: var(--bg2) !important;
  color: var(--text) !important;
}
.foc-cyber-home .container {
  max-width: var(--foc-container-max);
  margin: 0 auto;
  padding: 0 var(--foc-container-pad);
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
  font-family: var(--foc-font-display);
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
  .foc-theme-fab-wrap { display: none !important; }
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-sans);
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-sans);
  font-size: 15px; font-weight: 400;
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
  color: var(--foc-color-text-inverse);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  border: none; border-radius: 4px;
  font-family: var(--foc-font-display);
  font-size: 13px; font-weight: 700;
  letter-spacing: .08em; 
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
  font-family: var(--foc-font-display);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.12em;
  font-family: var(--foc-font-display);
  font-weight: 900;
  letter-spacing: .10em;
  text-transform: uppercase;
  font-size: clamp(15px, 1.25vw, 20px);
  line-height: 1.1;
  color: var(--text);
  text-shadow: 0 1px 0 color-mix(in srgb, var(--surface) 40%, transparent),
    0 10px 28px color-mix(in srgb, var(--text) 18%, transparent);
}
.hero-tile-line {
  display: block;
  white-space: nowrap;
}
.hero-tile-text .hero-tile-lower { text-transform: lowercase; }
.terminal-line {
  font-family: var(--foc-font-display);
  font-size: 11px; color: var(--cyan);
  background: var(--terminalBg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 14px;
  display: flex; align-items: center; gap: 8px;
}
.terminal-line::before { content: '›'; color: var(--red); font-size: 14px; }

.marquee-bar {
  background: var(--surface);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  margin-top: 112px;
  padding: 12px 0; overflow: hidden;
  position: relative;
}
@media(max-width:768px) {
  .marquee-bar {
    margin-top: 80px;
  }
  .foc-cyber-home section.hero .marquee-bar {
    margin-bottom: 18px;
    padding: 10px 0;
    border-radius: 0;
    background: color-mix(in srgb, var(--surface) 92%, var(--bg));
    box-shadow: 0 1px 0 var(--border) inset;
  }
  .foc-cyber-home section.hero .marquee-item {
    font-size: 9px;
    letter-spacing: 0.12em;
    padding: 0 14px;
    gap: 8px;
  }
  .foc-cyber-home section.hero .marquee-bar::before,
  .foc-cyber-home section.hero .marquee-bar::after {
    width: 48px;
  }
}
.foc-cyber-home .container {
  padding: 0;
}
.hero-btns {
  gap: 7px;
  flex-wrap: wrap;
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
  padding: 0 var(--foc-container-pad);
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

/* Partner marquees (#csr / #govt) — scroll down = RTL drift; opposite on second row */
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-display);
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
  background: linear-gradient(135deg, var(--cyan), var(--foc-green-dark));
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
  font-family: var(--foc-font-display);
  font-size: clamp(26px, 4vw, 44px);
  font-weight: 700; color: var(--text);
  line-height: 1.1; letter-spacing: .04em;
}
.sh2 .cyan { color: var(--cyan); text-shadow: 0 0 16px rgba(0,229,255,.4); }
.sh2 .red  { color: var(--red);  text-shadow: 0 0 16px rgba(252,43,90,.4); }
.s-body {
  font-family: var(--foc-font-sans);
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
  font-family: var(--foc-font-display);
  font-size: 44px; font-weight: 900;
  color: rgba(0,229,255,.1); line-height: 1;
  margin-bottom: 8px;
  transition: color .3s;
}
.pillar:hover .pillar-num { color: rgba(0,229,255,.2); }
.pillar-icon { font-size: 26px; margin-bottom: 10px; }
.pillar-title { font-family: var(--foc-font-display); font-weight: 600; font-size: 14px; color: var(--text); margin-bottom: 6px; }
.pillar-desc { font-family: var(--foc-font-sans); font-size: 12px; color: var(--muted); line-height: 1.65; }

.core-tabs {
  display: flex; gap: 4px; justify-content: center;
  flex-wrap: wrap; margin-bottom: 40px;
}
.ctab {
  padding: 9px 20px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 2px;
  font-family: var(--foc-font-sans);
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

/* CSR — poster layout (reference design); font: Orbitron */
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
  --csr-green: var(--foc-green-dark);
  --csr-head-a: var(--foc-navy-panel);
  --csr-head-b: #1a3a6e;
  --csr-footer: var(--foc-navy-panel);
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
  background: var(--foc-color-surface);
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
  font-family: var(--foc-font-display);
  font-weight: 800;
  font-size: 17px;
  color: var(--foc-navy-panel);
  letter-spacing: .06em;
}

.csr-poster-h1 {
  margin: 0;
  font-family: var(--foc-font-display);
  font-weight: 900;
  font-size: clamp(22px, 4.6vw, 38px);
  color: var(--foc-color-text-inverse);
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
  font-family: var(--foc-font-display);
  font-weight: 700;
  font-size: 9px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: .1em;
  line-height: 1.35;
}
.csr-poster-hub-title {
  margin: 4px 0 0;
  font-family: var(--foc-font-display);
  font-weight: 900;
  font-size: clamp(13px, 2.2vw, 17px);
  color: var(--foc-navy-panel);
  line-height: 1.1;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.csr-poster-hub-title .cyan { color: var(--foc-blue); }

.csr-p-card {
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  font-family: var(--foc-font-display);
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
  color: var(--foc-color-text-inverse);
}
.csr-p-card--red .csr-p-icon-circle { background: var(--red); }
.csr-p-card--blue .csr-p-icon-circle { background: var(--cyan); }
.csr-p-card--orange .csr-p-icon-circle { background: var(--csr-orange); }
.csr-p-card--green .csr-p-icon-circle { background: var(--csr-green); }

.csr-p-card-title {
  margin: 0;
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-display);
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
  content: '•';
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-display);
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
  content: '–';
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
  color: var(--foc-color-text-inverse) !important;
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-display);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.csr-poster-footerbar strong {
  color: var(--foc-color-text-inverse);
  font-family: var(--foc-font-display);
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
  grid-template-columns: repeat(1, 1fr);
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
.events-grid .event-card:nth-child(4n) { --ev-accent: color-mix(in srgb, var(--red) 70%, var(--foc-purple)); border-radius: var(--foc-radius-xl) 14px 16px 18px; }
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
.event-thumb-wrap { position: relative; }
.event-thumb {
  display: block;
  width: 100%;
  height: 180px;
  padding: 0;
  border: none;
  background: var(--surface2);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.event-thumb--static { cursor: default; }
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
.event-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
}
.event-play img { width: 52px; height: 52px; }
.event-status {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 2;
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
.event-status.open {
  border-color: rgba(27,167,255,.28);
  color: var(--cyan);
}
.event-body {
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 0 1 auto;
}
.event-title {
  font-family: var(--foc-font-display);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .04em;
  color: var(--text);
  line-height: 1.25;
}
.event-subtitle {
  font-family: var(--foc-font-sans);
  font-size: 12px;
  color: var(--muted);
  line-height: 1.55;
}
.event-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 0;
}
.event-meta .m {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px;
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
  margin-top: auto;
}
.event-actions a {
  flex: 1;
  text-align: center;
  text-decoration: none;
}
#events .event-actions .btn-primary {
  display: block;
  width: 100%;
  border-radius: 50px;
  font-family: var(--foc-font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  padding: 8px 10px;
  background: var(--home-card-cta, var(--foc-navy-deep, #0d2146)) !important;
  border: 1px solid var(--home-card-cta, var(--foc-navy-deep, #0d2146)) !important;
  box-shadow: none !important;
  text-shadow: none;
}
#events .event-actions .btn-primary:hover {
  background: var(--home-card-cta-hover, var(--foc-navy-badge, #163565)) !important;
  border-color: var(--home-card-cta-hover, var(--foc-navy-badge, #163565)) !important;
  transform: none;
}
#events .event-actions .btn-primary.disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
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
#future-courses .course-card {
  font-family: var(--foc-font-sans);
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--cr-accent, var(--cyan)) 22%, var(--border));
  border-radius: var(--r);
  overflow: hidden;
  position: relative;
  --cr-accent: var(--cyan);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--cr-accent) 12%, rgba(0,0,0,.06));
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  transition: .25s var(--ease);
}
#future-courses .course-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 36px color-mix(in srgb, var(--cr-accent) 18%, rgba(0,0,0,.08));
}
#future-courses .course-carousel .course-card:nth-child(4n + 1) { --cr-accent: var(--cyan); border-radius: 14px 20px 14px 16px; }
#future-courses .course-carousel .course-card:nth-child(4n + 2) { --cr-accent: var(--red); border-radius: 18px 12px 22px 14px; }
#future-courses .course-carousel .course-card:nth-child(4n + 3) { --cr-accent: color-mix(in srgb, var(--cyan) 55%, var(--red)); border-radius: 12px 18px 14px 20px; }
#future-courses .course-carousel .course-card:nth-child(4n) { --cr-accent: color-mix(in srgb, var(--red) 70%, var(--foc-purple)); border-radius: var(--foc-radius-xl) 14px 16px 18px; }
#future-courses .course-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--cr-accent), color-mix(in srgb, var(--cr-accent) 35%, transparent));
  z-index: 2;
  pointer-events: none;
}
#future-courses .course-thumb {
  height: 160px;
  background: var(--surface2);
  position: relative;
  overflow: hidden;
}
#future-courses .course-thumb > img,
#future-courses .course-thumb-media img:first-child {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(1.03) contrast(1.03);
}
#future-courses .course-thumb-media {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
}
#future-courses .course-thumb-play {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  z-index: 1;
  pointer-events: none;
}
#future-courses .course-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(11,18,32,.35));
  pointer-events: none;
}
#future-courses .course-badge {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 2;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.92);
  color: var(--text);
}
#future-courses .course-fee {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 2;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.92);
  border: 1px solid var(--border);
}
#future-courses .course-fee--free { color: var(--cyan); border-color: rgba(27,167,255,.28); }
#future-courses .course-fee--paid { color: var(--red); border-color: rgba(255,45,122,.28); }
#future-courses .course-body {
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 0 1 auto;
}
#future-courses .course-title {
  font-family: var(--foc-font-display);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
#future-courses .course-sector {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
#future-courses .course-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 0;
}
#future-courses .course-meta .m {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px;
}
#future-courses .course-meta .m--wide {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
#future-courses .course-meta .m--wide strong {
  display: inline;
  margin-bottom: 0;
  flex-shrink: 0;
}
#future-courses .course-meta .m--wide span {
  display: inline;
  text-align: right;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#future-courses .course-meta .m strong {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted2);
  margin-bottom: 4px;
}
#future-courses .course-meta .m span {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.4;
}
#future-courses .course-action-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 2px;
}
#future-courses .btn.shr--width { width: 100%; }
#future-courses .btn.cta-callnow,
#future-courses .btn.cta-callnow.btn-bg-color {
  background: var(--home-card-cta, var(--foc-navy-deep, #0d2146));
  color: #fff;
  border: 1px solid var(--home-card-cta, var(--foc-navy-deep, #0d2146));
  border-radius: 50px;
  font-weight: 600;
  padding: 8px 10px;
  font-size: 12px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 1.25;
}
#future-courses .btn.cta-callnow:not(.btn-bg-color) {
  background: #fff;
  color: var(--home-card-cta, var(--foc-navy-deep, #0d2146));
}
#future-courses .btn.cta-callnow:hover,
#future-courses .btn.cta-callnow.btn-bg-color:hover {
  background: var(--home-card-cta-hover, var(--foc-navy-badge, #163565));
  border-color: var(--home-card-cta-hover, var(--foc-navy-badge, #163565));
  color: #fff;
}
#future-courses .course-callback-btn { margin-top: 6px; padding: 8px 10px; }
#future-courses .course_card_footer {
  background: var(--home-card-cta, var(--foc-navy-deep, #0d2146));
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  margin-top: 0;
  text-align: center;
  padding: 8px 10px;
}
#future-courses .course-learn-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
}
#future-courses .course-learn-more .learnn {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 0;
}
#future-courses .course-learn-more__icon {
  width: 18px;
  height: auto;
  display: block;
}

#future-jobs .course-card {
  font-family: var(--foc-font-sans);
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--cr-accent, var(--cyan)) 22%, var(--border));
  border-radius: var(--r);
  overflow: hidden;
  position: relative;
  --cr-accent: var(--cyan);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--cr-accent) 12%, rgba(0,0,0,.06));
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 0;
  transition: .25s var(--ease);
}
#future-jobs .course-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 36px color-mix(in srgb, var(--cr-accent) 18%, rgba(0,0,0,.08));
}
#future-jobs .job-carousel .course-card:nth-child(4n + 1) { --cr-accent: var(--cyan); border-radius: 14px 20px 14px 16px; }
#future-jobs .job-carousel .course-card:nth-child(4n + 2) { --cr-accent: var(--red); border-radius: 18px 12px 22px 14px; }
#future-jobs .job-carousel .course-card:nth-child(4n + 3) { --cr-accent: color-mix(in srgb, var(--cyan) 55%, var(--red)); border-radius: 12px 18px 14px 20px; }
#future-jobs .job-carousel .course-card:nth-child(4n) { --cr-accent: color-mix(in srgb, var(--red) 70%, var(--foc-purple)); border-radius: var(--foc-radius-xl) 14px 16px 18px; }
#future-jobs .course-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--cr-accent), color-mix(in srgb, var(--cr-accent) 35%, transparent));
  z-index: 2;
  pointer-events: none;
}
#future-jobs .course-thumb {
  height: 160px;
  background: var(--surface2);
  position: relative;
  overflow: visible;
}
#future-jobs .course-thumb > img,
#future-jobs .course-thumb-media img:first-child {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(1.03) contrast(1.03);
}
#future-jobs .course-thumb-media {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
}
#future-jobs .course-thumb-play {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  z-index: 1;
  pointer-events: none;
}
#future-jobs .course-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(11,18,32,.35));
  pointer-events: none;
}
#future-jobs .course-thumb .verified-badge-container {
  position: absolute;
  top: 10px;
  right: 7px;
  width: 15px;
  height: 15px;
  z-index: 4;
  pointer-events: none;
}
#future-jobs .course-thumb .verified-badge-container .verified-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px !important;
  height: 30px !important;
  transform: translate(-50%, -50%);
  transform-origin: center center;
  border-radius: 50%;
  object-fit: contain;
  z-index: 1002;
}
#future-jobs .course-badge {
  position: absolute;
  left: 12px;
  top: 12px;
  right: auto;
  z-index: 2;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.92);
  color: var(--text);
}
#future-jobs .job-card-body {
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 0 1 auto;
  text-align: center;
}
#future-jobs .job-card-title {
  font-family: var(--foc-font-display), Orbitron, sans-serif;
  font-size: clamp(17px, 2vw, 20px);
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#future-jobs .job-card-company {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#future-jobs .job-card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  text-align: left;
  margin-bottom: 4px;
}
#future-jobs .job-detail-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px;
  min-width: 0;
}
#future-jobs .job-detail-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}
#future-jobs .job-detail-cell span {
  font-size: 11px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#future-jobs .job-card-deadline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 2px 4px;
  text-align: left;
}
#future-jobs .job-card-deadline__label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
}
#future-jobs .job-card-deadline__date {
  font-size: 13px;
  font-weight: 700;
  color: #c9a227;
}
#future-jobs .course-action-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 2px;
}
#future-jobs .btn.shr--width { width: 100%; }
#future-jobs .btn.cta-callnow,
#future-jobs .btn.cta-callnow.btn-bg-color {
  background: var(--home-card-cta, var(--foc-navy-deep, #0d2146));
  color: #fff;
  border: 1px solid var(--home-card-cta, var(--foc-navy-deep, #0d2146));
  border-radius: 50px;
  font-weight: 600;
  padding: 8px 10px;
  font-size: 12px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 1.25;
}
#future-jobs .btn.cta-callnow:not(.btn-bg-color) {
  background: #fff;
  color: var(--home-card-cta, var(--foc-navy-deep, #0d2146));
}
#future-jobs .btn.cta-callnow:hover,
#future-jobs .btn.cta-callnow.btn-bg-color:hover {
  background: var(--home-card-cta-hover, var(--foc-navy-badge, #163565));
  border-color: var(--home-card-cta-hover, var(--foc-navy-badge, #163565));
  color: #fff;
}
#future-jobs .course_card_footer {
  background: var(--home-card-cta, var(--foc-navy-deep, #0d2146));
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  margin-top: 0;
  text-align: center;
  padding: 8px 10px;
}
#future-jobs .course-learn-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
}
#future-jobs .course-learn-more .learnn {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 0;
}
#future-jobs .course-learn-more__icon {
  width: 18px;
  height: auto;
  display: block;
}

.foc-cyber-home #future-courses,
.foc-cyber-home #future-jobs,
.foc-cyber-home #events {
  --home-card-cta: var(--foc-navy-deep, #0d2146);
  --home-card-cta-hover: var(--foc-navy-badge, #163565);
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
  padding: 4px 4px 12px;
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
.course-carousel .course-carousel-item .card.eventCard {
  width: 100%;
}
.event-carousel .course-carousel-track > .event-card {
  flex: 0 0 clamp(280px, 78vw, 380px);
  scroll-snap-align: start;
  max-width: 100%;
  box-sizing: border-box;
}
.event-carousel .course-carousel-track > .event-card:nth-child(4n + 1) { --ev-accent: var(--cyan); border-radius: 14px 20px 14px 16px; }
.event-carousel .course-carousel-track > .event-card:nth-child(4n + 2) { --ev-accent: var(--red); border-radius: 18px 12px 22px 14px; }
.event-carousel .course-carousel-track > .event-card:nth-child(4n + 3) { --ev-accent: color-mix(in srgb, var(--cyan) 55%, var(--red)); border-radius: 12px 18px 14px 20px; }
.event-carousel .course-carousel-track > .event-card:nth-child(4n) { --ev-accent: color-mix(in srgb, var(--red) 70%, var(--foc-purple)); border-radius: var(--foc-radius-xl) 14px 16px 18px; }
.job-carousel .course-carousel-track > .course-card {
  flex: 0 0 clamp(260px, 72vw, 360px);
  scroll-snap-align: start;
  max-width: 100%;
  box-sizing: border-box;
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
  font-family: var(--foc-font-display);
  font-size: 26px; font-weight: 700;
  color: var(--text); margin-bottom: 12px;
  line-height: 1.15; letter-spacing: .03em;
}
.area-desc { font-family: var(--foc-font-sans); font-size: 14px; color: var(--muted); line-height: 1.8; margin-bottom: 24px; font-style: italic; }
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
.lab-name { font-family: var(--foc-font-display); font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 6px; letter-spacing: .04em; }
.lab-desc { font-family: var(--foc-font-sans); font-size: 12px; color: var(--muted); line-height: 1.65; }

/* FFTLaaS — intro matches site; blocks below use soft “cute” shapes (not lab/why cards) */
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
.fftl-snap-v { font-family: var(--foc-font-display); font-size: 12px; font-weight: 700; color: var(--cyan); line-height: 1.25; }
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-display);
  font-size: 17px; font-weight: 900;
  color: var(--foc-color-text-inverse);
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
  font-family: var(--foc-font-display);
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
.role-name { font-family: var(--foc-font-display); font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--text); }
.role-desc { font-family: var(--foc-font-sans); font-size: 11px; color: var(--muted); line-height: 1.5; }
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
.why-title { font-family: var(--foc-font-display); font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 7px; letter-spacing: .04em; }
.why-desc { font-family: var(--foc-font-sans); font-size: 12px; color: var(--muted); line-height: 1.65; }

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
.proj-title { font-family: var(--foc-font-display); font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 12px; line-height: 1.3; letter-spacing: .02em; }
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-display);
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
  border-radius: var(--foc-radius-xl); padding: 72px 60px;
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-display);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--cyan);
  margin-bottom: 10px;
}
.partner-with-card .pwc-desc { font-family: var(--foc-font-sans); font-size: 13px; color: var(--muted); line-height: 1.55; margin: 0; }
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
  font-family: var(--foc-font-display);
  font-size: 24px; font-weight: 900;
  letter-spacing: .1em;
  display: block; margin-bottom: 12px;
  color: var(--text);
}
.footer-brand-logo .f { color: var(--cyan); text-shadow: 0 10px 24px rgba(122,43,255,.18); }
.footer-brand p { font-size: 13px; color: var(--muted); line-height: 1.75; }
.footer-col h4 {
  font-family: var(--foc-font-display);
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

/* ── Four Pillars of Impact ── */
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
  background: var(--foc-color-surface);
  border: 1px solid var(--foc-color-border-ui);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(10, 34, 64, 0.08);
  font-family: var(--foc-font-display);
}
.foc-cyber-home .ip-shell-panel {
  background: var(--foc-color-surface);
  position: relative;
}
.foc-cyber-home .ip-shell-panel .ip-three-col,
.foc-cyber-home .ip-shell-panel .ip-col,
.foc-cyber-home .ip-shell-panel .ip-projects,
.foc-cyber-home .ip-shell-panel .ip-proj-card,
.foc-cyber-home .ip-shell-panel .ip-card-info {
  background-color: var(--foc-color-text-inverse);
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
  background: var(--foc-color-surface);
  color: var(--foc-navy-mid);
  font-family: var(--foc-font-sans);
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
  outline: 2px solid var(--foc-sky-bright);
  outline-offset: 2px;
}
.foc-cyber-home .ip-tab-num {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800;
  border: 1.5px solid var(--foc-slate-400);
  color: var(--foc-navy-mid);
  background: var(--foc-panel-bg);
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.foc-cyber-home .ip-tab-btn.is-on {
  color: var(--foc-color-text-inverse);
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(10, 34, 64, 0.22);
  transform: translateY(-1px);
}
.foc-cyber-home .ip-tab-btn.p1.is-on { background: var(--foc-navy-mid); }
.foc-cyber-home .ip-tab-btn.p2.is-on { background: var(--foc-purple-900); }
.foc-cyber-home .ip-tab-btn.p3.is-on { background: var(--foc-purple-700); }
.foc-cyber-home .ip-tab-btn.p4.is-on { background: var(--foc-green-700); }
.foc-cyber-home .ip-tab-btn.is-on .ip-tab-num {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.55);
  color: var(--foc-color-text-inverse);
}
.foc-cyber-home .ip-tab-btn.p1.is-on .ip-tab-num { background: var(--foc-sky-bright); border-color: var(--foc-sky-bright); color: var(--foc-navy-mid); }
.foc-cyber-home .ip-tab-btn.p2.is-on .ip-tab-num { background: var(--foc-violet-400); border-color: var(--foc-violet-400); color: var(--foc-indigo-950); }
.foc-cyber-home .ip-tab-btn.p3.is-on .ip-tab-num { background: var(--foc-violet-300); border-color: var(--foc-violet-300); color: var(--foc-purple-900); }
.foc-cyber-home .ip-tab-btn.p4.is-on .ip-tab-num { background: var(--foc-green-light); border-color: var(--foc-green-light); color: #052e16; }

.foc-cyber-home .ip-hdr {
  padding: 1.5rem 1.75rem 1.25rem;
  position: relative;
  overflow: hidden;
  color: var(--foc-color-text-inverse);
}
.foc-cyber-home .ip-hdr.p1 { background: linear-gradient(135deg, var(--foc-navy-mid) 0%, #123a6e 100%); }
.foc-cyber-home .ip-hdr.p2 { background: linear-gradient(135deg, var(--foc-indigo-950) 0%, var(--foc-indigo-900) 100%); }
.foc-cyber-home .ip-hdr.p3 { background: linear-gradient(135deg, var(--foc-indigo-950) 0%, var(--foc-purple-900) 100%); }
.foc-cyber-home .ip-hdr.p4 { background: linear-gradient(135deg, #052e16 0%, var(--foc-green-800) 100%); }
.foc-cyber-home .ip-hdr-top { display: flex; align-items: flex-start; gap: 1.25rem; }
.foc-cyber-home .ip-hdr-left { flex: 1; min-width: 0; }
.foc-cyber-home .ip-brand-badge {
  display: inline-flex; align-items: center; gap: 7px;
  border-radius: 8px; padding: 5px 12px 5px 10px; margin-bottom: 10px;
  font-size: 11px; font-weight: 700; color: var(--foc-color-text-inverse); letter-spacing: 0.3px;
}
.foc-cyber-home .ip-hdr.p1 .ip-brand-badge { background: var(--foc-green-dark); }
.foc-cyber-home .ip-hdr.p2 .ip-brand-badge { background: var(--foc-purple); }
.foc-cyber-home .ip-hdr.p3 .ip-brand-badge { background: var(--foc-purple-900); }
.foc-cyber-home .ip-hdr.p4 .ip-brand-badge { background: var(--foc-green-700); }
.foc-cyber-home .ip-pillar-tag {
  display: inline-block; color: var(--foc-color-text-inverse); font-size: 10px; font-weight: 700;
  letter-spacing: 2px; text-transform: uppercase; padding: 3px 10px; border-radius: 3px; margin-bottom: 7px;
}
.foc-cyber-home .ip-hdr.p1 .ip-pillar-tag { background: var(--foc-brand-blue); }
.foc-cyber-home .ip-hdr.p2 .ip-pillar-tag { background: var(--foc-purple); }
.foc-cyber-home .ip-hdr.p3 .ip-pillar-tag { background: var(--foc-purple-700); }
.foc-cyber-home .ip-hdr.p4 .ip-pillar-tag { background: var(--foc-green); }
.foc-cyber-home .ip-hdr .ip-hdr-title {
  font-family: var(--foc-font-display);
  font-size: clamp(1.4rem, 3vw, 1.95rem);
  font-weight: 800;
  color: var(--foc-color-text-inverse);
  line-height: 1.15;
  margin: 0 0 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}
.foc-cyber-home .ip-hdr .ip-hdr-title .ip-accent { color: var(--foc-sky-light); }
.foc-cyber-home .ip-hdr .ip-hdr-title .ip-accent2 { color: var(--foc-violet-300); }
.foc-cyber-home .ip-hdr .ip-hdr-title .ip-accent4 { color: var(--foc-green-100); }
.foc-cyber-home .ip-hdr .ip-hdr-sub {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--foc-blue-tint-bg);
  letter-spacing: 0.02em;
}
.foc-cyber-home .ip-hdr.p2 .ip-hdr-sub,
.foc-cyber-home .ip-hdr.p3 .ip-hdr-sub { color: var(--foc-purple-100); }
.foc-cyber-home .ip-hdr.p4 .ip-hdr-sub { color: var(--foc-green-50); }
.foc-cyber-home .ip-hdr .ip-hdr-desc {
  font-family: var(--foc-font-sans);
  font-size: 14px;
  line-height: 1.75;
  max-width: 680px;
  margin: 0;
  color: var(--foc-color-bg-section);
  font-weight: 400;
  opacity: 1;
}
.foc-cyber-home .ip-hdr.p1 .ip-hdr-desc { color: var(--foc-panel-bg-alt); }
.foc-cyber-home .ip-hdr.p2 .ip-hdr-desc,
.foc-cyber-home .ip-hdr.p3 .ip-hdr-desc { color: var(--foc-purple-50); }
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
  color: var(--foc-color-text-inverse);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.foc-cyber-home .ip-hdr .ip-icon-pill span {
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  line-height: 1.25;
  color: var(--foc-color-text-inverse);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.foc-cyber-home .ip-three-col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 1rem 1.15rem 1.25rem;
  background: var(--foc-color-surface);
}
.foc-cyber-home .ip-three-col.p1 { border-top: 3px solid var(--foc-brand-blue); }
.foc-cyber-home .ip-three-col.p2 { border-top: 3px solid var(--foc-purple); }
.foc-cyber-home .ip-three-col.p3 { border-top: 3px solid var(--foc-purple-700); }
.foc-cyber-home .ip-three-col.p4 { border-top: 3px solid var(--foc-green); }
.foc-cyber-home .ip-col {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border: 1px solid var(--foc-color-border-ui);
  border-radius: 10px;
  overflow: hidden;
  background: var(--foc-color-surface);
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
.foc-cyber-home .ip-three-col.p1 .ip-col-head { background: var(--foc-panel-bg-alt); border-bottom-color: var(--foc-brand-blue); }
.foc-cyber-home .ip-three-col.p2 .ip-col-head { background: var(--foc-purple-50); border-bottom-color: var(--foc-purple); }
.foc-cyber-home .ip-three-col.p3 .ip-col-head { background: var(--foc-purple-50); border-bottom-color: var(--foc-purple-700); }
.foc-cyber-home .ip-three-col.p4 .ip-col-head { background: var(--foc-green-50-alt); border-bottom-color: var(--foc-green); }
.foc-cyber-home .ip-col-ico {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.foc-cyber-home .ip-col-ico.blue { background: var(--foc-sky-tint); color: var(--foc-blue-deep); }
.foc-cyber-home .ip-col-ico.purple { background: var(--foc-purple-100); color: var(--foc-purple-700); }
.foc-cyber-home .ip-col-ico.green { background: var(--foc-green-50); color: var(--foc-green-700); }
.foc-cyber-home .ip-col-ico.orange { background: var(--foc-color-surface)3e0; color: var(--foc-orange); }
.foc-cyber-home .ip-col-title {
  font-size: 12px; font-weight: 800; letter-spacing: 1.2px;
  text-transform: uppercase; color: var(--foc-navy-mid); line-height: 1.3;
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
  background: var(--foc-color-surface);
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
  font-family: var(--foc-font-sans);
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
  background: var(--foc-color-surface);
  box-shadow: 0 1px 3px rgba(10, 34, 64, 0.04);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.foc-cyber-home .ip-focus-list li:hover {
  border-color: var(--foc-blue-tint);
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
.foc-cyber-home .ip-three-col.p1 .ip-focus-ico { background: var(--foc-sky-tint); color: var(--foc-blue-deep); }
.foc-cyber-home .ip-three-col.p2 .ip-focus-ico { background: var(--foc-purple-100); color: var(--foc-purple-700); }
.foc-cyber-home .ip-three-col.p3 .ip-focus-ico { background: var(--foc-purple-100); color: var(--foc-purple-800); }
.foc-cyber-home .ip-three-col.p4 .ip-focus-ico { background: var(--foc-green-50); color: var(--foc-green-700); }
.foc-cyber-home .ip-three-col.p1 .ip-focus-list li { border-left: 4px solid var(--foc-brand-blue); }
.foc-cyber-home .ip-three-col.p2 .ip-focus-list li { border-left: 4px solid var(--foc-purple); }
.foc-cyber-home .ip-three-col.p3 .ip-focus-list li { border-left: 4px solid var(--foc-purple-700); }
.foc-cyber-home .ip-three-col.p4 .ip-focus-list li { border-left: 4px solid var(--foc-green); }
.foc-cyber-home .ip-check {
  font-family: var(--foc-font-sans);
  display: flex; align-items: flex-start; gap: 9px;
  font-size: 14px; color: #1e2d3d; padding: 10px 12px;
  border: 1px solid var(--foc-color-border-light); border-radius: 8px;
  line-height: 1.5; font-weight: 500; background: var(--foc-color-surface);
}
.foc-cyber-home .ip-three-col.p1 .ip-check { border-left: 3px solid var(--foc-brand-blue); }
.foc-cyber-home .ip-three-col.p2 .ip-check,
.foc-cyber-home .ip-three-col.p3 .ip-check { border-left: 3px solid var(--foc-purple); }
.foc-cyber-home .ip-three-col.p4 .ip-check { border-left: 3px solid var(--foc-green); }
.foc-cyber-home .ip-chk {
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;
}
.foc-cyber-home .ip-three-col.p1 .ip-chk { background: var(--foc-sky-tint); color: var(--foc-blue-deep); }
.foc-cyber-home .ip-three-col.p2 .ip-chk, .foc-cyber-home .ip-three-col.p3 .ip-chk { background: var(--foc-purple-100); color: var(--foc-purple-700); }
.foc-cyber-home .ip-three-col.p4 .ip-chk { background: var(--foc-green-50); color: var(--foc-green-700); }
.foc-cyber-home .ip-snap {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 10px 12px;
  border: 1px solid var(--foc-color-border-light); border-radius: 8px;
  background: var(--foc-color-surface);
}
.foc-cyber-home .ip-three-col.p1 .ip-snap { border-left: 3px solid var(--foc-brand-blue); }
.foc-cyber-home .ip-three-col.p2 .ip-snap,
.foc-cyber-home .ip-three-col.p3 .ip-snap { border-left: 3px solid var(--foc-purple); }
.foc-cyber-home .ip-three-col.p4 .ip-snap { border-left: 3px solid var(--foc-green); }
.foc-cyber-home .ip-snap-ico {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
}
.foc-cyber-home .ip-three-col.p1 .ip-snap-ico { background: var(--foc-color-surface)3e0; color: var(--foc-orange); }
.foc-cyber-home .ip-three-col.p2 .ip-snap-ico, .foc-cyber-home .ip-three-col.p3 .ip-snap-ico { background: var(--foc-purple-100); color: var(--foc-purple-700); }
.foc-cyber-home .ip-three-col.p4 .ip-snap-ico { background: var(--foc-green-50); color: var(--foc-green-700); }
.foc-cyber-home .ip-snap-text { font-size: 14px; color: #1e2d3d; line-height: 1.5; font-weight: 500; }

.foc-cyber-home .ip-sec-head {
  margin: 14px 1.25rem 0;
  border: 1px solid var(--foc-color-border-ui);
  border-radius: 8px;
  padding: 9px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(10, 34, 64, 0.06);
}
.foc-cyber-home .ip-sec-head.p1 { background: var(--foc-panel-bg); }
.foc-cyber-home .ip-sec-head.p2, .foc-cyber-home .ip-sec-head.p3 { background: var(--foc-purple-50); }
.foc-cyber-home .ip-sec-head.p4 { background: var(--foc-green-50-alt); }
.foc-cyber-home .ip-sec-head-ico {
  width: 18px; height: 18px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center; color: var(--foc-color-text-inverse); font-size: 10px;
}
.foc-cyber-home .ip-sec-head.p1 .ip-sec-head-ico { background: var(--foc-navy-mid); }
.foc-cyber-home .ip-sec-head.p2 .ip-sec-head-ico, .foc-cyber-home .ip-sec-head.p3 .ip-sec-head-ico { background: var(--foc-purple-900); }
.foc-cyber-home .ip-sec-head.p4 .ip-sec-head-ico { background: var(--foc-green-deep); }
.foc-cyber-home .ip-sec-head-label {
  font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
}
.foc-cyber-home .ip-sec-head.p1 .ip-sec-head-label { color: var(--foc-navy-mid); }
.foc-cyber-home .ip-sec-head.p2 .ip-sec-head-label, .foc-cyber-home .ip-sec-head.p3 .ip-sec-head-label { color: var(--foc-purple-900); }
.foc-cyber-home .ip-sec-head.p4 .ip-sec-head-label { color: var(--foc-green-deep); }

.foc-cyber-home .ip-projects { display: flex; flex-direction: column; gap: 16px; padding: 1.25rem 1.5rem 1.5rem; }
.foc-cyber-home .ip-proj-card {
  border: 1px solid var(--foc-color-border-ui); border-radius: 12px; overflow: hidden;
  background: var(--foc-color-surface); display: flex; flex-direction: row; align-items: stretch;
  min-height: 148px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.foc-cyber-home .ip-proj-card:hover {
  border-color: #b5c9e0;
  box-shadow: 0 6px 24px rgba(10, 34, 64, 0.1);
}
.foc-cyber-home .ip-proj-card--reverse { flex-direction: row-reverse; }
.foc-cyber-home .ip-photo {
  width: 38%; min-width: 200px; max-width: 280px; background: var(--foc-panel-bg);
  position: relative; overflow: hidden; flex-shrink: 0;
}
.foc-cyber-home .ip-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.foc-cyber-home .ip-photo-ph {
  width: 100%; height: 100%; min-height: 148px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 12px;
}
.foc-cyber-home .ip-photo-ph svg { color: var(--foc-blue-tint); }
.foc-cyber-home .ip-photo-ph span { font-size: 11px; color: #6b7c8f; text-align: center; line-height: 1.4; }
.foc-cyber-home .ip-proj-num {
  position: absolute; top: 10px; left: 10px; width: 26px; height: 26px; border-radius: 50%;
  color: var(--foc-color-text-inverse); font-size: 10px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.foc-cyber-home .ip-proj-card--reverse .ip-proj-num { left: auto; right: 10px; }
.foc-cyber-home .ip-hdr.p1 ~ .ip-three-col ~ .ip-sec-head ~ .ip-projects .ip-proj-num,
.foc-cyber-home .ip-shell .ip-proj-num.p1 { background: var(--foc-navy-mid); }
.foc-cyber-home .ip-proj-num.p1 { background: var(--foc-navy-mid); }
.foc-cyber-home .ip-proj-num.p2, .foc-cyber-home .ip-proj-num.p3 { background: var(--foc-purple-900); }
.foc-cyber-home .ip-proj-num.p4 { background: var(--foc-green-deep); }
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
.foc-cyber-home .ip-proj-logo img { width: 100%; height: 100%; object-fit: contain; display: block; }
.foc-cyber-home .ip-proj-name { font-size: 14px; font-weight: 700; color: var(--foc-navy-mid); line-height: 1.35; margin: 0; }
.foc-cyber-home .ip-proj-desc { font-family: var(--foc-font-sans); font-size: 12.5px; color: #3d4f63; line-height: 1.6; margin: 0; }
.foc-cyber-home .ip-chips {
  display: flex; flex-wrap: wrap; gap: 7px;
  margin-top: 8px; padding-top: 10px;
  border-top: 1px dashed var(--foc-color-border-ui);
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
.foc-cyber-home .ip-chip.tg.p1 { background: var(--foc-sky-tint); color: #0c447c; border: 1px solid var(--foc-blue-tint); }
.foc-cyber-home .ip-chip.cv.p1 { background: #e1f5ee; color: #085041; border: 1px solid #9fe1cb; }
.foc-cyber-home .ip-chip.if.p1 { background: var(--foc-color-surface)3e0; color: #b45309; border: 1px solid #ffcc80; }
.foc-cyber-home .ip-chip.tg.p2, .foc-cyber-home .ip-chip.tg.p3 { background: var(--foc-purple-100); color: var(--foc-purple-900); border: 1px solid var(--foc-violet-300); }
.foc-cyber-home .ip-chip.cv.p2, .foc-cyber-home .ip-chip.cv.p3 { background: #e0f2fe; color: #0c4a6e; border: 1px solid var(--foc-sky-light); }
.foc-cyber-home .ip-chip.if.p2, .foc-cyber-home .ip-chip.if.p3 { background: #fef9c3; color: #713f12; border: 1px solid #fde047; }
.foc-cyber-home .ip-chip.tg.p4 { background: var(--foc-green-50); color: var(--foc-green-deep); border: 1px solid var(--foc-green-light); }
.foc-cyber-home .ip-chip.cv.p4 { background: #e0f2fe; color: #0c4a6e; border: 1px solid var(--foc-sky-light); }
.foc-cyber-home .ip-chip.if.p4 { background: #fef9c3; color: #713f12; border: 1px solid #fde047; }

.foc-cyber-home .ip-impact-row {
  padding: 0.8rem 1.25rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.foc-cyber-home .ip-impact-row.p1 { background: var(--foc-navy-mid); }
.foc-cyber-home .ip-impact-row.p2, .foc-cyber-home .ip-impact-row.p3 { background: var(--foc-indigo-950); }
.foc-cyber-home .ip-impact-row.p4 { background: #052e16; }
.foc-cyber-home .ip-imp-val { font-size: 12px; font-weight: 800; text-align: center; }
.foc-cyber-home .ip-impact-row.p1 .ip-imp-val { color: var(--foc-sky-bright); }
.foc-cyber-home .ip-impact-row.p2 .ip-imp-val, .foc-cyber-home .ip-impact-row.p3 .ip-imp-val { color: var(--foc-violet-400); }
.foc-cyber-home .ip-impact-row.p4 .ip-imp-val { color: var(--foc-green-light); }
.foc-cyber-home .ip-imp-lbl { font-size: 8.5px; margin-top: 2px; line-height: 1.3; text-align: center; }
.foc-cyber-home .ip-impact-row.p1 .ip-imp-lbl { color: var(--foc-blue-tint-bg); }
.foc-cyber-home .ip-impact-row.p2 .ip-imp-lbl, .foc-cyber-home .ip-impact-row.p3 .ip-imp-lbl { color: var(--foc-purple-100); }
.foc-cyber-home .ip-impact-row.p4 .ip-imp-lbl { color: var(--foc-green-50); }

.foc-cyber-home .ip-footer {
  padding: 7px 1.25rem; display: flex; align-items: center;
  justify-content: space-between; gap: 10px; flex-wrap: wrap;
  border-top: 2px solid;
}
.foc-cyber-home .ip-footer.p1 { background: var(--foc-panel-bg); border-top-color: var(--foc-brand-blue); }
.foc-cyber-home .ip-footer.p2, .foc-cyber-home .ip-footer.p3 { background: var(--foc-purple-50); border-top-color: var(--foc-purple); }
.foc-cyber-home .ip-footer.p3 { border-top-color: var(--foc-purple-700); }
.foc-cyber-home .ip-footer.p4 { background: var(--foc-green-50-alt); border-top-color: var(--foc-green); }
.foc-cyber-home .ip-footer-tagline { font-size: 11px; font-weight: 700; color: var(--foc-navy-mid); }
.foc-cyber-home .ip-footer-tags { display: flex; gap: 5px; flex-wrap: wrap; }
.foc-cyber-home .ip-ftag { font-size: 9px; padding: 2px 7px; border-radius: 50px; }
.foc-cyber-home .ip-ftag.p1 { background: var(--foc-sky-tint); color: #0c447c; border: 1px solid var(--foc-blue-tint); }
.foc-cyber-home .ip-ftag.p2, .foc-cyber-home .ip-ftag.p3 { background: var(--foc-purple-100); color: var(--foc-purple-900); border: 1px solid var(--foc-violet-300); }
.foc-cyber-home .ip-ftag.p4 { background: var(--foc-green-50); color: var(--foc-green-deep); border: 1px solid var(--foc-green-light); }

/* Override section theme text on dark pillar header (section.color was forcing dark --text) */
.foc-cyber-home > section.section .ip-hdr .ip-hdr-title {
  color: var(--foc-color-text-inverse) !important;
}
.foc-cyber-home > section.section .ip-hdr .ip-hdr-title .ip-accent { color: var(--foc-sky-light) !important; }
.foc-cyber-home > section.section .ip-hdr .ip-hdr-title .ip-accent2 { color: var(--foc-violet-300) !important; }
.foc-cyber-home > section.section .ip-hdr .ip-hdr-title .ip-accent4 { color: var(--foc-green-100) !important; }
.foc-cyber-home > section.section .ip-hdr .ip-hdr-sub { color: var(--foc-blue-tint-bg) !important; }
.foc-cyber-home > section.section .ip-hdr.p2 .ip-hdr-sub,
.foc-cyber-home > section.section .ip-hdr.p3 .ip-hdr-sub { color: var(--foc-purple-100) !important; }
.foc-cyber-home > section.section .ip-hdr.p4 .ip-hdr-sub { color: var(--foc-green-50) !important; }
.foc-cyber-home > section.section .ip-hdr .ip-hdr-desc { color: var(--foc-panel-bg-alt) !important; }
.foc-cyber-home > section.section .ip-hdr.p2 .ip-hdr-desc,
.foc-cyber-home > section.section .ip-hdr.p3 .ip-hdr-desc { color: var(--foc-purple-50) !important; }
.foc-cyber-home > section.section .ip-hdr.p4 .ip-hdr-desc { color: #ecfdf5 !important; }
.foc-cyber-home > section.section .ip-hdr .ip-icon-pill span { color: var(--foc-color-text-inverse) !important; }

@media(max-width:900px) {
  .foc-cyber-home .ip-three-col { grid-template-columns: 1fr; gap: 14px; }
  .foc-cyber-home .ip-col { border-right: none; border-bottom: none; }
  .foc-cyber-home .ip-hdr-top { flex-direction: column; }
  .foc-cyber-home .ip-hdr-icons { align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
  .foc-cyber-home .ip-impact-row { grid-template-columns: repeat(2, 1fr); }
}
@media(max-width:768px) {
  .foc-cyber-home #about.section {
    padding: 56px 0;
  }
  .foc-cyber-home #about .container {
    padding-left: 16px;
    padding-right: 16px;
  }
  .foc-cyber-home #about .section-head {
    margin-bottom: 20px;
  }
  .foc-cyber-home #about .section-head .sh2 {
    font-size: clamp(1.35rem, 5.5vw, 1.85rem);
    line-height: 1.15;
  }
  .foc-cyber-home #about .section-head .stag {
    font-size: 10px;
  }
  .foc-cyber-home .ip-pillars-wrap {
    gap: 10px;
  }
  .foc-cyber-home .ip-tab-nav {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 10px;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x proximity;
    scrollbar-width: thin;
    scrollbar-color: var(--foc-slate-muted) transparent;
    padding-bottom: 8px;
    margin-left: -16px;
    margin-right: -16px;
    padding-left: 16px;
    padding-right: 16px;
    width: auto;
  }
  .foc-cyber-home .ip-tab-nav::-webkit-scrollbar {
    height: 4px;
  }
  .foc-cyber-home .ip-tab-nav::-webkit-scrollbar-thumb {
    background: var(--foc-slate-muted);
    border-radius: 4px;
  }
  .foc-cyber-home .ip-tab-btn {
    flex: 0 0 auto;
    width: auto;
    justify-content: flex-start;
    align-items: center;
    white-space: nowrap;
    text-align: left;
    line-height: 1.2;
    font-size: 10px;
    letter-spacing: 0.3px;
    padding: 11px 14px;
    gap: 8px;
    min-height: 44px;
    scroll-snap-align: start;
  }
  .foc-cyber-home .ip-tab-num {
    width: 26px;
    height: 26px;
    font-size: 11px;
    flex-shrink: 0;
  }
  .foc-cyber-home .ip-shell {
    border-radius: 10px;
  }
  .foc-cyber-home .ip-hdr {
    padding: 1.15rem 1rem 1rem;
  }
  .foc-cyber-home .ip-hdr .ip-hdr-title {
    font-size: clamp(1.15rem, 4.5vw, 1.5rem);
  }
  .foc-cyber-home .ip-hdr .ip-hdr-desc {
    font-size: 13px;
    line-height: 1.65;
  }
  .foc-cyber-home .ip-three-col {
    padding: 0.85rem 0.75rem 1rem;
    gap: 12px;
  }
  .foc-cyber-home .ip-sec-head {
    margin-left: 0.75rem;
    margin-right: 0.75rem;
  }
  .foc-cyber-home .ip-projects {
    padding: 1rem 0.75rem 1.15rem;
  }
  .foc-cyber-home .ip-footer {
    padding: 10px 0.75rem;
    flex-direction: column;
    align-items: flex-start;
  }
}

@media(max-width:600px) {
  .foc-cyber-home .ip-proj-card,
  .foc-cyber-home .ip-proj-card--reverse { flex-direction: column; }
  .foc-cyber-home .ip-photo {
    width: 100%; min-width: 0; max-width: none; height: 160px; order: -1;
  }
  .foc-cyber-home .ip-proj-card--reverse .ip-proj-num { left: 10px; right: auto; }
  .foc-cyber-home .ip-card-info { padding: 14px 16px; }
  .foc-cyber-home .ip-impact-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 0.75rem 0.85rem;
  }
}

@media(max-width:480px) {
  .foc-cyber-home #about .container {
    padding-left: 12px;
    padding-right: 12px;
  }
  .foc-cyber-home .ip-tab-nav {
    margin-left: -12px;
    margin-right: -12px;
    padding-left: 12px;
    padding-right: 12px;
  }
  .foc-cyber-home .ip-tab-btn {
    font-size: 9px;
    padding: 10px 12px;
    gap: 7px;
  }
  .foc-cyber-home .ip-tab-num {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }
  .foc-cyber-home .ip-focus-list li {
    font-size: 13px;
    padding: 9px 10px;
  }
  .foc-cyber-home .ip-check,
  .foc-cyber-home .ip-snap-text {
    font-size: 13px;
  }
  .foc-cyber-home .ip-impact-row {
    grid-template-columns: 1fr;
  }
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
  .foc-cyber-home section.hero {
    min-height: auto;
    padding: 104px 0 52px;
  }
  .hero .container {
    width: 100%;
    max-width: 100%;
    /* padding-left: 20px; */
    /* padding-right: 20px; */
  }
  .hero-inner {
    gap: 28px;
    align-items: start;
  }
  .foc-cyber-home section.hero .container {
    padding-left: 18px;
    padding-right: 18px;
  }
  .foc-cyber-home section.hero .hero-inner > div:first-child {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .foc-cyber-home section.hero .hero-topbar {
    width: 100%;
    align-items: center;
    margin-bottom: 14px;
  }
  .hero-eyebrow {
    max-width: 100%;
    width: fit-content;
    margin-top: 0;
    margin-bottom: 16px;
    padding: 8px 14px;
    font-size: 10px;
    line-height: 1.35;
    letter-spacing: 0.06em;
    border-radius: 999px;
    justify-content: center;
    text-align: center;
  }
  .hero-h1 {
    max-width: none;
    width: 100%;
    margin-bottom: 18px;
    font-size: clamp(1.65rem, 7.2vw, 2.35rem);
    line-height: 1.08;
    letter-spacing: 0.01em;
    text-wrap: balance;
  }
  .hero-btns {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    width: 100%;
    max-width: 360px;
    margin-top: 4px;
    margin-left: auto;
    margin-right: auto;
  }
  .hero-btns .btn-primary {
    width: 100%;
    min-width: 0;
    min-height: 48px;
    justify-content: center;
    padding: 12px 20px;
    font-size: 12px;
    line-height: 1.2;
    letter-spacing: 0.07em;
    border-radius: 14px;
    white-space: nowrap;
    box-shadow:
      0 10px 28px color-mix(in srgb, var(--cyan) 28%, transparent),
      0 6px 18px color-mix(in srgb, var(--red) 18%, transparent);
  }
  .hero-btns .btn-primary:active {
    transform: scale(0.98);
  }
  .hero-right {
    margin-top: 8px;
    gap: 16px;
    align-items: center;
    width: 100%;
  }
  .foc-cyber-home section.hero .hero-kicker {
    max-width: 320px;
    line-height: 1.5;
  }
  .foc-cyber-home section.hero .hero-right-cta {
    width: 100%;
    max-width: 360px;
    min-height: 48px;
    justify-content: center;
    border-radius: 14px;
    font-size: 12px;
  }
  .hero-tiles-inner {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
  }
  .hero-tiles { gap: 18px; margin-top: 18px; }
  .hero-tile { min-height: 110px; padding: 26px 14px; }
  .labs-grid, .roles-grid { grid-template-columns: repeat(2,1fr); }
  .lab-card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 12px;
    padding: 22px 18px;
  }
  .lab-icon-box {
    margin-bottom: 0;
    flex-shrink: 0;
    width: 46px;
    height: 46px;
  }
  .lab-name {
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
    line-height: 1.3;
  }
  .lab-desc {
    width: 100%;
  }
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
  .foc-cyber-home section.hero {
    padding-top: 78px;
    padding-bottom: 40px;
  }
  .foc-cyber-home section.hero .container {
    padding-left: 16px;
    padding-right: 16px;
  }
  .foc-cyber-home section.hero .marquee-bar {
    margin-bottom: 14px;
    padding: 9px 0;
  }
  .foc-cyber-home section.hero .marquee-item {
    font-size: 8.5px;
    padding: 0 12px;
  }
  .hero-topbar {
    margin-bottom: 10px;
  }
  .hero-eyebrow {
    font-size: 9px;
    padding: 7px 12px;
    line-height: 1.3;
  }
  .hero-h1 {
    max-width: none;
    font-size: clamp(1.5rem, 8.5vw, 2rem);
    margin-bottom: 14px;
  }
  .hero-btns {
    max-width: 100%;
    gap: 9px;
  }
  .hero-btns .btn-primary {
    min-height: 46px;
    padding: 11px 16px;
    font-size: 11px;
    border-radius: 12px;
  }
  .hero-kicker {
    font-size: 9px;
    line-height: 1.45;
  }
  .hero-tiles-inner {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .hero-tile {
    min-height: 86px;
    padding: 18px 12px;
    border-radius: 12px;
  }
  .hero-tile-text {
    font-size: clamp(11px, 3.2vw, 13px);
    letter-spacing: .06em;
  }
  .labs-grid, .roles-grid, .why-grid { grid-template-columns: 1fr; }
  .pillars { grid-template-columns: 1fr; }
  .lab-card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 14px;
    padding: 20px 18px;
  }
  .lab-icon-box {
    margin-bottom: 0;
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
  .lab-name {
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
    font-size: 13px;
    line-height: 1.3;
  }
  .lab-desc {
    width: 100%;
    margin-top: 2px;
  }
}

/* ── Geographic reach map (Leaflet) ── */
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-display);
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
  font-family: var(--foc-font-display);
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
  { num: "01", icon: "🎓", title: "Future-Ready Skills", desc: "Advanced AI, ML, Cloud, Drone Pilot, Robotics — industry-aligned programs for next-gen careers." },
  { num: "02", icon: "🔬", title: "Future Ready Schools/Colleges", desc: "State-of-the-art hands-on labs installed in schools & colleges across India." },
  { num: "03", icon: "💼", title: "Future Ready MSME", desc: "Bridging skills and industry demand — global tech careers in emerging fields." },
  { num: "04", icon: "🌱", title: "Future Ready Environment", desc: "Government & CSR initiatives for skill development, education, and employment." },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep",
  "Puducherry", "Ladakh", "Jammu and Kashmir",
];

const CORE_AREAS = [
  {
    key: "skills",
    label: "Future Ready Skills",
    badge: "Skill Development",
    title: "Building Tomorrow's Workforce",
    emoji: "🚀",
    desc: "Industry-aligned skilling initiatives designed to equip youth, students and professionals with future-ready capabilities across emerging technologies and high-growth sectors. We collaborate with leading corporates, government bodies, sector skill councils, universities, and academic institutions to deliver scalable, employment-oriented learning programs with measurable socio-economic impact.",
    beneficiaries: ["Final-year college students", "Unemployed youth", "11th and 12th class students", "Rural youth"],
    impact: [
      "Multi-state project implementation",
      "Thousands of beneficiaries trained and impacted",
      "Strong ecosystem of CSR, government, and industry partnerships",
      "Focus on employability, digital inclusion, and workforce transformation",
    ],
    items: [
      {
        icon: "🤖",
        title: "Samsung Innovation Campus (CSR)",
        desc: "Future technology skilling initiative focused on AI, Big Data and Coding for university students across North India in collaboration with industry and academic partners — Target: Final-year college students — Coverage: Punjab & Haryana — Impact: Future-ready digital workforce development.",
        img: "/Assets/images/futureready/samsung.jpeg",
      },
      {
        icon: "⚡",
        title: "ESDM Skill Development Program",
        desc: "Large-scale employability initiative in electronics manufacturing, telecom infrastructure and digital connectivity sectors under government-led skilling programs — Target: Unemployed youth — Coverage: Multi-state implementation — Impact: Industry-led training and placement opportunities.",
      },
      {
        icon: "🌐",
        title: "IoT Training Program for School Students",
        desc: "IoT training designed for underprivileged Govt. school students of Class 11th and 12th to prepare them for high-growth emerging sectors-based careers through practical and project-oriented training — Target: 11th and 12th class students — Coverage: Delhi-NCR — Impact: Career building in emerging sectors.",
        img: "/Assets/images/futureready/iot.jpeg",
      },
      {
        icon: "📱",
        title: "Rural Youth Livelihood Program",
        desc: "Vocational and technical skilling initiative enabling rural youth to access sustainable livelihood opportunities in mobile repair and allied sectors — Target: Rural youth — Coverage: Uttarakhand and adjoining regions — Impact: Employment and livelihood generation.",
      },
    ],
  },
  {
    key: "schools",
    label: "Future Ready Schools & Colleges",
    badge: "Education Technology",
    title: "Transforming Learning for the Future",
    emoji: "🏫",
    desc: "Future-focused learning ecosystems designed to equip schools, colleges and academic institutions with emerging technology exposure, innovation-driven education models, and hands-on experiential learning infrastructure. We partner with educational institutions, CSR organizations, industry leaders, and government stakeholders to create scalable future technology learning environments aligned with next-generation workforce requirements.",
    beneficiaries: [
      "Government school students (Class 11–12)",
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
        icon: "📡",
        title: "IoT Lab Setup under Ericsson CSR",
        desc: "Technology-enabled innovation labs established in government schools to provide hands-on exposure to IoT, AI, Robotics, and emerging technologies for school students — Target: Government school students (Class 11–12) — Coverage: Delhi NCR — Impact: Digital inclusion and future technology exposure.",
        img: "/Assets/images/futureready/iot_lab.png",
      },
      {
        icon: "🔬",
        title: "Future Technology Labs as a Service (FTLaaS)",
        desc: "Affordable subscription-based future technology lab ecosystem enabling schools and colleges to access practical learning infrastructure without heavy capital investment — Target: Schools & colleges in Tier 2 and Tier 3 cities — Coverage: Punjab, Haryana & Chandigarh region — Impact: Democratizing access to future technology education.",
      },
      {
        icon: "🎓",
        title: "Industry-Aligned College Innovation Programs",
        desc: "Skill-integrated practical learning initiatives designed for higher education institutions to bridge the gap between academics and industry requirements — Target: Engineering, Polytechnic, BCA & MCA students — Coverage: Multi-institution model — Impact: Employability, innovation, and industry readiness.",
        img: "/Assets/public_assets/images/homepage/industry_align.jpeg",
      },
      {
        icon: "👩‍🏫",
        title: "Faculty Development & Innovation Enablement",
        desc: "Capacity-building initiatives empowering educators with emerging technology knowledge, lab operations capability, and experiential teaching methodologies — Target: Teachers & institutional trainers — Coverage: Schools, colleges & technical institutes — Impact: Sustainable future-ready academic ecosystems.",
        img: "/Assets/public_assets/images/homepage/Faculty.jpeg",
      },
    ],
  },
  {
    key: "msme",
    label: "Future Ready MSME",
    badge: "Enterprise Upskilling",
    title: "Empowering MSMEs for the Digital & Smart Manufacturing Era",
    emoji: "🏭",
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
        icon: "💻",
        title: "MSME Digital Transformation Program",
        desc: "Technology enablement initiative supporting MSMEs in adopting digital tools, automation systems, cloud platforms, and operational intelligence for business efficiency and competitiveness — Target: Manufacturing & service MSMEs — Coverage: Multi-state implementation — Impact: Digital adoption & operational transformation.",
      },
      {
        icon: "🏭",
        title: "Smart Manufacturing & Industry 4.0 Initiative",
        desc: "Advanced skilling and implementation support focused on smart manufacturing systems, IoT-enabled production environments, robotics integration, and Industry 4.0 readiness — Target: Industrial MSMEs & factory workforce — Coverage: Industrial clusters & manufacturing hubs — Impact: Productivity enhancement & smart factory readiness.",
      },
      {
        icon: "✅",
        title: "Lean Management & Zero Defect Manufacturing Program",
        desc: "Industry improvement initiative aligned with Ministry of MSME programs focused on Lean Manufacturing Competitiveness, Zero Defect practices, process optimization, waste reduction, quality enhancement, and operational excellence — Target: Manufacturing MSMEs & industrial units — Coverage: MSME industrial clusters — Impact: Quality improvement, productivity enhancement & global manufacturing competitiveness.",
      },
      {
        icon: "🔧",
        title: "MSME Workforce Upskilling Program",
        desc: "Employment-oriented workforce development initiative designed to equip MSME employees and technicians with future-ready technical and digital skills across emerging sectors — Target: Technicians, operators & industrial workforce — Coverage: Regional & cluster-based deployment — Impact: Workforce readiness & employability enhancement.",
      },
      {
        icon: "💡",
        title: "Entrepreneurship & Innovation Enablement Program",
        desc: "Innovation-led ecosystem initiative supporting startups and aspiring entrepreneurs through mentorship, incubation support, digital business enablement, and market readiness programs — Target: Entrepreneurs & startups — Coverage: Innovation ecosystems & academic clusters — Impact: Innovation, entrepreneurship & business growth.",
      },
    ],
  },
  {
    key: "env",
    label: "Future Ready Environment",
    badge: "Sustainability & Impact",
    title: "Building Sustainable Communities for a Greener Tomorrow",
    emoji: "🌿",
    desc: "Future Ready Environment initiatives promote environmental sustainability, climate resilience, green innovation, and community-driven ecological transformation through technology-enabled and impact-oriented interventions. We collaborate with corporates, government agencies, educational institutions, environmental organizations, local communities, and technology partners to create scalable sustainability ecosystems aligned with global sustainable development goals.",
    beneficiaries: [
      "Schools, colleges & ITI students",
      "School students, youth & communities",
      "Youth, entrepreneurs & rural communities",
    ],
    impact: [
      "Community-driven environmental sustainability initiatives",
      "Environmental awareness among thousands of students & youth",
      "VR-enabled experiential learning for social impact education",
    ],
    items: [
      {
        icon: "♻️",
        title: "Panasonic CSR – Harit Umang Program",
        desc: "Large-scale environmental awareness initiative focused on promoting eco-conscious behavior and sustainability awareness among students and youth through practical engagement on E-Waste, Plastic Waste, Renewable Energy, and Biodiversity themes — Target: Schools, colleges & ITI students — Coverage: North India — Impact: Environmental awareness & youth-led green action.",
      },
      {
        icon: "🥽",
        title: "VR-Based Road Safety Education Program",
        desc: "Immersive road safety awareness initiative using Virtual Reality (VR) technology to educate students and communities about safe road behavior, traffic awareness, accident prevention, and responsible mobility practices — Target: School students, youth & communities — Coverage: Urban & semi-urban regions — Impact: Behavioral change & road safety awareness.",
      },
      {
        icon: "🌱",
        title: "Sustainable Green Entrepreneurship Program",
        desc: "Innovation-driven initiative supporting green entrepreneurship, eco-friendly livelihood opportunities, sustainable rural enterprises, and environmentally responsible business models — Target: Youth, entrepreneurs & rural communities — Coverage: Rural innovation ecosystems — Impact: Sustainable livelihoods & green economic growth.",
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
      [{ icon: "cpu", label: "Electronics & Mfg" }, { icon: "sparkles", label: "Emerging Tech" }, { icon: "brain", label: "AI" }],
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
        img: "/Assets/public_assets/images/homepage/sic-main.jpg",
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
        desc: "IoT training for underprivileged Govt. School Students of Class 11–12 for high-growth emerging sector careers through practical, project-oriented training.",
        img: "/Assets/public_assets/images/homepage/iot.jpg",
        logoKey: "iot",
        chips: { target: "Class 11th & 12th students", coverage: "Delhi-NCR", impact: "Career building in emerging sectors" },
      },
      {
        num: 4,
        name: "Rural Youth Livelihood Program",
        desc: "Vocational and technical skilling enabling rural youth to access sustainable livelihood opportunities in mobile repair and allied sectors.",
        img: "/Assets/public_assets/images/homepage/ddugky.png",
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
    footerTagline: "Building Tomorrow's Workforce — Together.",
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
        logoImg: "/Assets/public_assets/images/homepage/ericsson.png",
        logoKey: "ericsson",
        chips: { target: "Govt. school students", coverage: "Delhi NCR", impact: "Future tech exposure" },
      },
      {
        num: 2,
        name: "Future Technology Labs as a Service (FTLaaS)",
        desc: "Affordable subscription-based future technology labs enabling schools and colleges in Tier 2 & 3 cities to access practical learning infrastructure.",
        img: "/Assets/public_assets/images/homepage/fftl_lab.jpg",
        logoKey: "ftlaas",
        chips: { target: "Schools & Colleges", coverage: "Tier 2 & Tier 3 Cities", impact: "Access to future tech" },
      },
      {
        num: 3,
        name: "Industry-Aligned College Innovation Programs",
        desc: "Skill-integrated practical learning for higher education institutions bridging the gap between academics and industry requirements.",
        img: "/Assets/public_assets/images/homepage/sic.jpeg",
        logoKey: "college-innovation",
        chips: { target: "Colleges & Students", coverage: "Across India", impact: "Industry readiness" },
      },
      {
        num: 4,
        name: "Faculty Development & Innovation Enablement",
        desc: "Capacity-building initiatives empowering educators with emerging technology knowledge, lab operations capability, and experiential teaching methodologies.",
        img: "/Assets/public_assets/images/homepage/Faculty.jpeg",
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
        img: "/Assets/public_assets/images/homepage/MSME_Digital.jpeg",
        logoKey: "msme-digital",
        chips: { target: "Manufacturing & service MSMEs", coverage: "Multi-state", impact: "Digital adoption & transformation" },
      },
      {
        num: "02",
        name: "Smart Manufacturing & Industry 4.0 Initiative",
        desc: "Advanced skilling and implementation support focused on smart manufacturing systems, IoT-enabled production environments, robotics integration, and Industry 4.0 readiness.",
        img: "/Assets/public_assets/images/homepage/Smart_Manufacturing.jpeg",
        logoKey: "industry-40",
        chips: { target: "Industrial MSMEs & factory workforce", coverage: "Industrial clusters", impact: "Smart factory readiness" },
      },
      {
        num: "03",
        name: "Lean Management & Zero Defect Manufacturing Program",
        desc: "Industry improvement initiative aligned with Ministry of MSME programs focused on Lean Manufacturing Competitiveness, Zero Defect practices, process optimization, and operational excellence.",
        img: "/Assets/public_assets/images/homepage/Lean_Management.jpeg",
        logoKey: "lean-zero",
        chips: { target: "Manufacturing MSMEs & industrial units", coverage: "MSME industrial clusters", impact: "Quality & productivity enhancement" },
      },
      {
        num: "04",
        name: "MSME Workforce Upskilling Program",
        desc: "Employment-oriented workforce development initiative designed to equip MSME employees and technicians with future-ready technical and digital skills across emerging sectors.",
        img: "/Assets/public_assets/images/homepage/MSME_Workforce.jpeg",
        logoKey: "workforce-upskill",
        chips: { target: "Technicians & operators", coverage: "Regional & cluster-based", impact: "Workforce readiness & employability" },
      },
      {
        num: "05",
        name: "Entrepreneurship & Innovation Enablement Program",
        desc: "Innovation-led ecosystem initiative supporting startups and aspiring entrepreneurs through mentorship, incubation support, digital business enablement, and market readiness programs.",
        img: "/Assets/public_assets/images/homepage/enterprenuership.png",
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
      { icon: "recycle", text: "Waste Management & Circular Economy" },
      { icon: "droplet", text: "Water Conservation & Resource Management" },
      { icon: "sprout", text: "Smart Agriculture & Agri-Tech Solutions" },
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
      { icon: "handshake", text: "Strong collaboration with CSR, government & sustainability partners" },
      { icon: "glasses", text: "VR-enabled experiential learning for social impact education" },
    ],
    projectsLabel: "Flagship Initiatives",
    projects: [
      {
        num: 1,
        name: "Panasonic CSR – Harit Umang Program",
        desc: "Large-scale environmental awareness initiative promoting eco-conscious behavior on E-Waste, Plastic Waste, Renewable Energy, and Biodiversity among students and youth.",
        img: "/Assets/public_assets/images/homepage/walkathon.jpg",
        logoImg: "/Assets/public_assets/images/homepage/harit-umang.png",
        logoKey: "panasonic-harit",
        chips: { target: "Schools, Colleges & ITI Students", coverage: "North India", impact: "Environmental awareness & youth-led green action" },
      },
      {
        num: 2,
        name: "VR-Based Road Safety Education Program",
        desc: "Immersive road safety awareness initiative using Virtual Reality to educate students and communities about safe road behavior, traffic awareness, and responsible mobility practices.",
        img: "/Assets/public_assets/images/homepage/VR-Based_Road_Safety.jpeg",
        logoKey: "vr-safety",
        chips: { target: "School students, youth & communities", coverage: "Urban & semi-urban regions", impact: "Behavioral change & road safety" },
      },
      {
        num: 3,
        name: "Sustainable Green Entrepreneurship Program",
        desc: "Innovation-driven initiative supporting green entrepreneurship, eco-friendly livelihood opportunities, sustainable rural enterprises, and environmentally responsible business models.",
        img: "/Assets/public_assets/images/homepage/biogas.png",
        logoKey: "green-entrepreneurship",
        chips: { target: "Youth, entrepreneurs & rural communities", coverage: "Rural innovation ecosystems", impact: "Sustainable livelihoods & green growth" },
      },
    ],
    impactRow: [
      { val: "Community-driven", lbl: "Sustainability Initiatives" },
      { val: "10000+", lbl: "Students & Youth Reached" },
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
    emoji: "📣",
    beneficiaries: ["Unemployed youth", "10th & 12th pass-out students", "Final-year college students", "DDU-GKY aspirants"],
    impact: ["Wider enrollment into flagship govt. skilling schemes", "Stronger last-mile connect with underserved communities"],
    items: [
      {
        icon: "🎯",
        title: "Candidate Mobilization Drives",
        desc: "Grassroots outreach and enrollment for electronics manufacturing, hospitality, mobile repairing, and emerging-tech programmes.",
      },
      {
        icon: "📱",
        title: "DDU-GKY · Ministry of Rural Development (Uttarakhand)",
        desc: "Mobilizing 10th & 12th pass-out students for mobile handset repairing and placement in the mobile manufacturing industry.",
      },
      {
        icon: "🍽️",
        title: "Tourism & Hospitality SSC · Ministry of Tourism",
        desc: "Enrollment drives for Food & Beverage Services training — Uttarakhand, Himachal Pradesh & Ghaziabad — target: 12th pass-out students.",
      },
    ],
  },
  {
    key: "training-centers",
    label: "Training Centers",
    badge: "Infrastructure & Labs",
    title: "Future-Ready Training Infrastructure",
    emoji: "🏫",
    beneficiaries: ["Affordable private schools (tier 2 & 3)", "Class 11th & 12th Govt. school students", "Colleges & ITIs"],
    impact: ["Future-ready skills infrastructure at scale", "Hands-on IoT and emerging-tech exposure"],
    items: [
      {
        icon: "📡",
        title: "TSSC & Ericsson — Govt. School IoT Labs",
        desc: "10 Govt. schools in Delhi NCR — AI, IoT, Drone, Robotics — hands-on IoT training for Class 11th & 12th Govt. school students.",
        img: "/Assets/images/futureready/iot.jpeg",
      },
      {
        icon: "🤖",
        title: "30+ Leading Schools & Colleges",
        desc: "Future Ready Skills covering AI, Drone, IoT and Robotics — Punjab, Haryana, Chandigarh — affordable private schools in tier 2 & tier 3 cities.",
      },
      {
        icon: "🏆",
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
    emoji: "🎓",
    beneficiaries: ["Final-year college students", "Unemployed youth", "12th pass-out students", "MSME workforce"],
    impact: ["2,500 candidates — Samsung Innovation Campus", "10,000+ youth in electronics manufacturing (3 years)", "Lean & ZED-aligned MSME capacity"],
    items: [
      {
        icon: "🤖",
        title: "Samsung Innovation Campus (CSR)",
        desc: "Samsung · Telecom Sector Skill Council · 17 leading universities & colleges — AI, Big Data, Coding & Programming — Punjab & Haryana — expected impact: 2,500 candidates.",
        img: "/Assets/images/futureready/samsung.jpeg",
      },
      {
        icon: "⚡",
        title: "TSSC & Ministry of Electronics & IT",
        desc: "OSP Fiber Installation, Testing & Commissioning Supervisor; Digital Cable Network–Access — Uttar Pradesh, Punjab, Haryana, Gujarat, M.P., Andhra Pradesh — 10,000+ youth in 3 years.",
      },
      {
        icon: "✅",
        title: "Lean Management & ZED (MSME)",
        desc: "Quality, production & export capabilities, workplace safety, and digital empowerment — Derabassi, Rajpura, Chandigarh, Baddi, Mohali.",
      },
    ],
  },
  {
    key: "employability",
    label: "Employability",
    badge: "Placement & Livelihoods",
    title: "From Training to Employment",
    emoji: "💼",
    beneficiaries: ["Trained youth", "SHG & tribal households", "ITI, schools & colleges"],
    impact: ["Training & placement in partner industries", "17,000 ST communities & 1,000 SHGs — agritech & livelihoods", "10,000 students — eco-awareness & greener careers"],
    items: [
      {
        icon: "🏭",
        title: "Electronics & Manufacturing Placement",
        desc: "Trained & placed youth in electronic manufacturing and mobile handset industries across partner geographies.",
      },
      {
        icon: "🌾",
        title: "Patanjali · Ministry of Tribal Affairs",
        desc: "Empowering 17,000 Scheduled Tribe communities & 1,000 SHGs through sustainable agritech — livelihoods, income generation & environmental outcomes — Uttarakhand.",
        img: "/Assets/images/futureready/aadigram.jpeg",
      },
      {
        icon: "♻️",
        title: "Eco-Awareness & Greener Livelihoods",
        desc: "E-waste, plastic waste, renewable energy & biodiversity themes — expected impact among 10,000 students across North India.",
      },
    ],
  },
];

const TECH_LABS = [
  { icon: "🤖", name: "Robotics", desc: "Hands-on robotics fostering innovation, critical thinking and real-world problem-solving." },
  { icon: "🧠", name: "Artificial Intelligence", desc: "AI tools and techniques preparing learners for cutting-edge technology careers." },
  { icon: "🥽", name: "AR & VR", desc: "Immersive learning with Augmented and Virtual Reality — the classroom of the future." },
  { icon: "🚁", name: "Drone Technology", desc: "Build, program & operate drones for agriculture, logistics and surveillance." },
  { icon: "🌐", name: "Internet of Things", desc: "Smart device connectivity for home automation, factories and healthcare applications." },
  { icon: "☁️", name: "Cloud Computing", desc: "Modern cloud infrastructure skills for next-generation technical professionals." },
];

/** Future Technology Lab as a Service (FFTLaaS) — aligned with school technical proposal */
const FFTLAA_TECH_PILLARS = [
  { icon: "🧠", name: "Artificial Intelligence", desc: "Practical-linked AI track with theory, demonstration, and hands-on milestones across four quarters — aligned with your academic calendar." },
  { icon: "🤖", name: "Robotics", desc: "Build and program with reusable, class-wise project kits — typically groups of 5–8 students per kit for collaborative lab time." },
  { icon: "🌐", name: "Internet of Things", desc: "Connected sensors, automation, and smart systems so learners ship real projects, not one-off demos." },
];

const FFTLAA_VALUE_PROPS = [
  { icon: "🔭", title: "Emerging technologies", desc: "Students work with AI, robotics, and IoT the way industry does — immersive, current, and skills-first." },
  { icon: "🛠️", title: "Hands-on by design", desc: "Learn by doing: build, test, and present outcomes every quarter with Show & Tell and exhibition days." },
  { icon: "👩‍🏫", title: "Expert-backed integration", desc: "Curriculum, pacing, and assessments slot into your timetable with Focalyt curriculum and specialist support." },
  { icon: "📚", title: "Continuous teacher growth", desc: "Quarterly Train-the-Trainer (offline, cluster level), manuals, and optional online master-trainer support by plan." },
  { icon: "🏅", title: "Training & certification", desc: "Structured pathways for student and teacher certification as part of the annual subscription model." },
  { icon: "💳", title: "Plans that fit your scale", desc: "BASIC, GROWTH, and PREMIUM tiers — from starter access to deeper on-site trainer support and audits." },
];

const FFTLAA_PROGRAM_SNAPSHOT = [
  { k: "Grades", v: "2nd – 12th" },
  { k: "Quarters", v: "4 / year" },
  { k: "Lab sessions", v: "24 / year" },
  { k: "Per quarter", v: "6 sessions" },
  { k: "Session length", v: "60–90 min" },
  { k: "Delivery", v: "Annual model" },
];

const FFTLAA_JOURNEY = [
  { step: 1, title: "Select your plan", desc: "School chooses subscription tier, billing band, and number of candidates for the Future Technology Lab." },
  { step: 2, title: "Purchase order & sign-up", desc: "Academic window and commercial terms are finalized between Focalyt and your institute." },
  { step: 3, title: "Academic alignment", desc: "We co-design timetable slots, session calendar, and curriculum plan around exams and breaks." },
  { step: 4, title: "Launch on campus", desc: "FFTLaaS goes live at your premises — Future Ready School branding included on eligible plans." },
  { step: 5, title: "Train-the-Trainer", desc: "Quarterly TTT builds faculty confidence; kits, LMS, and trainer touchpoints roll in per your package." },
  { step: 6, title: "Kits & year-round rhythm", desc: "Quarterly reusable project kits at school; exhibitions, inter-school events, and quality checks keep momentum." },
];

const ROLES = [
  { emoji: "🎒", name: "STUDENT", desc: "Aspiring to launch your career", href: "/candidate/login" },
  { emoji: "🔍", name: "JOB SEEKER", desc: "Find jobs and internships", href: "/candidate/login" },
  { emoji: "🏢", name: "EMPLOYER", desc: "Seeking skilled talent", href: "/candidate/login" },
  { emoji: "🏫", name: "INSTITUTE", desc: "Schools and colleges", href: "/candidate/login" },
  { emoji: "👩‍🏫", name: "SKILL-EDUCATOR", desc: "Passionate for training", href: "/candidate/login" },
];

const WHY = [
  { icon: "🎓", title: "IIT Alumni Curriculum", desc: "Programs and curriculum crafted by IIT alumni for maximum industry relevance." },
  { icon: "📈", title: "Basics to Professional", desc: "Structured learning from foundational concepts through to professional mastery." },
  { icon: "🏛️", title: "Govt. Skill Certification", desc: "Government of India recognized skill certification for your credentials." },
  { icon: "💡", title: "Projects & Internships", desc: "Real-world projects and paid internships with industry partners." },
  { icon: "🛠️", title: "Practical Training", desc: "Hands-on sessions with state-of-the-art lab equipment." },
  { icon: "👥", title: "50,000+ Learners", desc: "A thriving community of learners trained across India." },
];

const PROJECTS = [
  {
    partner: "Samsung · TSSC · 17 Universities & Colleges",
    title: "Samsung Innovation Campus (CSR)",
    tech: "AI, Big Data, Coding & Programming",
    target: "Final-year college students",
    locations: "Punjab, Haryana",
    impact: "Expected impact: 2,500 candidates — early exposure to future technologies; future-ready skills & employability",
  },
  {
    partner: "TSSC · Ministry of Electronics & IT",
    title: "Electronics manufacturing skilling (ESDM-aligned)",
    tech: "OSP Fiber Installation, Testing & Commissioning Supervisor; Digital Cable Network–Access",
    target: "Unemployed youth",
    locations: "Uttar Pradesh, Punjab, Haryana, Gujarat, M.P., Andhra Pradesh",
    impact: "Impacted 10,000+ youth in 3 years — training & placement in electronic manufacturing companies",
  },
  {
    partner: "Tourism & Hospitality SSC · Ministry of Tourism",
    title: "Hospitality sector training & placement",
    tech: "Food & Beverage Services",
    target: "12th pass-out students",
    locations: "Uttarakhand, Himachal Pradesh, Ghaziabad",
    impact: "Youth trained & placed in the hospitality sector",
  },
  {
    partner: "Ministry of Rural Development (Uttarakhand) · DDU-GKY",
    title: "Mobile manufacturing skilling",
    tech: "Mobile handset repairing",
    target: "10th & 12th pass-out students",
    locations: "Uttarakhand",
    impact: "Youth trained & placed in the mobile manufacturing industry",
  },
  {
    partner: "Ericsson · TSSC",
    title: "Govt. school IoT labs",
    tech: "AI, IoT, Drone, Robotics",
    target: "Class 11th & 12th Govt. school students",
    locations: "10 Govt. schools, Delhi NCR",
    impact: "Future-ready skills through hands-on IoT training",
  },
  {
    partner: "Schools · Colleges · ITI",
    title: "Future Ready Environment — eco awareness",
    tech: "E-waste, plastic waste, renewable energy, biodiversity",
    target: "ITI, schools & colleges",
    locations: "North India",
    impact: "Expected impact: eco-awareness among 10,000 students — greener future themes",
  },
  {
    partner: "Patanjali · Ministry of Tribal Affairs",
    title: "Tribal & SHG agritech empowerment",
    tech: "SHG training, household training, agritech",
    target: "SHG & tribal households",
    locations: "Uttarakhand",
    impact: "17,000 Scheduled Tribe communities & 1,000 SHGs — livelihoods, income generation & environment",
  },
];

const HERO_TILES = [
  { key: "skills", icon: "⚡", title: "Future Ready Skills", line1: "Future Ready", line2: "Skills" },
  { key: "schools", icon: "🏫", title: "Future Ready Schools & Colleges", line1: "Future Ready", line2: "Schools & Colleges" },
  { key: "msme", icon: "🏭", title: "Future Ready MSMEs", line1: "Future Ready", line2: "MSMEs" },
  { key: "env", icon: "🌿", title: "Future Ready Environment", line1: "Future Ready", line2: "Environment" },
];

const FTLAAS_STYLES = `
.ftl{
  font-family:var(--foc-font-display);
  background:var(--foc-color-surface);
  color:var(--foc-slate-900);
  overflow-x:hidden;
  position:relative;
  z-index:1;
  border-radius:20px;
  border:1px solid var(--foc-color-border-light);
  box-shadow:0 8px 32px rgba(15,23,42,.1),0 2px 8px rgba(15,23,42,.06);
  padding:1.75rem 2rem 2rem;
}
.ftl *{box-sizing:border-box;margin:0;}
.ftl-hero,.ftl-card,.ftl-card-sm,.ftl-snap,.ftl-prog,.ftl-pchip{background:var(--foc-color-surface);border:1px solid var(--foc-color-border-light);}
.ftl-hero{
  border-radius:16px;
  padding:1.5rem;
  margin-bottom:1.25rem;
  background:var(--foc-color-surface);
  box-shadow:0 2px 12px rgba(15,23,42,.05);
}
.ftl-badge{display:inline-flex;align-items:center;gap:5px;background:var(--foc-green-50);color:var(--foc-green-800);font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;margin-bottom:.75rem;}
.ftl-badge.college{background:var(--foc-purple-100);color:var(--foc-purple-900);}
.ftl-hero-grid{display:grid;grid-template-columns:1fr auto;gap:1.5rem;align-items:center;}
.ftl-h1{font-size:22px;font-weight:700;line-height:1.2;margin-bottom:.4rem;color:var(--foc-slate-900);}
.ftl-h1 span{color:var(--foc-brand-deep);}
.ftl-sub{font-size:13px;color:var(--foc-slate-500);line-height:1.65;margin-bottom:.9rem;max-width:620px;}
.ftl-row{display:flex;gap:8px;flex-wrap:wrap;}
.ftl-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--foc-color-bg-section);border:1px solid var(--foc-color-border-light);border-radius:8px;font-size:12px;font-weight:500;color:var(--foc-slate-800);}
.ftl-btn,.ftl-btn-lite{display:inline-flex;align-items:center;gap:5px;padding:9px 14px;border-radius:8px;font-family:var(--foc-font-display);font-size:13px;cursor:pointer;transition:.2s;white-space:nowrap;}
.ftl-btn{background:linear-gradient(90deg,var(--foc-cyan),var(--foc-magenta));color:var(--foc-color-text-inverse);border:none;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,.35);box-shadow:0 14px 34px rgba(27,167,255,.18);}
.ftl-btn:hover{transform:translateY(-2px);box-shadow:0 18px 46px rgba(255,45,170,.16);}
.ftl-btn-lite{background:transparent;color:var(--foc-color-text-body);border:1px solid var(--foc-color-border-light);font-weight:500;}
.ftl-btn-lite:hover{border-color:var(--foc-brand-deep);color:var(--foc-brand-deep);}
.ftl-hex-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;}
.ftl-hex{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid var(--foc-color-border-light);border-radius:12px;padding:8px 6px;text-align:center;}
.ftl-hex-lbl{font-size:10px;font-weight:600;color:var(--foc-slate-500);margin-top:4px;line-height:1.2;}
.ftl-inst-tabs{display:flex;gap:8px;margin-bottom:1.25rem;}
.ftl-inst-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;border:1px solid var(--foc-color-border-light);border-radius:12px;font-family:var(--foc-font-sans);font-size:13px;font-weight:600;color:var(--foc-color-text-subtle);cursor:pointer;background:var(--foc-color-surface);transition:all .15s;}
.ftl-inst-tab.on{border-color:var(--foc-brand-deep);color:var(--foc-brand-deep);background:var(--foc-purple-50);}
.ftl-sub-tabs{display:flex;border-bottom:1px solid var(--foc-color-border-light);margin-bottom:1.25rem;overflow-x:auto;scrollbar-width:none;}
.ftl-sub-tabs::-webkit-scrollbar{display:none;}
.ftl-sub-tab{flex-shrink:0;padding:10px 18px;border:none;background:transparent;font-family:var(--foc-font-sans);font-size:12px;font-weight:600;color:var(--foc-color-text-subtle);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;}
.ftl-sub-tab.on{color:var(--foc-brand-deep);border-bottom-color:var(--foc-brand-deep);}
.ftl-inst-head{display:flex;align-items:center;justify-content:space-between;gap:1.25rem;margin-bottom:1rem;}
.ftl-inst-head-main{flex:1;min-width:0;}
.ftl-inst-head-main h2{font-size:18px;font-weight:700;margin-bottom:.3rem;color:var(--foc-slate-900);line-height:1.25;}
.ftl-inst-head-main .ftl-sub{margin-bottom:0;}
.ftl-inst-head-cta{flex-shrink:0;align-self:center;}
.ftl-inst-head-cta .btn-primary{white-space:nowrap;}
@media (max-width:768px){
  .ftl-inst-head{flex-direction:column;align-items:stretch;}
  .ftl-inst-head-cta{align-self:flex-start;}
}
.ftl-main-layout{display:grid;grid-template-columns:1fr 230px;gap:1.25rem;align-items:start;}
.ftl-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.ftl-grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
.ftl-grid-6{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;}
.ftl-card{border-radius:12px;padding:1rem;}
.ftl-card-sm,.ftl-prog,.ftl-pchip{border-radius:8px;padding:.75rem;}
.ftl-ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ftl-card-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.ftl-card-h3{font-size:13px;font-weight:600;color:var(--foc-slate-900);}
.ftl-card-p,.ftl-list-item{font-size:12px;color:var(--foc-slate-500);line-height:1.55;}
.ftl-list{display:flex;flex-direction:column;gap:5px;}
.ftl-list-item{display:flex;align-items:flex-start;gap:8px;}
.ftl-dot{width:5px;height:5px;border-radius:50%;background:var(--foc-brand-deep);flex-shrink:0;margin-top:7px;}
.ftl-check{color:var(--foc-green);font-weight:700;flex-shrink:0;}
.ftl-snap{border-radius:12px;padding:1rem;position:sticky;top:8px;}
.ftl-snap-title,.ftl-sec-head{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--foc-slate-400);margin-bottom:.75rem;}
.ftl-sec-head{font-size:11px;display:flex;align-items:center;gap:8px;}
.ftl-sec-head::after{content:'';flex:1;height:1px;background:var(--foc-color-bg-section);}
.ftl-snap-row{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--foc-color-bg-section);}
.ftl-snap-row:last-child{border-bottom:none;}
.ftl-snap-num{font-size:17px;font-weight:700;line-height:1;}
.ftl-snap-lbl{font-size:11px;color:var(--foc-color-text-subtle);line-height:1.3;}
.ftl-process{display:grid;background:var(--foc-color-surface);border:1px solid var(--foc-color-border-light);border-radius:12px;overflow:hidden;margin-bottom:1.25rem;}
.ftl-step{padding:.9rem .75rem;text-align:center;border-right:1px solid var(--foc-color-bg-section);}
.ftl-step:last-child{border-right:none;}
.ftl-step-top{display:flex;align-items:center;justify-content:center;gap:5px;margin-bottom:6px;}
.ftl-step-num{font-size:10px;color:var(--foc-slate-400);font-weight:600;}
.ftl-step h4{font-size:11px;font-weight:600;color:var(--foc-slate-900);margin-bottom:3px;}
.ftl-step p{font-size:10px;color:var(--foc-color-text-subtle);line-height:1.4;}
.ftl-prog{text-align:center;}
.ftl-prog-label{font-size:11px;font-weight:600;color:var(--foc-slate-900);margin-bottom:2px;}
.ftl-prog-sub{font-size:10px;color:var(--foc-color-text-subtle);line-height:1.3;}
.ftl-ticker{display:flex;background:var(--foc-color-bg-muted);border:1px solid var(--foc-color-border-light);border-radius:10px;overflow:hidden;margin-bottom:1.25rem;}
.ftl-ticker-item{display:flex;align-items:center;gap:6px;padding:9px 12px;border-right:1px solid var(--foc-color-border-light);font-size:11px;color:var(--foc-slate-500);flex:1;justify-content:center;white-space:nowrap;}
.ftl-partner-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:7px;margin-bottom:1.25rem;}
.ftl-pchip{display:flex;align-items:center;gap:8px;padding:8px 10px;}
.ftl-pi{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
.ftl-pn{font-size:11px;font-weight:500;color:var(--foc-color-text-body);line-height:1.3;}
.ftl-cta{background:#3C3489;border-radius:12px;padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-top:1.25rem;}
.ftl-cta-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);color:#e0d9ff;font-size:10px;padding:3px 9px;border-radius:999px;margin-bottom:6px;}
.ftl-cta-h{font-size:16px;font-weight:700;color:var(--foc-color-text-inverse);margin-bottom:3px;}
.ftl-cta-sub{font-size:12px;color:#a8a0e8;}
@media(max-width:1100px){.ftl-main-layout{grid-template-columns:1fr;}.ftl-snap{position:static;}.ftl-grid-6{grid-template-columns:repeat(3,1fr);}.ftl-hex-grid{grid-template-columns:repeat(3,1fr);}}
@media(max-width:768px){.ftl{padding:0.25rem 1rem 1.5rem;border-radius:16px;}.ftl-hero-grid{grid-template-columns:1fr;}.ftl-hex-grid{grid-template-columns:repeat(3,1fr);max-width:100%;}.ftl-grid-2{grid-template-columns:1fr;}.ftl-grid-3{grid-template-columns:1fr 1fr;}.ftl-grid-6{grid-template-columns:repeat(2,1fr);}.ftl-inst-tabs{flex-direction:row;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent;padding-bottom:8px;margin-left:-4px;margin-right:-4px;padding-left:4px;padding-right:4px;}.ftl-inst-tabs::-webkit-scrollbar{height:4px;}.ftl-inst-tabs::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px;}.ftl-inst-tab{flex:0 0 auto;white-space:nowrap;scroll-snap-align:start;padding:11px 14px;font-size:12px;}.ftl-ticker{flex-wrap:wrap;}.ftl-ticker-item{flex:1 1 45%;border:none;border-bottom:1px solid var(--foc-color-border-light);}}
@media(max-width:480px){.ftl-grid-3{grid-template-columns:1fr;}.ftl-grid-6{grid-template-columns:1fr 1fr;}.ftl-process{grid-template-columns:1fr !important;}.ftl-step{border-right:none;border-bottom:1px solid var(--foc-color-bg-section);}}
`;

const FTLAAS_DATA = {
  school: {
    badge: "FTLaaS for Schools",
    title: "for Schools",
    accent: "var(--foc-green)",
    intro: "Transform your school into a future ready learning hub with our subscription-based model that brings advanced technology education to every student.",
    stats: [["5,000+", "Students impacted"], ["100+", "Schools connected"]],
    ticker: [["🖐️", "Hands-on learning"], ["💡", "Innovation exposure"], ["🔗", "Industry connect"], ["🎓", "Certified programs"], ["📈", "Scalable & affordable"]],
    overview: [
      ["💡", "var(--foc-purple-100)", "Access to emerging technologies", "AI, Robotics & IoT learning exposure for every student across all grades."],
      ["🖐️", "var(--foc-green-50)", "Hands-on practical learning", "Project-based experiential learning ecosystem aligned to real-world skills."],
      ["👩‍🏫", "var(--foc-blue-50)", "Teacher empowerment", "Quarterly Training of Trainers support with resources and manuals."],
      ["📖", "var(--foc-green-50)", "Curriculum integration", "Integrated with school academic structure and NEP 2020 framework."],
      ["🏅", "var(--foc-amber-50)", "Certifications & competitions", "Student and teacher certification pathways with inter-school competitions."],
      ["💰", "var(--foc-purple-100)", "Flexible subscription model", "Affordable and scalable implementation options for all school types."],
    ],
    labs: [
      ["🧠", "var(--foc-purple-100)", "AI Labs", ["AI Fundamentals", "Machine Learning Basics", "AI Projects & Applications"]],
      ["🤖", "var(--foc-green-50)", "Robotics Labs", ["Sensor-based Robotics", "Automation Kits", "Coding & Hardware Integration"]],
      ["📡", "var(--foc-blue-50)", "IoT Labs", ["Smart Devices", "IoT Systems", "Connected Technology Learning"]],
      ["🔬", "var(--foc-green-50)", "STEM Innovation Labs", ["Innovation-based Experimentation", "Practical Science-Tech Ecosystem"]],
      ["🚁", "var(--foc-amber-50)", "Drone Technology", ["Drone Assembly", "Flying Concepts", "Future Mobility Exposure"]],
      ["👩‍🏫", "var(--foc-purple-100)", "Teacher Empowerment", ["Quarterly TTT support", "Certification & competitions", "Innovation exposure"]],
    ],
    snap: [
      ["👩‍🎓", "var(--foc-purple-100)", "var(--foc-brand-deep)", "5,000+", "Students impacted"],
      ["🔬", "var(--foc-green-50)", "var(--foc-green)", "25+", "Future tech labs deployed"],
      ["🏫", "var(--foc-blue-50)", "var(--foc-blue-700)", "100+", "Schools connected"],
      ["📍", "var(--foc-amber-50)", "var(--foc-orange-800)", "Multiple", "Punjab · Haryana · Chandigarh · UP & more"],
      ["🤝", "var(--foc-green-50)", "var(--foc-green-800)", "Strong", "Industry · Academic · CSR partnerships"],
    ],
    process: [
      ["01", "📋", "var(--foc-purple-100)", "Select your plan", "Choose the right plan as per your school strength & needs."],
      ["02", "📅", "var(--foc-blue-50)", "Academic alignment", "We align the program with your academic calendar."],
      ["03", "👩‍🏫", "var(--foc-green-50)", "Teacher training", "Quarterly training for teachers to stay future-tech ready."],
      ["04", "📦", "var(--foc-amber-50)", "Project kit delivery", "Provision of project kits & learning resources to students."],
      ["05", "🎧", "var(--foc-purple-100)", "Continuous support", "Ongoing support, mentoring, audits & innovation opportunities."],
    ],
    program: [
      ["📚", "24 sessions annually", "Structured across 4 quarters"],
      ["🖥️", "Theory + demonstration", "Concept learning made easy"],
      ["🔧", "Practical sessions", "Hands-on activities & experiments"],
      ["📢", "Show & tell", "Quarterly student presentations"],
      ["🏆", "Project exhibitions", "At PTM & inter-school events"],
      ["🎓", "Assessments & certification", "Evaluate. Certify. Recognize."],
    ],
    approach: ["Experiential & project-based learning", "Industry exposure & real-world applications", "Innovation challenges & hackathons", "Quarterly teacher enablement (TTT)", "Integrated LMS & digital support", "Subscription-based scalable model"],
    outcomes: ["Build curiosity & innovative thinking in students", "Future-ready skills from an early age", "Improved STEM participation & results", "School recognized as Future Ready institution", "Teacher confidence with emerging technologies", "Parent & community engagement through exhibitions"],
    partners: [["DP", "var(--foc-blue-50)", "var(--foc-blue-700)", "Delhi Public School"], ["DA", "var(--foc-purple-100)", "var(--foc-brand-deep)", "DAV Group of Schools"], ["RI", "var(--foc-green-50)", "var(--foc-green)", "Ryan International School"], ["30+", "var(--foc-amber-50)", "var(--foc-orange-800)", "Leading schools across Punjab & Haryana"], ["++", "var(--foc-green-50)", "var(--foc-green-800)", "And many more..."]],
    geo: ["Punjab", "Haryana", "Chandigarh", "Rajasthan", "Delhi & NCR · Uttar Pradesh & more"],
    types: ["Government schools (Classes 2-12)", "Private CBSE & ICSE schools", "International & IB schools", "CSR-backed educational institutions"],
    cta: "Become a future ready school",
  },
  college: {
    badge: "FTLaaS for Colleges & Universities",
    title: "for Colleges & Universities",
    accent: "var(--foc-brand-deep)",
    intro: "Empower your campus with next-generation technology labs, industry-aligned training and innovation-driven learning through our flexible subscription model.",
    stats: [["10,000+", "Students impacted"], ["75+", "Colleges & universities connected"]],
    ticker: [["🏭", "Industry-aligned curriculum"], ["🖐️", "Hands-on & experiential"], ["🔭", "Innovation & research"], ["🎓", "Certifications & internships"], ["💰", "Scalable & cost effective"]],
    overview: [
      ["🏭", "var(--foc-purple-100)", "Industry aligned curriculum", "Curriculum designed with industry experts and sector skill councils."],
      ["🔭", "var(--foc-green-50)", "Research & innovation", "Promote innovation, projects & startups through hands-on learning."],
      ["🎓", "var(--foc-blue-50)", "Certification & placement", "Enhance employability with industry-recognized certifications & skills."],
      ["🖐️", "var(--foc-green-50)", "Hands-on & experiential", "Advanced lab kits, project resources & real-world tech exposure."],
      ["🤝", "var(--foc-amber-50)", "Industry connect & expert talks", "Guest lectures, industry visits and employer engagement activities."],
      ["💰", "var(--foc-purple-100)", "Scalable & cost effective", "Flexible subscription plans for institutions of all sizes."],
    ],
    labs: [
      ["🧠", "var(--foc-purple-100)", "AI & ML Labs", ["Deep Learning Concepts", "Data Science Projects", "AI Application Development"]],
      ["🤖", "var(--foc-green-50)", "Advanced Robotics", ["Industrial Automation", "Robotic Programming", "Manufacturing Simulation"]],
      ["📡", "var(--foc-blue-50)", "IoT Systems", ["Smart Connected Devices", "Industrial IoT", "Edge Computing Basics"]],
      ["🔭", "var(--foc-green-50)", "Innovation Labs", ["Research & Innovation", "Startup Incubation", "Industry Projects"]],
      ["🚁", "var(--foc-amber-50)", "Drone Technology", ["Advanced Drone Systems", "Aerial Data Collection", "Agriculture & Surveillance"]],
      ["🏭", "var(--foc-purple-100)", "Industry Alignment", ["Curriculum by industry experts", "Certifications & internships", "Placement support"]],
    ],
    snap: [
      ["👩‍🎓", "var(--foc-purple-100)", "var(--foc-brand-deep)", "10,000+", "Students impacted"],
      ["🔬", "var(--foc-green-50)", "var(--foc-green)", "50+", "Future tech labs deployed"],
      ["🏛️", "var(--foc-blue-50)", "var(--foc-blue-700)", "75+", "Colleges & universities"],
      ["📍", "var(--foc-amber-50)", "var(--foc-orange-800)", "Multiple", "Punjab · Haryana · Delhi · Rajasthan · UP & more"],
      ["🏭", "var(--foc-green-50)", "var(--foc-green-800)", "Industry", "Collaborations with leading industries & orgs"],
    ],
    process: [
      ["01", "📋", "var(--foc-purple-100)", "Select your plan", "Choose the plan that suits your institution's needs."],
      ["02", "📅", "var(--foc-blue-50)", "Academic alignment", "We align the program with your academic structure."],
      ["03", "👩‍🏫", "var(--foc-green-50)", "Faculty training", "Quarterly training for faculty & resource support."],
      ["04", "📦", "var(--foc-amber-50)", "Project kit delivery", "Delivery of advanced kits & lab resources to campus."],
      ["05", "🎧", "var(--foc-purple-100)", "Continuous support", "Ongoing mentoring, technical support & innovation ecosystem."],
    ],
    program: [
      ["📚", "Industry-aligned sessions", "Designed with sector experts"],
      ["🖥️", "Theory + case studies", "Industry-oriented concepts"],
      ["🔧", "Lab & practical sessions", "Hands-on advanced lab time"],
      ["🔭", "Research & innovation", "Projects, hackathons & startups"],
      ["🏆", "Tech exhibitions", "Showcase to industry & judges"],
      ["🎓", "Certifications & internships", "Evaluate. Certify. Place."],
    ],
    approach: ["Industry-aligned curriculum design", "Research & innovation support", "Certification & placement pathways", "Hackathons, projects & startup exposure", "Faculty resource & training support", "Advanced lab kits & resources"],
    outcomes: ["Industry-ready graduates with practical skills", "Improved placement rates & career outcomes", "Student innovation & startup culture", "College ranked as innovation hub", "Faculty upskilled with emerging technologies", "Strong industry & CSR partnerships"],
    partners: [["CU", "var(--foc-amber-50)", "var(--foc-orange-800)", "Chitkara University"], ["PC", "var(--foc-green-50)", "var(--foc-green-800)", "PCTE Group of Institutes"], ["II", "var(--foc-purple-100)", "var(--foc-brand-deep)", "IIT Ropar (Partner)"], ["75+", "var(--foc-blue-50)", "var(--foc-blue-700)", "Colleges & universities connected"], ["++", "var(--foc-green-50)", "var(--foc-green)", "And many more..."]],
    geo: ["Punjab", "Haryana", "Chandigarh", "Delhi & NCR", "Rajasthan · Uttar Pradesh & more"],
    types: ["Engineering & technical colleges", "Universities - Arts, Science, Commerce", "Polytechnics & ITIs", "Deemed & autonomous institutions"],
    cta: "Partner with Focalyt",
  },
};

function FTLaaSSection() {
  const [inst, setInst] = useState("school");
  const [subTab, setSubTab] = useState("overview");
  const data = FTLAAS_DATA[inst];
  const isSchool = inst === "school";
  const subTabs = [
    ["overview", "Overview"],
    ["labs", "What We Offer"],
    ["process", "Our Process"],
    ["program", "Program Structure"],
    ["approach", "Our Approach"],
    // ["partners", "Partner Institutions"],
  ];

  return (
    <>
      <style>{FTLAAS_STYLES}</style>
      <div className="ftl">
      <div className="section-head">
              <div className="sh2">
                Future Technology Lab
                <br />
                <span className="red">As a Service (FTLaaS)</span>
              </div>
              </div>
        <div className="ftl-hero">
          <div className="ftl-badge">✓ Integrated with NEP 2020</div>
          <div className="ftl-hero-grid">
            <div>
              <h1 className="ftl-h1"></h1>
              <p className="ftl-sub">Focalyt&apos;s FTLaaS enables schools and colleges to implement immersive AI, Robotics, IoT, and STEM learning ecosystems through a scalable subscription-based model.</p>
              <div className="ftl-row" style={{ marginBottom: "1rem" }}>
                {[["🧠", "AI"], ["🤖", "Robotics"], ["📡", "IoT"], ["🚁", "Drones"], ["🔬", "STEM Labs"]].map(([ico, label]) => <div key={label} className="ftl-pill"><span>{ico}</span>{label}</div>)}
              </div>
              <div className="ftl-row">
                {/* <button type="button" className="ftl-btn">→ Explore Programs</button> */}
                {/* <button type="button" className="ftl-btn-lite" data-bs-toggle="modal" data-bs-target="#partnerModal">📅 Book a Demo</button> */}
              </div>
            </div>
            <div className="ftl-hex-grid">
              {[["🧠", "AI", "var(--foc-purple-100)"], ["🤖", "Robotics", "var(--foc-green-50)"], ["📡", "IoT", "var(--foc-blue-50)"], ["🚁", "Drones", "var(--foc-amber-50)"], ["🔬", "STEM", "#fce7f3"], ["💡", "Innovation", "var(--foc-purple-100)"]].map(([ico, label, bg]) => (
                <div key={label} className="ftl-hex" style={{ background: bg }}><div style={{ fontSize: 20 }}>{ico}</div><div className="ftl-hex-lbl">{label}</div></div>
              ))}
            </div>
          </div>
        </div>

        <div className="ftl-inst-tabs">
          <button type="button" className={`ftl-inst-tab${inst === "school" ? " on" : ""}`} onClick={() => { setInst("school"); setSubTab("overview"); }}>🏫 FTLaaS for Schools</button>
          <button type="button" className={`ftl-inst-tab${inst === "college" ? " on" : ""}`} onClick={() => { setInst("college"); setSubTab("overview"); }}>🏛️ FTLaaS for Colleges & Universities</button>
        </div>

        <div className="ftl-inst-head">
          <div className="ftl-inst-head-main">
            <div className={`ftl-badge${isSchool ? "" : " college"}`}>✓ {data.badge}</div>
            <h2>
              Future Technology Lab as a Service — <span style={{ color: data.accent }}>{data.title}</span>
            </h2>
            <p className="ftl-sub">{data.intro}</p>
          </div>
          <div className="ftl-inst-head-cta">
            <button type="button" className="btn-primary" data-bs-toggle="modal" data-bs-target="#partnerModal">
              🤝 Partner With Us
            </button>
          </div>
        </div>

        <div className="ftl-sub-tabs">
          {subTabs.map(([id, label]) => <button key={id} type="button" className={`ftl-sub-tab${subTab === id ? " on" : ""}`} onClick={() => setSubTab(id)}>{label}</button>)}
        </div>

        {subTab === "overview" && (
          <>
            <div className="ftl-ticker">{data.ticker.map(([ico, label]) => <div key={label} className="ftl-ticker-item"><span>{ico}</span>{label}</div>)}</div>
            <div className="ftl-grid-3" style={{ marginBottom: "1rem" }}>
              {data.overview.map(([ico, bg, title, desc]) => (
                <div key={title} className="ftl-card">
                  <div className="ftl-card-head"><div className="ftl-ico" style={{ background: bg }}><span style={{ fontSize: 16 }}>{ico}</span></div><span className="ftl-card-h3">{title}</span></div>
                  <p className="ftl-card-p">{desc}</p>
                </div>
              ))}
            </div>
            <div className="ftl-grid-2">
              {data.stats.map(([value, label], idx) => (
                <div key={label} className="ftl-card" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: idx === 0 ? "var(--foc-brand-deep)" : "var(--foc-green)", marginBottom: 4 }}>{value}</div>
                  <div style={{ fontSize: 12, color: "var(--foc-color-text-subtle)" }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {subTab === "labs" && (
          <div className="ftl-main-layout">
            <div>
              <div className="ftl-sec-head">Lab types we offer</div>
              <div className="ftl-grid-2">
                {data.labs.map(([ico, bg, title, items]) => (
                  <div key={title} className="ftl-card">
                    <div className="ftl-card-head"><div className="ftl-ico" style={{ background: bg }}><span style={{ fontSize: 16 }}>{ico}</span></div><span className="ftl-card-h3">{title}</span></div>
                    <div className="ftl-list">{items.map((item) => <div key={item} className="ftl-list-item"><span className="ftl-dot" />{item}</div>)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ftl-snap">
              <div className="ftl-snap-title">Impact Snapshot</div>
              {data.snap.map(([ico, bg, col, num, lbl]) => (
                <div key={lbl} className="ftl-snap-row">
                  <div className="ftl-ico" style={{ background: bg }}><span style={{ fontSize: 15 }}>{ico}</span></div>
                  <div><div className="ftl-snap-num" style={{ color: col }}>{num}</div><div className="ftl-snap-lbl">{lbl}</div></div>
                </div>
              ))}
              <button type="button" className="ftl-btn" style={{ width: "100%", justifyContent: "center", fontSize: 12, marginTop: ".75rem" }}>{data.cta} →</button>
            </div>
          </div>
        )}

        {subTab === "process" && (
          <>
            <div className="ftl-sec-head">Our simple process</div>
            <div className="ftl-process" style={{ gridTemplateColumns: `repeat(${data.process.length},1fr)` }}>
              {data.process.map(([num, ico, bg, title, desc]) => (
                <div key={num} className="ftl-step">
                  <div className="ftl-step-top"><span className="ftl-step-num">{num}</span><div className="ftl-ico" style={{ width: 28, height: 28, borderRadius: "50%", background: bg }}><span style={{ fontSize: 13 }}>{ico}</span></div></div>
                  <h4>{title}</h4><p>{desc}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {subTab === "program" && (
          <>
            <div className="ftl-sec-head">Annual program structure</div>
            <div className="ftl-grid-6" style={{ marginBottom: "1.25rem" }}>
              {data.program.map(([ico, label, sub]) => <div key={label} className="ftl-prog"><div style={{ fontSize: 20, marginBottom: 4 }}>{ico}</div><div className="ftl-prog-label">{label}</div><div className="ftl-prog-sub">{sub}</div></div>)}
            </div>
            <div className="ftl-grid-3">
              {[
                ["📦", "var(--foc-purple-100)", isSchool ? "Project kits & resources" : "Advanced lab kits & resources", isSchool ? ["Quarterly project kits for students", "Lab tools & equipment", "Digital learning materials"] : ["Advanced project kits for students", "Industry-grade lab equipment", "Research & innovation materials"]],
                ["👩‍🏫", "var(--foc-green-50)", isSchool ? "Teacher enablement" : "Faculty enablement", isSchool ? ["Quarterly TTT workshops", "Master trainer support", "Curriculum alignment sessions"] : ["Quarterly faculty TTT workshops", "Master trainer support", "Industry collaboration sessions"]],
                ["💻", "var(--foc-blue-50)", "LMS & digital access", isSchool ? ["Integrated LMS platform", "Student & teacher login", "Progress tracking dashboard"] : ["Advanced LMS platform", "Student & faculty login", "Research & project tracking"]],
              ].map(([ico, bg, title, items]) => (
                <div key={title} className="ftl-card">
                  <div className="ftl-card-head"><div className="ftl-ico" style={{ background: bg }}><span>{ico}</span></div><span className="ftl-card-h3">{title}</span></div>
                  <div className="ftl-list">{items.map((item) => <div key={item} className="ftl-list-item"><span className="ftl-check">✓</span>{item}</div>)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {subTab === "approach" && (
          <>
            <div className="ftl-grid-2" style={{ marginBottom: "1rem" }}>
              {[["Our approach", data.approach], ["Outcomes & impact", data.outcomes]].map(([title, items]) => (
                <div key={title} className="ftl-card"><div className="ftl-sec-head">{title}</div><div className="ftl-list">{items.map((item) => <div key={item} className="ftl-list-item"><span className="ftl-check">✓</span>{item}</div>)}</div></div>
              ))}
            </div>
            <div className="ftl-grid-3">
              {(isSchool
                ? [["🖐️", "Hands-on learning", "Project-based, experiential learning with real tech kits."], ["👩‍🏫", "Teacher empowerment", "Quarterly training, TTT support & resources."], ["🎓", "Certified & future ready", "Certification, competitions & innovation exposure."]]
                : [["🏭", "Industry aligned", "Curriculum designed with industry experts & sector skill councils."], ["🔭", "Research & innovation", "Promote innovation, projects & startup readiness."], ["🎓", "Certification & placement", "Enhance employability with industry-recognized certifications."]]
              ).map(([ico, title, desc]) => <div key={title} className="ftl-card-sm"><div className="ftl-card-head"><span>{ico}</span><span className="ftl-card-h3">{title}</span></div><p className="ftl-card-p">{desc}</p></div>)}
            </div>
          </>
        )}

        {/* Partner Institutions — hidden for Schools & Colleges FTLaaS
        {subTab === "partners" && (
          <>
            <div className="ftl-sec-head">Partner institutions</div>
            <div className="ftl-partner-grid">
              {data.partners.map(([init, bg, col, name]) => <div key={name} className="ftl-pchip"><div className="ftl-pi" style={{ background: bg, color: col }}>{init}</div><div className="ftl-pn">{name}</div></div>)}
            </div>
            <div className="ftl-grid-2">
              {[["Geographies covered", data.geo], ["Institution types supported", data.types]].map(([title, items]) => (
                <div key={title} className="ftl-card"><div className="ftl-sec-head">{title}</div><div className="ftl-list">{items.map((item) => <div key={item} className="ftl-list-item"><span className="ftl-check">✓</span>{item}</div>)}</div></div>
              ))}
            </div>
            <div className="ftl-cta">
              <div><div className="ftl-cta-badge">✓ NEP 2020 Integrated · Scalable · 21st Century Skills</div><div className="ftl-cta-h">Create your future ready campus</div><div className="ftl-cta-sub">Empower your students with AI, Robotics, IoT, STEM and innovation-driven learning.</div></div>
              <div className="ftl-row"><button type="button" className="ftl-btn" data-bs-toggle="modal" data-bs-target="#partnerModal">📅 Schedule consultation</button><button type="button" className="ftl-btn-lite" style={{ color: "var(--foc-color-surface)", borderColor: "rgba(255,255,255,.3)" }}>⬇ Download brochure</button><button type="button" className="ftl-btn-lite" data-bs-toggle="modal" data-bs-target="#partnerModal" style={{ color: "var(--foc-color-surface)", borderColor: "rgba(255,255,255,.3)" }}>🏫 {data.cta}</button></div>
            </div>
          </>
        )}
        */}
      </div>
    </>
  );
}

const GEOGRAPHIC_COVERAGE_STYLES = `
.gc{--navy:var(--foc-navy-mid);--teal:var(--foc-teal);--green:var(--foc-green);--bg:var(--foc-panel-bg-alt);--surface:#fff;--brd:#d1e0ef;--t1:var(--foc-navy-mid);--t2:#2d4a6e;--t3:var(--foc-color-text-subtle);font-family:var(--foc-font-sans);background:var(--bg);color:var(--t1);overflow-x:hidden;border-radius:16px;}
.gc *{box-sizing:border-box;margin:0;padding:0;}
.gc-hero{background:linear-gradient(135deg,var(--foc-panel-bg-alt) 0%,#e8f4f0 50%,var(--foc-panel-bg-alt) 100%);border:1px solid var(--brd);border-radius:16px;padding:15px 0 0;position:relative;overflow:hidden;}
.gc-hero::before{content:'';position:absolute;inset:0;background-image:radial-gradient(circle at 20% 30%,rgba(14,124,107,.06) 0%,transparent 50%),radial-gradient(circle at 80% 70%,rgba(10,34,64,.05) 0%,transparent 50%),radial-gradient(var(--brd) 1px,transparent 1px);background-size:100%,100%,32px 32px;pointer-events:none;}
.gc-cont{max-width:1240px;margin:0 auto;padding:0 48px;position:relative;z-index:1;}
.gc-eyebrow{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
.gc-eyebrow-line{width:48px;height:2px;background:var(--teal);}
.gc-eyebrow-text{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--teal);}
.gc-h1{font-family:var(--foc-font-display);font-size:clamp(32px,4.5vw,58px);font-weight:900;line-height:1.05;color:var(--navy);margin-bottom:6px;}
.gc-h1-sub{font-family:var(--foc-font-display);font-size:clamp(28px,3.8vw,48px);font-weight:900;color:var(--green);margin-bottom:20px;}
.gc-desc{font-family:var(--foc-font-sans);font-size:15px;color:var(--t2);line-height:1.75;max-width:440px;margin-bottom:28px;}
.gc-reach-badge{display:flex;align-items:flex-start;gap:14px;background:rgba(14,124,107,.07);border:1px solid rgba(14,124,107,.18);border-radius:12px;padding:16px 20px;max-width:440px;}
.gc-reach-ico{width:44px;height:44px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
.gc-reach-text{font-size:13px;font-weight:700;color:var(--teal);line-height:1.4;}
.gc-hero-grid{display:grid;grid-template-columns:1fr 1.1fr;align-items:start;gap:24px;}
.gc-hero-left{padding-bottom:0;}
.gc-map-wrap{position:relative;width:100%;max-width:580px;margin:0 auto;}
.gc-map-leaflet-wrap{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--brd);background:#e8f4ff;box-shadow:0 24px 48px rgba(10,34,64,.15);}
.gc-map-leaflet{width:100%;height:min(52vh,480px);min-height:320px;z-index:0;}
.gc-leaflet-pin-wrap{background:transparent!important;border:none!important;}
.gc-leaflet-pin{position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;}
.gc-leaflet-pin-dot{width:14px;height:14px;border-radius:50%;background:var(--foc-teal);border:2px solid #fff;box-shadow:0 2px 12px rgba(10,34,64,.35);position:relative;z-index:2;transition:transform .2s,background .2s;}
.gc-leaflet-pin-ring{position:absolute;inset:0;margin:auto;width:28px;height:28px;border-radius:50%;border:2px solid rgba(14,124,107,.45);animation:gcMapRing 2.5s ease-out infinite;}
.gc-leaflet-pin-active .gc-leaflet-pin-dot{background:var(--foc-green);transform:scale(1.15);}
.gc-leaflet-pin-active .gc-leaflet-pin-ring{border-color:rgba(22,163,74,.55);}
@keyframes gcMapRing{0%{transform:scale(.55);opacity:.75;}100%{transform:scale(2.1);opacity:0;}}
.leaflet-container.gc-map-leaflet{font-family:var(--foc-font-sans);}
.leaflet-container.gc-map-leaflet .leaflet-control-container{display:none;}
.leaflet-popup-content-wrapper{border-radius:12px!important;border:1px solid var(--brd)!important;box-shadow:0 12px 32px rgba(10,34,64,.12)!important;}
.gc-state-row-interactive{cursor:pointer;border-radius:6px;padding:4px 6px;margin:-4px -6px;transition:background .2s;}
.gc-state-row-interactive:hover,.gc-state-row-active{background:rgba(14,124,107,.08);}
.gc-inline-card{background:var(--foc-color-surface);border:1px solid var(--brd);border-radius:12px;padding:20px 24px;max-width:480px;}
.gc-inline-title{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--teal);margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.gc-state-list{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 10px;}
.gc-state-row{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--t1);}
.gc-state-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);flex-shrink:0;}
.gc-commit{margin-top:14px;padding:10px 14px;background:rgba(14,124,107,.06);border:1px solid rgba(14,124,107,.14);border-radius:8px;display:flex;gap:10px;align-items:flex-start;}
.gc-commit span:last-child{font-size:12px;color:var(--t2);line-height:1.5;}
.gc-section{padding:48px 0 0;}
.gc-reach-section{padding:20px 0 28px;}
.gc-section-head{font-size:14px;font-weight:700;color:var(--navy);letter-spacing:1px;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--teal);display:inline-block;}
.gc-reach-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;}
.gc-reach-card{background:var(--surface);border:1px solid var(--brd);border-radius:12px;padding:18px 12px;text-align:center;transition:.28s;}
.gc-reach-card:hover{border-color:var(--teal);transform:translateY(-3px);box-shadow:0 8px 20px rgba(14,124,107,.12);}
.gc-reach-card-ico{width:48px;height:48px;border-radius:50%;background:rgba(14,124,107,.08);border:1px solid rgba(14,124,107,.18);display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 12px;}
.gc-reach-card-label{font-size:9.5px;font-weight:700;color:var(--navy);line-height:1.4;letter-spacing:.3px;}
.gc-quote-banner{background:var(--navy);border-radius:16px;padding:36px 44px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;align-items:center;margin-top:48px;position:relative;overflow:hidden;}
.gc-quote-mark{font-family:Georgia,serif;font-size:64px;color:rgba(14,124,107,.4);line-height:.8;margin-bottom:8px;}
.gc-quote-text{font-size:14px;font-weight:600;color:rgba(255,255,255,.85);line-height:1.55;}
.gc-quote-accent{color:#22c55e;}
.gc-quote-stat{text-align:center;padding:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:12px;}
.gc-quote-stat-ico{font-size:28px;margin-bottom:6px;}
.gc-quote-stat-title{font-size:13px;font-weight:700;color:var(--foc-color-text-inverse);margin-bottom:4px;}
.gc-quote-stat-sub{font-size:12px;color:rgba(255,255,255,.5);}
.gc-enables-wrap{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start;margin-bottom:24px;}
.gc-enables-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.gc-enables-card{background:var(--surface);border:1px solid var(--brd);border-radius:14px;padding:22px 20px;display:flex;align-items:flex-start;gap:14px;transition:.25s;}
.gc-enables-card:hover{border-color:var(--teal);box-shadow:0 8px 20px rgba(14,124,107,.10);transform:translateY(-2px);}
.gc-enables-ico{width:48px;height:48px;border-radius:12px;background:rgba(14,124,107,.08);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;border:1px solid rgba(14,124,107,.15);}
.gc-enables-title{font-family:var(--foc-font-display);font-size:12px;font-weight:700;color:var(--navy);margin-bottom:5px;line-height:1.3;}
.gc-enables-desc{font-family:var(--foc-font-sans);font-size:12px;color:var(--t3);line-height:1.55;}
.gc-presence-right{display:flex;flex-direction:column;gap:10px;min-width:200px;}
.gc-pstat{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--surface);border:1px solid var(--brd);border-radius:10px;transition:.2s;}
.gc-pstat:hover{border-color:var(--teal);box-shadow:0 4px 12px rgba(14,124,107,.10);}
.gc-pstat-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.gc-pstat-title{font-size:12px;font-weight:700;color:var(--navy);margin-bottom:2px;}
.gc-pstat-sub{font-size:11px;color:var(--t3);}
.gc-bottom-cta{background:linear-gradient(135deg,var(--teal) 0%,var(--navy) 100%);border-radius:16px;padding:32px 44px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;margin:0 0 48px;position:relative;overflow:hidden;}
.gc-cta-left{display:flex;align-items:center;gap:16px;}
.gc-cta-ico{font-size:36px;}
.gc-cta-h{font-family:var(--foc-font-display);font-size:16px;font-weight:700;color:var(--foc-color-text-inverse);margin-bottom:4px;line-height:1.3;}
.gc-cta-sub{font-family:var(--foc-font-sans);font-size:13px;color:rgba(255,255,255,.65);max-width:480px;line-height:1.6;}
.gc-cta-btn{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;border:none;border-radius:8px;font-size:12px;font-weight:700;letter-spacing:.5px;white-space:nowrap;text-decoration:none;transition:.2s;}
.gc-cta-btn:hover{transform:translateY(-1px);}
@media(max-width:1100px){.gc-hero-grid{grid-template-columns:1fr;gap:32px;}.gc-hero-left{padding-bottom:0;}.gc-map-wrap{max-width:100%;}.gc-reach-grid{grid-template-columns:repeat(4,1fr);}.gc-quote-banner{grid-template-columns:1fr;}.gc-state-list{grid-template-columns:repeat(3,1fr);}.gc-enables-wrap{grid-template-columns:1fr;}.gc-presence-right{display:grid;grid-template-columns:repeat(2,1fr);}}
@media(max-width:768px){.gc-cont{padding:0 20px;}.gc-map-leaflet{height:min(48vh,400px);min-height:280px;}.gc-enables-grid{grid-template-columns:1fr 1fr;}.gc-reach-grid{grid-template-columns:repeat(2,1fr);}.gc-state-list{grid-template-columns:1fr 1fr;}.gc-h1{font-size:clamp(22px,6vw,36px);}.gc-h1-sub{font-size:clamp(20px,5.5vw,32px);}.gc-presence-right{grid-template-columns:1fr;}}
@media(max-width:480px){.gc-enables-grid{grid-template-columns:1fr;}.gc-state-list{grid-template-columns:1fr;}.gc-bottom-cta,.gc-quote-banner{padding:24px 20px;}.gc-cta-left{align-items:flex-start;}}
`;

/** Focalyt presence — lat/lng at state hubs for Leaflet map */
const GC_WORK_LOCATIONS = [
  { id: "PB", label: "Punjab", sub: "Skilling & institutional outreach", lat: 31.1471, lng: 75.3412 },
  { id: "HR", label: "Haryana", sub: "NCR-adjacent programmes", lat: 29.0588, lng: 76.0856 },
  { id: "HP", label: "Himachal Pradesh", sub: "Hospitality & tourism skilling", lat: 31.1048, lng: 77.1734 },
  { id: "UP", label: "Uttar Pradesh", sub: "Ghaziabad · NCR skilling & outreach", lat: 26.8467, lng: 80.9462 },
  { id: "UK", label: "Uttarakhand", sub: "Rural & tribal development programmes", lat: 30.3165, lng: 78.0322 },
  { id: "RJ", label: "Rajasthan", sub: "State-wide mobilisation & training", lat: 26.9124, lng: 75.7873 },
  { id: "GJ", label: "Gujarat", sub: "Industry & campus partnerships", lat: 23.0225, lng: 72.5714 },
  { id: "CG", label: "Chhattisgarh", sub: "CSR & community skilling", lat: 21.2514, lng: 81.6296 },
  { id: "OD", label: "Odisha", sub: "Government & sector programmes", lat: 20.2961, lng: 85.8245 },
  { id: "AP", label: "Andhra Pradesh", sub: "Future-tech & placement tracks", lat: 16.5062, lng: 80.648 },
  { id: "TN", label: "Tamil Nadu", sub: "Manufacturing & services corridors", lat: 13.0827, lng: 80.2707 },
];

const GC_INDIA_BOUNDS = L.latLngBounds(L.latLng(5.8, 68.2), L.latLng(37.1, 97.4));

function makeGcMapIcon(active) {
  return L.divIcon({
    className: "gc-leaflet-pin-wrap",
    html: `<div class="gc-leaflet-pin${active ? " gc-leaflet-pin-active" : ""}"><span class="gc-leaflet-pin-dot"></span><span class="gc-leaflet-pin-ring"></span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

const GC_REACH_MODEL = [
  { ico: "👥", label: "Local Mobilisation Teams" },
  { ico: "🤝", label: "Academic & Institutional Partnerships" },
  { ico: "🏭", label: "Industry-linked Training Centers" },
  { ico: "🏘️", label: "Rural & Remote Training Hubs" },
  { ico: "🚌", label: "Mobile Training Vans" },
  { ico: "👨‍👩‍👧", label: "Community-based Delivery Models" },
  { ico: "💻", label: "Digital & Blended Learning Support" },
];

const GC_ENABLES = [
  { ico: "👥", title: "Wider Beneficiary Outreach", desc: "Reaching more lives across geographies with targeted, community-driven outreach." },
  { ico: "🚀", title: "Faster Project Deployment", desc: "Agile execution, wherever it's needed - quick deployment with local teams." },
  { ico: "🏛️", title: "Access to Underserved Communities", desc: "Bridging the gap for rural, tribal and aspirational district communities." },
  { ico: "📍", title: "State-specific Implementation Models", desc: "Localized strategies, greater outcomes aligned to each state's requirements." },
  { ico: "📈", title: "Scalable Government & CSR Interventions", desc: "Flexible models that scale across states with govt. and CSR partnerships." },
  { ico: "🤝", title: "Stronger Local Partnerships & Community Impact", desc: "Building trust-based partnerships at local, district and state levels." },
];

const GC_PSTATS = [
  { ico: "👥", bg: "rgba(14,124,107,.10)", title: "Multiple States", sub: "Wide Reach" },
  { ico: "🎯", bg: "rgba(29,78,216,.10)", title: "Diverse Communities", sub: "Inclusive Impact" },
  { ico: "🤝", bg: "rgba(22,163,74,.10)", title: "Strong Partnerships", sub: "Local to Global" },
  { ico: "📈", bg: "rgba(249,115,22,.10)", title: "Scalable Solutions", sub: "Sustainable Change" },
];

function GeographicCoverageLeafletMap({ activeState, onStateHover }) {
  const wrapRef = useRef(null);
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const el = elRef.current;
    if (!wrap || !el) return undefined;

    const destroyMap = () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          /* already detached */
        }
        mapRef.current = null;
      }
      markersRef.current = [];
    };

    let io;
    let started = false;
    let resizeHandler;

    const initMap = () => {
      if (started || mapRef.current) return;
      started = true;

      const map = L.map(el, {
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: false,
        maxBounds: GC_INDIA_BOUNDS,
        maxBoundsViscosity: 1.0,
        center: [22.5, 80.0],
        zoom: 5,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: "abcd",
        maxZoom: 19,
        noWrap: true,
      }).addTo(map);

      markersRef.current = GC_WORK_LOCATIONS.map((loc) => {
        const marker = L.marker([loc.lat, loc.lng], { icon: makeGcMapIcon(activeState === loc.id) }).addTo(map);
        marker.bindPopup(
          `<strong style="font-family:var(--foc-font-display);font-size:13px;color:var(--foc-navy-mid)">${loc.label}</strong><br/><span style="font-size:12px;color:#2d4a6e">${loc.sub}</span>`
        );
        marker.on("mouseover", () => onStateHover?.(loc.id));
        marker.on("mouseout", () => onStateHover?.(null));
        marker.on("click", () => marker.openPopup());
        return { marker, loc };
      });

      const fitFullIndia = () => {
        const size = map.getSize();
        const w = el.clientWidth || size.x || 800;
        const h = el.clientHeight || size.y || 320;
        const aspect = w / Math.max(h, 1);
        const padCornerY = Math.min(120, Math.max(48, Math.round(h * 0.22)));
        const padCornerX = Math.min(72, Math.max(24, Math.round(20 + aspect * 5)));
        map.fitBounds(GC_INDIA_BOUNDS, {
          paddingTopLeft: [padCornerX, padCornerY],
          paddingBottomRight: [padCornerX, padCornerY],
          animate: false,
        });
        const floor = 4;
        if (map.getZoom() > floor) map.setZoom(floor);
        map.setMinZoom(Math.max(map.getZoom() - 1, floor));
        map.setMaxZoom(10);
        map.panInsideBounds(GC_INDIA_BOUNDS, { animate: false });
      };

      fitFullIndia();
      requestAnimationFrame(() => {
        map.invalidateSize();
        requestAnimationFrame(() => {
          map.invalidateSize();
          fitFullIndia();
        });
      });

      mapRef.current = map;
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
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      destroyMap();
    };
  }, [onStateHover]);

  useEffect(() => {
    markersRef.current.forEach(({ marker, loc }) => {
      marker.setIcon(makeGcMapIcon(activeState === loc.id));
    });
  }, [activeState]);

  return (
    <div ref={wrapRef} className="gc-map-leaflet-wrap">
      <div ref={elRef} className="gc-map-leaflet" aria-label="Map of India showing Focalyt presence locations" role="img" />
    </div>
  );
}

function GeographicCoverageSection() {
  const [hoveredState, setHoveredState] = useState(null);

  return (
    <>
      <style>{GEOGRAPHIC_COVERAGE_STYLES}</style>
      <div className="gc">
        <section className="gc-hero">
          <div className="gc-cont">
            <div className="gc-hero-grid">
              <div className="gc-hero-left">
                <div className="gc-eyebrow"><div className="gc-eyebrow-line" /><span className="gc-eyebrow-text">Geographic Coverage</span><div className="gc-eyebrow-line" /></div>
                <h1 className="gc-h1">No Boundaries.</h1>
                <div className="gc-h1-sub">Only Impact.</div>
                <p className="gc-desc">Focalyt delivers skills, opportunities and sustainable impact across India - beyond boundaries.</p>
                <div className="gc-reach-badge"><div className="gc-reach-ico">🌐</div><div className="gc-reach-text">We reach beyond boundaries to create skills, opportunities and sustainable impact.</div></div>
                
              </div>
              <div className="gc-hero-right">
                {/* <div className="gc-map-wrap">
                  <GeographicCoverageLeafletMap activeState={hoveredState} onStateHover={setHoveredState} />
                </div> */}
                <div className="gc-inline-card">
                  <div className="gc-inline-title"><span>📍</span> Our presence across states</div>
                  <div className="gc-state-list">
                    {GC_WORK_LOCATIONS.map((loc) => (
                      <div
                        key={loc.id}
                        className={`gc-state-row gc-state-row-interactive${hoveredState === loc.id ? " gc-state-row-active" : ""}`}
                        onMouseEnter={() => setHoveredState(loc.id)}
                        onMouseLeave={() => setHoveredState(null)}
                        onFocus={() => setHoveredState(loc.id)}
                        onBlur={() => setHoveredState(null)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Highlight ${loc.label} on map`}
                      >
                        <span className="gc-state-dot" />
                        {loc.label}
                      </div>
                    ))}
                    <div className="gc-state-row"><span className="gc-state-dot" />…and more</div>
                  </div>
                  <div className="gc-commit"><span style={{ fontSize: 18 }}>🌐</span><span>We are committed to reaching every region, <strong style={{ color: "var(--navy)" }}>empowering communities everywhere.</strong></span></div>
                </div>
              </div>
            </div>
            <div className="gc-reach-section">
            <div className="gc-section-head">Our Reach Model</div>
            <div className="gc-reach-grid">
              {GC_REACH_MODEL.map((item) => <div key={item.label} className="gc-reach-card"><div className="gc-reach-card-ico">{item.ico}</div><div className="gc-reach-card-label">{item.label}</div></div>)}
            </div>
            </div>
          </div>
        </section>


        {/* <div className="gc-cont">
          <div className="gc-bottom-cta">
            <div className="gc-cta-left"><span className="gc-cta-ico">🌐</span><div><div className="gc-cta-h">No boundary limitations.<br />Limitless possibilities.</div><div className="gc-cta-sub">Focalyt is equipped to design, deploy and scale skill development, livelihood, entrepreneurship, education, MSME and community impact programs across India.</div></div></div>
            <button type="button" className="btn-primary gc-cta-btn" data-bs-toggle="modal" data-bs-target="#partnerModal">Partner With Us →</button>
          </div>
        </div> */}
      </div>
    </>
  );
}

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

const SIC_PARTNERS = ACADEMIC_PARTNERS.map(getPartnerLabel);

/** Partner-with-us section — narrative aligned with company profile / pillars on site. */
const PARTNER_PROFILE_HIGHLIGHTS = [
  "CSR & industry tracks with Samsung, Ericsson, Patanjali and foundations including Focal Skill Foundation & Samsung Innovation Campus.",
  "Government & SSC alignment — Ministry of Electronics & IT, Ministry of Tourism, Tribal Affairs, Rural Development (Uttarakhand), Telecom Sector Skill Council (TSSC), and Tourism & Hospitality Sector Skill Council.",
  "Institutional scale — 30+ partner schools & colleges, hands-on Future Technology Labs, and placement-linked skilling across states.",
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

/** CSR / govt marquees — same lists as Our Partners section */
const CSR_MARQUEE_PARTNERS = CSR_PARTNERS;
const GOVT_MARQUEE_PARTNERS = GOVT_PARTNERS;

const FOC_HOME_THEME_STORAGE_KEY = "foc-homepage-theme";

const FOC_HOME_THEME = "sky-magenta";

/* Theme picker (disabled — fixed Sky Magenta)
const FOC_HOME_THEMES = [
  { id: "aurora", label: "Aurora", tone: "light" },
  ...
];
function getInitialFocHomeTheme() { ... }
*/


const HOME_HASH_SCROLL_OFFSET = 130;

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
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
    name: "",
    state: "",
    mobile: "",
    email: "",
    message: "",
    courseName: "",
    sectorName: "",
    projectName: "",
    typeOfProject: "",
  });
  const [callbackLoading, setCallbackLoading] = useState(false);
  const [callbackSuccess, setCallbackSuccess] = useState("");
  const [callbackError, setCallbackError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [jobsError, setJobsError] = useState("");
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  
  /** Scroll down → CSR strip RTL (right-to-left); scroll up → LTR. Govt strip uses the opposite. */
  const [marqueeScrollDown, setMarqueeScrollDown] = useState(true);
  const lastScrollY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  // const [focTheme, setFocTheme] = useState(getInitialFocHomeTheme);
  // const [themePanelOpen, setThemePanelOpen] = useState(false);
  // const themeFabRef = useRef(null);
  const courseCarouselRef = useRef(null);
  const jobCarouselRef = useRef(null);
  const eventsCarouselRef = useRef(null);
  const expiredEventsCarouselRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [feeFilter, setFeeFilter] = useState("all");
  
  const scrollCourseCarousel = (direction) => {
    const el = courseCarouselRef.current;
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

  const scrollEventsCarousel = (direction) => {
    const el = eventsCarouselRef.current;
    if (!el) return;
    const step = Math.max(240, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const scrollExpiredEventsCarousel = (direction) => {
    const el = expiredEventsCarouselRef.current;
    if (!el) return;
    const step = Math.max(240, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const getJobThumbnailUrl = (job) => {
    if (job?.jobVideoThumbnail) {
      return resolveMediaUrl(bucketUrl, job.jobVideoThumbnail);
    }
    if (job?.thumbnail) {
      if (bucketUrl && !job.thumbnail.startsWith("http://") && !job.thumbnail.startsWith("https://")) {
        const thumbPath = job.thumbnail.startsWith("/") ? job.thumbnail.slice(1) : job.thumbnail;
        return `${bucketUrl}/${thumbPath}`;
      }
      return job.thumbnail;
    }
    if (job?._company?.logo) {
      if (bucketUrl && !job._company.logo.startsWith("http://") && !job._company.logo.startsWith("https://")) {
        const logoPath = job._company.logo.startsWith("/") ? job._company.logo.slice(1) : job._company.logo;
        return `${bucketUrl}/${logoPath}`;
      }
      return job._company.logo;
    }
    return "/Assets/public_assets/images/newjoblisting/course_img.svg";
  };

  const handleShare = async (course, courseId, courseName) => {
    const courseUrl = `${window.location.origin}/coursedetails/${courseId}`;
    const detailText = course
      ? [course.duration && `Duration: ${course.duration}`, course.trainingMode && course.trainingMode, course.courseType === "coursejob" ? "Course + Jobs" : "Course"].filter(Boolean).join(" • ")
      : "";
    const shareText = detailText ? `${courseName} — ${detailText}` : `Check out this course: ${courseName}`;

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

  const handleCourseShare = (course) => {
    handleShare(course, course._id, course.name);
  };

  const handleCourseRequestCallback = (course) => {
    setFormData((prev) => ({
      ...prev,
      courseName: course.name ?? "",
      sectorName: course.sectorNames ?? "",
      projectName: course.projectName ?? "",
      typeOfProject: course.typeOfProject ?? "",
    }));
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
    root.setAttribute("data-foc-theme", FOC_HOME_THEME);
    root.style.setProperty("--front-layout-bg", "var(--bg)");
    try {
      window.localStorage.setItem(FOC_HOME_THEME_STORAGE_KEY, FOC_HOME_THEME);
    } catch {
      /* ignore */
    }
    return () => {
      root.removeAttribute("data-foc-theme");
      root.style.removeProperty("--front-layout-bg");
    };
  }, []);

  /* Theme picker panel (disabled)
  useEffect(() => {
    if (!themePanelOpen) return undefined;
    ...
  }, [themePanelOpen]);
  */

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
    // ✅ Filter by Fee Type (Paid/Free)
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
        setVideoSrc(""); // ✅ Resets video when modal is fully closed
      });
    }
    return () => {
      if (videoModal) {
        videoModal.removeEventListener("hidden.bs.modal", () => setVideoSrc(""));
      }
    };
  }, []);

  const checkRegistrationStatus = (eventDate) => {
    const today = moment();
    const eventEndDate = moment(eventDate);
    return eventEndDate.isBefore(today);
  };

  const pillarUi = PILLAR_UI[activeArea];
  const hoveredGovtAreaItem = currentGovtArea?.items?.[hoveredGovtAreaItemIdx ?? -1] ?? null;
  const govtAreaVisual = hoveredGovtAreaItem?.img ?? hoveredGovtAreaItem?.icon ?? currentGovtArea?.emoji ?? "📣";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/event`);
        const all = response.data.events ?? [];
        setEvents(all.filter((e) => !checkRegistrationStatus(e.timing?.to)));
        setExpiredEvents(all.filter((e) => checkRegistrationStatus(e.timing?.to)));

      } catch (error) {
        console.error("Error fetching events data:", error);
      }
    };
    fetchData();
  }, []);


  const scrollToCoreArea = (areaKey) => {
    if (areaKey) setActiveArea(areaKey);
    scrollToSection("core");
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - HOME_HASH_SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) return undefined;
    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - HOME_HASH_SCROLL_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 200);
    return () => clearTimeout(timer);
  }, [location.hash]);

  const handleCallbackChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCallbackSubmit = async (e) => {
    e.preventDefault();
    setCallbackLoading(true);
    setCallbackSuccess("");
    setCallbackError("");

    try {
      const response = await axios.post(`${backendUrl}/callback`, formData, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.status === 200 || response.status === 201) {
        setCallbackSuccess("Thank you! We will call you back shortly.");
        setFormData((prev) => ({
          ...prev,
          name: "",
          state: "",
          mobile: "",
          email: "",
          message: "",
        }));
      }
    } catch {
      setCallbackError("Failed to submit. Please try again.");
    } finally {
      setCallbackLoading(false);
    }
  };

  return (
    <FrontLayout>
      <div className="foc-cyber-home hp-theme">
       
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
                  Future Tech Driven Socio Economic Impact — Job Discovery, Skilling &amp; Upskilling, and Future Technology Labs across India.
                </p>  */}
                {/* <div className="hero-pills">
                  {["AI & ML", "Robotics", "Drone Pilot", "IoT", "AR & VR", "Cloud"].map((t) => (
                    <span key={t} className="pill">
                      {t}
                    </span>
                  ))}
                </div> */}
                <div className="hero-btns">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => scrollToSection("future-jobs")}
                  >
                    Live Jobs →
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => scrollToSection("future-courses")}
                  >
                    Live Courses →
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => scrollToSection("events")}
                  >
                    Live Events →
                  </button>
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
                          <span className="hero-tile-line">{t.line1}</span>
                          <span className="hero-tile-line">
                            {t.key === "msme" ? (
                              <>
                                MSME<span className="hero-tile-lower">s</span>
                              </>
                            ) : (
                              t.line2
                            )}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary hero-right-cta"
                  data-bs-toggle="modal"
                  data-bs-target="#partnerModal"
                >
                  Partner with us →
                </button>
              </div>
            </div>
          </div>
        </section>

       

        <section className="section grid-bg" id="about">
          <div className="container">
            <div className="section-head" id="core">
              <div className="stag">What We Do</div>
              <h2 className="sh2">
                Four Pillars of <span className="cyan">Impact</span>
              </h2>
              {/* <p className="s-body">From future-ready skills to social impact — Focalyt bridges the gap between learning and opportunity.</p> */}
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
              <div className="ip-pillars-wrap">
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
                            <div className={`ip-proj-logo${!proj.logoImg && proj.logoKey === "panasonic-harit" ? " ip-proj-logo--wide" : ""}`}>
                              {proj.logoImg ? (
                                <img src={proj.logoImg} alt="" />
                              ) : (
                                <PillarProjectLogo logoKey={proj.logoKey} />
                              )}
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
          <div className="container">
            <FTLaaSSection />
          </div>
        </section>

        <section className="section grid-bg" id="industry-automation">
          <div className="container">
            <IndustryAutomationSection />
          </div>
        </section>

        <ZenithXSection />

     

         {/* <section className="section grid-bg" id="labsAsService">
          <div className="container">
            <div className="section-head">
              <div className="stag">FFTLaaS · AI + Robotics + IoT</div>
              <h2 className="sh2">
                Future Technology Lab as a <span className="red">Service</span>
              </h2>
              <p className="s-body">
                AI + Robotics + IoT for schools — world-class lab outcomes without the capital-heavy build-out. Quarterly rhythm, teacher upskilling, and hands-on kits on an annual subscription.
              </p>
            </div>
            <div className="fftl-nep">Integrated with NEP 2020 · Future Ready School</div>
            <p className="s-body">
              Focalyt&apos;s Future Technology Lab as a Service (FFTLaaS) democratizes access to advanced learning: your institution runs an immersive AI, Robotics &amp; IoT program with curriculum alignment, expert support, and flexible plans — not the typical friction of owning and maintaining a full lab stack alone.
            </p>

            <div className="section-head" style={{ marginTop: 48, marginBottom: 22 }}>
              <h2 className="sh2">
                Curriculum stack — <span className="cyan">one integrated lab</span>
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

            <div className="section-head" style={{ marginTop: 48, marginBottom: 22 }}>
              <h2 className="sh2">
                Partnership journey — <span className="red">launching your FFTL</span>
              </h2>
            </div> 
             <div className="fftl-cute-path">
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
        </section>  */}




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
                  <div className="role-cta">Access System →</div>
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
                    <circle cx="70" cy="70" r="68" fill="white" stroke="var(--foc-border-ui-alt2)" strokeWidth="2" />
                    <path d="M70 8 A62 62 0 0 1 132 70" stroke="var(--red)" strokeWidth="7" strokeLinecap="round" fill="none" />
                    <path d="M132 70 A62 62 0 0 1 70 132" stroke="#f57c00" strokeWidth="7" strokeLinecap="round" fill="none" />
                    <path d="M70 132 A62 62 0 0 1 8 70" stroke="var(--foc-green-dark)" strokeWidth="7" strokeLinecap="round" fill="none" />
                    <path d="M8 70 A62 62 0 0 1 70 8" stroke="var(--foc-blue)" strokeWidth="7" strokeLinecap="round" fill="none" />
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
                          👥
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
                          📊
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
            {/* <div className="section-head">
              <div className="stag">Latest Updates</div>
              <h2 className="sh2">
               Live <span className="cyan">Events</span>
              </h2>
              <p className="s-body">Explore our latest events and register to participate.</p>
            </div> */}

            {/* {events.length > 0 ? (
              <div className="course-carousel event-carousel">
                <button
                  type="button"
                  className="course-carousel-btn course-carousel-btn--prev"
                  aria-label="Scroll events left"
                  onClick={() => scrollEventsCarousel(-1)}
                >
                  ‹
                </button>
                <div className="course-carousel-viewport" ref={eventsCarouselRef}>
                  <div className="course-carousel-track">
                    {events.map((event) => (
                      <EventCard
                        key={event._id}
                        event={event}
                        bucketUrl={bucketUrl}
                        closed={checkRegistrationStatus(event.timing?.to)}
                        onPlayVideo={setVideoSrc}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="course-carousel-btn course-carousel-btn--next"
                  aria-label="Scroll events right"
                  onClick={() => scrollEventsCarousel(1)}
                >
                  ›
                </button>
              </div>
            ) : (
              <div className="text-center py-5">
                <h3 className="text-muted">No Events found </h3>
              </div>
            )} */}

            {expiredEvents.length > 0 && (
              <>
                <div className="section-head" style={{ marginTop: 34 }}>
                  <h2 className="sh2">
                    Live <span className="red">Events</span>
                  </h2>
                  <p className="s-body">Recent events whose registration is closed.</p>
                </div>

                <div className="course-carousel event-carousel">
                  <button
                    type="button"
                    className="course-carousel-btn course-carousel-btn--prev"
                    aria-label="Scroll expired events left"
                    onClick={() => scrollExpiredEventsCarousel(-1)}
                  >
                    ‹
                  </button>
                  <div className="course-carousel-viewport" ref={expiredEventsCarouselRef}>
                    <div className="course-carousel-track">
                  {expiredEvents.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      bucketUrl={bucketUrl}
                      closed
                      onPlayVideo={setVideoSrc}
                    />
                  ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="course-carousel-btn course-carousel-btn--next"
                    aria-label="Scroll expired events right"
                    onClick={() => scrollExpiredEventsCarousel(1)}
                  >
                    ›
                  </button>
                </div>
              </>
            )}

            <div style={{ marginTop: 18, textAlign: "center" }}>
              <Link to="/events" className="btn-ghost">
                View all events →
              </Link>
            </div>
          </div>
        </section>

        {/* <section className="section section-alt" id="impact">
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
              <div className="states-head">// Clients & Partners</div>
              <div className="partners-flex" style={{ marginTop: 14 }}>
                {IMPACT_PARTNERS.map((p) => (
                  <div key={p} className="partner-chip">
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section> */}

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
                  ‹
                </button>
                <div className="course-carousel-viewport" ref={courseCarouselRef}>
                  <div className="course-carousel-track">
                    {courses.map((course) => (
                      <CourseCard
                        key={course._id}
                        course={course}
                        bucketUrl={bucketUrl}
                        onPlayVideo={setVideoSrc}
                        onShare={handleCourseShare}
                        onRequestCallback={handleCourseRequestCallback}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="course-carousel-btn course-carousel-btn--next"
                  aria-label="Scroll courses right"
                  onClick={() => scrollCourseCarousel(1)}
                >
                  ›
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
                View all courses →
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
              <p className="s-body">Featured openings from our job board — apply or explore the full list.</p>
            </div>

            {jobs.length > 0 ? (
              <div className="course-carousel job-carousel">
                <button
                  type="button"
                  className="course-carousel-btn course-carousel-btn--prev"
                  aria-label="Scroll jobs left"
                  onClick={() => scrollJobCarousel(-1)}
                >
                  ‹
                </button>
                <div className="course-carousel-viewport" ref={jobCarouselRef}>
                  <div className="course-carousel-track">
                    {jobs.map((job) => (
                      <JobCard
                        key={job._id}
                        job={job}
                        thumbUrl={getJobThumbnailUrl(job)}
                        bucketUrl={bucketUrl}
                        onPlayVideo={setVideoSrc}
                        onShare={handleShareJob}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="course-carousel-btn course-carousel-btn--next"
                  aria-label="Scroll jobs right"
                  onClick={() => scrollJobCarousel(1)}
                >
                  ›
                </button>
              </div>
            ) : (
              <div className="text-center py-5">
                <h3 className="text-muted">{jobsError || "No jobs to show right now"}</h3>
                <p>
                  {jobsError
                    ? "Please check that the job listing API is running."
                    : "New openings will appear here when available."}
                </p>
              </div>
            )}

            <div style={{ marginTop: 18, textAlign: "center" }}>
              <Link to="/joblisting" className="btn-ghost">
                View all jobs →
              </Link>
            </div>
          </div>
        </section>

        <OurApproachSection />


        <PartnersMediaSection />

        <section className="section section-alt" id="geographic-reach">
          <div className="container">
            <GeographicCoverageSection />
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
              <p className="s-body tect-center">Executed across India — from Samsung campuses to tribal villages in Uttarakhand.</p>
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
              <div className="states-head">// Geographical Presence — 11+ States</div>
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
              <p className="cta-sub">Future Ready Skills · Future Ready Schools · Future Ready MSME · Future Ready Environment</p>
              <div className="cta-btns">
                <Link to="/candidate/login" className="btn-primary">
                  Get Started →
                </Link>
                <a href="mailto:parveen.bansal@focalyt.com" className="btn-ghost">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section> */}

        {/* Theme picker — hidden (fixed Sky Magenta)
        <div className="foc-theme-fab-wrap" ref={themeFabRef}>...</div>
        */}

<style>
          {
            `
            .video-fluid {
    width: 100%;
}
            
.bg-img {
    position: relative;
    border-radius: 11px;
    border: 1px solid var(--foc-color-surface);
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
.foc-cyber-home #future-courses .btn.cta-callnow,
.foc-cyber-home #future-jobs .btn.cta-callnow {
    width: 100%;
    letter-spacing: 0.02em;
}
.foc-cyber-home #future-courses .learnn,
.foc-cyber-home #future-jobs .learnn {
  padding: 4px 0;
}
.foc-cyber-home #future-courses .course_card_footer,
.foc-cyber-home #future-jobs .course_card_footer {
    background: var(--home-card-cta, var(--foc-navy-deep, #0d2146));
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
}
.jobs h1 {
    color: var(--foc-color-cta);
    font-size: 45px;
    font-weight: 700;
    font-family: var(--foc-font-display);
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
  color: var(--foc-color-text-inverse);
  background-color: var(--foc-color-cta)!important;
}
button.close {
    z-index: 9;
    background: var(--foc-color-surface);
    border: 2px solid var(--foc-color-cta) !important;
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
    color: var(--foc-color-cta);
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
    color: var(--foc-gray-500);
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
    border-radius: var(--foc-radius-xl);
    font-weight: 500;
    border: 1px solid var(--foc-color-border-ui);
    background: white;
    color: var(--foc-color-text-strong);
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  
  .filter-button:hover {
    border-color: var(--foc-pink-500);
  }
  
  .filter-button.active {
    background: var(--foc-pink-500);
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
    background: var(--foc-chip-bg);
    color: var(--foc-color-text-strong);
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
    background: var(--foc-magenta-deep);
    color: white;
  }
  
  .active-indicator {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: var(--foc-pink-500);
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
    background-color: var(--foc-pink-500);
    color: white;
    border: none;
  }
  
  .btn-bg-color:hover {
    background-color: var(--foc-magenta-deep);
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
    background-color: var(--foc-pink-500);
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
    background-color: var(--foc-pink-500);
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .submit_btn:hover {
    background-color: var(--foc-magenta-deep);
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
  border: 1px solid var(--foc-color-cta);
  transition: 0.4s ease-in-out;
}
#callbackForm button:hover{
  border: 1px solid var(--foc-color-cta);
  color: var(--foc-color-cta);
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

.foc-cyber-home #future-jobs .future-jobs-row {
  row-gap: 6px;
}

.foc-cyber-home #future-jobs .card-padd {
  display: flex;
}

.foc-cyber-home #future-jobs .job-live-card {
  width: 100% !important;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.16) !important;
  border-radius: 14px !important;
  background:
    linear-gradient(180deg, rgba(28,31,43,.98), rgba(16,18,28,.98)) !important;
  box-shadow: 0 18px 48px rgba(15, 23, 42, .16);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}

.foc-cyber-home #future-jobs .job-live-card:hover {
  transform: translateY(-6px);
  border-color: rgba(252,43,90,.46) !important;
  box-shadow: 0 24px 56px rgba(15, 23, 42, .24);
}

.foc-cyber-home #future-jobs .job-live-card .bg-img {
  // margin: 12px 12px 0;
  aspect-ratio: 16 / 9;
  border: 1px solid rgba(255,255,255,.20);
  border-radius: 12px;
  box-shadow: none;
  background: #101827;
}

.foc-cyber-home #future-jobs .job-live-card .bg-img a,
.foc-cyber-home #future-jobs .job-live-card .bg-img img.digi {
  display: block;
  width: 100%;
  height: 100%;
}

.foc-cyber-home #future-jobs .job-live-card .bg-img img.digi {
  object-fit: cover;
}

.foc-cyber-home #future-jobs .job-live-card img.group1 {
  width: 58px !important;
  filter: drop-shadow(0 8px 18px rgba(0,0,0,.45));
}

.foc-cyber-home #future-jobs .job-live-card .verified-badge-container {
  top: 8px !important;
  right: 8px !important;
  transform: scale(.82);
  transform-origin: top right;
}

.foc-cyber-home #future-jobs .job-live-card .right_obj {
  top: 16px;
  right: 12px !important;
  border-radius: 999px;
  border: 1px solid rgba(255,213,66,.72);
  outline: 0;
  padding: 5px 12px;
  font-size: 11px;
  line-height: 1;
  letter-spacing: .02em;
  background: rgba(255,255,255,.95);
}

.foc-cyber-home #future-jobs .job-live-card .card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.foc-cyber-home #future-jobs .job-live-card .course-title,
.foc-cyber-home #future-courses .course-carousel-item .course-card-title {
  display: block;
  width: 100%;
  max-width: 100%;
  margin-bottom: 6px;
  font-family: var(--foc-font-sans) !important;
  font-size: clamp(19px, 2vw, 23px) !important;
  font-weight: 700 !important;
  line-height: 1.18;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.foc-cyber-home #future-jobs .job-live-card .job-qualification-text,
.foc-cyber-home #future-courses .course-carousel-item .course-qualification-text {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 0;
  font-family: var(--foc-font-sans) !important;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.88) !important;
}

.foc-cyber-home #future-jobs .job-live-card .courses_features,
.foc-cyber-home #future-courses .course-carousel-item .courses_features {
  min-width: 0;
}

.foc-cyber-home #future-jobs .ellipsis-wrapper,
.foc-cyber-home #future-courses .ellipsis-wrapper {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.foc-cyber-home #future-jobs .job-live-card .companyname {
  max-width: 100%;
  min-height: 20px;
  color: rgba(255,255,255,.74) !important;
  font-size: 14px;
  font-weight: 600;
}

.foc-cyber-home #future-jobs .job-live-card .digi-price {
  margin: 10px 0 14px !important;
}

.foc-cyber-home #future-jobs .job-live-card .r-price,
.foc-cyber-home #future-jobs .job-live-card .rupee {
  font-size: 18px;
  font-weight: 800;
}

.foc-cyber-home #future-jobs .job-detail-wrap {
  width: 100%;
  max-width: 100%;
  flex: 1;
}

.foc-cyber-home #future-jobs .job-meta-grid {
  margin-left: -5px;
  margin-right: -5px;
}

.foc-cyber-home #future-jobs .job-feature {
  padding-left: 5px;
  padding-right: 5px;
}

.foc-cyber-home #future-jobs .job-feature > .row {
  height: 100%;
  min-height: 42px;
  align-items: center;
  margin: 0;
  padding: 8px 6px;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 10px;
  background: rgba(255,255,255,.055);
}

.foc-cyber-home #future-jobs .job-feature figure {
  margin: 0;
}

.foc-cyber-home #future-jobs .job-feature .new_img {
  width: 18px !important;
  max-height: 18px;
  object-fit: contain;
}

.foc-cyber-home #future-jobs .job-feature .courses_features p {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  line-height: 1.25;
  color: rgba(255,255,255,.88) !important;
}

.foc-cyber-home #future-jobs .job-deadline {
  margin-top: 2px;
}

.foc-cyber-home #future-jobs .job-deadline > .row {
  align-items: center;
  margin: 0;
  padding: 9px 10px;
  border-radius: 10px;
  background: rgba(252,43,90,.12);
}

.foc-cyber-home #future-jobs .job-deadline p {
  margin: 0;
}

.foc-cyber-home #future-jobs .apply_date {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,.78) !important;
}

.foc-cyber-home #future-jobs .job-action {
  padding-left: 5px;
  padding-right: 5px;
}

.foc-cyber-home #future-jobs .job-action .btn.cta-callnow {
  width: 100% !important;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  border: 1px solid var(--home-card-cta, var(--foc-navy-deep, #0d2146));
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.foc-cyber-home #future-jobs .job-action .btn-bg-color {
  background: var(--home-card-cta, var(--foc-navy-deep, #0d2146)) !important;
  color: var(--foc-color-text-inverse) !important;
}

.foc-cyber-home #future-jobs .job-action .btn.cta-callnow:not(.btn-bg-color) {
  background: rgba(255,255,255,.96);
  color: var(--home-card-cta, var(--foc-navy-deep, #0d2146)) !important;
}

.foc-cyber-home #future-jobs .course_card_footer a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  text-decoration: none;
}

.foc-cyber-home #future-jobs .course_card_footer .learnn {
  padding: 4px 0;
  font-weight: 700;
  letter-spacing: .03em;
}

@media (max-width: 575.98px) {
  .foc-cyber-home #future-jobs .card-padd {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  // .foc-cyber-home #future-jobs .job-live-card .card-body {
  //   padding-left: 14px !important;
  //   padding-right: 14px !important;
  // }

  .foc-cyber-home #future-jobs .job-live-card .course-title,
  .foc-cyber-home #future-courses .course-carousel-item .course-card-title {
    font-size: 20px !important;
  }

  .foc-cyber-home #future-jobs .job-feature > .row {
    min-height: 40px;
    padding: 7px 4px;
  }

  .foc-cyber-home #future-jobs .job-feature .courses_features p,
  .foc-cyber-home #future-jobs .apply_date {
    font-size: 12px;
  }
}
}

          .op-Reg{
    color: var(--foc-color-text-inverse);
}
.flag{
    position: absolute;
    top: 2px;
    left: 10px;
}
.flag h4{
  font-size: 15px;
}
.share-Event{
    position: absolute;
    top: 5px;
    right: 10px;
}
.openRegistration{
    position: absolute;
    bottom: 20px;
    text-align: center;
    color: var(--foc-color-text-inverse);
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
}
.op-Reg-p{
    color: var(--foc-color-text-inverse);
    font-weight: 500;
    font-size: 16px;
}

/* From Uiverse.io by Mohammad-Rahme-576 */ 
/* Container Styles */
.share-Event .tooltip-container {
    position: relative;
    display: inline-block;
    font-family: var(--foc-font-display);
    overflow: visible;
  }
  
  /* Button Styles */
 .share-Event  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #6e8efb, #a777e3);
    color: white;
    padding: 5px 10px;
    border-radius: 50px;
    cursor: pointer;
    transition:
      background 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
      transform 0.3s ease,
      box-shadow 0.4s ease;
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 10;
    overflow: hidden;
  }
  
 .share-Event  .button-content::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      rgba(110, 142, 251, 0.4),
      rgba(167, 119, 227, 0.4)
    );
    filter: blur(15px);
    opacity: 0;
    transition: opacity 0.5s ease;
    z-index: -1;
  }
  
  .share-Event .button-content::after {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.3) 0%,
      rgba(255, 255, 255, 0) 70%
    );
    transform: scale(0);
    transition: transform 0.6s ease-out;
    z-index: -1;
  }
  
  .share-Event .button-content:hover::before {
    opacity: 1;
  }
  
  .share-Event .button-content:hover::after {
    transform: scale(1);
  }
  
  .share-Event .button-content:hover {
    background: linear-gradient(135deg, #a777e3, #6e8efb);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
    transform: translateY(-4px) scale(1.03);
  }
  
  .share-Event .button-content:active {
    transform: translateY(-2px) scale(0.98);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
  }
  
  .share-Event .text {
    font-size: 13px;
    font-weight: 600;
    margin-right: 2px;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: letter-spacing 0.3s ease;
  }
  
  .share-Event .button-content:hover .text {
    letter-spacing: 1px;
  }
  
  .share-Event .share-icon {
    fill: white;
    transition:
      transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      fill 0.3s ease;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
  
  .share-Event .button-content:hover .share-icon {
    transform: rotate(180deg) scale(1.1);
    fill: var(--foc-color-surface);
  }
  
  /* Tooltip Styles */
  /* .share-Event .tooltip-content {
    position: absolute;
    top: 71%;
    left: 50%;
    transform: translateX(-50%) scale(0.8);
    background: white;
    border-radius: 15px;
    padding: 22px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      visibility 0.5s ease;
    z-index: 100;
    pointer-events: none;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.9);
  } */
  
  .share-Event .tooltip-content {
    position: absolute;
    top: 71%;
    left: 50%;
    transform: translateX(-50%) scale(0.8);
    background: rgba(255, 255, 255, 0.9);
    border-radius: 15px;
    padding: 22px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    opacity: 0;
    visibility: hidden;
    transition: 
      opacity 0.4s ease,
      transform 0.4s ease,
      visibility 0.4s;
    pointer-events: none;
    z-index: 100;
  }
  
  .share-Event .tooltip-container:hover .tooltip-content {
    opacity: 1;
    visibility: visible;
    left: 0;
    transform: translateX(-50%) scale(0.8);
    pointer-events: auto;
    transition-delay: 0s;
  }
  .share-Event .tooltip-content {
    transition:  opacity 0.4s ease,
    visibility 0.4s;
    transition-delay: 0s;
  }
  /* Social Icons Styles */
  .share-Event .social-icons {
    display: flex;
    justify-content: space-between;
    gap: 5px;
  }
  
  .share-Event .social-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f0f0f0;
    transition:
      transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      background 0.3s ease,
      box-shadow 0.4s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
  }
  
  .share-Event .social-icon::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.8) 0%,
      rgba(255, 255, 255, 0) 70%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .share-Event .social-icon:hover::before {
    opacity: 1;
  }
  
  .share-Event .social-icon svg {
    width: 24px;
    height: 24px;
    fill: #333;
    transition:
      transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55),
      fill 0.3s ease;
    z-index: 1;
  }
  
  .share-Event .social-icon:hover {
    transform: translateY(-5px) scale(1.1);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }
  
  .share-Event .social-icon:active {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  }
  
  .share-Event .social-icon:hover svg {
    transform: scale(1.2);
    fill: white;
  }
  
  .share-Event .social-icon.twitter:hover {
    background: linear-gradient(135deg, #1da1f2, #1a91da);
  }
  
  .share-Event .social-icon.facebook:hover {
    background: linear-gradient(135deg, #1877f2, #165ed0);
  }
  
  .share-Event .social-icon.linkedin:hover {
    background: linear-gradient(135deg, #0077b5, #005e94);
  }
  
  /* Animation for Pulse Effect */
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(110, 142, 251, 0.4);
    }
    70% {
      box-shadow: 0 0 0 20px rgba(110, 142, 251, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(110, 142, 251, 0);
    }
  }
  
  .share-Event .button-content {
    animation: pulse 3s infinite;
  }
  
  /* Hover Ripple Effect */
  @keyframes ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .share-Event .button-content::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: inherit;
    transform: scale(0);
    opacity: 0;
  }
  
  .share-Event .button-content:active::before {
    animation: ripple 0.6s linear;
  }
  
  /* Tooltip Arrow */
  .share-Event .tooltip-content::before {
    content: "";
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 10px 10px 10px;
    border-style: solid;
    border-color: transparent transparent rgba(255, 255, 255, 0.9) transparent;
    filter: drop-shadow(0 -3px 3px rgba(0, 0, 0, 0.1));
  }
  
  /* Accessibility */
  .share-Event .button-content:focus {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(110, 142, 251, 0.5),
      0 8px 15px rgba(0, 0, 0, 0.1);
  }
  
  .share-Event .button-content:focus:not(:focus-visible) {
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .share-Event .button-content {
      padding: 12px 24px;
      border-radius: 40px;
    }
  
    .text {
      font-size: 16px;
    }
  
    .share-Event .tooltip-content {
      width: 240px;
      padding: 18px;
    }
  
    .share-Event .social-icon {
      width: 44px;
      height: 44px;
    }
  
    .share-Event .social-icon svg {
      width: 20px;
      height: 20px;
    }
  }
  
  @media (max-width: 480px) {
    .share-Event .button-content {
      padding: 10px 20px;
    }
  
    .share-Event .text {
      font-size: 14px;
    }
  
    .share-Event .tooltip-content {
      width: 200px;
      padding: 15px;
    }
  
    .share-Event .social-icon {
      width: 40px;
      height: 40px;
    }
  
    .share-Event .social-icon svg {
      width: 18px;
      height: 18px;
    }
  }
  
  /* Dark Mode Support */
  @media (prefers-color-scheme: dark) {
    .share-Event .tooltip-content {
      background: rgba(30, 30, 30, 0.9);
      color: white;
    }
  
    .share-Event .tooltip-content::before {
      border-color: transparent transparent rgba(30, 30, 30, 0.9) transparent;
    }
  
    .share-Event .social-icon {
      background: #2a2a2a;
    }
  
    .share-Event .social-icon svg {
      fill: #e0e0e0;
    }
  }
  
  /* Print Styles */
  @media print {
    .share-Event .tooltip-container {
      display: none;
    }
  }
  
  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .share-Event .button-content,
    .share-Event .share-icon,
    .share-Event .social-icon,
    .share-Event .tooltip-content {
      transition: none;
    }
  
    .share-Event .button-content {
      animation: none;
    }
  }
  
  /* Custom Scrollbar for Tooltip Content */
  .share-Event .tooltip-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .share-Event .tooltip-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .share-Event .tooltip-content::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  
  .share-Event .tooltip-content::-webkit-scrollbar-thumb:hover {
    background: #555;
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
    background: var(--foc-color-surface);
    border: 1px dashed var(--foc-gold);
    border-bottom-left-radius: 15px;
    border-right: 0;
    box-shadow: .5px 0 2px #0000004d;
    color: var(--foc-color-cta);
    font-family: var(--foc-font-display);
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
  background-color: var(--foc-color-cta);
  border-bottom: none;
}
    
    `
  }
</style>
<style>
{
  `
  .w{width:100%;font-family:var(--foc-font-display);color:var(--color-text-primary)}

.hero{background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:1.5rem;margin-bottom:1.25rem}
.hero-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:500;padding:3px 10px;border-radius:999px;margin-bottom:.75rem;background:var(--color-background-success);color:var(--color-text-success)}
.hero-grid{display:grid;grid-template-columns:1fr auto;gap:1.5rem;align-items:center}
.hero-h{font-size:22px;font-weight:500;line-height:1.2;margin-bottom:.4rem}
.hero-h span{color:var(--foc-brand-deep)}
.hero-sub{font-size:13px;color:var(--color-text-secondary);line-height:1.6;margin-bottom:.9rem;max-width:500px}
.tpills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}
.tp{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--color-background-primary);border:0.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);font-size:12px}
.tp i{font-size:13px}
.hbtns{display:flex;gap:8px;flex-wrap:wrap}
.bp{display:inline-flex;align-items:center;gap:5px;padding:8px 16px;background:var(--foc-brand-deep);color:#EEEDFE;border:none;border-radius:var(--border-radius-md);font-size:12px;font-weight:500;cursor:pointer}
.bg{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;background:transparent;color:var(--color-text-primary);border:0.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);font-size:12px;cursor:pointer}
.hex-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.hex{background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:10px 8px;text-align:center}
.hex i{font-size:20px;display:block;margin-bottom:3px}
.hex-lbl{font-size:10px;font-weight:500;color:var(--color-text-secondary)}


.inst-tabs{display:flex;gap:8px;margin-bottom:1.25rem}
.itb{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 16px;border:0.5px solid var(--color-border-secondary);border-radius:var(--border-radius-lg);font-family:var(--foc-font-sans);font-size:13px;font-weight:500;color:var(--color-text-secondary);cursor:pointer;background:var(--color-background-primary);transition:all .15s}
.itb.on{border-color:var(--foc-brand-deep);color:var(--foc-brand-deep);background:var(--color-background-secondary)}
.itb:hover:not(.on){color:var(--color-text-primary);border-color:var(--color-border-primary)}
.itb i{font-size:18px}


.sub-tabs{display:flex;border-bottom:0.5px solid var(--color-border-tertiary);margin-bottom:1.25rem;gap:0;overflow-x:auto;scrollbar-width:none}
.sub-tabs::-webkit-scrollbar{display:none}
.stb{flex-shrink:0;display:flex;align-items:center;gap:6px;padding:9px 16px;border:none;background:transparent;font-family:var(--foc-font-sans);font-size:12px;font-weight:500;color:var(--color-text-secondary);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-0.5px}
.stb.on{color:var(--foc-brand-deep);border-bottom-color:var(--foc-brand-deep)}
.stb:hover:not(.on){color:var(--color-text-primary)}
.stb i{font-size:14px}

.inst-pane{display:none}.inst-pane.on{display:block}
.sub-pane{display:none}.sub-pane.on{display:block}


.main-layout{display:grid;grid-template-columns:1fr 220px;gap:1.25rem;align-items:start}
.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.grid-6{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}


.card{background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);}
.card-sm{background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);padding:.75rem}
.ico-wrap{width:32px;height:32px;border-radius:var(--border-radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.card-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.card h3{font-size:13px;font-weight:500}
.card p,.card-sm p{font-size:12px;color:var(--color-text-secondary);line-height:1.5}
.dot-list{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.dl{display:flex;align-items:flex-start;gap:7px;font-size:12px;color:var(--color-text-secondary);line-height:1.4}
.dl::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--foc-brand-deep);flex-shrink:0;margin-top:5px}
.check-list{display:flex;flex-direction:column;gap:5px}
.cl{display:flex;align-items:flex-start;gap:7px;font-size:12px;color:var(--color-text-secondary);line-height:1.4}
.cl i{font-size:13px;color:#1D9E75;flex-shrink:0;margin-top:1px}

.snap-card{background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:1rem;position:sticky;top:0}
.snap-title{font-size:10px;font-weight:500;letter-spacing:.07em;text-transform:uppercase;color:var(--color-text-tertiary);margin-bottom:.75rem}
.snap-row{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:.5px solid var(--color-border-tertiary)}
.snap-row:last-child{border-bottom:none}
.snap-num{font-size:17px;font-weight:500;line-height:1}
.snap-lbl{font-size:11px;color:var(--color-text-secondary);line-height:1.3}

.process-bar{display:grid;background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);overflow:hidden;margin-bottom:1rem}
.ps{padding:.9rem .75rem;text-align:center;position:relative;border-right:.5px solid var(--color-border-tertiary)}
.ps:last-child{border-right:none}
.ps-ni{display:flex;align-items:center;justify-content:center;gap:5px;margin-bottom:6px}
.ps-num{font-size:10px;color:var(--color-text-tertiary);font-weight:500}
.ps-ico{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.ps i{font-size:13px}
.ps h4{font-size:11px;font-weight:500;margin-bottom:3px}
.ps p{font-size:10px;color:var(--color-text-secondary);line-height:1.4}


.prog-item{background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);padding:.75rem;text-align:center}
.prog-item i{font-size:18px;display:block;margin-bottom:4px}
.prog-label{font-size:11px;font-weight:500;margin-bottom:2px}
.prog-sub{font-size:10px;color:var(--color-text-secondary);line-height:1.3}


.ticker{display:flex;background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);overflow:hidden;margin-bottom:1.25rem}
.ti-item{display:flex;align-items:center;gap:6px;padding:9px 12px;border-right:.5px solid var(--color-border-tertiary);font-size:11px;color:var(--color-text-secondary);flex:1;justify-content:center;white-space:nowrap}
.ti-item:last-child{border-right:none}
.ti-item i{font-size:13px;color:var(--foc-brand-deep)}


.sec-head{font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--color-text-tertiary);margin-bottom:.75rem;display:flex;align-items:center;gap:8px}
.sec-head i{font-size:14px;color:var(--foc-brand-deep)}
.sec-head::after{content:'';flex:1;height:.5px;background:var(--color-border-tertiary)}


.approach-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}


.partner-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:7px;margin-bottom:1.25rem}
.pchip{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md)}
.pi{width:28px;height:28px;border-radius:var(--border-radius-md);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;flex-shrink:0}
.pn{font-size:11px;font-weight:500;line-height:1.3}


.cta{background:#3C3489;border-radius:var(--border-radius-lg);padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-top:1.25rem}
.cta-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);color:#EEEDFE;font-size:10px;padding:3px 9px;border-radius:999px;margin-bottom:6px}
.cta-h{font-size:16px;font-weight:500;color:var(--foc-color-text-inverse);margin-bottom:3px}
.cta-sub{font-size:12px;color:#AFA9EC}
.cta-btns{display:flex;gap:7px;flex-wrap:wrap}
.cta-bw{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;background:var(--foc-color-surface);color:#3C3489;border:none;border-radius:var(--border-radius-md);font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap}
.cta-bg{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;background:transparent;color:var(--foc-color-text-inverse);border:.5px solid rgba(255,255,255,.35);border-radius:var(--border-radius-md);font-size:12px;cursor:pointer;white-space:nowrap}

  `
}

</style>

      </div>

      <div
        className="modal fade"
        id="videoModal"
        tabIndex="-1"
        aria-labelledby="videoModalTitle"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
            <div className="modal-body p-0 text-center embed-responsive">
              <video key={videoSrc} id="eventVid" controls className="video-fluid text-center">
                <source src={videoSrc} type="video/mp4" className="img-fluid video-fluid" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="callbackModal" tabIndex="-1" aria-labelledby="callbackModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered newWidth">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-black" id="callbackModalLabel">
                Request for Call Back
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <form id="callbackForm" onSubmit={handleCallbackSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6 col-6">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleCallbackChange}
                      required
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="col-md-6 col-6">
                    <label className="form-label">State</label>
                    <select
                      className="form-control"
                      name="state"
                      value={formData.state}
                      onChange={handleCallbackChange}
                      required
                    >
                      <option value="" disabled>
                        Select your State
                      </option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6 col-6">
                    <label className="form-label">Contact Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleCallbackChange}
                      required
                      pattern="[0-9]{10}"
                      placeholder="Enter 10-digit mobile number"
                    />
                  </div>
                  <div className="col-md-6 col-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleCallbackChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-control"
                    name="message"
                    value={formData.message}
                    onChange={handleCallbackChange}
                    required
                    placeholder="Enter your message here..."
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={callbackLoading}>
                  {callbackLoading ? "Submitting..." : "Submit"}
                </button>
                {callbackSuccess && <p className="text-success">{callbackSuccess}</p>}
                {callbackError && <p className="text-danger">{callbackError}</p>}
              </form>
            </div>
          </div>
        </div>
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
//       <section className="">
//         <div className="container">
//           <h2 className="section-title py-md-4 text-center color-pink">Empowering Minds Through Future Technology</h2>
//           <div className="row g-4 pb-5">

//             <div className="col-md-5 large-images" style={{display: 'flex'}}>
//               <div className="row g-4">
//                 <div className="col-12">
//                   <div className="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home1.jpg" alt="Robotics Workshop" className="img-fluid" />
//                   </div>
//                 </div>
//                 <div className="col-12">
//                   <div className="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home2.jpg" alt="Coding Session" className="img-fluid" />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="col-md-7 small-images">
//               <div className="row g-4">
//                 <div className="col-md-6">
//                   <div className="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home3.jpg" alt="AI Research" className="img-fluid" />
//                   </div>
//                 </div>
//                 <div className="col-md-6">
//                   <div className="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home4.jpg" alt="Machine Learning" className="img-fluid" />
//                   </div>
//                 </div>
//                 <div className="col-md-6">
//                   <div className="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home5.jpg" alt="Coding Challenge" className="img-fluid" />
//                   </div>
//                 </div>
//                 <div className="col-md-6">
//                   <div className="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home6.jpg" alt="Tech Seminar" className="img-fluid" />
//                   </div>
//                 </div>
//                 <div className="col-md-6">
//                   <div className="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home7.jpg" alt="Team Project" className="img-fluid" />
//                   </div>
//                 </div>
//                 <div className="col-md-6">
//                   <div className="lab-gallery-item">
//                     <img src="/Assets/images/homepage/home8.jpg" alt="Innovation Lab" className="img-fluid" />
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
//     color: var(--foc-color-text-inverse);
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
//     color: var(--foc-color-cta) !important;
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
//   color: var(--foc-color-text-inverse);
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
//   color: var(--foc-color-cta);
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
//   color: var(--foc-color-text-inverse);
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
//   background-color: var(--foc-color-text-inverse);
//   box-shadow: 0 12px 40px rgba(105,131,160,.2);
//   border-radius: var(--foc-radius-xl);
//   width: 100%;
//   padding: 10px 20px;
//   transition: .3s ease;
// }
// #about .feature-widget-7:hover {
//   z-index: 1;
//   background-color: var(--foc-color-text-inverse);
//   box-shadow: 0 12px 40px rgba(105,131,160,.2);
//   border-radius: var(--foc-radius-xl);
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
//   color: var(--foc-color-text-inverse);
//   font-weight: 800;
//   font-size: .999rem;
//   -webkit-user-select: none;
//   user-select: none;
//   /* color: var(--foc-color-text-inverse)!important; */
//   margin: 0 auto!important;
//   /* border: 1px solid var(--foc-color-cta)!important; */
//   transition: .3s ease!important;
//   /* border-radius: 50%;
//   background: var(--foc-color-cta); */
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
//   border-radius: var(--foc-radius-xl);
//   box-shadow: 10px -10px 10px rgba(128, 128, 128, 0.5);
// }
// .accordion-style-7-wrapper img {
//   width: 80%;
// }
// #how, #earning-option {
//    background-image: url(../../Assets/public_assets/images/newpage/index/bg-stipes.jpg); 
//   // background-image: url(../../../../public/Assets/public_assets/images/newpage/index/bg-stipes.jpg);
//   background-color: var(--foc-color-surface);
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
//   border-radius: var(--foc-radius-xl);
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
//   background: var(--foc-color-cta);
//   border-radius: 10px;
//   padding: 10px 20px;
//   border: 1px solid var(--foc-color-cta);
//   color: var(--foc-color-text-inverse);
// }
// .new_link a {
//   color: var(--foc-color-text-inverse);
//   font-weight: 500;
//   /* font-family: 'Inter", sans-serif'; */
//   transition: .8s ease;
// }
// .new_link:hover {
//   border: 1px solid var(--foc-color-cta);
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
//   /* color: var(--foc-color-cta); */
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
