/**
 * WhatsApp Template Variable Mapper
 * Maps template variables to candidate/lead data
 */

/**
 * Get value from nested object path
 * Example: getNestedValue(obj, '_concernPerson.name') 
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => {
    return acc && acc[part] !== undefined ? acc[part] : null;
  }, obj);
}

/**
 * Variable mapping configuration
 * Maps template variable names to data paths in candidate/registration object
 */
const VARIABLE_MAPPINGS = {
  // Basic Info
  'name': 'name',
  'gender': 'gender',
  'mobile': 'mobile',
  'email': 'email',
  
  // Course Related (from appliedCourses populated data)
  'course_name': '_appliedCourse.courseName',
  'course_fee': '_appliedCourse.fees',
  'course_duration': '_appliedCourse.duration',
  'course_type': '_appliedCourse.courseType',
  
  // Job Related (from appliedJobs populated data)
  'job_name': '_appliedJob.title',
  'job_company': '_appliedJob.company',
  'job_location': '_appliedJob.location',
  'job_salary': '_appliedJob.salary',
  
  // Counselor/Lead Owner
  'counselor_name': '_concernPerson.name',
  'lead_owner_name': 'registeredBy.name', // Use registeredBy if available, fallback handled in getNestedValue
  'counselor_email': '_concernPerson.email',
  'counselor_mobile': '_concernPerson.mobile',
  
  // College/Institution
  'college_name': '_college.name',
  'college_email': '_college.email',
  'college_phone': '_college.phone',
  'college_address': '_college.address',
  
  // Project/Institution Name (prefer _project, fallback to _college)
  'project_name': '_project.name', // Use _project if available, fallback handled in getNestedValue
  'institution_name': '_project.name',
  
  // Batch Related
  'batch_name': '_batch.name',
  'batch_start_date': '_batch.startDate',
  'batch_timing': '_batch.timing',
  
  // Additional common fields
  'city': 'cityId',
  'state': 'stateId',
  'address': 'address',
  'pincode': 'pincode',
  'qualification': 'basicQualification',
  'year_of_passing': 'yearOfPassing',
  'total_experience': 'total_Exp'
};

/**
 * Format value based on type
 */
function formatValue(value, key) {
  if (!value) return '';
  
  // Format dates
  if (key.includes('date') && value instanceof Date) {
    return value.toLocaleDateString('en-IN');
  }
  
  // Format mobile numbers
  if (key === 'mobile' || key.includes('mobile')) {
    return String(value).replace(/\s+/g, '');
  }
  
  // Format names (capitalize)
  if (key.includes('name')) {
    return String(value).trim();
  }
  
  return String(value).trim();
}

/**
 * Replace template variables with actual data
 * Handles both named variables ({{name}}) and numbered variables ({{1}})
 * @param {String} text - Template text with variables
 * @param {Object} candidateData - Candidate/Registration data object
 * @param {Array} variableOrder - Optional array specifying variable order for numbered placeholders
 * @returns {String} - Text with variables replaced
 */
function replaceVariables(text, candidateData, variableOrder = null) {
  if (!text || !candidateData) return text;
  
  let replacedText = text;
  
  // Find all variables in format {{variable_name}} or {{1}}
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const matches = [...text.matchAll(variableRegex)];
  
  matches.forEach((match, index) => {
    const fullMatch = match[0]; // {{variable_name}} or {{1}}
    const variableName = match[1].trim(); // variable_name or 1
    
    // Check if it's a numbered variable
    const isNumbered = /^\d+$/.test(variableName);
    
    let value = '';
    
    if (isNumbered && variableOrder && variableOrder[parseInt(variableName) - 1]) {
      // For numbered variables, use the variable order array if provided
      const actualVarName = variableOrder[parseInt(variableName) - 1];
      const dataPath = VARIABLE_MAPPINGS[actualVarName];
      if (dataPath) {
        value = getNestedValue(candidateData, dataPath);
        value = formatValue(value, actualVarName);
      }
    } else if (!isNumbered) {
      // For named variables, use direct mapping
      const dataPath = VARIABLE_MAPPINGS[variableName];
      if (dataPath) {
        value = getNestedValue(candidateData, dataPath);
        
        // Add fallback logic for specific variables
        if (!value) {
          if (variableName === 'counselor_name') {
            // Fallback to leadAssignment if _concernPerson is not available
            if (candidateData.leadAssignment && candidateData.leadAssignment.length > 0) {
              const lastAssignment = candidateData.leadAssignment[candidateData.leadAssignment.length - 1];
              value = lastAssignment.counsellorName || null;
            }
          } else if (variableName === 'lead_owner_name') {
            // Fallback to _concernPerson.name if registeredBy.name is not available
            value = getNestedValue(candidateData, '_concernPerson.name');
          } else if (variableName === 'project_name' || variableName === 'institution_name') {
            // Fallback to _college.name if _project.name is not available
            value = getNestedValue(candidateData, '_college.name');
          }
        }
        
        value = formatValue(value, variableName);
      }
    }
    
    // Replace in text (use fallback if value is empty)
    if (value) {
      replacedText = replacedText.replace(fullMatch, value);
    } else {
      console.warn(`Variable mapping not found or no data for: ${variableName}`);
      replacedText = replacedText.replace(fullMatch, `[${variableName}]`);
    }
  });
  
  return replacedText;
}

