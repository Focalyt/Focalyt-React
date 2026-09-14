const express = require("express");
const uuid = require("uuid/v1");
const { isCollege } = require("../../../helpers");
const { bucketName, mimetypes } = require("../../../config");
const s3 = require("../../../helpers/objectStorage");
const {
	Skill,
	Industry,
	Vacancy,
	VacancyType,
	Country,
	State,
	City,
	Qualification,
	SubQualification,
	HiringStatus,
} = require("../../models");

const router = express.Router();
router.use(isCollege);

const allowedImageExt = ["jpg", "jpeg", "png"];

const sortByName = (items = []) =>
	[...items].sort((a, b) =>
		String(a?.name || "").localeCompare(String(b?.name || ""), undefined, {
			sensitivity: "base",
			numeric: true,
		})
	);

const toArray = (value) => {
	if (value == null || value === "") return [];
	return Array.isArray(value) ? value.filter(Boolean) : [value];
};

const toBoolean = (value) => value === true || value === "true";

const allowedVideoExtensions = ["mp4", "mkv", "mov", "avi", "wmv"];
const allowedImageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

const uploadJobFile = async (file, folder, title) => {
	const filesArray = Array.isArray(file) ? file : [file];
	const uploaded = [];

	await Promise.all(
		filesArray.map((item) => {
			const { name, mimetype, data } = item;
			const ext = name?.split(".").pop()?.toLowerCase();
			if (!allowedImageExtensions.includes(ext) && !allowedVideoExtensions.includes(ext)) {
				throw new Error(`File type not supported: ${ext}`);
			}
			const fileType = allowedImageExtensions.includes(ext) ? "image" : "video";
			const key = `Jobs/college/${folder}/${title || "job"}/${fileType}s/${uuid()}.${ext}`;
			return s3
				.upload({
					Bucket: bucketName,
					Key: key,
					Body: data,
					ContentType: mimetype,
				})
				.promise()
				.then(() => uploaded.push({ fileURL: key, fileType }));
		})
	);

	return uploaded[0]?.fileURL;
};

router.get("/form-data", async (req, res) => {
	try {
		const [industry, qualification, subQualification, state] = await Promise.all([
			Industry.find({ status: true }).select("name").sort({ name: 1 }).lean(),
			Qualification.find({ status: true }).select("name").sort({ name: 1 }).lean(),
			SubQualification.find({ status: true }).select("name _qualification").sort({ name: 1 }).lean(),
			State.find({ countryId: "101", status: { $ne: false } }).select("name stateId").sort({ name: 1 }).lean(),
		]);

		return res.json({
			status: true,
			data: {
				industry,
				qualification,
				subQualification,
				state,
				college: {
					_id: req.college?._id,
					name: req.college?.name || "",
				},
			},
		});
	} catch (error) {
		console.error("Error loading job form data:", error);
		return res.status(500).json({ status: false, message: error.message || "Unable to load form data" });
	}
});

router.post("/cities", async (req, res) => {
	try {
		const { stateId } = req.body;
		if (!stateId) return res.json([]);
		const state = await State.findById(stateId).lean();
		if (!state) return res.json([]);
		const cities = await City.find({ stateId: state.stateId, status: { $ne: false } })
			.select("name cityId stateId")
			.sort({ name: 1 })
			.lean();
		return res.json(cities);
	} catch (error) {
		console.error("Error fetching cities:", error);
		return res.status(500).json({ status: false, message: error.message || "Unable to load cities" });
	}
});

