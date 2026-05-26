import { useState, useEffect, useMemo } from "react";

const STYLES = `
    .fp, .fp *, .fp *::before, .fp *::after { box-sizing: border-box; }

  .fp {
    --gov: var(--foc-green-dark);
    --csr: var(--foc-blue);
    --acad: var(--foc-purple-dark);
    --ind: var(--foc-orange);
    --navy: var(--foc-navy-deep);
    --cream: var(--foc-color-bg-section);
    font-family: var(--foc-font-sans);
    background: var(--foc-color-surface);
    overflow-x: hidden;
    overflow: hidden;
    position: relative;
    z-index: 1;
    max-width: var(--foc-container-max-xl);
    margin: 40px auto 48px;
    border-radius: var(--foc-radius-xl);
    border: 1px solid var(--foc-color-border-light);
    box-shadow: var(--foc-shadow-card);
  }

  .fp-sub {
    position: relative;
    overflow: hidden;
    padding: 15px 0;
  }

  .fp-sub--media {
    border-top: 1px solid var(--foc-color-border-light);
    padding-top: 15px;
    padding-bottom: 56px;
  }

  @media (max-width: 768px) {
    .fp {
      margin: 24px 16px 32px;
      border-radius: 16px;
    }
    .fp-sub, .fp-sub--media {
      padding-top: 40px;
      padding-bottom: 40px;
    }
  }

  .fp .pulse { animation: fpPulse 2.2s ease-in-out infinite; }
  @keyframes fpPulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.09); }
  }

  .fp .float { animation: fpFloat 3.2s ease-in-out infinite; }
  @keyframes fpFloat {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-9px); }
  }

  .fp .spin-slow { animation: fpSpin 22s linear infinite; }
  @keyframes fpSpin { to { transform: rotate(360deg); } }

  .fp .fade-up {
    opacity: 0;
    transform: translateY(28px);
    animation: fpFadeUp 0.65s ease forwards;
  }
  @keyframes fpFadeUp {
    to { opacity: 1; transform: translateY(0); }
  }

  .fp .partner-card {
    transition: transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s ease;
  }
  .fp .partner-card:hover {
    transform: translateY(-12px) scale(1.025);
    box-shadow: 0 28px 60px rgba(13,33,70,0.17) !important;
  }

  .fp .logo-chip {
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    cursor: pointer;
  }
  .fp .logo-chip:hover {
    transform: scale(1.1) rotate(-2deg);
    box-shadow: 0 6px 22px rgba(0,0,0,0.16) !important;
  }

  .fp .tab-btn { transition: all 0.25s ease; cursor: pointer; border: none; }
  .fp .tab-btn:hover { transform: translateY(-3px); }

  .fp .media-card {
    transition: transform 0.38s cubic-bezier(.34,1.56,.64,1), box-shadow 0.38s ease;
    cursor: pointer;
  }
  .fp .media-card:hover {
    transform: translateY(-14px) scale(1.03);
    box-shadow: 0 30px 64px rgba(13,33,70,0.24) !important;
  }

  .fp .stat-chip { transition: transform 0.3s ease; cursor: default; }
  .fp .stat-chip:hover { transform: scale(1.06); }

  .fp .view-btn { cursor: pointer; transition: all 0.2s ease; }
  .fp .view-btn:hover { opacity: 0.8; letter-spacing: 0.3px; }

  .fp .arrow-btn { cursor: pointer; transition: all 0.22s ease; }
  .fp .arrow-btn:hover {
    background: var(--navy) !important;
    color: var(--foc-color-text-inverse) !important;
    border-color: var(--navy) !important;
    transform: scale(1.12);
  }

  .fp .become-btn {
    cursor: pointer;
    transition: all 0.28s ease;
    text-decoration: none;
  }
  .fp .become-btn:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 36px rgba(26,122,74,0.42) !important;
  }

  .fp .partner-cards-grid {
    display: grid;
    gap: 22px;
    margin-top: 44px;
    padding: 0 4px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (max-width: 1199px) {
    .fp .partner-cards-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 599px) {
    .fp .partner-cards-grid {
      grid-template-columns: 1fr;
      max-width: 340px;
      margin-left: auto;
      margin-right: auto;
    }
  }

  @media (min-width: 1200px) {
    .fp .partner-cards-grid .logo-chip {
      min-width: 0;
      flex: 1;
      padding: 7px 6px;
    }
    .fp .partner-cards-grid .logo-chip > div:first-child {
      font-size: 18px;
    }
    .fp .partner-cards-grid .logo-chip > div:last-child {
      font-size: 9px;
    }
  }
`;

