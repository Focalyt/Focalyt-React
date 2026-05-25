import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { faFacebookF, faLinkedinIn, faYoutube, faInstagram } from "@fortawesome/free-brands-svg-icons";
import {
  BookOpen,
  Briefcase,
  BriefcaseBusiness,
  CalendarDays,
  FlaskConical,
  GraduationCap,
  Home,
  Images,
  Mail,
  MapPin,
  Phone,
  Share2,
  Zap,
} from "lucide-react";
import axios from "axios";
import "./FrontFooter.css";

const HOME_SECTION_SCROLL_OFFSET = 130;

const SUB_TABS = [
  { label: "Impact", sectionId: "about", icon: Zap },
  { label: "Labs", sectionId: "labs", icon: FlaskConical },
  { label: "Events", sectionId: "events", icon: CalendarDays },
  { label: "Courses", sectionId: "future-courses", icon: BookOpen },
  { label: "Jobs", sectionId: "future-jobs", icon: BriefcaseBusiness },
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

function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const handlePartnerWithUs = (e) => {
    if (isHomePage) return;
    e.preventDefault();
    navigate("/", { state: { openPartnerModal: true } });
  };

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
              <ul className="list-social list-social--hvr-black ftr-social">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                      <FontAwesomeIcon icon={s.icon} size="lg" />
                    </a>
                  </li>
                ))}
              </ul>
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
                <li>
                  <span className="ftr-contact-ico" aria-hidden><MapPin size={16} strokeWidth={2} /></span>
                  <address className="ftr-contact-text">{FOOTER_CONTACT.address}</address>
                </li>
                <li>
                  <span className="ftr-contact-ico" aria-hidden><Phone size={16} strokeWidth={2} /></span>
                  <a href={FOOTER_CONTACT.phoneHref} className="ftr-contact-text ftr-contact-link">
                    {FOOTER_CONTACT.phone}
                  </a>
                </li>
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
                data-bs-toggle={isHomePage ? "modal" : undefined}
                data-bs-target={isHomePage ? "#partnerModal" : undefined}
                onClick={handlePartnerWithUs}
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
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="careerModalLabel">Career Opportunities</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body p-0">
              <section id="current-openings">
                <form method="post" className="career-form" id="careerForm" onSubmit={handleSubmit}>
                  <div className="row g-4">
                    <div className="col-12"><h4 className="mb-4">Personal Information</h4></div>
                    <div className="col-md-6">
                      <label htmlFor="name" className="form-label required-field">Full Name</label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label required-field">Email Address</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="number" className="form-label required-field">Phone Number</label>
                      <input type="tel" className="form-control" name="number" value={formData.number} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="location" className="form-label required-field">Current Location</label>
                      <input type="text" className="form-control" name="location" value={formData.location} onChange={handleChange} required />
                    </div>
                    <div className="col-12">
                      <label htmlFor="position" className="form-label required-field">Position Applied For</label>
                      <input type="text" className="form-control" name="position" value={formData.position} onChange={handleChange} required />
                    </div>
                    <div className="col-12">
                      <label htmlFor="experience" className="form-label required-field">Years of Experience</label>
                      <select className="form-select" name="experience" value={formData.experience} onChange={handleChange} required>
                        <option value="">Select Experience</option>
                        <option value="fresher">Fresher</option>
                        <option value="1-3">1-3 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="5+">5+ years</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label htmlFor="cv" className="form-label required-field">Upload CV</label>
                      <input type="file" className="form-control" name="cv" onChange={handleChange} accept=".pdf,.doc,.docx" required />
                      <div className="form-text">Accepted formats: PDF, DOC, DOCX (Max size: 5MB)</div>
                      {formData.cv && <p>Selected File: {formData.cv.name}</p>}
                    </div>
                    <div className="col-12">
                      <label htmlFor="info" className="form-label">Additional Information</label>
                      <textarea
                        className="form-control"
                        name="info"
                        value={formData.info}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Tell us about yourself and why you'd be a great fit for this position"
                      />
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleChange}
                          required
                        />
                        <label className="form-check-label" htmlFor="terms">
                          I agree to the processing of my personal data according to the privacy policy
                        </label>
                      </div>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="new_link text-center">Submit Application</button>
                    </div>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        #careerForm textarea.form-control { min-height: 120px; resize: vertical; }
        #careerModal .modal-xl { max-width: 1140px; }
        #careerModal .required-field::after { content: "*"; color: red; margin-left: 4px; }
        #careerModal .career-form { max-width: 800px; margin: 0 auto; padding: 2rem; }
        #careerModal .form-control:focus, #careerModal .form-select:focus {
          border-color: #FC2B5A; box-shadow: 0 0 0 0.25rem rgba(252, 43, 90, 0.25);
        }
        #careerModal .form-check-input:checked { background-color: #FC2B5A; border-color: #FC2B5A; }
        @media (max-width: 768px) { #careerModal .career-form { padding: 1rem; } }
        .new_link {
          width: 50%; margin: auto; background: #FC2B5A; border-radius: 10px;
          padding: 10px 20px; border: 1px solid #fc2b5a; color: #fff; display: block; text-align: center;
        }
      `}</style>
    </>
  );
}

export default Footer;
