/**
 * Vercel Serverless Function: Upload Book to Vercel Blob Storage
 * Provides permanent, high-speed CDN storage for PDF, DOC, and DOCX files.
 */

import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Check if Vercel Blob is connected
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(200).json({
      success: false,
      storageStatus: 'not_connected',
      error: 'Vercel Blob Storage is not connected yet.',
      message: 'Go to your Vercel Dashboard -> Storage -> Create Blob Database, and link it to this project.'
    });
  }

  try {
    const { filename, fileBase64, title, author, category, era, format } = req.body || {};

    if (!filename || !fileBase64) {
      return res.status(400).json({ error: 'Filename and base64 file data are required.' });
    }

    // Decode base64 content
    const base64Data = fileBase64.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Determine content type
    let contentType = 'application/pdf';
    const lower = filename.toLowerCase();
    if (lower.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (lower.endsWith('.doc')) {
      contentType = 'application/msword';
    }

    // Upload to Vercel Blob Storage
    const blob = await put(`books/${filename}`, buffer, {
      access: 'public',
      contentType: contentType
    });

    return res.status(200).json({
      success: true,
      message: 'Book successfully stored in Vercel Blob Storage!',
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      bookMetadata: {
        title: title || filename,
        author: author || 'Department Faculty / Scholar',
        category: category || 'Archaeology & Excavations',
        era: era || 'Ancient Period',
        format: format || 'pdf',
        filePath: blob.url,
        fileSize: (buffer.length / (1024 * 1024)).toFixed(1) + ' MB'
      }
    });
  } catch (error) {
    console.error('Vercel Blob upload error:', error);
    return res.status(500).json({
      error: 'Upload failed',
      details: error.message
    });
  }
}
