import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store';
import { Sidebar, Header } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Expiry from './pages/Expiry';
import Distribution from './pages/Distribution';
import Purchase from './pages/Purchase';
import Finance from './pages/Finance';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import PharmacyScanner from './components/PharmacyScanner';
import { useGlobalStore } from './store';

const ProtectedLayout = () => {
  const { user } = useAuthStore();
  const { isSidebarOpen } = useGlobalStore();

  // Responsive: Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        useGlobalStore.setState({ isSidebarOpen: false });
      }
    };
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      {/* 
        Layout Logic:
        - md:ml-[280px]: Pushes content on desktop when sidebar is fixed. Matches new sidebar width.
        - ml-0: No margin on mobile; sidebar overlays content.
      */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'md:ml-[280px]' : 'ml-0'
        }`}
      >
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/expiry" element={<Expiry />} />
          <Route path="/distribution" element={<Distribution />} />
          <Route path="/purchase" element={<Purchase />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/scanner" element={<PharmacyScanner />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;