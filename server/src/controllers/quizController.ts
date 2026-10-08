import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  Quiz,
  QuizAttempt,
  ClassSection,
  Subject,
  ClassSubjectAssignment,
  StudentProfile,
  ParentProfile,
} from '../models';
import {
  QuizCreateSchema,
  QuizUpdateSchema,
  QuizSubmitSchema,
  QuizSaveAnswersSchema,
  QuizAiGenerateSchema,
  hasPermission,
} from '@eduhub/shared';
import { generateAiQuizQuestions } from '../services/aiService';

async function isTeacherAssigned(
  schoolId: any,
  teacherUserId: any,
  classSectionId: any,
  subjectId: any
): Promise<boolean> {
  const assignment = await ClassSubjectAssignment.findOne({
    schoolId,
    teacherId: teacherUserId,
    classSectionId,
    subjectId,
  }).lean();
  return !!assignment;
}

export async function listQuizzes(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { subjectId, status, classSectionId } = req.query;

    const query: any = { schoolId };

    if (subjectId && typeof subjectId === 'string' && subjectId !== 'all') {
      query.subjectId = subjectId;
    }

    if (role === 'admin') {
      if (status && typeof status === 'string' && status !== 'all') {
        query.status = status;
      }
      if (classSectionId && typeof classSectionId === 'string') {
        query.classSectionId = classSectionId;
      }
    } else if (role === 'teacher') {
      if (!hasPermission('teacher', req.user!.permissions, 'quizzes.view')) {
        res
          .status(403)
          .json({
            success: false,
            message: 'Forbidden: Missing quizzes.view permission',
          });
        return;
      }
      const assignments = await ClassSubjectAssignment.find({
        schoolId,
        teacherId: userId,
      }).lean();

      const assignedClassIds = assignments.map((a) => a.classSectionId);
      const assignedSubjectIds = assignments.map((a) => a.subjectId);

      query.$or = [
        { teacherId: userId },
        {
          classSectionId: { $in: assignedClassIds },
          subjectId: { $in: assignedSubjectIds },
        },
      ];

      if (status && typeof status === 'string' && status !== 'all') {
        query.status = status;
      }
    } else if (role === 'student') {
      const profile = await StudentProfile.findOne({ schoolId, userId }).lean();
      if (!profile || !profile.classSectionId) {
        res.json({ success: true, quizzes: [] });
        return;
      }

      query.classSectionId = profile.classSectionId;
      query.status = 'published';
    } else if (role === 'parent') {
      const parentProfile = await ParentProfile.findOne({
        schoolId,
        userId,
      }).lean();
      if (!parentProfile || !parentProfile.linkedStudentUserIds?.length) {
        res.json({ success: true, quizzes: [] });
        return;
      }

      const childId = req.query.studentId as string;
      let targetStudentUserId: any = parentProfile.linkedStudentUserIds[0];

      if (childId) {
        const isLinked = parentProfile.linkedStudentUserIds.some(
          (id) => id.toString() === childId
        );
        if (!isLinked) {
          res
            .status(403)
            .json({
              success: false,
              message: 'Forbidden: Student not linked to this parent',
            });
          return;
        }
        targetStudentUserId = childId;
      }

      const childProfile = await StudentProfile.findOne({
        schoolId,
        userId: targetStudentUserId,
      }).lean();
      if (!childProfile || !childProfile.classSectionId) {
        res.json({ success: true, quizzes: [] });
        return;
      }

      query.classSectionId = childProfile.classSectionId;
      query.status = 'published';
    }

    const quizzes = await Quiz.find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    let studentUserIdToLookup: any = role === 'student' ? userId : null;
    if (role === 'parent' && req.query.studentId) {
      studentUserIdToLookup = req.query.studentId;
    }

    const formatted = await Promise.all(
      quizzes.map(async (q: any) => {
        let myAttempt: any = null;
        if (studentUserIdToLookup) {
          const att = await QuizAttempt.findOne({
            schoolId,
            quizId: q._id,
            studentId: studentUserIdToLookup,
          }).lean();
          if (att) {
            myAttempt = {
              attemptId: att._id.toString(),
              status: att.status,
              totalMarksObtained: att.totalMarksObtained,
              percentage: att.percentage,
              isPassed: att.isPassed,
              submittedAt: att.submittedAt
                ? att.submittedAt.toISOString()
                : undefined,
            };
          }
        }

        return {
          _id: q._id.toString(),
          schoolId: q.schoolId.toString(),
          title: q.title,
          description: q.description,
          subjectId: q.subjectId.toString(),
          subjectName: q.subjectName,
          classSectionId: q.classSectionId.toString(),
          classSectionName: q.classSectionName,
          teacherId: q.teacherId.toString(),
          duration: q.duration,
          totalQuestions: q.questions?.length || 0,
          totalMarks: q.totalMarks,
          passingMarks: q.passingMarks,
          dueDate: q.dueDate,
          status: q.status,
          allowReview: q.allowReview,
          attemptCount: q.attemptCount || 0,
          myAttempt,
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
        };
      })
    );

    res.json({ success: true, quizzes: formatted });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to list quizzes',
      });
  }
}

