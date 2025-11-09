const formData = require("form-data");
const Mailgun = require("mailgun.js");
const config = require("../config/environment");

const mailgun = new Mailgun(formData);

// Initialize Mailgun client
const mg = mailgun.client({
  username: "api",
  key: config.mailgun.apiKey,
  url: "https://api.mailgun.net", // Use 'https://api.eu.mailgun.net' for EU region
});

/**
 * Email Service - Handles all email sending operations
 */
class EmailService {
  /**
   * Send email using Mailgun
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      const messageData = {
        from: config.mailgun.from,
        to: [to],
        subject: subject,
        html: html,
        text: text || "",
      };

      const response = await mg.messages.create(
        config.mailgun.domain,
        messageData
      );

      console.log(`✅ Email sent successfully to ${to}`);

      return {
        success: true,
        messageId: response.id,
      };
    } catch (error) {
      console.error("Email sending failed:");
      console.error("Error message:", error.message);
      console.error(
        "Error details:",
        JSON.stringify(error.details || error, null, 2)
      );
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send OTP verification email
   */
  async sendOTPVerificationEmail(email, name, otp) {
    const subject = "Verify Your Email - Complifi AI";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Complifi AI!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for signing up! Please verify your email address to activate your account.</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">This code expires in 10 minutes</p>
            </div>

            <p><strong>Note:</strong> If you didn't create an account with Complifi AI, please ignore this email.</p>

            <p>Best regards,<br>The Complifi AI Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Complifi AI. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Complifi AI!
      
      Hi ${name},
      
      Your verification code is: ${otp}
      
      This code expires in 10 minutes.
      
      If you didn't create an account, please ignore this email.
      
      Best regards,
      The Complifi AI Team
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, name, resetToken) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    const subject = "Reset Your Password - Complifi AI";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We received a request to reset your password for your Complifi AI account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 12px;">${resetUrl}</p>

            <div class="warning">
              <strong>⚠️ Important:</strong> This link expires in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </div>

            <p>Best regards,<br>The Complifi AI Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Complifi AI. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request
      
      Hi ${name},
      
      We received a request to reset your password for your Complifi AI account.
      
      Click this link to reset your password:
      ${resetUrl}
      
      This link expires in 1 hour.
      
      If you didn't request a password reset, please ignore this email.
      
      Best regards,
      The Complifi AI Team
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send password changed confirmation email
   */
  async sendPasswordChangedEmail(email, name) {
    const subject = "Password Changed Successfully - Complifi AI";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Changed</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            
            <div class="success-box">
              <strong>✓ Success!</strong> Your password has been changed successfully.
            </div>

            <p>Your Complifi AI account password was recently changed. If you made this change, no further action is needed.</p>

            <p><strong>If you didn't change your password:</strong></p>
            <ul>
              <li>Your account may be compromised</li>
              <li>Contact our support team immediately</li>
              <li>Change your password as soon as possible</li>
            </ul>

            <p>Best regards,<br>The Complifi AI Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Complifi AI. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Changed Successfully
      
      Hi ${name},
      
      Your Complifi AI account password was recently changed.
      
      If you made this change, no further action is needed.
      
      If you didn't change your password, please contact support immediately.
      
      Best regards,
      The Complifi AI Team
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send workspace invitation email
   */
  async sendWorkspaceInvitationEmail(
    email,
    inviterName,
    workspaceName,
    role,
    token
  ) {
    try {
      const invitationLink = `${process.env.FRONTEND_URL}accept-invitation?token=${token}`;
      console.log(
        "Invitation link:",
        invitationLink,
        email,
        inviterName,
        workspaceName,
        role,
        token
      );

      const mailOptions = {
        from: process.env.MAILGUN_FROM_EMAIL,
        to: email,
        subject: `You've been invited to join ${workspaceName}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Workspace Invitation</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on CompliFi.</p>
              <p>You've been assigned the role of: <strong>${role}</strong></p>
              <p>Click the button below to accept the invitation:</p>
              <div style="text-align: center;">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #666;">${invitationLink}</p>
              <p><strong>Note:</strong> This invitation link is valid for 7 days.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CompliFi. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      };

      return await this.sendEmail(mailOptions);
    } catch (error) {
      console.error("Error sending invitation email:", error);
      throw new Error("Failed to send invitation email");
    }
  }
}

module.exports = new EmailService();
