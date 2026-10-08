import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AttendanceRecord } from '../models';
import { StudentProfile, ParentProfile } from '../models';
import { ClassSection, ClassSubjectAssignment, AcademicYear } from '../models';
import {
  createAuditLog,
  dispatchAbsentAlerts,
  getGuardianNotificationLogs,
} from '../services/notificationService';
import {
  hasPermission,
  PERMISSIONS,
  AttendanceStatus,
  IAttendanceDailyClassSummary,
  IAttendanceWeeklyDay,
} from '@eduhub/shared';

async function checkTeacherClassScope(
  schoolId: string,
  teacherUserId: string,
  classSectionId: string
): Promise<boolean> {
  const isAssigned = await ClassSubjectAssignment.exists({
    schoolId,
    classSectionId,
    teacherId: teacherUserId,
  });
  if (isAssigned) return true;

  const classSection = await ClassSection.findOne({
    _id: classSectionId,
    schoolId,
  });
  if (
    classSection &&
    classSection.classTeacherId?.toString() === teacherUserId
  ) {
    return true;
  }
  return false;
}

export async function getAttendance(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { classSectionId, date, academicYearId, subjectId } = req.query;

    if (!classSectionId || !date) {
      res
        .status(400)
        .json({
          success: false,
          message: 'classSectionId and date are required',
        });
      return;
    }

    const classSection = await ClassSection.findOne({
      _id: classSectionId,
      schoolId,
    });
    if (!classSection) {
      res
        .status(404)
        .json({ success: false, message: 'Class section not found' });
      return;
    }

    if (req.user!.role === 'teacher') {
      const authorized = await checkTeacherClassScope(
        schoolId,
        req.user!.userId,
        classSectionId.toString()
      );
      if (!authorized) {
        res.status(403).json({
          success: false,
          message:
            'Access denied: You are not assigned to teach or manage this class.',
          requiredPermission: 'attendance.view',
        });
        return;
      }
    }

    let resolvedAcademicYearId = academicYearId?.toString();
    if (!resolvedAcademicYearId) {
      const currentYear = await AcademicYear.findOne({
        schoolId,
        isCurrent: true,
      });
      resolvedAcademicYearId = currentYear?._id.toString();
    }

    const query: any = {
      schoolId,
      classSectionId,
      date: date.toString(),
    };
    if (resolvedAcademicYearId) {
      query.academicYearId = resolvedAcademicYearId;
    }
    if (subjectId) {
      query.subjectId = subjectId;
    }

    const existing = await AttendanceRecord.findOne(query).lean();

    const students = await StudentProfile.find({
      schoolId,
      classSectionId,
      status: 'active',
    })
      .sort({ rollNumber: 1, name: 1 })
      .lean();

    if (existing) {
      const recordMap = new Map(
        existing.records.map((r) => [r.studentId.toString(), r])
      );

      const fullRoster = students.map((s) => {
        const rec = recordMap.get(s.userId.toString());
        return {
          studentId: s.userId.toString(),
          studentName: s.name,
          rollNumber: s.rollNumber,
          status: (rec?.status as AttendanceStatus) || 'present',
          remarks: rec?.remarks || '',
        };
      });

      res.json({
        success: true,
        alreadyMarked: true,
        recordId: existing._id,
        isEdited: existing.isEdited,
        takenByName: existing.takenByName,
        takenByRole: existing.takenByRole,
        date: existing.date,
        academicYearId: existing.academicYearId,
        subjectId: existing.subjectId,
        editHistory: existing.editHistory || [],
        records: fullRoster,
      });
      return;
    }

    const defaultRoster = students.map((s) => ({
      studentId: s.userId.toString(),
      studentName: s.name,
      rollNumber: s.rollNumber,
      status: null,
      remarks: '',
    }));

    res.json({
      success: true,
      alreadyMarked: false,
      date: date.toString(),
      academicYearId: resolvedAcademicYearId,
      subjectId: subjectId || null,
      records: defaultRoster,
    });
  } catch (error) {
    console.error('Error in getAttendance:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to retrieve attendance' });
  }
}

