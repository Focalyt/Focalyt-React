import React, { useState, useEffect } from 'react';

const Resume = () => {
    const [htmlContent, setHtmlContent] = useState('');

    function generateResumeTemplate(profileData = null) {
        // Helper function to format date
        const formatDate = (dateString) => {
          if (!dateString) return '';
          try {
            return new Date(dateString).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
            });
          } catch (error) {
            return '';
          }
        };
      
        // Helper function to format full date
        const formatFullDate = (dateString) => {
          if (!dateString) return '';
          try {
            return new Date(dateString).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            });
          } catch (error) {
            return '';
          }
        };
      
        // Safe access helper
        const safeGet = (obj, path, defaultValue = '') => {
          try {
            return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
          } catch {
            return defaultValue;
          }
        };
      
        // Default sample data (same as React component)
        const defaultProfile = {
          _candidate: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            mobile: '+1234567890',
            sex: 'Male',
            dob: '1990-01-01',
            isExperienced: false,
            personalInfo: {
              professionalTitle: 'Software Developer',
              summary: 'Passionate software developer with expertise in modern web technologies.',
              currentAddress: {
                city: 'New York',
                state: 'NY',
                fullAddress: '123 Main St, New York, NY 10001'
              },
              permanentAddress: {
                city: 'Boston',
                state: 'MA',
                fullAddress: '456 Oak Ave, Boston, MA 02101'
              },
              skills: [
                { skillName: 'JavaScript', skillPercent: 90 },
                { skillName: 'React', skillPercent: 85 },
                { skillName: 'Node.js', skillPercent: 80 },
                { skillName: 'Python', skillPercent: 75 }
              ],
              languages: [
                { name: 'English', level: 5 },
                { name: 'Spanish', level: 3 },
                { name: 'French', level: 2 }
              ],
              certifications: [
                { certificateName: 'AWS Certified Developer', orgName: 'Amazon', month: 'June', year: '2023' },
                { certificateName: 'React Developer Certification', orgName: 'Meta', month: 'January', year: '2023' }
              ],
              projects: [
                { projectName: 'E-commerce Platform', description: 'Built a full-stack e-commerce platform using React and Node.js', year: '2023' },
                { projectName: 'Task Management App', description: 'Developed a responsive task management application', year: '2022' }
              ],
              interest: ['Programming', 'Reading', 'Travel', 'Photography'],
              declaration: {
                text: 'I hereby declare that the information provided above is true and correct to the best of my knowledge.'
              }
            },
            experiences: [
              {
                jobTitle: 'Senior Software Developer',
                companyName: 'Tech Corp',
                from: '2022-01-15',
                to: null,
                currentlyWorking: true,
                jobDescription: 'Lead development of web applications using React, Node.js, and cloud services.'
              },
              {
                jobTitle: 'Software Developer',
                companyName: 'StartupXYZ',
                from: '2020-06-01',
                to: '2021-12-31',
                currentlyWorking: false,
                jobDescription: 'Developed and maintained multiple client projects using modern web technologies.'
              }
            ],
            qualifications: [
              {
                education: 'Bachelor of Technology',
                course: 'Computer Science',
                universityName: 'State University',
                passingYear: '2020',
                marks: '85',
                specialization: 'Software Engineering'
              },
              {
                education: 'Higher Secondary',
                schoolName: 'Central High School',
                passingYear: '2016',
                marks: '92'
              }
            ]
          }
        };
      
        const profile = profileData || defaultProfile;
      
        return `
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          
          body {
              font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #ffffff;
          }
          
          .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              min-height: 100vh;
          }
          
          .document {
              background-color: white;
              border-radius: 15px;
              box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
              padding: 40px;
              border: 1px solid #e1e5e9;
          }
          
          .header {
              border-bottom: 3px solid #e1e5e9;
              margin-bottom: 30px;
              padding-bottom: 30px;
          }
          
          .profile-section {
              display: flex;
              align-items: center;
              margin-bottom: 25px;
              gap: 25px;
              flex-wrap: wrap;
          }
          
          .profile-placeholder {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 60px;
              box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
          }
          
          .profile-content {
              flex: 1;
          }
          
          .name {
              font-size: 2.5rem;
              font-weight: 700;
              margin: 0 0 8px 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
          }
          
          .title {
              font-size: 1.2rem;
              color: #666;
              margin: 0 0 5px 0;
              font-weight: 500;
          }
          
          .contact-details {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 12px;
              margin-top: 20px;
          }
          
          .contact-item {
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 0.95rem;
              color: #555;
              padding: 8px 12px;
              background-color: rgba(102, 126, 234, 0.05);
              border-radius: 8px;
              border-left: 3px solid #667eea;
          }
          
          .contact-icon {
              color: #667eea;
              font-size: 1.1rem;
              width: 20px;
              text-align: center;
          }
          
          .summary {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 25px;
              border-radius: 12px;
              border-left: 4px solid #667eea;
          }
          
          .section-title {
              font-size: 1.4rem;
              font-weight: 600;
              margin: 0 0 15px 0;
              color: #2c3e50;
              position: relative;
              padding-bottom: 8px;
          }
          
          .document-body {
              display: grid;
              grid-template-columns: 2fr 1fr;
              gap: 40px;
              margin-top: 30px;
          }
          
          .section {
              margin-bottom: 35px;
              padding: 25px;
              background-color: rgba(255, 255, 255, 0.8);
              border-radius: 12px;
              border: 1px solid #e1e5e9;
          }
          
          .experience-item {
              margin-bottom: 25px;
              padding: 20px;
              background: linear-gradient(135deg, #f8f9ff 0%, #f0f7ff 100%);
              border-radius: 10px;
              border-left: 4px solid #667eea;
          }
          
          .item-title {
              font-size: 1.2rem;
              font-weight: 600;
              margin: 0 0 5px 0;
              color: #2c3e50;
          }
          
          .item-subtitle {
              font-size: 1rem;
              color: #667eea;
              margin: 0 0 5px 0;
              font-weight: 500;
          }
          
          .item-period {
              font-size: 0.9rem;
              color: #666;
              margin: 0;
              font-style: italic;
          }
          
          .item-content {
              color: #555;
              line-height: 1.6;
              margin-top: 12px;
          }
          
          .skills-list {
              display: flex;
              flex-direction: column;
              gap: 15px;
          }
          
          .skill-item {
              background-color: white;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e1e5e9;
          }
          
          .skill-name {
              font-weight: 500;
              margin-bottom: 8px;
              color: #2c3e50;
          }
          
          .skill-bar-container {
              position: relative;
              background-color: #e9ecef;
              height: 8px;
              border-radius: 4px;
              overflow: hidden;
          }
          
          .skill-bar {
              height: 100%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 4px;
          }
          
          .skill-percent {
              position: absolute;
              right: 8px;
              top: -25px;
              font-size: 0.8rem;
              color: #666;
              font-weight: 500;
          }
          
          .languages-list {
              display: flex;
              flex-direction: column;
              gap: 12px;
          }
          
          .language-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background-color: white;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #e1e5e9;
          }
          
          .language-name {
              font-weight: 500;
              color: #2c3e50;
              flex: 1;
          }
          
          .language-level {
              display: flex;
              gap: 3px;
          }
          
          .level-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: #e9ecef;
          }
          
          .level-dot-filled {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          
          .certifications-list {
              list-style: none;
              padding: 0;
              margin: 0;
          }
          
          .certification-item {
              background-color: white;
              padding: 12px 15px;
              margin-bottom: 8px;
              border-radius: 8px;
              border-left: 3px solid #667eea;
          }
          
          .cert-org {
              color: #667eea;
              font-weight: 500;
          }
          
          .cert-date {
              color: #666;
              font-size: 0.9rem;
          }
          
          .project-title {
              font-size: 1.1rem;
              font-weight: 600;
              margin: 0;
              color: #2c3e50;
          }
          
          .project-year {
              color: #667eea;
              font-weight: 500;
          }
          
          .interests-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
          }
          
          .interest-tag {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 0.85rem;
              font-weight: 500;
          }
          
          .declaration {
              margin-top: 30px;
              padding: 25px;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border-radius: 12px;
              border-left: 4px solid #667eea;
          }
          
          @media (max-width: 768px) {
              .container {
                  padding: 10px;
              }
              
              .document {
                  padding: 20px;
              }
              
              .document-body {
                  grid-template-columns: 1fr;
                  gap: 20px;
              }
              
              .profile-section {
                  flex-direction: column;
                  text-align: center;
              }
              
              .name {
                  font-size: 2rem;
              }
              
              .contact-details {
                  grid-template-columns: 1fr;
              }
          }
      </style>
      
      <div class="container">
          <div class="document">
              
              <div class="header">
                  <div class="profile-section">
                      <div class="profile-placeholder">
                          <span>👤</span>
                      </div>

                      <div class="profile-content">
                          <h1 class="name">
                              ${safeGet(profile, '_candidate.name', 'Your Name')}
                          </h1>
                          <p class="title">
                              ${safeGet(profile, '_candidate.personalInfo.professionalTitle', 'Professional Title')}
                          </p>
                          <p class="title">
                              ${safeGet(profile, '_candidate.sex', 'Sex')}
                          </p>

                          <div class="contact-details">
                              <div class="contact-item">
                                  <span class="contact-icon">📞</span>
                                  <span>${safeGet(profile, '_candidate.mobile', 'Phone Number')}</span>
                              </div>

                              <div class="contact-item">
                                  <span class="contact-icon">📧</span>
                                  <span>${safeGet(profile, '_candidate.email', 'Email Address')}</span>
                              </div>

                              ${safeGet(profile, '_candidate.dob') ? `
                              <div class="contact-item">
                                  <span class="contact-icon">📅</span>
                                  <span>${formatFullDate(profile._candidate.dob)}</span>
                              </div>
                              ` : ''}
                              
                              ${safeGet(profile, '_candidate.personalInfo.currentAddress.city') ? `
                              <div class="contact-item">
                                  <span class="contact-icon">📍</span>
                                  <span>Current: ${safeGet(profile, '_candidate.personalInfo.currentAddress.fullAddress', 'Current Address')}</span>
                              </div>
                              ` : ''}
                              
                              ${safeGet(profile, '_candidate.personalInfo.permanentAddress.city') ? `
                              <div class="contact-item">
                                  <span class="contact-icon">🏠</span>
                                  <span>Permanent: ${safeGet(profile, '_candidate.personalInfo.permanentAddress.fullAddress', 'Permanent Address')}</span>
                              </div>
                              ` : ''}
                          </div>
                      </div>
                  </div>

                  <div class="summary">
                      <h2 class="section-title">Professional Summary</h2>
                      <p>${safeGet(profile, '_candidate.personalInfo.summary', 'No summary provided')}</p>
                  </div>
              </div>

              <div class="document-body">
                  <div>
                      <!-- Work Experience -->
                      ${safeGet(profile, '_candidate.isExperienced') === false ? `
                      <div class="section">
                          <h2 class="section-title">Work Experience</h2>
                          <div class="experience-item">
                              <div>
                                  <h3 class="item-title">Fresher</h3>
                              </div>
                              <div class="item-content">
                                  <p>Looking for opportunities to start my career</p>
                              </div>
                          </div>
                      </div>
                      ` : 
                      (Array.isArray(safeGet(profile, '_candidate.experiences')) && profile._candidate.experiences.length > 0) ? `
                      <div class="section">
                          <h2 class="section-title">Work Experience</h2>
                          ${profile._candidate.experiences.map(exp => `
                              <div class="experience-item">
                                  <div>
                                      ${exp.jobTitle ? `<h3 class="item-title">${exp.jobTitle}</h3>` : ''}
                                      ${exp.companyName ? `<p class="item-subtitle">${exp.companyName}</p>` : ''}
                                      ${(exp.from || exp.to || exp.currentlyWorking) ? `
                                      <p class="item-period">
                                          ${exp.from ? formatDate(exp.from) : 'Start Date'}
                                          - 
                                          ${exp.currentlyWorking ? 'Present' : exp.to ? formatDate(exp.to) : 'End Date'}
                                      </p>
                                      ` : ''}
                                  </div>
                                  ${exp.jobDescription ? `
                                  <div class="item-content">
                                      <p>${exp.jobDescription}</p>
                                  </div>
                                  ` : ''}
                              </div>
                          `).join('')}
                      </div>
                      ` : ''}

                      <!-- Education -->
                      ${(Array.isArray(safeGet(profile, '_candidate.qualifications')) && profile._candidate.qualifications.length > 0) ? `
                      <div class="section">
                          <h2 class="section-title">Education</h2>
                          ${profile._candidate.qualifications.map(edu => `
                              <div class="experience-item">
                                  <div>
                                      ${edu.education ? `<h3 class="item-title">${edu.education}</h3>` : ''}
                                      ${edu.course ? `<h3 class="item-title">${edu.course}</h3>` : ''}
                                      ${edu.universityName ? `<p class="item-subtitle">${edu.universityName}</p>` : ''}
                                      ${edu.schoolName ? `<p class="item-subtitle">${edu.schoolName}</p>` : ''}
                                      ${edu.collegeName ? `<p class="item-subtitle">${edu.collegeName}</p>` : ''}
                                      ${edu.passingYear ? `<p class="item-period">${edu.passingYear}</p>` : ''}
                                  </div>
                                  <div class="item-content">
                                      ${edu.marks ? `<p>Marks: ${edu.marks}%</p>` : ''}
                                      ${edu.specialization ? `<p>Specialization: ${edu.specialization}</p>` : ''}
                                  </div>
                              </div>
                          `).join('')}
                      </div>
                      ` : ''}
                  </div>

                  <div>
                      <!-- Skills -->
                      ${(Array.isArray(safeGet(profile, '_candidate.personalInfo.skills')) && profile._candidate.personalInfo.skills.length > 0) ? `
                      <div class="section">
                          <h2 class="section-title">Skills</h2>
                          <div class="skills-list">
                              ${profile._candidate.personalInfo.skills.map(skill => `
                                  <div class="skill-item">
                                      <div class="skill-name">${skill.skillName || skill}</div>
                                      ${skill.skillPercent ? `
                                      <div class="skill-bar-container">
                                          <div class="skill-bar" style="width: ${skill.skillPercent}%"></div>
                                          <span class="skill-percent">${skill.skillPercent}%</span>
                                      </div>
                                      ` : ''}
                                  </div>
                              `).join('')}
                          </div>
                      </div>
                      ` : ''}

                      <!-- Languages -->
                      ${(Array.isArray(safeGet(profile, '_candidate.personalInfo.languages')) && profile._candidate.personalInfo.languages.length > 0) ? `
                      <div class="section">
                          <h2 class="section-title">Languages</h2>
                          <div class="languages-list">
                              ${profile._candidate.personalInfo.languages.map(lang => `
                                  <div class="language-item">
                                      <div class="language-name">${lang.name || lang.lname || lang}</div>
                                      ${lang.level ? `
                                      <div class="language-level">
                                          ${[1, 2, 3, 4, 5].map(dot => `
                                              <span class="${dot <= (lang.level || 0) ? 'level-dot-filled' : 'level-dot'}"></span>
                                          `).join('')}
                                      </div>
                                      ` : ''}
                                  </div>
                              `).join('')}
                          </div>
                      </div>
                      ` : ''}

                      <!-- Certifications -->
                      ${(Array.isArray(safeGet(profile, '_candidate.personalInfo.certifications')) && profile._candidate.personalInfo.certifications.length > 0) ? `
                      <div class="section">
                          <h2 class="section-title">Certifications</h2>
                          <ul class="certifications-list">
                              ${profile._candidate.personalInfo.certifications.map(cert => `
                                  <li class="certification-item">
                                      <strong>${cert.certificateName || cert.name}</strong>
                                      ${cert.orgName ? `<span class="cert-org"> - ${cert.orgName}</span>` : ''}
                                      ${(cert.month || cert.year) ? `
                                      <span class="cert-date">
                                          ${cert.month && cert.year ? ` (${cert.month}/${cert.year})` :
                                            cert.month ? ` (${cert.month})` :
                                            cert.year ? ` (${cert.year})` : ''}
                                      </span>
                                      ` : ''}
                                  </li>
                              `).join('')}
                          </ul>
                      </div>
                      ` : ''}

                      <!-- Projects -->
                      ${(Array.isArray(safeGet(profile, '_candidate.personalInfo.projects')) && profile._candidate.personalInfo.projects.length > 0) ? `
                      <div class="section">
                          <h2 class="section-title">Projects</h2>
                          ${profile._candidate.personalInfo.projects.map(proj => `
                              <div class="experience-item">
                                  <div>
                                      <h3 class="project-title">
                                          ${proj.projectName || 'Project'}
                                          ${proj.year ? `<span class="project-year"> (${proj.year})</span>` : ''}
                                      </h3>
                                  </div>
                                  ${proj.description ? `
                                  <div class="item-content">
                                      <p>${proj.description}</p>
                                  </div>
                                  ` : ''}
                              </div>
                          `).join('')}
                      </div>
                      ` : ''}

                      <!-- Interests -->
                      ${(Array.isArray(safeGet(profile, '_candidate.personalInfo.interest')) && profile._candidate.personalInfo.interest.length > 0) ? `
                      <div class="section">
                          <h2 class="section-title">Interests</h2>
                          <div class="interests-tags">
                              ${profile._candidate.personalInfo.interest.map(interest => `
                                  <span class="interest-tag">${interest}</span>
                              `).join('')}
                          </div>
                      </div>
                      ` : ''}
                  </div>
              </div>

              <!-- Declaration -->
              ${safeGet(profile, '_candidate.personalInfo.declaration.text') ? `
              <div class="declaration">
                  <h2 class="section-title">Declaration</h2>
                  <p>${profile._candidate.personalInfo.declaration.text}</p>
              </div>
              ` : ''}
          </div>
      </div>`;
      }

    useEffect(() => {
        // Generate HTML content when component mounts
        const html = generateResumeTemplate();
        setHtmlContent(html);
    }, []);

    return (
        <div 
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{ width: '100%', height: '100vh' }}
        />
    );
};

