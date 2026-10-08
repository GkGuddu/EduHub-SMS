import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { School } from '../models';
import { OtpRequest } from '../models';
import { PasswordResetToken } from '../models';
import { createAuditLog } from '../services/notificationService';
import { sendPasswordResetOtpEmail } from '../services/emailService';
import { setCsrfCookie } from '../middleware';
import { getJwtSecret, getAuthCookieOptions } from '../config';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res
        .status(401)
        .json({
          success: false,
          message: 'Account not found with this email address.',
        });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message:
          'Account is not verified or has been deactivated. Please contact your school administrator.',
      });
      return;
    }

    if (role && user.role !== role) {
      res.status(401).json({
        success: false,
        message: `Incorrect role selected. This account is registered as ${user.role.toUpperCase()}.`,
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res
        .status(401)
        .json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const school = user.schoolId ? await School.findById(user.schoolId) : null;

    const tokenPayload = {
      userId: user._id.toString(),
      schoolId: user.schoolId ? user.schoolId.toString() : '',
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions || [],
    };

    const secret = getJwtSecret();
    const token = jwt.sign(tokenPayload, secret, { expiresIn: '7d' });

    res.cookie('token', token, getAuthCookieOptions());

    setCsrfCookie(res);

    await createAuditLog({
      schoolId: user.schoolId ? user.schoolId.toString() : '',
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'auth',
      details: `${user.name} (${user.role}) logged in successfully.`,
      req,
    });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        permissions: user.permissions || [],
        schoolId: user.schoolId,
        schoolName: school?.name || 'Adiya School of Excellence',
        mustChangePassword: !!user.mustChangePassword,
      },
      school,
    });
  } catch (error) {
    console.error('Login error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Server error during authentication' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User session invalid' });
      return;
    }

    const school = user.schoolId ? await School.findById(user.schoolId) : null;

    if (!req.cookies?.['XSRF-TOKEN'] && !req.signedCookies?.['XSRF-TOKEN']) {
      setCsrfCookie(res);
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        permissions: user.permissions || [],
        schoolId: user.schoolId,
        schoolName: school?.name || 'Adiya School of Excellence',
        mustChangePassword: !!user.mustChangePassword,
      },
      school,
    });
  } catch (error) {
    console.error('getMe error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to retrieve session profile' });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  const cookieOpts = getAuthCookieOptions(0);
  res.clearCookie('token', {
    httpOnly: cookieOpts.httpOnly,
    sameSite: cookieOpts.sameSite,
    secure: cookieOpts.secure,
    path: cookieOpts.path,
  });
  res.clearCookie('XSRF-TOKEN', {
    sameSite: cookieOpts.sameSite,
    secure: cookieOpts.secure,
    path: cookieOpts.path,
  });
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function registerSchool(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      schoolName,
      schoolCode,
      address,
      phone,
      schoolEmail,
      adminName,
      password,
      academicYear = '2025-2026',
    } = req.body;

    const normalizedEmail = schoolEmail.toLowerCase().trim();
    const normalizedCode = schoolCode.toUpperCase().trim();

    const existingSchool = await School.findOne({ code: normalizedCode });
    if (existingSchool) {
      res.status(400).json({
        success: false,
        message: 'School code is already taken. Please choose another code.',
      });
      return;
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'An account with this administrator email already exists.',
      });
      return;
    }

    const existingRequest = await OtpRequest.findOne({
      email: normalizedEmail,
      purpose: 'school_registration',
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (existingRequest && existingRequest.resendCooldownUntil > new Date()) {
      const remainingSec = Math.ceil(
        (existingRequest.resendCooldownUntil.getTime() - Date.now()) / 1000
      );
      res.status(429).json({
        success: false,
        message: `Please wait ${remainingSec} seconds before requesting a new verification code.`,
      });
      return;
    }

    const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(plainOtp, 10);
    const adminPasswordHash = await bcrypt.hash(password, 10);

    await OtpRequest.updateMany(
      { email: normalizedEmail, purpose: 'school_registration', isUsed: false },
      { isUsed: true }
    );

    await OtpRequest.create({
      email: normalizedEmail,
      phone,
      otpHash,
      purpose: 'school_registration',
      metadata: {
        schoolName: schoolName.trim(),
        schoolCode: normalizedCode,
        address: address.trim(),
        phone: phone.trim(),
        schoolEmail: normalizedEmail,
        adminName: adminName.trim(),
        adminPasswordHash,
        academicYear,
      },
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      resendCooldownUntil: new Date(Date.now() + 60 * 1000),
      isUsed: false,
    });

    console.log(
      `[OTP] Generated registration code for ${normalizedEmail}: ${plainOtp}`
    );

    res.status(201).json({
      success: true,
      message:
        'Registration initiated! A 6-digit confirmation code has been dispatched to your email.',
      email: normalizedEmail,
      ...(process.env.NODE_ENV !== 'production' ? { demoOtp: plainOtp } : {}),
    });
  } catch (error: any) {
    console.error('Register school error:', error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'Failed to register school',
      });
  }
}

