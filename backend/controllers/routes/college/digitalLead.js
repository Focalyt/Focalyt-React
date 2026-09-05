// server.js
let express = require("express");
let mongoose = require('mongoose');
let crypto = require('crypto');
let cors = require('cors');
let router = express.Router();

// Models
let Status = require('../../models/status');
let { StatusLogs, AppliedCourses, CandidateProfile, Courses, Center, User, ReEnquire, Source } = require('../../models');

//helpers
let { statusLogHelper } = require('../../../helpers/college');
let { isCollege } = require('../../../helpers');
let voicex = require('../../../helpers/voicex');

function isVoiceAutoCallEnabled() {
    return voicex.isAutoCallEnabled();
}

function isAiLeadStatusTesting() {
    return voicex.isLeadStatusTesting();
}

async function recordVoiceCallAttempt(appliedId, patch, logEntry) {
    const update = { $set: patch };
    if (logEntry) update.$push = { logs: logEntry };
    await AppliedCourses.updateOne({ _id: appliedId }, update);
}

async function initiateVoiceCallForLead({ applied, candidate, course, center, source, callInitTime } = {}) {
    if (!applied?._id) {
        return { skipped: true, reason: 'no_lead' };
    }

    if (!voicex.isConfigured()) {
        console.warn('[VoiceX] skip make_call: set XTRME_GEN_AUTH_TOKEN in env');
        return { skipped: true, reason: 'auth_missing' };
    }

    const customField = voicex.buildCustomField({ applied, candidate, course, center, source });
    try {
        const result = await voicex.makeCall({
            callTo: candidate?.mobile,
            customField,
            callInitTime,
        });
        await recordVoiceCallAttempt(applied._id, {
            'aiVoice.lastEvent': 'MAKE_CALL_QUEUED',
            'aiVoice.lastMakeCallAt': new Date(),
            'aiVoice.lastMakeCallStatus': 'queued',
            'aiVoice.lastMakeCallError': '',
        }, {
            action: 'AI counselor call initiated',
            remarks: voicex.toE164(candidate?.mobile),
            timestamp: new Date(),
        });
        return { ok: true, data: result.data };
    } catch (err) {
        const message = voicex.axiosErrorMessage(err);
        console.error('[VoiceX] make_call failed', { leadId: String(applied._id), message });
        await recordVoiceCallAttempt(applied._id, {
            'aiVoice.lastEvent': 'MAKE_CALL_FAILED',
            'aiVoice.lastMakeCallAt': new Date(),
            'aiVoice.lastMakeCallStatus': 'failed',
            'aiVoice.lastMakeCallError': message,
        }, {
            action: 'AI counselor call failed',
            remarks: message,
            timestamp: new Date(),
        });
        err.voicexMessage = message;
        throw err;
    }
}

function queueVoiceCallForLead(opts) {
    if (!isVoiceAutoCallEnabled()) {
        console.log('[VoiceX] auto call disabled (XTRME_GEN_AUTO_CALL=false)');
        return;
    }
    setImmediate(() => {
        initiateVoiceCallForLead(opts).catch((err) => {
            console.error('[VoiceX] queued make_call error', err.voicexMessage || err.message);
        });
    });
}

async function cancelVoiceCallForLead({ applied, phoneNumber } = {}) {
    const phone = phoneNumber || applied?.candidate?.mobile || applied?._candidate?.mobile || '';
    const result = await voicex.cancelCall({ phoneNumber: voicex.toE164(phone) || phone });
    if (applied?._id) {
        await recordVoiceCallAttempt(applied._id, {
            'aiVoice.lastEvent': 'MAKE_CALL_CANCELLED',
            'aiVoice.lastCancelAt': new Date(),
        }, {
            action: 'AI counselor scheduled call cancelled',
            remarks: voicex.toE164(phone) || String(phone),
            timestamp: new Date(),
        });
    }
    return result;
}

async function loadLeadForVoiceCall(appliedCourseId) {
    const applied = await AppliedCourses.findById(appliedCourseId)
        .populate('_candidate')
        .populate('_course')
        .populate('_center');
    if (!applied) return null;
    return {
        applied,
        candidate: applied._candidate,
        course: applied._course,
        center: applied._center,
        source: applied._candidate?.source || 'Digital Lead',
    };
}

const UNTOUCH_STATUS_ID = new mongoose.Types.ObjectId('64ab1234abcd5678ef901234');
const DUPLICATE_SUBSTATUS_ID = new mongoose.Types.ObjectId('6a48e6b7d668a7671542801a');
const NOT_CONNECTED_SUBSTATUS_ID = new mongoose.Types.ObjectId('6a3f5a53cfccaeeb28a4d1a3');

const B2C_REGISTRATION_MATCH = {
    kycStage: { $ne: true },
    kyc: { $ne: true },
    admissionDone: { $ne: true },
};

const LEAD_LIST_PROJECT = {
    _id: 0,
    lead_id: { $toString: '$_id' },
    name: { $ifNull: ['$candidate.name', ''] },
    mobile: { $ifNull: ['$candidate.mobile', ''] },
    email: { $ifNull: ['$candidate.email', ''] },
    centre: { $ifNull: ['$center.name', ''] },
    course_name: { $ifNull: ['$course.name', ''] },
};

function leadListLookups() {
    return [
        {
            $lookup: {
                from: CandidateProfile.collection.name,
                localField: '_candidate',
                foreignField: '_id',
                as: 'candidate',
            },
        },
        { $unwind: { path: '$candidate', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: Center.collection.name,
                localField: '_center',
                foreignField: '_id',
                as: 'center',
            },
        },
        { $unwind: { path: '$center', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: Courses.collection.name,
                localField: '_course',
                foreignField: '_id',
                as: 'course',
            },
        },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
        { $project: LEAD_LIST_PROJECT },
    ];
}

async function resolveUntouchNotConnectedIds() {
    const statuses = await Status.find({ title: { $regex: /^untouch$/i } }).select('_id substatuses').lean();
    const statusIds = [];
    const subStatusIds = [];
    for (const status of statuses) {
        statusIds.push(status._id);
        for (const sub of status.substatuses || []) {
            if (/^not\s*connected$/i.test(String(sub.title || '').trim())) {
                subStatusIds.push(sub._id);
            }
        }
    }
    if (!statusIds.length) statusIds.push(UNTOUCH_STATUS_ID);
    if (!subStatusIds.length) subStatusIds.push(NOT_CONNECTED_SUBSTATUS_ID);
    return { statusIds, subStatusIds };
}

async function fetchB2cTodayLeads() {
    const { start, end } = getTodayIstBounds();
    return AppliedCourses.aggregate([
        {
            $match: {
                ...B2C_REGISTRATION_MATCH,
                createdAt: { $gte: start, $lte: end },
            },
        },
        ...leadListLookups(),
    ]);
}

