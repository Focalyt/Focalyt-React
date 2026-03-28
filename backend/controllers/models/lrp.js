const { Schema, model } = require("mongoose");

const lrpSchema = new Schema(
  {
    partnerType: { type: String, required: true, trim: true }, 
    implementationPartnerName: { type: String, required: true, trim: true },
    visitDate: { type: Date, required: true },
    geoTaggedPhoto: { type: String, required: true, trim: true }, 

    state: { type: String, required: true, trim: true }, 
    district: { type: String, required: true, trim: true },

    schoolNameAddress: { type: String, required: true, trim: true },
    schoolType: { type: String, required: true, trim: true }, // CBSE/ICSE/HBSE/PSEB/Other
    schoolTypeOther: { type: String, trim: true }, 
    schoolEmail: { type: String, required: true, trim: true, lowercase: true },
    coordinatorNameContact: { type: String, required: true, trim: true },
    decisionMaker: { type: String, required: true, trim: true },
    studentsClass2to12: { type: Number, required: true },
    hasLabs: { type: String, required: true, trim: true }, 
    interestedWorkshop: { type: String, required: true, trim: true }, 
    avgStudentsPerClass: { type: Number, required: true },
    preferredPlan: { type: String, required: true, trim: true }, 
    managementReadyApprove: { type: String, required: true, trim: true }, 
    meetingWithSeniorStaff: { type: String, required: true, trim: true }, 
    nextMeetingDate: { type: Date, required: true },
    hasComputerLab: { type: String, required: true, trim: true }, 
    computersAvailable: { type: Number }, 

    fftlClasses: { type: String, required: true, trim: true },
    openForPartnership: { type: String, required: true, trim: true }, 
    teachersAvailable: { type: String, required: true, trim: true }, 
    proposalExplainedSubmitted: { type: String, required: true, trim: true }, 
    poExpectedTimeline: { type: String, required: true, trim: true },
    leadStatus: { type: String, required: true, trim: true }, 
    lockLead: { type: String, required: true, trim: true }, 
    otherRemarks: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = model("LRP", lrpSchema);