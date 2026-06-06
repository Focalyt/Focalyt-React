import React, { useEffect, useState } from "react";
import moment from "moment";
import axios from "axios";
import FrontLayout from "../../../Component/Layouts/Front";
import { resolveMediaUrl } from "../../../utils/resolveMediaUrl";

const THUMB_FALLBACK = "/Assets/public_assets/images/newjoblisting/digital_marketing.jpg";

export function EventCard({ event, bucketUrl, closed, onPlayVideo }) {
  const dateFrom = event?.timing?.from ? moment(event.timing.from).format("DD-MM-YYYY") : "NA";
  const dateTo = event?.timing?.to ? moment(event.timing.to).format("DD-MM-YYYY") : "NA";
  const timeFrom = event?.timing?.from ? moment(event.timing.from).format("hh:mm A") : "NA";
  const timeTo = event?.timing?.to ? moment(event.timing.to).format("hh:mm A") : "NA";
  const loc = event?.location?.city ? `${event.location.city}, ${event.location.state}` : "NA";
  const mode = event?.eventMode ?? "NA";
  const thumb = resolveMediaUrl(bucketUrl, event?.thumbnail) || THUMB_FALLBACK;
  const hasVideo = Boolean(event?.video);

  return (
    <article className="event-card">
      <div className="event-thumb-wrap">
        {hasVideo ? (
          <button
            type="button"
            className="event-thumb"
            data-bs-toggle="modal"
            data-bs-target="#videoModal"
            onClick={() => onPlayVideo(resolveMediaUrl(bucketUrl, event.video))}
            aria-label={`Play video for ${event?.name ?? "event"}`}
          >
            <img src={thumb} alt={event?.name ?? "Event"} />
            <span className="event-play">
              <img src="/Assets/public_assets/images/newjoblisting/play.svg" alt="" />
            </span>
          </button>
        ) : (
          <div className="event-thumb event-thumb--static">
            <img src={thumb} alt={event?.name ?? "Event"} />
          </div>
        )}
        <span className={`event-status ${closed ? "closed" : "open"}`}>
          {closed ? "Registration Closed" : "Registration Open"}
        </span>
      </div>

      <div className="event-body">
        <div className="event-title" title={event?.eventTitle ?? event?.name}>
          {event?.name ?? "Event"}
        </div>
        {event?.eventTitle ? (
          <div className="event-subtitle" title={event.eventTitle}>
            {event.eventTitle}
          </div>
        ) : null}

        <div className="event-meta">
          <div className="m">
            <strong>Date</strong>
            <span>
              {dateFrom} → {dateTo}
            </span>
          </div>
          <div className="m">
            <strong>Time</strong>
            <span>
              {timeFrom} → {timeTo}
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
          <a
            className={`btn-primary${closed ? " disabled" : ""}`}
            href="/candidate/login?returnUrl=/candidate/candidateevent"
            onClick={(e) => {
              if (closed) e.preventDefault();
            }}
          >
            Apply Now →
          </a>
        </div>
      </div>
    </article>
  );
}

