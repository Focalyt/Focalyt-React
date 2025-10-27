# Frontend Integration Example - WhatsApp Template Variables

## Registrations.jsx Integration

### Step 1: Update the Send Template Function

Find the `handleWhatsappSendTemplate` function in your Registrations.jsx and replace it with:

```javascript
const handleWhatsappSendTemplate = async () => {
  if (!selectedWhatsappTemplate) return;
  
  // Validate required data
  if (!selectedProfile?._candidate?.mobile) {
    alert('Phone number not found for this candidate');
    return;
  }
  
  if (!selectedWhatsappTemplate.name) {
    alert('Template name is missing');
    return;
  }
  
  setIsSendingWhatsapp(true);
  
  try {
    const token = localStorage.getItem('token') || userData.token;
    
    if (!token) {
      alert('No token found in session storage.');
      return;
    }
    
    // Prepare request payload
    const payload = {
      templateName: selectedWhatsappTemplate.name,
      to: selectedProfile._candidate.mobile, // Phone number without +
      collegeId: userData.college, // Your college ID
    };
    
    // Add candidateId or registrationId
    if (selectedProfile._candidate._id) {
      payload.candidateId = selectedProfile._candidate._id;
    } else if (selectedProfile._id) {
      payload.registrationId = selectedProfile._id;
    }
    
    console.log('Sending template with payload:', payload);
    
    // Send template via API
    const response = await axios.post(
      `${backendUrl}/college/whatsapp/send-template`,
      payload,
      {
        headers: { 'x-auth': token }
      }
    );
    
    if (response.data.success) {
      // Success! Show success message
      alert('✅ WhatsApp template sent successfully!');
      
      // Add message to chat interface
      setWhatsappMessages([...whatsappMessages, {
        id: whatsappMessages.length + 1,
        text: `Template sent: ${selectedWhatsappTemplate.name}`,
        sender: 'agent',
        time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: 'template',
        templateName: selectedWhatsappTemplate.name
      }]);
      
      // Activate WhatsApp session
      setHasActiveSession(true);
      
      // Clear selected template
      setSelectedWhatsappTemplate(null);
      
      // Refresh templates list
      fetchWhatsappTemplates();
    } else {
      alert('❌ Failed to send template: ' + response.data.message);
    }
    
  } catch (error) {
    console.error('Error sending template:', error);
    alert('❌ Failed to send template: ' + (error.response?.data?.message || error.message));
  } finally {
    setIsSendingWhatsapp(false);
  }
};
```

### Step 2: Add Validation Function (Optional but Recommended)

Add this function before `handleWhatsappSendTemplate`:

```javascript
// Validate template variables before sending
const validateTemplateVariables = async (templateName, candidateId, registrationId) => {
  try {
    const token = localStorage.getItem('token') || userData.token;
    
    const payload = {
      templateName: templateName,
      collegeId: userData.college
    };
    
    if (candidateId) {
      payload.candidateId = candidateId;
    } else if (registrationId) {
      payload.registrationId = registrationId;
    }
    
    const response = await axios.post(
      `${backendUrl}/college/whatsapp/validate-template-variables`,
      payload,
      {
        headers: { 'x-auth': token }
      }
    );
    
    if (response.data.success && !response.data.valid) {
      // Some variables are missing
      const missingVars = response.data.missingVariables.join(', ');
      const proceed = window.confirm(
        `⚠️ Warning: Some candidate data is missing!\n\n` +
        `Missing fields: ${missingVars}\n\n` +
        `The template will show placeholder values for these fields.\n\n` +
        `Do you want to continue sending?`
      );
      return proceed;
    }
    
    return true; // All variables are available or no validation needed
    
  } catch (error) {
    console.error('Validation error:', error);
    // On validation error, allow sending anyway
    return true;
  }
};
```

### Step 3: Update Send Template Handler with Validation

Modify the `handleWhatsappSendTemplate` to include validation:

```javascript
const handleWhatsappSendTemplateWithValidation = async () => {
  if (!selectedWhatsappTemplate) return;
  
  // Validate first
  const shouldProceed = await validateTemplateVariables(
    selectedWhatsappTemplate.name,
    selectedProfile?._candidate?._id,
    selectedProfile?._id
  );
  
  if (!shouldProceed) {
    return; // User chose not to send
  }
  
  // Proceed with sending
  await handleWhatsappSendTemplate();
};
```

### Step 4: Update the Send Button Click Handler

Find where you call `handleWhatsappSendTemplate` and replace with:

```javascript
// OLD:
<button onClick={handleWhatsappSendTemplate}>
  Send Template
</button>

// NEW:
<button onClick={handleWhatsappSendTemplateWithValidation}>
  Send Template
</button>
```

### Step 5: Add Visual Feedback for Variable Status

Add a function to show which variables will be used:

```javascript
// Show template variables preview
const showTemplatePreview = (template) => {
  // Extract variables from template
  const bodyComponent = template.components?.find(c => c.type === 'BODY');
  if (!bodyComponent || !bodyComponent.text) {
    return null;
  }
  
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables = [...bodyComponent.text.matchAll(variableRegex)];
  
  if (variables.length === 0) {
    return null;
  }
  
  return (
    <div className="template-variables-preview">
      <small className="text-muted">Variables used:</small>
      <div className="d-flex flex-wrap gap-1 mt-1">
        {variables.map((match, index) => (
          <span 
            key={index} 
            className="badge bg-primary"
            style={{ fontSize: '10px' }}
          >
            {match[1]}
          </span>
        ))}
      </div>
    </div>
  );
};
```

### Step 6: Update Template Selection UI

Add the preview to your template selection dropdown:

