import mongoose, { Schema, Document } from 'mongoose';

export interface IHomeworkDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  classSectionId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  assignedDate: string;
  dueDate: string;
  teacherId: mongoose.Types.ObjectId;
  maxMarks: number;
  status: 'draft' | 'published' | 'closed';
  aiHintsEnabled?: boolean;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    fileType?: string;
  }>;
  submissionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const HomeworkSchema = new Schema<IHomeworkDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    classSectionId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSection',
      required: true,
      index: true,
    },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    assignedDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    maxMarks: { type: Number, default: 100 },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'published',
      index: true,
    },
    aiHintsEnabled: { type: Boolean, default: true },
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number },
        fileType: { type: String },
      },
    ],
    submissionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Homework = mongoose.model<IHomeworkDoc>(
  'Homework',
  HomeworkSchema
);

export interface IHomeworkSubmissionDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  homeworkId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber: string;
  classSectionId: mongoose.Types.ObjectId;
  submissionText?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    fileType?: string;
  }>;
  submittedAt: Date;
  isLate: boolean;
  status: 'submitted' | 'graded';
  marksObtained?: number;
  feedback?: string;
  gradedAt?: Date;
  gradedById?: mongoose.Types.ObjectId;
  gradedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HomeworkSubmissionSchema = new Schema<IHomeworkSubmissionDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    homeworkId: {
      type: Schema.Types.ObjectId,
      ref: 'Homework',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    classSectionId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSection',
      required: true,
    },
    submissionText: { type: String },
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number },
        fileType: { type: String },
      },
    ],
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['submitted', 'graded'],
      default: 'submitted',
      index: true,
    },
    marksObtained: { type: Number },
    feedback: { type: String },
    gradedAt: { type: Date },
    gradedById: { type: Schema.Types.ObjectId, ref: 'User' },
    gradedByName: { type: String },
  },
  { timestamps: true }
);

HomeworkSubmissionSchema.index(
  { schoolId: 1, homeworkId: 1, studentId: 1 },
  { unique: true }
);

export const HomeworkSubmission = mongoose.model<IHomeworkSubmissionDoc>(
  'HomeworkSubmission',
  HomeworkSubmissionSchema
);

export interface ITimetableDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  classSectionId: mongoose.Types.ObjectId;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  roomNumber?: string;
  academicYearId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSchema = new Schema<ITimetableDoc>(
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
    dayOfWeek: {
      type: String,
      enum: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      required: true,
    },
    periodNumber: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roomNumber: { type: String },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear' },
  },
  { timestamps: true }
);

TimetableSchema.index(
  { schoolId: 1, classSectionId: 1, dayOfWeek: 1, periodNumber: 1 },
  { unique: true }
);
TimetableSchema.index({ schoolId: 1, teacherId: 1, dayOfWeek: 1 });
TimetableSchema.index({ schoolId: 1, roomNumber: 1, dayOfWeek: 1 });

export const Timetable = mongoose.model<ITimetableDoc>(
  'Timetable',
  TimetableSchema
);

export interface IStudyMaterialDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  classSectionId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType: 'pdf' | 'document' | 'video' | 'link';
  uploadedById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StudyMaterialSchema = new Schema<IStudyMaterialDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    classSectionId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSection',
      required: true,
      index: true,
    },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    fileType: {
      type: String,
      enum: ['pdf', 'document', 'video', 'link'],
      default: 'pdf',
    },
    uploadedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const StudyMaterial = mongoose.model<IStudyMaterialDoc>(
  'StudyMaterial',
  StudyMaterialSchema
);

export interface IHomeworkAiHintLogDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  homeworkId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: string;
  hintCount: number;
  lastHintLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

const HomeworkAiHintLogSchema = new Schema<IHomeworkAiHintLogDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    homeworkId: {
      type: Schema.Types.ObjectId,
      ref: 'Homework',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: String, required: true, index: true },
    hintCount: { type: Number, default: 1 },
    lastHintLevel: { type: Number, default: 1 },
  },
  { timestamps: true }
);

HomeworkAiHintLogSchema.index(
  { schoolId: 1, homeworkId: 1, studentId: 1, date: 1 },
  { unique: true }
);

export const HomeworkAiHintLog = mongoose.model<IHomeworkAiHintLogDoc>(
  'HomeworkAiHintLog',
  HomeworkAiHintLogSchema
);