export default Resume;

// import React, { useState, useEffect } from 'react';

// const Resume = () => {
//   // Local state for handling data
//   const [profile, setProfile] = useState(null);
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Initialize data when component mounts
//   useEffect(() => {
//     // Set profile data with sample data
//     setProfile({
//       _candidate: {
//         name: 'John Doe',
//         email: 'john.doe@example.com',
//         mobile: '+1234567890',
//         sex: 'Male',
//         dob: '1990-01-01',
//         isExperienced: false,
//         personalInfo: {
//           professionalTitle: 'Software Developer',
//           summary: 'Passionate software developer with expertise in modern web technologies.',
//           currentAddress: {
//             city: 'New York',
//             state: 'NY',
//             fullAddress: '123 Main St, New York, NY 10001'
//           },
//           permanentAddress: {
//             city: 'Boston',
//             state: 'MA',
//             fullAddress: '456 Oak Ave, Boston, MA 02101'
//           },
//           skills: [
//             { skillName: 'JavaScript', skillPercent: 90 },
//             { skillName: 'React', skillPercent: 85 },
//             { skillName: 'Node.js', skillPercent: 80 },
//             { skillName: 'Python', skillPercent: 75 }
//           ],
//           languages: [
//             { name: 'English', level: 5 },
//             { name: 'Spanish', level: 3 },
//             { name: 'French', level: 2 }
//           ],
//           certifications: [
//             { certificateName: 'AWS Certified Developer', orgName: 'Amazon', month: 'June', year: '2023' },
//             { certificateName: 'React Developer Certification', orgName: 'Meta', month: 'January', year: '2023' }
//           ],
//           projects: [
//             { projectName: 'E-commerce Platform', description: 'Built a full-stack e-commerce platform using React and Node.js', year: '2023' },
//             { projectName: 'Task Management App', description: 'Developed a responsive task management application', year: '2022' }
//           ],
//           interest: ['Programming', 'Reading', 'Travel', 'Photography'],
//           declaration: {
//             text: 'I hereby declare that the information provided above is true and correct to the best of my knowledge.'
//           }
//         },
//         experiences: [
//           {
//             jobTitle: 'Senior Software Developer',
//             companyName: 'Tech Corp',
//             from: '2022-01-15',
//             to: null,
//             currentlyWorking: true,
//             jobDescription: 'Lead development of web applications using React, Node.js, and cloud services.'
//           },
//           {
//             jobTitle: 'Software Developer',
//             companyName: 'StartupXYZ',
//             from: '2020-06-01',
//             to: '2021-12-31',
//             currentlyWorking: false,
//             jobDescription: 'Developed and maintained multiple client projects using modern web technologies.'
//           }
//         ],
//         qualifications: [
//           {
//             education: 'Bachelor of Technology',
//             course: 'Computer Science',
//             universityName: 'State University',
//             passingYear: '2020',
//             marks: '85',
//             specialization: 'Software Engineering'
//           },
//           {
//             education: 'Higher Secondary',
//             schoolName: 'Central High School',
//             passingYear: '2016',
//             marks: '92'
//           }
//         ]
//       }
//     });

