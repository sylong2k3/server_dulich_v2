const multer = require('multer');
const { deleteOldFile } = require('../utils/fileHandler');
const { uploadBufferToStorage, deleteFromStorage } = require('../configs/localStorage');

// Giới hạn kích thước file theo loại MIME category
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,        // 5MB
  video: 50 * 1024 * 1024,       // 50MB
  audio: 20 * 1024 * 1024,       // 20MB
  application: 10 * 1024 * 1024, // 10MB (PDF, Word, Excel, JSON)
  text: 5 * 1024 * 1024,         // 5MB
};

// Resource type theo MIME category (giữ để metadata, không bắt buộc)
const RESOURCE_TYPE_MAP = {
  image: 'image',
  video: 'video',
  audio: 'audio',
};

class UploadService {
  constructor(options = {}) {
    // Hard limit cho multer = max của tất cả các loại
    this.maxFileSize = options.maxFileSize || 50 * 1024 * 1024; // 50MB

    this.allowedTypes = options.allowedTypes || [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',

      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-matroska',

      // Audio
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'audio/ogg',
      'audio/aac',

      // JSON / GeoJSON
      'application/json',
      'application/geo+json',
      'text/json',

      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    // memoryStorage: file đi thẳng vào RAM buffer, không chạm disk
    this.upload = multer({
      storage: multer.memoryStorage(),
      fileFilter: this.fileFilter.bind(this),
      limits: { fileSize: this.maxFileSize },
    });

    // Cache dynamic import của file-type
    this._fileTypeFromBuffer = null;
  }

  // =========================
  // MIME type filter (lớp đầu tiên)
  // =========================
  fileFilter(req, file, cb) {
    if (this.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Định dạng file không hợp lệ (chỉ cho phép ảnh, video, audio, JSON, PDF, Word, Excel)'), false);
    }
  }

  // =========================
  // Magic bytes validation (lớp thứ hai — trên buffer)
  // =========================
  async getFileTypeFromBuffer() {
    if (!this._fileTypeFromBuffer) {
      const module = await import('file-type');
      this._fileTypeFromBuffer = module.fileTypeFromBuffer;
    }
    return this._fileTypeFromBuffer;
  }

  async validateBuffer(buffer, expectedMimetype) {
    try {
      const fileTypeFromBuffer = await this.getFileTypeFromBuffer();
      const fileType = await fileTypeFromBuffer(buffer);

      if (!fileType) {
        const jsonTypes = ['application/json', 'application/geo+json', 'text/json'];
        if (expectedMimetype === 'image/svg+xml') {
          return this.validateSVGContent(buffer);
        }
        if (jsonTypes.includes(expectedMimetype)) {
          return this.validateJSONContent(buffer);
        }
        return false;
      }

      return this.allowedTypes.includes(fileType.mime);
    } catch {
      return false;
    }
  }

  validateSVGContent(buffer) {
    const content = buffer.toString('utf8');
    const dangerous = /<script[\s>]|javascript\s*:|on\w+\s*=|<iframe[\s>]|<object[\s>]|<embed[\s>]|data\s*:/i;
    return !dangerous.test(content);
  }

  validateJSONContent(buffer) {
    try {
      const content = buffer.toString('utf8');
      const parsed = JSON.parse(content);
      return this._isSafeObject(parsed);
    } catch {
      return false;
    }
  }

  _isSafeObject(obj, depth = 0) {
    if (depth > 10 || obj === null || typeof obj !== 'object') return true;
    const dangerous = new Set(['__proto__', 'constructor', 'prototype']);
    for (const key of Object.keys(obj)) {
      if (dangerous.has(key)) return false;
      if (!this._isSafeObject(obj[key], depth + 1)) return false;
    }
    return true;
  }

  // =========================
  // Process single file: validate → lưu vào public/uploads
  // =========================
  async processFile(file, { validate, folder }) {
    const [mimeCategory] = file.mimetype.split('/');

    // Kiểm tra size theo loại
    const sizeLimit = FILE_SIZE_LIMITS[mimeCategory] ?? FILE_SIZE_LIMITS['application'];
    if (file.size > sizeLimit) {
      throw new Error(`File vượt quá giới hạn cho phép (${Math.round(sizeLimit / 1024 / 1024)}MB)`);
    }

    // Magic bytes validation trên buffer
    if (validate) {
      const isValid = await this.validateBuffer(file.buffer, file.mimetype);
      if (!isValid) {
        throw new Error('File không hợp lệ hoặc bị giả mạo định dạng');
      }
    }

    const resourceType = RESOURCE_TYPE_MAP[mimeCategory] || 'raw';
    const result = await uploadBufferToStorage(file.buffer, {
      folder: folder || `${mimeCategory}s`,
      mimetype: file.mimetype,
      originalName: file.originalname,
      resource_type: resourceType,
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      fieldname: file.fieldname,
    };
  }

  // =========================
  // Middlewares
  // =========================
  single(field) {
    return this.wrap(this.upload.single(field));
  }

  array(field, maxCount = 10) {
    return this.wrap(this.upload.array(field, maxCount));
  }

  fields(fields) {
    return this.wrap(this.upload.fields(fields));
  }

  wrap(uploadFn) {
    return (req, res, next) => {
      uploadFn(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ success: false, message: err.message });
        }
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }
        next();
      });
    };
  }

  // =========================
  // Process uploaded files (sau multer)
  // =========================
  process(options = {}) {
    const { validate = true, folder } = options;

    return async (req, res, next) => {
      if (!req.file && !req.files) return next();

      const uploadedPublicIds = [];

      try {
        // Single file
        if (req.file) {
          const result = await this.processFile(req.file, { validate, folder });
          req.body[result.fieldname] = result.url;
          uploadedPublicIds.push(result.public_id);
        }

        // Array files
        if (Array.isArray(req.files) && req.files.length > 0) {
          const urls = [];
          for (const file of req.files) {
            const result = await this.processFile(file, { validate, folder });
            urls.push(result.url);
            uploadedPublicIds.push(result.public_id);
          }
          req.body[req.files[0].fieldname] = urls;
        }

        // Fields (multiple named fields)
        if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
          for (const [field, files] of Object.entries(req.files)) {
            const urls = [];
            for (const file of files) {
              const result = await this.processFile(file, { validate, folder });
              urls.push(result.url);
              uploadedPublicIds.push(result.public_id);
            }
            req.body[field] = urls.length === 1 ? urls[0] : urls;
          }
        }

        req.uploadedPublicIds = uploadedPublicIds;
        next();
      } catch (error) {
        // Rollback: xóa các file đã ghi xuống disk, chờ hoàn tất
        await Promise.allSettled(
          uploadedPublicIds.map((id) => deleteFromStorage(id))
        );
        return res.status(400).json({ success: false, message: error.message });
      }
    };
  }

  async deleteFileByUrl(fileUrl) {
    if (!fileUrl) return;
    await deleteOldFile(fileUrl);
  }

  async deleteUploadedFile(fileUrl) {
    return this.deleteFileByUrl(fileUrl);
  }
}

module.exports = new UploadService();
