# Frontend Preview Variable Replacement Fix

## 🐛 Problem

**Frontend preview mein variables properly replace nahi ho rahe the:**

1. **{{2}}** ko hardcoded `"Course Name"` se replace kar raha tha
2. **{{3}}** ka replacement nahi tha
3. **Actual candidate data** use nahi ho raha tha
4. **Preview mein** `{{3}}` dikha raha tha instead of actual mobile number

---

## ✅ Solution Implemented

### Before (Hardcoded):
```javascript
{bodyComponent.text
  ?.replace('{{1}}', selectedProfile?._candidate?.name || 'User')
  .replace('{{2}}', 'Course Name')  // ❌ Hardcoded!
  || ''}
```

### After (Dynamic with Actual Data):
```javascript
{(() => {
  // Get candidate data for variable replacement
  const candidate = selectedProfile?._candidate;
  const registration = selectedProfile;
  
  // Replace variables with actual candidate data
  let text = bodyComponent.text || '';
  
  // Replace {{1}} with name
  text = text.replace(/\{\{1\}\}/g, candidate?.name || registration?.name || 'User');
  
  // Replace {{2}} with gender
  text = text.replace(/\{\{2\}\}/g, candidate?.gender || 'Male');
  
  // Replace {{3}} with mobile
  text = text.replace(/\{\{3\}\}/g, candidate?.mobile || registration?.mobile || 'Mobile');
  
  // Replace {{4}} with email
  text = text.replace(/\{\{4\}\}/g, candidate?.email || registration?.email || 'Email');
  
  // Replace {{5}} with course name
  text = text.replace(/\{\{5\}\}/g, candidate?.appliedCourses?.[0]?.courseName || 'Course Name');
  
  // Replace {{6}} with counselor name
  text = text.replace(/\{\{6\}\}/g, candidate?._concernPerson?.name || 'Counselor');
  
  // Replace {{7}} with job name
  text = text.replace(/\{\{7\}\}/g, candidate?.appliedJobs?.[0]?.title || 'Job Title');
  
  // Replace {{8}} with project name (college name)
  text = text.replace(/\{\{8\}\}/g, candidate?._college?.name || 'Project Name');
  
  // Replace {{9}} with batch name
  text = text.replace(/\{\{9\}\}/g, candidate?.batchName || 'Batch Name');
  
  // Replace {{10}} with lead owner name
  text = text.replace(/\{\{10\}\}/g, candidate?._concernPerson?.name || 'Lead Owner');
  
  return text;
})()}
```

---

## 🎯 Variable Mapping Table

| Variable | Preview Replacement | Data Source |
|----------|-------------------|-------------|
| `{{1}}` | **Rahul Kumar** | `candidate.name` or `registration.name` |
| `{{2}}` | **Male** | `candidate.gender` |
| `{{3}}` | **9876543210** | `candidate.mobile` or `registration.mobile` |
| `{{4}}` | **rahul@example.com** | `candidate.email` or `registration.email` |
| `{{5}}` | **Full Stack Development** | `candidate.appliedCourses[0].courseName` |
| `{{6}}` | **Priya Sharma** | `candidate._concernPerson.name` |
| `{{7}}` | **Software Engineer** | `candidate.appliedJobs[0].title` |
| `{{8}}` | **ABC Institute** | `candidate._college.name` |
| `{{9}}` | **Batch 2025** | `candidate.batchName` |
| `{{10}}` | **Priya Sharma** | `candidate._concernPerson.name` |

---

## 🔄 How It Works Now

### Step 1: Template Selection
```
User selects template: "template_for_variable_testing"
Template text: "Hello {{1}}, your gender is {{2}} and mobile is {{3}}"
```

### Step 2: Candidate Data Available
```javascript
selectedProfile = {
  _candidate: {
    name: "Rahul Kumar",
    gender: "Male", 
    mobile: "9876543210",
    email: "rahul@example.com",
    appliedCourses: [{
      courseName: "Full Stack Development"
    }],
    _concernPerson: {
      name: "Priya Sharma"
    }
  }
}
```

### Step 3: Preview Generation
```javascript
Original: "Hello {{1}}, your gender is {{2}} and mobile is {{3}}"
         ↓ (Variable Replacement)
Preview: "Hello Rahul Kumar, your gender is Male and mobile is 9876543210"
```

### Step 4: Display in UI
```
┌─────────────────────────────────────────┐
│  WhatsApp Template                      │
│  template_for_variable_testing          │
│                                         │
│  Hello Rahul Kumar, your gender is      │
│  Male and mobile is 9876543210         │
│                                         │
│  ✅ Ready to send                       │
│  ✅ Pre-approved                        │
└─────────────────────────────────────────┘
```

---

## 🎨 UI Components Fixed

### 1. Regular Template Preview
**File:** `frontend/src/Pages/App/College/Course/Registrations.jsx` (Line ~5925)

```javascript
{/* Body */}
{bodyComponent && (
  <p className="..." style={{ ... }}>
    {(() => {
      // Dynamic variable replacement logic
      let text = bodyComponent.text || '';
      text = text.replace(/\{\{1\}\}/g, candidate?.name || 'User');
      text = text.replace(/\{\{2\}\}/g, candidate?.gender || 'Male');
      text = text.replace(/\{\{3\}\}/g, candidate?.mobile || 'Mobile');
      // ... more replacements
      return text;
    })()}
  </p>
)}
```

