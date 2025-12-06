import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, Download, Edit2, Trash2, X, Save, Search, Image as ImageIcon, Check } from 'lucide-react';
import { Card, Button, Input } from '../components/UI';

// --- AWS IMPORTS ---
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

// 1. Initialize Client
const client = generateClient<Schema>();

// 2. Hardcode units here to avoid import errors
const UNIT_OPTIONS = ['Strip', 'Bottle', 'Box', 'Card', 'Vial', 'Tube'];

const Inventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // Initialize with default values to prevent "controlled/uncontrolled" errors
  const [currentProduct, setCurrentProduct] = useState<any>({
    name: '', myanmarName: '', sku: '', category: 'Medicine', price: 0, unit: 'Strip', minStock: 10, description: ''
  });
  const [successMsg, setSuccessMsg] = useState('');

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data: items } = await client.models.Product.list();
      setProducts(items);
    } catch (e) {
      console.error("Error fetching products", e);
    }
  }

  // --- FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (product.myanmarName || '').includes(searchTerm) ||
                            (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  const handleAddNew = () => {
    setIsEditMode(false);
    setCurrentProduct({
      sku: '',
      name: '',
      myanmarName: '',
      category: 'Medicine',
      price: 0,
      unit: 'Strip',
      minStock: 10, 
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product: any) => {
    setIsEditMode(true);
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

 // --- SAVE TO AWS (FIXED) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validation
    if (!currentProduct.name || !currentProduct.price) {
      alert("Please fill in Name and Price");
      return;
    }

    try {
      console.log("Attempting to save...", currentProduct); // Debug Log

      // 2. Prepare data object safely
      // Ensure numbers are actually numbers, not strings
      const productData: any = {
        name: currentProduct.name,
        myanmarName: currentProduct.myanmarName,
        sku: currentProduct.sku,
        price: parseFloat(currentProduct.price),
        category: currentProduct.category,
        unit: currentProduct.unit,
        minStock: parseInt(currentProduct.minStock || 0), 
        description: currentProduct.description
      };

      if (isEditMode && currentProduct.id) {
        // --- UPDATE MODE ---
        const { data: updatedItem, errors } = await client.models.Product.update({
          id: currentProduct.id,
          ...productData
        });

        if (errors) throw errors;

        // Manual Screen Update (Replace the old item in the list)
        setProducts(prev => prev.map(item => item.id === currentProduct.id ? updatedItem : item));
        setSuccessMsg("Updated successfully");

      } else {
        // --- CREATE MODE ---
        const { data: newItem, errors } = await client.models.Product.create(productData);
        
        if (errors) throw errors;

        console.log("Created Item:", newItem); // Debug Log

        // Manual Screen Update (Add new item to list immediately)
        // This makes it appear instantly!
        if (newItem) {
           setProducts(prev => [newItem, ...prev]);
        }
        
        setSuccessMsg("Saved successfully");
      }
      
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(""), 3000);

    } catch (error) {
      console.error("FULL ERROR DETAILS:", error); // Check your Console (F12) if this happens!
      alert("Failed to save. Open Console (F12) to see why.");
    }
  };

  // --- DELETE ---
  const handleRequestDelete = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    setItemToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await client.models.Product.delete({ id: itemToDelete.id });
      setSuccessMsg("Deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete.");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  // Helper to handle input changes
  const handleInputChange = (field: string, value: any) => {
    setCurrentProduct((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Inventory
            <span className="text-base font-normal text-slate-400 font-mm ml-2">ကုန်ပစ္စည်းများ</span>
          </h1>
        </div>
        {successMsg && (
             <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Check size={16} /> {successMsg}
             </div>
        )}
        <Button variant="primary" className="gap-2 shadow-lg" onClick={handleAddNew}>
            <Plus size={18} /> Add Product
        </Button>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 flex gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text"
               placeholder="Search name, SKU..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
             />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Info</th>
                <th className="px-6 py-4">Min Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80 cursor-pointer" onClick={() => handleEdit(product)}>
                  <td className="px-6 py-4">
                    <div>
                        <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                        <p className="text-xs text-slate-500 font-mm">{product.myanmarName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">SKU: {product.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="block font-medium">{product.category}</span>
                    <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{product.unit || 'Unit'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {product.minStock || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                    {product.price?.toLocaleString()} Ks
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => handleRequestDelete(e, product)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded">
                            <Trash2 size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="font-bold text-xl text-slate-800">{isEditMode ? 'Edit Product' : 'Add New Product'}</h3>
                 <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Name (English)" required value={currentProduct.name} onChange={(e: any) => handleInputChange('name', e.target.value)} />
                    <Input label="Name (Myanmar)" value={currentProduct.myanmarName} onChange={(e: any) => handleInputChange('myanmarName', e.target.value)} />
                    <Input label="SKU / Barcode" value={currentProduct.sku} onChange={(e: any) => handleInputChange('sku', e.target.value)} />
                    
                    {/* Category Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                                value={currentProduct.category} 
                                onChange={(e) => handleInputChange('category', e.target.value)}>
                            <option value="Medicine">Medicine</option>
                            <option value="Supplement">Supplement</option>
                            <option value="Equipment">Equipment</option>
                        </select>
                    </div>

                    {/* Unit Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Unit Type</label>
                        <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                                value={currentProduct.unit} 
                                onChange={(e) => handleInputChange('unit', e.target.value)}>
                            {UNIT_OPTIONS.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>

                    <Input label="Min Stock Level" type="number" value={currentProduct.minStock} onChange={(e: any) => handleInputChange('minStock', e.target.value)} />
                    <Input label="Price" type="number" required value={currentProduct.price} onChange={(e: any) => handleInputChange('price', e.target.value)} />
                 </div>

                 {/* Description */}
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                        className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                        rows={3}
                        value={currentProduct.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                    ></textarea>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                   <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                   <Button variant="primary" onClick={handleSave}>
                      <Save size={18} className="mr-2"/> {isEditMode ? 'Update' : 'Save'}
                   </Button>
              </div>
           </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-2xl p-6 text-center">
                <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
                <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;