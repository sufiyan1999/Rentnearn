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

const FROM = process.env.ZOHO_EMAIL ?? "noreply@rentmitra.in";
const APP_URL = process.env.APP_URL ?? "http://localhost:80";

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
    await transporter.sendMail({ from: `RentMitra <${FROM}>`, to, subject, html });
    logger.info({ to, subject }, "Email sent");
  } catch (err) {
    logger.error({ err, to, subject }, "Email send failed");
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendMail(to, "Welcome to RentMitra!", `
    <h2>Welcome, ${name}!</h2>
    <p>You've successfully joined RentMitra — India's trusted peer-to-peer rental marketplace.</p>
    <p>Start listing your items or find things to rent near you.</p>
    <a href="${APP_URL}">Visit RentMitra</a>
  `);
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await sendMail(to, "Verify your RentMitra email", `
    <h2>Hi ${name},</h2>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${link}">Verify Email</a>
    <p>This link expires in 24 hours.</p>
  `);
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await sendMail(to, "Reset your RentMitra password", `
    <h2>Hi ${name},</h2>
    <p>You requested a password reset. Click below to set a new password:</p>
    <a href="${link}">Reset Password</a>
    <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  `);
}

export async function sendListingSubmittedEmail(to: string, name: string, title: string): Promise<void> {
  await sendMail(to, "Your listing is under review", `
    <h2>Hi ${name},</h2>
    <p>Your listing "<strong>${title}</strong>" has been submitted and is under review.</p>
    <p>We'll notify you once it's approved (usually within 24 hours).</p>
  `);
}

export async function sendListingApprovedEmail(to: string, name: string, title: string, listingId: number): Promise<void> {
  const link = `${APP_URL}/listings/${listingId}`;
  await sendMail(to, "Your listing is live!", `
    <h2>Hi ${name},</h2>
    <p>Great news! Your listing "<strong>${title}</strong>" has been approved and is now live.</p>
    <a href="${link}">View Your Listing</a>
  `);
}

export async function sendListingRejectedEmail(to: string, name: string, title: string, reason: string): Promise<void> {
  await sendMail(to, "Your listing needs changes", `
    <h2>Hi ${name},</h2>
    <p>Unfortunately, your listing "<strong>${title}</strong>" could not be approved.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please update your listing and resubmit.</p>
  `);
}

export async function sendListingExpiryEmail(to: string, name: string, title: string, listingId: number): Promise<void> {
  const link = `${APP_URL}/listings/${listingId}`;
  await sendMail(to, "Your listing is expiring soon", `
    <h2>Hi ${name},</h2>
    <p>Your listing "<strong>${title}</strong>" will expire in 3 days.</p>
    <a href="${link}">Renew Listing</a>
  `);
}
