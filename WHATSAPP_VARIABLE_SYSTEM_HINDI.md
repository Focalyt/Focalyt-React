# WhatsApp Template Variable Management System - हिंदी में

## समस्या और समाधान

### समस्या
पहले जब WhatsApp template भेजते थे तो variables को manually enter करना पड़ता था जैसे {{1}}, {{2}}. यह confusing था और samajh नहीं आता था कि कौन सा variable किस data के लिए है.

### समाधान
अब system automatically candidate/lead के data से variables को replace कर देगा!

## क्या बनाया गया है?

### 1. Backend Helper (`whatsappVariableMapper.js`)

यह file variables को manage करती है:

```javascript
// जैसे template में है:
"Hello {{name}}, welcome to {{course_name}}"

// System automatically replace करेगा:
"Hello Rahul Kumar, welcome to Full Stack Development"
```

**Available Variables:**
- `{{name}}` → Candidate का नाम
- `{{gender}}` → Gender
- `{{mobile}}` → Mobile number
- `{{email}}` → Email address
- `{{course_name}}` → Applied course का नाम
- `{{job_name}}` → Applied job का नाम
- `{{counselor_name}}` → Counselor का नाम
- `{{lead_owner_name}}` → Lead owner का नाम
- `{{project_name}}` → College/Project का नाम
- `{{batch_name}}` → Batch का नाम
- `{{college_name}}` → College का नाम

### 2. Backend API Endpoints

#### A. Template भेजना (with automatic variable replacement)

**Endpoint:** `POST /college/whatsapp/send-template`

**Request:**
```json
{
  "templateName": "welcome_message",
  "to": "9876543210",
  "collegeId": "college_id",
  "candidateId": "candidate_id"
}
```

**क्या होता है:**
1. Candidate का data fetch करता है (name, mobile, email, etc.)
2. Related data fetch करता है (counselor, course, college)
3. Template में variables find करता है
4. Variables को actual data से replace करता है
5. WhatsApp message भेज देता है

#### B. Variable Validation

**Endpoint:** `POST /college/whatsapp/validate-template-variables`

यह check करता है कि candidate के पास सारा data है या नहीं.

**Response:**
```json
{
  "success": true,
  "valid": false,
  "missingVariables": ["course_name", "batch_name"]
}
```

### 3. Frontend Dropdown

Template create करते समय अब dropdown में se variables select कर सकते हैं:

```
Click "+ Add Variable" 
  ↓
Dropdown खुलता है:
  - Name
  - Gender
  - Mobile
  - Email
  - Course Name
  - Job Name
  - Counselor Name
  - etc.
  ↓
Select करो (जैसे "Name")
  ↓
{{name}} template में add हो जाता है
```

## कैसे काम करता है?

### पूरा Flow:

```
1. User template select करता है
   ↓
2. Frontend API call करता है:
   - templateName: "welcome_message"
   - candidateId: "123"
   - collegeId: "456"
   ↓
3. Backend candidate data fetch करता है:
   {
     name: "Rahul Kumar",
     mobile: "9876543210",
     email: "rahul@example.com",
     _concernPerson: { name: "Priya Sharma" },
     appliedCourses: [{ courseName: "Full Stack" }]
   }
   ↓
4. Template fetch करता है Meta से:
   "Hello {{name}}, your counselor {{counselor_name}} will guide you"
   ↓
5. Variables find करता है:
   - {{name}} → "Rahul Kumar"
   - {{counselor_name}} → "Priya Sharma"
   ↓
6. WhatsApp API को bhejta है replaced values के साथ
   ↓
7. WhatsApp automatically variables replace करके message भेज देता है:
   "Hello Rahul Kumar, your counselor Priya Sharma will guide you"
```

## Example Scenario

### Template (Meta पर):
```
Dear {{name}},

Welcome to {{project_name}}!

You have enrolled in {{course_name}}.

Your counselor {{counselor_name}} will contact you at {{mobile}}.

For queries, email us.
```

### Candidate Data:
```json
{
  "name": "Sneha Patel",
  "mobile": "9123456789",
  "email": "sneha@example.com",
  "_concernPerson": {
    "name": "Amit Verma"
  },
  "appliedCourses": [{
    "courseName": "Data Science"
  }]
}
```

### College Data:
```json
{
  "name": "Excellence Institute"
}
```

### Final Message (Auto-generated):
```
Dear Sneha Patel,

Welcome to Excellence Institute!

You have enrolled in Data Science.

Your counselor Amit Verma will contact you at 9123456789.

For queries, email us.
```

## Frontend में Integration

`Registrations.jsx` में यह code add करें:

```javascript
const handleWhatsappSendTemplate = async () => {
  setIsSendingWhatsapp(true);
  
  try {
    const response = await axios.post(
      `${backendUrl}/college/whatsapp/send-template`,
      {
        templateName: selectedWhatsappTemplate.name,
        to: selectedProfile._candidate.mobile,
        candidateId: selectedProfile._candidate._id,
        collegeId: userData.college
      },
      {
        headers: { 'x-auth': token }
      }
    );
    
    if (response.data.success) {
      alert('✅ Template successfully sent!');
      // Update UI
      setWhatsappMessages([...whatsappMessages, {
        text: 'Template sent',
        sender: 'agent',
        type: 'template'
      }]);
    }
  } catch (error) {
    alert('❌ Error: ' + error.response?.data?.message);
  } finally {
    setIsSendingWhatsapp(false);
  }
};
```

