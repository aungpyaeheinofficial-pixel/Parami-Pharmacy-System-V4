
import React, { useState, useMemo } from 'react';
import { Button, Input, Badge } from '../components/UI';
import { useDistributionStore, useProductStore, useCustomerStore } from '../store';
import { DistributionOrder, DistributionItem } from '../types';
import { Truck, MapPin, Package, Clock, Search, Filter, Plus, X, Trash2, Save, Calendar, DollarSign, CreditCard, ShoppingBag, ChevronRight, Minus, Store, User, ChevronDown, AlertCircle } from 'lucide-react';

const Distribution = () => {
  // Use store
  const { orders, addOrder, updateOrder, deleteOrder } = useDistributionStore();
  const { products } = useProductStore();
  const { customers } = useCustomerStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DistributionOrder | null>(null);

  // Modal Form State
  const [formData, setFormData] = useState<DistributionOrder>({
    id: '',
    customer: '',
    address: '',
    status: 'PENDING',
    total: 0,
    date: new Date().toISOString().split('T')[0],
    deliveryTime: '09:00',
    paymentType: 'CASH',
    itemsList: [],
    branchId: ''
  });

  // Validation State
  const [errors, setErrors] = useState<{customer?: string, address?: string, items?: string}>({});

  // CRUD Handlers
  const handleEditClick = (order: DistributionOrder) => {
    setEditingOrder(order);
    setFormData({ ...order }); 
    setErrors({});
    setIsModalOpen(true);
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    setFormData({
      id: `ORD-${Date.now().toString().slice(-4)}`,
      customer: '',
      address: '',
      status: 'PENDING',
      total: 0,
      date: new Date().toISOString().split('T')[0],
      deliveryTime: '09:00',
      paymentType: 'CASH',
      itemsList: [],
      branchId: ''
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.customer) newErrors.customer = "Customer is required";
    if (!formData.address) newErrors.address = "Delivery address is required";
    if (formData.itemsList.length === 0) newErrors.items = "Add at least one item";
    
    // Check for invalid quantities
    const hasInvalidQty = formData.itemsList.some(item => item.quantity <= 0);
    if (hasInvalidQty) newErrors.items = "Quantity must be greater than 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const calculatedTotal = formData.itemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalData = { ...formData, total: calculatedTotal };

    if (editingOrder) {
      updateOrder(finalData);
    } else {
      addOrder(finalData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteOrder = () => {
    if (!editingOrder) return;
    if (window.confirm("Are you sure you want to delete this order permanently?")) {
      deleteOrder(editingOrder.id);
      setIsModalOpen(false);
    }
  };

  // --- Dynamic Item Management ---

  const addEmptyRow = () => {
    const newItem: DistributionItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      price: 0
    };
    setFormData(prev => ({
      ...prev,
      itemsList: [...prev.itemsList, newItem]
    }));
  };

  const updateRowProduct = (itemId: string, productName: string) => {
    const product = products.find(p => p.nameEn === productName);
    setFormData(prev => ({
      ...prev,
      itemsList: prev.itemsList.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            name: productName,
            price: product ? product.price : 0,
            quantity: 1 // Reset qty on product change
          };
        }
        return item;
      })
    }));
  };

  const updateRowQuantity = (itemId: string, qty: number) => {
    setFormData(prev => ({
      ...prev,
      itemsList: prev.itemsList.map(item => 
        item.id === itemId ? { ...item, quantity: Math.max(1, qty) } : item
      )
    }));
  };

  const removeRow = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      itemsList: prev.itemsList.filter(item => item.id !== itemId)
    }));
  };

  // Helpers
  const getProductStock = (productName: string) => {
    const product = products.find(p => p.nameEn === productName);
    return product ? product.stockLevel : 0;
  };

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  // Status Columns
  const columns = ['PENDING', 'PACKING', 'DELIVERING', 'COMPLETED'];

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Distribution Management
            <span className="text-base font-normal text-slate-400 font-mm ml-2">ဖြန့်ချိရေး</span>
          </h1>
          <p className="text-slate-500 text-sm">Track deliveries, manage logistics, and orders.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-a7/20 w-64"
            />
          </div>
          <Button variant="primary" className="gap-2 shadow-lg shadow-parami/20 bg-gradient-to-r from-red-500 to-red-600 border-0" onClick={handleNewOrder}>
            <Plus size={18} /> New Order
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-[1024px]">
          {columns.map(status => (
            <div key={status} className="flex-1 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200/60 h-full">
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200/60 flex items-center justify-between bg-slate-50/80 rounded-t-2xl backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'PENDING' ? 'bg-amber-400' :
                    status === 'PACKING' ? 'bg-blue-400' :
                    status === 'DELIVERING' ? 'bg-purple-400' : 'bg-emerald-400'
                  }`}></div>
                  <h3 className="font-bold text-slate-700 text-sm">{status}</h3>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {filteredOrders.filter(o => o.status === status).length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1 scrollbar-hide">
                {filteredOrders.filter(o => o.status === status).map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => handleEditClick(order)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-red-300 group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-mono text-xs text-slate-400 block mb-0.5">{order.id}</span>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{order.customer}</h4>
                      </div>
                      {order.paymentType === 'CASH' ? (
                        <Badge variant="success" className="text-[10px] px-1.5">CASH</Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px] px-1.5">CREDIT</Badge>
                      )}
                    </div>
                    
                    {/* Items Preview */}
                    <div className="mb-3 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                        <ShoppingBag size={10} /> Items ({order.itemsList.length})
                      </div>
                      <div className="space-y-1">
                        {order.itemsList.slice(0, 2).map((item, idx) => (
                           <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                              <span className="truncate max-w-[120px]">{item.name}</span>
                              <span className="text-slate-400">x{item.quantity}</span>
                           </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{order.address}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        <Clock size={12} /> {order.deliveryTime}
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{order.total.toLocaleString()} Ks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="font-bold text-2xl text-slate-900 tracking-tight">
                  {editingOrder ? `Edit Order #${editingOrder.id}` : 'Create New Distribution Order'}
                </h3>
                <p className="text-slate-500 text-sm mt-1">Fill in the details below to schedule a delivery.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
               
               {/* Top Section: Customer & Status */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customer / Shop Name <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                          <select 
                            className={`w-full pl-10 pr-10 py-3 bg-white border rounded-xl appearance-none focus:outline-none focus:ring-4 focus:ring-red-100 transition-all font-medium text-slate-700 ${errors.customer ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-red-500'}`}
                            value={formData.customer}
                            onChange={(e) => {
                                setFormData({...formData, customer: e.target.value});
                                setErrors({...errors, customer: ''});
                            }}
                          >
                             <option value="">Select a Customer...</option>
                             {customers.map(c => (
                               <option key={c.id} value={c.name}>{c.name} - {c.phone}</option>
                             ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                        {errors.customer && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.customer}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Delivery Address <span className="text-red-500">*</span></label>
                        <textarea 
                          rows={3}
                          className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-4 focus:ring-red-100 transition-all font-medium text-slate-700 resize-none ${errors.address ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-red-500'}`}
                          placeholder="Enter complete delivery address..."
                          value={formData.address}
                          onChange={(e) => {
                             setFormData({...formData, address: e.target.value});
                             setErrors({...errors, address: ''});
                          }}
                        />
                         {errors.address && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.address}</p>}
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                            <div className="relative">
                              <select 
                                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-300 rounded-xl appearance-none focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 font-medium text-slate-700"
                                value={formData.status} 
                                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="PACKING">PACKING</option>
                                <option value="DELIVERING">DELIVERING</option>
                                <option value="COMPLETED">COMPLETED</option>
                              </select>
                              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                         </div>
                         <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Order Date</label>
                            <div className="relative group">
                              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                              <input 
                                type="date" 
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 font-medium text-slate-700"
                                value={formData.date} 
                                onChange={(e: any) => setFormData({...formData, date: e.target.value})} 
                              />
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Delivery Time</label>
                            <div className="relative group">
                              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                              <input 
                                type="time" 
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 font-medium text-slate-700"
                                value={formData.deliveryTime} 
                                onChange={(e: any) => setFormData({...formData, deliveryTime: e.target.value})} 
                              />
                            </div>
                          </div>
                          <div>
                             <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Type</label>
                             <div className="flex gap-4 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.paymentType === 'CASH' ? 'border-red-500' : 'border-slate-300 group-hover:border-red-400'}`}>
                                        {formData.paymentType === 'CASH' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>}
                                    </div>
                                    <input 
                                        type="radio" 
                                        name="paymentType" 
                                        className="hidden"
                                        checked={formData.paymentType === 'CASH'} 
                                        onChange={() => setFormData({...formData, paymentType: 'CASH'})}
                                    />
                                    <span className={`text-sm font-medium ${formData.paymentType === 'CASH' ? 'text-slate-900' : 'text-slate-600'}`}>Cash (လက်ငင်း)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.paymentType === 'CREDIT' ? 'border-red-500' : 'border-slate-300 group-hover:border-red-400'}`}>
                                        {formData.paymentType === 'CREDIT' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>}
                                    </div>
                                    <input 
                                        type="radio" 
                                        name="paymentType" 
                                        className="hidden"
                                        checked={formData.paymentType === 'CREDIT'} 
                                        onChange={() => setFormData({...formData, paymentType: 'CREDIT'})}
                                    />
                                    <span className={`text-sm font-medium ${formData.paymentType === 'CREDIT' ? 'text-slate-900' : 'text-slate-600'}`}>Credit (အကြွေး)</span>
                                </label>
                             </div>
                          </div>
                      </div>
                  </div>
               </div>
               
               {/* Items Table Section */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Order Items</h4>
                     {errors.items && <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded-md border border-red-100 flex items-center gap-1"><AlertCircle size={12}/> {errors.items}</span>}
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-left text-sm">
                         <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 w-[40%]">Item (Searchable)</th>
                                <th className="px-4 py-3 w-[20%]">Price</th>
                                <th className="px-4 py-3 w-[15%]">Qty</th>
                                <th className="px-4 py-3 w-[20%] text-right">Total</th>
                                <th className="px-4 py-3 w-[5%]"></th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {formData.itemsList.map((item, idx) => {
                                const stock = getProductStock(item.name);
                                const isLowStock = stock < item.quantity;
                                
                                return (
                                  <tr key={idx} className="group hover:bg-slate-50/50">
                                      <td className="px-4 py-3">
                                          <div className="relative">
                                             <select 
                                                className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-medium text-slate-800"
                                                value={item.name}
                                                onChange={(e) => updateRowProduct(item.id, e.target.value)}
                                             >
                                                <option value="">Select Product...</option>
                                                {products.map(p => (
                                                   <option key={p.id} value={p.nameEn}>{p.nameEn}</option>
                                                ))}
                                             </select>
                                          </div>
                                          {item.name && (
                                             <div className="text-[10px] text-slate-400 mt-1 pl-1">
                                                Stock: <span className={isLowStock ? "text-red-500 font-bold" : "text-slate-600"}>{stock}</span> units available
                                             </div>
                                          )}
                                      </td>
                                      <td className="px-4 py-3">
                                          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 text-sm font-medium cursor-not-allowed">
                                             {item.price.toLocaleString()} Ks
                                          </div>
                                      </td>
                                      <td className="px-4 py-3">
                                          <div className="relative">
                                             <input 
                                                type="number" 
                                                min="1"
                                                className={`w-full bg-white border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 font-bold text-center ${isLowStock ? 'border-red-300 text-red-600' : 'border-slate-300 text-slate-800 focus:border-red-500'}`}
                                                value={item.quantity} 
                                                onChange={(e) => updateRowQuantity(item.id, parseInt(e.target.value) || 0)} 
                                             />
                                             {isLowStock && (
                                                <div title="Exceeds stock" className="absolute -right-6 top-1/2 -translate-y-1/2">
                                                   <AlertCircle size={14} className="text-red-500" />
                                                </div>
                                             )}
                                          </div>
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                                          {(item.price * item.quantity).toLocaleString()} Ks
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                          <button 
                                            onClick={() => removeRow(item.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all hover:scale-105"
                                            title="Remove Item"
                                          >
                                              <Trash2 size={18} />
                                          </button>
                                      </td>
                                  </tr>
                                );
                            })}
                         </tbody>
                      </table>
                      <button 
                        onClick={addEmptyRow}
                        className="w-full py-3 border-t border-slate-200 border-dashed text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm group"
                      >
                         <div className="w-5 h-5 rounded-full border border-slate-400 group-hover:border-red-500 flex items-center justify-center">
                            <Plus size={12} className="group-hover:text-red-500" />
                         </div>
                         Add Item
                      </button>
                  </div>

                  {/* Order Summary */}
                  <div className="flex justify-end pt-4">
                     <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm text-slate-500">
                           <span>Subtotal:</span>
                           <span className="font-medium text-slate-800">
                              {formData.itemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} Ks
                           </span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                           <span>Discount:</span>
                           <span className="font-medium text-slate-800">0 Ks</span>
                        </div>
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                           <span className="font-bold text-slate-900">Total:</span>
                           <span className="text-2xl font-bold text-red-600">
                              {formData.itemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} <span className="text-sm font-medium text-slate-500">Ks</span>
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                <div>
                  {editingOrder && (
                     <Button 
                       variant="ghost" 
                       onClick={handleDeleteOrder} 
                       className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4"
                     >
                       <Trash2 size={18} className="mr-2"/> Delete Order
                     </Button>
                  )}
                </div>
                <div className="flex gap-4">
                    <button 
                       onClick={() => setIsModalOpen(false)}
                       className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-white hover:border-slate-400 hover:shadow-sm transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={handleSave}
                       className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                       <Save size={18} /> Save Order
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Distribution;
