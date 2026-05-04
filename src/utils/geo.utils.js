/**
 * PostGIS spatial query helpers
 */

/**
 * Tạo ST_MakePoint SQL fragment (parameterized)
 * @param {number} paramLng - Vị trí param cho longitude
 * @param {number} paramLat - Vị trí param cho latitude
 * @returns {string} SQL fragment
 */
const makePointSQL = (paramLng, paramLat) =>
  `ST_SetSRID(ST_MakePoint($${paramLng}, $${paramLat}), 4326)`;

/**
 * Tạo ST_DWithin SQL fragment cho tìm kiếm theo bán kính
 * @param {string} geomColumn - Tên cột geometry
 * @param {number} paramLng - Vị trí param cho longitude
 * @param {number} paramLat - Vị trí param cho latitude
 * @param {number} paramRadius - Vị trí param cho radius (mét)
 * @returns {string} SQL fragment
 */
const dWithinSQL = (geomColumn, paramLng, paramLat, paramRadius) =>
  `ST_DWithin(${geomColumn}::geography, ${makePointSQL(paramLng, paramLat)}::geography, $${paramRadius})`;

/**
 * Tạo ST_Distance SQL fragment
 */
const distanceSQL = (geomColumn, paramLng, paramLat) =>
  `ST_Distance(${geomColumn}::geography, ${makePointSQL(paramLng, paramLat)}::geography)`;

/**
 * Tạo bbox filter SQL fragment
 * @param {string} geomColumn - Tên cột geometry
 * @param {number} paramMinLng - Vị trí param
 * @param {number} paramMinLat
 * @param {number} paramMaxLng
 * @param {number} paramMaxLat
 * @returns {string} SQL fragment
 */
const bboxFilterSQL = (geomColumn, paramMinLng, paramMinLat, paramMaxLng, paramMaxLat) =>
  `${geomColumn} && ST_MakeEnvelope($${paramMinLng}, $${paramMinLat}, $${paramMaxLng}, $${paramMaxLat}, 4326)`;

/**
 * Parse bbox query string "minLng,minLat,maxLng,maxLat" → object
 */
const parseBbox = (bboxStr) => {
  if (!bboxStr) return null;
  const parts = bboxStr.split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  return {
    minLng: parts[0],
    minLat: parts[1],
    maxLng: parts[2],
    maxLat: parts[3],
  };
};

/**
 * Validate lat/lng
 */
const isValidCoords = (lat, lng) => {
  const latN = Number(lat);
  const lngN = Number(lng);
  return !isNaN(latN) && !isNaN(lngN) && latN >= -90 && latN <= 90 && lngN >= -180 && lngN <= 180;
};

/**
 * SQL fragment: Chuyển geometry → GeoJSON
 */
const asGeoJSON = (geomColumn, alias = 'geojson') =>
  `ST_AsGeoJSON(${geomColumn})::jsonb AS ${alias}`;

/**
 * SQL fragment: Lấy toạ độ X (longitude), Y (latitude)
 */
const extractCoords = (geomColumn) =>
  `ST_X(${geomColumn}) AS longitude, ST_Y(${geomColumn}) AS latitude`;

module.exports = {
  makePointSQL,
  dWithinSQL,
  distanceSQL,
  bboxFilterSQL,
  parseBbox,
  isValidCoords,
  asGeoJSON,
  extractCoords,
};
