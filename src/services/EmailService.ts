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

// ─── 0. Email Verification ───────────────────────────────────────────────────

export async function sendEmailVerificationEmail(data: {
  fullName: string;
  email: string;
  verificationLink: string;
}): Promise<void> {
  const firstName = data.fullName.split(' ')[0];

  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      Verify your email address
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      Hi ${firstName}, you're almost there!
    </p>

    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
      Click the button below to confirm your email address and activate your Knacksters account.
      This link expires in <strong>24 hours</strong>.
    </p>

    ${primaryButton('Verify my email', data.verificationLink)}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
      If you didn't create a Knacksters account, you can safely ignore this email.
      The link will expire automatically.<br/><br/>
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${data.verificationLink}" style="color:#FF9634;word-break:break-all;">${data.verificationLink}</a>
    </p>
  `);

  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: 'Verify your Knacksters email address',
    html,
  });
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
  isFirstBooking?: boolean;
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

  const isFirstBooking = data.isFirstBooking !== false; // default true for safety
  const callLabel = isFirstBooking ? 'Onboarding Call' : 'Strategy Call';
  const agendaItems = isFirstBooking
    ? ['Your business needs and goals', 'Available talent and service options', 'Pricing and subscription plans']
    : ['Project progress and priorities', 'Any blockers or support needed', 'Next steps and planning'];

  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      Your ${callLabel} is Confirmed! 📅
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
      ${agendaItems.map(item => `<li>${item}</li>`).join('')}
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
      subject: `Your ${callLabel}: ${formattedDate} at ${formattedTime}`,
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

// ─── 10. Manager: New Client Assigned ────────────────────────────────────────

export async function sendManagerNewClientEmail(data: {
  managerName: string;
  managerEmail: string;
  clientName: string;
  clientEmail: string;
  selectedSolution?: string;
}): Promise<void> {
  const solutionLabel = data.selectedSolution
    ? data.selectedSolution.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Not specified';

  const html = layout(`
    <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 20px;">
      👋 New Client Assigned to You
    </h1>

    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
      Hi ${data.managerName.split(' ')[0]}, a new client has been assigned to you.
      They've just completed registration and are expecting an onboarding call.
    </p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;width:40%;">Client Name</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.clientName}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
          <a href="mailto:${data.clientEmail}" style="color:#7c3aed;">${data.clientEmail}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;">Solution</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;">${solutionLabel}</td>
      </tr>
    </table>

    <div style="background:#faf5ff;border-radius:8px;padding:20px;margin-bottom:24px;border-left:4px solid #7c3aed;">
      <p style="font-size:14px;color:#374151;margin:0;">
        <strong>Next step:</strong> The client will be booking an onboarding call via the scheduling link.
        Review their details in your dashboard so you're prepared.
      </p>
    </div>

    ${primaryButton('View in Dashboard', `${WEBSITE_URL}/manager-dashboard`)}
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.managerEmail,
      subject: `New client assigned: ${data.clientName}`,
      html,
    });
    logger.info(`Manager new client email sent to: ${data.managerEmail}`);
  } catch (error) {
    logger.error('Failed to send manager new client email', error);
  }
}

// ─── 11. Admin: Talent Interview Booked ──────────────────────────────────────

export async function sendAdminTalentInterviewBookedEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  primaryExpertise: string;
  preferredMeetingTime: string;
  meetingLink?: string | null;
  profileId: string;
}): Promise<void> {
  const meetingRow = data.meetingLink
    ? `<tr>
        <td style="padding:10px 0;color:#6b7280;">Meeting Link</td>
        <td style="padding:10px 0;"><a href="${data.meetingLink}" style="color:#ea580c;">${data.meetingLink}</a></td>
      </tr>`
    : '';

  const html = layout(`
    <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 20px;">
      📅 Talent Interview Scheduled
    </h1>

    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
      A talent applicant has scheduled their meet &amp; greet interview.
    </p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
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
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Requested Time</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.preferredMeetingTime}</td>
      </tr>
      ${meetingRow}
    </table>

    ${primaryButton('Review Application', `${WEBSITE_URL}/admin-dashboard/talent/${data.profileId}`)}
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `Interview Scheduled: ${data.firstName} ${data.lastName} — ${data.primaryExpertise}`,
      html,
    });
    logger.info(`Admin talent interview booked email sent for: ${data.email}`);
  } catch (error) {
    logger.error('Failed to send admin talent interview booked email', error);
  }
}

// ─── 12. Talent: Interview Booking Confirmed (Cal.com webhook path) ───────────

export async function sendTalentBookingConfirmationEmail(data: {
  firstName: string;
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
    ? `${primaryButton('Join Interview', data.videoCallUrl)}`
    : `<p style="font-size:14px;color:#6b7280;margin-top:16px;">A video link will be sent to your email by the organizer.</p>`;

  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      Your Interview is Confirmed! 🎤
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      Great news, ${data.firstName} — your meet &amp; greet with the Knacksters team is locked in.
    </p>

    <div style="background:#fff7ed;border-radius:8px;padding:24px;margin-bottom:24px;">
      <div style="font-size:14px;color:#6b7280;margin-bottom:4px;">Date</div>
      <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:16px;">${formattedDate}</div>
      <div style="font-size:14px;color:#6b7280;margin-bottom:4px;">Time</div>
      <div style="font-size:18px;font-weight:700;color:#111827;">${formattedTime}</div>
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 8px;">
      What to expect:
    </p>
    <ul style="font-size:14px;color:#374151;line-height:1.8;padding-left:20px;margin:0 0 24px;">
      <li>A casual 30-minute conversation about your background and skills</li>
      <li>Discussion of project types and client opportunities</li>
      <li>Your availability and work preferences</li>
    </ul>

    ${meetingBlock}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      Need to reschedule? Reply to this email or reach us at
      <a href="mailto:connect@knacksters.co" style="color:#ea580c;">connect@knacksters.co</a>
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: `Your Knacksters Interview: ${formattedDate} at ${formattedTime}`,
      html,
    });
    logger.info(`Talent booking confirmation email sent to: ${data.email}`);
  } catch (error) {
    logger.error('Failed to send talent booking confirmation email', error);
  }
}

// ─── 13. Password Reset (used by SuperTokens emailDelivery) ──────────────────

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

// ─── 14. Talent: Task Assigned ────────────────────────────────────────────────

export async function sendTalentTaskAssignedEmail(data: {
  talentName: string;
  talentEmail: string;
  taskName: string;
  taskNumber: string;
  projectTitle: string;
  clientName: string;
  dueDate?: Date | null;
  estimatedMinutes?: number | null;
}): Promise<void> {
  const dueDateStr = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const estimatedStr = data.estimatedMinutes
    ? data.estimatedMinutes >= 60
      ? `${Math.floor(data.estimatedMinutes / 60)}h ${data.estimatedMinutes % 60 > 0 ? `${data.estimatedMinutes % 60}m` : ''}`.trim()
      : `${data.estimatedMinutes}m`
    : null;

  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      New Task Assigned 🎯
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      Hi ${data.talentName.split(' ')[0]}, you have a new task ready to begin.
    </p>

    <div style="background:#fff7ed;border-radius:8px;padding:20px;margin-bottom:24px;border-left:4px solid #FF9634;">
      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Task</p>
      <p style="font-size:17px;font-weight:700;color:#111827;margin:0 0 12px;">${data.taskName}</p>

      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Reference</p>
      <p style="font-size:14px;font-weight:600;color:#374151;margin:0 0 12px;font-family:monospace;">${data.taskNumber}</p>

      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Project</p>
      <p style="font-size:14px;color:#374151;margin:0 0 12px;">${data.projectTitle}</p>

      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Client</p>
      <p style="font-size:14px;color:#374151;margin:0 0 12px;">${data.clientName}</p>

      ${dueDateStr || estimatedStr ? `
      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        ${dueDateStr ? `
        <div>
          <p style="font-size:12px;color:#9ca3af;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.05em;">Due Date</p>
          <p style="font-size:14px;font-weight:600;color:#111827;margin:0;">${dueDateStr}</p>
        </div>` : ''}
        ${estimatedStr ? `
        <div>
          <p style="font-size:12px;color:#9ca3af;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.05em;">Estimated</p>
          <p style="font-size:14px;font-weight:600;color:#111827;margin:0;">${estimatedStr}</p>
        </div>` : ''}
      </div>` : ''}
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 8px;">
      Log your time as you work and update the task status in your dashboard.
    </p>

    ${primaryButton('View Your Tasks', `${WEBSITE_URL}/talent-dashboard/tasks`)}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      Questions? Contact your Customer Success Manager or reach us at
      <a href="mailto:connect@knacksters.co" style="color:#ea580c;">connect@knacksters.co</a>
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.talentEmail,
      subject: `New task: ${data.taskName.substring(0, 60)}`,
      html,
    });
    logger.info(`Task assigned email sent to talent: ${data.talentEmail}`);
  } catch (error) {
    logger.error('Failed to send talent task assigned email', error);
  }
}

// ─── 15. Client: Work Started ─────────────────────────────────────────────────

export async function sendClientTaskStartedEmail(data: {
  clientName: string;
  clientEmail: string;
  taskName: string;
  projectNumber: string;
  talentName: string;
}): Promise<void> {
  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      Work Has Started 🚀
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      Hi ${data.clientName.split(' ')[0]}, a Knackster has started working on your request.
    </p>

    <div style="background:#eff6ff;border-radius:8px;padding:20px;margin-bottom:24px;border-left:4px solid #3b82f6;">
      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Task</p>
      <p style="font-size:17px;font-weight:700;color:#111827;margin:0 0 12px;">${data.taskName}</p>

      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Reference</p>
      <p style="font-size:14px;font-weight:600;color:#374151;margin:0 0 12px;font-family:monospace;">${data.projectNumber}</p>

      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Assigned Knackster</p>
      <p style="font-size:14px;font-weight:600;color:#374151;margin:0;">${data.talentName}</p>
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px;">
      You can track progress and view logged hours in your dashboard. Your Customer Success Manager will keep you updated throughout.
    </p>

    ${primaryButton('Track Your Request', `${WEBSITE_URL}/tasks-projects`)}

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
      subject: `Work started: ${data.taskName.substring(0, 60)} — ${data.projectNumber}`,
      html,
    });
    logger.info(`Task started email sent to client: ${data.clientEmail}`);
  } catch (error) {
    logger.error('Failed to send client task started email', error);
  }
}

// ─── 16. Client: Task Completed ───────────────────────────────────────────────

export async function sendClientTaskCompletedEmail(data: {
  clientName: string;
  clientEmail: string;
  taskName: string;
  projectNumber: string;
  talentName: string;
  loggedMinutes?: number | null;
}): Promise<void> {
  const loggedStr = data.loggedMinutes
    ? data.loggedMinutes >= 60
      ? `${Math.floor(data.loggedMinutes / 60)}h ${data.loggedMinutes % 60 > 0 ? `${data.loggedMinutes % 60}m` : ''}`.trim()
      : `${data.loggedMinutes}m`
    : null;

  const html = layout(`
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">
      Task Completed ✅
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      Hi ${data.clientName.split(' ')[0]}, your task has been marked complete.
    </p>

    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin-bottom:24px;border-left:4px solid #22c55e;">
      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Task</p>
      <p style="font-size:17px;font-weight:700;color:#111827;margin:0 0 12px;">${data.taskName}</p>

      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Reference</p>
      <p style="font-size:14px;font-weight:600;color:#374151;margin:0 0 12px;font-family:monospace;">${data.projectNumber}</p>

      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Completed by</p>
      <p style="font-size:14px;font-weight:600;color:#374151;margin:0 0 12px;">${data.talentName}</p>

      ${loggedStr ? `
      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Time Logged</p>
      <p style="font-size:14px;font-weight:600;color:#374151;margin:0;">${loggedStr}</p>` : ''}
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 8px;">
      Please review the deliverables. If everything looks good, no action is needed. If you have any follow-up work, submit a new request from your dashboard.
    </p>

    ${primaryButton('View Completed Request', `${WEBSITE_URL}/tasks-projects`)}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      Questions about the work? Reply to this email or contact your Customer Success Manager at
      <a href="mailto:connect@knacksters.co" style="color:#ea580c;">connect@knacksters.co</a>
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.clientEmail,
      subject: `Task completed: ${data.taskName.substring(0, 60)} — ${data.projectNumber}`,
      html,
    });
    logger.info(`Task completed email sent to client: ${data.clientEmail}`);
  } catch (error) {
    logger.error('Failed to send client task completed email', error);
  }
}

