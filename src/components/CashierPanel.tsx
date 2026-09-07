import React, { useState } from 'react';
import {
  Student,
  Billing,
  SchoolClass,
  Product,
  BillingBreakdownItem,
  Term
} from '../types';
import {
  Search,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Receipt,
  Printer,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Plus,
  Compass,
  FileCheck,
  Trash2,
  GraduationCap
} from 'lucide-react';

interface CashierPanelProps {
  students: Student[];
  classes: SchoolClass[];
  billings: Billing[];
  breakdowns: BillingBreakdownItem[];
  products: Product[];
  activeTermId: number;
  terms: Term[];
  onAddStoreItemToBilling: (studentId: number, productId: number, itemPrice: number, productName: string) => void;
  onRemoveStoreItemFromBilling: (breakdownId: number) => void;
  onPostPayment: (billingId: number, tellerCode: string, paymentAmt: number) => { changeReturned: number; status: string } | undefined;
  onInitializeBilling: (studentId: number, defaultTuition?: number) => void;
  formatCurrency: (amount: number) => string;
}

export default function CashierPanel({
  students,
  classes,
  billings,
  breakdowns,
  products,
  activeTermId,
  terms,
  onAddStoreItemToBilling,
  onRemoveStoreItemFromBilling,
  onPostPayment,
  onInitializeBilling,
  formatCurrency
}: CashierPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Form states for manual teller processing
  const [tellerCode, setTellerCode] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  
  // Inventory Cart states
  const [activeTab, setActiveTab] = useState<'fees' | 'shop'>('fees');
  const [notification, setNotification] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<{
    studentName: string;
    admNo: string;
    className: string;
    refCode: string;
    tellerCode: string;
    amountPaid: number;
    billingBreakdown: BillingBreakdownItem[];
    subtotal: number;
    priorDebt: number;
    totalLiability: number;
    outstandingBefore: number;
    outstandingAfter: number;
    changeReturned: number;
    date: string;
  } | null>(null);

  const [receiptType, setReceiptType] = useState<'A5' | 'Thermal80'>('A5');

  // Load existing paid statements into printable receipt format
  const handleLoadExistingReceipt = () => {
    if (!activeBilling || !selectedStudent) return;
    const subtotal = activeBilling.total_amount_due;
    const priorDebt = activeBilling.prior_debt_accumulated;
    const totalLiability = subtotal + priorDebt;
    const outstandingCurrent = totalOutstanding;
    
    setReceiptData({
      studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
      admNo: selectedStudent.admission_no,
      className: selectedStudentClass ? selectedStudentClass.class_name : 'N/A',
      refCode: activeBilling.offline_ref_code,
      tellerCode: 'PRE-AUTHORIZED / COMPLETED',
      amountPaid: activeBilling.amount_paid,
      billingBreakdown: [...billingBreakdownList],
      subtotal: subtotal,
      priorDebt: priorDebt,
      totalLiability: totalLiability,
      outstandingBefore: totalLiability,
      outstandingAfter: outstandingCurrent,
      changeReturned: 0,
      date: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    });
  };

  // Only active students can be searched or selected in the cashier panel
  const activeStudents = students.filter((s) => s.is_active !== false);

  // Handle billing search query
  const filteredStudents = activeStudents.filter(
    (s) =>
      s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admission_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStudent = activeStudents.find((s) => s.student_id === selectedStudentId);
  const selectedStudentClass = selectedStudent
    ? classes.find((c) => c.class_id === selectedStudent.current_class_id)
    : null;

  // Active Billing Statement
  const activeBilling = selectedStudent
    ? billings.find((b) => b.student_id === selectedStudent.student_id && b.term_id === activeTermId)
    : null;

  // Items billed under this invoice
  const billingBreakdownList = activeBilling
    ? breakdowns.filter((item) => item.billing_id === activeBilling.billing_id)
    : [];

  const totalOutstanding = activeBilling
    ? activeBilling.total_amount_due + activeBilling.prior_debt_accumulated - activeBilling.amount_paid
    : 0;

  const handlePostPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBilling || !tellerCode.trim() || !paymentAmount) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const outstandingBefore = totalOutstanding;
    const outstandingAfter = Math.max(0, totalOutstanding - amt);
    const subtotal = activeBilling.total_amount_due;
    const priorDebt = activeBilling.prior_debt_accumulated;
    const totalLiability = subtotal + priorDebt;

    const result = onPostPayment(activeBilling.billing_id, tellerCode.trim(), amt);
    
    if (result) {
      if (selectedStudent) {
        setReceiptData({
          studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
          admNo: selectedStudent.admission_no,
          className: selectedStudentClass ? selectedStudentClass.class_name : 'N/A',
          refCode: activeBilling.offline_ref_code,
          tellerCode: tellerCode.trim(),
          amountPaid: amt,
          billingBreakdown: [...billingBreakdownList],
          subtotal: subtotal,
          priorDebt: priorDebt,
          totalLiability: totalLiability,
          outstandingBefore: outstandingBefore,
          outstandingAfter: outstandingAfter,
          changeReturned: result.changeReturned,
          date: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })
        });
      }
      setNotification(`Processed payment of ${formatCurrency(amt)}. Status: ${result.status}`);
      setTellerCode('');
      setPaymentAmount('');
      setTimeout(() => setNotification(null), 5050);
    }
  };

  const handleShopPurchase = (product: Product) => {
    if (!selectedStudentId) {
      alert('Please select a student first to associate the purchase.');
      return;
    }

    if (!activeBilling) {
      // Initialize billing first
      onInitializeBilling(selectedStudentId);
    }

    onAddStoreItemToBilling(selectedStudentId, product.product_id, product.price, product.product_name);
    setNotification(`Appended ${product.product_name} to student active terminal invoice: ${formatCurrency(product.price)}`);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* LEFT COLUMN: Student search and roster list */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm font-sans tracking-tight">Lookup Student Ledger</h3>
          <p className="text-xs text-slate-400 mt-1">Search via Admission ID or Name to view details</p>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search e.g. Bello / ASA/2026/0101"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white focus:outline focus:outline-teal-500 text-slate-800"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        </div>

        <div className="overflow-y-auto max-h-[450px] divide-y divide-slate-100 pr-1">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-300 font-sans text-xs">
              No mismatching records found.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const matchedClass = classes.find((c) => c.class_id === student.current_class_id);
              const isSelected = student.student_id === selectedStudentId;
              const matchedBill = billings.find((b) => b.student_id === student.student_id && b.term_id === activeTermId);

              return (
                <button
                  key={student.student_id}
                  id={`btn-cashier-student-select-${student.student_id}`}
                  onClick={() => {
                    setSelectedStudentId(student.student_id);
                    setReceiptData(null); // clear prior receipt
                  }}
                  className={`w-full text-left p-3.5 my-1 rounded-lg flex items-center justify-between transition-all border ${
                    isSelected
                      ? 'bg-teal-50/50 border-teal-500/30 text-teal-950 border-l-4 border-l-teal-600'
                      : 'hover:bg-slate-50 text-slate-600 border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold font-sans block truncate text-slate-800">
                      {student.first_name} {student.last_name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-slate-400">
                      <span>{student.admission_no}</span>
                      <span>&bull;</span>
                      <span className="font-sans font-medium">{matchedClass ? matchedClass.class_name : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {matchedBill ? (
                      matchedBill.payment_status === 'Paid' ? (
                        <span className="bg-teal-50 text-teal-800 border border-teal-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">Paid</span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">Pending</span>
                      )
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold px-1 py-0.5 rounded font-mono">Unbilled</span>
                    )}
                    <ChevronRight className={`h-4 w-4 ${isSelected ? 'text-teal-500' : 'text-slate-300'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MIDDLE & RIGHT COLUMNS */}
      <div className="xl:col-span-2 space-y-6">
        {notification && (
          <div id="cashier-notification-banner" className="bg-slate-900 border border-slate-800 text-slate-100 p-3.5 rounded-xl text-xs font-semibold font-sans shadow-lg flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4.5 w-4.5 text-teal-400" />
              <span>{notification}</span>
            </div>
          </div>
        )}

        {selectedStudent ? (
          <div className="space-y-6">
            {/* Student metadata bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-slate-900 border border-slate-855 flex items-center justify-center font-bold text-teal-400 text-sm tracking-tight font-display">
                  {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{selectedStudent.first_name} {selectedStudent.last_name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400 font-mono">
                    <span>No: {selectedStudent.admission_no}</span>
                    <span>&bull;</span>
                    <span>Class: {selectedStudentClass?.class_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  id="tab-fees-cashier"
                  onClick={() => setActiveTab('fees')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    activeTab === 'fees'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Fees & Term Statement
                </button>
                <button
                  id="tab-shop-cashier"
                  onClick={() => setActiveTab('shop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    activeTab === 'shop'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Academy Shop Inventory
                </button>
              </div>
            </div>

            {activeTab === 'fees' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Terminal Bill Statement */}
                <div className="bg-white border border-slate-250 rounded-xl overflow-hidden shadow-md flex flex-col justify-between">
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-slate-400" />
                        <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Statement Invoice</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Ref: {activeBilling ? activeBilling.offline_ref_code : 'N/A'}</span>
                    </div>

                    {!activeBilling ? (
                      <div className="p-8 text-center space-y-4">
                        <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
                        <p className="text-xs text-slate-500">No active statement has been registered for this student for the current term yet.</p>
                        <button
                          id="btn-initialize-invoice"
                          onClick={() => onInitializeBilling(selectedStudent.student_id)}
                          className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          + Auto-Generate Standard Statement
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Statement items breakdown list */}
                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                          {billingBreakdownList.map((item, idx) => (
                            <div key={`${item.breakdown_id}-${idx}`} className="flex justify-between items-center text-xs text-slate-600 border-b border-dashed border-slate-100 pb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                {item.product_id !== null && activeBilling.amount_paid === 0 && activeBilling.payment_status === 'Unpaid' && (
                                  <button
                                    id={`btn-remove-invoice-item-${item.breakdown_id}`}
                                    onClick={() => onRemoveStoreItemFromBilling(item.breakdown_id)}
                                    className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition shrink-0 mr-0.5"
                                    title="Remove added item"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <span className="font-sans text-slate-800 truncate">{item.item_description}</span>
                              </div>
                              <span className="font-mono font-semibold text-slate-700 whitespace-nowrap">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Statement Sum Calculations */}
                        <div className="pt-2 bg-slate-50 p-3 rounded-lg space-y-1 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Sum of New Items Due:</span>
                            <span className="font-mono">{formatCurrency(activeBilling.total_amount_due)}</span>
                          </div>
                          {activeBilling.prior_debt_accumulated > 0 && (
                            <div className="flex justify-between text-rose-600 font-semibold">
                              <span>Prior Carryforward Debt:</span>
                              <span className="font-mono">+{formatCurrency(activeBilling.prior_debt_accumulated)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-teal-900 font-bold border-t border-slate-200 pt-1.5 mt-1.5 text-[13px]">
                            <span>Gross Statement Liability:</span>
                            <span className="font-mono">
                              {formatCurrency(activeBilling.total_amount_due + activeBilling.prior_debt_accumulated)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Processed Receipts Paid:</span>
                            <span className="font-mono text-slate-700">{formatCurrency(activeBilling.amount_paid)}</span>
                          </div>
                          {activeBilling.amount_paid > 0 && (
                            <div className="pt-2 flex justify-end no-print">
                              <button
                                type="button"
                                onClick={handleLoadExistingReceipt}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-750 text-slate-700 hover:text-slate-900 border border-slate-200 font-sans font-bold uppercase tracking-wider rounded-md py-1 px-2.5 transition flex items-center gap-1.5 cursor-pointer"
                                title="Reprint the clearance voucher for past processes"
                              >
                                <Printer className="h-3 w-3 text-teal-600" /> Reprint Term Receipt
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {activeBilling && (
                    <div className="bg-slate-900 border-t border-slate-800 p-4 text-white flex justify-between items-center h-16 rounded-b-xl shrink-0">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-widest font-mono font-bold">Net Balanced Debt</span>
                        <span className="text-lg font-bold font-mono text-teal-400">{formatCurrency(totalOutstanding)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block font-mono font-bold">STATUS</span>
                        <span className={`text-[10px] font-semibold uppercase rounded px-2.5 py-0.5 border ${
                          activeBilling.payment_status === 'Paid'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : activeBilling.payment_status === 'Partially Paid'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {activeBilling.payment_status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submitting Offline Bank Payments */}
                {activeBilling && (
                  <div className="space-y-4">
                    {/* Bank Teller input form */}
                    {totalOutstanding > 0 ? (
                      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-widest font-mono text-teal-600 font-display">Post Offline Bank teller</h4>
                          <p className="text-[11px] text-slate-400 mt-1">Accept local deposit slip receipt and release allocation queues.</p>
                        </div>

                        <form onSubmit={handlePostPayment} className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-mono">Bank Slip / Deposit Auth Reference</label>
                            <input
                              type="text"
                              value={tellerCode}
                              onChange={(e) => setTellerCode(e.target.value)}
                              placeholder="E.g., UBA-TELLER-928374"
                              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline focus:outline-teal-500 text-slate-800 font-mono font-medium"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-mono">Paid Amount (₦)</label>
                            <input
                              type="number"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder="E.g., 20000"
                              max={totalOutstanding}
                              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline focus:outline-teal-500 text-slate-800 font-bold font-mono"
                              required
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">Outstanding Limit: {formatCurrency(totalOutstanding)}</span>
                          </div>

                          <button
                            id="btn-submit-payment"
                            type="submit"
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wider"
                          >
                            <DollarSign className="h-4 w-4" /> Validate & Post Deposit
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-teal-50/50 border border-teal-200/50 rounded-xl p-6 text-center space-y-2 animate-in fade-in">
                        <FileCheck className="h-10 w-10 text-teal-600 mx-auto" />
                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider font-mono">Statement Settled Fully</h4>
                        <p className="text-xs text-slate-500">Student is completely cleared with a net balance of zero outstanding liability for this term!</p>
                      </div>
                    )}

                    {/* Local receipt printing stylesheet to dynamically format on window.print() */}
                    <style>{`
                      @media print {
                        body {
                          background-color: white !important;
                          color: black !important;
                        }
                        aside, header, footer, nav, .no-print, button, form, input, select {
                          display: none !important;
                          height: 0 !important;
                          margin: 0 !important;
                          padding: 0 !important;
                          opacity: 0 !important;
                          pointer-events: none !important;
                        }
                        main, #root, .grid {
                          padding: 0 !important;
                          margin: 0 !important;
                          background: transparent !important;
                          overflow: visible !important;
                          height: auto !important;
                          display: block !important;
                        }
                        #receipt-printable-container {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: ${receiptType === 'Thermal80' ? '80mm' : '100%'} !important;
                          max-width: ${receiptType === 'Thermal80' ? '80mm' : '100%'} !important;
                          padding: ${receiptType === 'Thermal80' ? '4mm' : '24px'} !important;
                          margin: 0 !important;
                          box-shadow: none !important;
                          border: ${receiptType === 'Thermal80' ? 'none' : '1px solid #94a3b8'} !important;
                          background: white !important;
                          visibility: visible !important;
                          display: block !important;
                        }
                        #receipt-printable-container * {
                          visibility: visible !important;
                          color: black !important;
                          border-color: ${receiptType === 'Thermal80' ? 'black' : '#cbd5e1'} !important;
                          background: transparent !important;
                        }
                        @page {
                          size: ${receiptType === 'Thermal80' ? '80mm auto' : 'A5 portrait'};
                          margin: ${receiptType === 'Thermal80' ? '0' : '0.8cm'};
                        }
                      }
                    `}</style>

                    {/* Receipt Output layout */}
                    {receiptData && (
                      <div className="mt-4 animate-in fade-in slide-in-from-bottom duration-200">
                        {/* Print Mode Selector Tabs */}
                        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 p-2 rounded-lg border border-slate-200 mb-3 text-xs gap-2">
                          <span className="font-semibold text-slate-700">Select Print Layout Type:</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setReceiptType('A5')}
                              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer text-[11px] ${
                                receiptType === 'A5'
                                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Standard A5 Sheet
                            </button>
                            <button
                              type="button"
                              onClick={() => setReceiptType('Thermal80')}
                              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer text-[11px] ${
                                receiptType === 'Thermal80'
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              80mm Thermal Roll
                            </button>
                          </div>
                        </div>

                        {/* Printable Receipt layout */}
                        <div 
                          id="receipt-printable-container" 
                          className={`bg-white border-2 border-slate-200 shadow-md text-slate-800 relative flex flex-col transition-all duration-300 ${
                            receiptType === 'Thermal80' 
                              ? 'max-w-[325px] mx-auto p-4 rounded-none font-mono text-[11px] border-dashed space-y-3' 
                              : 'w-full rounded-xl p-6 font-sans space-y-4'
                          }`}
                        >
                          <span className="absolute right-6 top-6 no-print text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border bg-teal-50 text-teal-700 border-teal-200 font-mono">
                            OFFICIAL SLIP
                          </span>
                          
                          {/* Official Academic Header */}
                          {receiptType === 'Thermal80' ? (
                            <div className="text-center border-b border-dashed border-slate-400 pb-3 flex flex-col items-center">
                              <div className="h-8 w-8 rounded-full bg-slate-905 bg-slate-900 text-white flex items-center justify-center font-bold mb-1 shrink-0">
                                <GraduationCap className="h-4 w-4" />
                              </div>
                              <h1 className="text-[12px] font-extrabold text-slate-900 uppercase tracking-tight">AL-QALAM SCIENCE ACADEMY</h1>
                              <p className="text-[8px] uppercase tracking-wide font-extrabold text-slate-500">Knowledge, Integrity & Piety</p>
                              <p className="text-[8px] text-slate-400 mt-0.5">Gusau Campus, Zamfara State &bull; office@alqalam.edu</p>
                              <div className="mt-2 text-center">
                                <span className="border border-black px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider font-mono">
                                  ** FEES PAYMENT SLIP **
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold shrink-0 print:border print:border-slate-300">
                                  <GraduationCap className="h-5 w-5" />
                                </div>
                                <div>
                                  <h1 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-display">AL-QALAM SCIENCE ACADEMY</h1>
                                  <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono">Knowledge, Integrity & Piety</p>
                                  <p className="text-[8px] text-slate-400 font-mono mt-0.5">Gusau Campus, Zamfara State, Nigeria &bull; office@alqalam.edu</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="bg-slate-900 text-slate-100 text-[10px] font-mono tracking-wider px-2 py-1 rounded font-bold uppercase print:bg-transparent print:text-black print:border print:border-slate-850 shrink-0">
                                  PAYMENT RECEIPT
                                </span>
                                <p className="text-[8px] text-slate-400 font-mono mt-1">SERIAL: {receiptData.refCode}</p>
                              </div>
                            </div>
                          )}

                          {/* Student & Payment Metadata */}
                          {receiptType === 'Thermal80' ? (
                            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-350 pb-2.5">
                              <div className="flex justify-between"><span>STUDENT:</span><span className="font-bold text-right">{receiptData.studentName}</span></div>
                              <div className="flex justify-between"><span>ADM NO:</span><span className="font-bold font-mono text-right">{receiptData.admNo}</span></div>
                              <div className="flex justify-between"><span>CLASS:</span><span className="font-bold text-right">{receiptData.className}</span></div>
                              <div className="flex justify-between mt-1 text-[10px] text-slate-500 border-t border-dotted border-slate-200 pt-1">
                                <span>REF: {receiptData.refCode}</span>
                                <span>DATE: {receiptData.date}</span>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-500">
                                <span>SLIP CODE:</span>
                                <span className="font-mono font-bold text-teal-800 text-right">{receiptData.tellerCode}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-[11px] print:bg-transparent print:border-slate-300">
                              <div className="space-y-1">
                                <div>STUDENT: <strong className="text-slate-900">{receiptData.studentName}</strong></div>
                                <div>ADM NO: <strong className="text-slate-900 font-mono">{receiptData.admNo}</strong></div>
                                <div>CLASS: <strong className="text-slate-900">{receiptData.className}</strong></div>
                              </div>
                              <div className="space-y-1 text-right">
                                <div>REF NO: <span className="font-mono">{receiptData.refCode}</span></div>
                                <div>SLIP CODE: <span className="font-mono text-teal-700 font-bold">{receiptData.tellerCode}</span></div>
                                <div>DATE: <span className="text-slate-500 font-mono">{receiptData.date}</span></div>
                              </div>
                            </div>
                          )}

                          {/* Fees Itemized breakdown details table */}
                          <div className="space-y-1.5">
                            {receiptType !== 'Thermal80' && (
                              <h5 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-mono block">Statement Items Summary</h5>
                            )}
                            <div className={receiptType === 'Thermal80' ? '' : 'border border-slate-200 rounded-lg overflow-hidden'}>
                              <table className="w-full text-[10px]">
                                <thead>
                                  <tr className={`border-b text-slate-600 font-extrabold uppercase text-[9px] tracking-wider ${
                                    receiptType === 'Thermal80' 
                                      ? 'border-dashed border-slate-400 font-mono text-slate-800' 
                                      : 'bg-slate-50 border-slate-200 print:bg-transparent font-sans'
                                  }`}>
                                    <th className="p-1 px-2 text-left w-8">S/N</th>
                                    <th className="p-1 px-2 text-left">Item Detail</th>
                                    <th className="p-1 px-2 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className={`text-slate-800 ${
                                  receiptType === 'Thermal80' 
                                    ? 'divide-y divide-dashed divide-slate-200 font-mono text-[9px]' 
                                    : 'divide-y divide-slate-100 font-sans'
                                }`}>
                                  {receiptData.billingBreakdown.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} className="p-4 text-center text-slate-400 italic">
                                        No billing breakdown rows detected.
                                      </td>
                                    </tr>
                                  ) : (
                                    receiptData.billingBreakdown.map((item, index) => (
                                      <tr key={index} className="hover:bg-slate-50/30">
                                        <td className="p-1.5 px-2 text-left font-mono text-slate-500">{index + 1}</td>
                                        <td className="p-1.5 px-2 text-left font-medium text-slate-850">{item.item_description}</td>
                                        <td className="p-1.5 px-2 text-right font-mono font-semibold text-slate-700">{formatCurrency(item.amount)}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Calculations audit ledger */}
                          <div className={`space-y-1 pt-1.5 border-t ${receiptType === 'Thermal80' ? 'border-dashed border-slate-350' : 'border-transparent'}`}>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                              <span>Term Subtotal Due</span>
                              <span className="font-mono">{formatCurrency(receiptData.subtotal)}</span>
                            </div>
                            {receiptData.priorDebt > 0 && (
                              <div className="flex justify-between items-center text-[10px] text-rose-600 font-medium">
                                <span>Prior Debt Carryforward</span>
                                <span className="font-mono">+{formatCurrency(receiptData.priorDebt)}</span>
                              </div>
                            )}
                            <div className={`flex justify-between items-center text-slate-900 border-t pt-1 font-bold ${
                              receiptType === 'Thermal80' ? 'border-dotted border-slate-450 text-[11px]' : 'border-slate-200 text-[11px]'
                            }`}>
                              <span>Gross Term Liability</span>
                              <span className="font-mono">{formatCurrency(receiptData.totalLiability)}</span>
                            </div>
                            <div className={`flex justify-between items-center border-t border-dashed pt-1.5 pb-0.5 text-xs ${
                              receiptType === 'Thermal80' ? 'border-slate-350 mt-1' : 'border-slate-200'
                            }`}>
                              <span className="font-bold text-teal-850 text-teal-800 uppercase tracking-wide">AMOUNT RECEIVED</span>
                              <span className={`font-mono font-extrabold text-teal-700 ${
                                receiptType === 'Thermal80' 
                                  ? 'text-xs text-right' 
                                  : 'bg-teal-50 border border-teal-200/50 px-2 py-0.5 rounded text-sm print:bg-white print:border print:border-slate-400'
                              }`}>
                                {formatCurrency(receiptData.amountPaid)}
                              </span>
                            </div>
                            {receiptData.changeReturned > 0 && (
                              <div className="flex justify-between items-center text-[11px] font-bold text-amber-700 font-mono">
                                <span>Change Dispersed</span>
                                <span className="font-mono">{formatCurrency(receiptData.changeReturned)}</span>
                              </div>
                            )}
                            <div className={`flex justify-between items-center font-bold p-2.5 rounded-lg mt-1 border ${
                              receiptType === 'Thermal80'
                                ? 'bg-white text-black border-dashed border-slate-400 p-2 text-[10px] font-mono mt-2 flex justify-between'
                                : 'bg-slate-900 text-slate-100 text-[11px] border-slate-800 print:bg-white print:text-black print:border-slate-800'
                            }`}>
                              <span className="uppercase tracking-wider">NET OUTSTANDING DEBT</span>
                              <span className="font-mono text-xs">{formatCurrency(receiptData.outstandingAfter)}</span>
                            </div>
                          </div>

                          {/* Verification & Seals Section */}
                          <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${
                            receiptType === 'Thermal80' ? 'border-dashed border-slate-350' : 'border-slate-250 border-dashed'
                          }`}>
                            {/* Verification Badge */}
                            <div className="flex flex-col items-start justify-center">
                              {receiptData.outstandingAfter === 0 ? (
                                <div className={`border-4 border-double font-mono font-bold tracking-widest uppercase text-center leading-none rounded-lg select-none ${
                                  receiptType === 'Thermal80'
                                    ? 'rotate-0 border-black text-black text-[9px] p-1.5'
                                    : 'rotate-[-2deg] border-green-500/80 text-green-600/90 text-[11px] p-1.5'
                                }`}>
                                  [ RECEIVED - CLEARED ]
                                  <span className="block text-[8px] font-extrabold mt-1 tracking-normal">AL-QALAM CASHIER</span>
                                </div>
                              ) : (
                                <div className={`border-4 border-double font-mono font-bold tracking-widest uppercase text-center leading-none rounded-lg select-none ${
                                  receiptType === 'Thermal80'
                                    ? 'rotate-0 border-black text-black text-[9px] p-1.5'
                                    : 'rotate-[-1deg] border-amber-500/80 text-amber-600/90 text-[11px] p-1.5'
                                }`}>
                                  [ DEPOSIT RECEIVED ]
                                  <span className="block text-[8px] font-extrabold mt-1 tracking-normal">AL-QALAM CASHIER</span>
                                </div>
                              )}
                            </div>

                            {/* Autograph / Verification placeholder signature */}
                            <div className="space-y-4 text-right pr-2">
                              <div className="h-6 flex items-end justify-end">
                                <span className="font-mono text-[9px] text-slate-400 italic select-none">ALQALAM_APPROVED</span>
                              </div>
                              <div className="border-t border-slate-400 pt-1 text-[8px] text-slate-500 font-mono leading-none">
                                SYSTEM SECURE SIGN
                              </div>
                            </div>
                          </div>

                          {/* Print Actions Bar */}
                          <div className="receipt-actions no-print flex gap-2 pt-4 border-t border-slate-100 shrink-0">
                            <button
                              id="btn-print-voucher-act"
                              onClick={() => window.print()}
                              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-800 cursor-pointer shadow-xs"
                            >
                              <Printer className="h-4 w-4 text-teal-400 animate-bounce" />
                              Send to System Printer
                            </button>
                            <button
                              id="btn-close-receipt"
                              type="button"
                              onClick={() => setReceiptData(null)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 py-2.5 px-4 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Close Preview
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ACTIVE SHOP: BUYING SPECIFIC INVENTORY ASSETS */
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm font-sans">Academy Shop Store Shelf</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Allocate books or uniforms to students. In case of 0 stock, back-ordering logic kicks-in.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((p) => {
                    const isOutOfStock = p.stock_quantity === 0;

                    return (
                      <div
                        key={p.product_id}
                        className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-150 ${
                          isOutOfStock
                            ? 'border-amber-200 bg-amber-50/10'
                            : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-teal-500/30 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-slate-900 text-xs block leading-tight">{p.product_name}</span>
                            <span className="font-mono text-teal-700 text-xs font-bold leading-tight flex-shrink-0">{formatCurrency(p.price)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            {isOutOfStock ? (
                              <span className="bg-amber-50 text-amber-805 text-amber-800 border border-amber-200/60 text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0 text-amber-600" /> Backorder queue trigger
                              </span>
                            ) : (
                              <span className="bg-slate-105 bg-slate-100 text-slate-600 border border-slate-200/60 text-[9px] font-semibold px-2.5 py-0.5 rounded-full font-mono">
                                Stock: {p.stock_quantity} remaining
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          id={`btn-cashier-allocate-${p.product_id}`}
                          onClick={() => handleShopPurchase(p)}
                          className={`mt-3.5 w-full py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            isOutOfStock
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-100'
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" /> 
                          {isOutOfStock ? 'Request Backorder Piece' : 'Add Piece to Bill'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-12 text-center text-slate-400 space-y-3">
            <Compass className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No Student Roster Selected</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Please tap of any student on the left menu grid to inspect, process bank teller deposits, or purchase stock items.</p>
          </div>
        )}
      </div>
    </div>
  );
}