//     setUser({ image: '', name: 'John Doe' });
//     setLoading(false);
//   }, []);

//   // Helper function to format date
//   const formatDate = (dateString) => {
//     if (!dateString) return '';
//     try {
//       return new Date(dateString).toLocaleDateString('en-IN', {
//         year: 'numeric',
//         month: 'short',
//       });
//     } catch (error) {
//       return '';
//     }
//   };

//   // Helper function to format full date
//   const formatFullDate = (dateString) => {
//     if (!dateString) return '';
//     try {
//       return new Date(dateString).toLocaleDateString('en-IN', {
//         day: '2-digit',
//         month: 'long',
//         year: 'numeric'
//       });
//     } catch (error) {
//       return '';
//     }
//   };

//   // Safe access helper
//   const safeGet = (obj, path, defaultValue = '') => {
//     try {
//       return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
//     } catch {
//       return defaultValue;
//     }
//   };

//   if (loading) {
//     return (
//       <div style={{ 
//         display: 'flex', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         height: '100vh',
//         fontFamily: "'Inter', 'Segoe UI', sans-serif"
//       }}>
//         <div>Loading Resume...</div>
//       </div>
//     );
//   }

//   const resumeStyles = {
//     container: {
//       maxWidth: '1200px',
//       margin: '0 auto',
//       padding: '20px',
//       backgroundColor: '#ffffff',
//       minHeight: '100vh',
//       fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
//       lineHeight: '1.6',
//       color: '#333'
//     },
//     document: {
//       backgroundColor: 'white',
//       borderRadius: '15px',
//       boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
//       padding: '40px',
//       border: '1px solid #e1e5e9'
//     },
//     header: {
//       borderBottom: '3px solid #e1e5e9',
//       marginBottom: '30px',
//       paddingBottom: '30px'
//     },
//     profileSection: {
//       display: 'flex',
//       alignItems: 'center',
//       marginBottom: '25px',
//       gap: '25px',
//       flexWrap: 'wrap'
//     },
//     profileImage: {
//       width: '120px',
//       height: '120px',
//       borderRadius: '50%',
//       objectFit: 'cover',
//       border: '4px solid #007bff',
//       boxShadow: '0 8px 20px rgba(0, 123, 255, 0.3)'
//     },
//     profilePlaceholder: {
//       width: '120px',
//       height: '120px',
//       borderRadius: '50%',
//       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       color: 'white',
//       fontSize: '60px',
//       boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
//     },
//     name: {
//       fontSize: '2.5rem',
//       fontWeight: '700',
//       margin: '0 0 8px 0',
//       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//       WebkitBackgroundClip: 'text',
//       WebkitTextFillColor: 'transparent',
//       backgroundClip: 'text'
//     },
//     title: {
//       fontSize: '1.2rem',
//       color: '#666',
//       margin: '0 0 5px 0',
//       fontWeight: '500'
//     },
//     contactDetails: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//       gap: '12px',
//       marginTop: '20px'
//     },
//     contactItem: {
//       display: 'flex',
//       alignItems: 'center',
//       gap: '10px',
//       fontSize: '0.95rem',
//       color: '#555',
//       padding: '8px 12px',
//       backgroundColor: 'rgba(102, 126, 234, 0.05)',
//       borderRadius: '8px',
//       borderLeft: '3px solid #667eea'
//     },
//     contactIcon: {
//       color: '#667eea',
//       fontSize: '1.1rem',
//       width: '20px',
//       textAlign: 'center'
//     },
//     summary: {
//       background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
//       padding: '25px',
//       borderRadius: '12px',
//       borderLeft: '4px solid #667eea'
//     },
//     sectionTitle: {
//       fontSize: '1.4rem',
//       fontWeight: '600',
//       margin: '0 0 15px 0',
//       color: '#2c3e50',
//       position: 'relative',
//       paddingBottom: '8px'
//     },
//     documentBody: {
//       display: 'grid',
//       gridTemplateColumns: '2fr 1fr',
//       gap: '40px',
//       marginTop: '30px'
//     },
//     section: {
//       marginBottom: '35px',
//       padding: '25px',
//       backgroundColor: 'rgba(255, 255, 255, 0.8)',
//       borderRadius: '12px',
//       border: '1px solid #e1e5e9'
//     },
//     experienceItem: {
//       marginBottom: '25px',
//       padding: '20px',
//       background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f7ff 100%)',
//       borderRadius: '10px',
//       borderLeft: '4px solid #667eea'
//     },
//     itemTitle: {
//       fontSize: '1.2rem',
//       fontWeight: '600',
//       margin: '0 0 5px 0',
//       color: '#2c3e50'
//     },
//     itemSubtitle: {
//       fontSize: '1rem',
//       color: '#667eea',
//       margin: '0 0 5px 0',
//       fontWeight: '500'
//     },
//     itemPeriod: {
//       fontSize: '0.9rem',
//       color: '#666',
//       margin: '0',
//       fontStyle: 'italic'
//     },
//     itemContent: {
//       color: '#555',
//       lineHeight: '1.6',
//       marginTop: '12px'
//     },
//     skillsList: {
//       display: 'flex',
//       flexDirection: 'column',
//       gap: '15px'
//     },
//     skillItem: {
//       backgroundColor: 'white',
//       padding: '15px',
//       borderRadius: '8px',
//       border: '1px solid #e1e5e9'
//     },
//     skillName: {
//       fontWeight: '500',
//       marginBottom: '8px',
//       color: '#2c3e50'
//     },
//     skillBarContainer: {
//       position: 'relative',
//       backgroundColor: '#e9ecef',
//       height: '8px',
//       borderRadius: '4px',
//       overflow: 'hidden'
//     },
//     skillBar: {
//       height: '100%',
//       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//       borderRadius: '4px'
//     },
//     skillPercent: {
//       position: 'absolute',
//       right: '8px',
//       top: '-25px',
//       fontSize: '0.8rem',
//       color: '#666',
//       fontWeight: '500'
//     },
//     languagesList: {
//       display: 'flex',
//       flexDirection: 'column',
//       gap: '12px'
//     },
//     languageItem: {
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       backgroundColor: 'white',
//       padding: '12px',
//       borderRadius: '8px',
//       border: '1px solid #e1e5e9'
//     },
//     languageName: {
//       fontWeight: '500',
//       color: '#2c3e50',
//       flex: '1'
//     },
//     languageLevel: {
//       display: 'flex',
//       gap: '3px'
//     },
//     levelDot: {
//       width: '8px',
//       height: '8px',
//       borderRadius: '50%',
//       backgroundColor: '#e9ecef'
//     },
//     levelDotFilled: {
//       width: '8px',
//       height: '8px',
//       borderRadius: '50%',
//       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
//     },
//     certificationsList: {
//       listStyle: 'none',
//       padding: '0',
//       margin: '0'
//     },
//     certificationItem: {
//       backgroundColor: 'white',
//       padding: '12px 15px',
//       marginBottom: '8px',
//       borderRadius: '8px',
//       borderLeft: '3px solid #667eea'
//     },
//     certOrg: {
//       color: '#667eea',
//       fontWeight: '500'
//     },
//     certDate: {
//       color: '#666',
//       fontSize: '0.9rem'
//     },
//     projectTitle: {
//       fontSize: '1.1rem',
//       fontWeight: '600',
//       margin: '0',
//       color: '#2c3e50'
//     },
//     projectYear: {
//       color: '#667eea',
//       fontWeight: '500'
//     },
//     interestsTags: {
//       display: 'flex',
//       flexWrap: 'wrap',
//       gap: '8px'
//     },
//     interestTag: {
//       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//       color: 'white',
//       padding: '6px 12px',
//       borderRadius: '20px',
//       fontSize: '0.85rem',
//       fontWeight: '500'
//     },
//     declaration: {
//       marginTop: '30px',
//       padding: '25px',
//       background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
//       borderRadius: '12px',
//       borderLeft: '4px solid #667eea'
//     },
//     '@media (max-width: 768px)': {
//       container: {
//         padding: '10px'
//       },
//       document: {
//         padding: '20px'
//       },
//       documentBody: {
//         gridTemplateColumns: '1fr',
//         gap: '20px'
//       },
//       profileSection: {
//         flexDirection: 'column',
//         textAlign: 'center'
//       },
//       name: {
//         fontSize: '2rem'
//       },
//       contactDetails: {
//         gridTemplateColumns: '1fr'
//       }
//     }
//   };