```javascript
{whatsAppTemplates.map((template, index) => (
  <div 
    key={index}
    className="dropdown-item"
    onClick={() => handleWhatsappSelectTemplate(template)}
    style={{ cursor: 'pointer' }}
  >
    <div className="d-flex justify-content-between align-items-center">
      <span>{template.name}</span>
      <span className="badge bg-info">{template.category}</span>
    </div>
    
    {/* Add variables preview */}
    {showTemplatePreview(template)}
  </div>
))}
```

## Complete Integration Example

Here's a complete example of how the WhatsApp template section should look:

```javascript
// State
const [selectedWhatsappTemplate, setSelectedWhatsappTemplate] = useState(null);
const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
const [whatsAppTemplates, setWhatsAppTemplates] = useState([]);

// Fetch templates
const fetchWhatsappTemplates = async () => {
  try {
    const token = localStorage.getItem('token') || userData.token;
    const response = await axios.get(
      `${backendUrl}/college/whatsapp/templates`,
      {
        headers: { 'x-auth': token }
      }
    );
    
    if (response.data.success) {
      setWhatsAppTemplates(response.data.data || []);
    }
  } catch (error) {
    console.error('Error fetching templates:', error);
  }
};

// Validate variables
const validateTemplateVariables = async (templateName, candidateId, registrationId) => {
  try {
    const token = localStorage.getItem('token') || userData.token;
    const payload = {
      templateName: templateName,
      collegeId: userData.college
    };
    
    if (candidateId) payload.candidateId = candidateId;
    else if (registrationId) payload.registrationId = registrationId;
    
    const response = await axios.post(
      `${backendUrl}/college/whatsapp/validate-template-variables`,
      payload,
      { headers: { 'x-auth': token } }
    );
    
    if (response.data.success && !response.data.valid) {
      const missingVars = response.data.missingVariables.join(', ');
      return window.confirm(
        `⚠️ Warning: Missing data for: ${missingVars}\n\n` +
        `Continue sending?`
      );
    }
    
    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return true;
  }
};

// Send template
const handleWhatsappSendTemplate = async () => {
  if (!selectedWhatsappTemplate) return;
  
  if (!selectedProfile?._candidate?.mobile) {
    alert('Phone number not found');
    return;
  }
  
  setIsSendingWhatsapp(true);
  
  try {
    const token = localStorage.getItem('token') || userData.token;
    
    const payload = {
      templateName: selectedWhatsappTemplate.name,
      to: selectedProfile._candidate.mobile,
      collegeId: userData.college,
    };
    
    if (selectedProfile._candidate._id) {
      payload.candidateId = selectedProfile._candidate._id;
    } else if (selectedProfile._id) {
      payload.registrationId = selectedProfile._id;
    }
    
    const response = await axios.post(
      `${backendUrl}/college/whatsapp/send-template`,
      payload,
      { headers: { 'x-auth': token } }
    );
    
    if (response.data.success) {
      alert('✅ Template sent successfully!');
      
      setWhatsappMessages([...whatsappMessages, {
        id: whatsappMessages.length + 1,
        text: `Template: ${selectedWhatsappTemplate.name}`,
        sender: 'agent',
        time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: 'template'
      }]);
      
      setHasActiveSession(true);
      setSelectedWhatsappTemplate(null);
    }
    
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Failed: ' + (error.response?.data?.message || error.message));
  } finally {
    setIsSendingWhatsapp(false);
  }
};

// Send with validation
const handleSendWithValidation = async () => {
  const shouldSend = await validateTemplateVariables(
    selectedWhatsappTemplate.name,
    selectedProfile?._candidate?._id,
    selectedProfile?._id
  );
  
  if (shouldSend) {
    await handleWhatsappSendTemplate();
  }
};

// UI
return (
  <div className="whatsapp-template-section">
    {/* Template selector */}
    <div className="dropdown">
      <button 
        className="btn btn-primary"
        onClick={() => setShowWhatsAppTemplates(!showWhatsAppTemplates)}
      >
        📱 Select Template
      </button>
      
      {showWhatsAppTemplates && (
        <div className="dropdown-menu show">
          {whatsAppTemplates.map((template, index) => (
            <div 
              key={index}
              className="dropdown-item"
              onClick={() => {
                setSelectedWhatsappTemplate(template);
                setShowWhatsAppTemplates(false);
              }}
            >
              {template.name}
            </div>
          ))}
        </div>
      )}
    </div>
    
    {/* Send button */}
    {selectedWhatsappTemplate && (
      <button
        className="btn btn-success"
        onClick={handleSendWithValidation}
        disabled={isSendingWhatsapp}
      >
        {isSendingWhatsapp ? 'Sending...' : 'Send Template'}
      </button>
    )}
  </div>
);
```

## Testing Checklist

- [ ] Template loads from API
- [ ] Variable validation works
- [ ] Missing data shows warning
- [ ] Template sends successfully
- [ ] Variables are replaced correctly
- [ ] Message appears in chat
- [ ] Error handling works
- [ ] Loading states work
- [ ] Success/error messages show

## Troubleshooting

### Issue: Template not sending

**Check:**
1. Is `candidateId` or `registrationId` being passed?
2. Is `collegeId` correct?
3. Check browser console for errors
4. Check network tab for API response

### Issue: Variables showing as [variable_name]

**Reason:** Candidate doesn't have that data

**Solution:**
- Update candidate profile
- Or remove that variable from template
- Or use validation to warn user

### Issue: Phone number error

**Check:**
- Phone number format (should be without + symbol)
- Number includes country code
- Number is valid

---

**Integration Version:** 1.0  
**Compatible with:** Registrations.jsx  
**Last Updated:** October 2025

