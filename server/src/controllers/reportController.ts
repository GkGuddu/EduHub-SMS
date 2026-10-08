import { Request, Response } from 'express';
import {
  ClassSection,
  StudentProfile,
  AttendanceRecord,
  FeeInvoice,
  Exam,
  GradeRecord,
  Homework,
  HomeworkSubmission,
  ParentProfile,
} from '../models';

export async function getStudentStrengthReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { classSectionId } = req.query;

    const classQuery: any = { schoolId };
    if (classSectionId && classSectionId !== 'all') {
      classQuery._id = classSectionId;
    }

    const classes = await ClassSection.find(classQuery)
      .sort({ name: 1, section: 1 })
      .lean();

    const reports = await Promise.all(
      classes.map(async (cls) => {
        const students = await StudentProfile.find({
          schoolId,
          classSectionId: cls._id,
          isActive: true,
        }).lean();

        const totalEnrolled = students.length;
        const boys = students.filter((s) => s.gender === 'male').length;
        const girls = students.filter((s) => s.gender === 'female').length;
        const other = totalEnrolled - (boys + girls);
        const capacity = cls.capacity || 40;
        const availableSeats = Math.max(0, capacity - totalEnrolled);
        const occupancyRate =
          capacity > 0 ? Math.round((totalEnrolled / capacity) * 100) : 0;

        return {
          classSectionId: cls._id.toString(),
          className: cls.name,
          section: cls.section,
          capacity,
          totalEnrolled,
          boys,
          girls,
          other,
          availableSeats,
          occupancyRate,
        };
      })
    );

    res.json({ success: true, reports });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to generate student strength report',
      });
  }
}