const PARTNER_CATS = [
  {
    id: "gov",
    color: "var(--foc-green-dark)",
    bg: "linear-gradient(135deg,var(--foc-partner-green-bg),var(--foc-partner-green-end))",
    iconBg: "linear-gradient(135deg,var(--foc-green-dark),var(--foc-green-hover))",
    emoji: "🏛️",
    title: "Government Partners",
    desc: "Working with government bodies and public institutions to empower communities and build a skilled nation.",
    logos: [
      [
        { label: "Skill India", color: "#1a5276", emoji: "🎯" },
        { label: "NSDC", color: "#c0392b", emoji: "🌐" },
        { label: "PMKVY", color: "var(--foc-green-dark)", emoji: "📋" },
      ],
      [
        { label: "NIELIT", color: "#2980b9", emoji: "💻" },
        { label: "MSDE", color: "#7d3c98", emoji: "📚" },
        { label: "NITI Aayog", color: "#e67e22", emoji: "🔮" },
      ],
    ],
  },
  {
    id: "csr",
    color: "var(--foc-blue)",
    bg: "linear-gradient(135deg,var(--foc-partner-blue-bg),var(--foc-partner-blue-end))",
    iconBg: "linear-gradient(135deg,var(--foc-blue),var(--foc-blue-bright))",
    emoji: "💙",
    title: "CSR Partners",
    desc: "Partnering with corporates through CSR initiatives to create sustainable social impact and inclusive growth.",
    logos: [
      [
        { label: "TATA Power", color: "#1a1a2e", emoji: "⚡" },
        { label: "TCS", color: "var(--foc-blue)", emoji: "🖥️" },
        { label: "Wipro", color: "#4caf50", emoji: "🌿" },
      ],
      [
        { label: "Infosys", color: "#007cc3", emoji: "🔷" },
        { label: "HCL", color: "#c0392b", emoji: "🚀" },
        { label: "Tech Mahindra", color: "#d4273a", emoji: "⚙️" },
      ],
    ],
  },
  {
    id: "acad",
    color: "var(--foc-purple-dark)",
    bg: "linear-gradient(135deg,var(--foc-partner-purple-bg),var(--foc-partner-purple-end))",
    iconBg: "linear-gradient(135deg,var(--foc-purple-dark),var(--foc-purple-bright))",
    emoji: "🎓",
    title: "Academic Partners",
    desc: "Collaborating with schools, colleges, universities and training institutions to promote future-ready education.",
    logos: [
      [
        { label: "IIT Kanpur", color: "#1a3a6b", emoji: "🔬" },
        { label: "Amity Univ", color: "#c0392b", emoji: "🏫" },
        { label: "CU", color: "#8e1a1a", emoji: "🎯" },
      ],
      [
        { label: "BITS Pilani", color: "#1a5276", emoji: "⚗️" },
        { label: "IGNOU", color: "#2e7d4f", emoji: "📖" },
        { label: "NIFT", color: "var(--foc-purple-dark)", emoji: "🎨" },
      ],
    ],
  },
  {
    id: "ind",
    color: "var(--foc-orange)",
    bg: "linear-gradient(135deg,var(--foc-partner-orange-bg),var(--foc-partner-orange-end))",
    iconBg: "linear-gradient(135deg,var(--foc-orange),var(--foc-orange-bright))",
    emoji: "🏭",
    title: "Industry Partners",
    desc: "Working with leading industries and organizations to bridge the gap between skills and industry needs.",
    logos: [
      [
        { label: "Siemens", color: "#009999", emoji: "⚙️" },
        { label: "Bosch", color: "#c0392b", emoji: "🔧" },
        { label: "Infosys", color: "#007cc3", emoji: "💡" },
      ],
      [
        { label: "L&T", color: "#1a5276", emoji: "🏗️" },
        { label: "ABB", color: "#c0392b", emoji: "🔌" },
        { label: "Honeywell", color: "var(--foc-orange)", emoji: "🌡️" },
      ],
    ],
  },
];

