import { Request, Response } from 'express';
import {
  Homework,
  HomeworkSubmission,
  HomeworkAiHintLog,
  Timetable,
  StudyMaterial,
  ClassSubjectAssignment,
  StudentProfile,
  ParentProfile,
} from '../models';
import {
  HomeworkCreateSchema,
  HomeworkSubmitSchema,
  HomeworkGradeSchema,
  HomeworkAiHintRequestSchema,
  TimetableSlotCreateSchema,
  StudyMaterialCreateSchema,
  hasPermission,
  PERMISSIONS,
} from '@eduhub/shared';
import { checkTimetableConflicts } from '../services/timetableConflictService';
import {
  generateAiInsight,
  getAiProviderStatus,
  generateHomeworkHint,
} from '../services/aiService';

export async function getHomework(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const { classSectionId, studentId } = req.query;

    const filter: any = { schoolId };

    let currentStudentId: string | null = null;
    let targetClassSectionId: string | null =
      (classSectionId as string) || null;

    if (role === 'student') {
      const studentProfile = await StudentProfile.findOne({
        schoolId,
        userId: req.user!.userId,
      }).lean();
      if (studentProfile) {
        targetClassSectionId = studentProfile.classSectionId.toString();
        currentStudentId = req.user!.userId;
      }
      filter.status = 'published';
    } else if (role === 'parent') {
      const parentProfile = await ParentProfile.findOne({
        schoolId,
        userId: req.user!.userId,
      }).lean();
      if (parentProfile && parentProfile.linkedStudentUserIds?.length) {
        const selectedStudentUserId =
          (studentId as string) ||
          parentProfile.linkedStudentUserIds[0].toString();
        currentStudentId = selectedStudentUserId;
        const studentProfile = await StudentProfile.findOne({
          schoolId,
          userId: selectedStudentUserId,
        }).lean();
        if (studentProfile) {
          targetClassSectionId = studentProfile.classSectionId.toString();
        }
      }
      filter.status = 'published';
    } else if (role === 'teacher') {
      if (targetClassSectionId) {
        filter.classSectionId = targetClassSectionId;
      } else {
        const assignments = await ClassSubjectAssignment.find({
          schoolId,
          teacherId: req.user!.userId,
        }).lean();
        const assignedClassIds = assignments.map((a) => a.classSectionId);
        filter.$or = [
          { teacherId: req.user!.userId },
          { classSectionId: { $in: assignedClassIds } },
        ];
      }
    }

    if (targetClassSectionId && !filter.$or) {
      filter.classSectionId = targetClassSectionId;
    }

    const list = await Homework.find(filter)
      .populate('classSectionId', 'name section')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name')
      .sort({ dueDate: -1 })
      .lean();

    let studentSubmissionsMap: Record<string, any> = {};
    if (currentStudentId) {
      const submissions = await HomeworkSubmission.find({
        schoolId,
        studentId: currentStudentId,
      }).lean();
      for (const sub of submissions) {
        studentSubmissionsMap[sub.homeworkId.toString()] = sub;
      }
    }

    const formatted = list.map((h: any) => ({
      _id: h._id,
      title: h.title,
      description: h.description,
      classSectionId: h.classSectionId?._id || h.classSectionId,
      className: h.classSectionId?.name,
      section: h.classSectionId?.section,
      subjectId: h.subjectId?._id || h.subjectId,
      subjectName: h.subjectId?.name,
      assignedDate: h.assignedDate,
      dueDate: h.dueDate,
      teacherId: h.teacherId?._id || h.teacherId,
      teacherName: h.teacherId?.name,
      maxMarks: h.maxMarks ?? 100,
      status: h.status || 'published',
      attachments: h.attachments || [],
      submissionCount: h.submissionCount || 0,
      studentSubmission: currentStudentId
        ? studentSubmissionsMap[h._id.toString()] || null
        : null,
    }));

    res.json({ success: true, homework: formatted });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch homework' });
  }
}

