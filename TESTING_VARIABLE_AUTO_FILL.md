# Testing WhatsApp Template Variable Auto-Fill

## ✅ What Was Fixed

### Problem:
```
Error: number of localizable_params (0) does not match the expected number of params (3)
```

**Reason:** Frontend se `candidateId` nahi ja raha tha, isliye variables fill nahi ho rahe the.

### Solution:
Frontend code update kiya - ab `candidateId` automatically send hoga!

---

## 🧪 How to Test

### Step 1: Create Template with Variables

1. Open WhatsApp Template page
2. Click "Create Template"
3. Add body text: `Hello {{name}}, your course is {{course_name}}`
4. Click "+ Add Variable" dropdown
5. Select "Name" → `{{name}}` added
6. Enter example value: "Amit Kumar"
7. Click "+ Add Variable" again
8. Select "Course Name" → `{{course_name}}` added
9. Enter example value: "Data Science"
10. Click "Create Template"

**Expected Result:** ✅ Template created successfully

---

### Step 2: Send Template to Candidate

1. Open **Registrations** page
2. Select a candidate/profile
3. Open WhatsApp chat panel
4. Click template icon 📋
5. Select your template
6. Click Send

**What Happens Behind the Scenes:**

```javascript
// Frontend sends:
{
  templateName: "your_template",
  to: "9876543210",
  candidateId: "candidate_123",  // ✅ Auto-added
  collegeId: "college_456"        // ✅ Auto-added
}

// Backend receives and processes:
🔍 Request params: {
  templateName: 'your_template',
  to: '9876543210',
  candidateId: 'candidate_123',
  collegeId: 'college_456'
}

📥 Fetching candidate data for ID: candidate_123

✅ Candidate data found: {
  name: 'Rahul Kumar',
  mobile: '9876543210',
  email: 'rahul@example.com',
  coursesCount: 1
}

📝 Variables found in template: [ '1', '2' ]

🗺️  Variable mappings from DB: [
  { position: 1, variableName: 'name' },
  { position: 2, variableName: 'course_name' }
]

   {{1}} → name
      Value: Rahul Kumar
   {{2}} → course_name
      Value: Full Stack Development

✅ WhatsApp message sent with variables: YES
```

**Expected Result:** ✅ Message sent with variables automatically filled!

---

## 📊 Console Logs to Check

### Frontend Console (Browser):
```javascript
🚀 Sending WhatsApp template with data: {
  templateName: 'welcome_msg',
  to: '9876543210',
  candidateId: '684ff35edc197327bc92dec8',  // ✅ Should be present
  hasCandidate: true  // ✅ Should be true
}
```

### Backend Console (Terminal):
```javascript
🔍 Request params: {
  templateName: 'template_for_variable_testing',
  to: '8699081947',
  candidateId: '684ff35edc197327bc92dec8',  // ✅ Should be present
  collegeId: '684ff35edc197327bc92deca'
}

📥 Fetching candidate data for ID: 684ff35edc197327bc92dec8

✅ Candidate data found: {
  name: 'Candidate Name',
  mobile: '8699081947',
  email: 'candidate@example.com',
  coursesCount: 1
}

📝 Variables found in template: [ '1', '2', '3' ]

🗺️  Variable mappings from DB: [
  { position: 1, variableName: 'name' },
  { position: 2, variableName: 'gender' },
  { position: 3, variableName: 'mobile' }
]

   {{1}} → name
      Value: Candidate Name
   {{2}} → gender
      Value: Male
   {{3}} → mobile
      Value: 8699081947

messagePayload {
  "messaging_product": "whatsapp",
  "to": "+918699081947",
  "template": {
    "name": "template_for_variable_testing",
    "language": { "code": "en" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "Candidate Name" },
        { "type": "text", "text": "Male" },
        { "type": "text", "text": "8699081947" }
      ]
    }]
  }
}

✅ WhatsApp message sent successfully!
```

---

## ⚠️ Troubleshooting

### Issue 1: "No candidateId provided"
**Log:**
```
⚠️  No candidateId or registrationId provided - variables will NOT be filled!
```

**Solution:**
- Check if `selectedProfile` exists
- Check if `selectedProfile._candidate._id` exists
- Verify frontend is sending `candidateId` in request

### Issue 2: "Candidate not found"
**Log:**
```
⚠️  Candidate not found with ID: xyz
```

**Solution:**
- Verify candidate exists in database
- Check if candidateId is correct
- Use registrationId as alternative

### Issue 3: "Number of parameters does not match"
**Log:**
```
Error: number of localizable_params (0) does not match expected (3)
```

**Reason:** `candidateData` is null or empty

**Solution:**
1. Check frontend console - `candidateId` sent?
2. Check backend logs - candidate data fetched?
3. Verify candidate has required data (name, email, etc.)

### Issue 4: Variables showing as [variable_name]
**Example:** "Hello [name], course is [course_name]"

**Reason:** Candidate doesn't have that data

**Solution:**
- Update candidate profile with missing data
- Or remove those variables from template

---

## ✅ Success Checklist

After sending template, verify:

- [ ] Frontend logs show `candidateId` is sent
- [ ] Backend logs show candidate data fetched
- [ ] Backend logs show variable mappings found
- [ ] Backend logs show variables replaced with actual values
- [ ] WhatsApp message payload has `components.parameters`
- [ ] Message delivered successfully
- [ ] Variables are correctly replaced in final message

---

## 📱 Test Cases

### Test Case 1: Simple Template
**Template:** "Hello {{name}}"
**Candidate:** { name: "Amit" }
**Expected:** "Hello Amit" ✅

### Test Case 2: Multiple Variables
**Template:** "Hi {{name}}, course {{course_name}}, mobile {{mobile}}"
**Candidate:** { name: "Sneha", mobile: "9123456789", appliedCourses: [{courseName: "Python"}] }
**Expected:** "Hi Sneha, course Python, mobile 9123456789" ✅

### Test Case 3: Missing Data
**Template:** "Hello {{name}}, batch {{batch_name}}"
**Candidate:** { name: "Vikas" } (no batch_name)
**Expected:** "Hello Vikas, batch [batch_name]" ✅ (Shows missing field)

### Test Case 4: Counselor Variable
**Template:** "Contact {{counselor_name}} at {{counselor_mobile}}"
**Candidate:** { _concernPerson: { name: "Priya", mobile: "9988776655" } }
**Expected:** "Contact Priya at 9988776655" ✅

---

## 🎯 Quick Test

**Sabse simple test:**

1. Create template:
   ```
   Hello {{name}}, welcome!
   ```

2. Select any candidate

3. Send template

4. Check backend logs:
   ```
   ✅ Candidate data found: { name: 'Candidate Name' }
   {{1}} → name → Candidate Name
   ```

5. Check WhatsApp - message should show actual name!

---

## 🚀 Next Steps

Ab try karo:

1. **Restart backend** (naye changes ke liye)
2. **Refresh frontend** (updated code load ho)
3. **Create a test template** with 2-3 variables
4. **Send to a candidate**
5. **Check console logs** for debug output
6. **Verify message** on WhatsApp

**Variables ab automatically fill ho jayenge!** ✅

---

**Status:** ✅ READY FOR TESTING  
**Files Modified:**
- `frontend/src/Pages/App/College/Course/Registrations.jsx` ✅
- `backend/controllers/routes/college/whatsapp.js` ✅
- `backend/controllers/models/wATemplate.js` ✅
- `backend/helpers/whatsappVariableMapper.js` ✅

**Date:** October 2025