## फायदे

### पहले:
```
Template: "Hello {{1}}, welcome to {{2}}"
Problem:
- {{1}} क्या है? {{2}} क्या है?
- Manually har variable ka value enter karna padta tha
- Confusion rahta tha
```

### अब:
```
Template: "Hello {{name}}, welcome to {{course_name}}"
Benefits:
✅ Clear पता है कि कौन सा variable क्या है
✅ Automatically candidate data se fetch होता है
✅ Dropdown से select करना easy है
✅ No manual entry needed
✅ Less errors
```

## Special Features

### 1. Missing Data Handling
अगर कोई data missing है तो:
```
"Hello Rahul, enrolled in [course_name]"
```
`[course_name]` दिखाएगा कि यह data नहीं मिला.

### 2. Validation API
भेजने से पहले check कर सकते हैं:
```javascript
// Check करो कि सारा data है या नहीं
const validation = await axios.post('/validate-template-variables', {
  templateName: 'welcome',
  candidateId: '123'
});

if (!validation.data.valid) {
  alert('Warning: Missing data - ' + validation.data.missingVariables.join(', '));
}
```

### 3. Multiple Data Sources
System fetch करता है:
- Candidate basic data (name, email, mobile)
- Concern person (counselor)
- Applied courses
- Applied jobs
- College information
- Batch information

## Testing Kaise Karein?

### Step 1: Template Create करें
1. Template page पर जाएं
2. "+ Add Variable" पर click करें
3. Dropdown से variable select करें (जैसे "Name")
4. Template save करें

### Step 2: Template Send करें
1. Registrations page पर जाएं
2. Candidate select करें
3. WhatsApp template select करें
4. "Send Template" पर click करें
5. Variables automatically replace हो जाएंगे

### Step 3: Verify करें
1. Check करें WhatsApp पर message आया या नहीं
2. Variables correctly replace हुए हैं या नहीं
3. Console में logs check करें

## Troubleshooting

### Problem: Variables replace नहीं हो रहे

**Solution:**
1. Check करें candidate ID pass हो रहा है या नहीं
2. Candidate के पास वो data है या नहीं check करें
3. Variable name exactly match करना चाहिए

### Problem: Template नहीं भेज रहा

**Solution:**
1. Phone number correct format में है या नहीं (9876543210)
2. Template Meta पर approved है या नहीं
3. API logs check करें backend में

### Problem: कुछ variables [variable_name] दिख रहे हैं

**Reason:** Candidate के पास वो data नहीं है

**Solution:**
- Candidate profile update करें
- Ya template से वो variable हटा दें

## नए Variables Add Kaise Karein?

### Step 1: Backend Mapping Add करें
`backend/helpers/whatsappVariableMapper.js` में:

```javascript
const VARIABLE_MAPPINGS = {
  // Existing variables...
  
  // Naya variable add करें
  'father_name': 'fatherName',
  'mother_name': 'motherName'
};
```

### Step 2: Frontend Dropdown में Add करें
`WhatappTemplate.jsx` में:

```javascript
const predefinedVariables = [
  // Existing variables...
  
  // Naya variable add करें
  { name: 'Father Name', placeholder: 'father_name' },
  { name: 'Mother Name', placeholder: 'mother_name' }
];
```

### Step 3: Database में Field Hona Chahiye
Ensure करें कि candidate schema में वो field exist करता है.

## Important Points

1. **Always pass candidateId** - Bina candidateId के variables replace नहीं होंगे
2. **Validate before sending** - Check करें कि सारा data available है
3. **Handle errors** - User को clear error messages दिखाएं
4. **Test thoroughly** - Real data के साथ test करें
5. **Log everything** - Backend में proper logging करें

## Files Modified/Created

### Backend:
1. `backend/helpers/whatsappVariableMapper.js` - **NEW** Variable mapping logic
2. `backend/controllers/routes/college/whatsapp.js` - Modified send-template endpoint

### Frontend:
1. `frontend/src/Pages/App/College/Whatapp/WhatappTemplate.jsx` - Added variable dropdown

### Documentation:
1. `WHATSAPP_VARIABLE_MANAGEMENT_SYSTEM.md` - Complete technical docs
2. `FRONTEND_INTEGRATION_EXAMPLE.md` - Frontend integration guide
3. `WHATSAPP_VARIABLE_SYSTEM_HINDI.md` - यह file

## Summary

### क्या किया:
✅ Variable dropdown system बनाया
✅ Backend में automatic variable replacement logic बनाया
✅ API endpoints बनाए (send-template, validate-template-variables)
✅ Frontend में dropdown integration किया
✅ Complete documentation लिखा

### अब क्या करना है:
1. Frontend में integration complete करें (Registrations.jsx)
2. Test करें different templates के साथ
3. Error handling improve करें
4. User को feedback दें (validation warnings)

### Result:
अब जब भी template भेजेंगे, variables automatically candidate के data से replace हो जाएंगे! 🎉

---

**System Version:** 1.0  
**Created:** October 2025  
**Language:** Hindi + English (Mixed)

