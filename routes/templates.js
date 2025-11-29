const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

// Load template metadata
const TEMPLATES_DIR = path.join(__dirname, "../templates");
const METADATA_PATH = path.join(TEMPLATES_DIR, "metadata.json");

/**
 * GET /api/templates/list
 * Get all available templates
 */
router.get("/list", async (req, res) => {
  try {
    const metadataFile = await fs.readFile(METADATA_PATH, "utf8");
    const metadata = JSON.parse(metadataFile);

    res.json({
      success: true,
      templates: metadata.templates,
      total: metadata.templates.length,
    });
  } catch (error) {
    console.error("Error loading templates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load templates",
      error: error.message,
    });
  }
});

/**
 * GET /api/templates/:id
 * Get specific template details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const metadataFile = await fs.readFile(METADATA_PATH, "utf8");
    const metadata = JSON.parse(metadataFile);

    const template = metadata.templates.find((t) => t.id === id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.json({
      success: true,
      template: template,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch template",
      error: error.message,
    });
  }
});

/**
 * GET /api/templates/preview/:id
 * Get template source code
 */
router.get("/preview/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const metadataFile = await fs.readFile(METADATA_PATH, "utf8");
    const metadata = JSON.parse(metadataFile);

    const template = metadata.templates.find((t) => t.id === id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    const templatePath = path.join(TEMPLATES_DIR, template.file);
    const templateCode = await fs.readFile(templatePath, "utf8");

    res.json({
      success: true,
      template: template,
      code: templateCode,
    });
  } catch (error) {
    console.error("Error loading template code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load template code",
      error: error.message,
    });
  }
});

module.exports = router;
