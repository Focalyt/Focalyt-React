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
              <h1 className="display-4 mb-3">🗑️ User Data Deletion Instructions</h1>
              <h4 className="fw-light">Focalyt Portal - Educational Management Platform</h4>
              <p className="mb-0 opacity-75">How to request deletion of personal data collected through Meta Lead Ads and Focalyt CRM</p>
            </div>
          </div>

          <div className="alert alert-primary border-0 shadow-sm mb-4">
            <div className="d-flex align-items-center">
              <span className="fs-2 me-3">📖</span>
              <div>
                <h5 className="alert-heading mb-2">Overview</h5>
                <p className="mb-0">This page explains how you can request deletion of personal data that Focalyt collected when you submitted a Meta (Facebook or Instagram) Lead Ad form, or that is stored in Focalyt CRM. Deletion requests are handled by email. There is currently no in-app or self-service “Delete Lead” option in Focalyt CRM.</p>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h3 className="card-title mb-0">📊 1. Data This Request Can Cover</h3>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card border-primary h-100">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">📱 Meta Lead Ads</h5>
                    </div>
                    <div className="card-body">
                      <p className="small">Personal information you submitted on a Focalyt or partner institute Lead Ad form, which may include:</p>
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Name</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Phone number</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Email address</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>City or other form fields you provided</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Lead form, campaign, and related Meta identifiers stored with the lead</li>
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
              <h3 className="card-title mb-0">✉️ 2. How to Request Deletion by Email</h3>
            </div>
            <div className="card-body">
              <p>To request deletion of your personal data, send an email to <a href="mailto:info@focalyt.com"><strong>info@focalyt.com</strong></a> with the subject line <strong>User Data Deletion Request</strong>.</p>
              <p>Please include as many of the following details as you can so we can locate the correct records:</p>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded h-100">
                    <h6 className="text-primary mb-2">Required</h6>
                    <ul className="small mb-0">
                      <li>Full name</li>
                      <li>Phone number used on the lead form</li>
                      <li>Email address used on the lead form</li>
                      <li>A clear statement that you want your personal data deleted</li>
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
                <p className="small mb-0">I request deletion of my personal data collected through Meta Lead Ads and stored in Focalyt CRM. My name is [your name], phone [your phone], email [your email]. I submitted a lead form on or around [date], for [institute or course if known].</p>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-warning text-dark">
              <h3 className="card-title mb-0">🛠️ 3. How Focalyt Processes Your Request</h3>
            </div>
            <div className="card-body">
              <div className="alert alert-warning border-0 mb-3">
                <strong>No self-service deletion.</strong> Focalyt CRM does not currently provide a “Delete Lead” button for users or institutes. We do not automatically delete existing leads when this page is visited, when you submit a Meta form, or when you send an email.
              </div>
              <ol className="mb-0">
                <li className="mb-2">We acknowledge your email and verify that we can identify the matching records.</li>
                <li className="mb-2">A Focalyt team member reviews Meta Lead Ads and CRM records associated with the details you provided.</li>
                <li className="mb-2">If the request is verified, we manually remove or de-identify the personal data we hold for that request, using our internal data-handling process.</li>
                <li className="mb-0">We reply by email to confirm the outcome of the request.</li>
              </ol>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h3 className="card-title mb-0">⏱️ 4. Timeframe and Scope</h3>
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
                    <p className="small mb-0">This process does not change Meta’s own copies of your lead form data. To manage data held by Meta, use Facebook or Instagram settings and Meta’s tools in addition to contacting Focalyt.</p>
                  </div>
                </div>
              </div>
              <p className="small mt-3 mb-0">We may retain limited information if we are required to do so by law (for example, to keep a record that a deletion request was received and processed). We will tell you if we cannot locate a matching record.</p>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-danger text-white">
              <h3 className="card-title mb-0">🔐 5. Identity Verification</h3>
            </div>
            <div className="card-body">
              <p className="mb-0">To protect other people’s data, we only process a deletion request after we can reasonably match it to records we hold. We may ask you to confirm a phone number or email already associated with the lead. We will not delete records based on incomplete or unmatched requests.</p>
            </div>
          </div>

          <div className="text-center mb-5">
            <div className="card border-0 bg-light">
              <div className="card-body">
                <p className="mb-2"><strong>Contact:</strong> <a href="mailto:info@focalyt.com">info@focalyt.com</a></p>
                <p className="mb-2"><strong>Related policy:</strong> <a href="/privacy-policy">Privacy Policy</a></p>
                <p className="mb-2"><strong>Last Updated:</strong> 27th October 2026</p>
                <p className="mb-0">These instructions apply to personal data Focalyt collects through Meta Lead Ads and stores in Focalyt CRM. They do not create a self-service delete function in the product.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDeletion;
