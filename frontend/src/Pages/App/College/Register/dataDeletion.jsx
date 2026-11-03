import React from 'react';

// Production crawlers (Meta) are served the static copy at public/data-deletion.html.
// Keep that file in sync when this page's text or layout changes.
const DataDeletion = () => {
  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-8">
          <div className="card border-0 shadow-lg mb-5">
            <div className="card-header text-white text-center py-4" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
              <h1 className="h2 mb-3">User Data Deletion Instructions</h1>
              <p className="mb-1">Focalyt CRM Lead Integration</p>
              <p className="mb-0 opacity-75">How to request deletion of personal data collected through Facebook and Instagram Lead Ads and stored in Focalyt CRM</p>
            </div>
          </div>

          <div className="alert alert-primary border-0 shadow-sm mb-4">
            <div className="d-flex align-items-center">
              <span className="fs-2 me-3">📖</span>
              <div>
                <h2 className="alert-heading h5 mb-2">Overview</h2>
                <p className="mb-0">This page explains how you can ask <strong>Focal Skill Development Pvt. Ltd.</strong> (Focalyt) to delete personal data that the Meta application <strong>Focalyt CRM Lead Integration</strong> stored in Focalyt CRM after you submitted a Facebook or Instagram Lead Ad form. Deletion requests are handled by email to <a href="mailto:info@focalyt.com">info@focalyt.com</a>. There is no in-app or self-service delete option, and opening this page does not delete a record.</p>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h2 className="card-title h3 mb-0">📊 1. Data This Request Can Cover</h2>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card border-primary h-100">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">📱 Meta Lead Ads</h5>
                    </div>
                    <div className="card-body">
                      <p className="small">Personal information Focalyt CRM Lead Integration stores from a connected Lead Ad form:</p>
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Name</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Mobile number</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Email address, when the form included one</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>WhatsApp number, or the mobile number when the form had no separate WhatsApp answer</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Gender, only when the answer was male or female</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Lead ID, Page ID, Form ID, and, when Meta sent them, Ad ID and submission time</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border-success h-100">
                    <div className="card-header bg-success text-white">
                      <h5 className="mb-0">🗂️ Focalyt CRM</h5>
                    </div>
                    <div className="card-body">
                      <p className="small">Matching records in Focalyt CRM created from that lead, which may include:</p>
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-dot text-success fs-4"></i>Contact details and inquiry information</li>
                        <li className="mb-2"><i className="bi bi-dot text-success fs-4"></i>Follow-up notes and communication history</li>
                        <li className="mb-2"><i className="bi bi-dot text-success fs-4"></i>Course or program interest recorded by the institute</li>
                        <li className="mb-2"><i className="bi bi-dot text-success fs-4"></i>Source information showing the lead came from Meta Lead Ads</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-success text-white">
              <h2 className="card-title h3 mb-0">✉️ 2. How to Request Deletion by Email</h2>
            </div>
            <div className="card-body">
              <p>To request deletion of your personal data, send an email to <a href="mailto:info@focalyt.com"><strong>info@focalyt.com</strong></a> with the subject line <strong>User Data Deletion Request</strong>.</p>
              <p>Please include as many of the following details as you can so we can locate the correct records:</p>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded h-100">
                    <h6 className="text-primary mb-2">Needed to find the record</h6>
                    <ul className="small mb-0">
                      <li>Full name</li>
                      <li>Mobile number used on the lead form</li>
                      <li>A clear statement that you want your personal data deleted</li>
                      <li>Email address, if the form included one</li>
                    </ul>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded h-100">
                    <h6 className="text-success mb-2">Helpful if you have them</h6>
                    <ul className="small mb-0">
                      <li>Approximate date you submitted the Meta Lead Ad form</li>
                      <li>Institute, course, or campaign name</li>
                      <li>Facebook or Instagram profile name used when submitting the form</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="mt-3 mb-0 small">You may copy this template:</p>
              <div className="alert alert-secondary mt-2 mb-0">
                <p className="small mb-1"><strong>To:</strong> info@focalyt.com</p>
                <p className="small mb-1"><strong>Subject:</strong> User Data Deletion Request</p>
                <p className="small mb-0">I request deletion of my personal data collected through Focalyt CRM Lead Integration and stored in Focalyt CRM. My name is [your name], mobile [your mobile], email [your email, if you provided one]. I submitted a Facebook or Instagram lead form on or around [date], for [institute, course, or job if known].</p>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-warning text-dark">
              <h2 className="card-title h3 mb-0">🛠️ 3. How Focalyt Processes Your Request</h2>
            </div>
            <div className="card-body">
              <div className="alert alert-warning border-0 mb-3">
                <strong>No self-service deletion.</strong> Focalyt CRM does not currently provide a “Delete Lead” button for users or institutes. We do not automatically delete existing leads when this page is visited, when you submit a Meta form, or when you send an email.
              </div>
              <ol className="mb-0">
                <li className="mb-2">We acknowledge your email and verify that we can identify the matching records.</li>
                <li className="mb-2">A Focalyt team member reviews the Focalyt CRM record and the stored Lead Ads identifiers associated with the details you provided. The educational institute does not complete this request through a self-service control.</li>
                <li className="mb-2">If the request is verified, Focalyt manually removes or de-identifies the matching personal data held in Focalyt CRM. There is no automatic deletion.</li>
                <li className="mb-0">We reply by email to confirm the outcome of the request.</li>
              </ol>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="card-title h3 mb-0">⏱️ 4. Timeframe and Scope</h2>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="p-3 border rounded h-100">
                    <h6 className="text-primary">Response time</h6>
                    <p className="small mb-0">We aim to acknowledge your request within 7 days and complete a verified request within 30 days of receiving the information we need to locate your records.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 border rounded h-100">
                    <h6 className="text-success">What this does not change automatically</h6>
                    <p className="small mb-0">Deleting Focalyt CRM information does not delete information Meta stores independently. To manage data held by Meta, use Facebook or Instagram settings and Meta’s own tools in addition to contacting Focalyt.</p>
                  </div>
                </div>
              </div>
              <p className="small mt-3 mb-0">We may retain limited information if we are required to do so by law (for example, to keep a record that a deletion request was received and processed). We will tell you if we cannot locate a matching record.</p>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-danger text-white">
              <h2 className="card-title h3 mb-0">🔐 5. Identity Verification</h2>
            </div>
            <div className="card-body">
              <p className="mb-0">To protect other people’s data, we only process a deletion request after we can reasonably match it to records we hold. We may ask you to confirm a phone number or email already associated with the lead. We will not delete records based on incomplete or unmatched requests.</p>
            </div>
          </div>

          <div className="text-center mb-5">
            <div className="card border-0 bg-light">
              <div className="card-body">
                <p className="mb-2"><strong>Legal Company:</strong> Focal Skill Development Pvt. Ltd.</p>
                <p className="mb-2"><strong>Contact:</strong> <a href="mailto:info@focalyt.com">info@focalyt.com</a></p>
                <p className="mb-2"><strong>Related policy:</strong> <a href="https://focalyt.com/privacy-policy">Privacy Policy</a></p>
                <p className="mb-2"><strong>Last Updated:</strong> 2nd November 2026</p>
                <p className="mb-0">These instructions apply to personal data Focalyt CRM Lead Integration stores in Focalyt CRM. They do not create a self-service delete function, and they do not delete Meta’s independently retained copy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDeletion;
