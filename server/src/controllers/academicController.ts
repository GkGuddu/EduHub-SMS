import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  AcademicYear,
  ClassSection,
  Subject,
  ClassSubjectAssignment,
  SchoolCalendarEvent,
} from '../models';
import { School } from '../models';
import { StudentProfile } from '../models';
import { AuditLog } from '../models';
import {
  AcademicYearCreateSchema,
  AcademicYearUpdateSchema,
  ClassSectionCreateSchema,
  ClassSectionUpdateSchema,
  SubjectCreateSchema,
  SubjectUpdateSchema,
  SchoolCalendarEventCreateSchema,
  WorkingDaysUpdateSchema,
  SchoolProfileUpdateSchema,
} from '@eduhub/shared';

export async function getAcademicYears(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const academicYears = await AcademicYear.find({ schoolId })
      .sort({ startDate: -1 })
      .lean();
    res.json({ success: true, academicYears });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch academic years' });
  }
}

export async function createAcademicYear(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const parsed = AcademicYearCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message:
          parsed.error.errors[0]?.message || 'Invalid academic year data',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { name, startDate, endDate, isCurrent, description } = parsed.data;

    const existing = await AcademicYear.findOne({ schoolId, name });
    if (existing) {
      res.status(400).json({
        success: false,
        message: `Academic Year '${name}' already exists in this school.`,
      });
      return;
    }

    if (isCurrent) {
      await AcademicYear.updateMany({ schoolId }, { isCurrent: false });
      await School.findByIdAndUpdate(schoolId, { academicYear: name });
    }

    const newYear = await AcademicYear.create({
      schoolId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent,
      description,
    });

    res.status(201).json({ success: true, academicYear: newYear });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to create academic year' });
  }
}

export async function updateAcademicYear(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const parsed = AcademicYearUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message:
          parsed.error.errors[0]?.message ||
          'Invalid academic year update data',
      });
      return;
    }

    const year = await AcademicYear.findOne({ _id: id, schoolId });
    if (!year) {
      res
        .status(404)
        .json({ success: false, message: 'Academic year not found' });
      return;
    }

    const { name, startDate, endDate, isCurrent, description } = parsed.data;

    if (name && name !== year.name) {
      const duplicate = await AcademicYear.findOne({
        schoolId,
        name,
        _id: { $ne: id },
      });
      if (duplicate) {
        res.status(400).json({
          success: false,
          message: `Another academic year named '${name}' already exists.`,
        });
        return;
      }
      year.name = name;
    }

    if (startDate) year.startDate = new Date(startDate);
    if (endDate) year.endDate = new Date(endDate);
    if (description !== undefined) year.description = description;

    if (isCurrent !== undefined) {
      if (isCurrent) {
        await AcademicYear.updateMany(
          { schoolId, _id: { $ne: id } },
          { isCurrent: false }
        );
        await School.findByIdAndUpdate(schoolId, { academicYear: year.name });
        year.isCurrent = true;
      } else {
        year.isCurrent = false;
      }
    }

    await year.save();
    res.json({ success: true, academicYear: year });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update academic year' });
  }
}

