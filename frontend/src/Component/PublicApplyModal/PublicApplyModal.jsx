import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Calendar,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { resolveMediaUrl } from "../../utils/resolveMediaUrl";
import { parseAddressComponents, getCoordinates, isValidPlace } from "../../utils/addressUtils";
import { trackMetaConversion } from "../../utils/conversionTrakingRoutes";

const THUMB_FALLBACK = "/Assets/public_assets/images/newjoblisting/course_img.svg";
const PublicApplyContext = createContext(null);

export function isCandidateLoggedIn() {
  try {
    const token = localStorage.getItem("token");
    const user = sessionStorage.getItem("user");
    return Boolean(token && user);
  } catch {
    return false;
  }
}

function formatLocation(item) {
  if (!item) return "NA";
  if (typeof item.city === "object" && item.city) {
    return [item.city.name, item.state?.name].filter(Boolean).join(", ") || "NA";
  }
  if (item.city || item.state) {
    return [item.city, item.state].filter(Boolean).join(", ") || "NA";
  }
  return item.location || "NA";
}

export function buildCourseApplyTarget(course, bucketUrl) {
  const id = course?._id || course?.id;
  const isFree = String(course?.courseFeeType || "").toLowerCase() === "free" || course?.isFree;
  const extra = Array.isArray(course?.sectorNames)
    ? course.sectorNames.filter(Boolean).join(", ")
    : course?.sector || course?.distance || course?.trainingMode || "";
  return {
    kind: "course",
    id,
    name: course?.name || "Course",
    image: course?.image || resolveMediaUrl(bucketUrl, course?.thumbnail) || THUMB_FALLBACK,
    location: formatLocation(course),
    extra,
    badge: isFree ? "Free Course" : course?.courseFeeType ? `${course.courseFeeType} Course` : "Course",
    applyPath: `/candidate/course/${id}?apply=1`,
  };
}

export function buildJobApplyTarget(job, bucketUrl) {
  const id = job?._id || job?.id;
  return {
    kind: "job",
    id,
    name: job?.title || job?.name || "Job",
    image:
      job?.jobVideoThumbnail ||
      job?.image ||
      resolveMediaUrl(bucketUrl, job?.thumbnail) ||
      THUMB_FALLBACK,
    location: formatLocation(job),
    extra: job?.displayCompanyName || job?._company?.name || job?.work || "",
    badge: job?.courseType === "coursejob" ? "Course + Jobs" : "Job",
    applyPath: `/candidate/job/${id}?apply=1`,
  };
}

export function usePublicApply() {
  const ctx = useContext(PublicApplyContext);
  const fallbackOpen = useCallback((target) => {
    if (!target?.applyPath) return;
    if (isCandidateLoggedIn()) {
      window.location.href = target.applyPath;
      return;
    }
    window.location.href = `/candidate/login?returnUrl=${encodeURIComponent(target.applyPath.replace(/\?apply=1$/, ""))}`;
  }, []);

  if (!ctx) return { openApply: fallbackOpen, closeApply: () => {}, target: null };
  return ctx;
}

export function PublicApplyProvider({ children }) {
  const [target, setTarget] = useState(null);

  const closeApply = useCallback(() => setTarget(null), []);

  const openApply = useCallback((nextTarget) => {
    if (!nextTarget?.applyPath) return;
    if (isCandidateLoggedIn()) {
      window.location.href = nextTarget.applyPath;
      return;
    }
    setTarget(nextTarget);
  }, []);

  return (
    <PublicApplyContext.Provider value={{ target, openApply, closeApply }}>
      {children}
      <PublicApplyModal />
    </PublicApplyContext.Provider>
  );
}

function ApplyIllustration() {
  return (
    <svg width="92" height="78" viewBox="0 0 92 78" fill="none" aria-hidden="true">
      <circle cx="74" cy="16" r="3" fill="#60A5FA" opacity="0.9" />
      <circle cx="58" cy="8" r="2" fill="#FBBF24" />
      <path d="M64 22l4 1.2-1.2 4-4-1.2L64 22z" fill="#FBBF24" />
      <rect x="28" y="10" width="42" height="54" rx="8" fill="#EEF4FF" stroke="#93C5FD" strokeWidth="2" />
      <rect x="36" y="6" width="26" height="10" rx="5" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
      <rect x="36" y="26" width="18" height="4" rx="2" fill="#93C5FD" />
      <rect x="36" y="34" width="22" height="4" rx="2" fill="#BFDBFE" />
      <rect x="36" y="42" width="16" height="4" rx="2" fill="#BFDBFE" />
      <circle cx="62" cy="28" r="5" fill="#22C55E" />
      <path d="M59.6 28.2l1.6 1.6 3.2-3.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="18" y="34" width="10" height="36" rx="3" transform="rotate(-28 18 34)" fill="#2563EB" />
      <rect x="20" y="36" width="6" height="28" rx="2" transform="rotate(-28 20 36)" fill="#60A5FA" />
      <path d="M14 68l8-4 3 7-8 3-3-6z" fill="#1D4ED8" />
    </svg>
  );
}

