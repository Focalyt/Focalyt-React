const LEAD_CTA_TYPES = new Set([
  'APPLY_NOW',
  'DOWNLOAD',
  'GET_OFFER',
  'GET_QUOTE',
  'SIGN_UP',
  'SUBSCRIBE',
]);

function isNumericId(value) {
  if (value == null) return false;
  return /^\d+$/.test(String(value).trim());
}

function onlyValue(values) {
  if (!values || values.size !== 1) return '';
  return [...values][0];
}

function addStoryPageId(value, pageIds) {
  if (typeof value !== 'string') return;
  const match = value.trim().match(/^(\d+)_\d+$/);
  if (match) pageIds.add(match[1]);
}

function collectCreative(creative) {
  const found = {
    formIds: new Set(),
    pageIds: new Set(),
    missingFormReference: false,
    sawLeadCta: false,
  };

  function walk(node, depth) {
    if (!node || depth > 8) return;
    if (Array.isArray(node)) {
      node.forEach(item => walk(item, depth + 1));
      return;
    }
    if (typeof node !== 'object') return;

    Object.keys(node).forEach((key) => {
      const value = node[key];
      if (key === 'lead_gen_form_id') {
        if (isNumericId(value)) found.formIds.add(String(value).trim());
        else found.missingFormReference = true;
        return;
      }
      if (key === 'page_id' && isNumericId(value)) {
        found.pageIds.add(String(value).trim());
        return;
      }
      if (key === 'object_story_id') {
        addStoryPageId(value, found.pageIds);
        return;
      }
      if (key === 'type' && LEAD_CTA_TYPES.has(String(value || '').toUpperCase())) {
        found.sawLeadCta = true;
      }
      if (value && typeof value === 'object') walk(value, depth + 1);
    });
  }

  walk(creative, 0);
  return found;
}

function discoverFromCreative(creative) {
  const creativeId = creative && isNumericId(creative.id) ? String(creative.id).trim() : '';
  if (!creative || typeof creative !== 'object') {
    return {
      creativeId,
      pageId: '',
      formId: '',
      discoveryStatus: 'form_unresolved',
      reason: 'missing_creative',
    };
  }

  const state = collectCreative(creative);
  const pageId = onlyValue(state.pageIds);

  if (state.formIds.size > 1) {
    return {
      creativeId,
      pageId,
      formId: '',
      discoveryStatus: 'form_unresolved',
      reason: 'multiple_form_ids',
    };
  }
  if (state.formIds.size === 1) {
    return {
      creativeId,
      pageId,
      formId: onlyValue(state.formIds),
      discoveryStatus: 'lead_form_found',
      reason: '',
    };
  }
  if (state.missingFormReference || state.sawLeadCta) {
    return {
      creativeId,
      pageId,
      formId: '',
      discoveryStatus: 'form_unresolved',
      reason: 'missing_form_id',
    };
  }
  return {
    creativeId,
    pageId,
    formId: '',
    discoveryStatus: 'not_lead_ad',
    reason: '',
  };
}

function creativeNeedsLookup(creative) {
  if (!creative || typeof creative !== 'object') return false;
  if (!isNumericId(creative.id)) return false;
  return !creative.object_story_spec && !creative.asset_feed_spec && !creative.object_story_id;
}

module.exports = {
  discoverFromCreative,
  creativeNeedsLookup,
  isNumericId,
};
