/**
 * Vercel Serverless Function: List Uploaded Books in Vercel Blob Storage
 * Returns real-time list of all PDF, DOC, and DOCX files stored on Vercel CDN.
 */

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(200).json({
      success: false,
      storageStatus: 'not_connected',
      message: 'Vercel Blob Storage is not connected to this project yet. Go to Vercel Dashboard -> Storage -> Create Blob Database.',
      blobs: []
    });
  }

  try {
    const response = await list({ prefix: 'books/' });
    const blobs = (response && response.blobs) || [];

    const formattedBlobs = blobs.map(b => ({
      pathname: b.pathname,
      filename: b.pathname.replace(/^books\//, ''),
      url: b.url,
      downloadUrl: b.downloadUrl,
      sizeBytes: b.size,
      sizeFormatted: (b.size / (1024 * 1024)).toFixed(2) + ' MB',
      uploadedAt: b.uploadedAt
    }));

    return res.status(200).json({
      success: true,
      storageStatus: 'connected',
      count: formattedBlobs.length,
      blobs: formattedBlobs
    });
  } catch (err) {
    console.error('Error listing Vercel blobs:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to query Vercel Blob Storage',
      details: err.message
    });
  }
}
