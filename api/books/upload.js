import uploadBlobHandler, { config as blobConfig } from '../upload-blob.js';

export const config = blobConfig;

export default async function handler(req, res) {
  return uploadBlobHandler(req, res);
}