export async function getQuizById(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { id } = req.params;

    const quiz = await Quiz.findOne({ _id: id, schoolId }).lean();
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    if (role === 'student') {
      const profile = await StudentProfile.findOne({ schoolId, userId }).lean();
      if (
        !profile ||
        quiz.classSectionId.toString() !== profile.classSectionId.toString()
      ) {
        res
          .status(403)
          .json({
            success: false,
            message: 'Forbidden: Quiz is not assigned to your class',
          });
        return;
      }
      if (quiz.status !== 'published') {
        res
          .status(403)
          .json({
            success: false,
            message: 'Forbidden: This quiz is not yet published',
          });
        return;
      }

      const existingAttempt = await QuizAttempt.findOne({
        schoolId,
        quizId: id,
        studentId: userId,
      }).lean();

      const safeQuestions = (quiz.questions || []).map((q: any) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || [],
        marks: q.marks,
        difficulty: q.difficulty,
      }));

      res.json({
        success: true,
        quiz: {
          _id: quiz._id.toString(),
          schoolId: quiz.schoolId.toString(),
          title: quiz.title,
          description: quiz.description,
          subjectId: quiz.subjectId.toString(),
          subjectName: quiz.subjectName,
          classSectionId: quiz.classSectionId.toString(),
          classSectionName: quiz.classSectionName,
          duration: quiz.duration,
          totalQuestions: quiz.questions?.length || 0,
          totalMarks: quiz.totalMarks,
          passingMarks: quiz.passingMarks,
          dueDate: quiz.dueDate,
          status: quiz.status,
          allowReview: quiz.allowReview,
          questions: safeQuestions,
          myAttempt: existingAttempt
            ? {
                attemptId: existingAttempt._id.toString(),
                status: existingAttempt.status,
                startedAt: existingAttempt.startedAt,
                submittedAt: existingAttempt.submittedAt,
                totalMarksObtained: existingAttempt.totalMarksObtained,
                percentage: existingAttempt.percentage,
                isPassed: existingAttempt.isPassed,
                answers: existingAttempt.answers,
              }
            : null,
        },
      });
      return;
    }

    if (role === 'teacher') {
      if (!hasPermission('teacher', req.user!.permissions, 'quizzes.view')) {
        res
          .status(403)
          .json({
            success: false,
            message: 'Forbidden: Missing quizzes.view permission',
          });
        return;
      }
      if (quiz.teacherId.toString() !== userId.toString()) {
        const assigned = await isTeacherAssigned(
          schoolId,
          userId,
          quiz.classSectionId,
          quiz.subjectId
        );
        if (!assigned) {
          res.status(403).json({
            success: false,
            message:
              'Forbidden: You are not assigned to this class and subject',
          });
          return;
        }
      }
    }

    res.json({ success: true, quiz });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to fetch quiz',
      });
  }
}

