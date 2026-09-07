import { 
  SchoolClass, 
  AcademicYear, 
  Term, 
  Student, 
  ProductCategory, 
  Product, 
  Billing, 
  BillingBreakdownItem, 
  StockAllocation, 
  AuditLog, 
  UserAccount 
} from '../types';

export function generateSqlDump(data: {
  classes: SchoolClass[];
  years: AcademicYear[];
  terms: Term[];
  students: Student[];
  categories: ProductCategory[];
  products: Product[];
  billings: Billing[];
  breakdowns: BillingBreakdownItem[];
  allocations: StockAllocation[];
  logs: AuditLog[];
  userAccounts: UserAccount[];
  activeTermId: number;
}): string {
  // Helper to escape SQL string values safely
  const escapeString = (str: string) => {
    return str.replace(/'/g, "''");
  };

  const escapeVal = (val: any) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return `'${escapeString(val.toString())}'`;
  };

  let sql = `-- ==========================================
-- AL-QALAM SCIENCE ACADEMY DATABASE BACKUP
-- Generated on: ${new Date().toLocaleString()}
-- Target Schema: PostgreSQL / Generic SQL
-- Format Version: 1.0 (Direct SQL Executable & Live Importable)
-- ==========================================\n\n`;

  // Embed the schema data payload as small segmented comments for absolute foolproof browser recovery
  const jsonPayload = JSON.stringify({
    classes: data.classes,
    years: data.years,
    terms: data.terms,
    students: data.students,
    categories: data.categories,
    products: data.products,
    billings: data.billings,
    breakdowns: data.breakdowns,
    allocations: data.allocations,
    logs: data.logs,
    userAccounts: data.userAccounts,
    activeTermId: data.activeTermId,
  });

  sql += `-- [AL-QALAM-BACKUP-PAYLOAD-START]\n`;
  // Chunking avoids line-buffer issues in systems reading SQL line-by-line
  const chunkSize = 150;
  for (let i = 0; i < jsonPayload.length; i += chunkSize) {
    const chunk = jsonPayload.substring(i, i + chunkSize);
    sql += `-- DB_CHUNK:${chunk}\n`;
  }
  sql += `-- [AL-QALAM-BACKUP-PAYLOAD-END]\n\n`;

  sql += `BEGIN;\n\n`;

  // Add SQL table creation blocks for standard DBMS clients compatibility
  sql += `-- 1. School Classes
CREATE TABLE IF NOT EXISTS classes (
  class_id SERIAL PRIMARY KEY,
  class_name VARCHAR(100) NOT NULL,
  section VARCHAR(50) NOT NULL CHECK (section IN ('Pre-Primary', 'Primary', 'JSS', 'SSS'))
);\n\n`;

  data.classes.forEach(c => {
    sql += `INSERT INTO classes (class_id, class_name, section) VALUES (${c.class_id}, ${escapeVal(c.class_name)}, ${escapeVal(c.section)}) ON CONFLICT (class_id) DO UPDATE SET class_name = EXCLUDED.class_name, section = EXCLUDED.section;\n`;
  });
  sql += `\n`;

  sql += `-- 2. Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
  year_id SERIAL PRIMARY KEY,
  year_label VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Archived'))
);\n\n`;

  data.years.forEach(y => {
    sql += `INSERT INTO academic_years (year_id, year_label, status) VALUES (${y.year_id}, ${escapeVal(y.year_label)}, ${escapeVal(y.status)}) ON CONFLICT (year_id) DO UPDATE SET year_label = EXCLUDED.year_label, status = EXCLUDED.status;\n`;
  });
  sql += `\n`;

  sql += `-- 3. Terms
CREATE TABLE IF NOT EXISTS terms (
  term_id SERIAL PRIMARY KEY,
  term_name VARCHAR(20) NOT NULL,
  year_id INT REFERENCES academic_years(year_id)
);\n\n`;

  data.terms.forEach(t => {
    sql += `INSERT INTO terms (term_id, term_name, year_id) VALUES (${t.term_id}, ${escapeVal(t.term_name)}, ${t.year_id}) ON CONFLICT (term_id) DO UPDATE SET term_name = EXCLUDED.term_name, year_id = EXCLUDED.year_id;\n`;
  });
  sql += `\n`;

  sql += `-- 4. Students
CREATE TABLE IF NOT EXISTS students (
  student_id SERIAL PRIMARY KEY,
  admission_no VARCHAR(100) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  current_class_id INT REFERENCES classes(class_id),
  parent_phone VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE
);\n\n`;

  data.students.forEach(s => {
    sql += `INSERT INTO students (student_id, admission_no, first_name, last_name, current_class_id, parent_phone, is_active) VALUES (${s.student_id}, ${escapeVal(s.admission_no)}, ${escapeVal(s.first_name)}, ${escapeVal(s.last_name)}, ${s.current_class_id}, ${escapeVal(s.parent_phone)}, ${s.is_active !== false ? 'TRUE' : 'FALSE'}) ON CONFLICT (student_id) DO UPDATE SET admission_no = EXCLUDED.admission_no, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, current_class_id = EXCLUDED.current_class_id, parent_phone = EXCLUDED.parent_phone, is_active = EXCLUDED.is_active;\n`;
  });
  sql += `\n`;

  sql += `-- 5. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL
);\n\n`;

  data.categories.forEach(c => {
    sql += `INSERT INTO product_categories (category_id, category_name) VALUES (${c.category_id}, ${escapeVal(c.category_name)}) ON CONFLICT (category_id) DO UPDATE SET category_name = EXCLUDED.category_name;\n`;
  });
  sql += `\n`;

  sql += `-- 6. Products
CREATE TABLE IF NOT EXISTS products (
  product_id SERIAL PRIMARY KEY,
  product_name VARCHAR(200) NOT NULL,
  category_id INT REFERENCES product_categories(category_id),
  stock_quantity INT NOT NULL DEFAULT 0,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0.00
);\n\n`;

  data.products.forEach(p => {
    sql += `INSERT INTO products (product_id, product_name, category_id, stock_quantity, price) VALUES (${p.product_id}, ${escapeVal(p.product_name)}, ${p.category_id}, ${p.stock_quantity}, ${p.price}) ON CONFLICT (product_id) DO UPDATE SET product_name = EXCLUDED.product_name, category_id = EXCLUDED.category_id, stock_quantity = EXCLUDED.stock_quantity, price = EXCLUDED.price;\n`;
  });
  sql += `\n`;

  sql += `-- 7. Billings
CREATE TABLE IF NOT EXISTS billings (
  billing_id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(student_id),
  term_id INT REFERENCES terms(term_id),
  offline_ref_code VARCHAR(100) UNIQUE NOT NULL,
  total_amount_due DECIMAL(12, 2) NOT NULL,
  amount_paid DECIMAL(12, 2) NOT NULL,
  prior_debt_accumulated DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);\n\n`;

  data.billings.forEach(b => {
    sql += `INSERT INTO billings (billing_id, student_id, term_id, offline_ref_code, total_amount_due, amount_paid, prior_debt_accumulated, payment_status, created_at) VALUES (${b.billing_id}, ${b.student_id}, ${b.term_id}, ${escapeVal(b.offline_ref_code)}, ${b.total_amount_due}, ${b.amount_paid}, ${b.prior_debt_accumulated}, ${escapeVal(b.payment_status)}, ${escapeVal(b.created_at)}) ON CONFLICT (billing_id) DO UPDATE SET student_id = EXCLUDED.student_id, term_id = EXCLUDED.term_id, offline_ref_code = EXCLUDED.offline_ref_code, total_amount_due = EXCLUDED.total_amount_due, amount_paid = EXCLUDED.amount_paid, prior_debt_accumulated = EXCLUDED.prior_debt_accumulated, payment_status = EXCLUDED.payment_status, created_at = EXCLUDED.created_at;\n`;
  });
  sql += `\n`;

  sql += `-- 8. Billing Breakdown Items
CREATE TABLE IF NOT EXISTS billing_breakdown_items (
  breakdown_id SERIAL PRIMARY KEY,
  billing_id INT REFERENCES billings(billing_id),
  item_description VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  product_id INT
);\n\n`;

  data.breakdowns.forEach(item => {
    sql += `INSERT INTO billing_breakdown_items (breakdown_id, billing_id, item_description, amount, product_id) VALUES (${item.breakdown_id}, ${item.billing_id}, ${escapeVal(item.item_description)}, ${item.amount}, ${escapeVal(item.product_id)}) ON CONFLICT (breakdown_id) DO UPDATE SET billing_id = EXCLUDED.billing_id, item_description = EXCLUDED.item_description, amount = EXCLUDED.amount, product_id = EXCLUDED.product_id;\n`;
  });
  sql += `\n`;

  sql += `-- 9. Stock Allocations
CREATE TABLE IF NOT EXISTS stock_allocations (
  allocation_id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(student_id),
  product_id INT REFERENCES products(product_id),
  billing_id INT REFERENCES billings(billing_id),
  allocation_status VARCHAR(50) NOT NULL,
  date_allocated TIMESTAMP NOT NULL,
  date_delivered TIMESTAMP
);\n\n`;

  data.allocations.forEach(a => {
    sql += `INSERT INTO stock_allocations (allocation_id, student_id, product_id, billing_id, allocation_status, date_allocated, date_delivered) VALUES (${a.allocation_id}, ${a.student_id}, ${a.product_id}, ${a.billing_id}, ${escapeVal(a.allocation_status)}, ${escapeVal(a.date_allocated)}, ${escapeVal(a.date_delivered)}) ON CONFLICT (allocation_id) DO UPDATE SET student_id = EXCLUDED.student_id, product_id = EXCLUDED.product_id, billing_id = EXCLUDED.billing_id, allocation_status = EXCLUDED.allocation_status, date_allocated = EXCLUDED.date_allocated, date_delivered = EXCLUDED.date_delivered;\n`;
  });
  sql += `\n`;

  sql += `-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  action VARCHAR(500) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);\n\n`;

  data.logs.forEach(l => {
    sql += `INSERT INTO audit_logs (log_id, user_id, action, timestamp) VALUES (${l.log_id}, ${escapeVal(l.user_id)}, ${escapeVal(l.action)}, ${escapeVal(l.timestamp)}) ON CONFLICT (log_id) DO UPDATE SET user_id = EXCLUDED.user_id, action = EXCLUDED.action, timestamp = EXCLUDED.timestamp;\n`;
  });
  sql += `\n`;

  sql += `-- 11. User Accounts
CREATE TABLE IF NOT EXISTS user_accounts (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password_hash VARCHAR(200) NOT NULL
);\n\n`;

  data.userAccounts.forEach(u => {
    sql += `INSERT INTO user_accounts (user_id, username, full_name, role, password_hash) VALUES (${u.user_id}, ${escapeVal(u.username)}, ${escapeVal(u.full_name)}, ${escapeVal(u.role)}, ${escapeVal(u.password_hash)}) ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username, full_name = EXCLUDED.full_name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash;\n`;
  });
  sql += `\n`;

  sql += `COMMIT;\n`;

  return sql;
}

