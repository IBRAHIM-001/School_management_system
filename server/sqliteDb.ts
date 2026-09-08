import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export interface SQLiteSyncPayload {
  classes?: any[];
  years?: any[];
  terms?: any[];
  students?: any[];
  categories?: any[];
  products?: any[];
  billings?: any[];
  breakdowns?: any[];
  allocations?: any[];
  logs?: any[];
  userAccounts?: any[];
  settings?: Record<string, string>;
  activeTermId?: number;
}

const DB_FILENAME = process.env.SQLITE_DB_NAME || 'school_management.db';
const DB_DIR = process.env.SQLITE_DB_DIR || path.join(process.cwd(), 'database');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const DB_PATH = path.join(DB_DIR, DB_FILENAME);

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initDatabaseSchema(dbInstance);
  }
  return dbInstance;
}

function initDatabaseSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      class_id INTEGER PRIMARY KEY,
      class_name TEXT NOT NULL,
      section TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      year_id INTEGER PRIMARY KEY,
      year_label TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS terms (
      term_id INTEGER PRIMARY KEY,
      term_name TEXT NOT NULL,
      year_id INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      student_id INTEGER PRIMARY KEY,
      admission_no TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      gender TEXT,
      date_of_birth TEXT,
      current_class_id INTEGER NOT NULL,
      parent_phone TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      category_id INTEGER PRIMARY KEY,
      category_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      product_id INTEGER PRIMARY KEY,
      product_name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      stock_quantity INTEGER NOT NULL,
      price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS billings (
      billing_id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL,
      term_id INTEGER NOT NULL,
      offline_ref_code TEXT NOT NULL,
      total_amount_due REAL NOT NULL,
      amount_paid REAL NOT NULL,
      prior_debt_accumulated REAL NOT NULL,
      payment_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS billing_items (
      breakdown_id INTEGER PRIMARY KEY,
      billing_id INTEGER NOT NULL,
      item_description TEXT NOT NULL,
      amount REAL NOT NULL,
      product_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS stock_allocations (
      allocation_id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      billing_id INTEGER NOT NULL,
      allocation_status TEXT NOT NULL,
      date_allocated TEXT NOT NULL,
      date_delivered TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      log_id INTEGER PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_accounts (
      user_id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrate existing students table schema if columns are missing
  try {
    const studentCols = db.prepare('PRAGMA table_info(students)').all() as any[];
    const colNames = studentCols.map((c: any) => c.name);
    if (!colNames.includes('gender')) {
      db.exec('ALTER TABLE students ADD COLUMN gender TEXT;');
    }
    if (!colNames.includes('date_of_birth')) {
      db.exec('ALTER TABLE students ADD COLUMN date_of_birth TEXT;');
    }
  } catch (migErr) {
    console.warn('Students table migration check warning:', migErr);
  }

  // Initialize default admin accounts if empty
  const usersCount = (db.prepare('SELECT COUNT(*) as count FROM user_accounts').get() as any)?.count || 0;
  if (usersCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO user_accounts (user_id, username, full_name, role, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertUser.run(1, 'admin', 'Sani Abdullahi', 'Admin', 'password');
    insertUser.run(2, 'cashier', 'Aisha Abubakar', 'Cashier', 'password');
    insertUser.run(3, 'store', 'Ibrahim Danbaba', 'Inventory Manager', 'password');
  }

  // Initialize default settings if empty
  const settingsCount = (db.prepare('SELECT COUNT(*) as count FROM system_settings').get() as any)?.count || 0;
  if (settingsCount === 0) {
    const insertSetting = db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)');
    insertSetting.run('school_name', 'Al-qalam Science Academy, Gusau');
    insertSetting.run('lan_ip', '192.168.1.15');
    insertSetting.run('currency', '₦');
    insertSetting.run('tuition_pre_primary', '20000');
    insertSetting.run('tuition_primary', '25000');
    insertSetting.run('tuition_jss', '30000');
    insertSetting.run('tuition_sss', '35000');
    insertSetting.run('active_term_id', '0');
  }
}

export function getAllSQLiteData() {
  const db = getDatabase();

  const classes = db.prepare('SELECT * FROM classes ORDER BY class_id ASC').all();
  const years = db.prepare('SELECT * FROM academic_years ORDER BY year_id ASC').all();
  const terms = db.prepare('SELECT * FROM terms ORDER BY term_id ASC').all();
  const students = db.prepare('SELECT * FROM students ORDER BY student_id ASC').all().map((s: any) => ({
    ...s,
    is_active: s.is_active !== 0
  }));
  const categories = db.prepare('SELECT * FROM product_categories ORDER BY category_id ASC').all();
  const products = db.prepare('SELECT * FROM products ORDER BY product_id ASC').all();
  const billings = db.prepare('SELECT * FROM billings ORDER BY billing_id ASC').all();
  const breakdowns = db.prepare('SELECT * FROM billing_items ORDER BY breakdown_id ASC').all();
  const allocations = db.prepare('SELECT * FROM stock_allocations ORDER BY allocation_id ASC').all();
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY log_id DESC LIMIT 1000').all();
  const userAccounts = db.prepare('SELECT * FROM user_accounts ORDER BY user_id ASC').all();

  const settingsRows = db.prepare('SELECT * FROM system_settings').all() as any[];
  const settings: Record<string, string> = {};
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  const activeTermId = settings['active_term_id'] ? Number(settings['active_term_id']) : 0;

  return {
    classes,
    years,
    terms,
    students,
    categories,
    products,
    billings,
    breakdowns,
    allocations,
    logs,
    userAccounts,
    settings,
    activeTermId,
    dbStats: getSQLiteStats()
  };
}

export function syncAllSQLiteData(payload: SQLiteSyncPayload) {
  const db = getDatabase();

  db.exec('BEGIN TRANSACTION;');
  try {
    if (payload.classes !== undefined) {
      db.exec('DELETE FROM classes;');
      const stmt = db.prepare('INSERT INTO classes (class_id, class_name, section) VALUES (?, ?, ?)');
      for (const item of payload.classes) {
        stmt.run(
          Number(item.class_id),
          String(item.class_name || ''),
          String(item.section || 'Primary')
        );
      }
    }

    if (payload.years !== undefined) {
      db.exec('DELETE FROM academic_years;');
      const stmt = db.prepare('INSERT INTO academic_years (year_id, year_label, status) VALUES (?, ?, ?)');
      for (const item of payload.years) {
        stmt.run(
          Number(item.year_id),
          String(item.year_label || ''),
          String(item.status || 'Active')
        );
      }
    }

    if (payload.terms !== undefined) {
      db.exec('DELETE FROM terms;');
      const stmt = db.prepare('INSERT INTO terms (term_id, term_name, year_id) VALUES (?, ?, ?)');
      for (const item of payload.terms) {
        stmt.run(
          Number(item.term_id),
          String(item.term_name || 'Term 1'),
          Number(item.year_id)
        );
      }
    }

    if (payload.students !== undefined) {
      try {
        const studentCols = db.prepare('PRAGMA table_info(students)').all() as any[];
        const colNames = studentCols.map((c: any) => c.name);
        if (!colNames.includes('gender')) {
          db.exec('ALTER TABLE students ADD COLUMN gender TEXT;');
        }
        if (!colNames.includes('date_of_birth')) {
          db.exec('ALTER TABLE students ADD COLUMN date_of_birth TEXT;');
        }
      } catch {}

      db.exec('DELETE FROM students;');
      const stmt = db.prepare(`
        INSERT INTO students (
          student_id, admission_no, first_name, last_name, gender, date_of_birth, current_class_id, parent_phone, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of payload.students) {
        stmt.run(
          Number(item.student_id),
          String(item.admission_no || ''),
          String(item.first_name || ''),
          String(item.last_name || ''),
          item.gender ? String(item.gender) : null,
          item.date_of_birth ? String(item.date_of_birth) : null,
          Number(item.current_class_id || 0),
          String(item.parent_phone || ''),
          item.is_active === false ? 0 : 1
        );
      }
    }

    if (payload.categories !== undefined) {
      db.exec('DELETE FROM product_categories;');
      const stmt = db.prepare('INSERT INTO product_categories (category_id, category_name) VALUES (?, ?)');
      for (const item of payload.categories) {
        stmt.run(
          Number(item.category_id),
          String(item.category_name || '')
        );
      }
    }

    if (payload.products !== undefined) {
      db.exec('DELETE FROM products;');
      const stmt = db.prepare('INSERT INTO products (product_id, product_name, category_id, stock_quantity, price) VALUES (?, ?, ?, ?, ?)');
      for (const item of payload.products) {
        stmt.run(
          Number(item.product_id),
          String(item.product_name || ''),
          Number(item.category_id || 0),
          Number(item.stock_quantity || 0),
          Number(item.price || 0)
        );
      }
    }

    if (payload.billings !== undefined) {
      db.exec('DELETE FROM billings;');
      const stmt = db.prepare(`
        INSERT INTO billings (
          billing_id, student_id, term_id, offline_ref_code, total_amount_due,
          amount_paid, prior_debt_accumulated, payment_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of payload.billings) {
        stmt.run(
          Number(item.billing_id),
          Number(item.student_id),
          Number(item.term_id),
          String(item.offline_ref_code || ''),
          Number(item.total_amount_due || 0),
          Number(item.amount_paid || 0),
          Number(item.prior_debt_accumulated || 0),
          String(item.payment_status || 'Unpaid'),
          String(item.created_at || new Date().toISOString())
        );
      }
    }

    if (payload.breakdowns !== undefined) {
      db.exec('DELETE FROM billing_items;');
      const stmt = db.prepare(`
        INSERT INTO billing_items (
          breakdown_id, billing_id, item_description, amount, product_id
        ) VALUES (?, ?, ?, ?, ?)
      `);
      for (const item of payload.breakdowns) {
        stmt.run(
          Number(item.breakdown_id),
          Number(item.billing_id),
          String(item.item_description || ''),
          Number(item.amount || 0),
          item.product_id ? Number(item.product_id) : null
        );
      }
    }

    if (payload.allocations !== undefined) {
      db.exec('DELETE FROM stock_allocations;');
      const stmt = db.prepare(`
        INSERT INTO stock_allocations (
          allocation_id, student_id, product_id, billing_id, allocation_status, date_allocated, date_delivered
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of payload.allocations) {
        stmt.run(
          Number(item.allocation_id),
          Number(item.student_id),
          Number(item.product_id),
          Number(item.billing_id),
          String(item.allocation_status || 'Pending Supply'),
          String(item.date_allocated || new Date().toISOString()),
          item.date_delivered ? String(item.date_delivered) : null
        );
      }
    }

    if (payload.logs !== undefined) {
      db.exec('DELETE FROM audit_logs;');
      const stmt = db.prepare('INSERT INTO audit_logs (log_id, user_id, action, timestamp) VALUES (?, ?, ?, ?)');
      for (const item of payload.logs) {
        stmt.run(
          Number(item.log_id),
          String(item.user_id || 'Admin'),
          String(item.action || ''),
          String(item.timestamp || new Date().toISOString())
        );
      }
    }

    if (payload.userAccounts !== undefined && payload.userAccounts.length > 0) {
      db.exec('DELETE FROM user_accounts;');
      const stmt = db.prepare('INSERT INTO user_accounts (user_id, username, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?)');
      for (const item of payload.userAccounts) {
        stmt.run(
          Number(item.user_id),
          String(item.username),
          String(item.full_name),
          String(item.role),
          String(item.password_hash)
        );
      }
    }

    if (payload.settings) {
      const stmt = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');
      for (const [k, v] of Object.entries(payload.settings)) {
        stmt.run(String(k), String(v));
      }
    }

    if (payload.activeTermId !== undefined) {
      const stmt = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');
      stmt.run('active_term_id', String(payload.activeTermId));
    }

    db.exec('COMMIT;');
    return { success: true, message: 'SQLite database successfully synchronized.', stats: getSQLiteStats() };
  } catch (error: any) {
    db.exec('ROLLBACK;');
    console.error('Error syncing SQLite database:', error);
    throw error;
  }
}

export function purgeSQLiteDatabase() {
  const db = getDatabase();
  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec(`
      DELETE FROM classes;
      DELETE FROM academic_years;
      DELETE FROM terms;
      DELETE FROM students;
      DELETE FROM product_categories;
      DELETE FROM products;
      DELETE FROM billings;
      DELETE FROM billing_items;
      DELETE FROM stock_allocations;
      DELETE FROM audit_logs;
      UPDATE system_settings SET value = '0' WHERE key = 'active_term_id';
    `);

    // Insert clean initialization log
    const stmt = db.prepare('INSERT INTO audit_logs (log_id, user_id, action, timestamp) VALUES (?, ?, ?, ?)');
    stmt.run(1, 'Admin', 'SQLite system database reset: all classes, academic sessions, and records purged.', new Date().toISOString());

    db.exec('COMMIT;');
    return { success: true, message: 'SQLite database successfully purged.', stats: getSQLiteStats() };
  } catch (error: any) {
    db.exec('ROLLBACK;');
    console.error('Error purging SQLite database:', error);
    throw error;
  }
}

export function getSQLiteStats() {
  const db = getDatabase();
  let fileSizeBytes = 0;
  let lastModified = '';

  try {
    if (fs.existsSync(DB_PATH)) {
      const stat = fs.statSync(DB_PATH);
      fileSizeBytes = stat.size;
      lastModified = stat.mtime.toISOString();
    }
  } catch {
    // Ignore stat failures
  }

  const countClasses = (db.prepare('SELECT COUNT(*) as c FROM classes').get() as any)?.c || 0;
  const countYears = (db.prepare('SELECT COUNT(*) as c FROM academic_years').get() as any)?.c || 0;
  const countTerms = (db.prepare('SELECT COUNT(*) as c FROM terms').get() as any)?.c || 0;
  const countStudents = (db.prepare('SELECT COUNT(*) as c FROM students').get() as any)?.c || 0;
  const countCategories = (db.prepare('SELECT COUNT(*) as c FROM product_categories').get() as any)?.c || 0;
  const countProducts = (db.prepare('SELECT COUNT(*) as c FROM products').get() as any)?.c || 0;
  const countBillings = (db.prepare('SELECT COUNT(*) as c FROM billings').get() as any)?.c || 0;
  const countItems = (db.prepare('SELECT COUNT(*) as c FROM billing_items').get() as any)?.c || 0;
  const countAllocations = (db.prepare('SELECT COUNT(*) as c FROM stock_allocations').get() as any)?.c || 0;
  const countLogs = (db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as any)?.c || 0;
  const countUsers = (db.prepare('SELECT COUNT(*) as c FROM user_accounts').get() as any)?.c || 0;

  return {
    dbEngine: 'SQLite 3 (node:sqlite)',
    dbFile: DB_FILENAME,
    dbFullPath: DB_PATH,
    exists: fs.existsSync(DB_PATH),
    fileSizeBytes,
    lastModified,
    tableCounts: {
      classes: countClasses,
      years: countYears,
      terms: countTerms,
      students: countStudents,
      categories: countCategories,
      products: countProducts,
      billings: countBillings,
      billing_items: countItems,
      allocations: countAllocations,
      audit_logs: countLogs,
      user_accounts: countUsers
    }
  };
}
