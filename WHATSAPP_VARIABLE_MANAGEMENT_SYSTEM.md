# WhatsApp Template Variable Management System

## Overview
Complete system to automatically replace WhatsApp template variables with actual candidate/lead data when sending templates.

## System Components

### 1. Backend Helper - Variable Mapper
**File:** `backend/helpers/whatsappVariableMapper.js`

#### Purpose
- Maps template variables to database fields
- Replaces variables with actual candidate data
- Validates candidate data completeness

#### Available Variables

| Variable Name | Mapped To | Description |
|--------------|-----------|-------------|
| `{{name}}` | candidate.name | Candidate name |
| `{{gender}}` | candidate.gender | Gender |
| `{{mobile}}` | candidate.mobile | Mobile number |
| `{{email}}` | candidate.email | Email address |
| `{{course_name}}` | appliedCourses[0].courseName | First applied course |
| `{{job_name}}` | appliedJobs[0].title | First applied job |
| `{{counselor_name}}` | _concernPerson.name | Assigned counselor |
| `{{lead_owner_name}}` | _concernPerson.name | Lead owner |
| `{{project_name}}` | college.name | College/Project name |
| `{{batch_name}}` | batch.name | Batch name |
| `{{college_name}}` | college.name | College name |
| `{{city}}` | candidate.cityId | City |
| `{{state}}` | candidate.stateId | State |
| `{{qualification}}` | candidate.basicQualification | Qualification |
| `{{year_of_passing}}` | candidate.yearOfPassing | Year of passing |

#### Functions

```javascript
// Replace variables in text
replaceVariables(text, candidateData)

// Replace variables in WhatsApp components
replaceVariablesInComponents(components, candidateData)

// Get list of variables in text
getVariablesInText(text)

// Validate candidate has all required data
validateCandidateData(text, candidateData)
```

### 2. Backend API Endpoints

#### A. Send Template with Variables
**Endpoint:** `POST /college/whatsapp/send-template`

**Request Body:**
```json
{
  "templateName": "welcome_message",
  "to": "919876543210",
  "collegeId": "college_id_here",
  "candidateId": "candidate_id_here",  // OR
  "registrationId": "registration_id_here"
}
```

**What Happens:**
1. Fetches candidate/registration data
2. Populates related data (counselor, courses, jobs, college)
3. Extracts variables from template
4. Replaces variables with actual data
5. Sends WhatsApp message via API
6. Saves message to database

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp message sent successfully",
  "data": {
    "messageId": "wamid.xxx",
    "to": "+919876543210",
    "templateName": "welcome_message",
    "status": "sent"
  }
}
```

#### B. Validate Template Variables
**Endpoint:** `POST /college/whatsapp/validate-template-variables`

**Request Body:**
```json
{
  "templateName": "welcome_message",
  "candidateId": "candidate_id_here",
  "collegeId": "college_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "valid": false,
  "message": "Some variables are missing",
  "missingVariables": ["course_name", "batch_name"]
}
```

**Use Case:**
- Check if candidate has all required data before sending
- Show warning to user if data is incomplete
- Highlight missing fields in UI

### 3. Frontend Integration

#### Example: Registrations.jsx

```javascript
// Send template with candidate data
const handleWhatsappSendTemplate = async () => {
  if (!selectedWhatsappTemplate) return;
  
  setIsSendingWhatsapp(true);
  
  try {
    const response = await axios.post(
      `${backendUrl}/college/whatsapp/send-template`,
      {
        templateName: selectedWhatsappTemplate.name,
        to: selectedProfile?._candidate?.mobile,
        candidateId: selectedProfile?._candidate?._id,
        registrationId: selectedProfile?._id,  // If using registration
        collegeId: userData.college  // Your college ID
      },
      {
        headers: { 'x-auth': token }
      }
    );
    
    if (response.data.success) {
      // Success! Message sent with variables replaced
      alert('WhatsApp template sent successfully!');
      
      // Update UI - add message to chat
      setWhatsappMessages([...whatsappMessages, {
        id: whatsappMessages.length + 1,
        text: 'Template message sent',
        sender: 'agent',
        time: new Date().toLocaleTimeString(),
        type: 'template'
      }]);
      
      setHasActiveSession(true);
      setSelectedWhatsappTemplate(null);
    }
  } catch (error) {
    console.error('Error sending template:', error);
    alert('Failed to send template: ' + (error.response?.data?.message || error.message));
  } finally {
    setIsSendingWhatsapp(false);
  }
};