export async function createHomework(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const parsed = HomeworkCreateSchema.parse(req.body);

    if (role === 'teacher') {
      const canCreate = hasPermission(
        role,
        req.user!.permissions,
        PERMISSIONS.HOMEWORK_CREATE
      );
      if (!canCreate) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Missing permission homework.create',
        });
        return;
      }

      const assignment = await ClassSubjectAssignment.findOne({
        schoolId,
        teacherId: req.user!.userId,
        classSectionId: parsed.classSectionId,
        subjectId: parsed.subjectId,
      });

      if (!assignment) {
        res.status(403).json({
          success: false,
          message: 'Teacher is not assigned to this class and subject',
        });
        return;
      }
    }

    const homework = await Homework.create({
      schoolId,
      title: parsed.title,
      description: parsed.description,
      classSectionId: parsed.classSectionId,
      subjectId: parsed.subjectId,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: parsed.dueDate,
      teacherId: req.user!.userId,
      maxMarks: parsed.maxMarks,
      status: parsed.status,
      attachments: parsed.attachments || [],
      submissionCount: 0,
    });

    res.status(201).json({ success: true, homework });
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
      .json({ success: false, message: 'Failed to create homework' });
  }
}

export async function getHomeworkSubmissions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const homework = await Homework.findOne({ _id: id, schoolId });
    if (!homework) {
      res.status(404).json({ success: false, message: 'Homework not found' });
      return;
    }

    const submissions = await HomeworkSubmission.find({
      schoolId,
      homeworkId: id,
    })
      .populate('studentId', 'name email')
      .sort({ submittedAt: -1 })
      .lean();

    res.json({ success: true, submissions });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch homework submissions',
      });
  }
}

export async function submitHomework(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const studentUserId = req.user!.userId;
    const { id } = req.params;
    const parsed = HomeworkSubmitSchema.parse(req.body);

    const homework = await Homework.findOne({ _id: id, schoolId });
    if (!homework) {
      res.status(404).json({ success: false, message: 'Homework not found' });
      return;
    }

    const studentProfile = await StudentProfile.findOne({
      schoolId,
      userId: studentUserId,
    }).lean();

    if (!studentProfile) {
      res
        .status(404)
        .json({ success: false, message: 'Student profile not found' });
      return;
    }

    if (
      homework.classSectionId.toString() !==
      studentProfile.classSectionId.toString()
    ) {
      res.status(403).json({
        success: false,
        message:
          'Student is not enrolled in the class assigned to this homework',
      });
      return;
    }

    const dueDateObj = new Date(homework.dueDate);
    const now = new Date();
    const isLate = now.getTime() > dueDateObj.getTime();

    const existing = await HomeworkSubmission.findOne({
      schoolId,
      homeworkId: id,
      studentId: studentUserId,
    });

    const isNew = !existing;

    const submission = await HomeworkSubmission.findOneAndUpdate(
      { schoolId, homeworkId: id, studentId: studentUserId },
      {
        studentName: studentProfile.name,
        rollNumber: studentProfile.rollNumber,
        classSectionId: studentProfile.classSectionId,
        submissionText: parsed.submissionText,
        attachments: parsed.attachments || [],
        submittedAt: now,
        isLate,
        status: existing?.status === 'graded' ? 'graded' : 'submitted',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (isNew) {
      await Homework.findByIdAndUpdate(id, { $inc: { submissionCount: 1 } });
    }

    res.status(200).json({ success: true, submission });
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
      .json({ success: false, message: 'Failed to submit homework' });
  }
}

export async function gradeHomeworkSubmission(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const { subId } = req.params;
    const parsed = HomeworkGradeSchema.parse(req.body);

    const canGrade = hasPermission(
      role,
      req.user!.permissions,
      PERMISSIONS.HOMEWORK_GRADE
    );
    if (!canGrade) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Missing permission homework.grade',
      });
      return;
    }

    const submission = await HomeworkSubmission.findOne({
      _id: subId,
      schoolId,
    });
    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    submission.marksObtained = parsed.marksObtained;
    if (parsed.feedback !== undefined) {
      submission.feedback = parsed.feedback;
    }
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedById = req.user!.userId as any;
    submission.gradedByName = req.user!.name;

    await submission.save();

    res.json({ success: true, submission });
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
      .json({ success: false, message: 'Failed to grade submission' });
  }
}

