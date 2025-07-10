import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-8">
          <div className="card border-0 shadow-lg mb-5">
            <div className="card-header bg-gradient text-white text-center py-4" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
              <h1 className="display-4 mb-3">🔒 Privacy Policy</h1>
              <h4 className="fw-light">Focalyt Portal - Educational Management Platform</h4>
              <p className="mb-0 opacity-75">Protecting Educational Data & Student Privacy</p>
            </div>
          </div>

          {/* Introduction */}
          <div className="alert alert-primary border-0 shadow-sm mb-4">
            <div className="d-flex align-items-center">
              <span className="fs-2 me-3">📖</span>
              <div>
                <h5 className="alert-heading mb-2">Introduction</h5>
                <p className="mb-0">Focalyt Portal is a comprehensive educational management platform that enables educational institutes to manage courses, leads, students, training programs, and communication through integrated WhatsApp Business API. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational management platform.</p>
              </div>
            </div>
          </div>

          {/* Information We Collect */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h3 className="card-title mb-0">📊 1. Information We Collect</h3>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="card border-primary h-100">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">🏫 Educational Institute Information</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Institute name, address, and contact information</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Institute registration/accreditation details</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Authorized personnel information and credentials</li>
                        <li className="mb-2"><i className="bi bi-dot text-primary fs-4"></i>Banking and payment processing information</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card border-success h-100">
                    <div className="card-header bg-success text-white">
                      <h5 className="mb-0">📚 Course Management Data</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-dot text-success fs-4"></i>Course details (name, description, duration, fees)</li>
                        <li className="mb-2"><i className="bi bi-dot text-success fs-4"></i>Course materials, videos, documents, resources</li>
                        <li className="mb-2"><i className="bi bi-dot text-success fs-4"></i>Course schedules, batches, and capacity information</li>
                        <li className="mb-2"><i className="bi bi-dot text-success fs-4"></i>Instructor profiles and qualifications</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card border-warning h-100">
                    <div className="card-header bg-warning text-white">
                      <h5 className="mb-0">🎯 Lead Management Information</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-dot text-warning fs-4"></i>Lead contact information (name, phone, email)</li>
                        <li className="mb-2"><i className="bi bi-dot text-warning fs-4"></i>Source of inquiry and referral information</li>
                        <li className="mb-2"><i className="bi bi-dot text-warning fs-4"></i>Communication history and follow-up records</li>
                        <li className="mb-2"><i className="bi bi-dot text-warning fs-4"></i>Conversion tracking and enrollment decisions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card border-danger h-100">
                    <div className="card-header bg-danger text-white">
                      <h5 className="mb-0">👨‍🎓 Student Management Data</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-dot text-danger fs-4"></i>Personal information and emergency contacts</li>
                        <li className="mb-2"><i className="bi bi-dot text-danger fs-4"></i>Academic records and educational background</li>
                        <li className="mb-2"><i className="bi bi-dot text-danger fs-4"></i>Attendance records and participation tracking</li>
                        <li className="mb-2"><i className="bi bi-dot text-danger fs-4"></i>Assessment scores, grades, and progress reports</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card border-info h-100">
                    <div className="card-header bg-info text-white">
                      <h5 className="mb-0">📱 WhatsApp Integration Data</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-dot text-info fs-4"></i>Facebook Business account information</li>
                        <li className="mb-2"><i className="bi bi-dot text-info fs-4"></i>WhatsApp Business phone numbers</li>
                        <li className="mb-2"><i className="bi bi-dot text-info fs-4"></i>Message templates and delivery reports</li>
                        <li className="mb-2"><i className="bi bi-dot text-info fs-4"></i>Communication analytics and response rates</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card border-secondary h-100">
                    <div className="card-header bg-secondary text-white">
                      <h5 className="mb-0">🏃‍♂️ Training Management Information</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-dot text-secondary fs-4"></i>Training program details and curriculum</li>
                        <li className="mb-2"><i className="bi bi-dot text-secondary fs-4"></i>Session schedules and attendance</li>
                        <li className="mb-2"><i className="bi bi-dot text-secondary fs-4"></i>Certification and completion records</li>
                        <li className="mb-2"><i className="bi bi-dot text-secondary fs-4"></i>Skills assessment and competency tracking</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How We Use Information */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-success text-white">
              <h3 className="card-title mb-0">🎯 2. How We Use Your Information</h3>
            </div>
            <div className="card-body">
              <div className="accordion" id="usageAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header" id="coreEducationHeader">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#coreEducation">
                      🎓 Core Educational Management
                    </button>
                  </h2>
                  <div id="coreEducation" className="accordion-collapse collapse show" data-bs-parent="#usageAccordion">
                    <div className="accordion-body">
                      <div className="row">
                        <div className="col-md-6">
                          <h6 className="text-primary">📚 Course Management</h6>
                          <p className="small">Create, publish, and manage course catalogs and educational content</p>
                        </div>
                        <div className="col-md-6">
                          <h6 className="text-success">👨‍🎓 Student Lifecycle</h6>
                          <p className="small">Track student journey from inquiry to completion</p>
                        </div>
                        <div className="col-md-6">
                          <h6 className="text-info">📊 Academic Administration</h6>
                          <p className="small">Manage enrollments, schedules, assessments, and certifications</p>
                        </div>
                        <div className="col-md-6">
                          <h6 className="text-warning">💰 Financial Management</h6>
                          <p className="small">Process fee payments, generate invoices, and track financial records</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header" id="communicationHeader">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#communication">
                      📱 Communication and Engagement
                    </button>
                  </h2>
                  <div id="communication" className="accordion-collapse collapse" data-bs-parent="#usageAccordion">
                    <div className="accordion-body">
                      <div class="row g-3">
                        <div class="col-md-6">
                          <div class="p-3 bg-light rounded">
                            <h6 class="text-primary mb-2">🏫 Institutional Communication</h6>
                            <p class="small mb-0">Send course updates, schedules, and important announcements</p>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="p-3 bg-light rounded">
                            <h6 class="text-success mb-2">👨‍👩‍👧‍👦 Parent Engagement</h6>
                            <p class="small mb-0">Keep parents informed about student progress and activities</p>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="p-3 bg-light rounded">
                            <h6 class="text-danger mb-2">🚨 Emergency Notifications</h6>
                            <p class="small mb-0">Broadcast urgent information to students and parents</p>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="p-3 bg-light rounded">
                            <h6 class="text-info mb-2">📈 Marketing Communications</h6>
                            <p class="small mb-0">Promote new courses and educational programs (with consent)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header" id="improvementHeader">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#improvement">
                      🔧 Platform Improvement and Analytics
                    </button>
                  </h2>
                  <div id="improvement" className="accordion-collapse collapse" data-bs-parent="#usageAccordion">
                    <div className="accordion-body">
                      <ul class="list-group list-group-flush">
                        <li class="list-group-item border-0 px-0">
                          <strong>Performance Optimization:</strong> Analyze platform usage to improve user experience
                        </li>
                        <li class="list-group-item border-0 px-0">
                          <strong>Feature Development:</strong> Identify user needs and develop new functionalities
                        </li>
                        <li class="list-group-item border-0 px-0">
                          <strong>Security Enhancement:</strong> Monitor for threats and improve platform security
                        </li>
                        <li class="list-group-item border-0 px-0">
                          <strong>Compliance Monitoring:</strong> Ensure adherence to educational and data protection regulations
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Sharing */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-warning text-dark">
              <h3 className="card-title mb-0">🤝 3. Information Sharing and Disclosure</h3>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card border-success">
                    <div className="card-header bg-success text-white">
                      <h6 className="mb-0">✅ We Share With</h6>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Students and Parents (relevant academic info)</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Instructors and Staff (necessary for education)</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Facebook/Meta (for WhatsApp integration)</li>
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Government Authorities (compliance reporting)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card border-danger">
                    <div className="card-header bg-danger text-white">
                      <h6 className="mb-0">❌ We Do NOT Share</h6>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled">
                        <li className="mb-2"><i className="bi bi-x-circle-fill text-danger me-2"></i>Sell personal information to third parties</li>
                        <li className="mb-2"><i className="bi bi-x-circle-fill text-danger me-2"></i>Share academic records without authorization</li>
                        <li className="mb-2"><i className="bi bi-x-circle-fill text-danger me-2"></i>Use educational data for non-educational ads</li>
                        <li className="mb-2"><i className="bi bi-x-circle-fill text-danger me-2"></i>Cross-share data between different institutes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Security */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-danger text-white">
              <h3 className="card-title mb-0">🔐 4. Data Security and Protection</h3>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-lg-4">
                  <div className="text-center p-4 bg-light rounded">
                    <div className="fs-1 text-primary mb-3">🛡️</div>
                    <h5 className="text-primary">Technical Safeguards</h5>
                    <ul className="list-unstyled small">
                      <li>Industry-standard encryption</li>
                      <li>Multi-factor authentication</li>
                      <li>Secure communication channels</li>
                      <li>Regular security assessments</li>
                    </ul>
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="text-center p-4 bg-light rounded">
                    <div className="fs-1 text-success mb-3">🎓</div>
                    <h5 className="text-success">Educational Data Protection</h5>
                    <ul className="list-unstyled small">
                      <li>FERPA compliance</li>
                      <li>Academic confidentiality</li>
                      <li>Parental controls</li>
                      <li>Staff training programs</li>
                    </ul>
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="text-center p-4 bg-light rounded">
                    <div className="fs-1 text-warning mb-3">🔧</div>
                    <h5 className="text-warning">Platform Security</h5>
                    <ul className="list-unstyled small">
                      <li>Secure development practices</li>
                      <li>24/7 monitoring</li>
                      <li>Incident response procedures</li>
                      <li>Data minimization principles</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h3 className="card-title mb-0">⚖️ 5. Your Rights and Controls</h3>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="card border-primary h-100">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">👨‍🎓 Student & Parent Rights</h6>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled small">
                        <li className="mb-2">📖 <strong>Access Rights:</strong> View and download academic information</li>
                        <li className="mb-2">✏️ <strong>Correction Rights:</strong> Update incorrect information</li>
                        <li className="mb-2">🗑️ <strong>Deletion Rights:</strong> Request data removal</li>
                        <li className="mb-2">📱 <strong>Communication Preferences:</strong> Control message settings</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card border-success h-100">
                    <div className="card-header bg-success text-white">
                      <h6 className="mb-0">🏫 Institute Controls</h6>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled small">
                        <li className="mb-2">👥 <strong>User Management:</strong> Add, remove staff access</li>
                        <li className="mb-2">🔒 <strong>Access Controls:</strong> Role-based permissions</li>
                        <li className="mb-2">📱 <strong>Communication Settings:</strong> WhatsApp integration management</li>
                        <li className="mb-2">📊 <strong>Audit Logs:</strong> Comprehensive access tracking</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card border-info h-100">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0">🎯 Lead & Prospect Rights</h6>
                    </div>
                    <div className="card-body">
                      <ul className="list-unstyled small">
                        <li className="mb-2">🚫 <strong>Opt-out Rights:</strong> Unsubscribe from marketing</li>
                        <li className="mb-2">✏️ <strong>Data Correction:</strong> Update contact information</li>
                        <li className="mb-2">📞 <strong>Inquiry History:</strong> Access communication records</li>
                        <li className="mb-2">🗑️ <strong>Deletion Requests:</strong> Remove from lead system</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Children's Privacy */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h3 className="card-title mb-0">👶 6. Children's Privacy and Parental Consent</h3>
            </div>
            <div className="card-body">
              <div className="alert alert-warning border-0">
                <div className="d-flex align-items-center">
                  <span className="fs-2 me-3">👨‍👩‍👧‍👦</span>
                  <div>
                    <h5 className="alert-heading">Minor Student Protection</h5>
                    <p className="mb-0">Special protections for students under 18 years of age with required parental consent, limited data collection, parental access rights, and strict educational purpose limitations.</p>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 border rounded">
                    <h6 className="text-primary">🔒 Protection Measures</h6>
                    <ul className="small mb-0">
                      <li>Parental consent required for students under 18</li>
                      <li>Age-appropriate data collection practices</li>
                      <li>Educational purpose limitation</li>
                    </ul>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 border rounded">
                    <h6 className="text-success">👨‍👩‍👧‍👦 Parental Rights</h6>
                    <ul className="small mb-0">
                      <li>Review and modify child's information</li>
                      <li>Request data deletion</li>
                      <li>Access educational records</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FERPA Compliance */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-success text-white">
              <h3 className="card-title mb-0">📜 7. Educational Data Specific Disclosures</h3>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="alert alert-success border-0">
                    <h5 className="alert-heading">🇺🇸 FERPA Compliance Statement</h5>
                    <p className="mb-0">For US-based educational institutions, we comply with the Family Educational Rights and Privacy Act (FERPA) and act as a school official with legitimate educational interests in student data.</p>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="alert alert-info border-0">
                    <h5 className="alert-heading">🎓 Educational Purpose Limitation</h5>
                    <p className="mb-0">All data processing is strictly limited to legitimate educational purposes including academic instruction, student support, institutional administration, and educational research.</p>
                  </div>
                </div>
              </div>

              <div className="card border-warning">
                <div className="card-header bg-warning">
                  <h6 className="mb-0">📋 Directory Information</h6>
                </div>
                <div className="card-body">
                  <p className="small mb-0">Institutes can designate certain information as directory information, which may be disclosed without consent unless a student/parent opts out. Examples include name, address, phone number, email, date of birth, major field of study, participation in activities, and degrees received.</p>
                </div>
              </div>
            </div>
          </div>

       

          {/* Footer */}
          <div className="text-center mb-5">
            <div className="card border-0 bg-light">
              <div className="card-body">
                <p className="mb-2"><strong>Last Updated:</strong> 10th July 2025</p>
                <p className="mb-2">This Privacy Policy governs your use of Focalyt Portal's comprehensive educational management platform including course management, lead management, student management, training management, and integrated WhatsApp Business communication services.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;