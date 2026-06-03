import { useEffect, useState } from "react";
import $ from "jquery";
import axios from "axios";
import "slick-carousel";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import FrontLayout from "../../../Component/Layouts/Front";
import { useLocation } from "react-router-dom";
import resolveMediaUrl from "../../../utils/resolveMediaUrl";

const staticFounders = [
  {
    name: "Parveen Bansal",
    role: "Founder & CEO",
    color: "#1ba7ff",
    emoji: "👥",
    linkedin: "https://www.linkedin.com/in/parveen-bansal-17301419/",
    points: [
      "Leads strategy, operations & business development at Focalyt.",
      "Expert in program management, institutional partnerships & scaling impact projects.",
      "Passionate about building future-ready education and skilling ecosystems.",
    ],
  },
  {
    name: "Bhavna Mittal",
    role: "Co-Founder & Chief Academic Officer",
    color: "#fc2b5a",
    emoji: "📚",
    linkedin: "#",
    points: [
      "Leads academic strategy, curriculum innovation & learning excellence.",
      "Focused on future-tech learning, learner engagement and outcome driven programs.",
      "Driving blended learning models that create real-world impact.",
    ],
  },
  {
    name: "Aashirya Bansal",
    role: "Founder – Product & Expansion",
    color: "#7c3aed",
    emoji: "🚀",
    linkedin: "https://www.linkedin.com/in/aashirya-bansal-631464298/",
    points: [
      "Leads product development, strategic partnerships & expansion initiatives.",
      "Focused on innovation, future-tech solutions & scalable growth models.",
      "Driving Hub & Spoke expansion across Tier 2/3 Bharat.",
    ],
  },
];

const staticCore = [
  { name: "Sachin Mishra", role: "VP – Business Operations", icon: "👨‍💼", desc: "Leads operations, project execution & institutional partnerships across multiple states." },
  { name: "Dr. Neha Sharma", role: "Academic Director", icon: "👩‍🎓", desc: "Drives academic quality, curriculum development & trainer development initiatives." },
  { name: "Ankit Verma", role: "Head – Technology & Innovation", icon: "👨‍💻", desc: "Leads technology strategy, digital transformation & future-tech solutions." },
  { name: "Ritika Bansal", role: "Head – Partnerships & Institutional Alliances", icon: "👩‍💼", desc: "Focuses on partnerships, university collaborations & CSR alliances." },
  { name: "Himanshu Sharma", role: "Manager – Business Development", icon: "👨‍💼", desc: "Drives business growth, client engagement & market expansion." },
  { name: "Sneha Aggarwal", role: "HR & Talent Development Lead", icon: "👩‍💼", desc: "Leads talent acquisition, employee engagement & organizational development." },
  { name: "Vivek Chauhan", role: "Quality & Training Head", icon: "👨‍🔧", desc: "Ensures program quality, assessments & continuous improvement across all initiatives." },
  { name: "Pooja Thakur", role: "Mobilization & Community Outreach Lead", icon: "👩‍💼", desc: "Leads grassroots mobilization, community engagement & social impact initiatives." },
];

function getFounderTheme(color) {
  const isPink = String(color || "").toLowerCase() === "#fc2b5a";
  const accent = isPink ? "#fc2b5a" : "#0b1f4b";
  return { badge: accent, footer: accent, dot: accent, role: "#fc2b5a" };
}

function descriptionToPoints(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/\n+|(?:\r\n)+|•|·|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[-•·]\s*/, "").trim())
    .filter((s) => s.length > 6);
}

