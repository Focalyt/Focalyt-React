const mongoose = require('mongoose');

const STAGES = ['shortlisted', 'interview due', 'interviewed', 'on hold',
  'offer letter rollout', 'hiring on hold', 'hired', 'rejected'];
const idOf = value => value?._id || value;
const pairKey = (company, candidate) => `${idOf(company)}:${idOf(candidate)}`;

function serialize(record) {
  if (!record) return null;
  return {
    id: String(record._id), status: record.status || '', comment: record.comment || '',
    eventDate: record.eventDate || null, concernedPerson: record.concernedPerson || '',
    jobId: String(idOf(record.job) || ''), jobTitle: record.job?.title || '',
    updatedAt: record.updatedAt || null,
  };
}

module.exports = function createHrHiring({ HiringStatus, Company, loadAppliedLead }) {
  async function context(req) {
    const collegeId = req.user?.college?._id;
    if (!collegeId || !mongoose.isValidObjectId(req.params.id)) return null;
    const loaded = await loadAppliedLead(req.params.id, collegeId);
    if (!loaded || loaded.apply.isDeleted || loaded.candidate.isDeleted || !loaded.job || loaded.job.isDeleted) return null;
    const companyId = idOf(loaded.apply._company) || idOf(loaded.job._company);
    if (!companyId || !loaded.job._id || !loaded.candidate._id) return null;
    // The application and vacancy must belong to the same company.
    if (loaded.job._company && String(idOf(loaded.job._company)) !== String(companyId)) return null;
    const company = await Company.findOne({ _id: companyId, isDeleted: { $ne: true }, status: { $ne: false } })
      .select('name companyExecutives').lean();
    if (!company) return null;
    return { ...loaded, company, filter: { company: company._id, candidate: loaded.candidate._id, isDeleted: false } };
  }

  async function details(loaded) {
    const record = await HiringStatus.findOne(loaded.filter).populate('job', 'title').lean();
    return {
      hiring: serialize(record),
      company: { id: String(loaded.company._id), name: loaded.company.name || '' },
      job: { id: String(loaded.job._id), title: loaded.job.title || '' },
      executives: (loaded.company.companyExecutives || []).map(person => ({ id: String(person._id), name: person.name || '' })),
      stages: STAGES,
    };
  }

  return {
    async attach(leads) {
      const pairs = new Map();
      leads.forEach(lead => {
        const company = lead.companyId;
        const candidate = lead.candidate;
        if (company && candidate) pairs.set(pairKey(company, candidate), { company, candidate });
      });
      if (!pairs.size) return leads;
      const records = await HiringStatus.find({ isDeleted: false, $or: [...pairs.values()] })
        .select('company candidate status comment eventDate concernedPerson job updatedAt')
        .sort({ updatedAt: -1 }).populate('job', 'title').lean();
      const byPair = new Map();
      records.forEach(record => {
        const key = pairKey(record.company, record.candidate);
        if (!byPair.has(key)) byPair.set(key, serialize(record));
      });
      return leads.map(lead => {
        return { ...lead, corporateHiringStatus: byPair.get(pairKey(lead.companyId, lead.candidate)) || null };
      });
    },
    async get(req, res) {
      res.set('Cache-Control', 'private, no-store');
      try {
        const loaded = await context(req);
        if (!loaded) return res.status(404).json({ success: false, message: 'Job application or company not available.' });
        return res.json({ success: true, data: await details(loaded) });
      } catch (_) {
        return res.status(500).json({ success: false, message: 'Unable to load hiring details.' });
      }
    },
    async update(req, res) {
      const { status, comment = '', eventDate = null, concernedPerson = '' } = req.body || {};
      if (!STAGES.includes(status) || typeof comment !== 'string' || comment.length > 2000
        || typeof concernedPerson !== 'string' || concernedPerson.length > 100
        || (eventDate !== null && (typeof eventDate !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(eventDate)
          || !Number.isFinite(new Date(eventDate).getTime())))) {
        return res.status(400).json({ success: false, message: 'Choose a valid hiring stage, date and comment (maximum 2000 characters).' });
      }
      if (status === 'interview due' && (!eventDate || new Date(eventDate) <= new Date())) {
        return res.status(400).json({ success: false, message: 'Choose a future interview date and time.' });
      }
      try {
        const loaded = await context(req);
        if (!loaded) return res.status(404).json({ success: false, message: 'Job application or company not available.' });
        if (concernedPerson && !(loaded.company.companyExecutives || []).some(person => String(person._id) === concernedPerson)) {
          return res.status(400).json({ success: false, message: 'Select a concerned person from this company.' });
        }
        await HiringStatus.findOneAndUpdate(loaded.filter, { $set: {
          ...loaded.filter, status, comment: comment.trim(), job: loaded.job._id,
          eventDate: eventDate ? new Date(eventDate) : null, concernedPerson, isRejected: status === 'rejected',
        } }, { upsert: true, new: true, runValidators: true });
        return res.json({ success: true, data: await details(loaded) });
      } catch (_) {
        return res.status(500).json({ success: false, message: 'Unable to save hiring details. Reopen the panel to check the latest status.' });
      }
    },
  };
};