//   return (
//     <div style={resumeStyles.container}>
//       <div style={resumeStyles.document}>
        
//         <div style={resumeStyles.header}>
//           <div style={resumeStyles.profileSection}>
//             {user?.image ? (
//               <img
//                 src={user.image}
//                 alt="Profile"
//                 style={resumeStyles.profileImage}
//               />
//             ) : (
//               <div style={resumeStyles.profilePlaceholder}>
//                 <span>👤</span>
//               </div>
//             )}

//             <div style={{ flex: 1 }}>
//               <h1 style={resumeStyles.name}>
//                 {safeGet(profile, '_candidate.name', 'Your Name')}
//               </h1>
//               <p style={resumeStyles.title}>
//                 {safeGet(profile, '_candidate.personalInfo.professionalTitle', 'Professional Title')}
//               </p>
//               <p style={resumeStyles.title}>
//                 {safeGet(profile, '_candidate.sex', 'Sex')}
//               </p>

//               <div style={resumeStyles.contactDetails}>
//                 <div style={resumeStyles.contactItem}>
//                   <span style={resumeStyles.contactIcon}>📞</span>
//                   <span>{safeGet(profile, '_candidate.mobile', 'Phone Number')}</span>
//                 </div>

//                 <div style={resumeStyles.contactItem}>
//                   <span style={resumeStyles.contactIcon}>📧</span>
//                   <span>{safeGet(profile, '_candidate.email', 'Email Address')}</span>
//                 </div>

