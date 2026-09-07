import React, { useState, useMemo } from 'react';
import {
  Student,
  Billing,
  SchoolClass,
  Term,
  AcademicYear
} from '../types';
import {
  Printer,
  Filter,
  DollarSign,
  UserCheck,
  AlertTriangle,
  Calendar,
  Layers,
  ChevronDown,
  Clock,
  Search,
  CheckCircle,
  TrendingDown
} from 'lucide-react';

interface DefaulterReportPanelProps {
  students: Student[];
  classes: SchoolClass[];
  billings: Billing[];
  terms: Term[];
  years: AcademicYear[];
  activeTermId: number;
  formatCurrency: (amount: number) => string;
}

export default function DefaulterReportPanel({
  students,
  classes,
  billings,
  terms,
  years,
  activeTermId,
  formatCurrency
}: DefaulterReportPanelProps) {
  // Filters state
  const [selectedClassId, setSelectedClassId] = useState<string>('All');
  const [selectedTermId, setSelectedTermId] = useState<string>(String(activeTermId));
  const [minBalanceThreshold, setMinBalanceThreshold] = useState<number>(1); // default > N0
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Get active configurations
  const selectedTerm = terms.find(t => t.term_id === Number(selectedTermId));
  const selectedYear = selectedTerm ? years.find(y => y.year_id === selectedTerm.year_id) : null;

  // Process data to find active students with outstanding balances
  const reportData = useMemo(() => {
    return students
      .filter((student) => student.is_active !== false)
      .map((student) => {
      // Find billing for this student in selected term
      const billing = billings.find(
        b => b.student_id === student.student_id && b.term_id === Number(selectedTermId)
      );

      const matchedClass = classes.find(c => c.class_id === student.current_class_id);

      const totalFee = billing ? billing.total_amount_due : 0;
      const priorDebt = billing ? billing.prior_debt_accumulated : 0;
      const amountPaid = billing ? billing.amount_paid : 0;
      const outstandingBalance = (totalFee + priorDebt) - amountPaid;

      return {
        student,
        billing,
        matchedClass,
        totalFee,
        priorDebt,
        amountPaid,
        outstandingBalance,
        hasBilling: !!billing
      };
    });
  }, [students, billings, selectedTermId, classes]);

  // Filtered dataset
  const filteredReport = useMemo(() => {
    return reportData.filter(item => {
      // Outstanding balance check
      if (item.outstandingBalance < minBalanceThreshold) return false;

      // Class filter
      if (selectedClassId !== 'All' && String(item.student.current_class_id) !== selectedClassId) {
        return false;
      }

      // Name or Admission No search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const fullName = `${item.student.first_name} ${item.student.last_name}`.toLowerCase();
        const adm = item.student.admission_no.toLowerCase();
        if (!fullName.includes(query) && !adm.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [reportData, selectedClassId, minBalanceThreshold, searchQuery]);

  // Summaries
  const totals = useMemo(() => {
    let sumTotalFee = 0;
    let sumPriorDebt = 0;
    let sumPaid = 0;
    let sumOutstanding = 0;

    filteredReport.forEach(item => {
      sumTotalFee += item.totalFee;
      sumPriorDebt += item.priorDebt;
      sumPaid += item.amountPaid;
      sumOutstanding += item.outstandingBalance;
    });

    return {
      totalFee: sumTotalFee,
      priorDebt: sumPriorDebt,
      paid: sumPaid,
      outstanding: sumOutstanding,
      count: filteredReport.length
    };
  }, [filteredReport]);

  const handlePrint = () => {
    window.print();
  };

  const getClassName = (classId: number) => {
    const cls = classes.find(c => c.class_id === classId);
    return cls ? cls.class_name : 'Unknown Class';
  };

  // Current system local timestamp formatted for metadata header
  const reportGenerationTimestamp = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }, []);

  return (
    <div className="space-y-6 flex flex-col min-h-0 w-full">
      {/* Dynamic document print styles to encapsulate print boundaries elegantly */}
      <style>{`
        @media print {
          /* Hide standard elements */
          body {
            background-color: white !important;
            color: black !important;
            font-size: 11px !important;
          }
          aside, header, footer, .no-print, button, form, input, select {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            overflow: visible !important;
            height: auto !important;
          }
          /* Make container absolute to capture full printable layout */
          .print-area-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            padding: 15px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            visibility: visible !important;
          }
          .print-area-wrapper * {
            visibility: visible !important;
            color: black !important;
            border-color: #cbd5e1 !important; /* slate-300 colors */
          }
          .badge-alert {
            background: transparent !important;
            border: 1px solid #dc2626 !important;
            color: #dc2626 !important;
          }
          /* Avoid page breaks inside table rows */
          tr {
            page-break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.2cm 1cm 1.2cm 1cm;
          }
        }
      `}</style>

      {/* Control panel & filter section (Hidden on print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 no-print grow-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 font-display">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              Fee Defaulters & Outstanding Balances Report
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Generate real-time, print-friendly fee statements for auditing or collection tracking.
            </p>
          </div>
          <button
            id="btn-print-defaulters-pdf"
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg flex items-center gap-2 transition shadow-sm h-10 select-none cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Class PDF Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Class Filter */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">Filter by Classroom</label>
            <div className="relative">
              <select
                id="filter-report-class"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-semibold text-slate-700 focus:outline-teal-500 cursor-pointer appearance-none"
              >
                <option value="All">All Classrooms Combined</option>
                {classes.map((cls) => (
                  <option key={cls.class_id} value={String(cls.class_id)}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Term selector */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">Academic Term Context</label>
            <div className="relative">
              <select
                id="filter-report-term"
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-semibold text-slate-700 focus:outline-teal-500 cursor-pointer appearance-none"
              >
                {terms.map((t) => {
                  const y = years.find((yr) => yr.year_id === t.year_id);
                  return (
                    <option key={t.term_id} value={String(t.term_id)}>
                      {t.term_name} ({y ? y.year_label : 'Cycle'})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Min Balance Threshold */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">Minimum Outstanding Debt</label>
            <div className="relative">
              <select
                id="filter-report-threshold"
                value={minBalanceThreshold}
                onChange={(e) => setMinBalanceThreshold(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-semibold text-slate-700 focus:outline-teal-500 cursor-pointer appearance-none"
              >
                <option value={1}>Any Outstanding Debt (&gt; ₦0)</option>
                <option value={5000}>Equal or above ₦5,000</option>
                <option value={20000}>Equal or above ₦20,000</option>
                <option value={50000}>Equal or above ₦50,000</option>
                <option value={100000}>Severe Debt (&gt;= ₦100,000)</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Fast Search */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">Search Name / Admission No</label>
            <div className="relative">
              <input
                id="filter-report-search"
                type="text"
                placeholder="Search matching entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 font-medium focus:outline-teal-500"
              />
              <Search className="absolute left-3 top-3 p-0.5 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Printable Area Wrapper */}
      <div id="printable-report" className="print-area-wrapper bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        
        {/* Printable Official School Header (Clean and stylish) */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center font-bold text-white text-xs font-display">
                AQ
              </div>
              <span className="font-bold text-slate-900 text-xs tracking-wider uppercase font-mono font-extrabold">Al-Qalam Academy Systems</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-display uppercase tracking-tight">OUTSTANDING BALANCE STATEMENT</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-[11px] font-medium">
              <span>Academic Cycle: <strong className="text-slate-820 font-bold">{selectedYear ? selectedYear.year_label : 'N/A'}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Billing Term: <strong className="text-slate-820 font-bold">{selectedTerm ? selectedTerm.term_name : 'N/A'}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Class Filter: <strong className="text-slate-820 font-bold">{selectedClassId === 'All' ? 'All Classes Combined' : getClassName(Number(selectedClassId))}</strong></span>
            </div>
          </div>
          
          <div className="text-left md:text-right space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Report metadata</div>
            <div className="text-[11px] text-slate-600 font-medium font-sans">Date: {reportGenerationTimestamp}</div>
            <div className="text-[11px] font-semibold text-teal-600 bg-teal-50/70 border border-teal-100 px-2 py-0.5 rounded-md inline-block font-mono">
              Nodes Status: Off-line Synced
            </div>
          </div>
        </div>

        {/* Middle Stats Bar inside report */}
        <div className="px-6 py-4 bg-slate-50/30 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Debtor Rosters</span>
            <span className="text-lg font-bold text-slate-800 font-display">{totals.count} Defaulters</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Sum Term Fees</span>
            <span className="text-lg font-bold text-slate-750 font-display">{formatCurrency(totals.totalFee)}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Sum Prior Debts</span>
            <span className="text-lg font-bold text-slate-750 font-display text-amber-700">{formatCurrency(totals.priorDebt)}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Sum Accumulated Due</span>
            <span className="text-lg font-bold text-rose-600 font-display">{formatCurrency(totals.outstanding)}</span>
          </div>
        </div>

        {/* Main Ledgers Dataset Table */}
        <div className="flex-1 overflow-x-auto min-h-0 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] tracking-wider uppercase font-bold font-mono">
                <th className="p-4 w-[12%]">Admiss. No</th>
                <th className="p-4 w-[28%]">Student Full Name</th>
                <th className="p-4 w-[18%]">Class Classrooms</th>
                <th className="p-4 w-[14%]">Parent Line</th>
                <th className="p-4 text-right w-[14%]">Term Tuition</th>
                <th className="p-4 text-right w-[14%] font-mono text-amber-700 bg-amber-50/10">Prior Bal</th>
                <th className="p-4 text-right w-[14%] bg-slate-50/40">Total Paid</th>
                <th className="p-4 text-right w-[14%] text-rose-600 bg-rose-50/20 font-bold border-l border-slate-200">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredReport.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <UserCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <span className="font-bold text-slate-500 text-sm block">No Debtor Records Found</span>
                    <span className="text-xs text-slate-400 font-medium mt-1 inline-block">
                      All student statements in this selection have been completely settled. Good job!
                    </span>
                  </td>
                </tr>
              ) : (
                filteredReport.map((item, idx) => (
                  <tr key={item.student.student_id} className="hover:bg-slate-50/30 transition duration-150">
                    <td className="p-4 font-mono font-bold text-[11px] text-slate-500">
                      {item.student.admission_no}
                    </td>
                    <td className="p-4 font-semibold text-slate-900 text-sm">
                      {item.student.first_name} {item.student.last_name}
                    </td>
                    <td className="p-4 font-sans text-xs">
                      {item.matchedClass ? item.matchedClass.class_name : 'N/A'}
                    </td>
                    <td className="p-4 font-mono text-slate-500 text-[11px]">
                      {item.student.parent_phone}
                    </td>
                    <td className="p-4 text-right font-mono">
                      {formatCurrency(item.totalFee)}
                    </td>
                    <td className="p-4 text-right font-mono text-amber-700 bg-amber-50/5">
                      {formatCurrency(item.priorDebt)}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600 bg-slate-50/10">
                      {formatCurrency(item.amountPaid)}
                    </td>
                    <td className="p-4 text-right font-mono text-rose-600 bg-rose-50/20 font-bold border-l border-slate-200 text-xs">
                      {formatCurrency(item.outstandingBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sum Outstanding Summary Block at the bottom of the table (Durable visual) */}
        <div className="p-6 border-t border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono text-teal-400">REPORT LEDGER SUMMATION</div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                This document registers a cumulative outstanding liability of <span className="text-white font-bold">{totals.count} student(s)</span> for the scheduled billing term. Payments must route strictly to Al-Qalam's local bank deposit registry.
              </p>
            </div>

            <div className="text-left md:text-right flex items-center gap-8 border-l border-slate-800 pl-6 shrink-0">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest block font-mono">TERM DEPOSIT EXPECTED</span>
                <span className="text-sm font-bold block text-slate-300 font-mono">{formatCurrency(totals.paid)} Paid Receipted</span>
              </div>
              <div className="space-y-1 border-l border-slate-800 pl-8">
                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest block font-mono">TOTAL REPORT OUTSTANDING</span>
                <span className="text-2xl font-black text-rose-450 font-display text-rose-400 tracking-tight block">
                  {formatCurrency(totals.outstanding)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification & Signature Slip Section (Beautiful professional touch for printer copies) */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/40 grid grid-cols-2 gap-8 text-[11px] text-slate-500 font-mono">
          <div className="space-y-8">
            <p className="font-semibold text-slate-400 uppercase tracking-wide">Reporting Officer Signoff</p>
            <div className="space-y-1">
              <div className="border-b border-slate-300 w-48 h-5"></div>
              <p className="text-[9px] text-slate-450 uppercase font-bold">Authorized Auditor / Cashier</p>
            </div>
          </div>
          <div className="space-y-8 text-right flex flex-col items-end">
            <p className="font-semibold text-slate-400 uppercase tracking-wide w-48 text-left">Executive Sanction Approval</p>
            <div className="space-y-1 w-48 text-left">
              <div className="border-b border-slate-300 w-48 h-5"></div>
              <p className="text-[9px] text-slate-450 uppercase font-bold">School Principal / Administrator</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
