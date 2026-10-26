const MetaAd = require('../../controllers/models/metaAd');
const MetaForm = require('../../controllers/models/metaForm');
const MetaFormMapping = require('../../controllers/models/metaFormMapping');
const Project = require('../../controllers/models/Project');
const Course = require('../../controllers/models/courses');
const Vacancy = require('../../controllers/models/vacancy');
const College = require('../../controllers/models/college');
const Source = require('../../controllers/models/source');
const Status = require('../../controllers/models/status');
const B2cStatusAssignment = require('../../controllers/models/b2cStatusAssignment');

const OBJECT_ID = /^[a-fA-F0-9]{24}$/;
const META_ID = /^\d{1,32}$/;
const FORBIDDEN_FIELDS = ['accessToken', 'access_token', 'pageAccessToken', 'appSecret'];
const CRM_FIELDS = ['leadSource', 'defaultStatus', 'defaultSubstatus'];

class MetaMappingError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'MetaMappingError';
    this.code = code;
    this.status = status;
  }
}

function mappingError(code, message, status) {
  return new MetaMappingError(code, message, status);
}

function idString(value) {
  if (!value) return '';
  if (value._id) return String(value._id);
  return String(value);
}

function isObjectId(value) {
  return OBJECT_ID.test(String(value || ''));
}

function isMetaId(value) {
  return META_ID.test(String(value || '').trim());
}

function visible(doc, collegeId) {
  if (!collegeId || !doc || !doc.college) return true;
  return idString(doc.college) === idString(collegeId);
}

function collegeClause(collegeId) {
  if (!collegeId) return {};
  return {
    $or: [
      { college: collegeId },
      { college: null },
      { college: { $exists: false } },
    ],
  };
}

function formKey(pageId, formId) {
  return `${pageId}:${formId}`;
}

function byId(rows) {
  const map = new Map();
  (rows || []).forEach(row => map.set(idString(row._id), row));
  return map;
}