export async function createQuiz(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;

    if (role !== 'admin') {
      if (!hasPermission('teacher', req.user!.permissions, 'quizzes.create')) {
        res
          .status(403)
          .json({
            success: false,
            message: 'Forbidden: Missing quizzes.create permission',
          });
        return;
      }
    }

    const parsed = QuizCreateSchema.parse(req.body);

    const classSection = await ClassSection.findOne({
      _id: parsed.classSectionId,
      schoolId,
    }).lean();
    if (!classSection) {
      res
        .status(400)
        .json({ success: false, message: 'Invalid class and section' });
      return;
    }

    const subject = await Subject.findOne({
      _id: parsed.subjectId,
      schoolId,
    }).lean();
    if (!subject) {
      res
        .status(400)
        .json({ success: false, message: 'Invalid subject selected' });
      return;
    }

    if (role === 'teacher') {
      const assigned = await isTeacherAssigned(
        schoolId,
        userId,
        classSection._id,
        subject._id
      );
      if (!assigned) {
        res.status(403).json({
          success: false,
          message:
            'Forbidden: You can only create quizzes for your assigned classes and subjects',
        });
        return;
      }
    }

    if (parsed.status === 'published') {
      if (
        role !== 'admin' &&
        !hasPermission('teacher', req.user!.permissions, 'quizzes.publish')
      ) {
        res
          .status(403)
          .json({
            success: false,
            message: 'Forbidden: Missing quizzes.publish permission',
          });
        return;
      }
      if (parsed.questions.length < 10) {
        res.status(400).json({
          success: false,
          message: 'A quiz cannot be published with fewer than 10 questions.',
        });
        return;
      }
    }

    const questionTexts = parsed.questions.map((q) =>
      q.questionText.trim().toLowerCase()
    );
    if (new Set(questionTexts).size !== questionTexts.length) {
      res.status(400).json({
        success: false,
        message:
          'Every question must be unique. Duplicate questions are not allowed.',
      });
      return;
    }

    const calculatedTotalMarks =
      parsed.totalMarks ||
      parsed.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const calculatedPassingMarks =
      parsed.passingMarks || Math.ceil(calculatedTotalMarks * 0.4);

    const quiz = await Quiz.create({
      schoolId,
      title: parsed.title,
      description: parsed.description,
      subjectId: subject._id,
      subjectName: subject.name,
      classSectionId: classSection._id,
      classSectionName: `${classSection.name}-${classSection.section}`,
      teacherId: userId,
      duration: parsed.duration,
      totalMarks: calculatedTotalMarks,
      passingMarks: calculatedPassingMarks,
      dueDate: parsed.dueDate,
      status: parsed.status,
      allowReview: parsed.allowReview,
      questions: parsed.questions,
      attemptCount: 0,
    });

    res
      .status(201)
      .json({ success: true, message: 'Quiz created successfully', quiz });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: error.errors?.[0]?.message || 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to create quiz',
      });
  }
}

