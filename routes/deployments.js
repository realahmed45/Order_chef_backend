const express = require("express");
const Restaurant = require("../models/Restaurant");
const Deployment = require("../models/Deployment");
const MenuItem = require("../models/Menu");
const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const axios = require("axios");
const router = express.Router();

// Configuration
const WEBSITES_DIR = path.join(__dirname, "../../hosted-websites");
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:4000";

// Ensure websites directory exists
async function ensureWebsitesDirectory() {
  try {
    await fs.mkdir(WEBSITES_DIR, { recursive: true });
    console.log("✅ Websites directory ready");
  } catch (error) {
    console.error("Error creating websites directory:", error);
  }
}

ensureWebsitesDirectory();

/**
 * Generate a complete React website with all customizations
 */
function generateReactWebsite(restaurant, menuItems, config) {
  const websiteName =
    restaurant.slug || restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

  // Generate package.json
  const packageJson = {
    name: `${websiteName}-website`,
    version: "1.0.0",
    private: true,
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "react-scripts": "5.0.1",
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

  // Generate App.js - Main React Component
  const appJs = `import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = '${PUBLIC_URL}';

function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const response = await fetch(\`\${API_BASE}/api/public/menu/${
        restaurant._id
      }\`);
      const data = await response.json();
      setMenuItems(data.items || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load menu:', error);
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(menuItems.map(item => item.category || 'Other'))];
  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const addToCart = (item) => {
    const existing = cart.find(c => c._id === item._id);
    if (existing) {
      setCart(cart.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    setShowCart(true);
  };

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item => {
      if (item._id === itemId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const checkout = async () => {
    const customerName = prompt('Enter your name:');
    if (!customerName) return;
    
    const customerPhone = prompt('Enter your phone number:');
    if (!customerPhone) return;

    try {
      const response = await fetch(\`\${API_BASE}/api/public/orders\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: '${restaurant._id}',
          customer: { name: customerName, phone: customerPhone },
          items: cart,
          orderType: 'takeaway',
          totalAmount
        })
      });

      if (response.ok) {
        alert('✅ Order placed successfully! We\\'ll contact you soon.');
        setCart([]);
        setShowCart(false);
      } else {
        alert('❌ Failed to place order. Please try again.');
      }
    } catch (error) {
      alert('❌ Network error. Please check your connection.');
    }
  };

  const config = ${JSON.stringify(config)};

  return (
    <div className="app" style={{ 
      backgroundColor: config.backgroundColor, 
      color: config.textColor 
    }}>
      {/* Header */}
      <header className="header" style={{
        background: config.headerBackground === 'gradient' 
          ? \`linear-gradient(135deg, \${config.primaryColor}, \${config.secondaryColor})\`
          : config.primaryColor
      }}>
        <div className="container header-content">
          <div className="brand">
            {config.showLogo && config.logo && (
              <img src={config.logo} alt="Logo" className="logo" />
            )}
            <div>
              <h1 className="brand-name">{config.brandName}</h1>
              {config.showTagline && <p className="tagline">{config.tagline}</p>}
            </div>
          </div>
          <button 
            className="cart-button"
            style={{ backgroundColor: config.accentColor }}
            onClick={() => setShowCart(!showCart)}
          >
            🛒 Cart ({cart.length})
          </button>
        </div>
      </header>

      {/* Hero Section */}
      {config.showHero && (
        <section className="hero" style={{ backgroundColor: \`\${config.primaryColor}10\` }}>
          <div className="container hero-content">
            <h2 className="hero-title" style={{ color: config.primaryColor }}>
              {config.heroTitle}
            </h2>
            <p className="hero-subtitle">{config.heroSubtitle}</p>
            <button 
              className="hero-cta"
              style={{ backgroundColor: config.primaryColor }}
              onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}
            >
              {config.heroCTA}
            </button>
          </div>
        </section>
      )}

      {/* Menu Section */}
      <section id="menu" className="menu-section">
        <div className="container">
          <h2 className="section-title" style={{ color: config.primaryColor }}>
            Our Menu
          </h2>

          {/* Category Filter */}
          <div className="category-filter">
            {categories.map(category => (
              <button
                key={category}
                className={\`category-btn \${selectedCategory === category ? 'active' : ''}\`}
                style={{
                  backgroundColor: selectedCategory === category ? config.primaryColor : '#f3f4f6',
                  color: selectedCategory === category ? 'white' : config.textColor
                }}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading">Loading menu...</div>
          ) : (
            <div className={\`menu-grid grid-\${config.itemsPerRow}\`}>
              {filteredItems.map(item => (
                <div key={item._id} className={\`menu-item \${config.cardStyle}\`}>
                  {config.showImages && item.image && (
                    <img src={item.image} alt={item.name} className="item-image" />
                  )}
                  {config.showImages && !item.image && (
                    <div className="item-image placeholder" />
                  )}
                  <div className="item-content">
                    <h3 className="item-name">{item.name}</h3>
                    {config.showDescriptions && (
                      <p className="item-description">{item.description}</p>
                    )}
                    <div className="item-footer">
                      {config.showPrices && (
                        <span className="item-price" style={{ color: config.primaryColor }}>
                          \${item.price.toFixed(2)}
                        </span>
                      )}
                      {config.showAddToCart && (
                        <button
                          className="add-to-cart-btn"
                          style={{ backgroundColor: config.accentColor }}
                          onClick={() => addToCart(item)}
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      {config.showFeatures && (
        <section className="features-section">
          <div className="container">
            <div className="features-grid">
              {config.features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      {config.showFooter && (
        <footer className="footer" style={{ backgroundColor: config.primaryColor }}>
          <div className="container footer-content">
            <p className="footer-brand">{config.brandName}</p>
            <p className="footer-contact">
              {config.contactInfo.phone && \`📞 \${config.contactInfo.phone}\`}
              {config.contactInfo.email && \` | 📧 \${config.contactInfo.email}\`}
            </p>
            <p className="footer-copyright">
              © 2025 {config.brandName}. All rights reserved.
            </p>
          </div>
        </footer>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-sidebar" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h3>Your Cart</h3>
              <button onClick={() => setShowCart(false)}>✕</button>
            </div>
            <div className="cart-items">
              {cart.length === 0 ? (
                <p className="cart-empty">Your cart is empty</p>
              ) : (
                cart.map(item => (
                  <div key={item._id} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item._id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, 1)}>+</button>
                      </div>
                    </div>
                    <div className="cart-item-price">
                      <span>\${(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item._id)}>Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span>\${totalAmount.toFixed(2)}</span>
                </div>
                <button 
                  className="checkout-btn"
                  style={{ backgroundColor: config.accentColor }}
                  onClick={checkout}
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
`;

  // Generate App.css
  const appCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Header */
.header {
  padding: 1.5rem 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  height: 3rem;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.tagline {
  color: rgba(255,255,255,0.9);
  font-size: 0.875rem;
  margin: 0;
}

.cart-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}

.cart-button:hover {
  opacity: 0.9;
}

/* Hero */
.hero {
  padding: 4rem 0;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: #6B7280;
  margin-bottom: 2rem;
}

.hero-cta {
  padding: 1rem 2rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}

.hero-cta:hover {
  opacity: 0.9;
}

/* Menu Section */
.menu-section {
  padding: 4rem 0;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
}

.category-filter {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.category-btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn:hover {
  opacity: 0.8;
}

.menu-grid {
  display: grid;
  gap: 1.5rem;
}

.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 768px) {
  .menu-grid { grid-template-columns: 1fr !important; }
}

.menu-item {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  transition: transform 0.2s;
}

.menu-item.elevated {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.menu-item.bordered {
  border: 2px solid #E5E7EB;
}

.menu-item:hover {
  transform: translateY(-4px);
}

.item-image {
  width: 100%;
  height: 12rem;
  object-fit: cover;
}

.item-image.placeholder {
  background: #E5E7EB;
}

.item-content {
  padding: 1rem;
}

.item-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.item-description {
  font-size: 0.875rem;
  color: #6B7280;
  margin-bottom: 1rem;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 1.25rem;
  font-weight: 700;
}

.add-to-cart-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-to-cart-btn:hover {
  opacity: 0.9;
}

/* Features */
.features-section {
  padding: 4rem 0;
  background: #F9FAFB;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

@media (max-width: 768px) {
  .features-grid { grid-template-columns: 1fr; }
}

.feature-card {
  text-align: center;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.feature-description {
  font-size: 0.875rem;
  color: #6B7280;
}

/* Footer */
.footer {
  padding: 2rem 0;
  color: white;
  text-align: center;
}

.footer-brand {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.footer-contact {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.footer-copyright {
  font-size: 0.75rem;
  opacity: 0.75;
}

/* Cart Sidebar */
.cart-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
}

.cart-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  max-width: 90vw;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 12px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #E5E7EB;
}

.cart-header h3 {
  margin: 0;
}

.cart-header button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6B7280;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.cart-empty {
  text-align: center;
  color: #6B7280;
  padding: 2rem;
}

.cart-item {
  padding: 1rem;
  border-bottom: 1px solid #E5E7EB;
}

.cart-item-info h4 {
  margin: 0 0 0.5rem 0;
}

.quantity-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 0.5rem;
}

.quantity-controls button {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  background: #F3F4F6;
  cursor: pointer;
  font-weight: 600;
}

.cart-item-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.cart-item-price button {
  background: none;
  border: none;
  color: #EF4444;
  cursor: pointer;
  font-size: 0.875rem;
}

.cart-footer {
  border-top: 1px solid #E5E7EB;
  padding: 1.5rem;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.checkout-btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}

.checkout-btn:hover {
  opacity: 0.9;
}

.loading {
  text-align: center;
  padding: 4rem;
  color: #6B7280;
  font-size: 1.125rem;
}
`;

  // Generate index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="${config.primaryColor}" />
    <meta name="description" content="${config.metaDescription}" />
    <title>${config.metaTitle}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
`;

  // Generate index.js
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

  // Generate index.css
  const indexCss = `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
`;

  return {
    packageJson,
    appJs,
    appCss,
    indexHtml,
    indexJs,
    indexCss,
  };
}

/**
 * Deploy website - create React app and build it
 */
router.post("/deploy-website-v2", async (req, res) => {
  try {
    const { restaurantId, config } = req.body;

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      ownerId: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    console.log(`🚀 Starting deployment for: ${restaurant.name}`);

    // Get menu items
    const menuItems = await MenuItem.find({
      restaurantId: restaurant._id,
      isAvailable: true,
    });

    // Generate website files
    const files = generateReactWebsite(restaurant, menuItems, config);
    const websiteName =
      restaurant.slug ||
      restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const websiteDir = path.join(WEBSITES_DIR, websiteName);

    // Create website directory structure
    await fs.mkdir(websiteDir, { recursive: true });
    await fs.mkdir(path.join(websiteDir, "src"), { recursive: true });
    await fs.mkdir(path.join(websiteDir, "public"), { recursive: true });

    // Write files
    await fs.writeFile(
      path.join(websiteDir, "package.json"),
      JSON.stringify(files.packageJson, null, 2)
    );
    await fs.writeFile(path.join(websiteDir, "src", "App.js"), files.appJs);
    await fs.writeFile(path.join(websiteDir, "src", "App.css"), files.appCss);
    await fs.writeFile(path.join(websiteDir, "src", "index.js"), files.indexJs);
    await fs.writeFile(
      path.join(websiteDir, "src", "index.css"),
      files.indexCss
    );
    await fs.writeFile(
      path.join(websiteDir, "public", "index.html"),
      files.indexHtml
    );

    // Install dependencies and build
    console.log("📦 Installing dependencies...");
    await execPromise("npm install", { cwd: websiteDir });

    console.log("🔨 Building website...");
    await execPromise("npm run build", { cwd: websiteDir });

    // Website is now built in websiteDir/build
    const websiteUrl = `${PUBLIC_URL}/websites/${websiteName}`;

    // Update restaurant record
    restaurant.website = {
      isPublished: true,
      publishedAt: new Date(),
      websiteUrl: websiteUrl,
      localPath: websiteDir,
      config: config,
    };
    await restaurant.save();

    // Create deployment record
    const deployment = new Deployment({
      restaurantId: restaurant._id,
      status: "ready",
      websiteUrl: websiteUrl,
      lastDeployedAt: new Date(),
      buildLogs: [
        `Deployment started`,
        `Files generated`,
        `Dependencies installed`,
        `Website built successfully`,
        `Deployed to: ${websiteUrl}`,
      ],
    });
    await deployment.save();

    console.log(`✅ Website deployed successfully: ${websiteUrl}`);

    res.json({
      success: true,
      websiteUrl: websiteUrl,
      message: "Website deployed successfully!",
      deploymentId: deployment._id,
    });
  } catch (error) {
    console.error("Deployment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deploy website",
      error: error.message,
    });
  }
});

/**
 * Serve built websites statically
 */
router.use("/websites/:websiteName", express.static(WEBSITES_DIR));

/**
 * Download website as ZIP
 */
router.get("/download-website/:restaurantId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.restaurantId,
      ownerId: req.user.userId,
    });

    if (!restaurant || !restaurant.website?.localPath) {
      return res.status(404).json({ message: "Website not found" });
    }

    const archiver = require("archiver");
    const archive = archiver("zip", { zlib: { level: 9 } });

    res.attachment(`${restaurant.slug}-website.zip`);
    archive.pipe(res);

    // Add the built website
    archive.directory(path.join(restaurant.website.localPath, "build"), false);

    // Add source files for editing
    archive.directory(path.join(restaurant.website.localPath, "src"), "src");
    archive.file(path.join(restaurant.website.localPath, "package.json"), {
      name: "package.json",
    });

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ message: "Download failed", error: error.message });
  }
});

