const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid/v1');
const path = require('path');
const Team = require('../../models/team');

const {
  bucketName,
  mimetypes,
} = require('../../../config');

const s3 = require('../../../helpers/objectStorage');
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

const destination = path.resolve(__dirname, '..', '..', '..', 'public', 'temp');
if (!fs.existsSync(destination)) fs.mkdirSync(destination);

const storage = multer.diskStorage({
  destination,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage }).single("file"); // "file" नाम सही होना चाहिए

module.exports.uploadTeamMember = async (req, res) => {
 
};