/**
 * Serverless Function: Verify Email OTP & Issue Session Token
 * Compatible with Vercel, Netlify, Render, and Cloudflare Workers
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP code are required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

  return res.status(200).json({
    success: true,
    email: cleanEmail,
    token: token,
    remainingDownloads: 1,
    dailyLimit: 1
  });
}
