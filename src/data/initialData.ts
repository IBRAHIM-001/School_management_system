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
  AuditLog
} from '../types';

export const initialClasses: SchoolClass[] = [];

export const initialAcademicYears: AcademicYear[] = [];

export const initialTerms: Term[] = [];

export const initialStudents: Student[] = [];

export const initialCategories: ProductCategory[] = [];

export const initialProducts: Product[] = [];

export const initialBillings: Billing[] = [];

export const initialBillingItems: BillingBreakdownItem[] = [];

export const initialAllocations: StockAllocation[] = [];

export const initialLogs: AuditLog[] = [
  {
    log_id: 1,
    user_id: 'Admin',
    action: 'System database cleared and initialized for active school operations.',
    timestamp: new Date().toISOString()
  }
];

