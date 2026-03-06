import React, { useState } from "react";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const INITIAL_TEMPLATES = [
  { name: "Today last webinar reminder on 22nd May", subject: "Don't Miss the Chance Our Exclusive Webinar is Happening Today!", status: "Published", visible: true },
  { name: "RECALL 1ST B2B2C PROBLEM SOLUTION TEMPLATE", subject: "Placement and Admissions improvement Plan for your College", status: "Published", visible: false },
  { name: "RECALL 1ST B2B SERVICE PROBLEM SOLUTION TEMPLATE", subject: "Cost reduction plan on Manpower for Industries", status: "Published", visible: false },
  { name: "RECALL 1ST B2B PROBLEM SOLUTION TEMPLATE", subject: "Cost reduction plan on Manpower for Industries", status: "Published", visible: false },
  { name: "Registration Email for last webinar on Hope of Energy & E-Waste", subject: "Registration Open! Join us for a Webinar on 22nd May 2024.", status: "Published", visible: false },
  { name: "B2B2C PROBLEM SOLUTION CAMPAIGN", subject: "Placement and Admissions improvement Plan for your College", status: "Published", visible: false },
  { name: "B2B Service Problem Solution Template", subject: "Cost reduction plan on Manpower for Industries", status: "Published", visible: false },
  { name: "B2B PROBLEM SOLUTION TEMPLATE", subject: "Cost reduction plan on Manpower for Industries", status: "Published", visible: false },
  { name: "Invitation mail for Model UN Dialogue contest", subject: "Invitation for Model UN Dialogue contest (Harit Umang Panasonic)", status: "Published", visible: false },
  { name: "Today reminder for webinar on Biodiversity at 3 May", subject: "Don't Miss the Chance Our Exclusive Webinar is Happening Today!", status: "Published", visible: true },
];

