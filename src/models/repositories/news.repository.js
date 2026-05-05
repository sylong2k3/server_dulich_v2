const db = require('../../configs/database');

class NewsRepository {
  static async findAll({ page = 1, limit = 10, search, is_published, is_featured, tag, sortBy = 'created_at', sortOrder = 'DESC' }) {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    let idx = 1;

    if (is_published !== undefined) { conditions.push(`n.is_published = $${idx++}`); params.push(is_published); }
    if (is_featured !== undefined) { conditions.push(`n.is_featured = $${idx++}`); params.push(is_featured); }
    if (search) {
      conditions.push(`n.search_vector @@ plainto_tsquery('simple', $${idx++})`);
      params.push(search);
    }
    if (tag) { conditions.push(`n.tags @> $${idx++}::jsonb`); params.push(JSON.stringify([tag])); }

    const allowed = ['id', 'title', 'view_count', 'published_at', 'created_at', 'updated_at'];
    const col = allowed.includes(sortBy) ? sortBy : 'created_at';
    const dir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT n.id, n.title, n.slug, n.author_name, n.summary, n.thumbnail_url,
             n.is_published, n.is_featured, n.published_at, n.tags,
             n.view_count, n.created_at, n.updated_at,
             COUNT(*) OVER() AS total_count
      FROM news n
      ${where}
      ORDER BY n.${col} ${dir}
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const result = await db.query(sql, params);
    return { rows: result.rows, total: parseInt(result.rows[0]?.total_count || 0) };
  }

  static async findBySlug(slug) {
    const sql = `
      SELECT n.*, u.full_name AS author_full_name
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.slug = $1
    `;
    const result = await db.query(sql, [slug]);
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM news WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create(data) {
    const { title, slug, author_id, author_name, summary, content, thumbnail_url, is_published, is_featured, published_at, tags } = data;
    const sql = `
      INSERT INTO news (title, slug, author_id, author_name, summary, content, thumbnail_url,
                        is_published, is_featured, published_at, tags, view_count)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0)
      RETURNING *
    `;
    const result = await db.query(sql, [
      title, slug, author_id || null, author_name || null, summary || null,
      content, thumbnail_url || null, is_published ?? false,
      is_featured ?? false, published_at || null, JSON.stringify(tags || []),
    ]);
    return result.rows[0];
  }

  static async update(id, fields) {
    const allowed = ['title', 'slug', 'author_name', 'summary', 'content', 'thumbnail_url',
      'is_published', 'is_featured', 'published_at', 'tags'];
    const sets = [];
    const params = [];
    let idx = 1;
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = $${idx++}`);
        params.push(key === 'tags' ? JSON.stringify(fields[key] || []) : fields[key]);
      }
    }
    if (!sets.length) return null;
    sets.push(`updated_at = NOW()`);
    params.push(id);
    const sql = `UPDATE news SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(sql, params);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM news WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  }

  static async incrementViewCount(id) {
    await db.query('UPDATE news SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1', [id]);
  }

  // Batch flush: cộng dồn delta thay vì gọi từng +1, tránh hot-path DB write
  static async batchIncrementViewCount(id, delta) {
    if (!delta || delta <= 0) return;
    await db.query(
      'UPDATE news SET view_count = COALESCE(view_count, 0) + $2 WHERE id = $1',
      [id, delta],
    );
  }

  static async slugExists(slug, excludeId = null) {
    const sql = excludeId
      ? 'SELECT id FROM news WHERE slug = $1 AND id != $2'
      : 'SELECT id FROM news WHERE slug = $1';
    const result = await db.query(sql, excludeId ? [slug, excludeId] : [slug]);
    return result.rows.length > 0;
  }

  // ---- Comments ----

  // NV-47: Lấy root comments + replies trong 1 query
  static async findCommentsByNewsId(newsId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const rootSql = `
      SELECT c.*, u.full_name AS author_full_name, u.avatar_url AS author_avatar,
             COUNT(*) OVER() AS total_count
      FROM news_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.news_id = $1 AND c.parent_comment_id IS NULL AND c.is_approved = true
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    const rootResult = await db.query(rootSql, [newsId, limit, offset]);
    const total = parseInt(rootResult.rows[0]?.total_count || 0);

    if (!rootResult.rows.length) return { rows: [], total };

    // Lấy replies cho các root comments đã load
    const rootIds = rootResult.rows.map(r => r.id);
    const replySql = `
      SELECT c.*, u.full_name AS author_full_name, u.avatar_url AS author_avatar
      FROM news_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.news_id = $1 AND c.parent_comment_id = ANY($2::uuid[]) AND c.is_approved = true
      ORDER BY c.created_at ASC
    `;
    const replyResult = await db.query(replySql, [newsId, rootIds]);

    const repliesMap = {};
    replyResult.rows.forEach(r => {
      if (!repliesMap[r.parent_comment_id]) repliesMap[r.parent_comment_id] = [];
      repliesMap[r.parent_comment_id].push(r);
    });

    const roots = rootResult.rows.map(r => ({ ...r, replies: repliesMap[r.id] || [] }));
    return { rows: roots, total };
  }

  static async findCommentById(id) {
    const result = await db.query('SELECT * FROM news_comments WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async createComment({ news_id, user_id, parent_comment_id, content, user_name, user_email }) {
    const sql = `
      INSERT INTO news_comments (news_id, user_id, parent_comment_id, content, user_name, user_email, is_approved)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `;
    // Tự động duyệt nếu là user đã đăng nhập
    const isApproved = !!user_id;
    const result = await db.query(sql, [
      news_id, user_id || null, parent_comment_id || null,
      content, user_name || null, user_email || null, isApproved,
    ]);
    return result.rows[0];
  }

  static async updateComment(id, { content }) {
    const result = await db.query(
      'UPDATE news_comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [content, id]
    );
    return result.rows[0] || null;
  }

  static async deleteComment(id) {
    const result = await db.query('DELETE FROM news_comments WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  }

  static async setCommentApproval(id, isApproved) {
    const result = await db.query(
      'UPDATE news_comments SET is_approved = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [isApproved, id]
    );
    return result.rows[0] || null;
  }
}

module.exports = NewsRepository;