async function fetchUntouchNotConnectedLeads() {
    const { statusIds, subStatusIds } = await resolveUntouchNotConnectedIds();
    return AppliedCourses.aggregate([
        {
            $match: {
                ...B2C_REGISTRATION_MATCH,
                _leadStatus: { $in: statusIds },
                _leadSubStatus: { $in: subStatusIds },
            },
        },
        ...leadListLookups(),
    ]);
}

async function dispatchVoiceCallsForLeads(leads) {
    const rows = (leads || []).filter((row) => row?.lead_id && row?.mobile);
    rows.forEach((row, index) => {
        setTimeout(() => {
            loadLeadForVoiceCall(row.lead_id)
                .then((lead) => {
                    if (!lead) return null;
                    return initiateVoiceCallForLead(lead);
                })
                .catch((err) => {
                    console.error('[VoiceX] dispatch make_call error', {
                        leadId: row.lead_id,
                        message: err.voicexMessage || err.message,
                    });
                });
        }, index * 400);
    });
    return {
        queued: rows.length,
        skippedNoMobile: (leads || []).length - rows.length,
    };
}

const markLeadDuplicateOnReapply = async (alreadyApplied, source) => {
    alreadyApplied._leadStatus = UNTOUCH_STATUS_ID;
    alreadyApplied._leadSubStatus = DUPLICATE_SUBSTATUS_ID;
    if (!Array.isArray(alreadyApplied.logs)) alreadyApplied.logs = [];
    alreadyApplied.logs.push({
        action: 'Lead marked Duplicate on reapply (same mobile + same course)',
        remarks: source || 'Digital Lead',
        timestamp: new Date(),
    });
    await alreadyApplied.save();
    return alreadyApplied;
};

// ===================================
// BATCH PROCESSOR CLASS - Queue Logic
// ===================================
class BatchProcessor {
    constructor() {
        this.queue = [];
        this.batchSize = 10;
        this.processing = false;
        this.timer = null;
        this.stats = {
            totalReceived: 0,
            totalProcessed: 0,
            totalFailed: 0,
            alreadyExists: 0,
            batches: 0
        };
    }

    // Lead add karne ka function
    async addToQueue(leadData) {
        this.queue.push(leadData);
        this.stats.totalReceived++;

        console.log(`📥 Lead added to queue. Total in queue: ${this.queue.length}`);

        if (this.timer) {
            clearTimeout(this.timer);
        }

        if (this.queue.length >= this.batchSize) {
            console.log(`📦 Batch size reached (${this.batchSize}), processing...`);
            this.processBatch();
        } else {
            this.timer = setTimeout(() => {
                if (this.queue.length > 0) {
                    console.log(`⏰ Timer expired, processing ${this.queue.length} leads...`);
                    this.processBatch();
                }
            }, 5000);
        }

        return {
            success: true,
            queueLength: this.queue.length
        };
    }

    // Batch process karne ka function
    async processBatch() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        const batch = this.queue.splice(0, this.batchSize);
        this.stats.batches++;

        console.log(`\n🔄 PROCESSING BATCH #${this.stats.batches}`);
        console.log(`📊 Batch size: ${batch.length} leads`);

        const startTime = Date.now();
        const results = {
            created: [],
            updated: [],
            alreadyExists: [],
            failed: []
        };

