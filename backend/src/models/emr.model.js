import mongoose from 'mongoose';

const emrSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null,
    set: v => (v && mongoose.isValidObjectId(v) ? v : null)
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    set: v => (v && mongoose.isValidObjectId(v) ? v : null)
  },
  doctorName: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  symptoms: { type: String, default: '' },
  vitals: {
    bp: { type: String, default: '' },
    pulse: { type: String, default: '' },
    temp: { type: String, default: '' },
    weight: { type: String, default: '' },
    spo2: { type: String, default: '' }
  },
  allergies: { type: String, default: '' },
  medicalHistory: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  treatmentPlan: { type: String, default: '' },
  consultationNotes: { type: String, default: '' },
  followUpDate: { type: Date },
  attachments: [{
    name: { type: String },
    url: { type: String }
  }]
}, { timestamps: true });

export default mongoose.model('EMR', emrSchema);
