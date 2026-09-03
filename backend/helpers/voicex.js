const axios = require('axios');

const CANCEL_SOURCE = 'Deleted by Client CRM';

function trim(value) {
    return String(value || '').trim();
}

function envFlag(raw, defaultValue = true) {
    if (raw == null || String(raw).trim() === '') return defaultValue;
    return !['false', '0', 'off', 'no'].includes(String(raw).trim().toLowerCase());
}

function getConfig() {
    return {
        makeCallUrl: trim(process.env.XTRME_GEN_Base_URL),
        cancelUrl: trim(process.env.XTRME_GEN_Cancel_URL),
        agentId: trim(process.env.XTRME_GEN_AGENT_ID),
        businessId: trim(process.env.XTRME_GEN_BUSINESS_ID),
        campaignId: trim(process.env.XTRME_GEN_CAMPAIGN_ID),
        callFrom: trim(process.env.XTRME_GEN_CALL_FROM),
        authToken: trim(process.env.XTRME_GEN_AUTH_TOKEN),
        autoCall: envFlag(process.env.XTRME_GEN_AUTO_CALL, true),
        leadStatusTesting: envFlag(process.env.XTRME_GEN_LEAD_STATUS_TESTING, true),
    };
}

function isAutoCallEnabled() {
    return getConfig().autoCall;
}

function isLeadStatusTesting() {
    return getConfig().leadStatusTesting;
}

function buildAuthHeader(token) {
    const value = trim(token);
    if (!value) return '';
    if (/^basic\s+/i.test(value)) return value;
    if (value.includes(':')) {
        return `Basic ${Buffer.from(value).toString('base64')}`;
    }
    return `Basic ${value}`;
}

function toE164(mobile) {
    const raw = String(mobile || '').trim();
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (raw.startsWith('+') && digits.length >= 10) return `+${digits}`;
    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`;
    return `+${digits}`;
}

function isConfigured() {
    const cfg = getConfig();
    return Boolean(cfg.authToken && cfg.businessId && cfg.campaignId && cfg.makeCallUrl);
}

function configError() {
    const cfg = getConfig();
    if (!cfg.authToken) {
        const err = new Error('XTRME_GEN_AUTH_TOKEN is not set');
        err.code = 'VOICEX_AUTH_MISSING';
        return err;
    }
    if (!cfg.businessId || !cfg.campaignId) {
        const err = new Error('XTRME_GEN_BUSINESS_ID or XTRME_GEN_CAMPAIGN_ID is missing');
        err.code = 'VOICEX_CONFIG_MISSING';
        return err;
    }
    if (!cfg.makeCallUrl) {
        const err = new Error('XTRME_GEN_Base_URL is not set');
        err.code = 'VOICEX_CONFIG_MISSING';
        return err;
    }
    return null;
}

function preferredLanguage(candidate) {
    const langs = candidate?.personalInfo?.languages;
    if (Array.isArray(langs) && langs[0]?.name) return String(langs[0].name);
    return '';
}

function buildCustomField({ applied, candidate, course, center, source }) {
    const name = trim(candidate?.name);
    const mobile = String(candidate?.mobile || '').replace(/\D/g, '').slice(-10);
    return {
        lead_id: String(applied?._id || ''),
        Name: name,
        full_name: name,
        lead_name: name,
        contact_number: mobile,
        email: trim(candidate?.email),
        preferred_language: preferredLanguage(candidate),
        venue_address: trim(center?.name),
        centre: trim(center?.name),
        course_name: trim(course?.name),
        lead_source: trim(source) || 'Digital Lead',
    };
}

function axiosErrorMessage(err) {
    const data = err?.response?.data;
    if (typeof data === 'string' && data.trim()) return data.trim().slice(0, 500);
    if (data && typeof data === 'object') {
        return data.message || data.msg || data.error || JSON.stringify(data).slice(0, 500);
    }
    return err?.message || 'VoiceX request failed';
}

async function makeCall({ callTo, customField, callInitTime, agentId, callFrom } = {}) {
    const missing = configError();
    if (missing) throw missing;

    const cfg = getConfig();
    const e164 = toE164(callTo);
    if (!e164) {
        const err = new Error('Valid callTo phone number is required');
        err.code = 'VOICEX_PHONE_INVALID';
        throw err;
    }

    const payload = {
        callTo: e164,
        businessId: cfg.businessId,
        campaignId: cfg.campaignId,
        custom_field: customField && typeof customField === 'object' ? customField : {},
    };
    const agent = trim(agentId) || cfg.agentId;
    if (agent) payload.agentId = agent;
    const from = trim(callFrom) || cfg.callFrom;
    if (from) payload.callFrom = from;
    if (callInitTime) payload.callInitTime = callInitTime;

    const res = await axios.post(cfg.makeCallUrl, payload, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: buildAuthHeader(cfg.authToken),
        },
        timeout: 20000,
    });

    return { payload, data: res.data, status: res.status };
}

async function cancelCall({ phoneNumber } = {}) {
    const missing = configError();
    if (missing) throw missing;

    const cfg = getConfig();
    if (!cfg.cancelUrl) {
        const err = new Error('XTRME_GEN_Cancel_URL is not set');
        err.code = 'VOICEX_CONFIG_MISSING';
        throw err;
    }

    const phone = toE164(phoneNumber) || trim(phoneNumber);
    if (!phone) {
        const err = new Error('phoneNumber is required');
        err.code = 'VOICEX_PHONE_INVALID';
        throw err;
    }

    const payload = {
        phoneNumber: phone,
        businessId: cfg.businessId,
        campaignId: cfg.campaignId,
        source: CANCEL_SOURCE,
    };

    const res = await axios.post(cfg.cancelUrl, payload, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: buildAuthHeader(cfg.authToken),
        },
        timeout: 20000,
    });

    return { payload, data: res.data, status: res.status };
}

module.exports = {
    CANCEL_SOURCE,
    getConfig,
    isConfigured,
    isAutoCallEnabled,
    isLeadStatusTesting,
    toE164,
    buildCustomField,
    axiosErrorMessage,
    makeCall,
    cancelCall,
};
