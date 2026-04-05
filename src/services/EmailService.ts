/**
 * Email Service
 * Handles all transactional emails via Resend
 */

import { Resend } from 'resend';
import { logger } from '../utils/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Knacksters <connect@knacksters.co>';
const ADMIN_EMAIL = 'connect@knacksters.co';
const WEBSITE_URL = process.env.WEBSITE_DOMAIN || 'https://www.knacksters.co';

// ─── Shared Styles ───────────────────────────────────────────────────────────

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f9fafb;
  margin: 0;
  padding: 0;
`;

function layout(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="${baseStyle}">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <!-- Header -->
        <div style="text-align:center;margin-bottom:32px;">
          <span style="font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.5px;">Knacksters</span>
        </div>

        <!-- Card -->
        <div style="background:#ffffff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="text-align:center;margin-top:28px;font-size:12px;color:#9ca3af;">
          <p style="margin:0 0 4px;">© 2026 Knacksters. All rights reserved.</p>
          <p style="margin:0;">
            <a href="${WEBSITE_URL}/terms" style="color:#9ca3af;text-decoration:underline;">Terms</a>
            &nbsp;·&nbsp;
            <a href="${WEBSITE_URL}/privacy" style="color:#9ca3af;text-decoration:underline;">Privacy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function primaryButton(text: string, href: string): string {
  return `
    <a href="${href}"
       style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#E9414C,#FF9634);
              color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;
              margin-top:24px;">
      ${text}
    </a>
  `;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />`;
}

// ─── 1. Client Welcome Email ──────────────────────────────────────────────────

export async function sendClientWelcomeEmail(data: {
  fullName: string;
  email: string;
  selectedSolution?: string;
}): Promise<void> {
  const solutionLabel = data.selectedSolution
    ? data.selectedSolution.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'our services';

  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      Welcome to Knacksters, ${data.fullName.split(' ')[0]}! 🎉
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      We're excited to have you on board.
    </p>

    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
      Your account is set up and you've selected <strong>${solutionLabel}</strong> as your primary need.
      Our team is already looking forward to your onboarding call.
    </p>

    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px;">
      Here's what happens next:
    </p>

    <div style="background:#fff7ed;border-radius:8px;padding:20px;margin-bottom:24px;">
      <div style="display:flex;align-items:flex-start;margin-bottom:12px;">
        <span style="font-weight:700;color:#ea580c;min-width:24px;">1.</span>
        <span style="color:#374151;font-size:14px;">Join your onboarding call — we'll understand your needs in detail</span>
      </div>
      <div style="display:flex;align-items:flex-start;margin-bottom:12px;">
        <span style="font-weight:700;color:#ea580c;min-width:24px;">2.</span>
        <span style="color:#374151;font-size:14px;">We match you with the right talent from our global network</span>
      </div>
      <div style="display:flex;align-items:flex-start;">
        <span style="font-weight:700;color:#ea580c;min-width:24px;">3.</span>
        <span style="color:#374151;font-size:14px;">Your dedicated account manager keeps everything on track</span>
      </div>
    </div>

    ${primaryButton('Go to Your Dashboard', `${WEBSITE_URL}/client-dashboard`)}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      Questions? Reply to this email or reach us at
      <a href="mailto:connect@knacksters.co" style="color:#ea580c;">connect@knacksters.co</a>
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: 'Welcome to Knacksters — you\'re all set!',
      html,
    });
    logger.info(`Welcome email sent to client: ${data.email}`);
  } catch (error) {
    logger.error('Failed to send client welcome email', error);
  }
}

// ─── 2. Admin: New Client Registered ─────────────────────────────────────────

