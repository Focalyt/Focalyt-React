# WhatsApp Template Variable Storage & Retrieval Flow

## 📍 Variables Kaha Save Hote Hain?

### Database Schema: `WhatsAppTemplate`

**File:** `backend/controllers/models/wATemplate.js`

```javascript
{
  collegeId: ObjectId,
  templateId: String,           // WhatsApp template ID
  templateName: String,          // "welcome_template"
  language: String,              // "en"
  category: String,              // "UTILITY"
  
  // 🔥 YEH HAI VARIABLE MAPPINGS FIELD 🔥
  variableMappings: [{
    position: Number,            // 1, 2, 3 (numbered variable)
    variableName: String         // 'name', 'email', 'course_name'
  }],
  
  headerMedia: {...},
  carouselMedia: [{...}],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Complete Flow: Creation Se Sending Tak

### Step 1: Template Creation (User Frontend se Create karta hai)

**User Input:**
```json
{
  "name": "welcome_msg",
  "language": "en",
  "category": "UTILITY",
  "components": [{
    "type": "BODY",
    "text": "Hello {{name}}, your course is {{course_name}} and counselor is {{counselor_name}}"
  }]
}
```

### Step 2: Backend Processing (Variable Conversion)

**File:** `backend/controllers/routes/college/whatsapp.js` → `POST /create-template`

```javascript
// 1. Variables detect karo
const variables = component.text.match(/\{\{[^}]+\}\}/g);
// Result: ['{{name}}', '{{course_name}}', '{{counselor_name}}']

// 2. Numbered format mein convert karo
let numberedText = component.text;
const variableMappings = [];

variables.forEach((variable, index) => {
  const varName = variable.replace(/\{\{|\}\}/g, '').trim();
  
  // Convert: {{name}} → {{1}}
  numberedText = numberedText.replace(variable, `{{${index + 1}}}`);
  
  // Store mapping
  variableMappings.push({
    position: index + 1,
    variableName: varName
  });
});

// Result numberedText: "Hello {{1}}, your course is {{2}} and counselor is {{3}}"

// Result variableMappings:
[
  { position: 1, variableName: 'name' },
  { position: 2, variableName: 'course_name' },
  { position: 3, variableName: 'counselor_name' }
]
```

### Step 3: WhatsApp API ko Bhejo

```javascript
// Facebook API ko bhejenge
{
  "name": "welcome_msg",
  "language": "en",
  "category": "UTILITY",
  "components": [{
    "type": "BODY",
    "text": "Hello {{1}}, your course is {{2}} and counselor is {{3}}",
    "example": {
      "body_text": [["John Doe", "Sample Course", "John Doe"]]
    }
  }]
}
```

### Step 4: Database Mein Save Karo

**File:** `backend/controllers/routes/college/whatsapp.js`

```javascript
await WhatsAppTemplate.create({
  collegeId: collegeId,
  templateId: response.data?.id,
  templateName: 'welcome_msg',
  language: 'en',
  category: 'UTILITY',
  status: 'PENDING',
  
  // 🔥 YEH SAVE HO GAYA DATABASE MEIN 🔥
  variableMappings: [
    { position: 1, variableName: 'name' },
    { position: 2, variableName: 'course_name' },
    { position: 3, variableName: 'counselor_name' }
  ],
  
  headerMedia: null,
  carouselMedia: []
});
```

**Database Mein Actual Entry:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "collegeId": "507f1f77bcf86cd799439012",
  "templateId": "123456789",
  "templateName": "welcome_msg",
  "language": "en",
  "category": "UTILITY",
  "status": "PENDING",
  "variableMappings": [
    {
      "position": 1,
      "variableName": "name",
      "_id": "507f1f77bcf86cd799439013"
    },
    {
      "position": 2,
      "variableName": "course_name",
      "_id": "507f1f77bcf86cd799439014"
    },
    {
      "position": 3,
      "variableName": "counselor_name",
      "_id": "507f1f77bcf86cd799439015"
    }
  ],
  "createdAt": "2025-10-17T10:00:00.000Z",
  "updatedAt": "2025-10-17T10:00:00.000Z"
}
```

---

## 📤 Message Sending Flow

### Step 1: Frontend Se Request

```javascript
POST /college/whatsapp/send-template

{
  "templateName": "welcome_msg",
  "to": "9876543210",
  "candidateId": "candidate_123",
  "collegeId": "college_456"
}
```

