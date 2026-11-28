/**
 * One-line JSON logs for the queue path.
 * Do not pass tokens, full phone numbers, or message bodies.
 */

function dripLog(event, fields = {}) {
  const payload = {
    ts: new Date().toISOString(),
    component: 'drip',
    event
  };

  Object.keys(fields).forEach((key) => {
    const value = fields[key];
    if (value === undefined) return;
    payload[key] = value;
  });

  console.log(JSON.stringify(payload));
}

module.exports = { dripLog };
