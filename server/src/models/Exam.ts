import mongoose, { Schema, Document } from 'mongoose';
import { ExamStatus, ExamType, QuizQuestionType } from '@eduhub/shared';

export interface IExamSubjectDoc {
  subjectId: mongoose.Types.ObjectId;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
  examDate?: string;
  startTime?: string;
  endTime?: string;
}

export interface IGradingRuleDoc {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  remarks?: string;
}

export interface IExamDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  type: ExamType;
  classSectionId?: mongoose.Types.ObjectId;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  description?: string;
  maxMarks?: number;
  passingMarks?: number;
  subjects?: IExamSubjectDoc[];
  gradingRules?: IGradingRuleDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const ExamSubjectSchema = new Schema<IExamSubjectDoc>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    subjectName: { type: String, required: true },
    maxMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 40 },
    examDate: { type: String },
    startTime: { type: String },
    endTime: { type: String },
  },
  { _id: false }
);

const GradingRuleDocSchema = new Schema<IGradingRuleDoc>(
  {
    minPercentage: { type: Number, required: true },
    maxPercentage: { type: Number, required: true },
    grade: { type: String, required: true },
    remarks: { type: String },
  },
  { _id: false }
);

const ExamSchema = new Schema<IExamDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'unit_test',
        'term_exam',
        'final_exam',
        'quiz',
        'practical',
        'other',
      ],
      default: 'unit_test',
    },
    classSectionId: { type: Schema.Types.ObjectId, ref: 'ClassSection' },
    academicYear: { type: String, required: true, default: '2025-2026' },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'marks-entry', 'published', 'submitted'],
      default: 'draft',
      index: true,
    },
    description: { type: String },
    maxMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 40 },
    subjects: [ExamSubjectSchema],
    gradingRules: [GradingRuleDocSchema],
  },
  { timestamps: true }
);

export const Exam = mongoose.model<IExamDoc>('Exam', ExamSchema);

export interface ICorrectionRecordDoc {
  studentId: mongoose.Types.ObjectId;
  studentName?: string;
  previousMarks: number;
  newMarks: number;
  reason: string;
  correctedBy: mongoose.Types.ObjectId;
  correctedByName: string;
  correctedAt: Date;
}

const CorrectionRecordSchema = new Schema<ICorrectionRecordDoc>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String },
    previousMarks: { type: Number, required: true },
    newMarks: { type: Number, required: true },
    reason: { type: String, required: true },
    correctedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    correctedByName: { type: String, required: true },
    correctedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export interface IGradeItemDoc {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber: string;
  marksObtained: number;
  maxMarks?: number;
  percentage?: number;
  grade?: string;
  isAbsent?: boolean;
  isPassed?: boolean;
  remarks?: string;
}

export interface IGradeRecordDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  classSectionId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  maxMarks: number;
  passingMarks: number;
  grades: IGradeItemDoc[];
  enteredById: mongoose.Types.ObjectId;
  status: ExamStatus;
  publishedAt?: Date;
  publishedById?: mongoose.Types.ObjectId;
  publishedByName?: string;
  correctionHistory?: ICorrectionRecordDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const GradeItemSchema = new Schema<IGradeItemDoc>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number },
    percentage: { type: Number },
    grade: { type: String },
    isAbsent: { type: Boolean, default: false },
    isPassed: { type: Boolean },
    remarks: { type: String },
  },
  { _id: false }
);

const GradeRecordSchema = new Schema<IGradeRecordDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    classSectionId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSection',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    maxMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 40 },
    grades: [GradeItemSchema],
    enteredById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'marks-entry', 'submitted', 'published'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date },
    publishedById: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedByName: { type: String },
    correctionHistory: [CorrectionRecordSchema],
  },
  { timestamps: true }
);

GradeRecordSchema.index(
  { schoolId: 1, examId: 1, classSectionId: 1, subjectId: 1 },
  { unique: true }
);

export const GradeRecord = mongoose.model<IGradeRecordDoc>(
  'GradeRecord',
  GradeRecordSchema
);

export interface IQuizQuestionSubdoc {
  id: string;
  questionText: string;
  questionType: QuizQuestionType;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  marks: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface IQuizDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  subjectId: mongoose.Types.ObjectId;
  subjectName: string;
  classSectionId: mongoose.Types.ObjectId;
  classSectionName: string;
  academicYearId?: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  dueDate: string;
  status: 'draft' | 'published' | 'archived';
  allowReview: boolean;
  questions: IQuizQuestionSubdoc[];
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSubSchema = new Schema<IQuizQuestionSubdoc>(
  {
    id: { type: String, required: true },
    questionText: { type: String, required: true, trim: true },
    questionType: {
      type: String,
      enum: ['mcq', 'true_false', 'fill_in_the_blank', 'short_answer'],
      required: true,
    },
    options: [{ type: String, trim: true }],
    correctAnswer: { type: String, required: true, trim: true },
    explanation: { type: String, trim: true },
    marks: { type: Number, default: 1 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuizDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    subjectName: { type: String, required: true },
    classSectionId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSection',
      required: true,
      index: true,
    },
    classSectionName: { type: String, required: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear' },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    duration: { type: Number, required: true, default: 15 },
    totalMarks: { type: Number, required: true, default: 10 },
    passingMarks: { type: Number, required: true, default: 5 },
    dueDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    allowReview: { type: Boolean, default: true },
    questions: [QuizQuestionSubSchema],
    attemptCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

QuizSchema.index({ schoolId: 1, classSectionId: 1, status: 1 });
QuizSchema.index({ schoolId: 1, subjectId: 1 });

export const Quiz = mongoose.model<IQuizDoc>('Quiz', QuizSchema);

export interface IQuizAttemptAnswerSubdoc {
  questionId: string;
  studentAnswer: string;
  isCorrect?: boolean;
  marksAwarded?: number;
  isFlaggedForReview?: boolean;
}

export interface IQuizAttemptDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber: string;
  classSectionId: mongoose.Types.ObjectId;
  startedAt: Date;
  submittedAt?: Date;
  status: 'in_progress' | 'submitted' | 'auto_submitted';
  durationTakenSeconds: number;
  answers: IQuizAttemptAnswerSubdoc[];
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  totalMarksObtained: number;
  maxMarks: number;
  percentage: number;
  isPassed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptAnswerSubSchema = new Schema<IQuizAttemptAnswerSubdoc>(
  {
    questionId: { type: String, required: true },
    studentAnswer: { type: String, default: '' },
    isCorrect: { type: Boolean },
    marksAwarded: { type: Number, default: 0 },
    isFlaggedForReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const QuizAttemptSchema = new Schema<IQuizAttemptDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
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
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted'],
      default: 'in_progress',
      index: true,
    },
    durationTakenSeconds: { type: Number, default: 0 },
    answers: [QuizAttemptAnswerSubSchema],
    totalQuestions: { type: Number, default: 0 },
    attemptedQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    skippedQuestions: { type: Number, default: 0 },
    totalMarksObtained: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

QuizAttemptSchema.index(
  { schoolId: 1, quizId: 1, studentId: 1 },
  { unique: true }
);
QuizAttemptSchema.index({ schoolId: 1, studentId: 1, status: 1 });

export const QuizAttempt = mongoose.model<IQuizAttemptDoc>(
  'QuizAttempt',
  QuizAttemptSchema
);