export async function updateQuiz(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { id } = req.params;

    const quiz = await Quiz.findOne({ _id: id, schoolId });
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    if (role !== 'admin') {
      if (!hasPermission('teacher', req.user!.permissions, 'quizzes.update')) {
        res
          .status(403)
          .json({
            success: false,
            message: 'Forbidden: Missing quizzes.update permission',
          });
        return;
      }
      if (quiz.teacherId.toString() !== userId.toString()) {
        const assigned = await isTeacherAssigned(
          schoolId,
          userId,
          quiz.classSectionId,
          quiz.subjectId
        );
        if (!assigned) {
          res
            .status(403)
            .json({
              success: false,
              message: 'Forbidden: Not assigned to this quiz',
            });
          return;
        }
      }
    }

    const parsed = QuizUpdateSchema.parse(req.body);

    if (parsed.status === 'published' && quiz.status !== 'published') {
      if (
        role !== 'admin' &&
        !hasPermission('teacher', req.user!.permissions, 'quizzes.publish')
      ) {
        res
          .status(403)
          .json({
            success: false,
            message: 'Forbidden: Missing quizzes.publish permission',
          });
        return;
      }
      const questionsToCheck = parsed.questions || quiz.questions;
      if (questionsToCheck.length < 10) {
        res.status(400).json({
          success: false,
          message: 'A quiz cannot be published with fewer than 10 questions.',
        });
        return;
      }
    }

    if (parsed.questions) {
      const questionTexts = parsed.questions.map((q) =>
        q.questionText.trim().toLowerCase()
      );
      if (new Set(questionTexts).size !== questionTexts.length) {
        res.status(400).json({
          success: false,
          message:
            'Every question must be unique. Duplicate questions are not allowed.',
        });
        return;
      }
      quiz.questions = parsed.questions as any;
      quiz.totalMarks =
        parsed.totalMarks ||
        parsed.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      quiz.passingMarks =
        parsed.passingMarks || Math.ceil(quiz.totalMarks * 0.4);
    }

    if (parsed.title) quiz.title = parsed.title;
    if (parsed.description !== undefined) quiz.description = parsed.description;
    if (parsed.duration) quiz.duration = parsed.duration;
    if (parsed.dueDate) quiz.dueDate = parsed.dueDate;
    if (parsed.status) quiz.status = parsed.status;
    if (parsed.allowReview !== undefined) quiz.allowReview = parsed.allowReview;

    await quiz.save();
    res.json({ success: true, message: 'Quiz updated successfully', quiz });
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
        message: error.message || 'Failed to update quiz',
      });
  }
}

export async function publishQuiz(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { id } = req.params;

    if (
      role !== 'admin' &&
      !hasPermission('teacher', req.user!.permissions, 'quizzes.publish')
    ) {
      res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: Missing quizzes.publish permission',
        });
      return;
    }

    const quiz = await Quiz.findOne({ _id: id, schoolId });
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    if (role === 'teacher' && quiz.teacherId.toString() !== userId.toString()) {
      const assigned = await isTeacherAssigned(
        schoolId,
        userId,
        quiz.classSectionId,
        quiz.subjectId
      );
      if (!assigned) {
        res
          .status(403)
          .json({
            success: false,
            message: 'Forbidden: Not assigned to this quiz',
          });
        return;
      }
    }

    if (!quiz.questions || quiz.questions.length < 10) {
      res.status(400).json({
        success: false,
        message: 'A quiz cannot be published with fewer than 10 questions.',
      });
      return;
    }

    const questionTexts = quiz.questions.map((q) =>
      q.questionText.trim().toLowerCase()
    );
    if (new Set(questionTexts).size !== questionTexts.length) {
      res.status(400).json({
        success: false,
        message:
          'Every question must be unique. Duplicate questions are not allowed.',
      });
      return;
    }

    quiz.status = 'published';
    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz published successfully to students',
      quiz,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to publish quiz',
      });
  }
}

export async function deleteQuiz(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { id } = req.params;

    if (
      role !== 'admin' &&
      !hasPermission('teacher', req.user!.permissions, 'quizzes.delete')
    ) {
      res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: Missing quizzes.delete permission',
        });
      return;
    }

    const quiz = await Quiz.findOne({ _id: id, schoolId });
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    if (role === 'teacher' && quiz.teacherId.toString() !== userId.toString()) {
      res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: Only author can delete this quiz',
        });
      return;
    }

    await Quiz.deleteOne({ _id: id, schoolId });
    await QuizAttempt.deleteMany({ quizId: id, schoolId });

    res.json({
      success: true,
      message: 'Quiz and associated attempts deleted successfully',
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to delete quiz',
      });
  }
}

