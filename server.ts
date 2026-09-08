import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  getAllSQLiteData,
  syncAllSQLiteData,
  purgeSQLiteDatabase,
  getSQLiteStats,
  DB_PATH
} from './server/sqliteDb';

const app = express();
const PORT = 3000;

// Middleware for parsing JSON and binary payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS / Local Access Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Al-qalam Science Academy SMS',
    databaseEngine: 'SQLite',
    time: new Date().toISOString()
  });
});

app.get('/api/sqlite/health', (req, res) => {
  try {
    const stats = getSQLiteStats();
    res.json({ status: 'ok', success: true, stats });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// SQLite Stats
app.get('/api/sqlite/stats', (req, res) => {
  try {
    const stats = getSQLiteStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Load All Data from SQLite
app.get('/api/sqlite/data', (req, res) => {
  try {
    const data = getAllSQLiteData();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Failed to load SQLite data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync / Persist Data to SQLite
app.post('/api/sqlite/sync', (req, res) => {
  try {
    const result = syncAllSQLiteData(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Failed to sync SQLite data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Purge / Clean SQLite Database
app.post('/api/sqlite/purge', (req, res) => {
  try {
    const result = purgeSQLiteDatabase();
    res.json(result);
  } catch (error: any) {
    console.error('Failed to purge SQLite database:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download Raw SQLite File (.db)
app.get('/api/sqlite/download', (req, res) => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return res.status(404).json({ success: false, error: 'Database file not found.' });
    }
    res.download(DB_PATH, 'alqalam_school_database.sqlite');
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SQLite Server] Running on http://0.0.0.0:${PORT} (Database: ${DB_PATH})`);
  });
}

startServer();
