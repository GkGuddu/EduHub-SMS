import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Exam, GradeRecord } from '../models';
import { ClassSection, Subject, ClassSubjectAssignment } from '../models';
import { StudentProfile, ParentProfile } from '../models';
import {
  createAuditLog,
  sendNotification,
} from '../services/notificationService';
import {
  hasPermission,
  PERMISSIONS,
  ExamCreateSchema,
  ExamUpdateSchema,
  GradeRecordSubmitSchema,
  GradeRecordCorrectionSchema,
} from '@eduhub/shared';

function calculateGrade(
  percentage: number,
  gradingRules?: Array<{
    minPercentage: number;
    maxPercentage: number;
    grade: string;
  }>
): string {
  if (gradingRules && gradingRules.length > 0) {
    const sorted = [...gradingRules].sort(
      (a, b) => b.minPercentage - a.minPercentage
    );
    for (const rule of sorted) {
      if (
        percentage >= rule.minPercentage &&
        percentage <= rule.maxPercentage
      ) {
        return rule.grade;
      }
    }
  }

  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

export async function getExams(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role;
    const userId = req.user!.userId;

    let filter: any = { schoolId };

    if (userRole === 'teacher') {
      const assignments = await ClassSubjectAssignment.find({
        schoolId,
        teacherId: userId,
      }).select('classSectionId');
      const assignedClassIds = assignments.map((a) => a.classSectionId);

      filter.$or = [
        { classSectionId: { $in: assignedClassIds } },
        { classSectionId: { $exists: false } },
        { classSectionId: null },
      ];
    } else if (userRole === 'student') {
      const profile = await StudentProfile.findOne({ schoolId, userId }).select(
        'classSectionId'
      );
      if (!profile) {
        res.json({ success: true, exams: [] });
        return;
      }

      filter.$or = [
        { classSectionId: profile.classSectionId },
        { classSectionId: { $exists: false } },
        { classSectionId: null },
      ];
      filter.status = { $in: ['scheduled', 'published'] };
    } else if (userRole === 'parent') {
      const parentProfile = await ParentProfile.findOne({
        schoolId,
        userId,
      }).select('linkedStudentUserIds');
      const studentUserIds = parentProfile?.linkedStudentUserIds || [];

      const linkedStudents = await StudentProfile.find({
        schoolId,
        $or: [
          { parentIds: userId },
          { userId: { $in: studentUserIds } },
        ],
      }).select('classSectionId');
      const classIds = linkedStudents.map((s) => s.classSectionId).filter(Boolean);
      filter.$or = [
        { classSectionId: { $in: classIds } },
        { classSectionId: { $exists: false } },
        { classSectionId: null },
      ];
      filter.status = { $in: ['scheduled', 'published'] };
    }

    const exams = await Exam.find(filter)
      .populate('classSectionId', 'name section')
      .sort({ startDate: -1 });

    res.json({ success: true, exams });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exams' });
  }
}

export async function createExam(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const validated = ExamCreateSchema.parse(req.body);

    if (req.user!.role === 'teacher') {
      if (validated.classSectionId) {
        const isAssigned = await ClassSubjectAssignment.exists({
          schoolId,
          classSectionId: validated.classSectionId,
          teacherId: req.user!.userId,
        });
        if (!isAssigned) {
          res.status(403).json({
            success: false,
            message:
              'Forbidden: You can only create examinations for your assigned classes.',
          });
          return;
        }
      } else {
        const assignmentsCount = await ClassSubjectAssignment.countDocuments({
          schoolId,
          teacherId: req.user!.userId,
        });
        if (assignmentsCount === 0) {
          res.status(403).json({
            success: false,
            message:
              'Forbidden: You have no assigned classes to create examinations for.',
          });
          return;
        }
      }
    }

    const exam = await Exam.create({
      schoolId,
      name: validated.name,
      type: validated.type || 'unit_test',
      classSectionId: validated.classSectionId,
      academicYear: validated.academicYear || '2025-2026',
      startDate: validated.startDate,
      endDate: validated.endDate,
      status: validated.status || 'draft',
      description: validated.description,
      maxMarks: validated.maxMarks || 100,
      passingMarks: validated.passingMarks || 40,
      subjects: validated.subjects || [],
      gradingRules: validated.gradingRules || [],
    });

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'EXAM_CREATE',
      entityType: 'exam',
      entityId: exam._id.toString(),
      details: `Created examination ${exam.name} (${exam.type}).`,
      req,
    });

    res.status(201).json({ success: true, exam });
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
    res.status(500).json({ success: false, message: 'Failed to create exam' });
  }
}

