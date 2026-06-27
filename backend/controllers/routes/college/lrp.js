const express = require("express");
const mongoose = require("mongoose");

const { LRP, Lead, LeadCategory, TypeOfB2B, College, StatusB2b, User, Partner } = require("../../models");
const { uploadSinglefile } = require("../functions/images");

const router = express.Router();

const MAX_LRP_GEO_PHOTO_BYTES = 20 * 1024;

const getPartnerTypeOptions = async () => {
  const partners = await Partner.find({ status: { $ne: false } }).sort({ createdAt: -1 }).lean();
  return partners.map((p) => String(p.name || "").trim()).filter(Boolean);
};

const parseLeadSourceQA = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object" && raw !== null && Array.isArray(raw.items)) return raw;
  try {
    const o = typeof raw === "string" ? JSON.parse(raw) : null;
    if (o && Array.isArray(o.items)) return o;
  } catch (_) {
    /* ignore */
  }
  return null;
};

const valueByMetaKey = (items, key) => {
  const it = (items || []).find((x) => x && x.metaKey === key);
  return it ? String(it.value || "").trim() : "";
};

const isValidCalendarDate = (y, m, d) => {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const normalizeQaDateValue = (raw) => {
  const v = String(raw ?? "").trim();
  if (!v) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    return isValidCalendarDate(y, m, d) ? `${iso[1]}-${iso[2]}-${iso[3]}` : v;
  }
  const mdy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (mdy) {
    const m = Number(mdy[1]);
    const d = Number(mdy[2]);
    const y = Number(mdy[3]);
    if (isValidCalendarDate(y, m, d)) {
      return `${mdy[3]}-${mdy[1]}-${mdy[2]}`;
    }
  }
  return v;
};

const isValidQaDateValue = (raw) => {
  const v = String(raw ?? "").trim();
  if (!v) return false;
  const normalized = normalizeQaDateValue(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) && normalized === normalizeQaDateValue(normalized);
};

const buildLrpMetaItems = (body, geoTaggedPhotoUrl, partnerTypeOptions = []) => {
  const v = (k) => String(body[k] ?? "").trim();
  return [
    {
      metaKey: "lrp_partnerType",
      question: "Type of partner",
      type: "radio",
      options: [...partnerTypeOptions],
      required: true,
      value: v("partnerType"),
    },
    {
      metaKey: "lrp_implementationPartnerName",
      question: "Field implementation partner name",
      type: "text",
      options: [],
      required: true,
      value: v("implementationPartnerName"),
    },
    {
      metaKey: "lrp_visitDate",
      question: "Visit date",
      type: "date",
      options: [],
      required: true,
      value: normalizeQaDateValue(v("visitDate")),
    },
    {
      metaKey: "lrp_geoTaggedPhoto",
      question: "Geo-tagged photograph",
      type: "text",
      options: [],
      required: false,
      value: String(geoTaggedPhotoUrl || "").trim(),
    },
    {
      metaKey: "lrp_state",
      question: "State",
      type: "text",
      options: [],
      required: true,
      value: v("state"),
    },
    {
      metaKey: "lrp_district",
      question: "District",
      type: "text",
      options: [],
      required: true,
      value: v("district"),
    },
    {
      metaKey: "lrp_block",
      question: "Block",
      type: "text",
      options: [],
      required: true,
      value: v("block"),
    },
  ];
};

const normalizeQaItem = (it) => {
  const row = {
    question: String(it?.question || "").trim(),
    type: ["text", "number", "radio", "date"].includes(it?.type) ? it.type : "text",
    options: Array.isArray(it?.options) ? it.options.map((o) => String(o || "").trim()).filter(Boolean) : [],
    required: Boolean(it?.required),
    value: String(it?.value ?? "").trim(),
  };
  if (it?.metaKey) row.metaKey = String(it.metaKey).trim();
  if (row.type === "date" && row.value) {
    row.value = normalizeQaDateValue(row.value);
  }
  return row;
};

