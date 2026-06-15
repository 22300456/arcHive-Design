import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_ARCHIVE_ITEMS } from './src/data';

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data-store.json');

// Ensure database file is initialized with seed data if not present
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_ARCHIVE_ITEMS, null, 2), 'utf-8');
}

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up JSON parsing with generous limit for high-quality base64 image uploads
app.use(express.json({ limit: '75mb' }));

// Helper to load records
function loadRecords() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Failed to read data-store.json:', error);
  }
  return INITIAL_ARCHIVE_ITEMS;
}

// Helper to save records
function saveRecords(records: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to save data-store.json:', error);
    return false;
  }
}

// 1. API: Get all archive records
app.get('/api/archive-records', (req, res) => {
  const records = loadRecords();
  res.json(records);
});

// 2. API: Add a new archive record
app.post('/api/archive-records', (req, res) => {
  try {
    const newItem = req.body;
    if (!newItem || !newItem.id) {
      return res.status(400).json({ error: 'Invalid record data' });
    }
    const records = loadRecords();
    
    // De-duplicate if ID already exists
    const filtered = records.filter(item => item.id !== newItem.id);
    const updated = [newItem, ...filtered];
    
    saveRecords(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. API: Update an existing record
app.put('/api/archive-records/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updatedItem = req.body;
    if (!updatedItem) {
      return res.status(400).json({ error: 'Invalid update body' });
    }
    const records = loadRecords();
    const updated = records.map(item => item.id === id ? updatedItem : item);
    saveRecords(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. API: Delete an existing record
app.delete('/api/archive-records/:id', (req, res) => {
  try {
    const { id } = req.params;
    const records = loadRecords();
    const updated = records.filter(item => item.id !== id);
    saveRecords(updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. API: Reset to initial default seed template
app.post('/api/archive-records/reset', (req, res) => {
  try {
    saveRecords(INITIAL_ARCHIVE_ITEMS);
    
    // Optionally clean extra files in uploads folder
    try {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    } catch (e) {
      console.warn('Could not clear uploads folder completely:', e);
    }

    res.json(INITIAL_ARCHIVE_ITEMS);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. API: Upload raw base64 data as a physical file served statically
app.post('/api/upload', (req, res) => {
  try {
    const { filename, base64 } = req.body;
    if (!filename || !base64) {
      return res.status(400).json({ error: 'Missing filename or base64 data' });
    }

    // Extract extensions, cleaning file name to prevent collision or vulnerability
    const ext = path.extname(filename) || '.jpg';
    const cleanFilename = `uploaded-${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
    const filePath = path.join(uploadsDir, cleanFilename);

    let base64String = base64;
    const matches = base64.match(/^data:.+;base64,(.*)$/);
    if (matches && matches.length > 1) {
      base64String = matches[1];
    }

    fs.writeFileSync(filePath, Buffer.from(base64String, 'base64'));

    const fileUrl = `/uploads/${cleanFilename}`;
    console.log(`[Upload] Image saved successfully to storage: ${fileUrl}`);
    res.json({ url: fileUrl });
  } catch (error: any) {
    console.error('[Upload] Error saving file to server disk:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve physical static uploaded files in our filesystem uploads folder
app.use('/uploads', express.static(uploadsDir));

// Vite setup depending on environment
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production compiled build folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Portfolio backend listening securely on port http://localhost:${PORT}`);
  });
}

setupServer();