export async function updateExam(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;
    const validated = ExamUpdateSchema.parse(req.body);

    const exam = await Exam.findOne({ _id: id, schoolId });
    if (!exam) {
      res.status(404).json({ success: false, message: 'Exam not found' });
      return;
    }

    if (req.user!.role === 'teacher' && exam.classSectionId) {
      const isAssigned = await ClassSubjectAssignment.exists({
        schoolId,
        classSectionId: exam.classSectionId,
        teacherId: req.user!.userId,
      });
      if (!isAssigned) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not assigned to manage this exam.',
        });
        return;
      }
    }

    if (
      exam.status === 'published' &&
      validated.classSectionId &&
      validated.classSectionId !== exam.classSectionId?.toString()
    ) {
      const resultsCount = await GradeRecord.countDocuments({
        schoolId,
        examId: exam._id,
      });
      if (resultsCount > 0) {
        res.status(400).json({
          success: false,
          message:
            'Cannot reassign class for an examination that already has recorded results.',
        });
        return;
      }
    }

    Object.assign(exam, validated);
    await exam.save();

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'EXAM_UPDATE',
      entityType: 'exam',
      entityId: exam._id.toString(),
      details: `Updated examination ${exam.name} (Status: ${exam.status}).`,
      req,
    });

    res.json({ success: true, exam });
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
    res.status(500).json({ success: false, message: 'Failed to update exam' });
  }
}

export async function deleteExam(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const exam = await Exam.findOne({ _id: id, schoolId });
    if (!exam) {
      res.status(404).json({ success: false, message: 'Exam not found' });
      return;
    }

    const hasPublished = await GradeRecord.exists({
      schoolId,
      examId: exam._id,
      status: 'published',
    });
    if (hasPublished) {
      res.status(400).json({
        success: false,
        message:
          'Cannot delete examination with published results. Please archive or unpublish results first.',
      });
      return;
    }

    await GradeRecord.deleteMany({ schoolId, examId: exam._id });
    await Exam.findByIdAndDelete(exam._id);

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'EXAM_DELETE',
      entityType: 'exam',
      entityId: exam._id.toString(),
      details: `Deleted examination ${exam.name}.`,
      req,
    });

    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to delete exam' });
  }
}

