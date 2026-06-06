import { Link } from "react-router-dom";

const STYLES = `
  .pw, .pw *, .pw *::before, .pw *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pw {
    --pw-cyan: var(--foc-cyan);
    --pw-magenta: var(--foc-magenta);
    --pw-purple: var(--foc-purple);
    --pw-navy: var(--foc-navy);
    --pw-navy-deep: var(--foc-navy-deep);
    --pw-navy-mid: var(--foc-navy-mid);
    --pw-indigo: var(--foc-indigo-600);
    --pw-heading-muted: #c4b5fd;
    --pw-border-card: var(--foc-color-border-tab);
    font-family: var(--foc-font-sans);
    background: var(--foc-color-surface);
    color: var(--foc-color-text-strong);
    overflow-x: hidden;
    width: 100%;
  }

  .pw-hero {
    background: linear-gradient(135deg, #04121f 0%, #071e36 40%, var(--foc-navy-panel) 70%, #1a0a30 100%);
    padding: 0;
    position: relative;
    overflow: hidden;
    min-height: 340px;
  }
  .pw-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(27,167,255,0.12) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.15) 0%, transparent 50%);
    pointer-events: none;
  }
  .pw-hero-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 340px;
    position: relative;
    z-index: 1;
  }
  .pw-hero-left {
    padding: 40px 40px 32px 48px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .pw-hero-eyebrow {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 14px;
    font-weight: 600;
  }
  .pw-hero-h1 {
    font-family: var(--foc-font-display);
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 900;
    line-height: 1.12;
    margin-bottom: 6px;
  }
  .pw-hero-h1-muted {
    display: block;
    color: var(--pw-heading-muted);
  }
  .pw-hero-h1-accent {
    display: block;
    background: linear-gradient(90deg, var(--pw-cyan) 0%, var(--foc-violet-400) 45%, var(--pw-magenta) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .pw-hero-tagline {
    font-size: 14px;
    color: rgba(255,255,255,0.92);
    font-weight: 700;
    letter-spacing: 1px;
    margin-bottom: 14px;
    text-transform: uppercase;
  }
  .pw-hero-desc {
    font-size: 13.5px;
    color: rgba(255,255,255,0.6);
    line-height: 1.65;
    max-width: 380px;
    margin-bottom: 24px;
  }
  .pw-stats-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 32px;
    max-width: 420px;
  }
  .pw-stat {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pw-stat-icon { font-size: 20px; }
  .pw-stat-num {
    font-family: var(--foc-font-display);
    font-size: 18px;
    font-weight: 800;
    color: var(--foc-color-text-inverse);
    line-height: 1;
  }
  .pw-stat-label {
    font-size: 10px;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .pw-hero-right {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 3px;
    overflow: hidden;
  }
  .pw-hero-img {
    background-size: cover;
    background-position: center;
    position: relative;
    overflow: hidden;
  }
  .pw-hero-img::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(4,18,31,0.08) 0%, rgba(4,18,31,0.28) 100%);
  }
  .pw-hero-img-main {
    grid-column: 1 / 3;
    grid-row: 1 / 2;
    min-height: 190px;
  }
  .pw-hero-img-sub { min-height: 110px; }

  .pw-hero-icons {
    position: absolute;
    top: 28px;
    right: 20px;
    display: flex;
    gap: 20px;
    z-index: 10;
  }
  .pw-hero-icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .pw-hero-icon-circle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(4px);
  }
  .pw-hero-icon-circle.active {
    border-color: var(--foc-amber-400);
    background: rgba(251, 191, 36, 0.18);
    box-shadow: 0 0 18px rgba(251, 191, 36, 0.55);
    font-size: 22px;
  }
  .pw-hero-icon-label {
    font-size: 9px;
    color: rgba(255,255,255,0.55);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
  }

  .pw-pills-bar {
    background: rgba(255,255,255,0.05);
    border-top: 1px solid rgba(255,255,255,0.08);
    padding: 10px 48px;
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
  }
  .pw-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    color: rgba(255,255,255,0.6);
    font-size: 12px;
    font-weight: 500;
  }
  .pw-pill-icon { font-size: 15px; }

  .pw-section-label {
    text-align: center;
    padding: 44px 20px 32px;
    position: relative;
    background: var(--foc-color-surface);
  }
  .pw-section-label::before,
  .pw-section-label::after {
    content: '';
    position: absolute;
    top: 60px;
    width: calc(50% - 180px);
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.31));
  }
  .pw-section-label::before { left: 20px; }
  .pw-section-label::after {
    right: 20px;
    background: linear-gradient(90deg, rgba(124, 58, 237, 0.31), transparent);
  }
  .pw-section-title {
    font-family: var(--foc-font-display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--pw-purple);
  }

  .pw-ecosystem {
    padding: 0 32px 48px;
    background-color: var(--foc-color-surface);
    background-image:
      linear-gradient(90deg, rgba(124, 58, 237, 0.035) 1px, transparent 1px),
      linear-gradient(rgba(124, 58, 237, 0.035) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .pw-eco-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 14px;
    max-width: var(--foc-container-max-xl);
    margin: 0 auto;
  }
  .pw-eco-card {
    border: 1.5px solid var(--pw-border-card);
    border-radius: 16px;
    padding: 22px 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    position: relative;
    overflow: hidden;
    background: var(--foc-color-surface);
  }
  .pw-eco-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--card-accent, var(--foc-purple-dark));
    opacity: 0;
    transition: opacity 0.22s;
  }
  .pw-eco-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--foc-shadow-card);
    border-color: var(--card-accent, var(--foc-purple-dark));
  }
  .pw-eco-card:hover::before { opacity: 1; }

  .pw-eco-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background: var(--card-icon-bg, var(--foc-partner-purple-bg));
  }
  .pw-eco-title {
    font-family: var(--foc-font-display);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--card-accent, var(--foc-purple-dark));
    line-height: 1.3;
  }
  .pw-eco-desc {
    font-size: 11.5px;
    color: var(--foc-color-text-body);
    line-height: 1.6;
    flex: 1;
  }
  .pw-eco-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    cursor: pointer;
    border: none;
    color: var(--foc-color-text-inverse);
    background: var(--card-accent, var(--foc-purple-dark));
    transition: opacity 0.15s, transform 0.15s;
    width: 100%;
    justify-content: center;
    text-decoration: none;
    font-family: var(--foc-font-sans);
  }
  .pw-eco-btn:hover { opacity: 0.85; transform: scale(1.02); color: var(--foc-color-text-inverse); }
  .pw-eco-footer {
    border-top: 1px solid #f1f5f9;
    padding-top: 10px;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 10.5px;
    color: var(--foc-color-text-caption);
  }
  .pw-eco-footer-icon { font-size: 13px; }

  .pw-explore {
    background: linear-gradient(135deg, #04121f 0%, #071e36 50%, #1a0a30 100%);
    padding: 0;
    display: grid;
    grid-template-columns: 280px 1fr 280px;
    min-height: 220px;
    position: relative;
    overflow: hidden;
  }
  .pw-explore::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .pw-explore-img {
    background-size: cover;
    background-position: center;
    position: relative;
    overflow: hidden;
  }
  .pw-explore-img::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(4,18,31,0.55), rgba(26,10,48,0.5));
  }
  .pw-explore-img-left { background-image: var(--pw-explore-left); }
  .pw-explore-img-right { background-image: var(--pw-explore-right); }

  .pw-explore-center {
    padding: 36px 40px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 24px;
    align-items: center;
    position: relative;
    z-index: 1;
  }
  .pw-explore-cta {
    grid-column: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pw-explore-eyebrow {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    font-weight: 600;
  }
  .pw-explore-heading {
    font-family: var(--foc-font-display);
    font-size: 26px;
    font-weight: 900;
    color: var(--foc-color-text-inverse);
    line-height: 1.1;
  }
  .pw-explore-heading span { color: var(--pw-cyan); display: block; }
  .pw-explore-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .pw-explore-item-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pw-explore-item-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    background: var(--item-color, var(--foc-purple-dark));
    opacity: 0.9;
  }
  .pw-explore-item-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--item-color, var(--foc-purple-dark));
    font-weight: 700;
  }
  .pw-explore-item-title {
    font-family: var(--foc-font-display);
    font-size: 14px;
    font-weight: 800;
    color: var(--foc-color-text-inverse);
    line-height: 1.2;
  }
  .pw-explore-item-desc {
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    line-height: 1.6;
  }
  .pw-explore-item-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    border: 2px solid var(--item-color, var(--pw-purple));
    color: var(--item-color, var(--pw-purple));
    background: transparent;
    transition: background 0.15s, color 0.15s;
    width: fit-content;
    text-decoration: none;
    font-family: var(--foc-font-sans);
  }
  .pw-explore-item-btn:hover {
    background: var(--item-color, var(--pw-purple));
    color: var(--foc-color-text-inverse);
  }

  .pw-footer-bar {
    background: #04121f;
    padding: 20px 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(255,255,255,0.06);
    flex-wrap: wrap;
    gap: 20px;
  }
  .pw-footer-stats {
    display: flex;
    gap: 36px;
    align-items: center;
    flex-wrap: wrap;
  }
  .pw-footer-stat {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .pw-footer-stat-icon { font-size: 18px; line-height: 1; }
  .pw-footer-stat-num {
    font-family: var(--foc-font-display);
    font-size: 16px;
    font-weight: 800;
    color: var(--foc-color-text-inverse);
  }
  .pw-footer-stat-label {
    font-size: 10px;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .pw-footer-cta-block {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .pw-footer-cta-text {
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.4;
    text-align: right;
  }
  .pw-footer-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 28px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--pw-purple), var(--pw-indigo));
    color: var(--foc-color-text-inverse);
    font-family: var(--foc-font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
    border: none;
    white-space: nowrap;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.45);
  }
  .pw-footer-cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(124, 58, 237, 0.55);
    color: var(--foc-color-text-inverse);
  }

  @media (max-width: 1100px) {
    .pw-eco-grid { grid-template-columns: repeat(3, 1fr); }
    .pw-hero-icons { display: none; }
  }
  @media (max-width: 900px) {
    .pw-hero-inner { grid-template-columns: 1fr; }
    .pw-hero-right { display: none; }
    .pw-eco-grid { grid-template-columns: repeat(2, 1fr); }
    .pw-explore { grid-template-columns: 1fr; }
    .pw-explore-img-left, .pw-explore-img-right { display: none; }
    .pw-explore-center { grid-template-columns: 1fr 1fr; }
    .pw-footer-stats { gap: 16px; }
    .pw-footer-bar { flex-direction: column; }
    .pw-footer-cta-text { text-align: center; }
  }
  @media (max-width: 600px) {
    .pw-eco-grid { grid-template-columns: 1fr; }
    .pw-explore-center { grid-template-columns: 1fr; }
    .pw-pills-bar { padding: 10px 20px; }
    .pw-hero-left { padding: 32px 20px 24px; }
    .pw-stats-row { grid-template-columns: 1fr; max-width: none; }
  }

  /* Inside partners block — edge-to-edge, no extra gap */
  .fp .pw { margin: 0; border-radius: 0; }
`;