//                 {safeGet(profile, '_candidate.dob') && (
//                   <div style={resumeStyles.contactItem}>
//                     <span style={resumeStyles.contactIcon}>📅</span>
//                     <span>{formatFullDate(profile._candidate.dob)}</span>
//                   </div>
//                 )}
                
//                 {safeGet(profile, '_candidate.personalInfo.currentAddress.city') && (
//                   <div style={resumeStyles.contactItem}>
//                     <span style={resumeStyles.contactIcon}>📍</span>
//                     <span>Current: {safeGet(profile, '_candidate.personalInfo.currentAddress.fullAddress', 'Current Address')}</span>
//                   </div>
//                 )}
                
//                 {safeGet(profile, '_candidate.personalInfo.permanentAddress.city') && (
//                   <div style={resumeStyles.contactItem}>
//                     <span style={resumeStyles.contactIcon}>🏠</span>
//                     <span>Permanent: {safeGet(profile, '_candidate.personalInfo.permanentAddress.fullAddress', 'Permanent Address')}</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           <div style={resumeStyles.summary}>
//             <h2 style={resumeStyles.sectionTitle}>Professional Summary</h2>
//             <p>{safeGet(profile, '_candidate.personalInfo.summary', 'No summary provided')}</p>
//           </div>
//         </div>