function createMongooseRepository() {
  return {
    async findMappableForm(pageId, formId) {
      const [ads, form] = await Promise.all([
        MetaAd.find({ pageId, formId }).select('discoveryStatus formName formStatus').lean(),
        MetaForm.findOne({ pageId, formId }).select('formName formStatus').lean(),
      ]);
      const leadAd = ads.find(ad => ad.discoveryStatus === 'lead_form_found');
      if (leadAd || form) {
        return {
          blocked: false,
          formName: (form && form.formName) || (leadAd && leadAd.formName) || '',
          formStatus: (form && form.formStatus) || (leadAd && leadAd.formStatus) || '',
        };
      }
      if (ads.length) return { blocked: true };
      return null;
    },
    async listMappableForms() {
      const [ads, forms] = await Promise.all([
        MetaAd.find({
          discoveryStatus: 'lead_form_found',
          pageId: { $ne: '' },
          formId: { $ne: '' },
        }).select('pageId formId formName').lean(),
        MetaForm.find({ pageId: { $ne: '' }, formId: { $ne: '' } })
          .select('pageId formId formName').lean(),
      ]);
      const map = new Map();
      forms.forEach((form) => {
        map.set(formKey(form.pageId, form.formId), {
          pageId: form.pageId,
          formId: form.formId,
          formName: form.formName || '',
        });
      });
      ads.forEach((ad) => {
        const key = formKey(ad.pageId, ad.formId);
        if (!map.has(key)) {
          map.set(key, { pageId: ad.pageId, formId: ad.formId, formName: ad.formName || '' });
        }
      });
      return [...map.values()];
    },
    async findFormLabels(pairs) {
      if (!pairs.length) return [];
      const or = pairs.map(pair => ({ pageId: pair.pageId, formId: pair.formId }));
      const [forms, ads] = await Promise.all([
        MetaForm.find({ $or: or }).select('pageId formId formName').lean(),
        MetaAd.find({ $or: or, discoveryStatus: 'lead_form_found' })
          .select('pageId formId formName').lean(),
      ]);
      const map = new Map();
      ads.forEach(ad => map.set(formKey(ad.pageId, ad.formId), ad.formName || ''));
      forms.forEach(form => map.set(formKey(form.pageId, form.formId), form.formName || ''));
      return [...map.entries()].map(([key, formName]) => {
        const [pageId, formId] = key.split(':');
        return { pageId, formId, formName };
      });
    },
    async findProject(id) {
      if (!isObjectId(id)) return null;
      return Project.findById(id).select('name college').lean();
    },
    async findProjectsByIds(ids) {
      const unique = [...new Set(ids.map(idString).filter(isObjectId))];
      if (!unique.length) return [];
      return Project.find({ _id: { $in: unique } }).select('name college').lean();
    },
    async projectIdsForCollege(collegeId) {
      const rows = await Project.find(collegeClause(collegeId)).select('_id').lean();
      return rows.map(row => row._id);
    },
    async findCourse(id) {
      if (!isObjectId(id)) return null;
      return Course.findOne({ _id: id, isDeleted: { $ne: true } })
        .select('name project college').lean();
    },
    async findCoursesByIds(ids) {
      const unique = [...new Set(ids.map(idString).filter(isObjectId))];
      if (!unique.length) return [];
      return Course.find({ _id: { $in: unique } }).select('name project college').lean();
    },
    async listCourses(collegeId) {
      return Course.find({
        isDeleted: { $ne: true },
        ...collegeClause(collegeId),
      }).select('name project college').sort({ name: 1 }).limit(300).lean();
    },
    async courseIdsForCollege(collegeId) {
      const rows = await Course.find({
        isDeleted: { $ne: true },
        ...collegeClause(collegeId),
      }).select('_id').lean();
      return rows.map(row => row._id);
    },
    async hrIdsForCollege(collegeId) {
      if (!collegeId || !isObjectId(collegeId)) return [];
      const college = await College.findById(collegeId).select('_concernPerson').lean();
      return ((college && college._concernPerson) || [])
        .map(person => person && person._id)
        .filter(Boolean);
    },
    async findJob(id) {
      if (!isObjectId(id)) return null;
      return Vacancy.findById(id).select('title displayCompanyName _company hr status').lean();
    },
    async findJobsByIds(ids) {
      const unique = [...new Set(ids.map(idString).filter(isObjectId))];
      if (!unique.length) return [];
      return Vacancy.find({ _id: { $in: unique } })
        .select('title displayCompanyName _company hr status').lean();
    },
    async listJobs(collegeId) {
      const hrIds = await this.hrIdsForCollege(collegeId);
      if (collegeId && !hrIds.length) return [];
      const filter = { status: { $ne: false } };
      if (hrIds.length) filter.hr = { $in: hrIds };
      return Vacancy.find(filter)
        .select('title displayCompanyName _company hr status')
        .sort({ title: 1 })
        .limit(300)
        .lean();
    },
    async jobIdsForCollege(collegeId) {
      const rows = await this.listJobs(collegeId);
      return rows.map(row => row._id);
    },
    async findSource(id) {
      if (!isObjectId(id)) return null;
      return Source.findById(id).select('name status').lean();
    },
    async findSourcesByIds(ids) {
      const unique = [...new Set(ids.map(idString).filter(isObjectId))];
      if (!unique.length) return [];
      return Source.find({ _id: { $in: unique } }).select('name status').lean();
    },
    async listLeadSources() {
      return Source.find({ status: { $ne: false } }).select('name status').sort({ name: 1 }).lean();
    },
    async findStatus(id) {
      if (!isObjectId(id)) return null;
      return Status.findById(id).select('title substatuses college').lean();
    },
    async findStatusesByIds(ids) {
      const unique = [...new Set(ids.map(idString).filter(isObjectId))];
      if (!unique.length) return [];
      return Status.find({ _id: { $in: unique } }).select('title substatuses college').lean();
    },
    async listStatuses(collegeId) {
      return Status.find(collegeClause(collegeId)).select('title substatuses college').lean();
    },
    async findAssignment(projectId, statusId) {
      return B2cStatusAssignment.findOne({ project: projectId, status: statusId })
        .select('status substatuses').lean();
    },
    async projectHasAssignments(projectId) {
      const row = await B2cStatusAssignment.exists({ project: projectId });
      return Boolean(row);
    },
    async listAssignments(projectId) {
      return B2cStatusAssignment.find({ project: projectId }).select('status substatuses').lean();
    },
    async findByForm(pageId, formId) {
      return MetaFormMapping.findOne({ pageId, formId }).lean();
    },
    async findById(id) {
      if (!isObjectId(id)) return null;
      return MetaFormMapping.findById(id).lean();
    },
    async listAllFormKeys() {
      return MetaFormMapping.find({}).select('pageId formId isActive').lean();
    },
    async create(doc) {
      const saved = await MetaFormMapping.create(doc);
      return saved.toObject();
    },
    async update(id, patch) {
      const update = {};
      if (patch && (patch.$set || patch.$unset)) {
        if (patch.$set) update.$set = patch.$set;
        if (patch.$unset) update.$unset = patch.$unset;
      } else {
        update.$set = patch;
      }
      return MetaFormMapping.findByIdAndUpdate(id, update, { new: true }).lean();
    },
    async list(filter, skip, limit) {
      const [total, rows] = await Promise.all([
        MetaFormMapping.countDocuments(filter),
        MetaFormMapping.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit)
          .lean(),
      ]);
      return { total, rows };
    },
  };
}

