const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

const Restaurant = require("../models/Restaurant");
const Deployment = require("../models/Deployment");
const authenticate = require("../middleware/authenticate");

// Configuration
const TEMPLATES_DIR = path.join(__dirname, "../templates");
const DEPLOYMENTS_DIR = path.join(__dirname, "../../deployments");
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:5000";

// Ensure deployments directory exists
async function ensureDeploymentsDirectory() {
  try {
    await fs.mkdir(DEPLOYMENTS_DIR, { recursive: true });
    console.log("✅ Deployments directory ready");
  } catch (error) {
    console.error("Error creating deployments directory:", error);
  }
}

ensureDeploymentsDirectory();

/**
 * POST /api/deployments/deploy-react
 * Deploy a React template with injected data
 */
router.post("/deploy-react", authenticate, async (req, res) => {
  try {
    const { restaurantId, templateId, restaurantData, menuItems } = req.body;

    console.log("🚀 Deploying React website for:", restaurantData.name);

    if (!restaurantId || !templateId || !restaurantData) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify restaurant ownership
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (restaurant.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Load template metadata
    const metadataPath = path.join(TEMPLATES_DIR, "metadata.json");
    const metadataFile = await fs.readFile(metadataPath, "utf8");
    const metadata = JSON.parse(metadataFile);

    const template = metadata.templates.find((t) => t.id === templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Read template file
    const templatePath = path.join(TEMPLATES_DIR, template.file);
    let templateCode = await fs.readFile(templatePath, "utf8");

    // Inject restaurant data and menu items
    templateCode = injectData(
      templateCode,
      restaurantData,
      menuItems,
      restaurantId
    );

    // Create deployment directory
    const deploymentPath = path.join(DEPLOYMENTS_DIR, restaurantId);
    await fs.mkdir(deploymentPath, { recursive: true });
    await fs.mkdir(path.join(deploymentPath, "src"), { recursive: true });
    await fs.mkdir(path.join(deploymentPath, "public"), { recursive: true });

    // Create package.json
    const packageJson = {
      name: `restaurant-${restaurantId}`,
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        "react-scripts": "5.0.1",
        "lucide-react": "^0.263.1",
      },
      scripts: {
        start: "react-scripts start",
        build: "react-scripts build",
        test: "react-scripts test",
        eject: "react-scripts eject",
      },
      eslintConfig: {
        extends: ["react-app"],
      },
      browserslist: {
        production: [">0.2%", "not dead", "not op_mini all"],
        development: [
          "last 1 chrome version",
          "last 1 firefox version",
          "last 1 safari version",
        ],
      },
    };

    await fs.writeFile(
      path.join(deploymentPath, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    // Create index.js
    const indexJs = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

    await fs.writeFile(path.join(deploymentPath, "src/index.js"), indexJs);

    // Create App.js with injected template
    await fs.writeFile(path.join(deploymentPath, "src/App.js"), templateCode);

    // Create index.css with Tailwind
    const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}
`;

    await fs.writeFile(path.join(deploymentPath, "src/index.css"), indexCss);

    // Create tailwind.config.js
    const tailwindConfig = `module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

    await fs.writeFile(
      path.join(deploymentPath, "tailwind.config.js"),
      tailwindConfig
    );

    // Create postcss.config.js
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

    await fs.writeFile(
      path.join(deploymentPath, "postcss.config.js"),
      postcssConfig
    );

    // Create public/index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="${template.colors.primary}" />
    <meta name="description" content="${
      restaurantData.description || "Order delicious food online"
    }" />
    <title>${restaurantData.name} - Order Online</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
`;

    await fs.writeFile(
      path.join(deploymentPath, "public/index.html"),
      indexHtml
    );

    // Install dependencies and build
    console.log("📦 Installing dependencies...");

    try {
      await execPromise("npm install", {
        cwd: deploymentPath,
        timeout: 300000, // 2 minutes timeout
      });
      console.log("✅ Dependencies installed");

      console.log("🔨 Building production bundle...");
      await execPromise("npm run build", {
        cwd: deploymentPath,
        timeout: 300000, // 3 minutes timeout
      });
      console.log("✅ Build completed");
    } catch (buildError) {
      console.error("Build error:", buildError);
      return res.status(500).json({
        success: false,
        message: "Build failed",
        error: buildError.message,
      });
    }

    // Construct website URL
    const websiteUrl = `${PUBLIC_URL}/restaurant/${restaurantId}`;

    // Save deployment record
    let deployment = await Deployment.findOne({ restaurant: restaurantId });

    if (deployment) {
      deployment.websiteUrl = websiteUrl;
      deployment.status = "deployed";
      deployment.lastDeployedAt = new Date();
      deployment.platform = "react";
      deployment.config = { templateId, restaurantData, menuItems };
    } else {
      deployment = new Deployment({
        restaurant: restaurantId,
        user: req.user.userId,
        platform: "react",
        websiteUrl: websiteUrl,
        status: "deployed",
        config: { templateId, restaurantData, menuItems },
        lastDeployedAt: new Date(),
      });
    }

    await deployment.save();

    // Update restaurant
    restaurant.websiteUrl = websiteUrl;
    await restaurant.save();

    res.json({
      success: true,
      message: "Website deployed successfully!",
      websiteUrl: websiteUrl,
      deployment: deployment,
    });
  } catch (error) {
    console.error("❌ Deployment error:", error);
    res.status(500).json({
      success: false,
      message: "Deployment failed",
      error: error.message,
    });
  }
});

/**
 * Inject restaurant data and menu into template
 */
function injectData(templateCode, restaurantData, menuItems, restaurantId) {
  // Prepare data objects
  const restaurantDataObj = {
    name: restaurantData.name || "Restaurant",
    description:
      restaurantData.description || "Delicious food delivered to your door",
    cuisine:
      restaurantData.cuisineType || restaurantData.cuisine || "International",
    phone:
      restaurantData.phone || restaurantData.contact?.phone || "(555) 123-4567",
    email:
      restaurantData.email ||
      restaurantData.contact?.email ||
      "info@restaurant.com",
    address:
      restaurantData.address ||
      restaurantData.contact?.address?.street ||
      "123 Main Street",
    city:
      restaurantData.city || restaurantData.contact?.address?.city || "City",
    state:
      restaurantData.state || restaurantData.contact?.address?.state || "State",
    zipCode:
      restaurantData.zipCode ||
      restaurantData.contact?.address?.zipCode ||
      "12345",
    hours: restaurantData.hours || "Mon - Sun: 11:00 AM - 11:00 PM",
    tagline: restaurantData.tagline || "EST. 2024",
    heroTitle: restaurantData.heroTitle || "Where Every Bite",
    heroSubtitle: restaurantData.heroSubtitle || "Tells a Story",
    badge: restaurantData.badge || "PREMIUM DINING",
    aboutTitle: restaurantData.aboutTitle || "Our Story",
    aboutText1: restaurantData.aboutText1 || "Passionate about great food",
    aboutText2: restaurantData.aboutText2 || "Experience culinary excellence",
    aboutImage1:
      restaurantData.aboutImage1 ||
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500",
    aboutImage2:
      restaurantData.aboutImage2 ||
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500",
    feature1Title: restaurantData.feature1Title || "Premium Quality",
    feature1Desc: restaurantData.feature1Desc || "Finest ingredients",
    yearsInBusiness: restaurantData.yearsInBusiness || "10+",
    customersServed: restaurantData.customersServed || "50K+",
  };

  // Prepare menu items with IDs
  const menuItemsArray = (menuItems || []).map((item, index) => ({
    id: item.id || index + 1,
    name: item.name || `Dish ${index + 1}`,
    description: item.description || "Delicious and freshly prepared",
    price: parseFloat(item.price) || 0,
    category: item.category || "Main",
    image:
      item.image ||
      `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800`,
    rating: item.rating || 4.8,
    reviews: item.reviews || 100,
    popular: item.popular || false,
    prepTime: item.prepTime || "20 min",
    calories: item.calories || 500,
  }));

  // Replace placeholders
  let injectedCode = templateCode
    .replace(/{{RESTAURANT_DATA}}/g, JSON.stringify(restaurantDataObj))
    .replace(/{{MENU_ITEMS}}/g, JSON.stringify(menuItemsArray))
    .replace(/{{API_BASE}}/g, process.env.PUBLIC_URL || "http://localhost:5000")
    .replace(/{{RESTAURANT_ID}}/g, restaurantId);

  return injectedCode;
}

/**
 * GET /restaurant/:restaurantId
 * Serve deployed React website
 */
router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const buildPath = path.join(DEPLOYMENTS_DIR, restaurantId, "build");
    const indexPath = path.join(buildPath, "index.html");

    // Check if build exists
    try {
      await fs.access(indexPath);
    } catch {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Website Not Found</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 40px;
              }
              h1 { font-size: 3rem; margin-bottom: 20px; }
              p { font-size: 1.2rem; opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🍽️ Website Not Found</h1>
              <p>This restaurant's website hasn't been deployed yet.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Serve the index.html
    res.sendFile(indexPath);
  } catch (error) {
    console.error("Error serving website:", error);
    res.status(500).send("Error loading website");
  }
});

/**
 * GET /api/deployments/status/:restaurantId
 * Get deployment status
 */
router.get("/status/:restaurantId", authenticate, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const deployment = await Deployment.findOne({
      restaurant: restaurantId,
    }).populate("restaurant", "name websiteUrl");

    if (!deployment) {
      return res.json({
        success: true,
        deployed: false,
        message: "No deployment found",
      });
    }

    res.json({
      success: true,
      deployed: deployment.status === "deployed",
      deployment: {
        platform: deployment.platform,
        websiteUrl: deployment.websiteUrl,
        status: deployment.status,
        lastDeployedAt: deployment.lastDeployedAt,
        restaurantName: deployment.restaurant?.name,
      },
    });
  } catch (error) {
    console.error("Error fetching deployment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deployment status",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/deployments/delete/:restaurantId
 * Delete deployment
 */
router.delete("/delete/:restaurantId", authenticate, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Verify ownership
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (restaurant.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Delete deployment directory
    const deploymentPath = path.join(DEPLOYMENTS_DIR, restaurantId);
    try {
      await fs.rm(deploymentPath, { recursive: true, force: true });
      console.log("✅ Deployment directory deleted");
    } catch (error) {
      console.warn("Warning: Could not delete deployment:", error.message);
    }

    // Delete deployment record
    await Deployment.findOneAndDelete({ restaurant: restaurantId });

    // Update restaurant
    restaurant.websiteUrl = null;
    await restaurant.save();

    res.json({
      success: true,
      message: "Deployment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting deployment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete deployment",
      error: error.message,
    });
  }
});

module.exports = router;