export async function sendAdminNewClientAlert(data: {
  fullName: string;
  email: string;
  selectedSolution?: string;
}): Promise<void> {
  const solutionLabel = data.selectedSolution
    ? data.selectedSolution.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Not specified';

  const html = layout(`
    <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 20px;">
      🆕 New Client Registration
    </h1>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;width:40%;">Name</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.fullName}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
          <a href="mailto:${data.email}" style="color:#ea580c;">${data.email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;">Solution Selected</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;">${solutionLabel}</td>
      </tr>
    </table>

    ${primaryButton('View in Admin Dashboard', `${WEBSITE_URL}/admin-dashboard`)}
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New Client: ${data.fullName} (${data.selectedSolution || 'No solution'})`,
      html,
    });
    logger.info(`Admin new client alert sent for: ${data.email}`);
  } catch (error) {
    logger.error('Failed to send admin new client alert', error);
  }
}

// ─── 3. Talent: Application Received ─────────────────────────────────────────

export async function sendTalentApplicationReceivedEmail(data: {
  firstName: string;
  email: string;
  primaryExpertise: string;
}): Promise<void> {
  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      Application Received, ${data.firstName}! ✅
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      Thanks for applying to the Knacksters Talent Network.
    </p>

    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
      We've received your application as a <strong>${data.primaryExpertise}</strong> professional
      and our team will review it shortly.
    </p>

    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin-bottom:24px;border-left:4px solid #16a34a;">
      <p style="font-size:14px;color:#374151;margin:0 0 12px;font-weight:600;">What happens next:</p>
      <div style="font-size:14px;color:#374151;line-height:1.8;">
        <div>✓ Our team reviews your profile (usually within 48 hours)</div>
        <div>✓ We'll schedule a 30-min meet & greet call</div>
        <div>✓ Once approved, you'll start receiving project opportunities</div>
      </div>
    </div>

    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 8px;">
      While you wait, connect with us on socials:
    </p>
    <div style="margin-bottom:24px;">
      <a href="https://twitter.com/knackstersco" style="display:inline-block;margin-right:12px;color:#ea580c;font-size:14px;text-decoration:none;">𝕏 Twitter</a>
      <a href="https://www.youtube.com/@KnackstersLab" style="display:inline-block;margin-right:12px;color:#ea580c;font-size:14px;text-decoration:none;">▶ YouTube</a>
      <a href="https://www.linkedin.com/company/knacksters" style="display:inline-block;color:#ea580c;font-size:14px;text-decoration:none;">in LinkedIn</a>
    </div>

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      Questions? Reach us at
      <a href="mailto:connect@knacksters.co" style="color:#ea580c;">connect@knacksters.co</a>
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: 'We\'ve received your application — Knacksters Talent Network',
      html,
    });
    logger.info(`Application received email sent to talent: ${data.email}`);
  } catch (error) {
    logger.error('Failed to send talent application received email', error);
  }
}

// ─── 4. Admin: New Talent Application ────────────────────────────────────────

export async function sendAdminNewTalentAlert(data: {
  firstName: string;
  lastName: string;
  email: string;
  primaryExpertise: string;
  hourlyRate: number;
  profileId: string;
}): Promise<void> {
  const html = layout(`
    <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 20px;">
      🧑‍💻 New Talent Application
    </h1>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;width:40%;">Name</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.firstName} ${data.lastName}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
          <a href="mailto:${data.email}" style="color:#ea580c;">${data.email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Expertise</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.primaryExpertise}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;">Hourly Rate</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;">$${data.hourlyRate}/hr</td>
      </tr>
    </table>

    ${primaryButton('Review Application', `${WEBSITE_URL}/admin-dashboard/talent/${data.profileId}`)}
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New Talent Application: ${data.firstName} ${data.lastName} — ${data.primaryExpertise}`,
      html,
    });
    logger.info(`Admin new talent alert sent for: ${data.email}`);
  } catch (error) {
    logger.error('Failed to send admin new talent alert', error);
  }
}

// ─── 5. Client: Onboarding Call Confirmed ────────────────────────────────────

