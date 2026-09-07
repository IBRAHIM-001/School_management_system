import React, { useState, useEffect } from 'react';
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
  UserAccount,
  UserRole,
  SchoolSection
} from './types';
import {
  initialClasses,
  initialAcademicYears,
  initialTerms,
  initialStudents,
  initialCategories,
  initialProducts,
  initialBillings,
  initialBillingItems,
  initialAllocations,
  initialLogs
} from './data/initialData';
import AdminPanel from './components/AdminPanel';
import CashierPanel from './components/CashierPanel';
import InventoryPanel from './components/InventoryPanel';
import DefaulterReportPanel from './components/DefaulterReportPanel';
import LoginScreen from './components/LoginScreen';
import { generateSqlDump, parseSqlDump } from './utils/backup';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CreditCard,
  PackageCheck,
  Settings2,
  Database,
  ArrowRight,
  Wifi,
  Globe,
  Clock,
  Heart,
  ChevronRight,
  Sparkles,
  BookOpen,
  TrendingDown,
  LogOut,
  ChevronLeft,
  Menu,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const defaultAccounts: UserAccount[] = [
  {
    user_id: 1,
    username: 'admin',
    full_name: 'Sani Abdullahi',
    role: 'Admin',
    password_hash: 'password'
  },
  {
    user_id: 2,
    username: 'cashier',
    full_name: 'Aisha Abubakar',
    role: 'Cashier',
    password_hash: 'password'
  },
  {
    user_id: 3,
    username: 'inventory',
    full_name: 'Musa Bello',
    role: 'Inventory Manager',
    password_hash: 'password'
  }
];