export async function resendOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email, purpose = 'school_registration' } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const activeRequest = await OtpRequest.findOne({
      email: normalizedEmail,
      purpose,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!activeRequest || activeRequest.expiresAt < new Date()) {
      res.status(400).json({
        success: false,
        message:
          'No active registration session found. Please register your school again.',
      });
      return;
    }

    if (activeRequest.resendCooldownUntil > new Date()) {
      const remainingSec = Math.ceil(
        (activeRequest.resendCooldownUntil.getTime() - Date.now()) / 1000
      );
      res.status(429).json({
        success: false,
        message: `Please wait ${remainingSec} seconds before requesting a new OTP.`,
      });
      return;
    }

    const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(plainOtp, 10);

    activeRequest.otpHash = otpHash;
    activeRequest.attempts = 0;
    activeRequest.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    activeRequest.resendCooldownUntil = new Date(Date.now() + 60 * 1000);
    await activeRequest.save();

    console.log(
      `[OTP] Resent registration code for ${normalizedEmail}: ${plainOtp}`
    );

    res.json({
      success: true,
      message: 'A fresh 6-digit confirmation code has been sent to your email.',
      email: normalizedEmail,
      ...(process.env.NODE_ENV !== 'production' ? { demoOtp: plainOtp } : {}),
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to resend verification code' });
  }
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email?.toLowerCase()?.trim();

    if (!otp || otp.length !== 6) {
      res
        .status(400)
        .json({
          success: false,
          message: 'Invalid OTP. Must be a 6-digit code.',
        });
      return;
    }

    const otpRequest = await OtpRequest.findOne({
      email: normalizedEmail,
      purpose: 'school_registration',
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!otpRequest) {
      res.status(400).json({
        success: false,
        message:
          'No pending registration found for this email, or code was already used.',
      });
      return;
    }

    if (otpRequest.expiresAt < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new OTP.',
      });
      return;
    }

    if (otpRequest.attempts >= otpRequest.maxAttempts) {
      res.status(400).json({
        success: false,
        message:
          'Maximum verification attempts exceeded. Please restart registration.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(otp, otpRequest.otpHash);
    if (!isMatch) {
      otpRequest.attempts += 1;
      await otpRequest.save();

      const remainingAttempts = otpRequest.maxAttempts - otpRequest.attempts;
      res.status(400).json({
        success: false,
        message:
          remainingAttempts > 0
            ? `Incorrect verification code. ${remainingAttempts} attempts remaining.`
            : 'Maximum attempts exceeded. Please restart registration.',
      });
      return;
    }

    otpRequest.isUsed = true;
    await otpRequest.save();

    const meta = otpRequest.metadata || {};

    const school = await School.create({
      name: meta.schoolName,
      code: meta.schoolCode,
      address: meta.address,
      phone: meta.phone,
      email: meta.schoolEmail,
      academicYear: meta.academicYear || '2025-2026',
      status: 'active',
    });

    const adminUser = await User.create({
      schoolId: school._id,
      email: meta.schoolEmail,
      passwordHash: meta.adminPasswordHash,
      name: meta.adminName,
      role: 'admin',
      isActive: true,
      permissions: [
        'attendance:mark',
        'attendance:edit',
        'attendance:view',
        'marks:enter',
        'marks:edit',
        'marks:publish',
        'marks:view',
        'students:view',
        'students:manage',
        'teachers:view',
        'teachers:manage',
        'fees:view',
        'fees:collect',
        'fees:manage',
        'notices:create',
        'notices:delete',
        'roles:manage',
        'audit:view',
      ],
    });

    await createAuditLog({
      schoolId: school._id.toString(),
      userId: adminUser._id.toString(),
      userName: adminUser.name,
      userRole: adminUser.role,
      action: 'SCHOOL_ACTIVATE',
      entityType: 'auth',
      entityId: school._id.toString(),
      details: `School "${school.name}" (${school.code}) activated. First Admin "${adminUser.name}" created.`,
      req,
    });

    const tokenPayload = {
      userId: adminUser._id.toString(),
      schoolId: school._id.toString(),
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      permissions: adminUser.permissions || [],
    };

    const secret = getJwtSecret();
    const token = jwt.sign(tokenPayload, secret, { expiresIn: '7d' });

    res.cookie('token', token, getAuthCookieOptions());

    setCsrfCookie(res);

    res.json({
      success: true,
      message: 'School activated successfully! Welcome to EduHub.',
      token,
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.permissions || [],
        schoolId: school._id,
        schoolName: school.name,
      },
      school,
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || 'OTP verification failed',
      });
  }
}

export async function forgotPassword(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.json({
        success: true,
        message:
          'If an account exists with this email address, a password reset code has been sent.',
        email: normalizedEmail,
      });
      return;
    }

    await PasswordResetToken.updateMany(
      { email: normalizedEmail, isUsed: false },
      { isUsed: true }
    );

    const plainOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const tokenHash = await bcrypt.hash(plainOtp, 10);

    await PasswordResetToken.create({
      userId: user._id,
      email: normalizedEmail,
      tokenHash,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      resendCooldownUntil: new Date(Date.now() + 60 * 1000),
      isUsed: false,
    });

    const school = user.schoolId ? await School.findById(user.schoolId) : null;

    await sendPasswordResetOtpEmail({
      email: normalizedEmail,
      otp: plainOtp,
      recipientName: user.name,
      schoolName: school?.name,
    });

    res.json({
      success: true,
      message:
        'If an account exists with this email address, a password reset code has been sent.',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request',
    });
  }
}