const validateLeadSourceQA = (qa) => {
  if (!qa || !Array.isArray(qa.items) || qa.items.length === 0) {
    return "leadSourceQA with at least one question is required for this save mode";
  }
  for (let i = 0; i < qa.items.length; i += 1) {
    const it = qa.items[i] || {};
    const label = it.question || `Question ${i + 1}`;
    const val = String(it.value ?? "").trim();
    if (it.required && !val) {
      return `Missing answer: ${label}`;
    }
    if (!val) continue;
    const t =
      it.type === "number"
        ? "number"
        : it.type === "radio"
          ? "radio"
          : it.type === "date"
            ? "date"
            : "text";
    if (t === "number" && Number.isNaN(Number(val))) {
      return `Invalid number for: ${label}`;
    }
    if (t === "date") {
      if (!isValidQaDateValue(val)) return `Invalid date for: ${label}`;
    }
    if (t === "radio" && Array.isArray(it.options) && it.options.length) {
      const ok = it.options.some((o) => String(o).trim() === val);
      if (!ok) return `Invalid option for: ${label}`;
    }
  }
  return null;
};

const extractMobile10 = (body) => {
  const explicit = (body.b2bMobile || "").replace(/\D/g, "");
  if (explicit.length >= 10) return explicit.slice(-10);
  const fromCoord = String(body.coordinatorNameContact || "").replace(/\D/g, "");
  if (fromCoord.length >= 10) return fromCoord.slice(-10);
  const qa = parseLeadSourceQA(body.leadSourceQA);
  if (qa?.items) {
    for (const it of qa.items) {
      if (it.metaKey === "lrp_visitDate" || it.metaKey === "lrp_geoTaggedPhoto") continue;
      const digits = String(it.value || "").replace(/\D/g, "");
      if (digits.length >= 10) return digits.slice(-10);
    }
  }
  return "";
};

const extractEmailFromBody = (body) => {
  const direct = String(body.schoolEmail || "").trim().toLowerCase();
  if (direct && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(direct)) return direct;
  const qa = parseLeadSourceQA(body.leadSourceQA);
  if (qa?.items) {
    for (const it of qa.items) {
      if (it.metaKey) continue;
      const v = String(it.value || "").trim().toLowerCase();
      if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return v;
    }
  }
  return "";
};

const businessNameFromBody = (body) => {
  const qa = parseLeadSourceQA(body.leadSourceQA);
  if (qa?.items) {
    for (const it of qa.items) {
      if (it.metaKey) continue;
      const v = String(it.value || "").trim();
      if (v.length >= 2) return v.slice(0, 200);
    }
  }
  return "School";
};

const concernPersonFromBody = (body) => {
  const qa = parseLeadSourceQA(body.leadSourceQA);
  const qLower = (s) => String(s || "").toLowerCase();
  if (qa?.items) {
    for (const it of qa.items) {
      if (it.metaKey) continue;
      if (/name|person|contact|coordinator|principal|concern/.test(qLower(it.question))) {
        const v = String(it.value || "").trim();
        if (v) return v.slice(0, 200);
      }
    }
    const nonMeta = qa.items.filter((it) => !it.metaKey);
    if (nonMeta.length >= 2) {
      const v = String(nonMeta[1].value || "").trim();
      if (v) return v.slice(0, 200);
    }
    if (nonMeta.length >= 1) {
      const v0 = String(nonMeta[0].value || "").trim();
      if (v0) return v0.slice(0, 200);
    }
  }
  return "Contact";
};

const addressFromBody = (body) => {
  const qa = parseLeadSourceQA(body.leadSourceQA);
  const items = qa?.items || [];
  const parts = [];
  if (items.length) {
    for (const it of items) {
      if (it.metaKey && String(it.metaKey).startsWith("lrp_")) continue;
      const ql = String(it.question || "").toLowerCase();
      if (/address|school|institute|organization|location/.test(ql)) {
        const val = String(it.value || "").trim();
        if (val) parts.push(val);
      }
    }
  }
  const joined = parts.join(", ").trim();
  if (joined) return joined.slice(0, 500);
  return valueByMetaKey(items, "lrp_district") || String(body.district || "").trim();
};

const remarkFromBody = (body) => {
  const direct = String(body.otherRemarks || "").trim();
  if (direct) return direct;
  const qa = parseLeadSourceQA(body.leadSourceQA);
  if (qa?.items) {
    for (const it of [...qa.items].reverse()) {
      if (it.metaKey) continue;
      if (/remark|note|comment|feedback/.test(String(it.question || "").toLowerCase())) {
        return String(it.value || "").trim();
      }
    }
  }
  return "";
};

const isValidIndianMobile = (m) => /^[6-9]\d{9}$/.test(m);

