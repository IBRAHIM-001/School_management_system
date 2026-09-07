export type SchoolSection = 'Pre-Primary' | 'Primary' | 'JSS' | 'SSS';

export interface SchoolClass {
  class_id: number;
  class_name: string;
  section: SchoolSection;
}

export interface AcademicYear {
  year_id: number;
  year_label: string;
  status: 'Active' | 'Archived';
}

export interface Term {
  term_id: number;
  term_name: 'Term 1' | 'Term 2' | 'Term 3';
  year_id: number;
}

export interface Student {
  student_id: number;
  admission_no: string;
  first_name: string;
  last_name: string;
  current_class_id: number;
  parent_phone: string;
  is_active?: boolean;
}

export interface ProductCategory {
  category_id: number;
  category_name: string;
}

export interface Product {
  product_id: number;
  product_name: string;
  category_id: number;
  stock_quantity: number;
  price: number;
}

export interface Billing {
  billing_id: number;
  student_id: number;
  term_id: number;
  offline_ref_code: string;
  total_amount_due: number; // Sum of billing items
  amount_paid: number;
  prior_debt_accumulated: number;
  payment_status: 'Unpaid' | 'Partially Paid' | 'Paid';
  created_at: string;
}

export interface BillingBreakdownItem {
  breakdown_id: number;
  billing_id: number;
  item_description: string;
  amount: number;
  product_id: number | null; // Nullable if general school fee (e.g. Tuition)
}

export interface StockAllocation {
  allocation_id: number;
  student_id: number;
  product_id: number;
  billing_id: number;
  allocation_status: 'Pending Supply' | 'Delivered';
  date_allocated: string;
  date_delivered: string | null;
}

export interface AuditLog {
  log_id: number;
  user_id: string; // e.g., 'Admin', 'Cashier', 'Inventory Manager'
  action: string;
  timestamp: string;
}

export type UserRole = 'Admin' | 'Cashier' | 'Inventory Manager';

export interface UserAccount {
  user_id: number;
  username: string;
  full_name: string;
  role: UserRole;
  password_hash: string;
}

