
import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, User, CreditCard, Banknote, QrCode, RotateCcw, Save, ShoppingCart, ScanLine, Image as ImageIcon, CheckCircle, AlertCircle, X, Check, Lock, AlertTriangle, Package } from 'lucide-react';
import { useCartStore, useProductStore, useTransactionStore, useCustomerStore, useBranchStore } from '../store';
import { Button, Input, Badge } from '../components/UI';
import { Product, Transaction, UNIT_TYPES } from '../types';
import CameraScanner from '../components/CameraScanner';
import { parseBarcode, GS1ParsedData } from '../utils/gs1Parser';

const ProductCard: React.FC<{ product: Product, onAdd: (p: Product) => void, index: number }> = ({ product, onAdd, index }) => (
  <div 
    onClick={() => onAdd(product)}
    className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex flex-col h-full overflow-hidden border border-transparent hover:border-blue-500 animate-in fade-in zoom-in-95 fill-mode-backwards"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <div className="relative aspect-square bg-slate-50 w-full overflow-hidden">
       {product.image ? (
          <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
       ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
             <ImageIcon size={48} className="opacity-50" />
          </div>
       )}
       {/* Stock Badge */}
       <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-sm backdrop-blur-sm ${
           product.stockLevel < product.minStockLevel 
             ? 'bg-red-50/90 text-red-700 border-red-100' 
             : 'bg-yellow-50/90 text-yellow-800 border-yellow-200'
       }`}>
          {product.stockLevel} left
       </span>
    </div>
    
    <div className="p-3 flex flex-col flex-1">
      <h4 className="font-semibold text-slate-900 text-sm truncate leading-tight" title={product.nameEn}>{product.nameEn}</h4>
      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
         <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider text-slate-600">{product.category.substring(0, 3)}</span>
         <span className="truncate">{product.sku}</span>
      </div>
      
      <div className="mt-auto pt-3 flex items-center justify-between">
         <span className="font-bold text-red-600 text-lg">{product.price.toLocaleString()} Ks</span>
         <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100">
            <Plus size={16} />
         </button>
      </div>
    </div>
  </div>
);

const POS = () => {
  const { items, addItem, removeItem, updateQuantity, total, clearCart, customer, setCustomer } = useCartStore();
  const { products, addProduct } = useProductStore();
  const { customers } = useCustomerStore();
  const { addTransaction } = useTransactionStore();
  const { currentBranchId } = useBranchStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Advanced Scan Handling State
  const [notFoundScan, setNotFoundScan] = useState<GS1ParsedData | null>(null);
  const [managerRequest, setManagerRequest] = useState<{
    type: 'expired' | 'quick_add';
    data: any;
  } | null>(null);
  const [managerCreds, setManagerCreds] = useState({ id: '', password: '' });
  const [scannedInfo, setScannedInfo] = useState<{msg: string, type: 'success' | 'error' | 'warning'} | null>(null);

  const categories = ['All', 'Antibiotics', 'Analgesics', 'Vitamins', 'Supplements', 'Gastrointestinal', 'Diabetic'];

  // --- Logic ---

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = p.nameEn.toLowerCase().includes(lowerSearch) || 
                            p.nameMm.includes(searchTerm) ||
                            p.sku.toLowerCase().includes(lowerSearch) ||
                            (p.genericName && p.genericName.toLowerCase().includes(lowerSearch));
                            
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleManagerLogin = () => {
      // Simulate Manager Verification (Hardcoded for demo)
      if (managerCreds.id === 'admin' && managerCreds.password === '1234') {
          if (managerRequest?.type === 'expired') {
              // Proceed to add expired item with override
              const { product, scanData } = managerRequest.data;
              addItem(product, { 
                  transactionData: {
                      scanned_batch: scanData.batchNumber,
                      scanned_expiry: scanData.expiryDate,
                      scanned_serial: scanData.serialNumber,
                      scanned_at: new Date().toISOString(),
                      raw_barcode: scanData.rawData
                  },
                  warnings: ['EXPIRED'],
                  override: true
              });
              setScannedInfo({ msg: `Approved: ${product.nameEn} (Expired)`, type: 'warning' });
          } else if (managerRequest?.type === 'quick_add') {
              // Handled by Quick Add logic, authorization just unlocks ability
          }
          
          // Clear states
          setManagerRequest(null);
          setManagerCreds({ id: '', password: '' });
      } else {
          alert('Invalid Credentials');
      }
  };

  const processBarcode = (code: string) => {
       const gs1Data = parseBarcode(code);
       
       let product = null;
       
       // 1. Search DB
       if (gs1Data.gtin) {
           product = products.find(p => p.gtin === gs1Data.gtin);
       } 
       
       // Fallback search if GS1 parsing didn't find GTIN or product not found by GTIN
       if (!product) {
           // Try exact match on SKU or ID for linear barcodes
           product = products.find(p => p.sku === code || p.id === code);
           
           // If we found via linear match, we might treat it as simple scan (no batch/expiry)
           // unless the parser actually extracted some GS1 data but no GTIN (unlikely for valid GS1)
       }

       if (product) {
          // 2. Validate Expiry
          let isExpired = false;
          let isNearExpiry = false;
          
          if (gs1Data.expiryDate) {
              const today = new Date();
              const expiry = new Date(gs1Data.expiryDate);
              const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysLeft < 0) isExpired = true;
              else if (daysLeft < 30) isNearExpiry = true;
          }

          if (isExpired) {
              // 3. Manager Approval Required
              setManagerRequest({
                  type: 'expired',
                  data: { product, scanData: gs1Data }
              });
              return;
          }

          // 4. Add to Cart
          const warnings = [];
          if (isNearExpiry) warnings.push('NEAR_EXPIRY');

          addItem(product, {
              transactionData: {
                  scanned_batch: gs1Data.batchNumber || null,
                  scanned_expiry: gs1Data.expiryDate || null,
                  scanned_serial: gs1Data.serialNumber || null,
                  scanned_at: new Date().toISOString(),
                  raw_barcode: code
              },
              warnings: warnings.length > 0 ? warnings : undefined
          });

          setSearchTerm('');
          if (isNearExpiry) {
             setScannedInfo({ msg: `Added: ${product.nameEn} (Expires soon!)`, type: 'warning' });
          } else {
             setScannedInfo({ msg: `Added: ${product.nameEn}`, type: 'success' });
          }
          return true;

       } else {
          // 5. Not Found Handling
          setNotFoundScan(gs1Data);
          setScannedInfo({ msg: `Product not found: ${gs1Data.gtin || code}`, type: 'error' });
          return false;
       }
  };

  const handleQuickAdd = (formData: any) => {
      // Create temporary product
      const newProduct: Product = {
          id: `qp-${Date.now()}`,
          nameEn: formData.name,
          nameMm: formData.nameMm || formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          stockLevel: 100, // Dummy stock
          minStockLevel: 10,
          sku: notFoundScan?.gtin || notFoundScan?.rawData || `SKU-${Date.now()}`,
          gtin: notFoundScan?.gtin,
          unit: formData.unit,
          requiresPrescription: false,
          image: '',
          branchId: currentBranchId,
          batches: []
      };
      
      addProduct(newProduct);
      
      // Add to cart immediately
      addItem(newProduct, {
          transactionData: {
              scanned_batch: notFoundScan?.batchNumber || null,
              scanned_expiry: notFoundScan?.expiryDate || null,
              scanned_serial: notFoundScan?.serialNumber || null,
              scanned_at: new Date().toISOString(),
              raw_barcode: notFoundScan?.rawData || ''
          }
      });
      
      setNotFoundScan(null);
      setScannedInfo({ msg: `Quick Added: ${newProduct.nameEn}`, type: 'success' });
  };

  const handleScanInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm) {
       processBarcode(searchTerm);
       setSearchTerm('');
       // Clear info after 3s unless it requires modal action
       setTimeout(() => { if (!notFoundScan && !managerRequest) setScannedInfo(null) }, 3000);
    }
  };

  const handleCameraScan = (code: string) => {
      const success = processBarcode(code);
      if (success) {
          setIsScannerOpen(false); // Close scanner on success
      }
  };

  const handleCheckout = () => {
    const totalAmount = total();
    const newTransaction: Transaction = {
      id: `TRX-${Date.now()}`,
      type: 'INCOME',
      category: 'Sales',
      amount: totalAmount,
      date: new Date().toISOString().split('T')[0],
      description: `POS Sale - ${items.length} items`,
      paymentMethod: 'CASH',
      branchId: currentBranchId,
    };
    
    addTransaction(newTransaction);
    setPaymentModalOpen(false);
    clearCart();
    setSuccessMsg('Transaction Completed Successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
      {/* Success Toast */}
      {successMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
           <CheckCircle size={20} />
           <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Left Side - Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
        
        {/* Search & Filter Bar */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-4 shadow-sm z-10">
          <div className="flex gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                <input 
                  type="text" 
                  placeholder="Scan GS1 Barcode or Search..." 
                  className="w-full pl-12 pr-4 h-12 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleScanInput}
                  autoFocus
                />
             </div>
             <button 
               onClick={() => setIsScannerOpen(true)}
               className="bg-slate-800 text-white h-12 w-12 flex items-center justify-center rounded-xl hover:bg-slate-700 transition-colors shadow-sm"
               title="Open Camera Scanner"
             >
                <ScanLine size={20} />
             </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pt-1 px-1">
            {categories.map((cat, idx) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Scan Feedback */}
          {scannedInfo && (
             <div className={`p-3 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2 fade-in ${
                scannedInfo.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                scannedInfo.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                'bg-red-50 text-red-700 border border-red-100'
             }`}>
                {scannedInfo.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {scannedInfo.msg}
             </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} onAdd={() => addItem(product)} index={index} />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-12">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Search size={40} className="opacity-50" />
                   </div>
                   <p className="font-medium text-slate-600">No products found</p>
                   <p className="text-sm">Try searching for something else or clear filters</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-96 bg-white flex flex-col shrink-0 shadow-xl z-20 border-l border-slate-100">
         {/* Customer Selector */}
         <div className="p-5 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                 <ShoppingCart size={20} className="text-blue-600" /> Current Sale
               </h3>
               <button onClick={clearCart} className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium">
                  <RotateCcw size={14} /> Clear
               </button>
            </div>
            <div className="relative">
               <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <select 
                 className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none font-medium text-slate-700 transition-all hover:bg-white hover:border-slate-300"
                 value={customer?.id || ''}
                 onChange={(e) => {
                    const c = customers.find(cust => cust.id === e.target.value);
                    setCustomer(c || null);
                 }}
               >
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.tier})</option>
                  ))}
               </select>
            </div>
         </div>

         {/* Cart Items */}
         <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {items.map(item => (
              <div key={item.cartId} className={`flex gap-3 bg-white border rounded-xl p-3 shadow-sm hover:border-blue-200 transition-all group relative animate-in slide-in-from-right-4 fade-in duration-300 ${item.warning_flags?.includes('EXPIRED') ? 'border-red-300 bg-red-50/20' : 'border-slate-100'}`}>
                 <button 
                   onClick={() => removeItem(item.cartId)}
                   className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 border border-slate-100 shadow-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 z-10"
                 >
                    <X size={14} />
                 </button>
                 
                 <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.nameEn} /> : <ImageIcon size={20} className="text-slate-300" />}
                 </div>
                 
                 <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 truncate pr-4 leading-tight">{item.nameEn}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {item.transaction_data?.scanned_batch && (
                                <Badge variant="neutral" className="text-[10px] px-1 py-0">{item.transaction_data.scanned_batch}</Badge>
                            )}
                            {item.transaction_data?.scanned_expiry && (
                                <Badge variant={item.warning_flags?.includes('EXPIRED') ? 'danger' : 'info'} className="text-[10px] px-1 py-0">
                                    Exp: {item.transaction_data.scanned_expiry}
                                </Badge>
                            )}
                            {item.manager_override && (
                                <Badge variant="warning" className="text-[10px] px-1 py-0 flex gap-0.5"><Lock size={8}/> Override</Badge>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-end justify-between mt-2">
                       <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                          <button 
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-slate-600 transition-all active:scale-95"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-700">{item.quantity}</span>
                          <button 
                             onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                             className="w-6 h-6 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-slate-600 transition-all active:scale-95"
                          >
                            <Plus size={12} />
                          </button>
                       </div>
                       <p className="text-sm font-bold text-slate-900">
                          {(item.price * item.quantity).toLocaleString()}
                       </p>
                    </div>
                 </div>
              </div>
            ))}

            {items.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-60">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <ShoppingCart size={32} />
                  </div>
                  <p className="text-sm font-medium">Cart is empty</p>
               </div>
            )}
         </div>

         {/* Footer Totals */}
         <div className="p-5 bg-white border-t border-slate-100 space-y-4 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] z-20">
            <div className="space-y-2 text-sm">
               <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700">{total().toLocaleString()} Ks</span>
               </div>
               <div className="flex justify-between text-slate-500">
                  <span>Tax (0%)</span>
                  <span className="font-medium text-slate-700">0 Ks</span>
               </div>
               {customer && (
                  <div className="flex justify-between text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-lg">
                     <span className="flex items-center gap-1.5"><CheckCircle size={12}/> {customer.tier} Discount</span>
                     <span>-0 Ks</span>
                  </div>
               )}
               <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-dashed border-slate-200 mt-2">
                  <span>Total</span>
                  <span>{total().toLocaleString()} Ks</span>
               </div>
            </div>

            <Button 
               variant="primary" 
               className="w-full h-12 text-base font-bold shadow-xl shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 transform active:scale-[0.98] transition-all"
               disabled={items.length === 0}
               onClick={() => setPaymentModalOpen(true)}
            >
               Charge {total().toLocaleString()} Ks
            </Button>
         </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 scale-100">
               <h3 className="text-xl font-bold text-slate-800 mb-1">Confirm Payment</h3>
               <p className="text-sm text-slate-500 mb-6">Total Amount: <span className="font-bold text-slate-900">{total().toLocaleString()} Ks</span></p>
               
               <div className="grid grid-cols-2 gap-3 mb-6">
                  <button className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-blue-600 bg-blue-50/50 rounded-xl text-blue-700 transition-all">
                     <Banknote size={28} />
                     <span className="font-bold text-sm">Cash</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-transparent bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-all">
                     <QrCode size={28} />
                     <span className="font-medium text-sm">KBZ Pay</span>
                  </button>
               </div>

               <div className="space-y-4">
                  <Input label="Cash Received" placeholder="0" autoFocus className="text-lg font-mono" />
                  <div className="flex justify-between text-sm p-4 bg-slate-50 rounded-xl border border-slate-100">
                     <span className="text-slate-500 font-medium">Change Due</span>
                     <span className="font-bold text-slate-800 text-lg">0 Ks</span>
                  </div>
               </div>

               <div className="flex gap-3 mt-8">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" onClick={handleCheckout}>Complete Sale</Button>
               </div>
            </div>
         </div>
      )}

      {/* Manager Approval Modal */}
      {managerRequest && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border-t-4 border-red-500">
                  <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
                          <Lock size={28} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Manager Approval Required</h3>
                      <p className="text-sm text-slate-500 mt-1">
                          {managerRequest.type === 'expired' ? 'Authorized override for expired item.' : 'Authorized quick add for new product.'}
                      </p>
                  </div>
                  
                  <div className="space-y-3">
                      <Input 
                          placeholder="Manager ID" 
                          value={managerCreds.id}
                          onChange={(e: any) => setManagerCreds({...managerCreds, id: e.target.value})}
                      />
                      <Input 
                          type="password"
                          placeholder="Password" 
                          value={managerCreds.password}
                          onChange={(e: any) => setManagerCreds({...managerCreds, password: e.target.value})}
                      />
                  </div>

                  <div className="flex gap-3 mt-6">
                      <Button variant="outline" className="flex-1" onClick={() => setManagerRequest(null)}>Cancel</Button>
                      <Button variant="danger" className="flex-1" onClick={handleManagerLogin}>Authorize</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Product Not Found / Quick Add Modal */}
      {notFoundScan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border-t-4 border-amber-500">
                  <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600">
                          <AlertTriangle size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Product Not Found</h3>
                      <p className="font-mono text-sm bg-slate-100 py-1 px-2 rounded inline-block mt-2">{notFoundScan.gtin || notFoundScan.rawData}</p>
                      <p className="text-sm text-slate-500 mt-2">
                          This barcode is not in your inventory database. Would you like to quick-add it?
                      </p>
                  </div>

                  {/* Quick Add Form */}
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target as HTMLFormElement);
                      handleQuickAdd(Object.fromEntries(formData));
                  }} className="space-y-3">
                      <Input name="name" placeholder="Product Name (English)" required />
                      <Input name="nameMm" placeholder="Product Name (Myanmar)" className="font-mm" />
                      <div className="grid grid-cols-2 gap-3">
                          <Input name="price" type="number" placeholder="Price (Ks)" required />
                          <select name="unit" className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl">
                              {UNIT_TYPES.map(u => <option key={u.code} value={u.code}>{u.nameEn}</option>)}
                          </select>
                      </div>
                      <select name="category" className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl">
                          {categories.filter(c => c!=='All').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>

                      <div className="flex gap-3 mt-6">
                          <Button variant="outline" className="flex-1" type="button" onClick={() => setNotFoundScan(null)}>Cancel</Button>
                          <Button variant="primary" className="flex-1" type="submit">Quick Add</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
           <div className="p-4 flex justify-between items-center text-white bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
              <span className="font-bold text-lg">Scan GS1 Barcode</span>
              <button onClick={() => setIsScannerOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
           </div>
           <div className="flex-1 bg-black relative flex items-center justify-center">
               <CameraScanner onScan={handleCameraScan} className="w-full max-w-lg aspect-square" />
               <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none"></div>
               <div className="absolute w-64 h-64 border-2 border-white/50 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
               </div>
           </div>
           <div className="p-8 bg-slate-900 text-white text-center">
              <p className="text-sm font-medium opacity-80">Point camera at a barcode to scan</p>
              <div className="flex justify-center gap-2 mt-2">
                  <Badge variant="neutral" className="bg-white/10 border-0 text-white/70">GS1 DataMatrix</Badge>
                  <Badge variant="neutral" className="bg-white/10 border-0 text-white/70">EAN-13</Badge>
                  <Badge variant="neutral" className="bg-white/10 border-0 text-white/70">Code-128</Badge>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default POS;
