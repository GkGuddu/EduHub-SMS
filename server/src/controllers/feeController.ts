import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  FeeInvoice,
  FeeHead,
  FeeStructure,
  FeeConcession,
  FeePaymentIdempotency,
  StudentProfile,
  ParentProfile,
  School,
} from '../models';
import {
  createAuditLog,
  sendNotification,
} from '../services/notificationService';
import {
  calculateLineItemsSubtotal,
  calculateConcessionAmount,
  deriveInvoiceStatus,
  generateReceiptNumber,
  generateInvoiceNumber,
  formatDefaultersCsv,
  formatDailyFeeBookCsv,
} from '../services/feeService';

export async function getInvoices(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      status,
      studentId,
      classSectionId,
      academicYearId,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query: any = { schoolId };

    if (req.user!.role === 'student') {
      query.studentId = new mongoose.Types.ObjectId(req.user!.userId);
    } else if (req.user!.role === 'parent') {
      const parent = await ParentProfile.findOne({
        schoolId,
        userId: req.user!.userId,
      });
      const parentLinkedIds = parent?.linkedStudentUserIds || [];
      const children = await StudentProfile.find({
        schoolId,
        $or: [
          { parentIds: req.user!.userId },
          { userId: { $in: parentLinkedIds } },
        ],
      }).select('userId _id');
      const childUserIds = children.map((c) => c.userId);

      if (studentId) {
        const targetStudent = children.find(
          (c) =>
            c.userId.toString() === studentId.toString() ||
            c._id.toString() === studentId.toString()
        );
        if (!targetStudent) {
          res
            .status(403)
            .json({
              success: false,
              message: 'Forbidden: Child not linked to your account',
            });
          return;
        }
        query.studentId = targetStudent.userId;
      } else {
        query.studentId = { $in: childUserIds };
      }
    } else if (studentId) {
      const isObjId = mongoose.isValidObjectId(studentId);
      const studentProf = await StudentProfile.findOne({
        schoolId,
        ...(isObjId
          ? { $or: [{ _id: studentId }, { userId: studentId }] }
          : { userId: studentId }),
      }).select('userId');
      query.studentId = studentProf
        ? studentProf.userId
        : new mongoose.Types.ObjectId(studentId.toString());
    }

    if (classSectionId && classSectionId !== 'all') {
      query.classSectionId = new mongoose.Types.ObjectId(
        classSectionId.toString()
      );
    }

    if (academicYearId) {
      query.academicYearId = new mongoose.Types.ObjectId(
        academicYearId.toString()
      );
    }

    if (status && status !== 'all') {
      if (status === 'partially paid' || status === 'partial') {
        query.status = { $in: ['partially paid', 'partial'] };
      } else if (status === 'pending' || status === 'unpaid') {
        query.status = { $in: ['pending', 'unpaid'] };
      } else {
        query.status = status;
      }
    }

    if (search) {
      const regex = new RegExp(search.toString().trim(), 'i');
      query.$or = [{ invoiceNumber: regex }, { title: regex }];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [invoices, total] = await Promise.all([
      FeeInvoice.find(query)
        .populate('studentId', 'name email')
        .populate('classSectionId', 'name section')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FeeInvoice.countDocuments(query),
    ]);

    const studentUserIds = invoices
      .map((inv: any) => inv.studentId?._id)
      .filter(Boolean);
    const profiles = await StudentProfile.find({
      schoolId,
      userId: { $in: studentUserIds },
    })
      .select('userId admissionNumber rollNumber')
      .lean();

    const profileMap = new Map<string, any>();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    const formatted = invoices.map((inv: any) => {
      const prof = inv.studentId?._id
        ? profileMap.get(inv.studentId._id.toString())
        : null;
      return {
        ...inv,
        studentName: inv.studentId?.name || 'Unknown',
        studentEmail: inv.studentId?.email || '',
        admissionNumber: prof?.admissionNumber || '',
        rollNumber: prof?.rollNumber || '',
        className: inv.classSectionId?.name || '',
        section: inv.classSectionId?.section || '',
      };
    });

    res.json({
      success: true,
      invoices: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch invoices' });
  }
}

export async function createInvoice(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      studentId,
      classSectionId,
      academicYearId,
      title,
      dueDate,
      items,
      concessionId,
    } = req.body;

    const subtotal = calculateLineItemsSubtotal(items);
    let concessionAmount = 0;
    let concessionReason: string | undefined;

    if (concessionId) {
      const concession = await FeeConcession.findOne({
        _id: concessionId,
        schoolId,
        studentId,
        approvalStatus: 'approved',
      });
      if (concession) {
        concessionAmount = concession.amount;
        concessionReason = concession.reason;
      }
    }

    const totalAmount = Math.max(0, subtotal - concessionAmount);
    const paidAmount = 0;
    const balance = totalAmount;
    const status = deriveInvoiceStatus(totalAmount, paidAmount, dueDate);
    const invoiceNumber = generateInvoiceNumber();

    const invoice = await FeeInvoice.create({
      schoolId,
      invoiceNumber,
      studentId,
      classSectionId,
      academicYearId,
      title,
      dueDate,
      items,
      subtotal,
      concessionId: concessionId || undefined,
      concessionAmount,
      concessionReason,
      totalAmount,
      paidAmount,
      balance,
      status,
      payments: [],
    });

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'FEE_INVOICE_CREATE',
      entityType: 'fee',
      entityId: invoice._id.toString(),
      details: `Created invoice ${invoiceNumber} for ₹${totalAmount} due on ${dueDate}.`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to create invoice' });
  }
}

