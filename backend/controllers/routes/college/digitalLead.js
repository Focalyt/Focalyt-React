// server.js
let express = require("express");
let mongoose = require('mongoose');
let cors = require('cors');
let router = express.Router();

// Models
let Status = require('../../models/status');
let { StatusLogs, AppliedCourses, CandidateProfile, Courses, Center, User , ReEnquire} = require('../../models');

//helpers
let { statusLogHelper } = require('../../../helpers/college');

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
            console.log("Processing lead:", req_body.FirstName);

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
                    return {
                        status: "already_exists",
                        msg: "Candidate already exists and course already applied",
                        data: { existingCandidate, alreadyApplied },
                        mobile: mobile
                    };
                }
                if (existingCandidate && !alreadyApplied) {
                    let appliedCourseEntry = await AppliedCourses.create({
                        _candidate: existingCandidate._id,
                        _course: courseId,
                        _center: selectedCenter
                    });

                    console.log(`   ✅ Updated existing candidate: ${name} (${mobile})`);

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

                // Insert AppliedCourses Record
                let appliedCourseEntry = await AppliedCourses.create({
                    _candidate: candidate._id,
                    _course: courseId,
                    _center: selectedCenter
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
                        counselorName:  alreadyApplied.counsellor
                    });
                    return res.json({
                        status: false,
                        msg: "Candidate already exists and course already applied",
                        data: { existingCandidate, alreadyApplied, reEnquire },
                        mobile: mobile
                    });
                }
                if (existingCandidate && !alreadyApplied) {
                    let appliedCourseEntry = await AppliedCourses.create({
                        _candidate: existingCandidate._id,
                        _course: courseId,
                        _center: selectedCenter,
                        _leadStatus: statusId._id,
                        _leadSubStatus: subStatusId._id
                    });

                    console.log(`   ✅ Updated existing candidate: ${name} (${mobile})`);

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
                let candidate = await CandidateProfile.create(candidateData);
                let user = await User.create({
                    name: candidate.name,
                    email: candidate.email,
                    mobile: candidate.mobile,
                    role: 3,
                    status: true,
                    source
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

                appliedData = appliedCourseEntry;
            }


            const newLogEntry = {
                action: `Lead added with ${status.title} and ${subStatus.title} from digital lead`, // Combine all actions in one log message
                remarks: Remarks || '', // Optional remarks in the log
                timestamp: new Date() // Add timestamp if your schema supports it
            };

            appliedData.logs.push(newLogEntry);
            await appliedData.save();



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