// ─── 17. CSM: Task Completed Alert ───────────────────────────────────────────

export async function sendCSMTaskCompletedEmail(data: {
  csmName: string;
  csmEmail: string;
  clientName: string;
  taskName: string;
  projectNumber: string;
  talentName: string;
  loggedMinutes?: number | null;
}): Promise<void> {
  const loggedStr = data.loggedMinutes
    ? data.loggedMinutes >= 60
      ? `${Math.floor(data.loggedMinutes / 60)}h ${data.loggedMinutes % 60 > 0 ? `${data.loggedMinutes % 60}m` : ''}`.trim()
      : `${data.loggedMinutes}m`
    : null;

  const html = layout(`
    <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 20px;">
      ✅ Task Completed
    </h1>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;width:35%;">Reference</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;font-family:monospace;">${data.projectNumber}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Client</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.clientName}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Task</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.taskName}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Completed by</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.talentName}</td>
      </tr>
      ${loggedStr ? `
      <tr>
        <td style="padding:10px 0;color:#6b7280;">Time Logged</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;">${loggedStr}</td>
      </tr>` : ''}
    </table>

    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px;">
      The client has been notified. Follow up if any review or next steps are required.
    </p>

    ${primaryButton('View in Assignments', `${WEBSITE_URL}/manager-dashboard/assignments`)}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      This is an automated alert from Knacksters.
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.csmEmail,
      subject: `Task completed — ${data.clientName}: ${data.taskName.substring(0, 50)}`,
      html,
    });
    logger.info(`Task completed alert sent to CSM: ${data.csmEmail}`);
  } catch (error) {
    logger.error('Failed to send CSM task completed email', error);
  }
}

// ─── 18. Admin: New Support Ticket ───────────────────────────────────────────

export async function sendAdminNewSupportTicketEmail(data: {
  ticketNumber: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  category?: string;
  priority: string;
  description: string;
}): Promise<void> {
  const priorityColors: Record<string, string> = {
    URGENT: '#dc2626',
    HIGH: '#ea580c',
    NORMAL: '#2563eb',
    LOW: '#6b7280',
  };
  const priorityColor = priorityColors[data.priority] || '#6b7280';

  const html = layout(`
    <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 20px;">
      🎫 New Support Ticket
    </h1>

    <div style="background:#fff7ed;border-radius:8px;padding:16px;margin-bottom:20px;border-left:4px solid #FF9634;">
      <div style="display:flex;align-items:center;gap:12px;">
        <p style="font-size:18px;font-weight:700;color:#111827;margin:0;font-family:monospace;">${data.ticketNumber}</p>
        <span style="display:inline-block;padding:3px 10px;background:${priorityColor};color:#fff;border-radius:20px;font-size:12px;font-weight:600;">
          ${data.priority}
        </span>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;width:35%;">Client</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.clientName}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td>
        <td style="padding:10px 0;color:#111827;border-bottom:1px solid #f3f4f6;">
          <a href="mailto:${data.clientEmail}" style="color:#ea580c;">${data.clientEmail}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Subject</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.subject}</td>
      </tr>
      ${data.category ? `
      <tr>
        <td style="padding:10px 0;color:#6b7280;">Category</td>
        <td style="padding:10px 0;color:#111827;font-weight:600;">${data.category}</td>
      </tr>` : ''}
    </table>

    <p style="font-size:14px;color:#6b7280;margin:0 0 6px;">Description</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0;">${data.description.replace(/\n/g, '<br/>')}</p>
    </div>

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      This is an automated alert. Log in to the admin dashboard to view and respond to this ticket.
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `[${data.priority}] New ticket ${data.ticketNumber}: ${data.subject.substring(0, 60)}`,
      html,
    });
    logger.info(`Admin new support ticket email sent for: ${data.ticketNumber}`);
  } catch (error) {
    logger.error('Failed to send admin new support ticket email', error);
  }
}

