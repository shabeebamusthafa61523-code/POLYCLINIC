import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  prescriptionNo: {
    type: String,
    required: true,
    unique: true
  },
  emr: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EMR',
    default: null,
    set: v => (v && mongoose.isValidObjectId(v) ? v : null)
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientName: { type: String, required: true },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    set: v => (v && mongoose.isValidObjectId(v) ? v : null)
  },
  doctorName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, default: '1 tablet' },
    frequency: { type: String, default: '1-0-1' }, // Morning-Afternoon-Night
    duration: { type: String, default: '5 Days' },
    instructions: { type: String, default: 'After food' }
  }],
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Prescription', prescriptionSchema);
