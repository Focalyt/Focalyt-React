# Frontend Preview Variable Mapping Fix

## 🎯 Problem Identified

**User ka valid point:** Frontend preview mein bhi **database mappings** check karna padega!

**Previous Code:** Hardcoded assumptions ki `{{1}}` = name, `{{2}}` = gender  
**Reality:** Database mein stored mappings use karna padega!

---

## ✅ Solution Implemented

### Before (Hardcoded Assumptions):
```javascript
// ❌ Frontend hardcoded assumptions
text = text.replace(/\{\{1\}\}/g, candidate?.name || 'User'); // Always name
text = text.replace(/\{\{2\}\}/g, candidate?.gender || 'Male'); // Always gender
text = text.replace(/\{\{3\}\}/g, candidate?.mobile || 'Mobile'); // Always mobile
```

### After (Database-Driven Mapping):
```javascript
// ✅ Use stored variable mappings from database
const variableMappings = selectedWhatsappTemplate?.variableMappings || [];

if (variableMappings && variableMappings.length > 0) {
  variableMappings.forEach(mapping => {
    const position = mapping.position; // 1, 2, 3, etc.
    const variableName = mapping.variableName; // 'mobile', 'course_name', etc.
    
    // Get value based on ACTUAL variable name from database
    let value = '';
    switch (variableName) {
      case 'name':
        value = candidate?.name || 'User';
        break;
      case 'mobile':
        value = candidate?.mobile || 'Mobile';
        break;
      case 'course_name':
        value = candidate?.appliedCourses?.[0]?.courseName || 'Course Name';
        break;
      // ... more cases
    }
    
    // Replace the numbered variable with correct value
    text = text.replace(new RegExp(`\\{\\{${position}\\}\\}`, 'g'), value);
  });
}
```

---

## 🔄 How It Works Now

### Step 1: Get Template Mappings
```javascript
// Frontend gets variable mappings from selected template
const variableMappings = selectedWhatsappTemplate?.variableMappings || [];
```

### Step 2: Smart Replacement
```javascript
// Template: "Hello {{1}}, your {{2}} is {{3}}"
// Database mappings: {{1}} = mobile, {{2}} = course_name, {{3}} = counselor_name
// Candidate data: { mobile: "9876543210", appliedCourses: [{courseName: "Python"}], _concernPerson: {name: "Priya"} }

// Replacement process:
{{1}} (mobile) → "9876543210"
{{2}} (course_name) → "Python"  
{{3}} (counselor_name) → "Priya Sharma"

// Final preview: "Hello 9876543210, your Python is Priya Sharma"
```

### Step 3: Console Logs
```
🗺️ Frontend using stored variable mappings: [
  { position: 1, variableName: 'mobile' },
  { position: 2, variableName: 'course_name' },
  { position: 3, variableName: 'counselor_name' }
]

   Frontend {{1}} (mobile) → 9876543210
   Frontend {{2}} (course_name) → Python
   Frontend {{3}} (counselor_name) → Priya Sharma
```

---

## 📊 Fixed Components

### 1. **Regular Template Body Text**
```javascript
// Location: Template preview body component
{bodyComponent && (
  <p>
    {(() => {
      // Get template variable mappings
      const variableMappings = selectedWhatsappTemplate?.variableMappings || [];
      
      // Use database mappings for replacement
      if (variableMappings && variableMappings.length > 0) {
        // Smart replacement using stored mappings
      } else {
        // Fallback to default mapping
      }
    })()}
  </p>
)}
```

### 2. **Carousel Card Body Text**
```javascript
// Location: Carousel template card body
{cardBody && (
  <div>
    {(() => {
      // Get template variable mappings
      const variableMappings = selectedWhatsappTemplate?.variableMappings || [];
      
      // Use database mappings for replacement
      if (variableMappings && variableMappings.length > 0) {
        // Smart replacement using stored mappings
      } else {
        // Fallback to default mapping
      }
    })()}
  </div>
)}
```

---

## 🧪 Test Cases

### Test 1: Mobile First Template
```javascript
Template: "Your mobile {{1}} and name {{2}}"
Database Mapping: {{1}} = mobile, {{2}} = name
Candidate: { name: "Amit", mobile: "9876543210" }
Frontend Preview: "Your mobile 9876543210 and name Amit" ✅
```

### Test 2: Course First Template
```javascript
Template: "Course {{1}} and mobile {{2}}"
Database Mapping: {{1}} = course_name, {{2}} = mobile
Candidate: { mobile: "9876543210", appliedCourses: [{courseName: "Data Science"}] }
Frontend Preview: "Course Data Science and mobile 9876543210" ✅
```

### Test 3: Counselor First Template
```javascript
Template: "Counselor {{1}} and batch {{2}}"
Database Mapping: {{1}} = counselor_name, {{2}} = batch_name
Candidate: { _concernPerson: {name: "Priya"}, batchName: "2025" }
Frontend Preview: "Counselor Priya and batch 2025" ✅
```

