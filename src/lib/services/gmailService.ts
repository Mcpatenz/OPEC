import { getAccessToken, getCurrentGoogleUser } from './googleAuth';

export interface GmailOutboxEntry {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  type: 'OTP_VERIFICATION' | 'NOTIFICATION' | 'CUSTOM';
  status: 'SENT' | 'FAILED' | 'PENDING';
  messageId?: string;
  error?: string;
  meta?: Record<string, any>;
}

export interface ActiveOtpRecord {
  email: string;
  code: string;
  purpose: string;
  createdAt: number;
  expiresAt: number; // 10 minutes default
  verified: boolean;
}

const OUTBOX_STORAGE_KEY = 'oagims_gmail_outbox';
const VERIFIED_EMAILS_STORAGE_KEY = 'oagims_verified_emails';
const DEFAULT_OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// In-memory active OTP store
const activeOtps: Map<string, ActiveOtpRecord> = new Map();

/**
 * Base64URL encoder that safely handles UTF-8 characters
 */
function toBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Encodes subject header in UTF-8 Base64 according to RFC 2047
 */
function encodeRfc2047(text: string): string {
  const utf8Bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

/**
 * Builds standard RFC 2822 MIME message
 */
function buildMimeMessage({
  to,
  from,
  subject,
  html,
  text,
}: {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}): string {
  const boundary = `====boundary_${Date.now()}_${Math.random().toString(36).substring(2, 8)}====`;
  const plainText = text || html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const lines = [
    `To: ${to}`,
    from ? `From: ${from}` : '',
    `Subject: ${encodeRfc2047(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    plainText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
    `--${boundary}--`,
  ].filter(line => line !== '');

  return lines.join('\r\n');
}

/**
 * Persists sent email in outbox log
 */
function recordOutbox(entry: GmailOutboxEntry) {
  try {
    const existing: GmailOutboxEntry[] = JSON.parse(localStorage.getItem(OUTBOX_STORAGE_KEY) || '[]');
    const updated = [entry, ...existing].slice(0, 100);
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save to outbox:', e);
  }
}

export function getGmailOutbox(): GmailOutboxEntry[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearGmailOutbox(): void {
  localStorage.removeItem(OUTBOX_STORAGE_KEY);
}

/**
 * Verified email tracking
 */
export function getVerifiedEmails(): string[] {
  try {
    return JSON.parse(localStorage.getItem(VERIFIED_EMAILS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function isEmailVerified(email: string): boolean {
  if (!email) return false;
  const list = getVerifiedEmails();
  return list.includes(email.toLowerCase().trim());
}

export function markEmailAsVerified(email: string): void {
  if (!email) return;
  const list = getVerifiedEmails();
  const normalized = email.toLowerCase().trim();
  if (!list.includes(normalized)) {
    localStorage.setItem(VERIFIED_EMAILS_STORAGE_KEY, JSON.stringify([...list, normalized]));
  }
}

/**
 * Sends a raw email via Google Gmail API
 */
export async function sendGmailApiMessage({
  to,
  subject,
  html,
  text,
  type = 'NOTIFICATION',
  meta,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type?: GmailOutboxEntry['type'];
  meta?: Record<string, any>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    const err = 'Google account is not connected. Please connect with Google first.';
    recordOutbox({
      id: `outbox-${Date.now()}`,
      timestamp: new Date().toISOString(),
      to,
      subject,
      type,
      status: 'FAILED',
      error: err,
      meta,
    });
    return { success: false, error: err };
  }

  const currentUser = getCurrentGoogleUser();
  const senderEmail = currentUser?.email || 'me';

  try {
    const mimeString = buildMimeMessage({
      to,
      from: currentUser?.displayName ? `"${currentUser.displayName}" <${senderEmail}>` : senderEmail,
      subject,
      html,
      text,
    });

    const rawBase64 = toBase64Url(mimeString);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: rawBase64,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg = errData.error?.message || `HTTP ${response.status}: Failed to send message`;
      recordOutbox({
        id: `outbox-${Date.now()}`,
        timestamp: new Date().toISOString(),
        to,
        subject,
        type,
        status: 'FAILED',
        error: errorMsg,
        meta,
      });
      return { success: false, error: errorMsg };
    }

    const resJson = await response.json();
    recordOutbox({
      id: `outbox-${Date.now()}`,
      timestamp: new Date().toISOString(),
      to,
      subject,
      type,
      status: 'SENT',
      messageId: resJson.id,
      meta,
    });

    return { success: true, messageId: resJson.id };
  } catch (error: any) {
    const errorMsg = error?.message || 'Network error sending Gmail';
    recordOutbox({
      id: `outbox-${Date.now()}`,
      timestamp: new Date().toISOString(),
      to,
      subject,
      type,
      status: 'FAILED',
      error: errorMsg,
      meta,
    });
    return { success: false, error: errorMsg };
  }
}

/**
 * Sends a 6-digit OTP to verify an email or user action
 */
export async function sendGmailOtp({
  toEmail,
  recipientName = 'Valued Member',
  purpose = 'Account & Identity Verification',
  code,
}: {
  toEmail: string;
  recipientName?: string;
  purpose?: string;
  code?: string;
}): Promise<{ success: boolean; code?: string; expiresAt?: number; error?: string }> {
  // Generate 6-digit OTP code if not provided
  const otpCode = code || Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiresAt = now + DEFAULT_OTP_EXPIRY_MS;

  // Store in active OTPs
  activeOtps.set(toEmail.toLowerCase().trim(), {
    email: toEmail.toLowerCase().trim(),
    code: otpCode,
    purpose,
    createdAt: now,
    expiresAt,
    verified: false,
  });

  const subject = `[OPEC OA-GIMS] Your Verification Code: ${otpCode}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; text-align: left; border-bottom: 3px solid #f59e0b; }
    .brand { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .brand-tag { font-size: 11px; font-weight: 700; color: #f59e0b; background: rgba(245, 158, 11, 0.15); padding: 2px 8px; border-radius: 4px; display: inline-block; margin-top: 4px; }
    .content { padding: 32px; }
    .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
    .message { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
    .otp-container { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #d97706; margin: 8px 0; }
    .otp-label { font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: #64748b; }
    .expires { font-size: 12px; color: #dc2626; font-weight: 600; margin-top: 8px; }
    .security-notice { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #92400e; margin-top: 24px; line-height: 1.5; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">OA-GIMS Security Verification</div>
      <div class="brand-tag">OPEC AURUM GEMS · REGION 20 (ZASURMIS)</div>
    </div>
    <div class="content">
      <div class="greeting">Hello, ${recipientName}</div>
      <p class="message">
        We received a request for <strong>${purpose}</strong> associated with this registered Gmail address.
        Please enter the one-time verification passcode below to authorize this request:
      </p>

      <div class="otp-container">
        <div class="otp-label">Your One-Time Passcode (OTP)</div>
        <div class="otp-code">${otpCode}</div>
        <div class="expires">⏱ Valid for 10 minutes (expires at ${new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</div>
      </div>

      <div class="security-notice">
        <strong>🔒 Security Alert:</strong> Never share this verification code with anyone. Official OPEC officers and system administrators will never call or message to ask for your verification code. If you did not initiate this request, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      OPEC Aurum Gems Integrated Management System (OA-GIMS)<br/>
      Region 20 ZASURMIS · Misamis Occidental & Zamboanga del Sur<br/>
      Automated verification service delivered via Google Gmail API.
    </div>
  </div>
</body>
</html>
  `;

  const text = `
OA-GIMS Security Verification
OPEC AURUM GEMS · REGION 20 (ZASURMIS)

Hello, ${recipientName},

We received a request for ${purpose}.
Your One-Time Passcode (OTP) is:

>>> ${otpCode} <<<

This code is valid for 10 minutes until ${new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.

Do not share this passcode with anyone.
  `.trim();

  const result = await sendGmailApiMessage({
    to: toEmail,
    subject,
    html,
    text,
    type: 'OTP_VERIFICATION',
    meta: { purpose, code: otpCode, expiresAt },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, code: otpCode, expiresAt };
}

/**
 * Validates entered OTP code
 */
export function verifyEnteredOtp({
  email,
  code,
}: {
  email: string;
  code: string;
}): { success: boolean; error?: string } {
  const normalized = email.toLowerCase().trim();
  const record = activeOtps.get(normalized);

  if (!record) {
    return { success: false, error: 'No active verification code found for this email. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    activeOtps.delete(normalized);
    return { success: false, error: 'Verification code has expired. Please request a new code.' };
  }

  if (record.code !== code.trim()) {
    return { success: false, error: 'Invalid verification code. Please check your Gmail and try again.' };
  }

  // Marked as verified
  record.verified = true;
  markEmailAsVerified(normalized);
  activeOtps.delete(normalized);

  return { success: true };
}

/**
 * Sends a system notification email to a registered recipient
 */
export async function sendGmailNotification({
  toEmail,
  recipientName = 'Member',
  title,
  message,
  category = 'LOAN_STATUS',
  referenceId,
  actorName,
}: {
  toEmail: string;
  recipientName?: string;
  title: string;
  message: string;
  category?: string;
  referenceId?: string;
  actorName?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `[OPEC OA-GIMS Alert] ${title}`;

  const categoryColor = category === 'LOAN_STATUS'
    ? '#10b981'
    : category === 'UPCOMING_PAYMENT'
    ? '#ef4444'
    : category === 'COMAKER_REQUEST'
    ? '#f59e0b'
    : category === 'PAYMENT_CREDITED'
    ? '#06b6d4'
    : '#6366f1';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 32px; border-bottom: 3px solid ${categoryColor}; }
    .brand { font-size: 18px; font-weight: 800; color: #ffffff; }
    .brand-sub { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 2px; }
    .badge { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 10px; border-radius: 999px; background: ${categoryColor}22; color: ${categoryColor}; border: 1px solid ${categoryColor}55; margin-bottom: 12px; }
    .content { padding: 32px; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .message { font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 10px; }
    .meta-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; font-size: 12px; color: #475569; margin-bottom: 20px; }
    .meta-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e2e8f0; }
    .meta-row:last-child { border-bottom: none; }
    .meta-label { font-weight: 600; color: #64748b; }
    .meta-val { font-weight: 700; color: #0f172a; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">OA-GIMS Notification Alert</div>
      <div class="brand-sub">OPEC Aurum Gems · Region 20 ZASURMIS</div>
    </div>
    <div class="content">
      <span class="badge">${category.replace(/_/g, ' ')}</span>
      <div class="title">${title}</div>
      <p style="font-size: 13px; color: #64748b; margin-top: 0; margin-bottom: 16px;">
        Notification for: <strong>${recipientName}</strong>
      </p>

      <div class="message">
        ${message}
      </div>

      <div class="meta-box">
        ${referenceId ? `<div class="meta-row"><span class="meta-label">Reference Number:</span><span class="meta-val">${referenceId}</span></div>` : ''}
        ${actorName ? `<div class="meta-row"><span class="meta-label">Initiated / Approved By:</span><span class="meta-val">${actorName}</span></div>` : ''}
        <div class="meta-row"><span class="meta-label">Timestamp:</span><span class="meta-val">${new Date().toLocaleString()}</span></div>
        <div class="meta-row"><span class="meta-label">Delivery Channel:</span><span class="meta-val">Verified Gmail Notification</span></div>
      </div>
    </div>
    <div class="footer">
      Sent to ${toEmail} as registered on OPEC Aurum Gems Management System.<br/>
      Region 20 ZASURMIS Official Loan Administration Service.
    </div>
  </div>
</body>
</html>
  `;

  return sendGmailApiMessage({
    to: toEmail,
    subject,
    html,
    text: `${title}\n\n${message}\n\nRef: ${referenceId || 'N/A'}\nSent to: ${toEmail}`,
    type: 'NOTIFICATION',
    meta: { category, referenceId, actorName },
  });
}
