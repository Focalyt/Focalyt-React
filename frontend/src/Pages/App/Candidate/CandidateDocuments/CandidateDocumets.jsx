import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CandidatesDocuments.css"
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
     
        <div
          class="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none"
        >
          <div class="content-header-left col-md-9 col-12 mb-2">
            <div class="row breadcrumbs-top">
              <div class="col-12">
                <h3 class="content-header-title float-left mb-0">Documents</h3>
                <div class="breadcrumb-wrapper col-12">
                  <ol class="breadcrumb">
                    <li class="breadcrumb-item">
                      <a href="/candidate/dashboard">Home</a>
                    </li>
                    <li class="breadcrumb-item"><a href="#">Documents</a></li>
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
 


    </>
  )
}

export default CandidateDocumets