export async function startQuizAttempt(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;
    const userName = req.user!.name;
    const { id } = req.params;

    if (role !== 'student') {
      res
        .status(403)
        .json({
          success: false,
          message: 'Only enrolled students can attempt quizzes',
        });
      return;
    }

    const quiz = await Quiz.findOne({
      _id: id,
      schoolId,
      status: 'published',
    }).lean();
    if (!quiz) {
      res
        .status(404)
        .json({ success: false, message: 'Published quiz not found' });
      return;
    }

    const profile = await StudentProfile.findOne({ schoolId, userId }).lean();
    if (
      !profile ||
      quiz.classSectionId.toString() !== profile.classSectionId.toString()
    ) {
      res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: Quiz not assigned to your class',
        });
      return;
    }

    const safeQuestions = (quiz.questions || []).map((q: any) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options || [],
      marks: q.marks,
      difficulty: q.difficulty,
    }));

    let attempt = await QuizAttempt.findOne({
      schoolId,
      quizId: id,
      studentId: userId,
    });
    if (attempt) {
      if (
        attempt.status === 'submitted' ||
        attempt.status === 'auto_submitted'
      ) {
        res.status(409).json({
          success: false,
          message:
            'You have already submitted this quiz. Multiple attempts are not permitted.',
          attemptId: attempt._id,
        });
        return;
      }
      res.json({
        success: true,
        message: 'Resuming quiz attempt',
        quiz: {
          _id: quiz._id.toString(),
          title: quiz.title,
          description: quiz.description,
          subjectName: quiz.subjectName,
          classSectionName: quiz.classSectionName,
          duration: quiz.duration,
          totalQuestions: quiz.questions?.length || 0,
          totalMarks: quiz.totalMarks,
          passingMarks: quiz.passingMarks,
          dueDate: quiz.dueDate,
          questions: safeQuestions,
        },
        attempt: {
          attemptId: attempt._id,
          startedAt: attempt.startedAt,
          duration: quiz.duration,
          answers: attempt.answers,
        },
      });
      return;
    }

    attempt = await QuizAttempt.create({
      schoolId,
      quizId: quiz._id,
      studentId: userId,
      studentName: userName,
      rollNumber: profile.rollNumber || 'N/A',
      classSectionId: profile.classSectionId,
      startedAt: new Date(),
      status: 'in_progress',
      answers: [],
      totalQuestions: quiz.questions?.length || 0,
      maxMarks: quiz.totalMarks,
    });

    res.status(201).json({
      success: true,
      message: 'Quiz attempt started',
      quiz: {
        _id: quiz._id.toString(),
        title: quiz.title,
        description: quiz.description,
        subjectName: quiz.subjectName,
        classSectionName: quiz.classSectionName,
        duration: quiz.duration,
        totalQuestions: quiz.questions?.length || 0,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        dueDate: quiz.dueDate,
        questions: safeQuestions,
      },
      attempt: {
        attemptId: attempt._id,
        startedAt: attempt.startedAt,
        duration: quiz.duration,
        answers: [],
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to start quiz attempt',
      });
  }
}

export async function saveQuizAnswers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userId = req.user!.userId;
    const { id } = req.params;

    const parsed = QuizSaveAnswersSchema.parse(req.body);

    const attempt = await QuizAttempt.findOne({
      schoolId,
      quizId: id,
      studentId: userId,
      status: 'in_progress',
    });

    if (!attempt) {
      res
        .status(404)
        .json({ success: false, message: 'No active quiz attempt found' });
      return;
    }

    attempt.answers = parsed.answers as any;
    await attempt.save();

    res.json({ success: true, message: 'Answers saved' });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to save answers',
      });
  }
}

