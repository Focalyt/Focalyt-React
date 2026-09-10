const AI_CALL_LINE = /^\s*\[AI Call\]/i;

function splitRemarksAndAi(remarks) {
  const text = String(remarks || '');
  if (!text.trim()) return { remarks: '', aiRemark: '' };

  const aiLines = [];
  const humanLines = [];
  for (const line of text.split(/\r?\n/)) {
    if (AI_CALL_LINE.test(line)) aiLines.push(line.trim());
    else humanLines.push(line);
  }

  return {
    remarks: humanLines.join('\n').trim(),
    aiRemark: aiLines.join('\n').trim(),
  };
}

function mergeAiRemark(existing, extra) {
  const current = String(existing || '').trim();
  const incoming = String(extra || '').trim();
  if (!incoming) return current;
  if (!current) return incoming;
  if (current.includes(incoming)) return current;
  return `${incoming}\n${current}`;
}

function prependAiRemark(existing, summary) {
  const text = String(summary || '').trim();
  if (!text) return String(existing || '').trim();
  const line = `[AI Call] ${text}`;
  const current = String(existing || '').trim();
  return current ? `${line}\n${current}` : line;
}

function applyHumanRemarksToDoc(doc, remarks) {
  if (!doc || remarks == null || String(remarks).trim() === '') return false;
  const nextRemarks = String(remarks);
  const split = splitRemarksAndAi(doc.remarks);
  if (split.aiRemark) {
    doc.aiRemark = mergeAiRemark(doc.aiRemark, split.aiRemark);
  }
  if (String(doc.remarks || '') === nextRemarks) return false;
  doc.remarks = nextRemarks;
  return true;
}

function humanRemarksSetPayload(existingDoc, remarks) {
  const split = splitRemarksAndAi(existingDoc?.remarks);
  const aiRemark = mergeAiRemark(existingDoc?.aiRemark, split.aiRemark);
  const $set = { remarks };
  if (aiRemark) $set.aiRemark = aiRemark;
  return $set;
}

module.exports = {
  splitRemarksAndAi,
  mergeAiRemark,
  prependAiRemark,
  applyHumanRemarksToDoc,
  humanRemarksSetPayload,
};
