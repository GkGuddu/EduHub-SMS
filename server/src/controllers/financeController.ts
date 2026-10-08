import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Expense, FeeInvoice, AuditLog } from '../models';
import {
  ExpenseCreateSchema,
  hasPermission,
  PERMISSIONS,
  ExpenseCategory,
  PaymentMethod,
} from '@eduhub/shared';

export async function getExpenses(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;
    const userPermissions = req.user!.permissions;

    if (!hasPermission(userRole, userPermissions, PERMISSIONS.FINANCE_VIEW)) {
      res
        .status(403)
        .json({
          success: false,
          message: 'Unauthorized to view financial records',
        });
      return;
    }

    const {
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query: any = { schoolId };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    if (search) {
      const regex = new RegExp(search.toString().trim(), 'i');
      query.$or = [{ title: regex }, { payee: regex }, { description: regex }];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Expense.countDocuments(query),
    ]);

    res.json({
      success: true,
      expenses,
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
      .json({ success: false, message: 'Failed to retrieve expense ledger' });
  }
}

export async function createExpense(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;
    const userPermissions = req.user!.permissions;

    if (!hasPermission(userRole, userPermissions, PERMISSIONS.FINANCE_MANAGE)) {
      res
        .status(403)
        .json({
          success: false,
          message: 'Unauthorized to record financial expenses',
        });
      return;
    }

    const parsed = ExpenseCreateSchema.parse(req.body);

    const expense = await Expense.create({
      schoolId,
      category: parsed.category,
      title: parsed.title,
      amount: parsed.amount,
      payee: parsed.payee,
      paymentDate: new Date(parsed.paymentDate),
      paymentMethod: parsed.paymentMethod,
      description: parsed.description,
      attachmentName: parsed.attachmentName,
      attachmentUrl: parsed.attachmentUrl,
      attachmentSize: parsed.attachmentSize,
      recordedById: req.user!.userId,
      recordedByName: req.user!.name || 'Authorized Admin',
    });

    await AuditLog.create({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name || 'Admin',
      userRole: req.user!.role,
      action: 'EXPENSE_CREATE',
      entityType: 'finance',
      entityId: expense._id.toString(),
      details: `Recorded expense of ₹${parsed.amount.toLocaleString()} for "${parsed.title}" (${parsed.category}) paid to ${parsed.payee}`,
      ipAddress: req.ip,
      metadata: {
        amount: parsed.amount,
        category: parsed.category,
        payee: parsed.payee,
        paymentMethod: parsed.paymentMethod,
      },
    });

    res.status(201).json({ success: true, expense });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res
        .status(400)
        .json({
          success: false,
          message: error.errors[0]?.message || 'Validation error',
        });
      return;
    }
    res
      .status(500)
      .json({ success: false, message: 'Failed to record expense' });
  }
}

export async function deleteExpense(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;
    const userPermissions = req.user!.permissions;

    if (!hasPermission(userRole, userPermissions, PERMISSIONS.FINANCE_MANAGE)) {
      res
        .status(403)
        .json({ success: false, message: 'Unauthorized to delete expenses' });
      return;
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res
        .status(400)
        .json({ success: false, message: 'Invalid expense identifier' });
      return;
    }

    const expense = await Expense.findOneAndDelete({ _id: id, schoolId });
    if (!expense) {
      res
        .status(404)
        .json({ success: false, message: 'Expense record not found' });
      return;
    }

    await AuditLog.create({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name || 'Admin',
      userRole: req.user!.role,
      action: 'EXPENSE_DELETE',
      entityType: 'finance',
      entityId: id,
      details: `Deleted expense of ₹${expense.amount} for "${expense.title}"`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Expense record removed successfully' });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete expense' });
  }
}

export async function getFinanceSummary(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;
    const userPermissions = req.user!.permissions;

    if (!hasPermission(userRole, userPermissions, PERMISSIONS.FINANCE_VIEW)) {
      res
        .status(403)
        .json({
          success: false,
          message: 'Unauthorized to view financial summary',
        });
      return;
    }

    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const invoices = await FeeInvoice.find({
      schoolId,
      'payments.paymentDate': { $gte: start, $lte: end },
    }).lean();

    const seenReceipts = new Set<string>();
    let totalIncome = 0;
    const methodIncomeMap: Record<string, number> = {};

    for (const inv of invoices) {
      for (const p of inv.payments || []) {
        const pDate = new Date(p.paymentDate);
        if (pDate >= start && pDate <= end) {
          const receiptKey =
            p.receiptNumber || `${inv._id}-${p.amount}-${pDate.getTime()}`;
          if (!seenReceipts.has(receiptKey)) {
            seenReceipts.add(receiptKey);
            totalIncome += p.amount;
            methodIncomeMap[p.paymentMethod] =
              (methodIncomeMap[p.paymentMethod] || 0) + p.amount;
          }
        }
      }
    }

    const expenses = await Expense.find({
      schoolId,
      paymentDate: { $gte: start, $lte: end },
    }).lean();

    let totalExpenses = 0;
    const categoryMap: Record<string, { amount: number; count: number }> = {};
    const methodExpenseMap: Record<string, number> = {};

    for (const exp of expenses) {
      totalExpenses += exp.amount;
      if (!categoryMap[exp.category]) {
        categoryMap[exp.category] = { amount: 0, count: 0 };
      }
      categoryMap[exp.category].amount += exp.amount;
      categoryMap[exp.category].count += 1;
      methodExpenseMap[exp.paymentMethod] =
        (methodExpenseMap[exp.paymentMethod] || 0) + exp.amount;
    }

    const categoryBreakdown = Object.entries(categoryMap).map(
      ([category, stats]) => ({
        category: category as ExpenseCategory,
        amount: stats.amount,
        count: stats.count,
        percentage:
          totalExpenses > 0
            ? Math.round((stats.amount / totalExpenses) * 100)
            : 0,
      })
    );

    const allMethods = new Set([
      ...Object.keys(methodIncomeMap),
      ...Object.keys(methodExpenseMap),
    ]);

    const methodBreakdown = Array.from(allMethods).map((method) => ({
      method: method as PaymentMethod,
      incomeAmount: methodIncomeMap[method] || 0,
      expenseAmount: methodExpenseMap[method] || 0,
    }));

    res.json({
      success: true,
      summary: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        receiptsCount: seenReceipts.size,
        expensesCount: expenses.length,
        categoryBreakdown,
        methodBreakdown,
      },
    });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to calculate financial statement',
      });
  }
}
