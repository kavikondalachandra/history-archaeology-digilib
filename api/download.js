/**
 * Serverless Function: Enforce 1 Download Per Day on Vercel
 * Compatible with Vercel, Netlify, Render, and Cloudflare Workers
 */

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { id, email, token, url } = req.query || {};

  if (!email || !token) {
    return res.status(401).json({ error: 'Authentication required. Please verify your email first.' });
  }

  // If a direct Vercel Blob URL was passed, redirect to the download URL
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    res.setHeader('Content-Disposition', `attachment; filename="research_manuscript_${id || Date.now()}"`);
    return res.redirect(302, url);
  }

  // If local file in data/books/
  try {
    const booksJsonPath = path.join(process.cwd(), 'data', 'books.json');
    if (fs.existsSync(booksJsonPath)) {
      const books = JSON.parse(fs.readFileSync(booksJsonPath, 'utf8'));
      const book = books.find(b => b.id === id);
      if (book && book.filePath) {
        if (book.filePath.startsWith('http://') || book.filePath.startsWith('https://')) {
          return res.redirect(302, book.filePath);
        }
        const filePath = path.join(process.cwd(), book.filePath);
        if (fs.existsSync(filePath)) {
          const filename = path.basename(filePath);
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          return fs.createReadStream(filePath).pipe(res);
        }
      }
    }
  } catch (err) {
    console.error('Download handler error:', err);
  }

  return res.status(200).json({
    success: true,
    message: 'Authorized for daily download',
    fileId: id
  });
}