        try {
            // Process in chunks of 10 for better performance
            for (let i = 0; i < batch.length; i += 10) {
                const chunk = batch.slice(i, i + 10);

                await Promise.all(chunk.map(async (leadData) => {
                    try {
                        const result = await this.processSingleLead(leadData);

                        switch (result.status) {
                            case 'created':
                                results.created.push(result);
                                this.stats.totalProcessed++;
                                break;
                            case 'updated':
                                results.updated.push(result);
                                this.stats.totalProcessed++;
                                break;
                            case 'already_exists':
                                results.alreadyExists.push(result);
                                this.stats.alreadyExists++;
                                break;
                            case 'failed':
                                results.failed.push(result);
                                this.stats.totalFailed++;
                                break;
                        }
                    } catch (error) {
                        results.failed.push({
                            status: 'failed',
                            mobile: leadData.MobileNumber,
                            error: error.message
                        });
                        this.stats.totalFailed++;
                    }
                }));

                console.log(`   ↳ Processed ${Math.min(i + 10, batch.length)}/${batch.length} leads...`);
            }

            const timeTaken = Date.now() - startTime;
            console.log(`✅ Batch #${this.stats.batches} completed in ${timeTaken}ms`);
            console.log(`📈 Results - Created: ${results.created.length}, Updated: ${results.updated.length}, Already Exists: ${results.alreadyExists.length}, Failed: ${results.failed.length}`);

        } catch (error) {
            console.error(`❌ Batch processing error: ${error.message}`);
        } finally {
            this.processing = false;

            if (this.queue.length > 0) {
                console.log(`🔄 More leads in queue (${this.queue.length}), continuing...`);
                setTimeout(() => this.processBatch(), 1000);
            }
        }
    }

    // AAPKA EXISTING LOGIC - processSingleLead function me
    async processSingleLead(req_body) {
        try {
            console.log('[DigitalLead] processSingleLead →', {
                name: req_body.FirstName,
                mobile: req_body.MobileNumber,
                courseId: req_body.courseId,
                center: req_body.Field4,
                source: req_body.source || 'FB Form'
            });

            let { FirstName, MobileNumber, Gender, DateOfBirth, Email, courseId, Field4, source } = req_body;
            if (!source) {
                source = 'FB Form';
            }

            if (!FirstName || !MobileNumber || !Gender || !Email || !courseId || !Field4) {
                throw new Error("All fields are required");
            }

            if (MobileNumber) {
                MobileNumber = MobileNumber.toString();

                console.log('MobileNumber:', MobileNumber, 'Type:', typeof MobileNumber);

                if (MobileNumber.startsWith('+91')) {
                    MobileNumber = MobileNumber.slice(3);
                } else if (MobileNumber.startsWith('91') && MobileNumber.length === 12) {
                    MobileNumber = MobileNumber.slice(2);
                }

                if (!/^[0-9]{10}$/.test(MobileNumber)) {
                    throw new Error('Invalid mobile number format');
                }
                MobileNumber = parseInt(MobileNumber);
            } else {
                throw new Error('Mobile number is required');
            }

            let mobile = MobileNumber;
            let name = FirstName;
            let sex = Gender;
            let dob = DateOfBirth;
            let email = Email;

            if (typeof courseId === 'string') {
                courseId = new mongoose.Types.ObjectId(courseId);
            }

            let course = await Courses.findById(courseId);
            if (!course) {
                throw new Error("Course not found");
            }

            let centerName = Field4?.trim();
            let selectedCenterName = await Center.findOne({ name: centerName, college: course.college });
            if (!selectedCenterName) {
                throw new Error("Center not found");
            }

            let selectedCenter = selectedCenterName._id;

            if (mongoose.Types.ObjectId.isValid(courseId)) courseId = new mongoose.Types.ObjectId(courseId);
            if (mongoose.Types.ObjectId.isValid(selectedCenter)) selectedCenter = new mongoose.Types.ObjectId(selectedCenter);

            if (dob) dob = new Date(dob);

            let existingCandidate = await CandidateProfile.findOne({ mobile });
            if (existingCandidate) {
                let alreadyApplied = await AppliedCourses.findOne({ _candidate: existingCandidate._id, _course: courseId });
                if (alreadyApplied) {
                    const reEnquire = await ReEnquire.create({
                        candidate: existingCandidate._id,
                        appliedCourse: alreadyApplied._id,
                        course: courseId,
                        reEnquireDate: new Date(),
                        counselorName: alreadyApplied.counsellor,
                        source: source || 'Digital Lead',
                    });
                    await markLeadDuplicateOnReapply(alreadyApplied, source);
                    return {
                        status: "already_exists",
                        msg: "Candidate already exists and course already applied",
                        data: { existingCandidate, alreadyApplied, reEnquire },
                        mobile: mobile
                    };
                }
                if (existingCandidate && !alreadyApplied) {
                    console.log('[DigitalLead] creating AppliedCourses (no counselor set → AssignmentRule will run) →', {
                        mobile, courseId: courseId?.toString(), centerId: selectedCenter?.toString()
                    });
                    let appliedCourseEntry = await AppliedCourses.create({
                        _candidate: existingCandidate._id,
                        _course: courseId,
                        _center: selectedCenter
                    });

                    console.log('[DigitalLead] AppliedCourses created ←', {
                        appliedCourseId: appliedCourseEntry._id?.toString(),
                        mobile,
                        counsellor: appliedCourseEntry.counsellor?.toString(),
                        counsellorName: appliedCourseEntry.leadAssignment?.[appliedCourseEntry.leadAssignment.length - 1]?.counsellorName
                    });
                    console.log(`   ✅ Updated existing candidate: ${name} (${mobile})`);

                    queueVoiceCallForLead({
                        applied: appliedCourseEntry,
                        candidate: existingCandidate,
                        course,
                        center: selectedCenterName,
                        source,
                    });

                    return {
                        status: "updated",
                        msg: "Candidate already exists and course applied successfully",
                        data: { existingCandidate, appliedCourseEntry },
                        mobile: mobile
                    };
                }
            }
            else {
                // Build CandidateProfile Data
                let candidateData = {
                    name,
                    mobile,
                    email,
                    sex,
                    dob,
                    appliedCourses: [
                        {
                            courseId: courseId,
                            centerId: selectedCenter
                        }
                    ],
                    verified: false,
                    source
                };


                // Create CandidateProfile
                let candidate = await CandidateProfile.create(candidateData);
                let user = await User.create({
                    name: candidate.name,
                    email: candidate.email,
                    mobile: candidate.mobile,
                    role: 3,
                    status: true,
                    source
                });

                console.log('selectedCenter', typeof selectedCenter)

                console.log('[DigitalLead] creating AppliedCourses (no counselor set → AssignmentRule will run) →', {
                    mobile, courseId: courseId?.toString(), centerId: selectedCenter?.toString()
                });
                // Insert AppliedCourses Record
                let appliedCourseEntry = await AppliedCourses.create({
                    _candidate: candidate._id,
                    _course: courseId,
                    _center: selectedCenter
                });

                console.log('[DigitalLead] AppliedCourses created ←', {
                    appliedCourseId: appliedCourseEntry._id?.toString(),
                    mobile,
                    counsellor: appliedCourseEntry.counsellor?.toString(),
                    counsellorName: appliedCourseEntry.leadAssignment?.[appliedCourseEntry.leadAssignment.length - 1]?.counsellorName
                });

                queueVoiceCallForLead({
                    applied: appliedCourseEntry,
                    candidate,
                    course,
                    center: selectedCenterName,
                    source,
                });

                return {
                    status: "created",
                    msg: "Candidate added and course applied successfully",
                    data: { candidate, appliedCourseEntry },
                    mobile: mobile
                };
            }

        } catch (err) {
            console.error(`   ❌ Error processing lead: ${err.message}`);
            return {
                status: 'failed',
                mobile: req_body.MobileNumber,
                error: err.message
            };
        }
    }

    getStatus() {
        return {
            queueLength: this.queue.length,
            isProcessing: this.processing,
            stats: this.stats
        };
    }
}

// Create batch processor instance
const batchProcessor = new BatchProcessor();

// ===================================
// ROUTES
// ===================================

// MAIN ROUTE - Modified to use batch processor
// router.route("/addleaddandcourseapply")
// .post(async (req, res) => {
//     try {
//         console.log("Lead received:", req.body.FirstName);

//         // Basic validation only
//         let { FirstName, MobileNumber, Gender, DateOfBirth, Email, courseId, Field4 } = req.body;

//         if (!FirstName || !MobileNumber || !Gender || !Email || !courseId || !Field4) {
//             return res.status(200).json({
//                 status: false,
//                 msg: "All fields are required"
//             });
//         }
//         if (MobileNumber) {
//             MobileNumber = MobileNumber.toString();

//             console.log('MobileNumber:', MobileNumber, 'Type:', typeof MobileNumber);

//             if (MobileNumber.startsWith('+91')) {
//                 MobileNumber = MobileNumber.slice(3);
//             } else if (MobileNumber.startsWith('91') && MobileNumber.length === 12) {
//                 MobileNumber = MobileNumber.slice(2);
//             }

//             if (!/^[0-9]{10}$/.test(MobileNumber)) {
//                 return res.status(200).json({
//                     status: false,
//                     msg: "Invalid mobile number format"
//                 });
//             }
//             MobileNumber = parseInt(MobileNumber);
//         } else {
//             return res.status(200).json({
//                 status: false,
//                 msg: "Mobile number is required"
//             });
//         }

//         // Add to batch processor queue
//         const result = await batchProcessor.addToQueue(req.body);

//         // Immediate response - NO DATABASE OPERATIONS HERE!
//         return res.json({
//             status: true,
//             msg: "Lead added to processing queue",
//             queueLength: result.queueLength,
//             message: "Your lead will be processed within 5-10 seconds"
//         });

//     } catch (err) {
//         console.error("Error adding to queue:", err);
//         // req.flash ko remove kar diya kyunki immediate response me ye nahi chahiye
//         return res.status(500).json({
//             status: false,
//             msg: err.message || "Failed to add lead to queue"
//         });
//     }
// });

// Queue status check endpoint

