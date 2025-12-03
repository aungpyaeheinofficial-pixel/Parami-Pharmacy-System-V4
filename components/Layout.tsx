import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Truck, 
  Users, BarChart3, Settings, LogOut, Menu, Bell, Search,
  ChevronDown, HeartPulse, CreditCard, ShoppingBag,
  Check, ScanLine, Building2, MapPin, X, Loader2
} from 'lucide-react';
import { useAuthStore, useGlobalStore, useBranchStore, useDistributionStore } from '../store';

const NavItem = ({ to, icon: Icon, label, subLabel }: { to: string, icon: any, label: string, subLabel?: string }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative select-none mb-1 ${
        isActive 
          ? 'bg-gradient-to-r from-[#C8000C] to-[#E01111] text-white shadow-md shadow-red-900/20' 
          : 'text-gray-600 hover:bg-red-50 hover:text-[#C8000C]'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon size={20} className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#C8000C]'}`} />
        <div className="flex flex-col relative z-10">
          <span className={`text-sm font-semibold leading-tight ${isActive ? 'text-white' : ''}`}>{label}</span>
          {subLabel && <span className={`text-[10px] ${isActive ? 'text-white/90' : 'text-gray-400 group-hover:text-[#C8000C]/80'} font-mm leading-tight mt-0.5`}>{subLabel}</span>}
        </div>
        {isActive && (
            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/40" />
        )}
      </>
    )}
  </NavLink>
);

