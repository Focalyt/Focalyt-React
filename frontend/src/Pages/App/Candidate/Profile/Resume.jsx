import React, { useState } from 'react';
import axios from 'axios';
const Resume = () => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const [fileName, setFileName] = useState("");
    const [uploadDate, setUploadDate] = useState("");
    const checkCvValidation = (fileName) => {
        const allowedExtensions = /\.(docx?|pdf|jpg|jpeg|png)$/i;
        return allowedExtensions.test(fileName);
      };
    
      const checkCVSize = (size) => {
        return size <= 5 * 1024 * 1024; // 5MB
      };
    
      const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
    
        const fileType = file.name;
        const fileSize = file.size;
    
        if (!checkCvValidation(fileType) && !checkCVSize(fileSize)) {
          alert("Upload the CV in .docx, .doc, .jpg, .jpeg, .png or pdf format and size should be less than 5MB");
          e.target.value = '';
          return;
        } else if (checkCvValidation(fileType) && !checkCVSize(fileSize)) {
          alert("Uploaded CV size should be less than 5MB");
          e.target.value = '';
          return;
        } else if (!checkCvValidation(fileType) && checkCVSize(fileSize)) {
          alert("Upload the CV in .docx, .doc, .jpg, .jpeg, .png or pdf format");
          e.target.value = '';
          return;
        }
    
        const formData = new FormData();
        formData.append("file", file);
    
        const headers = {
          headers: {
            'x-auth': localStorage.getItem('token'),
            'Content-Type': 'multipart/form-data'
          }
        };
    
        try {
          const result = await axios.post(`${backendUrl}/api/uploadSingleFile`, formData, headers);
          console.log("📦 Upload response:", result.data);
    
          if (result.data.status) {
            localStorage.setItem("resume", result.data.data.Key); // Saving key like original
            setFileName(file.name);
            const currentDate = new Date().toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric'
            }).replace(/ /g, ' ');
            setUploadDate(currentDate);
          }
        } catch (error) {
          console.error("Upload failed:", error);
          alert("Something went wrong while uploading the resume.");
        }
      };
    
    return (
        <>
            <div className="section-order">
                <div className="section fadeInUp resume">
                    <div className="heading-container">
                        <div className="text-emoji-container">
                            <div className="text-container">
                                <h1 className="section-heading title-16-bold">Resume</h1>
                                <h2 className="section-sub-heading title-14-medium">
                                    Your resume is the first impression you make on potential employers. Craft it carefully to secure your desired job or internship.
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="uploaded-container">
                        <div className="file-details">
                            <div className="file-name title-14-bold">{fileName}</div>
                            <div className="uploaded-date title-14-regular">Uploaded on {uploadDate}</div>
                        </div>

                        <div className="action-container">
                            <div className="border-box download">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M12.5015 8.49805V10.9437C12.5015 11.268 12.3726 11.579 12.1433 11.8083C11.914 12.0377 11.603 12.1665 11.2786 12.1665H2.71891C2.3946 12.1665 2.08357 12.0377 1.85425 11.8083C1.62493 11.579 1.49609 11.268 1.49609 10.9437V8.49805"
                                        stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10.0555 6.44686L6.99845 9.50391L3.94141 6.44686"
                                        stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M7 9.50391V2.16699"
                                        stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            <div className="border-box delete">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <g clipPath="url(#clip0_2370_12506)">
                                        <path d="M1.52734 3.35156H2.74333H12.4712"
                                            stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M4.56812 3.35189V2.1359C4.56812 1.81341 4.69623 1.50412 4.92427 1.27608C5.15231 1.04803 5.4616 0.919922 5.7841 0.919922H8.21606C8.53856 0.919922 8.84785 1.04803 9.07589 1.27608C9.30393 1.50412 9.43205 1.81341 9.43205 2.1359V3.35189"
                                            stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M11.256 3.35189V11.8638C11.256 12.1863 11.1279 12.4956 10.8999 12.7236C10.6718 12.9516 10.3625 13.0798 10.04 13.0798H3.96012C3.63762 13.0798 3.32833 12.9516 3.10029 12.7236C2.87225 12.4956 2.74414 12.1863 2.74414 11.8638V3.35189H11.256Z"
                                            stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M5.7832 6.39258V10.0405"
                                            stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M8.21484 6.39258V10.0405"
                                            stroke="#275DF5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_2370_12506">
                                            <rect width="14" height="14" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="resume-upload-container">
                        <input type="file" className="upload-input" onChange={handleFileUpload} />
                        <button className="btn upload-button">Update resume</button>
                        <div className="help-text title-14-medium">
                            Supported formats: doc, docx, rtf, pdf, up to 2MB
                        </div>
                    </div>
                </div>
            </div>
<style>
    {
        `
        .section-order {
    background-color: #f8f9fa;
    min-height: 100vh;
    padding: 20px;
  }
  
  .section.fadeInUp.resume {
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  /* Heading Container */
  .heading-container {
    margin-bottom: 24px;
  }
  
  .text-emoji-container {
    display: flex;
    align-items: flex-start;
  }
  
  .text-container {
    flex: 1;
  }
  
  .section-heading.title-16-bold {
    font-size: 20px;
    font-weight: 700;
    color: #212529;
    margin: 0 0 8px 0;
  }
  
  .section-sub-heading.title-14-medium {
    font-size: 15px;
    font-weight: 400;
    color: #6c757d;
    margin: 0;
    line-height: 1.5;
  }
  
  /* Uploaded Container */
  .uploaded-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 16px 20px;
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
  }
  
  .file-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .file-name.title-14-bold {
    font-size: 15px;
    font-weight: 600;
    color: #212529;
  }
  
  .uploaded-date.title-14-regular {
    font-size: 13px;
    font-weight: 400;
    color: #6c757d;
  }
  
  /* Action Container */
  .action-container {
    display: flex;
    gap: 12px;
  }
  
  .border-box {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .border-box.download {
    background: rgba(39, 93, 245, 0.1);
  }
  
  .border-box.delete {
    background: rgba(39, 93, 245, 0.1);
  }
  
  .border-box:hover {
    background: rgba(39, 93, 245, 0.2);
  }
  
  /* Resume Upload Container */
  .resume-upload-container {
    text-align: center;
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    padding: 32px 24px;
    position: relative;
    background: #ffffff;
  }
  
  .upload-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  
  .btn.upload-button {
    background: transparent;
    border: 1px solid #275DF5;
    color: #275DF5;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 24px;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 12px;
    transition: all 0.2s ease;
  }
  
  .btn.upload-button:hover {
    background: rgba(39, 93, 245, 0.05);
  }
  
  .help-text.title-14-medium {
    font-size: 13px;
    font-weight: 400;
    color: #6c757d;
    margin: 0;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .section.fadeInUp.resume {
      margin: 10px;
      padding: 16px;
    }
    
    .uploaded-container {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    
    .action-container {
      width: 100%;
      justify-content: flex-end;
    }
  }
        `
    }
</style>

        </>
    );
};

export default Resume;
