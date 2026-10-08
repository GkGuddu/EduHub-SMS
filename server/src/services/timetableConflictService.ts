import mongoose from 'mongoose';
import { Timetable } from '../models';

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    const parts = cleaned.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3]?.toUpperCase();

  if (meridian === 'PM' && hours < 12) {
    hours += 12;
  } else if (meridian === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

export function doIntervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

export interface ConflictCheckParams {
  schoolId: string | mongoose.Types.ObjectId;
  slotId?: string | mongoose.Types.ObjectId;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  teacherId: string | mongoose.Types.ObjectId;
  classSectionId: string | mongoose.Types.ObjectId;
  roomNumber?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType?: 'teacher' | 'class' | 'room';
  conflictingSlot?: any;
  message?: string;
}

export async function checkTimetableConflicts(
  params: ConflictCheckParams
): Promise<ConflictCheckResult> {
  const {
    schoolId,
    slotId,
    dayOfWeek,
    startTime,
    endTime,
    teacherId,
    classSectionId,
    roomNumber,
  } = params;

  const newStart = parseTimeToMinutes(startTime);
  const newEnd = parseTimeToMinutes(endTime);

  if (newStart >= newEnd) {
    return {
      hasConflict: true,
      message: `Invalid period duration: Start time (${startTime}) must be earlier than end time (${endTime}).`,
    };
  }

  const query: any = {
    schoolId,
    dayOfWeek,
  };

  if (slotId) {
    query._id = { $ne: slotId };
  }

  const existingSlots = await Timetable.find(query)
    .populate('classSectionId', 'name section')
    .populate('subjectId', 'name')
    .populate('teacherId', 'name')
    .lean();

  for (const slot of existingSlots) {
    const slotStart = parseTimeToMinutes(slot.startTime);
    const slotEnd = parseTimeToMinutes(slot.endTime);

    if (doIntervalsOverlap(newStart, newEnd, slotStart, slotEnd)) {
      const teacherMatches = slot.teacherId?._id
        ? slot.teacherId._id.toString() === teacherId.toString()
        : slot.teacherId?.toString() === teacherId.toString();

      if (teacherMatches) {
        const teacherName = (slot.teacherId as any)?.name || 'The teacher';
        const className = (slot.classSectionId as any)?.name || 'another class';
        return {
          hasConflict: true,
          conflictType: 'teacher',
          conflictingSlot: slot,
          message: `Teacher conflict: ${teacherName} is already assigned to ${className} on ${dayOfWeek} from ${slot.startTime} to ${slot.endTime}.`,
        };
      }

      const classMatches = slot.classSectionId?._id
        ? slot.classSectionId._id.toString() === classSectionId.toString()
        : slot.classSectionId?.toString() === classSectionId.toString();

      if (classMatches) {
        const subjectName = (slot.subjectId as any)?.name || 'another subject';
        return {
          hasConflict: true,
          conflictType: 'class',
          conflictingSlot: slot,
          message: `Class conflict: This class already has ${subjectName} scheduled on ${dayOfWeek} from ${slot.startTime} to ${slot.endTime}.`,
        };
      }

      if (
        roomNumber &&
        slot.roomNumber &&
        slot.roomNumber.trim().toLowerCase() === roomNumber.trim().toLowerCase()
      ) {
        const className = (slot.classSectionId as any)?.name || 'another class';
        return {
          hasConflict: true,
          conflictType: 'room',
          conflictingSlot: slot,
          message: `Room conflict: ${roomNumber} is already occupied by ${className} on ${dayOfWeek} from ${slot.startTime} to ${slot.endTime}.`,
        };
      }
    }
  }

  return { hasConflict: false };
}