export async function getAttendanceReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { classSectionId, startDate, endDate } = req.query;

    const query: any = { schoolId };
    if (classSectionId && classSectionId !== 'all') {
      query.classSectionId = classSectionId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate as string;
      if (endDate) query.date.$lte = endDate as string;
    }

    const records = await AttendanceRecord.find(query)
      .populate('classSectionId', 'name section')
      .sort({ date: -1 })
      .lean();

    const daily = records.map((rec: any) => {
      const total = rec.records?.length || 0;
      const present =
        rec.records?.filter((r: any) => r.status === 'present').length || 0;
      const absent =
        rec.records?.filter((r: any) => r.status === 'absent').length || 0;
      const late =
        rec.records?.filter((r: any) => r.status === 'late').length || 0;
      const leave =
        rec.records?.filter((r: any) => r.status === 'leave').length || 0;
      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      return {
        date: rec.date,
        className: rec.classSectionId?.name || 'Class',
        section: rec.classSectionId?.section || 'A',
        total,
        present,
        absent,
        late,
        leave,
        rate,
      };
    });

    const monthlyMap: Record<
      string,
      {
        totalRate: number;
        count: number;
        students: number;
        className: string;
        section: string;
      }
    > = {};

    for (const d of daily) {
      const monthKey = `${d.date.substring(0, 7)}_${d.className}_${d.section}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          totalRate: 0,
          count: 0,
          students: d.total,
          className: d.className,
          section: d.section,
        };
      }
      monthlyMap[monthKey].totalRate += d.rate;
      monthlyMap[monthKey].count += 1;
    }

    const monthly = Object.entries(monthlyMap).map(([key, data]) => {
      const month = key.split('_')[0];
      return {
        month,
        className: data.className,
        section: data.section,
        workingDays: data.count,
        avgRate: Math.round(data.totalRate / data.count),
        totalStudents: data.students,
      };
    });

    res.json({ success: true, daily, monthly });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to compile attendance report' });
  }
}

export async function getFeesReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { classSectionId } = req.query;

    const query: any = { schoolId };
    if (classSectionId && classSectionId !== 'all') {
      query.classSectionId = classSectionId;
    }

    const invoices = await FeeInvoice.find(query)
      .populate('studentId', 'name email')
      .populate('classSectionId', 'name section')
      .lean();

    let billed = 0;
    let collected = 0;
    let outstanding = 0;

    const defaulters: any[] = [];

    const studentIds = invoices.map(
      (inv) => inv.studentId?._id || inv.studentId
    );
    const parents = await ParentProfile.find({
      schoolId,
      linkedStudentUserIds: { $in: studentIds },
    }).lean();

    const parentByStudentId: Record<string, any> = {};
    for (const p of parents) {
      for (const sid of p.linkedStudentUserIds || []) {
        parentByStudentId[sid.toString()] = p;
      }
    }

    for (const inv of invoices) {
      billed += inv.totalAmount;
      collected += inv.paidAmount;
      outstanding += inv.balance;

      if (inv.balance > 0) {
        const studentUserId = (inv.studentId?._id || inv.studentId)?.toString();
        const parent = studentUserId ? parentByStudentId[studentUserId] : null;

        const dueDateObj = new Date(inv.dueDate);
        const todayObj = new Date();
        const overdueDays = Math.max(
          0,
          Math.floor(
            (todayObj.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        defaulters.push({
          studentId: studentUserId,
          studentName: (inv.studentId as any)?.name || 'Student',
          rollNumber: inv.invoiceNumber,
          className: (inv.classSectionId as any)?.name || 'Class',
          section: (inv.classSectionId as any)?.section || 'A',
          parentName: parent?.guardianName || parent?.fatherName || 'Parent',
          parentPhone: parent?.phone || 'N/A',
          balance: inv.balance,
          dueDate: inv.dueDate,
          overdueDays,
        });
      }
    }

    defaulters.sort((a, b) => b.overdueDays - a.overdueDays);

    const collectionRate =
      billed > 0 ? Math.round((collected / billed) * 100) : 0;

    res.json({
      success: true,
      report: {
        billed,
        collected,
        outstanding,
        collectionRate,
        defaultersCount: defaulters.length,
        defaulters,
      },
    });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to generate fee ledger report',
      });
  }
}

export async function getExamPerformanceReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { classSectionId, examId } = req.query;

    const examQuery: any = { schoolId, status: 'published' };
    if (examId && examId !== 'all') {
      examQuery._id = examId;
    }
    if (classSectionId && classSectionId !== 'all') {
      examQuery.classSectionId = classSectionId;
    }

    const exams = await Exam.find(examQuery)
      .populate('classSectionId', 'name section')
      .populate('subjects.subjectId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    const reports = await Promise.all(
      exams.map(async (exam: any) => {
        const records = await GradeRecord.find({
          schoolId,
          examId: exam._id,
        })
          .populate('subjectId', 'name code')
          .lean();

        let totalStudents = 0;
        let appeared = 0;
        let passed = 0;
        let totalMarks = 0;

        const gradeDistribution: Record<string, number> = {
          'A+': 0,
          A: 0,
          B: 0,
          C: 0,
          D: 0,
          F: 0,
        };

        const subjectMap: Record<
          string,
          {
            total: number;
            count: number;
            max: number;
            name: string;
            code: string;
          }
        > = {};

        for (const rec of records) {
          const subId = (rec.subjectId?._id || rec.subjectId)?.toString();
          const subName = (rec.subjectId as any)?.name || 'Subject';
          const subCode = (rec.subjectId as any)?.code || 'SUB';

          if (!subjectMap[subId]) {
            subjectMap[subId] = {
              total: 0,
              count: 0,
              max: rec.maxMarks,
              name: subName,
              code: subCode,
            };
          }

          for (const item of rec.grades || []) {
            totalStudents++;
            if (!item.isAbsent) {
              appeared++;
              totalMarks += item.marksObtained;
              const passM = rec.passingMarks || exam.passingMarks || 40;
              const isItemPassed =
                item.isPassed !== undefined
                  ? item.isPassed
                  : item.marksObtained >= passM;
              if (isItemPassed) passed++;

              const g = item.grade || 'F';
              gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;

              subjectMap[subId].total += item.marksObtained;
              subjectMap[subId].count += 1;
            }
          }
        }

        const failed = appeared - passed;
        const passRate =
          appeared > 0 ? Math.round((passed / appeared) * 100) : 0;
        const averageMarks =
          appeared > 0 ? Math.round(totalMarks / appeared) : 0;

        const subjectAverages = Object.values(subjectMap).map((s) => ({
          subjectName: s.name,
          code: s.code,
          averageMarks: s.count > 0 ? Math.round(s.total / s.count) : 0,
          maxMarks: s.max,
        }));

        return {
          examId: exam._id.toString(),
          examName: exam.name,
          className: exam.classSectionId?.name || 'Class',
          section: exam.classSectionId?.section || 'A',
          totalStudents,
          appeared,
          passed,
          failed,
          passRate,
          averageMarks,
          gradeDistribution,
          subjectAverages,
        };
      })
    );

    res.json({ success: true, reports });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to compile exam performance analytics',
      });
  }
}

export async function getHomeworkReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { classSectionId } = req.query;

    const query: any = { schoolId };
    if (classSectionId && classSectionId !== 'all') {
      query.classSectionId = classSectionId;
    }

    const assignments = await Homework.find(query)
      .populate('classSectionId', 'name section capacity')
      .populate('subjectId', 'name code')
      .lean();

    const reports = await Promise.all(
      assignments.map(async (hw: any) => {
        const submissions = await HomeworkSubmission.find({
          schoolId,
          homeworkId: hw._id,
        }).lean();

        const expectedCount = hw.classSectionId?.capacity || 35;
        const submittedOnTime = submissions.filter((s) => !s.isLate).length;
        const submittedLate = submissions.filter((s) => s.isLate).length;
        const totalReceived = submittedOnTime + submittedLate;
        const pendingSubmissions = Math.max(0, expectedCount - totalReceived);
        const completionRate =
          expectedCount > 0
            ? Math.round((totalReceived / expectedCount) * 100)
            : 0;

        return {
          classSectionId: hw.classSectionId?._id?.toString() || '',
          className: hw.classSectionId?.name || 'Grade 10',
          section: hw.classSectionId?.section || 'A',
          subject: hw.subjectId?.name || 'Subject',
          totalHomework: 1,
          totalSubmissionsExpected: expectedCount,
          submittedOnTime,
          submittedLate,
          pendingSubmissions,
          completionRate,
        };
      })
    );

    res.json({ success: true, reports });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to compile homework completion report',
      });
  }
}

export async function exportCsvReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { type = 'strength', classSectionId } = req.query;

    let csvContent = '';
    let filename = `eduhub-${type}-report-${Date.now()}.csv`;

    if (type === 'strength') {
      const classQuery: any = { schoolId };
      if (classSectionId && classSectionId !== 'all') {
        classQuery._id = classSectionId;
      }
      const classes = await ClassSection.find(classQuery)
        .sort({ name: 1, section: 1 })
        .lean();
      csvContent =
        'Class,Section,Capacity,Enrolled,Boys,Girls,Other,Available Seats,Occupancy Rate (%)\n';

      for (const cls of classes) {
        const students = await StudentProfile.find({
          schoolId,
          classSectionId: cls._id,
          isActive: true,
        }).lean();
        const enrolled = students.length;
        const boys = students.filter((s) => s.gender === 'male').length;
        const girls = students.filter((s) => s.gender === 'female').length;
        const other = enrolled - (boys + girls);
        const cap = cls.capacity || 40;
        const avail = Math.max(0, cap - enrolled);
        const occ = cap > 0 ? Math.round((enrolled / cap) * 100) : 0;
        csvContent += `"${cls.name}","${cls.section}",${cap},${enrolled},${boys},${girls},${other},${avail},${occ}%\n`;
      }
    } else if (type === 'attendance') {
      const records = await AttendanceRecord.find({ schoolId })
        .populate('classSectionId', 'name section')
        .sort({ date: -1 })
        .lean();
      csvContent =
        'Date,Class,Section,Total Students,Present,Absent,Late,Leave,Attendance Rate (%)\n';

      for (const rec of records as any[]) {
        const total = rec.records?.length || 0;
        const present =
          rec.records?.filter((r: any) => r.status === 'present').length || 0;
        const absent =
          rec.records?.filter((r: any) => r.status === 'absent').length || 0;
        const late =
          rec.records?.filter((r: any) => r.status === 'late').length || 0;
        const leave =
          rec.records?.filter((r: any) => r.status === 'leave').length || 0;
        const rate =
          total > 0 ? Math.round(((present + late) / total) * 100) : 0;
        csvContent += `"${rec.date}","${rec.classSectionId?.name || ''}","${rec.classSectionId?.section || ''}",${total},${present},${absent},${late},${leave},${rate}%\n`;
      }
    } else if (type === 'fees') {
      const invoices = await FeeInvoice.find({ schoolId })
        .populate('studentId', 'name email')
        .populate('classSectionId', 'name section')
        .lean();
      csvContent =
        'Invoice Number,Student Name,Class,Section,Total Billed (INR),Paid Amount (INR),Balance (INR),Status,Due Date\n';

      for (const inv of invoices as any[]) {
        csvContent += `"${inv.invoiceNumber}","${inv.studentId?.name || ''}","${inv.classSectionId?.name || ''}","${inv.classSectionId?.section || ''}",${inv.totalAmount},${inv.paidAmount},${inv.balance},"${inv.status}","${inv.dueDate}"\n`;
      }
    } else if (type === 'exams') {
      const exams = await Exam.find({ schoolId, status: 'published' })
        .populate('classSectionId', 'name section')
        .lean();
      csvContent =
        'Exam Name,Class,Section,Appeared,Passed,Failed,Pass Rate (%)\n';

      for (const exam of exams as any[]) {
        const records = await GradeRecord.find({
          schoolId,
          examId: exam._id,
        }).lean();
        let appeared = 0;
        let passed = 0;
        for (const rec of records) {
          for (const item of rec.grades || []) {
            if (!item.isAbsent) {
              appeared++;
              const passM = rec.passingMarks || exam.passingMarks || 40;
              if (item.isPassed || item.marksObtained >= passM) passed++;
            }
          }
        }
        const failed = appeared - passed;
        const rate = appeared > 0 ? Math.round((passed / appeared) * 100) : 0;
        csvContent += `"${exam.name}","${exam.classSectionId?.name || ''}","${exam.classSectionId?.section || ''}",${appeared},${passed},${failed},${rate}%\n`;
      }
    } else {
      csvContent = 'Report Type,Status\n' + `${type},Generated\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to export CSV report' });
  }
}
