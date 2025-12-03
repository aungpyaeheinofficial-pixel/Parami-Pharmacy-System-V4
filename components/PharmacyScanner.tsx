import React, { useState, useCallback, useRef } from 'react';
import { 
  Camera, ScanLine, X, History, Keyboard, QrCode, 
  AlertCircle, CheckCircle2, Copy, AlertTriangle, Box, 
  Calendar, Hash, Printer, FileDown, Syringe, Thermometer,
  ShieldAlert, Activity, ArrowRight, Settings, Upload, FileImage
} from 'lucide-react';
import { Card, Button, Input, Badge } from './UI';
import CameraScanner from './CameraScanner';
import { parseBarcode, GS1ParsedData } from '../utils/gs1Parser';
import { useScannerStore, useProductStore } from '../store';

// Hook for Hardware Scanners (HID Mode)
const useScannerListener = (onScan: (barcode: string) => void) => {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      const now = Date.now();
      if (now - lastKeyTime.current > 50) buffer.current = '';
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
          if (buffer.current.length >= 3) {
              e.preventDefault(); 
              onScan(buffer.current);
          }
          buffer.current = '';
      } else if (e.key.length === 1) { 
          buffer.current += e.key;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);
};

const PharmacyScanner = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentScan, setCurrentScan] = useState<GS1ParsedData | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [fileError, setFileError] = useState('');
  
  // Stores
  const { history, addToHistory, clearHistory } = useScannerStore();
  const { products } = useProductStore();

  const handleScan = useCallback((raw: string) => {
    const result = parseBarcode(raw);
    
    // Check for duplicate in recent history (within last 5 mins) to warn
    const isRecentDuplicate = history.some(h => 
        h.gtin === result.gtin && 
        h.serialNumber === result.serialNumber && 
        Date.now() - h.timestamp < 300000
    );

    if (isRecentDuplicate) {
        result.warnings.push("Duplicate Scan detected within last 5 minutes");
    }

    const timestampedResult = { 
        ...result, 
        timestamp: Date.now(), 
        id: Math.random().toString(36).substr(2, 9) 
    };
    
    setCurrentScan(result);
    addToHistory(timestampedResult);
    
    // Auto-switch to results
    setActiveTab('scan');
  }, [addToHistory, history]);

  useScannerListener(handleScan);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScan(manualInput);
      setManualInput('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!(window as any).Html5Qrcode) {
          setFileError("Scanner library not loaded.");
          return;
      }

      try {
          const Html5Qrcode = (window as any).Html5Qrcode;
          const html5QrCode = new Html5Qrcode("reader-hidden");
          const result = await html5QrCode.scanFile(file, true);
          handleScan(result);
          setFileError('');
      } catch (err) {
          console.error(err);
          setFileError("Could not decode barcode from image. Ensure high contrast.");
      }
  };

  const handlePrintLabel = () => {
      window.print();
  };

  const exportHistory = () => {
      const csvContent = "data:text/csv;charset=utf-8," 
          + "Timestamp,Type,GTIN,Batch,Expiry,Serial,Status,RawData\n"
          + history.map(h => `${new Date(h.timestamp).toISOString()},${h.type},${h.gtin || ''},${h.batchNumber || ''},${h.expiryDate || ''},${h.serialNumber || ''},${h.success ? 'Valid' : 'Invalid'},"${h.rawData}"`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "scan_audit_log.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Logic: Mock Recall Database & Product Lookup
  const matchedProduct = currentScan?.gtin ? products.find(p => p.gtin === currentScan.gtin) : null;
  const isRecall = currentScan?.batchNumber === 'BADBATCH123'; // Mock Check
  const isColdChain = matchedProduct?.category === 'Antibiotics' || currentScan?.gtin?.endsWith('99'); 

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Hidden div for file scanning */}
      <div id="reader-hidden" className="hidden"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-2.5 rounded-xl shadow-lg shadow-red-500/20"><ScanLine size={24} /></div>
             RX Verify & Scan
          </h1>
          <p className="text-slate-500 text-sm mt-1 ml-1">GS1 DataMatrix Processor for Pharmacy Compliance</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'bg-slate-100 ring-2 ring-slate-200' : ''}>
             <History size={16} className="mr-2"/> History Log
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'bg-slate-100 ring-2 ring-slate-200' : ''}>
             <Settings size={16} className="mr-2"/> Config
          </Button>
        </div>
      </div>

      {activeTab === 'history' ? (
          <Card title="Audit Trail & Scan Log">
             <div className="mb-4 flex flex-wrap gap-4 justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                    <Input placeholder="Filter by GTIN/Batch..." className="max-w-xs bg-white" />
                    <span className="text-xs text-slate-500 font-medium">{history.length} Records</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearHistory} className="text-red-600 hover:bg-red-50 hover:text-red-700"><X size={14} className="mr-1"/> Clear</Button>
                    <Button variant="primary" size="sm" onClick={exportHistory}><FileDown size={14} className="mr-1"/> Export CSV</Button>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                         <th className="px-4 py-3">Timestamp</th>
                         <th className="px-4 py-3">Symbology</th>
                         <th className="px-4 py-3">Product (GTIN)</th>
                         <th className="px-4 py-3">Batch / Expiry</th>
                         <th className="px-4 py-3">Status</th>
                         <th className="px-4 py-3 text-right">View</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {history.map(row => (
                         <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                               {new Date(row.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-3"><Badge variant="neutral">{row.type}</Badge></td>
                            <td className="px-4 py-3 font-mono text-slate-700">{row.gtin || '-'}</td>
                            <td className="px-4 py-3">
                               <div className="flex flex-col text-xs">
                                  <span className="font-medium text-slate-700">{row.batchNumber}</span>
                                  <span className={row.isExpired ? 'text-red-600 font-bold' : 'text-slate-500'}>{row.expiryDate}</span>
                               </div>
                            </td>
                            <td className="px-4 py-3">
                               {row.success ? <Badge variant="success">Valid</Badge> : <Badge variant="danger">Invalid</Badge>}
                            </td>
                            <td className="px-4 py-3 text-right">
                               <Button variant="ghost" size="sm" onClick={() => { setCurrentScan(row); setActiveTab('scan'); }}>
                                  <ArrowRight size={14} />
                               </Button>
                            </td>
                         </tr>
                      ))}
                      {history.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">Audit log is empty.</td></tr>}
                   </tbody>
                </table>
             </div>
          </Card>
      ) : activeTab === 'settings' ? (
          <Card title="Scanner Configuration">
             <div className="max-w-2xl space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 flex items-start gap-3">
                    <Activity className="shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="font-bold">Hardware Scanner Ready</p>
                        <p className="text-blue-600 mt-1">The application is listening for HID keyboard input. You can use any USB or Bluetooth barcode scanner directly on this screen.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-slate-800">Parsing Rules</h4>
                    <label className="flex items-center gap-3 p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-parami rounded focus:ring-parami" />
                    <div>
                        <p className="font-medium text-slate-800">Strict GS1 Validation</p>
                        <p className="text-xs text-slate-500">Require FNC1 separators for variable length Application Identifiers.</p>
                    </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-parami rounded focus:ring-parami" />
                    <div>
                        <p className="font-medium text-slate-800">Auto-Print Labels</p>
                        <p className="text-xs text-slate-500">Automatically trigger print dialog upon successful scan.</p>
                    </div>
                    </label>
                </div>
             </div>
          </Card>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel: Input Methods */}
            <div className="lg:col-span-4 space-y-6 print:hidden">
                <Card className="overflow-hidden">
                    <div className={`aspect-square bg-black relative ${isCameraActive ? 'ring-4 ring-red-500/20' : ''}`}>
                        {isCameraActive ? (
                            <CameraScanner onScan={handleScan} className="w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100">
                                <QrCode size={64} className="opacity-20 mb-4" />
                                <p className="font-medium text-slate-400">Camera Inactive</p>
                                <p className="text-xs text-slate-400">Click below to start scanning</p>
                            </div>
                        )}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                             <button 
                                onClick={() => setIsCameraActive(!isCameraActive)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95 ${
                                    isCameraActive ? "bg-red-600 text-white" : "bg-white text-slate-800 hover:bg-slate-50"
                                }`}
                             >
                                <Camera size={20} />
                                {isCameraActive ? "Stop Camera" : "Start Camera"}
                             </button>
                        </div>
                    </div>
                </Card>

                <Card title="Alternative Input">
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Manual Entry</label>
                            <div className="relative">
                               <Keyboard className="absolute left-3 top-3 text-slate-400" size={18} />
                               <textarea
                                   value={manualInput}
                                   onChange={(e) => setManualInput(e.target.value)}
                                   placeholder="(01)0885...(17)251231..."
                                   className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-sm h-24 resize-none transition-all"
                               />
                            </div>
                            <Button type="submit" variant="primary" className="w-full mt-2">Process String</Button>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Upload Image</label>
                             <div className="relative group">
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 group-hover:border-red-400 group-hover:bg-red-50 transition-all">
                                    <Upload size={24} className="mb-2" />
                                    <span className="text-xs font-medium">Click to upload barcode image</span>
                                </div>
                             </div>
                             {fileError && <p className="text-xs text-red-500 mt-2">{fileError}</p>}
                        </div>
                    </form>
                </Card>
            </div>

            {/* Right Panel: Results */}
            <div className="lg:col-span-8">
                {!currentScan ? (
                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                        <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                             <ScanLine size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600">Ready to Scan</h3>
                        <p className="max-w-xs text-center mt-2 text-slate-500">Use the camera, upload an image, or use a handheld scanner to process GS1 DataMatrix codes.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        
                        {/* Alerts */}
                        <div className="space-y-3">
                            {isRecall && (
                                <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg flex items-center gap-4 animate-pulse">
                                    <ShieldAlert size={32} className="shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-lg">PRODUCT RECALL ALERT</h3>
                                        <p className="text-red-100 text-sm">Batch <strong>{currentScan.batchNumber}</strong> has been flagged for recall. Do not dispense.</p>
                                    </div>
                                </div>
                            )}
                            
                            {currentScan.isExpired && (
                                <div className="bg-amber-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-4">
                                    <AlertTriangle size={32} className="shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-lg">EXPIRED PRODUCT</h3>
                                        <p className="text-amber-100 text-sm">Expired on <strong>{currentScan.expiryDate}</strong>. Quarantine immediately.</p>
                                    </div>
                                </div>
                            )}

                            {isColdChain && (
                                <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg flex items-center gap-4">
                                    <Thermometer size={32} className="shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-lg">COLD CHAIN REQUIRED</h3>
                                        <p className="text-blue-100 text-sm">Verify temperature monitor status before stocking.</p>
                                    </div>
                                </div>
                            )}
                            
                            {currentScan.warnings.map((w, i) => (
                                <div key={i} className="bg-orange-50 text-orange-800 p-3 rounded-xl border border-orange-200 flex items-center gap-3 text-sm font-medium">
                                    <AlertCircle size={16} /> {w}
                                </div>
                            ))}
                        </div>

                        {/* Main Product Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-black">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex gap-4">
                                    {matchedProduct && matchedProduct.image && (
                                        <img src={matchedProduct.image} className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm" alt="Product" />
                                    )}
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <Badge variant={currentScan.success ? 'success' : 'danger'}>{currentScan.type}</Badge>
                                            {currentScan.ndc && <Badge variant="info">NDC: {currentScan.ndc}</Badge>}
                                            {matchedProduct && <Badge variant="success">Verified Item</Badge>}
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{currentScan.gtin || 'Unknown GTIN'}</h2>
                                        <p className="text-slate-600 font-medium mt-1">
                                            {matchedProduct ? matchedProduct.nameEn : 'Unknown Product (Not in DB)'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right print:hidden">
                                     <Button variant="outline" size="sm" onClick={handlePrintLabel}>
                                        <Printer size={16} className="mr-2" /> Print Label
                                     </Button>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Batch Info */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 group relative">
                                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                                        <Box size={16} /> 
                                        <span className="text-xs font-bold uppercase tracking-wider">Batch Information</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm"><span className="text-slate-500">Lot:</span> <span className="font-mono font-bold text-slate-800">{currentScan.batchNumber || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-slate-500">Expiry:</span> <span className={`font-mono font-bold ${currentScan.isExpired ? 'text-red-600' : 'text-slate-800'}`}>{currentScan.expiryDate || 'N/A'}</span></p>
                                        {currentScan.productionDate && <p className="text-sm"><span className="text-slate-500">Mfg:</span> <span className="font-mono text-slate-800">{currentScan.productionDate}</span></p>}
                                    </div>
                                </div>

                                {/* Serial / Regulatory */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                     <div className="flex items-center gap-2 text-slate-500 mb-2">
                                        <Hash size={16} /> 
                                        <span className="text-xs font-bold uppercase tracking-wider">Serialization</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm"><span className="text-slate-500">SN:</span> <span className="font-mono font-bold text-slate-800">{currentScan.serialNumber || 'N/A'}</span></p>
                                        <p className="text-sm"><span className="text-slate-500">Type:</span> <span className="text-slate-800">{currentScan.type}</span></p>
                                        {currentScan.netWeight && <p className="text-sm"><span className="text-slate-500">Weight:</span> <span className="text-slate-800">{currentScan.netWeight}</span></p>}
                                    </div>
                                </div>

                                {/* Raw Data */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 md:col-span-2 lg:col-span-1">
                                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                                        <FileImage size={16} /> 
                                        <span className="text-xs font-bold uppercase tracking-wider">Raw Data</span>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-200 h-24 overflow-y-auto">
                                        <p className="font-mono text-[10px] text-slate-500 break-all">{currentScan.rawData}</p>
                                    </div>
                                    <button 
                                        className="mt-2 text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                                        onClick={() => navigator.clipboard.writeText(currentScan.rawData)}
                                    >
                                        <Copy size={12} /> Copy Raw String
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
      )}
    </div>
  );
};

export default PharmacyScanner;