export async function getInvoiceById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const query: any = { schoolId };
    if (mongoose.isValidObjectId(id)) {
      query.$or = [{ _id: id }, { invoiceNumber: id }];
    } else {
      query.invoiceNumber = id;
    }

    const invoice = await FeeInvoice.findOne(query)
      .populate('studentId', 'name email')
      .populate('classSectionId', 'name section')
      .lean();

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    if (req.user!.role === 'student') {
      const studentUid =
        (invoice.studentId as any)?._id?.toString() ||
        invoice.studentId?.toString();
      if (studentUid !== req.user!.userId) {
        res.status(403).json({
          success: false,
          message: "Forbidden: You cannot view another student's fee invoice",
        });
        return;
      }
    } else if (req.user!.role === 'parent') {
      const parent = await ParentProfile.findOne({
        schoolId,
        userId: req.user!.userId,
      });
      const parentLinkedIds = (parent?.linkedStudentUserIds || []).map(
        (uid: any) => uid.toString()
      );
      const studentUid =
        (invoice.studentId as any)?._id?.toString() ||
        invoice.studentId?.toString();
      if (!parentLinkedIds.includes(studentUid)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Invoice does not belong to a linked child',
        });
        return;
      }
    }

    const studentUid = (invoice.studentId as any)?._id || invoice.studentId;
    const profile = await StudentProfile.findOne({
      schoolId,
      userId: studentUid,
    })
      .select('admissionNumber rollNumber')
      .lean();

    const formatted = {
      ...invoice,
      studentName: (invoice.studentId as any)?.name || 'Unknown',
      studentEmail: (invoice.studentId as any)?.email || '',
      admissionNumber: profile?.admissionNumber || '',
      rollNumber: profile?.rollNumber || '',
      className: (invoice.classSectionId as any)?.name || '',
      section: (invoice.classSectionId as any)?.section || '',
    };

    res.json({ success: true, invoice: formatted });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to retrieve invoice' });
  }
}

export async function updateInvoice(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;
    const { title, dueDate, items, totalAmount, notes, status } = req.body;

    const invoice = await FeeInvoice.findOne({ _id: id, schoolId });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    if (title !== undefined) invoice.title = title;
    if (dueDate !== undefined) invoice.dueDate = dueDate;

    if (items && Array.isArray(items) && items.length > 0) {
      const subtotal = calculateLineItemsSubtotal(items);
      invoice.items = items;
      invoice.subtotal = subtotal;
      invoice.totalAmount = Math.max(
        0,
        subtotal - (invoice.concessionAmount || 0)
      );
    } else if (totalAmount !== undefined) {
      invoice.totalAmount = Math.max(0, Number(totalAmount));
    }

    invoice.balance = Math.max(
      0,
      invoice.totalAmount - (invoice.paidAmount || 0)
    );

    if (status && ['cancelled', 'archived'].includes(status)) {
      invoice.status = status;
    } else {
      invoice.status = deriveInvoiceStatus(
        invoice.totalAmount,
        invoice.paidAmount || 0,
        invoice.dueDate
      );
    }

    await invoice.save();

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'FEE_CORRECTION',
      entityType: 'fee',
      entityId: invoice._id.toString(),
      details: `Updated fee invoice ${invoice.invoiceNumber}. New total: ₹${invoice.totalAmount}, Paid: ₹${invoice.paidAmount}, Balance: ₹${invoice.balance}, Status: ${invoice.status}.${notes ? ` Note: ${notes}` : ''}`,
      req,
    });

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update invoice' });
  }
}

export async function deleteInvoice(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const invoice = await FeeInvoice.findOne({ _id: id, schoolId });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    const hasRecordedPayments =
      (invoice.paidAmount && invoice.paidAmount > 0) ||
      (invoice.payments && invoice.payments.length > 0);

    if (hasRecordedPayments) {
      invoice.status = 'cancelled';
      invoice.balance = 0;
      await invoice.save();

      await createAuditLog({
        schoolId,
        userId: req.user!.userId,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'FEE_CORRECTION',
        entityType: 'fee',
        entityId: invoice._id.toString(),
        details: `Cancelled and archived invoice ${invoice.invoiceNumber} (Total: ₹${invoice.totalAmount}, Paid: ₹${invoice.paidAmount}) to preserve audit and transaction integrity.`,
        req,
      });

      res.json({
        success: true,
        cancelled: true,
        message:
          'Invoice has recorded payment transactions and has been safely cancelled and archived rather than permanently deleted to preserve financial audit history.',
        invoice,
      });
      return;
    }

    await FeeInvoice.deleteOne({ _id: id, schoolId });

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'FEE_CORRECTION',
      entityType: 'fee',
      entityId: invoice._id.toString(),
      details: `Permanently deleted unpaid invoice ${invoice.invoiceNumber} (Total: ₹${invoice.totalAmount}).`,
      req,
    });

    res.json({
      success: true,
      message: 'Unpaid fee invoice deleted successfully.',
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete invoice' });
  }
}

