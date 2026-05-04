const { query, getClient } = require('../configs/database');

// Whitelist pattern: chỉ cho phép tên bảng/cột hợp lệ (chữ, số, underscore)
const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

function assertValidIdentifier(name, label = 'identifier') {
  if (!name || !VALID_IDENTIFIER.test(name)) {
    throw new Error(`Invalid ${label}: "${name}". Only letters, digits, underscores and dots are allowed.`);
  }
}

function assertValidIdentifiers(names, label = 'identifier') {
  names.forEach(n => assertValidIdentifier(n, label));
}

const withTransaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const findById = async (tableName, id, idColumn = 'id') => {
  assertValidIdentifier(tableName, 'table name');
  assertValidIdentifier(idColumn, 'column name');
  const result = await query(`SELECT * FROM ${tableName} WHERE ${idColumn} = $1`, [id]);
  return result.rows[0] || null;
};

const findAll = async (tableName, conditions = {}, orderBy = null, limit = null, offset = null) => {
  assertValidIdentifier(tableName, 'table name');
  const conditionKeys = Object.keys(conditions);
  if (conditionKeys.length > 0) assertValidIdentifiers(conditionKeys, 'column name');
  let queryText = `SELECT * FROM ${tableName}`;
  const values = [];
  let paramIndex = 1;

  // Thêm WHERE clause
  if (conditionKeys.length > 0) {
    const whereClause = conditionKeys.map(key => {
      values.push(conditions[key]);
      return `${key} = $${paramIndex++}`;
    }).join(' AND ');
    queryText += ` WHERE ${whereClause}`;
  }

  // Thêm ORDER BY
  if (orderBy) {
    // Chỉ cho phép dạng "col ASC" hoặc "col DESC" (loại bỏ SQL injection)
    const orderParts = orderBy.split(',').map(p => p.trim());
    orderParts.forEach(part => {
      const tokens = part.split(/\s+/);
      assertValidIdentifier(tokens[0], 'orderBy column');
      if (tokens[1] && !['ASC', 'DESC'].includes(tokens[1].toUpperCase())) {
        throw new Error(`Invalid ORDER BY direction: "${tokens[1]}"`);
      }
    });
    queryText += ` ORDER BY ${orderBy}`;
  }

  // Thêm LIMIT
  if (limit) {
    queryText += ` LIMIT $${paramIndex++}`;
    values.push(limit);
  }

  // Thêm OFFSET
  if (offset) {
    queryText += ` OFFSET $${paramIndex++}`;
    values.push(offset);
  }

  const result = await query(queryText, values);
  return result.rows;
};

const create = async (tableName, data) => {
  assertValidIdentifier(tableName, 'table name');
  const columns = Object.keys(data);
  assertValidIdentifiers(columns, 'column name');
  const values = [];
  const placeholders = [];

  columns.forEach((col) => {
    const value = data[col];
    let paramIndex = values.length + 1;

    // Xử lý geometry
    if (col === "geometry") {
      if (typeof value === "string") {
        if (value.trim().startsWith("{")) {
          placeholders.push(`ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326)`);
          values.push(value);
        } else if (
          value.startsWith("POINT") ||
          value.startsWith("POLYGON") ||
          value.startsWith("LINESTRING")
        ) {
          // WKT format
          placeholders.push(`ST_SetSRID(ST_GeomFromText($${paramIndex}, 4326), 4326)`);
          values.push(value);
        } else {
          placeholders.push(`$${paramIndex}`);
          values.push(value);
        }
      } else if (typeof value === "object" && value !== null) {
        // GeoJSON object
        placeholders.push(`ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326)`);
        values.push(JSON.stringify(value));
      } else {
        placeholders.push(`$${paramIndex}`);
        values.push(value);
      }
    }

    // Xử lý JSONB (không ép kiểu với Array để PG tự map sang kiểu mảng như text[])
    else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      placeholders.push(`$${paramIndex}::jsonb`);
      values.push(JSON.stringify(value));
    }

    // Trường thông thường
    else {
      placeholders.push(`$${paramIndex}`);
      values.push(value);
    }
  });

  const queryText = `
    INSERT INTO ${tableName} (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
    RETURNING *
  `;

  const result = await query(queryText, values);
  return result.rows[0];
};

