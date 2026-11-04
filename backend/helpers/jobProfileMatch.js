function ageFromDob(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;

  const partsFor = (date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const pick = (type) => Number(parts.find((part) => part.type === type)?.value);
    return { year: pick('year'), month: pick('month'), day: pick('day') };
  };

  const born = partsFor(birth);
  const today = partsFor(new Date());
  if (!born.year || !born.month || !born.day) return null;

  let age = today.year - born.year;
  if (today.month < born.month || (today.month === born.month && today.day < born.day)) age -= 1;
  return age;
}

function addQualificationId(ids, value) {
  if (value == null || value === '') return;
  const id = typeof value === 'object' ? (value._id || value.id || value) : value;
  if (id == null || id === '') return;
  ids.add(String(id));
}

function candidateQualificationIds(candidate) {
  const ids = new Set();
  addQualificationId(ids, candidate?.highestQualification);
  const list = Array.isArray(candidate?.qualifications) ? candidate.qualifications : [];
  list.forEach((item) => {
    if (!item || typeof item !== 'object') {
      addQualificationId(ids, item);
      return;
    }
    addQualificationId(ids, item.education);
    addQualificationId(ids, item.Qualification);
    addQualificationId(ids, item.qualification);
    addQualificationId(ids, item._qualification);
  });
  return ids;
}

function jobFieldMessage(vacancy, field, value) {
  if (!value) return '';

  if (field === 'dob' && vacancy?.ageMin != null && vacancy?.ageMax != null) {
    const age = ageFromDob(value);
    if (age == null || age < Number(vacancy.ageMin) || age > Number(vacancy.ageMax)) {
      return `This job requires age between ${vacancy.ageMin} and ${vacancy.ageMax} years.`;
    }
  }

  if (field === 'qualification' && vacancy?._qualification) {
    const requiredId = String(vacancy._qualification._id || vacancy._qualification);
    if (String(value) !== requiredId) {
      const name = vacancy._qualification.name;
      return name
        ? `This job requires ${name}. Choose that qualification exactly.`
        : 'Your qualification does not match the qualification required for this job.';
    }
  }

  return '';
}

function jobProfileMatchMessage(vacancy, candidate) {
  const hasAgeRule = vacancy?.ageMin != null && vacancy?.ageMax != null;
  if (hasAgeRule) {
    const age = ageFromDob(candidate?.dob);
    if (age == null || age < Number(vacancy.ageMin) || age > Number(vacancy.ageMax)) {
      return `This job requires age between ${vacancy.ageMin} and ${vacancy.ageMax} years.`;
    }
  }

  const required = vacancy?._qualification;
  if (required) {
    const requiredId = String(required._id || required);
    if (!candidateQualificationIds(candidate).has(requiredId)) {
      return 'Your qualification does not match the qualification required for this job.';
    }
  }

  return '';
}

module.exports = {
  ageFromDob,
  candidateQualificationIds,
  jobFieldMessage,
  jobProfileMatchMessage,
};
