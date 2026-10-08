import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models';
import { StudentProfile, ParentProfile, TeacherProfile } from '../models';
import { ClassSection, ClassSubjectAssignment } from '../models';
import { AttendanceRecord } from '../models';
import { FeeInvoice } from '../models';
import { GradeRecord } from '../models';
import { School } from '../models';
import {
  createAuditLog,
  processDocumentUpload,
  sendCredentialEmail,
} from '../services/notificationService';
import {
  uploadImageToCloudinary,
  uploadPdfToCloudinary,
  deleteFromCloudinary,
} from '../config/cloudinary';

export async function generateAdmissionNumber(
  schoolId: string
): Promise<string> {
  const currentYear = new Date().getFullYear();
  const count = await StudentProfile.countDocuments({ schoolId });
  let seq = count + 1;
  let candidate = `ADM-${currentYear}-${seq.toString().padStart(4, '0')}`;
  while (
    await StudentProfile.findOne({ schoolId, admissionNumber: candidate })
  ) {
    seq++;
    candidate = `ADM-${currentYear}-${seq.toString().padStart(4, '0')}`;
  }
  return candidate;
}

export async function getSuggestedAdmissionNumber(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const admissionNumber = await generateAdmissionNumber(schoolId);
    res.json({ success: true, admissionNumber });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to generate admission number' });
  }
}

