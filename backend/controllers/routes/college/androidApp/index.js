const express = require("express");
const router = express.Router();

// Import Android login routes
const loginRoutes = require('./login');

// Use login routes
router.use('/login', loginRoutes);

module.exports = router; 