export async function markAttendance(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const {
      classSectionId,
      date,
      academicYearId,
      subjectId,
      records,
      isEdited,
      editReason,
    } = req.body;

    const classSection = await ClassSection.findOne({
      _id: classSectionId,
      schoolId,
    });
    if (!classSection) {
      res
        .status(404)
        .json({ success: false, message: 'Class section not found' });
      return;
    }

    if (req.user!.role === 'teacher') {
      const authorized = await checkTeacherClassScope(
        schoolId,
        req.user!.userId,
        classSectionId
      );
      if (!authorized) {
        res.status(403).json({
          success: false,
          message:
            'Access denied: You are not assigned to record attendance for this class.',
          requiredPermission: 'attendance.mark',
        });
        return;
      }
    }

    let resolvedAcademicYearId = academicYearId;
    if (!resolvedAcademicYearId) {
      const currentYear = await AcademicYear.findOne({
        schoolId,
        isCurrent: true,
      });
      resolvedAcademicYearId = currentYear?._id.toString();
    }

    const seenStudentIds = new Set<string>();
    const deduplicatedRecords: any[] = [];
    for (const r of records) {
      const sId = r.studentId.toString();
      if (!seenStudentIds.has(sId)) {
        seenStudentIds.add(sId);
        deduplicatedRecords.push({
          studentId: r.studentId,
          studentName: r.studentName,
          rollNumber: r.rollNumber,
          status: r.status,
          remarks: r.remarks || '',
        });
      }
    }

    const query: any = {
      schoolId,
      classSectionId,
      date,
    };
    if (resolvedAcademicYearId) {
      query.academicYearId = resolvedAcademicYearId;
    }
    if (subjectId) {
      query.subjectId = subjectId;
    }

    const existing = await AttendanceRecord.findOne(query);

    if (existing && !isEdited) {
      res.status(409).json({
        success: false,
        message:
          'Duplicate attendance: Attendance for this class, date, and academic year has already been finalized. Use the edit flow with an audit reason.',
      });
      return;
    }

    if (existing && isEdited) {
      if (req.user!.role !== 'admin') {
        const canEdit = hasPermission(
          req.user!.role,
          req.user!.permissions,
          PERMISSIONS.ATTENDANCE_EDIT
        );
        if (!canEdit) {
          res.status(403).json({
            success: false,
            message:
              "Forbidden: You need 'attendance.edit' permission to modify a finalized session.",
            requiredPermission: 'attendance.edit',
          });
          return;
        }
      }

      if (!editReason || !editReason.trim()) {
        res.status(400).json({
          success: false,
          message:
            'An audit reason is required when modifying a finalized attendance session.',
        });
        return;
      }

      existing.isEdited = true;
      existing.editHistory.push({
        editedBy: `${req.user!.name} (${req.user!.role})`,
        editedAt: new Date(),
        previousRecordsCount: existing.records.length,
        reason: editReason.trim(),
      });
      existing.records = deduplicatedRecords;
      await existing.save();

      await createAuditLog({
        schoolId,
        userId: req.user!.userId,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'ATTENDANCE_EDIT',
        entityType: 'attendance',
        entityId: existing._id.toString(),
        details: `Edited attendance for ${classSection.name}-${classSection.section} on ${date}. Reason: ${editReason}.`,
        metadata: {
          classSectionId,
          date,
          academicYearId: resolvedAcademicYearId,
          recordsCount: deduplicatedRecords.length,
        },
        req,
      });

      const absentStudents = deduplicatedRecords.filter(
        (r) => r.status === 'absent'
      );
      if (absentStudents.length > 0) {
        const studentProfiles = await StudentProfile.find({
          schoolId,
          userId: { $in: absentStudents.map((r) => r.studentId) },
        }).lean();
        const profileMap = new Map(
          studentProfiles.map((sp) => [sp.userId.toString(), sp])
        );

        const absentPayload = absentStudents.map((item) => {
          const sp = profileMap.get(item.studentId.toString());
          return {
            studentId: item.studentId.toString(),
            studentName: item.studentName,
            parentEmail: sp?.parentEmail,
            parentPhone: sp?.parentPhone,
            parentName: sp?.parentName,
            parentIds: sp?.parentIds?.map((id: any) => id.toString()),
          };
        });

        const newlyNotified = await dispatchAbsentAlerts({
          schoolId,
          attendanceRecordId: existing._id.toString(),
          date,
          classSectionName: `${classSection.name}-${classSection.section}`,
          absentStudents: absentPayload,
          alreadyNotifiedStudentIds:
            existing.notifiedStudentIds?.map((id) => id.toString()) || [],
        });

        if (newlyNotified.length > 0) {
          existing.notifiedStudentIds = [
            ...(existing.notifiedStudentIds || []),
            ...newlyNotified.map((id) => new mongoose.Types.ObjectId(id)),
          ];
          await existing.save();
        }
      }

      res.json({
        success: true,
        message: 'Attendance record updated and audit trail recorded.',
        record: existing,
      });
      return;
    }

    const newRecord = await AttendanceRecord.create({
      schoolId,
      classSectionId,
      academicYearId: resolvedAcademicYearId,
      subjectId: subjectId || undefined,
      date,
      records: deduplicatedRecords,
      takenById: req.user!.userId,
      takenByName: req.user!.name,
      takenByRole: req.user!.role,
      isEdited: false,
      editHistory: [],
      notifiedStudentIds: [],
    });

    await createAuditLog({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'ATTENDANCE_EDIT',
      entityType: 'attendance',
      entityId: newRecord._id.toString(),
      details: `Submitted attendance for ${classSection.name}-${classSection.section} on ${date} (${deduplicatedRecords.length} students).`,
      metadata: {
        classSectionId,
        date,
        academicYearId: resolvedAcademicYearId,
        recordsCount: deduplicatedRecords.length,
      },
      req,
    });

    const absentStudents = deduplicatedRecords.filter(
      (r) => r.status === 'absent'
    );
    if (absentStudents.length > 0) {
      const studentProfiles = await StudentProfile.find({
        schoolId,
        userId: { $in: absentStudents.map((r) => r.studentId) },
      }).lean();
      const profileMap = new Map(
        studentProfiles.map((sp) => [sp.userId.toString(), sp])
      );

      const absentPayload = absentStudents.map((item) => {
        const sp = profileMap.get(item.studentId.toString());
        return {
          studentId: item.studentId.toString(),
          studentName: item.studentName,
          parentEmail: sp?.parentEmail,
          parentPhone: sp?.parentPhone,
          parentName: sp?.parentName,
          parentIds: sp?.parentIds?.map((id: any) => id.toString()),
        };
      });

      const newlyNotified = await dispatchAbsentAlerts({
        schoolId,
        attendanceRecordId: newRecord._id.toString(),
        date,
        classSectionName: `${classSection.name}-${classSection.section}`,
        absentStudents: absentPayload,
        alreadyNotifiedStudentIds: [],
      });

      if (newlyNotified.length > 0) {
        newRecord.notifiedStudentIds = newlyNotified.map(
          (id) => new mongoose.Types.ObjectId(id)
        );
        await newRecord.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Daily attendance finalized and guardian alerts enqueued.',
      record: newRecord,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message:
          'Duplicate attendance: A record already exists for this class, date, and academic year.',
      });
      return;
    }
    console.error('Mark attendance error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to record attendance' });
  }
}

