import React, { useState, useEffect , useRef} from 'react';
import axios from 'axios';

const WhatsAppTemplate = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'enterprise', 'non-enterprise', 'template-types'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    language: 'en',
    bodyText: '',
    headerText: '',
    footerText: '',
    headerType: 'None',
    headerImage: null,
    buttons: []
  });

  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;


  
  const closeModalRef = useRef(null);

  
  // Helper function to close modal
  const closeModal = () => {
   if(closeModalRef.current){
      closeModalRef.current.click();
   }
  };

  const closeCreateModal = () => {
    // Hide modal manually
    const modalElement = document.getElementById('createTemplateModal');
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
    
    setShowCreateModal(false);
    // Reset form only when closing
    setEditForm({
      name: '',
      category: '',
      language: 'en',
      bodyText: '',
      headerText: '',
      headerType: 'None',
      headerImage: null,
      footerText: '',
      buttons: []
    });
  };

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


  const [templates, setTemplates] = useState([

    //sampleData Structure
    // {
    //   id: 1,
    //   name: 'osda_gsa_temp',
    //   category: 'Marketing • Global',
    //   subject: '🏨 Free Hotel Management Training & 100% Job Guarantee for ...',
    //   templateType: 'Enterprise',
    //   status: 'Approved'
    // },

  ]);

  // Template types data
  const templateTypes = [
    {
      id: 1,
      name: 'Basic Text Template',
      type: 'Basic Text',
      description: 'Simple text message with variable placeholders',
      category: 'MARKETING',
      language: 'en',
      components: [
        {
          type: 'BODY',
          text: 'Hello {{first_name}}, welcome to our service!',
          example: {
            body_text: [['John']]
          }
        }
      ],
      response: {
        "name": "hello_world",
        "language": "en",
        "category": "MARKETING",
        "components": [
          {
            "type": "BODY",
            "text": "Hello {{first_name}}, welcome to our service!",
            "example": {
              "body_text": [
                ["John"]
              ]
            }
          }
        ]
      }
    },
    {
      id: 2,
      name: 'Template with Media Header',
      type: 'Media Header',
      description: 'Template with image/video header and footer text',
      category: 'MARKETING',
      language: 'en',
      components: [
        {
          type: 'HEADER',
          format: 'IMAGE'
        },
        {
          type: 'BODY',
          text: 'Dear {{first_name}}, check out our latest offers!',
          example: {
            body_text: [['Customer']]
          }
        },
        {
          type: 'FOOTER',
          text: 'Terms and conditions apply'
        }
      ],
      response: {
        "name": "promotion_template",
        "language": "en",
        "category": "MARKETING",
        "components": [
          {
            "type": "HEADER",
            "format": "IMAGE"
          },
          {
            "type": "BODY",
            "text": "Dear {{first_name}}, check out our latest offers!",
            "example": {
              "body_text": [
                ["Customer"]
              ]
            }
          },
          {
            "type": "FOOTER",
            "text": "Terms and conditions apply"
          }
        ]
      }
    },
    {
      id: 3,
      name: 'Template with Flow',
      type: 'Flow Template',
      description: 'Template with interactive flow buttons for user actions',
      category: 'UTILITY',
      language: 'en',
      components: [
        {
          type: 'BODY',
          text: 'Dear {{first_name}}, please complete your registration',
          example: {
            body_text: [['User']]
          }
        },
        {
          type: 'BUTTONS',
          buttons: [
            {
              type: 'FLOW',
              text: 'Register Now',
              flow_id: '379771255118195',
              navigate_screen: 'REGISTRATION',
              flow_action: 'NAVIGATE'
            }
          ]
        }
      ],
      response: {
        "name": "registration_flow",
        "language": "en",
        "category": "UTILITY",
        "components": [
          {
            "type": "BODY",
            "text": "Dear {{first_name}}, please complete your registration",
            "example": {
              "body_text": [
                ["User"]
              ]
            }
          },
          {
            "type": "BUTTONS",
            "buttons": [
              {
                "type": "FLOW",
                "text": "Register Now",
                "flow_id": "379771255118195",
                "navigate_screen": "REGISTRATION",
                "flow_action": "NAVIGATE"
              }
            ]
          }
        ]
      }
    }
  ];

  useEffect(() => {
    fetchWhatsappTemplates();
  }, []);

  // Handle create modal show/hide
  useEffect(() => {
    if (showCreateModal) {
      // Initialize form with default values when opening create modal
      setEditForm({
        name: '',
        category: '',
        language: 'en',
        bodyText: '',
        headerText: '',
        headerType: 'None',
        headerImage: null,
        footerText: '',
        buttons: []
      });
      
      // Use jQuery to show modal if Bootstrap Modal is not available
      const modalElement = document.getElementById('createTemplateModal');
      if (modalElement) {
        if (window.bootstrap && window.bootstrap.Modal) {
          const modal = new window.bootstrap.Modal(modalElement);
          modal.show();
        } else {
          // Fallback to manual modal show
          modalElement.classList.add('show');
          modalElement.style.display = 'block';
          document.body.classList.add('modal-open');
        }
      }
    }
  }, [showCreateModal]);

  const fetchWhatsappTemplates = async () => {
    try {
      if (!token) {
        alert('No token found in session storage.');
        return;
      }

      const response = await axios.get(`${backendUrl}/college/whatsapp/templates`, {
        headers: { 'x-auth': token }
      });



      if (response.data.success) {

        console.log("response.data.data", response.data.data)
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error);
    }
  };

  const handleSyncTemplates = async () => {
    try {
      if (!token) {
        alert('No token found in session storage.');
        return;
      }

      // Show loading state
      const syncButton = document.querySelector('[title="Sync Templates from Meta"]');
      if (syncButton) {
        syncButton.disabled = true;
        syncButton.innerHTML = '<span style="color: #17a2b8;">⏳</span>';
      }

      const response = await axios.post(`${backendUrl}/college/whatsapp/sync-templates`, {}, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        alert('Templates synced successfully from Meta!');
        // Refresh templates list
        await fetchWhatsappTemplates();
      } else {
        throw new Error(response.data.message || 'Failed to sync templates');
      }
    } catch (error) {
      console.error('Error syncing templates:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error syncing templates. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      // Reset button state
      const syncButton = document.querySelector('[title="Sync Templates from Meta"]');
      if (syncButton) {
        syncButton.disabled = false;
        syncButton.innerHTML = '<span style="color: #17a2b8;">🔄</span>';
      }
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.template?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.template?.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTemplate = (type) => {
    setCurrentView(type);
    setShowDropdown(false);
  };

  const handleViewTemplateTypes = () => {
    setCurrentView('template-types');
  };

  const handleCloneTemplate = (template) => {
    setEditingTemplate(template);
    
    // Extract template data for editing
    const templateData = template.template || template;
    const bodyComponent = templateData.components?.find(comp => comp.type === 'BODY');
    const headerComponent = templateData.components?.find(comp => comp.type === 'HEADER');
    const footerComponent = templateData.components?.find(comp => comp.type === 'FOOTER');
    const buttonsComponent = templateData.components?.find(comp => comp.type === 'BUTTONS');
    
    // Debug: Log header component details
    console.log('Header Component:', headerComponent);
    console.log('Header Format:', headerComponent?.format);
    console.log('Header Text:', headerComponent?.text);
    console.log('Header Example:', headerComponent?.example);
    console.log('Header Text from Example:', headerComponent?.example?.header_text);
    console.log('Header Text Named Params:', headerComponent?.example?.header_text_named_params);
    
    // Test header text extraction
    const extractedHeaderText = headerComponent?.text || 
                               headerComponent?.example?.header_text?.[0] || 
                               headerComponent?.example?.header_text_named_params?.[0] || 
                               '';
    console.log('Extracted Header Text:', extractedHeaderText);
    
    // Test header type mapping
    const mappedHeaderType = headerComponent?.format === 'TEXT' ? 'Text' : 
                            headerComponent?.format === 'IMAGE' ? 'IMAGE' :
                            headerComponent?.format === 'VIDEO' ? 'VIDEO' :
                            headerComponent ? 'Text' : 'None';
    console.log('Mapped Header Type:', mappedHeaderType);
    console.log('All Components:', templateData.components);
    
    setEditForm({
      name: `${templateData.name || 'template'}_copy`,
      category: templateData.category || '',
      language: templateData.language || 'en',
      bodyText: bodyComponent?.text || '',
      headerText: headerComponent?.text || 
                  headerComponent?.example?.header_text?.[0] || 
                  headerComponent?.example?.header_text_named_params?.[0] || 
                  '',
      footerText: footerComponent?.text || '',
      headerType: headerComponent?.format === 'TEXT' ? 'Text' : 
                  headerComponent?.format === 'IMAGE' ? 'IMAGE' :
                  headerComponent?.format === 'VIDEO' ? 'VIDEO' :
                  headerComponent ? 'Text' : 'None',
      headerImage: headerComponent?.example?.header_handle?.[0] || null,
      buttons: buttonsComponent?.buttons || []
    });
  };

  const addButton = () => {
    const newButton = {
      type: 'QUICK_REPLY',
      text: `Button ${editForm.buttons.length + 1}`
    };
    setEditForm({
      ...editForm,
      buttons: [...editForm.buttons, newButton]
    });
  };

  const removeButton = (index) => {
    setEditForm({
      ...editForm,
      buttons: editForm.buttons.filter((_, i) => i !== index)
    });
  };

  const updateButton = (index, field, value) => {
    const updatedButtons = editForm.buttons.map((button, i) => 
      i === index ? { ...button, [field]: value } : button
    );
    setEditForm({
      ...editForm,
      buttons: updatedButtons
    });
  };

  const createTemplate = async () => {
    try {
      if (!token) {
        alert('No token found in session storage.');
        return;
      }
      console.log("editForm", editForm)
      

      // Validate required fields
      if (!editForm.name || !editForm.category || !editForm.language || !editForm.bodyText) {
        alert('Please fill in all required fields (Name, Category, Language, and Body Text).');
        return;
      }

      // Validate body text length (WhatsApp has a limit of 1024 characters)
      if (editForm.bodyText.length > 1024) {
        alert('Body text is too long. Please keep it under 1024 characters.');
        return;
      }

      // Show loading state
      setIsCreatingTemplate(true);

      // Prepare the template data for API
      const templateData = {
          name: editForm.name,
          language: editForm.language,
        category: editForm.category,
          components: [
          ...(editForm.headerType !== 'None' && editForm.headerType === 'Text' && editForm.headerText ? [{
              type: 'HEADER',
            format: 'TEXT',
            text: editForm.headerText
          }] : []),
          ...(editForm.headerType !== 'None' && editForm.headerType === 'IMAGE' ? [{
            type: 'HEADER',
            format: 'IMAGE',
            example: {
                header_handle: editForm.headerImage ? [editForm.headerImage] : []
            }
            }] : []),
            {
              type: 'BODY',
            text: editForm.bodyText,
            ...(editForm.bodyText.includes('{{') ? {
              example: {
                body_text: [
                  ["User"]
                ]
              }
            } : {})
            },
            ...(editForm.footerText ? [{
              type: 'FOOTER',
              text: editForm.footerText
            }] : []),
            ...(editForm.buttons.length > 0 ? [{
              type: 'BUTTONS',
              buttons: editForm.buttons
            }] : [])
          ]
      };

      console.log('Template data being sent:', JSON.stringify(templateData, null, 2));

      // Make API call to create template
      const response = await axios.post(`${backendUrl}/college/whatsapp/create-template`, templateData, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        // Refresh templates list
        await fetchWhatsappTemplates();

      // Close the modal
      setEditingTemplate(null);
      setEditForm({
        name: '',
        category: '',
        language: '',
        bodyText: '',
        headerText: '',
        footerText: '',
        headerType: 'None',
        headerImage: null,
        buttons: []
      });

        alert('Template created successfully!');
        closeModal();
        closeCreateModal();
      } else {
        throw new Error(response.data.message || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      console.log('Full error response:', error.response?.data);
      
      // Extract detailed error message
      let errorMessage = 'Error creating template. Please try again.';
      
      if (error.response?.data?.error?.error_user_msg) {
        errorMessage = error.response.data.error.error_user_msg;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      // Reset loading state
      setIsCreatingTemplate(false);
    }
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

    setEnterpriseForm({ ...enterpriseForm, visibleFor: updatedSelection });
  };

  // Handle multiselect checkbox for Enterprise Category
  const handleEnterpriseCategoryChange = (category) => {
    const updatedSelection = enterpriseForm.category.includes(category)
      ? enterpriseForm.category.filter(item => item !== category)
      : [...enterpriseForm.category, category];

    setEnterpriseForm({ ...enterpriseForm, category: updatedSelection });
  };

  // Handle multiselect checkbox for Enterprise Language
  const handleEnterpriseLanguageChange = (language) => {
    const updatedSelection = enterpriseForm.language.includes(language)
      ? enterpriseForm.language.filter(item => item !== language)
      : [...enterpriseForm.language, language];

    setEnterpriseForm({ ...enterpriseForm, language: updatedSelection });
  };

  // Handle multiselect checkbox for Non-Enterprise
  const handleNonEnterpriseVisibleForChange = (counselor) => {
    const updatedSelection = nonEnterpriseForm.visibleFor.includes(counselor)
      ? nonEnterpriseForm.visibleFor.filter(item => item !== counselor)
      : [...nonEnterpriseForm.visibleFor, counselor];

    setNonEnterpriseForm({ ...nonEnterpriseForm, visibleFor: updatedSelection });
  };

  // Handle token selection for Enterprise
  const handleEnterpriseTokenChange = (token) => {
    const updatedSelection = enterpriseForm.selectedTokens.includes(token)
      ? enterpriseForm.selectedTokens.filter(item => item !== token)
      : [...enterpriseForm.selectedTokens, token];

    setEnterpriseForm({ ...enterpriseForm, selectedTokens: updatedSelection });
  };

  // Handle token selection for Non-Enterprise
  const handleNonEnterpriseTokenChange = (token) => {
    const updatedSelection = nonEnterpriseForm.selectedTokens.includes(token)
      ? nonEnterpriseForm.selectedTokens.filter(item => item !== token)
      : [...nonEnterpriseForm.selectedTokens, token];

    setNonEnterpriseForm({ ...nonEnterpriseForm, selectedTokens: updatedSelection });
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

  const renderTemplateTypes = () => (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <button
            className="btn btn-outline-secondary me-3"
            onClick={handleBackToList}
            style={{ borderRadius: '8px' }}
          >
            ← Back
          </button>
          <h4 className="mb-0 fw-bold">WhatsApp Template Types</h4>
        </div>
        <div className="d-flex align-items-center">
          <span className="fs-4 me-3" style={{ color: '#ff6b35' }}>⚡</span>
        </div>
      </div>

      {/* Template Types Table */}
      <div className="card shadow-sm" style={{ borderRadius: '12px', border: 'none' }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: '#f1f3f4' }}>
              <tr>
                <th className="fw-semibold text-muted py-3 ps-4" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  TEMPLATE TYPE
                </th>
                <th className="fw-semibold text-muted py-3" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  DESCRIPTION
                </th>
                <th className="fw-semibold text-muted py-3" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  CATEGORY
                </th>
                <th className="fw-semibold text-muted py-3" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PREVIEW
                </th>
                <th className="fw-semibold text-muted py-3 pe-4" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {templateTypes.map((template) => (
                <tr key={template.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td className="py-3 ps-4">
                    <div>
                      <div className="fw-medium text-dark">{template.name}</div>
                      <small className="text-muted">{template.type}</small>
                    </div>
                  </td>
                  <td className="py-3" style={{ maxWidth: '300px' }}>
                    <div className="text-truncate">
                      {template.description}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="badge bg-primary px-3 py-2" style={{ borderRadius: '20px', fontSize: '12px' }}>
                      {template.category}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="d-flex align-items-center">
                      <div className="me-2">
                        {template.components.map((comp, idx) => (
                          <span key={idx} className="badge bg-light text-dark me-1 mb-1" style={{ fontSize: '10px' }}>
                            {comp.type}
                          </span>
                        ))}
                      </div>
                    </div>
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
                        onClick={() => setSelectedTemplate(template)}
                        data-bs-toggle="modal" 
                        data-bs-target="#templatePreviewModal"
                        title="Preview"
                      >
                        <span style={{ color: 'white', fontSize: '14px' }}>👁️</span>
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{
                          backgroundColor: '#28a745',
                          border: 'none',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(template.response, null, 2));
                          alert('Response JSON copied to clipboard!');
                        }}
                        title="Copy Response JSON"
                      >
                        <span style={{ color: 'white', fontSize: '14px' }}>📋</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response JSON Modal */}
      <div className="modal fade" id="responseJsonModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="responseJsonModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="responseJsonModalLabel">
                API Response JSON
              </h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <pre style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '8px', 
                fontSize: '12px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {selectedTemplate ? JSON.stringify(selectedTemplate.response, null, 2) : ''}
              </pre>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedTemplate?.response, null, 2));
                  alert('Response JSON copied to clipboard!');
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplateList = () => (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <span className="fs-4 me-3" style={{ color: '#ff6b35' }}>⚡</span>
        </div>
        <div className="d-flex align-items-center">
          <button 
            className="btn btn-outline-primary me-2" 
            style={{ borderRadius: '8px' }}
            onClick={handleViewTemplateTypes}
            title="View Template Types"
          >
            <span style={{ color: '#17a2b8' }}>T</span>
          </button>
          <button 
            className="btn btn-outline-info me-2" 
            style={{ borderRadius: '8px' }}
            onClick={handleSyncTemplates}
            title="Sync Templates from Meta"
          >
            <span style={{ color: '#17a2b8' }}>🔄</span>
          </button>
       
          <div className="position-relative me-3">
            <button
              className="btn btn-outline-success"
              style={{ borderRadius: '8px' }}
              onClick={() => setShowCreateModal(true)}
            >
              <span style={{ color: '#28a745' }}>📝</span>
            </button>
           
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
                  MESSAGE
                </th>
                {/* <th className="fw-semibold text-muted py-3" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                CATEGORY
                </th> */}
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
                      <div className="fw-medium text-dark">{template?.template?.name || ""}</div>
                      <small className="text-muted">{template?.template?.category || ""}</small>
                    </div>
                  </td>
                  <td className="py-3" style={{ maxWidth: '200px' }}>
                  {/* {template?.template?.components[0]?.text || ""} */}
                    <div className="text-truncate">
                      {template?.template?.components?.find(comp => comp.type === 'BODY')?.text || 
                       template?.template?.components?.[0]?.text || 
                       template?.template?.subject || 
                       "No message content"}
                    </div>
                  </td>
                  {/* <td className="py-3">
                    <span className="text-muted">{template?.template?.category || ""}</span>
                  </td> */}
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
                      {template?.template?.status || ""}
                    </span>
                  </td>
                  <td className="py-3 pe-4">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm"
                        style={{
                          backgroundColor: '#28a745',
                          border: 'none',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={() => handleCloneTemplate(template)}
                        data-bs-toggle="modal" 
                        data-bs-target="#editTemplateModal"
                        title="Clone"
                      >
                        <span style={{ color: 'white', fontSize: '14px' }}>📋</span>
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
                        onClick={() => setSelectedTemplate(template)}
                        data-bs-toggle="modal" data-bs-target="#templatePreviewModal"
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

      {/* model  */}


      {/* <!-- Modal --> */}
      <div className="modal fade" id="templatePreviewModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="templatePreviewModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="templatePreviewModalLabel">
                {selectedTemplate?.template?.name || selectedTemplate?.name || 'Template Preview'}
              </h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="preview-template">
                <div className="preview-container">
                  <div className="message-box-arrow"></div>
                  <div className="preview-box">
                    <div className="preview-content">
                      {/* Header Media for Media Header Template */}
                      {(selectedTemplate?.template?.components?.some(comp => comp.type === 'HEADER') || 
                        selectedTemplate?.components?.some(comp => comp.type === 'HEADER')) && (
                        <div className="preview-header-media">
                          <div className="header-media-container">
                            {/* Check if header has image format */}
                            {(selectedTemplate?.template?.components?.find(comp => comp.type === 'HEADER')?.format === 'IMAGE' ||
                              selectedTemplate?.components?.find(comp => comp.type === 'HEADER')?.format === 'IMAGE') ? (
                              <img
                                src={selectedTemplate?.template?.components?.find(comp => comp.type === 'HEADER')?.example?.header_handle?.[0] ||
                                     selectedTemplate?.components?.find(comp => comp.type === 'HEADER')?.example?.header_handle?.[0] ||
                                     selectedTemplate?.template?.headerImage || 
                                     selectedTemplate?.headerImage || 
                                     selectedTemplate?.template?.components?.find(comp => comp.type === 'HEADER')?.image_url ||
                                     selectedTemplate?.components?.find(comp => comp.type === 'HEADER')?.image_url ||
                                     "https://via.placeholder.com/400x200/25D366/FFFFFF?text=Template+Image"}
                                className="image-uploaded"
                                alt="Template preview"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/400x200/25D366/FFFFFF?text=No+Image+Available";
                                }}
                              />
                            ) : (
                              /* Text Header */
                              <div className="text-header" style={{
                                padding: '12px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#495057'
                              }}>
                                {selectedTemplate?.template?.components?.find(comp => comp.type === 'HEADER')?.text ||
                                 selectedTemplate?.components?.find(comp => comp.type === 'HEADER')?.text ||
                                 'Header Text'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Body Content */}
                      <div className="preview-body">
                        {selectedTemplate?.template?.components?.find(comp => comp.type === 'BODY')?.text || 
                         selectedTemplate?.components?.find(comp => comp.type === 'BODY')?.text ||
                         selectedTemplate?.template?.components?.[0]?.text || 
                         'No content available'}
                      </div>
                      
                      {/* Footer Content */}
                      {(selectedTemplate?.template?.components?.find(comp => comp.type === 'FOOTER') || 
                        selectedTemplate?.components?.find(comp => comp.type === 'FOOTER')) && (
                        <div className="preview-footer" style={{ 
                          fontSize: '11px', 
                          color: '#666', 
                          marginTop: '8px',
                          fontStyle: 'italic'
                        }}>
                          {(selectedTemplate?.template?.components?.find(comp => comp.type === 'FOOTER') || 
                            selectedTemplate?.components?.find(comp => comp.type === 'FOOTER'))?.text}
                        </div>
                      )}
                    </div>
                    <span className="mb-3 current-time">12:15 pm</span>
                    
                    {/* Buttons for Template */}
                    {(selectedTemplate?.template?.components?.find(comp => comp.type === 'BUTTONS') || 
                      selectedTemplate?.components?.find(comp => comp.type === 'BUTTONS')) && (
                      <div className="call-to-action-btn">
                        {(() => {
                          const buttonsComponent = selectedTemplate?.template?.components?.find(comp => comp.type === 'BUTTONS') || 
                                                  selectedTemplate?.components?.find(comp => comp.type === 'BUTTONS');
                          const buttons = buttonsComponent?.buttons || [];
                          
                          return buttons.map((button, index) => (
                            <button 
                              key={index}
                              type="button" 
                              className="btn btn-sm"
                              style={{ 
                                backgroundColor: '#FFFFFF', 
                                border: '1px solid #25D366',
                                borderRadius: '20px',
                                padding: '8px 16px',
                                fontSize: '13px',
                                fontWeight: '400',
                                color: '#25D366',
                                minWidth: '120px',
                                textAlign: 'center'
                              }}
                            >
                              {button.text || `Button ${index + 1}`}
                            </button>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                  
                
                 
                </div>
              </div>
              
              {/* Template Details */}
              <div className="mt-4">
                <h6 className="fw-bold mb-3">Template Details</h6>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Name:</strong> {selectedTemplate?.template?.name || selectedTemplate?.name || 'N/A'}</p>
                    <p><strong>Category:</strong> {selectedTemplate?.template?.category || selectedTemplate?.category || 'N/A'}</p>
                    <p><strong>Language:</strong> {selectedTemplate?.template?.language || selectedTemplate?.language || 'en'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Components:</strong></p>
                    <div className="d-flex flex-wrap gap-1">
                      {(selectedTemplate?.template?.components || selectedTemplate?.components || []).map((comp, idx) => (
                        <span key={idx} className="badge bg-secondary" style={{ fontSize: '10px' }}>
                          {comp.type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Debug Info for Buttons */}
               
                
                </div>
            </div>

          </div>
        </div>
      </div>

      {/* Edit Template Modal */}
      <div className="modal fade" id="editTemplateModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="editTemplateModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="editTemplateModalLabel">
                Clone Template: {editingTemplate?.template?.name || editingTemplate?.name || 'Template'}
              </h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row">
                {/* Left Side - Form Fields */}
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-medium">Template Name<span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Template Name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      maxLength={30}
                    />
                    <small className="text-muted">{editForm.name.length}/30</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Category<span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="UTILITY">Utility</option>
                      <option value="AUTHENTICATION">Authentication</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Language<span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={editForm.language}
                      onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="bn">Bengali</option>
                      <option value="te">Telugu</option>
                      <option value="mr">Marathi</option>
                      <option value="ta">Tamil</option>
                      <option value="gu">Gujarati</option>
                      <option value="kn">Kannada</option>
                      <option value="or">Odia</option>
                      <option value="pa">Punjabi</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Header Type</label>
                    <select
                      className="form-select"
                      value={editForm.headerType}
                      onChange={(e) => setEditForm({ ...editForm, headerType: e.target.value })}
                    >
                      <option value="None">None</option>
                      <option value="Text">Text</option>
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                    </select>
                  </div>

                  {editForm.headerType === 'Text' && (
                    <div className="mb-3">
                      <label className="form-label fw-medium">Header Text</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Header Text"
                        value={editForm.headerText}
                        onChange={(e) => setEditForm({ ...editForm, headerText: e.target.value })}
                        maxLength={60}
                      />
                      <small className="text-muted">{editForm.headerText.length}/60</small>
                    </div>
                  )}

                  {editForm.headerType === 'IMAGE' && (
                    <div className="mb-3">
                      <label className="form-label fw-medium">Header Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://example.com/image.jpg"
                        value={editForm.headerImage || ''}
                        onChange={(e) => setEditForm({ ...editForm, headerImage: e.target.value })}
                      />
                      {editForm.headerImage && editForm.headerImage.trim() !== '' && (
                        <div className="mt-2">
                          <small className="text-muted d-block mb-1">Preview:</small>
                          <img 
                            src={editForm.headerImage} 
                            alt="Header preview" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '150px', 
                              objectFit: 'contain',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              backgroundColor: '#f8f9fa'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              console.log('Image failed to load:', editForm.headerImage);
                            }}
                            onLoad={() => console.log('Image loaded successfully:', editForm.headerImage)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-medium">Body Text<span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      placeholder="Enter message body"
                      rows={6}
                      value={editForm.bodyText}
                      onChange={(e) => setEditForm({ ...editForm, bodyText: e.target.value })}
                      maxLength={1024}
                    />
                    <small className="text-muted">{editForm.bodyText.length}/1024</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Footer Text</label>
                    <textarea
                      className="form-control"
                      placeholder="Enter footer text (optional)"
                      rows={2}
                      value={editForm.footerText}
                      onChange={(e) => setEditForm({ ...editForm, footerText: e.target.value })}
                      maxLength={60}
                    />
                    <small className="text-muted">{editForm.footerText.length}/60</small>
                  </div>

                  {/* Buttons Section */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-medium mb-0">Buttons</label>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={addButton}
                        disabled={editForm.buttons.length >= 3}
                      >
                        + Add Button
                      </button>
                    </div>
                    
                    {editForm.buttons.map((button, index) => (
                      <div key={index} className="border rounded p-3 mb-2" style={{ backgroundColor: '#f8f9fa' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="fw-medium mb-0">Button {index + 1}</h6>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removeButton(index)}
                            style={{ width: '24px', height: '24px', padding: '0', fontSize: '12px' }}
                          >
                            ×
                          </button>
                        </div>
                        
                        <div className="row">
                          <div className="col-md-6 mb-2">
                            <label className="form-label fw-medium">Button Type</label>
                            <select
                              className="form-select form-select-sm"
                              value={button.type}
                              onChange={(e) => updateButton(index, 'type', e.target.value)}
                            >
                              <option value="QUICK_REPLY">Quick Reply</option>
                              <option value="FLOW">Flow</option>
                              <option value="URL">URL</option>
                              <option value="PHONE_NUMBER">Phone Number</option>
                            </select>
                          </div>
                          <div className="col-md-6 mb-2">
                            <label className="form-label fw-medium">Button Text</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Button Text"
                              value={button.text}
                              onChange={(e) => updateButton(index, 'text', e.target.value)}
                              maxLength={25}
                            />
                            <small className="text-muted">{button.text.length}/25</small>
                          </div>
                        </div>
                        
                        {button.type === 'URL' && (
                          <div className="mb-2">
                            <label className="form-label fw-medium">URL</label>
                            <input
                              type="url"
                              className="form-control form-control-sm"
                              placeholder="https://example.com"
                              value={button.url || ''}
                              onChange={(e) => updateButton(index, 'url', e.target.value)}
                            />
                          </div>
                        )}
                        
                        {button.type === 'PHONE_NUMBER' && (
                          <div className="mb-2">
                            <label className="form-label fw-medium">Phone Number</label>
                            <input
                              type="tel"
                              className="form-control form-control-sm"
                              placeholder="+1234567890"
                              value={button.phone_number || ''}
                              onChange={(e) => updateButton(index, 'phone_number', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {editForm.buttons.length === 0 && (
                      <div className="text-center text-muted py-3">
                        <small>No buttons added. Click "Add Button" to add quick reply buttons.</small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Preview */}
                <div className="col-md-6">
                  <h6 className="fw-bold mb-3">Preview</h6>
                  <div className="preview-template">
                    <div className="preview-container">
                      <div className="message-box-arrow"></div>
                      <div className="preview-box">
                        <div className="preview-content">
                          {/* Header Preview */}
                          {editForm.headerType !== 'None' && (
                            <div className="preview-header-media">
                              <div className="header-media-container">
                                {editForm.headerType === 'IMAGE' && editForm.headerImage && editForm.headerImage.trim() !== '' ? (
                                  <img
                                    src={editForm.headerImage}
                                    className="image-uploaded"
                                    alt="Header preview"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      console.log('Preview image failed to load:', editForm.headerImage);
                                    }}
                                    onLoad={() => console.log('Preview image loaded successfully:', editForm.headerImage)}
                                  />
                                ) : editForm.headerType === 'Text' ? (
                                  <div className="text-header" style={{
                                    padding: '12px',
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #e9ecef',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#495057'
                                  }}>
                                    {editForm.headerText || 'Header Text'}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          )}
                          
                          {/* Body Preview */}
                          <div className="preview-body">
                            {editForm.bodyText || 'Enter your message body...'}
                          </div>
                          
                          {/* Footer Preview */}
                          {editForm.footerText && (
                            <div className="preview-footer" style={{ 
                              fontSize: '11px', 
                              color: '#666', 
                              marginTop: '8px',
                              fontStyle: 'italic'
                            }}>
                              {editForm.footerText}
                            </div>
                          )}
                        </div>
                        <span className="mb-3 current-time">12:15 pm</span>
                        
                        {/* Buttons Preview */}
                        {editForm.buttons.length > 0 && (
                          <div className="call-to-action-btn">
                            {editForm.buttons.map((button, index) => (
                              <button 
                                key={index}
                                type="button" 
                                className="btn btn-sm"
                                style={{ 
                                  backgroundColor: '#FFFFFF', 
                                  border: '1px solid #25D366',
                                  borderRadius: '20px',
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  fontWeight: '400',
                                  color: '#25D366',
                                  minWidth: '120px',
                                  textAlign: 'center'
                                }}
                              >
                                {button.text || `Button ${index + 1}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" ref={closeModalRef}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={createTemplate} disabled={isCreatingTemplate}>
                Duplicate
              </button>
            </div>

            {/* Loading Overlay */}
            {isCreatingTemplate && (
              <div 
                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 1050,
                  borderRadius: '0.375rem'
                }}
              >
                <div className="text-center">
                  <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h5 className="text-muted">Creating Template...</h5>
                  <p className="text-muted mb-0">Please wait while we create your template</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Template Modal */}
      <div 
        className="modal fade" 
        id="createTemplateModal" 
        data-bs-backdrop="static" 
        data-bs-keyboard="false" 
        tabIndex="-1" 
        aria-labelledby="createTemplateModalLabel" 
        aria-hidden="true"
        onClick={(e) => {
          if (e.target.id === 'createTemplateModal') {
            closeCreateModal();
          }
        }}
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="createTemplateModalLabel">
                Create New Template
              </h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={closeCreateModal}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                {/* Left Side - Form Fields */}
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-medium">Template Name<span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Template Name"
                      value={editForm.name}
                      onChange={(e) => {
                        const formattedName = e.target.value
                          .toLowerCase()           // Convert to lowercase
                          .replace(/\s+/g, '_')    // Replace spaces with underscores
                          .replace(/[^a-z0-9_]/g, ''); // Remove special characters except underscore
                        setEditForm({ ...editForm, name: formattedName });
                      }}
                      maxLength={30}
                    />
                    <small className="text-muted">{editForm.name.length}/30</small>
                    <small className="text-muted d-block mt-1">Template name will be converted to lowercase with underscores</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Category<span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="UTILITY">Utility</option>
                      <option value="AUTHENTICATION">Authentication</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Language<span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={editForm.language}
                      onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="bn">Bengali</option>
                      <option value="te">Telugu</option>
                      <option value="mr">Marathi</option>
                      <option value="ta">Tamil</option>
                      <option value="gu">Gujarati</option>
                      <option value="kn">Kannada</option>
                      <option value="or">Odia</option>
                      <option value="pa">Punjabi</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Header Type</label>
                    <select
                      className="form-select"
                      value={editForm.headerType}
                      onChange={(e) => setEditForm({ ...editForm, headerType: e.target.value })}
                    >
                      <option value="None">None</option>
                      <option value="Text">Text</option>
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                    </select>
                  </div>

                  {editForm.headerType === 'Text' && (
                    <div className="mb-3">
                      <label className="form-label fw-medium">Header Text</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Header Text"
                        value={editForm.headerText}
                        onChange={(e) => setEditForm({ ...editForm, headerText: e.target.value })}
                        maxLength={60}
                      />
                      <small className="text-muted">{editForm.headerText.length}/60</small>
                    </div>
                  )}

                  {editForm.headerType === 'IMAGE' && (
                    <div className="mb-3">
                      <label className="form-label fw-medium">Header Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://example.com/image.jpg"
                        value={editForm.headerImage || ''}
                        onChange={(e) => setEditForm({ ...editForm, headerImage: e.target.value })}
                      />
                      {editForm.headerImage && editForm.headerImage.trim() !== '' && (
                        <div className="mt-2">
                          <small className="text-muted d-block mb-1">Preview:</small>
                          <img 
                            src={editForm.headerImage} 
                            alt="Header preview" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '150px', 
                              objectFit: 'contain',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              backgroundColor: '#f8f9fa'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              console.log('Image failed to load:', editForm.headerImage);
                            }}
                            onLoad={() => console.log('Image loaded successfully:', editForm.headerImage)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-medium">Body Text<span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      placeholder="Enter message body"
                      rows={6}
                      value={editForm.bodyText}
                      onChange={(e) => setEditForm({ ...editForm, bodyText: e.target.value })}
                      maxLength={1024}
                    />
                    <small className="text-muted">{editForm.bodyText.length}/1024</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Footer Text</label>
                    <textarea
                      className="form-control"
                      placeholder="Enter footer text (optional)"
                      rows={2}
                      value={editForm.footerText}
                      onChange={(e) => setEditForm({ ...editForm, footerText: e.target.value })}
                      maxLength={60}
                    />
                    <small className="text-muted">{editForm.footerText.length}/60</small>
                  </div>

                  {/* Buttons Section */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-medium mb-0">Buttons</label>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={addButton}
                        disabled={editForm.buttons.length >= 3}
                      >
                        + Add Button
                      </button>
                    </div>
                    
                    {editForm.buttons.map((button, index) => (
                      <div key={index} className="border rounded p-3 mb-2" style={{ backgroundColor: '#f8f9fa' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="fw-medium mb-0">Button {index + 1}</h6>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removeButton(index)}
                            style={{ width: '24px', height: '24px', padding: '0', fontSize: '12px' }}
                          >
                            ×
                          </button>
                        </div>
                        
                        <div className="row">
                          <div className="col-md-6 mb-2">
                            <label className="form-label fw-medium">Button Type</label>
                            <select
                              className="form-select form-select-sm"
                              value={button.type}
                              onChange={(e) => updateButton(index, 'type', e.target.value)}
                            >
                              <option value="QUICK_REPLY">Quick Reply</option>
                              <option value="FLOW">Flow</option>
                              <option value="URL">URL</option>
                              <option value="PHONE_NUMBER">Phone Number</option>
                            </select>
                          </div>
                          <div className="col-md-6 mb-2">
                            <label className="form-label fw-medium">Button Text</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Button Text"
                              value={button.text}
                              onChange={(e) => updateButton(index, 'text', e.target.value)}
                              maxLength={25}
                            />
                            <small className="text-muted">{button.text.length}/25</small>
                          </div>
                        </div>
                        
                        {button.type === 'URL' && (
                          <div className="mb-2">
                            <label className="form-label fw-medium">URL</label>
                            <input
                              type="url"
                              className="form-control form-control-sm"
                              placeholder="https://example.com"
                              value={button.url || ''}
                              onChange={(e) => updateButton(index, 'url', e.target.value)}
                            />
                          </div>
                        )}
                        
                        {button.type === 'PHONE_NUMBER' && (
                          <div className="mb-2">
                            <label className="form-label fw-medium">Phone Number</label>
                            <input
                              type="tel"
                              className="form-control form-control-sm"
                              placeholder="+1234567890"
                              value={button.phone_number || ''}
                              onChange={(e) => updateButton(index, 'phone_number', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {editForm.buttons.length === 0 && (
                      <div className="text-center text-muted py-3">
                        <small>No buttons added. Click "Add Button" to add quick reply buttons.</small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Preview */}
                <div className="col-md-6">
                  <h6 className="fw-bold mb-3">Preview</h6>
                  <div className="preview-template">
                    <div className="preview-container">
                      <div className="message-box-arrow"></div>
                      <div className="preview-box">
                        <div className="preview-content">
                          {/* Header Preview */}
                          {editForm.headerType !== 'None' && (
                            <div className="preview-header-media">
                              <div className="header-media-container">
                                {editForm.headerType === 'IMAGE' && editForm.headerImage && editForm.headerImage.trim() !== '' ? (
                                  <img
                                    src={editForm.headerImage}
                                    className="image-uploaded"
                                    alt="Header preview"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      console.log('Preview image failed to load:', editForm.headerImage);
                                    }}
                                    onLoad={() => console.log('Preview image loaded successfully:', editForm.headerImage)}
                                  />
                                ) : editForm.headerType === 'Text' ? (
                                  <div className="text-header" style={{
                                    padding: '12px',
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #e9ecef',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#495057'
                                  }}>
                                    {editForm.headerText || 'Header Text'}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          )}
                          
                          {/* Body Preview */}
                          <div className="preview-body">
                            {editForm.bodyText || 'Enter your message body...'}
                          </div>
                          
                          {/* Footer Preview */}
                          {editForm.footerText && (
                            <div className="preview-footer" style={{ 
                              fontSize: '11px', 
                              color: '#666', 
                              marginTop: '8px',
                              fontStyle: 'italic'
                            }}>
                              {editForm.footerText}
                            </div>
                          )}
                        </div>
                        <span className="mb-3 current-time">12:15 pm</span>
                        
                        {/* Buttons Preview */}
                        {editForm.buttons.length > 0 && (
                          <div className="call-to-action-btn">
                            {editForm.buttons.map((button, index) => (
                              <button 
                                key={index}
                                type="button" 
                                className="btn btn-sm"
                                style={{ 
                                  backgroundColor: '#FFFFFF', 
                                  border: '1px solid #25D366',
                                  borderRadius: '20px',
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  fontWeight: '400',
                                  color: '#25D366',
                                  minWidth: '120px',
                                  textAlign: 'center'
                                }}
                              >
                                {button.text || `Button ${index + 1}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={closeCreateModal}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={createTemplate} disabled={isCreatingTemplate}>
                {isCreatingTemplate ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : (
                  'Create Template'
                )}
              </button>
            </div>

            {/* Loading Overlay */}
            {isCreatingTemplate && (
              <div 
                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 1050,
                  borderRadius: '0.375rem'
                }}
              >
                <div className="text-center">
                  <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h5 className="text-muted">Creating Template...</h5>
                  <p className="text-muted mb-0">Please wait while we create your template</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>
        {
          `
   .preview-template .preview-container {
    display: flex;
    flex-direction: column;
    padding: 24px 200px 24px 17px;
   
    background: #E6DDD4;
    flex: 1;
    background-image: url(/Assets/public_assets/images/whatsapp-background.png);
    position: relative;
    min-height: 444px;
    max-height: 444px;
    overflow-y: scroll;
}
.preview-template .preview-container .message-box-arrow {
    position: absolute;
    display: block;
    width: 0;
    height: 0;
    border-color: transparent;
    border-style: solid;
}
.preview-template .preview-container .message-box-arrow::after {
    top: 1px;
    margin-left: -10px;
    content: " ";
    border-top-width: 0;
    border-bottom-color: #fff;
}

.preview-template .preview-container .preview-box {
    border-top-left-radius: 0px !important;
    height: fit-content;
    width: 100%;
    background: #FFFFFF;
    position: relative;
    padding-left: 6px;
    padding-top: 6px;
    padding-bottom: 7px;
    padding-right: 6px;
    border-radius: 4px;
}

.preview-template .preview-container .preview-box::before {
    // background: url(/Assets/public_assets/images/message-box-arrow.svg) 50% 50% no-repeat;
    background-size: contain;
    content: '';
    height: 16px;
    left: -11px;
    position: absolute;
    top: 0px;
    width: 12px;
}
.preview-template .preview-container .preview-box .preview-content {
    min-height: 25px;
}
.preview-template .preview-container .preview-box .preview-content .preview-header-media .header-media-container .image-uploaded {
    width: 100%;
    height: auto;
    max-height: 300px;
    border-radius: 4px;
    object-fit: contain;
    cursor: zoom-in;
}
.header-media-container{
margin-bottom: 10px;
}

.preview-template .preview-container .preview-box .preview-content .preview-body
Specificity: (1,5,0)
 {
    word-break: break-word;
    font-size: 13px;
}
.preview-template .preview-container .preview-box .current-time {
    font-weight: 300;
    font-size: 11px;
    color: #393939;
    float: right;
}
.preview-template .preview-container .call-to-action-btn {
    margin-top: 8px;
    width: 100%;
    background: #FFFFFF;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 8px;
}

.preview-template .preview-container .call-to-action-btn button {
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.preview-template .preview-container .call-to-action-btn button:hover {
    background-color: #f0f8f0 !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.preview-template .preview-container .quick-reply-btn {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    min-width: 240px;
    margin-bottom: 1px;
    margin-left: -2px;
}
.preview-template .preview-container .quick-reply-btn .reply-btn-text {
    display: flex;
    justify-content: center;
    font-weight: 400;
    font-size: 13px;
    color: #00a5f4;
    background: #FFFFFF;
    padding: 8px;
    border-radius: 4px;
    flex-grow: 1;
    text-align: center;
    margin: 2px 0 0 2px;
    min-width: calc(50% - 2px);
}

`
        }
      </style>
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
                onChange={(e) => setNonEnterpriseForm({ ...nonEnterpriseForm, name: e.target.value })}
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
                  onChange={(e) => setNonEnterpriseForm({ ...nonEnterpriseForm, bodyText: e.target.value })}
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


  if (currentView === 'template-types') {
    return renderTemplateTypes();
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