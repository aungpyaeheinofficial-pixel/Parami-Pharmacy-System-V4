import React from 'react';

export const Card = ({ children, className = '', title, action }: { children?: React.ReactNode, className?: string, title?: string, action?: React.ReactNode }) => (
  <div className={`bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-slate-200/60 overflow-hidden transition-all duration-300 ${className}`}>
    {(title || action) && (
      <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
        {title && <h3 className="font-bold text-slate-800 text-lg tracking-tight">{title}</h3>}
        {action}
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

export const Button = ({ children, variant = 'primary', className = '', size = 'md', ...props }: any) => {
  const sizeStyles: any = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base"
  };

  const baseStyle = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.98]";
  
  const variants: any = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 border border-transparent focus:ring-blue-500",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-500/20 border border-transparent focus:ring-slate-700",
    outline: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus:ring-slate-200 shadow-sm",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200",
    danger: "bg-white text-red-600 border border-red-100 hover:bg-red-50 focus:ring-red-200 shadow-sm",
    parami: "bg-parami-600 text-white hover:bg-parami-700 shadow-lg shadow-parami-500/20 border border-transparent focus:ring-parami-500"
  };

  return (
    <button className={`${baseStyle} ${sizeStyles[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Badge = ({ children, variant = 'info', className = '' }: { children?: React.ReactNode, variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral', className?: string }) => {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-red-50 text-red-700 border-red-100",
    info: "bg-blue-50 text-blue-700 border-blue-100",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Input = ({ label, className = '', containerClassName = '', error, ...props }: any) => (
  <div className={`w-full ${containerClassName}`}>
    {label && <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">{label}</label>}
    <input 
      className={`w-full px-4 py-2.5 bg-white border rounded-xl transition-all duration-200 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500
        ${error 
          ? 'border-red-300 focus:ring-red-100 focus:border-red-500 text-red-900' 
          : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300 shadow-sm'
        } ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500 ml-1">{error}</p>}
  </div>
);

export const ProgressBar = ({ value, max = 100, variant = 'info', className = '' }: any) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const colors: any = {
    info: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    parami: 'bg-parami-600',
  };
  return (
    <div className={`h-2 w-full bg-slate-100 rounded-full overflow-hidden ${className}`}>
      <div className={`h-full ${colors[variant]} transition-all duration-700 ease-out rounded-full shadow-sm`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

export const Tabs = ({ tabs, activeTab, onChange, className = '' }: { tabs: { id: string, label: string, count?: number }[], activeTab: string, onChange: (id: string) => void, className?: string }) => (
  <div className={`flex p-1 bg-slate-100/80 border border-slate-200 rounded-xl ${className}`}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
          activeTab === tab.id 
            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5 scale-[1.02]' 
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
        }`}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-colors ${activeTab === tab.id ? 'bg-slate-100 text-slate-900' : 'bg-slate-200 text-slate-600'}`}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);