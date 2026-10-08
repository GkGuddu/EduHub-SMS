import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { ZodSchema, ZodError } from 'zod';
import { User } from './models';
import { ClassSubjectAssignment } from './models';
import { UserRole, PermissionKey, hasPermission } from '@eduhub/shared';
import { getJwtSecret } from './config';

export interface AuthUserPayload {
  userId: string;
  schoolId: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.token || req.signedCookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res
        .status(401)
        .json({
          success: false,
          message: 'Authentication required. No token provided.',
        });
      return;
    }

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as AuthUserPayload;

    const user = await User.findById(decoded.userId).select(
      'isActive permissions role schoolId name email'
    );
    if (!user || !user.isActive) {
      res
        .status(401)
        .json({
          success: false,
          message: 'User account not found or is deactivated.',
        });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      schoolId: user.schoolId ? user.schoolId.toString() : '',
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions || [],
    };

    next();
  } catch (_error) {
    res
      .status(401)
      .json({ success: false, message: 'Invalid or expired session token.' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

export function requirePermission(permission: PermissionKey | string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
      return;
    }

    const authorized = hasPermission(
      req.user.role,
      req.user.permissions,
      permission
    );

    if (!authorized) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Insufficient privileges. Required permission: ${permission}`,
        requiredPermission: permission,
      });
      return;
    }

    next();
  };
}

export function requireAnyPermission(
  ...permissions: (PermissionKey | string)[]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
      return;
    }

    const authorized = permissions.some((permission) =>
      hasPermission(req.user!.role, req.user!.permissions, permission)
    );

    if (!authorized) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Insufficient privileges. Required one of: ${permissions.join(', ')}`,
        requiredPermissions: permissions,
      });
      return;
    }

    next();
  };
}

export async function isTeacherAssignedToClass(
  schoolId: string,
  teacherUserId: string,
  classSectionId: string
): Promise<boolean> {
  const assignment = await ClassSubjectAssignment.findOne({
    schoolId,
    teacherId: new mongoose.Types.ObjectId(teacherUserId),
    classSectionId: new mongoose.Types.ObjectId(classSectionId),
  });
  return !!assignment;
}

export async function isTeacherAssignedToSubject(
  schoolId: string,
  teacherUserId: string,
  subjectId: string
): Promise<boolean> {
  const assignment = await ClassSubjectAssignment.findOne({
    schoolId,
    teacherId: new mongoose.Types.ObjectId(teacherUserId),
    subjectId: new mongoose.Types.ObjectId(subjectId),
  });
  return !!assignment;
}

export async function getTeacherAssignedClassIds(
  schoolId: string,
  teacherUserId: string
): Promise<mongoose.Types.ObjectId[]> {
  const assignments = await ClassSubjectAssignment.find({
    schoolId,
    teacherId: new mongoose.Types.ObjectId(teacherUserId),
  }).select('classSectionId');
  return assignments.map((a) => a.classSectionId);
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function setCsrfCookie(res: Response): string {
  const token = generateCsrfToken();
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

const EXEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/register-school',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/forgot-password',
  '/api/auth/verify-reset-otp',
  '/api/auth/resend-reset-otp',
  '/api/auth/reset-password',
  '/api/auth/csrf-token',
  '/api/health',
  '/auth/login',
  '/auth/register-school',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/forgot-password',
  '/auth/verify-reset-otp',
  '/auth/resend-reset-otp',
  '/auth/reset-password',
  '/auth/csrf-token',
  '/health',
];

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.cookies?.['XSRF-TOKEN'] && !req.signedCookies?.['XSRF-TOKEN']) {
    setCsrfCookie(res);
  }

  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const isExempt = EXEMPT_PATHS.some(
    (exemptPath) =>
      req.originalUrl.startsWith(exemptPath) || req.path.startsWith(exemptPath)
  );
  if (isExempt) {
    return next();
  }

  if (!req.cookies?.token && !req.signedCookies?.token) {
    return next();
  }

  const headerToken =
    req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  const cookieToken =
    req.cookies?.['XSRF-TOKEN'] || req.signedCookies?.['XSRF-TOKEN'];

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token. Please refresh your session.',
    });
    return;
  }

  next();
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many OTP requests from this IP. Please wait before trying again.',
  },
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many password reset requests from this IP. Please try again after 15 minutes.',
  },
});

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req[part] = schema.parse(req[part]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

export interface AppError extends Error {
  statusCode?: number;
  errors?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] [${statusCode}] ${message}`, err.stack || err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
