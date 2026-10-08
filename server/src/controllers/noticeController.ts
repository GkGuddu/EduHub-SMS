import { Request, Response } from 'express';
import {
  Notice,
  StudentProfile,
  ParentProfile,
  ClassSubjectAssignment,
} from '../models';
import {
  broadcastNotice,
  createAuditLog,
} from '../services/notificationService';
import { NoticeCreateSchema, hasPermission, PERMISSIONS } from '@eduhub/shared';

export async function getNotices(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const { status, category } = req.query;

    await Notice.updateMany(
      {
        schoolId,
        status: 'scheduled',
        scheduledFor: { $lte: new Date() },
      },
      { $set: { status: 'published' } }
    );

    const query: any = { schoolId };

    if (category) {
      query.category = category;
    }

    if (role === 'admin') {
      if (status) {
        query.status = status;
      }
    } else {
      query.status = 'published';

      if (role === 'teacher') {
        const assignments = await ClassSubjectAssignment.find({
          schoolId,
          teacherId: req.user!.userId,
        }).lean();
        const assignedClassIds = assignments.map((a) => a.classSectionId);

        query.$or = [
          { targetRole: { $in: ['all', 'teachers'] } },
          { targetClassId: { $in: assignedClassIds } },
        ];
      } else if (role === 'student') {
        const studentProfile = await StudentProfile.findOne({
          schoolId,
          userId: req.user!.userId,
        }).lean();

        if (studentProfile) {
          query.$or = [
            { targetRole: { $in: ['all', 'students'] } },
            { targetClassId: studentProfile.classSectionId },
          ];
        } else {
          query.targetRole = { $in: ['all', 'students'] };
        }
      } else if (role === 'parent') {
        const parentProfile = await ParentProfile.findOne({
          schoolId,
          userId: req.user!.userId,
        }).lean();

        let linkedClassIds: any[] = [];
        if (parentProfile && parentProfile.linkedStudentUserIds?.length) {
          const children = await StudentProfile.find({
            schoolId,
            userId: { $in: parentProfile.linkedStudentUserIds },
          }).lean();
          linkedClassIds = children.map((c) => c.classSectionId);
        }

        query.$or = [
          { targetRole: { $in: ['all', 'parents'] } },
          { targetClassId: { $in: linkedClassIds } },
        ];
      }
    }

    const notices = await Notice.find(query)
      .populate('targetClassId', 'name section')
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    const formatted = notices.map((n: any) => ({
      _id: n._id,
      schoolId: n.schoolId,
      title: n.title,
      content: n.content,
      targetRole: n.targetRole,
      targetClassId: n.targetClassId?._id || n.targetClassId,
      targetClassName: n.targetClassId?.name,
      targetSection: n.targetClassId?.section,
      authorId: n.authorId,
      authorName: n.authorName,
      authorRole: n.authorRole,
      category: n.category,
      isPinned: n.isPinned,
      status: n.status || 'published',
      scheduledFor: n.scheduledFor ? n.scheduledFor.toISOString() : undefined,
      expiresAt: n.expiresAt ? n.expiresAt.toISOString() : undefined,
      createdAt: n.createdAt
        ? n.createdAt.toISOString()
        : new Date().toISOString(),
    }));

    res.json({ success: true, notices: formatted });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch notices' });
  }
}

export async function createNotice(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const parsed = NoticeCreateSchema.parse(req.body);

    const canCreate = hasPermission(
      role,
      req.user!.permissions,
      PERMISSIONS.NOTICES_CREATE
    );
    if (!canCreate) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Missing permission notices.create',
      });
      return;
    }

    let status = parsed.status || 'published';
    if (parsed.scheduledFor && new Date(parsed.scheduledFor) > new Date()) {
      status = 'scheduled';
    }

    const notice = await Notice.create({
      schoolId,
      title: parsed.title,
      content: parsed.content,
      targetRole: parsed.targetRole,
      targetClassId: parsed.targetClassId || undefined,
      targetSectionId: parsed.targetSectionId || undefined,
      authorId: req.user!.userId,
      authorName: req.user!.name,
      authorRole: req.user!.role,
      category: parsed.category,
      isPinned: parsed.isPinned,
      status,
      scheduledFor: parsed.scheduledFor
        ? new Date(parsed.scheduledFor)
        : undefined,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
    });

    if (status === 'published') {
      broadcastNotice(schoolId, parsed.targetRole, notice);
    }

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'TEACHER_CREATE' as any,
      entityType: 'notice',
      entityId: notice._id.toString(),
      details: `Created notice "${notice.title}" with status: ${status}.`,
      req,
    });

    res.status(201).json({ success: true, notice });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res
        .status(400)
        .json({
          success: false,
          message: error.errors[0]?.message || 'Validation failed',
        });
      return;
    }
    res
      .status(500)
      .json({ success: false, message: 'Failed to create notice' });
  }
}

export async function publishNotice(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const { id } = req.params;

    const canPublish = hasPermission(
      role,
      req.user!.permissions,
      PERMISSIONS.NOTICES_PUBLISH
    );
    if (!canPublish) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Missing permission notices.publish',
      });
      return;
    }

    const notice = await Notice.findOneAndUpdate(
      { _id: id, schoolId },
      { status: 'published', scheduledFor: undefined },
      { new: true }
    );

    if (!notice) {
      res.status(404).json({ success: false, message: 'Notice not found' });
      return;
    }

    broadcastNotice(schoolId, notice.targetRole, notice);

    res.json({ success: true, notice });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to publish notice' });
  }
}

export async function archiveNotice(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const { id } = req.params;

    const canArchive = hasPermission(
      role,
      req.user!.permissions,
      PERMISSIONS.NOTICES_CREATE
    );
    if (!canArchive) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Missing permission to archive notice',
      });
      return;
    }

    const notice = await Notice.findOneAndUpdate(
      { _id: id, schoolId },
      { status: 'archived' },
      { new: true }
    );

    if (!notice) {
      res.status(404).json({ success: false, message: 'Notice not found' });
      return;
    }

    res.json({ success: true, notice });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to archive notice' });
  }
}

export async function deleteNotice(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const notice = await Notice.findOneAndDelete({ _id: id, schoolId });
    if (!notice) {
      res.status(404).json({ success: false, message: 'Notice not found' });
      return;
    }

    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete notice' });
  }
}
