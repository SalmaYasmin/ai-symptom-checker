import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  experience: {
    position: string;
    hospital: string;
    startYear: number;
    endYear?: number;
  }[];
  availability: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  specialization: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  education: [{
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: Number, required: true }
  }],
  experience: [{
    position: { type: String, required: true },
    hospital: { type: String, required: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number }
  }],
  availability: [{
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  }]
}, {
  timestamps: true
});

const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);
export default Doctor; 