const IMG = "/Assets/public_assets/images/homepage";

const ecoCards = [
  {
    icon: "🎓",
    iconBg: "#ede9fe",
    accent: "#7c3aed",
    title: "Schools & Colleges",
    desc: "Build future-ready campuses with technology labs, innovation programs, experiential learning and student engagement.",
    btn: "Partner With Us",
    footer: "End-to-end Implementation",
    footerIcon: "⚙️",
    cta: "partner",
  },
  {
    icon: "🏛️",
    iconBg: "#dbeafe",
    accent: "#1565c0",
    title: "Government & Institutions",
    desc: "Scale sustainable programs in skilling, entrepreneurship, MSME, livelihood and technology-driven community development.",
    btn: "Explore Collaboration",
    footer: "Pan-India Scalable Model",
    footerIcon: "🗺️",
    cta: "partner",
  },
  {
    icon: "🤝",
    iconBg: "#dcfce7",
    accent: "#16a34a",
    title: "CSR & Foundations",
    desc: "Create meaningful social impact in education, employability, innovation, women empowerment and future-ready initiatives.",
    btn: "Start CSR Partnership",
    footer: "Expertise in Future Technologies",
    footerIcon: "🔬",
    cta: "partner",
  },
  {
    icon: "🏭",
    iconBg: "#fff3e0",
    accent: "#ea580c",
    title: "Industries & MSMEs",
    desc: "Accelerate Industry 4.0 transformation with automation, workforce upskilling, IoT solutions and smart manufacturing.",
    btn: "Schedule Consultation",
    footer: "Strong Govt, Industry & Academic Network",
    footerIcon: "🌐",
    cta: "partner",
  },
  {
    icon: "💡",
    iconBg: "#f5f3ff",
    accent: "#6d28d9",
    title: "Technology & Innovation Partners",
    desc: "Collaborate for emerging technologies, research initiatives, innovation ecosystems and future workforce transformation.",
    btn: "Connect With Us",
    footer: "Outcome-driven Programs",
    footerIcon: "📊",
    cta: "partner",
  },
  {
    icon: "💼",
    iconBg: "#fce7f3",
    accent: "#db2777",
    title: "Employers & Hiring Partners",
    desc: "Hire skilled and future-ready talent across domains. Post jobs, connect with our talent pool and build your future workforce.",
    btn: "Post a Job",
    footer: "Flexible Partnership Models",
    footerIcon: "🤜",
    cta: "jobs",
  },
];

