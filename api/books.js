/**
 * Vercel Serverless Function: Books Catalogue
 * Serves the master book list for remote frontends or local clients
 */

import fs from 'fs';
import path from 'path';

let dynamicBooks = [];

export function addDynamicBook(book) {
  if (book && (book.title || book.id)) {
    dynamicBooks = dynamicBooks.filter(b => b.id !== book.id && b.title !== book.title);
    dynamicBooks.unshift(book);
    return true;
  }
  return false;
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'POST') {
    try {
      const book = req.body;
      if (addDynamicBook(book)) {
        return res.status(200).json({ success: true, count: dynamicBooks.length });
      }
    } catch (e) {
      console.error('Error adding dynamic book:', e);
    }
    return res.status(400).json({ error: 'Invalid book payload' });
  }

  try {
    const booksPath = path.join(process.cwd(), 'data', 'books.json');
    let books = [];
    if (fs.existsSync(booksPath)) {
      books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
    }
    const combined = [...dynamicBooks, ...books];
    return res.status(200).json(combined);
  } catch (e) {
    console.error('Failed reading books.json:', e);
    return res.status(200).json(dynamicBooks);
  }
}