function toDisplayName(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mergeFounderWithStatic(member, index) {
  const match =
    staticFounders.find(
      (s) => s.name.toLowerCase() === String(member.name || "").toLowerCase().trim()
    ) || staticFounders[index % staticFounders.length];
  const fromApi = descriptionToPoints(member.description);
  const points = match.points?.length ? match.points : fromApi.length ? fromApi : match.points;
  return {
    ...match,
    ...member,
    name: member.name || match.name,
    role: member.designation || member.position || match.role,
    points,
    color: match.color,
    emoji: match.emoji,
    linkedin:
      member.linkedin && member.linkedin !== "#"
        ? member.linkedin
        : match.linkedin || "#",
  };
}

function LinkedInBtn({ color, href = "#" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="ab-founder-footer"
      style={{ background: color }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
      LinkedIn Profile
    </a>
  );
}

function SectionDivider({ label }) {
  return (
    <div className="ab-divider">
      <div className="ab-divider-line" />
      <span className="ab-divider-tag">{label}</span>
      <div className="ab-divider-line" />
    </div>
  );
}

function About() {
  const location = useLocation();
  const [seniorManagement, setSeniorManagement] = useState([]);
  const [management, setManagement] = useState([]);
  const [staff, setStaff] = useState([]);
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const teamPhotoUrl = (fileURL) => resolveMediaUrl(bucketUrl, fileURL);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${backendUrl}/team`);
        setSeniorManagement(res.data.seniorManagement);
        setManagement(res.data.management);
        setStaff(res.data.staff);
      } catch (e) {
        console.error("Error fetching team data:", e);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const init = (sel, cfg) => {
      if ($(sel).length > 0 && !$(sel).hasClass("slick-initialized")) $(sel).slick(cfg);
    };
    const base = { dots: false, infinite: true, slidesToShow: 1, slidesToScroll: 1, arrows: false, autoplay: true, autoplaySpeed: 2500 };
    init("#hostel-slider .sl-imgs", { ...base, slidesToShow: 3, responsive: [{ breakpoint: 768, settings: { slidesToShow: 1 } }] });
    return () => {
      try { $(".slick-initialized").each(function () { if ($(this).hasClass("slick-initialized")) $(this).slick("unslick"); }); }
      catch (e) { console.warn(e); }
    };
  }, []);

  const ecoCards = [
    {
      num: "01", icon: "🏛️", color: "#1ba7ff",
      title: "Government Skill Development & Workforce Transformation",
      company: "Focal Skill Development Pvt. Ltd.",
      caption: "Driving large-scale workforce transformation through future-ready skilling, employability and partnerships.",
      emoji: "🎓", bg: "linear-gradient(135deg,#1d4fd8 0%,#0b1f4b 100%)",
      items: ["Government Skill Development Projects", "Industry Workforce Development", "State & Central Skill Missions", "Multi-State Project Execution", "Employment & Placement Programs", "Future-Ready Skills & Technologies", "University & Institutional Partnerships"],
      impactIcon: "🎯", impact: "Empowering youth with industry-relevant skills and creating scalable livelihood opportunities across Bharat."
    },
    {
      num: "02", icon: "🤝", color: "#16a34a",
      title: "CSR, Sustainability & Community Impact",
      company: "Focal Skill Foundation",
      caption: "Creating inclusive and sustainable impact at the grassroots level.",
      emoji: "🌱", bg: "linear-gradient(135deg,#16a34a 0%,#064e3b 100%)",
      items: ["CSR Project Implementation", "Community Mobilization", "Sustainability & Environment Programs", "SHG & Livelihood Programs", "Women & Youth Empowerment", "Social Impact Initiatives", "Rural & Tribal Development"],
      impactIcon: "🌿", impact: "Building sustainable communities through inclusive development, environmental responsibility and grassroots empowerment."
    },
    {
      num: "03", icon: "💻", color: "#7c3aed",
      title: "Future-Tech Education & EdTech Solutions",
      company: "Focal Skill Future Technology Solutions",
      caption: "Empowering Bharat's schools and colleges with future-ready technology ecosystems.",
      emoji: "🤖", bg: "linear-gradient(135deg,#7c3aed 0%,#1e1b4b 100%)",
      items: ["AI, Robotics & IoT Labs", "Innovation & Future-Tech Labs", "Smart School Infrastructure", "EdTech Platforms & Learning Solutions", "Coding & STEM Education", "School & College Transformation", "Teacher Upskilling Programs"],
      impactIcon: "🚀", impact: "Preparing the next generation with future technologies, innovation-driven learning and digital readiness."
    }
  ];

  const stats = [
    { icon: "👥", num: "25+", label: "States Presence" },
    { icon: "🎓", num: "500+", label: "Schools & Colleges" },
    { icon: "👨‍🎓", num: "50,000+", label: "Learners Trained" },
    { icon: "🤝", num: "50+", label: "CSR & Govt. Partners" },
    { icon: "🏢", num: "50+", label: "Industry Partners" },
    { icon: "📈", num: "50+", label: "Future-Tech Labs" },
  ];

  const founders =
    seniorManagement.length > 0
      ? seniorManagement.map(mergeFounderWithStatic)
      : staticFounders;
  const coreTeam = management.length > 0 || staff.length > 0 ? [...management, ...staff] : staticCore;

  const hostelImgs = ["hOSTEL-FACILITIES-2.jpg","hOSTEL-FACILITIES.jpg"];

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-foc-theme", "sky-magenta");
    root.style.setProperty("--front-layout-bg", "var(--foc-color-bg)");
    return () => {
      root.style.removeProperty("--front-layout-bg");
    };
  }, []);

  return (
    <>
      <FrontLayout>
        <div className="foc-about-page">

        {/* HERO BANNER */}
        {/* <section className="ab-hero">
          <div className="ab-hero-glow ab-hero-glow-1" />
          <div className="ab-hero-glow ab-hero-glow-2" />
          <div className="container">
            <div className="ab-hero-logos">
              <div className="ab-hero-logo"><img src="/Assets/public/images/logo/logo.png" alt="Focalyt" /></div>
              <div className="ab-hero-sep" />
              <div className="ab-hero-logo"><img src="/Assets/public/images/logo/focal.png" alt="Focal" /></div>
            </div>
            <div className="ab-hero-content">
              <span className="ab-eyebrow">About Us</span>
              <h1 className="ab-hero-title">
                <span className="ab-grad">Focalyt</span>
                {" "}— A Skill-Tech Brand of{" "}
                <span className="ab-grad">Focal Skill Development Pvt. Ltd.</span>
              </h1>
              <p className="ab-hero-body">
                At Focalyt, we are committed to revolutionizing the way people learn and grow in today's rapidly evolving world. As an innovative skill-tech platform, we empower individuals and organizations with cutting-edge education and skill development opportunities.
              </p>
            </div>
          </div>
        </section> */}

        {/* KEY AREAS */}
        {/* <section className="ab-areas">
          <div className="container">
            <div className="ab-sec-hd">
              <span className="ab-tag">What We Do</span>
              <h2 className="ab-sec-title">Key Areas of Working</h2>
            </div>
            <div className="ab-areas-grid">
              {[
                { src: "/Assets/public_assets/images/icons/skill.png", label: "Skill Development" },
                { src: "/Assets/public_assets/images/icons/development.png", label: "Entrepreneurship Development" },
                { src: "/Assets/public_assets/images/icons/guidance.png", label: "Career Counselling & Guidance" },
                { src: "/Assets/public_assets/images/icons/services.png", label: "Placement & Employment Services" },
              ].map((a, i) => (
                <div className="ab-area-card" key={i}>
                  <div className="ab-area-ring"><img src={a.src} alt={a.label} /></div>
                  <h4>{a.label}</h4>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* AFFILIATED PARTNERS */}
        {/* <section className="ab-aff-section">
          <div className="container">
            <h3 className="ab-aff-heading">Affiliated Training Partner</h3>
            <div className="ab-aff-row">
              {["bfsi.png","ess.png","mesc.png","thsc.png","telecom.jpg"].map((img, i) => (
                <div className="ab-aff-logo" key={i}><img src={`/Assets/public_assets/images/${img}`} alt="" /></div>
              ))}
            </div>
          </div>
        </section> */}

        {/* VISION & MISSION */}
        <section className="ab-vision-section" id="vision">
          <div className="container">
            <div className="ab-vision-grid" id="vission">
              {[
                {
                  icon: "🔭",
                  label: "Our Vision",
                  text: "To build a future-ready society where technology, skills, and innovation create sustainable socio-economic growth for every community.",
                  color: "#1ba7ff",
                },
                {
                  icon: "🎯",
                  label: "Our Mission",
                  text: "To empower millions of learners, institutions, and enterprises through future technologies, blended learning ecosystems, industry partnerships, and sustainable development initiatives that drive employability, entrepreneurship, and social transformation.",
                  color: "#fc2b5a",
                },
              ].map((v, i) => (
                <div className="ab-vision-card" key={i}>
                  <div
                    className="ab-vision-icon-wrap"
                    style={{
                      background: `linear-gradient(135deg, ${v.color}12, ${v.color}22)`,
                    }}
                  >
                    <span role="img" aria-label={v.label}>{v.icon}</span>
                  </div>
                  <h3 className="ab-vision-label">{v.label}</h3>
                  <p className="ab-vision-text">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OUR PARTNERS */}
        {/* <section className="ab-partners" id="partners">
          <div className="container">
            <h3 className="ab-aff-heading">Our Partners</h3>
            <div className="ab-full-img"><img src="/Assets/public_assets/images/brand2.png" alt="Partners" /></div>
          </div>
        </section>

        SAMSUNG
        <section className="ab-samsung">
          <div className="container">
            <div className="ab-samsung-grid">
              <div className="ab-samsung-text">
                <span className="ab-tag ab-tag--dark">Partnership Highlight</span>
                <p>Partnered with Telecom Sector Skill Council to establish <strong>Samsung Innovation Campus</strong> in Private and Govt Universities.</p>
                <p>The Samsung Innovation Campus is a global CSR program equipping youth with essential skills in <strong>AI, IoT, Big Data, and Coding</strong>, as well as crucial soft skills for the Fourth Industrial Revolution.</p>
              </div>
              <div className="ab-samsung-img">
                <img src="/Assets/public_assets/images/college.png" alt="Samsung Innovation Campus" />
              </div>
            </div>
          </div>
        </section> */}

        {/* ECOSYSTEM */}
        <section className="ab-eco">
          <div className="ab-eco-orb ab-eco-orb-1" />
          <div className="ab-eco-orb ab-eco-orb-2" />
          <div className="container" style={{ position: "relative" }}>
            <div className="ab-sec-hd">
              <span className="ab-tag">Our Ecosystem</span>
              <h2 className="ab-sec-title">
                One Vision.{" "}
                <span className="ab-grad">Three Strategic Verticals.</span>
              </h2>
              <p className="ab-eco-sub">
                A future-tech driven socio-economic impact ecosystem at the intersection of{" "}
                <strong>education, skilling, innovation, sustainability, and community transformation.</strong>
              </p>
            </div>

            <div className="ab-eco-grid">
              {ecoCards.map((card, i) => (
                <div className="ab-eco-card" key={i} style={{ "--eco-c": card.color }}>
                  <div className="ab-eco-card-header">
                    <span className="ab-eco-num">{card.num}</span>
                    <span className="ab-eco-card-icon">{card.icon}</span>
                    <div>
                      <h3 className="ab-eco-card-title">{card.title}</h3>
                      <span className="ab-eco-company">{card.company}</span>
                    </div>
                  </div>
                  <div className="ab-eco-banner" style={{ background: card.bg }}>
                    <span style={{ fontSize: "1.5rem" }}>{card.emoji}</span>
                    <p>{card.caption}</p>
                  </div>
                  <div className="ab-eco-body">
                    <p className="ab-eco-focus-lbl">Key Focus Areas</p>
                    <ul className="ab-eco-list">
                      {card.items.map((item, j) => <li key={j}>{item}</li>)}
                    </ul>
                    <div className="ab-eco-impact">
                      <span className="ab-eco-impact-icon" style={{ background: card.color }}>{card.impactIcon}</span>
                      <div>
                        <strong>{card.impactIcon} Impact Focus</strong>
                        <p>{card.impact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Bar */}
            <div className="ab-stats">
              {stats.map((s, i) => (
                <div className="ab-stat" key={i}>
                  <span className="ab-stat-icon">{s.icon}</span>
                  <span className="ab-stat-num">{s.num}</span>
                  <span className="ab-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Ecosystem CTA */}
            <div className="ab-eco-cta">
              <div className="ab-eco-cta-left">
                <div className="ab-eco-cta-badge">👥</div>
                <h3>One Ecosystem.<br /><span className="ab-grad">Limitless Impact.</span></h3>
              </div>
              <p className="ab-eco-cta-mid">Three specialized verticals working together to build a future-ready, skilled, inclusive and sustainable Bharat.</p>
              <button
                type="button"
                className="ab-cta-btn"
                data-bs-toggle="modal"
                data-bs-target="#partnerModal"
              >
                <span>✉️ Partner With Us</span>
              </button>
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section className="ab-team-section" id="focalytTeam">
          <div className="container">
            <div className="ab-sec-hd">
              <div className="ab-tag-pink">Our Team</div>
              <h2 className="ab-sec-title">
                The Leaders Driving{" "}
                <span className="ab-grad">Future-Tech Impact</span>
              </h2>
              <p className="ab-team-sub">
                Focalyt is led by visionary leaders and domain experts committed to building future-ready ecosystems in Skills, Schools, MSME and Environment for a stronger and sustainable Bharat.
              </p>
            </div>

            <SectionDivider label="Founders" />

            <div className="ab-founders-grid" id="fsd">
              {founders.map((f, i) => {
                const hasPhoto = Boolean(f.image?.fileURL);
                const color = f.color || ["#1ba7ff", "#fc2b5a", "#7c3aed"][i % 3];
                const theme = getFounderTheme(color);
                const photoSrc = hasPhoto ? teamPhotoUrl(f.image.fileURL) : "";
                return (
                  <div
                    className="ab-founder-card"
                    key={f._id || f.name || i}
                    style={{ "--f-dot": theme.dot }}
                  >
                    <div className="ab-founder-photo-area">
                      {hasPhoto ? (
                        <img
                          src={photoSrc}
                          alt={f.name}
                          width={480}
                          height={320}
                          loading="eager"
                          decoding="async"
                          draggable={false}
                        />
                      ) : (
                        <div className="ab-founder-placeholder-bg">
                          <span role="img" aria-hidden="true">👤</span>
                        </div>
                      )}
                    </div>

                    <div className="ab-founder-sheet">
                      {f.emoji ? (
                        <div
                          className="ab-founder-emoji-circle"
                          style={{ background: theme.badge }}
                        >
                          <span role="img" aria-hidden="true">{f.emoji}</span>
                        </div>
                      ) : null}
                      <h3 className="ab-founder-name">{toDisplayName(f.name)}</h3>
                      <p className="ab-founder-role-text">{f.role}</p>
                      <ul className="ab-founder-pts">
                        {(f.points || []).map((pt, j) => (
                          <li key={j}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <LinkedInBtn color={theme.footer} href={f.linkedin || "#"} />
                  </div>
                );
              })}
            </div>

            <SectionDivider label="Core Leadership Team" />

            <div className="ab-core-grid ab-core-grid--team">
              {coreTeam.map((m, i) => {
                const hasPhoto = Boolean(m.image?.fileURL);
                const roleLabel = m.designation || m.position || m.role;
                const desc = m.description || m.desc;
                return (
                  <div className="ab-core-card" key={m._id || m.name || i}>
                    <div className="ab-core-avatar">
                      {hasPhoto ? (
                        <img
                          src={teamPhotoUrl(m.image.fileURL)}
                          alt={m.name}
                          width={176}
                          height={176}
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                      ) : (
                        <div className="ab-core-placeholder">
                          <span role="img" aria-hidden="true">{m.icon || "👤"}</span>
                        </div>
                      )}
                      <div className="ab-core-star" aria-hidden="true">⭐</div>
                    </div>
                    <p className="ab-core-name">{toDisplayName(m.name)}</p>
                    <p className="ab-core-role">{roleLabel}</p>
                    {desc ? <p className="ab-core-desc">{desc}</p> : null}
                  </div>
                );
              })}
            </div>

            <div className="ab-quote-bar">
              <span className="ab-quote-mark" aria-hidden="true">"</span>
              <p className="ab-quote-text">
                A passionate team committed to empowering lives, building skills and creating a future-ready Bharat.
              </p>
            </div>
          </div>
        </section>

        {/* GOVT PROJECTS */}
        {/* <section className="ab-white-sec">
          <div className="container">
            <h3 className="ab-aff-heading">Key Govt. Projects and Clients</h3>
            <div className="ab-full-img"><img src="/Assets/public_assets/images/brand3.png" alt="" /></div>
            <div className="ab-full-img"><img src="/Assets/public_assets/images/brand4.png" alt="" /></div>
            <div className="ab-aff-row" style={{ marginTop: "16px" }}>
              <div className="ab-aff-logo"><img src="/Assets/public_assets/images/odisha.png" alt="Odisha" /></div>
              <div className="ab-aff-logo"><img src="/Assets/public_assets/images/skilledinodisha.png" alt="Skilled in Odisha" /></div>
            </div>
          </div>
        </section> */}

        {/* TRAINING CENTRES */}
        {/* <section className="ab-dark-sec">
          <div className="container">
            <h3 className="ab-dark-title">Training Centres</h3>
            <div className="ab-photo-grid ab-photo-grid--3">
              {[{img:"Ghaziabad.jpg",name:"Ghaziabad"},{img:"Hamirpur.jpg",name:"Hamirpur"},{img:"Shahpur.jpg",name:"Shahpur"}].map((c,i)=>(
                <div className="ab-photo-card" key={i}>
                  <figure><img src={`/Assets/public_assets/images/${c.img}`} alt={c.name} /></figure>
                  <h4 className="ab-photo-name">{c.name}</h4>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* HOSTEL */}
        {/* <section className="ab-white-sec">
          <div className="container">
            <h3 className="ab-light-title">Hostel Facilities</h3>
            <div id="hostel-slider">
              <div className="sl-imgs">
                {hostelImgs.map((img, i) => (
                  <div key={i}><img src={`/Assets/public_assets/images/${img}`} className="ab-sl-img" alt="" /></div>
                ))}
              </div>
            </div>
          </div>
        </section> */}

        </div>

        {/* ALL STYLES */}
        <style>{`

/* PAGE — Sky Magenta (matches HomePage) */
.foc-about-page {
  background: var(--foc-color-bg);
  color: var(--foc-color-text);
  min-height: 100%;
}

/* GLOBAL */
.ab-grad {
  background: linear-gradient(90deg, var(--foc-cyan), var(--foc-magenta));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.ab-eyebrow {
  display: inline-block;
  font-family: var(--foc-font-sans);
  font-size: var(--foc-text-xs);
  font-weight: var(--foc-weight-bold);
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--foc-pink);
  margin-bottom: 12px;
}
.ab-tag {
  display: inline-block;
  font-family: var(--foc-font-sans);
  font-size: var(--foc-text-xs);
  font-weight: var(--foc-weight-bold);
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--foc-cyan);
  margin-bottom: 8px;
}
.ab-tag--pink { color: var(--foc-pink); }
.ab-tag--dark { color: var(--foc-navy); }

.ab-sec-hd { text-align: center; margin-bottom: var(--foc-space-12); }
.ab-sec-title {
  font-family: var(--foc-font-display);
  font-size: clamp(1.6rem, 4vw, var(--foc-text-3xl));
  font-weight: var(--foc-weight-black);
  color: var(--foc-color-text-strong);
  line-height: var(--foc-leading-tight);
  margin: 0 0 var(--foc-space-4) 0;
}
.ab-full-img { margin-bottom: var(--foc-space-4); }
.ab-full-img img { width: 100%; display: block; }

/* HERO */
.ab-hero {
  background: var(--foc-color-bg);
  padding: 80px 0 70px;
  margin-top:70px;
  position: relative;
  overflow: hidden;
}
.ab-hero-glow { position: absolute; border-radius: 50%; pointer-events: none; }
.ab-hero-glow-1 {
  top: -180px; right: -140px; width: 560px; height: 560px;
  background: radial-gradient(circle, rgba(255,45,170,.14) 0%, transparent 68%);
}
.ab-hero-glow-2 {
  bottom: -100px; left: -80px; width: 380px; height: 380px;
  background: radial-gradient(circle, rgba(27,167,255,.14) 0%, transparent 65%);
}
.ab-hero-logos { display: flex; align-items: center; justify-content: center; gap: 48px; margin-bottom: 48px; }
.ab-hero-logo img { width: 130px; display: block; }
.ab-hero-sep { width: 1px; height: 52px; background: var(--foc-color-border); }
.ab-hero-content { text-align: center; max-width: 820px; margin: 0 auto; }
.ab-hero-title {
  font-family: var(--foc-font-display);
  font-size: clamp(1.55rem, 4.5vw, 2.9rem);
  font-weight: var(--foc-weight-black);
  color: var(--foc-color-text);
  line-height: var(--foc-leading-tight);
  margin: 0 0 var(--foc-space-6) 0;
}
.ab-hero-body {
  font-family: var(--foc-font-sans);
  font-size: var(--foc-text-md);
  color: var(--foc-color-text-muted);
  line-height: var(--foc-leading-relaxed);
  max-width: 660px; margin: 0 auto;
}

/* KEY AREAS */
.ab-areas { background: var(--foc-color-bg-alt); padding: 64px 0; }
.ab-areas-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: var(--foc-space-6); }
.ab-area-card {
  background: linear-gradient(135deg, var(--foc-cyan) 0%, var(--foc-magenta) 100%);
  border-radius: 35px 25px 35px 25px;
  padding: 32px 20px; text-align: center;
  box-shadow: 0 10px 32px rgba(27,167,255,.18);
  transition: transform .3s var(--foc-ease), box-shadow .3s var(--foc-ease);
  height: 100%;
}
.ab-area-card:hover { transform: translateY(-10px); box-shadow: 0 20px 48px rgba(255,45,170,.16); }
.ab-area-ring {
  width: 80px; height: 80px; border-radius: 50%; background: #fff;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
}
.ab-area-ring img { width: 44px; height: 44px; object-fit: contain; }
.ab-area-card h4 {
  font-family: var(--foc-font-sans); font-size: var(--foc-text-base);
  font-weight: var(--foc-weight-bold); color: #fff;
  text-transform: uppercase; line-height: 1.4; margin: 0;
}

/* AFFILIATED / PARTNER SECTIONS */
.ab-aff-section, .ab-partners, .ab-white-sec { background: var(--foc-color-bg); padding: 48px 0; }
.ab-aff-heading {
  font-family: var(--foc-font-display); font-size: var(--foc-text-2xl);
  font-weight: var(--foc-weight-bold);
  background: linear-gradient(90deg, var(--foc-cyan), var(--foc-magenta));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  text-align: center; margin-bottom: var(--foc-space-8);
}
.ab-aff-row { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 24px; }
.ab-aff-logo img {
  width: 120px; height: auto; object-fit: contain;
  transition: transform .25s var(--foc-ease), filter .25s var(--foc-ease); filter: grayscale(15%);
}
.ab-aff-logo img:hover { transform: scale(1.07); filter: grayscale(0%); }

/* VISION */
.ab-vision-section {
  padding: 24px 0 20px;
  margin-top: 130px;
  background: #f8faff;
  position: relative;
  overflow: hidden;
}
.ab-vision-section::before {
  content: '';
  position: absolute;
  top: -100px; right: -100px;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(27,167,255,.10) 0%, transparent 65%);
  border-radius: 50%;
  pointer-events: none;
}
.ab-vision-section::after {
  content: '';
  position: absolute;
  bottom: -80px; left: -80px;
  width: 340px; height: 340px;
  background: radial-gradient(circle, rgba(252,43,90,.08) 0%, transparent 65%);
  border-radius: 50%;
  pointer-events: none;
}
.ab-vision-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; position: relative; }
.ab-vision-card {
  background: #fff;
  border-radius: 16px;
  border: 1.5px solid #e8f0fe;
  padding: 20px 18px 18px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(11,31,75,.07);
  transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
  position: relative;
  overflow: hidden;
}
.ab-vision-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #1ba7ff, #fc2b5a);
}
.ab-vision-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 48px rgba(27,167,255,.14);
  border-color: rgba(27,167,255,.3);
}
.ab-vision-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8f4ff, #f0e8ff);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-size: 1.4rem;
  box-shadow: 0 2px 10px rgba(27,167,255,.12);
}
.ab-vision-label {
  font-family: var(--foc-font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: #0b1f4b;
  margin: 0 0 6px;
}
.ab-vision-text {
  font-family: var(--foc-font-sans);
  font-size: 13px;
  color: #5a6a8a;
  line-height: 1.55;
  margin: 0;
}

/* SAMSUNG */
.ab-samsung { background: var(--foc-color-bg); padding: 64px 0; }
.ab-samsung-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
.ab-samsung-text p {
  font-family: var(--foc-font-sans); font-size: var(--foc-text-md);
  color: var(--foc-color-text-body); line-height: var(--foc-leading-relaxed); margin-bottom: 16px;
}
.ab-samsung-text strong { color: var(--foc-navy); }
.ab-samsung-img img { width: 100%; border-radius: var(--foc-radius-xl); box-shadow: var(--foc-shadow-card); }

/* ECOSYSTEM */
.ab-eco { background: var(--foc-color-bg); padding: 15px 0; position: relative; overflow: hidden; }
.ab-eco-orb { position: absolute; border-radius: 50%; pointer-events: none; }
.ab-eco-orb-1 {
  top: -200px; right: -160px; width: 580px; height: 580px;
  background: radial-gradient(circle, rgba(27,167,255,.12) 0%, transparent 65%);
}
.ab-eco-orb-2 {
  bottom: -180px; left: -120px; width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(255,45,170,.10) 0%, transparent 65%);
}
.ab-eco-sub {
  font-family: var(--foc-font-sans); font-size: var(--foc-text-base);
  color: var(--foc-color-text-muted); margin: 0 auto; line-height: var(--foc-leading-relaxed);
}
.ab-eco-sub strong { color: var(--foc-color-text); }