// =========================
//  UPDATE BY ID
// =========================
const updateById = async (tableName, id, data, idColumn = "id") => {
  assertValidIdentifier(tableName, 'table name');
  assertValidIdentifier(idColumn, 'column name');
  const columns = Object.keys(data);
  assertValidIdentifiers(columns, 'column name');
  const values = [];
  const setClauses = [];

  columns.forEach((col) => {
    const value = data[col];
    if (value === undefined) return; // Cho phép NULL (chỉ bỏ qua undefined)

    let paramIndex = values.length + 1;

    // Xử lý geometry
    if (col === "geometry") {
      if (typeof value === "string") {
        if (value.trim().startsWith("{")) {
          // GeoJSON format
          setClauses.push(`${col} = ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326)`);
          values.push(value);
        } else if (
          value.startsWith("POINT") ||
          value.startsWith("POLYGON") ||
          value.startsWith("LINESTRING")
        ) {
          // WKT format
          setClauses.push(`${col} = ST_SetSRID(ST_GeomFromText($${paramIndex}, 4326), 4326)`);
          values.push(value);
        } else {
          setClauses.push(`${col} = $${paramIndex}`);
          values.push(value);
        }
      } else if (typeof value === "object" && value !== null) {
        // GeoJSON object
        setClauses.push(`${col} = ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326)`);
        values.push(JSON.stringify(value));
      } else {
        setClauses.push(`${col} = $${paramIndex}`);
        values.push(value);
      }
    }

    // Xử lý JSONB (không ép kiểu với Array để PG tự map sang kiểu mảng như text[])
    else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      setClauses.push(`${col} = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(value));
    }

    // Trường thông thường
    else {
      setClauses.push(`${col} = $${paramIndex}`);
      values.push(value);
    }
  });

  if (setClauses.length === 0) {
    throw new Error(`No valid fields to update in "${tableName}" (all values were undefined)`);
  }

  values.push(id);

  const queryText = `
    UPDATE ${tableName}
    SET ${setClauses.join(", ")}
    WHERE ${idColumn} = $${values.length}
    RETURNING *
  `;

  const result = await query(queryText, values);
  return result.rows[0];
};

const deleteById = async (tableName, id, idColumn = 'id') => {
  assertValidIdentifier(tableName, 'table name');
  assertValidIdentifier(idColumn, 'column name');
  const queryText = `DELETE FROM ${tableName} WHERE ${idColumn} = $1`;
  const result = await query(queryText, [id]);
  return result.rowCount > 0;
};

const count = async (tableName, conditions = {}) => {
  assertValidIdentifier(tableName, 'table name');
  const conditionKeys = Object.keys(conditions);
  if (conditionKeys.length > 0) assertValidIdentifiers(conditionKeys, 'column name');
  let queryText = `SELECT COUNT(*) as count FROM ${tableName}`;
  const values = [];
  let paramIndex = 1;

  if (conditionKeys.length > 0) {
    const whereClause = conditionKeys.map(key => {
      values.push(conditions[key]);
      return `${key} = $${paramIndex++}`;
    }).join(' AND ');
    queryText += ` WHERE ${whereClause}`;
  }

  const result = await query(queryText, values);
  return parseInt(result.rows[0].count);
};

const exists = async (tableName, columnNameOrConditions, value = undefined) => {
  let conditions;

  if (typeof columnNameOrConditions === 'string' && value !== undefined) {
    conditions = { [columnNameOrConditions]: value };
  }
  else if (typeof columnNameOrConditions === 'object') {
    conditions = columnNameOrConditions;
  }
  else {
    throw new Error('Invalid parameters for exists function');
  }

  const result = await count(tableName, conditions);
  return result > 0;
};

const getCountByField = async (tableName, field, value) => {
  assertValidIdentifier(tableName, 'table name');
  assertValidIdentifier(field, 'column name');
  const sql = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${field} = $1`;
  const { rows } = await query(sql, [value]);
  return parseInt(rows[0].count);
};

module.exports = {
  withTransaction,
  findById,
  findAll,
  create,
  updateById,
  deleteById,
  count,
  exists,
  getCountByField
};