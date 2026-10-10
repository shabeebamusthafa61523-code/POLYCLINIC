import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Stethoscope, CheckCircle2, User, Plus, Search, Filter, Phone, MessageSquare, AlertCircle, X } from 'lucide-react';
import { polyclinicService } from '../services/polyclinicService';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  // Book Appointment Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [apptData, setApptData] = useState({
    doctor: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 10:30 AM',
    consultationFee: 600,
    notes: ''
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
    fetchAppointments();
    fetchPatientsAndDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await polyclinicService.getAppointments();
      if (res.success) {
        setAppointments(res.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientsAndDoctors = async () => {
    try {
      const pRes = await polyclinicService.getPatients();
      if (pRes.success) setPatients(pRes.patients);

      const dRes = await polyclinicService.getDoctors();
      if (dRes.success && dRes.doctors.length > 0) {
        setDoctors(dRes.doctors);
        const firstDoc = dRes.doctors[0];
        setApptData(prev => ({
          ...prev,
          doctor: firstDoc.doctor?._id || firstDoc._id,
          consultationFee: firstDoc.consultationFee || 600
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDoctorChange = (docId) => {
    const doc = doctors.find(d => (d.doctor?._id || d._id) === docId);
    setApptData({
      ...apptData,
      doctor: docId,
      consultationFee: doc?.consultationFee || 600
    });
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setConfirmModal({
        isOpen: true,
        title: 'Patient Required',
        message: 'Please select a patient to book an appointment.',
        confirmText: 'OK',
        variant: 'warning',
        onConfirm: () => {}
      });
      return;
    }

    const patient = patients.find(p => p._id === selectedPatientId);
    const selectedDoc = doctors.find(d => (d.doctor?._id || d._id) === apptData.doctor);

    try {
      const res = await polyclinicService.createAppointment({
        patient: selectedPatientId,
        patientName: patient?.name,
        patientPhone: patient?.phone,
        doctor: apptData.doctor,
        doctorName: selectedDoc?.doctorName || 'Dr. General',
        specialization: selectedDoc?.specialization || 'General Medicine',
        date: apptData.date,
        timeSlot: apptData.timeSlot,
        consultationFee: Number(apptData.consultationFee) || 600,
        notes: apptData.notes,
        status: 'Scheduled'
      });

      if (res.success) {
        setShowBookModal(false);
        setSelectedPatientId('');
        fetchAppointments();
        setConfirmModal({
          isOpen: true,
          title: 'Appointment Confirmed',
          message: `Appointment ${res.appointment?.appointmentNo} (Token #${res.appointment?.tokenNumber}) successfully scheduled for ${patient?.name}.`,
          confirmText: 'Great!',
          variant: 'success',
          onConfirm: () => {}
        });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setConfirmModal({
        isOpen: true,
        title: 'Booking Blocked',
        message: errorMsg,
        confirmText: 'I Understand',
        variant: 'danger',
        onConfirm: () => {}
      });
    }
  };

  const requestStatusChange = (appt, newStatus) => {
    setConfirmModal({
      isOpen: true,
      title: `Update Appointment Status`,
      message: `Are you sure you want to change status of ${appt.patientName} (Token #${appt.tokenNumber || 1}) to "${newStatus}"?`,
      confirmText: `Change to ${newStatus}`,
      variant: newStatus === 'Completed' ? 'success' : 'warning',
      onConfirm: async () => {
        try {
          const res = await polyclinicService.updateAppointmentStatus(appt._id, newStatus);
          if (res.success) fetchAppointments();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  };

  const requestReminder = (appt) => {
    setConfirmModal({
      isOpen: true,
      title: `Send WhatsApp Reminder`,
      message: `Send WhatsApp appointment reminder to ${appt.patientName} (${appt.patientPhone}) for ${appt.timeSlot} with ${appt.doctorName}?`,
      confirmText: `Send WhatsApp Reminder`,
      variant: 'primary',
      onConfirm: () => {}
    });
  };

  const filteredAppointments = appointments.filter(a => {
    if (filterStatus === 'All') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" /> Appointments & Slot Scheduling
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Doctor availability, slot limits (1 active appointment per patient), status flow & instant reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowBookModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-sm transition text-xs"
          >
            <Plus className="w-4 h-4" /> Book Appointment
          </button>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-800/80">
            {['All', 'Scheduled', 'Checked-In', 'In-Consultation', 'Completed', 'Cancelled'].map((status) => (
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

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">Loading appointments...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">No appointments found for selected filter.</div>
        ) : (
          filteredAppointments.map((appt) => (
            <div key={appt._id} className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                    TOKEN #{appt.tokenNumber || 1}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    appt.status === 'Checked-In' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50' :
                    appt.status === 'In-Consultation' ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50' :
                    appt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50' :
                    appt.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50' :
                    'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}>
                    {appt.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{appt.patientName}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {appt.patientPhone}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Doctor:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{appt.doctorName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Slot:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{appt.timeSlot}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Fee:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{appt.consultationFee}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => requestReminder(appt)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition border border-emerald-200/50 dark:border-emerald-900/30"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Reminder
                </button>

                {appt.status === 'Scheduled' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => requestStatusChange(appt, 'Checked-In')}
                      className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl transition"
                    >
                      Check In
                    </button>
                    <button
                      onClick={() => requestStatusChange(appt, 'Cancelled')}
                      className="text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2 py-1.5 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {appt.status === 'Checked-In' && (
                  <button
                    onClick={() => requestStatusChange(appt, 'In-Consultation')}
                    className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl transition"
                  >
                    Consult Doctor
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Book Appointment */}
      {showBookModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl max-w-md w-full shadow-2xl my-auto max-h-[90vh] flex flex-col p-5 sm:p-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" /> Book New Appointment
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Only 1 active appointment permitted per patient. Completed or cancelled appointments unlock new slots.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleBookSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden pt-4">
              <div className="overflow-y-auto pr-1 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Patient *</label>
                  <select 
                    required
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="">-- Choose Registered Patient --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {p.name} ({p.phone}) - {p.patientId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Doctor *</label>
                  <select 
                    value={apptData.doctor}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    {doctors.map(d => (
                      <option key={d._id} value={d.doctor?._id || d._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {d.doctorName} ({d.specialization}) - ₹{d.consultationFee}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Appointment Date *</label>
                    <input 
                      type="date" 
                      required
                      value={apptData.date}
                      onChange={(e) => setApptData({ ...apptData, date: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Time Slot</label>
                    <select 
                      value={apptData.timeSlot}
                      onChange={(e) => setApptData({ ...apptData, timeSlot: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="09:00 AM - 09:30 AM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">09:00 AM - 09:30 AM</option>
                      <option value="10:00 AM - 10:30 AM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">10:00 AM - 10:30 AM</option>
                      <option value="11:00 AM - 11:30 AM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">11:00 AM - 11:30 AM</option>
                      <option value="04:00 PM - 04:30 PM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">04:00 PM - 04:30 PM</option>
                      <option value="05:00 PM - 05:30 PM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">05:00 PM - 05:30 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Consultation Fee (₹)</label>
                  <input 
                    type="number"
                    value={apptData.consultationFee}
                    onChange={(e) => setApptData({ ...apptData, consultationFee: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 shrink-0 mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition shadow-md shadow-emerald-500/20"
                >
                  Confirm Booking
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
