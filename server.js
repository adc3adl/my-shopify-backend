// server.js — backend with better-sqlite3 instead of sqlite3

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const axios = require('axios');
const querystring = require('querystring');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = 3001;

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const APP_URL = process.env.APP_URL;
const SCOPES = process.env.SCOPES || "write_script_tags,read_customers,write_customers";

const path = require('path');

// === Middleware
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) req.url = req.path;
  next();
});

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));

app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// === DB ===
const db = new Database('./shopify.db');

db.prepare(`CREATE TABLE IF NOT EXISTS add_to_cart_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT,
  title TEXT,
  url TEXT,
  customer_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS shop_tokens (
  shop TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

// === OAuth routes ===
app.get('/auth', (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('Missing shop parameter!');

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${APP_URL}/auth/callback`;

  const installUrl = `https://${shop}/admin/oauth/authorize?` + querystring.stringify({
    client_id: SHOPIFY_API_KEY,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  });
  console.log("[SHOPIFY INSTALL URL]", installUrl);
  res.redirect(installUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { shop, code } = req.query;
  if (!shop || !code) return res.status(400).send('Required parameters missing');

  try {
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    });

    const accessToken = tokenRes.data.access_token;

    db.prepare("INSERT OR REPLACE INTO shop_tokens (shop, token) VALUES (?, ?)").run(shop, accessToken);

    const scriptFiles = ["wishlist-modal.js", "wishlist.js", "add-to-cart.js"];
    let results = [];
    for (const scriptName of scriptFiles) {
      const scriptUrl = `${APP_URL}/${scriptName}`;
      try {
        await axios.post(`https://${shop}/admin/api/2024-01/script_tags.json`, {
          script_tag: { event: "onload", src: scriptUrl, display_scope: "all" }
        }, {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json"
          }
        });
        results.push(`<li style=\"color:green\">✅ ${scriptName} подключён</li>`);
      } catch (e) {
        results.push(`<li style=\"color:red\">❌ ${scriptName}: ${e.response?.data?.errors || e.message}</li>`);
      }
    }

    res.send(`<h3>✅ App installed!</h3><ul>${results.join('')}</ul><a href=\"/\">На главную</a>`);
  } catch (err) {
    console.error("OAuth callback error:", err.response?.data || err.message);
    res.status(500).send("OAuth error");
  }
});

// === Add to cart logging ===
app.post('/api/add-to-cart', (req, res) => {
  const { productId, title, url, customerId } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId required' });

  try {
    const stmt = db.prepare(`INSERT INTO add_to_cart_events (product_id, title, url, customer_id) VALUES (?, ?, ?, ?)`);
    const info = stmt.run(productId, title || '', url || '', customerId || '');
    res.json({ status: 'ok', id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Wishlist API ===
app.post('/api/wishlist', async (req, res) => {
  const { customerId, productId: variantId, action, quantity } = req.body;
  if (!customerId || !variantId || !['add', 'remove', 'update'].includes(action)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ADMIN_TOKEN;
    let wishlist = [];

    const { data: metafieldsData } = await axios.get(`https://${shop}/admin/api/2024-01/customers/${customerId}/metafields.json`, {
      headers: { "X-Shopify-Access-Token": token }
    });

    const metafield = metafieldsData.metafields.find(f => f.namespace === "custom_data" && f.key === "wishlist");
    if (metafield?.value) wishlist = JSON.parse(metafield.value).filter(Boolean);

    if (action === "update") {
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      wishlist = wishlist.map(p =>
        typeof p === "object" && p.id === variantId ? { ...p, quantity } : (p === variantId ? { id: variantId, quantity } : p)
      );
    } else if (action === "add") {
      if (!wishlist.some(p => (typeof p === 'object' ? p.id : p) === variantId)) {
        wishlist.push({ id: variantId, quantity: 1 });
      }
    } else if (action === "remove") {
      wishlist = wishlist.filter(p => (typeof p === 'object' ? p.id : p) !== variantId);
    }

    if (metafield?.id) {
      await axios.delete(`https://${shop}/admin/api/2024-01/metafields/${metafield.id}.json`, {
        headers: { "X-Shopify-Access-Token": token }
      });
    }

    if (wishlist.length === 0) return res.json({ status: "ok", wishlist });

    const payload = {
      metafield: {
        namespace: "custom_data",
        key: "wishlist",
        type: "json",
        value: JSON.stringify(wishlist),
        owner_id: customerId,
        owner_resource: "customer"
      }
    };

    await axios.post(`https://${shop}/admin/api/2024-01/metafields.json`, payload, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json"
      }
    });

    res.json({ status: "ok", wishlist });
  } catch (e) {
    console.error("❌ Wishlist update error:", e.response?.data || e.message);
    res.status(500).json({ error: "Failed to update metafield" });
  }
});

// === Get Wishlist
app.get("/api/wishlist-get", async (req, res) => {
  const { customerId } = req.query;
  if (!customerId) return res.status(400).json({ error: "Missing customerId" });

  try {
    const { data: metafieldsData } = await axios.get(`https://${process.env.SHOPIFY_SHOP}/admin/api/2024-01/customers/${customerId}/metafields.json`, {
      headers: { "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN }
    });

    const metafield = metafieldsData.metafields.find(f => f.namespace === "custom_data" && f.key === "wishlist");
    if (!metafield?.value) return res.json({ products: [] });

    const variantEntries = JSON.parse(metafield.value).filter(Boolean);
    if (!Array.isArray(variantEntries) || variantEntries.length === 0) return res.json({ products: [] });

    const variantMap = new Map();
    const uniqueProductIds = new Set();

    for (const entry of variantEntries) {
      const variantId = typeof entry === "object" ? entry.id : entry;
      try {
        const { data: variantData } = await axios.get(`https://${process.env.SHOPIFY_SHOP}/admin/api/2024-01/variants/${variantId}.json`, {
          headers: { "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN }
        });
        const productId = variantData.variant.product_id;
        uniqueProductIds.add(productId);
        variantMap.set(productId, { id: variantId, quantity: entry.quantity || 1 });
      } catch (err) {
        console.error("❌ Variant fetch error:", err.response?.data || err.message);
      }
    }

    const { data: productData } = await axios.get(`https://${process.env.SHOPIFY_SHOP}/admin/api/2024-01/products.json`, {
      headers: { "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN },
      params: { ids: Array.from(uniqueProductIds).join(",") }
    });

    const products = productData.products.map(p => {
      const v = variantMap.get(p.id);
      return {
        id: v?.id || p.variants[0]?.id,
        title: p.title,
        url: `/products/${p.handle}`,
        price: p.variants[0]?.price || '—',
        currency: 'UAH',
        image: p.image?.src || p.images?.[0]?.src || "https://placehold.co/80x80?text=No+Image",
        quantity: v.quantity || 1
      };
    });

    res.json({ products });
  } catch (e) {
    console.error("❌ wishlist-get error:", e.response?.data || e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// === TEMPORARY DEBUG ROUTE — view database entries
app.get('/debug/all-events', (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM add_to_cart_events ORDER BY created_at DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("❌ Error in /debug/all-events:", err.message);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