export function parseSqlDump(sql: string): {
  classes: SchoolClass[];
  years: AcademicYear[];
  terms: Term[];
  students: Student[];
  categories: ProductCategory[];
  products: Product[];
  billings: Billing[];
  breakdowns: BillingBreakdownItem[];
  allocations: StockAllocation[];
  logs: AuditLog[];
  userAccounts: UserAccount[];
  activeTermId: number;
} {
  const lines = sql.split('\n');
  let jsonString = '';
  let inPayload = false;

  for (const line of lines) {
    if (line.includes('[AL-QALAM-BACKUP-PAYLOAD-START]')) {
      inPayload = true;
      continue;
    }
    if (line.includes('[AL-QALAM-BACKUP-PAYLOAD-END]')) {
      inPayload = false;
      break;
    }
    if (inPayload && line.startsWith('-- DB_CHUNK:')) {
      // Remove SQL comment indicators and append
      jsonString += line.substring(12).trimEnd();
    }
  }

  if (!jsonString) {
    throw new Error('No valid Al-Qalam backup data payload found in SQL comments.');
  }

  try {
    const parsed = JSON.parse(jsonString);
    
    // Quick validation of essential tables
    if (
      !Array.isArray(parsed.classes) || 
      !Array.isArray(parsed.students) || 
      !Array.isArray(parsed.billings) ||
      !Array.isArray(parsed.userAccounts)
    ) {
      throw new Error('Backup payload structure lacks critical tables.');
    }
    
    return parsed;
  } catch (e: any) {
    throw new Error('Failed to parse SQL backup dataset content: ' + e.message);
  }
}
