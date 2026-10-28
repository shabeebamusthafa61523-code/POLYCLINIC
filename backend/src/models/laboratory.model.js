import mongoose from 'mongoose';

const laboratorySchema = new mongoose.Schema({
  labTestNo: {
    type: String,
    required: true,
    unique: true
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
  doctorName: { type: String, default: '' },
  testName: { type: String, required: true },
  category: { type: String, default: 'General Pathology' },
  status: {
    type: String,
    enum: ['Requested', 'Sample Collected', 'Processing', 'Completed'],
    default: 'Requested'
  },
  cost: { type: Number, default: 0 },
  sampleCollectedAt: { type: Date },
  resultNotes: { type: String, default: '' },
  reportUrl: { type: String, default: '' },
  requestDate: { type: Date, default: Date.now },
  completedDate: { type: Date }
}, { timestamps: true });

export default mongoose.model('Laboratory', laboratorySchema);