export async function getGrades(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { examId, classSectionId, subjectId } = req.query;

    if (!examId || !classSectionId || !subjectId) {
      res
        .status(400)
        .json({
          success: false,
          message: 'examId, classSectionId and subjectId are required',
        });
      return;
    }

    if (req.user!.role === 'teacher') {
      const isAssigned = await ClassSubjectAssignment.exists({
        schoolId,
        classSectionId,
        subjectId,
        teacherId: req.user!.userId,
      });
      if (!isAssigned) {
        res.status(403).json({
          success: false,
          message:
            'Access denied: You are not assigned to this subject and class.',
        });
        return;
      }
    }

    const exam = await Exam.findOne({ _id: examId, schoolId }).lean();
    const subjectConfig = exam?.subjects?.find(
      (s) => s.subjectId.toString() === subjectId.toString()
    );
    const maxMarks = subjectConfig?.maxMarks || exam?.maxMarks || 100;
    const passingMarks =
      subjectConfig?.passingMarks || exam?.passingMarks || 40;

    const record = await GradeRecord.findOne({
      schoolId,
      examId,
      classSectionId,
      subjectId,
    }).lean();

    const students = await StudentProfile.find({
      schoolId,
      classSectionId,
      status: 'active',
    })
      .sort({ rollNumber: 1, name: 1 })
      .lean();

    if (record) {
      const gradeMap = new Map(
        record.grades.map((g) => [g.studentId.toString(), g])
      );

      const fullList = students.map((s) => {
        const item = gradeMap.get(s.userId.toString());
        const isAbsent = item?.isAbsent || false;
        const marks = isAbsent ? 0 : item ? item.marksObtained : 0;
        const pct = isAbsent ? 0 : Math.round((marks / record.maxMarks) * 100);

        return {
          studentId: s.userId.toString(),
          studentName: s.name,
          rollNumber: s.rollNumber,
          marksObtained: marks,
          maxMarks: record.maxMarks,
          percentage: pct,
          grade: isAbsent
            ? 'F'
            : item
              ? item.grade || calculateGrade(pct, exam?.gradingRules)
              : 'F',
          isAbsent,
          isPassed: !isAbsent && marks >= record.passingMarks,
          remarks: item?.remarks || '',
        };
      });

      res.json({
        success: true,
        recordId: record._id,
        status: record.status,
        maxMarks: record.maxMarks,
        passingMarks: record.passingMarks,
        grades: fullList,
        correctionHistory: record.correctionHistory || [],
      });
      return;
    }

    const defaultList = students.map((s) => ({
      studentId: s.userId.toString(),
      studentName: s.name,
      rollNumber: s.rollNumber,
      marksObtained: 0,
      maxMarks,
      percentage: 0,
      grade: 'F',
      isAbsent: false,
      isPassed: false,
      remarks: '',
    }));

    res.json({
      success: true,
      status: 'draft',
      maxMarks,
      passingMarks,
      grades: defaultList,
      correctionHistory: [],
    });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch grades' });
  }
}