export async function bulkGenerateInvoices(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      classSectionId,
      academicYearId,
      feeStructureId,
      title,
      dueDate,
      items,
    } = req.body;

    let invoiceItems: Array<{
      feeHeadId?: any;
      title: string;
      amount: number;
    }> = [];

    if (feeStructureId) {
      const structure = await FeeStructure.findOne({
        _id: feeStructureId,
        schoolId,
      }).populate('feeHeadIds');
      if (!structure) {
        res
          .status(404)
          .json({ success: false, message: 'Fee structure not found' });
        return;
      }
      invoiceItems = (structure.feeHeadIds as any[]).map((fh) => ({
        feeHeadId: fh._id,
        title: fh.title,
        amount: fh.amount,
      }));
    } else if (items && items.length > 0) {
      invoiceItems = items;
    } else {
      res.status(400).json({
        success: false,
        message: 'Must provide feeStructureId or items array',
      });
      return;
    }

    const subtotal = calculateLineItemsSubtotal(invoiceItems);

    const students = await StudentProfile.find({
      schoolId,
      classSectionId,
      status: { $ne: 'archived' },
    }).select('userId');

    if (students.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No active students found enrolled in the selected class',
      });
      return;
    }

    const createdInvoices = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const concession = await FeeConcession.findOne({
        schoolId,
        studentId: student.userId,
        academicYearId,
        approvalStatus: 'approved',
      });

      const concessionAmount = concession ? concession.amount : 0;
      const totalAmount = Math.max(0, subtotal - concessionAmount);
      const balance = totalAmount;
      const status = deriveInvoiceStatus(totalAmount, 0, dueDate);
      const invoiceNumber = generateInvoiceNumber(
        undefined,
        1000 + i + Math.floor(Math.random() * 5000)
      );

      const inv = await FeeInvoice.create({
        schoolId,
        invoiceNumber,
        studentId: student.userId,
        classSectionId,
        academicYearId,
        title,
        dueDate,
        items: invoiceItems,
        subtotal,
        concessionId: concession?._id,
        concessionAmount,
        concessionReason: concession?.reason,
        totalAmount,
        paidAmount: 0,
        balance,
        status,
        payments: [],
      });

      createdInvoices.push(inv);
    }

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'FEE_INVOICE_CREATE',
      entityType: 'fee',
      entityId: classSectionId,
      details: `Bulk generated ${createdInvoices.length} invoices for class ${classSectionId}.`,
      req,
    });

    res.status(201).json({
      success: true,
      message: `Successfully generated ${createdInvoices.length} invoices`,
      count: createdInvoices.length,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to bulk generate invoices' });
  }
}

export async function recordPayment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      invoiceId,
      amount,
      paymentMethod,
      transactionRef,
      notes,
      idempotencyKey: bodyKey,
    } = req.body;

    const idempotencyKey =
      (req.headers['x-idempotency-key'] as string) || bodyKey;

    if (idempotencyKey) {
      const existingKeyDoc = await FeePaymentIdempotency.findOne({
        schoolId,
        idempotencyKey,
      });
      if (existingKeyDoc) {
        res.status(200).json(existingKeyDoc.responseBody);
        return;
      }
    }

    const invoice = await FeeInvoice.findOne({ _id: invoiceId, schoolId });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    const currentBalance = Math.max(
      0,
      invoice.totalAmount - invoice.paidAmount
    );

    if (amount <= 0) {
      res
        .status(400)
        .json({
          success: false,
          message: 'Payment amount must be greater than 0',
        });
      return;
    }

    if (amount > currentBalance) {
      res.status(400).json({
        success: false,
        message: `Payment amount (₹${amount}) exceeds outstanding balance (₹${currentBalance})`,
      });
      return;
    }

    const receiptNumber = generateReceiptNumber();

    invoice.payments.push({
      receiptNumber,
      amount: Math.round(amount),
      paymentDate: new Date(),
      paymentMethod,
      transactionRef,
      recordedById: new mongoose.Types.ObjectId(req.user!.userId),
      recordedByName: req.user!.name,
      notes,
      idempotencyKey,
    });

    invoice.paidAmount += Math.round(amount);
    invoice.balance = Math.max(0, invoice.totalAmount - invoice.paidAmount);
    invoice.status = deriveInvoiceStatus(
      invoice.totalAmount,
      invoice.paidAmount,
      invoice.dueDate
    );

    await invoice.save();

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'FEE_PAYMENT',
      entityType: 'fee',
      entityId: invoice._id.toString(),
      details: `Recorded payment of ₹${amount} for invoice ${invoice.invoiceNumber} via ${paymentMethod}. Receipt: ${receiptNumber}.`,
      req,
    });

    const student = await StudentProfile.findOne({
      schoolId,
      userId: invoice.studentId,
    });
    if (student) {
      const notifMsg = `Payment of ₹${amount} received for invoice ${invoice.invoiceNumber}. Receipt: ${receiptNumber}. Outstanding balance: ₹${invoice.balance}.`;

      sendNotification({
        schoolId,
        userId: student.userId.toString(),
        title: 'Fee Payment Received',
        message: notifMsg,
        type: 'fee',
      });

      for (const pId of student.parentIds) {
        sendNotification({
          schoolId,
          userId: pId.toString(),
          title: 'Fee Payment Received',
          message: notifMsg,
          type: 'fee',
        });
      }
    }

    const responsePayload = {
      success: true,
      message: 'Payment recorded successfully',
      receiptNumber,
      invoice,
    };

    if (idempotencyKey) {
      try {
        await FeePaymentIdempotency.create({
          schoolId,
          idempotencyKey,
          invoiceId: invoice._id,
          receiptNumber,
          amount: Math.round(amount),
          responseBody: responsePayload,
        });
      } catch (idempErr) {
        console.warn('Fee payment idempotency insert warning:', idempErr);
      }
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('Record payment error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to record fee payment' });
  }
}

