import mongoose, { Schema, Document } from 'mongoose';
import { AttendanceStatus, UserRole } from '@eduhub/shared';

export interface IStudentDocumentDoc {
  _id?: mongoose.Types.ObjectId;
  title: string;
  docType:
    | 'birth_certificate'
    | 'transfer_certificate'
    | 'id_proof'
    | 'medical_record'
    | 'previous_marksheet'
    | 'other';
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  publicId?: string;
  resourceType?: string;
  uploadedBy?: string;
  uploadedAt: Date;
}

export interface IEnrollmentRecordDoc {
  academicYear: string;
  classSectionId: mongoose.Types.ObjectId;
  className: string;
  section: string;
  rollNumber: string;
  enrolledAt: Date;
  status: 'active' | 'promoted' | 'graduated' | 'transferred' | 'archived';
}

export interface IStudentProfileDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  admissionNumber: string;
  rollNumber: string;
  name: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: Date;
  bloodGroup?: string;
  classSectionId: mongoose.Types.ObjectId;
  parentIds: mongoose.Types.ObjectId[];
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  parentRelationship?: 'father' | 'mother' | 'guardian';
  address?: string;
  emergencyContact?: string;
  status: 'active' | 'inactive' | 'transferred' | 'archived';
  photo?: string;
  photoPublicId?: string;
  documents: IStudentDocumentDoc[];
  enrollmentHistory: IEnrollmentRecordDoc[];
}

const StudentProfileSchema = new Schema<IStudentProfileDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    admissionNumber: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    dateOfBirth: { type: Date, required: true },
    bloodGroup: { type: String },
    classSectionId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSection',
      required: true,
      index: true,
    },
    parentIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    parentName: { type: String },
    parentEmail: { type: String },
    parentPhone: { type: String },
    parentRelationship: {
      type: String,
      enum: ['father', 'mother', 'guardian'],
    },
    address: { type: String },
    emergencyContact: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive', 'transferred', 'archived'],
      default: 'active',
      index: true,
    },
    photo: { type: String },
    photoPublicId: { type: String },
    documents: [
      {
        title: { type: String, required: true },
        docType: {
          type: String,
          enum: [
            'birth_certificate',
            'transfer_certificate',
            'id_proof',
            'medical_record',
            'previous_marksheet',
            'other',
          ],
          default: 'other',
        },
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        fileSize: { type: Number },
        publicId: { type: String },
        resourceType: { type: String, default: 'raw' },
        uploadedBy: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    enrollmentHistory: [
      {
        academicYear: { type: String, required: true },
        classSectionId: {
          type: Schema.Types.ObjectId,
          ref: 'ClassSection',
          required: true,
        },
        className: { type: String, required: true },
        section: { type: String, required: true },
        rollNumber: { type: String, required: true },
        enrolledAt: { type: Date, default: Date.now },
        status: { type: String, default: 'active' },
      },
    ],
  },
  { timestamps: true }
);

StudentProfileSchema.index(
  { schoolId: 1, admissionNumber: 1 },
  { unique: true }
);
StudentProfileSchema.index({ schoolId: 1, classSectionId: 1, rollNumber: 1 });

export const StudentProfile = mongoose.model<IStudentProfileDoc>(
  'StudentProfile',
  StudentProfileSchema
);

export interface ITeacherProfileDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  gender: 'male' | 'female' | 'other';
  qualification: string;
  specialization: string;
  experienceYears?: number;
  joiningDate: Date;
  permissionsUpdatedAt?: Date;
  permissionsUpdatedByName?: string;
  status: 'active' | 'on_leave' | 'terminated' | 'archived';
  photo?: string;
  photoPublicId?: string;
}

const TeacherProfileSchema = new Schema<ITeacherProfileDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    qualification: { type: String, required: true },
    specialization: { type: String, required: true },
    experienceYears: { type: Number, default: 0 },
    joiningDate: { type: Date, required: true },
    permissionsUpdatedAt: { type: Date },
    permissionsUpdatedByName: { type: String },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'terminated', 'archived'],
      default: 'active',
    },
    photo: { type: String },
    photoPublicId: { type: String },
  },
  { timestamps: true }
);

TeacherProfileSchema.index({ schoolId: 1, employeeId: 1 }, { unique: true });

export const TeacherProfile = mongoose.model<ITeacherProfileDoc>(
  'TeacherProfile',
  TeacherProfileSchema
);

export interface IParentProfileDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  relationship: 'father' | 'mother' | 'guardian';
  occupation?: string;
  address?: string;
  photo?: string;
  photoPublicId?: string;
  linkedStudentUserIds: mongoose.Types.ObjectId[];
}

const ParentProfileSchema = new Schema<IParentProfileDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    relationship: {
      type: String,
      enum: ['father', 'mother', 'guardian'],
      default: 'guardian',
    },
    occupation: { type: String },
    address: { type: String },
    photo: { type: String },
    photoPublicId: { type: String },
    linkedStudentUserIds: [
      { type: Schema.Types.ObjectId, ref: 'User', index: true },
    ],
  },
  { timestamps: true }
);

export const ParentProfile = mongoose.model<IParentProfileDoc>(
  'ParentProfile',
  ParentProfileSchema
);

export interface IAttendanceItemDoc {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface IAttendanceRecordDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  classSectionId: mongoose.Types.ObjectId;
  academicYearId?: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  date: string;
  records: IAttendanceItemDoc[];
  notifiedStudentIds: mongoose.Types.ObjectId[];
  takenById: mongoose.Types.ObjectId;
  takenByName: string;
  takenByRole: UserRole;
  isEdited: boolean;
  editHistory: Array<{
    editedBy: string;
    editedAt: Date;
    previousRecordsCount: number;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceItemSchema = new Schema<IAttendanceItemDoc>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'leave'],
      required: true,
    },
    remarks: { type: String },
  },
  { _id: false }
);

const AttendanceRecordSchema = new Schema<IAttendanceRecordDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    classSectionId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSection',
      required: true,
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    date: { type: String, required: true, index: true },
    records: [AttendanceItemSchema],
    notifiedStudentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    takenById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    takenByName: { type: String, required: true },
    takenByRole: { type: String, required: true },
    isEdited: { type: Boolean, default: false },
    editHistory: [
      {
        editedBy: { type: String, required: true },
        editedAt: { type: Date, default: Date.now },
        previousRecordsCount: { type: Number },
        reason: { type: String },
      },
    ],
  },
  { timestamps: true }
);

AttendanceRecordSchema.index(
  { schoolId: 1, classSectionId: 1, date: 1, academicYearId: 1 },
  { unique: true }
);

export const AttendanceRecord = mongoose.model<IAttendanceRecordDoc>(
  'AttendanceRecord',
  AttendanceRecordSchema
);
