/**
 * Vercel Serverless Function: Books Catalogue
 * Serves the master book list for remote frontends or local clients
 */

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const booksPath = path.join(process.cwd(), 'data', 'books.json');
    if (fs.existsSync(booksPath)) {
      const data = fs.readFileSync(booksPath, 'utf8');
      return res.status(200).send(data);
    }
  } catch (e) {
    console.error('Failed reading books.json:', e);
  }

  return res.status(200).json([]);
}