### 2. Carousel Template Preview
**File:** `frontend/src/Pages/App/College/Course/Registrations.jsx` (Line ~5814)

```javascript
<p className="mb-2" style={{ ... }}>
  {(() => {
    // Same dynamic variable replacement logic
    // for carousel card body text
    let text = cardBody?.text || '';
    text = text.replace(/\{\{1\}\}/g, candidate?.name || 'User');
    text = text.replace(/\{\{2\}\}/g, candidate?.gender || 'Male');
    text = text.replace(/\{\{3\}\}/g, candidate?.mobile || 'Mobile');
    // ... more replacements
    return text;
  })()}
</p>
```

---

## 🧪 Test Cases

### Test 1: Basic Variables
**Template:** `"Hello {{1}}, your mobile is {{3}}"`
**Candidate:** `{ name: "Amit", mobile: "9123456789" }`
**Expected Preview:** `"Hello Amit, your mobile is 9123456789"` ✅

### Test 2: Gender Variable
**Template:** `"Hi {{1}}, you are {{2}}"`
**Candidate:** `{ name: "Sneha", gender: "Female" }`
**Expected Preview:** `"Hi Sneha, you are Female"` ✅

### Test 3: Course Variable
**Template:** `"Welcome {{1}} to {{5}}"`
**Candidate:** `{ name: "Vikas", appliedCourses: [{courseName: "Data Science"}] }`
**Expected Preview:** `"Welcome Vikas to Data Science"` ✅

### Test 4: Missing Data
**Template:** `"Hello {{1}}, course {{5}}"`
**Candidate:** `{ name: "Rahul" }` (no course)
**Expected Preview:** `"Hello Rahul, course Course Name"` ✅ (fallback)

### Test 5: Multiple Variables
**Template:** `"{{1}} ({{2}}) - {{3}} - {{4}}"`
**Candidate:** `{ name: "John", gender: "Male", mobile: "9876543210", email: "john@example.com" }`
**Expected Preview:** `"John (Male) - 9876543210 - john@example.com"` ✅

---

## 📊 Before vs After

### Before (Hardcoded):
```
Template: "Hello {{1}}, gender {{2}}, mobile {{3}}"
Preview:  "Hello Rahul Kumar, gender Course Name, mobile {{3}}"
         ❌ Wrong gender, ❌ Mobile not replaced
```

### After (Dynamic):
```
Template: "Hello {{1}}, gender {{2}}, mobile {{3}}"
Preview:  "Hello Rahul Kumar, gender Male, mobile 9876543210"
         ✅ Correct name, ✅ Correct gender, ✅ Correct mobile
```

---

## 🎯 Benefits

### 1. **Accurate Preview**
```
पहले: Hardcoded values
अब: Actual candidate data
```

### 2. **Better User Experience**
```
User को preview में exact message dikhta hai
जो actually send होगा
```

### 3. **Real-time Updates**
```
Candidate change करने पर
Preview automatically update हो जाता है
```

### 4. **Fallback Support**
```
Data missing हो तो
Default values show करता है
```

---

## 🔧 Technical Details

### Variable Replacement Logic:
```javascript
// Global regex replacement for all numbered variables
text = text.replace(/\{\{1\}\}/g, candidate?.name || 'User');
text = text.replace(/\{\{2\}\}/g, candidate?.gender || 'Male');
text = text.replace(/\{\{3\}\}/g, candidate?.mobile || 'Mobile');
// ... up to {{10}}
```

### Data Source Priority:
```javascript
// For each variable, try multiple data sources:
candidate?.name || registration?.name || 'User'
candidate?.mobile || registration?.mobile || 'Mobile'
candidate?.appliedCourses?.[0]?.courseName || 'Course Name'
```

### Fallback Values:
```javascript
// If no data found, show descriptive fallbacks:
'User'        // for name
'Male'        // for gender  
'Mobile'      // for mobile
'Email'       // for email
'Course Name' // for course
'Counselor'   // for counselor
'Job Title'   // for job
'Project Name'// for project
'Batch Name'  // for batch
'Lead Owner'  // for lead owner
```

---

## 🚀 Usage

### For Users:
1. **Select candidate** from list
2. **Choose template** from dropdown
3. **Preview shows** actual message with real data
4. **Send template** - same data will be used

### For Developers:
1. **Template text** contains `{{1}}`, `{{2}}`, etc.
2. **Preview component** automatically replaces variables
3. **Candidate data** is fetched from `selectedProfile`
4. **Fallback values** shown if data missing

---

## ✅ Status

**Issue:** ✅ FIXED  
**Files Updated:**
- `frontend/src/Pages/App/College/Course/Registrations.jsx` ✅
- Regular template preview ✅
- Carousel template preview ✅

**Impact:**
- Preview now shows actual candidate data
- Variables properly replaced in UI
- Better user experience
- Real-time preview updates

---

**Date:** October 2025  
**Result:** Frontend preview ab actual candidate data se variables replace karta hai! 🎉