export async function getReceipt(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { receiptNumber } = req.params;

    const invoice = await FeeInvoice.findOne({
      schoolId,
      'payments.receiptNumber': receiptNumber,
    })
      .populate('studentId', 'name email')
      .populate('classSectionId', 'name section');

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Receipt not found' });
      return;
    }

    if (
      req.user!.role === 'student' &&
      invoice.studentId._id.toString() !== req.user!.userId
    ) {
      res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: Access to unrelated student receipt',
        });
      return;
    }
    if (req.user!.role === 'parent') {
      const studentProfile = await StudentProfile.findOne({
        schoolId,
        userId: invoice.studentId._id,
      });
      const isLinked = studentProfile?.parentIds.some(
        (id) => id.toString() === req.user!.userId
      );
      if (!isLinked) {
        res
          .status(403)
          .json({
            success: false,
            message: 'Forbidden: Access to unrelated child receipt',
          });
        return;
      }
    }

    const payment = invoice.payments.find(
      (p) => p.receiptNumber === receiptNumber
    );
    if (!payment) {
      res
        .status(404)
        .json({ success: false, message: 'Payment record not found' });
      return;
    }

    const [school, studentProfile] = await Promise.all([
      School.findById(schoolId),
      StudentProfile.findOne({
        schoolId,
        userId: invoice.studentId._id,
      }).select('admissionNumber rollNumber parentName parentPhone'),
    ]);

    res.json({
      success: true,
      receipt: {
        receiptNumber: payment.receiptNumber,
        invoiceNumber: invoice.invoiceNumber,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionRef: payment.transactionRef,
        recordedByName: payment.recordedByName,
        notes: payment.notes,
        student: {
          name: (invoice.studentId as any)?.name,
          email: (invoice.studentId as any)?.email,
          admissionNumber: studentProfile?.admissionNumber || '',
          rollNumber: studentProfile?.rollNumber || '',
          className: (invoice.classSectionId as any)?.name,
          section: (invoice.classSectionId as any)?.section,
          parentName: studentProfile?.parentName || '',
          parentPhone: studentProfile?.parentPhone || '',
        },
        items: invoice.items,
        invoiceSummary: {
          title: invoice.title,
          subtotal: invoice.subtotal,
          concessionAmount: invoice.concessionAmount,
          concessionReason: invoice.concessionReason,
          totalAmount: invoice.totalAmount,
          paidAmount: invoice.paidAmount,
          remainingBalance: invoice.balance,
          status: invoice.status,
          dueDate: invoice.dueDate,
        },
        school: {
          name: school?.name || 'Adiya School of Excellence',
          address: school?.address || '123 Academic Enclave, Education City',
          phone: school?.phone || '+91 98765 43210',
          email: school?.email || 'accounts@adiya.edu',
          productBranding: 'EduHub SMS',
        },
      },
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to retrieve receipt' });
  }
}

export async function getFeeHeads(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { academicYearId, classSectionId } = req.query;

    const query: any = { schoolId };
    if (academicYearId) query.academicYearId = academicYearId;
    if (classSectionId && classSectionId !== 'all')
      query.classSectionId = classSectionId;

    const heads = await FeeHead.find(query)
      .populate('classSectionId', 'name section')
      .populate('academicYearId', 'name')
      .sort({ title: 1 })
      .lean();

    const formatted = heads.map((h: any) => ({
      ...h,
      className: h.classSectionId?.name
        ? `${h.classSectionId.name}-${h.classSectionId.section}`
        : 'All Classes',
      academicYearName: h.academicYearId?.name || '',
    }));

    res.json({ success: true, heads: formatted });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch fee heads' });
  }
}

