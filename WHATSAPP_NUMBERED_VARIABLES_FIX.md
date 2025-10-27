# WhatsApp Template - Numbered Variables Fix

## 🐛 Problem

WhatsApp Business API was rejecting templates with error:
```
"component of type BODY is missing expected field(s) (example)"
```

### Root Cause

WhatsApp API requires **numbered variables** (`{{1}}`, `{{2}}`, `{{3}}`) in templates, not named variables (`{{name}}`, `{{gender}}`).

## ✅ Solution Implemented

### 1. **Automatic Variable Conversion**

Templates created with named variables are automatically converted to numbered format:

**Before (User Input):**
```
Hello {{name}}, your gender is {{gender}} and mobile is {{mobile}}
```

**After (Sent to WhatsApp API):**
```
Hello {{1}}, your gender is {{2}} and mobile is {{3}}
```

### 2. **Variable Mapping Storage**

The system now stores the mapping between numbered positions and variable names:

```javascript
variableMappings: [
  { position: 1, variableName: 'name' },
  { position: 2, variableName: 'gender' },
  { position: 3, variableName: 'mobile' }
]
```

### 3. **Automatic Example Generation**

System generates appropriate examples based on variable names:

```javascript
{
  "example": {
    "body_text": [["John Doe", "Male", "9876543210"]]
  }
}
```

## 🔄 How It Works

### Template Creation Flow

```
1. User creates template with named variables:
   "Hello {{name}}, course: {{course_name}}"
   
2. System detects variables and converts to numbered:
   "Hello {{1}}, course: {{2}}"
   
3. System generates examples:
   ["John Doe", "Sample Course"]
   
4. System stores mapping:
   [
     {position: 1, variableName: 'name'},
     {position: 2, variableName: 'course_name'}
   ]
   
5. Template sent to WhatsApp API:
   {
     "text": "Hello {{1}}, course: {{2}}",
     "example": {
       "body_text": [["John Doe", "Sample Course"]]
     }
   }
   
6. Mapping saved in database for future use
```

### Message Sending Flow

```
1. Fetch template from database (has numbered variables)
2. Get stored variable mappings
3. Fetch candidate data
4. Map numbered variables to actual data:
   {{1}} → name → "Rahul Kumar"
   {{2}} → course_name → "Full Stack Development"
   
5. Send to WhatsApp API with actual values
```

## 📝 Code Changes

### File 1: `backend/controllers/routes/college/whatsapp.js`

#### Change 1: Variable Conversion Logic
```javascript
// Handle BODY component - convert named variables to numbered
if (component.type === 'BODY' && component.text) {
  const variables = component.text.match(/\{\{[^}]+\}\}/g);
  
  if (variables && variables.length > 0) {
    let numberedText = component.text;
    const bodyVariableMappings = [];
    
    variables.forEach((variable, index) => {
      const varName = variable.replace(/\{\{|\}\}/g, '').trim();
      const isNumber = /^\d+$/.test(varName);
      
      if (!isNumber) {
        // Convert: {{name}} → {{1}}
        numberedText = numberedText.replace(variable, `{{${index + 1}}}`);
        
        // Store mapping
        bodyVariableMappings.push({
          position: index + 1,
          variableName: varName
        });
      }
      
      // Generate example value based on variable name
      // ... (example generation logic)
    });
    
    // Update component with numbered text
    processedComponent.text = numberedText;
    
    // Add examples
    processedComponent.example = {
      body_text: [exampleValues]
    };
  }
}
```

#### Change 2: Database Storage
```javascript
// Save template with variable mappings
await WhatsAppTemplate.create({
  collegeId: collegeId,
  templateName: name,
  // ... other fields
  variableMappings: variableMappings  // NEW: Store mappings
});
```

### File 2: `backend/helpers/whatsappVariableMapper.js`

#### Change: Support Both Named and Numbered Variables
```javascript
function replaceVariables(text, candidateData, variableOrder = null) {
  const matches = [...text.matchAll(/\{\{([^}]+)\}\}/g)];
  
  matches.forEach((match) => {
    const variableName = match[1].trim();
    const isNumbered = /^\d+$/.test(variableName);
    
    let value = '';
    
    if (isNumbered && variableOrder) {
      // For {{1}}, {{2}}, use variableOrder array
      const actualVarName = variableOrder[parseInt(variableName) - 1];
      const dataPath = VARIABLE_MAPPINGS[actualVarName];
      value = getNestedValue(candidateData, dataPath);
    } else if (!isNumbered) {
      // For {{name}}, {{email}}, use direct mapping
      const dataPath = VARIABLE_MAPPINGS[variableName];
      value = getNestedValue(candidateData, dataPath);
    }
    
    replacedText = replacedText.replace(match[0], value || `[${variableName}]`);
  });
  
  return replacedText;
}
```

