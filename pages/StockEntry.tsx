import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Package, Plus, Save, X, Search, Calendar, MapPin, 
  DollarSign, Truck, ScanLine, Camera, CheckCircle2, AlertTriangle, ChevronDown
} from 'lucide-react';
import { Card, Button, Input, Badge } from '../components/UI';
import CameraScanner from '../components/CameraScanner';
import { useProductStore, useSupplierStore, useAuthStore } from '../store';
import { UNIT_TYPES, ScannedItem, Product } from '../types';
import { parseBarcode } from '../utils/gs1Parser';

const StockEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillData = location.state?.scannedData as ScannedItem | undefined;

  // Stores
  const { allProducts, incrementStock, addProduct } = useProductStore();
  const { suppliers } = useSupplierStore();
  const { user } = useAuthStore();

  // State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form Data
  const [formData, setFormData] = useState({
    gtin: '',
    productName: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    unit: 'STRIP',
    location: '',
    costPrice: '',
    sellingPrice: '',
    supplierId: '',
    invoiceNo: '',
    notes: ''
  });

  const qtyRef = useRef<HTMLInputElement>(null);

  // Initialize with prefill data if available
  useEffect(() => {
    if (prefillData) {
      populateForm(prefillData);
    }
  }, [prefillData]);

  const populateForm = (data: ScannedItem) => {
      // Find existing product to auto-fill details
      const existingProduct = allProducts.find(p => p.gtin === data.gtin || p.id === data.rawData);
      
      setFormData(prev => ({
          ...prev,
          gtin: data.gtin || data.rawData || '',
          productName: existingProduct?.nameEn || data.productName || '',
          batchNumber: data.batchNumber || '',
          expiryDate: data.expiryDate || '',
          unit: existingProduct?.unit || 'STRIP',
          location: existingProduct?.location || '',
          sellingPrice: existingProduct?.price.toString() || '',
          // Reset qty for new entry
          quantity: ''
      }));

      // Focus quantity field after population
      setTimeout(() => qtyRef.current?.focus(), 100);
  };

  const handleScan = (raw: string) => {
      const result = parseBarcode(raw);
      // Convert GS1ParsedData to partial ScannedItem for population
      const scannedItem: Partial<ScannedItem> = {
          gtin: result.gtin,
          rawData: result.rawData,
          batchNumber: result.batchNumber,
          expiryDate: result.expiryDate,
      };
      
      populateForm(scannedItem as ScannedItem);
      setIsScannerOpen(false);
  };

  const handleProductSearch = (term: string) => {
      setSearchTerm(term);
      // Simple lookup logic (could be a dropdown in real app)
      const found = allProducts.find(p => p.sku === term || p.nameEn.toLowerCase().includes(term.toLowerCase()));
      if (found) {
          populateForm({ 
              gtin: found.gtin, 
              rawData: found.id, 
              productName: found.nameEn 
          } as ScannedItem);
      }
  };

  const handleSave = (createAnother: boolean = false) => {
      if (!formData.productName || !formData.quantity || !formData.unit) {
          alert("Please fill in Product Name, Quantity, and Unit.");
          return;
      }

      // Logic to update inventory
      // 1. Find product ID or create new placeholder if not exists (simplified here)
      const product = allProducts.find(p => p.gtin === formData.gtin || p.nameEn === formData.productName);
      
      if (product) {
          incrementStock(
              product.id,
              formData.batchNumber,
              parseInt(formData.quantity),
              formData.unit,
              formData.location,
              formData.expiryDate,
              Number(formData.costPrice)
          );
      } else {
         // Create new basic product record if it doesn't exist
         // In a real app, this might require a full "Add Product" flow
         addProduct({
             id: `p-${Date.now()}`,
             nameEn: formData.productName,
             nameMm: formData.productName, // Placeholder
             gtin: formData.gtin,
             sku: formData.gtin || `SKU-${Date.now()}`,
             category: 'Uncategorized',
             price: Number(formData.sellingPrice) || 0,
             stockLevel: parseInt(formData.quantity),
             unit: formData.unit,
             minStockLevel: 10,
             requiresPrescription: false,
             branchId: user?.branchId || 'b1',
             location: formData.location,
             image: '',
             batches: [{
                 id: `b-${Date.now()}`,
                 batchNumber: formData.batchNumber || 'DEFAULT',
                 expiryDate: formData.expiryDate || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
                 quantity: parseInt(formData.quantity),
                 costPrice: Number(formData.costPrice) || 0
             }]
         });
      }

      setSuccessMsg(`Successfully added ${formData.quantity} ${formData.unit} of ${formData.productName}`);
      setTimeout(() => setSuccessMsg(''), 3000);

      if (createAnother) {
          // Reset form but keep some context like supplier
          setFormData(prev => ({
              ...prev,
              gtin: '',
              productName: '',
              batchNumber: '',
              expiryDate: '',
              quantity: '',
              costPrice: '',
              sellingPrice: ''
          }));
          setSearchTerm('');
      } else {
          navigate('/inventory');
      }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') { e.preventDefault(); setIsScannerOpen(true); }
      if (e.key === 'F2') { e.preventDefault(); document.getElementById('productSearch')?.focus(); }
      if (e.key === 'F10') { e.preventDefault(); handleSave(false); }
      if (e.key === 'F11') { e.preventDefault(); handleSave(true); }
      if (e.key === 'Escape') { e.preventDefault(); setIsScannerOpen(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]); // Re-bind on form change to capture latest state

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
       <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                Stock Entry
                <span className="text-base font-normal text-slate-400 font-mm ml-2">ပစ္စည်း ထည့်သွင်းရန်</span>
            </h1>
            <p className="text-slate-500 text-sm">Add new inventory items via scanner or manual entry.</p>
          </div>
          <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
                  <ScanLine size={16} className="mr-2"/> Scan Barcode (F3)
              </Button>
          </div>
       </div>

       {successMsg && (
          <div className="bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={20} />
              <span className="font-medium">{successMsg}</span>
          </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Column: Product Search & Details */}
           <div className="lg:col-span-2 space-y-6">
               {/* Step 1 & 2: Identification */}
               <Card title="1. Product Identification">
                   <div className="space-y-4">
                       <div className="flex gap-2">
                           <div className="relative flex-1">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                               <input 
                                   id="productSearch"
                                   className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                   placeholder="Search Product Name or SKU (F2)..."
                                   value={searchTerm}
                                   onChange={e => handleProductSearch(e.target.value)}
                               />
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <Input 
                               label="Product Name" 
                               value={formData.productName} 
                               onChange={(e: any) => setFormData({...formData, productName: e.target.value})}
                               required
                               placeholder="e.g. Paracetamol 500mg"
                           />
                           <Input 
                               label="GTIN / Barcode" 
                               value={formData.gtin} 
                               onChange={(e: any) => setFormData({...formData, gtin: e.target.value})}
                               placeholder="Scanned code..."
                               className="font-mono"
                           />
                       </div>
                   </div>
               </Card>

               {/* Step 3: Batch & Expiry */}
               <Card title="2. Batch & Expiry">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Input 
                           label="Batch Number" 
                           value={formData.batchNumber}
                           onChange={(e: any) => setFormData({...formData, batchNumber: e.target.value})}
                           placeholder="Enter Batch No."
                       />
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiry Date</label>
                           <div className="relative">
                               <input 
                                   type="date"
                                   className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                                   value={formData.expiryDate}
                                   onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                               />
                               <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                           </div>
                       </div>
                   </div>
               </Card>

               {/* Step 4: Quantity & Unit */}
               <Card className="border-l-4 border-l-blue-500 shadow-md">
                   <div className="flex items-center justify-between mb-4">
                       <h3 className="font-bold text-slate-800 text-lg">3. Quantity & Unit <span className="text-red-500">*</span></h3>
                   </div>
                   <div className="flex gap-4 items-start">
                       <div className="flex-1">
                           <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
                           <input 
                               ref={qtyRef}
                               type="number"
                               min="1"
                               className="w-full text-2xl font-bold p-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center text-slate-900 placeholder:text-slate-300"
                               value={formData.quantity}
                               onChange={e => setFormData({...formData, quantity: e.target.value})}
                               placeholder="0"
                           />
                       </div>
                       <div className="flex-1">
                           <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit Type</label>
                           <div className="relative">
                               <select 
                                   className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl appearance-none font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                                   value={formData.unit}
                                   onChange={e => setFormData({...formData, unit: e.target.value})}
                               >
                                   {UNIT_TYPES.map(u => (
                                       <option key={u.code} value={u.code}>{u.nameMm} ({u.nameEn})</option>
                                   ))}
                               </select>
                               <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                           </div>
                       </div>
                   </div>
               </Card>
           </div>

           {/* Right Column: Additional Info */}
           <div className="space-y-6">
               <Card title="4. Location & Pricing">
                   <div className="space-y-4">
                       <Input 
                           label="Storage Location" 
                           value={formData.location}
                           onChange={(e: any) => setFormData({...formData, location: e.target.value})}
                           placeholder="e.g. Shelf A-12"
                           icon={MapPin}
                       />
                       <div className="grid grid-cols-2 gap-4">
                           <Input 
                               label="Cost Price" 
                               type="number"
                               value={formData.costPrice}
                               onChange={(e: any) => setFormData({...formData, costPrice: e.target.value})}
                               placeholder="0"
                           />
                           <Input 
                               label="Selling Price" 
                               type="number"
                               value={formData.sellingPrice}
                               onChange={(e: any) => setFormData({...formData, sellingPrice: e.target.value})}
                               placeholder="0"
                           />
                       </div>
                       {formData.costPrice && formData.sellingPrice && (
                           <div className="text-xs text-right text-slate-500">
                               Markup: <span className="font-bold text-emerald-600">
                                   {Math.round(((Number(formData.sellingPrice) - Number(formData.costPrice)) / Number(formData.costPrice)) * 100)}%
                               </span>
                           </div>
                       )}
                   </div>
               </Card>

               <Card title="5. Supplier Info">
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1.5">Supplier</label>
                           <select 
                               className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                               value={formData.supplierId}
                               onChange={e => setFormData({...formData, supplierId: e.target.value})}
                           >
                               <option value="">-- Select Supplier --</option>
                               {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                       </div>
                       <Input 
                           label="Invoice No."
                           value={formData.invoiceNo}
                           onChange={(e: any) => setFormData({...formData, invoiceNo: e.target.value})}
                           placeholder="INV-..."
                       />
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                           <textarea 
                               rows={3}
                               className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                               value={formData.notes}
                               onChange={e => setFormData({...formData, notes: e.target.value})}
                           />
                       </div>
                   </div>
               </Card>
           </div>
       </div>

       {/* Footer Actions */}
       <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] z-10 md:pl-[280px]">
           <div className="max-w-5xl mx-auto flex justify-between items-center">
                <Button variant="outline" onClick={() => navigate('/inventory')}>
                    Cancel (ESC)
                </Button>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => handleSave(true)}>
                        <Plus size={18} className="mr-2"/> Save & New (F11)
                    </Button>
                    <Button variant="primary" onClick={() => handleSave(false)} className="px-8 shadow-lg shadow-blue-500/20">
                        <Save size={18} className="mr-2"/> Save & Close (F10)
                    </Button>
                </div>
           </div>
       </div>

       {/* Scanner Modal */}
       {isScannerOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
           <div className="p-4 flex justify-between items-center text-white bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
              <span className="font-bold text-lg">Scan Barcode to Fill Form</span>
              <button onClick={() => setIsScannerOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
           </div>
           <div className="flex-1 bg-black relative flex items-center justify-center">
               <CameraScanner onScan={handleScan} className="w-full max-w-lg aspect-square" />
           </div>
        </div>
      )}
    </div>
  );
};

export default StockEntry;