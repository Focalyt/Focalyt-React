import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faXmark, faPlus } from "@fortawesome/free-solid-svg-icons";

const UploadTemplates = () => {
  const [collegeDocs, setCollegeDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  
  useEffect(() => {
    fetchCollegeDocs();
  }, []);

  const fetchCollegeDocs = async () => {
    try {
      const header = { headers: { 'x-auth': localStorage.getItem('token') } };
      const response = await axios.get(`${backendUrl}/college/getTemplates`, header);
      
      if (response.data.status) {
        setCollegeDocs(response.data.data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching college documents:', error);
      setLoading(false);
    }
  };

  const checkFileSize = (size) => {
    let finalSize = ((size / 1024) / 1024);
    return finalSize <= 2;
  };

  const checkFileValidation = (file) => {
    let regex = /(\/vnd.ms-excel|\/vnd.openxmlformats-officedocument.spreadsheetml.sheet|\/pdf|\/zip)$/i;
    return regex.test(file);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const filename = file.name;
    const type = file.type;
    const size = file.size;

    if (!checkFileSize(size) || !checkFileValidation(type)) {
      alert("This format is not accepted and each file should be 2MB");
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const header = { 
        headers: { 
          'x-auth': localStorage.getItem('token'),
          "Content-Type": "multipart/form-data"
        } 
      };

      const uploadResponse = await axios.post(`${backendUrl}/api/uploadSingleFile`, formData, header);
      
      if (uploadResponse.data.status) {
        const saveResponse = await axios.post(
          `${backendUrl}/college/uploadTemplates`, 
          { 
            path: uploadResponse.data.data.Key,
            name: filename 
          },
          header
        );
        
        if (saveResponse.data.status) {
          fetchCollegeDocs();
          e.target.value = '';
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    }
  };

  const removeFile = async (e, id, path) => {
    try {
      const header = { 
        headers: { 
          'x-auth': localStorage.getItem('token'),
          "Content-Type": "multipart/form-data"
        } 
      };

      const deleteResponse = await axios.post(
        `${backendUrl}/api/deleteSingleFile`, 
        { key: path },
        header
      );

      if (deleteResponse.data.status) {
        await axios.post(`${backendUrl}/college/removeDocument`, { id }, header);
        fetchCollegeDocs();
      }
    } catch (error) {
      console.error('Error removing file:', error);
      alert('Error removing file');
    }
  };

  return (
    <>
      <section className="templates-page">
        <div className="templates-shell">
          <div className="templates-topbar">
            <div>
              <span className="templates-kicker">Template Center</span>
              <h1>Upload Templates</h1>
              <p>Store onboarding sheets and reference documents for your college in one place.</p>
            </div>
            <div className="templates-topbar-meta">
              <span>{collegeDocs.length} files</span>
              <span>XLSX / PDF / ZIP</span>
            </div>
          </div>

          <div className="templates-upload-panel">
            <div className="templates-upload-copy">
              <span className="templates-kicker">Upload</span>
              <h3>Add a new template</h3>
              <p>Supported formats are Excel, PDF, and ZIP. Each file should be 2MB or less.</p>
            </div>
            <label htmlFor="media-group" className="templates-upload-trigger">
              <FontAwesomeIcon icon={faPlus} />
              Choose File
            </label>
            <input
              id="media-group"
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".xlsx,.xls,.pdf,.zip"
            />
          </div>

          <div className="templates-documents-card">
            <div className="templates-card-head simple">
              <div>
                <span className="templates-kicker">Documents</span>
                <h3>Uploaded templates</h3>
              </div>
            </div>

            {loading ? (
              <div className="templates-empty-state small">Loading templates...</div>
            ) : collegeDocs && collegeDocs.length > 0 ? (
              <div className="templates-doc-list">
                {collegeDocs.map((doc) => (
                  <div key={doc._id} className="template-doc-row">
                    <a
                      href={`${bucketUrl}/${doc.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="template-doc-row-icon"
                    >
                      <FontAwesomeIcon icon={faFile} />
                    </a>
                    <div className="template-doc-row-content">
                      <div className="template-doc-row-name">{doc.name}</div>
                      <div className="template-doc-row-meta">Template file</div>
                    </div>
                    <button
                      type="button"
                      className="template-remove-btn"
                      title="Remove Document"
                      onClick={() => removeFile(null, doc._id, doc.path)}
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="templates-empty-state">
                <img
                  src="/Assets/images/icons/jd_one.png"
                  className="templates-empty-image"
                  alt="Upload"
                />
                <h4>No templates uploaded yet</h4>
                <p>Add your first document to keep onboarding material ready for your team.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .templates-page {
          --templates-primary: #fc2b5a;
          --templates-primary-dark: #a5003a;
          --templates-ink: #172033;
          --templates-muted: #667085;
          --templates-border: #e6eaf2;
          --templates-soft: #f8fafc;
        }

        .templates-shell {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .templates-topbar {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: end;
          padding: 6px 2px;
        }

        .templates-kicker {
          display: inline-block;
          margin-bottom: 6px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--templates-primary);
        }

        .templates-topbar h1 {
          margin: 0 0 6px;
          font-size: clamp(1.5rem, 2vw, 1.9rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--templates-ink);
        }

        .templates-topbar p {
          margin: 0;
          max-width: 680px;
          font-size: 0.92rem;
          line-height: 1.6;
          color: var(--templates-muted);
        }

        .templates-topbar-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .templates-topbar-meta span {
          padding: 9px 12px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid var(--templates-border);
          color: var(--templates-muted);
          font-size: 0.84rem;
          font-weight: 600;
        }

        .templates-upload-panel,
        .templates-documents-card {
          background: #fff;
          border: 1px solid var(--templates-border);
          border-radius: 18px;
          box-shadow: 0 10px 24px rgba(16, 24, 40, 0.05);
        }

        .templates-upload-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 20px 22px;
        }

        .templates-upload-copy h3,
        .templates-card-head h3 {
          margin: 0;
          font-size: 1.02rem;
          font-weight: 800;
          color: var(--templates-ink);
        }

        .templates-upload-copy p {
          margin: 6px 0 0;
          color: var(--templates-muted);
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .templates-documents-card {
          padding: 20px 22px;
        }

        .templates-card-head.simple {
          margin-bottom: 14px;
        }

        .templates-upload-trigger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgb(252, 43, 90) 0%, rgb(165, 0, 58) 100%);
          color: #fff;
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        .templates-upload-trigger:hover {
          transform: translateY(-1px);
          opacity: 0.96;
        }

        .templates-doc-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .template-doc-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border: 1px solid #edf1f7;
          border-radius: 14px;
          background: var(--templates-soft);
          transition: border-color 0.18s ease, background 0.18s ease;
        }

        .template-doc-row:hover {
          border-color: #ffd7e1;
          background: #fffafb;
        }

        .template-doc-row-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgb(252, 43, 90) 0%, rgb(165, 0, 58) 100%);
          color: #fff;
          font-size: 1rem;
          text-decoration: none;
        }

        .template-doc-row-content {
          min-width: 0;
          flex: 1;
        }

        .template-doc-row-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #344054;
          line-height: 1.45;
          word-break: break-word;
        }

        .template-doc-row-meta {
          margin-top: 2px;
          font-size: 0.78rem;
          color: var(--templates-muted);
        }

        .template-remove-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          background: #fff1f4;
          color: #d92d20;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.18s ease, background 0.18s ease;
        }

        .template-remove-btn:hover {
          transform: scale(1.04);
          background: #ffe4ea;
        }

        .templates-empty-state {
          min-height: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 1px dashed #d9e1ef;
          border-radius: 14px;
          background: var(--templates-soft);
          color: var(--templates-muted);
          padding: 24px;
        }

        .templates-empty-image {
          width: 62px;
          height: 62px;
          object-fit: contain;
          margin-bottom: 12px;
          opacity: 0.82;
        }

        .templates-empty-state h4 {
          margin: 0 0 6px;
          font-size: 0.96rem;
          font-weight: 800;
          color: var(--templates-ink);
        }

        .templates-empty-state p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.6;
          max-width: 360px;
        }

        .templates-empty-state.small {
          min-height: 120px;
        }

        @keyframes templatesFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 900px) {
          .templates-topbar,
          .templates-upload-panel,
          .templates-card-head.simple {
            flex-direction: column;
            align-items: stretch;
          }

          .templates-topbar-meta,
          .templates-upload-trigger {
            width: 100%;
          }

          .template-doc-row {
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
};

export default UploadTemplates;
