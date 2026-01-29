const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const { exec } = require('child_process');

const cron = require('node-cron');
// backupAndRestore();
// console.log("Local URI:", process.env.MIPIE_MONGODB_URI);
// console.log("Cloud URI:", process.env.MIPIE_BACKUP_MONGODB_URI);

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



// const path = require('path');
// const fs = require('fs');
// const os = require('os');
// require('dotenv').config({ path: path.join(__dirname, '../.env') })
// const { exec } = require('child_process');

// const cron = require('node-cron');
// backupAndRestore();
// console.log("Local URI:", process.env.MIPIE_MONGODB_URI);
// console.log("Cloud URI:", process.env.MIPIE_BACKUP_MONGODB_URI);

// // Schedule a task to run at 2 AM every day
// // cron.schedule('0 2 * * *', () => {
// //   // console.log('\n🔄 Starting scheduled database backup (2 AM daily)...');
// //  backupAndRestore();
// // });

// // Function to take backup of local MongoDB and restore to Cloud MongoDB
// function backupAndRestore() {
//   // IMPORTANT (dev/testing): keep backups OUTSIDE the repo so nodemon doesn't restart
//   // mongodump writes many files (incl. metadata.json) which can trigger nodemon restarts.
//   const backupPath = path.join(os.tmpdir(), 'mmt-backup'); // e.g. C:\Users\<you>\AppData\Local\Temp\mmt-backup

//   // Create backup directory if it doesn't exist
//   if (!fs.existsSync(backupPath)) {
//     fs.mkdirSync(backupPath, { recursive: true });
//     // console.log(`[${new Date().toLocaleTimeString()}] Created backup directory: ${backupPath}`);
//   }

//   // Extract database name from URI
//   const localUri = process.env.MIPIE_MONGODB_URI;
//   if (!localUri) {
//     console.error(`[${new Date().toLocaleTimeString()}] ❌ MIPIE_MONGODB_URI is not set in environment variables`);
//     return;
//   }
  
//   const dbName = localUri.split('/').pop().split('?')[0]; // Get database name from URI
  
//   // console.log(`[${new Date().toLocaleTimeString()}] Starting backup for database: ${dbName}`);
//   // console.log(`[${new Date().toLocaleTimeString()}] Backup will be saved to: ${backupPath}`);

//   const dumpCommand = `mongodump --uri="${localUri}" --out="${backupPath}"`;
//   // console.log(`[${new Date().toLocaleTimeString()}] Executing: mongodump...`);

//   // Dumping the local MongoDB with increased buffer size
//   exec(dumpCommand, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
//     if (err) {
//       console.error(`[${new Date().toLocaleTimeString()}] ❌ Error during dump:`, err.message);
//       if (stderr) console.error('stderr:', stderr);
//       if (stdout) console.error('stdout:', stdout);
//       return;
//     }
    
//     // mongodump writes progress to stderr, so check it
//     // if (stderr) console.log(`[${new Date().toLocaleTimeString()}] Dump progress:`, stderr.trim());
    
//     // console.log(`[${new Date().toLocaleTimeString()}] ✅ Backup taken successfully`);
//     // if (stdout) console.log('Dump output:', stdout);

//     const dbBackupPath = path.join(backupPath, dbName);
//     // console.log(`[${new Date().toLocaleTimeString()}] Database backup path: ${dbBackupPath}`);
//     // console.log(`[${new Date().toLocaleTimeString()}] Starting restore to cloud...`);

//     const restoreCommand = `mongorestore --uri="${process.env.MIPIE_BACKUP_MONGODB_URI}" --drop "${dbBackupPath}"`;
//     // console.log(`[${new Date().toLocaleTimeString()}] Executing: mongorestore...`);

//     // Restoring the backup to Cloud MongoDB and overwriting the data
//     exec(restoreCommand, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
//       if (err) {
//         console.error(`[${new Date().toLocaleTimeString()}] ❌ Error during restore:`, err.message);
//         if (stderr) console.error('stderr:', stderr);
//         if (stdout) console.error('stdout:', stdout);
//         return;
//       }
      
//       // mongorestore also writes progress to stderr
//       // if (stderr) console.log(`[${new Date().toLocaleTimeString()}] Restore progress:`, stderr.trim());
      
//       // console.log(`[${new Date().toLocaleTimeString()}] ✅ Backup restored to cloud successfully`);
//       // if (stdout) console.log('Restore output:', stdout);
//       // console.log(`[${new Date().toLocaleTimeString()}] ✅ Backup process completed!\n`);
//     });
//   });
// }