const MEDIA_TABS = [
  { id: "social", label: "Social Media", emoji: "📱" },
  { id: "awards", label: "Awards & Recognitions", emoji: "🏆" },
  { id: "print", label: "Print Media Coverage", emoji: "📰" },
  { id: "events", label: "Events & Engagement", emoji: "📅" },
];

const MEDIA_CARDS = [
  { tab: "social", title: "Skill Training in Action", desc: "Hands-on training for a future ready workforce.", emoji: "📱", tag: "Social Media", accent: "var(--foc-green-dark)", img: "🧑‍💻" },
  { tab: "social", title: "Placement Success", desc: "Connecting talent with meaningful opportunities.", emoji: "🤝", tag: "Placement Drive", accent: "var(--foc-blue)", img: "👩‍🎓" },
  { tab: "social", title: "Digital Campaigns", desc: "Amplifying reach through targeted social campaigns.", emoji: "📣", tag: "Digital", accent: "var(--foc-blue)", img: "📣" },
  { tab: "social", title: "Youth Outreach", desc: "Inspiring young learners through stories and live updates.", emoji: "🌟", tag: "Instagram", accent: "var(--foc-purple-dark)", img: "📸" },
  { tab: "awards", title: "Award of Excellence", desc: "Recognized for impact, innovation and excellence.", emoji: "🥇", tag: "Award 2024", accent: "var(--foc-orange)", img: "🏆" },
  { tab: "awards", title: "National Skill Honor", desc: "Celebrated for transformative skilling outcomes at scale.", emoji: "🏅", tag: "National Award", accent: "var(--foc-green-dark)", img: "🎖️" },
  { tab: "awards", title: "CSR Impact Recognition", desc: "Honored for measurable CSR and community impact.", emoji: "⭐", tag: "CSR Award", accent: "var(--foc-blue)", img: "✨" },
  { tab: "awards", title: "Innovation in EdTech", desc: "Awarded for technology-led learning and employability.", emoji: "💡", tag: "EdTech 2024", accent: "var(--foc-purple-dark)", img: "🔬" },
  { tab: "print", title: "In the News", desc: "Our initiatives featured across leading publications.", emoji: "📰", tag: "Print Media", accent: "var(--foc-purple-dark)", img: "📄" },
  { tab: "print", title: "Leading Daily Feature", desc: "Coverage in top newspapers on skills and employment.", emoji: "🗞️", tag: "National Daily", accent: "var(--foc-blue)", img: "📰" },
  { tab: "print", title: "Industry Journal", desc: "Thought leadership on workforce development.", emoji: "📑", tag: "Industry Press", accent: "var(--foc-orange)", img: "📋" },
  { tab: "print", title: "Regional Spotlight", desc: "Local media highlighting grassroots training impact.", emoji: "🌍", tag: "Regional Press", accent: "var(--foc-green-dark)", img: "🗞️" },
  { tab: "events", title: "Community Events", desc: "Engaging communities through nationwide skill drives.", emoji: "🌍", tag: "Events", accent: "var(--foc-green-dark)", img: "🎪" },
  { tab: "events", title: "Partner Engagement Summit", desc: "Collaborating with partners to scale impact together.", emoji: "🤝", tag: "Summit", accent: "var(--foc-blue)", img: "🎤" },
  { tab: "events", title: "Nationwide Skill Drive", desc: "Mobilizing trainers and learners across multiple states.", emoji: "🚌", tag: "Skill Drive", accent: "var(--foc-orange)", img: "🛣️" },
  { tab: "events", title: "Campus Connect Program", desc: "On-ground engagement with colleges and institutions.", emoji: "🎓", tag: "Campus Event", accent: "var(--foc-purple-dark)", img: "🏫" },
];

const MEDIA_STATS = [
  { emoji: "👥", value: "1M+", label: "People Reached", color: "var(--foc-green-dark)", bg: "var(--foc-partner-green-bg)" },
  { emoji: "📣", value: "500+", label: "Media Mentions", color: "var(--foc-blue)", bg: "var(--foc-partner-blue-bg)" },
  { emoji: "🏆", value: "25+", label: "Awards Received", color: "var(--foc-purple-dark)", bg: "var(--foc-partner-purple-bg)" },
  { emoji: "📰", value: "100+", label: "News Features", color: "var(--foc-orange)", bg: "var(--foc-partner-orange-bg)" },
  { emoji: "📅", value: "200+", label: "Events & Campaigns", color: "var(--foc-green-dark)", bg: "var(--foc-partner-green-bg)" },
];