router.route("/addleaddandcourseapply")
    .post(async (req, res) => {
        try {
            console.log('[DigitalLead] POST /addleaddandcourseapply →', {
                name: req.body.FirstName,
                mobile: req.body.MobileNumber,
                courseId: req.body.courseId,
                center: req.body.Field4,
                source: req.body.source || 'Digital Lead'
            });

            // Basic validation only
            let { FirstName, MobileNumber, Gender, DateOfBirth, Email, courseId, Field4, source, Remarks, status,subStatus } = req.body;


            if (!FirstName || !MobileNumber || !Gender || !Email || !courseId || !Field4 || !status || !subStatus) {
                return res.status(200).json({
                    status: false,
                    msg: "All fields are required"
                });
            }
            if (!source) {
                source = 'Digital Lead';
            }
            if (MobileNumber) {
                MobileNumber = MobileNumber.toString();


                if (MobileNumber.startsWith('+91')) {
                    MobileNumber = MobileNumber.slice(3);
                } else if (MobileNumber.startsWith('91') && MobileNumber.length === 12) {
                    MobileNumber = MobileNumber.slice(2);
                }

                if (!/^[0-9]{10}$/.test(MobileNumber)) {
                    return res.status(200).json({
                        status: false,
                        msg: "Invalid mobile number format"
                    });
                }
                MobileNumber = parseInt(MobileNumber);


            } else {
                return res.status(200).json({
                    status: false,
                    msg: "Mobile number is required"
                });
            }

            let mobile = MobileNumber;
            let name = FirstName;
            let sex = Gender;
            let dob = DateOfBirth;
            let email = Email;
            let registeredBy = new mongoose.Types.ObjectId('68c16764eeda1e3f36a329d9');

            if (typeof courseId === 'string') {
                courseId = new mongoose.Types.ObjectId(courseId);
            }

            let course = await Courses.findById(courseId);
            if (!course) {
                throw new Error("Course not found");
            }

            let centerName = Field4?.trim();
            let selectedCenterName = await Center.findOne({ name: centerName, college: course.college });
            if (!selectedCenterName) {
                throw new Error("Center not found");
            }

            let selectedCenter = selectedCenterName._id;

            if (mongoose.Types.ObjectId.isValid(courseId)) courseId = new mongoose.Types.ObjectId(courseId);
            if (mongoose.Types.ObjectId.isValid(selectedCenter)) selectedCenter = new mongoose.Types.ObjectId(selectedCenter);

            if (dob) dob = new Date(dob);

            let appliedData
            let candidate

            

            let statusId = await Status.findOne({ title: status });
            let subStatusId;

            if (statusId) {
                subStatusId = statusId.substatuses.find(sub => sub.title === subStatus);
                if (!subStatusId) {
                    console.log('Substatus not found.');
                    return res.status(200).json({
                      status: false,
                      msg: "Substatus not found"                
                    });
                }
              } else {
                
                console.log('Status not found.');
                return res.status(200).json({
                    status: false,
                    msg: "Status not found"
                });
              }
        

            let existingCandidate = await CandidateProfile.findOne({ mobile });
            if (existingCandidate) {
                console.log('existingCandidate:', existingCandidate);
                let alreadyApplied = await AppliedCourses.findOne({ _candidate: existingCandidate._id, _course: courseId });
                console.log('alreadyApplied:', alreadyApplied);
                if (alreadyApplied) {
                    const reEnquire = await ReEnquire.create({
                        candidate: existingCandidate._id,
                        appliedCourse: alreadyApplied._id,
                        course: courseId,
                        reEnquireDate: new Date(),
                        counselorName:  alreadyApplied.counsellor,
                        source: source || 'Digital Lead',
                    });
                    await markLeadDuplicateOnReapply(alreadyApplied, source);
                    return res.json({
                        status: false,
                        msg: "Candidate already exists and course already applied",
                        data: { existingCandidate, alreadyApplied, reEnquire },
                        mobile: mobile
                    });
                }
                if (existingCandidate && !alreadyApplied) {
                    console.log('[DigitalLead] creating AppliedCourses (no counselor set → AssignmentRule will run) →', {
                        mobile, courseId: courseId?.toString(), centerId: selectedCenter?.toString()
                    });
                    let appliedCourseEntry = await AppliedCourses.create({
                        _candidate: existingCandidate._id,
                        _course: courseId,
                        _center: selectedCenter,
                        _leadStatus: statusId._id,
                        _leadSubStatus: subStatusId._id
                    });

                    console.log('[DigitalLead] AppliedCourses created ←', {
                        appliedCourseId: appliedCourseEntry._id?.toString(),
                        mobile,
                        counsellor: appliedCourseEntry.counsellor?.toString(),
                        counsellorName: appliedCourseEntry.leadAssignment?.[appliedCourseEntry.leadAssignment.length - 1]?.counsellorName
                    });
                    console.log(`   ✅ Updated existing candidate: ${name} (${mobile})`);

                    queueVoiceCallForLead({
                        applied: appliedCourseEntry,
                        candidate: existingCandidate,
                        course,
                        center: selectedCenterName,
                        source,
                    });

                    return res.json( {
                        status: "updated",
                        msg: "Candidate already exists and course applied successfully",
                        data: { existingCandidate, appliedCourseEntry },
                        mobile: mobile
                    });
                }
            }
            else {
                // Build CandidateProfile Data
                let candidateData = {
                    name,
                    mobile,
                    email,
                    sex,
                    dob,
                    appliedCourses: [
                        {
                            courseId: courseId,
                            centerId: selectedCenter
                        }
                    ],
                    verified: false,
                    source
                };


                // Create CandidateProfile
                candidate = await CandidateProfile.create(candidateData);
                let user = await User.create({
                    name: candidate.name,
                    email: candidate.email,
                    mobile: candidate.mobile,
                    role: 3,
                    status: true,
                    source
                });


                console.log('[DigitalLead] creating AppliedCourses (no counselor set → AssignmentRule will run) →', {
                    mobile, courseId: courseId?.toString(), centerId: selectedCenter?.toString()
                });
                // Insert AppliedCourses Record
                let appliedCourseEntry = await AppliedCourses.create({
                    _candidate: candidate._id,
                    _course: courseId,
                    _center: selectedCenter,
                    registeredBy: registeredBy,
                    remarks:Remarks || "",
                    _leadStatus: statusId._id,
                    _leadSubStatus: subStatusId._id

                });

                console.log('[DigitalLead] AppliedCourses created ←', {
                    appliedCourseId: appliedCourseEntry._id?.toString(),
                    mobile,
                    counsellor: appliedCourseEntry.counsellor?.toString(),
                    counsellorName: appliedCourseEntry.leadAssignment?.[appliedCourseEntry.leadAssignment.length - 1]?.counsellorName
                });

                appliedData = appliedCourseEntry;
            }


            const newLogEntry = {
                action: `Lead added with ${status.title} and ${subStatus.title} from digital lead`, // Combine all actions in one log message
                remarks: Remarks || '', // Optional remarks in the log
                timestamp: new Date() // Add timestamp if your schema supports it
            };

            appliedData.logs.push(newLogEntry);
            await appliedData.save();

            queueVoiceCallForLead({
                applied: appliedData,
                candidate,
                course,
                center: selectedCenterName,
                source,
            });

            // Immediate response - NO DATABASE OPERATIONS HERE!
           
           
            return res.json({
                status: true,
                msg: "Lead added successfully"
            });

        } catch (err) {
            console.error("Error adding lead:", err);
            // req.flash ko remove kar diya kyunki immediate response me ye nahi chahiye
            return res.status(500).json({
                status: false,
                msg: err.message || "Failed to add lead"
            });
        }
    });