export async function verifyResetOtp(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and 4-digit OTP are required.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const resetRecord = await PasswordResetToken.findOne({
      email: normalizedEmail,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Verification code is invalid or has expired. Please request a new code.',
      });
      return;
    }

    if (resetRecord.attempts >= resetRecord.maxAttempts) {
      resetRecord.isUsed = true;
      await resetRecord.save();
      res.status(400).json({
        success: false,
        message: 'Maximum attempts exceeded. Please request a new verification code.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(cleanOtp, resetRecord.tokenHash);
    if (!isMatch) {
      resetRecord.attempts += 1;
      const reachedMax = resetRecord.attempts >= resetRecord.maxAttempts;
      if (reachedMax) {
        resetRecord.isUsed = true;
      }
      await resetRecord.save();

      const remaining = resetRecord.maxAttempts - resetRecord.attempts;
      res.status(400).json({
        success: false,
        message:
          remaining > 0
            ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : 'Maximum attempts exceeded. Please request a new verification code.',
      });
      return;
    }

    resetRecord.isUsed = true;
    await resetRecord.save();

    const secret = getJwtSecret();
    const resetToken = jwt.sign(
      {
        userId: resetRecord.userId.toString(),
        email: normalizedEmail,
        purpose: 'password_reset',
      },
      secret,
      { expiresIn: '10m' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken,
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
    });
  }
}

export async function resendResetOtp(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.json({
        success: true,
        message:
          'If an account exists with this email address, a password reset code has been sent.',
      });
      return;
    }

    const latestToken = await PasswordResetToken.findOne({
      email: normalizedEmail,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (
      latestToken &&
      latestToken.resendCooldownUntil &&
      latestToken.resendCooldownUntil > new Date()
    ) {
      const waitSeconds = Math.ceil(
        (latestToken.resendCooldownUntil.getTime() - Date.now()) / 1000
      );
      res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
        retryAfter: waitSeconds,
      });
      return;
    }

    await PasswordResetToken.updateMany(
      { email: normalizedEmail, isUsed: false },
      { isUsed: true }
    );

    const plainOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const tokenHash = await bcrypt.hash(plainOtp, 10);

    await PasswordResetToken.create({
      userId: user._id,
      email: normalizedEmail,
      tokenHash,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      resendCooldownUntil: new Date(Date.now() + 60 * 1000),
      isUsed: false,
    });

    const school = user.schoolId ? await School.findById(user.schoolId) : null;

    await sendPasswordResetOtpEmail({
      email: normalizedEmail,
      otp: plainOtp,
      recipientName: user.name,
      schoolName: school?.name,
    });

    res.json({
      success: true,
      message:
        'If an account exists with this email address, a password reset code has been sent.',
    });
  } catch (error) {
    console.error('Resend reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP resend',
    });
  }
}