export async function setCurrentAcademicYear(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const target = await AcademicYear.findOne({ _id: id, schoolId });
    if (!target) {
      res
        .status(404)
        .json({ success: false, message: 'Academic year not found' });
      return;
    }

    await AcademicYear.updateMany({ schoolId }, { isCurrent: false });
    target.isCurrent = true;
    await target.save();

    await School.findByIdAndUpdate(schoolId, { academicYear: target.name });

    res.json({
      success: true,
      message: `Set ${target.name} as active academic year`,
      academicYear: target,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to set active academic year' });
  }
}

export async function deleteAcademicYear(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const year = await AcademicYear.findOne({ _id: id, schoolId });
    if (!year) {
      res
        .status(404)
        .json({ success: false, message: 'Academic year not found' });
      return;
    }

    if (year.isCurrent) {
      res.status(400).json({
        success: false,
        message:
          'Cannot delete the currently active academic year. Please activate another year first.',
      });
      return;
    }

    const classesCount = await ClassSection.countDocuments({
      schoolId,
      $or: [{ academicYearId: year._id }, { academicYear: year.name }],
    });

    if (classesCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete academic year: ${classesCount} class(es) are linked to it.`,
      });
      return;
    }

    await AcademicYear.deleteOne({ _id: id, schoolId });
    res.json({ success: true, message: 'Academic year deleted successfully' });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete academic year' });
  }
}

export async function getClasses(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { academicYearId, academicYear, search } = req.query;

    let filter: any = { schoolId };

    if (academicYearId) {
      filter.academicYearId = academicYearId;
    } else if (academicYear) {
      filter.academicYear = academicYear;
    }

    if (search) {
      const regex = new RegExp(String(search), 'i');
      filter.$or = [{ name: regex }, { section: regex }, { roomNumber: regex }];
    }

    if (req.user!.role === 'teacher') {
      const assignments = await ClassSubjectAssignment.find({
        schoolId,
        teacherId: req.user!.userId,
      }).select('classSectionId');

      const classIds = assignments.map((a) => a.classSectionId);
      filter._id = { $in: classIds };
    }

    const classes = await ClassSection.find(filter)
      .populate('classTeacherId', 'name email')
      .populate('academicYearId', 'name isCurrent')
      .sort({ name: 1, section: 1 })
      .lean();

    const classIds = classes.map((c) => c._id);
    const counts = await StudentProfile.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          classSectionId: { $in: classIds },
          status: 'active',
        },
      },
      { $group: { _id: '$classSectionId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

    const result = classes.map((c) => ({
      ...c,
      studentCount: countMap.get(c._id.toString()) || 0,
      classTeacherName: (c.classTeacherId as any)?.name || 'Unassigned',
    }));

    res.json({ success: true, classes: result });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch classes' });
  }
}

export async function createClass(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const parsed = ClassSectionCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message:
          parsed.error.errors[0]?.message || 'Invalid class section data',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const {
      name,
      section,
      roomNumber,
      capacity,
      classTeacherId,
      academicYear,
      academicYearId,
    } = parsed.data;

    const existing = await ClassSection.findOne({
      schoolId,
      name,
      section: section.toUpperCase(),
      academicYear,
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: `Class ${name} - Section ${section.toUpperCase()} already exists in academic session ${academicYear}.`,
      });
      return;
    }

    const newClass = await ClassSection.create({
      schoolId,
      name,
      section: section.toUpperCase(),
      roomNumber,
      capacity: capacity || 40,
      classTeacherId:
        classTeacherId && classTeacherId.length > 0
          ? classTeacherId
          : undefined,
      academicYear,
      academicYearId:
        academicYearId && academicYearId.length > 0
          ? academicYearId
          : undefined,
    });

    res.status(201).json({ success: true, class: newClass });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to create class' });
  }
}

export async function updateClass(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const parsed = ClassSectionUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.errors[0]?.message || 'Invalid class update data',
      });
      return;
    }

    const cls = await ClassSection.findOne({ _id: id, schoolId });
    if (!cls) {
      res
        .status(404)
        .json({ success: false, message: 'Class section not found' });
      return;
    }

    const {
      name,
      section,
      roomNumber,
      capacity,
      classTeacherId,
      academicYear,
      academicYearId,
    } = parsed.data;

    const targetName = name || cls.name;
    const targetSection = (section || cls.section).toUpperCase();
    const targetYear = academicYear || cls.academicYear;

    if (
      targetName !== cls.name ||
      targetSection !== cls.section ||
      targetYear !== cls.academicYear
    ) {
      const duplicate = await ClassSection.findOne({
        schoolId,
        name: targetName,
        section: targetSection,
        academicYear: targetYear,
        _id: { $ne: id },
      });
      if (duplicate) {
        res.status(400).json({
          success: false,
          message: `Class ${targetName} - ${targetSection} already exists in ${targetYear}.`,
        });
        return;
      }
    }

    if (name) cls.name = name;
    if (section) cls.section = section.toUpperCase();
    if (roomNumber !== undefined) cls.roomNumber = roomNumber;
    if (capacity !== undefined) cls.capacity = capacity;
    if (classTeacherId !== undefined) {
      cls.classTeacherId =
        classTeacherId && classTeacherId.length > 0
          ? (classTeacherId as any)
          : undefined;
    }
    if (academicYear) cls.academicYear = academicYear;
    if (academicYearId !== undefined) {
      cls.academicYearId =
        academicYearId && academicYearId.length > 0
          ? (academicYearId as any)
          : undefined;
    }

    await cls.save();
    res.json({ success: true, class: cls });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to update class' });
  }
}

export async function deleteClass(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const cls = await ClassSection.findOne({ _id: id, schoolId });
    if (!cls) {
      res
        .status(404)
        .json({ success: false, message: 'Class section not found' });
      return;
    }

    const activeStudents = await StudentProfile.countDocuments({
      schoolId,
      classSectionId: id,
      status: 'active',
    });

    if (activeStudents > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete class section: ${activeStudents} active student(s) currently enrolled.`,
      });
      return;
    }

    await ClassSection.deleteOne({ _id: id, schoolId });
    await ClassSubjectAssignment.deleteMany({ schoolId, classSectionId: id });

    res.json({ success: true, message: 'Class section deleted successfully' });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to delete class' });
  }
}

