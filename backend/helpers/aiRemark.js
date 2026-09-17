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

  const existing = splitRemarksAndAi(doc.remarks);
  const incoming = splitRemarksAndAi(remarks);

  const nextAi = mergeAiRemark(mergeAiRemark(doc.aiRemark, existing.aiRemark), incoming.aiRemark);
  if (nextAi) doc.aiRemark = nextAi;

  const nextHuman = incoming.remarks;
  if (!nextHuman) {
    if (existing.aiRemark && String(doc.remarks || '') !== existing.remarks) {
      doc.remarks = existing.remarks;
      return true;
    }
    return false;
  }

  if (String(doc.remarks || '') === nextHuman && !existing.aiRemark && !incoming.aiRemark) return false;
  doc.remarks = nextHuman;
  return true;
}

function humanRemarksSetPayload(existingDoc, remarks) {
  if (remarks == null || String(remarks).trim() === '') return {};

  const existing = splitRemarksAndAi(existingDoc?.remarks);
  const incoming = splitRemarksAndAi(remarks);
  const aiRemark = mergeAiRemark(
    mergeAiRemark(existingDoc?.aiRemark, existing.aiRemark),
    incoming.aiRemark
  );

  const $set = {};
  if (incoming.remarks) $set.remarks = incoming.remarks;
  else if (existing.aiRemark) $set.remarks = existing.remarks;
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
