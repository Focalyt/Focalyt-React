const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

/**
 * AI Bot Training Admin Routes
 * 
 * GET /admin/botTraining - Render training page
 */

const TRAINING_DATA_FILE = path.join(__dirname, '../../../data/botTrainingData.json');

// Load training data helper
const loadTrainingData = async () => {
  try {
    const dataDir = path.dirname(TRAINING_DATA_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    const data = await fs.readFile(TRAINING_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {
      examples: [],
      rules: [],
      intents: [],
      lastUpdated: new Date().toISOString(),
    };
  }
};

/**
 * GET /admin/botTraining
 * Render bot training page
 */
router.get('/', async (req, res) => {
  try {
    const trainingData = await loadTrainingData();
    return res.render(`${req.vPath}/admin/botTraining`, {
      menu: 'botTraining',
      currentUser: req.session.user,
      trainingData: trainingData,
    });
  } catch (err) {
    console.error('Error rendering bot training page:', err);
    req.flash('error', err.message || 'Something went wrong!');
    return res.redirect('/admin');
  }
});

module.exports = router;


