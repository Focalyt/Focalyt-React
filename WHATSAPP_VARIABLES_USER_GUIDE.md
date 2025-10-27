# WhatsApp Template Variables - User Guide

## How to Use the New Variable Dropdown Feature

### Step-by-Step Guide

#### 1. Creating a New Template

1. Navigate to WhatsApp Templates page
2. Click "Create Template" button
3. Fill in template details (Name, Category, Language)

#### 2. Adding Variables to Your Message

**Old Way (No longer used):**
- Click "+ Add Variable"
- Generic `{{1}}` added to message
- Not clear what the variable represents

**New Way (Current Implementation):**

1. **Click the "+ Add Variable" button**
   - A dropdown menu will appear

2. **Select a Variable Type**
   - Choose from these predefined options:
     - Name
     - Gender
     - Mobile
     - Email
     - Course Name
     - Job Name
     - Counselor Name
     - Lead Owner Name
     - Project Name
     - Batch Name

3. **Variable is Inserted**
   - The selected variable (e.g., `{{name}}`) is added to your message
   - An input field appears below showing the variable name

4. **Enter Sample Value**
   - Enter a sample value for the variable
   - This helps you preview how the message will look

### Example Usage

#### Creating a Welcome Message

**Message Template:**
```
Hello {{name}},

Welcome to {{course_name}}! 

Your counselor {{counselor_name}} will contact you soon on {{mobile}}.

For any queries, email us at support@example.com

Best regards,
{{project_name}} Team
```

**Steps:**
1. Type "Hello " in the body text
2. Click "+ Add Variable"
3. Select "Name" from dropdown
4. Continue typing ", Welcome to "
5. Click "+ Add Variable"
6. Select "Course Name"
7. Continue this process for other variables

**Variable Input Fields Will Show:**
- `{{name}}` - Name Value: [Enter sample name]
- `{{course_name}}` - Course Name Value: [Enter sample course]
- `{{counselor_name}}` - Counselor Name Value: [Enter counselor name]
- `{{mobile}}` - Mobile Value: [Enter mobile number]
- `{{project_name}}` - Project Name Value: [Enter project name]

### Available Variables and Use Cases

| Variable | Placeholder | Best Used For |
|----------|-------------|---------------|
| Name | `{{name}}` | Student/Lead name |
| Gender | `{{gender}}` | Personalized greetings |
| Mobile | `{{mobile}}` | Contact information |
| Email | `{{email}}` | Email addresses |
| Course Name | `{{course_name}}` | Course details |
| Job Name | `{{job_name}}` | Job placement info |
| Counselor Name | `{{counselor_name}}` | Assigned counselor |
| Lead Owner Name | `{{lead_owner_name}}` | Lead manager |
| Project Name | `{{project_name}}` | Institution/Project name |
| Batch Name | `{{batch_name}}` | Batch information |

### Tips for Best Results

#### 1. Choose Meaningful Variables
- Use specific variables that match your message content
- Example: For course enrollment, use `{{name}}` and `{{course_name}}`

#### 2. Provide Sample Values
- Always enter sample values for variables
- This helps preview the final message appearance

#### 3. Keep It Simple
- Don't overuse variables
- Too many variables can make messages confusing

#### 4. Test Your Template
- Preview the template with sample data
- Ensure variables are correctly placed

### Common Use Cases

#### Enrollment Confirmation
```
Dear {{name}},

Congratulations! You have been successfully enrolled in {{course_name}}.

Your batch {{batch_name}} starts soon. 

Contact {{counselor_name}} for more details.
```

#### Job Placement Notification
```
Hi {{name}},

Great news! We have a {{job_name}} opportunity for you.

Your placement counselor {{counselor_name}} will share details at {{email}}.
```

#### Follow-up Message
```
Hello {{name}},

This is {{counselor_name}} from {{project_name}}.

I wanted to follow up on your interest in {{course_name}}.

Call me at your convenience!
```

### Carousel Templates

For carousel templates, you can add variables to:

1. **Carousel Message** (Main message above cards)
   - Use the "+ Add Variable" button above the message field
   - Same dropdown options available

2. **Individual Card Body Text**
   - Each card has its own "+ Add Variable" button
   - Variables are independent per card

### Troubleshooting

#### Dropdown Not Showing
- Ensure you clicked the "+ Add Variable" button
- Check if you're in the correct field (Body Text section)

#### Variable Not Inserting
- Make sure you selected a variable from the dropdown
- Check if there's enough space in the text field (max 1024 chars)

#### Variable Input Field Missing
- The variable might have been removed from body text
- Re-add the variable using the dropdown

#### Wrong Variable Added
- Edit the body text manually to remove `{{variable_name}}`
- The variable input field will automatically disappear
- Add the correct variable using the dropdown

### Benefits of New System

✅ **Clear Variable Purpose**
- Immediately understand what each variable represents

✅ **Better Organization**
- Easily identify variables by their display names

✅ **Reduced Errors**
- Less confusion about which variable is which

✅ **Professional Templates**
- Create more meaningful and maintainable templates

✅ **Easy Selection**
- Quick dropdown selection vs manual typing

### Need More Variables?

If you need additional variable types not in the current list, please contact your system administrator. The list can be expanded to include:
- Custom fields from your database
- Institution-specific variables
- Department-specific variables
- Integration-based variables (from external systems)

---

## Quick Reference

### Dropdown Access
**Location:** Below the "Body Text" textarea
**Button:** "+ Add Variable"
**Action:** Click to open dropdown

### Variable Format
**Pattern:** `{{variable_name}}`
**Example:** `{{name}}`, `{{course_name}}`

### Closing Dropdown
- Click outside the dropdown
- Select a variable from the list
- Press ESC key (if implemented)

---

**Last Updated:** October 2025
**Feature Version:** 1.0

