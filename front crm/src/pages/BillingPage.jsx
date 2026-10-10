import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DollarSign, Plus, Printer, CheckCircle2, FileText, Trash2, CreditCard, Search, RefreshCw, Zap, X } from 'lucide-react';
import { polyclinicService } from '../services/polyclinicService';
import ConfirmationModal from '../components/ConfirmationModal';

export default function BillingPage() {
  const [patients, setPatients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingActivity, setFetchingActivity] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [autoFetchNotice, setAutoFetchNotice] = useState('');

  // New Invoice State
  const [selectedPatient, setSelectedPatient] = useState('');
  const [items, setItems] = useState([
    { description: 'General Doctor Consultation Fee', category: 'Consultation', qty: 1, unitPrice: 600, amount: 600 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(600);
  const [paymentMode, setPaymentMode] = useState('UPI');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const patRes = await polyclinicService.getPatients();
      if (patRes.success) setPatients(patRes.patients);

      const invRes = await polyclinicService.getInvoices();
      if (invRes.success) setInvoices(invRes.invoices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (patientId) => {
    setSelectedPatient(patientId);
    setAutoFetchNotice('');
    if (!patientId) {
      setItems([{ description: 'General Doctor Consultation Fee', category: 'Consultation', qty: 1, unitPrice: 600, amount: 600 }]);
      setPaidAmount(600);
      return;
    }

    try {
      setFetchingActivity(true);
      const res = await polyclinicService.getPatientById(patientId);
      if (res.success && res.history) {
        const fetchedItems = [];
        const { appointments, labTests, prescriptions } = res.history;

        // 1. Doctor Consultations
        if (appointments && appointments.length > 0) {
          appointments.forEach(appt => {
            fetchedItems.push({
              description: `Doctor Consultation - ${appt.doctorName || 'General Consultation'} (${new Date(appt.date).toLocaleDateString()})`,
              category: 'Consultation',
              qty: 1,
              unitPrice: appt.consultationFee || 600,
              amount: appt.consultationFee || 600
            });
          });
        }

        // 2. Laboratory & Diagnostic Tests
        if (labTests && labTests.length > 0) {
          labTests.forEach(test => {
            fetchedItems.push({
              description: `Lab Test: ${test.testName} [${test.category || 'Pathology'}]`,
              category: 'Laboratory',
              qty: 1,
              unitPrice: test.cost || 500,
              amount: test.cost || 500
            });
          });
        }

        // 3. Prescribed Medicines / Pharmacy
        if (prescriptions && prescriptions.length > 0) {
          prescriptions.forEach(rx => {
            (rx.medicines || []).forEach(med => {
              fetchedItems.push({
                description: `Pharmacy Rx: ${med.name} (${med.dosage || '1 tab'} - ${med.duration || '5 Days'})`,
                category: 'Pharmacy',
                qty: 1,
                unitPrice: 100,
                amount: 100
              });
            });
          });
        }

        if (fetchedItems.length > 0) {
          setItems(fetchedItems);
          const totalCalc = fetchedItems.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
          setPaidAmount(totalCalc);
          setAutoFetchNotice(`⚡ Auto-fetched ${fetchedItems.length} bill item(s) from patient's consultations, lab tests & prescriptions!`);
        } else {
          setItems([{ description: 'General Doctor Consultation Fee', category: 'Consultation', qty: 1, unitPrice: 600, amount: 600 }]);
          setPaidAmount(600);
          setAutoFetchNotice('No previous unbilled procedures found. Added default consultation fee.');
        }
      }
    } catch (err) {
      console.error('Error fetching patient activity:', err);
    } finally {
      setFetchingActivity(false);
    }
  };

  const addItemRow = () => {
    setItems([...items, { description: '', category: 'Laboratory', qty: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    if (field === 'qty' || field === 'unitPrice') {
      const q = Number(field === 'qty' ? val : updated[idx].qty) || 1;
      const u = Number(field === 'unitPrice' ? val : updated[idx].unitPrice) || 0;
      updated[idx].amount = q * u;
    }
    setItems(updated);
  };

  const totalAmount = items.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const netAmount = totalAmount - (Number(discount) || 0);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setConfirmModal({
        isOpen: true,
        title: 'Patient Required',
        message: 'Please select a patient before generating an invoice.',
        confirmText: 'OK',
        variant: 'warning',
        onConfirm: () => {}
      });
      return;
    }

    const patObj = patients.find(p => p._id === selectedPatient);

    try {
      const res = await polyclinicService.createInvoice({
        patient: selectedPatient,
        patientName: patObj?.name || 'Patient',
        items,
        discount: Number(discount) || 0,
        paidAmount: Number(paidAmount) || 0,
        paymentMode
      });

      if (res.success) {
        setShowModal(false);
        setSelectedPatient('');
        setItems([{ description: 'General Doctor Consultation Fee', category: 'Consultation', qty: 1, unitPrice: 600, amount: 600 }]);
        fetchData();
        setConfirmModal({
          isOpen: true,
          title: 'Invoice Created Successfully',
          message: `Invoice ${res.invoice?.invoiceNo} generated for ${patObj?.name} with Net Amount ₹${netAmount}.`,
          confirmText: 'Great!',
          variant: 'success',
          onConfirm: () => {}
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handlePrintInvoice = (inv) => {
    window.print();
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" /> Billing & Invoicing
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Consolidated invoices with auto-fetched consultation fees, lab tests, and prescribed medicines.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-sm transition text-xs"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
            <thead className="uppercase bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Invoice No</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Net Amount</th>
                <th className="py-3.5 px-4">Paid / Pending</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">No invoices generated.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">{inv.invoiceNo}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{inv.patientName}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(inv.date || inv.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">₹{inv.netAmount || inv.totalAmount}</td>
                    <td className="py-3.5 px-4 font-semibold">
                      <span className="text-emerald-600 dark:text-emerald-400">Paid: ₹{inv.paidAmount}</span>
                      {inv.pendingAmount > 0 && <span className="text-rose-500 ml-2">Pending: ₹{inv.pendingAmount}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">{inv.paymentMode || 'Cash'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900/40' :
                        inv.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900/40' :
                        'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900/40'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handlePrintInvoice(inv)}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-200 transition"
                        title="Print Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Invoice */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl max-w-2xl w-full shadow-2xl my-auto max-h-[90vh] flex flex-col p-5 sm:p-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4.5 h-4.5 text-emerald-500" /> Create Patient Invoice
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generate healthcare billing invoice, auto-fetch patient charges & record payments.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateInvoice} className="flex flex-col flex-1 min-h-0 overflow-hidden pt-4">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Patient *</label>
                  <select
                    required
                    value={selectedPatient}
                    onChange={(e) => handlePatientSelect(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- Select Patient to Auto-Fetch Bill Items --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {p.name} ({p.phone}) - {p.patientId}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto Fetch Indicator Notice */}
                {fetchingActivity && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-900/50">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Auto-fetching patient consultations, lab test orders & prescriptions...
                  </div>
                )}

                {autoFetchNotice && !fetchingActivity && (
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl flex items-center gap-2 border border-emerald-200/60 dark:border-emerald-900/30">
                    <Zap className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>{autoFetchNotice}</span>
                  </div>
                )}

                {/* Bill Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Bill Items ({items.length})
                    </label>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Manual Item
                    </button>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-6 gap-2 items-center text-xs">
                      <div className="sm:col-span-2">
                        <label className="block sm:hidden text-[10px] text-slate-400 font-semibold mb-0.5">Item Description</label>
                        <input
                          type="text"
                          placeholder="Description (e.g. Doctor Consultation)"
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          required
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block sm:hidden text-[10px] text-slate-400 font-semibold mb-0.5">Category</label>
                        <select
                          value={item.category}
                          onChange={(e) => updateItem(idx, 'category', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white text-xs font-medium"
                        >
                          <option value="Consultation" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Consultation</option>
                          <option value="Laboratory" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Laboratory</option>
                          <option value="Pharmacy" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pharmacy</option>
                          <option value="Procedure" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Procedure</option>
                        </select>
                      </div>
                      <div>
                        <label className="block sm:hidden text-[10px] text-slate-400 font-semibold mb-0.5">Qty</label>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block sm:hidden text-[10px] text-slate-400 font-semibold mb-0.5">Price (₹)</label>
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span className="text-emerald-600 dark:text-emerald-400">₹{item.amount}</span>
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItemRow(idx)} className="text-rose-500 hover:text-rose-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-2 text-xs border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{totalAmount}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span>Discount (₹):</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-right text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-between font-black text-sm text-emerald-600 dark:text-emerald-400 border-t border-slate-200/60 dark:border-slate-800 pt-2">
                    <span>Net Payable Amount:</span>
                    <span>₹{netAmount}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Paid Amount (₹)</label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="UPI" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">UPI</option>
                      <option value="Cash" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Cash</option>
                      <option value="Card" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Card</option>
                      <option value="Bank Transfer" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Bank Transfer</option>
                    </select>
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
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