router.post("/add", async (req, res) => {
	try {
		const body = req.body || {};
		const jobDetails = {};
		const skipKeys = new Set(["isPublic", "collegeAcNo", "collegeAcNo[]", "questionsAnswers", "isEdit"]);

		Object.keys(body).forEach((key) => {
			if (skipKeys.has(key)) return;
			if (body[key] === "" || body[key] == null) return;
			if (key === "isContact" || key === "isFixed") {
				jobDetails[key] = toBoolean(Array.isArray(body[key]) ? body[key][body[key].length - 1] : body[key]);
			} else if (key === "_subQualification" || key === "benifits" || key === "_techSkills" || key === "_nonTechSkills") {
				jobDetails[key] = toArray(body[key]);
			} else {
				jobDetails[key] = body[key];
			}
		});

		if (body.latitude && body.longitude) {
			jobDetails.location = {
				type: "Point",
				coordinates: [Number(body.longitude), Number(body.latitude)],
			};
		}

		if (req.files?.jobVideo) {
			jobDetails.jobVideo = await uploadJobFile(req.files.jobVideo, req.college?._id || req.user._id, body.title);
		}
		if (req.files?.jobVideoThumbnail) {
			jobDetails.jobVideoThumbnail = await uploadJobFile(
				req.files.jobVideoThumbnail,
				req.college?._id || req.user._id,
				body.title
			);
		}

		if (toBoolean(body.isEdit)) {
			jobDetails._subQualification = [];
		}

		const isPublic = body.isPublic === undefined ? true : toBoolean(body.isPublic);
		if (!isPublic) {
			jobDetails.postingType = "Private";
			const collegeAcNos = toArray(body.collegeAcNo || body["collegeAcNo[]"])
				.map((no) => String(no).trim())
				.filter(Boolean);
			if (!collegeAcNos.length) {
				return res.status(400).json({
					status: false,
					message: "Private jobs require at least one College Account Number.",
				});
			}
			jobDetails.collegeAcNo = collegeAcNos;
		} else {
			jobDetails.postingType = "Public";
			jobDetails.collegeAcNo = [];
		}

		if (jobDetails.isContact) {
			jobDetails.nameof = body.nameof || "";
			jobDetails.phoneNumberof = body.phoneNumberof || "";
			jobDetails.whatsappNumberof = body.whatsappNumberof || "";
			jobDetails.emailof = body.emailof || "";
		} else {
			jobDetails.nameof = "";
			jobDetails.phoneNumberof = "";
			jobDetails.whatsappNumberof = "";
			jobDetails.emailof = "";
		}

		if (body.questionsAnswers) {
			try {
				const parsed = typeof body.questionsAnswers === "string" ? JSON.parse(body.questionsAnswers) : body.questionsAnswers;
				jobDetails.questionsAnswers = (Array.isArray(parsed) ? parsed : [])
					.filter((item) => item?.question || item?.Question || item?.answer || item?.Answer)
					.map((item) => ({
						Question: item.question || item.Question || "",
						Answer: item.answer || item.Answer || "",
					}));
			} catch (err) {
				console.warn("Unable to parse questionsAnswers:", err.message);
			}
		}

		if (!jobDetails.displayCompanyName) {
			jobDetails.displayCompanyName = req.college?.name || "";
		}

		jobDetails.hr = req.user._id;
		jobDetails.dateOfPosting = new Date();

		const jd = await Vacancy.create(jobDetails);
		return res.json({ status: true, message: "Job added", data: { _id: jd._id } });
	} catch (error) {
		console.error("Error adding college job:", error);
		return res.status(500).json({ status: false, message: error.message || "Job description failed" });
	}
});

router.get("/list", async (req, res) => {
	try {
		const college = req.college;
		const page = parseInt(req.query.page, 10) || 1;
		const perPage = 20;
		const hrIds = (college?._concernPerson || []).map((person) => person._id).filter(Boolean);
		const filter = hrIds.length ? { hr: { $in: hrIds } } : { _id: null };

		const [count, jd, shortlistedCandCount] = await Promise.all([
			Vacancy.countDocuments(filter),
			Vacancy.find(filter)
				.select("title experience _qualification createdAt status validity displayCompanyName")
				.populate({ path: "_qualification", select: "name" })
				.sort({ createdAt: -1 })
				.skip(perPage * (page - 1))
				.limit(perPage)
				.lean(),
			HiringStatus.aggregate([
				{ $match: { job: { $ne: null }, isDeleted: false } },
				{ $group: { _id: { job: "$job" }, count: { $sum: 1 } } },
			]),
		]);

		return res.json({
			success: true,
			jd,
			totalPages: Math.ceil(count / perPage) || 1,
			page,
			shortlistedCandCount,
			canAdd: Boolean(college),
			isExist: Boolean(college),
			college: {
				_id: college?._id,
				name: college?.name || "",
				creditLeft: 0,
			},
		});
	} catch (error) {
		console.error("Error listing college jobs:", error);
		return res.status(500).json({ success: false, message: error.message || "Unable to load jobs" });
	}
});

router.patch("/changeStatus", async (req, res) => {
	try {
		const { id, status } = req.body || {};
		if (!id) {
			return res.status(400).json({ success: false, message: "Job id is required" });
		}

		const job = await Vacancy.findById(id);
		if (!job) {
			return res.status(404).json({ success: false, message: "Job not found" });
		}

		const hrIds = (req.college?._concernPerson || []).map((person) => String(person._id));
		if (job.hr && hrIds.length && !hrIds.includes(String(job.hr))) {
			return res.status(403).json({ success: false, message: "You cannot update this job" });
		}

		job.status = status === true || status === "true";
		await job.save();
		return res.json({ success: true, message: "Status updated" });
	} catch (error) {
		console.error("Error changing college job status:", error);
		return res.status(500).json({ success: false, message: error.message || "Unable to update status" });
	}
});

module.exports = router;