export async function createFeeHead(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      title,
      amount,
      frequency,
      description,
      classSectionId,
      academicYearId,
    } = req.body;

    const feeHead = await FeeHead.create({
      schoolId,
      title: title.trim(),
      amount: Math.round(amount),
      frequency,
      description,
      classSectionId:
        classSectionId && classSectionId !== 'all' ? classSectionId : undefined,
      academicYearId,
    });

    res.status(201).json({
      success: true,
      message: 'Fee head created successfully',
      feeHead,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to create fee head' });
  }
}

export async function updateFeeHead(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;
    const updates = req.body;

    if (updates.amount) updates.amount = Math.round(updates.amount);

    const feeHead = await FeeHead.findOneAndUpdate(
      { _id: id, schoolId },
      { $set: updates },
      { new: true }
    );

    if (!feeHead) {
      res.status(404).json({ success: false, message: 'Fee head not found' });
      return;
    }

    if (updates.amount !== undefined) {
      const structuresWithHead = await FeeStructure.find({
        schoolId,
        feeHeadIds: id,
      });
      for (const struct of structuresWithHead) {
        const heads = await FeeHead.find({
          _id: { $in: struct.feeHeadIds },
          schoolId,
        });
        struct.totalAmount = heads.reduce((acc, fh) => acc + fh.amount, 0);
        await struct.save();
      }
    }

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'FEE_CORRECTION',
      entityType: 'fee',
      entityId: feeHead._id.toString(),
      details: `Updated fee head ${feeHead.title} (₹${feeHead.amount}).`,
      req,
    });

    res.json({
      success: true,
      message: 'Fee head updated successfully',
      feeHead,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update fee head' });
  }
}

export async function deleteFeeHead(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const feeHead = await FeeHead.findOneAndDelete({ _id: id, schoolId });
    if (!feeHead) {
      res.status(404).json({ success: false, message: 'Fee head not found' });
      return;
    }

    const structuresWithHead = await FeeStructure.find({
      schoolId,
      feeHeadIds: id,
    });
    for (const struct of structuresWithHead) {
      struct.feeHeadIds = struct.feeHeadIds.filter(
        (fhId) => fhId.toString() !== id.toString()
      );
      const remainingHeads = await FeeHead.find({
        _id: { $in: struct.feeHeadIds },
        schoolId,
      });
      struct.totalAmount = remainingHeads.reduce(
        (acc, fh) => acc + fh.amount,
        0
      );
      await struct.save();
    }

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'FEE_CORRECTION',
      entityType: 'fee',
      entityId: id,
      details: `Deleted fee head ${feeHead.title} (₹${feeHead.amount}).`,
      req,
    });

    res.json({ success: true, message: 'Fee head deleted successfully' });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete fee head' });
  }
}

export async function getFeeStructures(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { classSectionId, academicYearId } = req.query;

    const query: any = { schoolId };
    if (classSectionId && classSectionId !== 'all')
      query.classSectionId = classSectionId;
    if (academicYearId) query.academicYearId = academicYearId;

    const structures = await FeeStructure.find(query)
      .populate('classSectionId', 'name section')
      .populate('academicYearId', 'name')
      .populate('feeHeadIds')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = structures.map((s: any) => ({
      ...s,
      className: s.classSectionId?.name || '',
      section: s.classSectionId?.section || '',
      academicYearName: s.academicYearId?.name || '',
      feeHeads: s.feeHeadIds || [],
    }));

    res.json({ success: true, structures: formatted });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch fee structures' });
  }
}

export async function createFeeStructure(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { name, classSectionId, academicYearId, feeHeadIds } = req.body;

    const feeHeads = await FeeHead.find({
      _id: { $in: feeHeadIds },
      schoolId,
    });

    const totalAmount = feeHeads.reduce((acc, fh) => acc + fh.amount, 0);

    const structure = await FeeStructure.create({
      schoolId,
      name: name.trim(),
      classSectionId,
      academicYearId,
      feeHeadIds,
      totalAmount,
      isActive: true,
    });

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'FEE_CORRECTION',
      entityType: 'fee',
      entityId: structure._id.toString(),
      details: `Created fee structure ${structure.name} for class ${classSectionId}. Total: ₹${totalAmount}.`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Fee structure created successfully',
      structure,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(400).json({
        success: false,
        message:
          'A fee structure already exists for this class section in the selected academic year',
      });
      return;
    }
    res
      .status(500)
      .json({ success: false, message: 'Failed to create fee structure' });
  }
}

