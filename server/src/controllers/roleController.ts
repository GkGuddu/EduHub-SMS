import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models';
import { TeacherProfile } from '../models';
import { ClassSubjectAssignment } from '../models';
import {
  ALL_PERMISSION_DEFINITIONS,
  DEFAULT_TEACHER_PERMISSIONS,
} from '@eduhub/shared';
import { createAuditLog } from '../services/notificationService';
import { emitToUser } from '../sockets';

export async function getTeacherPermissionsList(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;

    const teachers = await TeacherProfile.find({
      schoolId,
      status: { $ne: 'archived' },
    }).sort({
      name: 1,
    });
    const userIds = teachers.map((t) => t.userId);

    const users = await User.find({ _id: { $in: userIds } }).select(
      '_id name email permissions permissionsUpdatedAt permissionsUpdatedByName'
    );
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const assignments = await ClassSubjectAssignment.find({
      schoolId,
      teacherId: { $in: userIds },
    })
      .populate('classSectionId', 'name section')
      .populate('subjectId', 'name code')
      .lean();

    const assignmentMap = new Map<string, any[]>();
    for (const a of assignments) {
      const uid = a.teacherId.toString();
      if (!assignmentMap.has(uid)) assignmentMap.set(uid, []);
      assignmentMap.get(uid)!.push({
        classSectionId: (a.classSectionId as any)?._id,
        className: (a.classSectionId as any)?.name,
        section: (a.classSectionId as any)?.section,
        subjectId: (a.subjectId as any)?._id,
        subjectName: (a.subjectId as any)?.name,
        subjectCode: (a.subjectId as any)?.code,
      });
    }

    const list = teachers.map((t) => {
      const user = userMap.get(t.userId.toString());
      return {
        teacherProfileId: t._id,
        userId: t.userId,
        employeeId: t.employeeId,
        name: t.name,
        email: t.email,
        phone: t.phone,
        specialization: t.specialization,
        qualification: t.qualification,
        experienceYears: t.experienceYears || 0,
        assignedClasses: assignmentMap.get(t.userId.toString()) || [],
        permissions: user?.permissions || DEFAULT_TEACHER_PERMISSIONS,
        permissionsUpdatedAt:
          user?.permissionsUpdatedAt || t.permissionsUpdatedAt,
        permissionsUpdatedByName:
          user?.permissionsUpdatedByName || t.permissionsUpdatedByName,
      };
    });

    res.json({
      success: true,
      permissionsDefinitions: ALL_PERMISSION_DEFINITIONS,
      defaultTeacherPermissions: DEFAULT_TEACHER_PERMISSIONS,
      teachers: list,
    });
  } catch (error) {
    console.error('Error in getTeacherPermissionsList:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to retrieve permissions list' });
  }
}

export async function updateTeacherPermissions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { teacherUserId, permissions, reason } = req.body;

    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message:
          'Forbidden: Only administrators can modify roles and permissions.',
      });
      return;
    }

    if (req.user!.userId === teacherUserId) {
      res.status(403).json({
        success: false,
        message:
          'Forbidden: You cannot modify your own administrative permissions.',
      });
      return;
    }

    const user = await User.findOne({
      _id: new mongoose.Types.ObjectId(teacherUserId),
      schoolId,
      role: 'teacher',
    });

    if (!user) {
      res
        .status(404)
        .json({ success: false, message: 'Teacher account not found' });
      return;
    }

    const now = new Date();
    const adminName = req.user!.name;
    const previousPermissions = [...(user.permissions || [])];

    user.permissions = permissions;
    user.permissionsUpdatedAt = now;
    user.permissionsUpdatedByName = adminName;
    await user.save();

    const teacher = await TeacherProfile.findOneAndUpdate(
      { userId: user._id },
      { permissionsUpdatedAt: now, permissionsUpdatedByName: adminName },
      { new: true }
    );

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'PERMISSION_UPDATE',
      entityType: 'permission',
      entityId: user._id.toString(),
      details: `Updated permissions for teacher ${user.name} (${teacher?.employeeId || ''}). Reason: ${reason || 'Administrative adjustment'}. Granted count: ${permissions.length}. Admin: ${adminName}.`,
      metadata: {
        previousPermissions,
        newPermissions: permissions,
        reason,
        updatedBy: adminName,
        updatedAt: now.toISOString(),
      },
      req,
    });

    emitToUser(user._id.toString(), 'permissions_updated', {
      permissions,
      message:
        'Your system permissions have been updated by the administrator.',
    });

    res.json({
      success: true,
      message: `Permissions updated successfully for ${user.name}`,
      permissions: user.permissions,
      permissionsUpdatedAt: user.permissionsUpdatedAt,
      permissionsUpdatedByName: user.permissionsUpdatedByName,
    });
  } catch (error) {
    console.error('Error in updateTeacherPermissions:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to update permissions' });
  }
}
