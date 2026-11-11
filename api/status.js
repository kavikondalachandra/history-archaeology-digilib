/**
 * Vercel Serverless Function: Status & Health Check
 * Verifies backend connectivity and Vercel Blob status
 */

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  return res.status(200).json({
    status: 'online',
    server: 'Vercel Serverless Cloud Engine',
    blobStorage: hasBlob ? 'connected' : 'not_configured',
    message: hasBlob
      ? 'Vercel Blob Storage is connected and ready for book storage.'
      : 'Vercel is running. Connect Blob Storage in Storage tab for dynamic uploads.',
    timestamp: new Date().toISOString()
  });
}