export async function updateFeeStructure(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;
    const { name, classSectionId, academicYearId, feeHeadIds, isActive } =
      req.body;

    const structure = await FeeStructure.findOne({ _id: id, schoolId });
    if (!structure) {
      res
        .status(404)
        .json({ success: false, message: 'Fee structure not found' });
      return;
    }

    if (name) structure.name = name.trim();
    if (classSectionId) structure.classSectionId = classSectionId;
    if (academicYearId) structure.academicYearId = academicYearId;
    if (isActive !== undefined) structure.isActive = isActive;

    if (feeHeadIds && Array.isArray(feeHeadIds)) {
      structure.feeHeadIds = feeHeadIds;
      const feeHeads = await FeeHead.find({
        _id: { $in: feeHeadIds },
        schoolId,
      });
      structure.totalAmount = feeHeads.reduce((acc, fh) => acc + fh.amount, 0);
    }

    await structure.save();

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'FEE_CORRECTION',
      entityType: 'fee',
      entityId: structure._id.toString(),
      details: `Updated fee structure ${structure.name}. Total: ₹${structure.totalAmount}.`,
      req,
    });

    res.json({
      success: true,
      message: 'Fee structure updated successfully',
      structure,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(400).json({
        success: false,
        message:
          'A fee structure already exists for this class section in the selected academic year',
      });
      return;
    }
    res
      .status(500)
      .json({ success: false, message: 'Failed to update fee structure' });
  }
}

export async function deleteFeeStructure(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const structure = await FeeStructure.findOneAndDelete({
      _id: id,
      schoolId,
    });
    if (!structure) {
      res
        .status(404)
        .json({ success: false, message: 'Fee structure not found' });
      return;
    }

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'FEE_CORRECTION',
      entityType: 'fee',
      entityId: id,
      details: `Deleted fee structure ${structure.name}.`,
      req,
    });

    res.json({
      success: true,
      message: 'Fee structure deleted successfully',
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete fee structure' });
  }
}

export async function getConcessions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { studentId, status, academicYearId } = req.query;

    const query: any = { schoolId };
    if (studentId) query.studentId = studentId;
    if (status && status !== 'all') query.approvalStatus = status;
    if (academicYearId) query.academicYearId = academicYearId;

    const concessions = await FeeConcession.find(query)
      .populate('studentId', 'name email')
      .populate('invoiceId', 'invoiceNumber title')
      .sort({ createdAt: -1 })
      .lean();

    const studentUserIds = concessions
      .map((c: any) => c.studentId?._id)
      .filter(Boolean);
    const profiles = await StudentProfile.find({
      schoolId,
      userId: { $in: studentUserIds },
    })
      .populate('classSectionId', 'name section')
      .select('userId admissionNumber classSectionId')
      .lean();

    const profileMap = new Map<string, any>();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    const formatted = concessions.map((c: any) => {
      const prof = c.studentId?._id
        ? profileMap.get(c.studentId._id.toString())
        : null;
      return {
        ...c,
        studentName: c.studentId?.name || 'Unknown',
        studentAdmissionNumber: prof?.admissionNumber || '',
        className: prof?.classSectionId?.name || '',
        section: prof?.classSectionId?.section || '',
        invoiceNumber: c.invoiceId?.invoiceNumber || '',
      };
    });

    res.json({ success: true, concessions: formatted });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch concessions' });
  }
}