export async function getStudents(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;
    const userId = req.user!.userId;

    const {
      search,
      classSectionId,
      status = 'active',
      feeStatus,
      page = 1,
      limit = 20,
    } = req.query;

    const query: any = { schoolId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (userRole === 'student') {
      query.userId = new mongoose.Types.ObjectId(userId);
    } else if (userRole === 'parent') {
      const parentProf = await ParentProfile.findOne({ userId, schoolId });
      const linkedUids = parentProf?.linkedStudentUserIds || [];
      query.$or = [
        { parentIds: new mongoose.Types.ObjectId(userId) },
        { userId: { $in: linkedUids } },
      ];
    } else if (userRole === 'teacher') {
      const assignments = await ClassSubjectAssignment.find({
        schoolId,
        teacherId: userId,
      }).select('classSectionId');
      const classIds = assignments.map((a) => a.classSectionId);

      if (classSectionId) {
        const matches = classIds.some(
          (id) => id.toString() === classSectionId.toString()
        );
        if (!matches) {
          res
            .status(403)
            .json({
              success: false,
              message: 'You are not assigned to this class.',
            });
          return;
        }
        query.classSectionId = new mongoose.Types.ObjectId(
          classSectionId.toString()
        );
      } else {
        query.classSectionId = { $in: classIds };
      }
    } else if (classSectionId) {
      query.classSectionId = new mongoose.Types.ObjectId(
        classSectionId.toString()
      );
    }

    if (search) {
      const searchRegex = new RegExp(search.toString().trim(), 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: searchRegex },
          { admissionNumber: searchRegex },
          { rollNumber: searchRegex },
          { email: searchRegex },
        ],
      });
    }

    if (feeStatus) {
      const feeInvoices = await FeeInvoice.find({
        schoolId,
        status: feeStatus,
      }).select('studentId');
      const studentIdsWithFee = feeInvoices.map((f) => f.studentId);
      query.userId = { $in: studentIdsWithFee };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [students, total] = await Promise.all([
      StudentProfile.find(query)
        .populate({
          path: 'classSectionId',
          select: 'name section classTeacherId',
          populate: {
            path: 'classTeacherId',
            select: 'name email',
          },
        })
        .populate('parentIds', 'name email phone')
        .sort({ rollNumber: 1, name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StudentProfile.countDocuments(query),
    ]);

    const studentUserIds = students.map((s) => s.userId);
    const invoices = await FeeInvoice.find({
      schoolId,
      studentId: { $in: studentUserIds },
    }).select('studentId status balance totalAmount');

    const invoiceMap = new Map<string, any>();
    for (const inv of invoices) {
      invoiceMap.set(inv.studentId.toString(), inv);
    }

    const formatted = students.map((s: any) => {
      const inv = invoiceMap.get(s.userId.toString());
      return {
        _id: s._id,
        userId: s.userId,
        admissionNumber: s.admissionNumber,
        rollNumber: s.rollNumber,
        name: s.name,
        email: s.email,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
        bloodGroup: s.bloodGroup,
        classSectionId: s.classSectionId?._id,
        className: s.classSectionId?.name,
        section: s.classSectionId?.section,
        classTeacherName: (s.classSectionId as any)?.classTeacherId?.name || null,
        address: s.address,
        emergencyContact: s.emergencyContact,
        parentName: s.parentName || (s.parentIds?.[0] as any)?.name,
        parentEmail: s.parentEmail || (s.parentIds?.[0] as any)?.email,
        parentPhone: s.parentPhone || (s.parentIds?.[0] as any)?.phone,
        status: s.status,
        photo: s.photo,
        documentsCount: s.documents?.length || 0,
        feeStatus: inv?.status || 'unpaid',
        feeBalance: inv?.balance ?? 0,
      };
    });

    res.json({
      success: true,
      students: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error in getStudents:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch students' });
  }
}

export async function getStudentById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;
    const userId = req.user!.userId;

    const student = await StudentProfile.findOne({ _id: id, schoolId })
      .populate({
        path: 'classSectionId',
        select: 'name section academicYear classTeacherId',
        populate: {
          path: 'classTeacherId',
          select: 'name email role avatar phone',
        },
      })
      .populate('parentIds', 'name email phone relationship');

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    if (userRole === 'student' && student.userId.toString() !== userId) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    if (userRole === 'parent') {
      const parentProf = await ParentProfile.findOne({ userId, schoolId });
      const linkedUids = (parentProf?.linkedStudentUserIds || []).map((uid) =>
        uid.toString()
      );
      const isParentLinked =
        student.parentIds.some(
          (p: any) => p._id.toString() === userId || p.toString() === userId
        ) || linkedUids.includes(student.userId.toString());

      if (!isParentLinked) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Parent cannot access an unrelated student',
        });
        return;
      }
    }

    if (userRole === 'teacher') {
      const isAssigned = await ClassSubjectAssignment.exists({
        schoolId,
        teacherId: userId,
        classSectionId: student.classSectionId._id,
      });
      if (!isAssigned) {
        res.status(403).json({
          success: false,
          message:
            'Forbidden: Student is not enrolled in any of your assigned classes',
        });
        return;
      }
    }

    const attendanceRecords = await AttendanceRecord.find({
      schoolId,
      classSectionId: student.classSectionId._id,
      'records.studentId': student.userId,
    }).lean();

    let present = 0;
    let late = 0;
    let absent = 0;

    for (const record of attendanceRecords) {
      const item = record.records.find(
        (r) => r.studentId.toString() === student.userId.toString()
      );
      if (item) {
        if (item.status === 'present') present++;
        else if (item.status === 'late') late++;
        else if (item.status === 'absent') absent++;
      }
    }

    const totalDays = present + late + absent;
    const attendanceRate =
      totalDays > 0
        ? Math.round(((present + late * 0.5) / totalDays) * 100)
        : 100;

    const invoices = await FeeInvoice.find({
      schoolId,
      studentId: student.userId,
    }).sort({ createdAt: -1 });

    const gradeRecords = await GradeRecord.find({
      schoolId,
      'grades.studentId': student.userId,
    })
      .select('examName subjectName maxMarks passingMarks status grades')
      .lean();

    const marksSummary = gradeRecords.map((gr: any) => {
      const item = gr.grades?.find(
        (g: any) => g.studentId.toString() === student.userId.toString()
      );
      return {
        examName: gr.examName,
        subjectName: gr.subjectName,
        maxMarks: gr.maxMarks,
        passingMarks: gr.passingMarks,
        marksObtained: item?.marksObtained ?? 0,
        grade: item?.grade ?? 'N/A',
        percentage: item?.percentage ?? 0,
        remarks: item?.remarks,
      };
    });

    let classTeacher: any = null;
    const sec = student.classSectionId as any;
    if (sec && sec.classTeacherId) {
      const teacherUser = sec.classTeacherId;
      const teacherProf = await TeacherProfile.findOne({
        schoolId,
        userId: teacherUser._id || teacherUser,
      }).lean();

      classTeacher = {
        userId: teacherUser._id || teacherUser,
        name: teacherUser.name || teacherProf?.name || 'Assigned Teacher',
        email: teacherUser.email || teacherProf?.email || '',
        phone: teacherUser.phone || teacherProf?.phone || '',
        avatar: teacherUser.avatar || '',
        employeeId: teacherProf?.employeeId || '',
        qualification: teacherProf?.qualification || '',
        specialization: teacherProf?.specialization || '',
      };
    }

    res.json({
      success: true,
      student,
      classTeacher,
      attendance: {
        rate: attendanceRate,
        present,
        late,
        absent,
        total: totalDays,
      },
      invoices,
      marksSummary,
    });
  } catch (error) {
    console.error('Error in getStudentById:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to retrieve student details' });
  }
}