async function createLinkedB2BLead(req, body) {
  try {
    const explicitLeadId = body.b2bLeadId && String(body.b2bLeadId).trim();
    if (explicitLeadId && mongoose.Types.ObjectId.isValid(explicitLeadId)) {
      const existing = await Lead.findById(explicitLeadId).lean();
      if (existing) {
        return { created: false, leadId: explicitLeadId, linked: true, message: "Linked to existing B2B lead." };
      }
      return { created: false, linked: false, message: "Invalid b2bLeadId (lead not found)." };
    }

    let leadCategoryId = body.leadCategory && mongoose.Types.ObjectId.isValid(body.leadCategory)
      ? body.leadCategory
      : null;
    let typeOfB2BId = body.typeOfB2B && mongoose.Types.ObjectId.isValid(body.typeOfB2B)
      ? body.typeOfB2B
      : null;

    if (!leadCategoryId) {
      const cat = await LeadCategory.findOne({ isActive: true }).sort({ createdAt: 1 });
      if (cat) leadCategoryId = cat._id;
    }
    if (!typeOfB2BId) {
      const typ = await TypeOfB2B.findOne({ isActive: true }).sort({ createdAt: 1 });
      if (typ) typeOfB2BId = typ._id;
    }

    if (!leadCategoryId || !typeOfB2BId) {
      return {
        created: false,
        message: "B2B lead skipped: set Lead category & Type of B2B on the form, or add active items in Settings.",
      };
    }

    const mobile = extractMobile10(body);
    if (!isValidIndianMobile(mobile)) {
      return {
        created: false,
        message:
          "B2B lead skipped: valid 10-digit mobile required (use Coordinator field or B2B mobile).",
      };
    }

    const email = extractEmailFromBody(body);
    if (email) {
      const existingLead = await Lead.findOne({
        email,
        leadAddedBy: req.user._id,
      });
      if (existingLead) {
        return {
          created: false,
          message: "B2B lead skipped: a lead with this email already exists for your user.",
        };
      }
    }

    let leadOwnerId = null;
    const lo = body.leadOwner && String(body.leadOwner).trim();
    if (lo) {
      let owner = null;
      if (mongoose.Types.ObjectId.isValid(lo)) {
        owner = await User.findById(lo);
      }
      if (!owner) {
        owner = await User.findOne({
          name: { $regex: new RegExp(`^${lo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        });
      }
      if (owner) leadOwnerId = owner._id;
    }

    const college = await College.findOne({ "_concernPerson._id": req.user._id });

    let defaultStatusId = null;
    let defaultSubStatusId = null;

    if (college) {
      const untouchStatus = await StatusB2b.findOne({
        college: college._id,
        title: { $regex: /^Untouch Leads$/i },
      });

      if (untouchStatus) {
        defaultStatusId = untouchStatus._id;
        if (untouchStatus.substatuses && untouchStatus.substatuses.length > 0) {
          const untouchSub = untouchStatus.substatuses.find(
            (sub) => sub.title && /^Untouch Leads$/i.test(sub.title)
          );
          defaultSubStatusId = untouchSub
            ? untouchSub._id
            : untouchStatus.substatuses[0]._id;
        }
      }
    }

    const businessName = businessNameFromBody(body);
    const concernPersonName = concernPersonFromBody(body);

    const userRemark = remarkFromBody(body);

    const qaItems = parseLeadSourceQA(body.leadSourceQA)?.items || [];
    const leadData = {
      leadCategory: leadCategoryId,
      typeOfB2B: typeOfB2BId,
      businessName,
      address: addressFromBody(body),
      city: valueByMetaKey(qaItems, "lrp_district") || String(body.district || "").trim(),
      state: valueByMetaKey(qaItems, "lrp_state") || String(body.state || "").trim(),
      block: valueByMetaKey(qaItems, "lrp_block") || String(body.block || "").trim(),
      concernPersonName,
      designation: "",
      email: email || undefined,
      mobile,
      leadAddedBy: req.user._id,
      remark: userRemark,
      landlineNumber: body.landlineNumber,
    };

    if (defaultStatusId) {
      leadData.status = defaultStatusId;
      if (defaultSubStatusId) leadData.subStatus = defaultSubStatusId;
    }
    if (leadOwnerId) leadData.leadOwner = leadOwnerId;

    const newLead = new Lead(leadData);
    let savedLead = await newLead.save();

    if (savedLead) {
      savedLead.logs.push({
        user: req.user._id,
        timestamp: new Date(),
        action: "Lead added from LRP form",
        remarks: userRemark || "",
      });
      await savedLead.save();
    }

    return { created: true, lead: savedLead };
  } catch (err) {
    console.error("[LRP] createLinkedB2BLead error:", err);
    return {
      created: false,
      message: err?.message || "B2B lead creation failed",
    };
  }
}

router.get("/by-b2b-lead/:leadId", async (req, res) => {
  try {
    const leadId = String(req.params.leadId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json({ success: false, message: "Invalid leadId" });
    }

    const query = { b2bLeadId: leadId };
    if (req.college?._id) query.college = req.college._id;

    const item = await LRP.findOne(query).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: item || null });
  } catch (err) {
    return res.status(400).json({ success: false, message: err?.message || "Unable to fetch LRP record" });
  }
});

/**
 * Load B2B lead context for the LRP wizard.
 * We intentionally don't apply the strict `leadAddedBy` filter used in B2B CRM,
 * because LRP can be opened from shared/assigned leads too.
 */
router.get("/b2b-lead/:leadId", async (req, res) => {
  try {
    const leadId = String(req.params.leadId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json({ success: false, message: "Invalid leadId" });
    }

    const lead = await Lead.findById(leadId)
      .populate({
        path: "leadCategory",
        select: "name questions isActive b2bDepartment b2bProject typeOfB2B",
        populate: [
          { path: "b2bDepartment", select: "name isActive" },
          {
            path: "b2bProject",
            select: "name department isActive",
            populate: { path: "department", select: "name isActive" },
          },
          {
            path: "typeOfB2B",
            select: "name department isActive",
            populate: { path: "department", select: "name isActive" },
          },
        ],
      })
      .populate("b2bProject", "name")
      .populate("b2bDepartment", "name")
      .populate({
        path: "typeOfB2B",
        select: "name department",
        populate: { path: "department", select: "name" },
      })
      .lean();

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    return res.json({ success: true, data: lead });
  } catch (err) {
    return res.status(400).json({ success: false, message: err?.message || "Unable to fetch lead" });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || "100"), 10) || 100));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      LRP.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LRP.countDocuments({}),
    ]);

    return res.json({
      success: true,
      data: items,
      total,
      page,
      limit,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err?.message || "Unable to fetch LRP records",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    let geoTaggedPhoto = body.geoTaggedPhoto;
    if (req.files && req.files.file) {
      const uploadFile = req.files.file;
      const fileSize = Number(uploadFile.size ?? uploadFile.data?.length ?? 0);
      if (fileSize > MAX_LRP_GEO_PHOTO_BYTES) {
        return res.status(400).json({
          success: false,
          message: "Geo-tagged photo must be 20 KB or smaller.",
        });
      }
      try {
        geoTaggedPhoto = await uploadSinglefile(uploadFile, "lrp");
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: e?.message || "Image upload failed",
        });
      }
    }

    const categoryQA = parseLeadSourceQA(body.leadSourceQA) || {
      items: [],
      categoryId: body.leadCategory,
    };

    const partnerTypeOptions = await getPartnerTypeOptions();
    const metaItems = buildLrpMetaItems(body, geoTaggedPhoto, partnerTypeOptions);
    const categoryItems = (categoryQA.items || []).map(normalizeQaItem);
    const cidRaw = categoryQA.categoryId || body.leadCategory;
    const cid = cidRaw && mongoose.Types.ObjectId.isValid(String(cidRaw)) ? cidRaw : undefined;

    const mergedLeadSourceQA = {
      categoryId: cid,
      items: [...metaItems.map(normalizeQaItem), ...categoryItems],
    };

    const qaErr = validateLeadSourceQA(mergedLeadSourceQA);
    if (qaErr) {
      return res.status(400).json({ success: false, message: qaErr });
    }

    const doc = {
      college: req.college?._id,
      createdBy: req.user?._id,
      b2bLeadId: body.b2bLeadId && mongoose.Types.ObjectId.isValid(body.b2bLeadId) ? body.b2bLeadId : undefined,
      leadSourceQA: mergedLeadSourceQA,
    };

    const created = await LRP.create(doc);

    const b2b = await createLinkedB2BLead(req, { ...body, leadSourceQA: mergedLeadSourceQA });

    // If a new B2B lead was created, link this LRP record to it
    try {
      const createdLeadId = b2b?.lead?._id || b2b?.leadId;
      if (createdLeadId && mongoose.Types.ObjectId.isValid(String(createdLeadId))) {
        await LRP.updateOne({ _id: created._id }, { $set: { b2bLeadId: createdLeadId } });
      }
    } catch (e) {
      // ignore link errors
    }

    return res.status(201).json({
      success: true,
      data: created,
      b2b,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err?.message || "Unable to save LRP lead",
    });
  }
});

module.exports = router;