/**
 * Replace variables in template components
 * @param {Array} components - WhatsApp template components array
 * @param {Object} candidateData - Candidate/Registration data object
 * @returns {Array} - Components with replaced variables
 */
function replaceVariablesInComponents(components, candidateData) {
  if (!components || !Array.isArray(components) || !candidateData) {
    return components;
  }
  
  return components.map(component => {
    const newComponent = { ...component };
    
    // Replace in HEADER text
    if (component.type === 'HEADER' && component.format === 'TEXT' && component.text) {
      newComponent.text = replaceVariables(component.text, candidateData);
    }
    
    // Replace in BODY text
    if (component.type === 'BODY' && component.text) {
      newComponent.text = replaceVariables(component.text, candidateData);
      
      // Also update examples if present
      if (component.example && component.example.body_text) {
        newComponent.example.body_text = component.example.body_text.map(text => 
          replaceVariables(text, candidateData)
        );
      }
    }
    
    // Replace in FOOTER text
    if (component.type === 'FOOTER' && component.text) {
      newComponent.text = replaceVariables(component.text, candidateData);
    }
    
    // Replace in BUTTONS (for dynamic URLs)
    if (component.type === 'BUTTONS' && component.buttons) {
      newComponent.buttons = component.buttons.map(button => {
        const newButton = { ...button };
        if (button.url) {
          newButton.url = replaceVariables(button.url, candidateData);
        }
        return newButton;
      });
    }
    
    // Replace in CAROUSEL cards
    if (component.type === 'CAROUSEL' && component.cards) {
      newComponent.cards = component.cards.map(card => {
        const newCard = { ...card };
        if (card.components) {
          newCard.components = replaceVariablesInComponents(card.components, candidateData);
        }
        return newCard;
      });
    }
    
    return newComponent;
  });
}

/**
 * Get list of variables used in a text
 * @param {String} text - Text to analyze
 * @returns {Array} - Array of variable names
 */
function getVariablesInText(text) {
  if (!text) return [];
  
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const matches = [...text.matchAll(variableRegex)];
  
  return matches.map(match => match[1].trim());
}

/**
 * Validate if candidate has all required variable data
 * @param {String} text - Template text
 * @param {Object} candidateData - Candidate data
 * @returns {Object} - { valid: boolean, missingVariables: [] }
 */
function validateCandidateData(text, candidateData) {
  const variables = getVariablesInText(text);
  const missingVariables = [];
  
  variables.forEach(varName => {
    const dataPath = VARIABLE_MAPPINGS[varName];
    if (dataPath) {
      const value = getNestedValue(candidateData, dataPath);
      if (!value || value === '') {
        missingVariables.push(varName);
      }
    }
  });
  
  return {
    valid: missingVariables.length === 0,
    missingVariables
  };
}

/**
 * Get human-readable name for variable
 */
function getVariableDisplayName(variableName) {
  const displayNames = {
    'name': 'Name',
    'gender': 'Gender',
    'mobile': 'Mobile',
    'email': 'Email',
    'course_name': 'Course Name',
    'job_name': 'Job Name',
    'counselor_name': 'Counselor Name',
    'lead_owner_name': 'Lead Owner Name',
    'project_name': 'Project Name',
    'batch_name': 'Batch Name',
    'college_name': 'College Name',
    'city': 'City',
    'state': 'State',
    'qualification': 'Qualification',
    'year_of_passing': 'Year of Passing'
  };
  
  return displayNames[variableName] || variableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

module.exports = {
  replaceVariables,
  replaceVariablesInComponents,
  getVariablesInText,
  validateCandidateData,
  getVariableDisplayName,
  VARIABLE_MAPPINGS
};