router.get("/queue/status", (req, res) => {
    const status = batchProcessor.getStatus();
    res.json({
        status: true,
        queue: status
    });
});

// Detailed status with database counts
router.get("/queue/detailed-status", async (req, res) => {
    try {
        const status = batchProcessor.getStatus();

        // Get database counts for verification
        const dbStats = {
            totalCandidates: await CandidateProfile.countDocuments(),
            totalUsers: await User.countDocuments(),
            totalApplications: await AppliedCourses.countDocuments()
        };

        res.json({
            status: true,
            queue: status,
            database: dbStats,
            summary: {
                pendingInQueue: status.queueLength,
                currentlyProcessing: status.isProcessing,
                totalReceived: status.stats.totalReceived,
                successfullyProcessed: status.stats.totalProcessed,
                alreadyExisted: status.stats.alreadyExists,
                failed: status.stats.totalFailed,
                batchesProcessed: status.stats.batches
            }
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            msg: "Failed to get detailed status"
        });
    }
});

// Manual batch trigger (for testing)
router.post("/batch/process-now", (req, res) => {
    if (batchProcessor.queue.length > 0) {
        batchProcessor.processBatch();
        res.json({
            status: true,
            msg: "Batch processing triggered manually",
            queueLength: batchProcessor.queue.length
        });
    } else {
        res.json({
            status: false,
            msg: "No leads in queue to process"
        });
    }
});

// Source Leads API
router.get("/sourceLeadsData", async (req, res) => {
    try {
        const { startDate, endDate } = req.query

        const convertStartDate = new Date(startDate).setHours(0, 0, 0, 0);
        // console.log("convertStartDate", new Date(convertStartDate))
        const convertEndDate = new Date(endDate).setHours(23, 59, 59, 999);
        // console.log("convertEndDate", new Date(convertEndDate))
        const filter = {
            createdAt: {
                $gte: new Date(convertStartDate),
                $lte: new Date(convertEndDate)
            }
        }
        const aggregationPipeline = [
            {
                $match: filter  // Apply the date filter
            },
            {
                $group: {
                    _id: "$registeredBy",  // Group by registeredBy (registeredBy is the field to group by)
                    leadCount: { $sum: 1 }  // Count the number of leads for each registeredBy
                }
            },
            {
                $lookup: {
                    from: "users",  // Populating the user data for registeredBy
                    localField: "_id",
                    foreignField: "_id",
                    as: "registeredByDetails"
                }
            },
            {
                $lookup: {
                    from: "sources",  // Populating the sources data for registeredBy
                    localField: "_id",
                    foreignField: "_id",
                    as: "registeredBySource"
                }
            },
            {
                $addFields: {
                    registeredBy: {
                        $ifNull: [{ $arrayElemAt: ["$registeredByDetails", 0] }, { $arrayElemAt: ["$registeredBySource", 0] }]
                    }
                }
            },
            {
                $project: {
                    registeredBy: 1,
                    leadCount: 1,
                }
            }

        ];

        const sourceData = await AppliedCourses.aggregate(aggregationPipeline);


        res.status(200).json({
            status: true,
            data: sourceData
        });
    }
    catch (err) {
        res.status(500).json({
            status: false,
            msg: "Failed to get source leads",
            error: err.message
        });

    }
})

const DIGITAL_LEAD_REGISTERED_BY = new mongoose.Types.ObjectId('68c16764eeda1e3f36a329d9');

function getTodayIstBounds() {
    const istDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
    return {
        start: new Date(`${istDate}T00:00:00.000+05:30`),
        end: new Date(`${istDate}T23:59:59.999+05:30`),
    };
}

// Today's Digital Lead B2C leads only: lead_id, name, mobile, email, centre
router.get("/today", async (req, res) => {
    try {
        const { start, end } = getTodayIstBounds();
        const sourceIds = [DIGITAL_LEAD_REGISTERED_BY];
        const sourceDoc = await Source.findOne({ name: { $regex: /^digital\s*lead$/i } }).select('_id').lean();
        if (sourceDoc && !sourceIds.some((id) => id.equals(sourceDoc._id))) {
            sourceIds.push(sourceDoc._id);
        }

        const leads = await AppliedCourses.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                },
            },
            {
                $lookup: {
                    from: CandidateProfile.collection.name,
                    localField: '_candidate',
                    foreignField: '_id',
                    as: 'candidate',
                },
            },
            { $unwind: { path: '$candidate', preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    $or: [
                        { registeredBy: { $in: sourceIds } },
                        { 'candidate.source': { $regex: /^digital\s*lead$/i } },
                    ],
                },
            },
            {
                $lookup: {
                    from: Center.collection.name,
                    localField: '_center',
                    foreignField: '_id',
                    as: 'center',
                },
            },
            { $unwind: { path: '$center', preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    _id: 0,
                    lead_id: { $toString: '$_id' },
                    name: { $ifNull: ['$candidate.name', ''] },
                    mobile: { $ifNull: ['$candidate.mobile', ''] },
                    email: { $ifNull: ['$candidate.email', ''] },
                    centre: { $ifNull: ['$center.name', ''] },
                },
            },
        ]);

        return res.json({
            status: true,
            count: leads.length,
            data: leads,
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            msg: "Failed to get today's digital leads",
            error: err.message,
        });
    }
});

// All B2C registration leads created today (IST).
router.get("/b2c-today", async (req, res) => {
    try {
        const leads = await fetchB2cTodayLeads();

        return res.json({
            status: true,
            count: leads.length,
            data: leads,
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            msg: "Failed to get today's B2C leads",
            error: err.message,
        });
    }
});

// B2C leads currently in Untouch + Not Connected.
router.get("/untouch-not-connected", async (req, res) => {
    try {
        const leads = await fetchUntouchNotConnectedLeads();

        return res.json({
            status: true,
            count: leads.length,
            data: leads,
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            msg: "Failed to get Untouch / Not Connected leads",
            error: err.message,
        });
    }
});

// VoiceX webhook: third-party AI pulls GET /today, then POSTs call results here.
// Docs: https://xtremegenai.com/docs — give them this URL + preferred auth.
const VOICEX_STATUS_MAP = [
    { titles: ['HOT'], match: /^(hot|interested|callback\s*now|very interested)$/i },
    { titles: ['WARM'], match: /^(warm|follow[-\s]?up|call later|callback|interested later)$/i },
    { titles: ['COLD'], match: /^(cold|not interested|no interest|rejected)$/i },
    { titles: ['WON'], match: /^(won|enrolled|paid|admitted|converted)$/i },
    { titles: ['JUNK'], match: /^(junk|wrong number|spam|invalid|dontcall|do not call)$/i },
    { titles: ['DUPLICATE'], match: /^(duplicate)$/i },
    { titles: ['PROSPECT'], match: /^(prospect)$/i },
];