function Event() {
  const [events, setEvents] = useState([]);
  const [videoSrc, setVideoSrc] = useState("");
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-foc-theme", "sky-magenta");
    root.style.setProperty("--front-layout-bg", "var(--foc-color-bg)");
    return () => {
      root.style.removeProperty("--front-layout-bg");
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/event`);
        setEvents(response.data.events ?? []);
      } catch (error) {
        console.error("Error fetching events data:", error);
      }
    };
    fetchData();
  }, [backendUrl]);

  useEffect(() => {
    const videoModal = document.getElementById("videoModal");
    const onHidden = () => setVideoSrc("");
    if (videoModal) {
      videoModal.addEventListener("hidden.bs.modal", onHidden);
    }
    return () => {
      if (videoModal) {
        videoModal.removeEventListener("hidden.bs.modal", onHidden);
      }
    };
  }, []);

  const checkRegistrationStatus = (eventDate) => {
    const today = moment();
    const eventEndDate = moment(eventDate);
    return eventEndDate.isBefore(today);
  };

  const liveEvents = events.filter((e) => !checkRegistrationStatus(e.timing?.to));
  const expiredEvents = events.filter((e) => checkRegistrationStatus(e.timing?.to));

  const renderGrid = (list, emptyLabel) => {
    if (list.length === 0) {
      return (
        <div className="events-empty">
          <h3>{emptyLabel}</h3>
          <p>Check back soon for new events.</p>
        </div>
      );
    }
    return (
      <div className="events-grid">
        {list.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            bucketUrl={bucketUrl}
            closed={checkRegistrationStatus(event.timing?.to)}
            onPlayVideo={setVideoSrc}
          />
        ))}
      </div>
    );
  };

  return (
    <FrontLayout>
      <div className="foc-cyber-home foc-events-page">
        <section className="section grid-bg" id="events-live">
          <div className="container">
            <div className="section-head">
              <div className="stag">Latest Updates</div>
              <h1 className="sh2">
                Live <span className="cyan">Events</span>
              </h1>
              <p className="s-body">Explore our latest events and register to participate.</p>
            </div>
            {renderGrid(liveEvents, "No live events right now")}
          </div>
        </section>

        {expiredEvents.length > 0 && (
          <section className="section section-alt grid-bg" id="events-expired">
            <div className="container">
              <div className="section-head">
                <h2 className="sh2">
                  Expired <span className="red">Events</span>
                </h2>
                <p className="s-body">Recent events whose registration is closed.</p>
              </div>
              {renderGrid(expiredEvents, "No expired events")}
            </div>
          </section>
        )}

        <div className="modal fade event-video-modal" id="videoModal" tabIndex="-1" aria-labelledby="videoModalTitle" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content event-video-modal__content">
              <button
                type="button"
                className="event-video-modal__close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
              <div className="modal-body p-0 text-center embed-responsive">
                <video key={videoSrc} id="eventVid" controls className="video-fluid text-center">
                  <source src={videoSrc} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
.foc-cyber-home.foc-events-page, .foc-cyber-home.foc-events-page * { box-sizing: border-box; }
.foc-cyber-home.foc-events-page {
  --home-card-cta: var(--foc-navy-deep, #0d2146);
  --home-card-cta-hover: var(--foc-navy-badge, #163565);
  --cyan: var(--foc-cyan);
  --red: var(--foc-magenta);
  --bg: var(--foc-color-bg);
  --bg2: var(--foc-color-bg-alt);
  --surface: var(--foc-color-surface);
  --surface2: var(--foc-color-surface-2);
  --border: rgba(4, 25, 45, .12);
  --text: var(--foc-color-text);
  --muted: var(--foc-color-text-muted);
  --muted2: var(--foc-color-text-muted-2);
  --orb1: rgba(27,167,255,.14);
  --orb2: rgba(255,45,170,.12);
  --grid-line: rgba(6,20,38,.055);
  --cyan-glow: rgba(27,167,255,.22);
  --cyan-soft: rgba(27,167,255,.085);
  --r: var(--foc-radius-lg);
  --ease: var(--foc-ease);
  font-family: var(--foc-font-sans);
  background: var(--bg);
  color: var(--text);
  min-height: 100%;
  position: relative;
  overflow-x: hidden;
  padding-top: 88px;
}
.foc-events-page > section {
  padding: 15px 0;
  background: var(--bg) !important;
  position: relative;
}
.foc-events-page > section.section-alt { background: var(--bg2) !important; }
.foc-events-page .container {
  max-width: var(--foc-container-max);
  margin: 0 auto;
  padding: 0 var(--foc-container-pad);
  position: relative;
  z-index: 1;
}
.foc-events-page .grid-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 18% 12%, var(--orb1) 0%, transparent 55%),
    radial-gradient(circle at 82% 28%, var(--orb2) 0%, transparent 60%),
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: auto, auto, 48px 48px, 48px 48px;
  opacity: .9;
  pointer-events: none;
}
.foc-events-page .section-head { text-align: center; margin-bottom: 30px; }
.foc-events-page .stag {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--cyan-soft);
  border: 1px solid var(--border);
  color: var(--cyan);
  font-size: 10px; font-weight: 600;
  letter-spacing: .16em; text-transform: uppercase;
  padding: 5px 14px; border-radius: 2px;
  margin-top: 40px;
}
.foc-events-page .stag::before { content: '//'; color: var(--red); }
.foc-events-page .sh2 {
  font-family: var(--foc-font-display);
  font-size: clamp(26px, 4vw, 44px);
  font-weight: 700;
  color: var(--text);
  line-height: 1.1;
  letter-spacing: .04em;
  margin: 0;
}
.foc-events-page .sh2 .cyan {
  background: linear-gradient(90deg, var(--cyan), var(--red));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
.foc-events-page .sh2 .red { color: var(--red) !important; }
.foc-events-page .s-body {
  font-size: 15px;
  color: var(--muted);
  margin: 12px auto 0;
  text-align: center;
  line-height: 1.75;
  font-style: italic;
  // max-width: 560px;
}
.foc-events-page .events-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
@media (min-width: 768px) {
  .foc-events-page .events-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1200px) {
  .foc-events-page .events-grid { grid-template-columns: repeat(3, 1fr); }
}
.foc-events-page .event-card {
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--ev-accent) 22%, var(--border));
  border-radius: var(--r);
  overflow: hidden;
  position: relative;
  --ev-accent: var(--cyan);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--ev-accent) 12%, rgba(0,0,0,.06));
  display: flex;
  flex-direction: column;
}
.foc-events-page .events-grid .event-card:nth-child(4n + 1) { --ev-accent: var(--cyan); border-radius: 14px 20px 14px 16px; }
.foc-events-page .events-grid .event-card:nth-child(4n + 2) { --ev-accent: var(--red); border-radius: 18px 12px 22px 14px; }
.foc-events-page .events-grid .event-card:nth-child(4n + 3) { --ev-accent: color-mix(in srgb, var(--cyan) 55%, var(--red)); border-radius: 12px 18px 14px 20px; }
.foc-events-page .events-grid .event-card:nth-child(4n) { --ev-accent: color-mix(in srgb, var(--red) 70%, var(--foc-purple)); border-radius: var(--foc-radius-xl) 14px 16px 18px; }
.foc-events-page .event-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--ev-accent), color-mix(in srgb, var(--ev-accent) 35%, transparent));
  z-index: 2;
  pointer-events: none;
}
.foc-events-page .event-thumb-wrap { position: relative; }
.foc-events-page .event-thumb {
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
.foc-events-page .event-thumb--static { cursor: default; }
.foc-events-page .event-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.foc-events-page .event-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(11,18,32,.35));
  pointer-events: none;
}
.foc-events-page .event-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
}
.foc-events-page .event-play img { width: 52px; height: 52px; }
.foc-events-page .event-status {
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
.foc-events-page .event-status.closed { border-color: rgba(255,45,122,.28); color: var(--red); }
.foc-events-page .event-status.open { border-color: rgba(27,167,255,.28); color: var(--cyan); }
.foc-events-page .event-body {
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 0 1 auto;
}
.foc-events-page .event-card {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
}
.foc-events-page .event-title {
  font-family: var(--foc-font-display), Orbitron, sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  letter-spacing: 0.02em;
}
.foc-events-page .event-subtitle {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  font-size: 12px; color: var(--muted); line-height: 1.55;
}
.foc-events-page .event-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.foc-events-page .event-meta .m {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px;
}
.foc-events-page .event-meta .m strong {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted2);
  margin-bottom: 4px;
}
.foc-events-page .event-meta .m span {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.4;
}
.foc-events-page .event-status {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
}
.foc-events-page .event-actions { margin-top: 2px; }
.foc-events-page .btn-primary {
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  display: block;
  width: 100%;
  text-align: center;
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0;
  background: var(--home-card-cta) !important;
  color: var(--foc-color-text-inverse);
  border: 1px solid var(--home-card-cta);
  box-shadow: none;
  text-shadow: none;
  transition: background .2s var(--ease), border-color .2s var(--ease);
}
.foc-events-page .btn-primary:hover:not(.disabled) {
  background: var(--home-card-cta-hover) !important;
  border-color: var(--home-card-cta-hover);
  transform: none;
}
.foc-events-page .btn-primary.disabled { opacity: .55; cursor: not-allowed; pointer-events: none; }
.foc-events-page .events-empty { text-align: center; padding: 15px 0px; color: var(--muted); }
.foc-events-page .events-empty h3 { font-family: var(--foc-font-display); color: var(--text); margin-bottom: 8px; }
.foc-events-page #eventVid { width: 100%; border-radius: 10px; outline: none; }

.event-video-modal .event-video-modal__content {
  position: relative;
  border: none;
  background: #000;
  overflow: visible;
}
.event-video-modal .modal-body {
  padding: 0;
}
.event-video-modal__close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  width: 30px;
  height: 30px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a2e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  opacity: 1;
  float: none;
  transition: background 0.2s ease, transform 0.2s ease;
}
.event-video-modal__close:hover {
  background: #fff;
  transform: scale(1.05);
}
.event-video-modal__close span {
  display: block;
  font-size: 22px;
  line-height: 1;
  font-weight: 400;
  margin-top: -2px;
}
      `}</style>
    </FrontLayout>
  );
}

export default Event;
