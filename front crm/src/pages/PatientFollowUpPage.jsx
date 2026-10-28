import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  User, 
  Stethoscope, 
  AlertCircle,
  FileText,
  X
} from 'lucide-react';
import { polyclinicService } from '../services/polyclinicService';
import ConfirmationModal from '../components/ConfirmationModal';

export default function PatientFollowUpPage() {
  const [followUps, setFollowUps] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);

  // Schedule New Follow-up Form
  const [scheduleForm, setScheduleForm] = useState({
    patient: '',
    patientName: '',
    patientPhone: '',
    doctor: '',
    doctorName: '',
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    purpose: 'Post-consultation recovery check-up',
    notes: '',
    status: 'Pending'
  });

  // Edit Follow-up Form
  const [editForm, setEditForm] = useState({
    patientName: '',
    patientPhone: '',
    doctor: '',
    doctorName: '',
    followUpDate: '',
    purpose: '',
    notes: '',
    status: 'Pending'
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
      const res = await polyclinicService.getFollowUps();
      if (res.success) setFollowUps(res.followUps);

      const pRes = await polyclinicService.getPatients();
      if (pRes.success) setPatients(pRes.patients);

      const dRes = await polyclinicService.getDoctors();
      if (dRes.success) setDoctors(dRes.doctors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setSelectedFollowUp(item);
    const dateFormatted = item.followUpDate ? new Date(item.followUpDate).toISOString().split('T')[0] : '';
    setEditForm({
      patientName: item.patientName || '',
      patientPhone: item.patientPhone || '',
      doctor: (item.doctor?._id || item.doctor || '') ? String(item.doctor?._id || item.doctor) : '',
      doctorName: item.doctorName || 'Dr. Rajesh Gupta',
      followUpDate: dateFormatted,
      purpose: item.purpose || '',
      notes: item.notes || '',
      status: item.status || 'Pending'
    });
    setShowEditModal(true);
  };

  // Save Edit Follow-Up
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!selectedFollowUp) return;

    setConfirmModal({
      isOpen: true,
      title: 'Update Follow-Up Details',
      message: `Save changes for ${editForm.patientName}'s follow-up scheduled on ${editForm.followUpDate}?`,
      confirmText: 'Save Changes',
      variant: 'primary',
      onConfirm: async () => {
        try {
          const payload = { ...editForm };
          if (!payload.doctor) delete payload.doctor;
          if (!payload.appointment) delete payload.appointment;
          const res = await polyclinicService.updateFollowUp(selectedFollowUp._id, payload);
          if (res.success) {
            setShowEditModal(false);
            setSelectedFollowUp(null);
            fetchData();
          }
        } catch (err) {
          alert(err.response?.data?.message || err.message);
        }
      }
    });
  };

  // Schedule New Follow-Up
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      let pName = scheduleForm.patientName;
      let pPhone = scheduleForm.patientPhone;
      let pId = scheduleForm.patient;

      if (scheduleForm.patient) {
        const p = patients.find(pat => pat._id === scheduleForm.patient);
        if (p) {
          pName = p.name;
          pPhone = p.phone;
          pId = p._id;
        }
      }

      const payload = {
        ...scheduleForm,
        patient: pId || patients[0]?._id,
        patientName: pName || 'Patient',
        patientPhone: pPhone || '+91 9876543210'
      };

      if (!payload.doctor) delete payload.doctor;
      if (!payload.appointment) delete payload.appointment;

      const res = await polyclinicService.createFollowUp(payload);

      if (res.success) {
        setShowScheduleModal(false);
        setScheduleForm({
          patient: '',
          patientName: '',
          patientPhone: '',
          doctor: '',
          doctorName: '',
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          purpose: 'Post-consultation recovery check-up',
          notes: '',
          status: 'Pending'
        });
        fetchData();
        setConfirmModal({
          isOpen: true,
          title: 'Follow-Up Scheduled',
          message: `Follow-up successfully scheduled for ${pName} on ${scheduleForm.followUpDate}.`,
          confirmText: 'Great!',
          variant: 'success',
          onConfirm: () => {}
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Mark Status Change
  const requestStatusChange = (item, newStatus) => {
    setConfirmModal({
      isOpen: true,
      title: `Update Follow-Up Status`,
      message: `Change follow-up status for ${item.patientName} to "${newStatus}"?`,
      confirmText: `Set to ${newStatus}`,
      variant: newStatus === 'Completed' ? 'success' : 'warning',
      onConfirm: async () => {
        try {
          const res = await polyclinicService.updateFollowUp(item._id, { status: newStatus });
          if (res.success) fetchData();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  };

  // Delete Follow-Up
  const requestDelete = (item) => {
    setConfirmModal({
      isOpen: true,
      title: `Remove Follow-Up Record`,
      message: `Are you sure you want to delete the follow-up record for ${item.patientName}?`,
      confirmText: `Delete Record`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await polyclinicService.deleteFollowUp(item._id);
          if (res.success) fetchData();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  };

  // Send WhatsApp Reminder
  const handleSendReminder = (item) => {
    setConfirmModal({
      isOpen: true,
      title: `Send WhatsApp Reminder`,
      message: `Send instant WhatsApp follow-up reminder to ${item.patientName} (${item.patientPhone}) for ${new Date(item.followUpDate).toLocaleDateString()}?`,
      confirmText: `Send WhatsApp Message`,
      variant: 'primary',
      onConfirm: () => {}
    });
  };

  const filteredFollowUps = followUps.filter(item => {
    const matchesSearch = 
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patientPhone.includes(searchTerm) ||
      (item.purpose && item.purpose.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.doctorName && item.doctorName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'All') return matchesSearch;
    return matchesSearch && item.status === filterStatus;
  });

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" /> Patient Follow-up & Care Plans
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Post-consultation follow-up reminders, clinical goals, therapy schedules, and edit options.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-sm transition text-xs"
          >
            <Plus className="w-4 h-4" /> Schedule Follow-Up
          </button>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-800/80">
            {['All', 'Pending', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterStatus === status 
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status}
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
          placeholder="Search follow-ups by patient name, phone, doctor, or purpose..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">Loading follow-ups...</div>
        ) : filteredFollowUps.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">No follow-up records found matching filter.</div>
        ) : (
          filteredFollowUps.map((item) => (
            <div key={item._id} className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
              <div className="space-y-3">
                {/* Status & Date Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    {new Date(item.followUpDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40' :
                    item.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40' :
                    'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                  }`}>
                    {item.status}
                  </span>
                </div>

                {/* Patient Details */}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{item.patientName}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {item.patientPhone}</p>
                </div>

                {/* Purpose & Doctor Box */}
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">{item.purpose}</p>
                  <p className="text-slate-400 text-[11px]">Doctor: <span className="font-medium text-slate-700 dark:text-slate-300">{item.doctorName || 'Dr. Rajesh Gupta'}</span></p>
                  {item.notes && (
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] italic pt-1 border-t border-slate-200/50 dark:border-slate-800">
                      "{item.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition border border-indigo-200/50 dark:border-indigo-900/30"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>

                  <button
                    onClick={() => handleSendReminder(item)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-xl hover:bg-emerald-100 transition border border-emerald-200/50 dark:border-emerald-900/30"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.status === 'Pending' && (
                    <button
                      onClick={() => requestStatusChange(item, 'Completed')}
                      className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3 py-1.5 rounded-xl transition"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => requestDelete(item)}
                    className="text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-xl transition"
                    title="Delete Follow-up"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal 1: Edit Follow-Up Details */}
      {showEditModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl my-auto max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4.5 h-4.5 text-indigo-500" /> Edit Follow-Up Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Modify schedule date, assigned doctor, follow-up purpose, status, and clinical notes.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col overflow-hidden pt-4">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Patient Name *</label>
                  <input 
                    type="text" 
                    required
                    value={editForm.patientName}
                    onChange={(e) => setEditForm({ ...editForm, patientName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Patient Phone *</label>
                    <input 
                      type="text" 
                      required
                      value={editForm.patientPhone}
                      onChange={(e) => setEditForm({ ...editForm, patientPhone: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Doctor</label>
                    {doctors && doctors.length > 0 ? (
                      <div className="space-y-1.5">
                        <select
                          value={editForm.doctor || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const doc = doctors.find(d => String(d.doctor?._id || d.doctor || d._id) === val);
                            setEditForm({
                              ...editForm,
                              doctor: val,
                              doctorName: doc ? (doc.doctorName || doc.doctor?.name || '') : editForm.doctorName
                            });
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="">-- Choose Doctor (Optional) --</option>
                          {doctors.map(d => {
                            const val = String(d.doctor?._id || d.doctor || d._id);
                            return (
                              <option key={d._id} value={val}>
                                {d.doctorName || d.doctor?.name || 'Doctor'} {d.specialization ? `(${d.specialization})` : ''}
                              </option>
                            );
                          })}
                        </select>
                        {!editForm.doctor && (
                          <input 
                            type="text" 
                            placeholder="Or enter doctor name manually"
                            value={editForm.doctorName}
                            onChange={(e) => setEditForm({ ...editForm, doctorName: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        )}
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="Dr. Rajesh Gupta"
                        value={editForm.doctorName}
                        onChange={(e) => setEditForm({ ...editForm, doctorName: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Follow-Up Date *</label>
                    <input 
                      type="date" 
                      required
                      value={editForm.followUpDate}
                      onChange={(e) => setEditForm({ ...editForm, followUpDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select 
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pending</option>
                      <option value="Completed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Completed</option>
                      <option value="Cancelled" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Purpose / Clinical Goal *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Blood pressure review, Post-op check"
                    value={editForm.purpose}
                    onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Clinical Notes</label>
                  <textarea 
                    rows="3"
                    placeholder="Additional instructions or notes for reception/nurses..."
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  ></textarea>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Schedule New Follow-Up */}
      {showScheduleModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl my-auto max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-emerald-500" /> Schedule New Follow-Up
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set reminders and care plan goals for post-consultation patient care.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowScheduleModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleScheduleSubmit} className="flex-1 flex flex-col overflow-hidden pt-4">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Patient *</label>
                  <select 
                    value={scheduleForm.patient}
                    onChange={(e) => {
                      const selectedPat = patients.find(p => p._id === e.target.value);
                      setScheduleForm({
                        ...scheduleForm,
                        patient: e.target.value,
                        patientName: selectedPat?.name || '',
                        patientPhone: selectedPat?.phone || ''
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- Choose Registered Patient --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {p.name} ({p.phone}) - {p.patientId}
                      </option>
                    ))}
                  </select>
                </div>

                {!scheduleForm.patient && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Patient Name *</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={scheduleForm.patientName}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, patientName: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Patient Phone *</label>
                      <input 
                        type="text"
                        required
                        placeholder="+91 9876543210"
                        value={scheduleForm.patientPhone}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, patientPhone: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Doctor Name</label>
                    {doctors && doctors.length > 0 ? (
                      <div className="space-y-1.5">
                        <select
                          value={scheduleForm.doctor || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const doc = doctors.find(d => String(d.doctor?._id || d.doctor || d._id) === val);
                            setScheduleForm({
                              ...scheduleForm,
                              doctor: val,
                              doctorName: doc ? (doc.doctorName || doc.doctor?.name || '') : scheduleForm.doctorName
                            });
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          <option value="">-- Choose Doctor (Optional) --</option>
                          {doctors.map(d => {
                            const val = String(d.doctor?._id || d.doctor || d._id);
                            return (
                              <option key={d._id} value={val}>
                                {d.doctorName || d.doctor?.name || 'Doctor'} {d.specialization ? `(${d.specialization})` : ''}
                              </option>
                            );
                          })}
                        </select>
                        {!scheduleForm.doctor && (
                          <input 
                            type="text"
                            placeholder="Or enter doctor name manually"
                            value={scheduleForm.doctorName}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, doctorName: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        )}
                      </div>
                    ) : (
                      <input 
                        type="text"
                        placeholder="Dr. Rajesh Gupta"
                        value={scheduleForm.doctorName}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, doctorName: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Follow-Up Date *</label>
                    <input 
                      type="date"
                      required
                      value={scheduleForm.followUpDate}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, followUpDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Purpose / Clinical Goal *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Post-viral recovery check-up"
                    value={scheduleForm.purpose}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, purpose: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Clinical Notes</label>
                  <textarea 
                    rows="3"
                    placeholder="Optional notes for follow-up..."
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  ></textarea>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" /> Confirm Schedule
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