function verifyVoicexWebhook(req) {
    const secret = process.env.VOICEX_WEBHOOK_SECRET;
    if (!secret) return true;

    const auth = String(req.headers.authorization || '');
    const headerKey = req.headers['x-api-key'] || req.headers['x-webhook-secret'] || req.query.apiKey;
    if (auth === `Bearer ${secret}`) return true;
    if (auth.toLowerCase().startsWith('basic ') && auth.slice(6) === secret) return true;
    if (headerKey && String(headerKey) === secret) return true;

    const sig = req.headers['x-hub-signature'] || req.headers['x-signature'] || req.headers['x-voicex-signature'];
    if (sig) {
        const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
        const hmac = crypto.createHmac('sha256', secret).update(raw).digest('hex');
        if (sig === hmac || sig === `sha256=${hmac}`) return true;
    }
    return false;
}

function extractVoicexLeadId(payload) {
    return (
        payload?.scheduleInfo?.customParam?.lead_id ||
        payload?.customer_crm_data?.lead_id ||
        payload?.custom_field?.lead_id ||
        payload?.customParam?.lead_id ||
        payload?.lead_id ||
        null
    );
}

function extractVoicexPhone(payload) {
    const raw = payload?.callTo || payload?.phoneNumber || payload?.scheduleInfo?.customParam?.contact_number || '';
    const digits = String(raw).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : '';
}

function mapDispositionToStatusTitle(disposition, callStatus) {
    const text = String(disposition || '').trim();
    if (text) {
        const hit = VOICEX_STATUS_MAP.find((row) => row.match.test(text));
        if (hit) return hit.titles[0];
    }
    if (String(callStatus || '').toUpperCase() === 'DONTCALL') return 'JUNK';
    return null;
}

async function findAppliedCourseFromWebhook(payload) {
    const leadId = extractVoicexLeadId(payload);
    if (leadId && mongoose.Types.ObjectId.isValid(String(leadId))) {
        const byId = await AppliedCourses.findById(leadId);
        if (byId) return byId;
    }

    const mobile = extractVoicexPhone(payload);
    if (!mobile) return null;
    const candidate = await CandidateProfile.findOne({
        $or: [{ mobile: Number(mobile) }, { mobile: mobile }],
    }).select('_id');
    if (!candidate) return null;
    return AppliedCourses.findOne({ _candidate: candidate._id }).sort({ createdAt: -1 });
}

async function resolveStatusForCourse(appliedCourse, statusTitle) {
    const course = await Courses.findById(appliedCourse._course).select('college').lean();
    const collegeId = course?.college;
    const titleFilter = { title: { $regex: new RegExp(`^${statusTitle}$`, 'i') } };
    if (collegeId) {
        const scoped = await Status.findOne({ ...titleFilter, college: collegeId }).lean();
        if (scoped) return scoped;
    }
    return Status.findOne(titleFilter).lean();
}

router.post("/voicex-webhook", async (req, res) => {
    try {
        if (!verifyVoicexWebhook(req)) {
            return res.status(401).json({ status: false, msg: "Unauthorized webhook" });
        }

        const payload = req.body || {};
        const event = String(payload.event || '').trim();
        const callHistoryId = payload.callHistory?.id || '';
        const timestamp = payload.timestamp || '';
        const idempotencyKey = [event, payload.businessId || '', callHistoryId, timestamp].join('|');

        res.status(200).json({ status: true, received: true, event: event || 'unknown' });

        setImmediate(async () => {
            try {
                if (!event) {
                    console.warn('[VoiceX webhook] missing event', payload);
                    return;
                }

                const doc = await findAppliedCourseFromWebhook(payload);
                if (!doc) {
                    console.warn('[VoiceX webhook] lead not found', {
                        event,
                        lead_id: extractVoicexLeadId(payload),
                        callTo: payload.callTo,
                    });
                    return;
                }

                if (doc.aiVoice?.lastIdempotencyKey && doc.aiVoice.lastIdempotencyKey === idempotencyKey) {
                    return;
                }

                const crm = payload.customer_crm_data || {};
                const disposition = crm.disposition || payload.disposition || '';
                const summary = crm.summary || payload.summary || '';
                const recordingUrl = payload.recording_url || crm.recording_url || '';
                const callStatus = payload.callStatus || payload.callHistory?.callStatus || '';
                const failureReason = payload.failureReason || payload.errorMessage || '';

                if (!doc.aiVoice) doc.aiVoice = {};
                doc.aiVoice.lastEvent = event;
                doc.aiVoice.lastDisposition = disposition;
                doc.aiVoice.lastSummary = summary;
                doc.aiVoice.lastCallStatus = callStatus;
                doc.aiVoice.lastFailureReason = failureReason;
                doc.aiVoice.lastCallHistoryId = String(callHistoryId);
                doc.aiVoice.lastIdempotencyKey = idempotencyKey;
                doc.aiVoice.lastWebhookAt = new Date();
                doc.aiVoice.recordingUrl = recordingUrl;

                const statusEvents = ['CALL_COMPLETED', 'CALL_TRANSFERED'];
                const shouldMapStatus = statusEvents.includes(event)
                    || (event === 'CALL_FAILED' && String(callStatus).toUpperCase() === 'DONTCALL');

                let action = `AI counselor ${event}`;
                if (disposition) action += ` disposition "${disposition}"`;
                if (failureReason) action += ` (${failureReason})`;

                let mappedTitle = null;
                if (shouldMapStatus) {
                    mappedTitle = mapDispositionToStatusTitle(disposition, callStatus);
                    if (mappedTitle) {
                        const newStatus = await resolveStatusForCourse(doc, mappedTitle);
                        if (newStatus) {
                            const testingDummyStatus = isAiLeadStatusTesting();
                            const statusField = testingDummyStatus ? '_aiLeadStatus' : '_leadStatus';
                            const subStatusField = testingDummyStatus ? '_aiLeadSubStatus' : '_leadSubStatus';
                            const oldStatus = doc[statusField]
                                ? await Status.findById(doc[statusField]).lean()
                                : null;
                            const oldTitle = oldStatus?.title || 'Unknown';
                            if (String(doc[statusField] || '') !== String(newStatus._id)) {
                                action = testingDummyStatus
                                    ? `AI counselor (test) changed dummy status from "${oldTitle}" to "${newStatus.title}"`
                                    : `AI counselor changed status from "${oldTitle}" to "${newStatus.title}"`;
                                doc[statusField] = newStatus._id;
                                if (Array.isArray(newStatus.substatuses) && newStatus.substatuses.length) {
                                    doc[subStatusField] = newStatus.substatuses[0]._id;
                                }
                                if (!testingDummyStatus) {
                                    await statusLogHelper(doc._id, {
                                        _statusId: newStatus._id,
                                        _subStatusId: doc._leadSubStatus,
                                    });
                                }
                            }
                        } else {
                            console.warn('[VoiceX webhook] Status title not found', { statusTitle: mappedTitle, appliedId: String(doc._id) });
                        }
                    }
                }

                if (summary) {
                    const aiLine = `[AI Call] ${summary}`;
                    doc.remarks = doc.remarks ? `${aiLine}\n${doc.remarks}` : aiLine;
                }

                doc.logs = doc.logs || [];
                doc.logs.push({
                    action,
                    remarks: summary || failureReason || disposition || event,
                    timestamp: new Date(),
                });

                await doc.save();

                if (['JUNK', 'WON'].includes(mappedTitle) && voicex.isConfigured()) {
                    const phone = extractVoicexPhone(payload);
                    if (phone) {
                        voicex.cancelCall({ phoneNumber: phone }).catch((err) => {
                            console.error('[VoiceX] cancel after webhook failed', voicex.axiosErrorMessage(err));
                        });
                    }
                }
            } catch (err) {
                console.error('[VoiceX webhook] process error', err);
            }
        });
    } catch (err) {
        console.error('[VoiceX webhook] error', err);
        return res.status(200).json({ status: true, received: true });
    }
});

