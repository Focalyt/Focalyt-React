import { useState, useEffect, useRef } from "react";

const STYLES = `
.zx, .zx *, .zx *::before, .zx *::after { box-sizing: border-box; }

.zx {
  font-family: var(--foc-font-sans);
  background: var(--foc-color-bg-muted);
  color: var(--foc-color-text-strong);
  overflow-x: hidden;
}

.zx h1, .zx h2 {
  font-family: var(--foc-font-display);
}

.zx-hero-brand-tag {
  margin: 10px 0 0;
  font-size: clamp(10px, 1.2vw, 13px);
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--foc-sky-muted);
}

.zx-section-head {
  text-align: center !important;
  width: 100%;
}

.zx-section-head h2,
.zx-section-head p,
.zx-section-head > div {
  text-align: center !important;
  width: 100%;
}

.zx-hero-headline {
  font-size: clamp(32px, 5.5vw, 64px);
  font-weight: 900;
  line-height: 1.12;
  letter-spacing: -0.03em;
  margin: 0 0 12px;
  text-align: center !important;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: baseline;
  gap: 0.2em;
  width: 100%;
}

.zx-hero-desc {
  text-align: center !important;
  margin-left: auto;
  margin-right: auto;
}

.zx-hero-headline-ready {
  color: var(--foc-color-text-inverse);
}

.zx-brand-inline-zenith {
  color: var(--foc-teal-light);
  font-weight: var(--foc-weight-black);
}

.zx-brand-inline-x {
  color: var(--foc-lavender);
  font-weight: var(--foc-weight-black);
  font-size: 1.1em;
  text-shadow: var(--foc-shadow-glow-cyan);
}

.zx button {
  font-family: var(--foc-font-sans);
}

@media (max-width: 1100px) {
  .zx-core-offerings { grid-template-columns: repeat(2, 1fr) !important; }
}

@media (max-width: 900px) {
  .zx-about-grid { grid-template-columns: 1fr !important; }
  .zx-vision-4 { grid-template-columns: repeat(2, 1fr) !important; }
}

@media (max-width: 600px) {
  .zx-core-offerings { grid-template-columns: 1fr !important; }
}

@media (max-width: 520px) {
  .zx-vision-4 { grid-template-columns: 1fr !important; }
}
`;

const STATS = [
  { value: "10,000+", label: "Students Engaged", icon: "👥" },
  { value: "250+", label: "Schools & Colleges", icon: "🏫" },
  { value: "75+", label: "Events Conducted", icon: "🏆" },
  { value: "15+", label: "States Covered", icon: "🌐" },
  { value: "100+", label: "Partners & Experts", icon: "⭐" },
];

const SCHOOL_PROGRAMS = [
  {
    icon: "🤖",
    color: "var(--foc-purple)",
    title: "Workshops",
  },
  {
    icon: "🏅",
    color: "var(--foc-pink-500)",
    title: "Competitions",
  },
  {
    icon: "🎮",
    color: "var(--foc-sky-500)",
    title: "PTM & Carnival Tech Zones",
  },
  {
    icon: "📅",
    color: "var(--foc-emerald-500)",
    title: "Weekend Workshops",
  },
  {
    icon: "🎖️",
    color: "var(--foc-color-warning)",
    title: "Recognition & Awards",
  },
];

const COLLEGE_PROGRAMS = [
  {
    icon: "🔬",
    color: "var(--foc-purple)",
    title: "Workshops & Tech Sessions",
  },
  {
    icon: "💻",
    color: "var(--foc-pink-500)",
    title: "Competitions & Hackathons",
  },
  {
    icon: "🚀",
    color: "var(--foc-sky-500)",
    title: "Tech Exhibitions & Project Showcase",
  },
  {
    icon: "🤝",
    color: "var(--foc-emerald-500)",
    title: "Industry Connect & Expert Talks",
  },
  {
    icon: "🌟",
    color: "var(--foc-color-warning)",
    title: "Weekend & Immersion Programs",
  },
];

const COLLEGE_IMPACT = [
  "Builds practical and industry-relevant skills",
  "Encourages research, innovation & startups",
  "Provides networking with experts & industry",
  "Enhances employability and leadership",
];

const FOCUS_AREAS = [
  { label: "AI & Robotics", icon: "🤖" },
  { label: "IoT & Smart Devices", icon: "📡" },
  { label: "Drone Technology", icon: "🚁" },
  { label: "STEM Innovation", icon: "🔭" },
  { label: "Coding & Software", icon: "💻" },
  { label: "Data & Cloud", icon: "☁️" },
];