router.post("/deploy-vercel", async (req, res) => {
  try {
    const { restaurantId, config } = req.body;

    console.log("🚀 Starting VERCEL deployment for restaurant:", restaurantId);

    // Get restaurant
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      ownerId: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // Check Vercel token
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    if (!VERCEL_TOKEN) {
      return res.status(500).json({
        success: false,
        message: "Vercel token not configured. Add VERCEL_TOKEN to .env file",
      });
    }

    // Get menu items
    const menuItems = await MenuItem.find({
      restaurantId: restaurant._id,
      isAvailable: true,
    });

    // Generate simple HTML (not React)
    const html = generateSimpleHTML(restaurant, menuItems, config);
    console.log("✅ HTML generated:", html.length, "characters");

    // Create project name (slug)
    const projectName = restaurant.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    console.log("📦 Deploying to Vercel as:", projectName);

    // Deploy to Vercel
    const deploymentData = {
      name: projectName,
      files: [
        {
          file: "index.html",
          data: html,
        },
      ],
      projectSettings: {
        framework: null,
      },
    };

    const vercelResponse = await axios.post(
      "https://api.vercel.com/v13/deployments",
      deploymentData,
      {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const websiteUrl = `https://${vercelResponse.data.url}`;
    console.log("✅ Deployed to Vercel:", websiteUrl);

    // Update restaurant record
    restaurant.website = {
      isPublished: true,
      publishedAt: new Date(),
      websiteUrl: websiteUrl,
      vercelDeploymentId: vercelResponse.data.id,
      config: config,
    };
    await restaurant.save();

    // Create deployment record
    const deployment = new Deployment({
      restaurantId: restaurant._id,
      status: "ready",
      websiteUrl: websiteUrl,
      lastDeployedAt: new Date(),
      buildLogs: [
        `Vercel deployment started`,
        `HTML generated`,
        `Deployed to: ${websiteUrl}`,
      ],
    });
    await deployment.save();

    res.json({
      success: true,
      websiteUrl: websiteUrl,
      deploymentId: vercelResponse.data.id,
      message: "Website deployed successfully to Vercel!",
    });
  } catch (error) {
    console.error(
      "❌ Vercel deployment error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Vercel deployment failed",
      error: error.response?.data?.error?.message || error.message,
    });
  }
});

/**
 * Generate simple HTML for Vercel (not React)
 */
function generateSimpleHTML(restaurant, menuItems, config) {
  const {
    brandName = restaurant.name,
    tagline = "Order delicious food online",
    primaryColor = "#EA580C",
    secondaryColor = "#F97316",
    backgroundColor = "#FFFFFF",
    textColor = "#1F2937",
    accentColor = "#10B981",
    showHero = true,
    heroTitle = `Welcome to ${restaurant.name}`,
    heroSubtitle = "Experience authentic flavors",
  } = config;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brandName} - Order Online</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${backgroundColor};
            color: ${textColor};
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
            padding: 2rem;
            text-align: center;
            color: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { font-size: 1.1rem; opacity: 0.95; }
        .btn {
            display: inline-block;
            padding: 0.75rem 2rem;
            background-color: ${accentColor};
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 1rem;
            border: none;
            cursor: pointer;
        }
        .hero {
            background: linear-gradient(to bottom, ${primaryColor}15, ${backgroundColor});
            padding: 4rem 2rem;
            text-align: center;
        }
        .hero h2 { font-size: 2.5rem; color: ${primaryColor}; margin-bottom: 1rem; }
        .container { max-width: 1200px; margin: 0 auto; padding: 3rem 2rem; }
        .section-heading { font-size: 2rem; color: ${primaryColor}; text-align: center; margin-bottom: 2rem; }
        .menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
        }
        .menu-item {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .menu-item:hover { transform: translateY(-4px); }
        .menu-item-image {
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20);
            border-radius: 8px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4rem;
        }
        .menu-item h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .menu-item p { color: ${textColor}; opacity: 0.7; margin-bottom: 1rem; }
        .price { font-size: 1.5rem; font-weight: bold; color: ${primaryColor}; }
        .footer {
            background: ${primaryColor};
            color: white;
            padding: 2rem;
            text-align: center;
            margin-top: 3rem;
        }
        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .menu-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>${brandName}</h1>
        <p>${tagline}</p>
        <a href="#menu" class="btn">View Menu</a>
    </header>

    ${
      showHero
        ? `
    <section class="hero">
        <h2>${heroTitle}</h2>
        <p>${heroSubtitle}</p>
        <a href="#menu" class="btn">Order Now</a>
    </section>
    `
        : ""
    }

    <div class="container" id="menu">
        <h2 class="section-heading">Our Menu</h2>
        <div class="menu-grid">
            ${
              menuItems && menuItems.length > 0
                ? menuItems
                    .slice(0, 9)
                    .map(
                      (item) => `
            <div class="menu-item">
                <div class="menu-item-image">🍽️</div>
                <h3>${item.name}</h3>
                <p>${item.description || "Delicious food item"}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="price">$${item.price.toFixed(2)}</span>
                    <button class="btn" style="margin: 0; padding: 0.5rem 1.5rem;">Add to Cart</button>
                </div>
            </div>
            `
                    )
                    .join("")
                : `
            <div class="menu-item">
                <div class="menu-item-image">🍕</div>
                <h3>Sample Item 1</h3>
                <p>Delicious food</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="price">$12.99</span>
                    <button class="btn" style="margin: 0;">Add</button>
                </div>
            </div>
            <div class="menu-item">
                <div class="menu-item-image">🍔</div>
                <h3>Sample Item 2</h3>
                <p>Tasty option</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="price">$9.99</span>
                    <button class="btn" style="margin: 0;">Add</button>
                </div>
            </div>
            <div class="menu-item">
                <div class="menu-item-image">🥗</div>
                <h3>Sample Item 3</h3>
                <p>Fresh and healthy</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="price">$8.99</span>
                    <button class="btn" style="margin: 0;">Add</button>
                </div>
            </div>
            `
            }
        </div>
    </div>

    <footer class="footer">
        <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">${brandName}</div>
        ${
          restaurant.contact?.phone
            ? `<p>📞 ${restaurant.contact.phone}</p>`
            : ""
        }
        ${
          restaurant.contact?.email
            ? `<p>📧 ${restaurant.contact.email}</p>`
            : ""
        }
        <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">© ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
    </footer>
</body>
</html>`;
}

module.exports = router;
