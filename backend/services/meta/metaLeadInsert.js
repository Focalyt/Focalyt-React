const Candidate = require('../../controllers/models/candidateProfile');
const AppliedCourses = require('../../controllers/models/appliedCourses');
const AppliedJobs = require('../../controllers/models/appliedJobs');
const Course = require('../../controllers/models/courses');
const Vacancy = require('../../controllers/models/vacancy');
const User = require('../../controllers/models/users');

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 10) return '';
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

  async function insertJobLead(mapping, lead) {
    const job = await vacancies.findById(mapping.jobId).select('title _company status').lean();
    if (!job || job.status === false) {
      return { ok: false, retry: false, message: 'The mapped job was not found.' };
    }
    const existing = await candidates.findOne({ mobile: lead.mobile }).select('_id').lean();
    if (existing) {
      const applied = await jobApplications.findOne({
        _candidate: existing._id,
        _job: mapping.jobId,
        isDeleted: { $ne: true },
      }).select('_id').lean();
      if (applied) return { ok: true, duplicate: true, crmLeadId: applied._id };
      const created = await jobApplications.create(jobApplicationPayload(existing._id, mapping, job));
      await linkJob(existing._id, mapping.jobId);
      return { ok: true, crmLeadId: created._id };
    }
    if (lead.email) {
      const byEmail = await candidates.findOne({ email: lead.email }).select('_id').lean();
      if (byEmail) {
        return {
          ok: false,
          retry: false,
          message: 'A candidate with this email already exists.',
        };
      }
    }
    await ensureLogin(lead);
    let candidate = null;
    try {
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
      if (mapping.collegeId) profile.college = mapping.collegeId;
      candidate = await candidates.create(profile);
      const applied = await jobApplications.create(jobApplicationPayload(candidate._id, mapping, job));
      await linkJob(candidate._id, mapping.jobId);
      return { ok: true, crmLeadId: applied._id };
    } catch (error) {
      if (candidate && candidate._id) {
        await candidates.deleteOne({ _id: candidate._id });
      }
      if (error && error.code === 11000) {
        return {
          ok: false,
          retry: false,
          message: 'A candidate with this mobile already exists.',
        };
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

    const existing = await candidates.findOne({ mobile: lead.mobile }).select('_id').lean();
    if (existing) {
      const applied = await applications.findOne({
        _candidate: existing._id,
        _course: mapping.courseId,
      }).select('_id').lean();
      if (applied) return { ok: true, duplicate: true, crmLeadId: applied._id };
      const created = await applications.create(applicationPayload(existing._id, mapping));
      await linkApplication(existing._id, mapping.courseId, created._id);
      return { ok: true, crmLeadId: created._id };
    }

    if (lead.email) {
      const byEmail = await candidates.findOne({ email: lead.email }).select('_id').lean();
      if (byEmail) {
        return {
          ok: false,
          retry: false,
          message: 'A candidate with this email already exists.',
        };
      }
    }

    await ensureLogin(lead);
    let candidate = null;
    try {
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
      if (course.college) profile.college = course.college;
      candidate = await candidates.create(profile);
      const applied = await applications.create(applicationPayload(candidate._id, mapping));
      await linkApplication(candidate._id, mapping.courseId, applied._id);
      return { ok: true, crmLeadId: applied._id };
    } catch (error) {
      if (candidate && candidate._id) {
        await candidates.deleteOne({ _id: candidate._id });
      }
      if (error && error.code === 11000) {
        return {
          ok: false,
          retry: false,
          message: 'A candidate with this mobile already exists.',
        };
      }
      return { ok: false, retry: true, message: 'The CRM lead could not be saved.' };
    }
  }

  return { insertMappedLead };
}

module.exports = { createCrmInserter, normalizePhone };
