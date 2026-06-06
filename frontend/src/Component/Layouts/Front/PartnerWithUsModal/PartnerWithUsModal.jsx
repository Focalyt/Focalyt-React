import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Building, Check, Mail, MapPin, MessageCircle, Smartphone, User } from "lucide-react";
import "./PartnerWithUsModal.css";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep",
  "Puducherry", "Ladakh", "Jammu and Kashmir",
];

export default function PartnerWithUsModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const [partnerForm, setPartnerForm] = useState({
    name: "",
    organization: "",
    state: "",
    mobile: "",
    email: "",
    message: "",
  });
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerError, setPartnerError] = useState("");

  useEffect(() => {
    if (!location.state?.openPartnerModal) return undefined;
    const timer = setTimeout(() => {
      const modalEl = document.getElementById("partnerModal");
      if (!modalEl) return;
      const Modal = window.bootstrap?.Modal;
      if (Modal) Modal.getOrCreateInstance(modalEl).show();
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { replace: true, state: {} }
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [location.state, location.pathname, location.search, location.hash, navigate]);

  const handlePartnerChange = (e) => {
    const { name, value } = e.target;
    setPartnerForm((prev) => ({ ...prev, [name]: value }));
  };

  const showPartnerSuccessPopup = () => {
    const partnerModalEl = document.getElementById("partnerModal");
    const successModalEl = document.getElementById("partnerSuccessModal");
    const Modal = window.bootstrap?.Modal;
    if (!Modal || !successModalEl) return;

    if (partnerModalEl) {
      const partnerModal = Modal.getInstance(partnerModalEl) || Modal.getOrCreateInstance(partnerModalEl);
      partnerModal.hide();
    }

    setTimeout(() => {
      Modal.getOrCreateInstance(successModalEl).show();
    }, 300);
  };

  const handlePartnerSubmit = async (e) => {
    e.preventDefault();
    setPartnerLoading(true);
    setPartnerError("");

    const payload = {
      name: partnerForm.name,
      organization: partnerForm.organization,
      state: partnerForm.state,
      mobile: partnerForm.mobile,
      email: partnerForm.email,
      message: partnerForm.message,
    };

    try {
      const response = await axios.post(`${backendUrl}/partner`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.status === 200 || response.status === 201) {
        setPartnerForm({ name: "", organization: "", state: "", mobile: "", email: "", message: "" });
        showPartnerSuccessPopup();
      }
    } catch {
      setPartnerError("Failed to submit. Please try again.");
    } finally {
      setPartnerLoading(false);
    }
  };

  return (
    <>
      <div className="modal fade" id="partnerModal" tabIndex={-1} aria-labelledby="partnerModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content partner-modal-content">
            <div className="modal-header partner-modal-header">
              <div className="partner-modal-header-inner">
                <span className="partner-modal-emoji" aria-hidden="true">
                  🤝
                </span>
                <div>
                  <h5 className="partner-modal-title" id="partnerModalLabel">
                    Partner With Us
                  </h5>
                  <p className="partner-modal-tagline">Future-tech partnerships that create real impact</p>
                </div>
              </div>
              <button type="button" className="btn-close partner-modal-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body partner-modal-body">
              <p className="partner-modal-intro">Share your inquiry.</p>
              <form id="partnerForm" onSubmit={handlePartnerSubmit}>
                <div className="row g-2">
                  <div className="col-sm-6 partner-field">
                    <label className="partner-label" htmlFor="partner-name">
                      <User size={14} aria-hidden /> Name
                    </label>
                    <input
                      id="partner-name"
                      type="text"
                      name="name"
                      value={partnerForm.name}
                      onChange={handlePartnerChange}
                      required
                      placeholder="Your name"
                    />
                  </div>
                  <div className="col-sm-6 partner-field">
                    <label className="partner-label" htmlFor="partner-org">
                      <Building size={14} aria-hidden /> Organization
                    </label>
                    <input
                      id="partner-org"
                      type="text"
                      name="organization"
                      value={partnerForm.organization}
                      onChange={handlePartnerChange}
                      placeholder="Company / institution"
                    />
                  </div>
                  <div className="col-sm-6 partner-field">
                    <label className="partner-label" htmlFor="partner-state">
                      <MapPin size={14} aria-hidden /> State
                    </label>
                    <select
                      id="partner-state"
                      name="state"
                      value={partnerForm.state}
                      onChange={handlePartnerChange}
                      required
                    >
                      <option value="" disabled>
                        Pick your state
                      </option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-sm-6 partner-field">
                    <label className="partner-label" htmlFor="partner-mobile">
                      <Smartphone size={14} aria-hidden /> Phone
                    </label>
                    <input
                      id="partner-mobile"
                      type="tel"
                      name="mobile"
                      value={partnerForm.mobile}
                      onChange={handlePartnerChange}
                      required
                      pattern="[0-9]{10}"
                      placeholder="10-digit number"
                    />
                  </div>
                  <div className="col-12 partner-field">
                    <label className="partner-label" htmlFor="partner-email">
                      <Mail size={14} aria-hidden /> Email
                    </label>
                    <input
                      id="partner-email"
                      type="email"
                      name="email"
                      value={partnerForm.email}
                      onChange={handlePartnerChange}
                      required
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="col-12 partner-field">
                    <label className="partner-label" htmlFor="partner-message">
                      <MessageCircle size={14} aria-hidden /> Message
                    </label>
                    <textarea
                      id="partner-message"
                      name="message"
                      value={partnerForm.message}
                      onChange={handlePartnerChange}
                      required
                      rows={4}
                      placeholder="Tell us about your partnership idea..."
                    />
                  </div>
                </div>
                <div className="partner-modal-footer">
                  <button type="submit" className="partner-modal-submit" disabled={partnerLoading}>
                    {partnerLoading ? "Submitting..." : "Submit →"}
                  </button>
                  {partnerError && <p className="partner-modal-error mb-0">{partnerError}</p>}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="partnerSuccessModal" tabIndex={-1} aria-labelledby="partnerSuccessModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content partner-success-content">
            <div className="partner-success-body">
              <div className="partner-success-icon" aria-hidden="true">
                <Check size={32} strokeWidth={2.5} />
              </div>
              <h5 className="partner-success-title" id="partnerSuccessModalLabel">
                Thank you!
              </h5>
              <p className="partner-success-message mb-0">
                We will contact you within three working days.
              </p>
              <button type="button" className="partner-success-close-btn" data-bs-dismiss="modal">
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
