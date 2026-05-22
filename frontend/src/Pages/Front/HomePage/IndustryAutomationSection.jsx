import { useState, useEffect, useRef, useCallback } from "react";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap');

.ia, .ia *, .ia *::before, .ia *::after { box-sizing: border-box; }

.ia {
  font-family: 'Inter', sans-serif;
  --navy: #0d2146;
  --navy2: #0a2240;
  --teal: #0e7c6b;
  --green: #16a34a;
  --blue: #1565c0;
  --purple: #6a1f9a;
  --orange: #e65100;
  --bg: #fff;
  --cream: #f1f5f9;
  --surface: #fff;
  --brd: #e2e8f0;
  --t1: #0d2146;
  --t2: #334155;
  --t3: #475569;
  background: #fff;
  color: var(--t1);
  overflow-x: hidden;
  overflow: hidden;
  position: relative;
  z-index: 1;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.1), 0 2px 8px rgba(15, 23, 42, 0.06);
}

.ia-wrap { max-width: 1240px; margin: 0 auto; padding: 0 48px; position: relative; z-index: 1; }
@media (max-width: 768px) { .ia-wrap { padding: 0 20px; } }

@keyframes iaFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes iaFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes iaFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes iaSpin { to { transform: rotate(360deg); } }
@keyframes iaPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes iaBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes iaWaveBar { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }

.ia .float { animation: iaFloat 3.4s ease-in-out infinite; }
.ia .pulse { animation: iaPulse 2.4s ease-in-out infinite; }
.ia .spin-cw { animation: iaSpin 22s linear infinite; }
.ia .spin-ccw { animation: iaSpin 28s linear infinite reverse; }
.ia .spin-med { animation: iaSpin 14s linear infinite; }
.ia .blink { animation: iaBlink 1.4s ease-in-out infinite; }

.ia .rev, .ia .rev-l, .ia .rev-r {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.75s ease, transform 0.75s ease;
}
.ia .rev-l { transform: translateX(-24px); }
.ia .rev-r { transform: translateX(24px); }
.ia .rev.on, .ia .rev-l.on, .ia .rev-r.on { opacity: 1; transform: none; }

