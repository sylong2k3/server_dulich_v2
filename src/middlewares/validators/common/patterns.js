// Các regex pattern dùng chung
module.exports = {
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  uploadsWebPath: /^\/?uploads\/[A-Za-z0-9._\-\/]+$/,
  uploadsFileName: /^[A-Za-z0-9._-]+\.[A-Za-z0-9]{1,6}$/,
  dateYYYYMMDD: /^\d{4}-\d{2}-\d{2}$/,
  hhmm: /^([01]\d|2[0-3]):[0-5]\d$/,
  phone: /^[0-9+\-\s\(\)]{10,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/,
  configKey: /^[a-zA-Z0-9._-]+$/,
};