function Blobs({ colors }) {
  const positions = [
    { top: "-8%", left: "-4%", size: 340 },
    { top: "55%", left: "82%", size: 280 },
    { top: "30%", left: "48%", size: 200 },
    { top: "75%", left: "5%", size: 260 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {colors.map((c, i) => (
        <div
          key={c}
          style={{
            position: "absolute",
            width: positions[i % 4].size,
            height: positions[i % 4].size,
            borderRadius: "50%",
            background: c,
            opacity: 0.06,
            top: positions[i % 4].top,
            left: positions[i % 4].left,
            filter: "blur(72px)",
          }}
        />
      ))}
    </div>
  );
}

function SectionHeader({ icon, titleHtml, subtitle, accentColor = "var(--foc-green-dark)", noSubtitleMaxWidth = false }) {
  return (
    <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <div
          style={{
            flex: 1,
            maxWidth: 90,
            height: 2,
            background: `linear-gradient(to right, transparent, ${accentColor})`,
            borderRadius: 2,
          }}
        />
        <div
          className="pulse"
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 27,
            boxShadow: `0 10px 32px ${accentColor}55`,
          }}
        >
          {icon}
        </div>
        <div
          style={{
            flex: 1,
            maxWidth: 90,
            height: 2,
            background: `linear-gradient(to left, transparent, ${accentColor})`,
            borderRadius: 2,
          }}
        />
      </div>
      <h2
        style={{
          fontFamily: 'var(--foc-font-display)',
          fontWeight: 800,
          fontSize: "clamp(28px,4.5vw,52px)",
          lineHeight: 1.1,
          color: "var(--foc-navy-deep)",
          marginBottom: 14,
        }}
        dangerouslySetInnerHTML={{ __html: titleHtml }}
      />
      <p
        style={{
          fontFamily: 'var(--foc-font-sans)',
          color: "var(--foc-text-caption-alt)",
          fontSize: "clamp(13px,1.5vw,16.5px)",
          lineHeight: 1.75,
          margin: "0 auto",
          ...(noSubtitleMaxWidth ? {} : { maxWidth: 580 }),
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function LogoChip({ logo }) {
  return (
    <div
      className="logo-chip"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--foc-color-surface)",
        borderRadius: 14,
        padding: "9px 13px",
        border: `1.5px solid ${logo.color}28`,
        boxShadow: `0 3px 14px ${logo.color}1a`,
        minWidth: 76,
        gap: 5,
      }}
    >
      <div style={{ fontSize: 21 }}>{logo.emoji}</div>
      <div style={{ fontWeight: 800, fontSize: 10.5, color: logo.color, textAlign: "center", letterSpacing: 0.3 }}>{logo.label}</div>
    </div>
  );
}

