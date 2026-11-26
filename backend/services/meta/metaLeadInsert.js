const Candidate = require('../../controllers/models/candidateProfile');
const AppliedCourses = require('../../controllers/models/appliedCourses');
const AppliedJobs = require('../../controllers/models/appliedJobs');
const Course = require('../../controllers/models/courses');
const Vacancy = require('../../controllers/models/vacancy');
const User = require('../../controllers/models/users');

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 10) return '';
  // +91 and a trunk 0 are prefixes. The CRM stores the 10-digit mobile.
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(-10);
}

function createCrmInserter({
  candidates = Candidate,
  applications = AppliedCourses,
  jobApplications = AppliedJobs,
  courses = Course,
  vacancies = Vacancy,
  users = User,
} = {}) {
  async function ensureLogin(lead) {
    try {
      const existingUser = await users.findOne({
        mobile: lead.mobile,
        role: { $in: [3, '3'] },
      }).select('_id').lean();
      if (!existingUser) {
        await users.create({
          role: 3,
          mobile: lead.mobile,
          name: lead.name,
          email: lead.email || undefined,
          status: true,
        });
      }
    } catch (error) {
      // The CRM lead can exist without a new login user.
    }
  }

  async function linkApplication(candidateId, courseId, appliedId) {
    await candidates.updateOne(
      { _id: candidateId },
      {
        $addToSet: { _appliedCourses: appliedId },
        $push: { appliedCourses: { courseId } },
      },
    );
  }

  async function linkJob(candidateId, jobId) {
    await candidates.updateOne(
      { _id: candidateId },
      { $addToSet: { appliedJobs: { jobId } } },
    );
  }

  function applicationPayload(candidateId, mapping) {
    return {
      _candidate: candidateId,
      _course: mapping.courseId,
      _leadStatus: mapping.statusId,
      _leadSubStatus: mapping.substatusId,
      registeredBy: mapping.leadSourceId,
      registeredByModel: 'Source',
    };
  }

  function jobApplicationPayload(candidateId, mapping, job) {
    return {
      _candidate: candidateId,
      _job: mapping.jobId,
      _company: job._company || undefined,
      college: mapping.collegeId || undefined,
      leadStatus: mapping.statusId,
      leadSubstatus: mapping.substatusId,
      source: mapping.leadSource || '',
    };
  }

  // A person already in the CRM keeps one profile. Each Meta submission still
  // becomes its own application, including a repeat apply for the same job or course.
  async function findExistingCandidate(lead) {
    const byMobile = await candidates.findOne({ mobile: lead.mobile }).select('_id').lean();
    if (byMobile) return byMobile;
    if (!lead.email) return null;
    return candidates.findOne({ email: lead.email }).select('_id').lean();
  }

  async function saveJobApplication(candidateId, mapping, job) {
    const created = await jobApplications.create(jobApplicationPayload(candidateId, mapping, job));
    await linkJob(candidateId, mapping.jobId);
    return { ok: true, crmLeadId: created._id };
  }

  async function saveCourseApplication(candidateId, mapping) {
    const created = await applications.create(applicationPayload(candidateId, mapping));
    await linkApplication(candidateId, mapping.courseId, created._id);
    return { ok: true, crmLeadId: created._id };
  }

  function newProfile(lead, mapping, collegeId) {
    const profile = {
      name: lead.name,
      mobile: lead.mobile,
      whatsapp: lead.whatsapp || lead.mobile,
      source: mapping.leadSource,
      isImported: true,
      verified: true,
    };
    if (lead.email) profile.email = lead.email;
    if (lead.sex) profile.sex = lead.sex;
    if (collegeId) profile.college = collegeId;
    return profile;
  }

  async function insertJobLead(mapping, lead) {
    const job = await vacancies.findById(mapping.jobId).select('title _company status').lean();
    if (!job || job.status === false) {
      return { ok: false, retry: false, message: 'The mapped job was not found.' };
    }
    const existing = await findExistingCandidate(lead);
    if (existing) return saveJobApplication(existing._id, mapping, job);
    await ensureLogin(lead);
    let candidate = null;
    try {
      candidate = await candidates.create(newProfile(lead, mapping, mapping.collegeId));
      return await saveJobApplication(candidate._id, mapping, job);
    } catch (error) {
      if (candidate && candidate._id) {
        await candidates.deleteOne({ _id: candidate._id });
      }
      if (error && error.code === 11000) {
        const again = await findExistingCandidate(lead);
        if (again) return saveJobApplication(again._id, mapping, job);
      }
      return { ok: false, retry: true, message: 'The CRM lead could not be saved.' };
    }
  }

  async function insertMappedLead({ mapping, lead }) {
    if (!lead || !lead.name || !lead.mobile) {
      return {
        ok: false,
        retry: false,
        message: 'The Meta lead is missing a name or a 10-digit mobile number.',
      };
    }
    if (mapping && mapping.jobId) return insertJobLead(mapping, lead);
    const course = await courses.findById(mapping.courseId).select('college').lean();
    if (!course) {
      return { ok: false, retry: false, message: 'The mapped course was not found.' };
    }

    const existing = await findExistingCandidate(lead);
    if (existing) return saveCourseApplication(existing._id, mapping);

    await ensureLogin(lead);
    let candidate = null;
    try {
      candidate = await candidates.create(newProfile(lead, mapping, course.college));
      return await saveCourseApplication(candidate._id, mapping);
    } catch (error) {
      if (candidate && candidate._id) {
        await candidates.deleteOne({ _id: candidate._id });
      }
      if (error && error.code === 11000) {
        const again = await findExistingCandidate(lead);
        if (again) return saveCourseApplication(again._id, mapping);
      }
      return { ok: false, retry: true, message: 'The CRM lead could not be saved.' };
    }
  }

  return { insertMappedLead };
}

module.exports = { createCrmInserter, normalizePhone };