function Field({ icon: Icon, children }) {
  return (
    <div className="pam-field">
      <span className="pam-field__icon">
        <Icon size={16} />
      </span>
      {children}
    </div>
  );
}

function PublicApplyModal() {
  const { target, closeApply } = usePublicApply();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const addressRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = useCallback(() => {
    setFullName("");
    setEmail("");
    setMobile("");
    setOtp("");
    setDob("");
    setGender("");
    setAddress("");
    setCity("");
    setState("");
    setPincode("");
    setLatitude("");
    setLongitude("");
    setConfirmed(false);
    setIsNewUser(true);
    setOtpSent(false);
    setOtpVerified(false);
    setSendingOtp(false);
    setVerifying(false);
    setSubmitting(false);
    setError("");
    setSuccess("");
  }, []);

  useEffect(() => {
    if (!target) return undefined;
    resetForm();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [target, resetForm]);

  useEffect(() => {
    if (!target) return undefined;
    let autocomplete;
    const bind = () => {
      if (!window.google?.maps?.places || !addressRef.current) {
        window.setTimeout(bind, 200);
        return;
      }
      autocomplete = new window.google.maps.places.Autocomplete(addressRef.current, {
        types: ["geocode"],
        componentRestrictions: { country: "in" },
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!isValidPlace(place)) return;
        const coordinates = getCoordinates(place);
        const addressData = parseAddressComponents(place);
        setAddress(addressData.fullAddress || place.formatted_address || "");
        setCity(addressData.city);
        setState(addressData.state);
        setPincode(addressData.pincode);
        setLatitude(String(coordinates[1] || ""));
        setLongitude(String(coordinates[0] || ""));
      });
    };
    bind();
    return () => {
      if (autocomplete && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [target]);

  if (!target) return null;

  const isCourse = target.kind !== "job";
  const validateMobile = () => /^[6-9]\d{9}$/.test(mobile);
  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

  const persistSession = (loginRes) => {
    localStorage.setItem("token", loginRes.data.token);
    localStorage.setItem("name", loginRes.data.name || fullName);
    if (loginRes.data.user) sessionStorage.setItem("user", JSON.stringify(loginRes.data.user));
    if (loginRes.data.candidate) sessionStorage.setItem("candidate", JSON.stringify(loginRes.data.candidate));
  };

  const loginCandidate = async () => {
    const loginRes = await axios.post(`${backendUrl}/api/otpCandidateLogin`, { mobile });
    if (!loginRes.data?.status) {
      const err = new Error(loginRes.data?.message || "Login failed after verification.");
      err.skipLogin = true;
      throw err;
    }
    persistSession(loginRes);
    try {
      await axios.post(
        `${backendUrl}/candidate/verification`,
        { mobile, verified: true },
        { headers: { "x-auth": loginRes.data.token } }
      );
    } catch {
      // verification flag is best-effort; session is already created
    }
    await trackMetaConversion({ eventName: "Login", sourceUrl: window.location.href });
    return loginRes;
  };

  const handleSendOtp = async () => {
    setError("");
    setSuccess("");
    if (!validateMobile()) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setSendingOtp(true);
    try {
      const res = await axios.post(`${backendUrl}/api/sendCandidateOtp`, { mobile });
      if (!res.data?.status && res.data?.message) {
        setError(typeof res.data.message === "string" ? res.data.message : "Failed to send OTP.");
        return;
      }
      setIsNewUser(Boolean(res.data?.newUser));
      setOtpSent(true);
      setOtpVerified(false);
      setOtp("");
      setSuccess(res.data?.newUser ? "OTP sent. Complete your details to continue." : "OTP sent. Number found in user table.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");
    if (!otp || otp.length < 4) {
      setError("Please enter the OTP sent to your mobile number.");
      return;
    }
    setVerifying(true);
    try {
      const res = await axios.post(`${backendUrl}/api/verifyOtp`, { mobile, otp });
      if (!res.data?.status) {
        setError(res.data?.message || "Incorrect OTP. Please try again.");
        return;
      }
      setOtpVerified(true);
      setSuccess("Mobile number verified.");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const loginAndContinue = async ({ treatAsExisting = !isNewUser } = {}) => {
    const applyRes = await axios.post(`${backendUrl}/api/publicApply`, {
      mobile,
      kind: target.kind,
      id: target.id,
      source: "Website Apply",
      isNewUser: !treatAsExisting,
    });
    if (!applyRes.data?.status) {
      throw new Error(applyRes.data?.message || "Failed to submit application.");
    }

    try {
      await loginCandidate();
    } catch {
      // Session is optional; CRM lead is already saved, including role-3 user for existing numbers.
    }

    setSuccess(applyRes.data.message || "Application submitted successfully.");
    window.setTimeout(() => closeApply(), 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otpVerified) {
      setError("Please verify the OTP before submitting.");
      return;
    }
    if (!confirmed) {
      setError("Please confirm that the information is correct.");
      return;
    }

    if (isNewUser) {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (fullName.trim().length > 30) {
        setError("Full name should be 30 characters or less.");
        return;
      }
      if (!email.trim() || !validateEmail(email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!dob) {
        setError("Please select your date of birth.");
        return;
      }
      if (!gender) {
        setError("Please select your gender.");
        return;
      }
      if (!address.trim() || !latitude || !longitude || !state) {
        setError("Please select your complete address from the suggestions.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isNewUser) {
        const body = {
          name: fullName.trim(),
          mobile,
          sex: gender,
          email: email.trim(),
          dob,
          personalInfo: {
            currentAddress: {
              type: "Point",
              coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0],
              city,
              state,
              fullAddress: address,
              latitude: String(latitude),
              longitude: String(longitude),
            },
            permanentAddress: {
              type: "Point",
              coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0],
              city: city || "",
              state,
              fullAddress: address,
              latitude: String(latitude),
              longitude: String(longitude),
            },
          },
        };
        const refCode = localStorage.getItem("refCode");
        if (refCode) body.refCode = refCode;

        const registerRes = await axios.post(`${backendUrl}/candidate/register`, body);
        if (registerRes.data?.status !== "success") {
          const errorMsg = registerRes.data?.error;
          const alreadyExists = /already exist|already registered/i.test(String(errorMsg || ""));
          if (!alreadyExists) {
            setError(typeof errorMsg === "string" ? errorMsg : errorMsg?.message || "Registration failed.");
            return;
          }
          await loginAndContinue({ treatAsExisting: true });
          return;
        }
        await trackMetaConversion({ eventName: "Signup", sourceUrl: window.location.href });
      }
      await loginAndContinue({ treatAsExisting: !isNewUser });
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(typeof errorMsg === "string" ? errorMsg : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="pam-overlay" onClick={closeApply} role="presentation">
      <div
        className="pam-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pam-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="pam-close" onClick={closeApply} aria-label="Close">
          <X size={18} />
        </button>

        <div className="pam-head">
          <div>
            <h2 id="pam-title">Apply Now</h2>
            <p>
              {isCourse
                ? "Fill in your details to enroll in this course."
                : "Fill in your details to apply for this job."}
            </p>
          </div>
          <ApplyIllustration />
        </div>

        <div className="pam-item">
          <img
            src={target.image || THUMB_FALLBACK}
            alt=""
            onError={(e) => {
              e.currentTarget.src = THUMB_FALLBACK;
            }}
          />
          <div>
            <strong>{target.name}</strong>
            <span>
              {target.location || "NA"}
              {target.extra ? ` | ${target.extra}` : ""}
            </span>
            {target.badge ? <em>{target.badge}</em> : null}
          </div>
        </div>

        <form className="pam-form" onSubmit={handleSubmit}>
          <label>
            Full Name <i>*</i>
            <Field icon={User}>
              <input
                type="text"
                maxLength={30}
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Field>
          </label>

          <label>
            Email Address <i>*</i>
            <Field icon={Mail}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          </label>

          <label>
            Mobile Number <i>*</i>
            <div className="pam-mobile">
              <Field icon={Phone}>
                <span className="pam-cc">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter mobile number"
                  value={mobile}
                  disabled={otpSent}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </Field>
              <button type="button" className="pam-otp-btn" onClick={handleSendOtp} disabled={sendingOtp || otpVerified}>
                {sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>
          </label>

          <label>
            Enter OTP <i>*</i>
            <div className="pam-mobile">
              <Field icon={ShieldCheck}>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 4-digit OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setOtpVerified(false);
                  }}
                />
              </Field>
              <button
                type="button"
                className="pam-verify-btn"
                onClick={handleVerifyOtp}
                disabled={!otpSent || verifying || otpVerified}
              >
                {otpVerified ? "Verified" : verifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </label>

          <label>
            Date of Birth <i>*</i>
            <Field icon={Calendar}>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>
          </label>

          <label>
            Gender <i>*</i>
            <div className="pam-select-wrap">
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </label>

          <label>
            Address <i>*</i>
            <Field icon={MapPin}>
              <input
                ref={addressRef}
                id="public-apply-address"
                type="text"
                placeholder="Search and select your complete address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="off"
              />
            </Field>
          </label>

          <label className="pam-check">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>I confirm that the above information is correct and I agree to be contacted.</span>
          </label>

          {error ? <p className="pam-alert pam-alert--error">{error}</p> : null}
          {success ? <p className="pam-alert pam-alert--ok">{success}</p> : null}

          <button type="submit" className="pam-submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="pam-safe">
          <Lock size={13} /> Your data is safe with us
        </p>
      </div>

      <style>{`
.pam-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 88px 12px 24px;
  overflow-y: auto;
}
.pam-card {
  width: min(460px, 100%);
  margin: 24px auto 40px;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
  padding: 22px 22px 18px;
  position: relative;
  font-family: inherit;
  color: #0f172a;
}
.pam-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: #64748b;
  border-radius: 999px;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.pam-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding-right: 28px;
}
.pam-head h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.pam-head p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.4;
  max-width: 230px;
}
.pam-item {
  margin-top: 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border-radius: 16px;
  background: linear-gradient(180deg, #eef6ff 0%, #f7fbff 100%);
  border: 1px solid #e0edff;
}
.pam-item img {
  width: 58px;
  height: 58px;
  object-fit: cover;
  border-radius: 12px;
  background: #dbeafe;
}
.pam-item strong {
  display: block;
  font-size: 15px;
}
.pam-item span {
  display: block;
  color: #64748b;
  font-size: 12px;
  margin-top: 2px;
}
.pam-item em {
  display: inline-flex;
  margin-top: 6px;
  font-style: normal;
  font-size: 11px;
  color: #1d4ed8;
  background: #fff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 2px 8px;
}
.pam-form {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}
.pam-form label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}
.pam-form label i {
  color: #ef4444;
  font-style: normal;
}
.pam-field, .pam-select-wrap select {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  padding: 0 12px;
}
.pam-field input, .pam-select-wrap select {
  border: 0;
  outline: none;
  width: 100%;
  background: transparent;
  font-size: 14px;
  color: #0f172a;
  min-height: 42px;
}
.pam-field__icon { color: #94a3b8; display: grid; place-items: center; }
.pam-cc {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  padding-right: 8px;
  border-right: 1px solid #e2e8f0;
  white-space: nowrap;
}
.pam-mobile {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}
.pam-otp-btn, .pam-verify-btn {
  border: 0;
  border-radius: 12px;
  min-width: 108px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}
.pam-otp-btn {
  background: #2563eb;
  color: #fff;
}
.pam-verify-btn {
  background: #e2e8f0;
  color: #334155;
}
.pam-otp-btn:disabled, .pam-verify-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.pam-select-wrap select { appearance: none; background-image: linear-gradient(45deg, transparent 50%, #94a3b8 50%), linear-gradient(135deg, #94a3b8 50%, transparent 50%); background-position: calc(100% - 16px) 18px, calc(100% - 10px) 18px; background-size: 6px 6px, 6px 6px; background-repeat: no-repeat; }
.pam-check {
  display: flex !important;
  align-items: flex-start;
  gap: 10px;
  font-weight: 500 !important;
  color: #475569 !important;
}
.pam-check input { margin-top: 3px; }
.pam-submit {
  width: 100%;
  border: 0;
  border-radius: 14px;
  min-height: 48px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(90deg, #3b82f6 0%, #7c3aed 100%);
}
.pam-submit:disabled { opacity: 0.7; cursor: not-allowed; }
.pam-safe {
  margin: 12px 0 0;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.pam-alert { margin: 0; font-size: 13px; border-radius: 10px; padding: 8px 10px; }
.pam-alert--error { background: #fef2f2; color: #b91c1c; }
.pam-alert--ok { background: #ecfdf5; color: #047857; }
@media (max-width: 520px) {
  .pam-card { padding: 18px 14px 14px; border-radius: 18px; }
  .pam-head h2 { font-size: 24px; }
  .pam-mobile { grid-template-columns: 1fr; }
}
      `}</style>
    </div>,
    document.body
  );
}

export default PublicApplyModal;