export async function submitGrades(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const validated = GradeRecordSubmitSchema.parse(req.body);
    const {
      examId,
      classSectionId,
      subjectId,
      maxMarks,
      passingMarks,
      grades,
      status,
    } = validated;
    const { correctionReason } = req.body;

    if (req.user!.role === 'teacher') {
      const isAssigned = await ClassSubjectAssignment.exists({
        schoolId,
        classSectionId,
        subjectId,
        teacherId: req.user!.userId,
      });
      if (!isAssigned) {
        res.status(403).json({
          success: false,
          message:
            'Access denied: You are not assigned to this subject and class.',
        });
        return;
      }
    }

    const exam = await Exam.findOne({ _id: examId, schoolId }).lean();

    for (const g of grades) {
      if (g.marksObtained < 0) {
        res.status(400).json({
          success: false,
          message: `Marks cannot be negative for student ${g.studentName}.`,
        });
        return;
      }
      if (!g.isAbsent && g.marksObtained > maxMarks) {
        res.status(400).json({
          success: false,
          message: `Marks obtained (${g.marksObtained}) cannot exceed maximum marks (${maxMarks}) for student ${g.studentName}.`,
        });
        return;
      }
    }

    const existingRecord = await GradeRecord.findOne({
      schoolId,
      examId,
      classSectionId,
      subjectId,
    });

    const correctionEntries: any[] = [];

    if (existingRecord && existingRecord.status === 'published') {
      const canEdit =
        req.user!.role === 'admin' ||
        hasPermission(
          req.user!.role,
          req.user!.permissions,
          PERMISSIONS.MARKS_EDIT
        );

      if (!canEdit) {
        res.status(403).json({
          success: false,
          message:
            'Forbidden: Editing published marks requires marks.edit permission.',
          requiredPermission: 'marks.edit',
        });
        return;
      }

      const existingMap = new Map(
        existingRecord.grades.map((g) => [g.studentId.toString(), g])
      );

      for (const g of grades) {
        const old = existingMap.get(g.studentId);
        if (
          old &&
          (old.marksObtained !== g.marksObtained ||
            Boolean(old.isAbsent) !== Boolean(g.isAbsent))
        ) {
          correctionEntries.push({
            studentId: g.studentId,
            studentName: g.studentName,
            previousMarks: old.marksObtained,
            newMarks: g.isAbsent ? 0 : g.marksObtained,
            reason: correctionReason || 'Grade adjusted after publication',
            correctedBy: req.user!.userId,
            correctedByName: req.user!.name,
            correctedAt: new Date(),
          });
        }
      }
    }

    const processedGrades = grades.map((g) => {
      const isAbsent = Boolean(g.isAbsent);
      const actualMarks = isAbsent ? 0 : g.marksObtained;
      const pct = isAbsent ? 0 : Math.round((actualMarks / maxMarks) * 100);
      const grade = isAbsent ? 'F' : calculateGrade(pct, exam?.gradingRules);
      const isPassed = !isAbsent && actualMarks >= passingMarks;

      return {
        studentId: g.studentId as any,
        studentName: g.studentName,
        rollNumber: g.rollNumber,
        marksObtained: actualMarks,
        maxMarks,
        percentage: pct,
        grade,
        isAbsent,
        isPassed,
        remarks: g.remarks || '',
      };
    });

    const record = await GradeRecord.findOneAndUpdate(
      { schoolId, examId, classSectionId, subjectId },
      {
        schoolId,
        examId,
        classSectionId,
        subjectId,
        maxMarks,
        passingMarks,
        grades: processedGrades,
        enteredById: req.user!.userId,
        status,
        ...(correctionEntries.length > 0
          ? { $push: { correctionHistory: { $each: correctionEntries } } }
          : {}),
      },
      { new: true, upsert: true }
    );

    const [subject, classSec] = await Promise.all([
      Subject.findById(subjectId).select('name'),
      ClassSection.findById(classSectionId).select('name section'),
    ]);

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'RESULT_UPDATE',
      entityType: 'grade',
      entityId: record._id.toString(),
      details: `Saved grades for ${subject?.name || 'Subject'} in ${classSec?.name}-${classSec?.section} for ${exam?.name || 'Exam'} (${status}).`,
      req,
    });

    res.json({ success: true, message: 'Grades saved successfully', record });
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
      .json({ success: false, message: 'Failed to submit grades' });
  }
}

export async function correctGrade(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const validated = GradeRecordCorrectionSchema.parse(req.body);
    const {
      examId,
      classSectionId,
      subjectId,
      studentId,
      marksObtained,
      isAbsent,
      reason,
      remarks,
    } = validated;

    const canEdit =
      req.user!.role === 'admin' ||
      hasPermission(
        req.user!.role,
        req.user!.permissions,
        PERMISSIONS.MARKS_EDIT
      );

    if (!canEdit) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Correcting marks requires marks.edit permission.',
        requiredPermission: 'marks.edit',
      });
      return;
    }

    const record = await GradeRecord.findOne({
      schoolId,
      examId,
      classSectionId,
      subjectId,
    });

    if (!record) {
      res
        .status(404)
        .json({ success: false, message: 'Grade record not found' });
      return;
    }

    const exam = await Exam.findOne({ _id: examId, schoolId }).lean();
    const itemIndex = record.grades.findIndex(
      (g) => g.studentId.toString() === studentId
    );

    if (itemIndex === -1) {
      res
        .status(404)
        .json({
          success: false,
          message: 'Student grade entry not found in sheet',
        });
      return;
    }

    const oldItem = record.grades[itemIndex];
    if (!isAbsent && marksObtained > record.maxMarks) {
      res.status(400).json({
        success: false,
        message: `Marks obtained (${marksObtained}) cannot exceed maximum marks (${record.maxMarks}).`,
      });
      return;
    }

    const finalMarks = isAbsent ? 0 : marksObtained;
    const pct = isAbsent ? 0 : Math.round((finalMarks / record.maxMarks) * 100);
    const grade = isAbsent ? 'F' : calculateGrade(pct, exam?.gradingRules);

    record.correctionHistory = record.correctionHistory || [];
    record.correctionHistory.push({
      studentId: oldItem.studentId,
      studentName: oldItem.studentName,
      previousMarks: oldItem.marksObtained,
      newMarks: finalMarks,
      reason,
      correctedBy: req.user!.userId as any,
      correctedByName: req.user!.name,
      correctedAt: new Date(),
    });

    record.grades[itemIndex].marksObtained = finalMarks;
    record.grades[itemIndex].isAbsent = isAbsent;
    record.grades[itemIndex].percentage = pct;
    record.grades[itemIndex].grade = grade;
    record.grades[itemIndex].isPassed =
      !isAbsent && finalMarks >= record.passingMarks;
    if (remarks !== undefined) {
      record.grades[itemIndex].remarks = remarks;
    }

    await record.save();

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'RESULT_UPDATE',
      entityType: 'grade',
      entityId: record._id.toString(),
      details: `Corrected mark for ${oldItem.studentName}: ${oldItem.marksObtained} -> ${finalMarks} (Reason: ${reason}).`,
      req,
    });

    res.json({
      success: true,
      message: 'Grade corrected and audit log recorded',
      record,
    });
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
      .json({ success: false, message: 'Failed to correct grade' });
  }
}