export async function createStudent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      name,
      email,
      admissionNumber: inputAdmNum,
      rollNumber,
      gender,
      dateOfBirth,
      bloodGroup,
      classSectionId,
      parentName,
      parentEmail,
      parentPhone,
      parentRelationship = 'guardian',
      existingParentId,
      address,
      emergencyContact,
      initialFeeAmount = 5000,
    } = req.body;

    const classSection = await ClassSection.findOne({
      _id: classSectionId,
      schoolId,
    });
    if (!classSection) {
      res
        .status(400)
        .json({ success: false, message: 'Invalid class section.' });
      return;
    }

    let admissionNumber = inputAdmNum?.trim();
    if (!admissionNumber) {
      admissionNumber = await generateAdmissionNumber(schoolId);
    }

    const existingAdm = await StudentProfile.findOne({
      schoolId,
      admissionNumber,
    });
    if (existingAdm) {
      res
        .status(400)
        .json({ success: false, message: 'Admission number already exists.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res
        .status(400)
        .json({
          success: false,
          message: 'A user with this email address already exists.',
        });
      return;
    }

    const parentUserIds: mongoose.Types.ObjectId[] = [];
    let linkedParentProfile: any = null;

    if (existingParentId) {
      linkedParentProfile = await ParentProfile.findOne({
        _id: existingParentId,
        schoolId,
      });
      if (linkedParentProfile) {
        parentUserIds.push(linkedParentProfile.userId);
      }
    } else if (parentEmail && parentEmail.trim()) {
      let pUser = await User.findOne({
        email: parentEmail.toLowerCase().trim(),
      });
      if (!pUser) {
        const pPassword = 'Password@123';
        const pPasswordHash = await bcrypt.hash(pPassword, 10);
        pUser = await User.create({
          schoolId,
          email: parentEmail.toLowerCase().trim(),
          passwordHash: pPasswordHash,
          name: parentName || 'Guardian',
          role: 'parent',
          isActive: true,
          phone: parentPhone,
          mustChangePassword: true,
          temporaryPasswordExpiresAt: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ),
        });

        linkedParentProfile = await ParentProfile.create({
          schoolId,
          userId: pUser._id,
          name: parentName || 'Guardian',
          email: parentEmail.toLowerCase().trim(),
          phone: parentPhone || '',
          relationship: parentRelationship,
          address: address || '',
          linkedStudentUserIds: [],
        });

        const school = await School.findById(schoolId);
        await sendCredentialEmail({
          to: parentEmail.toLowerCase().trim(),
          name: parentName || 'Guardian',
          role: 'parent',
          schoolName: school?.name || 'Adiya School',
          tempPassword: pPassword,
          loginUrl: 'http://localhost:5173/login',
          generatedAt: new Date().toISOString(),
        });
      } else {
        linkedParentProfile = await ParentProfile.findOne({
          userId: pUser._id,
          schoolId,
        });
      }

      if (pUser) {
        parentUserIds.push(pUser._id);
      }
    }

    const defaultPassword = 'Password@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = await User.create({
      schoolId,
      email: email.toLowerCase().trim(),
      passwordHash,
      name,
      role: 'student',
      isActive: true,
      permissions: [],
      mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const initialEnrollment = {
      academicYear: classSection.academicYear || '2025-2026',
      classSectionId: classSection._id,
      className: classSection.name,
      section: classSection.section,
      rollNumber,
      enrolledAt: new Date(),
      status: 'active' as const,
    };

    const studentProfile = await StudentProfile.create({
      schoolId,
      userId: user._id,
      admissionNumber,
      rollNumber,
      name,
      email: email.toLowerCase().trim(),
      gender,
      dateOfBirth: new Date(dateOfBirth),
      bloodGroup,
      classSectionId,
      parentIds: parentUserIds,
      parentName: parentName || linkedParentProfile?.name,
      parentEmail: parentEmail || linkedParentProfile?.email,
      parentPhone: parentPhone || linkedParentProfile?.phone,
      parentRelationship,
      address,
      emergencyContact,
      status: 'active',
      documents: [],
      enrollmentHistory: [initialEnrollment],
    });

    if (linkedParentProfile) {
      if (
        !linkedParentProfile.linkedStudentUserIds.some(
          (id: any) => id.toString() === user._id.toString()
        )
      ) {
        linkedParentProfile.linkedStudentUserIds.push(user._id);
        await linkedParentProfile.save();
      }
    }

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    await FeeInvoice.create({
      schoolId,
      invoiceNumber,
      studentId: user._id,
      classSectionId,
      title: 'Term 1 Tuition & Activity Fee',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      totalAmount: initialFeeAmount,
      paidAmount: 0,
      balance: initialFeeAmount,
      status: 'unpaid',
      items: [
        { title: 'Tuition Fee', amount: initialFeeAmount * 0.8 },
        { title: 'Lab & Library Fee', amount: initialFeeAmount * 0.2 },
      ],
      payments: [],
    });

    const school = await School.findById(schoolId);
    await sendCredentialEmail({
      to: email.toLowerCase().trim(),
      name,
      role: 'student',
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
      action: 'STUDENT_CREATE',
      entityType: 'student',
      entityId: studentProfile._id.toString(),
      details: `Enrolled new student ${name} (Adm: ${admissionNumber}) in ${classSection.name}-${classSection.section}.`,
      req,
    });

    res.status(201).json({ success: true, student: studentProfile });
  } catch (error) {
    console.error('Error creating student:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to create student' });
  }
}

