// validators/common/file.schemas.js
const Joi = require('joi');
const patterns = require('./patterns');

/* ===================== Web Paths for Multer Files ===================== */
const WebPath = Joi.string().pattern(patterns.uploadsWebPath, 'uploads web path');
const WebPathArray = Joi.array().items(WebPath).min(0);

module.exports = {
  WebPath,
  WebPathArray
};
