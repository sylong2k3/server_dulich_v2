const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const UPLOAD_ROOT = path.resolve(__dirname, '../../public/uploads');
const PUBLIC_PATH = '/uploads';

const ensureDir = async (dir) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

const sanitizeFolder = (folder) => {
  return String(folder || 'tourism')
    .replace(/\\/g, '/')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/');
};

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/m4a': 'm4a',
  'audio/ogg': 'oga',
  'audio/aac': 'aac',
  'application/json': 'json',
  'application/geo+json': 'geojson',
  'text/json': 'json',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

const inferExtension = (mimetype, originalName) => {
  if (mimetype && MIME_EXT[mimetype]) return MIME_EXT[mimetype];
  if (originalName) {
    const ext = path.extname(originalName).replace('.', '').toLowerCase();
    if (ext) return ext;
  }
  return 'bin';
};

const generateFilename = (ext) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}.${ext}`;
};

const buildPublicUrl = (relativePath) => {
  const normalized = String(relativePath).replace(/\\/g, '/').replace(/^\/+/, '');
  const url = `${PUBLIC_PATH}/${normalized}`;
  const base = process.env.PUBLIC_BASE_URL || process.env.APP_URL || '';
  return base ? `${base.replace(/\/$/, '')}${url}` : url;
};

/**
 * Lưu buffer xuống public/uploads/{folder}/
 * Trả về object có shape tương đương cloudinary để giữ tương thích.
 */
const uploadBufferToStorage = async (buffer, options = {}) => {
  const folder = sanitizeFolder(options.folder || 'tourism');
  const ext = inferExtension(options.mimetype, options.originalName);
  const filename = generateFilename(ext);

  const targetDir = path.join(UPLOAD_ROOT, folder);
  await ensureDir(targetDir);
  const targetPath = path.join(targetDir, filename);
  await fs.promises.writeFile(targetPath, buffer);

  const relativePath = `${folder}/${filename}`;
  return {
    secure_url: buildPublicUrl(relativePath),
    public_id: relativePath,
    bytes: buffer.length,
    format: ext,
    duration: null,
    width: null,
    height: null,
    resource_type: options.resource_type || 'auto',
  };
};

/**
 * Xóa file local theo public_id (relative path) hoặc URL.
 */
const deleteFromStorage = async (publicIdOrUrl) => {
  if (!publicIdOrUrl) return;
  const id = extractPublicId(publicIdOrUrl) || String(publicIdOrUrl);
  const safe = id.replace(/\\/g, '/');
  if (safe.includes('..')) return;
  const fullPath = path.isAbsolute(safe) ? safe : path.join(UPLOAD_ROOT, safe);
  await fs.promises.unlink(fullPath).catch(() => {});
};

/**
 * Trích xuất public_id (relative path dưới UPLOAD_ROOT) từ URL.
 */
const extractPublicId = (url) => {
  if (!url) return null;
  const cleaned = String(url).split('?')[0].replace(/\\/g, '/');
  const marker = '/uploads/';
  const idx = cleaned.indexOf(marker);
  if (idx === -1) return null;
  return cleaned.substring(idx + marker.length);
};

module.exports = {
  UPLOAD_ROOT,
  PUBLIC_PATH,
  uploadBufferToStorage,
  deleteFromStorage,
  extractPublicId,
};
