import { useState, useEffect, useRef } from "react";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Orbitron:wght@400;500;600;700;800;900&display=swap');

.zx, .zx *, .zx *::before, .zx *::after { box-sizing: border-box; }

.zx {
  font-family: 'Inter', sans-serif;
  background: #f8fafc;
  color: #111827;
  overflow-x: hidden;
}

.zx h1, .zx h2 {
  font-family: 'Orbitron', monospace;
}

.zx button {
  font-family: 'Inter', sans-serif;
}

@media (max-width: 900px) {
  .zx-about-grid { grid-template-columns: 1fr !important; }
  .zx-programs-3 { grid-template-columns: 1fr !important; }
  .zx-programs-2 { grid-template-columns: 1fr !important; }
  .zx-side-by-side { grid-template-columns: 1fr !important; }
  .zx-vision-4 { grid-template-columns: repeat(2, 1fr) !important; }
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
    color: "#7C3AED",
    title: "Workshops",
    subtitle: "Hands-on sessions on AI, Robotics, IoT, Drones, STEM, Coding & more.",
  },
  {
    icon: "🏅",
    color: "#EC4899",
    title: "Competitions",
    subtitle: "Poster making, robotics challenges, model making, coding, innovation & many more.",
  },
  {
    icon: "🎮",
    color: "#0EA5E9",
    title: "PTM & Carnival Tech Zones",
    subtitle: "Interactive display & game stalls, robot demos, IoT zones, drone experience and more.",
  },
  {
    icon: "📅",
    color: "#10B981",
    title: "Weekend Workshops",
    subtitle: "Short & exciting weekend programs to explore future technologies and build projects.",
  },
  {
    icon: "🎖️",
    color: "#F59E0B",
    title: "Recognition & Awards",
    subtitle: "Certificates, trophies, project showcases and recognition for young innovators.",
  },
];

const COLLEGE_PROGRAMS = [
  {
    icon: "🔬",
    color: "#7C3AED",
    title: "Workshops & Tech Sessions",
    subtitle: "Deep-dive sessions on AI, Robotics, Cloud, Data, Drones & more.",
  },
  {
    icon: "💻",
    color: "#EC4899",
    title: "Competitions & Hackathons",
    subtitle: "Hackathons, coding contests, robotics challenges & innovation competitions.",
  },
  {
    icon: "🚀",
    color: "#0EA5E9",
    title: "Tech Exhibitions & Project Showcase",
    subtitle: "Showcase projects, research, prototypes and innovations to a wider audience.",
  },
  {
    icon: "🤝",
    color: "#10B981",
    title: "Industry Connect & Expert Talks",
    subtitle: "Interact with industry experts, attend tech talks and explore future career pathways.",
  },
  {
    icon: "🌟",
    color: "#F59E0B",
    title: "Weekend & Immersion Programs",
    subtitle: "Short-term weekend programs, bootcamps and specialized learning.",
  },
];

const COMPETITION_FORMATS = [
  "Poster Making Competitions",
  "Robotics Challenges",
  "Innovation Hackathons",
  "STEM Model Competitions",
  "Coding Challenges",
  "AI & IoT Project Competitions",
];

