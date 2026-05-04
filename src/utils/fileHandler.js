const fs = require('fs');
const path = require('path');
const { UPLOAD_ROOT } = require('../configs/localStorage');

const UPLOAD_DIR = UPLOAD_ROOT;

const deleteOldFile = async (oldFileUrl) => {
  if (!oldFileUrl) return;

  try {
    let cleanedPath = String(oldFileUrl)
      .split('?')[0]
      .replace(/\\/g, '/');

    const marker = cleanedPath.includes('/uploads/')
      ? '/uploads/'
      : cleanedPath.includes('uploads/')
        ? 'uploads/'
        : null;
    if (!marker) return;

    const relativePath = cleanedPath.split(marker)[1];
    if (!relativePath) return;

    if (relativePath.includes('..')) {
      console.error('Invalid file path (path traversal detected)');
      return;
    }

    const absolutePath = path.join(UPLOAD_DIR, relativePath);
    await fs.promises.unlink(absolutePath).catch(() => {});
  } catch (error) {
    console.error('Error deleting old file:', error.message);
  }
};

module.exports = {
  UPLOAD_DIR,
  deleteOldFile,
};