//         <div style={resumeStyles.documentBody}>
//           <div>
//             {/* Work Experience */}
//             {safeGet(profile, '_candidate.isExperienced') === false ? (
//               <div style={resumeStyles.section}>
//                 <h2 style={resumeStyles.sectionTitle}>Work Experience</h2>
//                 <div style={resumeStyles.experienceItem}>
//                   <div>
//                     <h3 style={resumeStyles.itemTitle}>Fresher</h3>
//                   </div>
//                   <div style={resumeStyles.itemContent}>
//                     <p>Looking for opportunities to start my career</p>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               Array.isArray(safeGet(profile, '_candidate.experiences')) && profile._candidate.experiences.length > 0 && (
//                 <div style={resumeStyles.section}>
//                   <h2 style={resumeStyles.sectionTitle}>Work Experience</h2>
//                   {profile._candidate.experiences.map((exp, index) => (
//                     <div key={`exp-${index}`} style={resumeStyles.experienceItem}>
//                       <div>
//                         {exp.jobTitle && (
//                           <h3 style={resumeStyles.itemTitle}>{exp.jobTitle}</h3>
//                         )}
//                         {exp.companyName && (
//                           <p style={resumeStyles.itemSubtitle}>{exp.companyName}</p>
//                         )}
//                         {(exp.from || exp.to || exp.currentlyWorking) && (
//                           <p style={resumeStyles.itemPeriod}>
//                             {exp.from ? formatDate(exp.from) : 'Start Date'}
//                             {" - "}
//                             {exp.currentlyWorking ? 'Present' : exp.to ? formatDate(exp.to) : 'End Date'}
//                           </p>
//                         )}
//                       </div>
//                       {exp.jobDescription && (
//                         <div style={resumeStyles.itemContent}>
//                           <p>{exp.jobDescription}</p>
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )
//             )}

