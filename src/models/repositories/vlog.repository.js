const db = require('../../configs/database');

class VlogRepository {
    static async findAll({ page = 1, limit = 12, search, platform, user_id, sortBy = 'created_at', sortOrder = 'DESC' }) {
        const offset = (page - 1) * limit;
        const params = [];
        const conditions = [`v.status = 'published'`];
        let idx = 1;

        if (platform) { conditions.push(`v.platform = $${idx++}`); params.push(platform); }
        if (user_id) { conditions.push(`v.user_id = $${idx++}`); params.push(user_id); }
        if (search) { conditions.push(`(v.title ILIKE $${idx} OR v.excerpt ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

        const allowed = ['title', 'view_count', 'like_count', 'created_at'];
        const col = allowed.includes(sortBy) ? sortBy : 'created_at';
        const dir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const sql = `
            SELECT v.id, v.title, v.excerpt, v.cover_image_url, v.view_count, v.like_count,
                   v.comment_count, v.save_count, v.status, v.platform,
                   v.user_id, v.spot_id, v.province_code, v.created_at,
                   u.full_name AS author_name, u.avatar_url AS author_avatar,
                   COUNT(*) OVER() AS total_count
            FROM vlogs v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY v.${col} ${dir}
            LIMIT $${idx++} OFFSET $${idx++}
        `;
        params.push(limit, offset);
        const result = await db.query(sql, params);
        return { rows: result.rows, total: parseInt(result.rows[0]?.total_count || 0) };
    }

    static async findAllAdmin({ page = 1, limit = 12, search, status, user_id, sortBy = 'created_at', sortOrder = 'DESC' }) {
        const offset = (page - 1) * limit;
        const params = [];
        const conditions = [];
        let idx = 1;

        if (status) { conditions.push(`v.status = $${idx++}`); params.push(status); }
        if (user_id) { conditions.push(`v.user_id = $${idx++}`); params.push(user_id); }
        if (search) { conditions.push(`(v.title ILIKE $${idx} OR v.excerpt ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

        const allowed = ['title', 'view_count', 'like_count', 'created_at', 'status'];
        const col = allowed.includes(sortBy) ? sortBy : 'created_at';
        const dir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT v.*, u.full_name AS author_name, u.avatar_url AS author_avatar,
                   COUNT(*) OVER() AS total_count
            FROM vlogs v
            LEFT JOIN users u ON v.user_id = u.id
            ${where}
            ORDER BY v.${col} ${dir}
            LIMIT $${idx++} OFFSET $${idx++}
        `;
        params.push(limit, offset);
        const result = await db.query(sql, params);
        return { rows: result.rows, total: parseInt(result.rows[0]?.total_count || 0) };
    }

    static async findById(id) {
        const sql = `
            SELECT v.*, u.full_name AS author_name, u.avatar_url AS author_avatar,
                   ST_X(v.geom::geometry) AS lng, ST_Y(v.geom::geometry) AS lat,
                   mod.full_name AS moderated_by_name
            FROM vlogs v
            LEFT JOIN users u ON v.user_id = u.id
            LEFT JOIN users mod ON v.moderated_by = mod.id
            WHERE v.id = $1
        `;
        const result = await db.query(sql, [id]);
        return result.rows[0] || null;
    }

    // NV-43: Tạo vlog với đầy đủ fields, status=pending
    static async create(data) {
        const hasGeom = data.lng != null && data.lat != null;
        const sql = `
            INSERT INTO vlogs (
                user_id, title, excerpt, content,
                cover_image_url, media_urls, video_url, video_duration_sec,
                platform, spot_id, province_code,
                ${hasGeom ? 'geom,' : ''}
                status, view_count, like_count, comment_count, save_count
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
                ${hasGeom ? `ST_SetSRID(ST_MakePoint($12,$13),4326),` : ''}
                $${hasGeom ? 14 : 12},$${hasGeom ? 15 : 13},$${hasGeom ? 16 : 14},$${hasGeom ? 17 : 15},$${hasGeom ? 18 : 16},$${hasGeom ? 19 : 17}
            ) RETURNING *
        `;
        const base = [
            data.user_id, data.title, data.excerpt || null, data.content || null,
            data.cover_image_url || null, data.media_urls || null,
            data.video_url || null, data.video_duration_sec || null,
            data.platform || 'web', data.spot_id || null, data.province_code || null,
        ];
        const geomValues = hasGeom ? [data.lng, data.lat] : [];
        const result = await db.query(sql, [...base, ...geomValues, 'pending', 0, 0, 0, 0]);
        return result.rows[0];
    }

    static async update(id, fields) {
        const allowed = ['title', 'excerpt', 'content', 'cover_image_url', 'media_urls',
            'video_url', 'video_duration_sec', 'platform', 'spot_id', 'province_code',
            'status', 'moderated_by', 'moderated_at', 'rejection_note'];
        const sets = []; const params = []; let idx = 1;
        for (const key of allowed) {
            if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); params.push(fields[key]); }
        }
        if (fields.lng != null && fields.lat != null) {
            sets.push(`geom = ST_SetSRID(ST_MakePoint($${idx++},$${idx++}),4326)`);
            params.push(fields.lng, fields.lat);
        }
        if (!sets.length) return null;
        sets.push('updated_at = NOW()');
        params.push(id);
        const result = await db.query(`UPDATE vlogs SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, params);
        return result.rows[0] || null;
    }

    // NV-44: Kiểm duyệt vlog
    static async moderate(id, { status, moderated_by, rejection_note }) {
        const sql = `
            UPDATE vlogs SET
                status = $1,
                moderated_by = $2,
                moderated_at = NOW(),
                rejection_note = $3,
                updated_at = NOW()
            WHERE id = $4
            RETURNING *
        `;
        const result = await db.query(sql, [status, moderated_by, rejection_note || null, id]);
        return result.rows[0] || null;
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM vlogs WHERE id = $1 RETURNING id', [id]);
        return result.rows[0] || null;
    }

    static async incrementViewCount(id) {
        await db.query('UPDATE vlogs SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1', [id]);
    }

    // NV-45: Like idempotent
    static async addLike(userId, vlogId) {
        const inserted = await db.query(
            `INSERT INTO vlog_likes (user_id, vlog_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, vlog_id) DO NOTHING
             RETURNING id`,
            [userId, vlogId]
        );
        if (inserted.rows.length) {
            const result = await db.query(
                'UPDATE vlogs SET like_count = COALESCE(like_count, 0) + 1 WHERE id = $1 RETURNING like_count',
                [vlogId]
            );
            return { liked: true, like_count: result.rows[0]?.like_count || 0 };
        }
        const result = await db.query('SELECT like_count FROM vlogs WHERE id = $1', [vlogId]);
        return { liked: true, like_count: result.rows[0]?.like_count || 0 };
    }

    static async removeLike(userId, vlogId) {
        const deleted = await db.query(
            'DELETE FROM vlog_likes WHERE user_id = $1 AND vlog_id = $2 RETURNING id',
            [userId, vlogId]
        );
        if (deleted.rows.length) {
            const result = await db.query(
                'UPDATE vlogs SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = $1 RETURNING like_count',
                [vlogId]
            );
            return { liked: false, like_count: result.rows[0]?.like_count || 0 };
        }
        const result = await db.query('SELECT like_count FROM vlogs WHERE id = $1', [vlogId]);
        return { liked: false, like_count: result.rows[0]?.like_count || 0 };
    }

    // ==================== NV-45: COMMENTS ====================

    static async findCommentsByVlogId(vlogId, { page = 1, limit = 20 }) {
        const offset = (page - 1) * limit;
        // Lấy root comments + replies trong một lần query
        const sql = `
            WITH roots AS (
                SELECT c.*, u.full_name AS author_name, u.avatar_url AS author_avatar,
                       COUNT(*) OVER() AS total_count
                FROM vlog_comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.vlog_id = $1 AND c.parent_id IS NULL
                ORDER BY c.created_at ASC
                LIMIT $2 OFFSET $3
            ),
            replies AS (
                SELECT c.*, u.full_name AS author_name, u.avatar_url AS author_avatar,
                       NULL::bigint AS total_count
                FROM vlog_comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.vlog_id = $1 AND c.parent_id IN (SELECT id FROM roots)
                ORDER BY c.created_at ASC
            )
            SELECT * FROM roots UNION ALL SELECT * FROM replies
        `;
        const result = await db.query(sql, [vlogId, limit, offset]);
        const total = parseInt(result.rows.find(r => r.parent_id === null)?.total_count || 0);

        // Nhóm replies vào root
        const roots = result.rows.filter(r => r.parent_id === null);
        const repliesMap = {};
        result.rows.filter(r => r.parent_id !== null).forEach(r => {
            if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = [];
            repliesMap[r.parent_id].push(r);
        });
        roots.forEach(r => { r.replies = repliesMap[r.id] || []; });

        return { rows: roots, total };
    }

    static async findCommentById(id) {
        const result = await db.query('SELECT * FROM vlog_comments WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async createComment({ vlog_id, user_id, parent_id, content }) {
        const sql = `
            INSERT INTO vlog_comments (vlog_id, user_id, parent_id, content)
            VALUES ($1,$2,$3,$4) RETURNING *
        `;
        const result = await db.query(sql, [vlog_id, user_id, parent_id || null, content]);
        await db.query('UPDATE vlogs SET comment_count = COALESCE(comment_count,0)+1 WHERE id=$1', [vlog_id]);
        return result.rows[0];
    }

    static async deleteComment(id, vlogId) {
        const result = await db.query(
            `WITH RECURSIVE comment_tree AS (
                SELECT id
                FROM vlog_comments
                WHERE id = $1 AND vlog_id = $2
                UNION ALL
                SELECT c.id
                FROM vlog_comments c
                JOIN comment_tree t ON c.parent_id = t.id
            )
            DELETE FROM vlog_comments vc
            USING comment_tree t
            WHERE vc.id = t.id
            RETURNING vc.id`,
            [id, vlogId]
        );

        if (result.rowCount > 0) {
            await db.query(
                'UPDATE vlogs SET comment_count = GREATEST(COALESCE(comment_count,0)-$1,0) WHERE id=$2',
                [result.rowCount, vlogId]
            );
        }
        return result.rowCount > 0 ? { deleted_count: result.rowCount } : null;
    }

    // ==================== NV-45: SAVE ====================

    static async addSave(userId, vlogId) {
        const existing = await db.query(
            'SELECT id FROM user_saves WHERE user_id=$1 AND vlog_id=$2',
            [userId, vlogId]
        );
        if (!existing.rows.length) {
            await db.query('INSERT INTO user_saves(user_id,vlog_id,category) VALUES($1,$2,$3)', [userId, vlogId, 'vlog']);
            await db.query('UPDATE vlogs SET save_count=COALESCE(save_count,0)+1 WHERE id=$1', [vlogId]);
        }
        return { saved: true };
    }

    static async removeSave(userId, vlogId) {
        const deleted = await db.query(
            'DELETE FROM user_saves WHERE user_id=$1 AND vlog_id=$2 RETURNING id',
            [userId, vlogId]
        );
        if (deleted.rows.length) {
            await db.query('UPDATE vlogs SET save_count=GREATEST(COALESCE(save_count,0)-1,0) WHERE id=$1', [vlogId]);
        }
        return { saved: false };
    }

    static async getSavedByUser(userId, { page = 1, limit = 12 }) {
        const offset = (page - 1) * limit;
        const sql = `
            SELECT v.id, v.title, v.excerpt, v.cover_image_url, v.view_count, v.like_count,
                   v.comment_count, v.save_count, v.created_at,
                   u.full_name AS author_name, us.created_at AS saved_at,
                   COUNT(*) OVER() AS total_count
            FROM user_saves us
            JOIN vlogs v ON v.id = us.vlog_id
            LEFT JOIN users u ON v.user_id = u.id
            WHERE us.user_id = $1 AND v.status = 'published'
            ORDER BY us.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await db.query(sql, [userId, limit, offset]);
        return { rows: result.rows, total: parseInt(result.rows[0]?.total_count || 0) };
    }
}

module.exports = VlogRepository;