router.post("/voicex-dispatch", isCollege, async (req, res) => {
    try {
        const source = String(req.body.source || req.body.queue || '').trim();
        let leads = [];
        if (source === 'b2c-today') {
            leads = await fetchB2cTodayLeads();
        } else if (source === 'untouch-not-connected') {
            leads = await fetchUntouchNotConnectedLeads();
        } else {
            return res.status(400).json({
                status: false,
                msg: "source must be b2c-today or untouch-not-connected",
            });
        }

        const result = await dispatchVoiceCallsForLeads(leads);
        return res.json({
            status: true,
            msg: `${result.queued} AI call(s) queued`,
            count: leads.length,
            queued: result.queued,
            skippedNoMobile: result.skippedNoMobile,
            source,
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            msg: err.voicexMessage || err.message || "Failed to dispatch AI calls",
        });
    }
});

router.post("/voicex-make-call", isCollege, async (req, res) => {
    try {
        const appliedCourseId = req.body.appliedCourseId || req.body.lead_id || req.body.leadId;
        const callInitTime = req.body.callInitTime;
        if (!appliedCourseId || !mongoose.Types.ObjectId.isValid(String(appliedCourseId))) {
            return res.status(400).json({ status: false, msg: "appliedCourseId is required" });
        }

        const lead = await loadLeadForVoiceCall(appliedCourseId);
        if (!lead) {
            return res.status(404).json({ status: false, msg: "Lead not found" });
        }
        if (!lead.candidate?.mobile) {
            return res.status(400).json({ status: false, msg: "Lead has no mobile number" });
        }

        const result = await initiateVoiceCallForLead({ ...lead, callInitTime });
        if (result.skipped) {
            const msg = result.reason === 'auth_missing'
                ? "Set XTRME_GEN_AUTH_TOKEN in env, then retry"
                : "VoiceX call was skipped";
            return res.status(503).json({ status: false, msg, reason: result.reason });
        }

        return res.json({
            status: true,
            msg: "AI call initiated",
            data: result.data || null,
        });
    } catch (err) {
        return res.status(err.response?.status || 500).json({
            status: false,
            msg: err.voicexMessage || err.message || "Failed to initiate AI call",
        });
    }
});

router.post("/voicex-cancel", isCollege, async (req, res) => {
    try {
        const appliedCourseId = req.body.appliedCourseId || req.body.lead_id || req.body.leadId;
        let phoneNumber = req.body.phoneNumber || req.body.callTo;

        if (appliedCourseId) {
            if (!mongoose.Types.ObjectId.isValid(String(appliedCourseId))) {
                return res.status(400).json({ status: false, msg: "Invalid appliedCourseId" });
            }
            const lead = await loadLeadForVoiceCall(appliedCourseId);
            if (!lead) {
                return res.status(404).json({ status: false, msg: "Lead not found" });
            }
            phoneNumber = phoneNumber || lead.candidate?.mobile;
            const result = await cancelVoiceCallForLead({ applied: lead.applied, phoneNumber });
            return res.json({
                status: true,
                msg: "Scheduled AI call cancelled",
                data: result.data || null,
            });
        }

        if (!phoneNumber) {
            return res.status(400).json({ status: false, msg: "appliedCourseId or phoneNumber is required" });
        }

        const result = await voicex.cancelCall({ phoneNumber });
        return res.json({
            status: true,
            msg: "Scheduled AI call cancelled",
            data: result.data || null,
        });
    } catch (err) {
        return res.status(err.response?.status || 500).json({
            status: false,
            msg: err.voicexMessage || voicex.axiosErrorMessage(err) || "Failed to cancel AI call",
        });
    }
});

// router.get("/sourceLeads", async (req, res) => {
//     try {
//         console.log("sourceLeads... api hitting" )

//         // Get date range from query parameters (optional)
//         const { startDate, endDate, collegeId } = req.query;

//         // Build date filter
//         let dateFilter = {};
//         if (startDate && endDate) {
//             dateFilter = {
//                 createdAt: {
//                     $gte: new Date(startDate),
//                     $lte: new Date(endDate)
//                 }
//             };
//         }

//         // Build college filter if provided
//         let collegeFilter = {};
//         if (collegeId) {
//             collegeFilter = { collegeId: collegeId };
//         }

//         // Aggregate pipeline to count leads by source
//         const sourceLeadsData = await CandidateProfile.aggregate([
//             {
//                 $match: {
//                     ...dateFilter,
//                     ...collegeFilter,
//                     isDeleted: { $ne: true }
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$source",
//                     count: { $sum: 1 },
//                     leads: {
//                         $push: {
//                             _id: "$_id",
//                             name: "$name",
//                             mobile: "$mobile",
//                             email: "$email",
//                             createdAt: "$createdAt",
//                             source: "$source"
//                         }
//                     }
//                 }
//             },
//             {
//                 $project: {
//                     source: "$_id",
//                     count: 1,
//                     leads: 1,
//                     _id: 0
//                 }
//             },
//             {
//                 $sort: { count: -1 }
//             }
//         ]);

//         console.log("sourceLeadsData...", sourceLeadsData);

//         // Calculate totals
//         const totalLeads = sourceLeadsData.reduce((sum, item) => sum + item.count, 0);

//         // Categorize sources
//         const portalLeads = sourceLeadsData.filter(item => 
//             item.source === 'website' || 
//             item.source === 'portal' || 
//             item.source === 'college_portal'
//         );

