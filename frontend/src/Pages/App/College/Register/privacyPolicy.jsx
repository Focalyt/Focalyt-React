import React from 'react';

// Production crawlers (Meta) are served the static copy at public/privacy-policy.html.
// Keep that file in sync when this page's text or layout changes.
const PrivacyPolicy = () => {
  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-8">
          <div className="card border-0 shadow-lg mb-5">
            <div className="card-header bg-white text-dark text-center py-4">
              <h1 className="h2 mb-3">Privacy Policy – Focalyt Portal &amp; Focalyt CRM Lead Integration</h1>
              <p className="mb-1">Focalyt Portal – Educational Management Platform</p>
              <p className="mb-0">Protecting Educational Data &amp; Student Privacy</p>
              <p className="mb-0 mt-2"><strong>Last Updated:</strong> 2nd November 2026</p>
            </div>
          </div>

          {/* Introduction */}
          <div className="alert alert-primary border-0 shadow-sm mb-4">
            <div className="d-flex align-items-center">
              <span className="fs-2 me-3">📖</span>
              <div>
                <h2 className="alert-heading h5 mb-2">Introduction</h2>
                <p>This Privacy Policy applies to the Focalyt educational management platform and to our Meta application <strong>Focalyt CRM Lead Integration</strong>.</p>
                <ul className="mb-3">
                  <li><strong>Meta App Name:</strong> Focalyt CRM Lead Integration</li>
                  <li><strong>Operated By:</strong> Focal Skill Development Pvt. Ltd. (Focalyt)</li>
                  <li><strong>CRM Platform:</strong> Focalyt CRM</li>
                  <li><strong>Integration:</strong> Facebook and Instagram Lead Ads</li>
                  <li><strong>Website:</strong> <a href="https://focalyt.com">https://focalyt.com</a></li>
                </ul>
                <p className="mb-0">Focalyt Portal enables educational institutes to manage courses, leads, students, training programs, and communication, including WhatsApp Business messaging. Focalyt CRM Lead Integration receives Facebook and Instagram Lead Ads submissions and stores them in Focalyt CRM for the educational institute that connected the Facebook Page and mapped the form. This policy explains how we collect, use, disclose, and safeguard information for both.</p>
              </div>
            </div>
          </div>

          {/* Information We Collect */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h2 className="card-title h3 mb-0">📊 1. Information We Collect</h2>
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
              <p className="mb-0 mt-4">Facebook and Instagram Lead Ads information collected by <strong>Focalyt CRM Lead Integration</strong> is described in Section 8. That section lists the identifiers and form answers the application actually stores.</p>
            </div>
          </div>

          {/* How We Use Information */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-success text-white">
              <h2 className="card-title h3 mb-0">🎯 2. How We Use Your Information</h2>
            </div>
            <div className="card-body">
              <p>Lead Ads information is used for enquiry management, counselling, admissions-related follow-up, and communication about the mapped course or job. Other platform uses are described below.</p>
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
              <h2 className="card-title h3 mb-0">🤝 3. Information Sharing and Disclosure</h2>
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
                        <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Meta, when institute staff send a WhatsApp Business message. Lead Ads intake itself is Meta sending the lead to Focalyt, which is described in Section 8.</li>
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
              <p className="mt-4 mb-0">For <strong>Focalyt CRM Lead Integration</strong>, Meta provides the lead to Focalyt. Focal Skill Development Pvt. Ltd. stores it in Focalyt CRM. Authorized staff of the mapped educational institute can access that institute’s record. Focalyt does not sell personal information. The Lead Ads retrieval and save process does not send those personal details to an additional marketing or data-broker service. Meta continues to handle its own copy under <a href="https://www.facebook.com/privacy/policy">Meta’s Privacy Policy</a>.</p>
            </div>
          </div>

          {/* Data Security */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-danger text-white">
              <h2 className="card-title h3 mb-0">🔐 4. Data Security and Protection</h2>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-lg-4">
                  <div className="text-center p-4 bg-light rounded">
                    <div className="fs-1 text-primary mb-3">🛡️</div>
                    <h5 className="text-primary">Technical Safeguards</h5>
                    <ul className="list-unstyled small">
                      <li>This website is served over HTTPS</li>
                      <li>Stored passwords are kept as one-way hashes</li>
                      <li>Focalyt CRM requires an account sign-in</li>
                      <li>Some accounts can sign in with a one-time password instead of a password. That option is not a required second factor on every login.</li>
                    </ul>
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="text-center p-4 bg-light rounded">
                    <div className="fs-1 text-success mb-3">🎓</div>
                    <h5 className="text-success">Educational Data Protection</h5>
                    <ul className="list-unstyled small">
                      <li>Educational-purpose limits described in Section 7</li>
                      <li>Academic information is used for institute administration and student support</li>
                      <li>Parent access and deletion requests are handled through the contact details in this policy</li>
                      <li>CRM access is limited to authorized accounts</li>
                    </ul>
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="text-center p-4 bg-light rounded">
                    <div className="fs-1 text-warning mb-3">🔧</div>
                    <h5 className="text-warning">Platform Security</h5>
                    <ul className="list-unstyled small">
                      <li>Lead Ads storage is limited to the fields listed in Section 8</li>
                      <li>Security incidents are reviewed when they are reported to us</li>
                      <li>CRM records are available to users according to their institute role</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="card-title h3 mb-0">⚖️ 5. Your Rights and Controls</h2>
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
                        <li className="mb-2">📊 <strong>Account access:</strong> Limited to users the institute authorizes in Focalyt CRM</li>
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
              <h2 className="card-title h3 mb-0">👶 6. Children's Privacy and Parental Consent</h2>
            </div>
            <div className="card-body">
              <div className="alert alert-warning border-0">
                <div className="d-flex align-items-center">
                  <span className="fs-2 me-3">👨‍👩‍👧‍👦</span>
                  <div>
                    <h5 className="alert-heading">Minor Student Protection</h5>
                    <p className="mb-0">Where applicable law requires parental consent before an educational institute collects information about a student under 18, that institute is responsible for obtaining the consent. Parents may ask Focalyt to review, correct, or delete a child’s information using the contact details in this policy. Focalyt CRM Lead Integration does not check the age of a person who submits a Facebook or Instagram Lead Ad form.</p>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 border rounded">
                    <h6 className="text-primary">🔒 Protection Measures</h6>
                    <ul className="small mb-0">
                      <li>Institutes obtain any parental consent that applicable law requires</li>
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
              <h2 className="card-title h3 mb-0">📜 7. Educational Data Specific Disclosures</h2>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="alert alert-success border-0">
                    <h5 className="alert-heading">🇺🇸 FERPA</h5>
                    <p className="mb-0">FERPA is a United States law that can apply to certain US educational institutions and their education records. This application does not contain a FERPA school-official agreement or FERPA-specific controls. A US institution that uses Focalyt remains responsible for deciding whether FERPA applies and for meeting its own obligations. Focalyt processes student and enquiry information for the educational, admissions, and follow-up purposes described in this policy.</p>
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
                  <p className="small mb-0">This policy does not designate student information as directory information. An institute that is subject to FERPA is responsible for its own directory-information notices and opt-outs. Focalyt does not publish a directory of students from Lead Ads records.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Focalyt CRM Lead Integration */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="card-title h3 mb-0">📱 8. Focalyt CRM Lead Integration (Facebook and Instagram Lead Ads)</h2>
            </div>
            <div className="card-body">
              <p>Our Meta application <strong>Focalyt CRM Lead Integration</strong> connects Facebook and Instagram Lead Ads to Focalyt CRM. It is used only when an educational institute connects its Facebook Page in Focalyt and maps a Lead Ad form to a course or job in Focalyt CRM.</p>
              <p>The application follows this process:</p>
              <ol>
                <li className="mb-2">An educational institute connects its Facebook Page to Focalyt CRM.</li>
                <li className="mb-2">The institute maps its Lead Ads form to a course or job.</li>
                <li className="mb-2">A prospective candidate submits a Facebook or Instagram Lead Ad form.</li>
                <li className="mb-2">Meta sends Focalyt a webhook containing the Lead ID, Page ID, and Form ID. The Ad ID and submission time are stored when Meta includes them.</li>
                <li className="mb-2">Focalyt CRM Lead Integration retrieves that lead through an authorized Meta API. The retrieval includes the form’s field data.</li>
                <li className="mb-2">Focalyt CRM uses the institute’s form mapping to create a candidate and enquiry, or to attach the enquiry to an existing candidate with the same mobile number.</li>
                <li className="mb-0">Authorized staff of that institute use the record for enquiry management and follow-up.</li>
              </ol>
              <p>A name and a 10-digit mobile number are required before a CRM record is saved. The same Meta lead is stored once so it is not imported again.</p>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="card border-primary h-100">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">Information this integration stores</h6>
                    </div>
                    <div className="card-body">
                      <p className="small">Focalyt CRM Lead Integration stores the following when Meta provides them and they can be used:</p>
                      <ul className="small mb-0">
                        <li className="mb-2">Lead ID, Page ID, and Form ID</li>
                        <li className="mb-2">Ad ID, when Meta includes it</li>
                        <li className="mb-2">Submission time, when Meta includes it</li>
                        <li className="mb-2">Name</li>
                        <li className="mb-2">Mobile number</li>
                        <li className="mb-2">Email address, when the form includes one</li>
                        <li className="mb-2">WhatsApp number, when the form includes one. If it does not, the mobile number is also saved as the WhatsApp contact number on the candidate record.</li>
                        <li className="mb-0">Gender, only when the form answer is male or female</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border-success h-100">
                    <div className="card-header bg-success text-white">
                      <h6 className="mb-0">How we process and store it in Focalyt CRM</h6>
                    </div>
                    <div className="card-body">
                      <ul className="small mb-0">
                        <li className="mb-2">Webhook identifiers are stored so the same Meta lead is processed once.</li>
                        <li className="mb-2">Focalyt reads the institute’s form mapping, including the lead source, status, and mapped course or job.</li>
                        <li className="mb-2">The record is stored as a course or job enquiry for that institute.</li>
                        <li className="mb-2">If a candidate with the same mobile number already exists, Focalyt attaches the new enquiry to that existing record.</li>
                        <li className="mb-0">Other answers on the Lead Ad form may be included in the data Meta returns. Those other answers are not saved as separate candidate fields.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="p-3 border rounded h-100">
                    <h6 className="text-primary">How this data is used</h6>
                    <p className="small mb-0">Focalyt CRM Lead Integration uses this information so the mapped educational institute can manage the enquiry, provide counselling, carry out admissions-related follow-up, and communicate about the mapped course or job. Focalyt does not sell this personal information. It is not used to build advertising audiences for other organisations.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 border rounded h-100">
                    <h6 className="text-success">Who receives it and who can access it</h6>
                    <p className="small mb-0">Meta sends the lead to Focalyt CRM Lead Integration. Focal Skill Development Pvt. Ltd. processes and stores it in Focalyt CRM in order to operate the integration. Authorized Focalyt CRM users of the mapped educational institute can view that institute’s record. The Lead Ads retrieval and save process does not pass these personal details to another marketing service. Meta independently keeps its own copy under <a href="https://www.facebook.com/privacy/policy">Meta’s Privacy Policy</a>. Deleting the Focalyt CRM record does not delete Meta’s copy.</p>
                  </div>
                </div>
              </div>

              <div className="p-3 border rounded mt-4">
                <h6 className="text-primary">Data retention</h6>
                <p className="small mb-2">Focalyt CRM Lead Integration does not have an automatic retention period or a scheduled deletion job for Lead Ads data. Lead identifiers and the related candidate or enquiry record remain in Focalyt CRM until they are removed.</p>
                <p className="small mb-2">Information is deleted when Focalyt completes a verified deletion request, as described below, or when an authorized user removes the record through ordinary use of Focalyt CRM. Visiting this Privacy Policy does not delete a lead.</p>
                <p className="small mb-0">No fixed retention period is configured for these records. Focalyt may keep limited information where the law requires it, including a record that a deletion request was received. A specific number of days is not stated here because the application does not define one.</p>
              </div>

              <div className="alert alert-info border-0 mt-4 mb-0">
                <h6 className="alert-heading">How to request deletion</h6>
                <p>You may request deletion of personal data that Focalyt collected through Meta Lead Ads and stored in Focalyt CRM. Send an email to <a href="mailto:info@focalyt.com">info@focalyt.com</a> with the subject <strong>User Data Deletion Request</strong>, or follow the instructions at <a href="https://focalyt.com/data-deletion">https://focalyt.com/data-deletion</a>.</p>
                <p>Include your name, the mobile number used on the form, and a clear statement that you want the personal data deleted. If the form included an email address, include that too. The institute, course, job, or approximate submission date helps us find the record.</p>
                <p>Focalyt reviews the request at info@focalyt.com. There is no self-service delete control for the person who submitted the form, and sending the email does not delete the record by itself. After Focalyt can match the request to a record, Focalyt manually deletes or de-identifies the matching Focalyt CRM information. The educational institute uses the record for follow-up, but the published deletion path is a request to Focalyt, not an automated action by the institute.</p>
                <p>Focalyt may ask you to confirm the mobile number or email already stored with the lead. Focalyt may retain limited information where the law requires it, including a record that the request was received. We will tell you if a matching record cannot be found.</p>
                <p className="mb-0">Deleting information from Focalyt CRM does not delete information that Meta stores independently. Use Facebook or Instagram settings and Meta’s own tools for Meta’s copy. There is no fee to make this request.</p>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-dark text-white">
              <h2 className="card-title h3 mb-0">Contact Us – Privacy and Data Protection</h2>
            </div>
            <div className="card-body">
              <p>Contact Focalyt about privacy questions, access requests, correction requests, or deletion requests.</p>
              <ul className="mb-0">
                <li className="mb-2"><strong>Legal Company:</strong> Focal Skill Development Pvt. Ltd.</li>
                <li className="mb-2"><strong>Brand:</strong> Focalyt</li>
                <li className="mb-2"><strong>Meta App Name:</strong> Focalyt CRM Lead Integration</li>
                <li className="mb-2"><strong>Email:</strong> <a href="mailto:info@focalyt.com">info@focalyt.com</a></li>
                <li className="mb-2"><strong>Website:</strong> <a href="https://focalyt.com">https://focalyt.com</a></li>
                <li className="mb-2"><strong>Data Deletion:</strong> <a href="https://focalyt.com/data-deletion">https://focalyt.com/data-deletion</a></li>
                <li className="mb-0"><strong>Registered Office:</strong> House No. 294-A, Swastik Vihar, Zirakpur, Punjab 140603, India</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mb-5">
            <div className="card border-0 bg-light">
              <div className="card-body">
                <p className="mb-2"><strong>Last Updated:</strong> 2nd November 2026</p>
                <p className="mb-0">This Privacy Policy governs your use of Focalyt Portal’s educational management platform, including course management, lead management, student management, training management, and WhatsApp Business communication. It also governs our Meta application Focalyt CRM Lead Integration.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;