export async function sendClientBookingConfirmationEmail(data: {
  fullName: string;
  email: string;
  startTime: Date;
  videoCallUrl?: string | null;
}): Promise<void> {
  const formattedDate = data.startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = data.startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const meetingBlock = data.videoCallUrl
    ? `${primaryButton('Join Meeting', data.videoCallUrl)}`
    : `<p style="font-size:14px;color:#6b7280;margin-top:16px;">A video link will be sent to your email by the organizer.</p>`;

  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      Your Onboarding Call is Confirmed! 📅
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      We're looking forward to speaking with you, ${data.fullName.split(' ')[0]}.
    </p>

    <div style="background:#fff7ed;border-radius:8px;padding:24px;margin-bottom:24px;">
      <div style="font-size:14px;color:#6b7280;margin-bottom:4px;">Date</div>
      <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:16px;">${formattedDate}</div>
      <div style="font-size:14px;color:#6b7280;margin-bottom:4px;">Time</div>
      <div style="font-size:18px;font-weight:700;color:#111827;">${formattedTime}</div>
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 8px;">
      In this call we'll cover:
    </p>
    <ul style="font-size:14px;color:#374151;line-height:1.8;padding-left:20px;margin:0 0 24px;">
      <li>Your business needs and goals</li>
      <li>Available talent and service options</li>
      <li>Pricing and subscription plans</li>
    </ul>

    ${meetingBlock}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      Need to reschedule? Reply to this email or contact us at
      <a href="mailto:connect@knacksters.co" style="color:#ea580c;">connect@knacksters.co</a>
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: `Your Onboarding Call: ${formattedDate} at ${formattedTime}`,
      html,
    });
    logger.info(`Booking confirmation email sent to client: ${data.email}`);
  } catch (error) {
    logger.error('Failed to send client booking confirmation email', error);
  }
}

// ─── 6. Talent: Interview Scheduled ──────────────────────────────────────────

export async function sendTalentInterviewScheduledEmail(data: {
  firstName: string;
  email: string;
  preferredMeetingTime: string;
  meetingLink?: string | null;
}): Promise<void> {
  const meetingBlock = data.meetingLink
    ? `${primaryButton('Join Interview', data.meetingLink)}`
    : `<p style="font-size:14px;color:#6b7280;margin-top:16px;">A video link will be sent to your email shortly.</p>`;

  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      Your Interview is Scheduled! 🎤
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      Great news, ${data.firstName} — we're excited to meet you.
    </p>

    <div style="background:#fff7ed;border-radius:8px;padding:24px;margin-bottom:24px;">
      <div style="font-size:14px;color:#6b7280;margin-bottom:4px;">Requested Time</div>
      <div style="font-size:18px;font-weight:700;color:#111827;">${data.preferredMeetingTime}</div>
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 8px;">
      What to expect in your meet & greet:
    </p>
    <ul style="font-size:14px;color:#374151;line-height:1.8;padding-left:20px;margin:0 0 24px;">
      <li>A casual 30-minute conversation about your expertise</li>
      <li>Discussion of project types and opportunities</li>
      <li>Your availability and work preferences</li>
    </ul>

    ${meetingBlock}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      Questions? Reply to this email or reach us at
      <a href="mailto:connect@knacksters.co" style="color:#ea580c;">connect@knacksters.co</a>
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: 'Your Knacksters Interview is Confirmed!',
      html,
    });
    logger.info(`Interview scheduled email sent to talent: ${data.email}`);
  } catch (error) {
    logger.error('Failed to send talent interview scheduled email', error);
  }
}

// ─── 7. Admin: Invite New User ────────────────────────────────────────────────

export async function sendAdminInviteEmail(data: {
  firstName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'TALENT';
  inviteLink: string;
}): Promise<void> {
  const roleLabels: Record<string, string> = {
    ADMIN: 'Admin',
    MANAGER: 'Account Manager',
    TALENT: 'Talent',
  };
  const roleLabel = roleLabels[data.role] || data.role;

  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      You've been invited to Knacksters
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      Hi ${data.firstName}, an admin has created a <strong>${roleLabel}</strong> account for you.
    </p>

    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px;">
      Click the button below to set your password and access your dashboard.
      This link expires in <strong>1 hour</strong>.
    </p>

    ${primaryButton('Set Your Password & Get Started', data.inviteLink)}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      If you weren't expecting this invite, you can safely ignore this email.
      Questions? Reach us at
      <a href="mailto:connect@knacksters.co" style="color:#ea580c;">connect@knacksters.co</a>
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: `You've been invited to Knacksters as ${roleLabel}`,
      html,
    });
    logger.info(`Invite email sent to: ${data.email} (${data.role})`);
  } catch (error) {
    logger.error('Failed to send admin invite email', error);
    throw error;
  }
}