### Test 4: Carousel Template
```javascript
Carousel Card: "Welcome {{1}} to {{2}}"
Database Mapping: {{1}} = name, {{2}} = course_name
Candidate: { name: "Rahul", appliedCourses: [{courseName: "Python"}] }
Frontend Preview: "Welcome Rahul to Python" ✅
```

---

## 🔧 Technical Implementation

### Frontend Variable Replacement Function:
```javascript
const replaceVariablesWithMappings = (templateText, candidateData, variableMappings) => {
  let text = templateText;
  
  if (variableMappings && variableMappings.length > 0) {
    // Use stored variable mappings from database
    console.log('🗺️ Frontend using stored variable mappings:', variableMappings);
    
    variableMappings.forEach(mapping => {
      const position = mapping.position;
      const variableName = mapping.variableName;
      
      // Get value based on actual variable name from mapping
      let value = '';
      
      switch (variableName) {
        case 'name':
          value = candidate?.name || registration?.name || 'User';
          break;
        case 'mobile':
          value = candidate?.mobile || registration?.mobile || 'Mobile';
          break;
        case 'course_name':
          value = candidate?.appliedCourses?.[0]?.courseName || 'Course Name';
          break;
        case 'counselor_name':
          value = candidate?._concernPerson?.name || 'Counselor';
          break;
        // ... more cases
        default:
          // Try direct property access
          value = candidate?.[variableName] || registration?.[variableName] || `[${variableName}]`;
          break;
      }
      
      // Replace the numbered variable with actual value
      text = text.replace(new RegExp(`\\{\\{${position}\\}\\}`, 'g'), value);
      console.log(`   Frontend {{${position}}} (${variableName}) → ${value}`);
    });
  } else {
    // Fallback: Use default mapping if no stored mappings
    console.log('⚠️ Frontend: No variable mappings found, using fallback replacement');
    // ... fallback logic
  }
  
  return text;
};
```

### Usage in Components:
```javascript
// Regular template body
{bodyComponent && (
  <p>
    {replaceVariablesWithMappings(
      bodyComponent.text, 
      candidateData, 
      selectedWhatsappTemplate?.variableMappings
    )}
  </p>
)}

// Carousel card body
{cardBody && (
  <div>
    {replaceVariablesWithMappings(
      cardBody.text, 
      candidateData, 
      selectedWhatsappTemplate?.variableMappings
    )}
  </div>
)}
```

---

## 📱 Frontend Data Flow

### Step 1: Template Selection
```
User selects template → Frontend gets template with variableMappings
```

### Step 2: Preview Generation
```
Template text + Variable mappings + Candidate data → Filled preview
```

### Step 3: Console Logging
```
🗺️ Frontend using stored variable mappings: [...]
   Frontend {{1}} (mobile) → 9876543210
   Frontend {{2}} (course_name) → Python
```

---

## 🎯 Benefits

### 1. **Accurate Preview**
```
Frontend preview shows correct variables
No hardcoded assumptions
```

### 2. **Database-Driven**
```
Same mappings used in backend and frontend
Consistent behavior
```

### 3. **Flexible System**
```
{{1}} can be anything: name, mobile, course, etc.
Depends on template creator's choice
```

### 4. **Fallback Support**
```
If no mappings, uses default logic
System is robust
```

---

## 📊 Before vs After

### Before (Hardcoded):
```javascript
// ❌ Always assumes {{1}} = name, {{2}} = gender
Template: "Hello {{1}}, your {{2}} is {{3}}"
Preview: "Hello Rahul, your Male is 9876543210" // Wrong!
```

### After (Database-Driven):
```javascript
// ✅ Uses actual database mappings
Template: "Hello {{1}}, your {{2}} is {{3}}"
Database Mapping: {{1}} = mobile, {{2}} = course_name, {{3}} = counselor_name
Preview: "Hello 9876543210, your Python is Priya Sharma" // Correct!
```

---

## 🚀 Usage Examples

### Template Creation:
```
1. User creates template: "Hello {{1}}, your {{2}} is {{3}}"
2. User adds variables: {{1}} = mobile, {{2}} = course_name, {{3}} = counselor_name
3. System saves mappings in database
```

### Frontend Preview:
```
1. User selects template
2. Frontend gets template with mappings
3. Preview shows correct variables
4. No hardcoded assumptions
```

---

## ✅ Status

**Issue:** ✅ FIXED  
**Files Updated:**
- `frontend/src/Pages/App/College/Course/Registrations.jsx` ✅

**Components Fixed:**
- Regular template body text preview ✅
- Carousel card body text preview ✅

**Impact:**
- Frontend preview uses database mappings
- No hardcoded assumptions
- Consistent with backend behavior
- Accurate variable replacement

---

**Date:** October 2025  
**Result:** Frontend preview ab database-driven variable mapping use karta hai! 🎉

**Complete WhatsApp template system with consistent frontend and backend variable handling!** 💯