export async function submitQuiz(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userId = req.user!.userId;
    const { id } = req.params;

    const parsed = QuizSubmitSchema.parse(req.body);

    const quiz = await Quiz.findOne({ _id: id, schoolId }).lean();
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    const attempt = await QuizAttempt.findOne({
      schoolId,
      quizId: id,
      studentId: userId,
    });

    if (!attempt) {
      res
        .status(404)
        .json({
          success: false,
          message: 'Attempt not found. Start quiz first.',
        });
      return;
    }

    if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
      res
        .status(409)
        .json({ success: false, message: 'Quiz has already been submitted' });
      return;
    }

    const submittedAnswersMap = new Map<string, string>();
    const flaggedSet = new Set<string>();

    for (const ans of parsed.answers) {
      submittedAnswersMap.set(ans.questionId, (ans.studentAnswer || '').trim());
      if (ans.isFlaggedForReview) flaggedSet.add(ans.questionId);
    }

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let totalMarksObtained = 0;

    const evaluatedAnswers: any[] = [];
    const reviewItems: any[] = [];

    for (const q of quiz.questions) {
      const studentAns = submittedAnswersMap.get(q.id) || '';
      const isAttempted = studentAns.length > 0;
      let isCorrect = false;
      let marksAwarded = 0;

      if (!isAttempted) {
        skippedCount++;
      } else {
        const normalizedStudent = studentAns.trim().toLowerCase();
        const normalizedCorrect = q.correctAnswer.trim().toLowerCase();

        if (q.questionType === 'mcq' || q.questionType === 'true_false') {
          isCorrect = normalizedStudent === normalizedCorrect;
        } else if (q.questionType === 'fill_in_the_blank') {
          isCorrect = normalizedStudent === normalizedCorrect;
        } else {
          isCorrect =
            normalizedStudent === normalizedCorrect ||
            normalizedStudent.includes(normalizedCorrect) ||
            normalizedCorrect.includes(normalizedStudent);
        }

        if (isCorrect) {
          correctCount++;
          marksAwarded = q.marks || 1;
          totalMarksObtained += marksAwarded;
        } else {
          wrongCount++;
        }
      }

      evaluatedAnswers.push({
        questionId: q.id,
        studentAnswer: studentAns,
        isCorrect,
        marksAwarded,
        isFlaggedForReview: flaggedSet.has(q.id),
      });

      if (quiz.allowReview) {
        reviewItems.push({
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          studentAnswer: studentAns,
          correctAnswer: q.correctAnswer,
          isCorrect,
          marksAwarded,
          maxMarks: q.marks,
          explanation: q.explanation,
        });
      }
    }

    const totalQuestions = quiz.questions.length;
    const attemptedCount = totalQuestions - skippedCount;
    const maxMarks = quiz.totalMarks || totalQuestions;
    const percentage = Math.round((totalMarksObtained / maxMarks) * 100);
    const isPassed =
      totalMarksObtained >= (quiz.passingMarks || Math.ceil(maxMarks * 0.4));

    attempt.submittedAt = new Date();
    attempt.status = 'submitted';
    attempt.durationTakenSeconds = parsed.durationTakenSeconds || 0;
    attempt.answers = evaluatedAnswers;
    attempt.totalQuestions = totalQuestions;
    attempt.attemptedQuestions = attemptedCount;
    attempt.correctAnswers = correctCount;
    attempt.wrongAnswers = wrongCount;
    attempt.skippedQuestions = skippedCount;
    attempt.totalMarksObtained = totalMarksObtained;
    attempt.maxMarks = maxMarks;
    attempt.percentage = percentage;
    attempt.isPassed = isPassed;

    await attempt.save();

    await Quiz.updateOne({ _id: id }, { $inc: { attemptCount: 1 } });

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      result: {
        attemptId: attempt._id.toString(),
        quizId: quiz._id.toString(),
        quizTitle: quiz.title,
        subjectName: quiz.subjectName,
        studentId: userId.toString(),
        studentName: attempt.studentName,
        rollNumber: attempt.rollNumber,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt.toISOString(),
        durationTakenSeconds: attempt.durationTakenSeconds,
        status: attempt.status,
        totalQuestions,
        attemptedQuestions: attemptedCount,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        skippedQuestions: skippedCount,
        totalMarksObtained,
        maxMarks,
        percentage,
        isPassed,
        allowReview: quiz.allowReview,
        reviewItems: quiz.allowReview ? reviewItems : undefined,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to submit quiz',
      });
  }
}

