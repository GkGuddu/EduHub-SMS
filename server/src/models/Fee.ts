import mongoose, { Schema, Document } from 'mongoose';
import {
  FeeStatus,
  PaymentMethod,
  FeeFrequency,
  ConcessionType,
  ConcessionDiscountType,
  ExpenseCategory,
} from '@eduhub/shared';

export interface IFeePaymentSubDoc {
  receiptNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  recordedById: mongoose.Types.ObjectId;
  recordedByName: string;
  notes?: string;
  idempotencyKey?: string;
}

export interface IFeeHeadDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  frequency: FeeFrequency;
  description?: string;
  classSectionId?: mongoose.Types.ObjectId;
  academicYearId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeeStructureDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  classSectionId: mongoose.Types.ObjectId;
  academicYearId: mongoose.Types.ObjectId;
  feeHeadIds: mongoose.Types.ObjectId[];
  totalAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeeConcessionDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  academicYearId: mongoose.Types.ObjectId;
  type: ConcessionType;
  discountType: ConcessionDiscountType;
  discountValue: number;
  amount: number;
  reason: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approverId?: mongoose.Types.ObjectId;
  approverName?: string;
  approvedAt?: Date;
  auditHistory: Array<{
    action: string;
    changedById: mongoose.Types.ObjectId;
    changedByName: string;
    timestamp: Date;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeePaymentIdempotencyDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  idempotencyKey: string;
  invoiceId: mongoose.Types.ObjectId;
  receiptNumber: string;
  amount: number;
  responseBody: any;
  createdAt: Date;
}

export interface IFeeInvoiceDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  studentId: mongoose.Types.ObjectId;
  classSectionId: mongoose.Types.ObjectId;
  academicYearId?: mongoose.Types.ObjectId;
  title: string;
  dueDate: string;
  subtotal: number;
  concessionId?: mongoose.Types.ObjectId;
  concessionAmount: number;
  concessionReason?: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: FeeStatus;
  items: Array<{
    feeHeadId?: mongoose.Types.ObjectId;
    title: string;
    amount: number;
  }>;
  payments: IFeePaymentSubDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const FeePaymentSchema = new Schema<IFeePaymentSubDoc>(
  {
    receiptNumber: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: [
        'cash',
        'card',
        'bank_transfer',
        'cheque',
        'online',
        'dd',
        'other',
      ],
      required: true,
    },
    transactionRef: { type: String },
    recordedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recordedByName: { type: String, required: true },
    notes: { type: String },
    idempotencyKey: { type: String },
  },
  { _id: true }
);

const FeeHeadSchema = new Schema<IFeeHeadDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'one-time'],
      required: true,
      default: 'yearly',
    },
    description: { type: String, trim: true },
    classSectionId: { type: Schema.Types.ObjectId, ref: 'ClassSection' },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

FeeHeadSchema.index({ schoolId: 1, title: 1, academicYearId: 1 });

export const FeeHead = mongoose.model<IFeeHeadDoc>('FeeHead', FeeHeadSchema);

const FeeStructureSchema = new Schema<IFeeStructureDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    classSectionId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSection',
      required: true,
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    feeHeadIds: [{ type: Schema.Types.ObjectId, ref: 'FeeHead' }],
    totalAmount: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FeeStructureSchema.index(
  { schoolId: 1, classSectionId: 1, academicYearId: 1 },
  { unique: true }
);

export const FeeStructure = mongoose.model<IFeeStructureDoc>(
  'FeeStructure',
  FeeStructureSchema
);

const FeeConcessionSchema = new Schema<IFeeConcessionDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'FeeInvoice' },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'merit',
        'sibling',
        'staff_child',
        'financial_aid',
        'special_waiver',
        'other',
      ],
      required: true,
    },
    discountType: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    approverId: { type: Schema.Types.ObjectId, ref: 'User' },
    approverName: { type: String },
    approvedAt: { type: Date },
    auditHistory: [
      {
        action: { type: String, required: true },
        changedById: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        changedByName: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const FeeConcession = mongoose.model<IFeeConcessionDoc>(
  'FeeConcession',
  FeeConcessionSchema
);

const FeePaymentIdempotencySchema = new Schema<IFeePaymentIdempotencyDoc>({
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true,
  },
  idempotencyKey: { type: String, required: true, trim: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'FeeInvoice', required: true },
  receiptNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  responseBody: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 172800 },
});

FeePaymentIdempotencySchema.index(
  { schoolId: 1, idempotencyKey: 1 },
  { unique: true }
);

export const FeePaymentIdempotency = mongoose.model<IFeePaymentIdempotencyDoc>(
  'FeePaymentIdempotency',
  FeePaymentIdempotencySchema
);

const FeeInvoiceSchema = new Schema<IFeeInvoiceDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    invoiceNumber: { type: String, required: true, trim: true },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    title: { type: String, required: true },
    dueDate: { type: String, required: true },
    subtotal: { type: Number, default: 0, min: 0 },
    concessionId: { type: Schema.Types.ObjectId, ref: 'FeeConcession' },
    concessionAmount: { type: Number, default: 0, min: 0 },
    concessionReason: { type: String },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balance: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        'pending',
        'partially paid',
        'paid',
        'overdue',
        'partial',
        'unpaid',
        'cancelled',
        'archived',
      ],
      default: 'pending',
      index: true,
    },
    items: [
      {
        feeHeadId: { type: Schema.Types.ObjectId, ref: 'FeeHead' },
        title: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    payments: [FeePaymentSchema],
  },
  { timestamps: true }
);

FeeInvoiceSchema.index({ schoolId: 1, invoiceNumber: 1 }, { unique: true });

export const FeeInvoice = mongoose.model<IFeeInvoiceDoc>(
  'FeeInvoice',
  FeeInvoiceSchema
);

export interface IExpenseDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  category: ExpenseCategory;
  title: string;
  amount: number;
  payee: string;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  description?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentSize?: number;
  recordedById: mongoose.Types.ObjectId;
  recordedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpenseDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    payee: { type: String, required: true, trim: true },
    paymentDate: { type: Date, required: true, index: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'online'],
      required: true,
    },
    description: { type: String, trim: true },
    attachmentName: { type: String },
    attachmentUrl: { type: String },
    attachmentSize: { type: Number },
    recordedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recordedByName: { type: String, required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ schoolId: 1, paymentDate: -1 });
ExpenseSchema.index({ schoolId: 1, category: 1 });

export const Expense = mongoose.model<IExpenseDoc>('Expense', ExpenseSchema);
