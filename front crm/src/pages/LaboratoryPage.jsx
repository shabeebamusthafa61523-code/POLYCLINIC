import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FlaskConical, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search, 
  Edit3, 
  Printer, 
  AlertCircle,
  X,
  Activity
} from 'lucide-react';
import { polyclinicService } from '../services/polyclinicService';
import ConfirmationModal from '../components/ConfirmationModal';

export default function LaboratoryPage() {
  const [patients, setPatients] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Modals state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  // New Lab Test Form State
  const [newTest, setNewTest] = useState({
    patient: '',
    testName: '',
    category: 'Pathology',
    cost: 500,
    resultNotes: '',
    status: 'Requested'
  });

  // Edit Result Form State
  const [resultForm, setResultForm] = useState({
    status: 'Completed',
    resultNotes: '',
    cost: 500
  });

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

      const labRes = await polyclinicService.getLabTests();
      if (labRes.success) setLabTests(labRes.labTests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!newTest.patient) {
      setConfirmModal({
        isOpen: true,
        title: 'Patient Required',
        message: 'Please select a patient to order a laboratory test.',
        confirmText: 'OK',
        variant: 'warning',
        onConfirm: () => {}
      });
      return;
    }

    const patObj = patients.find(p => p._id === newTest.patient);
    try {
      const res = await polyclinicService.createLabTest({
        ...newTest,
        patientName: patObj?.name || 'Patient',
        cost: Number(newTest.cost) || 500
      });
      if (res.success) {
        setShowOrderModal(false);
        setNewTest({ patient: '', testName: '', category: 'Pathology', cost: 500, resultNotes: '', status: 'Requested' });
        fetchData();
        setConfirmModal({
          isOpen: true,
          title: 'Lab Order Placed',
          message: `Diagnostic test "${res.labTest?.testName}" ordered for ${patObj?.name}.`,
          confirmText: 'Great!',
          variant: 'success',
          onConfirm: () => {}
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const openResultModal = (test) => {
    setSelectedTest(test);
    setResultForm({
      status: test.status || 'Completed',
      resultNotes: test.resultNotes || '',
      cost: test.cost || 500
    });
    setShowResultModal(true);
  };

  const handleSaveResult = (e) => {
    e.preventDefault();
    if (!selectedTest) return;

    setConfirmModal({
      isOpen: true,
      title: 'Update Test Result',
      message: `Save laboratory result notes and set status to "${resultForm.status}" for ${selectedTest.patientName}?`,
      confirmText: 'Save Result',
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await polyclinicService.updateLabTest(selectedTest._id, resultForm);
          if (res.success) {
            setShowResultModal(false);
            setSelectedTest(null);
            fetchData();
          }
        } catch (err) {
          alert(err.message);
        }
      }
    });
  };

  const handleStatusQuickChange = async (id, status) => {
    try {
      const res = await polyclinicService.updateLabTest(id, { status });
      if (res.success) fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredTests = labTests.filter(t => {
    const matchesSearch = 
      t.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.labTestNo && t.labTestNo.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterCategory === 'All') return matchesSearch;
    return matchesSearch && t.category === filterCategory;
  });

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-500" /> Laboratory & Diagnostics Management
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Test order requests, sample tracking, diagnostic results, and lab report generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowOrderModal(true)}
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm transition text-xs"
          >
            <Plus className="w-4 h-4" /> Order Lab Test
          </button>

          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-800/80">
            {['All', 'Pathology', 'Biochemistry', 'Radiology', 'Microbiology'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterCategory === cat 
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 p-3 rounded-2xl shadow-sm">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search by patient name, test name or Test ID (e.g. LAB-1001)..." 
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
                <th className="py-3.5 px-4">Test ID</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Test Name & Category</th>
                <th className="py-3.5 px-4">Fee (₹)</th>
                <th className="py-3.5 px-4">Workflow Status</th>
                <th className="py-3.5 px-4">Diagnostic Results</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">Loading diagnostic test orders...</td>
                </tr>
              ) : filteredTests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">No lab test orders found matching criteria.</td>
                </tr>
              ) : (
                filteredTests.map((test) => (
                  <tr key={test._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-cyan-600 dark:text-cyan-400">{test.labTestNo}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{test.patientName}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{test.testName}</div>
                      <div className="text-[11px] text-slate-400">{test.category}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹{test.cost}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={test.status}
                        onChange={(e) => handleStatusQuickChange(test._id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border border-transparent outline-none transition cursor-pointer ${
                          test.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          test.status === 'Processing' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300' :
                          test.status === 'Sample Collected' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        <option value="Requested">Requested</option>
                        <option value="Sample Collected">Sample Collected</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {test.resultNotes ? (
                        <p className="text-slate-700 dark:text-slate-300 font-medium truncate" title={test.resultNotes}>
                          {test.resultNotes}
                        </p>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Pending results entry...</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openResultModal(test)}
                        className="inline-flex items-center gap-1.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-semibold px-3 py-1.5 rounded-xl text-xs transition border border-cyan-200/80 dark:border-cyan-800/50"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Enter Results
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Order Laboratory Test (Full Viewport Centered & Visible) */}
      {showOrderModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative my-auto">
            
            {/* Header - Fixed Top */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FlaskConical className="w-4.5 h-4.5 text-cyan-500" /> Order Laboratory Test
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Request diagnostic tests, pathology orders, or lab investigations for a patient.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body - Scrollable */}
            <form onSubmit={handleCreateTest} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Patient *</label>
                  <select
                    required
                    value={newTest.patient}
                    onChange={(e) => setNewTest({ ...newTest, patient: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {p.name} ({p.phone}) - {p.patientId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Test Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Blood Count (CBC), HbA1c, Lipid Profile"
                    value={newTest.testName}
                    onChange={(e) => setNewTest({ ...newTest, testName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={newTest.category}
                      onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    >
                      <option value="Pathology" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pathology</option>
                      <option value="Biochemistry" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Biochemistry</option>
                      <option value="Radiology" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Radiology</option>
                      <option value="Microbiology" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Microbiology</option>
                      <option value="Hematology" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Hematology</option>
                      <option value="Immunology" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Immunology</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fee (₹)</label>
                    <input
                      type="number"
                      value={newTest.cost}
                      onChange={(e) => setNewTest({ ...newTest, cost: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Notes / Clinical Instructions</label>
                  <textarea
                    rows="3"
                    placeholder="Special instructions for lab technician (e.g. Fasting sample required)..."
                    value={newTest.resultNotes}
                    onChange={(e) => setNewTest({ ...newTest, resultNotes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Footer - Fixed Bottom */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0 rounded-b-3xl">
                <button 
                  type="button" 
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition shadow-md shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5" /> Confirm Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Enter / Edit Test Results (Full Viewport Centered & Visible) */}
      {showResultModal && selectedTest && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative my-auto">
            
            {/* Header - Fixed Top */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4.5 h-4.5 text-cyan-500" /> Diagnostic Test Findings & Report
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update test workflow status and diagnostic test observations.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowResultModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body - Scrollable */}
            <form onSubmit={handleSaveResult} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{selectedTest.labTestNo}</span>
                    <span className="font-semibold text-slate-400">{selectedTest.category}</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedTest.patientName}</p>
                  <p className="text-slate-500 text-xs">Test: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTest.testName}</span></p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Workflow Status</label>
                    <select
                      value={resultForm.status}
                      onChange={(e) => setResultForm({ ...resultForm, status: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    >
                      <option value="Requested" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Requested</option>
                      <option value="Sample Collected" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Sample Collected</option>
                      <option value="Processing" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Processing</option>
                      <option value="Completed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fee Amount (₹)</label>
                    <input
                      type="number"
                      value={resultForm.cost}
                      onChange={(e) => setResultForm({ ...resultForm, cost: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Diagnostic Findings & Result Notes *</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Enter detailed laboratory findings (e.g. Hemoglobin: 14.2 g/dL, WBC Count: 8,500 /uL. All parameters within normal limits)..."
                    value={resultForm.resultNotes}
                    onChange={(e) => setResultForm({ ...resultForm, resultNotes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  ></textarea>
                </div>
              </div>

              {/* Footer - Fixed Bottom */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0 rounded-b-3xl">
                <button 
                  type="button" 
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  Save Result Notes
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