export async function resetPassword(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { resetToken, email, code, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }

    const secret = getJwtSecret();

    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, secret) as {
          userId: string;
          email: string;
          purpose: string;
        };

        if (decoded.purpose !== 'password_reset') {
          res.status(400).json({
            success: false,
            message: 'Invalid reset authorization token.',
          });
          return;
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
          res.status(404).json({
            success: false,
            message: 'User account not found.',
          });
          return;
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        user.passwordHash = newPasswordHash;
        user.mustChangePassword = false;
        user.temporaryPasswordExpiresAt = undefined;
        await user.save();

        await PasswordResetToken.updateMany(
          { email: user.email, isUsed: false },
          { isUsed: true }
        );

        await createAuditLog({
          schoolId: user.schoolId ? user.schoolId.toString() : '',
          userId: user._id.toString(),
          userName: user.name,
          userRole: user.role,
          action: 'PASSWORD_RESET',
          entityType: 'auth',
          details: `Password was reset successfully for account ${user.email} via 4-digit OTP verification.`,
          req,
        });

        res.json({
          success: true,
          message:
            'Password has been updated successfully! You can now sign in with your new password.',
        });
        return;
      } catch (_err) {
        res.status(400).json({
          success: false,
          message:
            'Reset authorization token is invalid or has expired. Please restart the password reset process.',
        });
        return;
      }
    }

    if (email && code) {
      const normalizedEmail = email.toLowerCase().trim();
      const tokenRecord = await PasswordResetToken.findOne({
        email: normalizedEmail,
        isUsed: false,
      }).sort({ createdAt: -1 });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        res.status(400).json({
          success: false,
          message: 'Password reset code is invalid or has expired.',
        });
        return;
      }

      if (tokenRecord.attempts >= tokenRecord.maxAttempts) {
        res.status(400).json({
          success: false,
          message: 'Maximum attempts exceeded. Please request a new password reset code.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(String(code).trim(), tokenRecord.tokenHash);
      if (!isMatch) {
        tokenRecord.attempts += 1;
        await tokenRecord.save();
        const remaining = tokenRecord.maxAttempts - tokenRecord.attempts;
        res.status(400).json({
          success: false,
          message:
            remaining > 0
              ? `Incorrect reset code. ${remaining} attempts remaining.`
              : 'Maximum attempts exceeded. Please request a new code.',
        });
        return;
      }

      tokenRecord.isUsed = true;
      await tokenRecord.save();

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      const user = await User.findById(tokenRecord.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User account not found.' });
        return;
      }

      user.passwordHash = newPasswordHash;
      user.mustChangePassword = false;
      user.temporaryPasswordExpiresAt = undefined;
      await user.save();

      await createAuditLog({
        schoolId: user.schoolId ? user.schoolId.toString() : '',
        userId: user._id.toString(),
        userName: user.name,
        userRole: user.role,
        action: 'PASSWORD_RESET',
        entityType: 'auth',
        details: `Password was reset successfully for account ${user.email}.`,
        req,
      });

      res.json({
        success: true,
        message:
          'Password has been updated successfully! You can now sign in with your new password.',
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: 'Reset authorization token is required to reset password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
}

export function getCsrfToken(_req: Request, res: Response): void {
  const token = setCsrfCookie(res);
  res.json({ success: true, csrfToken: token });
}

export async function changePassword(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current and new password are required',
      });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res
        .status(400)
        .json({ success: false, message: 'Incorrect current password' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newHash;
    user.mustChangePassword = false;
    user.temporaryPasswordExpiresAt = undefined;
    await user.save();

    await createAuditLog({
      schoolId: user.schoolId ? user.schoolId.toString() : '',
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_RESET',
      entityType: 'auth',
      details: `Password changed successfully for ${user.email}.`,
      req,
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to change password' });
  }
}