export async function updateStudent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const updates = req.body;

    const student = await StudentProfile.findOne({ _id: id, schoolId });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    if (
      updates.classSectionId &&
      updates.classSectionId.toString() !== student.classSectionId.toString()
    ) {
      const newClass = await ClassSection.findOne({
        _id: updates.classSectionId,
        schoolId,
      });
      if (newClass) {
        student.enrollmentHistory.push({
          academicYear: newClass.academicYear || '2025-2026',
          classSectionId: newClass._id,
          className: newClass.name,
          section: newClass.section,
          rollNumber: updates.rollNumber || student.rollNumber,
          enrolledAt: new Date(),
          status: 'active',
        });
      }
    }

    if (updates.name || updates.email) {
      await User.findByIdAndUpdate(student.userId, {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email.toLowerCase().trim() }),
      });
    }

    Object.assign(student, updates);
    if (updates.dateOfBirth) {
      student.dateOfBirth = new Date(updates.dateOfBirth);
    }
    await student.save();

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'STUDENT_UPDATE',
      entityType: 'student',
      entityId: student._id.toString(),
      details: `Updated student record for ${student.name} (${student.admissionNumber}).`,
      req,
    });

    res.json({ success: true, student });
  } catch (error) {
    console.error('Error in updateStudent:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to update student' });
  }
}

export async function archiveStudent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const student = await StudentProfile.findOne({ _id: id, schoolId });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    student.status = 'archived';
    await student.save();

    await User.findByIdAndUpdate(student.userId, { isActive: false });

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'STUDENT_DELETE',
      entityType: 'student',
      entityId: student._id.toString(),
      details: `Archived student ${student.name} (${student.admissionNumber}) and deactivated login.`,
      req,
    });

    res.json({
      success: true,
      message: 'Student archived successfully',
      student,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to archive student' });
  }
}

export async function restoreStudent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const student = await StudentProfile.findOne({ _id: id, schoolId });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    student.status = 'active';
    await student.save();

    await User.findByIdAndUpdate(student.userId, { isActive: true });

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'STUDENT_UPDATE',
      entityType: 'student',
      entityId: student._id.toString(),
      details: `Restored student ${student.name} (${student.admissionNumber}) and reactivated login.`,
      req,
    });

    res.json({
      success: true,
      message: 'Student restored successfully',
      student,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to restore student' });
  }
}