### Step 2: Template Fetch from Database

**File:** `backend/controllers/routes/college/whatsapp.js` → `POST /send-template`

```javascript
const template = await WhatsAppTemplate.findOne({
  templateName: 'welcome_msg',
  collegeId: 'college_456'
});

console.log('Template from DB:', template);
/*
{
  templateName: 'welcome_msg',
  variableMappings: [
    { position: 1, variableName: 'name' },
    { position: 2, variableName: 'course_name' },
    { position: 3, variableName: 'counselor_name' }
  ]
}
*/
```

### Step 3: Candidate Data Fetch

```javascript
const candidateData = await Candidate.findById('candidate_123')
  .populate('_concernPerson', 'name email mobile')
  .populate({
    path: 'appliedCourses',
    select: 'courseName fees',
    model: 'courses'
  })
  .lean();

console.log('Candidate Data:', candidateData);
/*
{
  _id: 'candidate_123',
  name: 'Rahul Kumar',
  mobile: '9876543210',
  email: 'rahul@example.com',
  _concernPerson: {
    name: 'Priya Sharma',
    email: 'priya@example.com'
  },
  appliedCourses: [{
    courseName: 'Full Stack Development',
    fees: 50000
  }]
}
*/
```

### Step 4: WhatsApp Template Fetch (from Meta)

```javascript
const fbTemplate = await fetchTemplateFromFacebook('welcome_msg');

console.log('FB Template:', fbTemplate);
/*
{
  name: 'welcome_msg',
  language: 'en',
  components: [{
    type: 'BODY',
    text: 'Hello {{1}}, your course is {{2}} and counselor is {{3}}'
  }]
}
*/
```

### Step 5: Variable Replacement (🔥 MAIN LOGIC)

**File:** `backend/controllers/routes/college/whatsapp.js` → `sendWhatsAppMessage()`

```javascript
// Extract variables from FB template
const bodyComponent = fbTemplate.components.find(c => c.type === 'BODY');
const variables = getVariablesInText(bodyComponent.text);
// Result: ['1', '2', '3']

console.log('📝 Variables found:', variables);
// Output: ['1', '2', '3']

// Get mappings from DB template
const variableMappings = template.variableMappings;
console.log('🗺️  Variable mappings:', variableMappings);
/*
[
  { position: 1, variableName: 'name' },
  { position: 2, variableName: 'course_name' },
  { position: 3, variableName: 'counselor_name' }
]
*/

// Create parameters with actual values
const bodyParameters = variables.map(varName => {
  // varName = '1', '2', '3'
  
  // Find mapping for this position
  const mapping = variableMappings.find(m => m.position === parseInt(varName));
  // For '1' → { position: 1, variableName: 'name' }
  
  console.log(`   {{${varName}}} → ${mapping.variableName}`);
  // Output: {{1}} → name
  
  // Get actual value from candidate data
  const actualValue = replaceVariables(
    `{{${mapping.variableName}}}`, 
    candidateData
  );
  
  console.log(`      Value: ${actualValue}`);
  // Output: Value: Rahul Kumar
  
  return {
    type: 'text',
    text: actualValue
  };
});

console.log('Final parameters:', bodyParameters);
/*
[
  { type: 'text', text: 'Rahul Kumar' },
  { type: 'text', text: 'Full Stack Development' },
  { type: 'text', text: 'Priya Sharma' }
]
*/
```

### Step 6: WhatsApp API ko Bhejo

```javascript
const messagePayload = {
  messaging_product: 'whatsapp',
  to: '+919876543210',
  type: 'template',
  template: {
    name: 'welcome_msg',
    language: { code: 'en' },
    components: [{
      type: 'body',
      parameters: [
        { type: 'text', text: 'Rahul Kumar' },
        { type: 'text', text: 'Full Stack Development' },
        { type: 'text', text: 'Priya Sharma' }
      ]
    }]
  }
};

await axios.post(WHATSAPP_API_URL, messagePayload);
```

### Step 7: Final Message Sent

WhatsApp automatically replaces:
```
Template: "Hello {{1}}, your course is {{2}} and counselor is {{3}}"
Values:   ["Rahul Kumar", "Full Stack Development", "Priya Sharma"]

Final Message:
"Hello Rahul Kumar, your course is Full Stack Development and counselor is Priya Sharma"
```

---

## 🔍 Example Console Logs (Debug Output)

