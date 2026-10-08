import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models';
import { ParentProfile, StudentProfile } from '../models';
import {
  createAuditLog,
  sendCredentialEmail,
} from '../services/notificationService';
import {
  uploadImageToCloudinary,
  deleteFromCloudinary,
} from '../config/cloudinary';
import { School } from '../models';

export async function getParents(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;
    const userId = req.user!.userId;
    const { search, page = 1, limit = 20 } = req.query;

    const query: any = { schoolId };

    if (userRole === 'parent') {
      query.userId = new mongoose.Types.ObjectId(userId);
    }

    if (search) {
      const regex = new RegExp(search.toString().trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [parents, total] = await Promise.all([
      ParentProfile.find(query)
        .populate({
          path: 'linkedStudentUserIds',
          select: 'name email',
        })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ParentProfile.countDocuments(query),
    ]);

    const allLinkedUserIds = parents.flatMap(
      (p) => p.linkedStudentUserIds || []
    );
    const studentProfiles = await StudentProfile.find({
      schoolId,
      userId: { $in: allLinkedUserIds },
    })
      .populate('classSectionId', 'name section')
      .lean();

    const studentMap = new Map<string, any>();
    for (const sp of studentProfiles) {
      studentMap.set(sp.userId.toString(), sp);
    }

    const formatted = parents.map((p) => {
      const linked = (p.linkedStudentUserIds || [])
        .map((u: any) => {
          const sp = studentMap.get(u._id ? u._id.toString() : u.toString());
          if (!sp) return null;
          return {
            studentId: sp._id.toString(),
            studentUserId: sp.userId.toString(),
            name: sp.name,
            admissionNumber: sp.admissionNumber,
            className: (sp.classSectionId as any)?.name || '',
            section: (sp.classSectionId as any)?.section || '',
            rollNumber: sp.rollNumber,
          };
        })
        .filter(Boolean);

      return {
        _id: p._id,
        userId: p.userId,
        name: p.name,
        email: p.email,
        phone: p.phone,
        relationship: p.relationship,
        occupation: p.occupation,
        address: p.address,
        linkedStudents: linked,
      };
    });

    res.json({
      success: true,
      parents: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error in getParents:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch parents' });
  }
}

export async function getParentById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;
    const userId = req.user!.userId;

    const isObjectId = mongoose.isValidObjectId(id);
    const parent = await ParentProfile.findOne({
      schoolId,
      ...(isObjectId ? { $or: [{ _id: id }, { userId: id }] } : { _id: id }),
    }).lean();
    if (!parent) {
      res.status(404).json({ success: false, message: 'Parent not found' });
      return;
    }

    if (userRole === 'parent' && parent.userId.toString() !== userId) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const studentProfiles = await StudentProfile.find({
      schoolId,
      userId: { $in: parent.linkedStudentUserIds || [] },
    })
      .populate('classSectionId', 'name section')
      .lean();

    const linkedStudents = studentProfiles.map((sp) => ({
      studentId: sp._id.toString(),
      studentUserId: sp.userId.toString(),
      name: sp.name,
      admissionNumber: sp.admissionNumber,
      className: (sp.classSectionId as any)?.name || '',
      section: (sp.classSectionId as any)?.section || '',
      rollNumber: sp.rollNumber,
      status: sp.status,
    }));

    res.json({
      success: true,
      parent: {
        ...parent,
        linkedStudents,
      },
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to retrieve parent details' });
  }
}

export async function createParent(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      name,
      email,
      phone,
      relationship = 'guardian',
      occupation,
      address,
      studentIds = [],
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res
        .status(400)
        .json({
          success: false,
          message: 'User with this email already exists',
        });
      return;
    }

    const defaultPassword = 'Password@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = await User.create({
      schoolId,
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'parent',
      isActive: true,
      phone,
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const studentUserIds: mongoose.Types.ObjectId[] = [];
    if (studentIds.length > 0) {
      const students = await StudentProfile.find({
        schoolId,
        _id: { $in: studentIds },
      });
      for (const st of students) {
        studentUserIds.push(st.userId);
        if (
          !st.parentIds.some((pid) => pid.toString() === user._id.toString())
        ) {
          st.parentIds.push(user._id);
          st.parentName = name;
          st.parentPhone = phone;
          st.parentEmail = email;
          st.parentRelationship = relationship;
          await st.save();
        }
      }
    }

    const parentProfile = await ParentProfile.create({
      schoolId,
      userId: user._id,
      name,
      email: email.toLowerCase(),
      phone,
      relationship,
      occupation,
      address,
      linkedStudentUserIds: studentUserIds,
    });

    const school = await School.findById(schoolId);
    await sendCredentialEmail({
      to: email.toLowerCase(),
      name,
      role: 'parent',
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
      action: 'USER_LOGIN',
      entityType: 'auth',
      entityId: parentProfile._id.toString(),
      details: `Created parent account for ${name} (${email}) with ${studentIds.length} linked child(ren).`,
      req,
    });

    res.status(201).json({ success: true, parent: parentProfile });
  } catch (error) {
    console.error('Error in createParent:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to create parent account' });
  }
}

