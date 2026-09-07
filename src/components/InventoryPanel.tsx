import React, { useState } from 'react';
import {
  Product,
  ProductCategory,
  StockAllocation,
  Student,
  Billing,
  SchoolClass
} from '../types';
import {
  Package,
  PackageX,
  AlertTriangle,
  RefreshCw,
  Plus,
  Truck,
  CheckCircle,
  TrendingDown,
  Sparkles,
  Layers,
  Search,
  ShoppingCart,
  Edit,
  Trash2
} from 'lucide-react';

interface InventoryPanelProps {
  products: Product[];
  categories: ProductCategory[];
  allocations: StockAllocation[];
  students: Student[];
  billings: Billing[];
  classes: SchoolClass[];
  onRestockProduct: (productId: number, qtyToAdd: number) => void;
  onDeliverAllocationBeforeStockCheck: (allocationId: number) => { success: boolean; message: string };
  onAddProduct: (productName: string, categoryId: number, price: number, initialQty: number) => void;
  onEditProduct: (productId: number, productName: string, categoryId: number, price: number, stockQty: number) => void;
  onDeleteProduct: (productId: number) => void;
  onAddCategory: (categoryName: string) => void;
  onEditCategory: (categoryId: number, categoryName: string) => void;
  onDeleteCategory: (categoryId: number) => void;
  formatCurrency: (amount: number) => string;
}

