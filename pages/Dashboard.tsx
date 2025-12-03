import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Users, AlertTriangle, ArrowUpRight, ArrowDownRight, Calendar, Filter, RefreshCw, ShoppingCart, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/UI';
import { useProductStore, useTransactionStore, useCustomerStore } from '../store';
import { Transaction } from '../types';

interface DateRange {
  start: string;
  end: string;
}

interface DashboardMetrics {
  totalSales: number;
  salesGrowth: number;
  lowStockCount: number;
  lowStockChange: number;
  totalCustomers: number;
  customerGrowth: number;
  recentTransactions: Transaction[];
  chartData: any[];
  categoryData: any[];
}

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getQuickFilterRange = (type: 'today' | 'week' | 'month' | 'year'): DateRange => {
  const end = new Date();
  const start = new Date();
  
  if (type === 'week') {
    start.setDate(end.getDate() - 7);
  } else if (type === 'month') {
    start.setMonth(end.getMonth() - 1);
  } else if (type === 'year') {
    start.setFullYear(end.getFullYear() - 1);
  }
  
  return { start: formatDate(start), end: formatDate(end) };
};

const COLORS = ['#3B82F6', '#D7000F', '#F59E0B', '#10B981', '#8B5CF6'];

const StatCard = ({ title, value, subValue, trend, trendValue, icon: Icon, colorClass, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl shadow-card hover:shadow-card-hover border border-slate-200/60 group transition-all duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-2xl ${colorClass} bg-opacity-10 flex items-center justify-center`}>
          <Icon size={24} className={colorClass.replace('bg-', 'text-').replace('100', '600')} />
      </div>
      {trendValue && (
          <span className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${trend === 'up' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              {trend === 'up' ? <ArrowUpRight size={10} className="mr-0.5"/> : <ArrowDownRight size={10} className="mr-0.5"/>}
              {trendValue}
          </span>
      )}
    </div>
    
    <div>
      <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase text-[10px]">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{value}</h3>
      {subValue && <p className="text-xs text-slate-400 mt-1.5 font-medium">{subValue}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { products } = useProductStore();
  const { customers } = useCustomerStore();
  const { transactions, getTransactionsByDateRange } = useTransactionStore();

  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [dateRange, setDateRange] = useState<DateRange>(getQuickFilterRange('month'));
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    salesGrowth: 0,
    lowStockCount: 0,
    lowStockChange: 0,
    totalCustomers: 0,
    customerGrowth: 0,
    recentTransactions: [],
    chartData: [],
    categoryData: []
  });

  const fetchData = () => {
    setLoading(true);
    setTimeout(() => {
      const currentPeriodTrans = getTransactionsByDateRange(dateRange.start, dateRange.end);
      
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      const duration = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 86400000); 
      const prevStart = new Date(prevEnd.getTime() - duration);
      const prevPeriodTrans = getTransactionsByDateRange(formatDate(prevStart), formatDate(prevEnd));

      const currentSales = currentPeriodTrans
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const prevSales = prevPeriodTrans
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const salesGrowth = prevSales === 0 ? 100 : ((currentSales - prevSales) / prevSales) * 100;

      const lowStockItems = products.filter(p => p.stockLevel <= p.minStockLevel).length;
      
      const salesByDate: Record<string, number> = {};
      const datesInRange: string[] = [];
      let iterDate = new Date(start);
      while(iterDate <= end) {
        datesInRange.push(formatDate(iterDate));
        iterDate.setDate(iterDate.getDate() + 1);
      }

      datesInRange.forEach(d => salesByDate[d] = 0);

      currentPeriodTrans
        .filter(t => t.type === 'INCOME')
        .forEach(t => {
          if (salesByDate[t.date] !== undefined) {
             salesByDate[t.date] += t.amount;
          }
        });

      const chartData = Object.keys(salesByDate).map(date => ({
        name: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        date: date,
        revenue: salesByDate[date]
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const salesByCategory: Record<string, number> = {};
      currentPeriodTrans
        .filter(t => t.type === 'INCOME')
        .forEach(t => {
           salesByCategory[t.category] = (salesByCategory[t.category] || 0) + t.amount;
        });
      
      const categoryData = Object.keys(salesByCategory)
        .map(cat => ({ name: cat, value: salesByCategory[cat] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); 

      setMetrics({
        totalSales: currentSales,
        salesGrowth: salesGrowth,
        lowStockCount: lowStockItems,
        lowStockChange: 0,
        totalCustomers: customers.length,
        customerGrowth: 1.2,
        recentTransactions: currentPeriodTrans.slice(0, 5),
        chartData,
        categoryData
      });

      setLastUpdated(new Date());
      setLoading(false);
    }, 600);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [dateRange, transactions, products, customers]);

  const handleQuickFilter = (type: 'today' | 'week' | 'month' | 'year') => {
    setFilterType(type);
    setDateRange(getQuickFilterRange(type));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm flex items-center gap-2 font-medium mt-1">
            Real-time business analytics
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-500">
               Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60">
           <div className="flex bg-slate-100/80 p-1 rounded-xl">
              {(['today', 'week', 'month', 'year'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => handleQuickFilter(type)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                    filterType === type 
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {type}
                </button>
              ))}
           </div>

           <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

           <div className="flex items-center gap-2">
              <div className="relative group">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                   type="date" 
                   value={dateRange.start}
                   onChange={(e) => {
                     setFilterType('today');
                     setDateRange(prev => ({ ...prev, start: e.target.value }));
                   }}
                   className="pl-9 pr-3 py-2 text-xs font-bold border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 w-32 hover:border-slate-300 transition-all text-slate-700"
                 />
              </div>
              <span className="text-slate-300">→</span>
              <div className="relative group">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                   type="date" 
                   value={dateRange.end}
                   onChange={(e) => {
                     setFilterType('today');
                     setDateRange(prev => ({ ...prev, end: e.target.value }));
                   }}
                   className="pl-9 pr-3 py-2 text-xs font-bold border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 w-32 hover:border-slate-300 transition-all text-slate-700"
                 />
              </div>
           </div>

           <Button variant="outline" onClick={fetchData} disabled={loading} className="px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm text-slate-600">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
           </Button>
        </div>
      </div>

      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>)}
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Revenue" 
            value={`${metrics.totalSales.toLocaleString()} MMK`} 
            trend={metrics.salesGrowth >= 0 ? 'up' : 'down'} 
            trendValue={`${Math.abs(metrics.salesGrowth).toFixed(1)}%`} 
            icon={TrendingUp} 
            colorClass="bg-emerald-100" 
          />
          <StatCard 
            title="Low Stock Items" 
            value={metrics.lowStockCount} 
            subValue="Requires immediate attention"
            trend="down" 
            icon={AlertTriangle} 
            colorClass="bg-amber-100"
            onClick={() => navigate('/inventory?filter=low_stock')}
          />
          <StatCard 
            title="Total Customers" 
            value={metrics.totalCustomers.toLocaleString()} 
            trend="up" 
            trendValue="+1.2%" 
            icon={Users} 
            colorClass="bg-purple-100" 
            onClick={() => navigate('/customers')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Revenue Analytics">
          <div className="h-[320px] w-full mt-4">
            {metrics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={10} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} tickFormatter={(value) => `${value/1000}k`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} MMK`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                    itemStyle={{ color: '#3B82F6', fontWeight: 600, fontSize: '12px' }}
                    labelStyle={{ color: '#64748b', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}
                    cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-400 flex-col">
                  <Activity size={32} className="opacity-20 mb-2" />
                  <p>No revenue data for selected period</p>
               </div>
            )}
          </div>
        </Card>

        <Card title="Top Categories">
          <div className="mt-4 h-[320px]">
            {metrics.categoryData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={metrics.categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc', radius: 4}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number) => [`${value.toLocaleString()} Ks`, 'Sales']}
                    />
                    <Bar dataKey="value" barSize={24} radius={[0, 6, 6, 0]}>
                      {metrics.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-400 flex-col">
                  <ShoppingCart size={32} className="opacity-20 mb-2" />
                  <p>No category data available</p>
               </div>
            )}
          </div>
        </Card>
      </div>
      
      <Card title="Recent Transactions" className="overflow-hidden border border-slate-200/60 shadow-card">
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
               <tr>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider">Transaction ID</th>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider">Description</th>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider">Date</th>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider">Amount</th>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider">Category</th>
                 <th className="px-6 py-4 text-xs uppercase tracking-wider text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {metrics.recentTransactions.length > 0 ? (
                 metrics.recentTransactions.map((t) => (
                   <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                     <td className="px-6 py-4 font-mono text-slate-500 text-xs font-medium group-hover:text-slate-800 transition-colors">#{t.id}</td>
                     <td className="px-6 py-4 font-semibold text-slate-700">{t.description}</td>
                     <td className="px-6 py-4 text-slate-500 text-xs font-medium">{t.date}</td>
                     <td className={`px-6 py-4 font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                       {t.type === 'INCOME' ? '+' : '-'}{t.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal ml-0.5">MMK</span>
                     </td>
                     <td className="px-6 py-4">
                       <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                         {t.category}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <button className="text-slate-400 hover:text-blue-600 text-xs font-bold hover:underline transition-colors">View</button>
                     </td>
                   </tr>
                 ))
               ) : (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                       <div className="flex flex-col items-center justify-center">
                          <Activity size={40} className="opacity-10 mb-2" />
                          <p>No recent transactions found.</p>
                       </div>
                    </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
         <div className="p-4 border-t border-slate-50 text-center bg-slate-50/50">
            <Button variant="ghost" onClick={() => navigate('/finance')} className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wide">View All Transactions</Button>
         </div>
      </Card>
    </div>
  );
};

export default Dashboard;