export async function getHomeworkAiHint(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;
    const homeworkId = req.params.homeworkId || req.params.id;

    if (role !== 'student') {
      res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: Only students can request homework hints',
        });
      return;
    }

    const studentProfile = await StudentProfile.findOne({
      schoolId,
      userId,
    }).lean();
    if (!studentProfile || !studentProfile.classSectionId) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Student profile or class assignment missing',
      });
      return;
    }

    const homework = await Homework.findOne({ _id: homeworkId, schoolId })
      .populate('subjectId', 'name')
      .lean();

    if (!homework) {
      res
        .status(404)
        .json({ success: false, message: 'Homework assignment not found' });
      return;
    }

    if (
      homework.classSectionId.toString() !==
      studentProfile.classSectionId.toString()
    ) {
      res.status(403).json({
        success: false,
        message:
          'Forbidden: You cannot request hints for homework from an unassigned class',
      });
      return;
    }

    if (homework.status !== 'published') {
      res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: Homework is not published',
        });
      return;
    }

    if (homework.aiHintsEnabled === false) {
      res.status(400).json({
        success: false,
        message:
          'AI hints have been disabled for this assignment by the class teacher',
      });
      return;
    }

    const parsed = HomeworkAiHintRequestSchema.parse(req.body);

    const todayStr = new Date().toISOString().split('T')[0];
    const MAX_DAILY_HINTS = 5;

    let hintLog = await HomeworkAiHintLog.findOne({
      schoolId,
      homeworkId,
      studentId: userId,
      date: todayStr,
    });

    if (hintLog && hintLog.hintCount >= MAX_DAILY_HINTS) {
      res.status(429).json({
        success: false,
        message: `Daily limit reached: Maximum ${MAX_DAILY_HINTS} AI hints per homework per day.`,
        remainingHints: 0,
      });
      return;
    }

    const subjectName = (homework.subjectId as any)?.name || 'General Subject';

    const hintResult = await generateHomeworkHint({
      homeworkTitle: homework.title,
      subjectName,
      description: homework.description,
      studentAttempt: parsed.studentAttempt,
      hintLevel: parsed.hintLevel,
      followUpQuestion: parsed.followUpQuestion,
    });

    if (!hintLog) {
      hintLog = await HomeworkAiHintLog.create({
        schoolId,
        homeworkId,
        studentId: userId,
        date: todayStr,
        hintCount: 1,
        lastHintLevel: parsed.hintLevel,
      });
    } else {
      hintLog.hintCount += 1;
      hintLog.lastHintLevel = parsed.hintLevel;
      await hintLog.save();
    }

    const remainingHints = Math.max(0, MAX_DAILY_HINTS - hintLog.hintCount);

    res.json({
      success: true,
      hint: hintResult.hint,
      concept: hintResult.concept,
      nextStep: hintResult.nextStep,
      selfCheckQuestion: hintResult.selfCheckQuestion,
      difficulty: hintResult.difficulty,
      isFinalAnswerHidden: true,
      message: hintResult.message,
      hintLevel: hintResult.hintLevel,
      remainingHints,
      homeworkId: homework._id.toString(),
      subjectName,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: error.errors?.[0]?.message || 'Validation failed',
      });
      return;
    }
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to generate homework hint',
      });
  }
}

