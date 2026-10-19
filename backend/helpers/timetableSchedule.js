const PERIOD_MINUTES = [30, 45, 60, 90, 120];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_MINUTES = 24 * 60;

class TimetableError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const fail = (message, statusCode = 400) => {
  throw new TimetableError(message, statusCode);
};

const toMinutes = (value) => {
  const match = TIME_PATTERN.exec(String(value || '').trim());
  if (!match) fail('Time must be HH:mm');
  return (Number(match[1]) * 60) + Number(match[2]);
};

const fromMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const assertClock = (minutes, label) => {
  if (minutes >= DAY_MINUTES) fail(`${label} cannot pass midnight`);
};

const emptyLunch = (value) => value == null || String(value).trim() === '';

/**
 * Build one day's slots from editable fields.
 * Period mode inserts lunch only on a period boundary and rejects overlap.
 * Full-day mode is a single bookable block.
 */
const buildDaySchedule = (input = {}) => {
  const mode = input.mode === 'full' ? 'full' : 'period';
  const dayStart = String(input.dayStart || input.startTime || '').trim();
  const start = toMinutes(dayStart);

  if (mode === 'full') {
    const dayEnd = String(input.dayEnd || input.endTime || '').trim();
    const end = toMinutes(dayEnd);
    if (end <= start) fail('End time must be after start time');
    assertClock(end, 'End time');
    const minutes = end - start;
    return {
      mode,
      dayStart,
      dayEnd,
      periodCount: 1,
      periodMinutes: minutes,
      lunchStart: '',
      lunchEnd: '',
      totalStudyMinutes: minutes,
      slots: [{
        key: 'full-day',
        type: 'period',
        label: 'Full Day',
        startTime: dayStart,
        endTime: dayEnd,
        minutes,
      }],
    };
  }

  const periodCount = Number(input.periodCount);
  const periodMinutes = Number(input.periodMinutes);
  if (!Number.isInteger(periodCount) || periodCount < 1 || periodCount > 12) {
    fail('Number of periods must be between 1 and 12');
  }
  if (!PERIOD_MINUTES.includes(periodMinutes)) {
    fail('Duration must be 30, 45, 60, 90, or 120 minutes');
  }

  const hasLunchStart = !emptyLunch(input.lunchStart);
  const hasLunchEnd = !emptyLunch(input.lunchEnd);
  if (hasLunchStart !== hasLunchEnd) fail('Enter both lunch start and lunch end');

  let lunchStart = null;
  let lunchEnd = null;
  if (hasLunchStart) {
    lunchStart = toMinutes(input.lunchStart);
    lunchEnd = toMinutes(input.lunchEnd);
    if (lunchEnd <= lunchStart) fail('Lunch end must be after lunch start');
    if (lunchStart < start) fail('Lunch must start at or after the day start');
  }

  const slots = [];
  let cursor = start;
  let lunchPlaced = lunchStart == null;

  for (let index = 1; index <= periodCount; index += 1) {
    if (!lunchPlaced && lunchStart < cursor + periodMinutes) {
      if (lunchStart !== cursor) {
        fail('Lunch must start at a period boundary and cannot overlap a class');
      }
      assertClock(lunchEnd, 'Lunch');
      slots.push({
        key: 'lunch',
        type: 'lunch',
        label: 'Lunch Break',
        startTime: fromMinutes(lunchStart),
        endTime: fromMinutes(lunchEnd),
        minutes: lunchEnd - lunchStart,
      });
      cursor = lunchEnd;
      lunchPlaced = true;
    }

    const periodEnd = cursor + periodMinutes;
    assertClock(periodEnd, 'Period');
    slots.push({
      key: `period-${index}`,
      type: 'period',
      label: `Period ${index}`,
      startTime: fromMinutes(cursor),
      endTime: fromMinutes(periodEnd),
      minutes: periodMinutes,
    });
    cursor = periodEnd;
  }

  if (!lunchPlaced) fail('Lunch falls outside this timetable');

  const study = slots
    .filter((slot) => slot.type === 'period')
    .reduce((sum, slot) => sum + slot.minutes, 0);

  return {
    mode,
    dayStart,
    dayEnd: fromMinutes(cursor),
    periodCount,
    periodMinutes,
    lunchStart: lunchStart == null ? '' : fromMinutes(lunchStart),
    lunchEnd: lunchEnd == null ? '' : fromMinutes(lunchEnd),
    totalStudyMinutes: study,
    slots,
  };
};

const assertConsecutive = (slots, requestedKeys) => {
  const seen = new Set();
  const keys = [];
  (Array.isArray(requestedKeys) ? requestedKeys : []).forEach((value) => {
    const key = String(value || '').trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    keys.push(key);
  });
  if (!keys.length) fail('Select at least one period');

  const byKey = new Map((slots || []).map((slot) => [slot.key, slot]));
  const selected = keys.map((key) => {
    const slot = byKey.get(key);
    if (!slot) fail('Period is not on this day');
    if (slot.type !== 'period') fail('Lunch cannot be booked');
    return slot;
  });
  selected.sort((left, right) => toMinutes(left.startTime) - toMinutes(right.startTime));

  const periodSlots = (slots || []).filter((slot) => slot.type === 'period');
  const indexes = selected.map((slot) => periodSlots.findIndex((item) => item.key === slot.key));
  for (let index = 1; index < selected.length; index += 1) {
    const touches = selected[index].startTime === selected[index - 1].endTime;
    const adjacent = indexes[index] === indexes[index - 1] + 1;
    if (!touches || !adjacent) fail('Periods must be consecutive');
  }

  return {
    slotKeys: selected.map((slot) => slot.key),
    startTime: selected[0].startTime,
    endTime: selected[selected.length - 1].endTime,
  };
};

module.exports = {
  PERIOD_MINUTES,
  TimetableError,
  toMinutes,
  fromMinutes,
  buildDaySchedule,
  assertConsecutive,
};