export const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useGlobalStore();
  
  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside 
        className={`w-[280px] bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out shadow-2xl shadow-gray-200/50 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#C8000C] to-[#E01111] rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/30 transform rotate-3">
                <HeartPulse size={24} />
              </div>
              <div>
                <h1 className="font-bold text-gray-800 leading-tight font-mm text-lg tracking-tight">ပါရမီဆေးဆိုင်</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pharmacy System</p>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={toggleSidebar}
              className="md:hidden p-2 text-gray-400 hover:bg-red-50 hover:text-[#C8000C] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-hide">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-4">Operations</p>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" subLabel="ဒက်ရှ်ဘုတ်" />
          <NavItem to="/pos" icon={ShoppingCart} label="Point of Sale" subLabel="အရောင်းကောင်တာ" />
          <NavItem to="/inventory" icon={Package} label="Inventory" subLabel="ကုန်ပစ္စည်းများ" />
          <NavItem to="/expiry" icon={HeartPulse} label="Expiry Center" subLabel="သက်တမ်းကုန်ဆုံးမည့်စာရင်း" />
          
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-8">Management</p>
          <NavItem to="/distribution" icon={Truck} label="Distribution" subLabel="ဖြန့်ချိရေး" />
          <NavItem to="/purchase" icon={ShoppingBag} label="Purchase" subLabel="အဝယ်ပိုင်း" />
          <NavItem to="/finance" icon={CreditCard} label="Finance" subLabel="ငွေစာရင်း" />
          <NavItem to="/customers" icon={Users} label="Customers" subLabel="ဖောက်သည်များ" />
          <NavItem to="/settings" icon={Settings} label="Settings" subLabel="ပြင်ဆင်မှုများ" />

          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-8">Tools</p>
          <NavItem to="/scanner" icon={ScanLine} label="Scanner Utility" subLabel="ဘားကုဒ်စကင်ဖတ်စက်" />
        </div>

        <div className="p-6 mt-auto shrink-0">
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-xs font-medium text-slate-400">Powered by</span>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0060CE]"></div>
              <span className="text-sm font-bold text-slate-700">A7 Business Systems</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export const Header = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useGlobalStore();
  const { branches, currentBranchId, setBranch } = useBranchStore();
  const { allOrders } = useDistributionStore();
  const navigate = useNavigate();
  
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBranchMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
     if (branches.length > 0 && !branches.find(b => b.id === currentBranchId)) {
         setBranch(branches[0].id);
     }
  }, [branches, currentBranchId, setBranch]);

  useEffect(() => {
    if (!isBranchMenuOpen) setSearchTerm('');
  }, [isBranchMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  const handleSwitchBranch = (branchId: string, branchName: string) => {
    if (branchId === currentBranchId) {
       setIsBranchMenuOpen(false);
       return;
    }
    setIsLoading(true);
    setIsBranchMenuOpen(false);
    
    setTimeout(() => {
        setBranch(branchId);
        setIsLoading(false);
    }, 500);
  };

  const getBranchStats = (branchId: string) => {
     const branchOrders = allOrders.filter(o => o.branchId === branchId);
     return {
        pending: branchOrders.filter(o => o.status === 'PENDING').length,
     };
  };

  const filteredBranches = branches.filter(b => 
    b.status === 'active' &&
    (b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <>
      {isLoading && (
         <div className="fixed inset-0 z-[2000] bg-white/90 backdrop-blur-md flex items-center justify-center flex-col animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#C8000C] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <Building2 size={24} className="text-slate-300" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mt-6">Switching Branch...</h3>
            <p className="text-slate-500 mt-2">Loading environment for {branches.find(b => b.id === currentBranchId)?.name}</p>
         </div>
      )}

      {isBranchMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[900] md:hidden" aria-hidden="true" />
      )}

      <header className="h-16 glass-panel sticky top-0 z-10 px-6 flex items-center justify-between transition-all duration-300 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors">
            <Menu size={20} />
          </button>
          
          <div className="relative group" ref={dropdownRef}>
            <button 
              onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
              className={`flex items-center gap-3 px-3 py-1.5 bg-white/80 hover:bg-white rounded-xl border border-slate-200/80 hover:border-red-300 transition-all select-none ${isBranchMenuOpen ? 'ring-2 ring-red-500/10 border-red-400' : 'shadow-sm'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-50 to-red-100 border border-red-200 flex items-center justify-center text-[#C8000C] shadow-sm">
                 <Building2 size={16} />
              </div>
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Branch</span>
                <span className="font-bold font-mm text-slate-800 text-sm max-w-[140px] md:max-w-xs truncate text-left">{currentBranch?.name || 'Unknown Branch'}</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-200 text-slate-400 ml-2 ${isBranchMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBranchMenuOpen && (
              <div className="fixed inset-x-0 bottom-0 md:absolute md:top-full md:left-0 md:bottom-auto md:mt-2 w-full md:w-[420px] bg-white md:rounded-2xl rounded-t-2xl shadow-soft-xl border border-slate-100 z-[1000] flex flex-col max-h-[85vh] md:max-h-[600px] overflow-hidden animate-in slide-in-from-bottom-10 md:slide-in-from-top-2 fade-in duration-200">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                   <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Search branches..." 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>
                </div>

                <div className="overflow-y-auto max-h-[400px] p-2 space-y-1">
                   {filteredBranches.map(branch => {
                       const stats = getBranchStats(branch.id);
                       const isActive = branch.id === currentBranchId;
                       
                       return (
                          <button
                             key={branch.id}
                             onClick={() => handleSwitchBranch(branch.id, branch.name)}
                             className={`w-full text-left p-3 rounded-xl flex items-center gap-4 transition-all border group relative ${
                                isActive 
                                  ? 'bg-red-50/50 border-red-100/50' 
                                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                             }`}
                          >
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm border border-transparent ${
                                isActive ? 'bg-red-100 text-red-600 border-red-200' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:border-slate-200'
                             }`}>
                                {isActive ? <Check size={20} /> : <Building2 size={20} />}
                             </div>
                             
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                   <span className={`font-bold text-sm truncate ${isActive ? 'text-red-900' : 'text-slate-700'}`}>
                                      {branch.name}
                                   </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate mt-1">
                                   <MapPin size={12} className="shrink-0" />
                                   <span className="truncate">{branch.address || 'No address set'}</span>
                                </div>
                             </div>
                          </button>
                       );
                    })}
                </div>

                <div className="p-3 border-t border-slate-100 bg-slate-50">
                   <button 
                      onClick={() => { setIsBranchMenuOpen(false); navigate('/settings?tab=branches'); }}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-slate-600 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-200 hover:border-slate-800 hover:shadow-lg uppercase tracking-wide"
                   >
                      <Settings size={14} />
                      Manage All Branches
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200 h-8">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-800 leading-none">{user?.name || 'Guest'}</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">{user?.role || 'Viewer'}</p>
            </div>
            <div className="relative group cursor-pointer">
               <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden hover:ring-4 hover:ring-red-500/10 transition-all p-0.5">
                 <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} alt="Profile" className="w-full h-full object-cover rounded-[10px]" />
               </div>
               <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-soft-xl border border-slate-100 py-1 hidden group-hover:block hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-50 mb-1">
                    <p className="font-bold text-slate-800 text-sm">{user?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                     <LogOut size={16} /> Sign Out
                  </button>
               </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};