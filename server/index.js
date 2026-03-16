require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const Feature = require('./models/Feature');
const Category = require('./models/Category');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --------------- Admin Auth ---------------

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, token });
  }
  res.status(401).json({ error: 'Invalid email or password' });
});

app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    res.json({ success: true, email: decoded.email });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// --------------- MongoDB Connection ---------------

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// --------------- Upload Config (Cloudinary or Local) ---------------

const assetsDir = path.join(__dirname, 'assets');
const screenshotsDir = path.join(assetsDir, 'screenshots');
[assetsDir, screenshotsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
app.use('/assets', express.static(assetsDir));

let upload;
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET
  && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

if (useCloudinary) {
  const { v2: cloudinary } = require('cloudinary');
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'docproject-screenshots',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });

  upload = multer({ storage: cloudinaryStorage });
  console.log('Using Cloudinary for image storage');
} else {
  const localStorage = multer.diskStorage({
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
  });

  upload = multer({
    storage: localStorage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files allowed'));
    },
  });
  console.log('Using local disk for image storage (set CLOUDINARY_ env vars for cloud storage)');
}

// --------------- Data Migration Helper ---------------

async function migrateLocalData() {
  const dataFile = path.join(assetsDir, 'data.json');
  if (!fs.existsSync(dataFile)) return;

  const existingCount = await Feature.countDocuments();
  if (existingCount > 0) {
    console.log(`MongoDB already has ${existingCount} features — skipping migration`);
    return;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

    if (raw.categories && raw.categories.length > 0) {
      await Category.insertMany(raw.categories, { ordered: false }).catch(() => {});
      console.log(`Migrated ${raw.categories.length} categories`);
    }

    if (raw.features && raw.features.length > 0) {
      const docs = raw.features.map(f => ({
        productType: f.productType || f.categorySlug,
        scope: f.scope,
        combination: f.combination || '',
        name: f.name,
        description: f.description || '',
        family: f.family || '',
        screenshots: f.screenshots || [],
      }));
      await Feature.insertMany(docs);
      console.log(`Migrated ${docs.length} features`);
    }

    const backupPath = dataFile + '.bak';
    fs.renameSync(dataFile, backupPath);
    console.log(`Local data.json backed up to data.json.bak`);
  } catch (err) {
    console.error('Migration error:', err.message);
  }
}

mongoose.connection.once('open', () => {
  migrateLocalData();
});

// --------------- Categories ---------------

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().lean();
    const grouped = {};
    categories.forEach(cat => {
      if (!grouped[cat.group]) grouped[cat.group] = [];
      grouped[cat.group].push({ name: cat.name, slug: cat.slug });
    });
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { group, name, slug } = req.body;
    if (!group || !name || !slug) {
      return res.status(400).json({ error: 'group, name, and slug are required' });
    }
    await Category.findOneAndUpdate(
      { slug },
      { group, name, slug },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------- Features ---------------

function mapFeature(f) {
  return {
    id: f._id.toString(),
    productType: f.productType,
    categorySlug: f.productType,
    scope: f.scope,
    combination: f.combination,
    name: f.name,
    description: f.description,
    family: f.family,
    screenshots: f.screenshots,
    createdAt: f.createdAt,
  };
}

app.get('/api/features', async (req, res) => {
  try {
    const { category, productType, scope, combination, search, tag } = req.query;
    const filter = {};

    const pt = productType || category;
    if (pt) filter.productType = pt;
    if (scope) filter.scope = scope;
    if (combination) filter.combination = combination;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { description: regex }];
    }

    if (tag && tag !== 'All') {
      filter.family = tag;
    }

    const features = await Feature.find(filter).sort({ createdAt: -1 }).lean();

    const tagFilter = {};
    if (pt) tagFilter.productType = pt;
    if (scope) tagFilter.scope = scope;
    if (combination) tagFilter.combination = combination;
    const allFeatures = await Feature.find(tagFilter).select('family').lean();
    const allTags = new Set();
    allFeatures.forEach(f => { if (f.family) allTags.add(f.family); });

    res.json({
      features: features.map(mapFeature),
      tags: ['All', ...Array.from(allTags).sort()],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/features', async (req, res) => {
  try {
    const { categorySlug, productType, scope, combination, name, description, family, screenshots } = req.body;
    const pt = productType || categorySlug;
    if (!pt || !scope || !name) {
      return res.status(400).json({ error: 'productType, scope, and name are required' });
    }
    const feature = await Feature.create({
      productType: pt,
      scope,
      combination: combination || '',
      name,
      description: description || '',
      family: family || '',
      screenshots: screenshots || [],
    });
    res.json({ success: true, feature: mapFeature(feature.toObject()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/features/bulk', async (req, res) => {
  try {
    const { features: featureList } = req.body;
    if (!Array.isArray(featureList) || featureList.length === 0) {
      return res.status(400).json({ error: 'features array is required' });
    }
    const docs = featureList
      .filter(f => (f.productType || f.categorySlug) && f.scope && f.name)
      .map(f => ({
        productType: f.productType || f.categorySlug,
        scope: f.scope,
        combination: f.combination || '',
        name: f.name,
        description: f.description || '',
        family: f.family || '',
        screenshots: f.screenshots || [],
      }));

    const saved = await Feature.insertMany(docs);
    const mapped = saved.map(f => mapFeature(f.toObject()));
    res.json({ success: true, features: mapped, count: mapped.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/features/:id', async (req, res) => {
  try {
    const feature = await Feature.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!feature) return res.status(404).json({ error: 'Feature not found' });
    res.json({ success: true, feature: mapFeature(feature) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/features/:id', async (req, res) => {
  try {
    const feature = await Feature.findById(req.params.id).lean();
    if (!feature) return res.status(404).json({ error: 'Feature not found' });

    if (useCloudinary) {
      const { v2: cloudinary } = require('cloudinary');
      for (const url of (feature.screenshots || [])) {
        if (url.includes('cloudinary.com')) {
          const parts = url.split('/');
          const filenameWithExt = parts.pop();
          const folder = parts.pop();
          const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId).catch(() => {});
        }
      }
    }

    await Feature.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------- Screenshot Upload ---------------

app.post('/api/screenshots', upload.array('screenshots', 20), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const paths = req.files.map(f => {
      if (f.path && f.path.startsWith('http')) return f.path;
      return `/assets/screenshots/${f.filename}`;
    });
    res.json({ success: true, paths });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------- Start Server ---------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