function AnimatedCounter({ target, duration = 1500 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(target.replace(/\D/g, ""), 10);
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * num));
          if (progress < 1) requestAnimationFrame(tick);
          else setCount(num);
        };
        requestAnimationFrame(tick);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  const suffix = target.replace(/[\d,]/g, "");
  return (
    <span ref={ref} style={{ fontFamily: "var(--foc-font-display)" }}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function ProgramCard({ program }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 999,
        background: hovered ? program.color : "var(--foc-color-surface)",
        border: `1.5px solid ${hovered ? program.color : "var(--foc-color-border-ui)"}`,
        cursor: "default",
        transition: "all 0.2s ease",
        boxShadow: hovered ? `0 6px 16px ${program.color}28` : "0 1px 4px rgba(0,0,0,0.05)",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>{program.icon}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: hovered ? "var(--foc-color-surface)" : "var(--foc-color-text-strong)",
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
        }}
      >
        {program.title}
      </span>
    </div>
  );
}

function ZenithXInline() {
  return (
    <>
      <span className="zx-brand-inline-zenith">Zenith </span>
      <span className="zx-brand-inline-x">X</span>
    </>
  );
}

function TagBadge({ label, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        background: color + "15",
        color: color,
        border: `1.5px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
}

function CTASection({ dark = false, title, subtitle, actions }) {
  return (
    <div
      style={{
        background: dark
          ? "linear-gradient(135deg, var(--foc-indigo-950) 0%, var(--foc-indigo-900) 50%, var(--foc-purple-900) 100%)"
          : "linear-gradient(135deg, var(--foc-slate-900) 0%, var(--foc-slate-800) 100%)",
        borderRadius: 24,
        padding: "48px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.07,
          backgroundImage:
            "radial-gradient(circle at 20% 80%, var(--foc-indigo-400) 0%, transparent 50%), radial-gradient(circle at 80% 20%, var(--foc-fuchsia-400) 0%, transparent 50%)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--foc-violet-400)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          {subtitle}
        </div>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 800,
            color: "var(--foc-color-surface)",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          {title.split("Zenith X").map((part, i) =>
            i === 0 ? (
              part
            ) : (
              <span key="brand">
                <ZenithXInline />
                {part}
              </span>
            )
          )}
        </h2>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
          {actions.map((a, i) => (
            <button
              key={a}
              type="button"
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                border: i === 0 ? "none" : "2px solid rgba(255,255,255,0.25)",
                background: i === 0 ? "linear-gradient(135deg, var(--foc-purple), var(--foc-indigo-600))" : "transparent",
                color: "var(--foc-color-surface)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ZenithXSection() {
  const [activeTab, setActiveTab] = useState("schools");

  return (
    <>
      <style>{STYLES}</style>
      <div className="zx" id="zenith-x">
        {/* HERO */}
        <section
          style={{
            background: "linear-gradient(135deg, var(--foc-zenith-bg) 0%, var(--foc-indigo-950) 40%, var(--foc-zenith-bg-mid) 100%)",
            padding: "15px 0",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.12,
              backgroundImage:
                "radial-gradient(circle at 15% 85%, var(--foc-indigo-400) 0%, transparent 40%), radial-gradient(circle at 85% 15%, var(--foc-fuchsia-400) 0%, transparent 40%), radial-gradient(circle at 50% 50%, var(--foc-blue-400) 0%, transparent 60%)",
            }}
          />
          <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(124,58,237,0.2)",
                border: "1px solid rgba(167,139,250,0.3)",
                borderRadius: 999,
                padding: "6px 16px",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--foc-violet-300)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 28,
              }}
            >
              ✦ Focalyt&apos;s Experiential Learning Ecosystem
            </div>
            <h1 className="zx-hero-headline">
              <span className="zx-hero-headline-ready">Future Ready</span>
              <ZenithXInline />
            </h1>
            <p className="zx-hero-brand-tag" style={{ margin: "0 0 8px", textAlign: "center" }}>
              Future Technology Events
            </p>
            <p
              className="zx-hero-desc"
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.7,
                margin: "0 auto 40px",
                fontWeight: 400,
              }}
            >
              Zenith X brings learning to life through workshops, competitions, displays, games, and innovation zones —
              helping students explore AI, Robotics, IoT, Drones, and STEM.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                style={{
                  padding: "16px 32px",
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, var(--foc-purple), var(--foc-indigo-600))",
                  color: "var(--foc-color-surface)",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                }}
              >
                Request an Event →
              </button>
              {/* <button
                type="button"
                style={{
                  padding: "16px 32px",
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  background: "transparent",
                  color: "var(--foc-color-surface)",
                  border: "2px solid rgba(255,255,255,0.25)",
                  cursor: "pointer",
                }}
              >
                Explore Programs
              </button> */}
            </div>
            {/* <div
              style={{
                display: "flex",
                gap: 32,
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: 25,
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: 40,
              }}
            >
              {[
                ["Hands-on Learning", "🖐️"],
                ["Innovation & Creativity", "💡"],
                ["Real-world Exposure", "🌍"],
                ["Fun & Engaging", "🎮"],
                ["Future Ready Skills", "🚀"],
              ].map(([l, e]) => (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  <span>{e}</span>
                  <span>{l}</span>
                </div>
              ))}
            </div> */}
              <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 24,
              textAlign: "center",
            }}
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "var(--foc-purple)", letterSpacing: "-0.03em" }}>
                  <AnimatedCounter target={s.value} />
                </div>
                <div style={{ fontSize: 13, color: "var(--foc-gray-500)", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          </div>
          </div>
        </section>    

        {/* PROGRAMS TABS */}
        <section style={{ background: "var(--foc-color-surface)", padding: "15px 0" }}>
          <div className="container">
            <div className="zx-section-head" style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--foc-purple)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Programs & Activities
              </div>
              <h2
                style={{
                  fontSize: "clamp(28px, 3vw, 40px)",
                  fontWeight: 900,
                  color: "var(--foc-color-text-strong)",
                  letterSpacing: "-0.03em",
                  margin: "0 0 16px",
                  textAlign: "center",
                }}
              >
                Built for Every Learner
              </h2>
              <p style={{ fontSize: 16, color: "var(--foc-gray-500)", margin: "0 auto", textAlign: "center" }}>
                Tailored experiences from school students to college innovators
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ display: "inline-flex", background: "var(--foc-chip-bg)", borderRadius: 16, padding: 6, gap: 4 }}>
                {[
                  { key: "schools", label: "🏫 For Schools" },
                  { key: "colleges", label: "🎓 For Colleges" },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    style={{
                      padding: "14px 28px",
                      borderRadius: 12,
                      border: "none",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.25s",
                      background: activeTab === t.key ? "var(--foc-purple)" : "transparent",
                      color: activeTab === t.key ? "var(--foc-color-surface)" : "var(--foc-gray-500)",
                      boxShadow: activeTab === t.key ? "0 4px 16px rgba(124,58,237,0.3)" : "none",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "schools" && (
              <div
                className="zx-programs-wrap"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                {SCHOOL_PROGRAMS.map((p) => (
                  <ProgramCard key={p.title} program={p} />
                ))}
              </div>
            )}

            {activeTab === "colleges" && (
              <div
                className="zx-programs-wrap"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                {COLLEGE_PROGRAMS.map((p) => (
                  <ProgramCard key={p.title} program={p} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* WORKSHOPS DETAIL */}
        <section style={{ background: "var(--foc-color-bg-muted)", padding: "15px 0" }}>
          <div className="container">
            <div className="zx-section-head" style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--foc-purple)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Deep Dive
              </div>
              <h2
                style={{
                  fontSize: "clamp(26px, 3vw, 38px)",
                  fontWeight: 900,
                  color: "var(--foc-color-text-strong)",
                  letterSpacing: "-0.03em",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                Our Core Offerings
              </h2>
            </div>
            <div
              className="zx-core-offerings"
              style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}
            >
              {[
                {
                  icon: "🤖",
                  color: "var(--foc-purple)",
                  border: "var(--foc-purple-200)",
                  title: "Workshops & Hands-On Learning",
                  points: [
                    "Artificial Intelligence & Machine Learning",
                    "Robotics & Automation systems",
                    "Internet of Things (IoT)",
                    "Drone Technology & Operations",
                    "STEM Innovation Activities",
                    "Coding & Smart Technologies",
                  ],
                  note: "Beginner to advanced modules · Expert trainer-led · Innovation-based learning",
                },
                {
                  icon: "🎮",
                  color: "var(--foc-sky-500)",
                  border: "var(--foc-blue-100)",
                  title: "PTM & Carnival Tech Zones",
                  points: [
                    "Robotics Demonstration Stalls",
                    "AI & Smart Technology Displays",
                    "IoT Live Demonstrations",
                    "Drone Experience Zones",
                    "STEM Innovation Corners",
                    "Interactive Tech Games & Challenges",
                  ],
                  note: "Parent & student engagement · Technology awareness · Community participation",
                },
                {
                  icon: "📅",
                  color: "var(--foc-emerald-500)",
                  border: "var(--foc-green-100)",
                  title: "Weekend Innovation Workshops",
                  points: [
                    "AI & Robotics Basics",
                    "Drone Exploration Sessions",
                    "STEM Innovation Projects",
                    "Smart Devices & IoT Modules",
                    "Innovation & Entrepreneurship Activities",
                    "Flexible participation models",
                  ],
                  note: "Fun & interactive · Practical project-building · Industry & career awareness",
                },
                {
                  icon: "🎖️",
                  color: "var(--foc-color-warning)",
                  border: "var(--foc-amber-200)",
                  title: "Recognition & Student Engagement",
                  points: [
                    "Participation Certificates",
                    "Winner Awards & Recognition",
                    "Innovation Showcases",
                    "Student Project Displays",
                    "Inter-school Competitions",
                    "Technology Demonstration Events",
                  ],
                  note: "Structured judging · Multiple participation categories · Visible recognition",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    background: "var(--foc-color-surface)",
                    border: `1.5px solid ${card.border}`,
                    borderRadius: 20,
                    padding: 24,
                    transition: "all 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = `0 12px 32px ${card.color}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: card.color,
                      marginBottom: 16,
                      letterSpacing: "-0.01em",
                      fontFamily: "'Orbitron', monospace",
                    }}
                  >
                    {card.title}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    {card.points.map((p) => (
                      <div key={p} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <span style={{ color: card.color, fontWeight: 700, fontSize: 14, marginTop: 1 }}>•</span>
                        <span style={{ fontSize: 14, color: "var(--foc-color-text-strong)" }}>{p}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: `1px solid ${card.border}`, paddingTop: 12, fontSize: 12, color: "var(--foc-gray-500)", lineHeight: 1.6 }}>
                    {card.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* CTA — SCHOOLS */}
        {/* <section style={{ padding: "0 32px 0", maxWidth: 1100, margin: "0 auto" }}>
          <CTASection
            title="Bring Zenith X to Your School"
            subtitle="For Schools & PTMs"
            actions={["Request an Event", "Explore Programs", "Download Brochure", "Contact Us"]}
          />
        </section> */}

        {/* CTA — COLLEGES */}
        {/* <section style={{ padding: "32px 32px 0", maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              background: "linear-gradient(135deg, var(--foc-hero-navy) 0%, var(--foc-hero-navy-mid) 50%, var(--foc-hero-navy-deep) 100%)",
              borderRadius: 24,
              padding: "48px 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 16,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.1,
                backgroundImage:
                  "radial-gradient(circle at 20% 80%, var(--foc-cyan-400) 0%, transparent 50%), radial-gradient(circle at 80% 20%, var(--foc-indigo-500) 0%, transparent 50%)",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--foc-cyan-400)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                For Colleges & Universities
              </div>
              <h2
                style={{
                  fontSize: "clamp(24px, 3vw, 36px)",
                  fontWeight: 800,
                  color: "var(--foc-color-surface)",
                  margin: "0 0 8px",
                  letterSpacing: "-0.02em",
                }}
              >
                Partner with{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, var(--foc-cyan-400), var(--foc-indigo-500))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Zenith X
                </span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, maxWidth: 500, margin: "0 auto 24px" }}>
                Elevate your campus with world-class future technology events that inspire learners and build the innovators of
                tomorrow.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                {["Host an Event", "Explore Programs", "Download Brochure", "Connect With Us →"].map((a, i) => (
                  <button
                    key={a}
                    type="button"
                    style={{
                      padding: "12px 24px",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      border: i === 3 ? "none" : "2px solid rgba(255,255,255,0.2)",
                      background: i === 3 ? "linear-gradient(135deg, var(--foc-cyan-400), var(--foc-indigo-500))" : "transparent",
                      color: "var(--foc-color-surface)",
                      cursor: "pointer",
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section> */}
      </div>
    </>
  );
}
