import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY not set — emails will be logged to console instead of sent");
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[Email] To: ${params.to} | Subject: ${params.subject}`);
    return true;
  }
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendInvitationEmail(
  recipientEmail: string,
  inviterName: string,
  role: string,
  invitationType: string,
  invitationToken: string,
  organizationName: string = "DartNox"
): Promise<boolean> {
  const inviteUrl = `https://d191031c-a979-4e88-befc-caa97d4a07e9-00-r2xnof5rwtwe.riker.replit.dev/accept-invitation/${invitationToken}`;
  
  const isClientInvite = invitationType === "client";
  const roleDisplay = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  const subject = isClientInvite 
    ? `Welcome to ${organizationName} - Access Your Client Portal`
    : `You're invited to join ${organizationName} as ${roleDisplay}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .role-badge { display: inline-block; background: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 0 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">${organizationName}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">
            ${isClientInvite ? 'Client Portal Access' : 'Team Invitation'}
          </p>
        </div>
        <div class="content">
          <h2 style="color: #1f2937; margin-top: 0;">
            ${isClientInvite ? 'Welcome to Our Client Portal!' : `You're Invited to Join Our Team!`}
          </h2>
          
          <p>Hello,</p>
          
          <p>
            ${inviterName} has invited you to ${isClientInvite ? 'access your client portal' : 'join the team'} at <strong>${organizationName}</strong>
            ${!isClientInvite ? ` with the role of <span class="role-badge">${roleDisplay}</span>` : ''}.
          </p>
          
          ${isClientInvite ? `
            <p>As our valued client, you now have access to:</p>
            <ul style="color: #4b5563;">
              <li>Your project dashboard and progress updates</li>
              <li>Invoice history and payment tracking</li>
              <li>Direct communication with your project team</li>
              <li>Document sharing and file management</li>
            </ul>
          ` : `
            <p>As a <strong>${roleDisplay}</strong>, you'll have access to:</p>
            <ul style="color: #4b5563;">
              <li>Team collaboration tools and project management</li>
              <li>Financial tracking and reporting dashboard</li>
              <li>Client management and communication systems</li>
              <li>Role-based permissions and organization settings</li>
            </ul>
          `}
          
          <p>Click the button below to accept your invitation and set up your account:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" class="button">
              ${isClientInvite ? 'Access Client Portal' : 'Accept Invitation & Join Team'}
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            <strong>Note:</strong> This invitation link will expire in 7 days. If you have any questions, 
            please contact ${inviterName} or reply to this email.
          </p>
          
          ${!isClientInvite ? `
            <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin-top: 20px;">
              <h4 style="margin-top: 0; color: #374151;">What's Next?</h4>
              <ol style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li>Click the invitation link above</li>
                <li>Create your secure password</li>
                <li>Complete your profile setup</li>
                <li>Start collaborating with the team!</li>
              </ol>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>© 2025 ${organizationName}. All rights reserved.</p>
          <p style="font-size: 12px;">
            If you can't click the button above, copy and paste this link into your browser:<br>
            <a href="${inviteUrl}" style="color: #667eea; word-break: break-all;">${inviteUrl}</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
${subject}

Hello,

${inviterName} has invited you to ${isClientInvite ? 'access your client portal' : 'join the team'} at ${organizationName}${!isClientInvite ? ` as ${roleDisplay}` : ''}.

${isClientInvite ? 'As our valued client, you now have access to your project dashboard, invoices, and direct communication with your project team.' : `As a ${roleDisplay}, you'll have access to team collaboration tools, financial tracking, and client management systems.`}

To accept your invitation and set up your account, visit:
${inviteUrl}

This invitation link will expire in 7 days. If you have any questions, please contact ${inviterName}.

© 2025 ${organizationName}. All rights reserved.
  `;

  return await sendEmail({
    to: recipientEmail,
    from: 'noreply@dartnox.com', // Replace with your verified sender email
    subject,
    text: textContent,
    html: htmlContent,
  });
}