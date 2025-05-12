import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: 'consultation' | 'follow-up' | 'lab-result' | 'prescription' | 'other';
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['consultation', 'follow-up', 'lab-result', 'prescription', 'other'],
    required: true 
  },
  attachments: [{ type: String }]
}, {
  timestamps: true
});

// Create indexes for faster queries
NoteSchema.index({ patientId: 1 });
NoteSchema.index({ doctorId: 1 });
NoteSchema.index({ createdAt: -1 });

export default mongoose.model<INote>('Note', NoteSchema); 