export async function getSubjects(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { search, type } = req.query;

    let filter: any = { schoolId };
    if (type) filter.type = type;
    if (search) {
      const regex = new RegExp(String(search), 'i');
      filter.$or = [{ name: regex }, { code: regex }, { description: regex }];
    }

    const subjects = await Subject.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, subjects });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch subjects' });
  }
}

export async function createSubject(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const parsed = SubjectCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.errors[0]?.message || 'Invalid subject data',
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { name, code, description, type, credits } = parsed.data;

    const existing = await Subject.findOne({ schoolId, code });
    if (existing) {
      res.status(400).json({
        success: false,
        message: `Subject with code '${code}' already exists in this school.`,
      });
      return;
    }

    const subject = await Subject.create({
      schoolId,
      name,
      code,
      description,
      type,
      credits,
    });

    res.status(201).json({ success: true, subject });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to create subject' });
  }
}

export async function updateSubject(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const parsed = SubjectUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message:
          parsed.error.errors[0]?.message || 'Invalid subject update data',
      });
      return;
    }

    const subject = await Subject.findOne({ _id: id, schoolId });
    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found' });
      return;
    }

    const { name, code, description, type, credits } = parsed.data;

    if (code && code !== subject.code) {
      const duplicate = await Subject.findOne({
        schoolId,
        code,
        _id: { $ne: id },
      });
      if (duplicate) {
        res.status(400).json({
          success: false,
          message: `Subject with code '${code}' already exists.`,
        });
        return;
      }
      subject.code = code;
    }

    if (name) subject.name = name;
    if (description !== undefined) subject.description = description;
    if (type) subject.type = type;
    if (credits !== undefined) subject.credits = credits;

    await subject.save();
    res.json({ success: true, subject });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update subject' });
  }
}

export async function deleteSubject(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const subject = await Subject.findOne({ _id: id, schoolId });
    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found' });
      return;
    }

    await Subject.deleteOne({ _id: id, schoolId });
    await ClassSubjectAssignment.deleteMany({ schoolId, subjectId: id });

    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete subject' });
  }
}

export async function getAssignments(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    let filter: any = { schoolId };

    if (req.user!.role === 'teacher') {
      filter.teacherId = req.user!.userId;
    }

    const assignments = await ClassSubjectAssignment.find(filter)
      .populate('classSectionId', 'name section')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .lean();

    const formatted = assignments.map((a: any) => ({
      _id: a._id,
      schoolId: a.schoolId,
      classSectionId: a.classSectionId?._id,
      className: a.classSectionId?.name,
      section: a.classSectionId?.section,
      subjectId: a.subjectId?._id,
      subjectName: a.subjectId?.name,
      teacherId: a.teacherId?._id,
      teacherName: a.teacherId?.name,
    }));

    res.json({ success: true, assignments: formatted });
  } catch (_error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch class subject allocations',
      });
  }
}

