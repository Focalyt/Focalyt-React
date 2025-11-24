const cron = require("node-cron");
const axios = require("axios");
const b2cFollowup = require("../controllers/models/b2cFollowup");
const { User, WhatsAppTemplate, AppliedCourses } = require("../controllers/models");

// WhatsApp API configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const MISSED_FOLLOWUP_TEMPLATE_NAME = 'missedfollowups';

// Log template name on module load
console.log(`[Missed Followup Scheduler] Using WhatsApp template: "${MISSED_FOLLOWUP_TEMPLATE_NAME}"`);

// Helper function to format phone number
function formatPhoneNumber(number) {
  if (!number) return null;
  let phone = number.toString().replace(/\D/g, ''); // Remove non-digits
  if (phone.startsWith('91') && phone.length === 12) {
    return `+${phone}`;
  } else if (phone.length === 10) {
    return `+91${phone}`;
  } else if (phone.startsWith('+')) {
    return phone;
  }
  return `+${phone}`;
}

// Helper function to send WhatsApp template message
async function sendWhatsAppTemplateMessage(to, templateName, collegeId, variableValues = []) {
  try {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.warn("[WhatsApp] Missing credentials. Skipping message dispatch.");
      return null; // Return null to indicate failure
    }

    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      console.warn(`[WhatsApp] ❌ Invalid recipient number: ${to}. Skipping message.`);
      return null; // Return null to indicate failure
    }
    
    console.log(`[WhatsApp] 📞 Phone Number Formatting:`);
    console.log(`   Original: ${to}`);
    console.log(`   Formatted: ${formattedPhone}`);

    // Find template in database - first try with collegeId, then try without collegeId as fallback
    console.log(`[WhatsApp] Looking for template: "${templateName}" for college: ${collegeId}`);
    let template = await WhatsAppTemplate.findOne({
      collegeId: collegeId,
      templateName: templateName
    });

    // If not found with collegeId, try to find template without collegeId (global template)
    if (!template) {
      console.log(`[WhatsApp] Template "${templateName}" not found for college ${collegeId}, trying to find global template...`);
      template = await WhatsAppTemplate.findOne({
        templateName: templateName
      });
    }

    if (!template) {
      console.warn(`[WhatsApp] Template "${templateName}" not found in database. Please create this template in WhatsApp panel.`);
      return null; // Return null to indicate failure
    }

    console.log(`[WhatsApp] Template found: "${template.templateName}" (Language: ${template.language || 'en'})`);

    const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const messagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: template.templateName,
        language: {
          code: template.language || 'en'
        }
      }
    };

    // Add body parameters if variable values are provided
    if (variableValues && variableValues.length > 0) {
      messagePayload.template.components = [{
        type: 'body',
        parameters: variableValues.map(value => ({
          type: 'text',
          text: value || ''
        }))
      }];
    }

    const response = await axios.post(url, messagePayload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[WhatsApp] ✅ Template "${templateName}" sent successfully!`);
    console.log(`   ✅ Formatted Phone Number: ${formattedPhone}`);
    console.log(`   ✅ Message ID: ${response.data?.messages?.[0]?.id || 'N/A'}`);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] Failed to send template message:', error.response?.data || error.message);
    throw error;
  }
}

function missedFollowupSchedular() {
  cron.schedule("* * * * *", async () => {
    try {

      // console.log('checking missed followups')

      const followups = await b2cFollowup.find({
        status: "planned",
        followupDate: { $lt: new Date() }
      }).populate({
        path: 'appliedCourseId',
        model: 'AppliedCourses', 
        populate: [
          { path: '_candidate', select: 'name mobile email' },
          { path: '_course', select: 'name' }
        ]
      });

      
      
      if (followups.length > 0) {
        const ids = followups.map(f => f.createdBy.toString());
        // Get unique counselor IDs
        const uniqueCounselorIds = [...new Set(ids)];
        
        // console.log(ids, 'ids');
      
        const result = await b2cFollowup.updateMany(
          { status: "planned", followupDate: { $lt: new Date() } },
          { $set: { status: "missed", statusUpdatedAt: new Date() } }
        );
      
        // console.log(`[Cron] Marked ${ids.length} followups as missed`);

        console.log(global.userSockets, "global.userSockets");
        // Emit socket for each followup (example)
        ids.forEach(id => {
          const socketIds = global.userSockets[id] || [];
          socketIds.forEach(socketId => {
            global.io.to(socketId).emit("missedFollowup", { followupId: id });
          });
        });

        // Send WhatsApp template messages to counselors
        try {
          // console.log(`\n[Cron] 📋 Summary: Found ${followups.length} missed followup(s) for ${uniqueCounselorIds.length} counselor(s)`);
          // console.log(`[Cron] 📋 Counselor IDs: ${uniqueCounselorIds.join(', ')}`);
          // console.log(`[Cron] 📋 Template to be sent: "${MISSED_FOLLOWUP_TEMPLATE_NAME}"`);
          // console.log(`[Cron] 📋 Starting WhatsApp notifications...\n`);
          
          // Get counselor details and send WhatsApp messages
          for (const counselorId of uniqueCounselorIds) {
            try {
              const counselor = await User.findById(counselorId);
              
              if (!counselor) {
                console.warn(`[Cron] Counselor not found: ${counselorId}`);
                continue;
              }

              // Get WhatsApp number (prefer whatsapp field, fallback to mobile)
              const whatsappNumber = counselor.whatsapp || counselor.mobile;
              
              if (!whatsappNumber) {
                console.warn(`[Cron] ❌ No WhatsApp number found for counselor: ${counselor.name || counselorId} (ID: ${counselorId})`);
                continue;
              }

              // console.log(`\n[Cron] 📱 Counselor Details:`);
              // console.log(`   Name: ${counselor.name || 'N/A'}`);
              // console.log(`   Mobile Number (Raw): ${whatsappNumber}`);
              // console.log(`   WhatsApp Field: ${counselor.whatsapp || 'Not set'}`);
              // console.log(`   Mobile Field: ${counselor.mobile || 'Not set'}`);

              const counselorFollowups = followups.filter(f => f.createdBy.toString() === counselorId);
              
              if (counselorFollowups.length === 0) {
                console.warn(`[Cron] No followups found for counselor ${counselorId}`);
                continue;
              }

              const followup = counselorFollowups[0];
              if (!followup || !followup.collegeId) {
                console.warn(`[Cron] No collegeId found for followup`);
                continue;
              }

              const missedCount = counselorFollowups.length;

             
              const studentMobileNumber = followup.appliedCourseId?._candidate?.mobile || 'N/A';
              const studentName = followup.appliedCourseId?._candidate?.name || 'Student';
              const courseName = followup.appliedCourseId?._course?.name || 'Course';

              let template = await WhatsAppTemplate.findOne({
                collegeId: followup.collegeId,
                templateName: MISSED_FOLLOWUP_TEMPLATE_NAME
              });

              if (!template) {
                template = await WhatsAppTemplate.findOne({
                  templateName: MISSED_FOLLOWUP_TEMPLATE_NAME
                });
              }

              let requiredVariableCount = 3; 
              if (template && template.variableMappings && template.variableMappings.length > 0) {
                
                const maxPosition = Math.max(...template.variableMappings.map(m => m.position));
                requiredVariableCount = maxPosition;
                console.log(`[Cron] Template requires ${requiredVariableCount} variables based on variableMappings`);
              }

              const variableValues = new Array(requiredVariableCount).fill('');
              
              if (template && template.variableMappings && template.variableMappings.length > 0) {
                // Sort mappings by position
                const sortedMappings = [...template.variableMappings].sort((a, b) => a.position - b.position);
                
                sortedMappings.forEach(mapping => {
                  const varName = mapping.variableName.toLowerCase();
                  const position = mapping.position - 1; // Convert to 0-based index
                  
                  if (varName.includes('counselor') || (varName.includes('name') && varName.includes('counselor'))) {
                    variableValues[position] = counselor.name || 'Counselor';
                  } else if (varName.includes('student') || varName.includes('candidate')) {
                    // Check if it's mobile number or name
                    if (varName.includes('mobile') || varName.includes('phone') || varName.includes('number')) {
                      variableValues[position] = studentMobileNumber;
                    } else {
                      variableValues[position] = studentName;
                    }
                  } else if (varName.includes('course')) {
                    variableValues[position] = courseName;
                  } else if (varName.includes('count') || varName.includes('missed')) {
                    variableValues[position] = missedCount.toString();
                  } else if (varName.includes('date') || varName.includes('time')) {
                    const currentDate = new Date();
                    const dateStr = currentDate.toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    });
                    variableValues[position] = dateStr;
                  } else {
                    if (position === 0) {
                      variableValues[position] = counselor.name || 'Counselor';
                    } else if (position === 1) {
                      // Default: Use mobile number for student (as per template requirement)
                      variableValues[position] = studentMobileNumber;
                    } else if (position === 2) {
                      variableValues[position] = courseName;
                    } else if (position === 3) {
                      variableValues[position] = missedCount.toString();
                    }
                  }
                });
              } else {
                if (requiredVariableCount >= 1) variableValues[0] = counselor.name || 'Counselor';
                
                if (requiredVariableCount >= 2) variableValues[1] = studentMobileNumber;
                
                if (requiredVariableCount >= 3) variableValues[2] = courseName;
                
                if (requiredVariableCount >= 4) variableValues[3] = missedCount.toString();
              
                if (requiredVariableCount >= 5) {
                  const currentDate = new Date();
                  const dateStr = currentDate.toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  });
                  variableValues[4] = dateStr;
                }
              }

              console.log(`[Cron] Prepared ${variableValues.length} variable values for template`);
              console.log(`[Cron] Variable values:`, variableValues);

              // Send WhatsApp template message
              // console.log(`\n[Cron] 📤 Sending WhatsApp Template:`);
              // console.log(`   Template Name: "${MISSED_FOLLOWUP_TEMPLATE_NAME}"`);
              // console.log(`   To Mobile Number: ${whatsappNumber}`);
              // console.log(`   Counselor: ${counselor.name || 'N/A'} (ID: ${counselorId})`);
              // console.log(`   Student Mobile: ${studentMobileNumber}`);
              // console.log(`   Course: ${courseName}`);
              // console.log(`   Missed Followups Count: ${missedCount}`);
              
              const result = await sendWhatsAppTemplateMessage(
                whatsappNumber,
                MISSED_FOLLOWUP_TEMPLATE_NAME,
                followup.collegeId,
                variableValues
              );

           
              // if (result) {
              //   console.log(`\n[Cron] ✅ SUCCESS: WhatsApp template sent!`);
              //   console.log(`   ✅ Template: "${MISSED_FOLLOWUP_TEMPLATE_NAME}"`);
              //   console.log(`   ✅ Sent to Mobile Number: ${whatsappNumber}`);
              //   console.log(`   ✅ Counselor Name: ${counselor.name || 'N/A'}`);
              //   console.log(`   ✅ Student Name: ${studentName}`);
              //   console.log(`   ✅ Student Mobile Number: ${studentMobileNumber}`);
              //   console.log(`   ✅ Course Name: ${courseName}`);
              //   console.log(`   ✅ Missed Followups: ${missedCount}`);
              //   console.log(`   ✅ College ID: ${followup.collegeId}`);
              //   console.log(`─────────────────────────────────────────────────\n`);
              // } else {
              //   console.log(`\n[Cron] ❌ FAILED: WhatsApp template NOT sent!`);
              //   console.log(`   ❌ Template: "${MISSED_FOLLOWUP_TEMPLATE_NAME}"`);
              //   console.log(`   ❌ Reason: Template not found or missing credentials`);
              //   console.log(`   ❌ Counselor: ${counselor.name || 'N/A'} (ID: ${counselorId})`);
              //   console.log(`   ❌ Mobile Number: ${whatsappNumber}`);
              //   console.log(`─────────────────────────────────────────────────\n`);
              // }
            } catch (error) {
              console.error(`[Cron] Error sending WhatsApp to counselor ${counselorId}:`, error.message);
            
            }
          }
        } catch (error) {
          console.error("[Cron] Error sending WhatsApp notifications:", error);
        }
      }
      
    } catch (err) {
      console.error("[Cron] Error updating missed followups:", err);
    }
  }, { timezone: "Asia/Kolkata" });
}

module.exports = missedFollowupSchedular;