export async function getTimetable(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const { classSectionId, teacherId } = req.query;

    const filter: any = { schoolId };

    if (role === 'student') {
      const studentProfile = await StudentProfile.findOne({
        schoolId,
        userId: req.user!.userId,
      }).lean();
      if (studentProfile) {
        filter.classSectionId = studentProfile.classSectionId;
      }
    } else if (role === 'parent') {
      const parentProfile = await ParentProfile.findOne({
        schoolId,
        userId: req.user!.userId,
      }).lean();
      if (parentProfile && parentProfile.linkedStudentUserIds?.length) {
        const studentProfile = await StudentProfile.findOne({
          schoolId,
          userId: parentProfile.linkedStudentUserIds[0],
        }).lean();
        if (studentProfile) {
          filter.classSectionId = studentProfile.classSectionId;
        }
      }
    } else if (role === 'teacher' && !classSectionId) {
      filter.teacherId = req.user!.userId;
    } else if (classSectionId) {
      filter.classSectionId = classSectionId;
    }

    if (teacherId) {
      filter.teacherId = teacherId;
    }

    const list = await Timetable.find(filter)
      .populate('classSectionId', 'name section')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name')
      .sort({ dayOfWeek: 1, periodNumber: 1 })
      .lean();

    const formatted = list.map((slot: any) => ({
      _id: slot._id,
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      classSectionId: slot.classSectionId?._id || slot.classSectionId,
      className: slot.classSectionId?.name,
      section: slot.classSectionId?.section,
      subjectId: slot.subjectId?._id || slot.subjectId,
      subjectName: slot.subjectId?.name,
      teacherId: slot.teacherId?._id || slot.teacherId,
      teacherName: slot.teacherId?.name,
      roomNumber: slot.roomNumber,
    }));

    if (
      formatted.length === 0 &&
      !classSectionId &&
      !teacherId &&
      role === 'admin'
    ) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const periods = [
        {
          period: 1,
          start: '09:00 AM',
          end: '09:45 AM',
          subject: 'Mathematics',
          teacher: 'Rajesh Sharma',
          room: 'Room 301',
        },
        {
          period: 2,
          start: '09:45 AM',
          end: '10:30 AM',
          subject: 'Science & Physics',
          teacher: 'Priya Nair',
          room: 'Physics Lab',
        },
        {
          period: 3,
          start: '10:45 AM',
          end: '11:30 AM',
          subject: 'English Literature',
          teacher: 'Ananya Sen',
          room: 'Room 301',
        },
        {
          period: 4,
          start: '11:30 AM',
          end: '12:15 PM',
          subject: 'Social Studies',
          teacher: 'Vikram Verma',
          room: 'Room 301',
        },
        {
          period: 5,
          start: '01:00 PM',
          end: '01:45 PM',
          subject: 'Mathematics',
          teacher: 'Rajesh Sharma',
          room: 'Room 301',
        },
        {
          period: 6,
          start: '01:45 PM',
          end: '02:30 PM',
          subject: 'Science & Physics',
          teacher: 'Priya Nair',
          room: 'Chemistry Lab',
        },
      ];

      const fallbackSlots = days.flatMap((day) =>
        periods.map((p) => ({
          _id: `slot-${day}-${p.period}`,
          dayOfWeek: day,
          periodNumber: p.period,
          startTime: p.start,
          endTime: p.end,
          subjectName: p.subject,
          teacherName: p.teacher,
          roomNumber: p.room,
        }))
      );

      res.json({ success: true, slots: fallbackSlots });
      return;
    }

    res.json({ success: true, slots: formatted });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch timetable' });
  }
}

export async function createTimetableSlot(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const parsed = TimetableSlotCreateSchema.parse(req.body);

    const canManage = hasPermission(
      role,
      req.user!.permissions,
      PERMISSIONS.TIMETABLE_MANAGE
    );
    if (!canManage) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Missing permission timetable.manage',
      });
      return;
    }

    const conflict = await checkTimetableConflicts({
      schoolId,
      dayOfWeek: parsed.dayOfWeek,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      teacherId: parsed.teacherId,
      classSectionId: parsed.classSectionId,
      roomNumber: parsed.roomNumber,
    });

    if (conflict.hasConflict) {
      res.status(409).json({
        success: false,
        conflictType: conflict.conflictType,
        message: conflict.message || 'Timetable schedule conflict detected',
      });
      return;
    }

    const slot = await Timetable.create({
      schoolId,
      classSectionId: parsed.classSectionId,
      dayOfWeek: parsed.dayOfWeek,
      periodNumber: parsed.periodNumber,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      subjectId: parsed.subjectId,
      teacherId: parsed.teacherId,
      roomNumber: parsed.roomNumber,
      academicYearId: parsed.academicYearId,
    });

    res.status(201).json({ success: true, slot });
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
      .json({ success: false, message: 'Failed to create timetable slot' });
  }
}