export async function publishGrades(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { gradeRecordId } = req.body;

    const canPublish = hasPermission(
      req.user!.role,
      req.user!.permissions,
      PERMISSIONS.RESULTS_PUBLISH
    );
    if (!canPublish) {
      res.status(403).json({
        success: false,
        message:
          'Forbidden: Insufficient privileges. Required permission: results.publish',
        requiredPermission: 'results.publish',
      });
      return;
    }

    const record = await GradeRecord.findOne({ _id: gradeRecordId, schoolId });
    if (!record) {
      res
        .status(404)
        .json({ success: false, message: 'Grade record not found' });
      return;
    }

    record.status = 'published';
    record.publishedAt = new Date();
    record.publishedById = req.user!.userId as any;
    record.publishedByName = req.user!.name;
    await record.save();

    const [exam, subject, classSec] = await Promise.all([
      Exam.findById(record.examId).select('name'),
      Subject.findById(record.subjectId).select('name'),
      ClassSection.findById(record.classSectionId).select('name section'),
    ]);

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'RESULT_PUBLISH',
      entityType: 'grade',
      entityId: record._id.toString(),
      details: `Published exam results for ${subject?.name} - ${classSec?.name}-${classSec?.section} (${exam?.name}).`,
      req,
    });

    const students = await StudentProfile.find({
      schoolId,
      classSectionId: record.classSectionId,
      status: 'active',
    });

    for (const s of students) {
      const notifTitle = `Results Published: ${subject?.name}`;
      const notifMsg = `Official grades for ${subject?.name} (${exam?.name}) are now published. Check your report card.`;

      sendNotification({
        schoolId,
        userId: s.userId.toString(),
        title: notifTitle,
        message: notifMsg,
        type: 'grade',
      });

      for (const pId of s.parentIds) {
        sendNotification({
          schoolId,
          userId: pId.toString(),
          title: notifTitle,
          message: `${s.name}'s grades for ${subject?.name} are published.`,
          type: 'grade',
        });
      }
    }

    res.json({
      success: true,
      message: 'Exam results published and notifications sent successfully',
      record,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to publish results' });
  }
}

