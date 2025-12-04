import React, { useState } from 'react';
import { Keyboard, ChevronDown } from 'lucide-react';

const shortcuts = [
  { key: 'F1', label: 'Help', mm: 'အကူအညီ' },
  { key: 'F2', label: 'Search Product', mm: 'ဆေးရှာရန်' },
  { key: 'F3', label: 'Scan Barcode', mm: 'ဘားကုတ် ဖတ်ရန်' },
  { key: 'F4', label: 'Manual Input', mm: 'လက်ဖြင့် ရိုက်ရန်' },
  { key: 'F8', label: 'View History', mm: 'မှတ်တမ်း ကြည့်ရန်' },
  { key: 'F10', label: 'Confirm & Save', mm: 'အတည်ပြုပြီး သိမ်းရန်' },
  { key: 'ESC', label: 'Cancel / Back', mm: 'ပယ်ဖျက် / ပြန်ထွက်' },
];

const ShortcutPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-800 text-white p-3.5 rounded-full shadow-xl hover:bg-slate-700 transition-all z-[60] hover:scale-105 active:scale-95 group"
        title="Show Keyboard Shortcuts"
      >
        <Keyboard size={24} className="group-hover:text-blue-200 transition-colors" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white/95 backdrop-blur-md shadow-2xl border border-slate-200 rounded-2xl w-80 overflow-hidden z-[60] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div 
        className="bg-slate-800 text-white px-4 py-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-900 transition-colors" 
        onClick={() => setIsOpen(false)}
      >
        <div className="flex items-center gap-2.5">
           <div className="p-1 bg-white/10 rounded">
             <Keyboard size={16} />
           </div>
           <span className="font-bold text-sm">Keyboard Shortcuts (ဖြတ်လမ်း)</span>
        </div>
        <ChevronDown size={16} />
      </div>
      
      <div className="p-1 grid gap-0.5 max-h-[350px] overflow-y-auto">
         {shortcuts.map((s, idx) => (
           <div key={s.key} className={`flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 rounded-lg group transition-colors ${idx !== shortcuts.length - 1 ? 'border-b border-slate-50' : ''}`}>
              <div>
                 <p className="text-xs font-bold text-slate-700">{s.label}</p>
                 <p className="text-[10px] text-slate-500 font-mm mt-0.5">{s.mm}</p>
              </div>
              <kbd className="bg-slate-100 border-b-2 border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 font-mono min-w-[2.5rem] text-center shadow-sm group-hover:bg-white group-hover:border-blue-300 transition-all">
                 {s.key}
              </kbd>
           </div>
         ))}
      </div>
      <div className="bg-slate-50 px-4 py-2 text-[10px] text-slate-400 text-center border-t border-slate-100">
         Press keys to trigger actions
      </div>
    </div>
  );
};

export default ShortcutPanel;