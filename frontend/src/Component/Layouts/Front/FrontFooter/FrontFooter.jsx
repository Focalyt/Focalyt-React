import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { faFacebookF, faLinkedinIn, faYoutube, faInstagram } from "@fortawesome/free-brands-svg-icons";
import {
  BookOpen,
  Briefcase,
  BriefcaseBusiness,
  CalendarDays,
  Cog,
  Compass,
  FlaskConical,
  GraduationCap,
  Handshake,
  Home,
  Images,
  Mail,
  MapPin,
  Phone,
  Share2,
  Sparkles,
  User,
  Clock,
  FileUp,
  Zap,
} from "lucide-react";
import axios from "axios";
import "./FrontFooter.css";
import AppDownloadBanner from "../../../Front/AppDownloadBanner";

const HOME_SECTION_SCROLL_OFFSET = 130;

const SUB_TABS = [
  { label: "Impact", sectionId: "about", icon: Zap },
  { label: "Labs", sectionId: "labs", icon: FlaskConical },
  { label: "Industry 4.0", sectionId: "industry-automation", icon: Cog },
  { label: "Zenith X", sectionId: "zenith-x", icon: Sparkles },
  { label: "Events", sectionId: "events", icon: CalendarDays },
  { label: "Courses", sectionId: "future-courses", icon: BookOpen },
  { label: "Jobs", sectionId: "future-jobs", icon: BriefcaseBusiness },
  { label: "Approach", sectionId: "our-approach", icon: Compass },
  { label: "Partners", sectionId: "partners", icon: Handshake },
  { label: "Media", sectionId: "media", icon: Images },
  { label: "Our Reach", sectionId: "geographic-reach", icon: MapPin },
];

const FOOTER_CONTACT = {
  address: "SCF 3–4, 2nd Floor, Shiva Complex, Patiala Road, opposite Hyundai Showroom, Swastik Vihar, Zirakpur, Punjab 140603",
  phone: "+91 86990 11108",
  phoneHref: "tel:+918699011108",
  email: "info@focalyt.com",
  emailHref: "mailto:info@focalyt.com",
};

const SOCIAL_LINKS = [
  { href: "https://www.facebook.com/focalyt.learn/", icon: faFacebookF, label: "Facebook" },
  { href: "https://www.instagram.com/p/CX3iTqQFHQF/", icon: faInstagram, label: "Instagram" },
  { href: "https://www.linkedin.com/company/focalytlearn?originalSubdomain=in", icon: faLinkedinIn, label: "LinkedIn" },
  { href: "https://www.youtube.com/@focalyt", icon: faYoutube, label: "YouTube" },
];

const GOOGLE_PLAY_LINK = "#";