//             {/* Education */}
//             {Array.isArray(safeGet(profile, '_candidate.qualifications')) && profile._candidate.qualifications.length > 0 && (
//               <div style={resumeStyles.section}>
//                 <h2 style={resumeStyles.sectionTitle}>Education</h2>
//                 {profile._candidate.qualifications.map((edu, index) => (
//                   <div key={`edu-${index}`} style={resumeStyles.experienceItem}>
//                     <div>
//                       {edu.education && (
//                         <h3 style={resumeStyles.itemTitle}>{edu.education}</h3>
//                       )}
//                       {edu.course && (
//                         <h3 style={resumeStyles.itemTitle}>{edu.course}</h3>
//                       )}
//                       {edu.universityName && (
//                         <p style={resumeStyles.itemSubtitle}>{edu.universityName}</p>
//                       )}
//                       {edu.schoolName && (
//                         <p style={resumeStyles.itemSubtitle}>{edu.schoolName}</p>
//                       )}
//                       {edu.collegeName && (
//                         <p style={resumeStyles.itemSubtitle}>{edu.collegeName}</p>
//                       )}
//                       {edu.passingYear && (
//                         <p style={resumeStyles.itemPeriod}>{edu.passingYear}</p>
//                       )}
//                     </div>
//                     <div style={resumeStyles.itemContent}>
//                       {edu.marks && <p>Marks: {edu.marks}%</p>}
//                       {edu.specialization && <p>Specialization: {edu.specialization}</p>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           <div>
//             {/* Skills */}
//             {Array.isArray(safeGet(profile, '_candidate.personalInfo.skills')) && profile._candidate.personalInfo.skills.length > 0 && (
//               <div style={resumeStyles.section}>
//                 <h2 style={resumeStyles.sectionTitle}>Skills</h2>
//                 <div style={resumeStyles.skillsList}>
//                   {profile._candidate.personalInfo.skills.map((skill, index) => (
//                     <div key={`skill-${index}`} style={resumeStyles.skillItem}>
//                       <div style={resumeStyles.skillName}>{skill.skillName || skill}</div>
//                       {skill.skillPercent && (
//                         <div style={resumeStyles.skillBarContainer}>
//                           <div
//                             style={{
//                               ...resumeStyles.skillBar,
//                               width: `${skill.skillPercent}%`
//                             }}
//                           ></div>
//                           <span style={resumeStyles.skillPercent}>{skill.skillPercent}%</span>
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Languages */}
//             {Array.isArray(safeGet(profile, '_candidate.personalInfo.languages')) && profile._candidate.personalInfo.languages.length > 0 && (
//               <div style={resumeStyles.section}>
//                 <h2 style={resumeStyles.sectionTitle}>Languages</h2>
//                 <div style={resumeStyles.languagesList}>
//                   {profile._candidate.personalInfo.languages.map((lang, index) => (
//                     <div key={`lang-${index}`} style={resumeStyles.languageItem}>
//                       <div style={resumeStyles.languageName}>{lang.name || lang.lname || lang}</div>
//                       {lang.level && (
//                         <div style={resumeStyles.languageLevel}>
//                           {[1, 2, 3, 4, 5].map(dot => (
//                             <span
//                               key={`dot-${index}-${dot}`}
//                               style={dot <= (lang.level || 0) ? resumeStyles.levelDotFilled : resumeStyles.levelDot}
//                             ></span>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Certifications */}
//             {Array.isArray(safeGet(profile, '_candidate.personalInfo.certifications')) && profile._candidate.personalInfo.certifications.length > 0 && (
//               <div style={resumeStyles.section}>
//                 <h2 style={resumeStyles.sectionTitle}>Certifications</h2>
//                 <ul style={resumeStyles.certificationsList}>
//                   {profile._candidate.personalInfo.certifications.map((cert, index) => (
//                     <li key={`cert-${index}`} style={resumeStyles.certificationItem}>
//                       <strong>{cert.certificateName || cert.name}</strong>
//                       {cert.orgName && (
//                         <span style={resumeStyles.certOrg}> - {cert.orgName}</span>
//                       )}
//                       {(cert.month || cert.year) && (
//                         <span style={resumeStyles.certDate}>
//                           {cert.month && cert.year ?
//                             ` (${cert.month}/${cert.year})` :
//                             cert.month ?
//                               ` (${cert.month})` :
//                               cert.year ?
//                                 ` (${cert.year})` :
//                                 ''}
//                         </span>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* Projects */}
//             {Array.isArray(safeGet(profile, '_candidate.personalInfo.projects')) && profile._candidate.personalInfo.projects.length > 0 && (
//               <div style={resumeStyles.section}>
//                 <h2 style={resumeStyles.sectionTitle}>Projects</h2>
//                 {profile._candidate.personalInfo.projects.map((proj, index) => (
//                   <div key={`proj-${index}`} style={resumeStyles.experienceItem}>
//                     <div>
//                       <h3 style={resumeStyles.projectTitle}>
//                         {proj.projectName || 'Project'}
//                         {proj.year && <span style={resumeStyles.projectYear}> ({proj.year})</span>}
//                       </h3>
//                     </div>
//                     {proj.description && (
//                       <div style={resumeStyles.itemContent}>
//                         <p>{proj.description}</p>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Interests */}
//             {Array.isArray(safeGet(profile, '_candidate.personalInfo.interest')) && profile._candidate.personalInfo.interest.length > 0 && (
//               <div style={resumeStyles.section}>
//                 <h2 style={resumeStyles.sectionTitle}>Interests</h2>
//                 <div style={resumeStyles.interestsTags}>
//                   {profile._candidate.personalInfo.interest.map((interest, index) => (
//                     <span key={`interest-${index}`} style={resumeStyles.interestTag}>
//                       {interest}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Declaration */}
//         {safeGet(profile, '_candidate.personalInfo.declaration.text') && (
//           <div style={resumeStyles.declaration}>
//             <h2 style={resumeStyles.sectionTitle}>Declaration</h2>
//             <p>{profile._candidate.personalInfo.declaration.text}</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Resume;