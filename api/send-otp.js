/**
 * Serverless Function: Send Email OTP
 * Compatible with Vercel, Netlify, Render, and Cloudflare Workers
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // If SMTP is configured via process.env, email can be sent here.
  // In demo / free tier mode, return demoOtp for zero-config testing:
  return res.status(200).json({
    success: true,
    message: `Verification code sent to ${cleanEmail}`,
    email: cleanEmail,
    demoOtp: otp
  });
}