// ─── 8. Client: Task Request Confirmation ────────────────────────────────────

export async function sendClientTaskRequestEmail(data: {
  clientName: string;
  clientEmail: string;
  projectNumber: string;
  title: string;
  description: string;
  priority: string;
  estimatedHours?: number;
  dueDate?: Date;
  taskType?: string;
  isTrialToHire?: boolean;
}): Promise<void> {
  const priorityLabel = data.priority.charAt(0) + data.priority.slice(1).toLowerCase();
  const dueDateStr = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const categoryLabel = data.taskType
    ? data.taskType.charAt(0) + data.taskType.slice(1).toLowerCase()
    : null;

  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      Request Received ✅
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      Hi ${data.clientName.split(' ')[0]}, your task request has been submitted successfully.
    </p>

    ${data.isTrialToHire ? `
    <div style="background:#eff6ff;border-radius:8px;padding:16px;margin-bottom:20px;border-left:4px solid #3b82f6;">
      <p style="font-size:14px;font-weight:600;color:#1e40af;margin:0 0 4px;">⭐ Trial to Hire Task</p>
      <p style="font-size:13px;color:#3730a3;margin:0;">
        Your CSM will ensure the right Knackster is assigned and will follow up about a longer-term subscription arrangement after this task completes. No placement fees apply — longer engagements are managed through your subscription.
      </p>
    </div>` : ''}

    <div style="background:#fff7ed;border-radius:8px;padding:20px;margin-bottom:24px;border-left:4px solid #FF9634;">
      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Reference</p>
      <p style="font-size:18px;font-weight:700;color:#111827;margin:0 0 16px;">${data.projectNumber}</p>

      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Task</p>
      <p style="font-size:15px;font-weight:600;color:#111827;margin:0 0 16px;">${data.title}</p>

      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Description</p>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px;">${data.description.replace(/\n/g, '<br/>')}</p>

      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        <div>
          <p style="font-size:12px;color:#9ca3af;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.05em;">Priority</p>
          <p style="font-size:14px;font-weight:600;color:#111827;margin:0;">${priorityLabel}</p>
        </div>
        ${categoryLabel ? `
        <div>
          <p style="font-size:12px;color:#9ca3af;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.05em;">Category</p>
          <p style="font-size:14px;font-weight:600;color:#111827;margin:0;">${categoryLabel}</p>
        </div>` : ''}
        ${data.estimatedHours ? `
        <div>
          <p style="font-size:12px;color:#9ca3af;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.05em;">Estimated</p>
          <p style="font-size:14px;font-weight:600;color:#111827;margin:0;">${data.estimatedHours}h</p>
        </div>` : ''}
        ${dueDateStr ? `
        <div>
          <p style="font-size:12px;color:#9ca3af;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.05em;">Target Date</p>
          <p style="font-size:14px;font-weight:600;color:#111827;margin:0;">${dueDateStr}</p>
        </div>` : ''}
      </div>
    </div>

    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
      <strong>What happens next:</strong>
    </p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <div style="display:flex;align-items:flex-start;margin-bottom:10px;">
        <span style="font-weight:700;color:#FF9634;min-width:24px;">1.</span>
        <span style="color:#374151;font-size:14px;">Your Customer Success Manager reviews the scope and confirms details</span>
      </div>
      <div style="display:flex;align-items:flex-start;margin-bottom:10px;">
        <span style="font-weight:700;color:#FF9634;min-width:24px;">2.</span>
        <span style="color:#374151;font-size:14px;">The right Knackster is matched and assigned to your task</span>
      </div>
      <div style="display:flex;align-items:flex-start;">
        <span style="font-weight:700;color:#FF9634;min-width:24px;">3.</span>
        <span style="color:#374151;font-size:14px;">Work begins — you'll receive an update when it does</span>
      </div>
    </div>

    ${primaryButton('View Your Request', `${WEBSITE_URL}/tasks-projects`)}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      Questions? Reply to this email or reach us at
      <a href="mailto:connect@knacksters.co" style="color:#ea580c;">connect@knacksters.co</a>
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.clientEmail,
      subject: `Request received: ${data.projectNumber} — ${data.title.substring(0, 50)}`,
      html,
    });
    logger.info(`Task request confirmation sent to client: ${data.clientEmail}`);
  } catch (error) {
    logger.error('Failed to send client task request email', error);
  }
}

