import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { resolveMediaUrl } from '../../../../utils/resolveMediaUrl';

const JobRequiredDocuments = () => {
  const { jobId } = useParams();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const [jobTitle, setJobTitle] = useState('');
  const [docs, setDocs] = useState([]);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/candidate/jobDocs/${jobId}`, {
        headers: { 'x-auth': localStorage.getItem('token') },
      });
      setJobTitle(response.data.jobTitle || '');
      setDocs(response.data.mergedDocs || []);
    } catch (error) {
      console.error('Error fetching job documents:', error);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) fetchDocuments();
  }, [jobId]);

  const getFileType = (url) => {
    const lower = String(url || '').split('?')[0].toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp)$/.test(lower)) return 'image';
    if (/\.pdf$/.test(lower)) return 'pdf';
    if (/\.(doc|docx)$/.test(lower)) return 'document';
    return 'file';
  };

  const formatUploadedDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatUploadedTime = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleFileChange = (event, doc) => {
    const file = event.target.files?.[0];
    const allowed = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    const extension = file?.name?.split('.').pop()?.toLowerCase();
    if (!file || !allowed.includes(extension)) {
      alert('Please upload only PDF, DOC, DOCX, JPG, JPEG, or PNG files.');
      event.target.value = '';
      return;
    }
    uploadFile(doc, file);
    event.target.value = '';
  };

  const uploadFile = async (doc, file) => {
    if (!file) {
      alert('Please select a file before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docsName', doc.Name);
    formData.append('jobId', jobId);
    formData.append('docsId', doc._id);

    try {
      setUploadingDocId(doc._id);
      const response = await axios.post(`${backendUrl}/candidate/jobDocs/${jobId}`, formData, {
        headers: {
          'x-auth': localStorage.getItem('token'),
          'Content-Type': 'multipart/form-data',
        },
      });
      setDocs(response.data.mergedDocs || []);
      alert('Document uploaded successfully.');
    } catch (error) {
      console.error('Error uploading job document:', error);
      alert(error.response?.data?.message || 'Error uploading file. Please try again.');
    } finally {
      setUploadingDocId(null);
    }
  };

  return (
    <div className="content-body">
      <div className="content-header row">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <h3 className="content-header-title float-left mb-0">Job Documents</h3>
          <div className="breadcrumb-wrapper col-12">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/candidate/dashboard">Home</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/candidate/appliedJobs">Applied Jobs</Link>
              </li>
              <li className="breadcrumb-item active">{jobTitle || 'Documents'}</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="job-docs-page">
        {loading ? (
          <div className="job-docs-empty">Loading documents...</div>
        ) : docs.length === 0 ? (
          <div className="job-docs-empty">
            <h5>No Documents Required</h5>
            <p>This job does not require any documents from you.</p>
          </div>
        ) : (
          <div className="documents-grid-enhanced">
            {docs.map((doc) => {
              const fileUrl = doc.fileUrl ? resolveMediaUrl(bucketUrl, doc.fileUrl) : '';
              const fileType = getFileType(fileUrl);
              const uploadedDate = formatUploadedDate(doc.uploadedAt);
              const uploadedTime = formatUploadedTime(doc.uploadedAt);
              const isUploading = uploadingDocId === doc._id;
              return (
                <div className="document-card-enhanced" key={doc._id}>
                  <div className="document-image-container">
                    {fileUrl ? (
                      fileType === 'image' ? (
                        <img src={fileUrl} alt={doc.Name} className="document-image" />
                      ) : (
                        <div className="document-preview-icon">
                          <i
                            className="fa-solid fa-file"
                            style={{ fontSize: 100, color: fileType === 'pdf' ? '#dc3545' : '#6c757d' }}
                          />
                          <p>{fileType === 'pdf' ? 'PDF Document' : 'Document'}</p>
                        </div>
                      )
                    ) : (
                      <div className="no-document-placeholder">
                        <i className="fas fa-file-upload" />
                        <p>No Document</p>
                      </div>
                    )}
                  </div>

                  <div className="document-info-section">
                    <div className="document-header">
                      <h4 className="document-title">
                        {doc.Name}
                        {doc.mandatory ? <span className="doc-required-star"> *</span> : null}
                      </h4>
                      <div className="document-actions">
                        {fileUrl ? (
                          <a className="action-btn verify-btn" href={fileUrl} target="_blank" rel="noreferrer">
                            <i className="fas fa-search" />
                            Preview
                          </a>
                        ) : (
                          <label className={`action-btn upload-btn mb-0${isUploading ? ' is-busy' : ''}`}>
                            <i className="fas fa-cloud-upload-alt" />
                            {isUploading ? 'Uploading' : 'Upload'}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              disabled={isUploading}
                              onChange={(event) => handleFileChange(event, doc)}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="document-meta">
                      <div className="meta-item">
                        <i className="fas fa-calendar-alt" />
                        <span className="meta-text">{uploadedDate || 'Not uploaded'}</span>
                      </div>
                      {uploadedTime ? (
                        <div className="meta-item">
                          <i className="fas fa-clock" />
                          <span className="meta-text">{uploadedTime}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .job-docs-page .documents-grid-enhanced {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 2rem;
        }
        .job-docs-page .job-docs-empty {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
          padding: 2rem 1rem;
          text-align: center;
          color: #666;
        }
        .job-docs-page .job-docs-empty h5 {
          color: #333;
          font-weight: 700;
        }
        .job-docs-page .document-card-enhanced {
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        .job-docs-page .document-card-enhanced:hover {
          transform: translateY(-10px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        }
        .job-docs-page .document-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
          background: #f8f9fa;
        }
        .job-docs-page .document-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .job-docs-page .document-preview-icon,
        .job-docs-page .no-document-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #999;
        }
        .job-docs-page .document-preview-icon p {
          font-size: 12px;
          margin: 10px 0 0;
          color: #333;
        }
        .job-docs-page .no-document-placeholder {
          font-size: 3rem;
          color: #ccc;
        }
        .job-docs-page .no-document-placeholder p {
          margin-top: 1rem;
          font-size: 1rem;
          color: #999;
        }
        .job-docs-page .document-info-section {
          padding: 1.5rem;
        }
        .job-docs-page .document-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .job-docs-page .document-title {
          margin: 0;
          color: #333;
          font-size: 0.9rem;
          font-weight: 700;
          flex: 1;
          text-transform: capitalize;
        }
        .job-docs-page .doc-required-star {
          color: #c62828;
        }
        .job-docs-page .action-btn {
          border: none;
          border-radius: 20px;
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-decoration: none;
          white-space: nowrap;
        }
        .job-docs-page .upload-btn {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          color: #fff;
          box-shadow: 0 3px 10px rgba(250, 112, 154, 0.4);
          margin: 0;
        }
        .job-docs-page .verify-btn {
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
          color: #c62828;
          box-shadow: 0 3px 10px rgba(255, 154, 158, 0.4);
        }
        .job-docs-page .action-btn:hover {
          transform: translateY(-2px);
          color: inherit;
          text-decoration: none;
        }
        .job-docs-page .verify-btn:hover {
          color: #c62828;
        }
        .job-docs-page .upload-btn input {
          display: none;
        }
        .job-docs-page .upload-btn.is-busy {
          opacity: 0.7;
          pointer-events: none;
        }
        .job-docs-page .document-meta {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .job-docs-page .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #888;
          font-size: 0.9rem;
        }
        .job-docs-page .meta-text {
          color: #333;
        }
        @media (max-width: 768px) {
          .job-docs-page .documents-grid-enhanced {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default JobRequiredDocuments;