export async function getStudentQuizResult(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { id } = req.params;

    let targetStudentUserId: any = userId;

    if (role === 'parent') {
      const childId = req.query.studentId as string;
      if (!childId) {
        res
          .status(400)
          .json({
            success: false,
            message: 'studentId query param required for parent',
          });
        return;
      }
      const parentProfile = await ParentProfile.findOne({
        schoolId,
        userId,
      }).lean();
      const isLinked = parentProfile?.linkedStudentUserIds?.some(
        (cid) => cid.toString() === childId
      );
      if (!isLinked) {
        res
          .status(403)
          .json({ success: false, message: 'Forbidden: Child not linked' });
        return;
      }
      targetStudentUserId = childId;
    } else if (role === 'teacher' || role === 'admin') {
      const studentIdQuery = req.query.studentId as string;
      if (studentIdQuery) {
        targetStudentUserId = studentIdQuery;
      }
    }

    const quiz = await Quiz.findOne({ _id: id, schoolId }).lean();
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    const attempt = await QuizAttempt.findOne({
      schoolId,
      quizId: id,
      studentId: targetStudentUserId,
      status: { $in: ['submitted', 'auto_submitted'] },
    }).lean();

    if (!attempt) {
      res
        .status(404)
        .json({
          success: false,
          message: 'No completed quiz attempt found for this student',
        });
      return;
    }

    const reviewItems: any[] = [];
    if (quiz.allowReview || role === 'admin' || role === 'teacher') {
      const answerMap = new Map(
        attempt.answers.map((a: any) => [a.questionId, a])
      );
      for (const q of quiz.questions) {
        const a = answerMap.get(q.id);
        reviewItems.push({
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          studentAnswer: a?.studentAnswer || '',
          correctAnswer: q.correctAnswer,
          isCorrect: a?.isCorrect || false,
          marksAwarded: a?.marksAwarded || 0,
          maxMarks: q.marks,
          explanation: q.explanation,
        });
      }
    }

    res.json({
      success: true,
      result: {
        attemptId: attempt._id.toString(),
        quizId: quiz._id.toString(),
        quizTitle: quiz.title,
        subjectName: quiz.subjectName,
        studentId: attempt.studentId.toString(),
        studentName: attempt.studentName,
        rollNumber: attempt.rollNumber,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt
          ? attempt.submittedAt.toISOString()
          : undefined,
        durationTakenSeconds: attempt.durationTakenSeconds,
        status: attempt.status,
        totalQuestions: attempt.totalQuestions,
        attemptedQuestions: attempt.attemptedQuestions,
        correctAnswers: attempt.correctAnswers,
        wrongAnswers: attempt.wrongAnswers,
        skippedQuestions: attempt.skippedQuestions,
        totalMarksObtained: attempt.totalMarksObtained,
        maxMarks: attempt.maxMarks,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        allowReview: quiz.allowReview,
        reviewItems:
          quiz.allowReview || role !== 'student' ? reviewItems : undefined,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to fetch result',
      });
  }
}

export async function getTeacherQuizReports(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { id } = req.params;

    if (role === 'student' || role === 'parent') {
      res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: Insufficient permissions',
        });
      return;
    }

    const quiz = await Quiz.findOne({ _id: id, schoolId }).lean();
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    if (role === 'teacher') {
      if (!hasPermission('teacher', req.user!.permissions, 'quizzes.view')) {
        res
          .status(403)
          .json({
            success: false,
            message: 'Forbidden: Missing quizzes.view permission',
          });
        return;
      }
      if (quiz.teacherId.toString() !== userId.toString()) {
        const assigned = await isTeacherAssigned(
          schoolId,
          userId,
          quiz.classSectionId,
          quiz.subjectId
        );
        if (!assigned) {
          res
            .status(403)
            .json({
              success: false,
              message: 'Forbidden: Not assigned to this quiz',
            });
          return;
        }
      }
    }

    const attempts = await QuizAttempt.find({ schoolId, quizId: id })
      .sort({ submittedAt: -1, percentage: -1 })
      .lean();

    const passedCount = attempts.filter((a) => a.isPassed).length;
    const totalAttempts = attempts.length;
    const averageScore =
      totalAttempts > 0
        ? Math.round(
            attempts.reduce((sum, a) => sum + a.totalMarksObtained, 0) /
              totalAttempts
          )
        : 0;

    res.json({
      success: true,
      quiz: {
        _id: quiz._id.toString(),
        title: quiz.title,
        subjectName: quiz.subjectName,
        classSectionName: quiz.classSectionName,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        totalQuestions: quiz.questions?.length || 0,
      },
      summary: {
        totalAttempts,
        passedCount,
        failedCount: totalAttempts - passedCount,
        passRate:
          totalAttempts > 0
            ? Math.round((passedCount / totalAttempts) * 100)
            : 0,
        averageScore,
      },
      attempts: attempts.map((a: any) => ({
        attemptId: a._id.toString(),
        studentId: a.studentId.toString(),
        studentName: a.studentName,
        rollNumber: a.rollNumber,
        status: a.status,
        startedAt: a.startedAt.toISOString(),
        submittedAt: a.submittedAt ? a.submittedAt.toISOString() : undefined,
        durationTakenSeconds: a.durationTakenSeconds,
        totalMarksObtained: a.totalMarksObtained,
        maxMarks: a.maxMarks,
        percentage: a.percentage,
        isPassed: a.isPassed,
      })),
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to fetch quiz reports',
      });
  }
}

