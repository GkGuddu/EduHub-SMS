import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  User,
  TeacherProfile,
  ClassSubjectAssignment,
  School,
} from '../models';
import { DEFAULT_TEACHER_PERMISSIONS } from '@eduhub/shared';
import {
  createAuditLog,
  sendCredentialEmail,
} from '../services/notificationService';
import {
  uploadImageToCloudinary,
  deleteFromCloudinary,
} from '../config/cloudinary';

export async function getTeachers(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { search, status = 'active', page, limit } = req.query;

    const query: any = { schoolId };
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const regex = new RegExp(search.toString().trim(), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { employeeId: regex },
        { specialization: regex },
      ];
    }

    let teachersQuery = TeacherProfile.find(query).sort({ name: 1 });

    const total = await TeacherProfile.countDocuments(query);

    let pageNum = 1;
    let limitNum = total || 50;

    if (page && limit) {
      pageNum = Math.max(1, Number(page));
      limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;
      teachersQuery = teachersQuery.skip(skip).limit(limitNum);
    }

    const teachers = await teachersQuery.lean();

    const teacherUserIds = teachers.map((t) => t.userId);
    const assignments = await ClassSubjectAssignment.find({
      schoolId,
      teacherId: { $in: teacherUserIds },
    })
      .populate('classSectionId', 'name section')
      .populate('subjectId', 'name code')
      .lean();

    const assignmentMap = new Map<string, any[]>();
    for (const a of assignments) {
      const uid = a.teacherId.toString();
      if (!assignmentMap.has(uid)) assignmentMap.set(uid, []);
      assignmentMap.get(uid)!.push({
        _id: a._id,
        classSectionId: (a.classSectionId as any)?._id,
        className: (a.classSectionId as any)?.name,
        section: (a.classSectionId as any)?.section,
        subjectId: (a.subjectId as any)?._id,
        subjectName: (a.subjectId as any)?.name,
        subjectCode: (a.subjectId as any)?.code,
      });
    }

    const users = await User.find({ _id: { $in: teacherUserIds } }).select(
      '_id permissions'
    );
    const permMap = new Map(
      users.map((u) => [u._id.toString(), u.permissions || []])
    );

    const formatted = teachers.map((t) => ({
      ...t,
      assignedClasses: assignmentMap.get(t.userId.toString()) || [],
      permissions:
        permMap.get(t.userId.toString()) || DEFAULT_TEACHER_PERMISSIONS,
    }));

    res.json({
      success: true,
      teachers: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / (limitNum || 1)),
      },
    });
  } catch (error) {
    console.error('Error in getTeachers:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch teachers' });
  }
}

export async function getTeacherById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const teacher = await TeacherProfile.findOne({ _id: id, schoolId }).lean();
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    const assignments = await ClassSubjectAssignment.find({
      schoolId,
      teacherId: teacher.userId,
    })
      .populate('classSectionId', 'name section')
      .populate('subjectId', 'name code')
      .lean();

    const assignedClasses = assignments.map((a) => ({
      _id: a._id,
      classSectionId: (a.classSectionId as any)?._id,
      className: (a.classSectionId as any)?.name,
      section: (a.classSectionId as any)?.section,
      subjectId: (a.subjectId as any)?._id,
      subjectName: (a.subjectId as any)?.name,
      subjectCode: (a.subjectId as any)?.code,
    }));

    const user = await User.findById(teacher.userId).select(
      'permissions isActive'
    );

    res.json({
      success: true,
      teacher: {
        ...teacher,
        assignedClasses,
        permissions: user?.permissions || DEFAULT_TEACHER_PERMISSIONS,
        isActive: user?.isActive ?? true,
      },
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch teacher details' });
  }
}

export async function createTeacher(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      name,
      email,
      employeeId,
      phone,
      gender,
      qualification,
      specialization,
      experienceYears = 0,
      joiningDate,
      assignedClasses = [],
    } = req.body;

    const existingEmp = await TeacherProfile.findOne({
      schoolId,
      employeeId: employeeId.trim(),
    });
    if (existingEmp) {
      res
        .status(400)
        .json({ success: false, message: 'Employee ID already exists' });
      return;
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      res
        .status(400)
        .json({
          success: false,
          message: 'A user with this email address already exists',
        });
      return;
    }

    const defaultPassword = 'Password@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = await User.create({
      schoolId,
      email: email.toLowerCase().trim(),
      passwordHash,
      name,
      role: 'teacher',
      isActive: true,
      phone,
      permissions: DEFAULT_TEACHER_PERMISSIONS,
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const teacher = await TeacherProfile.create({
      schoolId,
      userId: user._id,
      employeeId: employeeId.trim(),
      name,
      email: email.toLowerCase().trim(),
      phone,
      gender,
      qualification,
      specialization,
      experienceYears,
      joiningDate: new Date(joiningDate),
      status: 'active',
    });

    if (assignedClasses.length > 0) {
      for (const item of assignedClasses) {
        if (item.classSectionId && item.subjectId) {
          await ClassSubjectAssignment.create({
            schoolId,
            classSectionId: item.classSectionId,
            subjectId: item.subjectId,
            teacherId: user._id,
          });
        }
      }
    }

    const school = await School.findById(schoolId);
    await sendCredentialEmail({
      to: email.toLowerCase().trim(),
      name,
      role: 'teacher',
      schoolName: school?.name || 'Adiya School',
      tempPassword: defaultPassword,
      loginUrl: 'http://localhost:5173/login',
      generatedAt: new Date().toISOString(),
    });

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'TEACHER_CREATE',
      entityType: 'teacher',
      entityId: teacher._id.toString(),
      details: `Created teacher account for ${name} (${employeeId}) - ${specialization}.`,
      req,
    });

    res.status(201).json({ success: true, teacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to create teacher' });
  }
}