.ab-eco-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; margin-bottom: 32px; }
.ab-eco-card {
  background: var(--foc-color-surface);
  border: 1.5px solid var(--foc-color-border);
  border-top: 3px solid var(--eco-c, #1ba7ff);
  border-radius: var(--foc-radius-xl);
  overflow: hidden; display: flex; flex-direction: column;
  box-shadow: var(--foc-shadow-card);
  transition: transform .3s var(--foc-ease), box-shadow .3s var(--foc-ease);
  animation: abFadeUp .55s ease both;
}
.ab-eco-card:nth-child(1){animation-delay:.05s}
.ab-eco-card:nth-child(2){animation-delay:.13s}
.ab-eco-card:nth-child(3){animation-delay:.21s}
.ab-eco-card:hover { transform: translateY(-7px); box-shadow: 0 22px 52px rgba(27,167,255,.12); }
.ab-eco-card-header { padding: 18px 18px 14px; display: flex; align-items: flex-start; gap: 12px; }
.ab-eco-num {
  font-size: var(--foc-text-xs); font-weight: var(--foc-weight-extrabold);
  letter-spacing: .08em; padding: 4px 8px; border-radius: 6px;
  background: rgba(27,167,255,.08); color: var(--eco-c, #1ba7ff); flex-shrink: 0;
}
.ab-eco-card-icon { font-size: 1.55rem; flex-shrink: 0; margin-top: 2px; }
.ab-eco-card-title {
  font-family: var(--foc-font-sans); font-size: var(--foc-text-sm);
  font-weight: var(--foc-weight-bold); color: var(--foc-color-text); line-height: 1.35; margin: 0 0 4px 0;
}
.ab-eco-company { font-size: var(--foc-text-xs); font-weight: var(--foc-weight-semibold); color: var(--eco-c, #1ba7ff); }
.ab-eco-banner { display: flex; align-items: center; gap: 12px; padding: 12px 18px; }
.ab-eco-banner p { font-size: var(--foc-text-xs); color: rgba(255,255,255,.92); line-height: 1.45; margin: 0; }
.ab-eco-body { padding: 16px 18px; flex: 1; display: flex; flex-direction: column; gap: 14px; }
.ab-eco-focus-lbl {
  font-size: var(--foc-text-xs); font-weight: var(--foc-weight-extrabold);
  letter-spacing: .1em; text-transform: uppercase; color: var(--eco-c, #1ba7ff); margin: 0;
}
.ab-eco-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; }
.ab-eco-list li {
  font-size: 11.5px; color: var(--foc-color-text-muted); line-height: 1.4;
  padding-left: 13px; position: relative;
}
.ab-eco-list li::before { content: "›"; position: absolute; left: 0; color: var(--eco-c, #1ba7ff); font-weight: var(--foc-weight-bold); }
.ab-eco-impact {
  display: flex; align-items: flex-start; gap: 12px;
  background: var(--foc-color-surface-2); border-radius: var(--foc-radius-md);
  padding: 12px 14px; margin-top: auto;
}
.ab-eco-impact-icon {
  width: 32px; height: 32px; min-width: 32px;
  border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: .95rem;
}
.ab-eco-impact strong {
  display: block; font-size: 10px; font-weight: var(--foc-weight-extrabold);
  letter-spacing: .08em; text-transform: uppercase; color: var(--eco-c, #1ba7ff); margin-bottom: 3px;
}
.ab-eco-impact p { font-size: 11px; color: var(--foc-color-text-muted); line-height: 1.45; margin: 0; }

/* STATS */
.ab-stats {
  background: var(--foc-color-surface); border: 1px solid var(--foc-color-border);
  border-radius: var(--foc-radius-xl); padding: 28px 32px;
  display: grid; grid-template-columns: repeat(6,1fr); gap: 16px;
  margin-bottom: 24px; text-align: center;
  box-shadow: var(--foc-shadow-card);
}
.ab-stat { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.ab-stat-icon { font-size: 1.4rem; margin-bottom: 4px; }
.ab-stat-num { font-family: var(--foc-font-display); font-size: var(--foc-text-xl); font-weight: var(--foc-weight-extrabold); color: var(--foc-color-text-strong); white-space: nowrap; }
.ab-stat-lbl { font-size: var(--foc-text-xs); color: var(--foc-color-text-muted); line-height: 1.3; }

/* ECO CTA */
.ab-eco-cta {
  display: grid; grid-template-columns: auto 1fr auto; gap: 32px;
  align-items: center; background: var(--foc-color-surface);
  border: 1.5px solid var(--foc-color-border); border-radius: var(--foc-radius-xl); padding: 24px 32px;
  box-shadow: var(--foc-shadow-card);
}
.ab-eco-cta-left { display: flex; align-items: center; gap: 16px; }
.ab-eco-cta-badge {
  width: 52px; height: 52px; min-width: 52px; border-radius: 50%;
  background: linear-gradient(135deg, var(--foc-cyan), var(--foc-magenta));
  display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
}
.ab-eco-cta-left h3 {
  font-family: var(--foc-font-display); font-size: var(--foc-text-xl);
  font-weight: var(--foc-weight-black); color: var(--foc-color-text); margin: 0; line-height: 1.25;
}
.ab-eco-cta-mid { font-family: var(--foc-font-sans); font-size: var(--foc-text-sm); color: var(--foc-color-text-muted); line-height: var(--foc-leading-relaxed); margin: 0; }
.ab-cta-btn {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: linear-gradient(90deg, var(--foc-cyan), var(--foc-magenta)); color: #fff; border: none;
  border-radius: var(--foc-radius-md); padding: 14px 24px;
  font-family: var(--foc-font-sans); font-size: var(--foc-text-sm);
  font-weight: var(--foc-weight-bold); cursor: pointer; white-space: nowrap;
  transition: transform .2s var(--foc-ease), box-shadow .2s var(--foc-ease);
  box-shadow: 0 14px 34px rgba(27,167,255,.18);
}
.ab-cta-btn small { font-size: var(--foc-text-xs); font-weight: var(--foc-weight-normal); opacity: .82; }
.ab-cta-btn:hover { transform: scale(1.03); box-shadow: 0 18px 46px rgba(255,45,170,.16); }

/* TEAM */
.ab-team-section {
  padding: 72px 0;
  background: #fff;
  position: relative;
  overflow: hidden;
}
.ab-team-section::before {
  content: '';
  position: absolute;
  bottom: -80px; left: -60px;
  width: 360px; height: 360px;
  background: radial-gradient(circle, rgba(124,58,237,.05) 0%, transparent 65%);
  border-radius: 50%;
  pointer-events: none;
}
.ab-tag-pink {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #fc2b5a;
  margin-bottom: 8px;
}
.ab-team-sub {
  font-family: var(--foc-font-sans);
  font-size: 15px;
  color: #5a6a8a;
  line-height: 1.7;
  // max-width: 640px;
  margin: 0 auto;
}

/* Divider */
.ab-divider { display: flex; align-items: center; gap: 16px; margin: 40px 0 32px; }
.ab-divider-line { flex: 1; height: 1.5px; background: linear-gradient(90deg, transparent, #e2e8f0); }
.ab-divider-line:last-child { background: linear-gradient(90deg, #e2e8f0, transparent); }
.ab-divider-tag {
  padding: 7px 24px;
  background: linear-gradient(90deg, #1ba7ff, #fc2b5a);
  color: #fff;
  border-radius: 100px;
  font-family: var(--foc-font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Founders */
.ab-founders-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.ab-founder-card {
  background: #fff;
  border-radius: 20px;
  border: 1.5px solid #e8f0fe;
  box-shadow: 0 4px 20px rgba(11,31,75,.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow .3s ease;
  animation: abFadeUp .45s ease both;
  -webkit-font-smoothing: antialiased;
}
.ab-founder-card:nth-child(1){animation-delay:.05s}
.ab-founder-card:nth-child(2){animation-delay:.12s}
.ab-founder-card:nth-child(3){animation-delay:.19s}
.ab-founder-card:hover {
  box-shadow: 0 20px 48px rgba(11,31,75,.14);
}
.ab-founder-photo-area {
  position: relative;
  height: 280px;
  overflow: hidden;
  flex-shrink: 0;
  background: #e8eef8;
}
.ab-founder-photo-area img {
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  object-position: center 12%;
  display: block;
  image-rendering: auto;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
.ab-founder-placeholder-bg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f4ff 0%, #f0e8ff 100%);
  font-size: 5rem;
}
.ab-founder-sheet {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 34px 22px 22px;
  background: #fff;
}
.ab-founder-sheet:not(:has(.ab-founder-emoji-circle)) {
  padding-top: 22px;
}
.ab-founder-emoji-circle {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 4px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  line-height: 1;
  box-shadow: 0 4px 16px rgba(11, 31, 75, 0.18);
  z-index: 2;
}
.ab-founder-name {
  font-family: var(--foc-font-display), Orbitron, sans-serif;
  font-size: 1.2rem;
  font-weight: 800;
  color: #0b1f4b;
  margin: 0 0 6px;
  line-height: 1.25;
  letter-spacing: 0.01em;
}
.ab-founder-role-text {
  font-family: var(--foc-font-sans);
  font-size: 12px;
  font-weight: 700;
  color: #fc2b5a;
  margin: 0 0 16px;
  line-height: 1.35;
}
.ab-founder-desc {
  font-family: var(--foc-font-sans);
  font-size: 13px;
  color: #5a6a8a;
  line-height: 1.65;
  margin: 0;
  width: 100%;
  text-align: left;
}
.ab-founder-pts {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}
.ab-founder-pts li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-family: var(--foc-font-sans);
  font-size: 13px;
  color: #5a6a8a;
  line-height: 1.6;
}
.ab-founder-pts li::before {
  content: "•";
  color: var(--f-dot, #0b1f4b);
  font-size: 1.1rem;
  line-height: 1.35;
  flex-shrink: 0;
  font-weight: 700;
}
.ab-founder-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  font-family: var(--foc-font-sans);
  transition: opacity 0.2s ease, filter 0.2s ease;
  flex-shrink: 0;
  border: none;
  border-radius: 0;
}
.ab-founder-footer:hover {
  opacity: 0.92;
  color: #fff;
  filter: brightness(1.05);
}

/* Core Grid — team section */
.ab-core-grid--team {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 36px;
}
.ab-core-grid--team .ab-core-card {
  background: #fff;
  border-radius: 16px;
  border: 1.5px solid #e8f0fe;
  box-shadow: 0 2px 12px rgba(11,31,75,.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 14px 18px;
  text-align: center;
  transition: box-shadow .25s ease;
  animation: abFadeUp .45s ease both;
  min-width: 0;
}
.ab-core-grid--team .ab-core-card:hover {
  box-shadow: 0 14px 32px rgba(11,31,75,.12);
}
.ab-core-avatar {
  position: relative;
  margin-bottom: 12px;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
}
.ab-core-avatar img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 15%;
  border: 3px solid #e8f0fe;
  display: block;
  image-rendering: auto;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
.ab-core-star {
  position: absolute;
  bottom: 1px; right: 1px;
  width: 22px; height: 22px;
  background: #fc2b5a;
  border-radius: 50%;
  border: 2px solid #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px;
}
.ab-core-placeholder {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 3px solid #e8f0fe;
  background: linear-gradient(135deg, #e8f4ff, #f0e8ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
}
.ab-core-grid--team .ab-core-name {
  font-family: var(--foc-font-sans);
  font-size: 13px;
  font-weight: 700;
  color: #0b1f4b;
  line-height: 1.3;
  margin: 0 0 3px;
}
.ab-core-grid--team .ab-core-role {
  font-family: var(--foc-font-sans);
  font-size: 10.5px;
  font-weight: 600;
  color: #fc2b5a;
  text-transform: uppercase;
  letter-spacing: .04em;
  line-height: 1.35;
  margin: 0 0 6px;
}
.ab-core-grid--team .ab-core-desc {
  font-size: 11.5px;
  color: #7a8aaa;
  line-height: 1.5;
  margin: 0;
}

/* Quote */
.ab-quote-bar {
  background: linear-gradient(135deg, #0b1f4b 0%, #1a2f6b 100%);
  border-radius: 16px;
  padding: 28px 40px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 8px;
}
.ab-quote-bar .ab-quote-mark {
  font-family: Georgia, serif;
  font-size: 68px;
  color: #fc2b5a;
  line-height: .7;
  flex-shrink: 0;
  margin-top: -8px;
}
.ab-quote-text {
  font-family: var(--foc-font-sans);
  font-size: 1.05rem;
  font-weight: 500;
  color: rgba(255,255,255,.95);
  line-height: 1.65;
  font-style: italic;
  margin: 0;
}

/* ALT / LIGHT SECTIONS */
.ab-dark-sec { background: var(--foc-color-bg-alt); padding: 48px 0 40px; }
.ab-dark-title, .ab-light-title {
  font-family: var(--foc-font-display); font-size: var(--foc-text-2xl); font-weight: var(--foc-weight-bold);
  background: linear-gradient(90deg, var(--foc-cyan), var(--foc-magenta));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  text-align: center; padding-block: 20px; margin: 0;
}

/* PHOTO GRID */
.ab-photo-grid { display: grid; gap: 20px; }
.ab-photo-grid--2 { grid-template-columns: repeat(2,1fr); }
.ab-photo-grid--3 { grid-template-columns: repeat(3,1fr); }
.ab-photo-grid--4 { grid-template-columns: repeat(4,1fr); }
.ab-photo-card {
  text-align: center; background: var(--foc-color-surface);
  border: 1px solid var(--foc-color-border);
  border-radius: var(--foc-radius-xl); box-shadow: var(--foc-shadow-md);
  padding: 12px 12px 16px; transition: transform .28s var(--foc-ease), box-shadow .28s var(--foc-ease);
  overflow: hidden;
}
.ab-white-sec .ab-photo-card { background: var(--foc-color-surface); }
.ab-photo-card:hover { transform: translateY(-8px); box-shadow: 0 16px 40px rgba(27,167,255,.12); }
.ab-photo-card figure { margin: 0; padding: 0; }
.ab-photo-card figure img { width: 100%; border-radius: var(--foc-radius-md); display: block; }
.ab-photo-name { margin-top: 12px; font-family: var(--foc-font-sans); font-size: var(--foc-text-sm); font-weight: var(--foc-weight-bold); color: var(--foc-color-text); text-transform: uppercase; line-height: 1.35; }

/* SLIDERS */
.ab-sl-img { border-radius: var(--foc-radius-xl); padding: 8px; width: 100%; }
.slick-dots li button:before { color: var(--foc-color-text-muted) !important; }
.slick-dots li.slick-active button:before { color: var(--foc-cyan) !important; }
.slick-prev, .slick-next {
  width: 40px !important; height: 40px !important;
  background: linear-gradient(90deg, var(--foc-cyan), var(--foc-magenta)) !important;
  border-radius: 50% !important; z-index: 10 !important;
}

/* ANIMATION */
@keyframes abFadeUp { from { opacity: 0; } to { opacity: 1; } }

/* RESPONSIVE */
@media (max-width:1100px){
  .ab-core-grid--team { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width:1024px){
  .ab-eco-grid { grid-template-columns:1fr }
  .ab-stats { grid-template-columns:repeat(3,1fr) }
  .ab-eco-cta { grid-template-columns:1fr; text-align:center }
  .ab-eco-cta-left { justify-content:center }
  .ab-founders-grid { grid-template-columns:1fr 1fr }
  .ab-core-grid--team { grid-template-columns:repeat(3,1fr) }
}
@media (max-width:900px){
  .ab-founders-grid { grid-template-columns: 1fr 1fr; }
  .ab-core-grid--team { grid-template-columns: repeat(3, 1fr); }
  .ab-vision-grid { grid-template-columns: 1fr; }
}
@media (max-width:768px){
  .ab-hero-logos { flex-direction:column; gap:20px }
  .ab-hero-sep { width:50px; height:1px }
  .ab-areas-grid { grid-template-columns:repeat(2,1fr) }
  .ab-vision-grid { grid-template-columns:1fr }
  .ab-samsung-grid { grid-template-columns:1fr }
  .ab-founders-grid { grid-template-columns:1fr }
  .ab-core-grid--team { grid-template-columns:repeat(2,1fr) }
  .ab-stats { grid-template-columns:repeat(2,1fr) }
  .ab-photo-grid--4 { grid-template-columns:repeat(2,1fr) }
  .ab-photo-grid--3 { grid-template-columns:repeat(2,1fr) }
  .ab-photo-grid--2 { grid-template-columns:1fr }
  .ab-quote-bar { flex-direction:column; padding:24px }
  .ab-eco-cta { padding:20px }
}
@media (max-width:640px){
  .ab-founders-grid { grid-template-columns: 1fr; }
  .ab-core-grid--team { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width:480px){
  .ab-areas-grid { grid-template-columns:1fr }
  .ab-core-grid--team { grid-template-columns:1fr 1fr }
  .ab-photo-grid--3,.ab-photo-grid--4 { grid-template-columns:1fr }
  .ab-eco-list { grid-template-columns:1fr }
  .ab-stats { grid-template-columns:repeat(2,1fr) }
}
@media (max-width:400px){
  .ab-core-grid--team { grid-template-columns: 1fr 1fr; }
}

        `}</style>

      </FrontLayout>
    </>
  );
}

export default About;