const exploreItems = [
  {
    icon: "📅",
    color: "#ea580c",
    label: "Explore Events",
    title: "Events & Workshops",
    desc: "Join workshops, competitions, hackathons, bootcamps, school events and more.",
    btn: "Explore Events",
    to: "/events",
  },
  {
    icon: "📘",
    color: "#1ba7ff",
    label: "Explore Courses",
    title: "Future-Ready Courses",
    desc: "Discover future-ready courses in AI, Robotics, IoT, STEM, Employability and more.",
    btn: "Explore Courses",
    to: "/courses",
  },
  {
    icon: "🧳",
    color: "#16a34a",
    label: "Explore Jobs",
    title: "Jobs & Internships",
    desc: "Find internships, apprenticeships and job opportunities across industries.",
    btn: "Explore Jobs",
    to: "/joblisting",
  },
];

const heroStats = [
  { icon: "👥", num: "10,000+", label: "Students Impacted" },
  { icon: "🏛️", num: "250+", label: "Partners" },
  { icon: "📍", num: "15+", label: "States Reached" },
  { icon: "🚀", num: "1000+", label: "Projects Delivered" },
];

const footerStats = [
  { icon: "👥", num: "10,000+", label: "Students Impacted" },
  { icon: "🤝", num: "250+", label: "Partners" },
  { icon: "📍", num: "15+", label: "States Reached" },
  { icon: "🚀", num: "1000+", label: "Projects Delivered" },
  { icon: "🔬", num: "50+", label: "Future Tech Labs" },
  { icon: "🏢", num: "500+", label: "Hiring Partners" },
];