function EmailTemplate() {
  const [page, setPage] = useState("list");
  const [showModal, setShowModal] = useState(false);
  const [selectedBuilder, setSelectedBuilder] = useState("advanced");
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [editorContent, setEditorContent] = useState("");
  const [form, setForm] = useState({ name: "", subject: "" });

  const deleteTemplate = (index) => {
    if (window.confirm("Delete this template?")) {
      setTemplates((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const toggleVisibility = (index) => {
    setTemplates((prev) =>
      prev.map((t, i) => (i === index ? { ...t, visible: !t.visible } : t))
    );
  };

  const handleContinue = () => {
    setShowModal(false);
    setPage("new");
  };

  const handlePublish = () => {
    if (!form.name.trim() || !form.subject.trim()) {
      alert("Please fill in Template Name and Subject.");
      return;
    }
    setTemplates((prev) => [
      { name: form.name, subject: form.subject, status: "Published", visible: true },
      ...prev,
    ]);
    setForm({ name: "", subject: "" });
    setEditorContent("");
    setPage("list");
  };

  return (
    <>
      {page === "list" && (
        <>
          <div className="tabs-bar">
            <div className="tab active">Email Templates</div>
          </div>
          <div className="main">
            <div className="action-row">
              <button className="add-btn" onClick={() => setShowModal(true)}>
                + Add New Template
              </button>
               <div className="search-box">
                <input type="text" placeholder="Enter Template Name" />
                <button className="search-box-btn">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.868-3.833zM6.5 11A4.5 4.5 0 1 1 6.5 2a4.5 4.5 0 0 1 0 9z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Template Name</th><th>Subject</th><th>Status</th><th>Visibility</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t, i) => (
                    <tr key={i}>
                      <td>{t.name}</td>
                      <td className="subject-cell">{t.subject}</td>
                      <td><span className="status-badge">{t.status}</span></td>
                      <td>
                        <label className="toggle">
                          <input type="checkbox" checked={t.visible} onChange={() => toggleVisibility(i)} />
                          <span className="slider" />
                        </label>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="icon-btn" title="Edit">
                            <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                            </svg>
                          </button>
                          <button className="icon-btn" title="Delete" onClick={() => deleteTemplate(i)}>
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {page === "new" && (
        <>
          <div className="new-template-header">
            <button className="back-btn" onClick={() => setPage("list")}>← Back</button>
            <span className="page-title">Add New Email Template</span>
            <button className="save-draft-btn">Save As Draft</button>
          </div>
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Template Name <span className="req">*</span></label>
                <input className="form-input" type="text" placeholder="Enter Template Name"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Subject <span className="req">*</span></label>
                <input className="form-input" type="text" placeholder="Subject"
                  value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Variable</label>
                <select className="form-select">
                  <option>Select Variable</option>
                  <option>{"{{first_name}}"}</option>
                  <option>{"{{email}}"}</option>
                  <option>{"{{company}}"}</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Visible For</label>
              <div className="visible-for-wrap">
                <div className="tag">All Counselors <button className="tag-close">×</button></div>
                <input type="text" style={{ border: "none", outline: "none", fontSize: 13, flex: 1 }} />
              </div>
            </div>

            <div className="compose-label">Compose Email Template <span className="req">*</span></div>

            {/* ✅ CKEditor 5 using npm package */}
            <CKEditor
              editor={ClassicEditor}
              data={editorContent}
              config={{
                toolbar: [
                  "heading", "|",
                  "bold", "italic", "underline", "strikethrough", "|",
                  "link", "bulletedList", "numberedList", "|",
                  "blockQuote", "insertTable", "|",
                  "undo", "redo",
                ],
              }}
              onChange={(event, editor) => {
                setEditorContent(editor.getData());
              }}
            />

            <div className="attach-section">
              <div className="attach-label">Please attach any relevant Documents.</div>
              <button className="browse-btn">Browse</button>
            </div>

            <div className="form-footer">
              <button className="btn-publish" onClick={handlePublish}>PUBLISH</button>
              <button className="btn-test">TEST TEMPLATE</button>
            </div>
          </div>
        </>
      )}

       {showModal && ( 
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            <h2>Select Type of Template Builder</h2>
            <p className="modal-desc">To create a new template, please choose one of template builder from below options:</p>
            <div className="option-row">
              <label className={`option-card ${selectedBuilder === "advanced" ? "selected" : ""}`} onClick={() => setSelectedBuilder("advanced")}
                ><input type="checkbox" readOnly checked={selectedBuilder === "advanced"} />
                Advanced Template Builder
              </label>
              <label className={`option-card ${selectedBuilder === "basic" ? "selected" : ""}`} onClick={() => setSelectedBuilder("basic")}
                ><input type="checkbox" readOnly checked={selectedBuilder === "basic"} />
                Basic HTML Template Builder
              </label>
            </div>
            <hr className="divider" />
            <div className="feature-box">
              <h3>Drag &amp; Drop Email Template Builder</h3>
              <ul className="feature-list">
                <li>Drag and drop feature helps in creating different designs with minimum effort</li>
                <li>Best fit for creating attractive email templates</li>
                <li>Create professional and mobile responsive email templates fast</li>
                <li>Use tokens to add personalization to your emails</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-continue" onClick={handleContinue}>Continue</button>
            </div>
          </div>
        </div>
       )} 
      <style>
        {
          `
  :root {
    --orange: #E06B2C;
    --orange-light: #F4883A;
    --orange-pale: #FFF4ED;
    --bg: #F7F5F2;
    --surface: #FFFFFF;
    --border: #E8E3DC;
    --text: #1A1714;
    --text-muted: #7A746C;
    --dark: #1A1714;
  }

  .tabs-bar {
    background: var(--surface); border-bottom: 1px solid var(--border);
    padding: 0 24px; display: flex; align-items: center; gap: 4px;
  }
  .tab {
    padding: 14px 20px; font-size: 13px; font-weight: 500;
    color: var(--text-muted); cursor: pointer;
    border-bottom: 2px solid transparent; transition: all 0.15s;
  }
  .tab.active { color: var(--orange); border-bottom-color: var(--orange); }

  .main { padding: 28px; }
  .action-row {
    display: flex; justify-content: space-between;
    align-items: center; margin-bottom: 20px;
  }
  .search-box {
    display: flex; align-items: center;
    border: 1px solid var(--border); border-radius: 6px;
    background: var(--surface); overflow: hidden;
  }
  .search-box input {
    border: none; outline: none; padding: 8px 14px;
    font-size: 13px; font-family: inherit; width: 220px;
    color: var(--text); background: transparent;
  }
  .search-box input::placeholder { color: var(--text-muted); }
  .search-box-btn {
    background: var(--orange); border: none; padding: 8px 12px;
    cursor: pointer; color: #fff; display: flex; align-items: center;
  }
  .add-btn {
    background: var(--orange); color: #fff; border: none;
    padding: 9px 20px; border-radius: 6px; font-size: 13px;
    font-weight: 500; font-family: inherit; cursor: pointer;
    display: flex; align-items: center; gap: 6px; transition: background 0.15s;
  }
  .add-btn:hover { background: var(--orange-light); }

  .table-wrap {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; overflow: hidden;
  }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: var(--orange-pale); border-bottom: 1px solid var(--border); }
  th {
    text-align: left; padding: 12px 18px; font-size: 11px;
    font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--text-muted);
  }
  tbody tr { border-bottom: 1px solid var(--border); transition: background 0.1s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: var(--orange-pale); }
  td { padding: 14px 18px; font-size: 13px; color: var(--text); vertical-align: middle; }
  td.subject-cell { color: var(--text-muted); max-width: 340px; }
  .status-badge {
    background: var(--dark); color: #fff; font-size: 11px;
    font-weight: 600; padding: 4px 12px; border-radius: 4px;
    display: inline-block; letter-spacing: 0.04em;
  }

  .toggle { position: relative; display: inline-block; width: 36px; height: 20px; }
  .toggle input { display: none; }
  .slider {
    position: absolute; inset: 0; background: #ddd;
    border-radius: 20px; cursor: pointer; transition: 0.2s;
  }
  .slider::before {
    content: ''; position: absolute; width: 14px; height: 14px;
    background: #fff; border-radius: 50%; top: 3px; left: 3px; transition: 0.2s;
  }
  .toggle input:checked + .slider { background: var(--orange); }
  .toggle input:checked + .slider::before { transform: translateX(16px); }

  .actions-cell { display: flex; gap: 10px; align-items: center; }
  .icon-btn {
    background: none; border: none; cursor: pointer; color: var(--orange);
    padding: 4px; border-radius: 4px; transition: background 0.1s;
    display: flex; align-items: center;
  }
  .icon-btn:hover { background: var(--orange-pale); }

  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
    z-index: 100; display: flex; align-items: center; justify-content: center;
  }
  .modal {
    background: var(--surface); border-radius: 12px; width: 540px;
    padding: 32px; position: relative; animation: pop 0.2s ease;
  }
  @keyframes pop {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .modal h2 { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
  .modal-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
  .modal-close {
    position: absolute; top: 16px; right: 16px;
    background: none; border: none; cursor: pointer; font-size: 20px; color: var(--text-muted);
  }
  .option-row { display: flex; gap: 16px; margin-bottom: 24px; }
  .option-card {
    flex: 1; border: 2px solid var(--border); border-radius: 8px;
    padding: 14px; cursor: pointer; transition: border-color 0.15s;
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 500;
  }
  .option-card.selected { border-color: var(--orange); background: var(--orange-pale); }
  .option-card input[type=checkbox] { accent-color: var(--orange); width: 15px; height: 15px; }
  .divider { border: none; border-top: 1px solid var(--border); margin: 0 0 20px; }
  .feature-box h3 { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
  .feature-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .feature-list li {
    font-size: 13px; color: var(--text-muted);
    padding-left: 18px; position: relative;
  }
  .feature-list li::before {
    content: '•'; color: var(--orange);
    position: absolute; left: 0; font-size: 16px; line-height: 1;
  }
  .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 28px; }
  .btn-cancel {
    border: 1px solid var(--border); background: none;
    padding: 9px 20px; border-radius: 6px;
    font-size: 13px; font-family: inherit; cursor: pointer;
  }
  .btn-continue {
    background: var(--orange); color: #fff; border: none;
    padding: 9px 22px; border-radius: 6px;
    font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer;
  }
  .btn-continue:hover { background: var(--orange-light); }

  .new-template-header {
    background: var(--surface); border-bottom: 1px solid var(--border);
    padding: 14px 24px; display: flex; align-items: center; gap: 12px;
  }
  .back-btn {
    display: flex; align-items: center; gap: 6px;
    background: none; border: none; font-size: 13px; font-weight: 500;
    cursor: pointer; color: var(--text-muted); font-family: inherit;
  }
  .back-btn:hover { color: var(--text); }
  .page-title {
    font-size: 16px; font-weight: 600;
    border-left: 1px solid var(--border); padding-left: 12px;
  }
  .save-draft-btn {
    margin-left: auto; border: 1px solid var(--border); background: none;
    padding: 7px 16px; border-radius: 6px; font-size: 13px; font-family: inherit; cursor: pointer;
  }
  .form-section { padding: 28px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-label {
    font-size: 12px; font-weight: 600; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .req { color: var(--orange); }
  .form-input, .form-select {
    border: 1px solid var(--border); border-radius: 6px;
    padding: 9px 12px; font-size: 13px; font-family: inherit;
    outline: none; color: var(--text); background: var(--surface);
    transition: border-color 0.15s;
  }
  .form-input:focus, .form-select:focus { border-color: var(--orange); }
  .visible-for-wrap {
    border: 1px solid var(--border); border-radius: 6px;
    padding: 6px 10px; display: flex; align-items: center; gap: 8px;
    background: var(--surface);
  }
  .tag {
    background: var(--orange-pale); border: 1px solid #E8C9A8;
    color: var(--orange); border-radius: 4px; padding: 3px 8px;
    font-size: 12px; display: flex; align-items: center; gap: 5px;
  }
  .tag-close { background: none; border: none; cursor: pointer; color: var(--orange); font-size: 14px; line-height: 1; }

  .compose-label {
    font-size: 12px; font-weight: 600; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;
  }

  /* CKEditor 5 theme overrides */
  .ck-editor__editable {
    min-height: 220px !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 14px !important;
  }
  .ck.ck-toolbar {
    background: #fafafa !important;
    border-color: var(--border) !important;
    border-radius: 6px 6px 0 0 !important;
  }
  .ck.ck-editor__main > .ck-editor__editable {
    border-color: var(--border) !important;
    border-radius: 0 0 6px 6px !important;
  }
  .ck.ck-editor__main > .ck-editor__editable:focus {
    border-color: var(--orange) !important;
    box-shadow: none !important;
  }
  .ck.ck-button.ck-on,
  .ck.ck-button.ck-on:hover {
    background: var(--orange-pale) !important;
    color: var(--orange) !important;
  }
  .ck.ck-button:hover:not(.ck-disabled) {
    background: var(--orange-pale) !important;
  }

  .attach-section { margin-top: 24px; }
  .attach-label { font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
  .browse-btn {
    border: 1px solid var(--border); background: none;
    padding: 8px 18px; border-radius: 6px; font-size: 13px; font-family: inherit; cursor: pointer;
  }
  .form-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 28px; }
  .btn-test {
    background: var(--orange); color: #fff; border: none;
    padding: 10px 22px; border-radius: 6px; font-size: 13px;
    font-weight: 600; font-family: inherit; cursor: pointer; letter-spacing: 0.04em;
  }
  .btn-publish {
    border: 2px solid var(--orange); color: var(--orange); background: none;
    padding: 10px 22px; border-radius: 6px; font-size: 13px;
    font-weight: 600; font-family: inherit; cursor: pointer;
  }
            `
        }
      </style>
    </>
        
  );
} 
  export default EmailTemplate;