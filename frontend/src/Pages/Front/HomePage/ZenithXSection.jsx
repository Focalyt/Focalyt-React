import { useState } from "react";
import { Link } from "react-router-dom";

const S = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
.foc-cyber-home .zx{
  font-family:'Inter',sans-serif;
  background:var(--bg);
  color:var(--text);
  overflow-x:hidden;
  position:relative;
}
.foc-cyber-home .zx,.foc-cyber-home .zx *{box-sizing:border-box;margin:0;padding:0;}

.foc-cyber-home .zx-hero{position:relative;display:flex;align-items:center;padding:56px 0 40px;overflow:hidden;background:var(--bg);}
.foc-cyber-home .zx-mesh{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.foc-cyber-home .zx-orb{position:absolute;border-radius:50%;filter:blur(120px);}
.foc-cyber-home .zx-orb1{width:700px;height:700px;background:var(--orb1);top:-200px;right:-150px;}
.foc-cyber-home .zx-orb2{width:500px;height:500px;background:var(--orb2);bottom:-100px;left:-100px;}
.foc-cyber-home .zx-orb3{width:300px;height:300px;background:var(--heroGlowR);top:30%;left:38%;opacity:.55;}
.foc-cyber-home .zx-grid-lines{position:absolute;inset:0;background-image:linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px);background-size:52px 52px;pointer-events:none;}

.foc-cyber-home .zx-hero-inner{position:relative;z-index:2;max-width:1280px;margin:0 auto;padding:0 48px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;}

.foc-cyber-home .zx-logo-wrap{margin-bottom:8px;}
.foc-cyber-home .zx-logo-row{display:flex;align-items:baseline;gap:2px;}
.foc-cyber-home .zx-logo-z{font-family:'Orbitron',monospace;font-size:clamp(42px,5vw,58px);font-weight:900;letter-spacing:-1px;line-height:1;background:linear-gradient(135deg,var(--cyan),var(--red));-webkit-background-clip:text;background-clip:text;color:transparent;}
.foc-cyber-home .zx-logo-x{font-family:'Orbitron',monospace;font-size:clamp(44px,5vw,60px);font-weight:900;line-height:1;background:linear-gradient(135deg,var(--red),var(--cyan));-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-2px;}
.foc-cyber-home .zx-logo-sub{display:block;font-size:10.5px;letter-spacing:.22em;color:var(--muted2);text-transform:uppercase;margin-top:4px;}