export async function getParentChildQuizzes(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;
    const { studentId } = req.query;

    if (role !== 'parent') {
      res
        .status(403)
        .json({ success: false, message: 'Forbidden: Parent access only' });
      return;
    }

    if (!studentId || typeof studentId !== 'string') {
      res
        .status(400)
        .json({ success: false, message: 'studentId is required' });
      return;
    }

    const parentProfile = await ParentProfile.findOne({
      schoolId,
      userId,
    }).lean();

    const isLinked = parentProfile?.linkedStudentUserIds?.some(
      (id) => id.toString() === studentId
    );

    if (!isLinked) {
      res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: Student is not linked to this parent',
        });
      return;
    }

    const attempts = await QuizAttempt.find({
      schoolId,
      studentId: new mongoose.Types.ObjectId(studentId),
      status: { $in: ['submitted', 'auto_submitted'] },
    })
      .sort({ submittedAt: -1 })
      .lean();

    const quizIds = attempts.map((a) => a.quizId);
    const quizzes = await Quiz.find({ _id: { $in: quizIds }, schoolId }).lean();
    const quizMap = new Map(quizzes.map((q: any) => [q._id.toString(), q]));

    const history = attempts.map((att: any) => {
      const q = quizMap.get(att.quizId.toString());
      return {
        attemptId: att._id.toString(),
        quizId: att.quizId.toString(),
        quizTitle: q?.title || 'Subject Quiz',
        subjectName: q?.subjectName || 'General',
        submittedAt: att.submittedAt
          ? att.submittedAt.toISOString()
          : att.createdAt.toISOString(),
        totalQuestions: att.totalQuestions,
        correctAnswers: att.correctAnswers,
        wrongAnswers: att.wrongAnswers,
        totalMarksObtained: att.totalMarksObtained,
        maxMarks: att.maxMarks,
        percentage: att.percentage,
        isPassed: att.isPassed,
      };
    });

    const totalQuizzes = history.length;
    const passedCount = history.filter((h) => h.isPassed).length;
    const averagePercentage =
      totalQuizzes > 0
        ? Math.round(
            history.reduce((sum, h) => sum + h.percentage, 0) / totalQuizzes
          )
        : 0;

    res.json({
      success: true,
      summary: {
        totalQuizzes,
        passedCount,
        averagePercentage,
      },
      history,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to fetch child quizzes',
      });
  }
}

export async function generateAiQuiz(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const role = req.user!.role;

    if (role !== 'admin') {
      if (!hasPermission('teacher', req.user!.permissions, 'quizzes.create')) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Missing quizzes.create permission',
        });
        return;
      }
    }

    const parsed = QuizAiGenerateSchema.parse(req.body);

    const result = await generateAiQuizQuestions({
      subjectName: parsed.subjectName,
      topic: parsed.topic,
      classLevel: parsed.classLevel,
      numQuestions: parsed.numQuestions,
      difficulty: parsed.difficulty,
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate quiz with AI',
    });
  }
}
