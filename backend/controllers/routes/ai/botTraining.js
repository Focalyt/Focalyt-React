const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const { BotTraining, BotTrainingRule } = require("../../models");

const TRAINING_DATA_FILE = path.join(__dirname, "../../../data/botTrainingData.json");

// Build training data structure from DB
const buildTrainingDataFromDb = async () => {
  const [examples, rules] = await Promise.all([
    BotTraining.find({}).sort({ createdAt: -1 }).lean(),
    BotTrainingRule.find({}).sort({ priority: -1, createdAt: -1 }).lean(),
  ]);

  const mapExample = (doc) => ({
    id: doc._id.toString(),
    type: doc.type || "qa",
    userQuery: doc.userQuery || "",
    expectedPreferences: doc.expectedPreferences || {},
    expectedResponse: doc.expectedResponse || "",
    tags: doc.tags || [],
    notes: doc.notes || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });

  const mapRule = (doc) => ({
    id: doc._id.toString(),
    rule: doc.rule || "",
    description: doc.description || "",
    priority: typeof doc.priority === "number" ? doc.priority : 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });

  const allDocs = [...examples, ...rules];
  const lastUpdated =
    allDocs.length > 0
      ? new Date(
          Math.max(
            ...allDocs.map((d) => new Date(d.updatedAt || d.createdAt || new Date(0)).getTime())
          )
        ).toISOString()
      : new Date().toISOString();

  return {
    examples: examples.map(mapExample),
    rules: rules.map(mapRule),
    intents: [],
    lastUpdated,
  };
};

// Load training data (prefers DB, falls back to JSON file and migrates once)
const loadTrainingData = async () => {
  const [exampleCount, ruleCount] = await Promise.all([
    BotTraining.countDocuments(),
    BotTrainingRule.countDocuments(),
  ]);
  if (exampleCount > 0 || ruleCount > 0) {
    return buildTrainingDataFromDb();
  }

  // If DB empty, try to read from legacy JSON file and migrate
  try {
    const raw = await fs.readFile(TRAINING_DATA_FILE, "utf8");
    const legacy = JSON.parse(raw);

    const exampleDocs = [];
    const ruleDocs = [];

    (legacy.examples || []).forEach((ex) => {
      const hasPrefs = ex.expectedPreferences && Object.keys(ex.expectedPreferences || {}).length > 0;
      exampleDocs.push({
        type: hasPrefs ? "job-search" : "qa",
        userQuery: ex.userQuery,
        expectedPreferences: ex.expectedPreferences || {},
        expectedResponse: ex.expectedResponse || "",
        tags: ex.tags || [],
        notes: ex.notes || "",
        createdAt: ex.createdAt,
        updatedAt: ex.updatedAt,
      });
    });

    (legacy.rules || []).forEach((r) => {
      ruleDocs.push({
        rule: r.rule,
        description: r.description || "",
        priority: r.priority || 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
    });

    if (exampleDocs.length > 0) {
      await BotTraining.insertMany(exampleDocs);
    }
    if (ruleDocs.length > 0) {
      await BotTrainingRule.insertMany(ruleDocs);
    }

    return buildTrainingDataFromDb();
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
 * GET /api/ai/training-data
 * Get all training data
 */
router.get("/training-data", async (req, res) => {
  try {
    const data = await loadTrainingData();
    res.json({
      status: true,
      data,
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

router.post("/training-data/example", async (req, res) => {
  try {
    const { userQuery, expectedPreferences, expectedResponse, tags, notes, type } = req.body;

    if (!userQuery) {
      return res.status(400).json({
        status: false,
        message: "userQuery is required",
      });
    }

    const exampleType =
      type ||
      (expectedPreferences && Object.keys(expectedPreferences || {}).length > 0
        ? "job-search"
        : "qa");

    const doc = await BotTraining.create({
      type: exampleType,
      userQuery: userQuery.trim(),
      expectedPreferences: expectedPreferences || {},
      expectedResponse: expectedResponse || "",
      tags: tags || [],
      notes: notes || "",
    });

    const example = {
      id: doc._id.toString(),
      userQuery: doc.userQuery,
      expectedPreferences: doc.expectedPreferences,
      expectedResponse: doc.expectedResponse,
      tags: doc.tags,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    res.json({
      status: true,
      message: "Added successfully",
      example,
    });
  } catch (error) {
    console.error("Error adding training:", error);
    res.status(500).json({
      status: false,
      message: "Failed to add",
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
    const updates = req.body || {};

    const doc = await BotTraining.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          type: updates.type,
          userQuery: updates.userQuery,
          expectedPreferences: updates.expectedPreferences,
          expectedResponse: updates.expectedResponse,
          tags: updates.tags,
          notes: updates.notes,
        },
      },
      { new: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({
        status: false,
        message: "Training example not found",
      });
    }

    const example = {
      id: doc._id.toString(),
      userQuery: doc.userQuery,
      expectedPreferences: doc.expectedPreferences || {},
      expectedResponse: doc.expectedResponse || "",
      tags: doc.tags || [],
      notes: doc.notes || "",
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    res.json({
      status: true,
      message: "Training example updated successfully",
      example,
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

    const result = await BotTraining.deleteOne({ _id: id });

    if (!result.deletedCount) {
      return res.status(404).json({
        status: false,
        message: "Training example not found",
      });
    }

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

    if (id) {
      const updated = await BotTrainingRule.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            rule: rule.trim(),
            description: description || "",
            priority: priority || 0,
          },
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          status: false,
          message: "Rule not found",
        });
      }

      return res.json({
        status: true,
        message: "Rule updated successfully",
      });
    }

    await BotTrainingRule.create({
      rule: rule.trim(),
      description: description || "",
      priority: priority || 0,
    });

    res.json({
      status: true,
      message: "Rule added successfully",
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

    const result = await BotTrainingRule.deleteOne({ _id: id });

    if (!result.deletedCount) {
      return res.status(404).json({
        status: false,
        message: "Rule not found",
      });
    }

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


