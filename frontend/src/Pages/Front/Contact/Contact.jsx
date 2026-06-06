import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faYoutube, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { Mail, Send } from "lucide-react";
import FrontLayout from "../../../Component/Layouts/Front";
import axios from "axios";

const CONTACT = {
  address:
    "SCF 3–4, 2nd Floor, Shiva Complex, Patiala Road, opposite Hyundai Showroom, Swastik Vihar, Zirakpur, Punjab 140603",
  phone: "+91 86990 11108",
  phoneHref: "tel:+918699011108",
  email: "info@focalyt.com",
  emailHref: "mailto:info@focalyt.com",
};

const SOCIAL_LINKS = [
  { href: "https://www.facebook.com/focalyt.learn/", icon: faFacebook, label: "Facebook" },
  { href: "https://www.instagram.com/p/CX3iTqQFHQF/", icon: faInstagram, label: "Instagram" },
  { href: "https://www.youtube.com/@focalyt", icon: faYoutube, label: "YouTube" },
  {
    href: "https://www.linkedin.com/company/focalytlearn?originalSubdomain=in",
    icon: faLinkedin,
    label: "LinkedIn",
  },
];

const MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1757443.9613018557!2d76.809794!3d30.647828!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390feb1926579155%3A0x6704ed8197f6f017!2sFocal%20Skill%20Development%20Pvt.%20Ltd.!5e0!3m2!1sen!2sin!4v1682307065688!5m2!1sen!2sin";