// ─── 9. CSM: New Task Request Alert ──────────────────────────────────────────

export async function sendCSMNewTaskRequestEmail(data: {
  csmName: string;
  csmEmail: string;
  clientName: string;
  projectNumber: string;
  title: string;
  description: string;
  priority: string;
  estimatedHours?: number;
  dueDate?: Date;
  taskType?: string;
  isTrialToHire?: boolean;
}): Promise<void> {
  const priorityLabel = data.priority.charAt(0) + data.priority.slice(1).toLowerCase();
  const dueDateStr = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Not specified';
  const categoryLabel = data.taskType
    ? data.taskType.charAt(0) + data.taskType.slice(1).toLowerCase()
    : null;

  const html = layout(`
    ${data.isTrialToHire ? `
    <div style="background:#eff6ff;border-radius:8px;padding:16px;margin-bottom:20px;border:2px solid #3b82f6;">
      <p style="font-size:15px;font-weight:700;color:#1e40af;margin:0 0 6px;">⭐ Trial to Hire Task</p>
      <p style="font-size:13px;color:#1d4ed8;margin:0;">
        <strong>${data.clientName}</strong> is evaluating this Knackster for a potential longer-term engagement. Please prioritise assigning someone who is available for ongoing subscription-based work. Follow up with the client after completion to discuss next steps.
      </p>
    </div>` : ''}

    <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 20px;">
      🆕 New Task Request
    </h1>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;width:35%;">Reference</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.projectNumber}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Client</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.clientName}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Task</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.title}</td>
      </tr>
      ${categoryLabel ? `
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Category</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${categoryLabel}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Priority</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${priorityLabel}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Target Date</td>
        <td style="padding:10px 0;color:#111827;border-bottom:1px solid #f3f4f6;">${dueDateStr}</td>
      </tr>
      ${data.estimatedHours ? `
      <tr>
        <td style="padding:10px 0;color:#6b7280;">Estimated Hours</td>
        <td style="padding:10px 0;color:#111827;">${data.estimatedHours}h</td>
      </tr>` : ''}
    </table>

    <p style="font-size:14px;color:#6b7280;margin:0 0 6px;">Description</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0;">${data.description.replace(/\n/g, '<br/>')}</p>
    </div>

    ${primaryButton('Review in Assignments', `${WEBSITE_URL}/manager-dashboard/assignments`)}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      This is an automated alert. Log in to assign a Knackster and get this task started.
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.csmEmail,
      subject: `New request from ${data.clientName}: ${data.title.substring(0, 50)}`,
      html,
    });
    logger.info(`CSM new task alert sent to: ${data.csmEmail}`);
  } catch (error) {
    logger.error('Failed to send CSM new task request email', error);
  }
}

// ─── 10. Password Reset (used by SuperTokens emailDelivery) ──────────────────

export async function sendPasswordResetEmail(data: {
  email: string;
  resetLink: string;
}): Promise<void> {
  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      Reset Your Password
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      We received a request to reset the password for your Knacksters account.
    </p>

    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px;">
      Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
    </p>

    ${primaryButton('Reset Password', data.resetLink)}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      If you didn't request this, you can safely ignore this email. Your password will not change.
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: 'Reset your Knacksters password',
      html,
    });
    logger.info(`Password reset email sent to: ${data.email}`);
  } catch (error) {
    logger.error('Failed to send password reset email', error);
    throw error; // Re-throw so SuperTokens knows delivery failed
  }
}
