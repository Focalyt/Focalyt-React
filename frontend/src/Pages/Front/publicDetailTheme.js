const publicDetailTheme = `
.foc-public-detail {
  --pd-cyan: var(--foc-cyan, #1ba7ff);
  --pd-magenta: var(--foc-magenta, #ff2daa);
  --pd-navy: var(--foc-navy-deep, #0d2146);
  --pd-text: var(--foc-color-text, #061426);
  --pd-muted: var(--foc-color-text-muted, #3e5876);
  --pd-bg: var(--foc-color-bg, #f5fbff);
  --pd-bg2: var(--foc-color-bg-alt, #eaf4ff);
  --pd-surface: var(--foc-color-surface, #ffffff);
  --pd-border: var(--foc-color-border, rgba(4, 25, 45, 0.12));
  color: var(--pd-text);
  font-family: var(--foc-font-sans, Inter, sans-serif);
  background:
    radial-gradient(900px 420px at 8% -10%, rgba(27, 167, 255, 0.16), transparent 60%),
    radial-gradient(700px 380px at 100% 0%, rgba(255, 45, 170, 0.1), transparent 55%),
    var(--pd-bg);
}
body:has(.foc-public-detail) {
  background: var(--foc-color-bg, #f5fbff) !important;
  color: var(--foc-color-text, #061426) !important;
}
body:has(.foc-public-detail) header,
body:has(.foc-public-detail) .header {
  background-color: transparent !important;
}
.foc-public-detail .section-padding-120 {
  background: transparent;
  padding-top: 36px;
}
.foc-public-detail .pattern,
.foc-public-detail .bg_hexa,
.foc-public-detail #job_theme {
  background-image: none !important;
  background-color: transparent !important;
  box-shadow: none !important;
}
.foc-public-detail .digi,
.foc-public-detail .carousel-item img,
.foc-public-detail .focalgalery img {
  border-radius: 16px !important;
  box-shadow: 0 12px 32px rgba(6, 20, 38, 0.12);
  border: 1px solid var(--pd-border);
  background: var(--pd-surface);
}
.foc-public-detail .student_video,
.foc-public-detail .student_vedio {
  border: none !important;
}
.foc-public-detail .carousel-indicators button,
.foc-public-detail #carouselExampleIndicators .carousel-indicators button.active {
  background-color: var(--pd-cyan) !important;
  border-color: var(--pd-cyan) !important;
}
.foc-public-detail .color-pink,
.foc-public-detail #job_theme .color-pink,
.foc-public-detail h3 {
  color: var(--pd-navy) !important;
  font-family: var(--foc-font-display, Orbitron, sans-serif) !important;
  letter-spacing: 0.04em;
}
.foc-public-detail .text-white,
.foc-public-detail .feature-widget-7__title,
.foc-public-detail .feature-widget-7__title.text-white,
.foc-public-detail .contact-info,
.foc-public-detail .single-footer .contact-info li,
.foc-public-detail .single-footer .faq-info li,
.foc-public-detail .importantTerm,
.foc-public-detail .active .feature-widget-7__icon-wrapper h5 {
  color: var(--pd-text) !important;
}
.foc-public-detail .feature-widget-7__icon-wrapper h5 {
  color: var(--pd-muted) !important;
  font-family: var(--foc-font-sans, Inter, sans-serif) !important;
  font-weight: 600 !important;
  font-size: 15px !important;
}
.foc-public-detail .course_details_col,
.foc-public-detail #job_theme .course_details_col {
  background: var(--pd-surface) !important;
  border: 1px solid color-mix(in srgb, var(--pd-cyan) 28%, var(--pd-border)) !important;
  border-radius: 20px !important;
  box-shadow: 0 10px 28px rgba(27, 167, 255, 0.08);
  position: relative;
  overflow: hidden;
}
.foc-public-detail .course_details_col::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--pd-cyan), var(--pd-magenta));
}
.foc-public-detail .feature-widget-7.border-bottom,
.foc-public-detail #job_theme .feature-widget-7.border-bottom {
  border-bottom: 1px solid var(--pd-border) !important;
}
.foc-public-detail div#apply_modal .feature-widget-7__body p,
.foc-public-detail div#apply_modal img {
  color: var(--pd-text);
}
.foc-public-detail .tag {
  display: inline-block;
  margin: 2px 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(27, 167, 255, 0.12);
  color: var(--pd-navy) !important;
  font-size: 13px;
}
.foc-public-detail ul#pills-tab {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  width: auto;
  margin: 8px auto 4px;
  padding: 6px;
  background: var(--pd-surface);
  border: 1px solid var(--pd-border);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(6, 20, 38, 0.05);
}
.foc-public-detail ul#pills-tab .nav-link,
.foc-public-detail #job_theme ul#pills-tab .nav-link {
  color: var(--pd-muted) !important;
  background: transparent !important;
  border-radius: 10px !important;
  font-family: var(--foc-font-sans, Inter, sans-serif);
  font-weight: 600;
  padding: 8px 16px;
}
.foc-public-detail ul#pills-tab .nav-link.active,
.foc-public-detail #job_theme ul#pills-tab .nav-link.active {
  background: linear-gradient(90deg, var(--pd-cyan), var(--pd-magenta)) !important;
  color: #fff !important;
}
.foc-public-detail .btn.btn_cta_apply,
.foc-public-detail a.btn.btn_cta_apply,
.foc-public-detail button.btn.btn_cta_apply,
.foc-public-detail #job_theme a.btn.btn_cta_apply,
.foc-public-detail #job_theme button.btn.btn_cta_apply,
.foc-public-detail .btn_contact_us {
  background: linear-gradient(90deg, var(--pd-cyan), var(--pd-magenta)) !important;
  color: #fff !important;
  border: none !important;
  border-radius: 4px !important;
  font-family: var(--foc-font-display, Orbitron, sans-serif) !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  letter-spacing: 0.08em;
  padding: 12px 28px !important;
  box-shadow: 0 14px 34px rgba(27, 167, 255, 0.28);
}
.foc-public-detail .btn.btn_cta_apply:hover,
.foc-public-detail a.btn.btn_cta_apply:hover,
.foc-public-detail button.btn.btn_cta_apply:hover,
.foc-public-detail #job_theme a.btn.btn_cta_apply:hover,
.foc-public-detail #job_theme button.btn.btn_cta_apply:hover,
.foc-public-detail .btn_contact_us:hover {
  color: #fff !important;
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(255, 45, 170, 0.28);
}
.foc-public-detail .accordion-item {
  background: var(--pd-surface) !important;
  border: 1px solid var(--pd-border) !important;
}
.foc-public-detail .accordion-button,
.foc-public-detail .accordion-button.collapsed {
  background: var(--pd-surface) !important;
  color: var(--pd-text) !important;
  box-shadow: none !important;
}
.foc-public-detail .accordion-body,
.foc-public-detail .accordion-body p {
  color: var(--pd-muted) !important;
  background: var(--pd-bg2);
}
.foc-public-detail .accordion {
  --bs-accordion-btn-icon: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23061426'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e") !important;
  --bs-accordion-btn-active-icon: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%231ba7ff'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e") !important;
}
.foc-public-detail .review_card {
  background: var(--pd-surface) !important;
  border: 1px solid var(--pd-border) !important;
}
.foc-public-detail .review_details_col {
  background: linear-gradient(90deg, var(--pd-cyan), var(--pd-magenta)) !important;
}
.foc-public-detail .review_details_col h5,
.foc-public-detail .review_details_col p {
  color: #fff !important;
}
.foc-public-detail .similar-section {
  padding: 12px 0 88px;
}
.foc-public-detail .similar-heading {
  margin: 8px 0 16px;
  text-align: center;
  font-family: var(--foc-font-display, Orbitron, sans-serif) !important;
  color: var(--pd-navy) !important;
  letter-spacing: 0.04em;
}
.foc-public-detail .similar-heading span {
  color: var(--pd-cyan) !important;
}
.foc-public-detail .similar-track {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 2px 16px;
  scroll-snap-type: x mandatory;
}
.foc-public-detail .similar-card {
  flex: 0 0 240px;
  scroll-snap-align: start;
  background: var(--pd-surface);
  border: 1px solid color-mix(in srgb, var(--pd-cyan) 24%, var(--pd-border));
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  color: var(--pd-text) !important;
  box-shadow: 0 10px 28px rgba(27, 167, 255, 0.08);
}
.foc-public-detail .similar-card img {
  width: 100%;
  height: 132px;
  object-fit: cover;
  display: block;
  background: var(--pd-bg2);
}
.foc-public-detail .similar-card__body {
  padding: 12px;
}
.foc-public-detail .similar-card__title {
  font-family: var(--foc-font-display, Orbitron, sans-serif);
  font-size: 14px;
  font-weight: 700;
  color: var(--pd-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.foc-public-detail .similar-card__meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--pd-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.similar-live {
  --home-card-cta: var(--foc-navy-deep, #0d2146);
  --home-card-cta-hover: var(--foc-navy-badge, #163565);
  --cyan: var(--foc-cyan, #1ba7ff);
  --red: var(--foc-magenta, #ff2daa);
  --bg: var(--foc-color-bg, #f5fbff);
  --surface: #fff;
  --surface2: #f1f7ff;
  --border: rgba(4, 25, 45, 0.12);
  --text: var(--foc-color-text, #061426);
  --muted: var(--foc-color-text-muted, #3e5876);
  --muted2: var(--foc-color-text-muted-2, #5b7390);
  --r: 14px;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent !important;
  padding-top: 0 !important;
  min-height: 0 !important;
}
.similar-live .similar-track {
  align-items: stretch;
}
.similar-live .similar-track > .course-card {
  flex: 0 0 min(320px, 86vw);
  scroll-snap-align: start;
}
.similar-live .course-card {
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--cyan) 22%, var(--border));
  border-radius: var(--r);
  overflow: hidden;
  position: relative;
  box-shadow: 0 10px 28px rgba(27, 167, 255, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 0;
}
.similar-live .course-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--cyan), var(--red));
  z-index: 2;
  pointer-events: none;
}
.similar-live .course-thumb {
  height: 160px;
  background: var(--surface2);
  position: relative;
  overflow: hidden;
}
.similar-live.foc-jobs-page .course-thumb { overflow: visible; }
.similar-live .course-thumb > img,
.similar-live .course-thumb-media img:first-child {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.similar-live .course-thumb-media {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
}
.similar-live .course-thumb-play {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  z-index: 1;
  pointer-events: none;
}
.similar-live .course-badge {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 2;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.92);
  color: var(--text);
}
.similar-live.foc-jobs-page .course-badge { left: 12px; right: auto; }
.similar-live .course-fee {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 2;
  font-size: 10px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.92);
  border: 1px solid var(--border);
}
.similar-live .course-fee--paid { color: var(--red); }
.similar-live .course-fee--free { color: var(--cyan); }
.similar-live .course-body,
.similar-live .job-card-body {
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.similar-live .job-card-body { text-align: center; gap: 6px; }
.similar-live .course-title,
.similar-live .job-card-title {
  font-family: var(--foc-font-display, Orbitron, sans-serif);
  font-size: 15px;
  font-weight: 700;
  color: var(--text) !important;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.similar-live .job-card-company {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.similar-live .course-sector {
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.similar-live .course-meta,
.similar-live .job-card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.similar-live .course-meta .m,
.similar-live .job-detail-cell {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px;
  min-width: 0;
}
.similar-live .job-detail-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: left;
}
.similar-live .job-detail-icon { width: 18px; height: 18px; object-fit: contain; flex-shrink: 0; }
.similar-live .job-detail-cell span,
.similar-live .course-meta .m span {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.similar-live .course-meta .m strong {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted2);
  margin-bottom: 4px;
}
.similar-live .course-meta .m--wide {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.similar-live .course-meta .m--wide strong { display: inline; margin-bottom: 0; }
.similar-live .course-meta .m--wide span { display: inline; text-align: right; font-weight: 600; }
.similar-live .job-card-deadline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.similar-live .job-card-deadline__label { font-size: 12px; color: var(--muted); }
.similar-live .job-card-deadline__date { font-size: 13px; font-weight: 700; color: #c9a227; }
.similar-live .course-action-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.similar-live .btn.cta-callnow,
.similar-live .btn.cta-callnow.btn-bg-color {
  background: var(--home-card-cta) !important;
  color: #fff !important;
  border: 1px solid var(--home-card-cta) !important;
  border-radius: 50px !important;
  font-family: var(--foc-font-sans, Inter, sans-serif) !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  letter-spacing: 0 !important;
  padding: 8px 10px !important;
  box-shadow: none !important;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.similar-live .btn.cta-callnow:not(.btn-bg-color) {
  background: #fff !important;
  color: var(--home-card-cta) !important;
}
.similar-live .course-callback-btn { margin-top: 6px; }
.similar-live .course_card_footer {
  background: var(--home-card-cta);
  text-align: center;
  padding: 8px 10px;
  margin-top: auto;
}
.similar-live .course-learn-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
}
.similar-live .course-learn-more .learnn { color: #fff !important; font-size: 13px; font-weight: 600; }
.similar-live .course-learn-more__icon { width: 18px; height: auto; display: block; }
.similar-live .verified-badge-container {
  position: absolute;
  top: 10px;
  right: 7px;
  width: 15px;
  height: 15px;
  z-index: 4;
}
.similar-live .verified-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  object-fit: contain;
}
@media (max-width: 767px) {
  .foc-public-detail ul#pills-tab {
    width: 100%;
  }
  .foc-public-detail .course_details_col,
  .foc-public-detail #job_theme .course_details_col {
    padding: 16px 12px !important;
  }
}
`;

export default publicDetailTheme;
