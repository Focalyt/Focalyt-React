const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'backend', 'controllers', 'routes', 'college', 'users.js');
const lines = fs.readFileSync(p, 'utf8').split(/\n/);
const start = lines.findIndex((l) => l.startsWith("router.get('/club-admins'"));
const end = lines.findIndex((l) => l.startsWith('//update User'));
if (start < 0 || end < 0) {
  throw new Error(`markers ${start} ${end}`);
}
lines.splice(start, end - start);
fs.writeFileSync(p, lines.join('\n'));
console.log(`removed ${end - start} lines from ${start}`);