export default function InventoryPanel({
  products,
  categories,
  allocations,
  students,
  billings,
  classes,
  onRestockProduct,
  onDeliverAllocationBeforeStockCheck,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  formatCurrency
}: InventoryPanelProps) {
  const [restockProductIds, setRestockProductIds] = useState<{ [key: number]: string }>({});
  const [activeTab, setActiveTab] = useState<'shelf' | 'queue'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [queueSearchQuery, setQueueSearchQuery] = useState('');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Modal & Form States
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<number | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Add Product Form fields
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdQty, setNewProdQty] = useState('');

  // Edit Product Form fields
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdQty, setEditProdQty] = useState('');

  // Category Form fields
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Stats Counters
  const pendingAllocations = allocations.filter((a) => a.allocation_status === 'Pending Supply');
  const deliveredAllocationsCount = allocations.filter((a) => a.allocation_status === 'Delivered').length;
  const outOfStockItems = products.filter((p) => p.stock_quantity === 0);

  // Filtered Queue
  const filteredPendingAllocations = pendingAllocations.filter((alloc) => {
    const student = students.find((s) => s.student_id === alloc.student_id);
    const product = products.find((p) => p.product_id === alloc.product_id);
    
    if (selectedClassId !== 'all') {
      if (!student || student.current_class_id !== Number(selectedClassId)) {
        return false;
      }
    }
    
    if (queueSearchQuery.trim()) {
      const query = queueSearchQuery.toLowerCase();
      const studentName = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : '';
      const admissionNo = student ? student.admission_no.toLowerCase() : '';
      const productName = product ? product.product_name.toLowerCase() : '';
      
      return studentName.includes(query) || admissionNo.includes(query) || productName.includes(query);
    }
    
    return true;
  });

  const handleRestock = (productId: number) => {
    const qtyStr = restockProductIds[productId];
    if (!qtyStr) return;
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid stock quantity.');
      return;
    }

    onRestockProduct(productId, qty);
    setRestockProductIds((prev) => ({ ...prev, [productId]: '' }));
    
    const prodName = products.find((p) => p.product_id === productId)?.product_name;
    triggerAlert('success', `Successfully added +${qty} items to ${prodName} stock!`);
  };

  const handleDeliver = (alloc: StockAllocation) => {
    const result = onDeliverAllocationBeforeStockCheck(alloc.allocation_id);
    if (result.success) {
      triggerAlert('success', result.message);
    } else {
      triggerAlert('danger', result.message);
    }
  };

  const triggerAlert = (type: 'success' | 'danger', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4500);
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdCategory || !newProdPrice || !newProdQty) {
      alert('Please fill out all fields correctly.');
      return;
    }
    const priceVal = parseFloat(newProdPrice);
    const qtyVal = parseInt(newProdQty);
    if (isNaN(priceVal) || priceVal < 0 || isNaN(qtyVal) || qtyVal < 0) {
      alert('Price and Quantity must be valid positive numbers.');
      return;
    }

    onAddProduct(newProdName.trim(), Number(newProdCategory), priceVal, qtyVal);
    triggerAlert('success', `Added new product "${newProdName.trim()}" directly into warehouse inventory shelf!`);
    
    setNewProdName('');
    setNewProdCategory('');
    setNewProdPrice('');
    setNewProdQty('');
    setShowAddProductModal(false);
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditProductModal) return;
    if (!editProdName.trim() || !editProdCategory || !editProdPrice || !editProdQty) {
      alert('Please fill out all fields correctly.');
      return;
    }
    const priceVal = parseFloat(editProdPrice);
    const qtyVal = parseInt(editProdQty);
    if (isNaN(priceVal) || priceVal < 0 || isNaN(qtyVal) || qtyVal < 0) {
      alert('Price and Quantity must be valid positive numbers.');
      return;
    }

    onEditProduct(showEditProductModal.product_id, editProdName.trim(), Number(editProdCategory), priceVal, qtyVal);
    triggerAlert('success', `Successfully updated item "${editProdName.trim()}"!`);
    
    setShowEditProductModal(null);
  };

  const handleDeleteProductClick = (productId: number) => {
    const p = products.find(p => p.product_id === productId);
    if (!p) return;
    setProductToDelete(p);
  };

  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;
    onDeleteProduct(productToDelete.product_id);
    triggerAlert('success', `Deleted product "${productToDelete.product_name}".`);
    setProductToDelete(null);
  };

  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert('Please enter a category name.');
      return;
    }
    onAddCategory(newCatName.trim());
    triggerAlert('success', `Category "${newCatName.trim()}" successfully created.`);
    setNewCatName('');
  };

  const handleEditCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editingCatName.trim()) {
      alert('Please enter a category name.');
      return;
    }
    onEditCategory(editingCategory.category_id, editingCatName.trim());
    triggerAlert('success', `Renamed category to "${editingCatName.trim()}".`);
    setEditingCategory(null);
    setEditingCatName('');
  };

  const handleDeleteCategoryClick = (categoryId: number) => {
    setCategoryToDeleteId(categoryId);
  };

  const handleConfirmDeleteCategory = (categoryId: number) => {
    const cat = categories.find(c => c.category_id === categoryId);
    onDeleteCategory(categoryId);
    triggerAlert('success', `Deleted category "${cat?.category_name || 'Category'}".`);
    setCategoryToDeleteId(null);
    if (editingCategory?.category_id === categoryId) {
      setEditingCategory(null);
      setEditingCatName('');
    }
  };

  const filteredShelf = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {alertMsg && (
        <div id="inventory-toast-banner" className={`text-white p-4 rounded-xl text-xs font-bold font-sans shadow-md flex items-center gap-2.5 animate-in fade-in slide-in-from-top duration-300 ${
          alertMsg.type === 'success' ? 'bg-teal-600' : 'bg-rose-600'
        }`}>
          <AlertTriangle className="h-5 w-5 text-white" />
          <span className="font-mono uppercase tracking-wider">{alertMsg.text}</span>
        </div>
      )}

      {/* Visual State Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-mono">Store Queue Lock</span>
            <span className="text-2xl font-bold font-mono text-teal-400 block mt-1">{pendingAllocations.length} Orders</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting back-ordered stock delivery.</span>
          </div>
          <div className="h-10 w-10 bg-teal-500/10 flex items-center justify-center text-teal-400 rounded-lg">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-mono">Complete Supplies</span>
            <span className="text-2xl font-bold font-mono text-slate-100 block mt-1">{deliveredAllocationsCount} items</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Decremented from active shelf.</span>
          </div>
          <div className="h-10 w-10 bg-teal-500/10 flex items-center justify-center text-teal-400 rounded-lg">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-mono font-bold">Out of Stock Assets</span>
            <span className="text-2xl font-bold font-mono text-rose-450 text-rose-400 block mt-1">{outOfStockItems.length} items</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Shorthand backorders alert!</span>
          </div>
          <div className="h-10 w-10 bg-rose-500/10 flex items-center justify-center text-rose-400 rounded-lg">
            <PackageX className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-bold text-slate-900 text-xs font-mono uppercase tracking-widest text-teal-600">Inventory & Central Supply</h3>
            <div className="bg-slate-300 h-4 w-[1px] hidden sm:block"></div>
            <div className="flex bg-slate-200/50 p-1 rounded-lg text-xs font-sans">
              <button
                id="btn-tab-queue"
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  activeTab === 'queue'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Queue ({pendingAllocations.length})
              </button>
              <button
                id="btn-tab-shelf"
                onClick={() => setActiveTab('shelf')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  activeTab === 'shelf'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-505 text-slate-500 hover:text-slate-800'
                }`}
              >
                Shelf Logs ({products.length})
              </button>
            </div>
          </div>

          {activeTab === 'queue' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search student or item..."
                  value={queueSearchQuery}
                  onChange={(e) => setQueueSearchQuery(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-slate-55 bg-slate-50 text-slate-800 font-sans focus:bg-white focus:outline focus:outline-teal-500"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>

              <select
                id="select-queue-class"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-800 font-sans font-medium focus:bg-white focus:outline focus:outline-teal-500"
              >
                <option value="all">All Student Classes</option>
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    Class: {c.class_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'shelf' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search shelf assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-slate-50 text-slate-800 font-sans focus:bg-white focus:outline focus:outline-teal-500"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>

              <button
                id="btn-add-category-modal"
                onClick={() => setShowCategoryModal(true)}
                className="bg-slate-100 hover:bg-slate-205 h-8 hover:bg-slate-250 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 text-slate-700 font-sans font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
              >
                <Layers className="h-4 w-4 text-slate-500" /> Categories
              </button>

              <button
                id="btn-add-product-modal"
                onClick={() => {
                  setNewProdCategory(categories[0]?.category_id?.toString() || '');
                  setShowAddProductModal(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 h-8 text-white font-sans font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="h-4 w-4 text-teal-400" /> Register Item
              </button>
            </div>
          )}
        </div>

        {activeTab === 'queue' ? (
          /* SECTION 1: PENDING SUPPLY BACKORDER QUEUE */
          <div className="overflow-x-auto">
            {pendingAllocations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Truck className="h-9 w-9 text-slate-350 mx-auto" />
                <h4 className="font-bold text-slate-900 text-xs font-mono uppercase tracking-widest text-teal-600">Store Supply Queue Cleared</h4>
                <p className="text-xs text-slate-500">No active students are waiting for textbook or wearable asset delivery locks right now.</p>
              </div>
            ) : filteredPendingAllocations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Search className="h-9 w-9 text-slate-350 mx-auto" />
                <h4 className="font-bold text-slate-900 text-xs font-mono uppercase tracking-widest text-teal-600">No Matching Queue Entry</h4>
                <p className="text-xs text-slate-500">Try adjusting your category search term or class selector filters.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[9px] tracking-widest uppercase font-bold font-mono">
                    <th className="p-4">Student & Class</th>
                    <th className="p-4">Product Sourced</th>
                    <th className="p-4">Offline Billing Ref</th>
                    <th className="p-4">Queue Since</th>
                    <th className="p-4">Inventory Stock Status</th>
                    <th className="p-4 text-center">Fulfill Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredPendingAllocations.map((alloc) => {
                    const student = students.find((s) => s.student_id === alloc.student_id);
                    const product = products.find((p) => p.product_id === alloc.product_id);
                    const billing = billings.find((b) => b.billing_id === alloc.billing_id);
                    
                    const isAllocOutOfStock = product ? product.stock_quantity === 0 : true;

                    return (
                      <tr key={alloc.allocation_id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          {student ? (
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">{student.first_name} {student.last_name}</span>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono">ID: {student.admission_no}</span>
                                <span className="text-slate-300 text-[10px] select-none">•</span>
                                <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-100/45 rounded px-1.5 py-0.5 inline-block font-sans font-bold">
                                  {classes.find((c) => c.class_id === student.current_class_id)?.class_name || 'No Class'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-bold">Unknown Student</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{product ? product.product_name : 'Deleted Asset'}</span>
                          <span className="text-[10px] text-slate-400 block">Unit Cost: {product ? formatCurrency(product.price) : 'N/A'}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-700">{billing ? billing.offline_ref_code : 'N/A'}</td>
                        <td className="p-4 text-slate-500 font-medium font-mono text-[10px]">{new Date(alloc.date_allocated).toLocaleDateString()}</td>
                        <td className="p-4">
                          {isAllocOutOfStock ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200/60 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 font-mono w-max">
                              <AlertTriangle className="h-3 w-3 flex-shrink-0" /> Restock Req. (Stock: 0)
                            </span>
                          ) : (
                            <span className="bg-teal-50 text-teal-800 border border-teal-200/40 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 font-mono w-max">
                              <Package className="h-3 w-3 flex-shrink-0" /> Sourced Ok (Stock: {product?.stock_quantity})
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            id={`btn-deliver-alloc-${alloc.allocation_id}`}
                            onClick={() => handleDeliver(alloc)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 mx-auto ${
                              isAllocOutOfStock
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-dashed border border-slate-200'
                                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm font-bold uppercase tracking-wider'
                            }`}
                          >
                            <Truck className="h-3.5 w-3.5" /> Deliver Item
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* SECTION 2: PHYSICAL INVENTORY LIST SHELF WITH RESTOCK FORM */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[9px] tracking-widest uppercase font-bold font-mono">
                  <th className="p-4">Store Item & Category</th>
                  <th className="p-4">Unit List Price</th>
                  <th className="p-4">Current Warehouse Stock</th>
                  <th className="p-4">Log status Alert</th>
                  <th className="p-4">Physical Restock / Increment</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredShelf.map((p) => {
                  const cat = categories.find((c) => c.category_id === p.category_id);
                  let stockAlert = (
                    <span className="bg-teal-50 text-teal-800 border border-teal-200 text-[9px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-mono uppercase tracking-wide">
                      Sufficient Stock
                    </span>
                  );

                  if (p.stock_quantity === 0) {
                    stockAlert = (
                      <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[9px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-mono uppercase tracking-wide">
                        Out of Stock
                      </span>
                    );
                  } else if (p.stock_quantity <= 2) {
                    stockAlert = (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-mono uppercase tracking-wide">
                        Low stock reorder
                      </span>
                    );
                  }

                  return (
                    <tr key={p.product_id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block text-xs">{p.product_name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Category: {cat ? cat.category_name : 'Unassigned'}</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-700">{formatCurrency(p.price)}</td>
                      <td className="p-4 font-mono font-bold text-slate-800 text-[13px]">{p.stock_quantity} items</td>
                      <td className="p-4">{stockAlert}</td>
                      <td className="p-4">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="+ Qty"
                            value={restockProductIds[p.product_id] || ''}
                            onChange={(e) =>
                              setRestockProductIds((prev) => ({
                                  ...prev,
                                  [p.product_id]: e.target.value
                              }))
                            }
                            className="bg-slate-50 border border-slate-200 rounded p-1 text-[11px] w-14 font-semibold text-center text-slate-800 focus:bg-white focus:outline-teal-500"
                          />
                          <button
                            id={`btn-restock-${p.product_id}`}
                            onClick={() => handleRestock(p.product_id)}
                            className="bg-slate-905 hover:bg-slate-850 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 uppercase tracking-wider h-7"
                          >
                            <Plus className="h-3 w-3" /> Restock
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right text-slate-600">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-edit-product-${p.product_id}`}
                            onClick={() => {
                              setShowEditProductModal(p);
                              setEditProdName(p.product_name);
                              setEditProdCategory(p.category_id.toString());
                              setEditProdPrice(p.price.toString());
                              setEditProdQty(p.stock_quantity.toString());
                            }}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200/60 text-slate-700 p-1.5 rounded transition"
                            title="Edit Item Details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`btn-delete-product-${p.product_id}`}
                            onClick={() => handleDeleteProductClick(p.product_id)}
                            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 p-1.5 rounded transition"
                            title="Delete Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REGISTER NEW PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-teal-600" /> Register Store Item
              </h4>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-600 font-mono text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProductSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Coat (L)"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-sans focus:bg-white focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-sans focus:bg-white focus:outline-teal-500"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                    {categories.length === 0 && (
                      <option value="">No categories created</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">List Price (₦)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 6500"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:bg-white focus:outline-teal-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Initial Warehouse Qty</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 15"
                  value={newProdQty}
                  onChange={(e) => setNewProdQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:bg-white focus:outline-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-650 bg-teal-600 hover:bg-teal-505 hover:bg-teal-500 text-white font-bold rounded-lg transition shadow-xs"
                  disabled={categories.length === 0}
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SINGLE PRODUCT MODAL */}
      {showEditProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                <Edit className="h-4 w-4 text-teal-600" /> Edit Store Item
              </h4>
              <button
                onClick={() => setShowEditProductModal(null)}
                className="text-slate-400 hover:text-slate-600 font-mono text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditProductSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Coat (L)"
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-sans focus:bg-white focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Category</label>
                  <select
                    value={editProdCategory}
                    onChange={(e) => setEditProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-sans focus:bg-white focus:outline-teal-500"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                    <option value="0">Unassigned</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">List Price (₦)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 6500"
                    value={editProdPrice}
                    onChange={(e) => setEditProdPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:bg-white focus:outline-teal-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Current Stock Level</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 15"
                  value={editProdQty}
                  onChange={(e) => setEditProdQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:bg-white focus:outline-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowEditProductModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-650 bg-teal-600 hover:bg-teal-505 hover:bg-teal-500 text-white font-bold rounded-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES OVERLAY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-teal-600" /> Store Categories Manager
              </h4>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setEditingCatName('');
                }}
                className="text-slate-400 hover:text-slate-600 font-mono text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-6">
              
              {/* Category creation / edit flow */}
              {editingCategory ? (
                <form onSubmit={handleEditCategorySubmit} className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono font-extrabold uppercase text-amber-805">
                    <span className="text-amber-800">Editing Category</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setEditingCatName('');
                      }}
                      className="text-slate-400 hover:text-slate-600 normal-case"
                    >
                      Cancel Edit
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Category Name"
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-sans focus:outline-teal-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition shrink-0"
                    >
                      Save Rename
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateCategorySubmit} className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600 font-extrabold block">Create New Category</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Science Equipment"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-sans focus:outline-teal-500 font-medium"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shrink-0"
                    >
                      <Plus className="h-3 w-3" /> Create Category
                    </button>
                  </div>
                </form>
              )}

              {/* Listed categories with Delete and Rename triggers */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">Existing Categories list ({categories.length})</span>
                <div className="border border-slate-150 rounded-lg divide-y divide-slate-100 max-h-[220px] overflow-y-auto bg-white">
                  {categories.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      No categories created yet. Create one above to get started.
                    </div>
                  ) : (
                    categories.map((c) => {
                      const count = products.filter(p => p.category_id === c.category_id).length;
                      const isConfirmingDelete = categoryToDeleteId === c.category_id;

                      if (isConfirmingDelete) {
                        return (
                          <div key={c.category_id} className="p-3 bg-rose-50/90 border border-rose-200 rounded-lg text-xs space-y-2 animate-in fade-in duration-150">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold text-rose-950 block text-xs">
                                  Delete category "{c.category_name}"?
                                </span>
                                <span className="text-[10px] text-rose-700 block mt-0.5 font-sans">
                                  {count > 0
                                    ? `${count} item${count === 1 ? '' : 's'} on store shelves will be set to "Unassigned".`
                                    : 'This category will be permanently removed.'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                id={`btn-cancel-delete-category-${c.category_id}`}
                                onClick={() => setCategoryToDeleteId(null)}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                id={`btn-confirm-delete-category-${c.category_id}`}
                                onClick={() => handleConfirmDeleteCategory(c.category_id)}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" /> Yes, Delete
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={c.category_id} className="p-3 flex justify-between items-center hover:bg-slate-50/40 text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{c.category_name}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              {count} associated items on store shelves
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              id={`btn-edit-category-${c.category_id}`}
                              onClick={() => {
                                setCategoryToDeleteId(null);
                                setEditingCategory(c);
                                setEditingCatName(c.category_name);
                              }}
                              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 hover:text-slate-950 transition cursor-pointer"
                              title="Rename Category"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              id={`btn-delete-category-${c.category_id}`}
                              onClick={() => handleDeleteCategoryClick(c.category_id)}
                              className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-850 transition cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    setEditingCatName('');
                    setCategoryToDeleteId(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition"
                >
                  Close Manager
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PRODUCT MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 rounded-full bg-rose-50 border border-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm font-display">Delete Store Item?</h4>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">"{productToDelete.product_name}"</strong> from the inventory shelf? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-product"
                onClick={handleConfirmDeleteProduct}
                className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
