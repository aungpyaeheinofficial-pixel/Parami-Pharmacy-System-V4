
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Truck, 
  Users, BarChart3, Settings, LogOut, Menu, Bell, Search,
  ChevronDown, HeartPulse, Building2, Check, X, ScanLine, Calendar, ShoppingBag, PlusCircle, Wrench
} from 'lucide-react';
import { useAuthStore, useGlobalStore, useBranchStore } from '../store';

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
  const { logout } = useAuthStore();
  
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
        className={`w-[280px] bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out shadow-2xl shadow-gray-200/50 md:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-100 bg-white">
          <div className="w-10 h-10 bg-[#C8000C] rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/20 shrink-0">
            <HeartPulse size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 leading-none font-mm">ပါရမီဆေးဆိုင်</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Pharmacy System</p>
          </div>
          <button 
             onClick={toggleSidebar}
             className="ml-auto md:hidden p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
             <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" subLabel="ခြုံငုံသုံးသပ်ချက်" />
          <NavItem to="/pos" icon={ShoppingCart} label="POS Terminal" subLabel="အရောင်းကောင်တာ" />
          
          <div className="py-2">
            <div className="h-[1px] bg-gray-100 mx-2 mb-2" />
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Inventory</p>
            <NavItem to="/stock-entry" icon={PlusCircle} label="Stock Entry" subLabel="ပစ္စည်းထည့်သွင်းရန်" />
            <NavItem to="/inventory" icon={Package} label="Current Stock" subLabel="လက်ရှိ ပစ္စည်းများ" />
            <NavItem to="/expiry" icon={Calendar} label="Expiry Center" subLabel="သက်တမ်းကုန်ဆုံးမှု" />
          </div>

          <div className="py-2">
             <div className="h-[1px] bg-gray-100 mx-2 mb-2" />
             <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Management</p>
             <NavItem to="/purchase" icon={ShoppingBag} label="Purchasing" subLabel="အဝယ်ပိုင်း" />
             <NavItem to="/distribution" icon={Truck} label="Distribution" subLabel="ဖြန့်ချိရေး" />
             <NavItem to="/finance" icon={BarChart3} label="Finance" subLabel="ငွေစာရင်း" />
             <NavItem to="/customers" icon={Users} label="Customers" subLabel="ဖောက်သည်များ" />
          </div>

          <div className="py-2">
            <div className="h-[1px] bg-gray-100 mx-2 mb-2" />
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tools</p>
            <NavItem to="/scanner" icon={ScanLine} label="Scanner Utility" subLabel="စစ်ဆေးရေး စက်ကိရိယာ" />
            <NavItem to="/settings" icon={Settings} label="Settings" subLabel="ဆက်တင်များ" />
          </div>
        </div>

        {/* Footer User Profile */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
           <button 
             onClick={logout}
             className="flex items-center gap-3 w-full p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all group"
           >
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                 <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-left overflow-hidden">
                 <p className="text-sm font-bold text-gray-800 truncate group-hover:text-[#C8000C] transition-colors">Kaung Kaung</p>
                 <p className="text-[10px] font-medium text-gray-500 truncate">Administrator</p>
              </div>
              <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
           </button>
        </div>
      </aside>
    </>
  );
};

export const Header = () => {
  const { toggleSidebar } = useGlobalStore();
  const { branches, currentBranchId, setBranch, getCurrentBranch } = useBranchStore();
  const { user } = useAuthStore();
  
  const currentBranch = getCurrentBranch();

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm/50">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
        >
          <Menu size={24} />
        </button>
        
        {/* Branch Switcher */}
        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Branch</span>
              <div className="relative group">
                 <button className="flex items-center gap-2 font-bold text-gray-800 hover:text-[#C8000C] transition-colors">
                    <Building2 size={16} />
                    <span>{currentBranch?.name || 'Select Branch'}</span>
                    <ChevronDown size={14} className="text-gray-400 group-hover:text-[#C8000C]" />
                 </button>
                 
                 {/* Dropdown */}
                 <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-left z-50">
                    <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Switch Branch</p>
                    {branches.map(branch => (
                       <button 
                         key={branch.id}
                         onClick={() => setBranch(branch.id)}
                         className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                            currentBranchId === branch.id 
                            ? 'bg-red-50 text-[#C8000C]' 
                            : 'text-gray-600 hover:bg-gray-50'
                         }`}
                       >
                          <span>{branch.name}</span>
                          {currentBranchId === branch.id && <Check size={14} />}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
         {/* Search Bar */}
         <div className="hidden md:flex relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C8000C] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Global Search..." 
              className="w-64 pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8000C]/20 focus:bg-white transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
               <span className="px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-bold text-gray-400">⌘</span>
               <span className="px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-bold text-gray-400">K</span>
            </div>
         </div>

         <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>

         <button className="relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
         </button>
         
         <div className="flex items-center gap-3 pl-2 border-l border-gray-200 md:border-none">
            <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-gray-800">{user?.name || 'Guest'}</p>
               <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase">{user?.role || 'Staff'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 ring-2 ring-white shadow-sm overflow-hidden">
               <img src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} alt="Profile" className="w-full h-full object-cover" />
            </div>
         </div>
      </div>
    </header>
  );
};
