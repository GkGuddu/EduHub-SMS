export interface ISendPasswordResetOtpOptions {
  email: string;
  otp: string;
  recipientName?: string;
  schoolName?: string;
}

export interface ISentResetOtpRecord {
  email: string;
  otp: string;
  sentAt: Date;
  expiresAt: Date;
}

const sentOtpEmailHistory: ISentResetOtpRecord[] = [];

function buildPasswordResetEmailHtml(params: {
  otp: string;
  recipientName?: string;
  schoolName?: string;
}): string {
  const school = params.schoolName || 'Adiya School of Excellence';
  const name = params.recipientName ? `Dear ${params.recipientName},` : 'Hello,';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EduHub Password Reset OTP</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px 24px; }
    .otp-card { background: #fff7ed; border: 2px dashed #fdba74; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-digits { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #c2410c; margin: 0; }
    .otp-expiry { font-size: 12px; font-weight: 600; color: #ea580c; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 12px 16px; margin: 20px 0; font-size: 12px; color: #991b1b; line-height: 1.5; }
    .footer { border-top: 1px solid #f1f5f9; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EduHub SMS</h1>
      <p>${school}</p>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">${name}</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        We received a request to reset the password for your EduHub account. Use the 4-digit verification code below to authorize your password update:
      </p>

      <div class="otp-card">
        <div class="otp-digits">${params.otp}</div>
        <div class="otp-expiry">Valid for 5 minutes only</div>
      </div>

      <div class="warning-box">
        <strong>Security Notice:</strong> Never share this code with anyone. EduHub staff and school administrators will never ask for your OTP. If you did not request this password reset, please ignore this email or contact your school administrator.
      </div>

      <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
        After verifying this code, you will be prompted to set a new password.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} EduHub School Management System • ${school}
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendPasswordResetOtpEmail(
  options: ISendPasswordResetOtpOptions
): Promise<{ success: boolean; messageId: string; provider: 'resend' | 'dev_mock' }> {
  const { email, otp, recipientName, schoolName } = options;
  const normalizedEmail = email.toLowerCase().trim();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  sentOtpEmailHistory.push({
    email: normalizedEmail,
    otp,
    sentAt: now,
    expiresAt,
  });

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'EduHub SMS <onboarding@resend.dev>';
  const subject = 'EduHub Password Reset OTP';
  let messageId = `mock-otp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let provider: 'resend' | 'dev_mock' = 'dev_mock';

  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      const htmlContent = buildPasswordResetEmailHtml({
        otp,
        recipientName,
        schoolName,
      });

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [normalizedEmail],
          subject,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { id?: string };
        messageId = data.id || messageId;
        provider = 'resend';
      } else {
        const errorText = await res.text();
        console.warn(
          `[EmailService] Resend API responded with status ${res.status}: ${errorText}. Falling back to dev mock logger.`
        );
      }
    } catch (err: any) {
      console.warn(
        `[EmailService] Resend dispatch attempt encountered network error: ${err.message}. Falling back to dev mock logger.`
      );
    }
  }

  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.VITE_DEMO_MODE === 'true' ||
    provider === 'dev_mock'
  ) {
    console.log('\n==============================================================');
    console.log('   [EduHub Mail Adapter] Password Reset OTP Notice');
    console.log('==============================================================');
    console.log(` To:        ${normalizedEmail} ${recipientName ? `(${recipientName})` : ''}`);
    console.log(` OTP:       ${otp} (Valid for 5 minutes)`);
    console.log(` Subject:   ${subject}`);
    console.log(` Provider:  ${provider.toUpperCase()}`);
    console.log(` Expires:   ${expiresAt.toLocaleTimeString()}`);
    console.log(' Security:  Do not share this code. Valid for single use.');
    console.log('==============================================================\n');
  }

  return {
    success: true,
    messageId,
    provider,
  };
}

export function getLastSentResetOtp(email: string): string | null {
  const normalized = email.toLowerCase().trim();
  const records = sentOtpEmailHistory
    .filter((r) => r.email === normalized)
    .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  return records.length > 0 ? records[0].otp : null;
}

export function clearSentOtpHistory(): void {
  sentOtpEmailHistory.length = 0;
}
