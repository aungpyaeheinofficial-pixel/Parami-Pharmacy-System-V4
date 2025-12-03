
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, Download, Edit2, AlertCircle, Trash2, X, Save, Search, Image as ImageIcon, Upload, AlertTriangle, Loader2, Check } from 'lucide-react';
import { Card, Button, Badge, Input } from '../components/UI';
import { useProductStore } from '../store';
import { Product } from '../types';

const Inventory = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore();
  const [searchParams] = useSearchParams();
  
  // State for filtering
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize filter from URL params
  useEffect(() => {
    const statusParam = searchParams.get('filter');
    if (statusParam === 'low_stock') {
      setFilterStatus('Low Stock');
    } else {
      setFilterStatus('All');
    }
  }, [searchParams]);

  // State for Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});

  // State for Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Data
  const categories = useMemo<string[]>(() => {
    const cats = new Set<string>(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            product.nameMm.includes(searchTerm) ||
                            product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
      const matchesStatus = filterStatus === 'All' || 
                            (filterStatus === 'Low Stock' && product.stockLevel < product.minStockLevel) ||
                            (filterStatus === 'In Stock' && product.stockLevel >= product.minStockLevel);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, filterCategory, filterStatus]);

  // Handlers
  const handleAddNew = () => {
    setIsEditMode(false);
    setCurrentProduct({
      id: `p${Date.now()}`,
      sku: '',
      nameEn: '',
      nameMm: '',
      genericName: '',
      category: '',
      price: 0,
      stockLevel: 0,
      minStockLevel: 10,
      requiresPrescription: false,
      image: '',
      batches: []
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setIsEditMode(true);
    setCurrentProduct({ ...product });
    setIsModalOpen(true);
  };

  const handleRequestDelete = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent triggering row clicks
    
    // Close edit modal if open
    if (isModalOpen) setIsModalOpen(false);

    setItemToDelete(product);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    setIsDeleting(true);

    // Simulate API delay
    setTimeout(() => {
      deleteProduct(itemToDelete.id);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
      setItemToDelete(null);
      setSuccessMsg("Inventory item deleted successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
    }, 1000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct.nameEn || !currentProduct.price) {
      alert("Please fill in required fields");
      return;
    }

    if (isEditMode && currentProduct.id) {
      updateProduct(currentProduct.id, currentProduct);
    } else {
      addProduct({
        ...currentProduct,
        image: currentProduct.image || ''
      } as Product);
    }
    setIsModalOpen(false);
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    setCurrentProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    handleInputChange('image', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Inventory Management
            <span className="text-base font-normal text-slate-400 font-mm ml-2">ကုန်ပစ္စည်းများ</span>
          </h1>
          <p className="text-slate-500 text-sm">Manage stock levels, pricing, and product details.</p>
        </div>
        
        {successMsg && (
             <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <Check size={16} /> {successMsg}
             </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-white hidden sm:flex">
            <Download size={18} /> Export
          </Button>
          <Button variant="primary" className="gap-2 shadow-lg shadow-parami/20" onClick={handleAddNew}>
            <Plus size={18} /> Add Product
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center bg-slate-50/50">
          <div className="relative w-full md:w-64">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text"
               placeholder="Search name, SKU..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-a7/20"
             />
          </div>
          <div className="relative w-full md:w-auto">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full md:w-auto pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-a7/20 appearance-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full md:w-auto">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full md:w-auto px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-a7/20"
            >
              <option value="All">All Status</option>
              <option value="Low Stock">Low Stock</option>
              <option value="In Stock">In Stock</option>
            </select>
          </div>
          <div className="hidden md:block flex-1"></div>
          <div className="text-sm text-slate-500 w-full md:w-auto text-right">Showing <span className="font-semibold text-slate-900">{filteredProducts.length}</span> products</div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Price (MMK)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => handleEdit(product)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {product.image ? (
                           <img src={product.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                           <ImageIcon size={20} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{product.nameEn}</p>
                        <p className="text-xs text-slate-500 font-mm">{product.nameMm}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">
                    <div className="flex items-center gap-2">
                       <span className={product.stockLevel < product.minStockLevel ? 'text-red-600 font-bold' : 'text-slate-700'}>
                         {product.stockLevel}
                       </span>
                       {product.stockLevel < product.minStockLevel && <AlertCircle size={14} className="text-red-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                    {product.price.toLocaleString()} 
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={product.stockLevel < product.minStockLevel ? 'danger' : 'success'}>
                      {product.stockLevel < product.minStockLevel ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(product); }} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleRequestDelete(e, product)} 
                        className="relative z-10 p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No products found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Visual only for now) */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/30">
           <button className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 text-slate-600 hover:bg-white" disabled>Previous</button>
           <div className="text-sm text-slate-500">Page 1 of 1</div>
           <button className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 text-slate-600 hover:bg-white" disabled>Next</button>
        </div>
      </Card>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div>
                   <h3 className="font-bold text-xl text-slate-800">{isEditMode ? 'Edit Product' : 'Add New Product'}</h3>
                   <p className="text-xs text-slate-500">{isEditMode ? 'Update product details and stock' : 'Enter details for the new item'}</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
                    <X size={20} />
                 </button>
              </div>

              {/* Modal Form */}
              <div className="p-6 overflow-y-auto">
                 <form id="productForm" onSubmit={handleSave} className="space-y-6">
                    
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                       <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Basic Information</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input 
                            label="Product Name (English)" 
                            required
                            placeholder="e.g., Paracetamol 500mg"
                            value={currentProduct.nameEn || ''}
                            onChange={(e: any) => handleInputChange('nameEn', e.target.value)}
                          />
                          <Input 
                            label="Product Name (Myanmar)" 
                            placeholder="e.g., ပါရာစီတမော"
                            className="font-mm"
                            value={currentProduct.nameMm || ''}
                            onChange={(e: any) => handleInputChange('nameMm', e.target.value)}
                          />
                          <Input 
                            label="SKU / Barcode" 
                            placeholder="SCAN-001"
                            value={currentProduct.sku || ''}
                            onChange={(e: any) => handleInputChange('sku', e.target.value)}
                          />
                          <Input 
                            label="Generic Name" 
                            placeholder="Active Ingredient"
                            value={currentProduct.genericName || ''}
                            onChange={(e: any) => handleInputChange('genericName', e.target.value)}
                          />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                             <div className="relative">
                               <input 
                                  list="categoriesList"
                                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-a7/20 focus:border-a7 transition-all placeholder:text-slate-400"
                                  placeholder="Select or Type New..."
                                  value={currentProduct.category || ''}
                                  onChange={(e) => handleInputChange('category', e.target.value)}
                               />
                               <datalist id="categoriesList">
                                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                               </datalist>
                             </div>
                          </div>
                          <div className="flex items-end pb-3">
                             <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 w-full transition-colors">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-slate-300 text-parami focus:ring-parami w-4 h-4"
                                  checked={currentProduct.requiresPrescription || false}
                                  onChange={(e) => handleInputChange('requiresPrescription', e.target.checked)}
                                />
                                <span className="text-sm font-medium text-slate-700">Requires Prescription?</span>
                             </label>
                          </div>
                       </div>
                    </div>

                    {/* Pricing & Stock Section */}
                    <div className="space-y-4 pt-2">
                       <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Stock & Pricing</h4>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input 
                            label="Selling Price (MMK)" 
                            type="number"
                            required
                            min="0"
                            placeholder="0"
                            value={currentProduct.price || 0}
                            onChange={(e: any) => handleInputChange('price', parseInt(e.target.value) || 0)}
                          />
                          <Input 
                            label="Current Stock" 
                            type="number"
                            min="0"
                            required
                            placeholder="0"
                            value={currentProduct.stockLevel || 0}
                            onChange={(e: any) => handleInputChange('stockLevel', parseInt(e.target.value) || 0)}
                          />
                          <Input 
                            label="Min. Alert Level" 
                            type="number"
                            min="0"
                            placeholder="10"
                            value={currentProduct.minStockLevel || 0}
                            onChange={(e: any) => handleInputChange('minStockLevel', parseInt(e.target.value) || 0)}
                          />
                       </div>
                    </div>

                    {/* Image Section */}
                    <div className="space-y-4 pt-2">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Product Image</h4>
                        
                        <div className="flex flex-col gap-3">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleImageUpload}
                            />
                            
                            <div className="flex items-start gap-6">
                                <div 
                                    onClick={triggerFileInput}
                                    className="group relative w-40 h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-parami hover:bg-slate-100 transition-all overflow-hidden shrink-0"
                                >
                                    {currentProduct.image ? (
                                        <>
                                            <img src={currentProduct.image} alt="Product" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <span className="text-white text-xs font-bold flex items-center gap-1"><Upload size={14}/> Change</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-500 group-hover:text-parami transition-colors">
                                                <ImageIcon size={20} />
                                            </div>
                                            <p className="text-xs font-medium text-slate-600 group-hover:text-parami">Click to Upload</p>
                                            <p className="text-[10px] text-slate-400 mt-1">SVG, PNG, JPG</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 space-y-3">
                                    <p className="text-sm text-slate-600">Upload a product image to display in POS and Inventory lists. Images should be square for best results.</p>
                                    <div className="flex gap-2">
                                         <Button type="button" variant="outline" onClick={triggerFileInput} className="text-xs h-9">
                                            <Upload size={14} className="mr-2"/> Choose File
                                         </Button>
                                         {currentProduct.image && (
                                             <Button type="button" variant="danger" onClick={removeImage} className="text-xs h-9 bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
                                                Remove
                                             </Button>
                                         )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                 </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
                 <div>
                   {isEditMode && currentProduct.id && (
                     <Button 
                        variant="danger" 
                        type="button" 
                        onClick={(e: any) => handleRequestDelete(e, currentProduct as Product)}
                    >
                        <Trash2 size={18} /> Delete
                     </Button>
                   )}
                 </div>
                 <div className="flex gap-3">
                   <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                   <Button variant="primary" type="submit" form="productForm" className="shadow-lg shadow-parami/20">
                      <Save size={18} /> {isEditMode ? 'Update Product' : 'Save Product'}
                   </Button>
                 </div>
              </div>

           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                   <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Inventory Item</h3>
                <p className="text-slate-500 text-sm mb-6">
                   Are you sure you want to delete <strong>{itemToDelete.nameEn}</strong>? This action cannot be undone.
                </p>

                {itemToDelete.stockLevel > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-left flex gap-3 mb-6">
                     <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                     <div>
                       <h4 className="text-sm font-bold text-amber-800">High Stock Warning</h4>
                       <p className="text-xs text-amber-700 mt-1">
                         This item has <strong>{itemToDelete.stockLevel}</strong> units in stock. Deleting it will remove this stock record permanently.
                       </p>
                     </div>
                  </div>
                )}

                {deleteError && (
                   <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-left flex gap-3 mb-6">
                     <AlertCircle className="text-red-600 shrink-0" size={20} />
                     <p className="text-sm text-red-700">{deleteError}</p>
                   </div>
                )}

                <div className="flex gap-3">
                   <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
                   <Button 
                      variant="danger" 
                      className="flex-1 bg-red-600 hover:bg-red-700 border-red-600 text-white" 
                      onClick={confirmDelete} 
                      disabled={isDeleting}
                    >
                     {isDeleting ? (
                       <span className="flex items-center gap-2 justify-center">
                          <Loader2 size={16} className="animate-spin" /> Deleting...
                       </span>
                     ) : 'Confirm Delete'}
                   </Button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