export default function App() {
  // Core user session state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('alqalam_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Dynamic user accounts state
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('alqalam_user_accounts');
    try {
      return saved ? JSON.parse(saved) : defaultAccounts;
    } catch (e) {
      return defaultAccounts;
    }
  });

  // Collapsible sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('alqalam_sidebar_collapsed');
    return saved === 'true';
  });

  // 1. Core database engine local states
  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    const saved = localStorage.getItem('alqalam_classes');
    return saved ? JSON.parse(saved) : initialClasses;
  });

  const [years, setYears] = useState<AcademicYear[]>(() => {
    const saved = localStorage.getItem('alqalam_years');
    return saved ? JSON.parse(saved) : initialAcademicYears;
  });

  const [terms, setTerms] = useState<Term[]>(() => {
    const saved = localStorage.getItem('alqalam_terms');
    return saved ? JSON.parse(saved) : initialTerms;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('alqalam_students');
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    const saved = localStorage.getItem('alqalam_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('alqalam_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [billings, setBillings] = useState<Billing[]>(() => {
    const saved = localStorage.getItem('alqalam_billings');
    return saved ? JSON.parse(saved) : initialBillings;
  });

  const [breakdowns, setBreakdowns] = useState<BillingBreakdownItem[]>(() => {
    const saved = localStorage.getItem('alqalam_breakdowns');
    return saved ? JSON.parse(saved) : initialBillingItems;
  });

  const [allocations, setAllocations] = useState<StockAllocation[]>(() => {
    const saved = localStorage.getItem('alqalam_allocations');
    return saved ? JSON.parse(saved) : initialAllocations;
  });

  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('alqalam_logs');
    return saved ? JSON.parse(saved) : initialLogs;
  });

  // Active state configuration
  const [activeTermId, setActiveTermId] = useState<number>(() => {
    const saved = localStorage.getItem('alqalam_active_term_id');
    if (saved) return Number(saved);

    try {
      const savedYearsStr = localStorage.getItem('alqalam_years');
      const loadedYears = savedYearsStr ? JSON.parse(savedYearsStr) : initialAcademicYears;
      const savedTermsStr = localStorage.getItem('alqalam_terms');
      const loadedTerms = savedTermsStr ? JSON.parse(savedTermsStr) : initialTerms;

      const activeYr = loadedYears.find((y: any) => y.status === 'Active') || loadedYears[loadedYears.length - 1];
      if (activeYr) {
        const termsInActiveYr = loadedTerms.filter((t: any) => t.year_id === activeYr.year_id);
        if (termsInActiveYr.length > 0) {
          const sorted = [...termsInActiveYr].sort((a: any, b: any) => b.term_id - a.term_id);
          return sorted[0].term_id;
        }
      }
      if (loadedTerms.length > 0) {
        return loadedTerms[loadedTerms.length - 1].term_id;
      }
    } catch (e) {
      console.error("Failed to dynamically resolve latest active term:", e);
    }
    return 0; // Default when no term exists
  });
  const [activeWorkstation, setActiveWorkstation] = useState<'Admin' | 'Cashier' | 'Inventory' | 'Logs' | 'Reports'>('Admin');

  // System Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSchoolName, setSettingsSchoolName] = useState(() => {
    return localStorage.getItem('alqalam_school_name') || 'Al-qalam Science Academy, Gusau';
  });
  const [settingsLanIP, setSettingsLanIP] = useState(() => {
    return localStorage.getItem('alqalam_lan_ip') || '192.168.1.15';
  });
  const [settingsCurrency, setSettingsCurrency] = useState(() => {
    return localStorage.getItem('alqalam_currency') || '₦';
  });
  const [settingsDefaultTuitionPrePrimary, setSettingsDefaultTuitionPrePrimary] = useState(() => {
    return localStorage.getItem('alqalam_tuition_pre_primary') || '20000';
  });
  const [settingsDefaultTuitionPrimary, setSettingsDefaultTuitionPrimary] = useState(() => {
    return localStorage.getItem('alqalam_tuition_primary') || '25000';
  });
  const [settingsDefaultTuitionJSS, setSettingsDefaultTuitionJSS] = useState(() => {
    return localStorage.getItem('alqalam_tuition_jss') || '30000';
  });
  const [settingsDefaultTuitionSSS, setSettingsDefaultTuitionSSS] = useState(() => {
    return localStorage.getItem('alqalam_tuition_sss') || '35000';
  });
  const [systemToast, setSystemToast] = useState<{ message: string; type?: 'success' | 'info' } | null>(null);

  // Database Restore States
  const [restoreCandidate, setRestoreCandidate] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<boolean>(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState<boolean>(false);

  // Persist states across browser reloads
  useEffect(() => {
    localStorage.setItem('alqalam_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('alqalam_years', JSON.stringify(years));
  }, [years]);

  useEffect(() => {
    localStorage.setItem('alqalam_terms', JSON.stringify(terms));
  }, [terms]);

  useEffect(() => {
    localStorage.setItem('alqalam_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('alqalam_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('alqalam_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('alqalam_billings', JSON.stringify(billings));
  }, [billings]);

  useEffect(() => {
    localStorage.setItem('alqalam_breakdowns', JSON.stringify(breakdowns));
  }, [breakdowns]);

  useEffect(() => {
    localStorage.setItem('alqalam_allocations', JSON.stringify(allocations));
  }, [allocations]);

  useEffect(() => {
    localStorage.setItem('alqalam_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('alqalam_user_accounts', JSON.stringify(userAccounts));
  }, [userAccounts]);

  // Automatic one-time cleanup trigger to drop classes, sessions, and demo records for a clean database
  useEffect(() => {
    const isCleaned = localStorage.getItem('alqalam_db_cleaned_v5') === 'true';
    if (!isCleaned) {
      setClasses([]);
      setYears([]);
      setTerms([]);
      setActiveTermId(0);
      setStudents([]);
      setProducts([]);
      setBillings([]);
      setBreakdowns([]);
      setAllocations([]);
      const freshLog: AuditLog[] = [
        {
          log_id: 1,
          user_id: 'Admin',
          action: 'System database initialized: all classes, academic sessions, and records dropped for a clean new system.',
          timestamp: new Date().toISOString()
        }
      ];
      setLogs(freshLog);

      localStorage.setItem('alqalam_classes', JSON.stringify([]));
      localStorage.setItem('alqalam_years', JSON.stringify([]));
      localStorage.setItem('alqalam_terms', JSON.stringify([]));
      localStorage.setItem('alqalam_active_term_id', '0');
      localStorage.setItem('alqalam_students', JSON.stringify([]));
      localStorage.setItem('alqalam_products', JSON.stringify([]));
      localStorage.setItem('alqalam_billings', JSON.stringify([]));
      localStorage.setItem('alqalam_breakdowns', JSON.stringify([]));
      localStorage.setItem('alqalam_allocations', JSON.stringify([]));
      localStorage.setItem('alqalam_logs', JSON.stringify(freshLog));
      localStorage.setItem('alqalam_db_cleaned_v5', 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('alqalam_tuition_pre_primary', settingsDefaultTuitionPrePrimary);
  }, [settingsDefaultTuitionPrePrimary]);

  useEffect(() => {
    localStorage.setItem('alqalam_tuition_primary', settingsDefaultTuitionPrimary);
  }, [settingsDefaultTuitionPrimary]);

  useEffect(() => {
    localStorage.setItem('alqalam_tuition_jss', settingsDefaultTuitionJSS);
  }, [settingsDefaultTuitionJSS]);

  useEffect(() => {
    localStorage.setItem('alqalam_tuition_sss', settingsDefaultTuitionSSS);
  }, [settingsDefaultTuitionSSS]);

  useEffect(() => {
    localStorage.setItem('alqalam_school_name', settingsSchoolName);
  }, [settingsSchoolName]);

  useEffect(() => {
    localStorage.setItem('alqalam_lan_ip', settingsLanIP);
  }, [settingsLanIP]);

  useEffect(() => {
    localStorage.setItem('alqalam_currency', settingsCurrency);
  }, [settingsCurrency]);

  useEffect(() => {
    if (systemToast) {
      const timer = setTimeout(() => setSystemToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [systemToast]);

  useEffect(() => {
    localStorage.setItem('alqalam_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('alqalam_active_term_id', String(activeTermId));
  }, [activeTermId]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('alqalam_current_user', JSON.stringify(currentUser));
      // Auto-align activeWorkstation to appropriate roles
      if (currentUser.role === 'Cashier') {
        if (activeWorkstation !== 'Cashier' && activeWorkstation !== 'Reports') {
          setActiveWorkstation('Cashier');
        }
      } else if (currentUser.role === 'Inventory Manager') {
        if (activeWorkstation !== 'Inventory') {
          setActiveWorkstation('Inventory');
        }
      }
    } else {
      localStorage.removeItem('alqalam_current_user');
    }
  }, [currentUser, activeWorkstation]);

  // Local helper for logging events
  const writeLog = (user: string, actionText: string) => {
    const actor = currentUser ? `${currentUser.full_name} (${currentUser.role})` : user;
    const newLogItem: AuditLog = {
      log_id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
      user_id: actor,
      action: actionText,
      timestamp: new Date().toISOString()
    };
    setLogs((prev) => [newLogItem, ...prev]);
  };

  // Helper formatting currencies
  const formatCurrency = (amt: number) => {
    return `${settingsCurrency}${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTuitionForClass = (classId: number): number => {
    const cls = classes.find((c) => c.class_id === classId);
    if (!cls) return Number(settingsDefaultTuitionSSS) || 35000;

    switch (cls.section) {
      case 'Pre-Primary':
        return Number(settingsDefaultTuitionPrePrimary) || 20000;
      case 'Primary':
        return Number(settingsDefaultTuitionPrimary) || 25000;
      case 'JSS':
        return Number(settingsDefaultTuitionJSS) || 30000;
      case 'SSS':
        return Number(settingsDefaultTuitionSSS) || 35000;
      default:
        return Number(settingsDefaultTuitionSSS) || 35000;
    }
  };

  const getTuitionForStudent = (studentId: number): number => {
    const student = students.find((s) => s.student_id === studentId);
    if (!student) return Number(settingsDefaultTuitionSSS) || 35000;
    return getTuitionForClass(student.current_class_id);
  };

  // SQL Backup file generation & Local Database download trigger
  const handleDownloadBackup = () => {
    try {
      const sqlDump = generateSqlDump({
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
        activeTermId,
      });

      const blob = new Blob([sqlDump], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alqalam_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}_${Date.now()}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      writeLog('Admin', 'Initiated central offline system backup. Total databases compiled into Al-Qalam SQL Dump.');
    } catch (err: any) {
      alert('Error generating backup: ' + err.message);
    }
  };

  // SQL Backup file live upload parser trigger
  const handleImportSqlBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error('Read empty file content.');
        }

        const importedData = parseSqlDump(text);
        setRestoreCandidate(importedData);
      } catch (err: any) {
        setRestoreError(err.message || 'Malformed backup file structure.');
      }
    };
    reader.onerror = () => {
      setRestoreError('Failed to read the selected backup file.');
    };
    reader.readAsText(file);
  };

  // Confirm database overwrite
  const applyDatabaseRestore = (data: any) => {
    if (!data) return;

    // 1. Update state
    setClasses(data.classes);
    setYears(data.years);
    setTerms(data.terms);
    setStudents(data.students);
    setCategories(data.categories);
    setProducts(data.products);
    setBillings(data.billings);
    setBreakdowns(data.breakdowns);
    setAllocations(data.allocations);
    setLogs(data.logs);
    setUserAccounts(data.userAccounts);
    setActiveTermId(data.activeTermId);

    // 2. Erase the persistent local storage and record updated datasets
    localStorage.setItem('alqalam_classes', JSON.stringify(data.classes));
    localStorage.setItem('alqalam_years', JSON.stringify(data.years));
    localStorage.setItem('alqalam_terms', JSON.stringify(data.terms));
    localStorage.setItem('alqalam_students', JSON.stringify(data.students));
    localStorage.setItem('alqalam_categories', JSON.stringify(data.categories));
    localStorage.setItem('alqalam_products', JSON.stringify(data.products));
    localStorage.setItem('alqalam_billings', JSON.stringify(data.billings));
    localStorage.setItem('alqalam_breakdowns', JSON.stringify(data.breakdowns));
    localStorage.setItem('alqalam_allocations', JSON.stringify(data.allocations));
    localStorage.setItem('alqalam_logs', JSON.stringify(data.logs));
    localStorage.setItem('alqalam_user_accounts', JSON.stringify(data.userAccounts));
    localStorage.setItem('alqalam_active_term_id', data.activeTermId.toString());

    writeLog('Admin', 'Fully restored state from uploaded SQL Backup file.');
    setRestoreCandidate(null);
    setRestoreSuccess(true);
  };

  // Manual Purge All Data & Clean Database
  const executePurgeAllData = () => {
    setClasses([]);
    setYears([]);
    setTerms([]);
    setActiveTermId(0);
    setStudents([]);
    setBillings([]);
    setBreakdowns([]);
    setAllocations([]);
    setProducts([]);

    const freshLog: AuditLog[] = [
      {
        log_id: 1,
        user_id: currentUser?.username || 'Admin',
        action: 'System database cleared: all classes, academic sessions, and records dropped.',
        timestamp: new Date().toISOString()
      }
    ];
    setLogs(freshLog);

    localStorage.setItem('alqalam_classes', JSON.stringify([]));
    localStorage.setItem('alqalam_years', JSON.stringify([]));
    localStorage.setItem('alqalam_terms', JSON.stringify([]));
    localStorage.setItem('alqalam_active_term_id', '0');
    localStorage.setItem('alqalam_students', JSON.stringify([]));
    localStorage.setItem('alqalam_products', JSON.stringify([]));
    localStorage.setItem('alqalam_billings', JSON.stringify([]));
    localStorage.setItem('alqalam_breakdowns', JSON.stringify([]));
    localStorage.setItem('alqalam_allocations', JSON.stringify([]));
    localStorage.setItem('alqalam_logs', JSON.stringify(freshLog));
    localStorage.setItem('alqalam_db_cleaned_v5', 'true');

    setShowPurgeConfirm(false);
    setShowSettings(false);
    setSystemToast({
      message: 'Database successfully cleared! All classes, sessions, and records dropped.',
      type: 'success'
    });
  };

  // -------------------------------------------------------------------------
  // CORE BUSINESS ENGINE: BATCH ROLL-FORWARD START OF TERM
  // -------------------------------------------------------------------------
  const executeRollForward = (oldTermId: number, newTermId: number, baseTuition: number) => {
    // 1. Fetch old term billings
    const oldTermBillings = billings.filter((b) => b.term_id === oldTermId);
    
    let processedCount = 0;
    let accumulatedDebtTransferred = 0;

    const updatedBillings = [...billings];
    const newBreakdowns = [...breakdowns];

    const rollForwardTimestamp = Date.now();
    students.filter((s) => s.is_active !== false).forEach((student, idx) => {
      // Find old term statement
      const priorBill = oldTermBillings.find((b) => b.student_id === student.student_id);
      
      let carryForwardDebt = 0;
      if (priorBill) {
        const totalLiability = priorBill.total_amount_due + priorBill.prior_debt_accumulated;
        carryForwardDebt = totalLiability - priorBill.amount_paid;
        if (carryForwardDebt < 0) carryForwardDebt = 0;
      }

      const specificTuition = getTuitionForStudent(student.student_id);

      // 2. Generate unique reference code
      const offlineRef = `AQ-${newTermId}${student.student_id}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. Inject new billing record
      const hasExistingNewBillIndex = updatedBillings.findIndex(
        (b) => b.student_id === student.student_id && b.term_id === newTermId
      );

      if (hasExistingNewBillIndex > -1) {
        // Update carry over debt
        updatedBillings[hasExistingNewBillIndex] = {
          ...updatedBillings[hasExistingNewBillIndex],
          prior_debt_accumulated: carryForwardDebt,
          total_amount_due: specificTuition,
          payment_status: 'Unpaid'
        };
      } else {
        // Insert new invoice
        const newBillId = 10000 + Math.floor(Math.random() * 90000);
        updatedBillings.push({
          billing_id: newBillId,
          student_id: student.student_id,
          term_id: newTermId,
          offline_ref_code: offlineRef,
          total_amount_due: specificTuition,
          amount_paid: 0,
          prior_debt_accumulated: carryForwardDebt,
          payment_status: 'Unpaid',
          created_at: new Date().toISOString()
        });

        // Insert standard tuition into list
        newBreakdowns.push({
          breakdown_id: rollForwardTimestamp * 10000 + idx,
          billing_id: newBillId,
          item_description: 'Standard term Tuition level fee',
          amount: specificTuition,
          product_id: null
        });
      }

      if (carryForwardDebt > 0) {
        accumulatedDebtTransferred += carryForwardDebt;
      }
      processedCount++;
    });

    setBillings(updatedBillings);
    setBreakdowns(newBreakdowns);
    setActiveTermId(newTermId); // Auto-jump to new active term

    writeLog(
      'Admin',
      `Executed Term Roll-Forward from old Term ID ${oldTermId} to Target Term ID ${newTermId}. Processed ${processedCount} students: rolled forward ₦${accumulatedDebtTransferred.toLocaleString()} total unpaid debt.`
    );
  };

  // -------------------------------------------------------------------------
  // CORE BUSINESS ENGINE: PROCESSING CASH DEPOSITS & COUPLING BACKORDERS
  // -------------------------------------------------------------------------
  const processBankPayment = (billingId: number, tellerCode: string, paymentAmt: number) => {
    const billingIndex = billings.findIndex((b) => b.billing_id === billingId);
    if (billingIndex === -1) return;

    const billing = billings[billingIndex];
    const totalDue = billing.total_amount_due + billing.prior_debt_accumulated;
    const newPaidAmount = billing.amount_paid + paymentAmt;

    let status: 'Unpaid' | 'Partially Paid' | 'Paid' = 'Unpaid';
    let changeReturned = 0;

    if (newPaidAmount >= totalDue) {
      status = 'Paid';
      changeReturned = newPaidAmount - totalDue;
    } else if (newPaidAmount > 0) {
      status = 'Partially Paid';
    }

    // Update main statement
    const updatedBillings = [...billings];
    updatedBillings[billingIndex] = {
      ...billing,
      amount_paid: newPaidAmount >= totalDue ? totalDue : newPaidAmount,
      payment_status: status
    };

    // 1. Settle Attached physical products triggers (Back-order supply engine)
    const attachedProductBreakdowns = breakdowns.filter(
      (b) => b.billing_id === billingId && b.product_id !== null
    );

    const settleTimestamp = Date.now();
    const updatedAllocations = [...allocations];
    const updatedProducts = [...products];

    attachedProductBreakdowns.forEach((item, idx) => {
      const prodId = item.product_id!;
      const prodIndex = updatedProducts.findIndex((p) => p.product_id === prodId);
      
      if (prodIndex > -1) {
        const product = updatedProducts[prodIndex];
        
        // Check if allocation entry already exists to avoid redundant creation
        const hasAllocation = updatedAllocations.some(
          (a) => a.billing_id === billingId && a.product_id === prodId
        );

        if (!hasAllocation) {
          // Always queue as Pending Supply upon payment; defer delivery and stock deduction to manual action
          const allocationStatus = 'Pending Supply';
          const supplyDate = null;

          updatedAllocations.push({
            allocation_id: settleTimestamp * 1000 + idx,
            student_id: billing.student_id,
            product_id: prodId,
            billing_id: billingId,
            allocation_status: allocationStatus,
            date_allocated: new Date().toISOString(),
            date_delivered: supplyDate
          });
        }
      }
    });

    setBillings(updatedBillings);
    setAllocations(updatedAllocations);
    setProducts(updatedProducts);

    writeLog(
      'Cashier',
      `Validated bank deposit Slip ID [${tellerCode}] posting ₦${paymentAmt.toLocaleString()} to billing statement ${billing.offline_ref_code}. Status updated to ${status}.`
    );

    return { changeReturned, status };
  };

  // -------------------------------------------------------------------------
  // CORE BUSINESS ENGINE: STORE DELIVERY LOCK DISPENSING
  // -------------------------------------------------------------------------
  const deliverAllocationBeforeStockCheck = (allocationId: number) => {
    const allocationIndex = allocations.findIndex((a) => a.allocation_id === allocationId);
    if (allocationIndex === -1) return { success: false, message: 'Allocation reference code target not found.' };

    const allocation = allocations[allocationIndex];
    const productIndex = products.findIndex((p) => p.product_id === allocation.product_id);

    if (productIndex === -1) return { success: false, message: 'Underlying school item has been deleted from records.' };

    const product = products[productIndex];

    // Core Check: Cannot supply/deliver a backordered item if stock is still 0!
    if (product.stock_quantity <= 0) {
      return {
        success: false,
        message: `Fulfillment Locked: '${product.product_name}' warehouse count is still 0. Restock product before supply release.`
      };
    }

    // Proceed to fulfill and subtract physical warehouse item
    const updatedProducts = [...products];
    updatedProducts[productIndex] = {
      ...product,
      stock_quantity: product.stock_quantity - 1
    };

    const updatedAllocations = [...allocations];
    updatedAllocations[allocationIndex] = {
      ...allocation,
      allocation_status: 'Delivered',
      date_delivered: new Date().toISOString()
    };

    setProducts(updatedProducts);
    setAllocations(updatedAllocations);

    const student = students.find((s) => s.student_id === allocation.student_id);
    const logText = `Inventory Store delivered '${product.product_name}' to student ${student?.first_name} ${student?.last_name}. Sourced stock decremented by 1.`;
    writeLog('Inventory Manager', logText);

    return {
      success: true,
      message: `Released delivery for ${product.product_name} successfully! Stock decremented cleanly.`
    };
  };

  // -------------------------------------------------------------------------
  // CORE BUSINESS ENGINE: APPEND STORE ITEMS TO STATEMENT INVOICE
  // -------------------------------------------------------------------------
  const addStoreItemToBilling = (studentId: number, productId: number, itemPrice: number, productName: string) => {
    // 1. Locate current invoice index
    const billingIndex = billings.findIndex((b) => b.student_id === studentId && b.term_id === activeTermId);
    if (billingIndex === -1) return;

    const billing = billings[billingIndex];
    const newTotalDue = billing.total_amount_due + itemPrice;

    // Determine status reset in case payment was already made earlier
    const updatedBillings = [...billings];
    const netLiability = newTotalDue + billing.prior_debt_accumulated;
    let paymentStatus = billing.payment_status;

    if (billing.amount_paid >= netLiability) {
      paymentStatus = 'Paid';
    } else if (billing.amount_paid > 0) {
      paymentStatus = 'Partially Paid';
    } else {
      paymentStatus = 'Unpaid';
    }

    updatedBillings[billingIndex] = {
      ...billing,
      total_amount_due: newTotalDue,
      payment_status: paymentStatus
    };

    // 2. Add breakdown ledger row
    const newBreakdownRow: BillingBreakdownItem = {
      breakdown_id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
      billing_id: billing.billing_id,
      item_description: productName,
      amount: itemPrice,
      product_id: productId
    };

    setBillings(updatedBillings);
    setBreakdowns((prev) => [...prev, newBreakdownRow]);

    writeLog('Cashier', `Allocated store asset '${productName}' to student database index [${studentId}] bill item sheet. Price added to statement due: ₦${itemPrice.toLocaleString()}`);
  };

  const removeStoreItemFromBilling = (breakdownId: number) => {
    const itemIndex = breakdowns.findIndex((b) => b.breakdown_id === breakdownId);
    if (itemIndex === -1) return;

    const item = breakdowns[itemIndex];
    const billingIndex = billings.findIndex((b) => b.billing_id === item.billing_id);
    if (billingIndex === -1) return;

    const billing = billings[billingIndex];

    if (billing.amount_paid > 0 || billing.payment_status !== 'Unpaid') {
      alert('Conflict: This statement has active paid receipts. Item deletion is locked.');
      return;
    }

    const newTotalDue = billing.total_amount_due - item.amount;
    const updatedBillings = [...billings];
    updatedBillings[billingIndex] = {
      ...billing,
      total_amount_due: newTotalDue >= 0 ? newTotalDue : 0
    };

    const updatedBreakdowns = breakdowns.filter((b) => b.breakdown_id !== breakdownId);

    setBillings(updatedBillings);
    setBreakdowns(updatedBreakdowns);

    const detailText = `Removed store asset '${item.item_description}' from student's billing reference ${billing.offline_ref_code}. Statement liability reduced by ₦${item.amount.toLocaleString()}.`;
    writeLog('Cashier', detailText);
  };

  // Initialize a fresh statement card
  const initializeBilling = (studentId: number, defaultTuition?: number) => {
    if (!activeTermId || activeTermId <= 0) return;
    const existing = billings.some((b) => b.student_id === studentId && b.term_id === activeTermId);
    if (existing) return;

    const student = students.find((s) => s.student_id === studentId);
    const cls = student ? classes.find((c) => c.class_id === student.current_class_id) : null;
    const tuitionAmount = defaultTuition !== undefined ? defaultTuition : getTuitionForStudent(studentId);
    const billId = 10000 + Math.floor(Math.random() * 90000);
    const refCode = `AQ-${activeTermId}${studentId}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBill: Billing = {
      billing_id: billId,
      student_id: studentId,
      term_id: activeTermId,
      offline_ref_code: refCode,
      total_amount_due: tuitionAmount,
      amount_paid: 0,
      prior_debt_accumulated: 0,
      payment_status: 'Unpaid',
      created_at: new Date().toISOString()
    };

    const newBreakdown: BillingBreakdownItem = {
      breakdown_id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
      billing_id: billId,
      item_description: `Standard Term Tuition Fee (${cls?.section || 'Section'})`,
      amount: tuitionAmount,
      product_id: null
    };

    setBillings((prev) => [...prev, newBill]);
    setBreakdowns((prev) => [...prev, newBreakdown]);
    writeLog('Cashier', `Generated fresh active terminal statement invoice cards for Student ID [${studentId}]. Reference block initialized: ${refCode}`);
  };

  // Store restock
  const restockProduct = (productId: number, qtyToAdd: number) => {
    const updatedProducts = products.map((p) => {
      if (p.product_id === productId) {
        return {
          ...p,
          stock_quantity: p.stock_quantity + qtyToAdd
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    
    const pName = products.find((p) => p.product_id === productId)?.product_name;
    writeLog('Inventory Manager', `Injected warehouse replenishment: ${qtyToAdd} pieces added to '${pName}' stock.`);
  };

  // Add new physical product
  const addProduct = (productName: string, categoryId: number, price: number, initialQty: number) => {
    const newProductId = products.length > 0 ? Math.max(...products.map(p => p.product_id)) + 1 : 1;
    const newProduct: Product = {
      product_id: newProductId,
      product_name: productName,
      category_id: categoryId,
      stock_quantity: initialQty,
      price: price
    };
    setProducts((prev) => [...prev, newProduct]);
    writeLog('Inventory Manager', `Created new store item '${productName}' under category ID ${categoryId} at ₦${price}.`);
  };

  // Edit existing physical product
  const editProduct = (productId: number, productName: string, categoryId: number, price: number, stockQty: number) => {
    setProducts((prev) => prev.map((p) => {
      if (p.product_id === productId) {
        return {
          ...p,
          product_name: productName,
          category_id: categoryId,
          price: price,
          stock_quantity: stockQty
        };
      }
      return p;
    }));
    writeLog('Inventory Manager', `Updated store item '${productName}' details.`);
  };

  // Delete product
  const deleteProduct = (productId: number) => {
    const product = products.find(p => p.product_id === productId);
    setProducts((prev) => prev.filter((p) => p.product_id !== productId));
    writeLog('Inventory Manager', `Deleted store item '${product?.product_name || 'unknown'}' from inventory shelf.`);
  };

  // Add category
  const addCategory = (categoryName: string) => {
    const newCatId = categories.length > 0 ? Math.max(...categories.map(c => c.category_id)) + 1 : 1;
    const newCat: ProductCategory = {
      category_id: newCatId,
      category_name: categoryName
    };
    setCategories((prev) => [...prev, newCat]);
    writeLog('Inventory Manager', `Created new store category '${categoryName}'.`);
  };

  // Edit category
  const editCategory = (categoryId: number, categoryName: string) => {
    setCategories((prev) => prev.map((c) => {
      if (c.category_id === categoryId) {
        return {
          ...c,
          category_name: categoryName
        };
      }
      return c;
    }));
    writeLog('Inventory Manager', `Renamed key category to '${categoryName}'.`);
  };

  // Delete category
  const deleteCategory = (categoryId: number) => {
    const cat = categories.find(c => c.category_id === categoryId);
    setCategories((prev) => prev.filter((c) => c.category_id !== categoryId));
    setProducts((prev) => prev.map((p) => p.category_id === categoryId ? { ...p, category_id: 0 } : p));
    writeLog('Inventory Manager', `Deleted category '${cat?.category_name || 'unknown'}'.`);
  };

  // User Management Actions
  const addUserAccount = (username: string, fullName: string, role: UserRole, passwordHash: string): { success: boolean; message: string } => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !fullName.trim() || !passwordHash.trim()) {
      return { success: false, message: 'All fields are required.' };
    }
    const exists = userAccounts.some((acc) => acc.username.toLowerCase() === cleanUsername);
    if (exists) {
      return { success: false, message: `Username "${username}" already exists.` };
    }
    const newId = userAccounts.length > 0 ? Math.max(...userAccounts.map((u) => u.user_id)) + 1 : 1;
    const newAcc: UserAccount = {
      user_id: newId,
      username: cleanUsername,
      full_name: fullName.trim(),
      role,
      password_hash: passwordHash.trim()
    };
    setUserAccounts((prev) => [...prev, newAcc]);
    writeLog('Admin', `Registered new user account: ${fullName.trim()} (${role}) with username [${cleanUsername}]`);
    return { success: true, message: `User "${fullName.trim()}" successfully created.` };
  };

  const editUserAccount = (userId: number, username: string, fullName: string, role: UserRole, passwordHash?: string): { success: boolean; message: string } => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !fullName.trim()) {
      return { success: false, message: 'Username and Full Name are required.' };
    }
    const exists = userAccounts.some((acc) => acc.user_id !== userId && acc.username.toLowerCase() === cleanUsername);
    if (exists) {
      return { success: false, message: `Username "${username}" is already taken.` };
    }

    setUserAccounts((prev) =>
      prev.map((acc) => {
        if (acc.user_id === userId) {
          const updated: UserAccount = {
            ...acc,
            username: cleanUsername,
            full_name: fullName.trim(),
            role,
          };
          if (passwordHash && passwordHash.trim()) {
            updated.password_hash = passwordHash.trim();
          }
          if (currentUser && currentUser.user_id === userId) {
            setTimeout(() => {
              setCurrentUser(updated);
            }, 0);
          }
          return updated;
        }
        return acc;
      })
    );

    writeLog('Admin', `Updated details for user account ID [${userId}]: ${fullName.trim()} (${role})`);
    return { success: true, message: `User account details updated successfully.` };
  };

  const deleteUserAccount = (userId: number): { success: boolean; message: string } => {
    if (currentUser && currentUser.user_id === userId) {
      return { success: false, message: 'You cannot delete your own active session account!' };
    }
    const userToDelete = userAccounts.find((u) => u.user_id === userId);
    if (!userToDelete) {
      return { success: false, message: 'User account not found.' };
    }
    setUserAccounts((prev) => prev.filter((acc) => acc.user_id !== userId));
    writeLog('Admin', `Purged user account: ${userToDelete.full_name} [${userToDelete.username}]`);
    return { success: true, message: `Successfully deleted user "${userToDelete.full_name}".` };
  };

  // Handler for Applying System Settings and Synchronizing Default Term Tuition
  const handleApplySettings = (e: React.FormEvent) => {
    e.preventDefault();

    const prePrimaryTuition = Math.max(0, Number(settingsDefaultTuitionPrePrimary) || 0);
    const primaryTuition = Math.max(0, Number(settingsDefaultTuitionPrimary) || 0);
    const jssTuition = Math.max(0, Number(settingsDefaultTuitionJSS) || 0);
    const sssTuition = Math.max(0, Number(settingsDefaultTuitionSSS) || 0);

    setSettingsDefaultTuitionPrePrimary(String(prePrimaryTuition));
    setSettingsDefaultTuitionPrimary(String(primaryTuition));
    setSettingsDefaultTuitionJSS(String(jssTuition));
    setSettingsDefaultTuitionSSS(String(sssTuition));

    localStorage.setItem('alqalam_tuition_pre_primary', String(prePrimaryTuition));
    localStorage.setItem('alqalam_tuition_primary', String(primaryTuition));
    localStorage.setItem('alqalam_tuition_jss', String(jssTuition));
    localStorage.setItem('alqalam_tuition_sss', String(sssTuition));
    localStorage.setItem('alqalam_school_name', settingsSchoolName);
    localStorage.setItem('alqalam_lan_ip', settingsLanIP);
    localStorage.setItem('alqalam_currency', settingsCurrency);

    const getTuitionRateForSection = (section?: SchoolSection): number => {
      switch (section) {
        case 'Pre-Primary':
          return prePrimaryTuition;
        case 'Primary':
          return primaryTuition;
        case 'JSS':
          return jssTuition;
        case 'SSS':
          return sssTuition;
        default:
          return sssTuition;
      }
    };

    // Synchronize active term tuition for all existing student statements
    let synchronizedInvoicesCount = 0;
    const updatedBreakdowns = breakdowns.map((item) => {
      if (item.product_id === null || item.item_description.toLowerCase().includes('tuition')) {
        const parentBilling = billings.find((b) => b.billing_id === item.billing_id);
        if (parentBilling && parentBilling.term_id === activeTermId) {
          const student = students.find((s) => s.student_id === parentBilling.student_id);
          if (student) {
            const cls = classes.find((c) => c.class_id === student.current_class_id);
            const targetFee = getTuitionRateForSection(cls?.section);
            if (item.amount !== targetFee) {
              synchronizedInvoicesCount++;
              return {
                ...item,
                item_description: `Standard Term Tuition Fee (${cls?.section || 'Section'})`,
                amount: targetFee
              };
            }
          }
        }
      }
      return item;
    });

    // Check if any active-term billing has NO tuition breakdown item at all, inject it
    const newBreakdownsList = [...updatedBreakdowns];
    billings.forEach((b) => {
      if (b.term_id === activeTermId) {
        const hasTuition = newBreakdownsList.some(
          (i) => i.billing_id === b.billing_id && (i.product_id === null || i.item_description.toLowerCase().includes('tuition'))
        );
        if (!hasTuition) {
          const student = students.find((s) => s.student_id === b.student_id);
          if (student) {
            const cls = classes.find((c) => c.class_id === student.current_class_id);
            const targetFee = getTuitionRateForSection(cls?.section);
            newBreakdownsList.push({
              breakdown_id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
              billing_id: b.billing_id,
              item_description: `Standard Term Tuition Fee (${cls?.section || 'Section'})`,
              amount: targetFee,
              product_id: null
            });
            synchronizedInvoicesCount++;
          }
        }
      }
    });

    // Update billings total_amount_due and payment_status based on synchronized breakdowns
    const updatedBillings = billings.map((b) => {
      if (b.term_id === activeTermId) {
        const items = newBreakdownsList.filter((i) => i.billing_id === b.billing_id);
        const newTotalDue = items.reduce((sum, item) => sum + item.amount, 0);
        const totalLiability = newTotalDue + b.prior_debt_accumulated;

        let status: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
        if (b.amount_paid >= totalLiability && totalLiability > 0) {
          status = 'Paid';
        } else if (b.amount_paid > 0) {
          status = 'Partially Paid';
        } else {
          status = 'Unpaid';
        }

        return {
          ...b,
          total_amount_due: newTotalDue,
          payment_status: status
        };
      }
      return b;
    });

    setBreakdowns(newBreakdownsList);
    setBillings(updatedBillings);
    setShowSettings(false);

    const logMessage = `Applied System Setting parameters. Section default tuitions updated (Pre-Primary: ${settingsCurrency}${prePrimaryTuition.toLocaleString()}, Primary: ${settingsCurrency}${primaryTuition.toLocaleString()}, JSS: ${settingsCurrency}${jssTuition.toLocaleString()}, SSS: ${settingsCurrency}${sssTuition.toLocaleString()}). Synchronized ${synchronizedInvoicesCount} student statement line(s).`;
    writeLog('Admin', logMessage);

    setSystemToast({
      message: `System Setting applied! Section tuitions updated (Pre-Primary: ${settingsCurrency}${prePrimaryTuition.toLocaleString()}, Primary: ${settingsCurrency}${primaryTuition.toLocaleString()}, JSS: ${settingsCurrency}${jssTuition.toLocaleString()}, SSS: ${settingsCurrency}${sssTuition.toLocaleString()}).`,
      type: 'success'
    });
  };

  // Add generic student ledger
  const addStudent = (studentData: Omit<Student, 'student_id'>) => {
    const newStudentId = 500 + Math.floor(Math.random() * 5000);
    const newStudent: Student = {
      student_id: newStudentId,
      is_active: true,
      ...studentData
    };

    setStudents((prev) => [...prev, newStudent]);
    writeLog('Admin', `Registered raw student profile to state: ${studentData.first_name} ${studentData.last_name} (Adm: ${studentData.admission_no})`);

    // Auto trigger active billing card allocation with the specific class section tuition
    const tuition = getTuitionForClass(studentData.current_class_id);
    initializeBilling(newStudentId, tuition);
  };

  // Update student ledger profile and activation status
  const updateStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === updatedStudent.student_id ? updatedStudent : s))
    );
    const statusLabel = updatedStudent.is_active !== false ? 'Active' : 'Deactivated';
    writeLog(
      currentUser?.username || 'Admin',
      `Updated student profile for "${updatedStudent.first_name} ${updatedStudent.last_name}" (Adm: ${updatedStudent.admission_no}) - Status: ${statusLabel}`
    );
  };

  // Add raw classroom object
  const addClassOption = (className: string, section: SchoolSection) => {
    const newClassId = classes.length > 0 ? Math.max(...classes.map((c) => c.class_id)) + 1 : 1;
    const newClass: SchoolClass = {
      class_id: newClassId,
      class_name: className,
      section: section
    };
    setClasses((prev) => [...prev, newClass]);
    writeLog('Admin', `Constructed new classroom grade division index: ${className} inside section: ${section}`);
  };

  // Delete an empty class option
  const deleteClassOption = (classId: number) => {
    const hasStudents = students.some((s) => s.current_class_id === classId);
    if (hasStudents) {
      alert('Cannot delete this class because student records are assigned to it.');
      return;
    }
    setClasses((prev) => prev.filter((c) => c.class_id !== classId));
    writeLog('Admin', `Removed class group ID ${classId}`);
  };

  // Add term options
  const addNewTerm = (termName: 'Term 1' | 'Term 2' | 'Term 3', yearId: number): boolean => {
    const isDuplicate = terms.some(
      (t) => t.term_name === termName && t.year_id === yearId
    );
    if (isDuplicate) {
      alert(`Conflict: "${termName}" already exists in the selected academic session.`);
      return false;
    }

    const newTermId = terms.length > 0 ? Math.max(...terms.map((t) => t.term_id)) + 1 : 1;
    const newTerm: Term = {
      term_id: newTermId,
      term_name: termName,
      year_id: yearId
    };
    setTerms((prev) => [...prev, newTerm]);
    setActiveTermId(newTermId); // Automatically activate the newly added term
    writeLog('Admin', `Constructed system session checkpoint: ${termName} attached to academic year index. ${yearId}`);
    return true;
  };

  // Add new academic year / session
  const addAcademicYear = (yearLabel: string, status: 'Active' | 'Archived') => {
    const isDuplicate = years.some((y) => y.year_label === yearLabel);
    if (isDuplicate) {
      alert(`Conflict: "${yearLabel}" already exists in the system.`);
      return;
    }
    const newYearId = years.length > 0 ? Math.max(...years.map((y) => y.year_id)) + 1 : 1;
    const updatedYears = years.map((y) => {
      if (status === 'Active') {
        return { ...y, status: 'Archived' as const };
      }
      return y;
    });
    const newYear: AcademicYear = {
      year_id: newYearId,
      year_label: yearLabel,
      status: status
    };
    const finalYears = [...updatedYears, newYear];
    setYears(finalYears);
    writeLog('Admin', `Registered new academic session: ${yearLabel} (Status: ${status})`);

    // Create a first default 'Term 1' for it so there's always at least one term
    const newTermId = terms.length > 0 ? Math.max(...terms.map((t) => t.term_id)) + 1 : 1;
    const newTerm: Term = {
      term_id: newTermId,
      term_name: 'Term 1',
      year_id: newYearId
    };
    setTerms((prev) => [...prev, newTerm]);
    if (status === 'Active' || years.length === 0 || activeTermId === 0) {
      setActiveTermId(newTermId);
    }
  };

  // Set academic year status to Active
  const setYearActive = (yearId: number) => {
    const updatedYears = years.map((y) => ({
      ...y,
      status: (y.year_id === yearId ? 'Active' : 'Archived') as 'Active' | 'Archived'
    }));
    setYears(updatedYears);
    
    // Auto-align activeTermId to the latest term in this academic year
    const termsInYear = terms.filter((t) => t.year_id === yearId);
    if (termsInYear.length > 0) {
      const sorted = [...termsInYear].sort((a, b) => b.term_id - a.term_id);
      setActiveTermId(sorted[0].term_id);
    }
    writeLog('Admin', `Toggled active system session to year ID ${yearId}`);
  };

  // Delete an empty academic year
  const deleteAcademicYear = (yearId: number) => {
    const hasAssociatedTerms = terms.some((t) => t.year_id === yearId);
    if (hasAssociatedTerms) {
      alert('Cannot delete this session because it has registered terms active under it.');
      return;
    }
    setYears((prev) => prev.filter((y) => y.year_id !== yearId));
    writeLog('Admin', `Purged empty academic session ID ${yearId}`);
  };

  // -------------------------------------------------------------------------
  // STATS COUNTER CALCULATIONS (Active Term context)
  // -------------------------------------------------------------------------
  const activeTermBillings = billings.filter((b) => b.term_id === activeTermId);
  const totalOutstandingFees = activeTermBillings.reduce((sum, b) => {
    const outstanding = (b.total_amount_due + b.prior_debt_accumulated) - b.amount_paid;
    return sum + (outstanding > 0 ? outstanding : 0);
  }, 0);

  const totalItemsOutOfStock = products.filter((p) => p.stock_quantity === 0).length;
  const totalPendingDeliveries = allocations.filter((a) => a.allocation_status === 'Pending Supply').length;

  const activeTerm = terms.find((t) => t.term_id === activeTermId);
  const activeYear = activeTerm ? years.find((y) => y.year_id === activeTerm.year_id) : null;

  // Security role permission mapping helper
  const isPermitted = (workstation: 'Admin' | 'Cashier' | 'Inventory' | 'Logs' | 'Reports' | 'Settings') => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'Cashier') {
      return workstation === 'Cashier' || workstation === 'Reports';
    }
    if (currentUser.role === 'Inventory Manager') {
      return workstation === 'Inventory';
    }
    return false;
  };

  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          writeLog(user.username, `Authorized workstation space with ${user.role} role.`);
        }}
        userAccounts={userAccounts}
      />
    );
  }

  return (
    <div className="min-h-screen md:h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans select-none antialiased md:overflow-hidden">
      {/* Navigation Sidebar */}
      <aside className={`w-full md:transition-all md:duration-200 ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} bg-slate-900 flex flex-col border-r border-slate-850 flex-shrink-0 min-h-0 md:h-full`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 bg-teal-500 rounded flex items-center justify-center font-bold text-white uppercase text-sm font-display shrink-0 animate-pulse-slow">
              AQ
            </div>
            <div className={`transition-opacity duration-150 ${sidebarCollapsed ? 'md:opacity-0 md:w-0 md:h-0 overflow-hidden' : 'opacity-100'}`}>
              <h1 className="text-white font-bold text-sm leading-none font-display uppercase tracking-tight whitespace-nowrap">AL-QALAM</h1>
              <p className="text-slate-500 text-[9px] mt-1 uppercase tracking-widest font-mono font-bold whitespace-nowrap">Academy Gusau</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {/* Desktop toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 transition-all cursor-pointer"
              title={sidebarCollapsed ? "Expand Sidebar Menu" : "Collapse Sidebar Menu"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4 text-teal-400" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="md:hidden flex p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 transition-all cursor-pointer"
              title={sidebarCollapsed ? "Show Navigation List" : "Minimize Navigation List"}
            >
              <Menu className="h-4 w-4 text-teal-400" />
            </button>
          </div>
        </div>
        
        {/* Navigation list: hidden on mobile if collapsed */}
        <nav className={`flex-grow p-4 space-y-4 ${sidebarCollapsed ? 'hidden md:block md:space-y-4' : 'block'} overflow-y-auto`}>
          <div>
            <div className={`text-slate-500 text-[10px] uppercase font-bold tracking-widest px-2 py-1 mb-2 font-mono truncate transition-all ${sidebarCollapsed ? 'md:hidden' : 'block'}`}>Core Actions</div>
            <div className="space-y-1">
              {isPermitted('Admin') && (
                <button
                  id="ws-admin"
                  onClick={() => { setActiveWorkstation('Admin'); setShowSettings(false); }}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 md:py-2.5' : 'space-x-3 px-3 py-2'} rounded-md transition-all text-left font-medium text-xs border ${
                    activeWorkstation === 'Admin' && !showSettings
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 font-bold'
                      : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                  title={sidebarCollapsed ? "Executive Dashboard" : undefined}
                >
                  <ShieldCheck className="h-4 w-4 text-teal-500/80 shrink-0" />
                  <span className={`${sidebarCollapsed ? 'md:hidden' : 'block'} truncate`}>Executive Dashboard</span>
                </button>
              )}
              
              {isPermitted('Cashier') && (
                <button
                  id="ws-cashier"
                  onClick={() => { setActiveWorkstation('Cashier'); setShowSettings(false); }}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 md:py-2.5' : 'space-x-3 px-3 py-2'} rounded-md transition-all text-left font-medium text-xs border ${
                    activeWorkstation === 'Cashier' && !showSettings
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 font-bold'
                      : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                  title={sidebarCollapsed ? "Student Fee Management" : undefined}
                >
                  <CreditCard className="h-4 w-4 text-teal-500/80 shrink-0" />
                  <span className={`${sidebarCollapsed ? 'md:hidden' : 'block'} truncate`}>Student Fee Management</span>
                </button>
              )}

              {isPermitted('Inventory') && (
                <button
                  id="ws-inventory"
                  onClick={() => { setActiveWorkstation('Inventory'); setShowSettings(false); }}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 md:py-2.5' : 'space-x-3 px-3 py-2'} rounded-md transition-all text-left font-medium text-xs border ${
                    activeWorkstation === 'Inventory' && !showSettings
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 font-bold'
                      : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                  title={sidebarCollapsed ? "Inventory Queue" : undefined}
                >
                  <PackageCheck className="h-4 w-4 text-teal-500/80 shrink-0" />
                  <span className={`${sidebarCollapsed ? 'md:hidden' : 'block'} truncate`}>Inventory Queue</span>
                </button>
              )}

              {isPermitted('Reports') && (
                <button
                  id="ws-reports"
                  onClick={() => { setActiveWorkstation('Reports'); setShowSettings(false); }}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 md:py-2.5' : 'space-x-3 px-3 py-2'} rounded-md transition-all text-left font-medium text-xs border ${
                    activeWorkstation === 'Reports' && !showSettings
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 font-bold'
                      : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                  title={sidebarCollapsed ? "Defaulters Report" : undefined}
                >
                  <TrendingDown className="h-4 w-4 text-rose-500/85 shrink-0" />
                  <span className={`${sidebarCollapsed ? 'md:hidden' : 'block'} truncate`}>Defaulters Report</span>
                </button>
              )}
            </div>
          </div>

          {(isPermitted('Logs') || isPermitted('Settings')) && (
            <div>
              <div className={`text-slate-500 text-[10px] uppercase font-bold tracking-widest px-2 py-1 mb-2 font-mono truncate transition-all ${sidebarCollapsed ? 'md:hidden' : 'block'}`}>System Control</div>
              <div className="space-y-1">
                {isPermitted('Logs') && (
                  <button
                    id="ws-logs"
                    onClick={() => { setActiveWorkstation('Logs'); setShowSettings(false); }}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 md:py-2.5' : 'space-x-3 px-3 py-2'} rounded-md transition-all text-left font-medium text-xs border ${
                      activeWorkstation === 'Logs' && !showSettings
                        ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 font-bold'
                        : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                    title={sidebarCollapsed ? "Audit Transaction Logs" : undefined}
                  >
                    <Clock className="h-4 w-4 text-teal-500/80 shrink-0" />
                    <span className={`${sidebarCollapsed ? 'md:hidden' : 'block'} truncate`}>Audit Logs</span>
                  </button>
                )}

                {isPermitted('Settings') && (
                  <button
                    id="btn-global-settings"
                    onClick={() => { setShowSettings(true); }}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 md:py-2.5' : 'space-x-3 px-3 py-2'} rounded-md transition-all text-left font-medium text-xs border ${
                      showSettings
                        ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                        : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                    title={sidebarCollapsed ? "System Settings" : undefined}
                  >
                    <Settings2 className="h-4 w-4 text-teal-500/80 shrink-0" />
                    <span className={`${sidebarCollapsed ? 'md:hidden' : 'block'} truncate`}>System Settings</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </nav>

        <div className={`p-4 border-t border-slate-800 bg-slate-900/50 flex ${sidebarCollapsed ? 'hidden md:flex md:flex-col md:items-center md:gap-3 justify-center' : 'flex items-center justify-between'}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'md:flex-col md:space-y-1.5 md:space-x-0' : 'space-x-2.5'} overflow-hidden`}>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-teal-400 font-display shrink-0 border border-slate-700" title={currentUser.full_name}>
              {currentUser.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className={`overflow-hidden ${sidebarCollapsed ? 'md:hidden' : 'block'}`}>
              <p className="text-xs text-white font-semibold truncate leading-tight block">{currentUser.full_name}</p>
              <p className="text-[9px] text-slate-400 font-mono font-medium truncate mt-0.5 block">{currentUser.role} (LAN)</p>
            </div>
          </div>
          <button
            id="btn-sidebar-logout"
            onClick={() => {
              writeLog(currentUser.username, 'Logged out from workstation session.');
              setCurrentUser(null);
            }}
            className="text-slate-500 hover:text-rose-450 p-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition cursor-pointer shrink-0"
            title="Log out of session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Work Area */}
      <main className="flex-1 flex flex-col md:h-full overflow-hidden relative">
        {/* Floating System Notification Toast */}
        {systemToast && (
          <div className="fixed top-4 right-4 sm:right-8 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-teal-500/30 text-xs font-medium animate-in fade-in slide-in-from-top-3 duration-200">
            <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
            <span>{systemToast.message}</span>
            <button
              onClick={() => setSystemToast(null)}
              className="text-slate-400 hover:text-white ml-2 text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Control Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-slate-400 text-xs font-medium">Academic Year: <span className="text-slate-900 font-bold">{activeYear ? activeYear.year_label : 'None Configured'}</span></span>
            <span className="h-4 w-[1px] bg-slate-200"></span>
            <span className="text-slate-400 text-xs font-medium">Current Term: <span className="text-slate-900 font-bold">{activeTerm ? activeTerm.term_name : 'None Configured'}</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 uppercase tracking-wide font-mono">
              LAN-Server Active: {settingsLanIP}
            </div>
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-teal-300"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-8 flex-grow flex flex-col space-y-8 overflow-y-auto">
          
          {/* Metric Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest font-mono">Total Outstanding Fees</p>
              <p className="text-2xl font-bold text-slate-900 font-display mt-2">{formatCurrency(totalOutstandingFees)}</p>
              <div className="flex items-center mt-2.5 text-rose-500 text-[10px] font-semibold">
                <span>{activeTermBillings.filter(b => (b.total_amount_due + b.prior_debt_accumulated) - b.amount_paid > 0).length} Pending Payments</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest font-mono">Items Out of Stock</p>
              <p className="text-2xl font-bold text-slate-900 font-display mt-2">{totalItemsOutOfStock} Items</p>
              <div className="flex items-center mt-2.5 text-amber-600 text-[10px] font-semibold truncate max-w-full">
                <span>{totalItemsOutOfStock > 0 ? `Critical: ${products.filter(p => p.stock_quantity === 0).slice(0, 2).map(p => p.product_name).join(', ')}` : 'All inventory levels sufficient'}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest font-mono">Pending Deliveries Queue</p>
              <p className="text-2xl font-bold text-teal-600 font-display mt-2">{totalPendingDeliveries} Orders</p>
              <div className="flex items-center mt-2.5 text-slate-500 text-[10px] font-medium">
                <span>Awaiting Stock Release</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm transition-all duration-300 hover:brightness-110">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest font-mono">System Node Status</p>
              <p className="text-lg font-bold text-white font-display mt-2">Workstation-03</p>
              <div className="flex items-center mt-2.5 text-teal-400 text-[10px] font-semibold">
                <span className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mr-2 animate-ping"></div>
                  Database Synchronized
                </span>
              </div>
            </div>
          </div>

          {/* Balanced Data View panel space */}
          <div className="flex-grow flex flex-col min-w-0">
            {activeWorkstation === 'Admin' && isPermitted('Admin') && (
              <AdminPanel
                classes={classes}
                years={years}
                terms={terms}
                students={students}
                billings={billings}
                breakdowns={breakdowns}
                logs={logs}
                activeTermId={activeTermId}
                onAddStudent={addStudent}
                onAddClass={addClassOption}
                onDeleteClass={deleteClassOption}
                onRollForward={executeRollForward}
                onAddNewTerm={addNewTerm}
                onSetActiveTerm={setActiveTermId}
                formatCurrency={formatCurrency}
                onAddAcademicYear={addAcademicYear}
                onSetYearActive={setYearActive}
                onDeleteAcademicYear={deleteAcademicYear}
                userAccounts={userAccounts}
                onAddUser={addUserAccount}
                onEditUser={editUserAccount}
                onDeleteUser={deleteUserAccount}
                onUpdateStudent={updateStudent}
                currentUser={currentUser!}
              />
            )}

            {activeWorkstation === 'Cashier' && isPermitted('Cashier') && (
              <CashierPanel
                students={students}
                classes={classes}
                billings={billings}
                breakdowns={breakdowns}
                products={products}
                activeTermId={activeTermId}
                terms={terms}
                onAddStoreItemToBilling={addStoreItemToBilling}
                onRemoveStoreItemFromBilling={removeStoreItemFromBilling}
                onPostPayment={processBankPayment}
                onInitializeBilling={initializeBilling}
                formatCurrency={formatCurrency}
              />
            )}

            {activeWorkstation === 'Inventory' && isPermitted('Inventory') && (
              <InventoryPanel
                products={products}
                categories={categories}
                allocations={allocations}
                students={students}
                billings={billings}
                classes={classes}
                onRestockProduct={restockProduct}
                onDeliverAllocationBeforeStockCheck={deliverAllocationBeforeStockCheck}
                onAddProduct={addProduct}
                onEditProduct={editProduct}
                onDeleteProduct={deleteProduct}
                onAddCategory={addCategory}
                onEditCategory={editCategory}
                onDeleteCategory={deleteCategory}
                formatCurrency={formatCurrency}
              />
            )}

            {activeWorkstation === 'Reports' && isPermitted('Reports') && (
              <DefaulterReportPanel
                students={students}
                classes={classes}
                billings={billings}
                terms={terms}
                years={years}
                activeTermId={activeTermId}
                formatCurrency={formatCurrency}
              />
            )}

            {activeWorkstation === 'Logs' && isPermitted('Logs') && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-5 border-b border-slate-200 bg-slate-55 shadow-xs flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-teal-600" />
                    Local Area Router Action Logger
                  </h3>
                  <span className="text-[10px] bg-slate-100 px-3 py-1.5 rounded font-bold text-slate-500 border border-slate-200 uppercase tracking-widest font-mono">Live Sync Status</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 text-[10px] tracking-wider uppercase font-bold font-mono">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Acting Workstation</th>
                        <th className="p-4">Action Detail Trace</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {logs.map((log, idx) => (
                        <tr key={`${log.log_id}-${idx}`} className="hover:bg-slate-50/50 transition duration-150">
                          <td className="p-4 font-mono text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.user_id.includes('Admin')
                                ? 'bg-teal-150 text-teal-900 font-sans'
                                : log.user_id.includes('Cashier')
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200 font-sans'
                                  : log.user_id.includes('Inventory')
                                    ? 'bg-slate-900 text-slate-200 font-mono text-[9px]'
                                    : 'bg-slate-100 text-slate-755 border border-slate-200'
                            }`}>
                              {log.user_id}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[11px] text-slate-600 leading-relaxed font-semibold">{log.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Audit / Logs ticker at the bottom */}
          {logs.length > 0 && (
            <div className="h-16 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between space-x-8 shrink-0">
              <div className="flex items-center space-x-4">
                <div className="border-r border-slate-150 pr-6">
                  <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Audit Log Trace</h3>
                  <p className="text-xs font-semibold text-slate-800 truncate max-w-[280px] md:max-w-md mt-0.5">
                    {logs[0].action}
                  </p>
                </div>
                <div className="hidden md:flex space-x-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">System Time</span>
                    <span className="text-xs font-mono text-slate-700 font-medium">14:32:05</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">DB Latency</span>
                    <span className="text-xs font-mono text-teal-600 font-bold underline decoration-teal-300">0.002ms</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Sync node</span>
                    <span className="text-xs font-mono text-slate-700 font-medium">3 stations</span>
                  </div>
                </div>
              </div>
              <div>
                <button
                  id="btn-download-backup-tick"
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider hover:bg-slate-800 transition cursor-pointer"
                >
                  Backup Database (.sql)
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* SYSTEM SETTINGS PANEL DIALOG */}
      {currentUser?.role === 'Admin' && showSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white text-slate-800 rounded-2xl overflow-hidden shadow-2xl max-w-sm sm:max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150 relative max-h-[85vh] flex flex-col">
            
            {/* Compact Header */}
            <div className="bg-slate-900 px-4 py-3 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <h3 className="font-bold font-display text-xs sm:text-sm tracking-tight flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-teal-400 shrink-0" />
                System Setting
              </h3>
              <button
                id="btn-settings-close"
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white font-bold text-xs p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleApplySettings} className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Academy Name Label</label>
                <input
                  type="text"
                  value={settingsSchoolName}
                  onChange={(e) => setSettingsSchoolName(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">LAN Server IP</label>
                  <input
                    type="text"
                    value={settingsLanIP}
                    onChange={(e) => setSettingsLanIP(e.target.value)}
                    className="w-full text-xs font-mono text-slate-800 border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Base Currency</label>
                  <input
                    type="text"
                    value={settingsCurrency}
                    onChange={(e) => setSettingsCurrency(e.target.value)}
                    className="w-full text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2.5 space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Section-Specific Default Term Tuition</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-semibold text-slate-400 block mb-0.5 font-mono">Pre-Primary ({settingsCurrency})</label>
                    <input
                      type="number"
                      value={settingsDefaultTuitionPrePrimary}
                      onChange={(e) => setSettingsDefaultTuitionPrePrimary(e.target.value)}
                      className="w-full text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:outline-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-semibold text-slate-400 block mb-0.5 font-mono">Primary ({settingsCurrency})</label>
                    <input
                      type="number"
                      value={settingsDefaultTuitionPrimary}
                      onChange={(e) => setSettingsDefaultTuitionPrimary(e.target.value)}
                      className="w-full text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:outline-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-semibold text-slate-400 block mb-0.5 font-mono">JSS ({settingsCurrency})</label>
                    <input
                      type="number"
                      value={settingsDefaultTuitionJSS}
                      onChange={(e) => setSettingsDefaultTuitionJSS(e.target.value)}
                      className="w-full text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:outline-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-semibold text-slate-400 block mb-0.5 font-mono">SSS ({settingsCurrency})</label>
                    <input
                      type="number"
                      value={settingsDefaultTuitionSSS}
                      onChange={(e) => setSettingsDefaultTuitionSSS(e.target.value)}
                      className="w-full text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-lg p-1.5 bg-slate-50 focus:bg-white focus:outline-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Backups & Restore section */}
              <div className="border-t border-slate-100 pt-2.5 space-y-2">
                <div>
                  <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Database Administration</h4>
                  <p className="text-[9px] text-slate-400 mt-0.5">Restore database state from an Al-Qalam SQL Backup file.</p>
                </div>

                <div className="relative border border-dashed border-slate-300 hover:border-teal-500 rounded-lg p-2.5 bg-slate-50 hover:bg-slate-100/50 transition flex flex-col items-center justify-center text-center cursor-pointer">
                  <input
                    type="file"
                    accept=".sql"
                    onChange={handleImportSqlBackup}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Database className="h-4 w-4 text-teal-600 mb-0.5" />
                  <span className="text-[10px] font-bold text-slate-700">Upload Al-Qalam Backup (.sql)</span>
                  <span className="text-[8px] text-slate-400 font-mono">Click or drag & drop</span>
                </div>

                {restoreError && (
                  <div className="p-2 bg-rose-50 text-rose-700 text-[9px] rounded-lg border border-rose-200 font-mono leading-normal">
                    ⚠️ Error: {restoreError}
                  </div>
                )}

                {restoreSuccess && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 text-[9px] rounded-lg border border-emerald-200 flex items-center gap-1.5 font-sans font-medium">
                    ✨ Database restored successfully!
                  </div>
                )}

                <div className="pt-1">
                  {showPurgeConfirm ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-start gap-2 text-rose-700">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                        <div>
                          <span className="font-bold text-xs text-rose-950 block">Drop all classes, sessions & data?</span>
                          <span className="text-[10px] text-rose-700 block mt-0.5">
                            This will wipe all records and reset the system to like-new condition.
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowPurgeConfirm(false)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          id="btn-confirm-purge-database"
                          onClick={executePurgeAllData}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" /> Yes, Reset Database
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="btn-purge-database"
                      onClick={() => setShowPurgeConfirm(true)}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-sans font-bold py-2 px-3 rounded-xl text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      Purge All Sample Data & Clean Database
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <button
                  id="btn-settings-save"
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-sans font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm uppercase tracking-wider cursor-pointer"
                >
                  Apply Settings
                </button>
              </div>
            </form>

            {/* Confirmation Overlay Card for Restoring State */}
            {restoreCandidate && (
              <div className="absolute inset-0 bg-white/98 p-4 flex flex-col justify-between z-10 animate-in fade-in zoom-in-95 duration-150 overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 border-b border-amber-100 pb-2">
                    <Database className="h-5 w-5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 font-display">Confirm Database Overwrite</h4>
                      <p className="text-[9px] text-slate-500 font-mono">Payload verification check: PASSED</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Overwriting current database with backup records. This action is <strong className="text-rose-600">IRREVERSIBLE</strong>.
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1 text-[10px] font-mono">
                    <div className="font-bold uppercase tracking-wider text-slate-400 text-[8px] mb-0.5">Backup Stats</div>
                    <div className="flex justify-between">
                      <span>Students:</span>
                      <span className="font-bold text-slate-800">{restoreCandidate.students?.length ?? 0} rows</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Classes:</span>
                      <span className="font-bold text-slate-800">{restoreCandidate.classes?.length ?? 0} rows</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Billing:</span>
                      <span className="font-bold text-slate-800">{restoreCandidate.billings?.length ?? 0} rows</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Accounts:</span>
                      <span className="font-bold text-slate-800">{restoreCandidate.userAccounts?.length ?? 0} rows</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => applyDatabaseRestore(restoreCandidate)}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-lg text-xs font-bold transition uppercase tracking-wider shadow-sm cursor-pointer"
                  >
                    Overwrite & Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreCandidate(null)}
                    className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
