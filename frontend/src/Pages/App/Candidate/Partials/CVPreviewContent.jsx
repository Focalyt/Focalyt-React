import React from 'react';

const CVPreviewContent = ({
  experiences = [],
  educations = [],
  declaration = '',
  skills = [],
  certificates = [],
  languages = [],
  projects = [],
  interests = [],
  user = {},
  isEditable = false
}) => {
  const safeEditable = (content, placeholder) => {
    return isEditable ? (
      <div contentEditable data-placeholder={placeholder} suppressContentEditableWarning={true}>
        {content}
      </div>
    ) : (
      <div className="preview-text">{content || placeholder}</div>
    );
  };

  return (
    <section id="skill" className="w-100 px-3">
      <div className="cv-container mx-auto py-4 px-3" style={{ maxWidth: '1140px' }}>
        <div className="top-bar mb-3 border-bottom border-danger" style={{ height: '6px' }}></div>

        {/* Header Section */}
        <div className="cv-header d-flex flex-column flex-md-row align-items-center gap-4 mb-4">
          <div className="profile-image rounded-circle border shadow" style={{ width: '150px', height: '150px', overflow: 'hidden' }}>
            <img src="/api/placeholder/150/150" alt="Profile Picture" className="w-100 h-100 object-fit-cover" />
          </div>
          <div className="personal-info flex-grow-1 text-center text-md-start">
            <h4 className="fw-bold mb-1">{safeEditable(user?.name, 'Your Name')}</h4>
            <div className="mb-1">{safeEditable('Professional Title', 'Professional Title')}</div>
            <div className="text-muted mb-2">{safeEditable('A results-driven professional with over 8 years...', 'Write a brief professional summary here...')}</div>
            <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start text-muted">
              <div><span className="me-1">📞</span>{safeEditable(user?.mobile || '+91 98765 43210', 'Phone')}</div>
              <div><span className="me-1">✉️</span>{safeEditable(user?.email || 'yourname@example.com', 'Email')}</div>
              <div><span className="me-1">🌐</span>{safeEditable('linkedin.com/in/yourprofile', 'LinkedIn')}</div>
              <div><span className="me-1">📍</span>{safeEditable('Mumbai, India', 'Location')}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="row">
          <div className="col-md-6 pe-md-4">
            {/* Work Experience */}
            <div className="section mb-4">
              <h5 className="text-danger mb-3">💼 WORK EXPERIENCE</h5>
              {experiences.map((exp, i) => (
                <div key={i} className="mb-3">
                  <div className="fw-bold">{safeEditable(exp.title, 'Job Title')}</div>
                  <div className="text-muted">{safeEditable(exp.company, 'Company Name')}</div>
                  <div className="small">📅 {safeEditable(exp.duration, 'Duration')}</div>
                  <div>{safeEditable(exp.description, 'Job Description')}</div>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="section mb-4">
              <h5 className="text-danger mb-3">🎓 EDUCATION</h5>
              {educations.map((edu, i) => (
                <div key={i} className="mb-3">
                  <div className="fw-bold">{safeEditable(edu.degree, 'Degree')}</div>
                  <div className="text-muted">{safeEditable(edu.university, 'University')}</div>
                  <div className="small">📅 {safeEditable(edu.duration, 'Duration')}</div>
                  <div>{safeEditable(edu.description, 'Additional Info')}</div>
                </div>
              ))}
            </div>

            {/* Declaration */}
            <div className="section">
              <h5 className="text-danger mb-2">📜 DECLARATION</h5>
              <div className="text-muted">
                {declaration || 'I hereby declare that the above information is true to the best of my knowledge.'}
              </div>
            </div>
          </div>

          <div className="col-md-6 ps-md-4">
            {/* Skills */}
            <div className="section mb-4">
              <h5 className="text-danger mb-3">🔧 SKILLS</h5>
              {skills.map((skill, i) => (
                <div key={i} className="mb-2">
                  <div className="d-flex justify-content-between">
                    <div>{safeEditable(skill.name, 'Skill')}</div>
                    <div>{skill.level || 0}%</div>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-danger"
                      role="progressbar"
                      style={{ width: `${skill.level || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Certifications */}
            <div className="section mb-4">
              <h5 className="text-danger mb-3">🏆 CERTIFICATIONS</h5>
              {certificates.map((cert, i) => (
                <div key={i} className="mb-2">
                  <div className="fw-bold">{safeEditable(cert.name, 'Certificate')}</div>
                  <div className="text-muted">{safeEditable(cert.issuer, 'Issuer')}</div>
                </div>
              ))}
            </div>

            {/* Languages */}
            <div className="section mb-4">
              <h5 className="text-danger mb-3">🌐 LANGUAGES</h5>
              {languages.map((lang, i) => (
                <div key={i} className="mb-2">
                  <div>{safeEditable(lang.name, 'Language')}</div>
                  <div className="d-flex gap-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className={`rounded-circle ${level <= (lang.level || 0) ? 'bg-danger' : 'bg-light'} border`} style={{ width: '10px', height: '10px' }}></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Projects */}
            <div className="section mb-4">
              <h5 className="text-danger mb-3">📊 PROJECTS</h5>
              {projects.map((proj, i) => (
                <div key={i} className="mb-2">
                  <div className="fw-bold">{safeEditable(proj.name, 'Project Name')}</div>
                  <div className="text-muted">{safeEditable(proj.year, 'Year')}</div>
                  <div>{safeEditable(proj.description, 'Project Description')}</div>
                </div>
              ))}
            </div>

            {/* Interests */}
            <div className="section">
              <h5 className="text-danger mb-2">🎯 INTERESTS</h5>
              {/* <div className="d-flex flex-wrap gap-2">
                {interests.map((val, i) => (
                  <span key={i} className="badge bg-light text-dark border border-danger px-3 py-1 rounded-pill">
                    {val || 'Interest'}
                  </span>
                ))}
              </div> */}
            </div>
          </div>
        </div>
      </div>
      <style>
      {
        `
        .profile-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 15px;
  border: 3px solid #eee;
}

.profile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

        `
      }
    </style>
    </section>
   
  );
};

export default CVPreviewContent;