export async function assignSubjectTeacher(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { classSectionId, subjectId, teacherId } = req.body;

    if (!classSectionId || !subjectId || !teacherId) {
      res.status(400).json({
        success: false,
        message: 'classSectionId, subjectId, and teacherId are required',
      });
      return;
    }

    const assignment = await ClassSubjectAssignment.findOneAndUpdate(
      { schoolId, classSectionId, subjectId },
      { teacherId },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, assignment });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to assign teacher to subject' });
  }
}

export async function deleteAssignment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    await ClassSubjectAssignment.deleteOne({ _id: id, schoolId });
    res.json({ success: true, message: 'Allocation removed successfully' });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to remove allocation' });
  }
}

export async function getCalendarEvents(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { month, isHoliday, academicYearId } = req.query;

    let filter: any = { schoolId };
    if (academicYearId) filter.academicYearId = academicYearId;
    if (isHoliday !== undefined) filter.isHoliday = isHoliday === 'true';
    if (month) {
      filter.startDate = { $regex: `^${month}` };
    }

    const events = await SchoolCalendarEvent.find(filter)
      .sort({ startDate: 1 })
      .lean();
    res.json({ success: true, events });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch calendar events' });
  }
}

export async function createCalendarEvent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const parsed = SchoolCalendarEventCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message:
          parsed.error.errors[0]?.message || 'Invalid calendar event data',
      });
      return;
    }

    const event = await SchoolCalendarEvent.create({
      schoolId,
      ...parsed.data,
    });

    res.status(201).json({ success: true, event });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to create calendar event' });
  }
}

export async function deleteCalendarEvent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    await SchoolCalendarEvent.deleteOne({ _id: id, schoolId });
    res.json({ success: true, message: 'Calendar event removed' });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete calendar event' });
  }
}

export async function getWorkingDays(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const school = await School.findById(schoolId).select('workingDays').lean();

    res.json({
      success: true,
      workingDays: school?.workingDays || [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch working days' });
  }
}

export async function updateWorkingDays(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const parsed = WorkingDaysUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message:
          parsed.error.errors[0]?.message ||
          'Invalid working days configuration',
      });
      return;
    }

    const school = await School.findByIdAndUpdate(
      schoolId,
      { workingDays: parsed.data.workingDays },
      { new: true }
    );

    res.json({ success: true, workingDays: school?.workingDays });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update working days' });
  }
}

export async function getSchoolProfile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const school = await School.findById(schoolId).lean();
    if (!school) {
      res.status(404).json({ success: false, message: 'School not found' });
      return;
    }

    res.json({ success: true, school });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch school profile' });
  }
}

export async function updateSchoolProfile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const parsed = SchoolProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message:
          parsed.error.errors[0]?.message ||
          'Invalid school profile update data',
      });
      return;
    }

    const school = await School.findById(schoolId);
    if (!school) {
      res.status(404).json({ success: false, message: 'School not found' });
      return;
    }

    const {
      name,
      code,
      address,
      phone,
      email,
      website,
      logo,
      academicYear,
      workingDays,
      branding,
    } = parsed.data;

    if (code && code !== school.code) {
      const duplicate = await School.findOne({ code, _id: { $ne: schoolId } });
      if (duplicate) {
        res
          .status(400)
          .json({
            success: false,
            message: `School code '${code}' is already taken.`,
          });
        return;
      }
      school.code = code;
    }

    if (name) school.name = name;
    if (address) school.address = address;
    if (phone) school.phone = phone;
    if (email) school.email = email;
    if (website !== undefined) school.website = website;
    if (logo !== undefined) school.logo = logo;
    if (academicYear) school.academicYear = academicYear;
    if (workingDays) school.workingDays = workingDays;
    if (branding) {
      school.branding = {
        ...school.branding,
        ...branding,
      };
    }

    await school.save();

    await AuditLog.create({
      schoolId,
      userId: req.user!.userId,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'PERMISSION_UPDATE',
      entityType: 'auth',
      entityId: school._id.toString(),
      details: `Updated school branding and profile settings for ${school.name}`,
    });

    res.json({ success: true, school });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update school profile' });
  }
}