// Validate before sending (optional)
const validateBeforeSending = async (templateName, candidateId) => {
  try {
    const response = await axios.post(
      `${backendUrl}/college/whatsapp/validate-template-variables`,
      {
        templateName,
        candidateId,
        collegeId: userData.college
      },
      {
        headers: { 'x-auth': token }
      }
    );
    
    if (!response.data.valid) {
      const missing = response.data.missingVariables.join(', ');
      const proceed = confirm(
        `Warning: Some data is missing (${missing}). ` +
        `The template will show placeholder values. Do you want to continue?`
      );
      return proceed;
    }
    
    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return true; // Allow sending even if validation fails
  }
};

// Use validation before sending
const handleSendWithValidation = async () => {
  const shouldSend = await validateBeforeSending(
    selectedWhatsappTemplate.name,
    selectedProfile?._candidate?._id
  );
  
  if (shouldSend) {
    await handleWhatsappSendTemplate();
  }
};
```

## How It Works - Flow Diagram

```
User Selects Template
        ↓
Frontend sends request with:
  - templateName
  - to (phone number)
  - candidateId
  - collegeId
        ↓
Backend fetches:
  - Candidate data (name, email, mobile, etc.)
  - Related data:
    * Counselor (_concernPerson)
    * Applied courses
    * Applied jobs
    * College info
        ↓
Backend fetches template from Meta:
  - Gets template structure
  - Extracts variables from BODY component
        ↓
Variable Mapper:
  - Finds all {{variable_name}} in template
  - Maps each variable to data field
  - Gets value from candidate data
  - Creates parameters array
        ↓
WhatsApp API Call:
  - Sends template with parameters
  - Variables are replaced by WhatsApp
        ↓
Save to Database:
  - Stores sent message
  - Records template name and data
        ↓
Return Success to Frontend
```

## Example Scenarios

### Scenario 1: Simple Welcome Message

**Template (on Meta):**
```
Hello {{name}},

Welcome to {{project_name}}!

Your counselor {{counselor_name}} will guide you.

For queries, call us.
```

**Candidate Data:**
```json
{
  "_id": "123",
  "name": "Rahul Kumar",
  "mobile": "9876543210",
  "email": "rahul@example.com",
  "_concernPerson": {
    "name": "Priya Sharma"
  }
}
```

**College Data:**
```json
{
  "name": "Excellence Institute"
}
```

**Final Message Sent:**
```
Hello Rahul Kumar,

Welcome to Excellence Institute!

Your counselor Priya Sharma will guide you.

For queries, call us.
```

### Scenario 2: Course Enrollment Confirmation

**Template:**
```
Dear {{name}},

Congratulations! You're enrolled in {{course_name}}.

Batch: {{batch_name}}
Counselor: {{counselor_name}}

Login to check details.
```

**Candidate Data:**
```json
{
  "name": "Sneha Patel",
  "appliedCourses": [{
    "courseName": "Full Stack Development",
    "fees": 50000
  }],
  "_concernPerson": {
    "name": "Amit Verma"
  }
}
```

**If batch_name missing:**
```
Dear Sneha Patel,

Congratulations! You're enrolled in Full Stack Development.

Batch: [batch_name]
Counselor: Amit Verma

Login to check details.
```

**Notice:** Missing variables show as `[variable_name]` so user can identify them.

### Scenario 3: Job Placement Notification

**Template:**
```
Hi {{name}},

Great news! We have a {{job_name}} opportunity.

Contact {{counselor_name}} at {{counselor_mobile}} for details.

All the best!
{{project_name}} Team
```

**Candidate Data:**
```json
{
  "name": "Vikas Singh",
  "appliedJobs": [{
    "title": "Frontend Developer",
    "company": "TechCorp India"
  }],
  "_concernPerson": {
    "name": "Rajesh Kumar",
    "mobile": "9123456789"
  }
}
```

**Final Message:**
```
Hi Vikas Singh,

Great news! We have a Frontend Developer opportunity.

Contact Rajesh Kumar at 9123456789 for details.

All the best!
Excellence Institute Team
```

## Data Population Requirements

For variables to work correctly, ensure data is populated:

### Required Populates in Backend

```javascript
// For Candidate
const candidateData = await Candidate.findById(candidateId)
  .populate('_concernPerson', 'name email mobile')
  .populate({
    path: 'appliedCourses',
    select: 'courseName fees duration courseType',
    model: 'courses'
  })
  .populate({
    path: 'appliedJobs',
    select: 'title company location salary',
    model: 'Vacancy'
  })
  .lean();