const SCHOOL_HIGHLIGHTS = [
  "Age-appropriate activities for all grades",
  "Encourages innovation & teamwork",
  "Engages students, parents & teachers",
  "Creates future-ready learning experiences",
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
    <span ref={ref} style={{ fontFamily: "'Orbitron', monospace" }}>
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
        background: hovered ? program.color : "#fff",
        border: `2px solid ${hovered ? program.color : "#e5e7eb"}`,
        borderRadius: 16,
        padding: "24px 20px",
        cursor: "default",
        transition: "all 0.28s cubic-bezier(.4,0,.2,1)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered ? `0 20px 40px ${program.color}30` : "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 32 }}>{program.icon}</div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: hovered ? "#fff" : "#111827",
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
        }}
      >
        {program.title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: hovered ? "rgba(255,255,255,0.88)" : "#6b7280",
          lineHeight: 1.6,
        }}
      >
        {program.subtitle}
      </div>
    </div>
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
          ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)"
          : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
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
            "radial-gradient(circle at 20% 80%, #818cf8 0%, transparent 50%), radial-gradient(circle at 80% 20%, #c084fc 0%, transparent 50%)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#a78bfa",
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
            color: "#fff",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          {title.split("Zenith X").map((part, i) =>
            i === 0 ? (
              part
            ) : (
              <span key="brand">
                <span
                  style={{
                    background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Zenith X
                </span>
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
                background: i === 0 ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "transparent",
                color: "#fff",
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
      <div className="zx">
        {/* HERO */}
        <section
          style={{
            background: "linear-gradient(135deg, #0f0a1e 0%, #1e1b4b 40%, #0c1a3a 100%)",
            padding: "80px 32px 100px",
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
                "radial-gradient(circle at 15% 85%, #818cf8 0%, transparent 40%), radial-gradient(circle at 85% 15%, #c084fc 0%, transparent 40%), radial-gradient(circle at 50% 50%, #60a5fa 0%, transparent 60%)",
            }}
          />
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
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
                color: "#c4b5fd",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 28,
              }}
            >
              ✦ Focalyt&apos;s Experiential Learning Ecosystem
            </div>
            <h1
              style={{
                fontSize: "clamp(38px, 6vw, 72px)",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
                margin: "0 0 8px",
              }}
            >
              Inspire.{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #a78bfa 0%, #60a5fa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Innovate.
              </span>
            </h1>
            <h1
              style={{
                fontSize: "clamp(38px, 6vw, 72px)",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
                margin: "0 0 28px",
              }}
            >
              Experience.{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Create.
              </span>
            </h1>
            <p
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.7,
                maxWidth: 640,
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
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                }}
              >
                Request an Event →
              </button>
              <button
                type="button"
                style={{
                  padding: "16px 32px",
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  background: "transparent",
                  color: "#fff",
                  border: "2px solid rgba(255,255,255,0.25)",
                  cursor: "pointer",
                }}
              >
                Explore Programs
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: 32,
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: 56,
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
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "32px" }}>
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 24,
              textAlign: "center",
            }}
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#7c3aed", letterSpacing: "-0.03em" }}>
                  <AnimatedCounter target={s.value} />
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ABOUT */}
        <section style={{ padding: "80px 32px", maxWidth: 1100, margin: "0 auto" }}>
          <div className="zx-about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7c3aed",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                About Zenith X
              </div>
              <h2
                style={{
                  fontSize: "clamp(28px, 3vw, 42px)",
                  fontWeight: 900,
                  color: "#111827",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                  margin: "0 0 20px",
                }}
              >
                Where Ideas Meet <span style={{ color: "#7c3aed" }}>Innovation</span>
              </h2>
              <p style={{ fontSize: 16, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
                Zenith X is Focalyt&apos;s experiential future technology event ecosystem designed to inspire innovation,
                creativity, practical learning, and technology exposure among students, schools, colleges, and communities.
              </p>
              <p style={{ fontSize: 16, color: "#4b5563", lineHeight: 1.75, marginBottom: 32 }}>
                Through interactive workshops, competitions, exhibitions, PTM engagement activities, innovation showcases,
                and experiential learning zones, Zenith X creates exciting opportunities for learners to explore AI, Robotics,
                IoT, Drones, STEM, and emerging technologies.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {FOCUS_AREAS.map((f) => (
                  <TagBadge key={f.label} label={`${f.icon} ${f.label}`} color="#7c3aed" />
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { title: "INNOVATE", desc: "Push boundaries with cutting-edge tech projects", color: "#7c3aed", icon: "💡" },
                { title: "COLLABORATE", desc: "Build teams and forge lasting connections", color: "#0ea5e9", icon: "🤝" },
                { title: "COMPETE", desc: "Challenge yourself in exciting competitions", color: "#ec4899", icon: "🏆" },
                { title: "IMPACT", desc: "Create change through technology and innovation", color: "#10b981", icon: "🌟" },
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    background: "#fff",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: 16,
                    padding: "24px 20px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = card.color;
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{card.icon}</div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: card.color,
                      letterSpacing: "0.08em",
                      marginBottom: 6,
                      fontFamily: "'Orbitron', monospace",
                    }}
                  >
                    {card.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{card.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROGRAMS TABS */}
        <section style={{ background: "#fff", padding: "80px 32px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7c3aed",
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
                  color: "#111827",
                  letterSpacing: "-0.03em",
                  margin: "0 0 16px",
                }}
              >
                Built for Every Learner
              </h2>
              <p style={{ fontSize: 16, color: "#6b7280", maxWidth: 520, margin: "0 auto" }}>
                Tailored experiences from school students to college innovators
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
              <div style={{ display: "inline-flex", background: "#f3f4f6", borderRadius: 16, padding: 6, gap: 4 }}>
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
                      background: activeTab === t.key ? "#7c3aed" : "transparent",
                      color: activeTab === t.key ? "#fff" : "#6b7280",
                      boxShadow: activeTab === t.key ? "0 4px 16px rgba(124,58,237,0.3)" : "none",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "schools" && (
              <div>
                <div className="zx-programs-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 48 }}>
                  {SCHOOL_PROGRAMS.slice(0, 3).map((p) => (
                    <ProgramCard key={p.title} program={p} />
                  ))}
                </div>
                <div className="zx-programs-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 48 }}>
                  {SCHOOL_PROGRAMS.slice(3).map((p) => (
                    <ProgramCard key={p.title} program={p} />
                  ))}
                </div>

                <div className="zx-side-by-side" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                      borderRadius: 20,
                      padding: 32,
                      border: "1.5px solid #ddd6fe",
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#5b21b6", marginBottom: 16 }}>🎯 Event Highlights</div>
                    {SCHOOL_HIGHLIGHTS.map((h) => (
                      <div key={h} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "#7c3aed", fontWeight: 900, marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: 14, color: "#4b5563" }}>{h}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#6d28d9", marginBottom: 10 }}>Perfect for</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {["PTMs", "Annual Days", "Science Fairs", "Carnivals", "Exhibitions"].map((l) => (
                          <span
                            key={l}
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "4px 12px",
                              borderRadius: 999,
                              background: "#ede9fe",
                              color: "#5b21b6",
                            }}
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                      borderRadius: 20,
                      padding: 32,
                      border: "1.5px solid #bfdbfe",
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1d4ed8", marginBottom: 16 }}>📚 Competition Formats</div>
                    {COMPETITION_FORMATS.map((f) => (
                      <div key={f} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "#2563eb", fontWeight: 900, marginTop: 1 }}>→</span>
                        <span style={{ fontSize: 14, color: "#374151" }}>{f}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8", marginBottom: 8 }}>Participation Categories</div>
                      {["Junior (Cl. 2–5)", "Middle (Cl. 6–9)", "Senior (Cl. 10–12)"].map((c) => (
                        <span
                          key={c}
                          style={{
                            display: "inline-block",
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "4px 12px",
                            borderRadius: 999,
                            background: "#dbeafe",
                            color: "#1d4ed8",
                            marginRight: 6,
                            marginBottom: 6,
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "colleges" && (
              <div>
                <div className="zx-programs-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 48 }}>
                  {COLLEGE_PROGRAMS.slice(0, 3).map((p) => (
                    <ProgramCard key={p.title} program={p} />
                  ))}
                </div>
                <div className="zx-programs-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 48 }}>
                  {COLLEGE_PROGRAMS.slice(3).map((p) => (
                    <ProgramCard key={p.title} program={p} />
                  ))}
                </div>
                <div className="zx-side-by-side" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                      borderRadius: 20,
                      padding: 32,
                      border: "1.5px solid #bbf7d0",
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#15803d", marginBottom: 16 }}>📈 Event Impact</div>
                    {COLLEGE_IMPACT.map((h) => (
                      <div key={h} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "#16a34a", fontWeight: 900, marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: 14, color: "#4b5563" }}>{h}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #fff7ed, #fed7aa)",
                      borderRadius: 20,
                      padding: 32,
                      border: "1.5px solid #fdba74",
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#c2410c", marginBottom: 16 }}>🎓 Ideal For</div>
                    {["Engineering Colleges", "Universities", "Tech Clubs", "Innovation Cells"].map((i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                        <span style={{ color: "#ea580c", fontWeight: 900 }}>→</span>
                        <span style={{ fontSize: 14, color: "#374151" }}>{i}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 16, padding: 16, background: "rgba(255,255,255,0.6)", borderRadius: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
                        Innovate · Collaborate · Transform
                      </div>
                      <div style={{ fontSize: 13, color: "#78350f" }}>
                        Empowering higher education with industry-aligned technology experiences
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* WORKSHOPS DETAIL */}
        <section style={{ background: "#f8fafc", padding: "80px 32px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7c3aed",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Deep Dive
              </div>
              <h2 style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", margin: 0 }}>
                Our Core Offerings
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
              {[
                {
                  icon: "🤖",
                  color: "#7c3aed",
                  bg: "#f5f3ff",
                  border: "#ddd6fe",
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
                  color: "#0ea5e9",
                  bg: "#eff6ff",
                  border: "#bfdbfe",
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
                  color: "#10b981",
                  bg: "#f0fdf4",
                  border: "#bbf7d0",
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
                  color: "#f59e0b",
                  bg: "#fffbeb",
                  border: "#fde68a",
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
                    background: card.bg,
                    border: `1.5px solid ${card.border}`,
                    borderRadius: 20,
                    padding: 28,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = `0 12px 32px ${card.color}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
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
                        <span style={{ fontSize: 14, color: "#374151" }}>{p}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: `1px solid ${card.border}`, paddingTop: 12, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                    {card.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VISION SECTION */}
        <section style={{ background: "#fff", padding: "80px 32px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#7c3aed",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Our Vision
            </div>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 900,
                color: "#111827",
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                margin: "0 0 28px",
              }}
            >
              Transforming learning into an engaging{" "}
              <span style={{ color: "#7c3aed" }}>technology experience</span>
            </h2>
            <p style={{ fontSize: 18, color: "#4b5563", lineHeight: 1.75, maxWidth: 680, margin: "0 auto 56px" }}>
              Zenith X combines innovation, creativity, practical exposure, and experiential participation — helping students
              become confident future-ready innovators and creators.
            </p>
            <div className="zx-vision-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
              {[
                { word: "Inspire", color: "#7c3aed", icon: "✨", desc: "Sparking curiosity in young minds" },
                { word: "Innovate", color: "#0ea5e9", icon: "💡", desc: "Creating novel solutions together" },
                { word: "Experience", color: "#10b981", icon: "🚀", desc: "Hands-on learning that sticks" },
                { word: "Create", color: "#f59e0b", icon: "🎨", desc: "Building the future, today" },
              ].map((v) => (
                <div
                  key={v.word}
                  style={{
                    padding: 24,
                    borderRadius: 20,
                    border: `2px solid ${v.color}20`,
                    background: v.color + "08",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{v.icon}</div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: v.color,
                      letterSpacing: "-0.02em",
                      marginBottom: 6,
                      fontFamily: "'Orbitron', monospace",
                    }}
                  >
                    {v.word}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — SCHOOLS */}
        <section style={{ padding: "0 32px 0", maxWidth: 1100, margin: "0 auto" }}>
          <CTASection
            title="Bring Zenith X to Your School"
            subtitle="For Schools & PTMs"
            actions={["Request an Event", "Explore Programs", "Download Brochure", "Contact Us"]}
          />
        </section>

        {/* CTA — COLLEGES */}
        <section style={{ padding: "32px 32px 0", maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #0c2340 0%, #0f3460 50%, #0a1628 100%)",
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
                  "radial-gradient(circle at 20% 80%, #22d3ee 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 50%)",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#22d3ee",
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
                  color: "#fff",
                  margin: "0 0 8px",
                  letterSpacing: "-0.02em",
                }}
              >
                Partner with{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, #22d3ee, #6366f1)",
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
                      background: i === 3 ? "linear-gradient(135deg, #22d3ee, #6366f1)" : "transparent",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