.foc-cyber-home .zx-eyebrow{display:inline-flex;align-items:center;gap:8px;background:var(--cyan-soft);border:1px solid var(--border);color:var(--cyan);font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:7px 16px;border-radius:99px;margin-bottom:22px;}
.foc-cyber-home .zx-pulse{width:7px;height:7px;background:var(--cyan);border-radius:50%;box-shadow:0 0 0 0 var(--cyan-glow);animation:zxP 1.8s infinite;}
@keyframes zxP{0%{box-shadow:0 0 0 0 var(--cyan-glow)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}

.foc-cyber-home .zx-h1{font-family:'Orbitron',monospace;font-size:clamp(32px,4.2vw,54px);font-weight:700;line-height:1.08;letter-spacing:.02em;color:var(--text);margin-bottom:10px;}
.foc-cyber-home .zx-h1-g{background:linear-gradient(90deg,var(--cyan),var(--red));-webkit-background-clip:text;background-clip:text;color:transparent;}
.foc-cyber-home .zx-tagline{font-family:'Inter',sans-serif;font-size:18px;font-weight:600;color:var(--muted);margin-bottom:18px;}
.foc-cyber-home .zx-desc{font-family:'Inter',sans-serif;font-size:15px;line-height:1.85;color:var(--muted);margin-bottom:36px;max-width:500px;}

.foc-cyber-home .zx-pills{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:36px;}
.foc-cyber-home .zx-pill{font-family:'Inter',sans-serif;display:flex;align-items:center;gap:7px;padding:7px 15px;background:var(--surface);border:1px solid var(--border);border-radius:99px;font-size:12px;font-weight:500;color:var(--muted);transition:.2s var(--ease);}
.foc-cyber-home .zx-pill:hover{border-color:var(--pillHoverBorder);color:var(--cyan);box-shadow:0 4px 14px var(--pillHoverShadow);}
.foc-cyber-home .zx-pill-dot{width:5px;height:5px;border-radius:50%;}
.foc-cyber-home .zx-live{display:inline-flex;align-items:center;gap:7px;background:var(--pillBg);border:1px solid var(--border);color:var(--red);font-size:10px;font-weight:700;letter-spacing:.12em;padding:5px 12px;border-radius:99px;margin-bottom:22px;}
.foc-cyber-home .zx-live-dot{width:6px;height:6px;background:var(--red);border-radius:50%;animation:zxP 1.4s infinite;}

.foc-cyber-home .zx-btns{display:flex;gap:12px;flex-wrap:wrap;}
.foc-cyber-home .zx-bp{padding:13px 30px;background:linear-gradient(90deg,var(--cyan),var(--red));color:#fff;font-weight:700;font-size:13px;letter-spacing:.04em;border:none;border-radius:var(--r);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:9px;box-shadow:0 10px 30px var(--primaryShadow);transition:.25s var(--ease);font-family:'Orbitron',monospace;}
.foc-cyber-home .zx-bp:hover{transform:translateY(-2px);box-shadow:0 16px 42px var(--primaryShadowHover);}
.foc-cyber-home .zx-bg{padding:13px 30px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:var(--r);font-weight:600;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:9px;transition:.25s var(--ease);font-family:'Orbitron',monospace;}
.foc-cyber-home .zx-bg:hover{border-color:var(--cyan);color:var(--cyan);box-shadow:0 4px 16px var(--pillHoverShadow);}

.foc-cyber-home .zx-mosaic{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:210px 210px;gap:12px;position:relative;}
.foc-cyber-home .zx-mosaic::after{content:'WHERE IDEAS MEET INNOVATION';position:absolute;bottom:-22px;left:0;right:0;text-align:center;font-size:9.5px;letter-spacing:.22em;color:var(--muted2);text-transform:uppercase;}
.foc-cyber-home .zx-tile{border-radius:var(--r);overflow:hidden;position:relative;background:var(--surface);border:1px solid var(--border);box-shadow:0 4px 20px var(--primaryShadow);transition:.3s var(--ease);}
.foc-cyber-home .zx-tile:hover{border-color:var(--cyan);box-shadow:0 8px 28px var(--cyan-glow);transform:translateY(-3px);}
.foc-cyber-home .zx-tile-main{grid-column:1;grid-row:1/3;}
.foc-cyber-home .zx-tc{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,var(--surface2),var(--surface));}
.foc-cyber-home .zx-t-em{font-size:64px;filter:drop-shadow(0 4px 16px var(--cyan-glow));}
.foc-cyber-home .zx-t-lbl{font-size:9px;letter-spacing:.22em;color:var(--muted2);text-transform:uppercase;font-weight:700;}
.foc-cyber-home .zx-t-badge{position:absolute;top:14px;right:14px;background:linear-gradient(135deg,var(--cyan),var(--red));color:#fff;font-size:9.5px;font-weight:700;padding:5px 12px;border-radius:99px;letter-spacing:.08em;}
.foc-cyber-home .zx-t-bot{position:absolute;bottom:14px;left:14px;background:var(--surface);backdrop-filter:blur(10px);border:1px solid var(--border);padding:6px 12px;border-radius:8px;font-size:10.5px;font-weight:700;color:var(--text);letter-spacing:.04em;box-shadow:0 4px 14px var(--primaryShadow);}

.foc-cyber-home .zx-stats{background:var(--bg2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.foc-cyber-home .zx-stats-in{max-width:1280px;margin:0 auto;padding:0 48px;display:flex;align-items:stretch;}
.foc-cyber-home .zx-stats-lbl{flex-shrink:0;padding:28px 36px 28px 0;border-right:1px solid var(--border);display:flex;align-items:center;}
.foc-cyber-home .zx-stats-lbl-t{font-family:'Orbitron',monospace;font-size:12px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:.12em;max-width:130px;line-height:1.4;}
.foc-cyber-home .zx-st-items{flex:1;display:flex;}
.foc-cyber-home .zx-st{flex:1;padding:18px 16px;display:flex;align-items:center;gap:14px;border-right:1px solid var(--border);}
.foc-cyber-home .zx-st:last-child{border-right:none;}
.foc-cyber-home .zx-st-ico{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;background:var(--cyan-soft);border:1px solid var(--border);}
.foc-cyber-home .zx-st-num{font-family:'Orbitron',monospace;font-size:26px;font-weight:700;line-height:1;margin-bottom:3px;color:var(--cyan);}
.foc-cyber-home .zx-st-lbl{font-family:'Inter',sans-serif;font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.04em;}

.foc-cyber-home .zx-sec{padding:40px 0;}
.foc-cyber-home .zx-sec + .zx-sec{padding-top:24px;}
.foc-cyber-home .zx-sec-alt{background:var(--bg2);}
.foc-cyber-home .zx-cont{max-width:1280px;margin:0 auto;padding:0 48px;}
.foc-cyber-home .zx-sec-head{text-align:center;margin-bottom:32px;}
.foc-cyber-home .zx-stag{display:inline-flex;align-items:center;gap:8px;background:var(--cyan-soft);border:1px solid var(--border);color:var(--cyan);font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;padding:5px 14px;border-radius:2px;margin-bottom:16px;}
.foc-cyber-home .zx-stag::before{content:'//';color:var(--red);margin-right:2px;}
.foc-cyber-home .zx-sh2{font-family:'Orbitron',monospace;font-size:clamp(26px,4vw,44px);font-weight:700;line-height:1.1;letter-spacing:.04em;color:var(--text);margin-bottom:14px;}
.foc-cyber-home .zx-sh2 .gp{color:var(--cyan);text-shadow:0 0 16px var(--cyan-glow);}
.foc-cyber-home .zx-sh2 .gc{color:var(--cyan);}
.foc-cyber-home .zx-sh2 .ga{color:var(--red);text-shadow:0 0 16px var(--primaryShadow);}
.foc-cyber-home .zx-sh2 .gpk{color:var(--red);}
.foc-cyber-home .zx-sbody{font-family:'Inter',sans-serif;font-size:15px;color:var(--muted);line-height:1.75;margin:0 auto;font-style:italic;}

.foc-cyber-home .zx-ec-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;}
.foc-cyber-home .zx-ec{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;display:flex;flex-direction:column;transition:.3s var(--ease);cursor:default;position:relative;}
.foc-cyber-home .zx-ec::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--ec-grad,var(--cyan));border-radius:2px 2px 0 0;}
.foc-cyber-home .zx-ec:hover{border-color:var(--ec-brd,var(--cyan));transform:translateY(-5px);box-shadow:0 16px 40px var(--statHoverShadow);}
.foc-cyber-home .zx-ec-top{padding:22px 18px 16px;}
.foc-cyber-home .zx-ec-ring{width:54px;height:54px;border-radius:12px;background:var(--ec-soft,var(--cyan-soft));display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:14px;border:1px solid var(--ec-brd,var(--border));}
.foc-cyber-home .zx-ec-t{font-family:'Orbitron',monospace;font-size:12px;font-weight:700;color:var(--ec-col,var(--cyan));text-transform:uppercase;letter-spacing:.06em;line-height:1.2;margin-bottom:4px;}
.foc-cyber-home .zx-ec-s{font-size:10.5px;font-weight:600;color:var(--muted2);letter-spacing:.04em;}
.foc-cyber-home .zx-ec-body{padding:0 18px 18px;flex:1;display:flex;flex-direction:column;gap:7px;}
.foc-cyber-home .zx-ec-row{font-family:'Inter',sans-serif;display:flex;align-items:flex-start;gap:9px;font-size:12.5px;color:var(--muted);line-height:1.45;}
.foc-cyber-home .zx-ec-dot{width:5px;height:5px;border-radius:50%;background:var(--ec-col,var(--cyan));flex-shrink:0;margin-top:6px;}
.foc-cyber-home .zx-ec-foot{height:110px;background:var(--ec-soft,var(--surface2));display:flex;align-items:center;justify-content:center;font-size:50px;position:relative;border-top:1px solid var(--ec-brd,var(--border));}

.foc-cyber-home .zx-tabs{display:flex;gap:6px;justify-content:center;margin-bottom:28px;flex-wrap:wrap;}
.foc-cyber-home .zx-tab{padding:12px 32px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);cursor:pointer;font-family:'Orbitron',monospace;font-size:13.5px;font-weight:700;color:var(--muted);transition:.22s var(--ease);display:flex;align-items:center;gap:8px;}
.foc-cyber-home .zx-tab.on{background:linear-gradient(90deg,var(--cyan),var(--red));color:#fff;border-color:transparent;box-shadow:0 8px 28px var(--primaryShadow);}
.foc-cyber-home .zx-tab:hover:not(.on){border-color:var(--pillHoverBorder);color:var(--cyan);}

.foc-cyber-home .zx-ip{display:grid;grid-template-columns:460px 1fr;gap:32px;align-items:start;}
.foc-cyber-home .zx-ip-badge{display:inline-flex;align-items:center;gap:7px;background:var(--cyan-soft);border:1px solid var(--border);color:var(--cyan);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;padding:6px 14px;border-radius:4px;margin-bottom:20px;}
.foc-cyber-home .zx-ip-badge.is-college{color:var(--red);background:var(--pillBg);}
.foc-cyber-home .zx-ip-h{font-family:'Orbitron',monospace;font-size:clamp(22px,2.8vw,34px);font-weight:700;color:var(--text);line-height:1.12;margin-bottom:14px;letter-spacing:.02em;}
.foc-cyber-home .zx-ip-h span{color:var(--red);}
.foc-cyber-home .zx-ip-desc{font-family:'Inter',sans-serif;font-size:14px;color:var(--muted);line-height:1.85;margin-bottom:26px;font-style:italic;}
.foc-cyber-home .zx-ip-feats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;}
.foc-cyber-home .zx-ip-feat{display:flex;flex-direction:column;align-items:center;gap:5px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 18px;font-size:10.5px;font-weight:700;color:var(--muted);text-align:center;min-width:90px;transition:.2s var(--ease);}
.foc-cyber-home .zx-ip-feat:hover{border-color:var(--cyan);color:var(--text);}
.foc-cyber-home .zx-ip-feat-em{font-size:22px;}
.foc-cyber-home .zx-info{border-radius:12px;padding:16px 20px;margin-bottom:14px;background:var(--surface2);border:1px solid var(--border);}
.foc-cyber-home .zx-info-lbl{font-size:9.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;color:var(--cyan);}
.foc-cyber-home .zx-info.is-college .zx-info-lbl{color:var(--red);}
.foc-cyber-home .zx-chips{display:flex;flex-wrap:wrap;gap:8px;}
.foc-cyber-home .zx-chip{font-family:'Inter',sans-serif;display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);border-radius:99px;padding:5px 13px;font-size:11.5px;font-weight:500;color:var(--muted);}
.foc-cyber-home .zx-chip-dot{width:4px;height:4px;border-radius:50%;background:var(--cyan);}

