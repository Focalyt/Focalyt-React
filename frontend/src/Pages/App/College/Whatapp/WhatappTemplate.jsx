import React, { useState, useEffect, useRef } from 'react';

import axios from 'axios';



const WhatsAppTemplate = () => {

  const [searchTerm, setSearchTerm] = useState('');

  const [showDropdown, setShowDropdown] = useState(false);

  const [currentView, setCurrentView] = useState('list'); // 'list', 'enterprise', 'non-enterprise', 'template-types'

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [editingTemplate, setEditingTemplate] = useState(null);

  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCloneMode, setIsCloneMode] = useState(false);

  // WebSocket and notification states
  const [whatsappWs, setWhatsappWs] = useState(null);
  const [notification, setNotification] = useState({
    type: 'info',
    message: '',
    show: false
  });

  const [editForm, setEditForm] = useState({

    name: '',

    category: 'UTILITY',

    language: 'en',

    bodyText: '',

    headerText: '',

    footerText: '',

    headerType: 'None',

    headerImage: null,

    headerVideo: null,

    headerDocument: null,

    buttons: [],

    templateType: 'Custom',

    // Flow configuration fields

    flowId: '',

    flowAction: '',

    navigateScreen: '',

    // Authentication configuration fields

    codeDeliveryMethod: 'copy_code',

    // Carousel configuration fields

    carouselMessage: '',

    carouselHeaderType: '',

    carouselCards: [],

    carouselVariables: [],

    // Order details configuration fields

    orderButtonText: 'Review and Pay',

    // Order status configuration fields

    orderStatusButtons: ['Track Order', 'Cancel Order'],

    // Variables configuration fields

    variables: []

  });



  // Carousel navigation state

  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // Variable dropdown state
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  const [showCarouselVariableDropdown, setShowCarouselVariableDropdown] = useState(false);
  const [showCardVariableDropdown, setShowCardVariableDropdown] = useState(null); // for card-specific dropdown
  const variableDropdownRef = useRef(null);
  const carouselVariableDropdownRef = useRef(null);

  // Predefined variables list
  const predefinedVariables = [
    { name: 'Name', placeholder: 'name' },
    { name: 'Gender', placeholder: 'gender' },
    { name: 'Mobile', placeholder: 'mobile' },
    { name: 'Email', placeholder: 'email' },
    { name: 'Course Name', placeholder: 'course_name' },
    { name: 'Job Name', placeholder: 'job_name' },
    { name: 'Counselor Name', placeholder: 'counselor_name' },
    { name: 'Lead Owner Name', placeholder: 'lead_owner_name' },
    { name: 'Project Name', placeholder: 'project_name' },
    { name: 'Batch Name', placeholder: 'batch_name' }
  ];



  // Carousel navigation functions

  const goToPreviousCard = () => {

    setCurrentCarouselIndex(prev =>

      prev > 0 ? prev - 1 : editForm.carouselCards.length - 1

    );

  };



  const goToNextCard = () => {

    setCurrentCarouselIndex(prev =>

      prev < editForm.carouselCards.length - 1 ? prev + 1 : 0

    );

  };



  // Function to format template name (lowercase and replace spaces with underscores)

  const formatTemplateName = (name) => {

    if (!name) return '';



    let formatted = name

      .toLowerCase() // Convert to lowercase

      .replace(/\s+/g, '_') // Replace all spaces with underscores

      .replace(/[^a-z0-9_]/g, '') // Remove special characters except underscores

      .replace(/_+/g, '_') // Replace multiple underscores with single underscore

      .replace(/^|$/g, ''); // Remove leading/trailing underscores





    return formatted;

  };



  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');

  const token = userData.token;

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;



  // Reset carousel index when carousel cards change

  useEffect(() => {

    if (editForm.carouselCards.length > 0 && currentCarouselIndex >= editForm.carouselCards.length) {

      setCurrentCarouselIndex(0);

    }

  }, [editForm.carouselCards.length, currentCarouselIndex]);



  // Function to replace variables in text with their values

  const replaceVariablesInText = (text) => {

    if (!text) return '';

    let result = text;

    if (editForm.variables && Array.isArray(editForm.variables)) {

      editForm.variables.forEach(variable => {

        const placeholder = variable.placeholder;

        const value = variable.value || placeholder; // Show placeholder if no value

        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);

      });

    }

    return result;

  };

  // Function to replace carousel message variables with their values

  const replaceCarouselMessageVariables = (text) => {

    if (!text) return '';

    let result = text;

    if (editForm.carouselVariables && Array.isArray(editForm.carouselVariables)) {

      editForm.carouselVariables.forEach(variable => {

        const placeholder = variable.placeholder;

        const value = variable.value || placeholder; // Show placeholder if no value

        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);

      });

    }

    return result;

  };

  // Function to add variable to carousel message

  const addCarouselVariable = () => {

    const existingVariables = editForm.carouselMessage.match(/\{\{\d+\}\}/g) || [];

    const variableNumber = existingVariables.length + 1;

    const newVariable = {

      id: Date.now(),

      placeholder: `{{${variableNumber}}}`,

      value: ''

    };



    setEditForm({

      ...editForm,

      carouselMessage: editForm.carouselMessage + `{{${variableNumber}}}`,

      carouselVariables: [...(editForm.carouselVariables || []), newVariable]

    });

  };

  // Function to update carousel variable value

  const updateCarouselVariable = (variableId, newValue) => {

    const updatedVariables = editForm.carouselVariables.map(variable =>

      variable.id === variableId ? { ...variable, value: newValue } : variable

    );

    setEditForm({ ...editForm, carouselVariables: updatedVariables });

  };



  // Function to remove carousel variable

  const removeCarouselVariable = (variableId) => {

    const variableToRemove = editForm.carouselVariables.find(v => v.id === variableId);

    if (variableToRemove) {

      const updatedMessage = editForm.carouselMessage.replace(variableToRemove.placeholder, '');

      const updatedVariables = editForm.carouselVariables.filter(v => v.id !== variableId);



      // Renumber remaining variables

      const renumberedVariables = updatedVariables.map((variable, index) => ({

        ...variable,

        placeholder: `{{${index + 1}}}`,

        id: Date.now() + index

      }));



      // Update message with renumbered variables

      let updatedMessageWithRenumbered = updatedMessage;

      renumberedVariables.forEach((variable, index) => {

        const oldPlaceholder = `{{${index + 1}}}`;

        updatedMessageWithRenumbered = updatedMessageWithRenumbered.replace(

          new RegExp(oldPlaceholder.replace(/[{}]/g, '\\$&'), 'g'),

          variable.placeholder

        );

      });



      setEditForm({

        ...editForm,

        carouselMessage: updatedMessageWithRenumbered,

        carouselVariables: renumberedVariables

      });

    }

  };



  // Function to clean up variables that are no longer in the body text

  const cleanupVariables = (bodyText) => {

    if (!editForm.variables || !Array.isArray(editForm.variables)) {

      return [];

    }

    const usedVariables = editForm.variables.filter(variable =>

      bodyText.includes(variable.placeholder)

    );

    return usedVariables;

  };



  // Function to reset form data when template type changes

  const resetFormDataForTemplateType = (newTemplateType) => {

    const baseFormData = {

      name: '',

      category: 'UTILITY',

      language: 'en',

      bodyText: '',

      headerText: '',

      footerText: '',

      headerType: 'None',

      headerImage: null,

      headerVideo: null,

      headerDocument: null,

      buttons: [],

      templateType: newTemplateType,

      // Flow configuration fields

      flowId: '',

      flowAction: '',

      navigateScreen: '',

      // Authentication configuration fields

      codeDeliveryMethod: 'copy_code',

      // Carousel configuration fields

      carouselMessage: '',

      carouselHeaderType: '',

      carouselCards: [],

      carouselVariables: [],

      // Order details configuration fields

      orderButtonText: 'Review and Pay',

      // Order status configuration fields

      orderStatusButtons: ['Track Order', 'Cancel Order'],

      // Variables configuration fields

      variables: []

    };



    // Auto-set category based on template type

    if (newTemplateType === 'Catalog') {

      baseFormData.category = 'MARKETING';

    } else if (newTemplateType === 'Order Status') {

      baseFormData.category = 'UTILITY';

    } else if (newTemplateType === 'Carousel') {

      baseFormData.category = 'MARKETING';

    } else if (newTemplateType === 'Authentication') {

      baseFormData.category = 'AUTHENTICATION';

    }



    // Reset carousel navigation index

    setCurrentCarouselIndex(0);



    return baseFormData;

  };


  const closeCreateModal = () => {

    // Hide modal manually

    const modalElement = document.getElementById('createTemplateModal');

    if (modalElement) {

      modalElement.classList.remove('show');

      modalElement.style.display = 'none';

      document.body.classList.remove('modal-open');

      // Remove backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }

    }

    // Reset clone mode when closing modal
    setIsCloneMode(false);

    setShowCreateModal(false);

    // Reset form only when closing

    setEditForm({

      name: '',

      category: 'UTILITY',

      language: 'en',

      bodyText: '',

      headerText: '',

      headerType: 'None',

      headerImage: null,

      headerVideo: null,

      headerDocument: null,

      footerText: '',

      buttons: [],

      templateType: 'Custom',

      flowId: '',

      flowAction: '',

      navigateScreen: '',

      codeDeliveryMethod: 'copy_code',

      carouselMessage: '',

      carouselHeaderType: '',

      carouselCards: [],

      orderButtonText: 'Review and Pay'

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

  const [showButtonTypeDropdown, setShowButtonTypeDropdown] = useState(false);



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

      category: 'UTILITY',

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

  // WebSocket connection for template status updates
  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
    const wsUrl = `${backendUrl.replace('http', 'ws')}/ws/whatsapp`;
    
    console.log('🔌 Connecting to WhatsApp WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    setWhatsappWs(ws);

    ws.onopen = () => {
      console.log('✅ WhatsApp WebSocket connected');
      
      // Register with college ID
      const collegeId = localStorage.getItem('collegeId') || sessionStorage.getItem('collegeId');
      if (collegeId) {
        ws.send(JSON.stringify({
          type: 'register',
          collegeId: collegeId
        }));
        console.log('✅ Registered with WebSocket for college:', collegeId);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data);

        // Handle different message types
        if (data.type === 'template_status_update') {
          handleTemplateStatusUpdate(data);
        } else if (data.type === 'registered') {
          console.log('✅ Registered with WebSocket for college:', data.collegeId);
        } else if (data.type === 'pong') {
          // Pong response for keep-alive
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WhatsApp WebSocket disconnected');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.CLOSED) {
          console.log('🔄 Attempting to reconnect WebSocket...');
          // This will trigger the useEffect again
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('❌ WhatsApp WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Handle template status updates from WebSocket
  const handleTemplateStatusUpdate = (data) => {
    console.log('📋 Template status update:', data);
    
    // Show notification to user
    if (data.status === 'APPROVED') {
      // Success notification
      setNotification({
        type: 'success',
        message: `🎉 Template "${data.templateName}" has been approved and is ready to use!`,
        show: true
      });
    } else if (data.status === 'REJECTED') {
      // Error notification with rejection reason
      setNotification({
        type: 'error',
        message: `❌ Template "${data.templateName}" was rejected: ${data.rejectionReason}`,
        show: true
      });
    } else {
      // Info notification for other status updates
      setNotification({
        type: 'info',
        message: `ℹ️ Template "${data.templateName}" status updated to ${data.status}`,
        show: true
      });
    }

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);

    // Refresh templates list to show updated status
    fetchWhatsappTemplates();
  };



  // Handle create modal show/hide

  useEffect(() => {

    if (showCreateModal) {

      // Initialize form with default values when opening create modal (not in clone mode)
      if (!isCloneMode) {

        setEditForm({

          name: '',

          category: 'UTILITY',

          language: 'en',

          bodyText: '',

          headerText: '',

          headerType: 'None',

          headerImage: null,

          headerVideo: null,

          headerDocument: null,

          footerText: '',

          buttons: [],

          templateType: 'Custom',

          flowId: '',

          flowAction: '',

          navigateScreen: '',

          codeDeliveryMethod: 'copy_code',

          carouselMessage: '',

          carouselHeaderType: '',

          carouselCards: [],

          orderButtonText: 'Review and Pay',

          orderStatusButtons: ['Track Order', 'Cancel Order'],

          variables: []

        });



      }

      // Show modal for both create and clone modes
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

  }, [showCreateModal, isCloneMode]);

  // Handle preview modal show/hide
  useEffect(() => {
    if (selectedTemplate) {
      const modalElement = document.getElementById('templatePreviewModal');
      if (modalElement) {
        if (window.bootstrap && window.bootstrap.Modal) {
          const modal = new window.bootstrap.Modal(modalElement);
          modal.show();

          // Add event listener for when modal is hidden
          modalElement.addEventListener('hidden.bs.modal', () => {
            setSelectedTemplate(null);
          });
        } else {
          // Fallback to manual modal show
          modalElement.classList.add('show');
          modalElement.style.display = 'block';
          document.body.classList.add('modal-open');
        }
      }
    }
  }, [selectedTemplate]);

  // Function to close modal manually
  const closeModal = () => {
    const modalElement = document.getElementById('templatePreviewModal');
    if (modalElement) {
      if (window.bootstrap && window.bootstrap.Modal) {
        const modal = window.bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      } else {
        // Fallback to manual modal hide
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
    }
    setSelectedTemplate(null);
  };

  // Handle clicking outside variable dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (variableDropdownRef.current && !variableDropdownRef.current.contains(event.target)) {
        setShowVariableDropdown(false);
      }
    };

    if (showVariableDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVariableDropdown]);

  // Handle clicking outside carousel variable dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (carouselVariableDropdownRef.current && !carouselVariableDropdownRef.current.contains(event.target)) {
        setShowCarouselVariableDropdown(false);
      }
    };

    if (showCarouselVariableDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCarouselVariableDropdown]);

  const fetchWhatsappTemplates = async () => {

    try {

      if (!token) {

        alert('No token found in session storage.');

        return;

      }




      // Fetch templates directly from Facebook Graph API
      const response = await axios.get(
        `${backendUrl}/college/whatsapp/templates`,
        {
          headers: { 'x-auth': token }
        }
      );
      console.log('Templates fetched successfully from Facebook:', response.data.data);


      if (response.data && response.data.data) {
        setTemplates(response.data.data);
      }

    } catch (error) {

      console.error('Error fetching WhatsApp templates from Facebook:', error);
      alert('Error fetching templates from Facebook. Please check your configuration.');

    }

  };



  const handleSyncTemplates = async (deleteTemplate = false) => {

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



      // Since we're now fetching directly from Facebook API, 
      // we just need to refresh the templates list
      await fetchWhatsappTemplates();

      if (!deleteTemplate) {
        alert('Templates synced successfully from Meta!');
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



  const filteredTemplates = templates.filter(template => {
    const templateData = template.template || template;
    return (
      templateData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      templateData.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });



  const handleCreateTemplate = (type) => {

    setCurrentView(type);

    setShowDropdown(false);

  };



  const handleViewTemplateTypes = () => {

    setCurrentView('template-types');

  };

  // Function to save template

  const handleCloneTemplate = (template) => {

    setEditingTemplate(template);



    // Extract template data for editing

    const templateData = template.template || template;

    const bodyComponent = templateData.components?.find(comp => comp.type === 'BODY');

    const headerComponent = templateData.components?.find(comp => comp.type === 'HEADER');

    const footerComponent = templateData.components?.find(comp => comp.type === 'FOOTER');

    const buttonsComponent = templateData.components?.find(comp => comp.type === 'BUTTONS');

    // Determine template type based on buttons or other indicators

    let templateType = 'Custom';

    if (buttonsComponent?.buttons?.some(btn => btn.type === 'CATALOG')) {

      templateType = 'Catalog';

    } else if (buttonsComponent?.buttons?.some(btn => btn.type === 'FLOW')) {

      templateType = 'Flows';

    } else if (buttonsComponent?.buttons?.some(btn => btn.type === 'OTP')) {

      templateType = 'Authentication';

    } else if (templateData.carouselCards && templateData.carouselCards.length > 0) {

      templateType = 'Carousel';

    } else if (templateData.components.some(comp => (comp.type === 'carousel' || comp.type === 'CAROUSEL') && comp.cards && comp.cards.length > 0)) {

      templateType = 'Carousel';

    } else if (buttonsComponent?.buttons?.some(btn => btn.text === 'Review and Pay')) {

      templateType = 'Order details';

    } else if (buttonsComponent?.buttons?.some(btn => btn.text === 'Track Order')) {

      templateType = 'Order Status';

    }

    // Extract carousel data from components
    let carouselCards = [];
    let carouselMessage = '';

    if (templateType === 'Carousel') {
      // First try to get carousel message from BODY component
      const bodyComponent = templateData.components.find(comp => comp.type === 'BODY' || comp.type === 'body');
      carouselMessage = bodyComponent?.text || '';

      // Then find carousel component
      const carouselComponent = templateData.components.find(comp => comp.type === 'carousel' || comp.type === 'CAROUSEL');

      console.log('Carousel Component Found:', carouselComponent);
      console.log('Carousel Cards:', carouselComponent?.cards);

      if (carouselComponent && carouselComponent.cards) {
        carouselCards = carouselComponent.cards.map((card, index) => {
          const headerComponent = card.components?.find(comp => comp.type === 'header' || comp.type === 'HEADER');
          const headerImage = (headerComponent?.format === 'IMAGE' || headerComponent?.format === 'image') ? headerComponent?.example?.header_handle?.[0] : '';
          const headerVideo = (headerComponent?.format === 'VIDEO' || headerComponent?.format === 'video') ? headerComponent?.example?.header_handle?.[0] : '';



          return {
            id: Date.now() + index,
            bodyText: card.components?.find(comp => comp.type === 'body' || comp.type === 'BODY')?.text || '',
            buttons: card.components?.find(comp => comp.type === 'buttons' || comp.type === 'BUTTONS')?.buttons || [],
            headerType: headerComponent?.format || 'None',
            headerImage: headerImage,
            headerVideo: headerVideo
          };
        });
      }
    }

    // Extract header text

    const headerText = headerComponent?.text ||

      headerComponent?.example?.header_text?.[0] ||

      headerComponent?.example?.header_text_named_params?.[0] ||

      '';



    // Map header type

    const headerType = headerComponent?.format === 'TEXT' ? 'Text' :

      headerComponent?.format === 'IMAGE' ? 'IMAGE' :

        headerComponent?.format === 'VIDEO' ? 'VIDEO' :

          headerComponent?.format === 'DOCUMENT' ? 'DOCUMENT' :

            headerComponent ? 'Text' : 'None';



    // Extract variables from body text

    const bodyText = bodyComponent?.text || '';

    const variableMatches = bodyText.match(/\{\{\d+\}\}/g) || [];

    const variables = variableMatches.map((match, index) => ({

      id: Date.now() + index,

      placeholder: match,

      value: ''

    }));



    // Clone the template with all data

    setEditForm({

      name: formatTemplateName(`${templateData.name || 'template'}_copy`),

      category: templateData.category || 'UTILITY',

      language: templateData.language || 'en',

      bodyText: bodyText,

      headerText: headerText,

      footerText: footerComponent?.text || '',

      headerType: headerType,

      headerImage: headerComponent?.format === 'IMAGE' ? (headerComponent?.example?.header_handle?.[0] || null) : null,

      headerVideo: headerComponent?.format === 'VIDEO' ? (headerComponent?.example?.header_handle?.[0] || null) : null,

      headerDocument: headerComponent?.format === 'DOCUMENT' ? (headerComponent?.example?.header_handle?.[0] || null) : null,

      buttons: buttonsComponent?.buttons || [],

      templateType: templateType,

      // Flow configuration fields

      flowId: templateData.flowId || '',

      flowAction: templateData.flowAction || '',

      navigateScreen: templateData.navigateScreen || '',

      // Authentication configuration fields

      codeDeliveryMethod: templateData.codeDeliveryMethod || 'copy_code',

      // Carousel configuration fields

      carouselMessage: carouselMessage || templateData.carouselMessage || '',

      carouselHeaderType: carouselCards.length > 0 ? carouselCards[0].headerType : (templateData.carouselHeaderType || ''),

      carouselCards: carouselCards.length > 0 ? carouselCards : (templateData.carouselCards || []),

      carouselVariables: templateData.carouselVariables || [],

      // Order details configuration fields

      orderButtonText: templateData.orderButtonText || 'Review and Pay',

      // Order status configuration fields

      orderStatusButtons: templateData.orderStatusButtons || ['Track Order', 'Cancel Order'],

      // Variables configuration fields

      variables: variables

    });

    console.log('EditForm set with:', {
      name: formatTemplateName(`${templateData.name || 'template'}_copy`),
      headerType,
      headerImage: headerComponent?.format === 'IMAGE' ? (headerComponent?.example?.header_handle?.[0] || null) : null,
      headerVideo: headerComponent?.format === 'VIDEO' ? (headerComponent?.example?.header_handle?.[0] || null) : null,
      headerDocument: headerComponent?.format === 'DOCUMENT' ? (headerComponent?.example?.header_handle?.[0] || null) : null,
      bodyText: bodyText,
      footerText: footerComponent?.text || ''
    });

    // Reset carousel index

    setCurrentCarouselIndex(0);

    // Set clone mode and open create modal
    setIsCloneMode(true);
    setShowCreateModal(true);

    console.log('Template cloned:', templateData.name, 'Type:', templateType);
    console.log('Header component:', headerComponent);
    console.log('Extracted header data:', {
      headerType,
      headerImage: headerComponent?.format === 'IMAGE' ? (headerComponent?.example?.header_handle?.[0] || null) : null,
      headerVideo: headerComponent?.format === 'VIDEO' ? (headerComponent?.example?.header_handle?.[0] || null) : null,
      headerDocument: headerComponent?.format === 'DOCUMENT' ? (headerComponent?.example?.header_handle?.[0] || null) : null
    });

  };

  // Function to delete template
  const handleDeleteTemplate = async (template) => {
    const templateName = template.template?.name || template.name;

    if (!templateName) {
      alert('Template ID not found');
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the template "${templateName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    // Set loading state
    setIsDeletingTemplate(true);

    try {

      if (!token) {
        alert('No token found in session storage.');
        return;
      }

      const response = await axios.delete(`${backendUrl}/college/whatsapp/delete-template/${templateName}`, {
        headers: { 'x-auth': token }
      });

      if (response.data.success) {
        alert('Template deleted successfully!');
        // Refresh the templates list
        // fetchWhatsappTemplates();
        await handleSyncTemplates(true);
      } else {
        throw new Error(response.data.message || 'Failed to delete template');
      }

    } catch (error) {
      console.error('Error deleting template:', error);
      alert(`Failed to delete template: ${error.response?.data?.message || error.message}`);
    } finally {
      // Clear loading state
      setIsDeletingTemplate(false);
    }
  };

  const addButton = (buttonType = 'QUICK_REPLY') => {

    // Close dropdown if it's open

    setShowButtonTypeDropdown(false);



    let newButton = {

      type: buttonType,

      text: ''

    };



    // Set default text based on button type

    switch (buttonType) {

      case 'CALL_TO_ACTION':

        newButton.text = 'Visit website';

        newButton.url = '';

        break;

      case 'PHONE_NUMBER':

        newButton.text = 'Call us';

        newButton.phone_number = '+1234567890';

        break;

      case 'COPY_CODE':

        newButton.text = 'Copy code';

        break;

      default:

        newButton.text = 'Button text';

    }



    setEditForm({

      ...editForm,

      buttons: [...(editForm.buttons || []), newButton]

    });

  };



  const removeButton = (index) => {

    const buttons = editForm.buttons || [];

    setEditForm({

      ...editForm,

      buttons: buttons.filter((_, i) => i !== index)

    });

  };



  const updateButton = (index, field, value) => {

    const buttons = editForm.buttons || [];

    const updatedButtons = buttons.map((button, i) =>

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







      // Validate required fields
      const hasBodyText = editForm.bodyText || (editForm.templateType === 'Carousel' && editForm.carouselMessage);

      if (!editForm.name || !editForm.category || !editForm.language || !hasBodyText) {

        alert('Please fill in all required fields (Name, Category, Language, and Body Text).');

        return;

      }



      // Validate body text length (WhatsApp has a limit of 1024 characters)
      const bodyTextToValidate = editForm.bodyText || editForm.carouselMessage || '';

      if (bodyTextToValidate.length > 1024) {

        alert('Body text is too long. Please keep it under 1024 characters.');

        return;

      }

      // Validate carousel-specific requirements
      if (editForm.templateType === 'Carousel') {
        if (!editForm.carouselCards || editForm.carouselCards.length < 2) {
          alert('Carousel templates must have at least 2 cards.');
          return;
        }

        if (editForm.carouselCards.length > 10) {
          alert('Carousel templates can have maximum 10 cards.');
          return;
        }

        // Validate that each card has required fields
        for (let i = 0; i < editForm.carouselCards.length; i++) {
          const card = editForm.carouselCards[i];
          if (!card.buttons || card.buttons.length === 0) {
            alert(`Card ${i + 1} must have at least one button.`);
            return;
          }
        }
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

            format: 'IMAGE'
          }] : []),

          ...(editForm.headerType !== 'None' && editForm.headerType === 'VIDEO' ? [{

            type: 'HEADER',

            format: 'VIDEO'
          }] : []),

          ...(editForm.headerType !== 'None' && editForm.headerType === 'DOCUMENT' ? [{

            type: 'HEADER',

            format: 'DOCUMENT'
          }] : []),

          {

            type: 'BODY',

            text: editForm.templateType === 'Carousel' ? editForm.carouselMessage : editForm.bodyText,

            ...((editForm.templateType === 'Carousel' ? editForm.carouselMessage : editForm.bodyText).includes('{{') ? {

              example: {

                body_text: [

                  // Use actual variable values from form instead of hardcoded ["User"]
                  editForm.variables && editForm.variables.length > 0 
                    ? editForm.variables.map(v => v.value || 'Sample Value')
                    : ["Sample Value"]

                ]

              }

            } : {})

          },

          ...(editForm.footerText ? [{

            type: 'FOOTER',

            text: editForm.footerText

          }] : []),

          // Handle carousel templates separately
          ...(editForm.templateType === 'Carousel' && editForm.carouselCards && editForm.carouselCards.length > 0 ? [{
            type: 'carousel',
            cards: editForm.carouselCards.map(card => ({
              components: [
                // Header component for each card
                ...(editForm.carouselHeaderType && editForm.carouselHeaderType !== 'None' ? [{
                  type: 'header',
                  format: editForm.carouselHeaderType.toLowerCase(),
                  example: {
                    header_handle: ['placeholder_handle'] // Will be replaced with actual file handle
                  }
                }] : []),
                // Card body if exists
                ...(card.bodyText ? [{
                  type: 'body',
                  text: card.bodyText
                }] : []),
                // Buttons for each card
                ...(card.buttons && card.buttons.length > 0 ? [{
                  type: 'buttons',
                  buttons: card.buttons.map(button => ({
                    type: button.type === 'quick_reply' ? 'quick_reply' :
                      button.type === 'call_to_action' ? 'url' : 'quick_reply',
                    text: button.text || 'Button',
                    ...(button.type === 'call_to_action' && button.url ? {
                      url: button.url,
                      example: [button.url]
                    } : {})
                  }))
                }] : [])
              ]
            }))
          }] : []),
          // Handle other template types
          ...(editForm.buttons.length > 0 || editForm.templateType === 'Catalog' || editForm.templateType === 'Flows' || editForm.templateType === 'Authentication' || editForm.templateType === 'Order details' || editForm.templateType === 'Order Status' ? [{

            type: 'BUTTONS',

            buttons: editForm.templateType === 'Catalog'

              ? [{ type: 'CATALOG', text: 'View catalog' }]

              : editForm.templateType === 'Flows' && editForm.flowId

                ? [{

                  type: 'FLOW',

                  text: 'Start Flow',

                  flow_id: editForm.flowId,

                  flow_action: editForm.flowAction || 'NAVIGATE',

                  navigate_screen: editForm.navigateScreen || 'REGISTRATION'

                }]

                : editForm.templateType === 'Authentication'

                  ? [{

                    type: 'OTP',

                    text: editForm.codeDeliveryMethod === 'copy_code' ? 'Copy Code' : 'Authenticate',

                    otp_type: editForm.codeDeliveryMethod

                  }]

                  : editForm.templateType === 'Order details'

                    ? [

                      { type: 'URL', text: editForm.orderButtonText || 'Review and Pay', url: '#' },

                      { type: 'URL', text: 'Pay now', url: '#' }

                    ]

                    : editForm.templateType === 'Order Status'

                      ? (editForm.orderStatusButtons || []).map(buttonText => ({

                        type: 'URL',

                        text: buttonText,

                        url: '#'

                      }))

                      : (editForm.buttons || []).map(button => {

                        // Map button types to WhatsApp API format

                        let mappedButton = {

                          text: button.text

                        };



                        switch (button.type) {

                          case 'CALL_TO_ACTION':

                            mappedButton.type = 'URL';

                            mappedButton.url = button.url || '#';

                            break;

                          case 'PHONE_NUMBER':

                            mappedButton.type = 'PHONE_NUMBER';

                            mappedButton.phone_number = button.phone_number || '+1234567890';

                            break;

                          case 'COPY_CODE':

                            mappedButton.type = 'OTP';

                            mappedButton.otp_type = 'copy_code';

                            break;

                          default:

                            mappedButton.type = 'QUICK_REPLY';

                        }



                        return mappedButton;

                      })

          }] : [])

        ]

      };



      // Add base64File if there's an image, video, or document header
      if ((editForm.headerType === 'IMAGE' && editForm.headerImage) ||
        (editForm.headerType === 'VIDEO' && editForm.headerVideo) ||
        (editForm.headerType === 'DOCUMENT' && editForm.headerDocument)) {
        // Get the appropriate file based on header type
        const file = editForm.headerType === 'IMAGE' ? editForm.headerImage :
          editForm.headerType === 'VIDEO' ? editForm.headerVideo :
            editForm.headerDocument;
        const defaultName = editForm.headerType === 'IMAGE' ? 'header_image.png' :
          editForm.headerType === 'VIDEO' ? 'header_video.mp4' :
            'header_document.pdf';

        // Extract file name from the file or use a default name
        const fileName = file.name || defaultName;

        // If file is a File object, convert to base64
        if (file instanceof File) {
          const base64String = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:image/...;base64, prefix
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          templateData.base64File = {
            name: fileName,
            body: base64String
          };
        } else if (typeof file === 'string' && file.startsWith('data:')) {
          // If it's already a data URL, extract the base64 part
          const base64String = file.split(',')[1];
          templateData.base64File = {
            name: fileName,
            body: base64String
          };
        } else if (typeof file === 'string') {
          // If it's already a base64 string
          templateData.base64File = {
            name: fileName,
            body: file
          };
        }
      }

      // Handle carousel file uploads
      if (editForm.templateType === 'Carousel' && editForm.carouselHeaderType && editForm.carouselHeaderType !== 'None') {
        // For carousel, we need to upload files for each card
        const carouselFiles = [];

        for (let i = 0; i < editForm.carouselCards.length; i++) {
          const card = editForm.carouselCards[i];
          let file = null;
          let defaultName = '';

          if (editForm.carouselHeaderType === 'IMAGE' && card.headerImage) {
            file = card.headerImage;
            defaultName = `card_${i + 1}_image.png`;
          } else if (editForm.carouselHeaderType === 'VIDEO' && card.headerVideo) {
            file = card.headerVideo;
            defaultName = `card_${i + 1}_video.mp4`;
          }

          if (file) {
            const fileName = file.name || defaultName;

            // Convert file to base64
            if (file instanceof File) {
              const base64String = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });

              carouselFiles.push({
                name: fileName,
                body: base64String,
                cardIndex: i
              });
            } else if (typeof file === 'string' && file.startsWith('data:')) {
              const base64String = file.split(',')[1];
              carouselFiles.push({
                name: fileName,
                body: base64String,
                cardIndex: i
              });
            } else if (typeof file === 'string') {
              carouselFiles.push({
                name: fileName,
                body: file,
                cardIndex: i
              });
            }
          }
        }

        if (carouselFiles.length > 0) {
          templateData.carouselFiles = carouselFiles;
        }
      }



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

          category: 'UTILITY',

          language: '',

          bodyText: '',

          headerText: '',

          footerText: '',

          headerType: 'None',

          headerImage: null,

          headerVideo: null,

          headerDocument: null,

          buttons: [],

          templateType: 'Custom',

          flowId: '',

          flowAction: '',

          navigateScreen: '',

          codeDeliveryMethod: 'copy_code',

          carouselMessage: '',

          carouselHeaderType: '',

          carouselCards: [],

          orderButtonText: 'Review and Pay',

          orderStatusButtons: ['Track Order', 'Cancel Order'],

          variables: []

        });



        alert(isCloneMode ? 'Template cloned successfully!' : 'Template created successfully!');

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

    <div className="container-fluid p-md-4 p-sm-2" style={{ backgroundColor: '#f8f9fa' }}>

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

      <style>

        {`

          .carousel-scroll::-webkit-scrollbar {

            height: 6px;

          }

          .carousel-scroll::-webkit-scrollbar-track {

            background: #f0f0f0;

            border-radius: 3px;

          }

          .carousel-scroll::-webkit-scrollbar-thumb {

            background: #25D366;

            border-radius: 3px;

          }

          .carousel-scroll::-webkit-scrollbar-thumb:hover {

            background: #1ea952;

          }

        `}

      </style>

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

                <tr key={(template?.template || template)?.id} style={{ borderBottom: '1px solid #f1f3f4' }}>

                  <td className="py-3 ps-4">

                    <div>

                      <div className="fw-medium text-dark">{(template?.template || template)?.name || ""}</div>

                      <small className="text-muted">{(template?.template || template)?.category || ""}</small>

                    </div>

                  </td>

                  <td className="py-3" style={{ maxWidth: '200px' }}>

                    {/* {template?.template?.components[0]?.text || ""} */}

                    <div className="text-truncate">

                      {(template?.template || template)?.components?.find(comp => comp.type === 'BODY')?.text ||

                        (template?.template || template)?.components?.[0]?.text ||

                        (template?.template || template)?.subject ||

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

                      {(template?.template || template)?.status || ""}

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

                        onClick={() => handleDeleteTemplate(template)}

                        disabled={isDeletingTemplate}

                        title={isDeletingTemplate ? "Deleting..." : "Delete"}

                      >

                        {isDeletingTemplate ? (
                          <div className="spinner-border spinner-border-sm" role="status" style={{ color: 'white' }}>
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          <span style={{ color: 'white', fontSize: '14px' }}>🗑️</span>
                        )}

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

              <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>

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

                              ) : (selectedTemplate?.template?.components?.find(comp => comp.type === 'HEADER')?.format === 'VIDEO' ||

                                selectedTemplate?.components?.find(comp => comp.type === 'HEADER')?.format === 'VIDEO') ? (

                                <video

                                  src={(() => {
                                    const videoUrl = selectedTemplate?.template?.components?.find(comp => comp.type === 'HEADER')?.example?.header_handle?.[0] ||
                                      selectedTemplate?.components?.find(comp => comp.type === 'HEADER')?.example?.header_handle?.[0] ||
                                      selectedTemplate?.template?.headerVideo ||
                                      selectedTemplate?.headerVideo ||
                                      selectedTemplate?.template?.components?.find(comp => comp.type === 'HEADER')?.video_url ||
                                      selectedTemplate?.components?.find(comp => comp.type === 'HEADER')?.video_url;
                                    
                                    // Clean URL by removing spaces and extra characters
                                    const cleanUrl = videoUrl ? videoUrl.replace(/\s+/g, '') : null;
                                    
                                    console.log('Video URL for template:', selectedTemplate?.name, ':', cleanUrl);
                                    return cleanUrl;
                                  })()}

                                  controls
                                  preload="metadata"
                                  crossOrigin="anonymous"
                                  className="image-uploaded"
                                  style={{ width: '100%', height: 'auto' }}

                                  onError={(e) => {
                                    console.error('Video failed to load:', e.target.src);
                                    e.target.style.display = 'none';

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

                        {selectedTemplate?.template?.components?.find(comp => comp.type === 'BODY' || comp.type === 'body')?.text ||

                          selectedTemplate?.components?.find(comp => comp.type === 'BODY' || comp.type === 'body')?.text ||

                          selectedTemplate?.template?.components?.[0]?.text ||

                          'No content available'}

                      </div>



                      {/* Carousel Cards */}

                      {(() => {

                        const carouselComponent = selectedTemplate?.template?.components?.find(comp => comp.type === 'carousel' || comp.type === 'CAROUSEL') ||

                          selectedTemplate?.components?.find(comp => comp.type === 'carousel' || comp.type === 'CAROUSEL');

                        if (carouselComponent && carouselComponent.cards) {

                          return (

                            <div className="carousel-preview" style={{ marginTop: '10px' }}>

                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>

                                Carousel ({carouselComponent.cards.length} cards)

                              </div>

                              <div style={{

                                display: 'flex',

                                overflowX: 'auto',

                                gap: '12px',

                                padding: '8px 0',

                                scrollbarWidth: 'thin',

                                scrollbarColor: '#25D366 #f0f0f0',

                                WebkitScrollbar: {

                                  height: '6px'

                                },

                                WebkitScrollbarTrack: {

                                  background: '#f0f0f0',

                                  borderRadius: '3px'

                                },

                                WebkitScrollbarThumb: {

                                  background: '#25D366',

                                  borderRadius: '3px'

                                }

                              }} className="carousel-scroll">

                                {carouselComponent.cards.map((card, index) => (

                                  <div key={index} className="carousel-card" style={{

                                    minWidth: '280px',

                                    maxWidth: '280px',

                                    border: '1px solid #ddd',

                                    borderRadius: '12px',

                                    padding: '0',

                                    backgroundColor: 'white',

                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',

                                    overflow: 'hidden'

                                  }}>

                                    {/* Card Header */}

                                    {card.components?.find(comp => comp.type === 'header' || comp.type === 'HEADER') && (() => {

                                      const headerComponent = card.components.find(comp => comp.type === 'header' || comp.type === 'HEADER');

                                      if (headerComponent?.format === 'IMAGE' || headerComponent?.format === 'image') {

                                        return (

                                          <div style={{ width: '100%', height: '160px', overflow: 'hidden' }}>

                                            <img

                                              src={headerComponent?.example?.header_handle?.[0] || 'https://via.placeholder.com/280x160/25D366/FFFFFF?text=Image'}

                                              alt="Card header"

                                              style={{

                                                width: '100%',

                                                height: '100%',

                                                objectFit: 'cover',

                                                display: 'block'

                                              }}

                                              onError={(e) => {

                                                e.target.src = 'https://via.placeholder.com/280x160/25D366/FFFFFF?text=No+Image';

                                              }}

                                            />

                                          </div>

                                        );

                                      } else if (headerComponent?.format === 'VIDEO' || headerComponent?.format === 'video') {

                                        return (

                                          <div style={{ width: '100%', height: '160px', overflow: 'hidden' }}>

                                            <video

                                              src={headerComponent?.example?.header_handle?.[0]}

                                              controls

                                              style={{

                                                width: '100%',

                                                height: '100%',

                                                objectFit: 'cover',

                                                display: 'block'

                                              }}

                                              onError={(e) => {

                                                e.target.style.display = 'none';

                                              }}

                                            />

                                          </div>

                                        );

                                      }

                                      return null;

                                    })()}



                                    {/* Card Content */}

                                    <div style={{ padding: '12px' }}>

                                      {/* Card Body */}

                                      {card.components?.find(comp => comp.type === 'body' || comp.type === 'BODY') && (

                                        <div style={{

                                          fontSize: '14px',

                                          marginBottom: '12px',

                                          color: '#333',

                                          lineHeight: '1.4'

                                        }}>

                                          {card.components.find(comp => comp.type === 'body' || comp.type === 'BODY')?.text}

                                        </div>

                                      )}



                                      {/* Card Buttons */}

                                      {card.components?.find(comp => comp.type === 'buttons' || comp.type === 'BUTTONS') && (

                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

                                          {card.components.find(comp => comp.type === 'buttons' || comp.type === 'BUTTONS')?.buttons?.map((button, btnIndex) => (

                                            <button

                                              key={btnIndex}

                                              style={{

                                                fontSize: '12px',

                                                padding: '8px 12px',

                                                border: '1px solid #25D366',

                                                borderRadius: '20px',

                                                backgroundColor: '#25D366',

                                                color: 'white',

                                                cursor: 'default',

                                                fontWeight: '500',

                                                minWidth: '80px',

                                                textAlign: 'center'

                                              }}

                                            >

                                              {button.text}

                                            </button>

                                          ))}

                                        </div>

                                      )}

                                    </div>

                                  </div>

                                ))}

                              </div>

                            </div>

                          );

                        }

                        return null;

                      })()}



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



      {/* Clone Template Modal */}




      {/* Create Template Modal */}

      <div className="modal fade" id="createTemplateModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="createTemplateModalLabel" aria-hidden="true">

        <div className="modal-dialog modal-xl modal-dialog-scrollable">

          <div className="modal-content" style={{ borderRadius: '12px', border: 'none' }}>

            <div className="modal-header" style={{ borderBottom: '1px solid #e9ecef', padding: '1.5rem' }}>

              <h1 className="modal-title fs-4 fw-bold" id="createTemplateModalLabel">

                {isCloneMode ? 'Clone WhatsApp Template' : 'Create WhatsApp Template'}

              </h1>

              <button type="button" className="btn-close" onClick={closeCreateModal} aria-label="Close"></button>

            </div>

            <div className="modal-body" style={{ padding: '0' }}>

              <div className="row g-0">

                {/* Left Side - Form Fields */}

                <div className="col-md-8" style={{ padding: '2rem', backgroundColor: '#ffffff' }}>

                  <div className="row">

                    {/* Template Configuration Section */}

                    <div className="col-12 mb-4">

                      <h6 className="fw-bold mb-3" style={{ color: '#495057', fontSize: '16px' }}>Template Configuration</h6>



                      <div className="row">

                        <div className="col-md-6 mb-3">

                          <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                            Template Type <span className="text-danger">*</span>

                          </label>

                          <select

                            className="form-select"

                            value={editForm.templateType || 'Custom'}

                            onChange={(e) => {

                              const newTemplateType = e.target.value;



                              // Reset all form data when template type changes

                              const resetFormData = resetFormDataForTemplateType(newTemplateType);

                              setEditForm(resetFormData);

                            }}

                            style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                          >

                            <option value="Custom">Custom</option>

                            <option value="Catalog">Catalog</option>

                            {/* <option value="Flows">Flows</option> */}

                            <option value="Authentication">Authentication</option>

                            <option value="Carousel">Carousel</option>

                            <option value="Order details">Order details</option>

                            <option value="Order Status">Order Status</option>

                          </select>

                        </div>



                        <div className="col-md-6 mb-3">

                          <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                            Template Category <span className="text-danger">*</span>

                          </label>

                          <select

                            className="form-select"

                            value={editForm.category}

                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}

                            disabled={editForm.templateType === 'Catalog' || editForm.templateType === 'Order Status' || editForm.templateType === 'Carousel' || editForm.templateType === 'Authentication'}

                            style={{

                              borderRadius: '8px',

                              border: '1px solid #ced4da',

                              backgroundColor: (editForm.templateType === 'Catalog' || editForm.templateType === 'Order Status' || editForm.templateType === 'Carousel' || editForm.templateType === 'Authentication') ? '#f8f9fa' : 'white',

                              color: (editForm.templateType === 'Catalog' || editForm.templateType === 'Order Status' || editForm.templateType === 'Carousel' || editForm.templateType === 'Authentication') ? '#6c757d' : 'inherit'

                            }}

                          >

                            <option value="">Select Category</option>

                            <option value="MARKETING">Marketing</option>

                            <option value="UTILITY">Utility</option>

                            <option value="AUTHENTICATION">Authentication</option>

                          </select>

                          {(editForm.templateType === 'Catalog' || editForm.templateType === 'Order Status' || editForm.templateType === 'Carousel' || editForm.templateType === 'Authentication') ? (

                            <small className="text-muted" style={{ fontSize: '12px' }}>

                              Category is automatically set for {editForm.templateType} templates

                            </small>

                          ) : (

                            <small className="text-muted" style={{ fontSize: '12px' }}>Auto-selected</small>

                          )}

                        </div>

                      </div>



                      <div className="row">

                        <div className="col-md-6 mb-3">

                          <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                            Template Name <span className="text-danger">*</span>

                          </label>

                          <input

                            type="text"

                            className="form-control"

                            placeholder="Enter template name (e.g., welcome_message)"

                            value={editForm.name}

                            onChange={(e) => {

                              const value = e.target.value;

                              const formattedName = formatTemplateName(value);

                              setEditForm({ ...editForm, name: formattedName });

                            }}

                            onKeyDown={(e) => {

                              // Replace spacebar with underscore immediately

                              if (e.key === ' ') {

                                e.preventDefault();

                                const currentValue = e.target.value;

                                const newValue = currentValue + '_';

                                const formattedName = formatTemplateName(newValue);

                                setEditForm({ ...editForm, name: formattedName });

                              }

                            }}

                            maxLength={512}

                            style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                          />

                          <small className="text-muted" style={{ fontSize: '12px' }}>

                            {editForm.name.length}/512. Press SPACEBAR to add underscores. Names are automatically formatted to lowercase.

                          </small>

                        </div>



                        <div className="col-md-6 mb-3">

                          <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                            Language <span className="text-danger">*</span>

                          </label>

                          <select

                            className="form-select"

                            value={editForm.language}

                            onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}

                            style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

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

                      </div>

                    </div>



                    {/* Template Content Section */}

                    {editForm.name && editForm.name.trim() !== '' && (

                      <div className="col-12">

                        <h6 className="fw-bold mb-3" style={{ color: '#495057', fontSize: '16px' }}>Template Content</h6>



                        {/* Header Section */}

                        {editForm.templateType !== 'Carousel' && editForm.templateType !== 'Catalog' && editForm.templateType !== 'Authentication' && editForm.templateType !== 'Order Status' && (

                          <div className="mb-4">

                            <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                              Header <span className="text-muted">(Optional)</span>

                            </label>

                            <div className="row">

                              <div className="col-md-6">

                                <select

                                  className="form-select"

                                  value={editForm.headerType}

                                  onChange={(e) => setEditForm({ ...editForm, headerType: e.target.value })}

                                  style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                                >

                                  <option value="None">No Header</option>

                                  <option value="Text">Text Header</option>

                                  <option value="IMAGE">Image Header</option>

                                  <option value="VIDEO">Video Header</option>

                                  <option value="DOCUMENT">Document Header</option>

                                </select>

                              </div>

                              <div className="col-md-6 d-flex align-items-end">

                                <small className="text-muted" style={{ fontSize: '12px' }}>Media or text header</small>

                              </div>

                            </div>



                            {editForm.headerType === 'Text' && (

                              <div className="mt-3">

                                <input

                                  type="text"

                                  className="form-control"

                                  placeholder="Enter header text"

                                  value={editForm.headerText}

                                  onChange={(e) => setEditForm({ ...editForm, headerText: e.target.value })}

                                  maxLength={60}

                                  style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                                />

                                <small className="text-muted" style={{ fontSize: '12px' }}>

                                  {editForm.headerText.length}/60

                                </small>

                              </div>

                            )}



                            {editForm.headerType === 'IMAGE' && (

                              <div className="mt-3">

                                <input

                                  type="file"

                                  className="form-control"

                                  accept="image/*"

                                  onChange={(e) => {

                                    const file = e.target.files[0];

                                    if (file) {

                                      // Create a preview URL for the selected file

                                      const reader = new FileReader();

                                      reader.onload = (event) => {

                                        setEditForm({ ...editForm, headerImage: event.target.result });

                                      };

                                      reader.readAsDataURL(file);

                                    }

                                  }}

                                  style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                                />

                                {editForm.headerImage && (

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

                                      }}

                                    />

                                  </div>

                                )}

                              </div>

                            )}



                            {editForm.headerType === 'VIDEO' && (

                              <div className="mt-3">

                                <input

                                  type="file"

                                  className="form-control"

                                  accept="video/*"

                                  onChange={(e) => {

                                    const file = e.target.files[0];

                                    if (file) {

                                      // Create a preview URL for the selected file

                                      const reader = new FileReader();

                                      reader.onload = (event) => {

                                        setEditForm({ ...editForm, headerVideo: event.target.result });

                                      };

                                      reader.readAsDataURL(file);

                                    }

                                  }}

                                  style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                                />

                                {editForm.headerVideo && (

                                  <div className="mt-2">

                                    <small className="text-muted d-block mb-1">Preview:</small>

                                    <video

                                      src={editForm.headerVideo}

                                      controls

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

                                      }}

                                    />

                                  </div>

                                )}

                              </div>

                            )}



                            {editForm.headerType === 'DOCUMENT' && (

                              <div className="mt-3">

                                <input

                                  type="file"

                                  className="form-control"

                                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"

                                  onChange={(e) => {

                                    const file = e.target.files[0];

                                    if (file) {

                                      // Create a preview URL for the selected file

                                      const reader = new FileReader();

                                      reader.onload = (event) => {

                                        setEditForm({ ...editForm, headerDocument: event.target.result });

                                      };

                                      reader.readAsDataURL(file);

                                    }

                                  }}

                                  style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                                />

                                {editForm.headerDocument && (

                                  <div className="mt-2">

                                    <small className="text-muted d-block mb-1">Document uploaded:</small>

                                    <div

                                      style={{

                                        padding: '12px',

                                        backgroundColor: '#f8f9fa',

                                        border: '1px solid #e9ecef',

                                        borderRadius: '4px',

                                        fontSize: '14px',

                                        color: '#495057'

                                      }}

                                    >

                                      <i className="fas fa-file me-2"></i>

                                      Document ready for preview

                                    </div>

                                  </div>

                                )}

                              </div>

                            )}

                          </div>

                        )}



                        {/* Message Body Section */}

                        {editForm.templateType !== 'Carousel' && editForm.templateType !== 'Authentication' && (

                          <div className="mb-4">

                            <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                              Message Body <span className="text-danger">*</span>

                            </label>

                            <textarea

                              className="form-control"

                              placeholder="Enter your message content here..."

                              rows={6}

                              value={editForm.bodyText}

                              onChange={(e) => {

                                const newBodyText = e.target.value;

                                const cleanedVariables = cleanupVariables(newBodyText);

                                setEditForm({

                                  ...editForm,

                                  bodyText: newBodyText,

                                  variables: cleanedVariables

                                });

                              }}

                              maxLength={1024}

                              style={{

                                borderRadius: '8px',

                                border: '1px solid #ced4da',

                                resize: 'vertical'

                              }}

                            />

                            <div className="d-flex justify-content-between align-items-center mt-2">

                              <div className="position-relative" ref={variableDropdownRef}>
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  style={{ fontSize: '12px' }}
                                  onClick={() => setShowVariableDropdown(!showVariableDropdown)}
                                >
                                  + Add Variable
                                </button>
                                
                                {showVariableDropdown && (
                                  <div 
                                    className="dropdown-menu show" 
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: 0,
                                      zIndex: 1000,
                                      maxHeight: '300px',
                                      overflowY: 'auto',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                      border: '1px solid #dee2e6',
                                      borderRadius: '8px',
                                      marginTop: '4px',
                                      minWidth: '200px'
                                    }}
                                  >
                                    <div className="px-3 py-2 border-bottom">
                                      <small className="text-muted fw-bold">Select Variable</small>
                                    </div>
                                    {predefinedVariables.map((variable, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        className="dropdown-item"
                                        style={{
                                          fontSize: '13px',
                                          padding: '8px 16px',
                                          cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                          const variables = editForm.variables || [];
                                          const newVariableNumber = variables.length + 1;
                                          
                                          const newVariable = {
                                            id: newVariableNumber,
                                            placeholder: `{{${variable.placeholder}}}`,
                                            value: '',
                                            displayName: variable.name
                                          };

                                          setEditForm({
                                            ...editForm,
                                            variables: [...variables, newVariable],
                                            bodyText: editForm.bodyText + `{{${variable.placeholder}}}`
                                          });
                                          
                                          setShowVariableDropdown(false);
                                        }}
                                      >
                                        {variable.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <small className="text-muted" style={{ fontSize: '12px' }}>

                                {editForm.bodyText.length}/1024

                              </small>

                            </div>

                            <small className="text-muted" style={{ fontSize: '12px' }}>

                              Variables allow dynamic content in your template.

                            </small>



                            {/* Variables Section */}

                            {editForm.variables && editForm.variables.length > 0 && (

                              <div className="mt-3">

                                <h6 className="fw-bold mb-2" style={{ color: '#495057', fontSize: '14px' }}>

                                  Variables in your message:

                                </h6>

                                {editForm.variables.map((variable, index) => (

                                  <div key={variable.id} className="mb-3">

                                    <div className="d-flex align-items-center mb-2">

                                      <span

                                        className="badge me-2"

                                        style={{

                                          backgroundColor: '#e3f2fd',

                                          color: '#1976d2',

                                          fontSize: '12px',

                                          padding: '4px 8px',

                                          borderRadius: '12px'

                                        }}

                                      >

                                        {variable.placeholder}

                                      </span>

                                      <span className="fw-medium" style={{ fontSize: '12px' }}>

                                        {variable.displayName || `Variable ${variable.id}`} Value:

                                      </span>

                                    </div>

                                    <input

                                      type="text"

                                      className="form-control form-control-sm"

                                      placeholder={`Enter value for ${variable.placeholder} (required)`}

                                      value={variable.value}

                                      onChange={(e) => {

                                        const variables = editForm.variables || [];

                                        const updatedVariables = variables.map(v =>

                                          v.id === variable.id ? { ...v, value: e.target.value } : v

                                        );

                                        setEditForm({ ...editForm, variables: updatedVariables });

                                      }}

                                      style={{

                                        border: variable.value ? '1px solid #ced4da' : '1px solid #dc3545',

                                        borderRadius: '4px'

                                      }}

                                    />

                                  </div>

                                ))}

                              </div>

                            )}

                          </div>

                        )}



                        {/* Footer Section */}

                        {editForm.templateType !== 'Carousel' && editForm.templateType !== 'Authentication' && (

                          <div className="mb-4">

                            <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                              Footer <span className="text-muted">(Optional)</span>

                            </label>

                            <input

                              type="text"

                              className="form-control"

                              placeholder="Enter footer text"

                              value={editForm.footerText}

                              onChange={(e) => setEditForm({ ...editForm, footerText: e.target.value })}

                              maxLength={60}

                              style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                            />

                            <div className="d-flex justify-content-between align-items-center mt-2">

                              <small className="text-muted" style={{ fontSize: '12px' }}>

                                Footer text appears at the bottom of your message in a smaller font.

                              </small>

                              <small className="text-muted" style={{ fontSize: '12px' }}>

                                {editForm.footerText.length}/60

                              </small>

                            </div>

                          </div>

                        )}



                        {/* Buttons Section */}

                        {editForm.templateType !== 'Carousel' && editForm.templateType !== 'Authentication' && editForm.templateType !== 'Order details' && editForm.templateType !== 'Order Status' && (

                          <div className="mb-4">

                            <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                              Buttons <span className="text-muted">(Optional)</span>

                            </label>



                            {/* Catalog Template Special Handling */}

                            {editForm.templateType === 'Catalog' && (

                              <div className="mb-3 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>

                                <div className="d-flex justify-content-between align-items-center mb-2">

                                  <small className="text-muted fw-medium" style={{ fontSize: '12px' }}>

                                    Catalog templates automatically include a 'View catalog' button.

                                  </small>

                                  <button

                                    type="button"

                                    className="btn btn-outline-danger btn-sm"

                                    disabled

                                    style={{ width: '24px', height: '24px', padding: '0', fontSize: '12px' }}



                                  >

                                    🗑️

                                  </button>

                                </div>

                                <div className="row">

                                  <div className="col-md-6">

                                    <label className="form-label fw-medium" style={{ fontSize: '12px' }}>Button text</label>

                                    <input

                                      type="text"

                                      className="form-control form-control-sm"

                                      placeholder="View catalog"

                                      value="View catalog"

                                      readOnly

                                      style={{ backgroundColor: '#e9ecef' }}

                                    />

                                  </div>

                                </div>

                              </div>

                            )}



                            {/* Regular Button Management */}

                            {editForm.templateType !== 'Catalog' && (

                              <div className="d-flex align-items-center">

                                {(editForm.buttons || []).length < 10 && (

                                  <div className="dropdown me-2">

                                    <button

                                      className="btn btn-outline-primary btn-sm dropdown-toggle"

                                      type="button"

                                      id="buttonDropdown"

                                      data-bs-toggle="dropdown"

                                      aria-expanded="false"

                                      style={{ fontSize: '12px' }}

                                    >

                                      + Add button

                                    </button>

                                    <ul className="dropdown-menu" aria-labelledby="buttonDropdown" style={{ minWidth: '250px' }}>

                                      <li>

                                        <button

                                          className="dropdown-item px-3 py-2"

                                          type="button"

                                          onClick={() => addButton('QUICK_REPLY')}

                                          style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}

                                        >

                                          <div className="fw-medium" style={{ fontSize: '14px' }}>Quick reply buttons</div>

                                          <small className="text-muted" style={{ fontSize: '12px' }}>Custom response</small>

                                        </button>

                                      </li>

                                      <li><hr className="dropdown-divider" /></li>

                                      <li>

                                        <button

                                          className="dropdown-item px-3 py-2"

                                          type="button"

                                          onClick={() => addButton('CALL_TO_ACTION')}

                                          style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}

                                        >

                                          <div className="fw-medium" style={{ fontSize: '14px' }}>Call-to-action buttons</div>

                                          <small className="text-muted" style={{ fontSize: '12px' }}>Visit website</small>

                                        </button>

                                      </li>

                                      <li><hr className="dropdown-divider" /></li>

                                      <li>

                                        <button

                                          className="dropdown-item px-3 py-2"

                                          type="button"

                                          onClick={() => addButton('PHONE_NUMBER')}

                                          style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}

                                        >

                                          <div className="fw-medium" style={{ fontSize: '14px' }}>Call Phone Number</div>

                                          <small className="text-muted" style={{ fontSize: '12px' }}>Call us</small>

                                        </button>

                                      </li>

                                      <li><hr className="dropdown-divider" /></li>

                                      <li>

                                        <button

                                          className="dropdown-item px-3 py-2"

                                          type="button"

                                          onClick={() => addButton('COPY_CODE')}

                                          style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}

                                        >

                                          <div className="fw-medium" style={{ fontSize: '14px' }}>Copy offer code</div>

                                          <small className="text-muted" style={{ fontSize: '12px' }}>Copy code</small>

                                        </button>

                                      </li>

                                    </ul>

                                  </div>

                                )}

                                <small className="text-muted" style={{ fontSize: '12px' }}>

                                  Create buttons that let customers respond to your message or take action. You can add up to ten buttons. If you add more than three buttons, they will appear in a list.

                                </small>

                              </div>

                            )}



                            {/* Button Configuration Forms */}

                            {editForm.buttons && editForm.buttons.length > 0 && (

                              <div className="mt-4">

                                {editForm.buttons.map((button, index) => (

                                  <div key={index} className="border rounded p-4 mb-3" style={{

                                    backgroundColor: '#ffffff',

                                    border: '1px solid #e9ecef',

                                    borderRadius: '8px'

                                  }}>

                                    <div className="d-flex justify-content-between align-items-center mb-3">

                                      <h6 className="fw-medium mb-0" style={{

                                        fontSize: '14px',

                                        color: '#495057',

                                        fontWeight: '600'

                                      }}>

                                        {button.type === 'CALL_TO_ACTION' ? 'Call-to-action buttons' :

                                          button.type === 'PHONE_NUMBER' ? 'Call Phone Number' :

                                            button.type === 'COPY_CODE' ? 'Copy offer code' :

                                              'Quick reply buttons'}

                                      </h6>

                                      <button

                                        type="button"

                                        className="btn btn-outline-danger btn-sm"

                                        onClick={() => removeButton(index)}

                                        style={{

                                          width: '28px',

                                          height: '28px',

                                          padding: '0',

                                          fontSize: '14px',

                                          border: '1px solid #dc3545',

                                          borderRadius: '4px',

                                          display: 'flex',

                                          alignItems: 'center',

                                          justifyContent: 'center'

                                        }}

                                      >

                                        🗑️

                                      </button>

                                    </div>



                                    {/* Button Text Field */}

                                    <div className="mb-3">

                                      <div className="d-flex justify-content-between align-items-center mb-2">

                                        <label className="form-label fw-medium mb-0" style={{

                                          fontSize: '13px',

                                          color: '#495057'

                                        }}>

                                          Button text

                                        </label>

                                        <small className="text-muted" style={{ fontSize: '11px' }}>

                                          {button.text.length} / 25

                                        </small>

                                      </div>

                                      <input

                                        type="text"

                                        className="form-control"

                                        placeholder="Button text"

                                        value={button.text}

                                        onChange={(e) => updateButton(index, 'text', e.target.value)}

                                        maxLength={25}

                                        style={{

                                          fontSize: '13px',

                                          border: '1px solid #ced4da',

                                          borderRadius: '6px',

                                          padding: '8px 12px'

                                        }}

                                      />

                                    </div>



                                    {/* Additional Fields based on button type */}

                                    {button.type === 'CALL_TO_ACTION' && (

                                      <div className="mb-2">

                                        <label className="form-label fw-medium mb-2" style={{

                                          fontSize: '13px',

                                          color: '#495057'

                                        }}>

                                          Website URL

                                        </label>

                                        <input

                                          type="url"

                                          className="form-control"

                                          placeholder="https://example.com"

                                          value={button.url || ''}

                                          onChange={(e) => updateButton(index, 'url', e.target.value)}

                                          style={{

                                            fontSize: '13px',

                                            border: '1px solid #ced4da',

                                            borderRadius: '6px',

                                            padding: '8px 12px'

                                          }}

                                        />

                                      </div>

                                    )}



                                    {button.type === 'PHONE_NUMBER' && (

                                      <div className="mb-2">

                                        <label className="form-label fw-medium mb-2" style={{

                                          fontSize: '13px',

                                          color: '#495057'

                                        }}>

                                          Phone number

                                        </label>

                                        <input

                                          type="tel"

                                          className="form-control"

                                          placeholder="+1234567890"

                                          value={button.phone_number || ''}

                                          onChange={(e) => updateButton(index, 'phone_number', e.target.value)}

                                          style={{

                                            fontSize: '13px',

                                            border: '1px solid #ced4da',

                                            borderRadius: '6px',

                                            padding: '8px 12px'

                                          }}

                                        />

                                      </div>

                                    )}

                                  </div>

                                ))}

                              </div>

                            )}

                          </div>

                        )}



                        {/* Flow Configuration Section */}

                        {editForm.templateType === 'Flows' && (

                          <div className="mb-4">

                            <h6 className="fw-bold mb-2" style={{ color: '#495057', fontSize: '16px' }}>Flow Configuration</h6>

                            <small className="text-muted mb-3 d-block" style={{ fontSize: '12px' }}>

                              Configure flow settings for flow buttons

                            </small>



                            <div className="row">

                              <div className="col-md-4 mb-3">

                                <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                                  Flow Id:

                                </label>

                                <select

                                  className="form-select"

                                  value={editForm.flowId}

                                  onChange={(e) => setEditForm({ ...editForm, flowId: e.target.value })}

                                  style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                                >

                                  <option value="">Select a Flow</option>

                                  <option value="flow_001">Registration Flow</option>

                                  <option value="flow_002">Support Flow</option>

                                  <option value="flow_003">Order Flow</option>

                                  <option value="flow_004">Feedback Flow</option>

                                  <option value="flow_005">Survey Flow</option>

                                </select>

                              </div>



                              <div className="col-md-4 mb-3">

                                <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                                  Flow Action:

                                </label>

                                <select

                                  className="form-select"

                                  value={editForm.flowAction}

                                  onChange={(e) => setEditForm({ ...editForm, flowAction: e.target.value })}

                                  style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                                >

                                  <option value="">Select Flow Action</option>

                                  <option value="navigate">Navigate</option>

                                  <option value="data_exchange">Data exchange</option>

                                </select>

                              </div>



                              <div className="col-md-4 mb-3">

                                <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                                  Navigate Screen:

                                </label>

                                <select

                                  className="form-select"

                                  value={editForm.navigateScreen}

                                  onChange={(e) => setEditForm({ ...editForm, navigateScreen: e.target.value })}

                                  style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                                >

                                  <option value="">Select screen</option>

                                  <option value="REGISTRATION">Registration</option>

                                  <option value="SUPPORT">Support</option>

                                  <option value="ORDER">Order</option>

                                  <option value="FEEDBACK">Feedback</option>

                                  <option value="SURVEY">Survey</option>

                                  <option value="PAYMENT">Payment</option>

                                  <option value="CONFIRMATION">Confirmation</option>

                                </select>

                              </div>

                            </div>

                          </div>

                        )}



                        {/* Authentication Configuration Section */}

                        {editForm.templateType === 'Authentication' && (

                          <div className="mb-4">

                            <h6 className="fw-bold mb-2" style={{ color: '#495057', fontSize: '16px' }}>

                              Code delivery setup <span className="text-danger">*</span>

                            </h6>

                            <p className="text-muted mb-3" style={{ fontSize: '14px' }}>

                              Choose how customers send the code from WhatsApp to your app. Edits to this section won't require review or count towards edit limits.

                            </p>



                            <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa' }}>

                              <div className="form-check mb-3">

                                <input

                                  className="form-check-input"

                                  type="radio"

                                  name="codeDeliveryMethod"

                                  id="copyCode"

                                  value="copy_code"

                                  checked={editForm.codeDeliveryMethod === 'copy_code'}

                                  onChange={(e) => setEditForm({ ...editForm, codeDeliveryMethod: e.target.value })}

                                  style={{ marginTop: '0.25rem' }}

                                />

                                <label className="form-check-label" htmlFor="copyCode" style={{ fontSize: '14px' }}>

                                  <div className="fw-medium">Copy code</div>

                                  <small className="text-muted d-block" style={{ fontSize: '12px' }}>

                                    Basic authentication with quick setup. Your customers copy and paste the code into your app.

                                  </small>

                                </label>

                              </div>





                            </div>

                          </div>

                        )}



                        {/* Carousel Message Section */}

                        {editForm.templateType === 'Carousel' && (

                          <div className="mb-4">

                            <h6 className="fw-bold mb-2" style={{ color: '#495057', fontSize: '16px' }}>

                              Carousel Message <span className="text-danger">*</span>

                            </h6>

                            <small className="text-muted mb-3 d-block" style={{ fontSize: '12px' }}>

                              Main message above carousel cards (required)

                            </small>



                            <div className="mb-3">

                              <textarea

                                className="form-control"

                                placeholder="Enter your message content here..."

                                rows={4}

                                value={editForm.carouselMessage}

                                onChange={(e) => setEditForm({ ...editForm, carouselMessage: e.target.value })}

                                style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                              />

                              <div className="d-flex justify-content-between align-items-center mt-2">

                                <small className="text-muted" style={{ fontSize: '12px' }}>

                                  {editForm.carouselMessage.length} / 1024

                                </small>

                                <div className="position-relative" ref={carouselVariableDropdownRef}>
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => setShowCarouselVariableDropdown(!showCarouselVariableDropdown)}
                                    style={{ fontSize: '12px' }}
                                  >
                                    + Add Variable
                                  </button>
                                  
                                  {showCarouselVariableDropdown && (
                                    <div 
                                      className="dropdown-menu show" 
                                      style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        zIndex: 1000,
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '8px',
                                        marginTop: '4px',
                                        minWidth: '200px'
                                      }}
                                    >
                                      <div className="px-3 py-2 border-bottom">
                                        <small className="text-muted fw-bold">Select Variable</small>
                                      </div>
                                      {predefinedVariables.map((variable, index) => (
                                        <button
                                          key={index}
                                          type="button"
                                          className="dropdown-item"
                                          style={{
                                            fontSize: '13px',
                                            padding: '8px 16px',
                                            cursor: 'pointer'
                                          }}
                                          onClick={() => {
                                            const existingVariables = editForm.carouselVariables || [];
                                            const newVariable = {
                                              id: Date.now(),
                                              placeholder: `{{${variable.placeholder}}}`,
                                              value: '',
                                              displayName: variable.name
                                            };

                                            setEditForm({
                                              ...editForm,
                                              carouselMessage: editForm.carouselMessage + `{{${variable.placeholder}}}`,
                                              carouselVariables: [...existingVariables, newVariable]
                                            });
                                            
                                            setShowCarouselVariableDropdown(false);
                                          }}
                                        >
                                          {variable.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                              </div>

                              <small className="text-muted" style={{ fontSize: '11px' }}>

                                Variables allow dynamic content in your template

                              </small>

                            </div>

                          </div>

                        )}



                        {/* Carousel Variables Section */}

                        {editForm.templateType === 'Carousel' && editForm.carouselVariables && editForm.carouselVariables.length > 0 && (

                          <div className="mb-4">

                            <h6 className="fw-bold mb-3" style={{ color: '#495057', fontSize: '16px' }}>

                              Variables in your message:

                            </h6>

                            {editForm.carouselVariables.map((variable, index) => (

                              <div key={variable.id} className="mb-3">

                                <div className="d-flex align-items-center mb-2">

                                  <span
                                    className="badge me-2"
                                    style={{
                                      backgroundColor: '#e3f2fd',
                                      color: '#1976d2',
                                      fontSize: '12px',
                                      padding: '4px 8px',
                                      borderRadius: '12px'
                                    }}
                                  >
                                    {variable.placeholder}
                                  </span>

                                  <label className="form-label fw-medium me-2" style={{ fontSize: '14px', minWidth: '120px' }}>

                                    {variable.displayName || `Variable ${index + 1}`} Value:

                                  </label>

                                  <button

                                    type="button"

                                    className="btn btn-outline-danger btn-sm ms-auto"

                                    onClick={() => removeCarouselVariable(variable.id)}

                                    style={{ width: '24px', height: '24px', padding: '0', fontSize: '12px' }}

                                    title="Remove variable"

                                  >

                                    🗑️

                                  </button>

                                </div>

                                <input

                                  type="text"

                                  className="form-control"

                                  placeholder={`Enter value for ${variable.placeholder} (required)`}

                                  value={variable.value}

                                  onChange={(e) => updateCarouselVariable(variable.id, e.target.value)}

                                  style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                                />

                              </div>

                            ))}

                          </div>

                        )}



                        {/* Carousel Cards Section */}

                        {editForm.templateType === 'Carousel' && (

                          <div className="mb-4">

                            <h6 className="fw-bold mb-2" style={{ color: '#495057', fontSize: '16px' }}>

                              Carousel Cards <span className="text-danger">*</span>

                            </h6>

                            <small className="text-muted mb-3 d-block" style={{ fontSize: '12px' }}>

                              Create multiple cards that customers can swipe through. All cards must have the same type of header and include body text.

                            </small>



                            {/* Carousel Header Type Selection */}

                            <div className="mb-3">

                              <label className="form-label fw-medium" style={{ fontSize: '14px' }}>

                                Carousel Header Type <span className="text-danger">*</span>

                              </label>

                              <select

                                className="form-select"

                                value={editForm.carouselHeaderType}

                                onChange={(e) => setEditForm({ ...editForm, carouselHeaderType: e.target.value })}

                                style={{ borderRadius: '8px', border: '1px solid #ced4da' }}

                              >

                                <option value="">Select header type for all cards</option>

                                <option value="IMAGE">Image Header</option>

                                <option value="VIDEO">Video Header</option>

                              </select>

                              <small className="text-muted" style={{ fontSize: '12px' }}>

                                Required for all cards

                              </small>

                            </div>



                            {/* Carousel Cards Container */}

                            <div className="border rounded p-3" style={{

                              backgroundColor: '#f8f9fa',

                              minHeight: '200px',

                              border: '2px dashed #ced4da'

                            }}>

                              {!editForm.carouselHeaderType ? (

                                <div className="text-center text-muted py-4">

                                  <div className="mb-2">

                                    <i className="fas fa-images" style={{ fontSize: '2rem', opacity: 0.5 }}></i>

                                  </div>

                                  <div className="fw-medium mb-1">Select header type first</div>

                                  <small>Choose whether all cards will have image or video headers</small>

                                </div>

                              ) : (

                                <div>

                                  <div className="d-flex justify-content-between align-items-center mb-3">

                                    <span className="fw-medium" style={{ fontSize: '14px' }}>

                                      {(editForm.carouselCards || []).length} of 10 cards

                                    </span>

                                    <button

                                      type="button"

                                      className="btn btn-outline-primary btn-sm"

                                      onClick={() => {

                                        const carouselCards = editForm.carouselCards || [];

                                        if (carouselCards.length < 10) {

                                          const newCard = {

                                            id: Date.now(),

                                            headerImage: '',

                                            bodyText: '',

                                            buttons: [],

                                            variables: []

                                          };

                                          setEditForm({

                                            ...editForm,

                                            carouselCards: [...carouselCards, newCard]

                                          });

                                        }

                                      }}

                                      disabled={(editForm.carouselCards || []).length >= 10}

                                      style={{ fontSize: '12px' }}

                                    >

                                      + Add Card

                                    </button>

                                  </div>



                                  {(editForm.carouselCards || []).length === 0 ? (

                                    <div className="text-center text-muted py-4">

                                      <div className="mb-2">

                                        <i className="fas fa-plus-circle" style={{ fontSize: '2rem', opacity: 0.5 }}></i>

                                      </div>

                                      <div className="fw-medium mb-1">No cards added yet</div>

                                      <small>Click "Add Card" to create your first carousel card</small>

                                    </div>

                                  ) : (

                                    <div className="row">

                                      {editForm.carouselCards && editForm.carouselCards.map((card, index) => (

                                        <div key={card.id} className="col-12 mb-3">

                                          <div className="card border" style={{ backgroundColor: 'white' }}>

                                            <div className="card-header d-flex justify-content-between align-items-center">

                                              <span className="fw-medium" style={{ fontSize: '14px' }}>

                                                Card {index + 1}

                                              </span>

                                              <button

                                                type="button"

                                                className="btn btn-outline-danger btn-sm"

                                                onClick={() => {

                                                  const carouselCards = editForm.carouselCards || [];

                                                  setEditForm({

                                                    ...editForm,

                                                    carouselCards: carouselCards.filter(c => c.id !== card.id)

                                                  });

                                                }}

                                                style={{ width: '24px', height: '24px', padding: '0', fontSize: '12px' }}

                                              >

                                                ×

                                              </button>

                                            </div>

                                            <div className="card-body p-3">

                                              <div className="mb-2">

                                                <label className="form-label fw-medium" style={{ fontSize: '12px' }}>

                                                  {editForm.carouselHeaderType === 'IMAGE' ? 'Image' : 'Video'}

                                                </label>

                                                <div className="d-flex align-items-center gap-2">

                                                  <button

                                                    type="button"

                                                    className="btn btn-outline-primary btn-sm"

                                                    style={{ fontSize: '12px' }}

                                                    onClick={() => {

                                                      const input = document.createElement('input');

                                                      input.type = 'file';

                                                      input.accept = editForm.carouselHeaderType === 'IMAGE' ? 'image/*' : 'video/*';

                                                      input.onchange = (e) => {

                                                        const file = e.target.files[0];

                                                        if (file) {

                                                          const reader = new FileReader();

                                                          reader.onload = (event) => {

                                                            const carouselCards = editForm.carouselCards || [];

                                                            const updatedCards = carouselCards.map(c =>

                                                              c.id === card.id ? { ...c, headerImage: event.target.result } : c

                                                            );

                                                            setEditForm({ ...editForm, carouselCards: updatedCards });

                                                          };

                                                          reader.readAsDataURL(file);

                                                        }

                                                      };

                                                      input.click();

                                                    }}

                                                  >

                                                    <i className={`fas fa-${editForm.carouselHeaderType === 'IMAGE' ? 'image' : 'video'} me-1`}></i>

                                                    Upload {editForm.carouselHeaderType === 'IMAGE' ? 'image' : 'video'}

                                                  </button>

                                                  {(card.headerImage || card.headerVideo) && (

                                                    <span className="text-success" style={{ fontSize: '12px' }}>

                                                      <i className="fas fa-check-circle me-1"></i>

                                                      {editForm.carouselHeaderType === 'IMAGE' ? 'Image' : 'Video'} uploaded

                                                    </span>

                                                  )}

                                                </div>

                                                {(card.headerImage || card.headerVideo) && (

                                                  <div className="mt-2">

                                                    <div className="mb-2">

                                                      <small className="text-muted d-block mb-1">Preview:</small>

                                                      {editForm.carouselHeaderType === 'IMAGE' ? (

                                                        <img

                                                          src={card.headerImage}

                                                          alt="Card preview"

                                                          style={{

                                                            maxWidth: '100%',

                                                            maxHeight: '150px',

                                                            objectFit: 'contain',

                                                            borderRadius: '4px',

                                                            border: '1px solid #dee2e6'

                                                          }}

                                                          onError={(e) => {

                                                            e.target.style.display = 'none';

                                                          }}

                                                        />

                                                      ) : (

                                                        <video

                                                          src={card.headerVideo}

                                                          controls

                                                          style={{

                                                            maxWidth: '100%',

                                                            maxHeight: '150px',

                                                            borderRadius: '4px',

                                                            border: '1px solid #dee2e6'

                                                          }}

                                                          onError={(e) => {

                                                            e.target.style.display = 'none';

                                                          }}

                                                        />

                                                      )}

                                                    </div>



                                                  </div>

                                                )}

                                              </div>

                                              <div className="mb-2">

                                                <label className="form-label fw-medium" style={{ fontSize: '12px' }}>

                                                  Body Text <span className="text-danger">*</span>

                                                </label>

                                                <textarea

                                                  className="form-control form-control-sm"

                                                  placeholder="Enter card body text"

                                                  rows={2}

                                                  value={card.bodyText}

                                                  onChange={(e) => {

                                                    const carouselCards = editForm.carouselCards || [];

                                                    const updatedCards = carouselCards.map(c =>

                                                      c.id === card.id ? { ...c, bodyText: e.target.value } : c

                                                    );

                                                    setEditForm({ ...editForm, carouselCards: updatedCards });

                                                  }}

                                                />

                                                <div className="d-flex justify-content-between align-items-center mt-2">

                                                  <div className="position-relative">
                                                    <button
                                                      type="button"
                                                      className="btn btn-outline-secondary btn-sm"
                                                      onClick={() => setShowCardVariableDropdown(showCardVariableDropdown === card.id ? null : card.id)}
                                                      style={{ fontSize: '12px' }}
                                                    >
                                                      + Add Variable
                                                    </button>
                                                    
                                                    {showCardVariableDropdown === card.id && (
                                                      <div 
                                                        className="dropdown-menu show" 
                                                        style={{
                                                          position: 'absolute',
                                                          top: '100%',
                                                          left: 0,
                                                          zIndex: 1000,
                                                          maxHeight: '300px',
                                                          overflowY: 'auto',
                                                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                          border: '1px solid #dee2e6',
                                                          borderRadius: '8px',
                                                          marginTop: '4px',
                                                          minWidth: '200px'
                                                        }}
                                                      >
                                                        <div className="px-3 py-2 border-bottom">
                                                          <small className="text-muted fw-bold">Select Variable</small>
                                                        </div>
                                                        {predefinedVariables.map((variable, index) => (
                                                          <button
                                                            key={index}
                                                            type="button"
                                                            className="dropdown-item"
                                                            style={{
                                                              fontSize: '13px',
                                                              padding: '8px 16px',
                                                              cursor: 'pointer'
                                                            }}
                                                            onClick={() => {
                                                              const variables = card.variables || [];
                                                              
                                                              const newVariable = {
                                                                id: Date.now(),
                                                                placeholder: `{{${variable.placeholder}}}`,
                                                                value: '',
                                                                displayName: variable.name
                                                              };

                                                              const updatedCards = editForm.carouselCards.map(c =>
                                                                c.id === card.id ? {
                                                                  ...c,
                                                                  variables: [...variables, newVariable],
                                                                  bodyText: c.bodyText + `{{${variable.placeholder}}}`
                                                                } : c
                                                              );

                                                              setEditForm({ ...editForm, carouselCards: updatedCards });
                                                              setShowCardVariableDropdown(null);
                                                            }}
                                                          >
                                                            {variable.name}
                                                          </button>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>

                                                  <small className="text-muted" style={{ fontSize: '11px' }}>

                                                    Variables let you personalize each card

                                                  </small>

                                                </div>

                                              </div>



                                              {/* Variable Values Section */}

                                              {card.variables && card.variables.length > 0 && (

                                                <div className="mb-3">

                                                  <label className="form-label fw-medium" style={{ fontSize: '12px' }}>

                                                    Variable Values

                                                  </label>

                                                  {card.variables.map((variable, varIndex) => (

                                                    <div key={variable.id} className="mb-2">

                                                      <div className="d-flex align-items-center mb-1">
                                                        <span
                                                          className="badge me-2"
                                                          style={{
                                                            backgroundColor: '#e3f2fd',
                                                            color: '#1976d2',
                                                            fontSize: '11px',
                                                            padding: '3px 6px',
                                                            borderRadius: '10px'
                                                          }}
                                                        >
                                                          {variable.placeholder}
                                                        </span>
                                                        <label className="form-label fw-medium mb-0" style={{ fontSize: '11px' }}>
                                                          {variable.displayName || `Variable ${varIndex + 1}`} Value:
                                                        </label>
                                                      </div>

                                                      <input

                                                        type="text"

                                                        className="form-control form-control-sm"

                                                        placeholder={`Enter value for ${variable.placeholder} (required)`}

                                                        value={variable.value}

                                                        onChange={(e) => {

                                                          const carouselCards = editForm.carouselCards || [];

                                                          const updatedCards = carouselCards.map(c =>

                                                            c.id === card.id ? {

                                                              ...c,

                                                              variables: (c.variables || []).map(v =>

                                                                v.id === variable.id ? { ...v, value: e.target.value } : v

                                                              )

                                                            } : c

                                                          );

                                                          setEditForm({ ...editForm, carouselCards: updatedCards });

                                                        }}

                                                        style={{

                                                          borderColor: !variable.value ? '#dc3545' : '#ced4da',

                                                          fontSize: '12px'

                                                        }}

                                                      />

                                                    </div>

                                                  ))}

                                                </div>

                                              )}



                                              {/* Buttons Section */}

                                              <div className="mb-2">

                                                <div className="d-flex justify-content-between align-items-center mb-2">

                                                  <label className="form-label fw-medium mb-0" style={{ fontSize: '12px' }}>

                                                    Buttons

                                                  </label>

                                                  <small className="text-muted" style={{ fontSize: '10px' }}>

                                                    Max 2 per card

                                                  </small>

                                                </div>



                                                {/* Add Button Dropdown */}

                                                {(card.buttons || []).length < 2 && (

                                                  <div className="dropdown">

                                                    <button

                                                      className="btn btn-outline-primary btn-sm dropdown-toggle"

                                                      type="button"

                                                      id={`buttonDropdown-${card.id}`}

                                                      data-bs-toggle="dropdown"

                                                      aria-expanded="false"

                                                      style={{ fontSize: '12px' }}

                                                    >

                                                      + Add button

                                                    </button>

                                                    <ul className="dropdown-menu" aria-labelledby={`buttonDropdown-${card.id}`} style={{ minWidth: '250px' }}>

                                                      <li>

                                                        <button

                                                          className="dropdown-item px-3 py-2"

                                                          type="button"

                                                          onClick={() => {

                                                            const newButton = {

                                                              id: Date.now(),

                                                              type: 'quick_reply',

                                                              text: '',

                                                              url: ''

                                                            };

                                                            const carouselCards = editForm.carouselCards || [];

                                                            const updatedCards = carouselCards.map(c =>

                                                              c.id === card.id ? { ...c, buttons: [...(c.buttons || []), newButton] } : c

                                                            );

                                                            setEditForm({ ...editForm, carouselCards: updatedCards });

                                                          }}

                                                          style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}

                                                        >

                                                          <div className="fw-medium" style={{ fontSize: '14px' }}>Quick reply buttons</div>

                                                          <small className="text-muted" style={{ fontSize: '12px' }}>Custom response</small>

                                                        </button>

                                                      </li>

                                                      <li><hr className="dropdown-divider" /></li>

                                                      <li>

                                                        <button

                                                          className="dropdown-item px-3 py-2"

                                                          type="button"

                                                          onClick={() => {

                                                            const newButton = {

                                                              id: Date.now(),

                                                              type: 'call_to_action',

                                                              text: '',

                                                              url: ''

                                                            };

                                                            const carouselCards = editForm.carouselCards || [];

                                                            const updatedCards = carouselCards.map(c =>

                                                              c.id === card.id ? { ...c, buttons: [...(c.buttons || []), newButton] } : c

                                                            );

                                                            setEditForm({ ...editForm, carouselCards: updatedCards });

                                                          }}

                                                          style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}

                                                        >

                                                          <div className="fw-medium" style={{ fontSize: '14px' }}>Call-to-action buttons</div>

                                                          <small className="text-muted" style={{ fontSize: '12px' }}>Visit website</small>

                                                        </button>

                                                      </li>

                                                    </ul>

                                                  </div>

                                                )}



                                                {/* Button Configurations */}

                                                {card.buttons && card.buttons.map((button, buttonIndex) => (

                                                  <div key={button.id} className="mt-3 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>

                                                    <div className="d-flex justify-content-between align-items-center mb-2">

                                                      <div>

                                                        <span className="fw-medium" style={{ fontSize: '12px' }}>

                                                          {button.type === 'quick_reply' ? 'Quick reply buttons' : 'Call-to-action buttons'}

                                                        </span>

                                                        <div className="text-muted" style={{ fontSize: '11px' }}>

                                                          {button.type === 'quick_reply' ? 'Quick reply.' : 'Visit website.'}

                                                        </div>

                                                      </div>

                                                      <button

                                                        type="button"

                                                        className="btn btn-outline-danger btn-sm"

                                                        onClick={() => {

                                                          const carouselCards = editForm.carouselCards || [];

                                                          const updatedCards = carouselCards.map(c =>

                                                            c.id === card.id ? { ...c, buttons: (c.buttons || []).filter(b => b.id !== button.id) } : c

                                                          );

                                                          setEditForm({ ...editForm, carouselCards: updatedCards });

                                                        }}

                                                        style={{ width: '24px', height: '24px', padding: '0', fontSize: '12px' }}

                                                      >

                                                        <i className="fas fa-trash"></i>

                                                      </button>

                                                    </div>



                                                    <div className="mb-2">

                                                      <label className="form-label fw-medium" style={{ fontSize: '12px' }}>

                                                        Button text

                                                      </label>

                                                      <div className="d-flex justify-content-between align-items-center">

                                                        <input

                                                          type="text"

                                                          className="form-control form-control-sm"

                                                          placeholder="Button text"

                                                          value={button.text}

                                                          onChange={(e) => {

                                                            const carouselCards = editForm.carouselCards || [];

                                                            const updatedCards = carouselCards.map(c =>

                                                              c.id === card.id ? {

                                                                ...c,

                                                                buttons: (c.buttons || []).map(b =>

                                                                  b.id === button.id ? { ...b, text: e.target.value } : b

                                                                )

                                                              } : c

                                                            );

                                                            setEditForm({ ...editForm, carouselCards: updatedCards });

                                                          }}

                                                          style={{ flex: 1, marginRight: '10px' }}

                                                        />

                                                        <small className="text-muted" style={{ fontSize: '10px', minWidth: '50px' }}>

                                                          {button.text.length} / 25

                                                        </small>

                                                      </div>

                                                    </div>



                                                    {button.type === 'call_to_action' && (

                                                      <div className="mb-2">

                                                        <label className="form-label fw-medium" style={{ fontSize: '12px' }}>

                                                          Website URL

                                                        </label>

                                                        <input

                                                          type="url"

                                                          className="form-control form-control-sm"

                                                          placeholder="https://example.com"

                                                          value={button.url}

                                                          onChange={(e) => {

                                                            const carouselCards = editForm.carouselCards || [];

                                                            const updatedCards = carouselCards.map(c =>

                                                              c.id === card.id ? {

                                                                ...c,

                                                                buttons: (c.buttons || []).map(b =>

                                                                  b.id === button.id ? { ...b, url: e.target.value } : b

                                                                )

                                                              } : c

                                                            );

                                                            setEditForm({ ...editForm, carouselCards: updatedCards });

                                                          }}

                                                        />

                                                      </div>

                                                    )}

                                                  </div>

                                                ))}

                                              </div>

                                            </div>

                                          </div>

                                        </div>

                                      ))}

                                    </div>

                                  )}

                                </div>

                              )}

                            </div>

                          </div>

                        )}



                        {/* Order Details Section */}

                        {editForm.templateType === 'Order details' && (

                          <div className="mb-4">

                            <h6 className="fw-bold mb-2" style={{ color: '#495057', fontSize: '16px' }}>

                              Order Details Configuration

                            </h6>

                            <small className="text-muted mb-3 d-block" style={{ fontSize: '12px' }}>

                              Order details templates automatically include a 'Review and Pay' button.

                            </small>



                            <div className="border rounded p-3" disabled style={{ backgroundColor: '#f8f9fa' }}>

                              <div className="d-flex justify-content-between align-items-center mb-2">

                                <small className="text-muted fw-medium" style={{ fontSize: '12px' }}>

                                  Review and Pay Button

                                </small>

                                <button

                                  type="button"

                                  className="btn btn-outline-danger btn-sm"

                                  disabled

                                  style={{ width: '24px', height: '24px', padding: '0', fontSize: '12px' }}

                                  title="Remove order details button"

                                >

                                  🗑️

                                </button>

                              </div>

                              <div className="row">

                                <div className="col-md-6">

                                  <label className="form-label fw-medium" style={{ fontSize: '12px' }}>Button text</label>

                                  <input

                                    type="text"

                                    className="form-control form-control-sm"

                                    placeholder="Review and Pay"

                                    disabled

                                    value={editForm.orderButtonText}

                                  />

                                </div>

                              </div>

                            </div>

                          </div>

                        )}



                        {/* Order Status Section */}

                        {false && editForm.templateType === 'Order Status' && (

                          <div className="mb-4">

                            <h6 className="fw-bold mb-2" style={{ color: '#495057', fontSize: '16px' }}>

                              Order Status Configuration

                            </h6>

                            <small className="text-muted mb-3 d-block" style={{ fontSize: '12px' }}>

                              Order status templates automatically include 'Track Order' and 'Cancel Order' buttons.

                            </small>



                            <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa' }}>

                              <div className="d-flex justify-content-between align-items-center mb-2">

                                <small className="text-muted fw-medium" style={{ fontSize: '12px' }}>

                                  Order Status Buttons

                                </small>

                                <button

                                  type="button"

                                  className="btn btn-outline-danger btn-sm"

                                  onClick={() => {

                                    setEditForm({ ...editForm, templateType: 'Custom' });

                                  }}

                                  style={{ width: '24px', height: '24px', padding: '0', fontSize: '12px' }}

                                  title="Remove order status buttons"

                                >

                                  🗑️

                                </button>

                              </div>

                              <div className="row">

                                <div className="col-md-6 mb-2">

                                  <label className="form-label fw-medium" style={{ fontSize: '12px' }}>Button 1</label>

                                  <input

                                    type="text"

                                    className="form-control form-control-sm"

                                    placeholder="Track Order"

                                    value={editForm.orderStatusButtons[0] || 'Track Order'}

                                    onChange={(e) => {

                                      const orderStatusButtons = editForm.orderStatusButtons || ['Track Order', 'Cancel Order'];

                                      const newButtons = [...orderStatusButtons];

                                      newButtons[0] = e.target.value;

                                      setEditForm({ ...editForm, orderStatusButtons: newButtons });

                                    }}

                                  />

                                </div>

                                <div className="col-md-6 mb-2">

                                  <label className="form-label fw-medium" style={{ fontSize: '12px' }}>Button 2</label>

                                  <input

                                    type="text"

                                    className="form-control form-control-sm"

                                    placeholder="Cancel Order"

                                    value={editForm.orderStatusButtons[1] || 'Cancel Order'}

                                    onChange={(e) => {

                                      const orderStatusButtons = editForm.orderStatusButtons || ['Track Order', 'Cancel Order'];

                                      const newButtons = [...orderStatusButtons];

                                      newButtons[1] = e.target.value;

                                      setEditForm({ ...editForm, orderStatusButtons: newButtons });

                                    }}

                                  />

                                </div>

                              </div>

                            </div>

                          </div>

                        )}

                      </div>

                    )}

                  </div>

                </div>



                {/* Right Side - Preview */}

                <div className="col-md-4" style={{ padding: '2rem', backgroundColor: '#f8f9fa', borderLeft: '1px solid #e9ecef' }}>

                  <div className="d-flex justify-content-between align-items-center mb-3">

                    <h6 className="fw-bold mb-0" style={{ color: '#495057', fontSize: '16px' }}>Preview</h6>

                    <div className="d-flex gap-2">

                      <button

                        type="button"

                        className="btn btn-outline-secondary btn-sm"

                        style={{ fontSize: '12px' }}

                      >

                        Generate with AI

                      </button>

                      <button

                        type="button"

                        className="btn btn-outline-secondary btn-sm"

                        onClick={closeCreateModal}

                        style={{ fontSize: '12px' }}

                      >

                        Back to Templates

                      </button>

                    </div>

                  </div>



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

                                    }}

                                  />

                                ) : editForm.headerType === 'VIDEO' && editForm.headerVideo && editForm.headerVideo.trim() !== '' ? (

                                  <video

                                    src={editForm.headerVideo}

                                    controls

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

                                    }}

                                  />

                                ) : editForm.headerType === 'DOCUMENT' && editForm.headerDocument && editForm.headerDocument.trim() !== '' ? (

                                  <div style={{

                                    padding: '12px',

                                    backgroundColor: '#f8f9fa',

                                    border: '1px solid #e9ecef',

                                    borderRadius: '4px',

                                    fontSize: '14px',

                                    fontWeight: '500',

                                    color: '#495057',

                                    textAlign: 'center'

                                  }}>

                                    <i className="fas fa-file me-2"></i>

                                    Document Header

                                  </div>

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

                            {editForm.templateType === 'Carousel'

                              ? (replaceCarouselMessageVariables(editForm.carouselMessage) || 'Enter your carousel message...')

                              : (replaceVariablesInText(editForm.bodyText) || 'Enter your message body...')

                            }

                          </div>



                          {/* Carousel Cards Preview */}

                          {editForm.templateType === 'Carousel' && editForm.carouselCards && editForm.carouselCards.length > 0 && (

                            <div className="carousel-preview mt-3">

                              <div style={{ position: 'relative' }}>

                                {/* Navigation Buttons */}

                                {editForm.carouselCards.length > 1 && (

                                  <>

                                    <button

                                      type="button"

                                      className="carousel-nav-btn"

                                      style={{

                                        position: 'absolute',

                                        left: '8px',

                                        top: '50%',

                                        transform: 'translateY(-50%)',

                                        zIndex: 10,

                                        backgroundColor: 'rgba(0,0,0,0.5)',

                                        color: 'white',

                                        border: 'none',

                                        borderRadius: '50%',

                                        width: '32px',

                                        height: '32px',

                                        display: 'flex',

                                        alignItems: 'center',

                                        justifyContent: 'center',

                                        fontSize: '14px',

                                        cursor: 'pointer'

                                      }}

                                      onClick={(e) => {

                                        e.preventDefault();

                                        e.stopPropagation();

                                        goToPreviousCard();

                                      }}

                                    >

                                      ‹

                                    </button>

                                    <button

                                      type="button"

                                      className="carousel-nav-btn"

                                      style={{

                                        position: 'absolute',

                                        right: '8px',

                                        top: '50%',

                                        transform: 'translateY(-50%)',

                                        zIndex: 10,

                                        backgroundColor: 'rgba(0,0,0,0.5)',

                                        color: 'white',

                                        border: 'none',

                                        borderRadius: '50%',

                                        width: '32px',

                                        height: '32px',

                                        display: 'flex',

                                        alignItems: 'center',

                                        justifyContent: 'center',

                                        fontSize: '14px',

                                        cursor: 'pointer'

                                      }}

                                      onClick={(e) => {

                                        e.preventDefault();

                                        e.stopPropagation();

                                        goToNextCard();

                                      }}

                                    >

                                      ›

                                    </button>

                                  </>

                                )}



                                <div className="carousel-container" style={{

                                  display: 'flex',

                                  gap: '8px',

                                  padding: '8px 0',

                                  overflow: 'hidden',

                                  scrollbarWidth: 'none',

                                  msOverflowStyle: 'none',

                                  position: 'relative',

                                  width: '100%'

                                }}>

                                  <div className="carousel-track" style={{

                                    display: 'flex',

                                    transform: `translateX(-${currentCarouselIndex * 100}%)`,

                                    transition: 'transform 0.3s ease-in-out',

                                    width: `${editForm.carouselCards.length * 100}%`

                                  }}>

                                    {editForm.carouselCards.map((card, index) => (

                                      <div key={card.id} className="carousel-card" style={{

                                        minWidth: '100%',

                                        width: '100%',

                                        backgroundColor: 'white',

                                        borderRadius: '8px',

                                        display: 'flex',

                                        flexDirection: 'column',

                                        position: 'relative',

                                        flexShrink: 0,

                                        margin: '0 4px',

                                        border: '1px solid #ddd',

                                        overflow: 'hidden'

                                      }}>

                                        {/* Card Header Media */}

                                        <div style={{

                                          width: '100%',

                                          height: '120px',

                                          overflow: 'hidden',

                                          position: 'relative'

                                        }}>

                                          {card.headerImage || card.headerVideo ? (

                                            editForm.carouselHeaderType === 'IMAGE' ? (

                                              <img

                                                src={card.headerImage}

                                                alt={`Card ${index + 1}`}

                                                style={{

                                                  width: '100%',

                                                  height: '100%',

                                                  objectFit: 'cover'

                                                }}

                                                onError={(e) => {

                                                  e.target.style.display = 'none';

                                                  e.target.nextSibling.style.display = 'flex';

                                                }}

                                              />

                                            ) : (

                                              <video

                                                src={card.headerVideo}

                                                style={{

                                                  width: '100%',

                                                  height: '100%',

                                                  objectFit: 'cover'

                                                }}

                                                onError={(e) => {

                                                  e.target.style.display = 'none';

                                                  e.target.nextSibling.style.display = 'flex';

                                                }}

                                              />

                                            )

                                          ) : (

                                            <div style={{

                                              display: 'flex',

                                              flexDirection: 'column',

                                              alignItems: 'center',

                                              justifyContent: 'center',

                                              height: '100%',

                                              backgroundColor: '#f8f9fa',

                                              color: '#6c757d'

                                            }}>

                                              <i className={`fas fa-${editForm.carouselHeaderType === 'IMAGE' ? 'image' : 'video'}`} style={{ fontSize: '24px', marginBottom: '6px' }}></i>

                                              <span style={{ fontSize: '11px' }}>No Media</span>

                                            </div>

                                          )}

                                          {/* Fallback for failed media */}

                                          <div style={{

                                            display: 'none',

                                            flexDirection: 'column',

                                            alignItems: 'center',

                                            justifyContent: 'center',

                                            height: '100%',

                                            backgroundColor: '#f8f9fa',

                                            color: '#6c757d'

                                          }}>

                                            <i className={`fas fa-${editForm.carouselHeaderType === 'IMAGE' ? 'image' : 'video'}`} style={{ fontSize: '24px', marginBottom: '6px' }}></i>

                                            <span style={{ fontSize: '11px' }}>No Media</span>

                                          </div>

                                        </div>

                                        {/* Card Content */}

                                        <div style={{

                                          padding: '12px',

                                          flex: 1,

                                          display: 'flex',

                                          flexDirection: 'column',

                                          justifyContent: 'space-between'

                                        }}>

                                          {/* Body Text */}

                                          {card.bodyText && (

                                            <div style={{

                                              fontSize: '12px',

                                              color: '#333',

                                              marginBottom: '8px',

                                              lineHeight: '1.4',

                                              maxHeight: '40px',

                                              overflow: 'hidden',

                                              textOverflow: 'ellipsis'

                                            }}>

                                              {card.bodyText}

                                            </div>

                                          )}

                                          {/* Buttons */}

                                          {card.buttons && card.buttons.length > 0 && (

                                            <div style={{

                                              display: 'flex',

                                              gap: '4px',

                                              flexWrap: 'wrap'

                                            }}>

                                              {card.buttons.slice(0, 2).map((button, btnIndex) => (

                                                <button

                                                  key={btnIndex}

                                                  style={{

                                                    fontSize: '10px',

                                                    padding: '4px 8px',

                                                    border: '1px solid #25D366',

                                                    borderRadius: '12px',

                                                    backgroundColor: '#25D366',

                                                    color: 'white',

                                                    cursor: 'default',

                                                    fontWeight: '500',

                                                    minWidth: '60px',

                                                    textAlign: 'center',

                                                    whiteSpace: 'nowrap',

                                                    overflow: 'hidden',

                                                    textOverflow: 'ellipsis'

                                                  }}

                                                >

                                                  {button.text}

                                                </button>

                                              ))}

                                            </div>

                                          )}

                                        </div>



                                        {/* Card Number Indicator */}

                                        <div style={{

                                          position: 'absolute',

                                          top: '8px',

                                          right: '8px',

                                          backgroundColor: 'rgba(0,0,0,0.4)',

                                          color: 'white',

                                          borderRadius: '50%',

                                          width: '20px',

                                          height: '20px',

                                          display: 'flex',

                                          alignItems: 'center',

                                          justifyContent: 'center',

                                          fontSize: '10px',

                                          fontWeight: 'bold'

                                        }}>

                                          {index + 1}

                                        </div>

                                      </div>

                                    ))}

                                  </div>

                                </div>

                              </div>

                              {/* Carousel Indicators */}

                              {editForm.carouselCards.length > 1 && (

                                <div style={{

                                  display: 'flex',

                                  justifyContent: 'center',

                                  alignItems: 'center',

                                  gap: '6px',

                                  marginTop: '8px'

                                }}>

                                  {editForm.carouselCards.map((_, index) => (

                                    <button

                                      key={index}

                                      type="button"

                                      onClick={() => setCurrentCarouselIndex(index)}

                                      style={{

                                        width: '8px',

                                        height: '8px',

                                        borderRadius: '50%',

                                        border: 'none',

                                        backgroundColor: index === currentCarouselIndex ? '#FF6B35' : '#ccc',

                                        cursor: 'pointer',

                                        transition: 'background-color 0.2s ease-in-out'

                                      }}

                                      title={`Go to card ${index + 1}`}

                                    />

                                  ))}

                                </div>

                              )}



                              <div style={{

                                textAlign: 'center',

                                marginTop: '8px',

                                fontSize: '10px',

                                color: '#6c757d',

                                display: 'flex',

                                alignItems: 'center',

                                justifyContent: 'center',

                                gap: '8px'

                              }}>

                                <span>{editForm.carouselCards.length} card{editForm.carouselCards.length !== 1 ? 's' : ''}</span>

                                {editForm.carouselCards.length > 1 && (

                                  <>

                                    <span>•</span>

                                    <span>Card {currentCarouselIndex + 1} of {editForm.carouselCards.length}</span>

                                  </>

                                )}

                              </div>

                            </div>

                          )}



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

                        <span className="mb-3 current-time">11:02</span>



                        {/* Buttons Preview */}

                        {((editForm.buttons && editForm.buttons.length > 0) || editForm.templateType === 'Catalog' || editForm.templateType === 'Flows' || editForm.templateType === 'Authentication' || editForm.templateType === 'Order details' || editForm.templateType === 'Order Status') && (

                          <div className="call-to-action-btn">

                            {/* Show catalog button if template type is Catalog */}

                            {editForm.templateType === 'Catalog' && (

                              <button

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

                                View catalog

                              </button>

                            )}



                            {/* Show flow button if template type is Flows */}

                            {editForm.templateType === 'Flows' && editForm.flowId && (

                              <button

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

                                Start Flow

                              </button>

                            )}



                            {/* Show authentication button if template type is Authentication */}

                            {editForm.templateType === 'Authentication' && (

                              <button

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

                                {editForm.codeDeliveryMethod === 'copy_code' ? 'Copy Code' : 'Authenticate'}

                              </button>

                            )}



                            {/* Show order details buttons if template type is Order details */}

                            {editForm.templateType === 'Order details' && (

                              <>

                                <button

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

                                  {editForm.orderButtonText || 'Review and Pay'}

                                </button>

                                <button

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

                                  Pay now

                                </button>

                              </>

                            )}



                            {/* Show order status buttons if template type is Order Status */}

                            {editForm.templateType === 'Order Status' && (

                              <>

                                <button

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

                                  {(editForm.orderStatusButtons && editForm.orderStatusButtons[0]) || 'Track Order'}

                                </button>

                                <button

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

                                  {(editForm.orderStatusButtons && editForm.orderStatusButtons[1]) || 'Cancel Order'}

                                </button>

                              </>

                            )}



                            {/* Show regular buttons */}

                            {editForm.buttons && editForm.buttons.map((button, index) => (

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

            <div className="modal-footer" style={{ borderTop: '1px solid #e9ecef', padding: '1.5rem' }}>

              <button

                type="button"

                className="btn btn-primary btn-lg px-5"

                onClick={createTemplate}

                disabled={isCreatingTemplate}

                style={{

                  backgroundColor: '#25D366',

                  border: 'none',

                  borderRadius: '8px',

                  fontWeight: '500'

                }}

              >

                {isCreatingTemplate ? (

                  <>

                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>

                    {isCloneMode ? 'Cloning Template...' : 'Creating Template...'}

                  </>

                ) : (

                  isCloneMode ? 'Clone Template' : 'Create Template'

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

                  <h5 className="text-muted">{isCloneMode ? 'Cloning Template...' : 'Creating Template...'}</h5>

                  <p className="text-muted mb-0">Please wait while we {isCloneMode ? 'clone' : 'create'} your template</p>

                </div>

              </div>

            )}

          </div>

        </div>

      </div>


      {/* Global Delete Loading Overlay */}
      {isDeletingTemplate && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          }}
        >
          <div className="bg-white p-4 rounded shadow-lg text-center" style={{ minWidth: '300px' }}>
            <div className="spinner-border text-danger mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="text-muted">Deleting Template...</h5>
            <p className="text-muted mb-0">Please wait while we delete your template</p>
          </div>
        </div>
      )}

      <style>

        {

          `

   .preview-template .preview-container {

    display: flex;

    flex-direction: column;

    padding: 24px 17px 24px 17px;

   
   
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

    flex-direction:column;

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

#createTemplateModal , #templatePreviewModal{

background-color:#000000a3;
}

}

/* Carousel Navigation Buttons */

.carousel-nav-btn {

  transition: all 0.2s ease-in-out !important;

  user-select: none !important;

  -webkit-user-select: none !important;

  -moz-user-select: none !important;

  -ms-user-select: none !important;

}



.carousel-nav-btn:hover {

  background-color: rgba(0,0,0,0.7) !important;

  transform: translateY(-50%) scale(1.1) !important;

}



.carousel-nav-btn:active {

  transform: translateY(-50%) scale(0.95) !important;

}



.carousel-nav-btn:focus {

  outline: none !important;

  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3) !important;

}



/* Carousel Track Animation */

.carousel-track {

  will-change: transform !important;

  backface-visibility: hidden !important;

  -webkit-backface-visibility: hidden !important;

  perspective: 1000px !important;

  -webkit-perspective: 1000px !important;

}



.carousel-card {

  will-change: transform !important;

  backface-visibility: hidden !important;

  -webkit-backface-visibility: hidden !important;

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



  return (
    <>
      {/* Notification Toast */}
      {notification.show && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            minWidth: '300px',
            maxWidth: '500px',
            backgroundColor: notification.type === 'success' ? '#28a745' : notification.type === 'error' ? '#dc3545' : '#17a2b8',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ flex: 1, marginRight: '10px' }}>
            {notification.message}
          </div>
          <button
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {renderTemplateList()}
    </>
  );

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

    
    
    // .d-flex.align-items-center {

    //  flex-wrap: wrap;

    //   gap: 0.5rem;

    // }

    
    
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