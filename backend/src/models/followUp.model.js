import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    set: v => (v && mongoose.isValidObjectId(v) ? v : null)
  },
  doctorName: { type: String, default: '' },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null,
    set: v => (v && mongoose.isValidObjectId(v) ? v : null)
  },
  followUpDate: { type: Date, required: true },
  purpose: { type: String, default: 'General Follow-up Consultation' },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  reminderSent: { type: Boolean, default: false },
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('FollowUp', followUpSchema);
