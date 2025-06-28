const express = require('express');
const router = express.Router();
const { isCollege } = require('../../../helpers');
const { AppliedCourses, College } = require('../../models');

// Mark attendance for a student
router.route("/mark-attendance").post(isCollege, async (req, res) => {
	try {
		const user = req.user;
		const { 
			appliedCourseId, 
			date, 
			status, 
			period = 'regularPeriod', 
			remarks = '' 
		} = req.body;

		console.log("req.body", req.body);

		// Validate required fields
		if (!appliedCourseId || !date || !status) {
			return res.status(400).json({
				status: false,
				message: "appliedCourseId, date, and status are required"
			});
		}

		// Validate status
		if (!['Present', 'Absent'].includes(status)) {
			return res.status(400).json({
				status: false,
				message: "Status must be 'Present' or 'Absent'"
			});
		}

		// Validate period
		if (!['zeroPeriod', 'regularPeriod'].includes(period)) {
			return res.status(400).json({
				status: false,
				message: "Period must be 'zeroPeriod' or 'regularPeriod'"
			});
		}

		// Find the applied course
		const appliedCourse = await AppliedCourses.findById(appliedCourseId)
			.populate('_course')
			.populate('batch');

		if (!appliedCourse) {
			return res.status(404).json({
				status: false,
				message: "Applied course not found"
			});
		}

		// Verify that the course belongs to the college
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		if (!college) {
			return res.status(403).json({
				status: false,
				message: "College not found"
			});
		}

		if (String(appliedCourse._course.college) !== String(college._id)) {
			return res.status(403).json({
				status: false,
				message: "You don't have permission to mark attendance for this course"
			});
		}

		// Mark attendance using the schema method
		await appliedCourse.markAttendance(date, status, period, user._id, remarks);

		// Get updated attendance data
		const updatedCourse = await AppliedCourses.findById(appliedCourseId)
			.populate('_course')
			.populate('batch');

		res.status(200).json({
			status: true,
			message: "Attendance marked successfully",
			data: {
				appliedCourseId,
				date,
				status,
				period,
				markedBy: user._id,
				attendance: updatedCourse.attendance
			}
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			status: false,
			message: err.message || "Server Error"
		});
	}
});

// Bulk mark attendance for multiple students
router.route("/bulk-mark-attendance").post(isCollege, async (req, res) => {
	try {
		const user = req.user;
		const { 
			attendanceData, // Array of { appliedCourseId, date, status, period, remarks }
			date,
			status,
			period = 'regularPeriod',
			remarks = ''
		} = req.body;

		// Validate required fields
		if (!attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
			return res.status(400).json({
				status: false,
				message: "attendanceData array is required"
			});
		}

		// Validate status
		if (!['Present', 'Absent'].includes(status)) {
			return res.status(400).json({
				status: false,
				message: "Status must be 'Present' or 'Absent'"
			});
		}

		// Validate period
		if (!['zeroPeriod', 'regularPeriod'].includes(period)) {
			return res.status(400).json({
				status: false,
				message: "Period must be 'zeroPeriod' or 'regularPeriod'"
			});
		}

		// Verify college access
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		if (!college) {
			return res.status(403).json({
				status: false,
				message: "College not found"
			});
		}

		const results = [];
		const errors = [];

		// Process each attendance record
		for (const record of attendanceData) {
			try {
				const appliedCourse = await AppliedCourses.findById(record.appliedCourseId)
					.populate('_course');

				if (!appliedCourse) {
					errors.push({
						appliedCourseId: record.appliedCourseId,
						error: "Applied course not found"
					});
					continue;
				}

				// Verify course belongs to college
				if (String(appliedCourse._course.college) !== String(college._id)) {
					errors.push({
						appliedCourseId: record.appliedCourseId,
						error: "You don't have permission to mark attendance for this course"
					});
					continue;
				}

				// Mark attendance
				await appliedCourse.markAttendance(
					date || record.date,
					status || record.status,
					period || record.period,
					user._id,
					remarks || record.remarks
				);

				results.push({
					appliedCourseId: record.appliedCourseId,
					status: true,
					message: "Attendance marked successfully"
				});

			} catch (error) {
				errors.push({
					appliedCourseId: record.appliedCourseId,
					error: error.message
				});
			}
		}

		res.status(200).json({
			status: true,
			message: `Processed ${attendanceData.length} records`,
			results,
			errors,
			summary: {
				total: attendanceData.length,
				successful: results.length,
				failed: errors.length
			}
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			status: false,
			message: err.message || "Server Error"
		});
	}
});

// Get attendance report for a specific student
router.route("/attendance-report/:appliedCourseId").get(isCollege, async (req, res) => {
	try {
		const user = req.user;
		const { appliedCourseId } = req.params;
		const { startDate, endDate, period } = req.query;

		// Find the applied course
		const appliedCourse = await AppliedCourses.findById(appliedCourseId)
			.populate('_course')
			.populate('batch')
			.populate('_candidate');

		if (!appliedCourse) {
			return res.status(404).json({
				status: false,
				message: "Applied course not found"
			});
		}

		// Verify college access
		const college = await College.findOne({
			'_concernPerson._id': user._id
		});

		if (!college || String(appliedCourse._course.college) !== String(college._id)) {
			return res.status(403).json({
				status: false,
				message: "You don't have permission to access this data"
			});
		}

		// Generate attendance report using schema method
		const report = appliedCourse.getAttendanceReport(startDate, endDate, period);

		res.status(200).json({
			status: true,
			data: {
				appliedCourseId,
				studentName: appliedCourse._candidate?.name || 'N/A',
				courseName: appliedCourse._course?.name || 'N/A',
				batchName: appliedCourse.batch?.name || 'N/A',
				report
			}
		});

	} catch (err) {
		console.error(err);
		res.status(500).json({
			status: false,
			message: err.message || "Server Error"
		});
	}
});

module.exports = router; 