export async function linkChild(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { parentId, studentId } = req.body;

    const parent = await ParentProfile.findOne({ _id: parentId, schoolId });
    if (!parent) {
      res
        .status(404)
        .json({ success: false, message: 'Parent profile not found' });
      return;
    }

    const student = await StudentProfile.findOne({ _id: studentId, schoolId });
    if (!student) {
      res
        .status(404)
        .json({ success: false, message: 'Student profile not found' });
      return;
    }

    if (
      !parent.linkedStudentUserIds.some(
        (uid) => uid.toString() === student.userId.toString()
      )
    ) {
      parent.linkedStudentUserIds.push(student.userId);
      await parent.save();
    }

    if (
      !student.parentIds.some(
        (pid) => pid.toString() === parent.userId.toString()
      )
    ) {
      student.parentIds.push(parent.userId);
      if (!student.parentName) {
        student.parentName = parent.name;
        student.parentEmail = parent.email;
        student.parentPhone = parent.phone;
        student.parentRelationship = parent.relationship;
      }
      await student.save();
    }

    res.json({
      success: true,
      message: 'Student successfully linked to parent.',
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to link student to parent' });
  }
}

export async function unlinkChild(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { parentId, studentId } = req.body;

    const parent = await ParentProfile.findOne({ _id: parentId, schoolId });
    const student = await StudentProfile.findOne({ _id: studentId, schoolId });

    if (parent && student) {
      parent.linkedStudentUserIds = parent.linkedStudentUserIds.filter(
        (uid) => uid.toString() !== student.userId.toString()
      );
      await parent.save();

      student.parentIds = student.parentIds.filter(
        (pid) => pid.toString() !== parent.userId.toString()
      );
      await student.save();
    }

    res.json({ success: true, message: 'Student unlinked successfully.' });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to unlink student' });
  }
}

export async function uploadParentPhoto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;

    const parent = await ParentProfile.findOne({ _id: id, schoolId });
    if (!parent) {
      res.status(404).json({ success: false, message: 'Parent not found' });
      return;
    }

    const canUpload =
      userRole === 'admin' ||
      (userRole === 'parent' && parent.userId.toString() === req.user!.userId);

    if (!canUpload) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot update photo for this parent',
      });
      return;
    }

    const file = req.file;
    const photoData = req.body?.photoData || req.body?.photo;

    if (!file && !photoData) {
      res.status(400).json({ success: false, message: 'Photo file or photo data is required' });
      return;
    }

    if (parent.photoPublicId) {
      await deleteFromCloudinary(parent.photoPublicId, 'image');
    }

    let uploadRes;
    if (file) {
      uploadRes = await uploadImageToCloudinary(
        file.buffer,
        'eduhub/parents/profile-images',
        file.originalname
      );
    } else {
      uploadRes = await uploadImageToCloudinary(
        photoData,
        'eduhub/parents/profile-images',
        `${parent._id}_photo.jpg`
      );
    }

    parent.photo = uploadRes.url;
    parent.photoPublicId = uploadRes.publicId;
    await parent.save();

    await User.findByIdAndUpdate(parent.userId, {
      avatar: uploadRes.url,
      avatarPublicId: uploadRes.publicId,
    });

    res.json({
      success: true,
      message: 'Parent photo updated successfully',
      photoUrl: uploadRes.url,
      publicId: uploadRes.publicId,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to upload photo' });
  }
}

export async function deleteParentPhoto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;

    const parent = await ParentProfile.findOne({ _id: id, schoolId });
    if (!parent) {
      res.status(404).json({ success: false, message: 'Parent not found' });
      return;
    }

    const canDelete =
      userRole === 'admin' ||
      (userRole === 'parent' && parent.userId.toString() === req.user!.userId);

    if (!canDelete) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot delete photo for this parent',
      });
      return;
    }

    if (parent.photoPublicId) {
      await deleteFromCloudinary(parent.photoPublicId, 'image');
    }

    parent.photo = undefined;
    parent.photoPublicId = undefined;
    await parent.save();

    await User.findByIdAndUpdate(parent.userId, {
      avatar: undefined,
      avatarPublicId: undefined,
    });

    res.json({ success: true, message: 'Parent photo removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to delete photo' });
  }
}