## 🧪 Example Scenarios

### Example 1: Simple Welcome Message

**User Creates:**
```json
{
  "type": "BODY",
  "text": "Hello {{name}}, welcome to {{project_name}}!"
}
```

**Sent to WhatsApp:**
```json
{
  "type": "BODY",
  "text": "Hello {{1}}, welcome to {{2}}!",
  "example": {
    "body_text": [["John Doe", "Sample Value"]]
  }
}
```

**Stored in DB:**
```json
{
  "variableMappings": [
    {"position": 1, "variableName": "name"},
    {"position": 2, "variableName": "project_name"}
  ]
}
```

**When Sending to Candidate:**
```
Candidate: { name: "Rahul", college: { name: "ABC Institute" } }

Final Message:
"Hello Rahul, welcome to ABC Institute!"
```

### Example 2: Course Enrollment

**User Creates:**
```
Dear {{name}},

You're enrolled in {{course_name}}.
Contact {{counselor_name}} at {{mobile}}.
```

**Converted to:**
```
Dear {{1}},

You're enrolled in {{2}}.
Contact {{3}} at {{4}}.
```

**Example Values:**
```json
["John Doe", "Sample Course", "John Doe", "9876543210"]
```

**Variable Mappings:**
```json
[
  {"position": 1, "variableName": "name"},
  {"position": 2, "variableName": "course_name"},
  {"position": 3, "variableName": "counselor_name"},
  {"position": 4, "variableName": "mobile"}
]
```

## 🎯 Benefits

### For Template Creation
✅ Users can still use friendly names (`{{name}}`, `{{email}}`)  
✅ System automatically converts to WhatsApp format  
✅ No manual numbering needed  
✅ Clear variable purpose  

### For Message Sending
✅ Automatic data mapping  
✅ Stored mappings ensure correct values  
✅ Support for both formats  
✅ Backward compatible  

## 📊 Variable Example Mapping

| Variable Name | Example Value | Use Case |
|--------------|---------------|----------|
| `name` | John Doe | Student/Candidate name |
| `gender` | Male | Gender |
| `mobile` | 9876543210 | Phone number |
| `email` | user@example.com | Email address |
| `course_name` | Sample Course | Course name |
| `job_name` | Sample Job | Job title |
| `counselor_name` | John Doe | Counselor name |
| `batch_name` | Batch 2025 | Batch name |
| Other | Sample Value | Default |

## 🐞 Debug Logs

When creating template, you'll see:

```
✅ Converted 3 variables to numbered format
   Original: hello {{name}}, This is a test template for testing details like {{gender}}, {{mobile}}...
   Numbered: hello {{1}}, This is a test template for testing details like {{2}}, {{3}}...
   Examples: [ 'John Doe', 'Male', '9876543210' ]
   Mappings: [
     { position: 1, variableName: 'name' },
     { position: 2, variableName: 'gender' },
     { position: 3, variableName: 'mobile' }
   ]

Keeping example for BODY: {
  "body_text": [
    ["John Doe", "Male", "9876543210"]
  ]
}

=== Final Template Data Being Sent to Facebook ===
{
  "name": "template_for_testing",
  "language": "en",
  "category": "MARKETING",
  "components": [
    {
      "type": "BODY",
      "text": "hello {{1}}, This is a test template for testing details like {{2}}, {{3}}",
      "example": {
        "body_text": [["John Doe", "Male", "9876543210"]]
      }
    }
  ]
}
```

## ✅ Testing

### Test 1: Create Template
```javascript
POST /college/whatsapp/create-template

{
  "name": "test_template",
  "language": "en",
  "category": "UTILITY",
  "components": [{
    "type": "BODY",
    "text": "Hello {{name}}, your course is {{course_name}}"
  }]
}

Expected: Template created successfully ✅
```

### Test 2: Send Template
```javascript
POST /college/whatsapp/send-template

{
  "templateName": "test_template",
  "to": "9876543210",
  "candidateId": "candidate_id_here"
}

Expected: Variables automatically replaced with candidate data ✅
```

## 🎉 Result

✅ Templates now create successfully on WhatsApp  
✅ Named variables supported in UI  
✅ Automatic conversion to numbered format  
✅ Variable mappings stored for sending  
✅ Full backward compatibility  
✅ Better user experience  

---

**Status:** ✅ FIXED  
**Date:** October 2025  
**Impact:** All template creation and sending now works correctly