function rejectForbidden(body) {
  FORBIDDEN_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      throw mappingError('invalid_request', 'Mapping requests cannot include credentials.', 400);
    }
  });
}

function requireObjectId(value, label) {
  if (!isObjectId(value)) {
    throw mappingError('invalid_identifier', `${label} must be an existing CRM id.`, 400);
  }
  return String(value);
}

function readCrmFields(body, { required }) {
  const result = {};
  CRM_FIELDS.forEach((field) => {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      if (required) {
        throw mappingError('invalid_request', `${field} is required.`, 400);
      }
      return;
    }
    result[field] = requireObjectId(body[field], field);
  });
  return result;
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function readTarget(body, { required }) {
  if (hasValue(body.projectId)) {
    throw mappingError(
      'project_not_used',
      'Choose a course or a job. A Meta applicant is not stored against a project.',
      400,
    );
  }
  const hasCourse = hasValue(body.courseId);
  const hasJob = hasValue(body.jobId);
  const mentioned = Object.prototype.hasOwnProperty.call(body, 'courseId')
    || Object.prototype.hasOwnProperty.call(body, 'jobId');
  if (!mentioned && !required) return null;
  if (hasCourse && hasJob) {
    throw mappingError('target_conflict', 'Choose a course or a job, not both.', 400);
  }
  if (!hasCourse && !hasJob) {
    if (!required) return null;
    throw mappingError('target_required', 'Choose a course or a job.', 400);
  }
  if (hasCourse) {
    return { courseId: requireObjectId(body.courseId, 'courseId'), jobId: null };
  }
  return { jobId: requireObjectId(body.jobId, 'jobId'), courseId: null };
}

function jobLabel(job) {
  if (!job) return '';
  const title = typeof job.title === 'string' ? job.title.trim() : '';
  if (title) return title;
  return typeof job.displayCompanyName === 'string' ? job.displayCompanyName.trim() : '';
}

function parsePage(query) {
  const source = query || {};
  const page = source.page === undefined || source.page === '' ? 1 : Number(source.page);
  const limit = source.limit === undefined || source.limit === '' ? 20 : Number(source.limit);
  if (!Number.isInteger(page) || page < 1) {
    throw mappingError('invalid_query', 'page must be a positive integer.', 400);
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw mappingError('invalid_query', 'limit must be an integer from 1 to 100.', 400);
  }
  return { page, limit, skip: (page - 1) * limit };
}

function present(mapping, names) {
  return {
    id: idString(mapping._id),
    pageId: mapping.pageId,
    formId: mapping.formId,
    formName: names.formName || '',
    targetType: mapping.jobId ? 'job' : 'course',
    courseId: idString(mapping.courseId),
    courseName: names.courseName || '',
    jobId: idString(mapping.jobId),
    jobName: names.jobName || '',
    leadSourceId: idString(mapping.leadSource),
    leadSource: names.leadSource || '',
    defaultStatusId: idString(mapping.defaultStatus),
    defaultStatus: names.defaultStatus || '',
    defaultSubstatusId: idString(mapping.defaultSubstatus),
    defaultSubstatus: names.defaultSubstatus || '',
    isActive: mapping.isActive !== false,
    createdAt: mapping.createdAt || null,
    updatedAt: mapping.updatedAt || null,
  };
}