.ia-hero {
  background: #fff;
  border: none;
  border-bottom: 1px solid var(--brd);
  border-radius: 0;
  padding: 24px 0 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
}
.ia-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.ia-eyebrow-line { width: 48px; height: 2px; background: var(--teal); }
.ia-eyebrow-text { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--teal); }
.ia-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, var(--navy), #163565);
  color: #fff; font-size: 10px; font-weight: 800; letter-spacing: 2px;
  text-transform: uppercase; padding: 6px 16px; border-radius: 50px;
  margin-bottom: 16px;
}
.ia-h1 { font-family: 'Orbitron', monospace; font-size: clamp(28px, 3.8vw, 48px); font-weight: 900; line-height: 1.08; color: var(--navy); margin-bottom: 8px; }
.ia-h1-sub { font-family: 'Inter', sans-serif; font-size: clamp(16px, 2vw, 24px); font-weight: 600; color: var(--teal); margin-bottom: 16px; line-height: 1.25; }
.ia-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.ia-tag {
  display: flex; align-items: center; gap: 6px; padding: 5px 12px;
  background: #fff; border: 1px solid var(--brd); border-radius: 6px;
  font-size: 12px; font-weight: 700; color: var(--t2);
}
.ia-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--teal); }
.ia-desc { font-family: 'Inter', sans-serif; font-size: 14px; color: var(--t2); line-height: 1.8; max-width: 480px; margin-bottom: 24px; }
.ia-hero-grid { display: grid; grid-template-columns: 1fr auto; gap: 40px;  }
@media (max-width: 900px) {
  .ia-hero-grid { grid-template-columns: 1fr; }
  .ia-hero-right { justify-self: center; }
}
.ia-pillars { display: flex; flex-wrap: wrap; gap: 16px; }
.ia-pillar { display: flex; align-items: flex-start; gap: 11px; flex: 1 1 140px; min-width: 130px; }
.ia-pillar-ico {
  width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
  background: rgba(14, 124, 107, 0.1); border: 1px solid rgba(14, 124, 107, 0.22);
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.ia-pillar-title { font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 800; color: var(--navy); margin-bottom: 3px; }
.ia-pillar-sub { font-family: 'Inter', sans-serif; font-size: 11.5px; color: var(--t3); line-height: 1.5; }

.ia-orbit-wrap {
  background: #fff; border: 1px solid var(--brd); border-radius: 20px;
  padding: 24px; box-shadow: 0 16px 48px rgba(10, 34, 64, 0.1);
}
.ia-orbit { position: relative; width: 220px; height: 220px; margin: 0 auto; }
.ia-orbit-ring {
  position: absolute; border-radius: 50%; pointer-events: none;
}
.ia-orbit-center {
  position: relative; z-index: 4; width: 76px; height: 76px; border-radius: 50%;
  background: linear-gradient(135deg, var(--navy), #163565);
  border: 2px solid var(--teal);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 8px 28px rgba(13, 33, 70, 0.18);
}
.ia-orbit-center span:first-child { font-size: 8px; font-weight: 700; color: #7ecfc0; letter-spacing: 1.2px; }
.ia-orbit-center span:last-child { font-size: 20px; font-weight: 900; color: #fff; line-height: 1; }
.ia-orbit-node {
  position: absolute; width: 38px; height: 38px; border-radius: 50%;
  background: #fff; border: 1.5px solid rgba(14, 124, 107, 0.35);
  display: flex; align-items: center; justify-content: center; font-size: 16px;
  box-shadow: 0 4px 14px rgba(10, 34, 64, 0.1); cursor: default; z-index: 3;
  transition: transform 0.25s ease, border-color 0.25s ease;
}
.ia-orbit-node:hover { transform: scale(1.12); border-color: var(--teal); }

.ia-stats { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 16px; }
.ia-stat {
  background: #fff; border: 1px solid var(--brd); border-radius: 12px;
  padding: 10px 14px; text-align: center; min-width: 72px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.ia-stat:hover { border-color: var(--teal); box-shadow: 0 6px 20px rgba(14, 124, 107, 0.12); }
.ia-stat-val { font-size: 18px; font-weight: 800; line-height: 1; }
.ia-stat-lbl { font-size: 9.5px; color: var(--t3); font-weight: 700; margin-top: 4px; }

.ia-tech-tiles { display: flex; gap: 10px; justify-content: center; margin-top: 12px; }
.ia-tech-tile {
  width: 84px; padding: 12px 8px; border-radius: 12px;
  background: #fff; border: 1px solid var(--brd); text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.ia-tech-tile:hover { transform: translateY(-6px); box-shadow: 0 12px 28px rgba(13, 33, 70, 0.12); border-color: var(--teal); }
.ia-tech-tile-emoji { font-size: 24px; margin-bottom: 4px; }
.ia-tech-tile-lbl { font-size: 9px; color: var(--teal); font-weight: 700; }

.ia-sec { padding: 15px 0; }
.ia-sec-head {
  font-size: 14px; font-weight: 700; color: var(--navy);
  letter-spacing: 1px; margin-bottom: 24px; padding-bottom: 10px;
  border-bottom: 2px solid var(--teal); display: inline-block;
}
.ia-sec-divider {
  display: flex; align-items: center; gap: 16px; margin-bottom: 28px; justify-content: center;
}
.ia-sec-divider-line { flex: 1; max-width: 90px; height: 2px; background: linear-gradient(90deg, transparent, var(--teal)); }
.ia-sec-divider-text {
  font-family: 'Orbitron', monospace;
  font-size: 12px; font-weight: 800; letter-spacing: 3px;
  text-transform: uppercase; color: var(--teal);
}

.ia-tabs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
.ia-tab {
  font-family: 'Orbitron', monospace;
  display: flex; align-items: center; gap: 8px; padding: 12px 20px;
  border-radius: 50px; border: 2px solid #dce4f5; background: #fff;
  color: #4a5568; font-weight: 700; font-size: 13px; cursor: pointer;
  transition: all 0.25s ease;
}
.ia-tab:hover { transform: translateY(-2px); border-color: #b0c4de; }
.ia-tab.active {
  background: linear-gradient(135deg, var(--navy), #163972);
  color: #fff; border-color: var(--navy);
  box-shadow: 0 8px 24px rgba(13, 33, 70, 0.2);
}

.ia-panel {
  background: #fff; border-radius: 20px; border: 1px solid var(--brd);
  box-shadow: 0 12px 40px rgba(10, 34, 64, 0.08);
  overflow: hidden; display: flex; flex-wrap: wrap;
  animation: iaFadeIn 0.45s ease forwards;
}
.ia-panel-side {
  width: 120px; flex-shrink: 0; background: #f8fafc;
  border-right: 1px solid var(--brd);
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 20px 10px;
}
.ia-panel-side--right { border-right: none; border-left: 1px solid var(--brd); }
.ia-panel-body { flex: 1 1 280px; padding: 28px 26px; }
.ia-panel-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.ia-panel-ico {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 22px;
}
.ia-panel-title { font-family: 'Orbitron', monospace; font-size: 16px; font-weight: 800; line-height: 1.2; color: var(--navy); }
.ia-panel-title span { color: var(--accent, var(--teal)); }
.ia-panel-desc { font-family: 'Inter', sans-serif; font-size: 13.5px; color: var(--t3); line-height: 1.75; margin-bottom: 18px; }
.ia-features { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
@media (max-width: 560px) { .ia-features { grid-template-columns: 1fr; } }
.ia-feat {
  font-family: 'Inter', sans-serif;
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12.5px; font-weight: 500; color: var(--t2); line-height: 1.4;
}
.ia-feat-check {
  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; margin-top: 1px;
}

.ia-benefits-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
}
@media (max-width: 900px) { .ia-benefits-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .ia-benefits-grid { grid-template-columns: 1fr; } }
.ia-benefit {
  background: var(--surface); border: 1px solid var(--brd); border-radius: 14px;
  padding: 22px 18px; display: flex; align-items: flex-start; gap: 14px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}
.ia-benefit:hover {
  border-color: var(--accent, var(--teal));
  box-shadow: 0 8px 24px rgba(14, 124, 107, 0.12);
  transform: translateY(-3px);
}
.ia-benefit-ico {
  width: 50px; height: 50px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 22px;
  border: 1px solid;
}
.ia-benefit-num { font-size: 20px; font-weight: 900; line-height: 1; margin-bottom: 4px; }
.ia-benefit-lbl { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 500; color: var(--t2); line-height: 1.35; }

.ia-dash-panel {
  background: #fff; border: 1px solid var(--brd); border-radius: 20px;
  padding: 32px 28px; box-shadow: 0 12px 40px rgba(10, 34, 64, 0.08);
}
.ia-live-badge {
  display: inline-flex; align-items: center; gap: 7px;
  background: rgba(14, 124, 107, 0.08); border: 1px solid rgba(14, 124, 107, 0.22);
  border-radius: 20px; padding: 6px 14px; font-size: 10px;
  color: var(--teal); font-weight: 800; letter-spacing: 1.5px; margin-bottom: 12px;
}
.ia-live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--teal); }
.ia-dash-title { font-family: 'Orbitron', monospace; font-size: clamp(18px, 2.5vw, 26px); font-weight: 800; color: var(--navy); margin-bottom: 8px; text-align: center; }
.ia-dash-sub { font-family: 'Inter', sans-serif; color: var(--t3); font-size: 13px; text-align: center; margin-bottom: 28px; }
.ia-dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 18px; }
.ia-dash-card {
  background: var(--cream); border: 1px solid var(--brd); border-radius: 14px;
  padding: 18px 16px; transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}
.ia-dash-card:hover { border-color: var(--card-accent, var(--teal)); box-shadow: 0 8px 24px rgba(14, 124, 107, 0.1); transform: translateY(-3px); }
.ia-dash-lbl { font-size: 11px; color: var(--t3); font-weight: 700; margin-bottom: 8px; }
.ia-dash-val { font-size: 26px; font-weight: 800; line-height: 1; transition: opacity 0.3s ease; }
.ia-progress { height: 6px; background: rgba(13, 33, 70, 0.08); border-radius: 3px; margin-top: 10px; overflow: hidden; }
.ia-progress-fill { height: 100%; border-radius: 3px; transition: width 0.9s ease; }
.ia-wave {
  background: var(--cream); border: 1px solid var(--brd); border-radius: 14px;
  padding: 16px 20px; margin-bottom: 20px;
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
}
.ia-wave-bars { display: flex; gap: 3px; align-items: flex-end; height: 36px; flex: 1; min-width: 180px; }
.ia-wave-bar {
  flex: 1; border-radius: 2px;
  background: linear-gradient(to top, var(--teal), #4dd9c7);
  transition: height 0.7s ease;
  animation: iaWaveBar 0.8s ease-in-out infinite;
}
.ia-btn-primary {
  display: inline-flex; align-items: center; gap: 8px; padding: 14px 26px;
  background: linear-gradient(135deg, var(--teal), var(--navy));
  color: #fff; border: none; border-radius: 10px;
  font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
  cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 8px 24px rgba(14, 124, 107, 0.28);
}
.ia-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(14, 124, 107, 0.38); }
.ia-btn-outline {
  display: inline-flex; align-items: center; gap: 8px; padding: 13px 24px;
  background: #fff; color: var(--navy); border: none; border-radius: 8px;
  font-size: 12px; font-weight: 700; cursor: pointer; transition: background 0.2s ease, transform 0.2s ease;
}
.ia-btn-outline:hover { background: #e8f4f0; transform: translateY(-1px); }

.ia-cta {
  background: linear-gradient(135deg, var(--teal) 0%, var(--navy) 100%);
  border-radius: 0 0 20px 20px;
  padding: 36px 44px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 24px; flex-wrap: wrap; margin-bottom: 0;
}
.ia-cta-h { font-family: 'Orbitron', monospace; font-size: clamp(18px, 2.4vw, 24px); font-weight: 800; color: #fff; margin-bottom: 8px; line-height: 1.25; }
.ia-cta-sub { font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(255, 255, 255, 0.7); line-height: 1.6; max-width: 420px; }
.ia-cta-actions { display: flex; flex-wrap: wrap; gap: 12px; flex: 1; justify-content: center; }
.ia-cta-action {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
  background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px; cursor: pointer; flex: 1 1 160px; max-width: 220px;
  transition: background 0.2s ease, transform 0.2s ease;
}
.ia-cta-action:hover { background: rgba(255, 255, 255, 0.16); transform: translateY(-2px); }
.ia-cta-action-ico { font-size: 22px; flex-shrink: 0; }
.ia-cta-action-title { font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.ia-cta-action-sub { font-family: 'Inter', sans-serif; font-size: 10px; color: rgba(255, 255, 255, 0.55); line-height: 1.45; }
@media (max-width: 768px) {
  .ia { border-radius: 16px; }
  .ia-cta { padding: 28px 20px; border-radius: 0 0 16px 16px; }
  .ia-panel-side { width: 100%; flex-direction: row; border-right: none; border-bottom: 1px solid var(--brd); }
  .ia-panel-side--right { border-left: none; border-top: 1px solid var(--brd); border-bottom: none; }
}
`;

function useScrollReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll(".rev,.rev-l,.rev-r");
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => { if (e.isIntersecting) e.target.classList.add("on"); }),
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

function useAnimCounter(target, dur = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let cur = 0;
      const step = target / (dur / 16);
      const t = setInterval(() => {
        cur += step;
        if (cur >= target) { setVal(target); clearInterval(t); }
        else setVal(Math.floor(cur));
      }, 16);
      io.disconnect();
    }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [target, dur]);
  return [val, ref];
}

function Counter({ end, suffix = "", dur = 1600, color }) {
  const [val, ref] = useAnimCounter(end, dur);
  return <span ref={ref} className="ia-stat-val" style={{ color }}>{val}{suffix}</span>;
}

function SectionDivider({ title }) {
  return (
    <div className="ia-sec-divider rev">
      <div className="ia-sec-divider-line" />
      <span className="ia-sec-divider-text">{title}</span>
      <div className="ia-sec-divider-line" style={{ background: "linear-gradient(270deg, transparent, var(--teal))" }} />
    </div>
  );
}

function Orbit40() {
  const ring1 = [
    { emoji: "📡", a: 0, r: 98 },
    { emoji: "🏭", a: 60, r: 98 },
    { emoji: "☁️", a: 120, r: 98 },
    { emoji: "👷", a: 180, r: 98 },
    { emoji: "📊", a: 240, r: 98 },
    { emoji: "🤖", a: 300, r: 98 },
  ];
  const ring2 = [
    { emoji: "🔧", a: 30, r: 62 },
    { emoji: "⚡", a: 150, r: 62 },
    { emoji: "🌐", a: 270, r: 62 },
  ];

  const nodePos = (angle, radius) => {
    const rad = (angle * Math.PI) / 180;
    return {
      left: `calc(50% + ${Math.cos(rad) * radius}px - 19px)`,
      top: `calc(50% + ${Math.sin(rad) * radius}px - 19px)`,
    };
  };

  return (
    <div className="ia-orbit-wrap">
      <div className="ia-orbit">
        <div className="ia-orbit-ring spin-cw" style={{ width: 220, height: 220, top: 0, left: 0, border: "1.5px dashed rgba(14,124,107,.28)" }} />
        <div className="ia-orbit-ring spin-ccw" style={{ width: 150, height: 150, top: 35, left: 35, border: "1.5px solid rgba(21,101,192,.22)" }} />
        <div className="ia-orbit-ring spin-med" style={{ width: 96, height: 96, top: 62, left: 62, border: "1px dotted rgba(14,124,107,.2)" }} />
        <div className="ia-orbit-center" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <span>INDUSTRY</span>
          <span>4.0</span>
        </div>
        {ring1.map((ic, i) => (
          <div key={i} className="ia-orbit-node float" style={{ ...nodePos(ic.a, ic.r), animationDelay: `${i * 0.4}s` }}>{ic.emoji}</div>
        ))}
        {ring2.map((ic, i) => (
          <div key={`i${i}`} className="ia-orbit-node pulse" style={{ ...nodePos(ic.a, ic.r), width: 30, height: 30, fontSize: 13, animationDelay: `${i * 0.5}s` }}>{ic.emoji}</div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  const pillars = [
    { emoji: "👁️", title: "Real-time Visibility", desc: "Monitor assets, processes and energy in real time" },
    { emoji: "⚙️", title: "Operational Excellence", desc: "Automate, optimize and improve uptime" },
    { emoji: "🌱", title: "Sustainable Growth", desc: "Reduce energy consumption and carbon footprint" },
  ];

  return (
    <section className="ia-hero">
      <div className="ia-wrap" style={{ paddingBottom: 48 }}>
        <div className="ia-hero-grid">
          <div>
            <div className="ia-eyebrow rev">
              <div className="ia-eyebrow-line" />
              <span className="ia-eyebrow-text">Industry Automation</span>
              <div className="ia-eyebrow-line" />
            </div>
            <div className="ia-badge rev">⚡ High Impact Solution</div>
            <h1 className="ia-h1 rev">Industry Automation</h1>
            <p className="ia-h1-sub rev">Smart IoT Solutions for a Smarter Tomorrow</p>
            <div className="ia-tags rev">
              {["Industry IoT Solutions", "Energy Monitoring", "Intelligent Automation"].map((t, i) => (
                <span key={t} className="ia-tag">
                  {i > 0 && <span className="ia-tag-dot" />}
                  {t}
                </span>
              ))}
            </div>
            <p className="ia-desc rev">
              Focalyt delivers end-to-end Industrial IoT and Energy Monitoring solutions that help businesses optimize operations, reduce costs, improve efficiency, and build a sustainable and future-ready enterprise.
            </p>
            <div className="ia-pillars rev">
              {pillars.map((p, i) => (
                <div key={p.title} className="ia-pillar">
                  <div className="ia-pillar-ico float" style={{ animationDelay: `${i * 0.4}s` }}>{p.emoji}</div>
                  <div>
                    <div className="ia-pillar-title">{p.title}</div>
                    <div className="ia-pillar-sub">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ia-hero-right rev-r">
            <Orbit40 />
            <div className="ia-stats">
              <div className="ia-stat">
                <Counter end={500} suffix="+" color="#0e7c6b" />
                <div className="ia-stat-lbl">Clients</div>
              </div>
              <div className="ia-stat">
                <Counter end={99} suffix="%" color="#1565c0" />
                <div className="ia-stat-lbl">Uptime</div>
              </div>
              <div className="ia-stat">
                <Counter end={120} suffix="+" color="#16a34a" />
                <div className="ia-stat-lbl">Solutions</div>
              </div>
            </div>
            <div className="ia-tech-tiles">
              {[
                { emoji: "🤖", label: "Robotics" },
                { emoji: "📱", label: "Dashboard" },
                { emoji: "🔌", label: "IoT Sensors" },
              ].map((t, i) => (
                <div key={t.label} className="ia-tech-tile float" style={{ animationDelay: `${i * 0.35}s` }}>
                  <div className="ia-tech-tile-emoji">{t.emoji}</div>
                  <div className="ia-tech-tile-lbl">{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const IOT_FEATURES = [
  "Machine & Equipment Monitoring", "Production Tracking",
  "Predictive Maintenance", "Remote Monitoring & Control",
  "Process Optimization", "IoT Dashboard & Analytics",
];
const ENERGY_FEATURES = [
  "Real-time Energy Monitoring", "Power Quality Analysis",
  "Energy Analytics & Reporting", "Energy Cost Optimization",
  "Load Management", "Alerts & Anomaly Detection",
];

function FeatureList({ features, accent }) {
  return (
    <div className="ia-features">
      {features.map((f) => (
        <div key={f} className="ia-feat">
          <div className="ia-feat-check" style={{ background: `${accent}18`, border: `1.5px solid ${accent}44` }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke={accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {f}
        </div>
      ))}
    </div>
  );
}

function Solutions() {
  const [active, setActive] = useState("iot");

  return (
    <section className="ia-sec">
      <div className="ia-wrap">
        <SectionDivider title="Our Solutions" />
        <div className="ia-tabs">
          <button type="button" className={`ia-tab${active === "iot" ? " active" : ""}`} onClick={() => setActive("iot")}>📡 Industry IoT Solutions</button>
          <button type="button" className={`ia-tab${active === "energy" ? " active" : ""}`} onClick={() => setActive("energy")}>🔋 Energy Monitoring Solutions</button>
        </div>

        {active === "iot" && (
          <div className="ia-panel" key="iot">
            <div className="ia-panel-side">
              <span className="float" style={{ fontSize: 44 }}>🤖</span>
              <span className="pulse" style={{ fontSize: 28 }}>🏭</span>
              <span className="float" style={{ fontSize: 24, animationDelay: "0.6s" }}>📱</span>
            </div>
            <div className="ia-panel-body" style={{ "--accent": "#0e7c6b" }}>
              <div className="ia-panel-head">
                <div className="ia-panel-ico" style={{ background: "rgba(14,124,107,.12)", border: "1px solid rgba(14,124,107,.25)" }}>📡</div>
                <div className="ia-panel-title">INDUSTRY <span>IoT SOLUTIONS</span></div>
              </div>
              <p className="ia-panel-desc">Connect machines, devices and systems through IoT to gain actionable insights, improve efficiency and enable predictive operations.</p>
              <FeatureList features={IOT_FEATURES} accent="#0e7c6b" />
            </div>
          </div>
        )}

        {active === "energy" && (
          <div className="ia-panel" key="energy">
            <div className="ia-panel-body" style={{ "--accent": "#16a34a" }}>
              <div className="ia-panel-head">
                <div className="ia-panel-ico" style={{ background: "rgba(22,163,74,.12)", border: "1px solid rgba(22,163,74,.25)" }}>🔋</div>
                <div className="ia-panel-title">ENERGY <span style={{ color: "#16a34a" }}>MONITORING SOLUTIONS</span></div>
              </div>
              <p className="ia-panel-desc">Monitor, analyze and optimize energy consumption in real time to reduce costs and achieve sustainability goals.</p>
              <FeatureList features={ENERGY_FEATURES} accent="#16a34a" />
            </div>
            <div className="ia-panel-side ia-panel-side--right">
              <span className="float" style={{ fontSize: 44 }}>⚡</span>
              <span className="pulse" style={{ fontSize: 28 }}>📊</span>
              <span className="float" style={{ fontSize: 24, animationDelay: "0.6s" }}>🌱</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const BENEFITS = [
  { emoji: "₹", num: "10–30%", label: "Energy Cost Savings", accent: "#0e7c6b", bg: "rgba(14,124,107,.1)" },
  { emoji: "📈", num: "20–40%", label: "Operational Efficiency Increase", accent: "#1565c0", bg: "rgba(21,101,192,.1)" },
  { emoji: "⏱️", num: "Maximize", label: "Equipment Uptime & Productivity", accent: "#6a1f9a", bg: "rgba(106,31,154,.1)" },
  { emoji: "🛡️", num: "Reduce", label: "Downtime & Maintenance Costs", accent: "#00838f", bg: "rgba(0,131,143,.1)" },
  { emoji: "🌿", num: "Achieve", label: "Sustainability & ESG Compliance", accent: "#16a34a", bg: "rgba(22,163,74,.1)" },
  { emoji: "📊", num: "Data-Driven", label: "Decisions for Smarter Growth", accent: "#e65100", bg: "rgba(230,81,0,.1)" },
];

function Benefits() {
  return (
    <section className="ia-sec">
      <div className="ia-wrap">
        <div className="ia-sec-head rev">Business Benefits</div>
        <div className="ia-benefits-grid">
          {BENEFITS.map((b, i) => (
            <div key={b.label} className="ia-benefit rev" style={{ "--accent": b.accent, transitionDelay: `${i * 50}ms` }}>
              <div className="ia-benefit-ico" style={{ background: b.bg, borderColor: `${b.accent}33` }}>{b.emoji}</div>
              <div>
                <div className="ia-benefit-num" style={{ color: b.accent }}>{b.num}</div>
                <div className="ia-benefit-lbl">{b.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const DASH = {
  temp:   { label: "🌡️ Machine Temp", unit: "°C",  color: "#0e7c6b", max: 100, vals: [68, 72, 77, 74, 80, 71, 76, 73, 69, 75] },
  power:  { label: "⚡ Power Usage", unit: " kW", color: "#1565c0", max: 400, vals: [260, 284, 310, 275, 320, 295, 268, 305, 288, 275] },
  oee:    { label: "📈 OEE Score", unit: "%", color: "#16a34a", max: 100, vals: [82, 87, 91, 85, 93, 88, 84, 90, 86, 89] },
  alerts: { label: "🔔 Active Alerts", unit: "", color: "#e65100", max: 5, vals: [1, 3, 2, 5, 0, 4, 2, 3, 1, 4] },
};

function LiveDashboard() {
  const [idx, setIdx] = useState(0);
  const [flash, setFlash] = useState(false);

  const tick = useCallback(() => {
    setIdx((p) => (p + 1) % 10);
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
  }, []);

  useEffect(() => {
    const t = setInterval(tick, 3000);
    return () => clearInterval(t);
  }, [tick]);

  return (
    <section className="ia-sec">
      <div className="ia-wrap" style={{paddingBottom:"15px"}}>
        <div className="ia-dash-panel rev">
          <div style={{ textAlign: "center" }}>
            <div className="ia-live-badge">
              <span className="ia-live-dot blink" />
              LIVE DASHBOARD SIMULATION
            </div>
            <h2 className="ia-dash-title">Monitor Your Factory in Real-Time</h2>
            <p className="ia-dash-sub">Data refreshes every 3 seconds — click below to update manually</p>
          </div>

          <div className="ia-dash-grid">
            {Object.entries(DASH).map(([key, d]) => {
              const val = d.vals[idx];
              const pct = (val / d.max) * 100;
              return (
                <div key={key} className="ia-dash-card rev" style={{ "--card-accent": d.color }}>
                  <div className="ia-dash-lbl">{d.label}</div>
                  <div className="ia-dash-val" style={{ color: d.color, opacity: flash ? 0.5 : 1 }}>{val}{d.unit}</div>
                  {key !== "alerts" ? (
                    <div className="ia-progress">
                      <div className="ia-progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${d.color},${d.color}bb)` }} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      {[...Array(5)].map((_, i) => (
                        <div key={i} style={{
                          width: 9, height: 9, borderRadius: "50%",
                          background: i < val ? d.color : `${d.color}33`,
                          animation: i < val ? `iaBlink 1.4s ${i * 0.25}s ease-in-out infinite` : "none",
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="ia-wave rev">
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t3)", minWidth: 100 }}>📡 Signal Activity</span>
            <div className="ia-wave-bars">
              {[...Array(36)].map((_, i) => {
                const h = 30 + Math.sin(i * 0.62 + idx * 1.2) * 24;
                return <div key={i} className="ia-wave-bar" style={{ height: `${Math.abs(h)}%`, animationDelay: `${i * 0.03}s` }} />;
              })}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--teal)", animation: "iaBlink 1.5s ease-in-out infinite" }}>ACTIVE</span>
          </div>

          <div style={{ textAlign: "center" }}>
            <button type="button" className="ia-btn-primary" onClick={tick}>🔄 Simulate Data Refresh</button>
          </div>
        </div>
      </div>
    </section>
  );
}

const CTA_ACTIONS = [
  { emoji: "📅", title: "Schedule a Demo", desc: "See our solutions in action" },
  { emoji: "👥", title: "Consult Our Experts", desc: "Get customized solutions for your industry" },
  { emoji: "📄", title: "Download Brochure", desc: "Explore our offerings in detail", modal: false },
];

// function CTA() {
//   return (
//     // <section className="ia-cta">
//     //   <div style={{ flex: "1 1 240px" }}>
//     //     <h2 className="ia-cta-h rev-l">Ready to Transform Your Operations?</h2>
//     //     <p className="ia-cta-sub rev-l">Let&apos;s build a smarter, connected and more efficient industry together.</p>
//     //   </div>
//     //   <div className="ia-cta-actions">
//     //     {CTA_ACTIONS.map((a, i) => (
//     //       <div
//     //         key={a.title}
//     //         className="ia-cta-action rev"
//     //         role="button"
//     //         tabIndex={0}
//     //         data-bs-toggle={a.modal !== false ? "modal" : undefined}
//     //         data-bs-target={a.modal !== false ? "#partnerModal" : undefined}
//     //         style={{ transitionDelay: `${i * 80}ms` }}
//     //       >
//     //         <span className="ia-cta-action-ico">{a.emoji}</span>
//     //         <div>
//     //           <div className="ia-cta-action-title">{a.title}</div>
//     //           <div className="ia-cta-action-sub">{a.desc}</div>
//     //         </div>
//     //       </div>
//     //     ))}
//     //   </div>
//     //   <button type="button" className="ia-btn-outline rev-r" data-bs-toggle="modal" data-bs-target="#partnerModal">
//     //     Partner With Us →
//     //   </button>
//     // </section>
//   );
// }

export default function IndustryAutomationSection() {
  const rootRef = useRef(null);
  useScrollReveal(rootRef);

  return (
    <>
      <style>{STYLES}</style>
      <div ref={rootRef} className="ia">
        <Hero />
        <Solutions />
        <Benefits />
        <LiveDashboard />
        {/* <CTA /> */}
      </div>
    </>
  );
}