function Contact() {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-foc-theme", "sky-magenta");
    root.style.setProperty("--front-layout-bg", "var(--foc-color-bg)");
    return () => {
      root.style.removeProperty("--front-layout-bg");
    };
  }, []);

  const handleSubmit = useCallback(
    async (recaptchaToken) => {
      const form = document.getElementById("contactform");
      if (!form) return;

      setSubmitting(true);
      const formDataObj = new FormData(form);
      formDataObj.append("g-recaptcha-response", recaptchaToken);

      try {
        await axios.post(`${backendUrl}/contact`, formDataObj);
        alert("Message sent successfully!");
        form.reset();
        if (window.grecaptcha?.reset) {
          window.grecaptcha.reset();
        }
      } catch (err) {
        console.error("Contact form error:", err);
        alert("Something went wrong!");
      } finally {
        setSubmitting(false);
      }
    },
    [backendUrl]
  );

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    window.onSubmit = (token) => {
      handleSubmit(token);
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      delete window.onSubmit;
    };
  }, [handleSubmit]);

  return (
    <FrontLayout>
      <div className="foc-cyber-home foc-contact-page">
        <section className="section grid-bg" id="contact">
          <div className="container">
            <div className="section-head">
              <div className="stag">Reach Out</div>
              <h1 className="sh2">
                Contact <span className="cyan">Us</span>
              </h1>
              <p className="s-body">We would love to hear from you. Send us a message or visit our office.</p>
            </div>

            <div className="contact-grid">
              <aside className="contact-info-card">
                <h2 className="contact-card-title">Get in touch</h2>
                <p className="contact-card-sub">Our team typically responds within 1–2 business days.</p>

                <ul className="contact-details">
                  {/* <li>
                    <span className="contact-details__icon" aria-hidden>
                      <MapPin size={18} />
                    </span>
                    <div>
                      <strong>Our Location</strong>
                      <p>{CONTACT.address}</p>
                    </div>
                  </li>
                  <li>
                    <span className="contact-details__icon" aria-hidden>
                      <Phone size={18} />
                    </span>
                    <div>
                      <strong>Phone</strong>
                      <p>
                        <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
                      </p>
                    </div>
                  </li> */}
                  <li>
                    <span className="contact-details__icon" aria-hidden>
                      <Mail size={18} />
                    </span>
                    <div>
                      <strong>Email</strong>
                      <p>
                        <a href={CONTACT.emailHref}>{CONTACT.email}</a>
                      </p>
                    </div>
                  </li>
                </ul>

                <div className="contact-social">
                  <h3 className="contact-social__title">Follow us</h3>
                  <div className="contact-social__links">
                    {SOCIAL_LINKS.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="contact-social__btn"
                        aria-label={link.label}
                      >
                        <FontAwesomeIcon icon={link.icon} />
                      </a>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="contact-form-card">
                <h2 className="contact-card-title">Send a message</h2>
                <form
                  id="contactform"
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                  <div className="contact-form-fields">
                    <div className="contact-field">
                      <label className="contact-label" htmlFor="contact-name">
                        Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        required
                        placeholder="Your name"
                      />
                    </div>
                    <div className="contact-field">
                      <label className="contact-label" htmlFor="contact-mobile">
                        Phone
                      </label>
                      <input
                        id="contact-mobile"
                        type="tel"
                        name="mobile"
                        required
                        placeholder="10-digit mobile"
                      />
                    </div>
                    <div className="contact-field">
                      <label className="contact-label" htmlFor="contact-email">
                        Email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        required
                        placeholder="you@email.com"
                      />
                    </div>
                    <div className="contact-field">
                      <label className="contact-label" htmlFor="contact-message">
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={5}
                        required
                        placeholder="How can we help you?"
                      />
                    </div>
                  </div>
                  <div className="contact-form-footer">
                    <button
                      type="submit"
                      className="g-recaptcha contact-submit-btn"
                      data-sitekey="6Lej1gsqAAAAAEs4KUUi8MjisY4_PKrC5s9ArN1v"
                      data-callback="onSubmit"
                      disabled={submitting}
                    >
                      <Send size={16} aria-hidden />
                      {submitting ? "Sending…" : "Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="contact-map-card">
              <iframe
                title="Focalyt office location"
                src={MAP_EMBED}
                width="100%"
                height="320"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </div>

      <style>{`
.foc-cyber-home.foc-contact-page,
.foc-cyber-home.foc-contact-page * { box-sizing: border-box; }
.foc-cyber-home.foc-contact-page {
  --cyan: var(--foc-cyan);
  --red: var(--foc-magenta);
  --bg: var(--foc-color-bg);
  --surface: var(--foc-color-surface);
  --border: rgba(4, 25, 45, .12);
  --text: var(--foc-color-text);
  --muted: var(--foc-color-text-muted);
  --muted2: var(--foc-color-text-muted-2);
  --orb1: rgba(27,167,255,.14);
  --orb2: rgba(255,45,170,.12);
  --grid-line: rgba(6,20,38,.055);
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
  padding-bottom: 48px;
}
.foc-contact-page > section {
  padding: 24px 0 48px;
  background: var(--bg) !important;
  position: relative;
}
.foc-contact-page .container {
  max-width: var(--foc-container-max);
  margin: 0 auto;
  padding: 0 var(--foc-container-pad);
  position: relative;
  z-index: 1;
}
.foc-contact-page .grid-bg::before {
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
.foc-contact-page .section-head { text-align: center; margin-bottom: 32px; }
.foc-contact-page .stag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--cyan-soft);
  border: 1px solid var(--border);
  color: var(--cyan);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .16em;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 2px;
  margin-top: 24px;
  margin-bottom: 14px;
}
.foc-contact-page .stag::before { content: '//'; color: var(--red); }
.foc-contact-page .sh2 {
  font-family: var(--foc-font-display), Orbitron, sans-serif;
  font-size: clamp(26px, 4vw, 44px);
  font-weight: 700;
  color: var(--text);
  line-height: 1.1;
  letter-spacing: .04em;
  margin: 0;
}
.foc-contact-page .sh2 .cyan {
  background: linear-gradient(90deg, var(--cyan), var(--red));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
.foc-contact-page .s-body {
  font-size: 15px;
  color: var(--muted);
  margin: 12px auto 0;
  text-align: center;
  line-height: 1.75;
  font-style: italic;
  // max-width: 560px;
}
.foc-contact-page .contact-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 24px;
}
@media (min-width: 992px) {
  .foc-contact-page .contact-grid {
    grid-template-columns: 1fr 1.1fr;
    align-items: start;
  }
}
.foc-contact-page .contact-info-card,
.foc-contact-page .contact-form-card,
.foc-contact-page .contact-map-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 24px;
  box-shadow: 0 12px 32px rgba(27, 167, 255, 0.06);
}
.foc-contact-page .contact-card-title {
  font-family: var(--foc-font-display), Orbitron, sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  margin: 0 0 8px;
  color: var(--text);
}
.foc-contact-page .contact-card-sub {
  font-size: 14px;
  color: var(--muted);
  margin: 0 0 20px;
  line-height: 1.6;
}
.foc-contact-page .contact-details {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.foc-contact-page .contact-details li {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.foc-contact-page .contact-details__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--cyan-soft);
  border: 1px solid var(--border);
  color: var(--cyan);
}
.foc-contact-page .contact-details strong {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 4px;
}
.foc-contact-page .contact-details p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
}
.foc-contact-page .contact-details a {
  color: var(--cyan);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s var(--ease);
}
.foc-contact-page .contact-details a:hover {
  color: var(--red);
}
.foc-contact-page .contact-social {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}
.foc-contact-page .contact-social__title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 12px;
}
.foc-contact-page .contact-social__links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.foc-contact-page .contact-social__btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--muted);
  font-size: 18px;
  text-decoration: none;
  transition: color 0.2s var(--ease), border-color 0.2s var(--ease), transform 0.2s var(--ease), box-shadow 0.2s var(--ease);
}
.foc-contact-page .contact-social__btn:hover {
  color: var(--red);
  border-color: rgba(255, 45, 170, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 45, 170, 0.12);
}
.foc-contact-page .contact-form-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.foc-contact-page .contact-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 6px;
}
.foc-contact-page #contactform input,
.foc-contact-page #contactform textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 11px 14px;
  font-size: 14px;
  font-family: var(--foc-font-sans);
  background: var(--bg);
  color: var(--text);
  transition: border-color 0.2s var(--ease), box-shadow 0.2s var(--ease);
}
.foc-contact-page #contactform input::placeholder,
.foc-contact-page #contactform textarea::placeholder {
  color: var(--muted2);
}
.foc-contact-page #contactform input:focus,
.foc-contact-page #contactform textarea:focus {
  outline: none;
  border-color: rgba(27, 167, 255, 0.45);
  box-shadow: 0 0 0 3px rgba(27, 167, 255, 0.12);
}
.foc-contact-page #contactform textarea {
  resize: vertical;
  min-height: 120px;
}
.foc-contact-page .contact-form-footer {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}
.foc-contact-page .contact-submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 28px;
  border: none;
  border-radius: 50px;
  font-family: var(--foc-font-sans);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: #fff;
  background: var(--foc-color-cta, #fc2b5a);
  cursor: pointer;
  transition: transform 0.2s var(--ease), box-shadow 0.2s var(--ease), color 0.2s ease;
}
.foc-contact-page .contact-submit-btn:hover:not(:disabled) {
  color: var(--cyan);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(252, 43, 90, 0.28);
}
.foc-contact-page .contact-submit-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
.foc-contact-page .contact-map-card {
  padding: 0;
  overflow: hidden;
}
.foc-contact-page .contact-map-card iframe {
  display: block;
  width: 100%;
  border-radius: var(--r);
}
@media (max-width: 576px) {
  .foc-contact-page .contact-info-card,
  .foc-contact-page .contact-form-card {
    padding: 18px;
  }
  .foc-contact-page .contact-form-footer {
    justify-content: stretch;
  }
  .foc-contact-page .contact-submit-btn {
    width: 100%;
  }
}
      `}</style>
    </FrontLayout>
  );
}

export default Contact;