export async function deleteTimetableSlot(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const { id } = req.params;

    const canManage = hasPermission(
      role,
      req.user!.permissions,
      PERMISSIONS.TIMETABLE_MANAGE
    );
    if (!canManage) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Missing permission timetable.manage',
      });
      return;
    }

    const slot = await Timetable.findOneAndDelete({ _id: id, schoolId });
    if (!slot) {
      res
        .status(404)
        .json({ success: false, message: 'Timetable slot not found' });
      return;
    }

    res.json({ success: true, message: 'Timetable slot deleted successfully' });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete timetable slot' });
  }
}

export async function getMaterials(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const { classSectionId, subjectId } = req.query;

    const filter: any = { schoolId };

    if (role === 'student') {
      const studentProfile = await StudentProfile.findOne({
        schoolId,
        userId: req.user!.userId,
      }).lean();
      if (studentProfile) {
        filter.classSectionId = studentProfile.classSectionId;
      }
    } else if (role === 'parent') {
      const parentProfile = await ParentProfile.findOne({
        schoolId,
        userId: req.user!.userId,
      }).lean();
      if (parentProfile && parentProfile.linkedStudentUserIds?.length) {
        const studentProfile = await StudentProfile.findOne({
          schoolId,
          userId: parentProfile.linkedStudentUserIds[0],
        }).lean();
        if (studentProfile) {
          filter.classSectionId = studentProfile.classSectionId;
        }
      }
    } else if (classSectionId) {
      filter.classSectionId = classSectionId;
    }

    if (subjectId) filter.subjectId = subjectId;

    const materials = await StudyMaterial.find(filter)
      .populate('classSectionId', 'name section')
      .populate('subjectId', 'name')
      .populate('uploadedById', 'name')
      .sort({ createdAt: -1 })
      .lean();

    if (materials.length === 0 && role === 'admin') {
      const fallbackMaterials = [
        {
          _id: 'mat-1',
          title: 'Grade 10 Mathematics: Trigonometry & Circle Theorems Notes',
          description:
            'Comprehensive formula handbook with step-by-step solved proof exercises.',
          subjectName: 'Mathematics',
          className: 'Grade 10',
          section: 'A',
          fileType: 'pdf',
          fileName: 'Trigonometry_Formulas_2026.pdf',
          fileSize: 2450000,
          uploadedByName: 'Rajesh Sharma',
          createdAt: new Date('2026-09-10').toISOString(),
        },
        {
          _id: 'mat-2',
          title: 'Physics Lab Manual: Optics & Electricity Experiments',
          description:
            'Circuit diagrams and observation tables for Term 1 practical examinations.',
          subjectName: 'Science & Physics',
          className: 'Grade 10',
          section: 'A',
          fileType: 'document',
          fileName: 'Physics_Lab_Manual.docx',
          fileSize: 1840000,
          uploadedByName: 'Priya Nair',
          createdAt: new Date('2026-09-12').toISOString(),
        },
        {
          _id: 'mat-3',
          title: 'English Literature: Poetry & Character Analysis Guide',
          description:
            'Critical analysis of prescribed prose and stanza summaries with glossary.',
          subjectName: 'English Literature',
          className: 'Grade 10',
          section: 'A',
          fileType: 'pdf',
          fileName: 'English_Lit_Guide.pdf',
          fileSize: 3120000,
          uploadedByName: 'Ananya Sen',
          createdAt: new Date('2026-09-14').toISOString(),
        },
      ];
      res.json({ success: true, materials: fallbackMaterials });
      return;
    }

    const formatted = materials.map((m: any) => ({
      _id: m._id,
      title: m.title,
      description: m.description,
      classSectionId: m.classSectionId?._id || m.classSectionId,
      className: m.classSectionId?.name,
      section: m.classSectionId?.section,
      subjectId: m.subjectId?._id || m.subjectId,
      subjectName: m.subjectId?.name,
      fileUrl: m.fileUrl,
      fileName: m.fileName || `${m.title.replace(/\s+/g, '_')}.pdf`,
      fileSize: m.fileSize || 1048576,
      fileType: m.fileType,
      uploadedById: m.uploadedById?._id || m.uploadedById,
      uploadedByName: m.uploadedById?.name,
      createdAt: m.createdAt,
    }));

    res.json({ success: true, materials: formatted });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch materials' });
  }
}