export async function createConcession(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      studentId,
      invoiceId,
      academicYearId,
      type,
      discountType,
      discountValue,
      reason,
    } = req.body;

    let baseAmount = 0;
    if (invoiceId) {
      const inv = await FeeInvoice.findOne({ _id: invoiceId, schoolId });
      if (inv) baseAmount = inv.subtotal || inv.totalAmount;
    } else {
      baseAmount = discountType === 'fixed' ? discountValue : 20000;
    }

    const amount = calculateConcessionAmount(
      baseAmount,
      discountType,
      discountValue
    );

    const concession = await FeeConcession.create({
      schoolId,
      studentId,
      invoiceId: invoiceId || undefined,
      academicYearId,
      type,
      discountType,
      discountValue,
      amount,
      reason: reason.trim(),
      approvalStatus: 'pending',
      auditHistory: [
        {
          action: 'CREATED',
          changedById: req.user!.userId,
          changedByName: req.user!.name,
          timestamp: new Date(),
          note: `Concession request created for ${discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`}`,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Concession request submitted',
      concession,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to create concession' });
  }
}

export async function updateConcessionStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;
    const { status, note } = req.body;

    const concession = await FeeConcession.findOne({ _id: id, schoolId });
    if (!concession) {
      res.status(404).json({ success: false, message: 'Concession not found' });
      return;
    }

    concession.approvalStatus = status;
    concession.approverId = new mongoose.Types.ObjectId(req.user!.userId);
    concession.approverName = req.user!.name;
    concession.approvedAt = new Date();

    concession.auditHistory.push({
      action: status.toUpperCase(),
      changedById: new mongoose.Types.ObjectId(req.user!.userId),
      changedByName: req.user!.name,
      timestamp: new Date(),
      note: note || `Concession status updated to ${status}`,
    });

    await concession.save();

    if (status === 'approved' && concession.invoiceId) {
      const invoice = await FeeInvoice.findOne({
        _id: concession.invoiceId,
        schoolId,
      });
      if (invoice) {
        invoice.concessionId = concession._id;
        invoice.concessionAmount = concession.amount;
        invoice.concessionReason = concession.reason;
        invoice.totalAmount = Math.max(
          0,
          invoice.subtotal - invoice.concessionAmount
        );
        invoice.balance = Math.max(0, invoice.totalAmount - invoice.paidAmount);
        invoice.status = deriveInvoiceStatus(
          invoice.totalAmount,
          invoice.paidAmount,
          invoice.dueDate
        );
        await invoice.save();
      }
    }

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action:
        status === 'approved'
          ? 'FEE_CONCESSION_APPROVE'
          : 'FEE_CONCESSION_REJECT',
      entityType: 'fee',
      entityId: concession._id.toString(),
      details: `${status === 'approved' ? 'Approved' : 'Rejected'} concession for student ${concession.studentId}. Note: ${note || 'None'}`,
      req,
    });

    res.json({
      success: true,
      message: `Concession ${status} successfully`,
      concession,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update concession status' });
  }
}

export async function getDefaultersReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      classSectionId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      export: exportType,
    } = req.query;

    const query: any = {
      schoolId,
      balance: { $gt: 0 },
    };

    if (classSectionId && classSectionId !== 'all') {
      query.classSectionId = new mongoose.Types.ObjectId(
        classSectionId.toString()
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (startDate && endDate) {
      query.dueDate = { $gte: startDate.toString(), $lte: endDate.toString() };
    }

    const invoices = await FeeInvoice.find(query)
      .populate('studentId', 'name email')
      .populate('classSectionId', 'name section')
      .lean();

    const studentUserIds = invoices
      .map((inv: any) => inv.studentId?._id)
      .filter(Boolean);
    const profiles = await StudentProfile.find({
      schoolId,
      userId: { $in: studentUserIds },
    })
      .select(
        'userId admissionNumber rollNumber parentName parentPhone parentEmail'
      )
      .lean();

    const profileMap = new Map<string, any>();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    const today = new Date();
    const todayUtc = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const defaulters = invoices
      .map((inv: any) => {
        const prof = inv.studentId?._id
          ? profileMap.get(inv.studentId._id.toString())
          : null;
        const [y, m, d] = (inv.dueDate || '').split('-').map(Number);
        const dueUtc = isNaN(y) ? 0 : Date.UTC(y, m - 1, d);
        const overdueDays =
          dueUtc > 0 && dueUtc < todayUtc
            ? Math.round((todayUtc - dueUtc) / (1000 * 60 * 60 * 24))
            : 0;

        return {
          invoiceId: inv._id.toString(),
          invoiceNumber: inv.invoiceNumber,
          studentId: inv.studentId?._id?.toString(),
          studentName: inv.studentId?.name || 'Unknown',
          admissionNumber: prof?.admissionNumber || '',
          rollNumber: prof?.rollNumber || '',
          classSectionId: inv.classSectionId?._id?.toString(),
          className: inv.classSectionId?.name || '',
          section: inv.classSectionId?.section || '',
          parentName: prof?.parentName || '',
          parentPhone: prof?.parentPhone || '',
          parentEmail: prof?.parentEmail || '',
          title: inv.title,
          totalAmount: inv.totalAmount,
          paidAmount: inv.paidAmount,
          balance: inv.balance,
          dueDate: inv.dueDate,
          overdueDays,
          status: inv.status,
        };
      })
      .filter((d) => {
        if (!search) return true;
        const s = search.toString().toLowerCase();
        return (
          d.studentName.toLowerCase().includes(s) ||
          d.admissionNumber.toLowerCase().includes(s) ||
          d.invoiceNumber.toLowerCase().includes(s)
        );
      });

    if (exportType === 'csv') {
      const csvData = formatDefaultersCsv(defaulters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="fee-defaulters-${todayStr}.csv"`
      );
      res.send(csvData);
      return;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const paginated = defaulters.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    const summary = {
      totalDefaulters: defaulters.length,
      totalOutstanding: defaulters.reduce((sum, d) => sum + d.balance, 0),
      totalInvoiced: defaulters.reduce((sum, d) => sum + d.totalAmount, 0),
    };

    res.json({
      success: true,
      defaulters: paginated,
      summary,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: defaulters.length,
        totalPages: Math.ceil(defaulters.length / limitNum),
      },
    });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to generate defaulters report',
      });
  }
}

