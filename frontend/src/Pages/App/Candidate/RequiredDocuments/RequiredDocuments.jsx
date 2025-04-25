import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const RequiredDocuments = () => {
  const [mergedDocs, setMergedDocs] = useState([]);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  const [selectedFiles, setSelectedFiles] = useState({});
   const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  
   const { courseId } = useParams(); // ✅ Get courseId from URL path
 
   useEffect(() => {
     if (courseId) {
       fetchDocuments(courseId); // ✅ Use the correct courseId
     }
   }, [courseId]);

  const fetchDocuments = async (id) => {
    try {
      console.log(id)
      const response = await axios.get(`${backendUrl}/candidate/reqDocs/${id}`, {
        headers: { 'x-auth': localStorage.getItem('token') }
      });
      setMergedDocs(response.data.mergedDocs || []);
      console.log('Merge docs',)
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const validateFile = (files, docId) => {
    const allowedExtensions = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
    
    for (let i = 0; i < files.length; i++) {
      const fileExtension = files[i].name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        alert("Please upload only PDF, DOC, DOCX, JPG, JPEG, or PNG files!");
        return false;
      }
    }
    
    return true;
  };

  const handleFileChange = (e, docId) => {
    const files = e.target.files;
    
    if (validateFile(files, docId)) {
      setSelectedFiles({
        ...selectedFiles,
        [docId]: files[0]
      });
    } else {
      e.target.value = "";
      setSelectedFiles({
        ...selectedFiles,
        [docId]: null
      });
    }
  };

  const removeFile = (docId) => {
    setSelectedFiles({
      ...selectedFiles,
      [docId]: null
    });
    // Reset the file input
    const fileInput = document.getElementById(`${docId}docPopUp`);
    if (fileInput) fileInput.value = "";
  };

  const uploadFile = async (docName, docId) => {
    if (!courseId) {
      alert("Error: Course ID is not available.");
      return;
    }

    const file = selectedFiles[docId];
    if (!file) {
      alert("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("docsName", docName);
    formData.append("courseId", courseId);
    formData.append("docsId", docId);

    try {
      setUploadingDocId(docId);
      await axios.post(`${backendUrl}/candidate/reqDocs/${courseId}`, formData, {
        headers: {
          'x-auth': localStorage.getItem('token'),
          'Content-Type': 'multipart/form-data'
        }
      });
      alert("Your documents uploaded successfully");
      fetchDocuments(courseId);
      removeFile(docId);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
    }
    finally {
      setUploadingDocId(null); // ✅ Hide loader after process
    }
  };

  const toggleStatusView = (docId) => {
    const element = document.getElementById(`collapseOne${docId}`);
    if (element) {
      element.style.display = element.style.display === "none" ? "block" : "none";
    }
  };

  const openPopup = (docId) => {
    const popup = document.getElementById(`popup${docId}`);
    if (popup) popup.classList.remove('d-none');
  };

  const closePopup = (docId) => {
    const popup = document.getElementById(`popup${docId}`);
    if (popup) popup.classList.add('d-none');
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return 'PDF';
      case 'doc':
      case 'docx': return 'DOC';
      default: return 'FILE';
    }
  };

  const truncateFilename = (filename) => {
    if (filename.length > 15) {
      const extension = filename.split('.').pop();
      const name = filename.substring(0, filename.length - extension.length - 1);
      return name.substring(0, 10) + '...' + '.' + extension;
    }
    return filename;
  };

  const renderFilePreview = (docId) => {
    const file = selectedFiles[docId];
    if (!file) return null;
    
    if (file.type.startsWith("image/")) {
      return (
        <div className="preview-item">
          <img 
            src={URL.createObjectURL(file)} 
            alt={file.name} 
          />
          <div className="remove-btn" onClick={() => removeFile(docId)}>×</div>
          <div className="file-name">{truncateFilename(file.name)}</div>
        </div>
      );
    } else {
      const fileIcon = getFileIcon(file.name);
      return (
        <div className="preview-item">
          <div className="preview-icon">{fileIcon}</div>
          <div className="remove-btn" onClick={() => removeFile(docId)}>×</div>
          <div className="file-name">{truncateFilename(file.name)}</div>
        </div>
      );
    }
  };

  return (
    <>
          <div className="uploader-container">
            <div className="uploader-header">Document Uploader</div>

            <div id="documentContainer">
              {mergedDocs.map((doc) => (
                <React.Fragment key={doc._id}>
                  <div className="doc-row">
                    <div className="file-containers d-flex align-items-center gap-4">
                      {(!doc.uploads || doc.uploads.length === 0) && (
                        <div className="d-flex align-items-center gap-4 innerfile-container" style={{ gap: '20px' }}>
                          <div className="align-items-center gap-4 innerfile-container" style={{ gap: '20px' }}>
                            <span className="title m-0 text-capitalize">{doc.Name}</span>
                            
                            <div className="actionsbtn pt-2">
                              <label htmlFor={`${doc._id}docPopUp`} className="button upload-btn">
                                Choose File
                                <input
                                  type="file"
                                  id={`${doc._id}docPopUp`}
                                  className="file-inputs fileInput"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  onChange={(e) => handleFileChange(e, doc._id)}
                                />
                              </label>
                            </div>
                            <div id={`${doc._id}image-preview`} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                              {renderFilePreview(doc._id)}
                            </div>
                          </div>
                          
                          <button
  className="upload-btn mt-3"
  onClick={() => uploadFile(doc.Name, doc._id)}
  disabled={uploadingDocId === doc._id}
>
  {uploadingDocId === doc._id ? (
    <span className="spinner-border spinner-border-sm text-light" role="status" />
  ) : (
    'Upload'
  )}
</button>

                        </div>
                      )}
                      
                      {doc.uploads?.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Pending' && (
                        <>
                          <span className="text-success">
                            Your {doc.Name} Already uploaded please check the status by click on the check status button
                          </span>
                          <div className="d-flex flex-wrap align-items-center justify-content-end">
                            <button
                              className="btn btn-link collapsed py-0 mx-0 filter-docs"
                              onClick={() => toggleStatusView(doc._id)}
                              data-doc-id={doc._id}
                              alt="Filter"
                            >
                              Check Status
                            </button>
                          </div>
                        </>
                      )}
                      
                      {doc.uploads?.length > 0 && doc.uploads[doc.uploads.length - 1].status === 'Rejected' && (
                        <>
                          <span className="text-success">
                            Your {doc.Name} has been rejected due to "{doc.uploads[doc.uploads.length - 1].reason}". 
                            Please upload a new document for verification.
                          </span>
                          
                          <div className="add-doc-container">
                            <button className="upload-btn" onClick={() => openPopup(doc._id)}>
                              Upload New Document
                            </button>
                          </div>
                          <div className="d-flex flex-wrap align-items-center justify-content-end">
                            <button
                              className="btn btn-link collapsed py-0 mx-0 filter-docs"
                              onClick={() => toggleStatusView(doc._id)}
                              data-doc-id={doc._id}
                              alt="Filter"
                            >
                              Check Status
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Table */}
                  <div id={`collapseOne${doc._id}`} style={{ display: 'none' }}>
                    <div className="pl-xl-0 pr-xl-1 pl-lg-0 pr-lg-1 pl-md-0 pr-md-1 px-sm-0 px-0 mx-auto">
                      <div className="table-content shadow-cashback shadow-cashback">
                        <div className="tab_head font-weight-bolder py-1 px-1">
                          Uploaded Document
                        </div>
                        
                        <table className="table table-responsive">
                          <thead>
                            <tr className="tab_row docs--rows">
                              <th scope="col" width="10%">S.No</th>
                              <th scope="col" width="10%">Date</th>
                              <th scope="col" width="20%">View</th>
                              <th scope="col" width="35%">Verification Status</th>
                              <th scope="col" width="30%">Reason (If rejected)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {doc.uploads?.map((upload, index) => (
                              <tr className="docs--rows" key={index}>
                                <td>{index + 1}</td>
                                <td>{moment(upload.uploadedAt).format('DD/MM/YYYY HH:mm:ss')}</td>
                                <td>
                                  <a href={upload.fileUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                                    VIEW
                                  </a>
                                </td>
                                <td>
                                  <span className="status">{upload.status}</span>
                                </td>
                                <td>
                                  {upload.reason || 'NA'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Popup for uploading new document */}
                  <div id={`popup${doc._id}`} className="file-container2 trans_parent d-none">
                    <div className="popupModel">
                      <span onClick={() => closePopup(doc._id)} className="close">X</span>
                      <div className="contents">
                        <span className="title m-0">{doc.Name}</span>
                        <p className="message">
                          Select a file to upload from your computer or device.
                        </p>

                        <div className="actions">
                          <label htmlFor={`${doc._id}docPopUp`} className="button upload-btn">
                            Choose File
                            <input
                              type="file"
                              id={`${doc._id}docPopUp`}
                              className="file-input fileInput"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(e, doc._id)}
                            />
                          </label>
                        </div>
                        <div id={`${doc._id}image-preview`} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {renderFilePreview(doc._id)}
                        </div>
                      </div>
                      <button
                        className="upload-btn upload-new-btn"
                        onClick={() => uploadFile(doc.Name, doc._id)}
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
      
      <style>{`
        .trans_parent {
          background-color: rgba(0, 0, 0, 0.5);
          width: 100%;
          height: 100%;
          position: absolute;
          z-index: 12;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .popupModel {
          position: relative;
          background: white;
          max-width: 400px;
          margin: 85px auto;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          width: 100%;
          text-align: center;
        }

        .contents > *,
        .popupModel > * {
          padding: 0.875em;
        }

        .title {
          font-size: 1.25em;
          font-weight: 600;
          line-height: 1.2;
          justify-content: center;
        }

        .message {
          line-height: 1.2;
          text-align: center;
        }

        .actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .upload-btn {
          background-color: transparent;
          border: 0.125rem dashed hsla(223, 10%, 50%, 0.4);
          flex: 1;
          padding: 0.375rem 2rem;
        }

        .upload-btn:hover {
          background-color: hsla(223, 10%, 60%, 0.2);
        }

        .upload-new-btn {
          position: relative;
          z-index: 13;
        }

        .close {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgb(226, 94, 54);
          height: 30px;
          width: 30px;
          border-radius: 50%;
          position: absolute;
          right: 10px;
          top: 10px;
          color: #fff;
          font-weight: bold;
          cursor: pointer;
          z-index: 13;
        }

        .result {
          margin-top: 4px;
          background-color: rgba(0, 140, 255, 0.062);
          display: flex;
          align-items: center;
          position: relative;
          border-radius: 1em;
        }

        .file-uploaded {
          font-weight: 300;
        }

        .file-uploaded::before {
          position: absolute;
          content: "X";
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(26, 7, 1, 0.212);
          height: 30px;
          width: 30px;
          border-radius: 50%;
          right: 10px;
          top: 10px;
          color: rgb(255, 255, 255);
          font-weight: bold;
          cursor: pointer;
        }

        .file-uploaded:hover::before {
          background-color: rgba(233, 40, 6, 0.664);
        }

        .uploader-container {
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          margin: 20px auto;
          max-width: 900px;
        }

        .uploader-header {
          background: linear-gradient(135deg, #6b45a9, #e83a5f);
          color: white;
          padding: 20px;
          text-align: center;
          font-size: 24px;
          font-weight: 600;
        }

        .doc-row {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          padding: 25px;
          border-bottom: 1px solid #eaeaea;
          background-color: #f8f9fa;
          transition: all 0.3s ease;
        }

        .doc-row:hover {
          background-color: #f0f7ff;
          transform: translateY(-2px);
        }

        .field-label {
          display: block;
          margin-bottom: 8px;
          color: #2c3e50;
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
        }

        .file-containers {
          flex: 1 1 250px;
          position: relative;
          gap: 40px;
        }

        .file-input-label {
          display: block;
          position: relative;
          width: 100%;
          height: 45px;
          background-color: #f0f0f0;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          text-align: center;
          line-height: 45px;
          cursor: pointer;
          overflow: hidden;
          color: #555;
          font-weight: 500;
          transition: all 0.3s;
          margin: 0 !important;
          transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.1s ease;
        }

        .file-input-label:hover {
          background-color: #e8e8e8;
          border-color: #d0d0d0;
        }

        .file-input-label:active {
          transform: scale(0.98);
        }

        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .upload-btn {
          background: linear-gradient(135deg, #6b45a9, #e83a5f);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 12px 15px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 3px 10px rgba(107, 69, 169, 0.3);
          transition: background 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
        }

        .upload-btn:hover {
          background: linear-gradient(135deg, #5d3b93, #d62e50);
          box-shadow: 0 5px 15px rgba(232, 58, 95, 0.4);
        }

        .upload-btn:active {
          transform: translateY(0);
        }

        .add-doc-container {
          display: flex;
          align-items: center;
        }

        #image-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 15px;
          min-height: 60px;
        }

        .preview-item {
          position: relative;
          display: inline-block;
          margin-right: 10px;
          margin-bottom: 10px;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .preview-item img,
        .preview-item video {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #ddd;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }

        .preview-item .preview-icon {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #555;
          font-weight: bold;
          font-size: 12px;
          text-align: center;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .remove-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ff5252;
          color: white;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .remove-btn:hover {
          background: #ff0000;
          transform: scale(1.1);
        }

        .file-name {
          font-size: 12px;
          color: #555;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
          margin-top: 5px;
        }

        .table-responsive {
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .upload-btn {
            width: 100%;
            margin-top: 15px;
          }
          .innerfile-container {
            flex-direction: column;
          }
          .docs--rows th, .docs--rows td {
            white-space: nowrap;
          }
        }
      `}</style>
    </>
  );
};

export default RequiredDocuments;