// For College
const collegeInfo = await College.findById(collegeId)
  .select('name email phone address')
  .lean();

candidateData._college = collegeInfo;
```

## Error Handling

### Missing Candidate
```json
{
  "success": false,
  "message": "Candidate not found"
}
```

### Missing Template
```json
{
  "success": false,
  "message": "Template not found"
}
```

### WhatsApp API Error
```json
{
  "success": false,
  "message": "Failed to send WhatsApp message",
  "error": "Detailed error from WhatsApp"
}
```

## Testing the System

### Test 1: Basic Variable Replacement

```bash
curl -X POST http://localhost:3000/college/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -H "x-auth: YOUR_TOKEN" \
  -d '{
    "templateName": "test_template",
    "to": "919876543210",
    "candidateId": "CANDIDATE_ID",
    "collegeId": "COLLEGE_ID"
  }'
```

### Test 2: Validation

```bash
curl -X POST http://localhost:3000/college/whatsapp/validate-template-variables \
  -H "Content-Type: application/json" \
  -H "x-auth: YOUR_TOKEN" \
  -d '{
    "templateName": "test_template",
    "candidateId": "CANDIDATE_ID",
    "collegeId": "COLLEGE_ID"
  }'
```

## Adding New Variables

### Step 1: Update Variable Mappings

Edit `backend/helpers/whatsappVariableMapper.js`:

```javascript
const VARIABLE_MAPPINGS = {
  // ... existing variables ...
  
  // Add new variable
  'father_name': 'fatherName',
  'mother_name': 'motherName',
  'age': 'age',
  'enrollment_date': 'enrollmentDate'
};
```

### Step 2: Update Frontend Dropdown

Edit `frontend/src/Pages/App/College/Whatapp/WhatappTemplate.jsx`:

```javascript
const predefinedVariables = [
  // ... existing variables ...
  
  // Add new variables
  { name: 'Father Name', placeholder: 'father_name' },
  { name: 'Mother Name', placeholder: 'mother_name' },
  { name: 'Age', placeholder: 'age' },
  { name: 'Enrollment Date', placeholder: 'enrollment_date' }
];
```

### Step 3: Ensure Data is Available

Make sure the field exists in your database schema and is populated when fetching candidate data.

## Best Practices

1. **Always validate before sending** (optional but recommended)
2. **Handle missing data gracefully** - System shows `[variable_name]` if data missing
3. **Populate related data** - Always populate counselor, courses, jobs, college
4. **Use meaningful variable names** - Use descriptive names like `course_name` not `var1`
5. **Test with real data** - Test templates with actual candidate data
6. **Log errors** - Backend logs all errors for debugging
7. **Show user feedback** - Frontend should show success/error messages

## Security Considerations

1. **Authentication required** - All endpoints use `isCollege` middleware
2. **Validate phone numbers** - System validates and formats phone numbers
3. **Sanitize data** - All data is sanitized before use
4. **Access control** - Users can only access their college's data
5. **Rate limiting** - WhatsApp API has rate limits, handle accordingly

## Performance Tips

1. **Use .lean()** - For read-only data, use `.lean()` to improve performance
2. **Select only required fields** - Don't fetch unnecessary data
3. **Cache college data** - College info rarely changes, cache it
4. **Batch operations** - When sending to multiple candidates, batch the requests

## Troubleshooting

### Problem: Variables not replacing

**Solution:** Check:
1. Is candidateId passed in request?
2. Does candidate have the required data?
3. Is data properly populated (check console logs)?
4. Variable name matches exactly (case-sensitive)?

### Problem: Template not found

**Solution:** Check:
1. Template name is correct
2. Template exists on Meta/WhatsApp
3. Template is approved
4. College ID is correct

### Problem: Phone number error

**Solution:** Check:
1. Phone number format (should be without +)
2. Country code included
3. Number is valid

## Future Enhancements

1. **Custom variables per college** - Allow colleges to define their own variables
2. **Variable preview** - Show preview of final message before sending
3. **Bulk send** - Send template to multiple candidates with their respective data
4. **Variable formatting** - Add formatting options (uppercase, lowercase, title case)
5. **Conditional variables** - Show different content based on data availability
6. **Variable history** - Track which variables are used most
7. **Data validation** - Validate data type (email format, phone format, etc.)

---

**System Version:** 1.0  
**Last Updated:** October 2025  
**Maintained By:** Development Team