function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const scrollToHomeSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - HOME_SECTION_SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    window.history.replaceState(null, "", `/#${sectionId}`);
  };

  const handleSubTabClick = (e, tab) => {
    if (!tab.sectionId) return;
    e.preventDefault();
    if (isHomePage) {
      scrollToHomeSection(tab.sectionId);
    } else {
      navigate(`/#${tab.sectionId}`);
    }
  };
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    email: "",
    location: "",
    position: "",
    experience: "",
    cv: null,
    info: "",
    termsAccepted: false,
  });
  const [careerSubmitting, setCareerSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") setFormData({ ...formData, [name]: files[0] });
    else if (type === "checkbox") setFormData({ ...formData, [name]: checked });
    else setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cv) {
      alert("Please upload your CV before submitting the form.");
      return;
    }
    if (!formData.termsAccepted) {
      alert("Please agree to the terms and conditions.");
      return;
    }
    setCareerSubmitting(true);
    try {
      const submissionData = new FormData();
      submissionData.append("name", formData.name);
      submissionData.append("email", formData.email);
      submissionData.append("number", formData.number);
      submissionData.append("location", formData.location);
      submissionData.append("position", formData.position);
      submissionData.append("experience", formData.experience);
      submissionData.append("cv", formData.cv);
      submissionData.append("info", formData.info);
      submissionData.append("termsAccepted", formData.termsAccepted);
      await axios.post(`${backendUrl}/career`, submissionData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Application submitted successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Career form error:", error);
      alert("Something went wrong while submitting.");
    } finally {
      setCareerSubmitting(false);
    }
  };

  return (
    <>
      <div
        id="mobile-footer-nav"
        className="d-xxl-none d-xl-none d-lg-none d-md-none d-sm-block d-block mt-xxl-0 mt-xl-0 mt-lg-0 mt-md-0 mt-sm-4"
      >
        <div className="container">
          <div className="footer-nav position-relative">
            <ul className="h-100 d-flex align-items-center justify-content-between mb-0">
              <li>
                <Link to="/">
                  <span className="footer-nav-icon" aria-hidden>
                    <Home size={18} strokeWidth={2} />
                  </span>
                  <span className="footer-nav-label pt-1">Home</span>
                </Link>
              </li>
              <li>
                <Link to="/courses">
                  <span className="footer-nav-icon" aria-hidden>
                    <GraduationCap size={18} strokeWidth={2} />
                  </span>
                  <span className="footer-nav-label pt-1">Courses</span>
                </Link>
              </li>
              <li className="login_col">
                <Link to="/candidate/login">
                  <span className="login_ty">Login</span>
                </Link>
              </li>
              <li>
                <Link to="/joblisting">
                  <span className="footer-nav-icon" aria-hidden>
                    <Briefcase size={18} strokeWidth={2} />
                  </span>
                  <span className="footer-nav-label pt-1">Jobs</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://api.whatsapp.com/send?text=Check%20out%20Focalyt's%20courses%20and%20job%20opportunities%20at%20https://focalyt.com.%20Enhance%20your%20skills%20and%20secure%20a%20great%20job%20now"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="footer-nav-icon" aria-hidden>
                    <Share2 size={18} strokeWidth={2} />
                  </span>
                  <span className="footer-nav-label pt-1">Share</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="footer-v2 footer-padding-default footer-l02 ftr-new" id="footer">
        <div className="container">
          <div className="ftr-grid">
            <div className="ftr-brand-col">
              <Link to="/" className="ftr-brand">
                <img src="/Assets/images/logo/focalyt_new_logo.png" alt="Focalyt" />
              </Link>
              <AppDownloadBanner variant="footer" />
              <ul className="list-social list-social--hvr-black ftr-social">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                      <FontAwesomeIcon icon={s.icon} size="lg" />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="ftr-download-card">
                <h4 className="ftr-download-heading">Download App From</h4>
                <a
                  className="ftr-playstore-button"
                  href={GOOGLE_PLAY_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get Focalyt on Google Play"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    className="ftr-playstore-icon"
                    viewBox="0 0 512 512"
                    aria-hidden="true"
                  >
                    <path d="M99.617 8.057a50.191 50.191 0 00-38.815-6.713l230.932 230.933 74.846-74.846L99.617 8.057zM32.139 20.116c-6.441 8.563-10.148 19.077-10.148 30.199v411.358c0 11.123 3.708 21.636 10.148 30.199l235.877-235.877L32.139 20.116zM464.261 212.087l-67.266-37.637-81.544 81.544 81.548 81.548 67.273-37.64c16.117-9.03 25.738-25.442 25.738-43.908s-9.621-34.877-25.749-43.907zM291.733 279.711L60.815 510.629c3.786.891 7.639 1.371 11.492 1.371a50.275 50.275 0 0027.31-8.07l266.965-149.372-74.849-74.847z" />
                  </svg>
                  <span className="ftr-playstore-texts">
                    <span className="ftr-playstore-text-1">GET IT ON</span>
                    <span className="ftr-playstore-text-2">Google Play</span>
                  </span>
                </a>
              </div>
            </div>

            <div className="ftr-col">
              <h4 className="ftr-heading color-pink">About Us</h4>
              <ul className="footer-list ftr-links p-0">
                <li><Link to="/about#focalytTeam">Our Team</Link></li>
                <li><Link to="/about#vision">Mission</Link></li>
                <li><Link to="/about#vision">Vision</Link></li>
                <li><Link to="/community">Community</Link></li>
              </ul>
            </div>

            <div className="ftr-col">
              <h4 className="ftr-heading color-pink">Useful Links</h4>
              <ul className="footer-list ftr-links p-0">
                <li>
                  <a href="#" data-bs-toggle="modal" data-bs-target="#careerModal">Career</a>
                </li>
                <li><Link to="/results">Results</Link></li>
                {/* <li><Link to="/contact">Partner With Us</Link></li> */}
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>

            <div className="ftr-col ftr-contact-col">
              <h4 className="ftr-heading color-pink">Contact Us</h4>
              <ul className="ftr-contact-list p-0">
                {/* <li>
                  <span className="ftr-contact-ico" aria-hidden><MapPin size={16} strokeWidth={2} /></span>
                  <address className="ftr-contact-text">{FOOTER_CONTACT.address}</address>
                </li>
                <li>
                  <span className="ftr-contact-ico" aria-hidden><Phone size={16} strokeWidth={2} /></span>
                  <a href={FOOTER_CONTACT.phoneHref} className="ftr-contact-text ftr-contact-link">
                    {FOOTER_CONTACT.phone}
                  </a>
                </li> */}
                <li>
                  <span className="ftr-contact-ico" aria-hidden><Mail size={16} strokeWidth={2} /></span>
                  <a href={FOOTER_CONTACT.emailHref} className="ftr-contact-text ftr-contact-link">
                    {FOOTER_CONTACT.email}
                  </a>
                </li>
              </ul>
              <button
                type="button"
                className="ftr-contact-cta"
                data-bs-toggle="modal"
                data-bs-target="#partnerModal"
              >
                Partner With Us →
              </button>
            </div>
          </div>

          <nav className="ftr-section-tabs" aria-label="Homepage sections">
            {SUB_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <a
                  key={tab.label}
                  href={`/#${tab.sectionId}`}
                  className="ftr-section-tab"
                  onClick={(e) => handleSubTabClick(e, tab)}
                  aria-label={tab.label}
                >
                  <Icon className="ftr-section-tab-icon" aria-hidden="true" size={16} strokeWidth={2.1} />
                  <span>{tab.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        <div className="ftr-bottom">
          <div className="container">
            <p className="ftr-copy">
              © Copyright {new Date().getFullYear()}, All Rights Reserved by{" "}
              <span className="ftr-copy-brand color-pink">FOCALYT</span>
            </p>
          </div>
        </div>
      </footer>

      <div className="modal fade" id="careerModal" tabIndex="-1" aria-labelledby="careerModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable career-modal-dialog">
          <div className="modal-content career-modal-content">
            <div className="modal-header career-modal-header">
              <div className="career-modal-header-inner">
                <span className="career-modal-emoji" aria-hidden="true">
                  💼
                </span>
                <div>
                  <h5 className="career-modal-title" id="careerModalLabel">
                    Career Opportunities
                  </h5>
                  <p className="career-modal-tagline">Build the future of skills and employability with us</p>
                </div>
              </div>
              <button type="button" className="btn-close career-modal-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body career-modal-body">
              <p className="career-modal-intro">
                Share your details below. Our team will review your application and get in touch if there is a suitable opening.
              </p>
              <section id="current-openings">
                <form method="post" id="careerForm" onSubmit={handleSubmit}>
                  <h4 className="career-section-title">
                    <span className="career-section-accent">Personal</span> Information
                  </h4>
                  <div className="row g-2">
                    <div className="col-sm-6 career-field">
                      <label className="career-label career-label-required" htmlFor="career-name">
                        <User size={14} aria-hidden /> Full Name
                      </label>
                      <input
                        id="career-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="col-sm-6 career-field">
                      <label className="career-label career-label-required" htmlFor="career-email">
                        <Mail size={14} aria-hidden /> Email
                      </label>
                      <input
                        id="career-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="you@email.com"
                      />
                    </div>
                    <div className="col-sm-6 career-field">
                      <label className="career-label career-label-required" htmlFor="career-phone">
                        <Phone size={14} aria-hidden /> Phone
                      </label>
                      <input
                        id="career-phone"
                        type="tel"
                        name="number"
                        value={formData.number}
                        onChange={handleChange}
                        required
                        placeholder="10-digit mobile"
                      />
                    </div>
                    <div className="col-sm-6 career-field">
                      <label className="career-label career-label-required" htmlFor="career-location">
                        <MapPin size={14} aria-hidden /> Location
                      </label>
                      <input
                        id="career-location"
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        placeholder="City, state"
                      />
                    </div>
                    <div className="col-12 career-field">
                      <label className="career-label career-label-required" htmlFor="career-position">
                        <Briefcase size={14} aria-hidden /> Position Applied For
                      </label>
                      <input
                        id="career-position"
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        required
                        placeholder="Role you are applying for"
                      />
                    </div>
                    <div className="col-12 career-field">
                      <label className="career-label career-label-required" htmlFor="career-experience">
                        <Clock size={14} aria-hidden /> Years of Experience
                      </label>
                      <select id="career-experience" name="experience" value={formData.experience} onChange={handleChange} required>
                        <option value="" disabled>
                          Select experience
                        </option>
                        <option value="fresher">Fresher</option>
                        <option value="1-3">1–3 years</option>
                        <option value="3-5">3–5 years</option>
                        <option value="5+">5+ years</option>
                      </select>
                    </div>
                    <div className="col-12 career-field">
                      <label className="career-label career-label-required" htmlFor="career-cv">
                        <FileUp size={14} aria-hidden /> Upload CV
                      </label>
                      <input id="career-cv" type="file" name="cv" onChange={handleChange} accept=".pdf,.doc,.docx" required />
                      <p className="career-hint">PDF, DOC, or DOCX — max 5MB</p>
                      {formData.cv && <p className="career-file-name">Selected: {formData.cv.name}</p>}
                    </div>
                    <div className="col-12 career-field">
                      <label className="career-label" htmlFor="career-info">
                        Additional Information
                      </label>
                      <textarea
                        id="career-info"
                        name="info"
                        value={formData.info}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Tell us about yourself and why you would be a great fit"
                      />
                    </div>
                    <div className="col-12">
                      <div className="career-terms">
                        <input
                          id="career-terms"
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleChange}
                          required
                        />
                        <label htmlFor="career-terms">
                          I agree to the processing of my personal data according to the privacy policy
                        </label>
                      </div>
                    </div>
                    <div className="col-12 career-modal-footer">
                      <button type="submit" className="career-modal-submit" disabled={careerSubmitting}>
                        {careerSubmitting ? "Submitting…" : "Submit Application"}
                      </button>
                    </div>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Footer;
