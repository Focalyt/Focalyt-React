// server.js
let express = require("express");
let mongoose = require('mongoose');
let cors = require('cors');
let router = express.Router();

// Models
let Status = require('../../models/status');
let { AppliedCourses, CandidateProfile, Courses, Center, User } = require('../../models');

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

            if (!FirstName || !MobileNumber || !Gender || !DateOfBirth || !Email || !courseId || !Field4) {
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

                console.log("Final Candidate Data:", candidateData);

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

                console.log(`   ✅ Created new candidate: ${name} (${mobile})`);

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
router.route("/addleaddandcourseapply")
    .post(async (req, res) => {
        try {
            console.log("Lead received:", req.body.FirstName);

            // Basic validation only
            const { FirstName, MobileNumber, Gender, DateOfBirth, Email, courseId, Field4 } = req.body;

            if (!FirstName || !MobileNumber || !Gender || !DateOfBirth || !Email || !courseId || !Field4) {
                return res.status(400).json({
                    status: false,
                    msg: "All fields are required"
                });
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
                    return res.status(400).json({
                        status: false,
                        msg: "Invalid mobile number format"
                    });
                }
                MobileNumber = parseInt(MobileNumber);
            } else {
                return res.status(400).json({
                    status: false,
                    msg: "Mobile number is required"
                });
            }

            // Add to batch processor queue
            const result = await batchProcessor.addToQueue(req.body);

            // Immediate response - NO DATABASE OPERATIONS HERE!
            return res.json({
                status: true,
                msg: "Lead added to processing queue",
                queueLength: result.queueLength,
                message: "Your lead will be processed within 5-10 seconds"
            });

        } catch (err) {
            console.error("Error adding to queue:", err);
            // req.flash ko remove kar diya kyunki immediate response me ye nahi chahiye
            return res.status(500).json({
                status: false,
                msg: err.message || "Failed to add lead to queue"
            });
        }
    });

// Queue status check endpoint
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

module.exports = router;