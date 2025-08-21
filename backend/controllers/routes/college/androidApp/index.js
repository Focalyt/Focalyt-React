const express = require("express");
const router = express.Router();

// Import Android login routes
const loginRoutes = require('./login');
const attendanceRoutes = require('./attendance');

// Use login routes
router.use('/login', loginRoutes);
router.use('/attendance-tracking', attendanceRoutes);

module.exports = router; 