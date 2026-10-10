import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pill, Plus, AlertTriangle, Search, PackageCheck, Layers, Calendar, Truck, X } from 'lucide-react';
import { polyclinicService } from '../services/polyclinicService';

export default function PharmacyInventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Medicine',
    batchNumber: 'BATCH-001',
    quantity: 50,
    minStockLevel: 10,
    purchasePrice: 10,
    sellingPrice: 25,
    supplier: 'General Supplier',
    location: 'Shelf A'
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await polyclinicService.getPharmacyItems();
      if (res.success) setItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const count = items.length;
      const itemCode = `MED-${101 + count}`;
      const res = await polyclinicService.createPharmacyItem({
        ...newItem,
        itemCode,
        quantity: Number(newItem.quantity),
        purchasePrice: Number(newItem.purchasePrice),
        sellingPrice: Number(newItem.sellingPrice)
      });
      if (res.success) {
        setShowModal(false);
        setNewItem({
          name: '',
          category: 'Medicine',
          batchNumber: 'BATCH-001',
          quantity: 50,
          minStockLevel: 10,
          purchasePrice: 10,
          sellingPrice: 25,
          supplier: 'General Supplier',
          location: 'Shelf A'
        });
        fetchItems();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.itemCode && i.itemCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockItems = items.filter(i => i.quantity <= i.minStockLevel);

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-500" /> Pharmacy & Clinic Supplies Inventory
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Medicine stock management, clinic consumables (gloves, syringes, masks), batch tracking, and low-stock warnings.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-sm transition text-xs"
        >
          <Plus className="w-4 h-4" /> Add Inventory Item
        </button>
      </div>

      {/* Low Stock Highlight Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 p-4 rounded-2xl flex items-center justify-between text-rose-900 dark:text-rose-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-xs">Low Stock Warning ({lowStockItems.length} items below minimum reorder threshold)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{lowStockItems.map(i => i.name).join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="flex items-center gap-3 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 p-3 rounded-2xl shadow-sm">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search by Medicine Name or Item Code (e.g. Paracetamol)..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
            <thead className="uppercase bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Item Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Batch No</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Buy Price</th>
                <th className="py-3.5 px-4">Sell Price</th>
                <th className="py-3.5 px-4">Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">Loading pharmacy inventory...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">No inventory items found.</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{item.itemCode || 'MED'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{item.name}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-400">{item.category}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{item.batchNumber || 'BATCH-001'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.quantity <= item.minStockLevel 
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                      }`}>
                        {item.quantity} Units
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">₹{item.purchasePrice}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹{item.sellingPrice}</td>
                    <td className="py-3.5 px-4 text-slate-400">{item.supplier}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl max-w-lg w-full shadow-2xl my-auto max-h-[90vh] flex flex-col p-5 sm:p-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Pill className="w-4.5 h-4.5 text-emerald-500" /> Add Pharmacy / Supply Item
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Register new medicine stock, supplies, batch number, and pricing details.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateItem} className="flex flex-col flex-1 min-h-0 overflow-hidden pt-4">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin 500mg or Surgical Gloves Box"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Medicine" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Medicine</option>
                      <option value="Consumable" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Consumable</option>
                      <option value="Equipment" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Equipment</option>
                      <option value="Supplies" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Supplies</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={newItem.batchNumber}
                      onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={newItem.sellingPrice}
                      onChange={(e) => setNewItem({ ...newItem, sellingPrice: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 shrink-0 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition shadow-md shadow-emerald-500/20"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
