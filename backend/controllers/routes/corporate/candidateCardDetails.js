const mongoose = require('mongoose');
const { Company, Candidate, CandidateProfile, HiringStatus, AppliedJobs } = require('../../models');
const { getBucketBaseUrl } = require('../../../helpers/s3Storage');

function textValue(value) {
  const text = value == null ? '' : String(value).trim();
  return text || 'N/A';
}

function formatLeadDate(value) {
  if (!value) return 'N/A';
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return 'N/A';
  const datePart = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
  }).replace(/ /g, '-');
  const timePart = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
  });
  return `${datePart}, ${timePart}`;
}

function leadAgeFrom(value) {
  if (!value) return 'N/A';
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) return 'N/A';
  const days = Math.max(0, Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)));
  return `${days} Days`;
}

function documentUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const raw = value.trim();
  if (/^https?:\/\//i.test(raw)) {
    try { return new URL(raw).href; } catch (_) { return ''; }
  }
  if (/^[a-z][a-z\d+.-]*:|^\/\/|\\|[\r\n]/i.test(raw)) return '';
  const key = raw.replace(/^\/+/, '');
  if (key.split('/').some(part => part === '.' || part === '..')) return '';
  const base = getBucketBaseUrl();
  if (base && !/^https?:\/\//i.test(base)) return '';
  return base ? `${base}/${key}` : `/api/upload/${key}`;
}

module.exports = async function candidateCardDetails(req, res) {
  res.set('Cache-Control', 'private, no-store');
  const { candidateId } = req.params;
  const { applicationId, source = 'candidate' } = req.query;
  if (!mongoose.isValidObjectId(candidateId)
    || (applicationId && !mongoose.isValidObjectId(applicationId))
    || !['candidate', 'profile'].includes(source)) {
    return res.status(400).json({ message: 'Invalid candidate or application.' });
  }
  try {
    const company = await Company.findOne({ _concernPerson: req.companyUser, status: { $ne: false }, isDeleted: { $ne: true } })
      .select('_id name unmasked').lean();
    if (!company) return res.status(404).json({ message: 'Company not found.' });

    const applicationFilter = { _company: company._id, _candidate: candidateId, isDeleted: { $ne: true } };
    if (applicationId) applicationFilter._id = applicationId;
    const applications = await AppliedJobs.find(applicationFilter)
      .select('_id _job resume documents createdAt updatedAt remark companyFollowups logs leadOwner')
      .populate({
        path: '_job',
        match: { _company: company._id },
        select: 'title displayCompanyName jobType _industry docsRequired',
        populate: { path: '_industry', select: 'name' },
      })
      .populate({ path: 'leadOwner', select: 'name' })
      .populate({ path: 'logs.user', select: 'name' })
      .lean();
    if (applicationId && !applications.length) return res.status(404).json({ message: 'Application not found.' });

    const hiring = await HiringStatus.findOne({ company: company._id, candidate: candidateId, isDeleted: false })
      .select('status').lean();
    const unlocked = !!hiring || (company.unmasked || []).some(id => String(id) === String(candidateId));
    const model = source === 'profile' ? CandidateProfile : Candidate;
    const candidate = await model.findOne({ _id: candidateId, isDeleted: { $ne: true }, status: { $ne: false } })
      .select('name sex highestQualification totalExperience createdAt personalInfo.currentAddress.city personalInfo.currentAddress.state presentAddress.city presentAddress.state personalInfo.professionalTitle personalInfo.professionalSummary personalInfo.totalExperience personalInfo.resume personalInfo.focalytProfile resume visibility')
      .populate({ path: 'highestQualification', select: 'name' }).lean();
    if (!candidate || (candidate.visibility === false && !unlocked && !applications.length)) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    const documents = [];
    function addDocument(name, value, extra = {}) {
      const url = documentUrl(value);
      documents.push({ name: name || 'Document', url, status: url ? 'Uploaded' : 'Not uploaded', ...extra });
    }
    if (unlocked) {
      for (const resume of candidate.personalInfo?.resume || []) addDocument(resume.name || 'Resume', resume.url, { group: 'Resume' });
      if (candidate.resume) addDocument('Resume', candidate.resume, { group: 'Resume' });
      if (candidate.personalInfo?.focalytProfile) addDocument('Focalyt profile', candidate.personalInfo.focalytProfile, { group: 'Resume' });
      for (const application of applications) {
        // Only job records belonging to this company can contribute documents.
        if (!application._job) continue;
        const group = application._job.title || 'Job application';
        if (application.resume) addDocument('Application resume', application.resume, { group });
        const uploaded = Array.isArray(application.documents) ? application.documents : [];
        const required = (application._job.docsRequired || []).filter(doc => doc.status !== false);
        const used = new Set();
        for (const requiredDoc of required) {
          const index = uploaded.findIndex(doc => String(doc.key) === String(requiredDoc._id)
            || String(doc.name || '').trim().toLowerCase() === String(requiredDoc.Name || '').trim().toLowerCase());
          if (index !== -1) used.add(index);
          addDocument(requiredDoc.Name, uploaded[index]?.fileUrl, { group, mandatory: !!requiredDoc.mandatory });
        }
        uploaded.forEach((doc, index) => {
          if (!used.has(index)) addDocument(doc.name, doc.fileUrl, { group });
        });
      }
    }
    const application = applications[0] || null;
    const address = candidate.personalInfo?.currentAddress || candidate.presentAddress || {};
    const job = application?._job || null;
    const logs = Array.isArray(application?.logs) ? application.logs : [];
    const lastLog = logs.length ? logs[logs.length - 1] : null;
    const now = new Date();
    const nextFollowup = (application?.companyFollowups || [])
      .filter((item) => item?.status === 'planned' && item.followupDate && new Date(item.followupDate) >= now)
      .sort((a, b) => new Date(a.followupDate) - new Date(b.followupDate))[0];
    const createdAt = application?.createdAt || candidate.createdAt;

    return res.json({
      lead: {
        leadAge: leadAgeFrom(createdAt),
        state: textValue(address.state),
        city: textValue(address.city),
        typeOfProject: textValue(job?.jobType),
        project: textValue(job?.displayCompanyName || company.name),
        sector: textValue(job?._industry?.name),
        courseJobName: textValue(job?.title),
        branchName: 'N/A',
        nextActionDate: formatLeadDate(nextFollowup?.followupDate),
        leadCreationDate: formatLeadDate(application?.createdAt || candidate.createdAt),
        remarks: textValue(application?.remark),
        aiRemark: 'N/A',
        leadModificationDate: formatLeadDate(application?.updatedAt),
        leadModificationBy: textValue(lastLog?.user?.name),
        counsellorName: 'N/A',
        leadOwner: textValue(application?.leadOwner?.name),
      },
      profile: {
        name: candidate.name || 'Candidate', gender: candidate.sex || 'Not specified',
        qualification: candidate.highestQualification?.name || 'Not specified',
        experience: candidate.totalExperience || candidate.personalInfo?.totalExperience || 0,
        title: unlocked ? candidate.personalInfo?.professionalTitle || '' : '',
        summary: unlocked ? candidate.personalInfo?.professionalSummary || '' : '',
        stage: hiring?.status || (applications.length ? 'Interested' : 'Not shortlisted'),
      },
      documentsLocked: !unlocked,
      documents,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load candidate details. Please try again.' });
  }
};
