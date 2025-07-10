import React from 'react';

const TermsOfService = () => {
  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-8">
          <div className="card border-0 shadow-lg mb-5">
            <div className="card-header bg-primary text-white text-center py-4">
              <h1 className="display-4 mb-3">📋 Terms of Service</h1>
              <h4 className="fw-light">Focalyt Portal - Complete Educational Management Platform</h4>
              <div className="row mt-3">
                <div className="col-6 col-md-3">
                  <div className="badge bg-light text-primary fs-6 p-2 mb-2">📚 Course Management</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="badge bg-light text-primary fs-6 p-2 mb-2">🎯 Lead Management</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="badge bg-light text-primary fs-6 p-2 mb-2">👨‍🎓 Student Management</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="badge bg-light text-primary fs-6 p-2 mb-2">📱 WhatsApp Integration</div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Overview */}
          <div className="alert alert-info border-0 shadow-sm mb-4">
            <div className="d-flex align-items-center">
              <span className="fs-2 me-3">🎓</span>
              <div>
                <h5 className="alert-heading mb-2">About Focalyt Portal</h5>
                <p className="mb-0">Focalyt Portal is a comprehensive educational management ecosystem that empowers educational institutes to manage their complete operations including course publishing, lead tracking, student lifecycle management, training programs, and integrated WhatsApp Business communication - all from a single, powerful platform.</p>
              </div>
            </div>
          </div>

          {/* Core Services */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h3 className="card-title mb-0">📋 1. Platform Services and Usage</h3>
            </div>
            <div className="card-body">
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="card h-100 border-primary">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">📚 Course Management</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Create and publish course catalogs</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Manage curriculum and learning materials</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Set pricing and enrollment criteria</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Track course performance metrics</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card h-100 border-success">
                    <div className="card-header bg-success text-white">
                      <h5 className="mb-0">🎯 Lead Management</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Capture and track prospective students</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Automated lead nurturing workflows</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Conversion tracking and analytics</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Multi-channel inquiry management</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card h-100 border-info">
                    <div className="card-header bg-info text-white">
                      <h5 className="mb-0">👨‍🎓 Student Management</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Complete student lifecycle tracking</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Academic progress monitoring</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Attendance and assessment management</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Fee management and payment tracking</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card h-100 border-warning">
                    <div className="card-header bg-warning text-white">
                      <h5 className="mb-0">🏃‍♂️ Training Management</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Professional training program delivery</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Skills assessment and certification</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Trainer scheduling and management</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Corporate training solutions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="alert alert-primary border-0">
                <div className="d-flex align-items-center">
                  <span className="fs-2 me-3">📱</span>
                  <div>
                    <h5 className="alert-heading mb-2">Integrated WhatsApp Business Communication</h5>
                    <p className="mb-0">Our platform seamlessly integrates with Facebook Business Manager and WhatsApp Business API to provide professional, verified communication channels for all your educational needs - from lead nurturing to student engagement and parent updates.</p>
                  </div>
                </div>
              </div>

              <ol className="mt-4">
                <li className="mb-3">The Focalyt Portal Platform (including web applications, mobile apps, and all integrated services) is provided by Focalyt Inc. Through the platform, educational institutes with verified accounts can access our comprehensive suite of educational management services.</li>
                <li className="mb-3">An Institute accessing the Focalyt Portal Platform agrees to be bound by these Terms of Service and all other rules, regulations, and terms of use related to our educational management services.</li>
                <li className="mb-3"><span className="badge bg-danger">Important</span> <strong>Service Modifications:</strong> Focalyt Portal reserves the right to modify, update, or discontinue any part of our services with appropriate notice to ensure continued platform improvement and compliance with educational standards.</li>
              </ol>
            </div>
          </div>

          {/* WhatsApp Integration */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-danger text-white">
              <h3 className="card-title mb-0">📱 2. WhatsApp Business Integration and Communication</h3>
            </div>
            <div className="card-body">
              <div className="alert alert-warning border-0 mb-4">
                <div className="d-flex align-items-start">
                  <span className="fs-2 me-3">🔗</span>
                  <div>
                    <h5 className="alert-heading">Facebook Business Manager Integration</h5>
                    <p className="mb-0"><span className="badge bg-danger">Critical Requirement</span> To use our WhatsApp Business communication features, institutes must have a verified Facebook Business Manager account and comply with all Facebook Platform Terms and WhatsApp Business API policies.</p>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-6">
                  <h5 className="text-primary">📞 Communication Services</h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item border-0 px-0">
                      <i className="bi bi-arrow-right-circle text-primary me-2"></i>
                      Automated lead nurturing and follow-up messages
                    </li>
                    <li className="list-group-item border-0 px-0">
                      <i className="bi bi-arrow-right-circle text-primary me-2"></i>
                      Student enrollment confirmations and course updates
                    </li>
                    <li className="list-group-item border-0 px-0">
                      <i className="bi bi-arrow-right-circle text-primary me-2"></i>
                      Attendance alerts and academic notifications
                    </li>
                    <li className="list-group-item border-0 px-0">
                      <i className="bi bi-arrow-right-circle text-primary me-2"></i>
                      Parent updates and institutional communications
                    </li>
                    <li className="list-group-item border-0 px-0">
                      <i className="bi bi-arrow-right-circle text-primary me-2"></i>
                      Fee reminders and payment confirmations
                    </li>
                  </ul>
                </div>

                <div className="col-lg-6">
                  <h5 className="text-success">✅ Compliance Requirements</h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item border-0 px-0">
                      <i className="bi bi-shield-check text-success me-2"></i>
                      WhatsApp Business API policies and guidelines
                    </li>
                    <li className="list-group-item border-0 px-0">
                      <i className="bi bi-shield-check text-success me-2"></i>
                      Facebook Platform Terms of Service
                    </li>
                    <li className="list-group-item border-0 px-0">
                      <i className="bi bi-shield-check text-success me-2"></i>
                      Educational communication standards and ethics
                    </li>
                    <li className="list-group-item border-0 px-0">
                      <i className="bi bi-shield-check text-success me-2"></i>
                      Data protection and privacy regulations
                    </li>
                    <li className="list-group-item border-0 px-0">
                      <i className="bi bi-shield-check text-success me-2"></i>
                      Consent and opt-in/opt-out requirements
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h3 className="card-title mb-0">🔒 3. Data Management and Privacy</h3>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card border-info h-100">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">📊 Data Processing</h6>
                    </div>
                    <div className="card-body">
                      <p>Our platform processes extensive educational data including student records, academic performance, financial information, communication logs, and institutional analytics.</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card border-success h-100">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">🛡️ Privacy Compliance</h6>
                    </div>
                    <div className="card-body">
                      <p>Full compliance with FERPA, local educational privacy laws, GDPR, and institutional privacy policies and procedures.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institute Responsibilities */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-warning text-dark">
              <h3 className="card-title mb-0">⚠️ 4. Institute Responsibilities and Conduct</h3>
            </div>
            <div className="card-body">
              <div className="accordion" id="responsibilitiesAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header" id="accurateInfoHeader">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#accurateInfo">
                      📝 Accurate Information Requirements
                    </button>
                  </h2>
                  <div id="accurateInfo" className="accordion-collapse collapse show" data-bs-parent="#responsibilitiesAccordion">
                    <div className="accordion-body">
                      <ul>
                        <li>Institutional accreditation and registration details</li>
                        <li>Course content, pricing, and enrollment information</li>
                        <li>Student records and academic data</li>
                        <li>Contact information and communication preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header" id="prohibitedHeader">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#prohibited">
                      🚫 Prohibited Activities
                    </button>
                  </h2>
                  <div id="prohibited" className="accordion-collapse collapse" data-bs-parent="#responsibilitiesAccordion">
                    <div className="accordion-body">
                      <div className="row">
                        <div className="col-md-6">
                          <ul className="text-danger">
                            <li>Fraudulent or misleading educational claims</li>
                            <li>Unauthorized commercial activities</li>
                            <li>Violation of student privacy laws</li>
                          </ul>
                        </div>
                        <div className="col-md-6">
                          <ul className="text-danger">
                            <li>Discrimination or harassment</li>
                            <li>Sharing false or harmful content</li>
                            <li>Circumventing platform security</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          

          {/* Footer */}
          <div className="text-center mb-5">
            <div className="card border-0 bg-light">
              <div className="card-body">
                <p className="mb-2"><strong>Last Updated:</strong> 10th July 2025</p>
                <p className="mb-2">These Terms of Service govern your use of Focalyt Portal's comprehensive educational management platform including course management, lead management, student management, training management, and integrated WhatsApp Business communication services.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;