import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, User, CreditCard, Banknote, QrCode, RotateCcw, Save, ShoppingCart, ScanLine, Image as ImageIcon, CheckCircle, AlertCircle, X, Check } from 'lucide-react';
import { useCartStore, useProductStore, useTransactionStore, useCustomerStore, useBranchStore } from '../store';
import { Button, Input, Badge } from '../components/UI';
import { Product, Transaction } from '../types';
import CameraScanner from '../components/CameraScanner';

// --- GS1 Parser Utilities ---

const convertYYMMDDtoDate = (yymmdd: string) => {
  const yy = parseInt(yymmdd.substring(0, 2));
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  // Assume 20xx for years 00-50, 19xx for 51-99
  const yyyy = yy <= 50 ? 2000 + yy : 1900 + yy;
  return `${yyyy}-${mm}-${dd}`;
}

const parseGS1Barcode = (scannedData: string) => {
  const result = {
    gtin: null as string | null,
    expiryDate: null as string | null,
    batchNumber: null as string | null,
    serialNumber: null as string | null
  };
  
  let data = scannedData.replace(/^\]d2/, '').replace(/^\]C1/, '');
  
  if (data.includes('(')) {
      const gtinMatch = data.match(/\(01\)(\d{14})|01(\d{14})/);
      if (gtinMatch) result.gtin = gtinMatch[1] || gtinMatch[2];
      
      const expiryMatch = data.match(/\(17\)(\d{6})|17(\d{6})/);
      if (expiryMatch) result.expiryDate = convertYYMMDDtoDate(expiryMatch[1] || expiryMatch[2]);
      
      const batchMatch = data.match(/\(10\)([^\(]*)|10([^\\x1D]*)/);
      if (batchMatch) result.batchNumber = (batchMatch[1] || batchMatch[2]).trim();
      
      const serialMatch = data.match(/\(21\)([^\(]*)|21([^\\x1D]*)/);
      if (serialMatch) result.serialNumber = (serialMatch[1] || serialMatch[2]).trim();
  } else {
      const gtinMatch = data.match(/01(\d{14})/);
      if (gtinMatch) result.gtin = gtinMatch[1];
      
      const expiryMatch = data.match(/17(\d{6})/);
      if (expiryMatch) result.expiryDate = convertYYMMDDtoDate(expiryMatch[1]);
      
      const batchMatch = data.match(/10([^\x1D]*)/);
      if (batchMatch) result.batchNumber = batchMatch[1].trim();
      
      const serialMatch = data.match(/21([^\x1D]*)/);
      if (serialMatch) result.serialNumber = serialMatch[1].trim();
  }

  return result;
};


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
  const { products } = useProductStore();
  const { customers } = useCustomerStore();
  const { addTransaction } = useTransactionStore();
  const { currentBranchId } = useBranchStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Scanned Feedback State
  const [scannedInfo, setScannedInfo] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const categories = ['All', 'Antibiotics', 'Analgesics', 'Vitamins', 'Supplements', 'Gastrointestinal', 'Diabetic'];

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

  const processBarcode = (code: string) => {
       const gs1Data = parseGS1Barcode(code);
       
       if (gs1Data.gtin) {
           const product = products.find(p => p.gtin === gs1Data.gtin);
           if (product) {
              let selectedBatchId = undefined;
              let batchMsg = "";

              if (gs1Data.batchNumber) {
                 const batch = product.batches.find(b => b.batchNumber === gs1Data.batchNumber);
                 if (batch) {
                    selectedBatchId = batch.id;
                    batchMsg = ` - Batch: ${batch.batchNumber}`;
                 } else {
                    batchMsg = ` - New Batch: ${gs1Data.batchNumber}`;
                 }
              }

              addItem(product, selectedBatchId);
              setSearchTerm('');
              setScannedInfo({ 
                 msg: `Scanned: ${product.nameEn}${batchMsg}`, 
                 type: 'success' 
              });
              return true;
           } else {
              setScannedInfo({ msg: `Product with GTIN ${gs1Data.gtin} not found`, type: 'error' });
              return false;
           }
       } else {
          // Fallback search or add if exact match
          // Look for SKU, ID, or GTIN (for simple barcodes)
          const exactMatch = products.find(p => p.sku === code || p.id === code || p.gtin === code);
          if (exactMatch) {
             addItem(exactMatch);
             setSearchTerm('');
             setScannedInfo({ msg: `Added: ${exactMatch.nameEn}`, type: 'success' });
             return true;
          } else {
             setScannedInfo({ msg: `Unknown barcode: ${code}`, type: 'error' });
             return false;
          }
       }
  };

  const handleScanInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm) {
       processBarcode(searchTerm);
       setSearchTerm('');
       setTimeout(() => setScannedInfo(null), 3000);
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
    // Clear success message after 3 seconds
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
                  placeholder="Search products or scan barcode..." 
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
                scannedInfo.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
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
              <div key={item.cartId} className="flex gap-3 bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:border-blue-200 transition-all group relative animate-in slide-in-from-right-4 fade-in duration-300">
                 <button 
                   onClick={() => removeItem(item.cartId)}
                   className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 border border-slate-100 shadow-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                 >
                    <X size={14} />
                 </button>
                 
                 <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.nameEn} /> : <ImageIcon size={20} className="text-slate-300" />}
                 </div>
                 
                 <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 truncate pr-4 leading-tight">{item.nameEn}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">{item.price.toLocaleString()} Ks</span>
                            {item.selectedBatchId && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded border border-slate-200">Batch set</span>}
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

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
           <div className="p-4 flex justify-between items-center text-white bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
              <span className="font-bold text-lg">Scan Barcode</span>
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
           </div>
        </div>
      )}
    </div>
  );
};

export default POS;