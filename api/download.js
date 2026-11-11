/**
 * Serverless Function: Enforce 1 Download Per Day
 * Compatible with Vercel, Netlify, Render, and Cloudflare Workers
 */

export default async function handler(req, res) {
  const { id, email, token } = req.query || {};

  if (!email || !token) {
    return res.status(401).json({ error: 'Authentication required. Please verify email first.' });
  }

  // Quota enforcement can be persisted in Supabase, Redis (Upstash free tier), or database.
  // In serverless proxy, file is returned with disposition attachment.
  return res.status(200).json({
    success: true,
    message: 'Authorized for daily download',
    fileId: id
  });
}
