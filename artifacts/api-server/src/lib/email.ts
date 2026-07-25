import nodemailer from "nodemailer";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST ?? "smtp.zoho.in",
  port: Number(process.env.ZOHO_SMTP_PORT ?? "465"),
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL ?? "",
    pass: process.env.ZOHO_PASSWORD ?? "",
  },
});

const FROM = process.env.ZOHO_EMAIL ?? "noreply@rentnearn.com";
const APP_URL = (process.env.APP_URL ?? "https://www.rentnearn.com").replace(/\/$/, "");

/** Wraps email body content in a clean branded HTML shell. */
function emailHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1F2937; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.07); }
    .header { background: #FF6B00; padding: 28px 32px; }
    .logo-text { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .logo-rent { color: #ffffff; }
    .logo-n-wrap { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: rgba(255,255,255,0.25); border-radius: 50%; margin: 0 3px; vertical-align: middle; }
    .logo-n { color: #ffffff; font-size: 12px; font-weight: 900; line-height: 1; }
    .logo-earn { color: rgba(255,255,255,0.85); }
    .body { padding: 32px; }
    .body h2 { margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #1F2937; }
    .body p { margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: #4B5563; }
    .btn { display: inline-block; background: #FF6B00; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 999px; margin: 8px 0 16px; }
    .footer { border-top: 1px solid #F1F5F9; padding: 20px 32px; background: #F8FAFC; }
    .footer p { margin: 0 0 4px; font-size: 12px; color: #9CA3AF; }
    .footer a { color: #FF6B00; text-decoration: none; }
    .tagline { font-size: 11px; font-weight: 600; color: #FF6B00; letter-spacing: 0.5px; margin-top: 4px !important; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-text">
        <span class="logo-rent">Rent</span><span class="logo-n-wrap"><span class="logo-n">N</span></span><span class="logo-earn">Earn</span>
      </div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Thank you for choosing <strong>RentNEarn</strong>.</p>
      <p class="tagline">Rent Smart. Earn More. Waste Less.</p>
      <p style="margin-top:10px;">
        <a href="${APP_URL}">www.rentnearn.com</a>
        &nbsp;·&nbsp;
        <a href="mailto:support@rentnearn.com">support@rentnearn.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/** Generic send — exported for use by the membership service. */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  await sendMail(to, subject, html);
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_PASSWORD) {
    logger.warn({ to, subject }, "Email not configured, skipping send");
    return;
  }
  try {
    await transporter.sendMail({ from: `RentNEarn <${FROM}>`, to, subject, html });
    logger.info({ to, subject }, "Email sent");
  } catch (err) {
    logger.error({ err, to, subject }, "Email send failed");
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendMail(to, "Welcome to RentNEarn! 🎉", emailHtml(`
    <h2>Welcome aboard, ${name}!</h2>
    <p>You've successfully joined <strong>RentNEarn</strong> — India's peer-to-peer rental marketplace where you can rent what you need and earn from what you own.</p>
    <p>Start exploring thousands of items near you, or list your own items and start earning today.</p>
    <a href="${APP_URL}/search" class="btn">Start Exploring</a>
    <p>If you have any questions, reply to this email or reach us at <a href="mailto:support@rentnearn.com">support@rentnearn.com</a>.</p>
  `));
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await sendMail(to, "Verify your RentNEarn email address", emailHtml(`
    <h2>Hi ${name}, verify your email</h2>
    <p>Click the button below to verify your email address and activate your RentNEarn account.</p>
    <a href="${link}" class="btn">Verify Email Address</a>
    <p>This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.</p>
  `));
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await sendMail(to, "Reset your RentNEarn password", emailHtml(`
    <h2>Hi ${name}, reset your password</h2>
    <p>We received a request to reset your password. Click the button below to choose a new one.</p>
    <a href="${link}" class="btn">Reset Password</a>
    <p>This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email — your account remains secure.</p>
  `));
}

export async function sendListingSubmittedEmail(to: string, name: string, title: string): Promise<void> {
  await sendMail(to, "Your listing is under review ⏳", emailHtml(`
    <h2>Hi ${name}, we've received your listing</h2>
    <p>Your listing <strong>"${title}"</strong> has been submitted and is currently under review by our team.</p>
    <p>We typically approve listings within <strong>24 hours</strong>. You'll receive a notification once it goes live.</p>
  `));
}

export async function sendListingApprovedEmail(to: string, name: string, title: string, listingId: number): Promise<void> {
  const link = `${APP_URL}/listings/${listingId}`;
  await sendMail(to, "Your listing is live! ✅", emailHtml(`
    <h2>Great news, ${name}!</h2>
    <p>Your listing <strong>"${title}"</strong> has been approved and is now live on RentNEarn.</p>
    <p>Renters across India can now discover and contact you about this item.</p>
    <a href="${link}" class="btn">View Your Listing</a>
  `));
}

export async function sendListingRejectedEmail(to: string, name: string, title: string, reason: string): Promise<void> {
  await sendMail(to, "Your listing needs some changes", emailHtml(`
    <h2>Hi ${name}, action needed on your listing</h2>
    <p>Unfortunately, your listing <strong>"${title}"</strong> could not be approved at this time.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please update your listing based on the feedback above and resubmit — we'll review it again promptly.</p>
    <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard</a>
  `));
}

export async function sendListingExpiryEmail(to: string, name: string, title: string, listingId: number): Promise<void> {
  const link = `${APP_URL}/listings/${listingId}`;
  await sendMail(to, "Your listing is expiring soon ⏰", emailHtml(`
    <h2>Hi ${name}, time to renew</h2>
    <p>Your listing <strong>"${title}"</strong> will expire in <strong>3 days</strong>.</p>
    <p>Renew it now to keep it visible to renters across India.</p>
    <a href="${link}" class="btn">Renew Listing</a>
  `));
}