export async function canUserAccessStudentDocument(
  user: { userId: string; role: string; schoolId: string },
  student: any
): Promise<boolean> {
  if (user.role === 'admin') return true;
  if (user.role === 'student' && student.userId?.toString() === user.userId) return true;
  if (user.role === 'parent') {
    const parent = await ParentProfile.findOne({ schoolId: user.schoolId, userId: user.userId });
    const isLinked =
      parent?.linkedStudentUserIds?.some((id) => id.toString() === student.userId?.toString()) ||
      student.parentIds?.some((id: any) => id.toString() === user.userId);
    return !!isLinked;
  }
  if (user.role === 'teacher') {
    const classSecId = student.classSectionId?._id || student.classSectionId;
    const isSubjectAssigned = await ClassSubjectAssignment.exists({
      schoolId: user.schoolId,
      teacherId: user.userId,
      classSectionId: classSecId,
    });
    if (isSubjectAssigned) return true;
    const sec = await ClassSection.findById(classSecId);
    if (sec?.classTeacherId?.toString() === user.userId) return true;
    return false;
  }
  return false;
}

export async function addStudentDocument(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;
    const { title, docType, fileName, fileData, fileUrl, fileSize } = req.body;

    const student = await StudentProfile.findOne({ _id: id, schoolId });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const canUpload =
      userRole === 'admin' ||
      (userRole === 'teacher' && (
        req.user!.permissions?.includes('students.update') ||
        await canUserAccessStudentDocument(req.user!, student)
      )) ||
      (userRole === 'student' && student.userId.toString() === req.user!.userId);

    if (!canUpload) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot upload documents for this student',
      });
      return;
    }

    const file = req.file;

    if (file && file.size > 5 * 1024 * 1024) {
      res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed limit of 5 MB.',
      });
      return;
    }
    if (fileSize && Number(fileSize) > 5 * 1024 * 1024) {
      res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed limit of 5 MB.',
      });
      return;
    }

    if (!file && !fileName && !fileData && !fileUrl) {
      res.status(400).json({
        success: false,
        message: 'Please select a PDF document (.pdf) to upload.',
      });
      return;
    }

    const hasPdfFile =
      file &&
      (file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/x-pdf' ||
        file.mimetype.toLowerCase().includes('pdf') ||
        file.originalname.toLowerCase().endsWith('.pdf'));
    const isPdfExt = fileName && String(fileName).toLowerCase().endsWith('.pdf');
    const isPdfData =
      fileData &&
      (String(fileData).startsWith('data:application/pdf') ||
        String(fileData).includes('JVBERi0') ||
        String(fileData).includes('%PDF'));
    const isExistingPdfUrl = fileUrl && (String(fileUrl).includes('.pdf') || String(fileUrl).includes('eduhub/students/documents'));

    if (!hasPdfFile && !isPdfExt && !isPdfData && !isExistingPdfUrl) {
      res.status(400).json({
        success: false,
        message: 'Only PDF documents (.pdf) are permitted for student record uploads.',
      });
      return;
    }

    let finalFileUrl = fileUrl || '';
    let finalPublicId: string | undefined = undefined;
    let finalResourceType = 'raw';
    let finalFileName = file?.originalname || fileName || 'document.pdf';
    let finalFileSize = file?.size || Number(fileSize) || 0;

    if (file) {
      const uploadRes = await uploadPdfToCloudinary(
        file.buffer,
        'eduhub/students/documents',
        file.originalname
      );
      finalFileUrl = uploadRes.url;
      finalPublicId = uploadRes.publicId;
      finalResourceType = uploadRes.resourceType || 'raw';
      finalFileSize = uploadRes.bytes || file.size;
    } else if (fileData) {
      const uploadRes = await uploadPdfToCloudinary(
        fileData,
        'eduhub/students/documents',
        finalFileName
      );
      finalFileUrl = uploadRes.url;
      finalPublicId = uploadRes.publicId;
      finalResourceType = uploadRes.resourceType || 'raw';
      finalFileSize = uploadRes.bytes || finalFileSize;
    } else if (!finalFileUrl) {
      const processed = processDocumentUpload({
        title,
        docType,
        fileName: finalFileName,
        fileData,
        fileSize: finalFileSize,
      });
      finalFileUrl = processed.fileUrl;
      finalFileName = processed.fileName;
    }

    const docTitle = title || finalFileName.replace(/\.[^/.]+$/, '');

    student.documents.push({
      title: docTitle,
      docType: docType || 'other',
      fileUrl: finalFileUrl,
      fileName: finalFileName,
      fileSize: finalFileSize,
      publicId: finalPublicId,
      resourceType: finalResourceType,
      uploadedBy: req.user!.name,
      uploadedAt: new Date(),
    });

    await student.save();

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'STUDENT_UPDATE',
      entityType: 'student',
      entityId: student._id.toString(),
      details: `Uploaded document "${docTitle}" (${finalFileName}) for student ${student.name}.`,
      req,
    });

    res.status(201).json({
      success: true,
      document: student.documents[student.documents.length - 1],
      documents: student.documents,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to add student document' });
  }
}