//         const thirdPartyLeads = sourceLeadsData.filter(item => 
//             item.source !== 'website' && 
//             item.source !== 'portal' && 
//             item.source !== 'college_portal'
//         );

//         const portalLeadsCount = portalLeads.reduce((sum, item) => sum + item.count, 0);
//         const thirdPartyLeadsCount = thirdPartyLeads.reduce((sum, item) => sum + item.count, 0);

//         // Get recent leads (last 30 days)
//         const thirtyDaysAgo = new Date();
//         thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//         const recentLeadsData = await CandidateProfile.aggregate([
//             {
//                 $match: {
//                     createdAt: { $gte: thirtyDaysAgo },
//                     isDeleted: { $ne: true }
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$source",
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);

//         const recentPortalLeads = recentLeadsData
//             .filter(item => ['website', 'portal', 'college_portal'].includes(item._id))
//             .reduce((sum, item) => sum + item.count, 0);

//         const recentThirdPartyLeads = recentLeadsData
//             .filter(item => !['website', 'portal', 'college_portal'].includes(item._id))
//             .reduce((sum, item) => sum + item.count, 0);

//         console.log("summary...", {
//             totalLeads,
//             portalLeads: portalLeadsCount,
//             thirdPartyLeads: thirdPartyLeadsCount,
//             recentPortalLeads,
//             recentThirdPartyLeads
//         });

//         res.status(200).json({
//             status: true,
//             msg: "Source leads data retrieved successfully",
//             data: {
//                 summary: {
//                     totalLeads,
//                     portalLeads: portalLeadsCount,
//                     thirdPartyLeads: thirdPartyLeadsCount,
//                     recentPortalLeads,
//                     recentThirdPartyLeads
//                 },
//                 sourceBreakdown: sourceLeadsData,
//                 portalLeads: portalLeads,
//                 thirdPartyLeads: thirdPartyLeads
//             }
//         });

//     } catch (err) {
//         console.error("Error in sourceLeads API:", err);
//         res.status(500).json({
//             status: false,
//             msg: "Failed to get source leads",
//             error: err.message
//         });
//     }
// });

// router.get("/leadStats", async (req, res) => {
//     try {
//         console.log("leadStats... api hitting")

//         const { startDate, endDate, collegeId } = req.query;

//         // Build date filter
//         let dateFilter = {};
//         if (startDate && endDate) {
//             dateFilter = {
//                 createdAt: {
//                     $gte: new Date(startDate),
//                     $lte: new Date(endDate)
//                 }
//             };
//         }

//         // Build college filter if provided
//         let collegeFilter = {};
//         if (collegeId) {
//             collegeFilter = { collegeId: collegeId };
//         }

//         // Get leads by month for the last 12 months
//         const twelveMonthsAgo = new Date();
//         twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

//         const monthlyLeads = await CandidateProfile.aggregate([
//             {
//                 $match: {
//                     createdAt: { $gte: twelveMonthsAgo },
//                     isDeleted: { $ne: true },
//                     ...collegeFilter
//                 }
//             },
//             {
//                 $group: {
//                     _id: {
//                         year: { $year: "$createdAt" },
//                         month: { $month: "$createdAt" },
//                         source: "$source"
//                     },
//                     count: { $sum: 1 }
//                 }
//             },
//             {
//                 $sort: { "_id.year": 1, "_id.month": 1 }
//             }
//         ]);

//         // Get today's leads
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const tomorrow = new Date(today);
//         tomorrow.setDate(tomorrow.getDate() + 1);

//         const todayLeads = await CandidateProfile.aggregate([
//             {
//                 $match: {
//                     createdAt: { $gte: today, $lt: tomorrow },
//                     isDeleted: { $ne: true },
//                     ...collegeFilter
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$source",
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);

//         // Get this week's leads
//         const startOfWeek = new Date();
//         startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
//         startOfWeek.setHours(0, 0, 0, 0);

//         const weekLeads = await CandidateProfile.aggregate([
//             {
//                 $match: {
//                     createdAt: { $gte: startOfWeek },
//                     isDeleted: { $ne: true },
//                     ...collegeFilter
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$source",
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);

//         // Get this month's leads
//         const startOfMonth = new Date();
//         startOfMonth.setDate(1);
//         startOfMonth.setHours(0, 0, 0, 0);

//         const monthLeads = await CandidateProfile.aggregate([
//             {
//                 $match: {
//                     createdAt: { $gte: startOfMonth },
//                     isDeleted: { $ne: true },
//                     ...collegeFilter
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$source",
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);

//         // Calculate portal vs third party for different time periods
//         const calculatePortalVsThirdParty = (leadsData) => {
//             const portalSources = ['website', 'portal', 'college_portal'];
//             const portalCount = leadsData
//                 .filter(item => portalSources.includes(item._id))
//                 .reduce((sum, item) => sum + item.count, 0);
//             const thirdPartyCount = leadsData
//                 .filter(item => !portalSources.includes(item._id))
//                 .reduce((sum, item) => sum + item.count, 0);
//             return { portalCount, thirdPartyCount };
//         };

//         const todayStats = calculatePortalVsThirdParty(todayLeads);
//         const weekStats = calculatePortalVsThirdParty(weekLeads);
//         const monthStats = calculatePortalVsThirdParty(monthLeads);

//         // Get top sources
//         const topSources = await CandidateProfile.aggregate([
//             {
//                 $match: {
//                     isDeleted: { $ne: true },
//                     ...collegeFilter
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$source",
//                     count: { $sum: 1 }
//                 }
//             },
//             {
//                 $sort: { count: -1 }
//             },
//             {
//                 $limit: 10
//             }
//         ]);

//         console.log("monthlyLeads...", monthlyLeads)
//         console.log("monthLeads...", monthLeads)
//         console.log("topSources...", topSources)

//         res.status(200).json({
//             status: true,
//             msg: "Lead statistics retrieved successfully",
//             data: {
//                 today: {
//                     total: todayLeads.reduce((sum, item) => sum + item.count, 0),
//                     portal: todayStats.portalCount,
//                     thirdParty: todayStats.thirdPartyCount,
//                     breakdown: todayLeads
//                 },
//                 thisWeek: {
//                     total: weekLeads.reduce((sum, item) => sum + item.count, 0),
//                     portal: weekStats.portalCount,
//                     thirdParty: weekStats.thirdPartyCount,
//                     breakdown: weekLeads
//                 },
//                 thisMonth: {
//                     total: monthLeads.reduce((sum, item) => sum + item.count, 0),
//                     portal: monthStats.portalCount,
//                     thirdParty: monthStats.thirdPartyCount,
//                     breakdown: monthLeads
//                 },
//                 monthlyTrend: monthlyLeads,
//                 topSources: topSources
//             }
//         });

//     } catch (err) {
//         console.error("Error in leadStats API:", err);
//         res.status(500).json({
//             status: false,
//             msg: "Failed to get lead statistics",
//             error: err.message
//         });
//     }
// });

module.exports = router;