export async function updateTeacher(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const updates = req.body;

    const teacher = await TeacherProfile.findOne({ _id: id, schoolId });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    if (updates.employeeId && updates.employeeId !== teacher.employeeId) {
      const duplicateEmp = await TeacherProfile.findOne({
        schoolId,
        employeeId: updates.employeeId,
        _id: { $ne: teacher._id },
      });
      if (duplicateEmp) {
        res
          .status(400)
          .json({ success: false, message: 'Employee ID is already in use.' });
        return;
      }
    }

    if (updates.name || updates.email || updates.phone) {
      await User.findByIdAndUpdate(teacher.userId, {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email.toLowerCase().trim() }),
        ...(updates.phone && { phone: updates.phone }),
      });
    }

    if (Array.isArray(updates.assignedClasses)) {
      await ClassSubjectAssignment.deleteMany({
        schoolId,
        teacherId: teacher.userId,
      });
      for (const item of updates.assignedClasses) {
        if (item.classSectionId && item.subjectId) {
          await ClassSubjectAssignment.create({
            schoolId,
            classSectionId: item.classSectionId,
            subjectId: item.subjectId,
            teacherId: teacher.userId,
          });
        }
      }
    }

    Object.assign(teacher, updates);
    if (updates.joiningDate) {
      teacher.joiningDate = new Date(updates.joiningDate);
    }
    await teacher.save();

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'TEACHER_UPDATE',
      entityType: 'teacher',
      entityId: teacher._id.toString(),
      details: `Updated teacher record for ${teacher.name} (${teacher.employeeId}).`,
      req,
    });

    res.json({ success: true, teacher });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to update teacher' });
  }
}

export async function archiveTeacher(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const teacher = await TeacherProfile.findOne({ _id: id, schoolId });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    teacher.status = 'archived';
    await teacher.save();

    await User.findByIdAndUpdate(teacher.userId, { isActive: false });

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'TEACHER_UPDATE',
      entityType: 'teacher',
      entityId: teacher._id.toString(),
      details: `Archived teacher ${teacher.name} (${teacher.employeeId}) and deactivated login.`,
      req,
    });

    res.json({
      success: true,
      message: 'Teacher archived successfully',
      teacher,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to archive teacher' });
  }
}

export async function restoreTeacher(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const teacher = await TeacherProfile.findOne({ _id: id, schoolId });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    teacher.status = 'active';
    await teacher.save();

    await User.findByIdAndUpdate(teacher.userId, { isActive: true });

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'TEACHER_UPDATE',
      entityType: 'teacher',
      entityId: teacher._id.toString(),
      details: `Restored teacher ${teacher.name} (${teacher.employeeId}) and reactivated login.`,
      req,
    });

    res.json({
      success: true,
      message: 'Teacher restored successfully',
      teacher,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to restore teacher' });
  }
}

export async function uploadTeacherPhoto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;

    const teacher = await TeacherProfile.findOne({ _id: id, schoolId });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    const canUpload =
      userRole === 'admin' ||
      (userRole === 'teacher' && teacher.userId.toString() === req.user!.userId);

    if (!canUpload) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot update photo for this teacher',
      });
      return;
    }

    const file = req.file;
    const photoData = req.body?.photoData || req.body?.photo;

    if (!file && !photoData) {
      res.status(400).json({ success: false, message: 'Photo file or photo data is required' });
      return;
    }

    if (teacher.photoPublicId) {
      await deleteFromCloudinary(teacher.photoPublicId, 'image');
    }

    let uploadRes;
    if (file) {
      uploadRes = await uploadImageToCloudinary(
        file.buffer,
        'eduhub/teachers/profile-images',
        file.originalname
      );
    } else {
      uploadRes = await uploadImageToCloudinary(
        photoData,
        'eduhub/teachers/profile-images',
        `${teacher.employeeId}_photo.jpg`
      );
    }

    teacher.photo = uploadRes.url;
    teacher.photoPublicId = uploadRes.publicId;
    await teacher.save();

    await User.findByIdAndUpdate(teacher.userId, {
      avatar: uploadRes.url,
      avatarPublicId: uploadRes.publicId,
    });

    res.json({
      success: true,
      message: 'Teacher photo updated successfully',
      photoUrl: uploadRes.url,
      publicId: uploadRes.publicId,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to upload photo' });
  }
}

export async function deleteTeacherPhoto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;

    const teacher = await TeacherProfile.findOne({ _id: id, schoolId });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    const canDelete =
      userRole === 'admin' ||
      (userRole === 'teacher' && teacher.userId.toString() === req.user!.userId);

    if (!canDelete) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot delete photo for this teacher',
      });
      return;
    }

    if (teacher.photoPublicId) {
      await deleteFromCloudinary(teacher.photoPublicId, 'image');
    }

    teacher.photo = undefined;
    teacher.photoPublicId = undefined;
    await teacher.save();

    await User.findByIdAndUpdate(teacher.userId, {
      avatar: undefined,
      avatarPublicId: undefined,
    });

    res.json({ success: true, message: 'Teacher photo removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to delete photo' });
  }
}