export async function getStudentDocumentFile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id, docId } = req.params;
    const schoolId = req.user!.schoolId;

    const student = await StudentProfile.findOne({ _id: id, schoolId });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const hasAccess = await canUserAccessStudentDocument(req.user!, student);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access documents for this student',
      });
      return;
    }

    const doc = student.documents.find((d) => d._id?.toString() === docId);
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    res.json({
      success: true,
      document: {
        _id: doc._id,
        title: doc.title,
        docType: doc.docType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        publicId: doc.publicId,
        resourceType: doc.resourceType,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt,
      },
    });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve document' });
  }
}

export async function deleteStudentDocument(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id, docId } = req.params;
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;

    const student = await StudentProfile.findOne({ _id: id, schoolId });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const canDelete =
      userRole === 'admin' ||
      (userRole === 'teacher' && req.user!.permissions?.includes('students.delete')) ||
      (userRole === 'student' && student.userId.toString() === req.user!.userId);

    if (!canDelete) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot delete documents for this student',
      });
      return;
    }

    const docToDelete = student.documents.find(
      (d) => d._id?.toString() === docId
    );

    if (docToDelete?.publicId) {
      await deleteFromCloudinary(docToDelete.publicId, 'raw');
    }

    student.documents = student.documents.filter(
      (d) => d._id?.toString() !== docId
    );
    await student.save();

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'STUDENT_UPDATE',
      entityType: 'student',
      entityId: student._id.toString(),
      details: `Deleted document ${docId} from student ${student.name}.`,
      req,
    });

    res.json({
      success: true,
      message: 'Document removed successfully',
      documents: student.documents,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to remove document' });
  }
}

export async function uploadStudentPhoto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;

    const student = await StudentProfile.findOne({ _id: id, schoolId });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const canUpload =
      userRole === 'admin' ||
      (userRole === 'student' && student.userId.toString() === req.user!.userId);

    if (!canUpload) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot update photo for this student',
      });
      return;
    }

    const file = req.file;
    const photoData = req.body?.photoData || req.body?.photo;

    if (!file && !photoData) {
      res.status(400).json({ success: false, message: 'Photo file or photo data is required' });
      return;
    }

    if (student.photoPublicId) {
      await deleteFromCloudinary(student.photoPublicId, 'image');
    }

    let uploadRes;
    if (file) {
      uploadRes = await uploadImageToCloudinary(
        file.buffer,
        'eduhub/students/profile-images',
        file.originalname
      );
    } else {
      uploadRes = await uploadImageToCloudinary(
        photoData,
        'eduhub/students/profile-images',
        `${student.admissionNumber}_photo.jpg`
      );
    }

    student.photo = uploadRes.url;
    student.photoPublicId = uploadRes.publicId;
    await student.save();

    await User.findByIdAndUpdate(student.userId, {
      avatar: uploadRes.url,
      avatarPublicId: uploadRes.publicId,
    });

    res.json({
      success: true,
      message: 'Student photo updated successfully',
      photoUrl: uploadRes.url,
      publicId: uploadRes.publicId,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to upload photo' });
  }
}

export async function deleteStudentPhoto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;

    const student = await StudentProfile.findOne({ _id: id, schoolId });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const canDelete =
      userRole === 'admin' ||
      (userRole === 'student' && student.userId.toString() === req.user!.userId);

    if (!canDelete) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot delete photo for this student',
      });
      return;
    }

    if (student.photoPublicId) {
      await deleteFromCloudinary(student.photoPublicId, 'image');
    }

    student.photo = undefined;
    student.photoPublicId = undefined;
    await student.save();

    await User.findByIdAndUpdate(student.userId, {
      avatar: undefined,
      avatarPublicId: undefined,
    });

    res.json({ success: true, message: 'Student photo removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to delete photo' });
  }
}
