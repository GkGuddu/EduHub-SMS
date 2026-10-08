import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuditLog } from '../models';

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      action,
      entityType,
      module,
      actor,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 30,
    } = req.query;

    const query: any = { schoolId };

    if (action && action !== 'all') {
      query.action = action;
    }

    const effectiveModule = (module || entityType) as string;
    if (effectiveModule && effectiveModule !== 'all') {
      query.entityType = effectiveModule;
    }

    if (actor && actor !== 'all') {
      const actorStr = actor.toString().trim();
      if (mongoose.isValidObjectId(actorStr)) {
        query.userId = actorStr;
      } else {
        query.userName = new RegExp(actorStr, 'i');
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search) {
      const regex = new RegExp(search.toString().trim(), 'i');
      query.$or = [
        { details: regex },
        { userName: regex },
        { ipAddress: regex },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      logs,
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
      .json({ success: false, message: 'Failed to fetch audit logs' });
  }
}