export async function getStudentReportCard(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { studentId, examId } = req.query;

    if (!studentId || !examId) {
      res
        .status(400)
        .json({ success: false, message: 'studentId and examId required' });
      return;
    }

    const isObjId = mongoose.isValidObjectId(studentId);
    const student = await StudentProfile.findOne({
      schoolId,
      ...(isObjId
        ? { $or: [{ userId: studentId }, { _id: studentId }] }
        : { userId: studentId }),
    }).populate('classSectionId', 'name section');
    if (!student) {
      res
        .status(404)
        .json({ success: false, message: 'Student profile not found' });
      return;
    }

    if (
      req.user!.role === 'student' &&
      student.userId.toString() !== req.user!.userId
    ) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    if (req.user!.role === 'parent') {
      const isLinked = await StudentProfile.exists({
        schoolId,
        _id: student._id,
        parentIds: req.user!.userId,
      });
      if (!isLinked) {
        const parentProf = await ParentProfile.findOne({
          schoolId,
          userId: req.user!.userId,
          linkedStudentUserIds: student.userId,
        });
        if (!parentProf) {
          res.status(403).json({
            success: false,
            message:
              'Forbidden: You are not authorized to view results for this student.',
          });
          return;
        }
      }
    }

    const exam = await Exam.findOne({ _id: examId, schoolId }).lean();
    if (!exam) {
      res.status(404).json({ success: false, message: 'Exam not found' });
      return;
    }

    const allowedStatuses =
      req.user!.role === 'admin' || req.user!.role === 'teacher'
        ? ['submitted', 'published']
        : ['published'];

    const classSecId =
      (student.classSectionId as any)?._id || student.classSectionId;

    const records = await GradeRecord.find({
      schoolId,
      examId,
      classSectionId: classSecId,
      status: { $in: allowedStatuses },
    }).populate('subjectId', 'name code');

    const subjectGrades: any[] = [];
    let totalObtained = 0;
    let totalMax = 0;
    let publishedAtStr: string | undefined;
    let publishedByNameStr: string | undefined;

    for (const rec of records) {
      const item = rec.grades.find(
        (g) =>
          g.studentId.toString() === student.userId.toString() ||
          g.studentId.toString() === student._id.toString()
      );
      if (item) {
        if (rec.publishedAt) {
          publishedAtStr = rec.publishedAt.toISOString();
        }
        if (rec.publishedByName) {
          publishedByNameStr = rec.publishedByName;
        }

        const isAbsent = Boolean(item.isAbsent);
        const marks = isAbsent ? 0 : item.marksObtained;
        const pct = isAbsent ? 0 : Math.round((marks / rec.maxMarks) * 100);
        const grade = isAbsent
          ? 'F'
          : item.grade || calculateGrade(pct, exam.gradingRules);
        const isPassed = !isAbsent && marks >= rec.passingMarks;

        subjectGrades.push({
          subjectName: (rec.subjectId as any)?.name || 'Subject',
          subjectCode: (rec.subjectId as any)?.code || '',
          marksObtained: marks,
          maxMarks: rec.maxMarks,
          passingMarks: rec.passingMarks,
          percentage: pct,
          grade,
          isAbsent,
          isPassed,
          remarks: item.remarks || '',
        });

        if (!isAbsent) {
          totalObtained += marks;
        }
        totalMax += rec.maxMarks;
      }
    }

    const overallPercentage =
      totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    const overallGrade = calculateGrade(overallPercentage, exam.gradingRules);
    const passThreshold = exam.passingMarks || 40;
    const allPassed = subjectGrades.every((s) => s.isPassed);

    res.json({
      success: true,
      reportCard: {
        student: {
          id: student.userId,
          name: student.name,
          admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber,
          className: (student.classSectionId as any)?.name,
          section: (student.classSectionId as any)?.section,
        },
        exam: {
          id: exam._id,
          name: exam.name,
          type: exam.type,
          academicYear: exam.academicYear,
        },
        subjects: subjectGrades,
        summary: {
          totalObtained,
          totalMax,
          overallPercentage,
          overallGrade,
          status:
            allPassed && overallPercentage >= passThreshold ? 'PASS' : 'FAIL',
        },
        publishedAt: publishedAtStr,
        publishedByName: publishedByNameStr,
      },
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to generate report card' });
  }
}