export async function getCollectionDashboard(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;

    const invoices = await FeeInvoice.find({ schoolId }).lean();

    let grossInvoiced = 0;
    let totalConcessions = 0;
    let netInvoiced = 0;
    let totalCollected = 0;
    let outstandingBalance = 0;
    let paidInvoicesCount = 0;
    let defaultersCount = 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let todayCollected = 0;
    let todayTransactionsCount = 0;
    let thisMonthCollected = 0;

    const methodBreakdown: Record<
      string,
      { count: number; totalAmount: number }
    > = {
      cash: { count: 0, totalAmount: 0 },
      cheque: { count: 0, totalAmount: 0 },
      dd: { count: 0, totalAmount: 0 },
      online: { count: 0, totalAmount: 0 },
      card: { count: 0, totalAmount: 0 },
      bank_transfer: { count: 0, totalAmount: 0 },
      other: { count: 0, totalAmount: 0 },
    };

    const recentPayments: any[] = [];

    invoices.forEach((inv: any) => {
      grossInvoiced += inv.subtotal || inv.totalAmount;
      totalConcessions += inv.concessionAmount || 0;
      netInvoiced += inv.totalAmount || 0;
      totalCollected += inv.paidAmount || 0;
      outstandingBalance += inv.balance || 0;

      if (inv.status === 'paid' || inv.balance === 0) {
        paidInvoicesCount++;
      } else if (inv.balance > 0) {
        defaultersCount++;
      }

      if (inv.payments && inv.payments.length > 0) {
        inv.payments.forEach((p: any) => {
          const pDate = new Date(p.paymentDate);
          if (pDate >= startOfToday) {
            todayCollected += p.amount;
            todayTransactionsCount++;
          }
          if (pDate >= startOfMonth) {
            thisMonthCollected += p.amount;
          }

          const m = p.paymentMethod || 'other';
          if (!methodBreakdown[m]) {
            methodBreakdown[m] = { count: 0, totalAmount: 0 };
          }
          methodBreakdown[m].count++;
          methodBreakdown[m].totalAmount += p.amount;

          recentPayments.push({
            receiptNumber: p.receiptNumber,
            invoiceNumber: inv.invoiceNumber,
            studentId: inv.studentId,
            amount: p.amount,
            paymentMethod: p.paymentMethod,
            paymentDate: p.paymentDate,
            recordedByName: p.recordedByName,
          });
        });
      }
    });

    recentPayments.sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );

    const collectionRate =
      netInvoiced > 0 ? Math.round((totalCollected / netInvoiced) * 100) : 0;

    res.json({
      success: true,
      stats: {
        grossInvoiced,
        totalConcessions,
        netInvoiced,
        totalCollected,
        outstandingBalance,
        collectionRate,
        totalInvoicesCount: invoices.length,
        paidInvoicesCount,
        defaultersCount,
        todayCollected,
        todayTransactionsCount,
        thisMonthCollected,
        methodBreakdown,
        recentPayments: recentPayments.slice(0, 10),
      },
    });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch collection dashboard',
      });
  }
}

export async function getDailyFeeBook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      date,
      paymentMethod,
      page = 1,
      limit = 50,
      export: exportType,
    } = req.query;

    const selectedDateStr = date
      ? date.toString()
      : new Date().toISOString().split('T')[0];

    const startOfDay = new Date(selectedDateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(selectedDateStr + 'T23:59:59.999Z');

    const invoices = await FeeInvoice.find({
      schoolId,
      'payments.paymentDate': { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('studentId', 'name email')
      .populate('classSectionId', 'name section')
      .lean();

    const studentUserIds = invoices
      .map((inv: any) => inv.studentId?._id)
      .filter(Boolean);
    const profiles = await StudentProfile.find({
      schoolId,
      userId: { $in: studentUserIds },
    })
      .select('userId admissionNumber')
      .lean();

    const profileMap = new Map<string, any>();
    profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

    const records: any[] = [];

    invoices.forEach((inv: any) => {
      const prof = inv.studentId?._id
        ? profileMap.get(inv.studentId._id.toString())
        : null;
      (inv.payments || []).forEach((p: any) => {
        const pDate = new Date(p.paymentDate);
        if (pDate >= startOfDay && pDate <= endOfDay) {
          if (
            paymentMethod &&
            paymentMethod !== 'all' &&
            p.paymentMethod !== paymentMethod
          ) {
            return;
          }
          records.push({
            receiptNumber: p.receiptNumber,
            invoiceNumber: inv.invoiceNumber,
            studentId: inv.studentId?._id?.toString(),
            studentName: inv.studentId?.name || 'Unknown',
            admissionNumber: prof?.admissionNumber || '',
            className: inv.classSectionId?.name || '',
            section: inv.classSectionId?.section || '',
            amount: p.amount,
            paymentMethod: p.paymentMethod,
            transactionRef: p.transactionRef,
            paymentDate: p.paymentDate,
            recordedById: p.recordedById,
            recordedByName: p.recordedByName,
            notes: p.notes,
          });
        }
      });
    });

    records.sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );

    if (exportType === 'csv') {
      const csvData = formatDailyFeeBookCsv(records, selectedDateStr);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="daily-fee-book-${selectedDateStr}.csv"`
      );
      res.send(csvData);
      return;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const paginated = records.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    const totalCollected = records.reduce((sum, r) => sum + r.amount, 0);

    res.json({
      success: true,
      date: selectedDateStr,
      records: paginated,
      summary: {
        totalCollected,
        transactionCount: records.length,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: records.length,
        totalPages: Math.ceil(records.length / limitNum),
      },
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch daily fee book' });
  }
}
