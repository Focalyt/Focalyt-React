import React, { useState, useEffect } from "react";
import axios from "axios";
import {Link} from "react-router-dom";
import CandidateLayout from "../../../../Component/Layouts/App/Candidates";
const CandidateDocumets = ({ candidate, documents }) => {

  const [documentData, setDocumentData] = useState({
    AdditionalDocuments: [],
  });

  const [additionalDocs, setAdditionalDocs] = useState([]);

  const documentLabels = [
    { name: "Photograph", label: "Photograph / फ़ोटोग्राफ़ " },
    { name: "AadharCardFront", label: "Aadhar Card/(Front Side) / आधार कार्ड (आगे की ओर)" },
    { name: "AadharCardBack", label: "Aadhar Card (Back Side) / आधार कार्ड (पीछे की ओर)" },
    { name: "ResidenceCertificate", label: "Residence Certificate / निवास प्रमाण पत्र" },
    { name: "CasteCertificate", label: "Caste Certificate / जाति प्रमाण पत्र " },
    { name: "RationCard", label: "Ration Card / राशन कार्ड " },
    { name: "10thMarksheet", label: "10th Marksheet / 10वीं कक्षा की मार्कशीट " },
    { name: "12thMarksheet", label: "12th Marksheet / 12वीं कक्षा की मार्कशीट " },
    { name: "DiplomaMarksheet", label: "Diploma Marksheet / डिप्लोमा मार्कशीट " },
    { name: "BachelorDegreeMarkSheets", label: "Bachelor Degree/Mark Sheets / स्नातक डिग्री/मार्कशीट " },
    { name: "DegreePassingCertificate", label: "Degree Passing Certificate / डिग्री पासिंग प्रमाण पत्र" },
    { name: "PassportNationalityCertificate", label: "Passport/Nationality Certificate / पासपोर्ट/नागरिकता प्रमाण पत्र " },
    { name: "MigrationCertificateTransferCertificate", label: "Migration Certificate/Transfer Certificate / प्रवास प्रमाण पत्र/स्थानांतरण प्रमाण पत्र " },
    { name: "GapCertificate", label: "Gap Certificate / अंतराल प्रमाण पत्र " },
    { name: "ProfessionalExperienceCertificate", label: "Professional Experience Certificate / पेशेवर अनुभव प्रमाण पत्र " },
    { name: "Signature", label: "Signature" }
  ];

  useEffect(() => {
    if (documents) {
      setDocumentData({ ...documents, AdditionalDocuments: documents.AdditionalDocuments || [] });
      setAdditionalDocs(documents.AdditionalDocuments || []);
    }
  }, [documents]);

  const checkFileValidation = (file) => {
    const validExtensions = [".docx", ".doc", ".pdf", ".jpg", ".jpeg", ".png"];
    return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const checkFileSize = (size) => (size / 1024 / 1024) <= 2; // 2MB limit

  const uploadFile = async (event, key) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!checkFileValidation(file)) {
      alert("Invalid file format. Upload .docx, .doc, .pdf, .jpg, .jpeg, or .png");
      return;
    }
    if (!checkFileSize(file.size)) {
      alert("File size must be less than 2MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/uploadSingleFile", formData, {
        headers: { "x-auth": localStorage.getItem("token"), "Content-Type": "multipart/form-data" },
      });

      setDocumentData((prev) => ({ ...prev, [key]: response.data.data.Key }));
    } catch (error) {
      console.error("Error uploading file", error);
      alert("File upload failed.");
    }
  };

  const addAdditionalDocument = () => {
    setAdditionalDocs([...additionalDocs, ""]);
  };

  const removeAdditionalDocument = (index) => {
    const updatedDocs = additionalDocs.filter((_, i) => i !== index);
    setAdditionalDocs(updatedDocs);
  };

  const saveDocuments = async () => {
    const finalDocuments = { ...documentData, AdditionalDocuments: additionalDocs };

    try {
      const response = await axios.post("/candidate/document", finalDocuments, {
        headers: { "x-auth": localStorage.getItem("token") },
      });

      if (response.data.success) {
        alert("Documents saved successfully!");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error saving documents:", error);
      alert("Failed to save documents.");
    }
  };

  const deleteDocument = async (name, id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await axios.delete(`/admin/candidate/candidatedoc`, {
        headers: { "x-auth": localStorage.getItem("token") },
        params: { documentName: name, id }
      });

      if (response.data.success) {
        alert("Document deleted successfully!");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document.");
    }
  };


  return (
    <>
        <div class="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div class="content-header-left col-md-9 col-12 mb-2">
            <div class="row breadcrumbs-top">
              <div class="col-12">
                <h3 class="content-header-title float-left mb-0">Documents</h3>
                <div class="breadcrumb-wrapper col-12">
                  
                  <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/candidate/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-separator">
                    <i className="fas fa-angle-right mx-1 text-muted"></i>
                  </li>
                  <li className="breadcrumb-item active">Documents</li>
                </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-body">
          <section id="documents-section">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Documents</h4>
                <h2>Candidate Name: {candidate?.name}</h2>
              </div>

              <div className="card-content">
                <div className="card-body">
                  <div className="row">
                    {documentLabels.map(({ name, label }, i) => (
                      <div className="col-md-6 mb-3" key={i}>
                        <label>
                          {label} {["Photograph", "AadharCardFront", "AadharCardBack", "10thMarksheet"].includes(name) && <span className="mandatory">*</span>}
                        </label>
                        {documentData[name] ? (
                          <div>
                            <a href={`${process.env.MIPIE_BUCKET_URL}/${documentData[name]}`} target="_blank" rel="noopener noreferrer">Uploaded {label}</a>
                            <button className="btn btn-danger btn-sm ml-2" onClick={() => deleteDocument(name, documents._id)}>Remove</button>
                          </div>
                        ) : (
                          <>
                            <input type="file" className="form-control" onChange={(e) => uploadFile(e, name)} />
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <h4>Additional Documents</h4>
                  <div className="row">
                    {additionalDocs.map((doc, i) => (
                      <div className="col-md-6 mb-3" key={i}>
                        <label>Additional Document {i + 1}</label>
                        <input type="file" className="form-control" onChange={(e) => uploadFile(e, `AdditionalDocuments-${i}`)} />
                        <button className="btn btn-danger btn-sm mt-1" onClick={() => removeAdditionalDocument(i)}>Remove</button>
                      </div>
                    ))}
                  </div>


                  <button className="btn btn-success mt-2" onClick={addAdditionalDocument}>Add Document</button>

                  <div className="text-right mt-3">
                    <button className="btn btn-danger me-2" onClick={() => window.location.reload()}>Reset</button>
                    <button className="btn btn-success ml-2" onClick={saveDocuments}>Save</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
 

 <style>
  {

    `
    .card .card-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  border-bottom: none;
  padding: 1.5rem 1.5rem 0;
  background-color: transparent;
}

.card-header {
  padding: 1.5rem 1.5rem;
  margin-bottom: 0;
  background-color: rgba(34, 41, 47, 0.03);
  border-bottom: 1px solid rgba(34, 41, 47, 0.125);
}

.card-header:first-child {
  border-radius: calc(0.5rem - 1px) calc(0.5rem - 1px) 0 0;
}

.fliter-block {
  display: block !important;
}

form #debt-amount-slider {
  display: flex;
  flex-direction: row;
  align-content: stretch;
  position: relative;
  width: 100%;
  height: 50px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

form #debt-amount-slider::before {
  content: " ";
  position: absolute;
  height: 2px;
  width: 100%;
  width: calc(100%*(4 / 5));
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #a39a9a;
}

form #debt-amount-slider input {
  display: none;
}

form #debt-amount-slider input,
form #debt-amount-slider label {
  box-sizing: border-box;
  flex: 1;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: pointer;
}

form #debt-amount-slider label {
  display: inline-block;
  position: relative;
  width: 20%;
  height: 100%;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

form:valid #debt-amount-slider input+label::before {
  transform: translate(-50%, 40px) scale(0.8);
  transition: all 0.15s linear;
}

form #debt-amount-slider label::before {
  content: attr(data-debt-amount);
  position: absolute;
  left: 50%;
  padding-top: 10px;
  transform: translate(-50%, 40px);
  font-size: 14px;
  letter-spacing: 0.4px;
  font-weight: 400;
  white-space: nowrap;
  opacity: 0.85;
  transition: all 0.15s ease-in-out;
}

form #debt-amount-slider label::after {
  content: " ";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid #625c5c;
  background: #fff;
  border-radius: 50%;
  pointer-events: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  z-index: 1;
  cursor: pointer;
  transition: all 0.15sease-in-out;
}
form #debt-amount-slider input:checked:nth-child(3) ~ #debt-amount-pos {
  left: 30%;
}
form #debt-amount-slider input:checked:nth-child(5) ~ #debt-amount-pos {
  left: 50%;
}
form #debt-amount-slider input:checked:nth-child(7) ~ #debt-amount-pos {
  left: 70%;
}

form #debt-amount-slider input:checked:nth-child(9)~#debt-amount-pos {
  left: 90%;
}

form #debt-amount-slider input:checked~#debt-amount-pos {
  opacity: 1;
}

form #debt-amount-slider #debt-amount-pos {
  display: block;
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #FC2B5A;
  border-radius: 50%;
  transition: all 0.15sease-in-out;
  transform: translate(-50%, -50%);
  border: 2px solid #fff;
  opacity: 0;
  z-index: 2;
}

/* .card-body {
    flex: 1 1 auto;
    padding: 1.5rem;
} */
form:valid #debt-amount-slider input:checked+label::before {
  color: #FC2B5A;
  transform: translate(-50%, 40px) scale(1.1);
  transition: all 0.15slinear;
}

form #debt-amount-slider input:checked+label::before {
  font-weight: 800;
  opacity: 1;
}

form #debt-amount-slider input:checked:nth-child(1)~#debt-amount-pos {
  left: 10%;
}

.searchjobspage .card {
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
  margin-bottom: 1rem;
}

.fliter-block {
  background-color: #fff;
  border-bottom: 1px solid #dfe3e7;
}

.filterSearchJob {
  margin-bottom: 1rem;
}

.filterSearchJob label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

/* Course/Job Card Styles */
.course_nw {
  margin-top: 1rem;
}

.cr_nw_in {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.cr_nw_in:hover {
  transform: translateY(-5px);
}

.video_thum {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.course_inf {
  padding: 1rem;
}

.course_inf h5 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.job_cate {
  color: #6e6b7b;
  display: block;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.curs_description span.job_cate {
  background: #1b95391a;
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 4px;
  color: #1b9539;
  border: solid 1px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: inline;
}
.course_spec {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.spe_icon {
  background-color: rgba(115, 103, 240, 0.1);
  border-radius: 50%;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
}

.spe_icon i {
  color: #7367f0;
  font-size: 1.5rem;
}

.spe_detail h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.spe_detail span {
  color: #6e6b7b;
  font-size: 0.8rem;
}

.jobDetails-wrap {
  margin-bottom: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* Job action buttons */
.act_btn {
  margin-top: 1rem;
}

.apply-thisjob {
  background-color: #FC2B5A;
  float: left;
  width: calc(100% - 30px);
  border: 2px solid #FC2B5A;
  text-align: center;
  color: #fff;
  -webkit-border-radius: 8px;
  -moz-border-radius: 8px;
  -ms-border-radius: 8px;
  -o-border-radius: 8px;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 12px;
  font-family: Open Sans;
  font-weight: bold;
}

.apply-thisjob:hover {
  border: 2px solid #FC2B5A;
  background: #fff;
  color: #FC2B5A;
  text-decoration: none;
}

.apply-thisjob i {
  margin-right: 0.5rem;
}

.call-btn {
  background-color: #1b9539 !important;
  border:
    2px solid #1b9539 !important;
}

.call-btn:hover {
  color: #1b9539 !important;
  border: 2px solid #1b9539 !important;
  background-color: #fff !important;
}

.act_btn .apply-thisjob {
  width: 100% !important;
  margin-bottom: 0px;
  text-align: center !important;
}

@media only screen and (max-width: 1400px) {
  .act_btn .apply-thisjob {
    padding:
      7px !important;
    font-size: 11px;
  }

  .act_btn .apply-thisjob i {
    font-size: 18px;
    top: 2px;
    margin-right: 3px;
  }
}

.call-btn:hover {
  background-color: #24b263;
}

.same-plane {
  display: flex;
  align-items: center;
  justify-content: center;
}

.plane-font {
  font-size: 1.2rem;
}

/* Map section styles */
.map {
  margin-top: 1rem;
}

#map {
  border-radius: 8px;
  box-shadow: 0 4px 24px 0 rgba(34, 41, 47, 0.1);
}

/* Distance slider styles */
#debt-amount-slider {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  margin-top: 1rem;
}

#debt-amount-slider input[type="radio"] {
  position: absolute;
  opacity: 0;
}

#debt-amount-slider label {
  cursor: pointer;
  position: relative;
  display: block;
  width: 20%;
  height: 100%;
  text-align: center;
}

#debt-amount-slider label:after {
  content: attr(data-debt-amount);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  color: #6e6b7b;
}

#debt-amount-slider label:before {
  content: '';
  position: absolute;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  /* background-color: #ddd; */
  transition: background-color 0.3s ease;
}

/* #debt-amount-slider input[type="radio"]:checked+label:before {
  background-color: #7367f0;
} */

#debt-amount-pos {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  background-color: #7367f0;
  pointer-events: none;
  transition: width 0.2s ease, left 0.2s ease;
}

/* Pagination styles */
.pagination {
  margin-top: 1rem;
}

.page-link {
  color: #7367f0;
  border-radius: 4px;
  margin: 0 2px;
}

.page-item.active .page-link {
  background-color: #7367f0;
  border-color: #7367f0;
}

.pagi_custom {
  background-color: #7367f0;
  color: #fff;
}

.pagi_customtwo:hover {
  background-color: rgba(115, 103, 240, 0.1);
}

/* Responsive styles */
@media (max-width: 768px) {
  .content-header {
    display: none;
  }

  .searchjobspage .card-body {
    padding: 0.75rem;
  }

  .forsmallscrn {
    display: block !important;
  }

  .forlrgscreen {
    display: none;
  }

  .cr_nw_in {
    margin-bottom: 1rem;
  }

  .act_btn .col-xl-6 {
    margin-bottom: 0.5rem;
  }
}

/* Modal styles */
.modal-content {
  border-radius: 8px;
  /* overflow: hidden; */
}

.modal-header {
  background-color: #7367f0;
  color: #fff;
}

.modal-title {
  font-weight: 600;
}

.close {
  color: #fff;
}

.btn-primary {
  background-color: #7367f0;
  border-color: #7367f0;
}

.btn-primary:hover {
  background-color: #5e50ee;
  border-color: #5e50ee;
}

/* Job Details Styles */

/* Rating Star Styles */
label.review {
  display: block;
}

input.star {
  display: none;
}

label.star {
  float: right;
  padding: 10px;
  font-size: 30px !important;
  color: #444;
  transition: all .2s;
}

input.star:hover ~ label.star:before {
  content: '\f005';
  color: #ffd100;
  transition: all .25s;
}

input.star:checked ~ label.star:before {
  content: '\f005';
  color: #ffd100;
  transition: all .25s;
}

input.star-5:hover ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}

input.star-5:checked ~ label.star:before {
  color: #FE7;
  text-shadow: 0 0 20px #952;
}

label.star:hover {
  transform: rotate(-15deg) scale(1.3);
}

label.star:before {
  content: '\f006';
  font-family: FontAwesome;
}

input.star:checked ~ .rev-box {
  height: 125px;
  overflow: visible;
}

/* Job Details Specific Styles */
.course_dtl {
  margin-bottom: 20px;
}

.curs_description h4 {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 5px;
}

.job_cate {
  font-size: 16px;
  color: #666;
  margin-bottom: 15px;
  display: block;
}

.course_spec {
  display: flex;
  margin-top: 25px;
}

.spe_icon {
  font-size: 24px;
  margin-right: 10px;
  color: #FC2B5A;
  width: 40px;
  text-align: center;
}

.spe_detail h3 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 0;
}

.jobDetails-wrap {
  margin-bottom: 5px;
}

.job-single-sec {
  background-color: #fff;
  border-radius: 5px;
  padding: 15px 0;
}

.job-details h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 15px;
}
.v_pal img {
  border-radius: 8px;
}
.course_dtl h6 {
  font-size: 17px;
  font-weight: 600;
  margin-top: 35px;
}
.apply-thisjob {
  background-color: #FC2B5A;
  color: #fff;
  border-radius: 5px;
  padding: 12px 20px;
  font-weight: 500;
  display: inline-block;
  text-decoration: none !important;
  transition: background-color 0.3s;
  margin-bottom: 10px;
}

.apply-thisjob:hover {
  border: 2px solid #FC2B5A;
  background: #fff;
  color: #FC2B5A;
  text-decoration: none;
}

.apply-thisjob i {
  margin-right: 8px;
}

.disabled-button {
  background-color: #888;
  cursor: not-allowed;
}

.disabled-button:hover {
  background-color: #888;
  border: 2px solid#888;
  color: #fff!important;
}

.call-btn {
  background-color: #28a745;
}

.call-btn:hover {
  background-color: #218838;
}

.rebase-job {
  background-color: #17a2b8;
}

.rebase-job:hover {
  background-color: #138496;
  border: 2px solid #138496;
  color: #fff!important;
}
.btn{
  border: 1px solid #FC2B5A!important;
}

.rebase-job.disabled {
  background-color: #888;
  cursor: not-allowed;
  border: 1px solid #888;
}

.extra-job-info {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
}

.extra-job-info span {
  display: block;
  margin-bottom: 10px;
  color: #666;
}

.extra-job-info strong {
  display: inline-block;
  margin-right: 5px;
  color: #333;
  min-width: 150px;
}

.extra-job-info i {
  margin-right: 8px;
  color: #FC2B5A;
}

/* Course Card Styles */
.pointer {
  cursor: pointer;
}

.job-overview {
  margin-bottom: 20px;
}

.job-overview h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
}

.job-overview ul li {
  display: flex;
  margin-bottom: 15px;
}

.job-overview ul li i {
  font-size: 24px;
  margin-right: 10px;
  color: #FC2B5A;
  width: 40px;
  text-align: center;
}

.custom_sty {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
}

/* Media Gallery Styles */
.carousel-gallery {
  position: relative;
  margin-bottom: 30px;
}

.swiper-wrapper {
  display: flex;
}

.swiper-slide {
  width: 33.333%;
  transition: 0.3s;
}

.swiper-slide .image {
  width: 100%;
  height: 200px;
  border-radius: 5px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.swiper-slide .image .overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: 0.3s;
}

.swiper-slide .image .overlay em {
  color: #fff;
  font-size: 24px;
}

.swiper-slide:hover .image .overlay {
  opacity: 1;
}

.swiper-pagination {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.swiper-pagination-bullet {
  width: 10px;
  height: 10px;
  background: #ccc;
  margin: 0 5px;
  border-radius: 50%;
  cursor: pointer;
}

.swiper-pagination-bullet-active {
  background: #FC2B5A;
}

/* Video Gallery Styles */
.position-relative {
  position: relative;
}

.play-btn {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.pluscenter .pulse {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: pulse 1.5s infinite;
}

.uplay {
  width: 30px;
  height: 30px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Modal Styles */
.modal-content {
  border-radius: 5px;
  overflow: hidden;
}

.modal-header {
  background-color: #FC2B5A;
  color: #fff;
  border-bottom: none;
}

.modal-title {
  font-weight: 600;
}

.modal-header .close {
  color: #fff;
  opacity: 0.8;
}

.modal-header .close:hover {
  opacity: 1;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  border-top: none;
  padding: 15px 20px;
}

.vchr_header {
  background-color: #6f42c1;
}

.mode-dice {
  background-color: #532e92;
  color: #fff;
}

.coupon-text {
  font-size: 16px;
  padding: 0 15px;
}

.voucher-btn {
  background-color: #28a745;
  color: #fff;
  border: none;
}

.voucher-btn.disabled {
  background-color: #888;
  cursor: not-allowed;
}

.button-vchr {
  background-color: #6f42c1;
  color: #fff;
  border: none;
}

.button-vchr:hover {
  background-color: #5e37a6;
  color: #fff;
}

.review-border .modal-header {
  background-color: #28a745;
}

.inner-border {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  padding: 10px;
}

.popup-bg {
  background-color: rgba(255, 255, 255, 0.1);
}

.radio-size {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
.modal{
  background-color: rgba(0,0,0,0.5);
  }
  .job-thumb {
    display: table-cell;
    vertical-align: top;
    width: 107px;
}
.job-thumb img {
  float: left;
  width: 100%;
  border: 2px solid #e8ecec;
  border-radius: 8px;
}
  .text-right{
  text-align: right;
  }

 .card .card-title{
 font-size : 1rem!important;
 }

 label{
 font-size : 0.80rem !important;
 }
 .content h2 {
    color: #2d3748;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 700;
}
    
@media (max-width: 767px) {
  .swiper-slide {
    width: 50%;
  }
  
  .viewjob-apply {
    margin-top: 20px;
  }
  
  .spe_icon {
    font-size: 20px;
    width: 30px;
  }
  
  .extra-job-info strong {
    min-width: auto;
    margin-bottom: 5px;
    display: block;
  }
}

@media (max-width: 575px) {
  .swiper-slide {
    width: 100%;
  }
  
  .course_spec {
    flex-direction: column;
  }
  
  .spe_icon {
    margin-bottom: 5px;
  }
  
  .job-overview ul li {
    flex-direction: column;
  }
  
  .job-overview ul li i {
    margin-bottom: 5px;
  }
}
  .breadcrumb-item a {
    color: #FC2B5A;
        }  
    `
  }
 </style>


    </>
  )
}

export default CandidateDocumets