function substatusTitle(status, substatusId) {
  if (!status) return '';
  const match = (status.substatuses || []).find(sub => idString(sub._id) === String(substatusId));
  return match ? match.title : '';
}

function createMappingService(repository = createMongooseRepository()) {
  async function assertDiscoveredForm(pageId, formId) {
    const page = String(pageId || '').trim();
    const form = String(formId || '').trim();
    if (!isMetaId(page) || !isMetaId(form)) {
      throw mappingError(
        'invalid_identifier',
        'Page ID and Form ID must be numeric Meta identifiers.',
        400,
      );
    }
    const found = await repository.findMappableForm(page, form);
    if (found && found.blocked) {
      throw mappingError(
        'form_not_mappable',
        'Only a discovered lead form can be mapped. Unresolved or non-lead ads cannot.',
        400,
      );
    }
    if (!found) {
      throw mappingError(
        'form_not_found',
        'This lead form was not found in the synchronized Meta records.',
        404,
      );
    }
    return { pageId: page, formId: form, formName: found.formName || '' };
  }

  async function loadSelection(input, collegeId) {
    const hasCourse = Boolean(input.courseId);
    const hasJob = Boolean(input.jobId);
    if (hasCourse && hasJob) {
      throw mappingError('target_conflict', 'Choose a course or a job, not both.', 400);
    }
    if (!hasCourse && !hasJob) {
      throw mappingError('target_required', 'Choose a course or a job.', 400);
    }
    let course = null;
    let job = null;
    if (hasCourse) {
      course = await repository.findCourse(input.courseId);
      if (!course || !visible(course, collegeId)) {
        throw mappingError('course_not_found', 'The selected course was not found.', 400);
      }
    } else {
      job = await repository.findJob(input.jobId);
      if (!job || job.status === false) {
        throw mappingError('job_not_found', 'The selected job was not found.', 400);
      }
      if (collegeId) {
        const hrIds = (await repository.hrIdsForCollege(collegeId)).map(idString);
        if (!hrIds.includes(idString(job.hr))) {
          throw mappingError('job_not_found', 'The selected job was not found.', 400);
        }
      }
    }
    const source = await repository.findSource(input.leadSource);
    if (!source) {
      throw mappingError('lead_source_not_found', 'The selected lead source was not found.', 400);
    }
    if (source.status === false) {
      throw mappingError('lead_source_inactive', 'The selected lead source is inactive.', 400);
    }
    const status = await repository.findStatus(input.defaultStatus);
    if (!status || !visible(status, collegeId)) {
      throw mappingError('status_not_found', 'The selected status was not found.', 400);
    }
    const substatus = (status.substatuses || []).find(
      sub => idString(sub._id) === String(input.defaultSubstatus),
    );
    if (!substatus) {
      throw mappingError(
        'substatus_not_found',
        'The selected substatus does not belong to the selected status.',
        400,
      );
    }
    return {
      course, job, source, status, substatus,
    };
  }

  async function namesFor(rows) {
    const [courses, jobs, sources, statuses, labels] = await Promise.all([
      repository.findCoursesByIds(rows.map(row => row.courseId)),
      repository.findJobsByIds(rows.map(row => row.jobId)),
      repository.findSourcesByIds(rows.map(row => row.leadSource)),
      repository.findStatusesByIds(rows.map(row => row.defaultStatus)),
      repository.findFormLabels(rows.map(row => ({ pageId: row.pageId, formId: row.formId }))),
    ]);
    const courseMap = byId(courses);
    const jobMap = byId(jobs);
    const sourceMap = byId(sources);
    const statusMap = byId(statuses);
    const labelMap = new Map(labels.map(label => [
      formKey(label.pageId, label.formId),
      label.formName,
    ]));
    return rows.map((row) => {
      const status = statusMap.get(idString(row.defaultStatus));
      return present(row, {
        formName: labelMap.get(formKey(row.pageId, row.formId)) || '',
        courseName: (courseMap.get(idString(row.courseId)) || {}).name || '',
        jobName: jobLabel(jobMap.get(idString(row.jobId))),
        leadSource: (sourceMap.get(idString(row.leadSource)) || {}).name || '',
        defaultStatus: status ? status.title : '',
        defaultSubstatus: substatusTitle(status, row.defaultSubstatus),
      });
    });
  }

  function namesFromSelection(form, selection) {
    return {
      formName: form.formName || '',
      courseName: selection.course ? selection.course.name : '',
      jobName: jobLabel(selection.job),
      leadSource: selection.source.name,
      defaultStatus: selection.status.title,
      defaultSubstatus: selection.substatus.title,
    };
  }

  async function ownedMapping(id, collegeId) {
    if (!isObjectId(id)) {
      throw mappingError('mapping_not_found', 'The form mapping was not found.', 404);
    }
    const mapping = await repository.findById(id);
    if (!mapping) {
      throw mappingError('mapping_not_found', 'The form mapping was not found.', 404);
    }
    if (collegeId && mapping.collegeId && idString(mapping.collegeId) !== idString(collegeId)) {
      throw mappingError('mapping_not_found', 'The form mapping was not found.', 404);
    }
    if (collegeId && !mapping.collegeId && mapping.courseId) {
      const course = await repository.findCourse(mapping.courseId);
      if (course && !visible(course, collegeId)) {
        throw mappingError('mapping_not_found', 'The form mapping was not found.', 404);
      }
    }
    if (collegeId && !mapping.collegeId && mapping.jobId) {
      const job = await repository.findJob(mapping.jobId);
      const hrIds = (await repository.hrIdsForCollege(collegeId)).map(idString);
      if (job && !hrIds.includes(idString(job.hr))) {
        throw mappingError('mapping_not_found', 'The form mapping was not found.', 404);
      }
    }
    return mapping;
  }

  async function listMappings(query, actor = {}) {
    const parsed = parsePage(query);
    const source = query || {};
    const filter = {};
    if (source.pageId) {
      if (!isMetaId(source.pageId)) {
        throw mappingError('invalid_identifier', 'pageId must be a numeric Meta identifier.', 400);
      }
      filter.pageId = String(source.pageId).trim();
    }
    if (source.formId) {
      if (!isMetaId(source.formId)) {
        throw mappingError('invalid_identifier', 'formId must be a numeric Meta identifier.', 400);
      }
      filter.formId = String(source.formId).trim();
    }
    if (source.projectId) filter.projectId = requireObjectId(source.projectId, 'projectId');
    if (source.courseId) filter.courseId = requireObjectId(source.courseId, 'courseId');
    if (source.isActive !== undefined && source.isActive !== '') {
      const flag = source.isActive;
      const allowed = flag === true || flag === false || flag === 'true' || flag === 'false';
      if (!allowed) {
        throw mappingError('invalid_query', 'isActive must be true or false.', 400);
      }
      filter.isActive = flag === true || flag === 'true';
    }
    if (actor.collegeId) {
      const [courseIds, jobIds, legacyProjects] = await Promise.all([
        repository.courseIdsForCollege(actor.collegeId),
        repository.jobIdsForCollege(actor.collegeId),
        repository.projectIdsForCollege(actor.collegeId),
      ]);
      filter.$and = [...(filter.$and || []), {
        $or: [
          { collegeId: actor.collegeId },
          { courseId: { $in: courseIds } },
          { jobId: { $in: jobIds } },
          { projectId: { $in: legacyProjects } },
        ],
      }];
    }
    const result = await repository.list(filter, parsed.skip, parsed.limit);
    const mappings = await namesFor(result.rows);
    return {
      success: true,
      page: parsed.page,
      limit: parsed.limit,
      total: result.total,
      mappings,
    };
  }

  async function unmappedForms(query) {
    const parsed = parsePage(query);
    const source = query || {};
    let forms = await repository.listMappableForms();
    if (source.pageId) forms = forms.filter(form => form.pageId === String(source.pageId));
    if (source.formId) forms = forms.filter(form => form.formId === String(source.formId));
    const existing = await repository.listAllFormKeys();
    const active = new Set(
      existing.filter(row => row.isActive !== false).map(row => formKey(row.pageId, row.formId)),
    );
    const inactive = new Map(
      existing.filter(row => row.isActive === false).map(row => [
        formKey(row.pageId, row.formId),
        row,
      ]),
    );
    const openForms = forms.filter(form => !active.has(formKey(form.pageId, form.formId)));
    const rows = openForms.map((form) => {
      const previous = inactive.get(formKey(form.pageId, form.formId));
      return {
        pageId: form.pageId,
        formId: form.formId,
        formName: form.formName || '',
        mappingId: previous ? idString(previous._id) : null,
        inactiveMapping: Boolean(previous),
      };
    });
    return {
      success: true,
      page: parsed.page,
      limit: parsed.limit,
      total: rows.length,
      forms: rows.slice(parsed.skip, parsed.skip + parsed.limit),
    };
  }

  async function createMapping(body, actor = {}) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw mappingError('invalid_request', 'A mapping body is required.', 400);
    }
    rejectForbidden(body);
    const discovered = await assertDiscoveredForm(body.pageId, body.formId);
    const fields = readCrmFields(body, { required: true });
    const target = readTarget(body, { required: true });
    const selection = await loadSelection({ ...fields, ...target }, actor.collegeId);
    const existing = await repository.findByForm(discovered.pageId, discovered.formId);
    if (existing) {
      const message = existing.isActive === false
        ? 'This lead form already has an inactive mapping. Reactivate it instead of creating another.'
        : 'This lead form already has a mapping.';
      throw mappingError('duplicate_mapping', message, 409);
    }
    let saved;
    try {
      saved = await repository.create({
        pageId: discovered.pageId,
        formId: discovered.formId,
        collegeId: actor.collegeId || null,
        courseId: target.courseId || undefined,
        jobId: target.jobId || undefined,
        leadSource: fields.leadSource,
        defaultStatus: fields.defaultStatus,
        defaultSubstatus: fields.defaultSubstatus,
        isActive: body.isActive !== false,
        createdBy: actor.userId || null,
        updatedBy: actor.userId || null,
      });
    } catch (error) {
      if (error && error.code === 11000) {
        throw mappingError('duplicate_mapping', 'This lead form already has a mapping.', 409);
      }
      throw error;
    }
    return {
      success: true,
      mapping: present(saved, namesFromSelection(discovered, selection)),
    };
  }

  async function getMapping(id, actor = {}) {
    const mapping = await ownedMapping(id, actor.collegeId);
    const [view] = await namesFor([mapping]);
    return { success: true, mapping: view };
  }

  async function updateMapping(id, body, actor = {}) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw mappingError('invalid_request', 'A mapping body is required.', 400);
    }
    rejectForbidden(body);
    const current = await ownedMapping(id, actor.collegeId);
    if (body.pageId !== undefined && String(body.pageId) !== current.pageId) {
      throw mappingError('mapping_key_immutable', 'Page ID cannot be changed.', 400);
    }
    if (body.formId !== undefined && String(body.formId) !== current.formId) {
      throw mappingError('mapping_key_immutable', 'Form ID cannot be changed.', 400);
    }
    const fields = readCrmFields(body, { required: false });
    const target = readTarget(body, { required: false });
    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      throw mappingError('invalid_request', 'isActive must be true or false.', 400);
    }
    const merged = {
      ...current,
      ...fields,
      isActive: body.isActive === undefined ? current.isActive !== false : body.isActive,
    };
    if (target) {
      merged.courseId = target.courseId;
      merged.jobId = target.jobId;
    }
    const touchesCrm = CRM_FIELDS.some(field => Object.prototype.hasOwnProperty.call(body, field)) || Boolean(target);
    let selection = null;
    if (merged.isActive || touchesCrm) {
      selection = await loadSelection(merged, actor.collegeId);
    }
    const set = { updatedBy: actor.userId || null, ...fields };
    const unset = {};
    if (actor.collegeId) set.collegeId = actor.collegeId;
    if (body.isActive !== undefined) set.isActive = body.isActive;
    if (target && target.courseId) {
      set.courseId = target.courseId;
      unset.jobId = '';
      unset.projectId = '';
    }
    if (target && target.jobId) {
      set.jobId = target.jobId;
      unset.courseId = '';
      unset.projectId = '';
    }
    const saved = await repository.update(current._id, { $set: set, $unset: unset });
    const form = await repository.findMappableForm(saved.pageId, saved.formId);
    const view = selection
      ? present(saved, namesFromSelection(form || {}, selection))
      : (await namesFor([saved]))[0];
    return { success: true, mapping: view };
  }

  async function deactivateMapping(id, actor = {}) {
    return updateMapping(id, { isActive: false }, actor);
  }

  async function mappingOptions(_query, actor = {}) {
    const [leadSourceRows, courseRows, jobRows, statusRows] = await Promise.all([
      repository.listLeadSources(),
      repository.listCourses(actor.collegeId),
      repository.listJobs(actor.collegeId),
      repository.listStatuses(actor.collegeId),
    ]);
    return {
      success: true,
      leadSources: leadSourceRows.map(row => ({ id: idString(row._id), name: row.name })),
      courses: courseRows
        .filter(course => visible(course, actor.collegeId) && String(course.name || '').trim())
        .map(course => ({ id: idString(course._id), name: String(course.name).trim() })),
      jobs: jobRows
        .filter(job => jobLabel(job))
        .map(job => ({ id: idString(job._id), name: jobLabel(job) })),
      statuses: statusRows
        .filter(status => visible(status, actor.collegeId))
        .map(status => ({
          id: idString(status._id),
          title: status.title,
          substatuses: (status.substatuses || []).map(sub => ({
            id: idString(sub._id),
            title: sub.title,
          })),
        })),
    };
  }

  async function resolveMetaFormMapping(pageId, formId) {
    const page = String(pageId || '').trim();
    const form = String(formId || '').trim();
    if (!isMetaId(page) || !isMetaId(form)) {
      return {
        ok: false,
        code: 'invalid_identifier',
        message: 'Page ID and Form ID must be numeric Meta identifiers.',
      };
    }
    const mapping = await repository.findByForm(page, form);
    if (!mapping) {
      return {
        ok: false,
        code: 'mapping_not_found',
        message: 'No mapping exists for this lead form.',
      };
    }
    if (mapping.isActive === false) {
      return {
        ok: false,
        code: 'mapping_inactive',
        message: 'The mapping for this lead form is inactive.',
      };
    }
    try {
      const selection = await loadSelection(mapping, null);
      return {
        ok: true,
        mapping: {
          mappingId: idString(mapping._id),
          pageId: mapping.pageId,
          formId: mapping.formId,
          collegeId: idString(mapping.collegeId),
          targetType: selection.job ? 'job' : 'course',
          courseId: selection.course ? idString(selection.course._id) : '',
          courseName: selection.course ? selection.course.name : '',
          jobId: selection.job ? idString(selection.job._id) : '',
          jobName: jobLabel(selection.job),
          leadSourceId: idString(selection.source._id),
          leadSource: selection.source.name,
          statusId: idString(selection.status._id),
          status: selection.status.title,
          substatusId: idString(selection.substatus._id),
          substatus: selection.substatus.title,
        },
      };
    } catch (error) {
      if (error && error.name === 'MetaMappingError') {
        return {
          ok: false,
          code: 'mapping_invalid',
          reason: error.code,
          message: error.message,
        };
      }
      return {
        ok: false,
        code: 'database',
        message: 'The form mapping could not be read.',
      };
    }
  }

  return {
    listMappings,
    unmappedForms,
    createMapping,
    getMapping,
    updateMapping,
    deactivateMapping,
    mappingOptions,
    resolveMetaFormMapping,
  };
}

const defaultMappingService = createMappingService();

module.exports = {
  MetaMappingError,
  createMappingService,
  resolveMetaFormMapping: defaultMappingService.resolveMetaFormMapping,
};