export async function getAttendanceSummary(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const today = new Date().toISOString().split('T')[0];

    const todayRecords = await AttendanceRecord.find({ schoolId, date: today });
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    let totalLeave = 0;

    for (const rec of todayRecords) {
      for (const item of rec.records) {
        if (item.status === 'present') totalPresent++;
        else if (item.status === 'late') totalLate++;
        else if (item.status === 'absent') totalAbsent++;
        else if (item.status === 'leave') totalLeave++;
      }
    }

    const totalStudents = await StudentProfile.countDocuments({
      schoolId,
      status: 'active',
    });
    const markedTotal = totalPresent + totalLate + totalAbsent + totalLeave;
    const rate =
      markedTotal > 0
        ? Math.round(((totalPresent + totalLate * 0.5) / markedTotal) * 100)
        : 100;

    res.json({
      success: true,
      summary: {
        date: today,
        totalStudents,
        markedTotal,
        present: totalPresent,
        late: totalLate,
        absent: totalAbsent,
        leave: totalLeave,
        rate,
      },
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch attendance summary' });
  }
}

export async function getDailyReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { date, academicYearId } = req.query;
    const targetDate = (
      date || new Date().toISOString().split('T')[0]
    ).toString();

    const classSections = await ClassSection.find({ schoolId }).sort({
      name: 1,
      section: 1,
    });

    const query: any = { schoolId, date: targetDate };
    if (academicYearId) query.academicYearId = academicYearId;

    const records = await AttendanceRecord.find(query).lean();
    const recordMap = new Map(
      records.map((r) => [r.classSectionId.toString(), r])
    );

    const summary: IAttendanceDailyClassSummary[] = [];

    for (const cs of classSections) {
      const rec = recordMap.get(cs._id.toString());
      const studentCount = await StudentProfile.countDocuments({
        schoolId,
        classSectionId: cs._id,
        status: 'active',
      });

      if (rec) {
        let present = 0;
        let absent = 0;
        let late = 0;
        let leave = 0;

        for (const item of rec.records) {
          if (item.status === 'present') present++;
          else if (item.status === 'absent') absent++;
          else if (item.status === 'late') late++;
          else if (item.status === 'leave') leave++;
        }

        const totalMarked = present + absent + late + leave;
        const rate =
          totalMarked > 0
            ? Math.round(((present + late * 0.5) / totalMarked) * 100)
            : 100;

        summary.push({
          classSectionId: cs._id.toString(),
          className: cs.name,
          section: cs.section,
          totalStudents: studentCount,
          markedStudents: totalMarked,
          present,
          absent,
          late,
          leave,
          rate,
          isMarked: true,
          takenByName: rec.takenByName,
          takenByRole: rec.takenByRole,
          isEdited: rec.isEdited,
        });
      } else {
        summary.push({
          classSectionId: cs._id.toString(),
          className: cs.name,
          section: cs.section,
          totalStudents: studentCount,
          markedStudents: 0,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          rate: 0,
          isMarked: false,
        });
      }
    }

    res.json({
      success: true,
      date: targetDate,
      summary,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to generate daily report' });
  }
}

export async function getWeeklyReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { classSectionId, endDate } = req.query;

    const end = endDate ? new Date(endDate.toString()) : new Date();
    const days: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const query: any = {
      schoolId,
      date: { $in: days },
    };
    if (classSectionId) {
      query.classSectionId = classSectionId;
    }

    const records = await AttendanceRecord.find(query).lean();
    const recordsByDate = new Map<string, any[]>();
    for (const r of records) {
      if (!recordsByDate.has(r.date)) recordsByDate.set(r.date, []);
      recordsByDate.get(r.date)!.push(r);
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const weeklyTrend: IAttendanceWeeklyDay[] = days.map((dStr) => {
      const dayRecs = recordsByDate.get(dStr) || [];
      const dObj = new Date(dStr);
      let present = 0;
      let absent = 0;
      let late = 0;
      let leave = 0;

      for (const rec of dayRecs) {
        for (const item of rec.records) {
          if (item.status === 'present') present++;
          else if (item.status === 'absent') absent++;
          else if (item.status === 'late') late++;
          else if (item.status === 'leave') leave++;
        }
      }

      const totalMarked = present + absent + late + leave;
      const rate =
        totalMarked > 0
          ? Math.round(((present + late * 0.5) / totalMarked) * 100)
          : 0;

      return {
        date: dStr,
        dayName: dayNames[dObj.getDay()],
        present,
        absent,
        late,
        leave,
        totalMarked,
        rate,
      };
    });

    res.json({
      success: true,
      trend: weeklyTrend,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to generate weekly trend' });
  }
}

export async function getMonthlyReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { month, classSectionId, academicYearId } = req.query;
    const targetMonth = (
      month || new Date().toISOString().slice(0, 7)
    ).toString();

    const query: any = {
      schoolId,
      date: { $regex: `^${targetMonth}` },
    };
    if (classSectionId) query.classSectionId = classSectionId;
    if (academicYearId) query.academicYearId = academicYearId;

    const records = await AttendanceRecord.find(query).lean();

    const dateMap = new Map<string, any[]>();
    for (const r of records) {
      if (!dateMap.has(r.date)) dateMap.set(r.date, []);
      dateMap.get(r.date)!.push(r);
    }

    const workingDaysCount = dateMap.size;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalLeave = 0;

    const dailyBreakdown = Array.from(dateMap.entries()).map(
      ([dateStr, dayRecs]) => {
        let p = 0,
          a = 0,
          l = 0,
          lv = 0;
        for (const rec of dayRecs) {
          for (const item of rec.records) {
            if (item.status === 'present') {
              p++;
              totalPresent++;
            } else if (item.status === 'absent') {
              a++;
              totalAbsent++;
            } else if (item.status === 'late') {
              l++;
              totalLate++;
            } else if (item.status === 'leave') {
              lv++;
              totalLeave++;
            }
          }
        }
        const total = p + a + l + lv;
        const rate = total > 0 ? Math.round(((p + l * 0.5) / total) * 100) : 0;
        return {
          date: dateStr,
          present: p,
          absent: a,
          late: l,
          leave: lv,
          total,
          rate,
        };
      }
    );

    const overallTotal = totalPresent + totalAbsent + totalLate + totalLeave;
    const overallRate =
      overallTotal > 0
        ? Math.round(((totalPresent + totalLate * 0.5) / overallTotal) * 100)
        : 100;

    res.json({
      success: true,
      month: targetMonth,
      workingDaysCount,
      overallRate,
      totals: {
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        leave: totalLeave,
      },
      dailyBreakdown,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to generate monthly report' });
  }
}

async function generateStudentAttendanceReport(
  schoolId: string,
  studentUserId: string,
  academicYearId?: string
) {
  const student = await StudentProfile.findOne({
    schoolId,
    userId: studentUserId,
  }).populate('classSectionId');
  if (!student) return null;

  const classSection = student.classSectionId as any;

  const query: any = {
    schoolId,
    classSectionId: classSection?._id || student.classSectionId,
  };
  if (academicYearId) {
    query.academicYearId = academicYearId;
  }

  const records = await AttendanceRecord.find(query).sort({ date: -1 }).lean();

  let presentDays = 0;
  let lateDays = 0;
  let leaveDays = 0;
  let absentDays = 0;
  const history: any[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (const rec of records) {
    const item = rec.records.find(
      (r) => r.studentId.toString() === studentUserId
    );
    if (item) {
      if (item.status === 'present') presentDays++;
      else if (item.status === 'late') lateDays++;
      else if (item.status === 'leave') leaveDays++;
      else if (item.status === 'absent') absentDays++;

      const d = new Date(rec.date);
      history.push({
        date: rec.date,
        dayName: dayNames[d.getDay()],
        status: item.status,
        remarks: item.remarks || '',
        takenByName: rec.takenByName,
      });
    }
  }

  const totalWorkingDays = records.length;
  const attendanceRate =
    totalWorkingDays > 0
      ? Math.round(((presentDays + lateDays * 0.5) / totalWorkingDays) * 100)
      : 100;

  return {
    studentId: student.userId.toString(),
    studentName: student.name,
    rollNumber: student.rollNumber,
    admissionNumber: student.admissionNumber,
    className: classSection?.name || 'Class',
    section: classSection?.section || 'A',
    totalWorkingDays,
    presentDays,
    lateDays,
    leaveDays,
    absentDays,
    attendanceRate,
    formula:
      'Attendance Rate = ((Present Days + 0.5 × Late Days) / Total Working Days) × 100%',
    history,
  };
}

export async function getStudentAttendanceReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { studentId } = req.params;
    const { academicYearId } = req.query;

    const isObjId = mongoose.isValidObjectId(studentId);
    const student = await StudentProfile.findOne({
      schoolId,
      ...(isObjId
        ? { $or: [{ _id: studentId }, { userId: studentId }] }
        : { userId: studentId }),
    });
    if (!student) {
      res
        .status(404)
        .json({ success: false, message: 'Student profile not found' });
      return;
    }

    if (req.user!.role === 'teacher') {
      const authorized = await checkTeacherClassScope(
        schoolId,
        req.user!.userId,
        student.classSectionId.toString()
      );
      if (!authorized) {
        res.status(403).json({
          success: false,
          message:
            'Forbidden: You cannot view attendance for students outside your assigned classes.',
        });
        return;
      }
    } else if (req.user!.role === 'student') {
      if (req.user!.userId !== student.userId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Students can only view their own attendance.',
        });
        return;
      }
    } else if (req.user!.role === 'parent') {
      const parent = await ParentProfile.findOne({
        schoolId,
        userId: req.user!.userId,
      });
      const linked =
        parent?.linkedStudentUserIds?.map((id) => id.toString()) || [];
      const studentParentIds =
        student.parentIds?.map((id: any) => id.toString()) || [];
      if (
        !linked.includes(student.userId.toString()) &&
        !studentParentIds.includes(req.user!.userId)
      ) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Parent cannot access an unrelated student.',
        });
        return;
      }
    }

    const report = await generateStudentAttendanceReport(
      schoolId,
      student.userId.toString(),
      academicYearId?.toString()
    );
    if (!report) {
      res
        .status(404)
        .json({
          success: false,
          message: 'Student attendance record not found',
        });
      return;
    }

    res.json({ success: true, report });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to generate student attendance report',
      });
  }
}

