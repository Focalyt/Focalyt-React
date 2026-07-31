import React, { useState, useRef } from 'react'
import FrontLayout from "../../../Component/Layouts/Front";
import { resolveMediaUrl } from "../../../utils/resolveMediaUrl";
import axios from 'axios';
const BENEFITS = [
    "Career growth and practical learning",
    "Supportive and collaborative team",
    "Competitive salary and incentives"
];

const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const UploadIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Application = () => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
    const fileInputRef = useRef(null);

    const [applicantData, setApplicantData] = useState({
        fullName: "",
        email: "",
        mobile: "",
        city: "",
        applyingFor: "",
        experience: ""
    });
    const [resumeFile, setResumeFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submittedResumeUrl, setSubmittedResumeUrl] = useState("");

    const getResumeViewUrl = (path) => resolveMediaUrl(bucketUrl, path);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setApplicantData({ ...applicantData, [name]: value });
    };

    const handleFileSelect = (file) => {
        if (!file) return;

        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

        if (!allowedTypes.includes(file.type)) {
            setErrors({ ...errors, resume: "Only PDF or DOC files are allowed" });
            return;
        }
        if (file.size > maxSizeBytes) {
            setErrors({ ...errors, resume: "File must be under 5 MB" });
            return;
        }

        setErrors({ ...errors, resume: false });
        setResumeFile(file);
    };

    const handleFileInputChange = (e) => {
        handleFileSelect(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!applicantData.fullName) newErrors.fullName = true;
        if (!applicantData.email) newErrors.email = true;
        if (!applicantData.mobile || !/^\d{10}$/.test(applicantData.mobile)) newErrors.mobile = true;
        if (!applicantData.applyingFor) newErrors.applyingFor = true;
        if (!applicantData.experience) newErrors.experience = true;
        if (!resumeFile) newErrors.resume = "Resume / CV is required";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            alert("Please fill all required fields.");
            return;
        }

        setSubmitting(true);
        setSubmittedResumeUrl("");
        try {
            const formData = new FormData();
            Object.entries(applicantData).forEach(([key, value]) => formData.append(key, value));
            formData.append("resume", resumeFile);

            const res = await axios.post(`${backendUrl}/application`, formData);

            if (res.status === 201) {
                const resumeUrl = getResumeViewUrl(res.data?.data?.resume);
                setSubmittedResumeUrl(resumeUrl || "");
                alert("Application submitted successfully!");
                setApplicantData({
                    fullName: "",
                    email: "",
                    mobile: "",
                    city: "",
                    applyingFor: "",
                    experience: ""
                });
                setResumeFile(null);
                setErrors({});
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                alert(res.data?.message || "Something went wrong");
            }
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || "Error submitting application.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <FrontLayout>
            <div className="job-app-container mt-5">
                <div className="job-app-left">
                    <h2 className="job-app-heading">Why join Focalyt?</h2>
                    <ul className="benefits-list">
                        {BENEFITS.map((benefit) => (
                            <li key={benefit}>
                                <span className="check-badge"><CheckIcon /></span>
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="job-app-right">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="field-grid">
                            <div className="field">
                                <label htmlFor="fullName" className="required-field">Full name</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    placeholder="Enter your name"
                                    value={applicantData.fullName}
                                    onChange={handleChange}
                                    className={errors.fullName ? 'error-input' : ''}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="email" className="required-field">Email ID</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="you@email.com"
                                    value={applicantData.email}
                                    onChange={handleChange}
                                    className={errors.email ? 'error-input' : ''}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="mobile" className="required-field">Mobile number</label>
                                <input
                                    type="text"
                                    id="mobile"
                                    name="mobile"
                                    placeholder="10-digit mobile number"
                                    maxLength={10}
                                    value={applicantData.mobile}
                                    onChange={handleChange}
                                    className={errors.mobile ? 'error-input' : ''}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="city">City</label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    placeholder="Enter your city (optional)"
                                    value={applicantData.city}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="applyingFor" className="required-field">Applying for</label>
                                <input
                                    type="text"
                                    id="applyingFor"
                                    name="applyingFor"
                                    placeholder="Enter job role"
                                    value={applicantData.applyingFor}
                                    onChange={handleChange}
                                    className={errors.applyingFor ? 'error-input' : ''}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="experience" className="required-field">Experience</label>
                                <input
                                    type="text"
                                    id="experience"
                                    name="experience"
                                    placeholder="e.g. Fresher, 2 years"
                                    value={applicantData.experience}
                                    onChange={handleChange}
                                    className={errors.experience ? 'error-input' : ''}
                                />
                            </div>
                        </div>

                        <div className="resume-field">
                            <label className="required-field">Resume / CV</label>
                            <div
                                className={`upload-box ${errors.resume ? 'error-input' : ''}`}
                                onClick={() => fileInputRef.current.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <span className="upload-icon"><UploadIcon /></span>
                                {resumeFile ? (
                                    <>
                                        <span className="upload-title">{resumeFile.name}</span>
                                        <span className="upload-sub">Click to replace file</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="upload-title">UPLOAD CV</span>
                                        <span className="upload-sub">PDF or DOC &bull; Max 5 MB</span>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileInputChange}
                                    style={{ display: "none" }}
                                />
                            </div>
                            {errors.resume && typeof errors.resume === "string" && (
                                <span className="resume-error-text">{errors.resume}</span>
                            )}
                        </div>

                        <button type="submit" className="submit-btn" disabled={submitting}>
                            {submitting ? "Submitting..." : "SUBMIT APPLICATION \u2192"}
                        </button>
                        {submittedResumeUrl ? (
                            <p className="submit-note">
                                Application submitted.{" "}
                                <a href={submittedResumeUrl} target="_blank" rel="noopener noreferrer">
                                    View resume
                                </a>
                            </p>
                        ) : (
                            <p className="submit-note">Your information will only be used for recruitment.</p>
                        )}
                    </form>
                </div>
            </div>

            <style>
                {`
                .job-app-container {
                    display: grid;
                    grid-template-columns: 1fr 1.15fr;
                    gap: 60px;
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 60px 24px;
                    align-items: start;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }

                .job-app-left {
                    padding-top: 10px;
                }

                .job-app-heading {
                    font-size: 28px;
                    font-weight: 800;
                    color: #111827;
                    margin: 0 0 28px 0;
                }

                .benefits-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .benefits-list li {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    font-size: 16px;
                    color: #1f2937;
                    font-weight: 500;
                }

                .check-badge {
                    flex: 0 0 26px;
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    background: #6C5CE7;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .job-app-right {
                    background: #fff;
                    border: 1px solid #ECECF2;
                    border-radius: 16px;
                    box-shadow: 0 8px 30px rgba(17, 24, 39, 0.06);
                    padding: 32px;
                }

                .field-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    column-gap: 24px;
                    row-gap: 20px;
                    margin-bottom: 24px;
                }

                .field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .field label,
                .resume-field label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #111827;
                }

                .required-field::after {
                    content: " *";
                    color: #EF4444;
                }

                .field input,
                .resume-field input {
                    padding: 12px 14px;
                    font-size: 14px;
                    border: 1px solid #E5E7EB;
                    border-radius: 10px;
                    background-color: #F9FAFB;
                    color: #111827;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
                }

                .field input::placeholder {
                    color: #9CA3AF;
                }

                .field input:focus {
                    border-color: #6C5CE7;
                    background-color: #fff;
                    box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.15);
                }

                .error-input {
                    border-color: #EF4444 !important;
                    background-color: #FEF2F2 !important;
                }

                .resume-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 28px;
                }

                .upload-box {
                    border: 2px dashed #D9D9E3;
                    border-radius: 12px;
                    background-color: #FAFAFB;
                    padding: 30px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                    color: #6C5CE7;
                    transition: border-color 0.2s, background-color 0.2s;
                    text-align: center;
                }

                .upload-box:hover {
                    border-color: #6C5CE7;
                    background-color: #F5F3FF;
                }

                .upload-icon {
                    color: #6C5CE7;
                    margin-bottom: 4px;
                }

                .upload-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #6C5CE7;
                    letter-spacing: 0.3px;
                }

                .upload-sub {
                    font-size: 13px;
                    color: #6B7280;
                }

                .resume-error-text {
                    font-size: 13px;
                    color: #EF4444;
                }

                .submit-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #6C5CE7, #5A4BD8);
                    color: #fff;
                    border: none;
                    padding: 15px;
                    font-size: 15px;
                    font-weight: 700;
                    letter-spacing: 0.3px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
                    box-shadow: 0 6px 18px rgba(108, 92, 231, 0.35);
                }

                .submit-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 22px rgba(108, 92, 231, 0.45);
                }

                .submit-btn:active {
                    transform: translateY(0);
                }

                .submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .submit-note {
                    text-align: center;
                    font-size: 12px;
                    color: #9CA3AF;
                    margin: 12px 0 0 0;
                }

                @media (max-width: 860px) {
                    .job-app-container {
                        grid-template-columns: 1fr;
                        gap: 36px;
                        padding: 32px 20px;
                    }

                    .job-app-right {
                        padding: 24px;
                    }
                }

                @media (max-width: 520px) {
                    .field-grid {
                        grid-template-columns: 1fr;
                    }
                }
                `}
            </style>
        </FrontLayout>
    )
}

export default Application