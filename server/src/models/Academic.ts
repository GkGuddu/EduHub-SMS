import mongoose, { Schema, Document } from 'mongoose';

export interface IAcademicYearDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicYearSchema = new Schema<IAcademicYearDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

AcademicYearSchema.index({ schoolId: 1, name: 1 }, { unique: true });
AcademicYearSchema.index({ schoolId: 1, isCurrent: 1 });

export const AcademicYear = mongoose.model<IAcademicYearDoc>(
  'AcademicYear',
  AcademicYearSchema
);

export interface IClassSectionDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  section: string;
  roomNumber?: string;
  classTeacherId?: mongoose.Types.ObjectId;
  academicYearId?: mongoose.Types.ObjectId;
  academicYear: string;
  capacity: number;
}

const ClassSectionSchema = new Schema<IClassSectionDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    section: { type: String, required: true, uppercase: true, trim: true },
    roomNumber: { type: String, trim: true },
    classTeacherId: { type: Schema.Types.ObjectId, ref: 'User' },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear' },
    academicYear: { type: String, required: true, default: '2025-2026' },
    capacity: { type: Number, default: 40 },
  },
  { timestamps: true }
);

ClassSectionSchema.index(
  { schoolId: 1, name: 1, section: 1, academicYear: 1 },
  { unique: true }
);

export const ClassSection = mongoose.model<IClassSectionDoc>(
  'ClassSection',
  ClassSectionSchema
);

export interface ISubjectDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  type: 'core' | 'elective' | 'extracurricular';
  credits: number;
}

const SubjectSchema = new Schema<ISubjectDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['core', 'elective', 'extracurricular'],
      default: 'core',
    },
    credits: { type: Number, default: 3, min: 0 },
  },
  { timestamps: true }
);

SubjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export const Subject = mongoose.model<ISubjectDoc>('Subject', SubjectSchema);

export interface IClassSubjectAssignmentDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  classSectionId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
}

const ClassSubjectAssignmentSchema = new Schema<IClassSubjectAssignmentDoc>(
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
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

ClassSubjectAssignmentSchema.index(
  { schoolId: 1, classSectionId: 1, subjectId: 1, teacherId: 1 },
  { unique: true }
);

export const ClassSubjectAssignment =
  mongoose.model<IClassSubjectAssignmentDoc>(
    'ClassSubjectAssignment',
    ClassSubjectAssignmentSchema
  );

export interface ISchoolCalendarEventDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  academicYearId?: mongoose.Types.ObjectId;
  title: string;
  eventType: 'holiday' | 'event' | 'meeting' | 'exam' | 'other';
  startDate: string;
  endDate: string;
  isHoliday: boolean;
  description?: string;
  targetAudience: 'all' | 'teachers' | 'students' | 'parents';
}

const SchoolCalendarEventSchema = new Schema<ISchoolCalendarEventDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear' },
    title: { type: String, required: true, trim: true },
    eventType: {
      type: String,
      enum: ['holiday', 'event', 'meeting', 'exam', 'other'],
      default: 'event',
      index: true,
    },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    isHoliday: { type: Boolean, default: false },
    description: { type: String },
    targetAudience: {
      type: String,
      enum: ['all', 'teachers', 'students', 'parents'],
      default: 'all',
    },
  },
  { timestamps: true }
);

SchoolCalendarEventSchema.index({ schoolId: 1, startDate: 1 });

export const SchoolCalendarEvent = mongoose.model<ISchoolCalendarEventDoc>(
  'SchoolCalendarEvent',
  SchoolCalendarEventSchema
);
