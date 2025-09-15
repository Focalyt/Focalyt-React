import React, { useState } from 'react';

const WhatsAppTemplate = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'enterprise', 'non-enterprise'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Form states for Enterprise template
  const [enterpriseForm, setEnterpriseForm] = useState({
    name: '',
    visibleFor: [],
    category: [],
    language: [],
    headerType: 'None',
    bodyText: '',
    selectedTokens: [],
    footerText: '',
    footerButton: '',
    // Call To Action fields
    actionType: 'Call Phone Number', // New field added
    callButtonText: '',
    callCountry: '',
    callPhoneNumber: '',
    // Website Button fields
    websiteButtonText: '',
    websiteURL: '',
    // Quick Reply fields
    quickReplies: [{ id: 1, text: '' }]
  });

  // Form states for Non-Enterprise template
  const [nonEnterpriseForm, setNonEnterpriseForm] = useState({
    name: '',
    visibleFor: [],
    bodyText: '',
    selectedTokens: []
  });

  // Show/hide dropdown for multiselect
  const [showVisibleForDropdown, setShowVisibleForDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showNonEnterpriseDropdown, setShowNonEnterpriseDropdown] = useState(false);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [showNonEnterpriseTokenDropdown, setShowNonEnterpriseTokenDropdown] = useState(false);

  // Search states for tokens
  const [tokenSearch, setTokenSearch] = useState('');
  const [nonEnterpriseTokenSearch, setNonEnterpriseTokenSearch] = useState('');

  // Available options for selection
  const availableCounselors = [
    'All Counselors',
    'Senior Counselors',
    'Junior Counselors',
    'Marketing Team',
    'Sales Team',
    'Support Team'
  ];

  const availableCategories = [
    'Marketing',
    'Sales',
    'Support',
    'Training',
    'General',
    'Promotional'
  ];

  const availableLanguages = [
    'English',
    'Hindi',
    'Bengali',
    'Telugu',
    'Marathi',
    'Tamil',
    'Gujarati',
    'Kannada',
    'Odia',
    'Punjabi'
  ];

  const availableCountries = [
    'India (+91)',
    'United States (+1)',
    'United Kingdom (+44)',
    'Canada (+1)',
    'Australia (+61)',
    'Germany (+49)',
    'France (+33)',
    'Japan (+81)',
    'Singapore (+65)',
    'UAE (+971)'
  ];

  // Available tokens for selection
  const availableTokens = [
    '{{first_name}}',
    '{{last_name}}',
    '{{full_name}}',
    '{{email}}',
    '{{phone}}',
    '{{company}}',
    '{{course_name}}',
    '{{counselor_name}}',
    '{{date}}',
    '{{time}}',
    '{{custom_field_1}}',
    '{{custom_field_2}}',
    '{{location}}',
    '{{batch_number}}',
    '{{enrollment_id}}',
    '{{fee_amount}}',
    '{{due_date}}',
    '{{payment_status}}'
  ];

  const templates = [
    {
      id: 1,
      name: 'osda_gsa_temp',
      category: 'Marketing • Global',
      subject: '🏨 Free Hotel Management Training & 100% Job Guarantee for ...',
      templateType: 'Enterprise',
      status: 'Approved'
    },
    {
      id: 2,
      name: 'osda_telecom_temp',
      category: 'Marketing • Global',
      subject: '📱 Free Telecom Training & 100% Job Guarantee for Odisha You...',
      templateType: 'Enterprise',
      status: 'Approved'
    },
    {
      id: 3,
      name: 'engagement_retails',
      category: 'Marketing • Global',
      subject: '📁 Golden Opportunity! 🎯 Free Course in Retail Sales Executiv...',
      templateType: 'Enterprise',
      status: 'Approved'
    },
    {
      id: 4,
      name: 'engagement_ems',
      category: 'Marketing • Global',
      subject: '⚡ Free Course in Electronic Hardware Assembly Operator 🎯 ...',
      templateType: 'Enterprise',
      status: 'Approved'
    }
  ];

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTemplate = (type) => {
    setCurrentView(type);
    setShowDropdown(false);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEnterpriseForm({
      name: '',
      visibleFor: [],
      category: [],
      language: [],
      headerType: 'None',
      bodyText: '',
      selectedTokens: [],
      footerText: '',
      footerButton: '',
      actionType: 'Call Phone Number', // Reset to default
      callButtonText: '',
      callCountry: '',
      callPhoneNumber: '',
      websiteButtonText: '',
      websiteURL: '',
      quickReplies: [{ id: 1, text: '' }]
    });
    setNonEnterpriseForm({
      name: '',
      visibleFor: [],
      bodyText: '',
      selectedTokens: []
    });
    // Close all dropdowns
    setShowVisibleForDropdown(false);
    setShowCategoryDropdown(false);
    setShowLanguageDropdown(false);
    setShowNonEnterpriseDropdown(false);
    setShowTokenDropdown(false);
    setShowNonEnterpriseTokenDropdown(false);
    setTokenSearch('');
    setNonEnterpriseTokenSearch('');
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowVisibleForDropdown(false);
      setShowCategoryDropdown(false);
      setShowLanguageDropdown(false);
      setShowNonEnterpriseDropdown(false);
      setShowTokenDropdown(false);
      setShowNonEnterpriseTokenDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle multiselect checkbox for Enterprise Visible For
  const handleEnterpriseVisibleForChange = (counselor) => {
    const updatedSelection = enterpriseForm.visibleFor.includes(counselor)
      ? enterpriseForm.visibleFor.filter(item => item !== counselor)
      : [...enterpriseForm.visibleFor, counselor];
    
    setEnterpriseForm({...enterpriseForm, visibleFor: updatedSelection});
  };

  // Handle multiselect checkbox for Enterprise Category
  const handleEnterpriseCategoryChange = (category) => {
    const updatedSelection = enterpriseForm.category.includes(category)
      ? enterpriseForm.category.filter(item => item !== category)
      : [...enterpriseForm.category, category];
    
    setEnterpriseForm({...enterpriseForm, category: updatedSelection});
  };

  // Handle multiselect checkbox for Enterprise Language
  const handleEnterpriseLanguageChange = (language) => {
    const updatedSelection = enterpriseForm.language.includes(language)
      ? enterpriseForm.language.filter(item => item !== language)
      : [...enterpriseForm.language, language];
    
    setEnterpriseForm({...enterpriseForm, language: updatedSelection});
  };

  // Handle multiselect checkbox for Non-Enterprise
  const handleNonEnterpriseVisibleForChange = (counselor) => {
    const updatedSelection = nonEnterpriseForm.visibleFor.includes(counselor)
      ? nonEnterpriseForm.visibleFor.filter(item => item !== counselor)
      : [...nonEnterpriseForm.visibleFor, counselor];
    
    setNonEnterpriseForm({...nonEnterpriseForm, visibleFor: updatedSelection});
  };

  // Handle token selection for Enterprise
  const handleEnterpriseTokenChange = (token) => {
    const updatedSelection = enterpriseForm.selectedTokens.includes(token)
      ? enterpriseForm.selectedTokens.filter(item => item !== token)
      : [...enterpriseForm.selectedTokens, token];
    
    setEnterpriseForm({...enterpriseForm, selectedTokens: updatedSelection});
  };

  // Handle token selection for Non-Enterprise
  const handleNonEnterpriseTokenChange = (token) => {
    const updatedSelection = nonEnterpriseForm.selectedTokens.includes(token)
      ? nonEnterpriseForm.selectedTokens.filter(item => item !== token)
      : [...nonEnterpriseForm.selectedTokens, token];
    
    setNonEnterpriseForm({...nonEnterpriseForm, selectedTokens: updatedSelection});
  };

  // Handle Quick Reply functions
  const addQuickReply = () => {
    const newId = Math.max(...enterpriseForm.quickReplies.map(qr => qr.id)) + 1;
    setEnterpriseForm({
      ...enterpriseForm,
      quickReplies: [...enterpriseForm.quickReplies, { id: newId, text: '' }]
    });
  };

  const removeQuickReply = (id) => {
    setEnterpriseForm({
      ...enterpriseForm,
      quickReplies: enterpriseForm.quickReplies.filter(qr => qr.id !== id)
    });
  };

  const updateQuickReplyText = (id, text) => {
    setEnterpriseForm({
      ...enterpriseForm,
      quickReplies: enterpriseForm.quickReplies.map(qr => 
        qr.id === id ? { ...qr, text } : qr
      )
    });
  };

  // Filter tokens based on search
  const filteredTokens = availableTokens.filter(token =>
    token.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  const filteredNonEnterpriseTokens = availableTokens.filter(token =>
    token.toLowerCase().includes(nonEnterpriseTokenSearch.toLowerCase())
  );

  // Format selected items display
  const formatSelectedItems = (selectedArray, placeholder) => {
    if (selectedArray.length === 0) return placeholder;
    if (selectedArray.length <= 2) return selectedArray.join(', ');
    return `${selectedArray.slice(0, 2).join(', ')} +${selectedArray.length - 2} more`;
  };

  const renderTemplateList = () => (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <span className="fs-4 me-3" style={{ color: '#ff6b35' }}>⚡</span>
        </div>
        <div className="d-flex align-items-center">
          <button className="btn btn-outline-primary me-2" style={{ borderRadius: '8px' }}>
            <span style={{ color: '#17a2b8' }}>C</span>
          </button>
          <button className="btn btn-outline-warning me-2" style={{ borderRadius: '8px' }}>
            <span style={{ color: '#ffc107' }}>T</span>
          </button>
          <div className="position-relative me-3">
            <button 
              className="btn btn-outline-success" 
              style={{ borderRadius: '8px' }}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span style={{ color: '#28a745' }}>📝</span>
            </button>
            {showDropdown && (
              <div className="dropdown-menu show position-absolute" style={{ top: '100%', left: 0, zIndex: 1000 }}>
                <button 
                  className="dropdown-item" 
                  onClick={() => handleCreateTemplate('enterprise')}
                >
                  Enterprise
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => handleCreateTemplate('non-enterprise')}
                >
                  Non-Enterprise
                </button>
              </div>
            )}
          </div>
          <div className="input-group" style={{ width: '250px' }}>
            <input
              type="text"
              className="form-control m-0"
              placeholder="Search Template"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: '8px 0 0 8px', border: '1px solid #ced4da' }}
            />
            <button className="btn btn-outline-secondary" style={{ borderRadius: '0 8px 8px 0' }}>
              🔍
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm" style={{ borderRadius: '12px', border: 'none' }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: '#f1f3f4' }}>
              <tr>
                <th className="fw-semibold text-muted py-3 ps-4" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  TEMPLATE NAME
                </th>
                <th className="fw-semibold text-muted py-3" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  SUBJECT
                </th>
                <th className="fw-semibold text-muted py-3" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  TEMPLATE TYPE
                </th>
                <th className="fw-semibold text-muted py-3" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  STATUS
                </th>
                <th className="fw-semibold text-muted py-3 pe-4" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template) => (
                <tr key={template.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td className="py-3 ps-4">
                    <div>
                      <div className="fw-medium text-dark">{template.name}</div>
                      <small className="text-muted">{template.category}</small>
                    </div>
                  </td>
                  <td className="py-3" style={{ maxWidth: '400px' }}>
                    <div className="text-truncate" title={template.subject}>
                      {template.subject}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-muted">{template.templateType}</span>
                  </td>
                  <td className="py-3">
                    <span 
                      className="badge px-3 py-2" 
                      style={{ 
                        backgroundColor: '#d4edda', 
                        color: '#155724',
                        borderRadius: '20px',
                        fontWeight: '500',
                        fontSize: '12px'
                      }}
                    >
                      {template.status}
                    </span>
                  </td>
                  <td className="py-3 pe-4">
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm" 
                        style={{ 
                          backgroundColor: '#ff8c42', 
                          border: 'none',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Edit"
                      >
                        <span style={{ color: 'white', fontSize: '14px' }}>✏️</span>
                      </button>
                      <button 
                        className="btn btn-sm" 
                        style={{ 
                          backgroundColor: '#ff8c42', 
                          border: 'none',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="View"
                      >
                        <span style={{ color: 'white', fontSize: '14px' }}>👁️</span>
                      </button>
                      <button 
                        className="btn btn-sm" 
                        style={{ 
                          backgroundColor: '#ff8c42', 
                          border: 'none',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete"
                      >
                        <span style={{ color: 'white', fontSize: '14px' }}>🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEnterpriseTemplate = () => (
    <div className="container-fluid p-0" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header with Back Button */}
      <div className="row g-0">
        <div className="col-12" style={{ backgroundColor: 'white', borderBottom: '1px solid #e0e0e0' }}>
          <div className="d-flex justify-content-between align-items-center p-3">
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-outline-secondary me-3"
                onClick={handleBackToList}
                style={{ borderRadius: '8px' }}
              >
                ← Back
              </button>
              <h5 className="mb-0 fw-bold">Create Enterprise Template</h5>
            </div>
            <div className="d-flex align-items-center">
              <span className="fs-4 me-3" style={{ color: '#ff6b35' }}>⚡</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-0">
        {/* Basic Fields */}
        <div className="col-3" style={{ backgroundColor: '#f5f5f5', borderRight: '1px solid #e0e0e0' }}>
          <div className="p-4">
            <h6 className="fw-bold mb-4">Basic Fields</h6>
            
            <div className="mb-3">
              <label className="form-label fw-medium">Name<span className="text-danger">*</span></label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Name"
                value={enterpriseForm.name}
                onChange={(e) => setEnterpriseForm({...enterpriseForm, name: e.target.value})}
                style={{ backgroundColor: '#e8e9ea', border: '1px solid #ced4da' }}
              />
              <small className="text-muted">0/30</small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">Visible For<span className="text-danger">*</span></label>
              <div className="position-relative">
                <div 
                  className="form-control d-flex justify-content-between align-items-center"
                  style={{ backgroundColor: '#e8e9ea', border: '1px solid #ced4da', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVisibleForDropdown(!showVisibleForDropdown);
                  }}
                >
                  <span className="text-truncate">
                    {formatSelectedItems(enterpriseForm.visibleFor, 'Select Counselors')}
                  </span>
                  <span>{showVisibleForDropdown ? '▲' : '▼'}</span>
                </div>
                
                {showVisibleForDropdown && (
                  <div 
                    className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
                    style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {availableCounselors.map((counselor, index) => (
                      <div key={index} className="p-2 border-bottom">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id={`enterprise-counselor-${index}`}
                            checked={enterpriseForm.visibleFor.includes(counselor)}
                            onChange={() => handleEnterpriseVisibleForChange(counselor)}
                          />
                          <label className="form-check-label" htmlFor={`enterprise-counselor-${index}`}>
                            {counselor}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">Category<span className="text-danger">*</span></label>
              <div className="position-relative">
                <div 
                  className="form-control d-flex justify-content-between align-items-center"
                  style={{ backgroundColor: '#e8e9ea', border: '1px solid #ced4da', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCategoryDropdown(!showCategoryDropdown);
                  }}
                >
                  <span className="text-truncate">
                    {formatSelectedItems(enterpriseForm.category, 'Select Categories')}
                  </span>
                  <span>{showCategoryDropdown ? '▲' : '▼'}</span>
                </div>
                
                {showCategoryDropdown && (
                  <div 
                    className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
                    style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {availableCategories.map((category, index) => (
                      <div key={index} className="p-2 border-bottom">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id={`enterprise-category-${index}`}
                            checked={enterpriseForm.category.includes(category)}
                            onChange={() => handleEnterpriseCategoryChange(category)}
                          />
                          <label className="form-check-label" htmlFor={`enterprise-category-${index}`}>
                            {category}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">Language<span className="text-danger">*</span></label>
              <div className="position-relative">
                <div 
                  className="form-control d-flex justify-content-between align-items-center"
                  style={{ backgroundColor: '#e8e9ea', border: '1px solid #ced4da', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLanguageDropdown(!showLanguageDropdown);
                  }}
                >
                  <span className="text-truncate">
                    {formatSelectedItems(enterpriseForm.language, 'Select Languages')}
                  </span>
                  <span>{showLanguageDropdown ? '▲' : '▼'}</span>
                </div>
                
                {showLanguageDropdown && (
                  <div 
                    className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
                    style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {availableLanguages.map((language, index) => (
                      <div key={index} className="p-2 border-bottom">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id={`enterprise-language-${index}`}
                            checked={enterpriseForm.language.includes(language)}
                            onChange={() => handleEnterpriseLanguageChange(language)}
                          />
                          <label className="form-check-label" htmlFor={`enterprise-language-${index}`}>
                            {language}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Template */}
        <div className="col-6" style={{ backgroundColor: 'white', borderRight: '1px solid #e0e0e0' }}>
          <div className="p-4">
            <div className="d-flex align-items-center mb-4">
              <h6 className="fw-bold mb-0 me-2">Template</h6>
              <span className="text-muted">ℹ️</span>
            </div>

            {/* Header Section */}
            <div className="mb-4">
              <h6 className="fw-medium mb-3">Header</h6>
              <p className="text-muted small mb-3">Add a title or choose which type of media you'll use for this header.</p>
              
              <div className="mb-3">
                <label className="form-label">Type</label>
                <select 
                  className="form-select"
                  value={enterpriseForm.headerType}
                  onChange={(e) => setEnterpriseForm({...enterpriseForm, headerType: e.target.value})}
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da' }}
                >
                  <option value="None">✕ None</option>
                  <option value="Text">Text</option>
                  <option value="Image">Image</option>
                  <option value="Video">Video</option>
                </select>
              </div>
            </div>

            {/* Body Section */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-medium mb-0">Body<span className="text-danger">*</span></h6>
                <div className="position-relative">
                  <small 
                    className="text-warning" 
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTokenDropdown(!showTokenDropdown);
                    }}
                  >
                    + Add Token
                  </small>
                  
                  {showTokenDropdown && (
                    <div 
                      className="position-absolute bg-white border rounded shadow-sm mt-1" 
                      style={{ 
                        zIndex: 1000, 
                        minWidth: '300px', 
                        maxHeight: '300px', 
                        overflowY: 'auto',
                        right: 0,
                        top: '100%'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-3">
                        <div className="mb-3">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search tokens..."
                            value={tokenSearch}
                            onChange={(e) => setTokenSearch(e.target.value)}
                            style={{ fontSize: '12px' }}
                          />
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted fw-bold">Available Tokens:</small>
                        </div>
                        
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {filteredTokens.map((token, index) => (
                            <div key={index} className="p-2 border-bottom">
                              <div className="form-check">
                                <input 
                                  className="form-check-input" 
                                  type="checkbox" 
                                  id={`enterprise-token-${index}`}
                                  checked={enterpriseForm.selectedTokens.includes(token)}
                                  onChange={() => handleEnterpriseTokenChange(token)}
                                />
                                <label className="form-check-label" htmlFor={`enterprise-token-${index}`}>
                                  <code style={{ fontSize: '11px', backgroundColor: '#f8f9fa', padding: '2px 4px', borderRadius: '3px' }}>
                                    {token}
                                  </code>
                                </label>
                              </div>
                            </div>
                          ))}
                          
                          {filteredTokens.length === 0 && (
                            <div className="p-2 text-muted text-center">
                              <small>No tokens found</small>
                            </div>
                          )}
                        </div>
                        
                        {enterpriseForm.selectedTokens.length > 0 && (
                          <div className="mt-3 pt-2 border-top">
                            <small className="text-muted fw-bold">Selected: </small>
                            <div className="mt-1">
                              {enterpriseForm.selectedTokens.map((token, index) => (
                                <span 
                                  key={index}
                                  className="badge bg-primary me-1 mb-1"
                                  style={{ fontSize: '10px' }}
                                >
                                  {token}
                                  <button
                                    type="button"
                                    className="btn-close btn-close-white ms-1"
                                    style={{ fontSize: '8px' }}
                                    onClick={() => handleEnterpriseTokenChange(token)}
                                  ></button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-muted small mb-3">Enter the text for your message.</p>
              
              <div className="mb-2">
                <textarea 
                  className="form-control"
                  placeholder="Enter text"
                  rows={8}
                  value={enterpriseForm.bodyText}
                  onChange={(e) => setEnterpriseForm({...enterpriseForm, bodyText: e.target.value})}
                  style={{ 
                    backgroundColor: '#f8f9fa', 
                    border: '1px solid #ced4da', 
                    resize: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px', fontSize: '14px' }}
                  >
                    😊
                  </button>
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px', fontWeight: 'bold' }}
                  >
                    B
                  </button>
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px', fontStyle: 'italic' }}
                  >
                    I
                  </button>
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px', textDecoration: 'line-through' }}
                  >
                    S
                  </button>
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '36px', height: '32px', fontSize: '12px' }}
                  >
                    &lt;/&gt;
                  </button>
                </div>
                <small className="text-muted">{enterpriseForm.bodyText.length}/1024</small>
              </div>
            </div>

            {/* Footer Section */}
            <div className="mb-4">
              <h6 className="fw-medium mb-3">Footer</h6>
              <p className="text-muted small mb-3">Add a short line of text to the bottom of your message template.</p>
              
              <textarea 
                className="form-control"
                placeholder="Enter text"
                rows={2}
                value={enterpriseForm.footerText}
                onChange={(e) => setEnterpriseForm({...enterpriseForm, footerText: e.target.value})}
                style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da', resize: 'none' }}
              />
              <div className="d-flex justify-content-end mt-1">
                <small className="text-muted">0/60</small>
              </div>
            </div>

            {/* Buttons Section */}
            <div className="mb-4">
              <h6 className="fw-medium mb-3">Buttons</h6>
              <p className="text-muted small mb-3">Create buttons that let customers respond to your message or take action.</p>
              
              <select 
                className="form-select mb-3"
                value={enterpriseForm.footerButton}
                onChange={(e) => setEnterpriseForm({...enterpriseForm, footerButton: e.target.value})}
                style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da' }}
              >
                <option value="">Select Footer Button</option>
                <option value="Call">Call To Action</option>
                <option value="QuickReply">Quick Reply</option>
              </select>

              {/* Call To Action Fields */}
              {enterpriseForm.footerButton === 'Call' && (
                <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">Type Of Action</label>
                      <select 
                        className="form-select"
                        value={enterpriseForm.actionType}
                        onChange={(e) => setEnterpriseForm({...enterpriseForm, actionType: e.target.value})}
                        style={{ backgroundColor: 'white', border: '1px solid #ced4da' }}
                      >
                        <option value="Call Phone Number">Call Phone Number</option>
                        <option value="Visit Website">Visit Website</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">Button Text</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Button Text"
                        value={enterpriseForm.actionType === 'Call Phone Number' ? enterpriseForm.callButtonText : enterpriseForm.websiteButtonText}
                        onChange={(e) => {
                          if (enterpriseForm.actionType === 'Call Phone Number') {
                            setEnterpriseForm({...enterpriseForm, callButtonText: e.target.value});
                          } else {
                            setEnterpriseForm({...enterpriseForm, websiteButtonText: e.target.value});
                          }
                        }}
                        maxLength={25}
                        style={{ backgroundColor: 'white', border: '1px solid #ced4da' }}
                      />
                      <small className="text-muted">
                        {enterpriseForm.actionType === 'Call Phone Number' ? enterpriseForm.callButtonText.length : enterpriseForm.websiteButtonText.length}/25
                      </small>
                    </div>
                  </div>
                  
                  {/* Call Phone Number ke fields */}
                  {enterpriseForm.actionType === 'Call Phone Number' && (
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">Country</label>
                        <select 
                          className="form-select"
                          value={enterpriseForm.callCountry}
                          onChange={(e) => setEnterpriseForm({...enterpriseForm, callCountry: e.target.value})}
                          style={{ backgroundColor: 'white', border: '1px solid #ced4da' }}
                        >
                          <option value="">Select Country</option>
                          {availableCountries.map((country, index) => (
                            <option key={index} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">Phone Number</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          placeholder="Phone Number"
                          value={enterpriseForm.callPhoneNumber}
                          onChange={(e) => setEnterpriseForm({...enterpriseForm, callPhoneNumber: e.target.value})}
                          maxLength={20}
                          style={{ backgroundColor: 'white', border: '1px solid #ced4da' }}
                        />
                        <small className="text-muted">{enterpriseForm.callPhoneNumber.length}/20</small>
                      </div>
                    </div>
                  )}
                  
                  {/* Visit Website ke fields */}
                  {enterpriseForm.actionType === 'Visit Website' && (
                    <div className="row">
                      <div className="col-12 mb-3">
                        <label className="form-label fw-medium">Website URL</label>
                        <input 
                          type="url" 
                          className="form-control" 
                          placeholder="https://example.com"
                          value={enterpriseForm.websiteURL}
                          onChange={(e) => setEnterpriseForm({...enterpriseForm, websiteURL: e.target.value})}
                          maxLength={2000}
                          style={{ backgroundColor: 'white', border: '1px solid #ced4da' }}
                        />
                        <small className="text-muted">{enterpriseForm.websiteURL.length}/2000</small>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Reply Fields */}
              {enterpriseForm.footerButton === 'QuickReply' && (
                <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  {enterpriseForm.quickReplies.map((quickReply, index) => (
                    <div key={quickReply.id} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-medium mb-0">Quick Reply {index + 1}</h6>
                        {enterpriseForm.quickReplies.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeQuickReply(quickReply.id)}
                            style={{ width: '24px', height: '24px', padding: '0', fontSize: '12px' }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="mb-2">
                        <label className="form-label fw-medium">Button Text</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Button Text"
                          value={quickReply.text}
                          onChange={(e) => updateQuickReplyText(quickReply.id, e.target.value)}
                          maxLength={20}
                          style={{ backgroundColor: 'white', border: '1px solid #ced4da' }}
                        />
                        <small className="text-muted">{quickReply.text.length}/20</small>
                      </div>
                    </div>
                  ))}
                  
                  {enterpriseForm.quickReplies.length < 3 && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={addQuickReply}
                    >
                      + Add Quick Reply
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="col-3" style={{ backgroundColor: '#f5f5f5' }}>
          <div className="p-4">
            <h6 className="fw-bold mb-4">Preview</h6>
            
            <div className="bg-white rounded p-3 shadow-sm">
              <div className="d-flex justify-content-end mb-2">
                <small className="text-muted">05:04 pm</small>
              </div>
              
              <div style={{ backgroundColor: '#e8e9ea', borderRadius: '15px', padding: '20px', minHeight: '200px' }}>
                <div className="text-center text-muted">
                  📱
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="row g-0">
        <div className="col-12" style={{ backgroundColor: 'white', borderTop: '1px solid #e0e0e0' }}>
          <div className="d-flex justify-content-between align-items-center p-3">
            <button 
              className="btn btn-outline-secondary px-4"
              onClick={handleBackToList}
            >
              Cancel
            </button>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-primary px-4"
                onClick={() => setCurrentView('non-enterprise')}
              >
                Switch to Non-Enterprise
              </button>
              <button 
                className="btn px-4"
                style={{ backgroundColor: '#ff8c42', color: 'white', border: 'none' }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNonEnterpriseTemplate = () => (
    <div className="container-fluid p-0" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header with Back Button */}
      <div className="row g-0">
        <div className="col-12" style={{ backgroundColor: 'white', borderBottom: '1px solid #e0e0e0' }}>
          <div className="d-flex justify-content-between align-items-center p-3">
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-outline-secondary me-3"
                onClick={handleBackToList}
                style={{ borderRadius: '8px' }}
              >
                ← Back
              </button>
              <h5 className="mb-0 fw-bold">Create Non-Enterprise Template</h5>
            </div>
            <div className="d-flex align-items-center">
              <span className="fs-4 me-3" style={{ color: '#ff6b35' }}>⚡</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-0">
        {/* Basic Fields */}
        <div className="col-3" style={{ backgroundColor: '#f5f5f5', borderRight: '1px solid #e0e0e0' }}>
          <div className="p-4">
            <h6 className="fw-bold mb-4">Basic Fields</h6>
            
            <div className="mb-3">
              <label className="form-label fw-medium">Name<span className="text-danger">*</span></label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Name"
                value={nonEnterpriseForm.name}
                onChange={(e) => setNonEnterpriseForm({...nonEnterpriseForm, name: e.target.value})}
                style={{ backgroundColor: '#e8e9ea', border: '1px solid #ced4da' }}
              />
              <small className="text-muted">0/30</small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">Visible For<span className="text-danger">*</span></label>
              <div className="position-relative">
                <div 
                  className="form-control d-flex justify-content-between align-items-center"
                  style={{ backgroundColor: '#e8e9ea', border: '1px solid #ced4da', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNonEnterpriseDropdown(!showNonEnterpriseDropdown);
                  }}
                >
                  <span className="text-truncate">
                    {formatSelectedItems(nonEnterpriseForm.visibleFor, 'Select Counselors')}
                  </span>
                  <span>{showNonEnterpriseDropdown ? '▲' : '▼'}</span>
                </div>
                
                {showNonEnterpriseDropdown && (
                  <div 
                    className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
                    style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {availableCounselors.map((counselor, index) => (
                      <div key={index} className="p-2 border-bottom">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id={`non-enterprise-counselor-${index}`}
                            checked={nonEnterpriseForm.visibleFor.includes(counselor)}
                            onChange={() => handleNonEnterpriseVisibleForChange(counselor)}
                          />
                          <label className="form-check-label" htmlFor={`non-enterprise-counselor-${index}`}>
                            {counselor}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Template */}
        <div className="col-6" style={{ backgroundColor: 'white', borderRight: '1px solid #e0e0e0' }}>
          <div className="p-4">
            <div className="d-flex align-items-center mb-4">
              <h6 className="fw-bold mb-0 me-2">Template</h6>
              <span className="text-muted">ℹ️</span>
            </div>

            {/* Body Section */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-medium mb-0">Body<span className="text-danger">*</span></h6>
                <div className="position-relative">
                  <small 
                    className="text-warning" 
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNonEnterpriseTokenDropdown(!showNonEnterpriseTokenDropdown);
                    }}
                  >
                    + Add Token
                  </small>
                  
                  {showNonEnterpriseTokenDropdown && (
                    <div 
                      className="position-absolute bg-white border rounded shadow-sm mt-1" 
                      style={{ 
                        zIndex: 1000, 
                        minWidth: '300px', 
                        maxHeight: '300px', 
                        overflowY: 'auto',
                        right: 0,
                        top: '100%'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-3">
                        <div className="mb-3">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search tokens..."
                            value={nonEnterpriseTokenSearch}
                            onChange={(e) => setNonEnterpriseTokenSearch(e.target.value)}
                            style={{ fontSize: '12px' }}
                          />
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted fw-bold">Available Tokens:</small>
                        </div>
                        
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {filteredNonEnterpriseTokens.map((token, index) => (
                            <div key={index} className="p-2 border-bottom">
                              <div className="form-check">
                                <input 
                                  className="form-check-input" 
                                  type="checkbox" 
                                  id={`non-enterprise-token-${index}`}
                                  checked={nonEnterpriseForm.selectedTokens.includes(token)}
                                  onChange={() => handleNonEnterpriseTokenChange(token)}
                                />
                                <label className="form-check-label" htmlFor={`non-enterprise-token-${index}`}>
                                  <code style={{ fontSize: '11px', backgroundColor: '#f8f9fa', padding: '2px 4px', borderRadius: '3px' }}>
                                    {token}
                                  </code>
                                </label>
                              </div>
                            </div>
                          ))}
                          
                          {filteredNonEnterpriseTokens.length === 0 && (
                            <div className="p-2 text-muted text-center">
                              <small>No tokens found</small>
                            </div>
                          )}
                        </div>
                        
                        {nonEnterpriseForm.selectedTokens.length > 0 && (
                          <div className="mt-3 pt-2 border-top">
                            <small className="text-muted fw-bold">Selected: </small>
                            <div className="mt-1">
                              {nonEnterpriseForm.selectedTokens.map((token, index) => (
                                <span 
                                  key={index}
                                  className="badge bg-primary me-1 mb-1"
                                  style={{ fontSize: '10px' }}
                                >
                                  {token}
                                  <button
                                    type="button"
                                    className="btn-close btn-close-white ms-1"
                                    style={{ fontSize: '8px' }}
                                    onClick={() => handleNonEnterpriseTokenChange(token)}
                                  ></button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-muted small mb-3">Enter the text for your message.</p>
              
              <div className="mb-2">
                <textarea 
                  className="form-control"
                  placeholder="Enter text"
                  rows={10}
                  value={nonEnterpriseForm.bodyText}
                  onChange={(e) => setNonEnterpriseForm({...nonEnterpriseForm, bodyText: e.target.value})}
                  style={{ 
                    backgroundColor: '#f8f9fa', 
                    border: '1px solid #ced4da', 
                    resize: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px', fontSize: '14px' }}
                  >
                    😊
                  </button>
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px', fontWeight: 'bold' }}
                  >
                    B
                  </button>
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px', fontStyle: 'italic' }}
                  >
                    I
                  </button>
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px', textDecoration: 'line-through' }}
                  >
                    S
                  </button>
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '36px', height: '32px', fontSize: '12px' }}
                  >
                    &lt;/&gt;
                  </button>
                </div>
                <small className="text-muted">{nonEnterpriseForm.bodyText.length}/3000</small>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="col-3" style={{ backgroundColor: '#f5f5f5' }}>
          <div className="p-4">
            <h6 className="fw-bold mb-4">Preview</h6>
            
            <div className="bg-white rounded p-3 shadow-sm">
              <div className="d-flex justify-content-end mb-2">
                <small className="text-muted">05:07 pm</small>
              </div>
              
              <div style={{ backgroundColor: '#e8e9ea', borderRadius: '15px', padding: '20px', minHeight: '200px' }}>
                <div className="text-center text-muted">
                  📱
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="row g-0">
        <div className="col-12" style={{ backgroundColor: 'white', borderTop: '1px solid #e0e0e0' }}>
          <div className="d-flex justify-content-between align-items-center p-3">
            <button 
              className="btn btn-outline-secondary px-4"
              onClick={handleBackToList}
            >
              Cancel
            </button>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-primary px-4"
                onClick={() => setCurrentView('enterprise')}
              >
                Switch to Enterprise
              </button>
              <button 
                className="btn px-4"
                style={{ backgroundColor: '#ff8c42', color: 'white', border: 'none' }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render logic
  if (currentView === 'enterprise') {
    return renderEnterpriseTemplate();
  }
  
  if (currentView === 'non-enterprise') {
    return renderNonEnterpriseTemplate();
  }
  
  return renderTemplateList();
};

export default WhatsAppTemplate;

// Media Query CSS for Mobile Responsiveness
const mobileStyles = `
  @media (max-width: 768px) {
   
    /* Header adjustments */
    .d-flex.justify-content-between {
      // flex-direction: column;
      gap: 1rem;
    }
    
    .d-flex.align-items-center {
      // flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    /* Search input responsive */
    .input-group {
      width: 100% !important;
      max-width: 100%;
    }
    
    /* Table responsive */
    .table-responsive {
      font-size: 0.875rem;
    }
    
    .table th,
    .table td {
      padding: 0.5rem 0.25rem !important;
      font-size: 0.75rem;
    }
    
    /* Action buttons in table */
    .d-flex.gap-2 {
      flex-direction: column;
      gap: 0.25rem !important;
    }
    
    .btn-sm {
      width: 100% !important;
      height: 28px !important;
      font-size: 12px;
    }
    
    /* Enterprise Template Layout */
    .row.g-0 .col-3,
    .row.g-0 .col-6 {
      width: 100% !important;
      flex: 0 0 100% !important;
      max-width: 100% !important;
    }
    
    /* Stack columns vertically on mobile */
    .row.g-0 {
      flex-direction: column !important;
    }
    
    /* Basic Fields Section */
    .col-3[style*="background-color: #f5f5f5"] {
      border-right: none !important;
      border-bottom: 1px solid #e0e0e0 !important;
      margin-bottom: 1rem;
    }
    
    /* Template Section */
    .col-6[style*="background-color: white"] {
      border-right: none !important;
      border-bottom: 1px solid #e0e0e0 !important;
      margin-bottom: 1rem;
    }
    
    /* Preview Section */
    .col-3[style*="background-color: #f5f5f5"]:last-child {
      border-bottom: none !important;
    }
    
    /* Form controls responsive */
    .form-control,
    .form-select {
      font-size: 0.875rem;
    }
    
    /* Dropdown positioning */
    .position-absolute {
      position: relative !important;
      width: 100% !important;
      max-width: 100% !important;
      right: auto !important;
      left: auto !important;
      top: auto !important;
      margin-top: 0.5rem;
    }
    
    /* Token dropdown */
    .position-absolute[style*="minWidth: 300px"] {
      min-width: 100% !important;
      max-width: 100% !important;
    }
    
    /* Textarea responsive */
    textarea {
      min-height: 120px !important;
    }
    
    /* Button groups responsive */
    .d-flex.gap-2:not(.table .d-flex.gap-2) {
      flex-wrap: wrap;
      gap: 0.5rem !important;
    }
    
    /* Call to Action fields */
    .row .col-md-6 {
      width: 100% !important;
      flex: 0 0 100% !important;
      max-width: 100% !important;
    }
    
    /* Quick Reply buttons */
    .btn-outline-primary.btn-sm {
      width: 100% !important;
    }
    
    /* Action buttons at bottom */
    .d-flex.justify-content-between:last-child {
      // flex-direction: column !important;
      gap: 1rem;
    }
    
    .d-flex.gap-2:last-child {
      width: 100%;
      justify-content: center;
    }
    
    .btn.px-4 {
      width: 100% !important;
      padding: 0.75rem 1rem !important;
    }
    
    /* Header buttons responsive */
    .btn-outline-primary,
    .btn-outline-warning,
    .btn-outline-success {
      padding: 0.5rem !important;
      font-size: 0.875rem;
    }
    
    /* Dropdown menu responsive */
    .dropdown-menu {
      width: 100% !important;
      max-width: 100% !important;
    }
    
    /* Badge responsive */
    .badge {
      font-size: 0.7rem !important;
      padding: 0.25rem 0.5rem !important;
    }
    
    /* Small text responsive */
    small {
      font-size: 0.75rem;
    }
    
    /* Form labels */
    .form-label {
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }
    
    /* Card responsive */
    .card {
      margin: 0 !important;
      border-radius: 8px !important;
    }
    
    /* Preview section adjustments */
    .bg-white.rounded.p-3.shadow-sm {
      padding: 1rem !important;
    }
    
    /* Emoji buttons responsive */
    .btn[style*="width: 32px"] {
      width: 28px !important;
      height: 28px !important;
      font-size: 12px !important;
    }
    
    .btn[style*="width: 36px"] {
      width: 32px !important;
      height: 28px !important;
      font-size: 10px !important;
    }
  }
  
  @media (max-width: 576px) {
    /* Extra small devices */
    .container-fluid {
      padding: 0.25rem !important;
    }
    
    .p-4 {
      padding: 1rem !important;
    }
    
    .p-3 {
      padding: 0.75rem !important;
    }
    
    .mb-4 {
      margin-bottom: 1rem !important;
    }
    
    .mb-3 {
      margin-bottom: 0.75rem !important;
    }
    
    /* Table font size smaller */
    .table th,
    .table td {
      font-size: 0.7rem !important;
      padding: 0.25rem !important;
    }
    
    /* Hide less important columns on very small screens */
    .table th:nth-child(2),
    .table td:nth-child(2) {
      display: none;
    }
    
    /* Form controls smaller */
    .form-control,
    .form-select {
      font-size: 0.8rem;
      padding: 0.5rem;
    }
    
    /* Buttons smaller */
    .btn {
      font-size: 0.8rem;
      padding: 0.5rem 0.75rem;
    }
    
    /* Textarea smaller */
    textarea {
      min-height: 100px !important;
      font-size: 0.8rem;
    }
    
    /* Headers smaller */
    h5 {
      font-size: 1.1rem;
    }
    
    h6 {
      font-size: 1rem;
    }
    
    /* Icons smaller */
    .fs-4 {
      font-size: 1.5rem !important;
    }
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = mobileStyles;
  document.head.appendChild(styleSheet);
}