function PartnerCard({ cat, delay = 0 }) {
  const [slide, setSlide] = useState(0);
  const total = cat.logos.length;

  return (
    <div
      className="partner-card fade-up"
      style={{
        animationDelay: `${delay}ms`,
        width: "100%",
        background: "var(--foc-color-surface)",
        borderRadius: 24,
        border: `2px solid ${cat.color}1a`,
        boxShadow: `0 8px 40px ${cat.color}12`,
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div
        style={{
          height: 5,
          borderRadius: "22px 22px 0 0",
          background: `linear-gradient(90deg, ${cat.color}, ${cat.color}77)`,
        }}
      />
      <div style={{ padding: "22px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
        <div
          className="float"
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: cat.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            marginBottom: 14,
            boxShadow: `0 10px 32px ${cat.color}44`,
          }}
        >
          {cat.emoji}
        </div>
        <div style={{ fontFamily: 'var(--foc-font-display)', fontWeight: 800, fontSize: 17.5, color: cat.color, marginBottom: 6, textAlign: "center" }}>
          {cat.title}
        </div>
        <p style={{ fontFamily: 'var(--foc-font-sans)', fontSize: 13, color: "var(--foc-text-caption-alt)", textAlign: "center", lineHeight: 1.65, marginBottom: 18, flex: 1 }}>{cat.desc}</p>
        <div style={{ width: "100%", borderRadius: 16, background: cat.bg, padding: "14px 12px 10px", position: "relative", marginBottom: 16 }}>
          <button
            type="button"
            className="arrow-btn"
            aria-label="Previous partners"
            onClick={() => setSlide((s) => (s - 1 + total) % total)}
            style={{
              position: "absolute",
              left: -14,
              top: "50%",
              transform: "translateY(-50%)",
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: `2px solid ${cat.color}44`,
              background: "var(--foc-color-surface)",
              color: cat.color,
              fontSize: 15,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 3px 12px ${cat.color}22`,
              zIndex: 3,
            }}
          >
            ‹
          </button>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, width: "100%" }}>
            {cat.logos[slide].map((logo) => (
              <LogoChip key={logo.label} logo={logo} />
            ))}
          </div>
          <button
            type="button"
            className="arrow-btn"
            aria-label="Next partners"
            onClick={() => setSlide((s) => (s + 1) % total)}
            style={{
              position: "absolute",
              right: -14,
              top: "50%",
              transform: "translateY(-50%)",
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: `2px solid ${cat.color}44`,
              background: "var(--foc-color-surface)",
              color: cat.color,
              fontSize: 15,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 3px 12px ${cat.color}22`,
              zIndex: 3,
            }}
          >
            ›
          </button>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
            {Array.from({ length: total }).map((_, i) => (
              <button
                type="button"
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setSlide(i)}
                style={{
                  width: i === slide ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === slide ? cat.color : `${cat.color}44`,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  border: "none",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
        <div className="view-btn" style={{ display: "flex", alignItems: "center", gap: 8, color: cat.color, fontWeight: 800, fontSize: 14 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: `${cat.color}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            {cat.emoji}
          </span>
          View All Partners
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: cat.color,
              color: "var(--foc-color-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            →
          </span>
        </div>
      </div>
    </div>
  );
}

function PartnersStrengthSection() {
  const stats = [
    { emoji: "🤝", value: "150+", label: "Partners", sub: "Across Sectors", color: "var(--foc-green-dark)", bg: "var(--foc-partner-green-bg)" },
    { emoji: "🌐", value: "25+", label: "States", sub: "Nationwide", color: "var(--foc-blue)", bg: "var(--foc-partner-blue-bg)" },
    { emoji: "🎯", value: "Millions", label: "Lives Impacted", sub: "Through Partnerships", color: "var(--foc-purple-dark)", bg: "var(--foc-partner-purple-bg)" },
    { emoji: "⭐", value: "Shared Vision", label: "Sustainable Growth", sub: "Inclusive Future", color: "var(--foc-orange)", bg: "var(--foc-partner-orange-bg)" },
  ];

  return (
    <section id="partners" className="fp-sub" style={{ background: "var(--foc-color-surface)", position: "relative" }}>
      <Blobs colors={["var(--foc-green-dark)", "var(--foc-blue)", "var(--foc-purple-dark)", "var(--foc-orange)"]} />
      <div
        className="spin-slow"
        style={{
          position: "absolute",
          top: -70,
          right: -70,
          width: 260,
          height: 260,
          borderRadius: "50%",
          border: "2.5px dashed var(--foc-green-dark)33",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        className="spin-slow"
        style={{
          position: "absolute",
          bottom: 60,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          border: "2px dashed var(--foc-blue)33",
          pointerEvents: "none",
          zIndex: 0,
          animationDirection: "reverse",
        }}
      />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1 }}>
        <SectionHeader
          icon="🤝"
          titleHtml={`<span style="color:var(--foc-navy-deep)">Our Partners.</span> <span style="color:var(--foc-green-dark)">Our Strength.</span>`}
          subtitle="Collaborating with government, corporates, academia and industry to build skills, create opportunities and drive meaningful impact."
          accentColor="var(--foc-green-dark)"
          noSubtitleMaxWidth
        />
        <div className="partner-cards-grid">
          {PARTNER_CATS.map((cat, i) => (
            <PartnerCard key={cat.id} cat={cat} delay={i * 110} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0,
            marginTop: 44,
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 16px 60px rgba(13,33,70,0.13)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg,var(--foc-navy-deep),var(--foc-navy-badge))",
              padding: "28px 28px",
              flex: "0 0 285px",
              minWidth: 240,
              display: "flex",
              gap: 18,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                flexShrink: 0,
              }}
            >
              🤝
            </div>
            <div>
              <div style={{ color: "var(--foc-color-surface)", fontFamily: 'var(--foc-font-display)', fontWeight: 800, fontSize: 18, lineHeight: 1.3 }}>Stronger Together,</div>
              <div style={{ color: "var(--foc-success-bright)", fontFamily: 'var(--foc-font-display)', fontWeight: 800, fontSize: 18 }}>Greater Impact.</div>
              <p style={{ fontFamily: 'var(--foc-font-sans)', color: "var(--foc-sky-caption)", fontSize: 12.5, marginTop: 8, lineHeight: 1.6 }}>
                Our partners drive innovation, create opportunities and transform lives across communities.
              </p>
            </div>
          </div>
          {stats.map((s) => (
            <div
              className="stat-chip"
              key={s.label}
              style={{
                flex: "1 1 150px",
                background: "var(--foc-color-surface)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "22px 18px",
                borderLeft: "1.5px solid var(--foc-border-ui-alt)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 21,
                  flexShrink: 0,
                }}
              >
                {s.emoji}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--foc-font-display)', fontWeight: 800, fontSize: 17.5, color: s.color }}>{s.value}</div>
                <div style={{ fontWeight: 700, fontSize: 12, color: "var(--foc-navy-deep)" }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "var(--foc-gray-muted)" }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// function OurPartnersSection() {
//   return (
//     <section id="partners" style={{ background: "var(--foc-color-surface)", padding: "72px 0 0", position: "relative", overflow: "hidden" }}>
//       <Blobs colors={["var(--foc-blue)", "var(--foc-green-dark)", "var(--foc-orange)", "var(--foc-purple-dark)"]} />
//       {/* <div
//         style={{
//           position: "absolute",
//           top: 0,
//           left: 0,
//           right: 0,
//           height: 5,
//           background: "linear-gradient(90deg,var(--foc-green-dark),var(--foc-blue),var(--foc-purple-dark),var(--foc-orange))",
//         }}
//       /> */}
//       {/* <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1 }}>
//         <SectionHeader
//           icon="🤝"
//           titleHtml={`<span style="color:var(--foc-navy-deep)">Our </span><span style="color:var(--foc-green-dark)">Partners</span>`}
//           subtitle="Collaborating with government, corporates, academia and industry to build skills, create opportunities and drive meaningful impact."
//           accentColor="var(--foc-green-dark)"
//         />
//         <div className="partner-cards-grid">
//           {PARTNER_CATS.map((cat, i) => (
//             <PartnerCard key={`${cat.id}-cta`} cat={cat} delay={i * 110} />
//           ))}
//         </div>
//         <div
//           style={{
//             marginTop: 44,
//             borderRadius: 24,
//             background: "linear-gradient(135deg,#f0f8f4,#e8f4ff)",
//             border: "2px solid #d8edf8",
//             padding: "28px 32px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             flexWrap: "wrap",
//             gap: 22,
//             boxShadow: "0 8px 40px rgba(21,101,192,0.07)",
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
//             <div
//               style={{
//                 width: 60,
//                 height: 60,
//                 borderRadius: "50%",
//                 background: "linear-gradient(135deg,var(--foc-partner-green-bg),#c8efda)",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: 28,
//                 boxShadow: "0 6px 22px rgba(26,122,74,0.2)",
//               }}
//             >
//               👥
//             </div>
//             <div>
//               <div style={{ fontFamily: 'var(--foc-font-display)', fontWeight: 800, fontSize: 20, color: "var(--foc-navy-deep)" }}>
//                 Stronger Together, <span style={{ color: "var(--foc-green-dark)" }}>Greater Impact</span>
//               </div>
//               <p style={{ color: "var(--foc-text-caption-alt)", fontSize: 13.5, marginTop: 4 }}>Our partners play a vital role in driving innovation and transforming lives.</p>
//             </div>
//           </div>
//           <Link
//             to="/contact"
//             className="become-btn"
//             style={{
//               background: "linear-gradient(135deg,var(--foc-green-dark),var(--foc-green-hover))",
//               color: "var(--foc-color-surface)",
//               border: "none",
//               borderRadius: 14,
//               padding: "15px 32px",
//               fontFamily: 'var(--foc-font-display)',
//               fontWeight: 800,
//               fontSize: 16,
//               display: "inline-flex",
//               alignItems: "center",
//               gap: 10,
//               boxShadow: "0 8px 26px rgba(26,122,74,0.3)",
//             }}
//           >
//             🤝 Become a Partner →
//           </Link>
//         </div>
//       </div> */}
//       {/* <div style={{ height: 52 }} /> */}
//     </section>
//   );
// }

function MediaCard({ card, delay = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="media-card fade-up"
      style={{
        animationDelay: `${delay}ms`,
        flex: "0 0 268px",
        borderRadius: 22,
        overflow: "hidden",
        background: "var(--foc-navy-deep)",
        boxShadow: "0 8px 40px rgba(13,33,70,0.18)",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div
        style={{
          height: 178,
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(145deg, var(--foc-navy-deep) 10%, ${card.accent}bb 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.09,
            backgroundImage: `radial-gradient(circle, ${card.accent} 1.5px, transparent 1.5px)`,
            backgroundSize: "20px 20px",
          }}
        />
        <div
          style={{
            fontSize: 74,
            zIndex: 1,
            filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.4))",
            transform: hov ? "scale(1.18) rotate(-8deg)" : "scale(1)",
            transition: "transform 0.4s cubic-bezier(.34,1.56,.64,1)",
          }}
        >
          {card.img}
        </div>
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 11,
            background: `${card.accent}ee`,
            backdropFilter: "blur(8px)",
            color: "var(--foc-color-surface)",
            fontSize: 10.5,
            fontWeight: 800,
            padding: "4px 12px",
            borderRadius: 20,
            letterSpacing: 0.4,
          }}
        >
          {card.tag}
        </div>
      </div>
      <div style={{ padding: "17px 19px 19px" }}>
        <div style={{ fontFamily: 'var(--foc-font-display)', fontWeight: 800, fontSize: 15.5, color: "var(--foc-color-surface)", marginBottom: 6 }}>{card.title}</div>
        <div style={{ fontFamily: 'var(--foc-font-sans)', color: "var(--foc-sky-caption-2)", fontSize: 12.5, lineHeight: 1.55 }}>{card.desc}</div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 7, color: card.accent, fontWeight: 700, fontSize: 12.5 }}>
          <span>{card.emoji}</span> Explore More
          <div
            style={{
              marginLeft: "auto",
              width: 27,
              height: 27,
              borderRadius: "50%",
              background: `${card.accent}33`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: card.accent,
            }}
          >
            →
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [offset, setOffset] = useState(0);
  const cardW = 268 + 20;
  const visible = 4;

  const activeTabId = MEDIA_TABS[activeTab]?.id ?? MEDIA_TABS[0].id;
  const filteredCards = useMemo(
    () => MEDIA_CARDS.filter((card) => card.tab === activeTabId),
    [activeTabId]
  );
  const maxOff = Math.max(0, filteredCards.length - visible);

  useEffect(() => {
    setOffset(0);
  }, [activeTabId]);

  useEffect(() => {
    if (offset > maxOff) setOffset(maxOff);
  }, [offset, maxOff]);

  const handleTabClick = (index) => {
    setActiveTab(index);
    setOffset(0);
  };

  return (
    <section id="media" className="fp-sub fp-sub--media" style={{ background: "var(--foc-color-surface)", position: "relative" }}>
      <Blobs colors={["var(--foc-navy-deep)", "var(--foc-blue)", "var(--foc-green-dark)", "var(--foc-purple-dark)"]} />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 1 }}>
        <SectionHeader
          icon="⭐"
          titleHtml={`<span style="color:var(--foc-navy-deep)">Media &amp; </span><span style="color:var(--foc-blue)">&nbsp; Recognition</span>`}
          subtitle="Celebrating our journey of impact, partnerships, and achievements across platforms and communities."
          accentColor="var(--foc-blue)"
          noSubtitleMaxWidth
        />
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginTop: 36 }}>
          {MEDIA_TABS.map((t, i) => (
            <button
              key={t.label}
              type="button"
              className="tab-btn"
              onClick={() => handleTabClick(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                borderRadius: 50,
                border: activeTab === i ? "2px solid var(--foc-navy-deep)" : "2px solid var(--foc-border-card)",
                background: activeTab === i ? "linear-gradient(135deg,var(--foc-navy-deep),var(--foc-navy-heading))" : "var(--foc-color-surface)",
                color: activeTab === i ? "var(--foc-color-surface)" : "var(--foc-gray-600)",
                fontFamily: 'var(--foc-font-sans)',
                fontWeight: 700,
                fontSize: 13.5,
                boxShadow: activeTab === i ? "0 6px 22px rgba(13,33,70,0.22)" : "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", marginTop: 30, paddingBottom: 4 }}>
          <button
            type="button"
            className="arrow-btn"
            aria-label="Scroll media left"
            onClick={() => setOffset(Math.max(0, offset - 1))}
            disabled={offset === 0}
            style={{
              position: "absolute",
              left: -22,
              top: "42%",
              transform: "translateY(-50%)",
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "2px solid var(--foc-border-card)",
              background: "var(--foc-color-surface)",
              color: "var(--foc-navy-deep)",
              fontSize: 20,
              fontWeight: 700,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(13,33,70,0.10)",
              opacity: offset === 0 ? 0.4 : 1,
              cursor: offset === 0 ? "default" : "pointer",
            }}
          >
            ‹
          </button>
          <div style={{ overflow: "hidden", borderRadius: 8 }}>
            <div
              style={{
                display: "flex",
                gap: 20,
                transform: `translateX(-${offset * cardW}px)`,
                transition: "transform 0.45s cubic-bezier(.4,0,.2,1)",
              }}
            >
              {filteredCards.length === 0 ? (
                <div style={{ padding: "48px 24px", color: "var(--foc-text-caption-alt)", fontSize: 14, fontWeight: 600 }}>
                  No items in this category yet.
                </div>
              ) : (
                filteredCards.map((card, i) => (
                  <MediaCard key={`${activeTabId}-${card.title}`} card={card} delay={i * 75} />
                ))
              )}
            </div>
          </div>
          <button
            type="button"
            className="arrow-btn"
            aria-label="Scroll media right"
            onClick={() => setOffset(Math.min(maxOff, offset + 1))}
            disabled={offset >= maxOff}
            style={{
              position: "absolute",
              right: -22,
              top: "42%",
              transform: "translateY(-50%)",
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "2px solid var(--foc-border-card)",
              background: "var(--foc-color-surface)",
              color: "var(--foc-navy-deep)",
              fontSize: 20,
              fontWeight: 700,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(13,33,70,0.10)",
              opacity: offset >= maxOff ? 0.4 : 1,
              cursor: offset >= maxOff ? "default" : "pointer",
            }}
          >
            ›
          </button>
          <div style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: 22 }}>
            {Array.from({ length: maxOff + 1 }).map((_, i) => (
              <button
                type="button"
                key={i}
                aria-label={`Media slide ${i + 1}`}
                onClick={() => setOffset(i)}
                style={{
                  width: i === offset ? 28 : 10,
                  height: 10,
                  borderRadius: 5,
                  background: i === offset ? "var(--foc-navy-deep)" : "var(--foc-slate-muted)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  border: "none",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 36,
            background: "var(--foc-color-surface)",
            borderRadius: 22,
            border: "2px solid var(--foc-border-soft)",
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(13,33,70,0.07)",
          }}
        >
          {MEDIA_STATS.map((s, i) => (
            <div
              className="stat-chip"
              key={s.label}
              style={{
                flex: "1 1 150px",
                display: "flex",
                alignItems: "center",
                gap: 13,
                padding: "22px 22px",
                borderLeft: i > 0 ? "1.5px solid var(--foc-border-ui-alt)" : "none",
                minWidth: 130,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {s.emoji}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--foc-font-display)', fontWeight: 800, fontSize: 20, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--foc-text-caption-alt)", fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PartnersMediaSection() {
  return (
    <>
      <style>{STYLES}</style>
      <div className="fp" id="partners-media">
        <PartnersStrengthSection />
        {/* <OurPartnersSection /> */}
        <MediaSection />
      </div>
    </>
  );
}