.foc-cyber-home .zx-mc-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;}
.foc-cyber-home .zx-mc{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:20px 18px;position:relative;overflow:hidden;transition:.25s var(--ease);}
.foc-cyber-home .zx-mc::before{content:'';position:absolute;top:0;left:0;right:0;height:2.5px;background:var(--mc-grad,linear-gradient(90deg,var(--cyan),var(--red)));}
.foc-cyber-home .zx-mc:hover{border-color:var(--cyan);transform:translateY(-2px);box-shadow:0 8px 24px var(--pillHoverShadow);}
.foc-cyber-home .zx-mc-ico{font-size:28px;margin-bottom:10px;}
.foc-cyber-home .zx-mc-t{font-family:'Orbitron',monospace;font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px;letter-spacing:.03em;}
.foc-cyber-home .zx-mc-d{font-family:'Inter',sans-serif;font-size:11.5px;color:var(--muted);line-height:1.6;}

.foc-cyber-home .zx-comp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:28px;}
.foc-cyber-home .zx-comp{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:28px 24px;position:relative;overflow:hidden;transition:.3s var(--ease);}
.foc-cyber-home .zx-comp::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2.5px;background:var(--cc-grad,linear-gradient(90deg,var(--cyan),var(--red)));transform:scaleX(0);transform-origin:left;transition:.3s var(--ease);}
.foc-cyber-home .zx-comp:hover{border-color:var(--cyan);transform:translateY(-4px);box-shadow:0 12px 32px var(--statHoverShadow);}
.foc-cyber-home .zx-comp:hover::after{transform:scaleX(1);}
.foc-cyber-home .zx-comp-n{position:absolute;top:20px;right:22px;font-family:'Orbitron',monospace;font-size:36px;font-weight:700;color:var(--border);line-height:1;}
.foc-cyber-home .zx-comp-cat{font-size:9.5px;font-weight:800;letter-spacing:.14em;color:var(--cc-col,var(--cyan));text-transform:uppercase;margin-bottom:8px;}
.foc-cyber-home .zx-comp-t{font-family:'Orbitron',monospace;font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px;line-height:1.2;letter-spacing:.02em;}
.foc-cyber-home .zx-comp-list{display:flex;flex-direction:column;gap:7px;}
.foc-cyber-home .zx-comp-item{font-family:'Inter',sans-serif;display:flex;align-items:flex-start;gap:9px;font-size:13px;color:var(--muted);line-height:1.45;}
.foc-cyber-home .zx-comp-arrow{color:var(--cc-col,var(--cyan));flex-shrink:0;font-weight:800;}