// ─── 19. Client: Support Ticket Reply ────────────────────────────────────────

export async function sendClientTicketReplyEmail(data: {
  ticketNumber: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  replyMessage: string;
  status: string;
}): Promise<void> {
  const statusLabels: Record<string, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };
  const statusColors: Record<string, string> = {
    OPEN: '#2563eb',
    IN_PROGRESS: '#ea580c',
    RESOLVED: '#16a34a',
    CLOSED: '#6b7280',
  };
  const statusLabel = statusLabels[data.status] || data.status;
  const statusColor = statusColors[data.status] || '#6b7280';

  const html = layout(`
    <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 6px;">
      We've responded to your ticket
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">
      Hi ${data.clientName}, here's an update on your support request.
    </p>

    <div style="background:#fff7ed;border-radius:8px;padding:16px;margin-bottom:24px;border-left:4px solid #FF9634;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <p style="font-size:16px;font-weight:700;color:#111827;margin:0;font-family:monospace;">${data.ticketNumber}</p>
        <span style="display:inline-block;padding:3px 10px;background:${statusColor};color:#fff;border-radius:20px;font-size:12px;font-weight:600;">
          ${statusLabel}
        </span>
      </div>
      <p style="font-size:14px;color:#374151;margin:8px 0 0;font-weight:600;">${data.subject}</p>
    </div>

    <p style="font-size:14px;color:#6b7280;margin:0 0 6px;">Reply from our support team</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #e5e7eb;">
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;">${data.replyMessage.replace(/\n/g, '<br/>')}</p>
    </div>

    ${data.status === 'RESOLVED' || data.status === 'CLOSED' ? `
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:24px;border:1px solid #bbf7d0;">
      <p style="font-size:14px;color:#15803d;margin:0;">
        ✓ Your ticket has been marked as <strong>${statusLabel}</strong>. If you have further questions, you can open a new support ticket from your dashboard.
      </p>
    </div>
    ` : `
    <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">
      If you have additional questions, please reply by logging into your dashboard and submitting a new ticket.
    </p>
    `}

    ${primaryButton('View My Tickets', `${WEBSITE_URL}/support`)}

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      This is a response to your support ticket. Please do not reply to this email directly.
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: data.clientEmail,
      subject: `Re: [${data.ticketNumber}] ${data.subject.substring(0, 60)}`,
      html,
    });
    logger.info(`Client ticket reply email sent for: ${data.ticketNumber} to ${data.clientEmail}`);
  } catch (error) {
    logger.error('Failed to send client ticket reply email', error);
  }
}
