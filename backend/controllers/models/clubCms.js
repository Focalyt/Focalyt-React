const { Schema, model } = require('mongoose');

const { ObjectId } = Schema.Types;

const clubSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    category: { type: String, default: 'Creative', trim: true },
    clubType: { type: String, default: '', trim: true },
    theme: { type: String, default: '', trim: true },
    collegeId: { type: ObjectId, ref: 'College' },
    verticalId: { type: ObjectId, ref: 'Vertical' },
    projectId: { type: ObjectId, ref: 'Project' },
    centerId: { type: ObjectId, ref: 'Center' },
    coordinatorId: { type: String, default: '' },
    createdByUserId: { type: ObjectId, ref: 'User' },
    // All Club Admins who can manage this club (owner + added admins). createdByUserId stays primary.
    // Use [ObjectId] (not [{ type: ObjectId }]) so Mongoose treats this as an ObjectId array,
    // not a DocumentArray — DocumentArray casts throw: Parameter "obj" to Document() must be an object.
    adminUserIds: { type: [ObjectId], ref: 'User', default: [] },
    // SSE / SE linked to this club only (not campus-wide).
    staffUserIds: { type: [ObjectId], ref: 'User', default: [] },
    createdByRole: { type: String, default: '' },
    eligibility: { type: String, default: 'Open to all registered students.' },
    joiningMethod: { type: String, default: 'Approval Required' },
    meetingSchedule: { type: String, default: '' },
    location: { type: String, default: '' },
    interests: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

clubSchema.index({ collegeId: 1, isDeleted: 1 });
clubSchema.index({ centerId: 1, isDeleted: 1 });
clubSchema.index({ createdAt: -1 });

const clubMemberSchema = new Schema(
  {
    clubId: { type: ObjectId, ref: 'Club', required: true },
    collegeId: { type: ObjectId, ref: 'College' },
    studentUserId: { type: ObjectId, ref: 'User' },
    studentName: { type: String, default: 'Student' },
    studentEmail: { type: String, default: '' },
    studentMobile: { type: String, default: '' },
    department: { type: String, default: 'Campus Student' },
    status: {
      type: String,
      enum: ['pending', 'joined', 'approved', 'rejected', 'blocked'],
      default: 'pending',
    },
    requestedAt: { type: String, default: '' },
    joinedAt: { type: String, default: '' },
    approvedAt: { type: String, default: '' },
    rejectedAt: { type: String, default: '' },
    blockedAt: { type: String, default: '' },
    note: { type: String, default: '' },
    requestedByUserId: { type: ObjectId, ref: 'User' },
    requestedByName: { type: String, default: '' },
    requestedByRole: { type: String, default: '' },
    reviewedByUserId: { type: ObjectId, ref: 'User' },
    reviewedByName: { type: String, default: '' },
    reviewedByRole: { type: String, default: '' },
    reviewedAt: { type: String, default: '' },
    blockedByUserId: { type: ObjectId, ref: 'User' },
    blockedByName: { type: String, default: '' },
    blockedByRole: { type: String, default: '' },
  },
  { timestamps: true }
);

clubMemberSchema.index({ clubId: 1, studentUserId: 1 });
clubMemberSchema.index({ collegeId: 1, status: 1 });