export async function createMaterial(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const parsed = StudyMaterialCreateSchema.parse(req.body);

    const canUpload = hasPermission(
      role,
      req.user!.permissions,
      PERMISSIONS.MATERIALS_UPLOAD
    );
    if (!canUpload) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Missing permission materials.upload',
      });
      return;
    }

    if (role === 'teacher') {
      const assignment = await ClassSubjectAssignment.findOne({
        schoolId,
        teacherId: req.user!.userId,
        classSectionId: parsed.classSectionId,
        subjectId: parsed.subjectId,
      });

      if (!assignment) {
        res.status(403).json({
          success: false,
          message: 'Teacher is not assigned to this class and subject',
        });
        return;
      }
    }

    const material = await StudyMaterial.create({
      schoolId,
      title: parsed.title,
      description: parsed.description,
      classSectionId: parsed.classSectionId,
      subjectId: parsed.subjectId,
      fileType: parsed.fileType,
      fileUrl:
        parsed.fileUrl ||
        `/mock-storage/${Date.now()}-${parsed.fileName || 'material.pdf'}`,
      fileName: parsed.fileName || `${parsed.title.replace(/\s+/g, '_')}.pdf`,
      fileSize: parsed.fileSize || 1024 * 1024,
      uploadedById: req.user!.userId,
    });

    res.status(201).json({ success: true, material });
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
      .json({ success: false, message: 'Failed to upload study material' });
  }
}

export async function getCommunicationStats(
  _req: Request,
  res: Response
): Promise<void> {
  res.json({
    success: true,
    stats: {
      totalSmsSent: 1420,
      totalEmailsDelivered: 2850,
      unreadParentQueries: 3,
      recentCampaigns: [
        {
          id: 'camp-1',
          title: 'Term 1 Mid-Term Report Cards Released Notification',
          channel: 'sms',
          target: 'Parents of Grade 10',
          sentAt: '2026-09-14 10:30 AM',
          recipients: 35,
          status: 'delivered',
        },
        {
          id: 'camp-2',
          title: 'Science Fair 2026 Model Submission Circular',
          channel: 'email',
          target: 'All Students & Parents',
          sentAt: '2026-09-16 02:15 PM',
          recipients: 120,
          status: 'delivered',
        },
        {
          id: 'camp-3',
          title: 'Urgent: Bus Route #4 Maintenance Notice',
          channel: 'sms',
          target: 'Route 4 Commuters',
          sentAt: '2026-09-18 07:10 AM',
          recipients: 24,
          status: 'delivered',
        },
      ],
    },
  });
}

export async function getAiStatus(_req: Request, res: Response): Promise<void> {
  const status = getAiProviderStatus();
  res.json({ success: true, ...status });
}

export async function promptAiAssistant(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      prompt,
      contextType = 'general',
      category,
      startDate,
      endDate,
      classSectionId,
    } = req.body;

    if (!prompt) {
      res.status(400).json({ success: false, message: 'Prompt is required' });
      return;
    }

    const providerStatus = getAiProviderStatus();
    if (!providerStatus.available) {
      res.status(503).json({
        success: false,
        message:
          'AI Assistant is currently unavailable: No AI provider API key configured',
        status: providerStatus,
      });
      return;
    }

    const effectiveCategory =
      category ||
      (contextType === 'circular' ? 'notice_draft' : contextType) ||
      'general';

    const result = await generateAiInsight({
      prompt,
      category: effectiveCategory,
      startDate,
      endDate,
      classSectionId,
      schoolId: req.user!.schoolId,
    });

    res.json(result);
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'AI Assistant generation failed' });
  }
}