.foc-cyber-home .zx-cats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.foc-cyber-home .zx-cat{border-radius:12px;padding:14px 20px;background:var(--surface);border:1px solid var(--border);}
.foc-cyber-home .zx-cat-t{font-size:13.5px;font-weight:800;color:var(--text);margin-bottom:3px;}
.foc-cyber-home .zx-cat-s{font-size:11px;font-weight:700;color:var(--cyan);}

.foc-cyber-home .zx-rec-grid{display:grid;grid-template-columns:1fr 1.15fr;gap:32px;align-items:center;}
.foc-cyber-home .zx-rec-left{background:var(--surface);border:1px solid var(--border);border-radius:22px;padding:28px 24px;position:relative;overflow:hidden;box-shadow:0 8px 32px var(--primaryShadow);}
.foc-cyber-home .zx-rec-left::before{content:'';position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,var(--heroGlowC) 0%,transparent 70%);pointer-events:none;}
.foc-cyber-home .zx-trophy{font-size:72px;text-align:center;margin-bottom:20px;filter:drop-shadow(0 4px 20px var(--cyan-glow));}
.foc-cyber-home .zx-rec-items{display:flex;flex-direction:column;gap:12px;}
.foc-cyber-home .zx-rec-item{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:12px;transition:.2s var(--ease);}
.foc-cyber-home .zx-rec-item:hover{border-color:var(--cyan);box-shadow:0 4px 16px var(--pillHoverShadow);}
.foc-cyber-home .zx-rec-ico{font-size:24px;flex-shrink:0;}
.foc-cyber-home .zx-rec-it{font-size:13.5px;font-weight:700;color:var(--text);margin-bottom:2px;}
.foc-cyber-home .zx-rec-is{font-family:'Inter',sans-serif;font-size:11.5px;color:var(--muted);}
.foc-cyber-home .zx-rec-rh{font-family:'Orbitron',monospace;font-size:clamp(22px,2.8vw,34px);font-weight:700;color:var(--text);line-height:1.12;margin-bottom:14px;letter-spacing:.02em;}
.foc-cyber-home .zx-rec-rh span{color:var(--red);}
.foc-cyber-home .zx-rec-rdesc{font-family:'Inter',sans-serif;font-size:14px;color:var(--muted);line-height:1.85;margin-bottom:28px;font-style:italic;}
.foc-cyber-home .zx-rec-hls{display:flex;flex-direction:column;gap:12px;}
.foc-cyber-home .zx-rec-hl{display:flex;align-items:flex-start;gap:14px;padding:16px 18px;background:var(--cyan-soft);border:1px solid var(--border);border-radius:12px;transition:.2s var(--ease);}
.foc-cyber-home .zx-rec-hl:hover{border-color:var(--cyan);box-shadow:0 4px 16px var(--pillHoverShadow);}
.foc-cyber-home .zx-rec-hl-ico{font-size:22px;flex-shrink:0;}
.foc-cyber-home .zx-rec-hl-t{font-size:13.5px;font-weight:700;color:var(--text);margin-bottom:3px;}
.foc-cyber-home .zx-rec-hl-s{font-family:'Inter',sans-serif;font-size:11.5px;color:var(--muted);line-height:1.45;}

