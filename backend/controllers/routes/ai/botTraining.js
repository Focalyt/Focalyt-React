const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

const TRAINING_DATA_FILE = path.join(__dirname, "../../../data/botTrainingData.json");

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.dirname(TRAINING_DATA_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }
};

// Load training data
const loadTrainingData = async () => {
  try {
    await ensureDataDir();
    const data = await fs.readFile(TRAINING_DATA_FILE, "utf8");
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

// Save training data
const saveTrainingData = async (data) => {
  await ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(TRAINING_DATA_FILE, JSON.stringify(data, null, 2), "utf8");
};

/**
 * GET /api/ai/training-data
 * Get all training data
 */
router.get("/training-data", async (req, res) => {
  try {
    const data = await loadTrainingData();
    res.json({
      status: true,
      data: data,
    });
  } catch (error) {
    console.error("Error loading training data:", error);
    res.status(500).json({
      status: false,
      message: "Failed to load training data",
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/training-data/example
 * Add a new training example
 */
router.post("/training-data/example", async (req, res) => {
  try {
    const { userQuery, expectedPreferences, expectedResponse, tags, notes } = req.body;

    if (!userQuery) {
      return res.status(400).json({
        status: false,
        message: "userQuery is required",
      });
    }

    const data = await loadTrainingData();
    const newExample = {
      id: Date.now().toString(),
      userQuery: userQuery.trim(),
      expectedPreferences: expectedPreferences || {},
      expectedResponse: expectedResponse || "",
      tags: tags || [],
      notes: notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.examples.push(newExample);
    await saveTrainingData(data);

    res.json({
      status: true,
      message: "Training example added successfully",
      example: newExample,
    });
  } catch (error) {
    console.error("Error adding training example:", error);
    res.status(500).json({
      status: false,
      message: "Failed to add training example",
      error: error.message,
    });
  }
});

/**
 * PUT /api/ai/training-data/example/:id
 * Update a training example
 */
router.put("/training-data/example/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const data = await loadTrainingData();
    const index = data.examples.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({
        status: false,
        message: "Training example not found",
      });
    }

    data.examples[index] = {
      ...data.examples[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await saveTrainingData(data);

    res.json({
      status: true,
      message: "Training example updated successfully",
      example: data.examples[index],
    });
  } catch (error) {
    console.error("Error updating training example:", error);
    res.status(500).json({
      status: false,
      message: "Failed to update training example",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/ai/training-data/example/:id
 * Delete a training example
 */
router.delete("/training-data/example/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const data = await loadTrainingData();
    const index = data.examples.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({
        status: false,
        message: "Training example not found",
      });
    }

    data.examples.splice(index, 1);
    await saveTrainingData(data);

    res.json({
      status: true,
      message: "Training example deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting training example:", error);
    res.status(500).json({
      status: false,
      message: "Failed to delete training example",
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/training-data/rule
 * Add/Update a training rule
 */
router.post("/training-data/rule", async (req, res) => {
  try {
    const { id, rule, description, priority } = req.body;

    if (!rule) {
      return res.status(400).json({
        status: false,
        message: "rule is required",
      });
    }

    const data = await loadTrainingData();
    
    if (id) {
      // Update existing rule
      const index = data.rules.findIndex((r) => r.id === id);
      if (index !== -1) {
        data.rules[index] = {
          ...data.rules[index],
          rule,
          description: description || "",
          priority: priority || 0,
          updatedAt: new Date().toISOString(),
        };
      } else {
        return res.status(404).json({
          status: false,
          message: "Rule not found",
        });
      }
    } else {
      // Add new rule
      const newRule = {
        id: Date.now().toString(),
        rule: rule.trim(),
        description: description || "",
        priority: priority || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.rules.push(newRule);
    }

    await saveTrainingData(data);

    res.json({
      status: true,
      message: id ? "Rule updated successfully" : "Rule added successfully",
    });
  } catch (error) {
    console.error("Error saving rule:", error);
    res.status(500).json({
      status: false,
      message: "Failed to save rule",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/ai/training-data/rule/:id
 * Delete a rule
 */
router.delete("/training-data/rule/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const data = await loadTrainingData();
    const index = data.rules.findIndex((r) => r.id === id);

    if (index === -1) {
      return res.status(404).json({
        status: false,
        message: "Rule not found",
      });
    }

    data.rules.splice(index, 1);
    await saveTrainingData(data);

    res.json({
      status: true,
      message: "Rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting rule:", error);
    res.status(500).json({
      status: false,
      message: "Failed to delete rule",
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/training-data/test
 * Test a query against training data
 */
router.post("/training-data/test", async (req, res) => {
  try {
    const { userQuery } = req.body;

    if (!userQuery) {
      return res.status(400).json({
        status: false,
        message: "userQuery is required",
      });
    }

    const data = await loadTrainingData();
    const queryLower = userQuery.toLowerCase();

    // Find matching examples
    const matchingExamples = data.examples.filter((ex) => {
      const exLower = ex.userQuery.toLowerCase();
      return exLower.includes(queryLower) || queryLower.includes(exLower);
    });

    // Find matching rules
    const matchingRules = data.rules.filter((rule) => {
      const ruleLower = rule.rule.toLowerCase();
      return queryLower.includes(ruleLower) || ruleLower.includes(queryLower);
    });

    res.json({
      status: true,
      matches: {
        examples: matchingExamples.slice(0, 5),
        rules: matchingRules.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Error testing query:", error);
    res.status(500).json({
      status: false,
      message: "Failed to test query",
      error: error.message,
    });
  }
});

module.exports = router;