function EcoCta({ card }) {
  if (card.cta === "jobs") {
    return (
      <Link to="/joblisting" className="pw-eco-btn">
        {card.btn} →
      </Link>
    );
  }
  return (
    <button type="button" className="pw-eco-btn" data-bs-toggle="modal" data-bs-target="#partnerModal">
      {card.btn} →
    </button>
  );
}

export default function PartnerWithFocalytSection() {
  return (
    <section className="pw" id="partner-with-focalyt" aria-label="Partner with Focalyt">
      <style>{STYLES}</style>

      <div className="pw-hero">
        <div className="pw-hero-inner">
          <div className="pw-hero-left">
            <div className="pw-hero-eyebrow">Partner with Focalyt</div>
            <h2 className="pw-hero-h1">
              <span className="pw-hero-h1-muted">Let&apos;s Build The</span>
              <span className="pw-hero-h1-accent">Future</span>
              <span className="pw-hero-h1-muted">Together</span>
            </h2>
            <div className="pw-hero-tagline">Empowering Skills. Driving Innovation. Creating Impact.</div>
            <p className="pw-hero-desc">
              We partner with institutions, industries, organizations and communities to build future-ready
              ecosystems that create skills, innovation, employability, entrepreneurship and sustainable impact.
            </p>
            <div className="pw-stats-row">
              {heroStats.map((s) => (
                <div className="pw-stat" key={s.label}>
                  <span className="pw-stat-icon" aria-hidden>{s.icon}</span>
                  <div>
                    <div className="pw-stat-num">{s.num}</div>
                    <div className="pw-stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pw-hero-right">
            <div className="pw-hero-icons" aria-hidden>
              {[
                { icon: "🎓", label: "Skills" },
                { icon: "💡", label: "Innovation", active: true },
                { icon: "⚙️", label: "Technology" },
                { icon: "🎯", label: "Impact" },
              ].map((item) => (
                <div className="pw-hero-icon-item" key={item.label}>
                  <div className={`pw-hero-icon-circle ${item.active ? "active" : ""}`}>{item.icon}</div>
                  <span className="pw-hero-icon-label">{item.label}</span>
                </div>
              ))}
            </div>

            <div
              className="pw-hero-img pw-hero-img-main"
              style={{ backgroundImage: `url(${IMG}/iot.jpg)` }}
              role="img"
              aria-label="Future technology lab"
            />
            <div
              className="pw-hero-img pw-hero-img-sub"
              style={{ backgroundImage: `url(${IMG}/fftl_lab.jpg)` }}
              role="img"
              aria-label="FFTL lab"
            />
            <div
              className="pw-hero-img pw-hero-img-sub"
              style={{ backgroundImage: `url(${IMG}/esdm1.jpg)` }}
              role="img"
              aria-label="ESDM training"
            />
          </div>
        </div>

        <div className="pw-pills-bar">
          {[
            { icon: "⚙️", label: "Future Technologies" },
            { icon: "💡", label: "Experiential Learning" },
            { icon: "🏭", label: "Industry Connect" },
            { icon: "❤️", label: "Outcome Driven" },
          ].map((p) => (
            <div className="pw-pill" key={p.label}>
              <span className="pw-pill-icon" aria-hidden>{p.icon}</span>
              {p.label}
            </div>
          ))}
        </div>
      </div>

      <div className="pw-section-label">
        <div className="pw-section-title">— Partner Across Ecosystems —</div>
      </div>

      <div className="pw-ecosystem">
        <div className="pw-eco-grid">
          {ecoCards.map((card) => (
            <div
              className="pw-eco-card"
              key={card.title}
              style={{ "--card-accent": card.accent, "--card-icon-bg": card.iconBg }}
            >
              <div className="pw-eco-icon">{card.icon}</div>
              <div className="pw-eco-title">{card.title}</div>
              <p className="pw-eco-desc">{card.desc}</p>
              <EcoCta card={card} />
              <div className="pw-eco-footer">
                <span className="pw-eco-footer-icon" aria-hidden>{card.footerIcon}</span>
                {card.footer}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="pw-explore"
        style={{
          "--pw-explore-left": `url(${IMG}/Faculty.jpeg)`,
          "--pw-explore-right": `url(${IMG}/sic-main.jpg)`,
        }}
      >
        <div className="pw-explore-img pw-explore-img-left" role="img" aria-label="Learning and skills" />
        <div className="pw-explore-center">
          <div className="pw-explore-cta">
            <div className="pw-explore-eyebrow">Explore Opportunities</div>
            <div className="pw-explore-heading">
              Learn.
              <span>Participate.</span>
              Get Hired.
            </div>
          </div>

          {exploreItems.map((item) => (
            <div className="pw-explore-item" key={item.title} style={{ "--item-color": item.color }}>
              <div className="pw-explore-item-header">
                <div className="pw-explore-item-icon">{item.icon}</div>
                <div className="pw-explore-item-label">{item.label}</div>
              </div>
              <div className="pw-explore-item-title">{item.title}</div>
              <div className="pw-explore-item-desc">{item.desc}</div>
              <Link to={item.to} className="pw-explore-item-btn">
                {item.btn} →
              </Link>
            </div>
          ))}
        </div>
        <div className="pw-explore-img pw-explore-img-right" role="img" aria-label="Students and innovation" />
      </div>

      <div className="pw-footer-bar">
        <div className="pw-footer-stats">
          {footerStats.map((s) => (
            <div className="pw-footer-stat" key={s.label}>
              <span className="pw-footer-stat-icon" aria-hidden>{s.icon}</span>
              <div>
                <div className="pw-footer-stat-num">{s.num}</div>
                <div className="pw-footer-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        {/* <div className="pw-footer-cta-block">
          <div className="pw-footer-cta-text">
            Join us in building a future
            <br />
            that is smarter, skilled
            <br />
            and sustainable.
          </div>
          <button type="button" className="pw-footer-cta-btn" data-bs-toggle="modal" data-bs-target="#partnerModal">
            Let&apos;s Connect →
          </button>
        </div> */}
      </div>
    </section>
  );
}