.foc-cyber-home .zx-cta-wrap{background:var(--surface);border-radius:26px;overflow:hidden;position:relative;border:1px solid var(--border);box-shadow:0 12px 40px var(--primaryShadow);}
.foc-cyber-home .zx-cta-bg{position:absolute;inset:0;background:radial-gradient(ellipse 70% 80% at 80% 50%,var(--heroGlowC) 0%,transparent 60%),radial-gradient(ellipse 50% 70% at 15% 50%,var(--heroGlowR) 0%,transparent 55%);pointer-events:none;}
.foc-cyber-home .zx-cta-in{position:relative;z-index:1;display:grid;grid-template-columns:auto 1fr;gap:32px;align-items:center;padding:36px 40px;}
.foc-cyber-home .zx-cta-robot{font-size:96px;line-height:1;filter:drop-shadow(0 4px 20px var(--cyan-glow));}
.foc-cyber-home .zx-cta-h{font-family:'Orbitron',monospace;font-size:clamp(24px,3.2vw,40px);font-weight:700;color:var(--text);margin-bottom:8px;letter-spacing:.02em;}
.foc-cyber-home .zx-cta-h span{color:var(--cyan);}
.foc-cyber-home .zx-cta-sub{font-family:'Inter',sans-serif;font-size:15px;color:var(--muted);margin-bottom:24px;font-style:italic;}
.foc-cyber-home .zx-cta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.foc-cyber-home .zx-cta-btn{display:flex;align-items:center;gap:11px;padding:14px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:14px;cursor:pointer;transition:.22s var(--ease);text-decoration:none;}
.foc-cyber-home .zx-cta-btn:hover{border-color:var(--cyan);box-shadow:0 6px 20px var(--pillHoverShadow);}
.foc-cyber-home .zx-cta-btn.hl{background:linear-gradient(90deg,var(--cyan),var(--red));border-color:transparent;box-shadow:0 8px 28px var(--primaryShadow);}
.foc-cyber-home .zx-cta-btn.hl:hover{transform:translateY(-2px);box-shadow:0 12px 36px var(--primaryShadowHover);}
.foc-cyber-home .zx-cta-bico{font-size:24px;flex-shrink:0;}
.foc-cyber-home .zx-cta-bt{font-size:12.5px;font-weight:700;color:var(--text);line-height:1.2;margin-bottom:2px;}
.foc-cyber-home .zx-cta-bs{font-size:10.5px;color:var(--muted);line-height:1.35;}
.foc-cyber-home .zx-cta-btn.hl .zx-cta-bt,.foc-cyber-home .zx-cta-btn.hl .zx-cta-bs{color:#fff;}

@media(max-width:1100px){.foc-cyber-home .zx-ec-grid{grid-template-columns:repeat(3,1fr);}.foc-cyber-home .zx-ip{grid-template-columns:1fr;}.foc-cyber-home .zx-cta-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:820px){.foc-cyber-home .zx-hero-inner{grid-template-columns:1fr;}.foc-cyber-home .zx-mosaic{display:none;}.foc-cyber-home .zx-ec-grid{grid-template-columns:1fr 1fr;}.foc-cyber-home .zx-comp-grid{grid-template-columns:1fr;}.foc-cyber-home .zx-rec-grid{grid-template-columns:1fr;}.foc-cyber-home .zx-cta-in{grid-template-columns:1fr;padding:28px 24px;}.foc-cyber-home .zx-cta-robot{display:none;}.foc-cyber-home .zx-cats{grid-template-columns:1fr 1fr;}.foc-cyber-home .zx-stats-in{flex-wrap:wrap;padding:0 28px;}.foc-cyber-home .zx-stats-lbl{border-right:none;padding:16px 0 0;}.foc-cyber-home .zx-st-items{flex-wrap:wrap;}.foc-cyber-home .zx-st{min-width:calc(50% - 6px);border-right:none;border-bottom:1px solid var(--border);}.foc-cyber-home .zx-cont{padding:0 24px;}.foc-cyber-home .zx-hero-inner{padding:0 28px;}.foc-cyber-home .zx-hero{padding:48px 0 32px;}.foc-cyber-home .zx-sec{padding:32px 0;}.foc-cyber-home .zx-sec + .zx-sec{padding-top:16px;}}
@media(max-width:540px){.foc-cyber-home .zx-ec-grid{grid-template-columns:1fr;}.foc-cyber-home .zx-mc-grid{grid-template-columns:1fr;}.foc-cyber-home .zx-cats{grid-template-columns:1fr;}.foc-cyber-home .zx-cta-grid{grid-template-columns:1fr;}}
`;

const EVENTS = [
  { icon: "🤖", title: "Workshops", sub: "Learn. Build. Explore.", col: "var(--cyan)", soft: "var(--cyan-soft)", brd: "var(--border)", grad: "linear-gradient(90deg,var(--cyan),var(--red))", emoji: "👾", items: ["AI, Robotics, IoT, Drones & more", "Hands-on practical sessions", "Expert-led interactive learning", "School, college & community focused"] },
  { icon: "🏆", title: "Competitions", sub: "Challenge. Create. Win.", col: "var(--red)", soft: "var(--pillBg)", brd: "var(--border)", grad: "linear-gradient(90deg,var(--red),var(--cyan))", emoji: "🥇", items: ["Poster Making Competitions", "Robotics & Coding Challenges", "STEM Model Competitions", "Innovation Hackathons"] },
  { icon: "🎪", title: "PTM & Carnival Tech Zones", sub: "Engage. Interact. Inspire.", col: "var(--cyan)", soft: "var(--cyan-soft)", brd: "var(--border)", grad: "linear-gradient(90deg,var(--cyan),var(--red))", emoji: "🎠", items: ["Robotics Demonstration Stalls", "AI & IoT Display Zones", "Drone Experience Corners", "Games & Interactive Challenges"] },
  { icon: "📅", title: "Weekend Innovation Workshops", sub: "Explore. Experiment. Excel.", col: "var(--red)", soft: "var(--pillBg)", brd: "var(--border)", grad: "linear-gradient(90deg,var(--red),var(--cyan))", emoji: "🌟", items: ["Short, fun & hands-on programs", "Build robots, explore AI, IoT & more", "Innovation & entrepreneurship", "Perfect for curious young minds"] },
  { icon: "🎖️", title: "Recognition & Awards", sub: "Recognize. Celebrate. Motivate.", col: "var(--cyan)", soft: "var(--cyan-soft)", brd: "var(--border)", grad: "linear-gradient(90deg,var(--cyan),var(--red))", emoji: "🎗️", items: ["Certificates for all participants", "Awards for winners", "Project showcases & displays", "Inter-school recognition"] },
];

const STATS = [
  { ico: "👩‍🎓", num: "10,000+", lbl: "Students Engaged" },
  { ico: "🏫", num: "250+", lbl: "Schools & Colleges" },
  { ico: "🏆", num: "75+", lbl: "Events Conducted" },
  { ico: "🌍", num: "15+", lbl: "States Covered" },
  { ico: "⭐", num: "100+", lbl: "Partners & Experts" },
];

const SCH_CARDS = [
  { ico: "🤖", t: "Workshops & Sessions", d: "Hands-on AI, Robotics, IoT, Drones & STEM for all grades.", g: "linear-gradient(90deg,var(--cyan),var(--red))" },
  { ico: "🏆", t: "Competitions", d: "Poster making, robotics challenges, model making & hackathons.", g: "linear-gradient(90deg,var(--red),var(--cyan))" },
  { ico: "🎪", t: "PTM Tech Zones", d: "Interactive display zones, robot demos, IoT & drone stalls.", g: "linear-gradient(90deg,var(--cyan),var(--red))" },
  { ico: "📅", t: "Weekend Workshops", d: "Short & exciting weekend programs to explore future technologies.", g: "linear-gradient(90deg,var(--red),var(--cyan))" },
  { ico: "🎖️", t: "Recognition", d: "Certificates, trophies, project showcases & young innovator awards.", g: "linear-gradient(90deg,var(--cyan),var(--red))" },
  { ico: "🚀", t: "Future-Ready Learning", d: "Age-appropriate activities building curiosity, teamwork & innovation.", g: "linear-gradient(90deg,var(--red),var(--cyan))" },
];

const COL_CARDS = [
  { ico: "💻", t: "Workshops & Tech Sessions", d: "Deep-dive sessions on AI, IoT, Robotics, Cloud, Data & Drones.", g: "linear-gradient(90deg,var(--cyan),var(--red))" },
  { ico: "⚡", t: "Competitions & Hackathons", d: "Hackathons, coding contests, robotics & innovation competitions.", g: "linear-gradient(90deg,var(--red),var(--cyan))" },
  { ico: "📊", t: "Tech Exhibitions", d: "Showcase projects, research, prototypes & innovations to audiences.", g: "linear-gradient(90deg,var(--cyan),var(--red))" },
  { ico: "🤝", t: "Industry Connect & Expert Talks", d: "Interact with industry experts, tech talks & explore career paths.", g: "linear-gradient(90deg,var(--red),var(--cyan))" },
  { ico: "🏕️", t: "Weekend Immersion Programs", d: "Short-term weekend programs, bootcamps & specialized learning.", g: "linear-gradient(90deg,var(--cyan),var(--red))" },
  { ico: "🎯", t: "Career & Industry Readiness", d: "Build practical industry-relevant skills and networking opportunities.", g: "linear-gradient(90deg,var(--red),var(--cyan))" },
];

const COMPS = [
  { cat: "Creative Track", t: "Poster Making & STEM Models", col: "var(--cyan)", grad: "linear-gradient(90deg,var(--cyan),var(--red))", n: "01", items: ["AI & Innovation themed posters", "STEM model showcase", "Concept visualization challenges", "Digital art & design competitions"] },
  { cat: "Technical Track", t: "Robotics & Coding Challenges", col: "var(--red)", grad: "linear-gradient(90deg,var(--red),var(--cyan))", n: "02", items: ["Robotics build & race events", "Coding sprint competitions", "AI & IoT project challenges", "Smart device programming contests"] },
  { cat: "Innovation Track", t: "Hackathons & Innovation Challenges", col: "var(--cyan)", grad: "linear-gradient(90deg,var(--cyan),var(--red))", n: "03", items: ["Problem-solving hackathons", "Startup idea pitches", "Entrepreneurship model building", "Green tech innovation challenges"] },
];

const REC = [
  { ico: "📜", t: "Participation Certificates", s: "Official Zenith X certificate with QR verification." },
  { ico: "🥇", t: "Winner Trophies & Awards", s: "Trophies, medals & prize money for top performers." },
  { ico: "🖥️", t: "Innovation Showcases", s: "Present your project to judges, experts & parents." },
  { ico: "🌐", t: "Inter-school Recognition", s: "Compete at institution, district & state level." },
];

const CAT_ROWS = [
  { lbl: "Junior School", sub: "Classes 2–5" },
  { lbl: "Middle School", sub: "Classes 6–9" },
  { lbl: "Senior School", sub: "Classes 10–12" },
  { lbl: "Colleges & Universities", sub: "UG / PG" },
];

const RECOG_HIGHLIGHTS = [
  { ico: "📜", t: "Certificates for Every Participant", s: "Official Zenith X certificate with QR verification for each student." },
  { ico: "🥇", t: "Winner Trophies & Cash Awards", s: "Trophies, medals & prize money for top performers in all tracks." },
  { ico: "🖥️", t: "Live Innovation Showcase Events", s: "Present your project to judges, industry experts & parents." },
  { ico: "🌐", t: "Inter-school Championships", s: "Compete at institution, district & state level Zenith X events." },
];

const CTA_BUTTONS = [
  { ico: "📅", t: "Request an Event", s: "Plan a Zenith X event at your institution", hl: false },
  { ico: "🚀", t: "Explore Programs", s: "View workshops, competitions & more", hl: false },
  { ico: "📥", t: "Download Brochure", s: "Detailed information & program guide", hl: false },
  { ico: "💬", t: "Contact Us", s: "Collaborate. Innovate. Create impact.", hl: true },
];

function InstPanel({ tab }) {
  const isSch = tab === "school";
  const cards = isSch ? SCH_CARDS : COL_CARDS;

  return (
    <div className="zx-ip">
      <div>
        <div className={`zx-ip-badge${isSch ? "" : " is-college"}`}>
          {isSch ? "For Schools" : "For Colleges & Universities"}
        </div>
        <h3 className="zx-ip-h">
          {isSch ? (
            <>
              Inspire young minds.
              <br />
              Spark curiosity.
              <br />
              <span>Build future innovators.</span>
            </>
          ) : (
            <>
              Innovate. Collaborate.
              <br />
              <span>Transform.</span>
            </>
          )}
        </h3>
        <p className="zx-ip-desc">
          {isSch
            ? "Zenith X brings exciting future technology events to schools through workshops, competitions, interactive displays, games and carnival stalls during PTMs and school events."
            : "Zenith X empowers higher education institutions with industry-aligned workshops, innovation challenges, tech exhibitions, hackathons and experiential events that build skills and future-ready talent."}
        </p>
        <div className="zx-ip-feats">
          {(isSch
            ? [
                ["🖐️", "Hands-on Learning"],
                ["💡", "Creativity & Innovation"],
                ["🎮", "Fun & Engagement"],
                ["🚀", "Future Ready Skills"],
              ]
            : [
                ["🏭", "Industry Exposure"],
                ["💡", "Innovation Mindset"],
                ["🤝", "Collaboration & Networking"],
                ["🎯", "Career Readiness"],
              ]
          ).map(([em, lbl]) => (
            <div key={lbl} className="zx-ip-feat">
              <span className="zx-ip-feat-em">{em}</span>
              {lbl}
            </div>
          ))}
        </div>
        <div className={`zx-info${isSch ? "" : " is-college"}`}>
          <div className="zx-info-lbl">{isSch ? "Event Highlights" : "Event Impact"}</div>
          <div className="zx-chips">
            {(isSch
              ? ["Age-appropriate for all grades", "Encourages innovation & teamwork", "Engages students, parents & teachers", "Future-ready learning experiences"]
              : ["Practical, industry-relevant skills", "Encourages research & startups", "Networking with experts & industry", "Enhances employability & leadership"]
            ).map((c) => (
              <div key={c} className="zx-chip">
                <span className="zx-chip-dot" />
                {c}
              </div>
            ))}
          </div>
        </div>
        <div className="zx-info">
          <div className="zx-info-lbl">{isSch ? "Perfect For" : "Ideal For"}</div>
          <div className="zx-chips">
            {(isSch ? ["PTMs", "Annual Days", "Science Fairs", "Carnivals", "Exhibitions"] : ["Engineering Colleges", "Universities", "Tech Clubs", "Innovation Cells"]).map((c) => (
              <div key={c} className="zx-chip">
                ✦ {c}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="zx-mc-grid">
        {cards.map((c) => (
          <div key={c.t} className="zx-mc" style={{ "--mc-grad": c.g }}>
            <div className="zx-mc-ico">{c.ico}</div>
            <div className="zx-mc-t">{c.t}</div>
            <div className="zx-mc-d">{c.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Zenith X experiential events block — embedded on home below Future Technology Labs. Anchor ids prefixed to avoid clashes with `#events` on home. */
export default function ZenithXSection() {
  const [tab, setTab] = useState("school");

  return (
    <>
      <style>{S}</style>
      <div className="zx grid-bg" aria-label="Zenith X future technology events">
        <section className="zx-hero">
          <div className="zx-mesh">
            <div className="zx-orb zx-orb1" />
            <div className="zx-orb zx-orb2" />
            <div className="zx-orb zx-orb3" />
          </div>
          <div className="zx-grid-lines" />
          <div className="zx-hero-inner">
            <div>
              <div className="zx-logo-wrap">
                <div className="zx-logo-row">
                  <span className="zx-logo-z">Future Ready Zenith</span>
                  <span className="zx-logo-x">X</span>
                </div>
                <span className="zx-logo-sub">Future Technology Events</span>
              </div>
              <div className="zx-live">
                <span className="zx-live-dot" />
                Live Events Across India
              </div>
              <div className="zx-eyebrow">
                <span className="zx-pulse" />
                Focalyt&apos;s Experiential Event Ecosystem
              </div>
              <h1 className="zx-h1">
                Inspire. Innovate.
                <br />
                <span className="zx-h1-g">Experience. Create.</span>
              </h1>
              <p className="zx-tagline">Where Ideas Meet Innovation</p>
              <p className="zx-desc">
                Zenith X brings learning to life through workshops, competitions, interactive displays, games, and innovation zones — creating exciting opportunities for students to explore AI,
                Robotics, IoT, Drones &amp; emerging technologies.
              </p>
              <div className="zx-pills">
                {[
                  ["var(--cyan)", "Hands-on Learning"],
                  ["var(--red)", "Innovation & Creativity"],
                  ["var(--cyan)", "Real-world Exposure"],
                  ["var(--red)", "Fun & Engaging"],
                  ["var(--cyan)", "Future Ready Skills"],
                ].map(([col, lbl]) => (
                  <div key={lbl} className="zx-pill">
                    <span className="zx-pill-dot" style={{ background: col }} />
                    {lbl}
                  </div>
                ))}
              </div>
              <div className="zx-btns">
                <a href="#zenith-x-cta" className="zx-bp">
                  Bring Zenith X to Campus →
                </a>
                <a href="#zenith-x-programs" className="zx-bg">
                  Explore Programs
                </a>
              </div>
            </div>
            <div className="zx-mosaic">
              <div className="zx-tile zx-tile-main">
                <div className="zx-tc">
                  <span className="zx-t-em">🤖</span>
                  <span className="zx-t-lbl">Innovation Lab</span>
                </div>
                <div className="zx-t-badge">LIVE EVENTS</div>
                <div className="zx-t-bot">AI · Robotics · IoT</div>
              </div>
              <div className="zx-tile">
                <div className="zx-tc">
                  <span style={{ fontSize: 42 }}>🚁</span>
                  <span className="zx-t-lbl">Drones</span>
                </div>
              </div>
              <div className="zx-tile">
                <div className="zx-tc">
                  <span style={{ fontSize: 42 }}>🥽</span>
                  <span className="zx-t-lbl">AR / VR</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="zx-stats">
          <div className="zx-stats-in">
            <div className="zx-stats-lbl">
              <span className="zx-stats-lbl-t">Creating Impact Through Experiences</span>
            </div>
            <div className="zx-st-items">
              {STATS.map((s) => (
                <div key={s.lbl} className="zx-st">
                  <div className="zx-st-ico">
                    <span style={{ fontSize: 22 }}>{s.ico}</span>
                  </div>
                  <div>
                    <div className="zx-st-num">{s.num}</div>
                    <div className="zx-st-lbl">{s.lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="zx-sec" id="zenith-x-programs">
          <div className="zx-cont">
            <div className="zx-sec-head">
              <div className="zx-stag">What We Offer</div>
              <h2 className="zx-sh2">
                Our <span className="gp">Zenith X</span> Event Formats
              </h2>
              <p className="zx-sbody">Five powerful formats designed to engage, inspire and create future-ready learners across schools, colleges and communities.</p>
            </div>
            <div className="zx-ec-grid">
              {EVENTS.map((ec) => (
                <div key={ec.title} className="zx-ec" style={{ "--ec-grad": ec.grad, "--ec-col": ec.col, "--ec-soft": ec.soft, "--ec-brd": ec.brd }}>
                  <div className="zx-ec-top">
                    <div className="zx-ec-ring">{ec.icon}</div>
                    <div className="zx-ec-t">{ec.title}</div>
                    <div className="zx-ec-s">{ec.sub}</div>
                  </div>
                  <div className="zx-ec-body">{ec.items.map((it) => (
                    <div key={it} className="zx-ec-row">
                      <span className="zx-ec-dot" />
                      {it}
                    </div>
                  ))}</div>
                  <div className="zx-ec-foot">{ec.emoji}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="zx-sec zx-sec-alt" id="zenith-x-institutions">
          <div className="zx-cont">
            <div className="zx-sec-head">
              <div className="zx-stag">For Institutions</div>
              <h2 className="zx-sh2">
                Future Ready Zenith X 
              </h2>
              <p className="zx-sbody">Tailored event experiences for every stage of education — from curious school minds to aspiring college innovators.</p>
            </div>
            <div className="zx-tabs">
              <button type="button" className={`zx-tab${tab === "school" ? " on" : ""}`} onClick={() => setTab("school")}>
                🏫 For Schools
              </button>
              <button type="button" className={`zx-tab${tab === "college" ? " on" : ""}`} onClick={() => setTab("college")}>
                🎓 For Colleges &amp; Universities
              </button>
            </div>
            <InstPanel tab={tab} />
          </div>
        </section>

        <section className="zx-sec">
          <div className="zx-cont">
            <div className="zx-sec-head">
              <div className="zx-stag">Challenge. Create. Win.</div>
              <h2 className="zx-sh2">
                Competition <span className="gpk">Formats</span>
              </h2>
              <p className="zx-sbody">Creative, technical and innovation tracks across age groups — junior school through university level.</p>
            </div>
            <div className="zx-comp-grid">
              {COMPS.map((c) => (
                <div key={c.t} className="zx-comp" style={{ "--cc-col": c.col, "--cc-grad": c.grad }}>
                  <div className="zx-comp-n">{c.n}</div>
                  <div className="zx-comp-cat">{c.cat}</div>
                  <div className="zx-comp-t">{c.t}</div>
                  <div className="zx-comp-list">
                    {c.items.map((it) => (
                      <div key={it} className="zx-comp-item">
                        <span className="zx-comp-arrow">→</span>
                        {it}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="zx-cats">
              {CAT_ROWS.map((c) => (
                <div key={c.lbl} className="zx-cat">
                  <div className="zx-cat-t">{c.lbl}</div>
                  <div className="zx-cat-s">{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="zx-sec zx-sec-alt">
          <div className="zx-cont">
            <div className="zx-sec-head">
              <div className="zx-stag">Recognize. Celebrate. Motivate.</div>
              <h2 className="zx-sh2">
                Recognition &amp; <span className="ga">Awards</span>
              </h2>
            </div>
            <div className="zx-rec-grid">
              <div className="zx-rec-left">
                <div className="zx-trophy">🏆</div>
                <div className="zx-rec-items">
                  {REC.map((r) => (
                    <div key={r.t} className="zx-rec-item">
                      <span className="zx-rec-ico">{r.ico}</span>
                      <div>
                        <div className="zx-rec-it">{r.t}</div>
                        <div className="zx-rec-is">{r.s}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="zx-rec-rh">
                  Every Innovator Deserves to be <span>Celebrated</span>
                </h3>
                <p className="zx-rec-rdesc">
                  Zenith X promotes motivation, participation and innovation through structured recognition systems — certificates, awards and showcase opportunities that inspire the next generation of
                  creators.
                </p>
                <div className="zx-rec-hls">
                  {RECOG_HIGHLIGHTS.map((hl) => (
                    <div key={hl.t} className="zx-rec-hl">
                      <span className="zx-rec-hl-ico">{hl.ico}</span>
                      <div>
                        <div className="zx-rec-hl-t">{hl.t}</div>
                        <div className="zx-rec-hl-s">{hl.s}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="zx-sec" id="zenith-x-cta">
          <div className="zx-cont">
            <div className="zx-cta-wrap">
              <div className="zx-cta-bg" />
              <div className="zx-cta-in">
                <div className="zx-cta-robot">🤖</div>
                <div>
                  <h2 className="zx-cta-h">
                    Bring <span>Zenith X</span> to Your Campus
                  </h2>
                  <p className="zx-cta-sub">Let&apos;s create exciting experiences that inspire the innovators of tomorrow!</p>
                  <div className="zx-cta-grid">
                    {CTA_BUTTONS.map((b) => (
                      <Link key={b.t} to="/contact" className={`zx-cta-btn${b.hl ? " hl" : ""}`}>
                        <span className="zx-cta-bico">{b.ico}</span>
                        <div>
                          <div className="zx-cta-bt">{b.t}</div>
                          <div className="zx-cta-bs">{b.s}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
