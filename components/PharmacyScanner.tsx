import React, { useState, useCallback, useRef } from 'react';
import { 
  Camera, ScanLine, X, History, Keyboard, QrCode, 
  AlertCircle, CheckCircle2, Copy, AlertTriangle, Box, 
  Calendar, Hash, Printer, FileDown, Syringe, Thermometer,
  ShieldAlert, Activity, ArrowRight, Settings
} from 'lucide-react';
import { Card, Button, Input, Badge, Tabs } from './UI';
import CameraScanner from './CameraScanner';
import { parseBarcode, GS1ParsedData } from '../utils/gs1Parser';

// Re-implementing hook locally to ensure no missing exports
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
  const [history, setHistory] = useState<(GS1ParsedData & { timestamp: number, id: string })[]>([]);
  const [currentScan, setCurrentScan] = useState<GS1ParsedData | null>(null);
  const [manualInput, setManualInput] = useState('');

  // Mock Recall Database
  const checkRecalls = (gtin?: string, batch?: string) => {
      if (!gtin) return false;
      // Mock Check: recall specific dummy batch
      if (batch === 'BADBATCH123') return true;
      return false;
  };

  const handleScan = useCallback((raw: string) => {
    const result = parseBarcode(raw);
    const timestampedResult = { 
        ...result, 
        timestamp: Date.now(), 
        id: Math.random().toString(36).substr(2, 9) 
    };
    
    setCurrentScan(result);
    setHistory(prev => [timestampedResult, ...prev]);
    
    // Auto-switch to results tab on scan
    setActiveTab('scan');
  }, []);

  useScannerListener(handleScan);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScan(manualInput);
      setManualInput('');
    }
  };

  const handlePrintLabel = () => {
      window.print();
  };

  const exportHistory = () => {
      const csvContent = "data:text/csv;charset=utf-8," 
          + "Timestamp,Type,GTIN,Batch,Expiry,Serial,Status\n"
          + history.map(h => `${new Date(h.timestamp).toISOString()},${h.type},${h.gtin || ''},${h.batchNumber || ''},${h.expiryDate || ''},${h.serialNumber || ''},${h.success ? 'Valid' : 'Invalid'}`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "scan_history.csv");
      document.body.appendChild(link);
      link.click();
  };

  // Derived State for Current Scan
  const isRecall = checkRecalls(currentScan?.gtin, currentScan?.batchNumber);
  const isColdChain = currentScan?.gtin?.endsWith('99'); // Mock logic for cold chain

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <div className="bg-parami text-white p-2 rounded-lg"><ScanLine size={24} /></div>
             RX Verify & Scan
          </h1>
          <p className="text-slate-500 text-sm mt-1">GS1 DataMatrix Processor for Pharmacy Compliance</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'bg-slate-100' : ''}>
             <History size={16} className="mr-2"/> History
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'bg-slate-100' : ''}>
             <Settings size={16} className="mr-2"/> Config
          </Button>
        </div>
      </div>

      {activeTab === 'history' ? (
          <Card title="Scan Log">
             <div className="mb-4 flex justify-between items-center">
                <Input placeholder="Filter history..." className="max-w-xs" />
                <Button variant="outline" onClick={exportHistory}><FileDown size={16} className="mr-2"/> Export CSV</Button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                         <th className="px-4 py-3">Time</th>
                         <th className="px-4 py-3">Type</th>
                         <th className="px-4 py-3">Product (GTIN)</th>
                         <th className="px-4 py-3">Batch / Expiry</th>
                         <th className="px-4 py-3">Status</th>
                         <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {history.map(row => (
                         <tr key={row.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                               {new Date(row.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-3"><Badge variant="neutral">{row.type}</Badge></td>
                            <td className="px-4 py-3 font-mono">{row.gtin || '-'}</td>
                            <td className="px-4 py-3">
                               <div className="flex flex-col text-xs">
                                  <span>{row.batchNumber}</span>
                                  <span className={row.isExpired ? 'text-red-600 font-bold' : 'text-slate-500'}>{row.expiryDate}</span>
                               </div>
                            </td>
                            <td className="px-4 py-3">
                               {row.success ? <Badge variant="success">Valid</Badge> : <Badge variant="danger">Error</Badge>}
                            </td>
                            <td className="px-4 py-3 text-right">
                               <Button variant="ghost" size="sm" onClick={() => { setCurrentScan(row); setActiveTab('scan'); }}>View</Button>
                            </td>
                         </tr>
                      ))}
                      {history.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No scans recorded yet.</td></tr>}
                   </tbody>
                </table>
             </div>
          </Card>
      ) : activeTab === 'settings' ? (
          <Card title="Scanner Configuration">
             <p className="text-slate-500 mb-4">Configure input methods and validation rules.</p>
             <div className="space-y-4 max-w-lg">
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                   <input type="checkbox" defaultChecked className="w-5 h-5 text-parami rounded" />
                   <div>
                      <p className="font-medium">Enable Hardware Keyboard Listener</p>
                      <p className="text-xs text-slate-400">Listens for USB/Bluetooth scanner keystrokes</p>
                   </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                   <input type="checkbox" defaultChecked className="w-5 h-5 text-parami rounded" />
                   <div>
                      <p className="font-medium">Validate FNC1 Group Separators</p>
                      <p className="text-xs text-slate-400">Strict mode for GS1 DataMatrix parsing</p>
                   </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                   <input type="checkbox" className="w-5 h-5 text-parami rounded" />
                   <div>
                      <p className="font-medium">Auto-Print Labels on Scan</p>
                      <p className="text-xs text-slate-400">Send to default printer immediately upon valid scan</p>
                   </div>
                </label>
             </div>
          </Card>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel: Inputs */}
            <div className="lg:col-span-4 space-y-6 print:hidden">
                <Card>
                    <div className={`aspect-square rounded-xl bg-slate-900 overflow-hidden relative border-4 ${isCameraActive ? 'border-parami' : 'border-transparent'}`}>
                        {isCameraActive ? (
                            <CameraScanner onScan={handleScan} className="w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100">
                                <QrCode size={64} className="opacity-20 mb-4" />
                                <p className="font-medium">Camera Inactive</p>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                             <Button 
                                variant={isCameraActive ? "danger" : "primary"} 
                                onClick={() => setIsCameraActive(!isCameraActive)}
                                className="shadow-lg"
                             >
                                <Camera size={18} className="mr-2" />
                                {isCameraActive ? "Stop Camera" : "Start Camera"}
                             </Button>
                        </div>
                    </div>
                </Card>

                <Card title="Manual Entry">
                    <form onSubmit={handleManualSubmit} className="space-y-3">
                        <div className="relative">
                           <Keyboard className="absolute left-3 top-3 text-slate-400" size={18} />
                           <textarea
                             value={manualInput}
                             onChange={(e) => setManualInput(e.target.value)}
                             placeholder="Scan or paste raw GS1 string..."
                             className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-parami/20 font-mono text-sm h-24 resize-none"
                           />
                        </div>
                        <Button type="submit" variant="outline" className="w-full">Process Input</Button>
                    </form>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Test Data</p>
                        <div className="flex flex-col gap-2">
                           <button onClick={() => handleScan('01003614145678901725123110BATCH001')} className="text-xs text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded border border-slate-200 transition-colors">
                              Standard: (01)...(17)...(10)...
                           </button>
                           <button onClick={() => handleScan('01003614145678901722010110OLD-BATCH')} className="text-xs text-left px-3 py-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded border border-slate-200 transition-colors">
                              Expired: (01)...(17)...(10)...
                           </button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Right Panel: Results */}
            <div className="lg:col-span-8">
                {!currentScan ? (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <ScanLine size={64} className="mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-slate-600">Ready to Scan</h3>
                        <p>Waiting for data from camera or keyboard...</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        
                        {/* Status Banners */}
                        {isRecall && (
                            <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg flex items-center gap-4 animate-pulse">
                                <ShieldAlert size={32} />
                                <div>
                                    <h3 className="font-bold text-lg">PRODUCT RECALL ALERT</h3>
                                    <p className="text-red-100 text-sm">This batch has been flagged by FDA/Regulatory for recall. Do not dispense.</p>
                                </div>
                            </div>
                        )}
                        
                        {currentScan.isExpired && (
                             <div className="bg-amber-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-4">
                                <AlertTriangle size={32} />
                                <div>
                                    <h3 className="font-bold text-lg">EXPIRED PRODUCT</h3>
                                    <p className="text-amber-100 text-sm">Product expired on {currentScan.expiryDate}. Quarantine immediately.</p>
                                </div>
                            </div>
                        )}

                        {isColdChain && (
                             <div className="bg-blue-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-4">
                                <Thermometer size={32} />
                                <div>
                                    <h3 className="font-bold text-lg">COLD CHAIN REQUIRED</h3>
                                    <p className="text-blue-100 text-sm">Verify temperature monitor status before stocking.</p>
                                </div>
                            </div>
                        )}

                        {/* Main Product Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant={currentScan.success ? 'success' : 'danger'}>{currentScan.type}</Badge>
                                        {currentScan.ndc && <Badge variant="info">NDC: {currentScan.ndc}</Badge>}
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{currentScan.gtin || 'Unknown GTIN'}</h2>
                                    <p className="text-slate-500 text-sm mt-1">Global Trade Item Number</p>
                                </div>
                                <div className="text-right">
                                     <Button variant="outline" size="sm" onClick={handlePrintLabel} className="print:hidden">
                                        <Printer size={16} className="mr-2" /> Print Label
                                     </Button>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Batch Info */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 group relative">
                                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                                        <Box size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Lot / Batch</span>
                                    </div>
                                    <p className="text-xl font-mono font-bold text-slate-800 break-all">{currentScan.batchNumber || 'N/A'}</p>
                                </div>

                                {/* Expiry Info */}
                                <div className={`p-4 rounded-xl border group relative ${currentScan.isExpired ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <div className={`flex items-center gap-2 mb-2 ${currentScan.isExpired ? 'text-red-600' : 'text-emerald-600'}`}>
                                        <Calendar size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Expiration</span>
                                    </div>
                                    <p className={`text-xl font-mono font-bold ${currentScan.isExpired ? 'text-red-800' : 'text-emerald-800'}`}>
                                        {currentScan.expiryDate || 'N/A'}
                                    </p>
                                    {currentScan.daysToExpiry !== undefined && (
                                        <p className="text-xs mt-1 font-medium opacity-80">
                                            {currentScan.daysToExpiry < 0 ? `${Math.abs(currentScan.daysToExpiry)} days ago` : `In ${currentScan.daysToExpiry} days`}
                                        </p>
                                    )}
                                </div>

                                {/* Serial Info */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 group relative">
                                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                                        <Hash size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Serial Number</span>
                                    </div>
                                    <p className="text-xl font-mono font-bold text-slate-800 break-all">{currentScan.serialNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Data Breakdown */}
                        <Card title="Raw Data Elements">
                             <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-2">AI</th>
                                            <th className="px-4 py-2">Description</th>
                                            <th className="px-4 py-2">Value</th>
                                            <th className="px-4 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.values(currentScan.elements).map((el: any) => (
                                            <tr key={el.ai}>
                                                <td className="px-4 py-3 font-mono text-slate-500">({el.ai})</td>
                                                <td className="px-4 py-3 text-slate-700">{el.label}</td>
                                                <td className="px-4 py-3 font-medium text-slate-900">{el.value}</td>
                                                <td className="px-4 py-3">
                                                    {el.isValid ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-red-500" />}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </Card>

                        {/* Raw Stream View */}
                        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs break-all">
                            <p className="text-slate-500 mb-1 uppercase text-[10px] font-bold">Raw Input Stream</p>
                            {currentScan.rawData}
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