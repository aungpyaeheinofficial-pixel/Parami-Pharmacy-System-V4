
import React, { useState, useEffect } from 'react';
import { 
  Camera, ScanLine, X, Keyboard, QrCode, 
  AlertCircle, CheckCircle2, AlertTriangle, Box, 
  ListChecks, RotateCcw, ArrowRight, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from './UI';
import CameraScanner from './CameraScanner';
import { parseBarcode } from '../utils/gs1Parser';
import { useScannerStore, useProductStore } from '../store';
import { ScannedItem } from '../types';

// --- Verification Result Component ---
const VerificationResult = ({ 
    item, 
    onClose, 
    onNavigateToStock 
}: { 
    item: ScannedItem, 
    onClose: () => void, 
    onNavigateToStock: (item: ScannedItem) => void 
}) => {
    const { allProducts } = useProductStore();
    const existingProduct = allProducts.find(p => p.gtin === item.gtin || p.id === item.rawData);

    // Calculate expiry status
    const today = new Date();
    const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
    const daysToExpiry = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24)) : 999;
    const isExpired = daysToExpiry < 0;
    const isExpiringSoon = daysToExpiry < 90 && !isExpired;

    return (
        <Card className="max-w-2xl mx-auto border-t-4 border-t-blue-500 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ScanLine className="text-blue-600" />
                        Verification Result
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-mm">စစ်ဆေးခြင်း ရလဒ် (Verification Only)</p>
                </div>
                <div className="text-right">
                    <Badge variant="info">View Only</Badge>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                    {item.gtin ? (
                        <Badge variant="success" className="px-3 py-1 text-sm"><CheckCircle2 size={14} className="mr-1"/> Valid GTIN</Badge>
                    ) : (
                        <Badge variant="warning" className="px-3 py-1 text-sm"><AlertTriangle size={14} className="mr-1"/> No GTIN</Badge>
                    )}
                    
                    {expiry ? (
                        isExpired ? (
                            <Badge variant="danger" className="px-3 py-1 text-sm"><AlertCircle size={14} className="mr-1"/> Expired</Badge>
                        ) : isExpiringSoon ? (
                            <Badge variant="warning" className="px-3 py-1 text-sm"><AlertTriangle size={14} className="mr-1"/> Expiring Soon ({daysToExpiry}d)</Badge>
                        ) : (
                            <Badge variant="success" className="px-3 py-1 text-sm"><CheckCircle2 size={14} className="mr-1"/> Not Expired</Badge>
                        )
                    ) : (
                        <Badge variant="neutral" className="px-3 py-1 text-sm">No Expiry Date</Badge>
                    )}
                </div>

                {/* Scanned Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Product Name</p>
                        <h3 className="font-bold text-lg text-slate-900">{existingProduct?.nameEn || item.productName || 'Unknown Product'}</h3>
                        <p className="text-sm text-slate-600 font-mm">{existingProduct?.nameMm}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">GTIN / Code</p>
                        <p className="font-mono text-slate-800 font-medium">{item.gtin || item.rawData}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Batch Number</p>
                        <p className="font-mono text-slate-800 font-medium bg-white px-2 py-1 rounded border border-slate-200 inline-block">
                            {item.batchNumber || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Expiry Date</p>
                        <p className={`font-mono font-medium ${isExpired ? 'text-red-600' : 'text-slate-800'}`}>
                            {item.expiryDate || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Current Inventory Status (Read Only) */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2 mb-3">
                        <Package size={16} /> Current Inventory Status
                    </h4>
                    {existingProduct ? (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-blue-500 block text-xs">Stock Level</span>
                                <span className="font-bold text-blue-900 text-lg">{existingProduct.stockLevel}</span> 
                                <span className="text-xs text-blue-700 ml-1">{existingProduct.unit}</span>
                            </div>
                            <div>
                                <span className="text-blue-500 block text-xs">Location</span>
                                <span className="font-bold text-blue-900">{existingProduct.location || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-blue-500 block text-xs">Price</span>
                                <span className="font-bold text-blue-900">{existingProduct.price.toLocaleString()} Ks</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-blue-600 italic">Product not found in current inventory.</p>
                    )}
                </div>

                {/* Disclaimer */}
                <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <p>
                        <strong>Note:</strong> This page is for verification only. Inventory levels cannot be changed here. 
                        To add stock, please proceed to the Stock Entry page.
                    </p>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        <RotateCcw className="mr-2" size={16} /> Scan Again
                    </Button>
                    <Button 
                        variant="primary" 
                        className="flex-[2] shadow-lg shadow-blue-500/20" 
                        onClick={() => onNavigateToStock(item)}
                    >
                        <ArrowRight className="mr-2" size={18} /> Go to Stock Entry (Add Stock)
                    </Button>
                </div>
            </div>
        </Card>
    );
};

// --- Main Scanner Component ---
const PharmacyScanner = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scan'); 
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  
  // Stores
  const { activeScan, startScan, setActiveScan, scannedItems, clearHistory } = useScannerStore();

  // Handle Scan
  const handleRawScan = (raw: string) => {
      const result = parseBarcode(raw);
      startScan(result); // Sets activeScan
      setIsCameraActive(false); // Stop camera on success
  };

  // Navigate to Stock Entry
  const handleNavigateToStock = (item: ScannedItem) => {
      setActiveScan(null); // Clear modal
      navigate('/stock-entry', { state: { scannedData: item } });
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') { e.preventDefault(); setActiveTab('scan'); setIsCameraActive(true); }
      if (e.key === 'F4') { e.preventDefault(); navigate('/stock-entry'); }
      if (e.key === 'Escape') { e.preventDefault(); setActiveScan(null); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, setActiveScan]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative h-[calc(100vh-80px)] flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                Scanner Utility (Verification)
                <span className="text-base font-normal text-slate-400 font-mm ml-2">စစ်ဆေးရေး စက်ကိရိယာ</span>
            </h1>
            <p className="text-slate-500 text-sm">Verify products details, batch, and expiry. No stock modification.</p>
          </div>
          <div className="flex gap-2">
              <Button variant={activeTab === 'scan' ? 'primary' : 'outline'} onClick={() => setActiveTab('scan')}>
                  <ScanLine size={16} className="mr-2"/> Scan (F3)
              </Button>
              <Button variant={activeTab === 'history' ? 'primary' : 'outline'} onClick={() => setActiveTab('history')}>
                  <ListChecks size={16} className="mr-2"/> History
              </Button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
          
          {/* VERIFICATION MODAL OVERLAY */}
          {activeScan && (
              <div className="absolute inset-0 z-40 bg-slate-50/90 backdrop-blur-sm flex items-start justify-center pt-10 animate-in fade-in duration-200">
                  <div className="w-full">
                      <VerificationResult 
                          item={activeScan} 
                          onClose={() => setActiveScan(null)} 
                          onNavigateToStock={handleNavigateToStock} 
                      />
                  </div>
              </div>
          )}

          {/* SCANNING INTERFACE */}
          {activeTab === 'scan' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                 {/* Left: Camera */}
                 <Card className="flex flex-col overflow-hidden border-2 border-slate-200 h-full p-0 bg-black">
                     <div className="flex-1 relative flex items-center justify-center">
                         {isCameraActive ? (
                             <CameraScanner onScan={handleRawScan} className="w-full h-full" />
                         ) : (
                             <div className="text-center text-slate-500">
                                 <QrCode size={64} className="mx-auto mb-4 opacity-20" />
                                 <p className="font-bold text-slate-400">Camera Inactive</p>
                                 <p className="text-sm text-slate-500">Press Start or F3</p>
                             </div>
                         )}
                     </div>
                     <div className="p-4 bg-white border-t border-slate-200 text-center">
                         <Button 
                            variant={isCameraActive ? 'danger' : 'primary'} 
                            className="w-full h-12 text-lg shadow-lg"
                            onClick={() => setIsCameraActive(!isCameraActive)}
                         >
                            <Camera className="mr-2" /> {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                         </Button>
                     </div>
                 </Card>

                 {/* Right: Manual Input & Instructions */}
                 <div className="flex flex-col gap-6">
                     <Card title="Manual Verification">
                        <form onSubmit={(e) => { e.preventDefault(); if(manualInput) { handleRawScan(manualInput); setManualInput(''); } }}>
                            <div className="relative">
                                <Keyboard className="absolute left-4 top-3.5 text-slate-400" />
                                <input 
                                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-lg font-mono placeholder:text-slate-400 transition-all"
                                    placeholder="Scan or type barcode..."
                                    value={manualInput}
                                    onChange={e => setManualInput(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full mt-4 h-12" disabled={!manualInput}>Verify Product</Button>
                        </form>
                     </Card>

                     <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 flex-1">
                         <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                             <Box size={20} /> Verification Only
                         </h3>
                         <ul className="space-y-4 text-sm text-slate-600">
                             <li className="flex gap-3">
                                 <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                                 <span>Check if product GTIN is valid and authentic.</span>
                             </li>
                             <li className="flex gap-3">
                                 <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                                 <span>Verify Batch Number and Expiry Date.</span>
                             </li>
                             <li className="flex gap-3">
                                 <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                                 <span>View current stock location and price.</span>
                             </li>
                             <li className="flex gap-3 pt-4 border-t border-slate-200 text-amber-600 font-medium">
                                 <AlertTriangle className="shrink-0" size={18} />
                                 <span>Stock levels cannot be changed here. Use "Stock Entry" to add inventory.</span>
                             </li>
                         </ul>
                     </div>
                 </div>
             </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
              <Card title="Verification History" className="h-full flex flex-col" action={<Button variant="ghost" className="text-red-500" onClick={clearHistory}><RotateCcw size={14} className="mr-1"/> Clear</Button>}>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3">Product</th>
                                <th className="px-6 py-3">Code</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {scannedItems.map(i => (
                                <tr key={i.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-slate-500 text-xs">{new Date(i.timestamp).toLocaleTimeString()}</td>
                                    <td className="px-6 py-3 font-medium text-slate-800">{i.productName || 'Unknown'}</td>
                                    <td className="px-6 py-3 font-mono text-xs">{i.gtin || i.rawData}</td>
                                    <td className="px-6 py-3">
                                        <Badge variant="info">Verified</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </Card>
          )}
      </div>
    </div>
  );
};

export default PharmacyScanner;