export async function getParentChildAttendance(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { studentId } = req.params;
    const { academicYearId } = req.query;

    if (req.user!.role !== 'parent') {
      res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: Only parents can access this endpoint.',
        });
      return;
    }

    const isObjId = mongoose.isValidObjectId(studentId);
    const student = await StudentProfile.findOne({
      schoolId,
      ...(isObjId
        ? { $or: [{ _id: studentId }, { userId: studentId }] }
        : { userId: studentId }),
    });
    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
      return;
    }

    const parent = await ParentProfile.findOne({
      schoolId,
      userId: req.user!.userId,
    });
    const linkedIds =
      parent?.linkedStudentUserIds?.map((id) => id.toString()) || [];
    const studentParentIds =
      student.parentIds?.map((id: any) => id.toString()) || [];
    const isAuthorized =
      linkedIds.includes(student.userId.toString()) ||
      studentParentIds.includes(req.user!.userId);

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message:
          'Forbidden: You do not have permission to view attendance for an unrelated student.',
      });
      return;
    }

    const report = await generateStudentAttendanceReport(
      schoolId,
      student.userId.toString(),
      academicYearId?.toString()
    );
    if (!report) {
      res
        .status(404)
        .json({
          success: false,
          message: 'Attendance records not found for child.',
        });
      return;
    }

    res.json({ success: true, report });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to retrieve child attendance' });
  }
}

export async function getStudentPersonalAttendance(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { academicYearId } = req.query;

    if (req.user!.role !== 'student') {
      res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: Only students can access this endpoint.',
        });
      return;
    }

    const report = await generateStudentAttendanceReport(
      schoolId,
      req.user!.userId,
      academicYearId?.toString()
    );
    if (!report) {
      res
        .status(404)
        .json({
          success: false,
          message: 'Student attendance records not found.',
        });
      return;
    }

    res.json({ success: true, report });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to retrieve personal attendance',
      });
  }
}

export async function getGuardianAlerts(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const logs = getGuardianNotificationLogs(schoolId);
    res.json({
      success: true,
      logs,
    });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to retrieve guardian notification logs',
      });
  }
}