### During Template Creation:
```
✅ Converted 3 variables to numbered format
   Original: Hello {{name}}, your course is {{course_name}} and counselor is {{counselor_name}}...
   Numbered: Hello {{1}}, your course is {{2}} and counselor is {{3}}...
   Examples: [ 'John Doe', 'Sample Course', 'John Doe' ]
   Mappings: [
     { position: 1, variableName: 'name' },
     { position: 2, variableName: 'course_name' },
     { position: 3, variableName: 'counselor_name' }
   ]

✓ Template metadata saved to database: 507f1f77bcf86cd799439011
```

### During Message Sending:
```
📝 Variables found in template: [ '1', '2', '3' ]

🗺️  Variable mappings from DB: [
  { position: 1, variableName: 'name' },
  { position: 2, variableName: 'course_name' },
  { position: 3, variableName: 'counselor_name' }
]

   {{1}} → name
      Value: Rahul Kumar
   {{2}} → course_name
      Value: Full Stack Development
   {{3}} → counselor_name
      Value: Priya Sharma

✅ WhatsApp message sent with variables: YES
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TEMPLATE CREATION                         │
└─────────────────────────────────────────────────────────────┘

User Input
  ↓
  "Hello {{name}}, course {{course_name}}"
  ↓
Backend Converts
  ↓
  "Hello {{1}}, course {{2}}"
  + Mappings: [
      {position:1, variableName:'name'},
      {position:2, variableName:'course_name'}
    ]
  ↓
Save to Database (WhatsAppTemplate)
  ↓
  ✅ variableMappings field mein stored


┌─────────────────────────────────────────────────────────────┐
│                    MESSAGE SENDING                           │
└─────────────────────────────────────────────────────────────┘

Request: {templateName, candidateId}
  ↓
Fetch Template from DB
  ↓
  template.variableMappings = [
    {position:1, variableName:'name'},
    {position:2, variableName:'course_name'}
  ]
  ↓
Fetch Candidate Data
  ↓
  {name: 'Rahul', appliedCourses: [{courseName: 'FS Dev'}]}
  ↓
Map Variables
  ↓
  {{1}} → 'name' → 'Rahul'
  {{2}} → 'course_name' → 'FS Dev'
  ↓
Send to WhatsApp with values
  ↓
  parameters: [
    {type:'text', text:'Rahul'},
    {type:'text', text:'FS Dev'}
  ]
  ↓
  ✅ Message Sent
```

---

## 🎯 Key Points

### Where Variables are Stored:
✅ **Database:** MongoDB → `WhatsAppTemplate` collection → `variableMappings` field  
✅ **Format:** Array of `{position: Number, variableName: String}`  
✅ **Purpose:** Map numbered variables ({{1}}) to named variables (name)

### How Variables are Retrieved:
✅ **Step 1:** Fetch template from DB using `templateName`  
✅ **Step 2:** Get `variableMappings` from template  
✅ **Step 3:** Fetch template from Facebook (has {{1}}, {{2}})  
✅ **Step 4:** Match position to variableName using mappings  
✅ **Step 5:** Get actual data from candidate using variableName  
✅ **Step 6:** Send to WhatsApp with actual values

### Benefits:
✅ Users ko friendly names dikhai dete hain ({{name}})  
✅ WhatsApp API ko correct format milta hai ({{1}})  
✅ Automatic mapping hota hai  
✅ Database mein relationship stored rahti hai  
✅ Sending time pe automatically data fill hota hai

---

## 🧪 Testing

### Test Variable Storage:
```javascript
// Create template
POST /college/whatsapp/create-template
Body: {
  "name": "test",
  "components": [{
    "type": "BODY",
    "text": "Hi {{name}}, {{email}}"
  }]
}

// Check database
db.whatsapptemplates.findOne({templateName: 'test'})

// Should show:
{
  variableMappings: [
    {position: 1, variableName: 'name'},
    {position: 2, variableName: 'email'}
  ]
}
```

### Test Variable Retrieval:
```javascript
// Send template
POST /college/whatsapp/send-template
Body: {
  "templateName": "test",
  "candidateId": "123",
  "to": "9876543210"
}

// Check console logs:
// Should show variable mapping → value replacement
```

---

**Status:** ✅ IMPLEMENTED  
**Database Field:** `variableMappings`  
**Storage Location:** MongoDB → WhatsAppTemplate collection  
**Retrieval:** Automatic during send-template API call