const clubPositionSchema = new Schema(
  {
    clubId: { type: ObjectId, ref: 'Club', required: true },
    collegeId: { type: ObjectId, ref: 'College' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    seats: { type: Number, default: 1 },
    status: { type: String, default: 'Open' },
    // Optional academic term, e.g. "Academic Year 2025–26"
    termLabel: { type: String, default: '', trim: true },
    termStart: { type: String, default: '' },
    termEnd: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const clubPositionRequestSchema = new Schema(
  {
    positionId: { type: ObjectId, ref: 'ClubPosition', required: true },
    clubId: { type: ObjectId, ref: 'Club' },
    collegeId: { type: ObjectId, ref: 'College' },
    studentUserId: { type: ObjectId, ref: 'User' },
    studentName: { type: String, default: 'Student' },
    note: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'recommended', 'assigned', 'rejected'],
      default: 'pending',
    },
    requestedByUserId: { type: ObjectId, ref: 'User' },
    requestedByName: { type: String, default: '' },
    requestedAt: { type: String, default: '' },
    recommendedByUserId: { type: ObjectId, ref: 'User' },
    recommendedByName: { type: String, default: '' },
    recommendedAt: { type: String, default: '' },
    assignedByUserId: { type: ObjectId, ref: 'User' },
    assignedByName: { type: String, default: '' },
    assignedAt: { type: String, default: '' },
    reviewedByUserId: { type: ObjectId, ref: 'User' },
    reviewedByName: { type: String, default: '' },
    reviewedAt: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubActivityRegistrationSchema = new Schema(
  {
    studentUserId: { type: ObjectId, ref: 'User' },
    studentName: { type: String, default: 'Student' },
    studentEmail: { type: String, default: '' },
    registrantRole: { type: String, default: 'student' },
    registeredAt: { type: String, default: '' },
    attendance: { type: String, default: 'Pending' },
    pointsAwarded: { type: Boolean, default: false },
    approvalStatus: { type: String, default: 'pending' },
    approvedByUserId: { type: ObjectId, ref: 'User' },
    approvedByName: { type: String, default: '' },
    approvedAt: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubActivitySchema = new Schema(
  {
    clubId: { type: ObjectId, ref: 'Club' },
    collegeId: { type: ObjectId, ref: 'College' },
    inChargeId: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    date: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    time: { type: String, default: '' },
    location: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    placeId: { type: String, default: '' },
    mode: { type: String, default: 'In-Person' },
    summary: { type: String, default: '' },
    description: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    capacity: { type: Number, default: 40 },
    tags: { type: [String], default: [] },
    certificateTemplateId: { type: String, default: 'classic' },
    scheduleStatus: {
      type: String,
      enum: ['draft', 'requested', 'recommended', 'approved', 'scheduled', 'rejected'],
      default: 'draft',
    },
    requestedByUserId: { type: ObjectId, ref: 'User' },
    requestedByName: { type: String, default: '' },
    requestedByRole: { type: String, default: '' },
    requestedAt: { type: String, default: '' },
    recommendedByUserId: { type: ObjectId, ref: 'User' },
    recommendedByName: { type: String, default: '' },
    recommendedAt: { type: String, default: '' },
    approvedByUserId: { type: ObjectId, ref: 'User' },
    approvedByName: { type: String, default: '' },
    approvedAt: { type: String, default: '' },
    scheduledByUserId: { type: ObjectId, ref: 'User' },
    scheduledByName: { type: String, default: '' },
    scheduledAt: { type: String, default: '' },
    registrations: { type: [clubActivityRegistrationSchema], default: [] },
  },
  { timestamps: true }
);

const clubSuggestionSchema = new Schema(
  {
    collegeId: { type: ObjectId, ref: 'College' },
    studentUserId: { type: ObjectId, ref: 'User' },
    submittedBy: { type: String, default: 'Student' },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Creative' },
    description: { type: String, default: '' },
    whyNeeded: { type: String, default: '' },
    expectedFormat: { type: String, default: '' },
    status: { type: String, default: 'Submitted' },
    submittedAt: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubPostCommentSchema = new Schema(
  {
    authorUserId: { type: ObjectId, ref: 'User' },
    author: { type: String, default: 'Student' },
    body: { type: String, required: true },
    createdAt: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubPostSchema = new Schema(
  {
    clubId: { type: ObjectId, ref: 'Club' },
    collegeId: { type: ObjectId, ref: 'College' },
    authorUserId: { type: ObjectId, ref: 'User' },
    author: { type: String, default: 'Student' },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    mediaType: { type: String, default: 'text' },
    mediaUrl: { type: String, default: '' },
    likes: { type: [String], default: [] },
    shares: { type: [String], default: [] },
    reports: { type: [String], default: [] },
    reportStatus: { type: String, default: 'open' },
    resolvedByUserId: { type: ObjectId, ref: 'User' },
    resolvedByName: { type: String, default: '' },
    resolvedAt: { type: String, default: '' },
    comments: { type: [clubPostCommentSchema], default: [] },
    createdAtDate: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubAnnouncementSchema = new Schema(
  {
    collegeId: { type: ObjectId, ref: 'College' },
    clubId: { type: ObjectId, ref: 'Club' },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    audience: { type: String, default: 'All' },
    status: { type: String, enum: ['pending', 'published', 'rejected'], default: 'published' },
    submittedByUserId: { type: ObjectId, ref: 'User' },
    submittedByName: { type: String, default: '' },
    submittedByRole: { type: String, default: '' },
    submittedAt: { type: String, default: '' },
    reviewedByUserId: { type: ObjectId, ref: 'User' },
    reviewedByName: { type: String, default: '' },
    reviewedAt: { type: String, default: '' },
    createdAtDate: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const clubChatMessageSchema = new Schema(
  {
    clubId: { type: ObjectId, ref: 'Club' },
    collegeId: { type: ObjectId, ref: 'College' },
    authorUserId: { type: ObjectId, ref: 'User' },
    author: { type: String, default: 'Member' },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

const clubBudgetSchema = new Schema(
  {
    clubId: { type: ObjectId, ref: 'Club' },
    collegeId: { type: ObjectId, ref: 'College' },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0 },
    purpose: { type: String, default: '' },
    status: { type: String, default: 'Draft' },
    requestedBy: { type: String, default: '' },
    recommendedBy: { type: String, default: '' },
    submittedByUserId: { type: ObjectId, ref: 'User' },
    submittedByName: { type: String, default: '' },
    submittedByRole: { type: String, default: '' },
    submittedAt: { type: String, default: '' },
    requestedByUserId: { type: ObjectId, ref: 'User' },
    requestedAt: { type: String, default: '' },
    recommendedByUserId: { type: ObjectId, ref: 'User' },
    recommendedAt: { type: String, default: '' },
    approvedByUserId: { type: ObjectId, ref: 'User' },
    approvedByName: { type: String, default: '' },
    approvedAt: { type: String, default: '' },
    createdAtDate: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubResultSchema = new Schema(
  {
    clubId: { type: ObjectId, ref: 'Club' },
    collegeId: { type: ObjectId, ref: 'College' },
    activityId: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: '' },
    winners: { type: String, default: '' },
    status: { type: String, default: 'Published' },
    declaredAt: { type: String, default: '' },
    declaredByUserId: { type: ObjectId, ref: 'User' },
    declaredByName: { type: String, default: '' },
    declaredByRole: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubCertificateSchema = new Schema(
  {
    clubId: { type: ObjectId, ref: 'Club' },
    collegeId: { type: ObjectId, ref: 'College' },
    activityId: { type: String, default: '' },
    studentUserId: { type: ObjectId, ref: 'User' },
    studentName: { type: String, default: 'Student' },
    title: { type: String, required: true },
    templateId: { type: String, default: 'classic' },
    status: { type: String, default: 'Issued' },
    issuedAt: { type: String, default: '' },
    fileKey: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubRedemptionSchema = new Schema(
  {
    collegeId: { type: ObjectId, ref: 'College' },
    studentUserId: { type: ObjectId, ref: 'User' },
    studentName: { type: String, default: 'Student' },
    goodieId: { type: String, default: '' },
    goodieName: { type: String, default: '' },
    points: { type: Number, default: 0 },
    recipientType: { type: String, enum: ['student', 'institute'], default: 'student' },
    status: { type: String, default: 'Pending' },
    requestedAt: { type: String, default: '' },
    processedByUserId: { type: ObjectId, ref: 'User' },
    processedByName: { type: String, default: '' },
    processedAt: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubPersonSchema = new Schema(
  {
    collegeId: { type: ObjectId, ref: 'College' },
    clubId: { type: ObjectId, ref: 'Club' },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '' },
    role: { type: String, default: 'Coordinator' },
    avatarInitials: { type: String, default: 'FC' },
    department: { type: String, default: '' },
    bio: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubWorkflowSchema = new Schema(
  {
    clubId: { type: ObjectId, ref: 'Club' },
    collegeId: { type: ObjectId, ref: 'College' },
    action: { type: String, default: 'request' },
    actorRole: { type: String, default: '' },
    actorName: { type: String, default: '' },
    note: { type: String, default: '' },
    status: { type: String, default: 'Requested' },
    createdAtDate: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubNotificationSchema = new Schema(
  {
    collegeId: { type: ObjectId, ref: 'College' },
    userId: { type: ObjectId, ref: 'User' },
    role: { type: String, default: 'student' },
    type: { type: String, enum: ['participation', 'promotional', 'system'], default: 'system' },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    read: { type: Boolean, default: false },
    createdByUserId: { type: ObjectId, ref: 'User' },
    sentByUserId: { type: ObjectId, ref: 'User' },
    sentByName: { type: String, default: '' },
    createdAtDate: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubStudentStateSchema = new Schema(
  {
    studentUserId: { type: ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, default: '' },
    department: { type: String, default: 'Campus Student' },
    year: { type: String, default: 'Active' },
    bio: { type: String, default: '' },
    points: { type: Number, default: 0 },
    badgesEarned: { type: [String], default: [] },
    savedActivityIds: { type: [String], default: [] },
    selectedInterests: { type: [String], default: [] },
    pointsLedger: {
      type: [
        {
          label: String,
          points: Number,
          at: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const DEFAULT_CLUB_TYPES = ['Creative', 'Sports & Games', 'Social & Impact', 'Tech & Makers'];

const clubCampusSettingSchema = new Schema(
  {
    collegeId: { type: ObjectId, ref: 'College', required: true, unique: true },
    positionsFeatureEnabled: { type: Boolean, default: true },
    // Campus-managed club type/category options shown in Create Club and student suggest forms.
    // Starts empty — admins add types in Settings.
    clubTypes: { type: [String], default: [] },
    permissionMatrix: { type: Schema.Types.Mixed, default: null },
    institutePoints: { type: Number, default: 0 },
    institutePointsLedger: {
      type: [
        {
          label: String,
          points: Number,
          at: String,
        },
      ],
      default: [],
    },
    rewardPointRules: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const clubStaffAssignmentSchema = new Schema(
  {
    userId: { type: ObjectId, ref: 'User', required: true },
    collegeId: { type: ObjectId, ref: 'College', required: true },
    staffRole: { type: String, enum: ['sse', 'se'], default: 'sse' },
    permissions: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const clubGoodieSchema = new Schema(
  {
    collegeId: { type: ObjectId, ref: 'College', required: true },
    name: { type: String, required: true, trim: true },
    points: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    category: { type: String, default: 'Merch' },
    audience: { type: String, enum: ['student', 'institute', 'both'], default: 'both' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const clubFaqSchema = new Schema(
  {
    collegeId: { type: ObjectId, ref: 'College', required: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const clubBadgeSchema = new Schema(
  {
    collegeId: { type: ObjectId, ref: 'College', required: true },
    code: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'crest' },
    logoUrl: { type: String, default: '' },
    audience: { type: String, enum: ['student', 'institute', 'both'], default: 'both' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const clubNotificationTemplateSchema = new Schema(
  {
    collegeId: { type: ObjectId, ref: 'College' },
    type: { type: String, enum: ['participation', 'promotional'], default: 'participation' },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    createdByUserId: { type: ObjectId, ref: 'User' },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true }
);

const clubAchievementCardSchema = new Schema(
  {
    collegeId: { type: ObjectId, ref: 'College' },
    clubId: { type: ObjectId, ref: 'Club' },
    resultId: { type: ObjectId, ref: 'ClubResult' },
    certificateId: { type: ObjectId, ref: 'ClubCertificate' },
    createdByUserId: { type: ObjectId, ref: 'User' },
    createdByName: { type: String, default: '' },
    createdByRole: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: '' },
    sharedAt: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = {
  Club: model('Club', clubSchema),
  ClubMember: model('ClubMember', clubMemberSchema),
  ClubPosition: model('ClubPosition', clubPositionSchema),
  ClubPositionRequest: model('ClubPositionRequest', clubPositionRequestSchema),
  ClubActivity: model('ClubActivity', clubActivitySchema),
  ClubSuggestion: model('ClubSuggestion', clubSuggestionSchema),
  ClubPost: model('ClubPost', clubPostSchema),
  ClubAnnouncement: model('ClubAnnouncement', clubAnnouncementSchema),
  ClubChatMessage: model('ClubChatMessage', clubChatMessageSchema),
  ClubBudget: model('ClubBudget', clubBudgetSchema),
  ClubResult: model('ClubResult', clubResultSchema),
  ClubCertificate: model('ClubCertificate', clubCertificateSchema),
  ClubRedemption: model('ClubRedemption', clubRedemptionSchema),
  ClubPerson: model('ClubPerson', clubPersonSchema),
  ClubWorkflow: model('ClubWorkflow', clubWorkflowSchema),
  ClubNotification: model('ClubNotification', clubNotificationSchema),
  ClubStudentState: model('ClubStudentState', clubStudentStateSchema),
  DEFAULT_CLUB_TYPES,
  ClubCampusSetting: model('ClubCampusSetting', clubCampusSettingSchema),
  ClubStaffAssignment: model('ClubStaffAssignment', clubStaffAssignmentSchema),
  ClubGoodie: model('ClubGoodie', clubGoodieSchema),
  ClubFaq: model('ClubFaq', clubFaqSchema),
  ClubBadge: model('ClubBadge', clubBadgeSchema),
  ClubNotificationTemplate: model('ClubNotificationTemplate', clubNotificationTemplateSchema),
  ClubAchievementCard: model('ClubAchievementCard', clubAchievementCardSchema),
};
