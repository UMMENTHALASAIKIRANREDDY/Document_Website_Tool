const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const assetsDir = path.join(__dirname, 'assets');
const screenshotsDir = path.join(assetsDir, 'screenshots');
const dataFile = path.join(assetsDir, 'data.json');

[assetsDir, screenshotsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify({ categories: [], features: [] }, null, 2));
}

function readData() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

app.use('/assets', express.static(assetsDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: screenshotsDir,
    filename: (req, file, cb) => {
      const featureName = req.body.featureName || '';
      const ext = path.extname(file.originalname) || '.png';
      if (featureName) {
        const safe = featureName.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_');
        const idx = req.fileIndex = (req.fileIndex || 0) + 1;
        cb(null, `${safe}_screenshot_${idx}_${Date.now()}${ext}`);
      } else {
        const safeName = decodeURIComponent(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
      }
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// --- Categories ---

app.get('/api/categories', (req, res) => {
  try {
    const data = readData();
    const grouped = {};
    data.categories.forEach(cat => {
      if (!grouped[cat.group]) grouped[cat.group] = [];
      grouped[cat.group].push({ name: cat.name, slug: cat.slug });
    });
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const { group, name, slug } = req.body;
    if (!group || !name || !slug) {
      return res.status(400).json({ error: 'group, name, and slug are required' });
    }
    const data = readData();
    const exists = data.categories.find(c => c.slug === slug);
    if (!exists) {
      data.categories.push({ group, name, slug });
      writeData(data);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Features ---

app.get('/api/features', (req, res) => {
  try {
    const { category, productType, scope, combination, search, tag } = req.query;
    const data = readData();

    let features = data.features;

    const pt = productType || category;
    if (pt) {
      features = features.filter(f => (f.productType || f.categorySlug) === pt);
    }

    if (scope) {
      features = features.filter(f => f.scope === scope);
    }

    if (combination) {
      features = features.filter(f => f.combination === combination);
    }

    if (search) {
      const q = search.toLowerCase();
      features = features.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
      );
    }

    if (tag && tag !== 'All') {
      features = features.filter(f => f.family === tag);
    }

    const allTags = new Set();
    const scopeFeatures = data.features.filter(f =>
      (!category || f.categorySlug === category) &&
      (!scope || f.scope === scope)
    );
    scopeFeatures.forEach(f => {
      if (f.family) allTags.add(f.family);
    });

    res.json({
      features,
      tags: ['All', ...Array.from(allTags).sort()],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/features', (req, res) => {
  try {
    const { categorySlug, productType, scope, combination, name, description, family, screenshots } = req.body;
    const pt = productType || categorySlug;
    if (!pt || !scope || !name) {
      return res.status(400).json({ error: 'productType, scope, and name are required' });
    }
    const data = readData();
    const feature = {
      id: generateId(),
      productType: pt,
      categorySlug: pt,
      scope,
      combination: combination || '',
      name,
      description: description || '',
      family: family || '',
      screenshots: screenshots || [],
      createdAt: new Date().toISOString(),
    };
    data.features.push(feature);
    writeData(data);
    res.json({ success: true, feature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/features/bulk', (req, res) => {
  try {
    const { features: featureList } = req.body;
    if (!Array.isArray(featureList) || featureList.length === 0) {
      return res.status(400).json({ error: 'features array is required' });
    }
    const data = readData();
    const saved = [];
    for (const f of featureList) {
      const pt = f.productType || f.categorySlug;
      if (!pt || !f.scope || !f.name) continue;
      const feature = {
        id: generateId(),
        productType: pt,
        categorySlug: pt,
        scope: f.scope,
        combination: f.combination || '',
        name: f.name,
        description: f.description || '',
        family: f.family || '',
        screenshots: f.screenshots || [],
        createdAt: new Date().toISOString(),
      };
      data.features.push(feature);
      saved.push(feature);
    }
    writeData(data);
    res.json({ success: true, features: saved, count: saved.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/features/:id', (req, res) => {
  try {
    const data = readData();
    const idx = data.features.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Feature not found' });

    const updates = req.body;
    data.features[idx] = { ...data.features[idx], ...updates };
    writeData(data);
    res.json({ success: true, feature: data.features[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/features/:id', (req, res) => {
  try {
    const data = readData();
    data.features = data.features.filter(f => f.id !== req.params.id);
    writeData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Screenshot Upload ---

app.post('/api/screenshots', upload.array('screenshots', 20), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const paths = req.files.map(f => `/assets/screenshots/${f.filename}`);
    res.json({ success: true, paths });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
