const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const { exec } = require('child_process');

const cron = require('node-cron');

// Schedule a task to run at 2 AM every day
cron.schedule('0 2 * * *', () => {
  // console.log('Starting scheduled database backup at 2 AM...');
  backupAndRestore();
});

// Function to take backup of local MongoDB and restore to Cloud MongoDB
function backupAndRestore() {
  const backupPath = path.join(__dirname, 'mmt-backup'); // Ensure absolute path for backup

  // Dumping the local MongoDB
  exec(`mongodump --uri="${process.env.MIPIE_MONGODB_URI}" --out="${backupPath}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('Error during dump:', stderr);
      return;
    }
    console.log('Backup taken successfully:', stdout);

    console.log("Backup Path:", backupPath);

    // Restoring the backup to Cloud MongoDB and overwriting the data
    exec(`mongorestore --uri="${process.env.MIPIE_BACKUP_MONGODB_URI}" --drop "${backupPath}/mmt-local"`, (err, stdout, stderr) => {
      if (err) {
        console.error('Error during restore:', stderr);
        return;
      }
      console.log('Backup restored to cloud successfully:', stdout);
    });
  });
}


