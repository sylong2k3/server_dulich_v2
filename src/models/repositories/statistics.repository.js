const { query } = require('../../configs/database');

class StatisticsRepository {
  /**
   * Thống kê tổng quan hệ thống
   */
  static async getOverview() {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM tourism_spots WHERE status = 'active') AS total_spots,
        (SELECT COUNT(*) FROM tourism_spots WHERE is_featured = true AND status = 'active') AS featured_spots,
        (SELECT COUNT(*) FROM businesses WHERE status = 'approved') AS total_businesses,
        (SELECT COUNT(*) FROM users WHERE is_active = true) AS total_users,
        (SELECT COUNT(*) FROM ratings WHERE status = 'published') AS total_ratings,
        (SELECT COUNT(*) FROM vlogs WHERE status = 'published') AS total_vlogs,
        (SELECT COUNT(*) FROM festivals WHERE is_published = true) AS total_festivals,
        (SELECT COUNT(*) FROM ocop_products WHERE is_active = true) AS total_ocop_products,
        (SELECT COUNT(*) FROM itineraries) AS total_itineraries
    `;
    const { rows } = await query(sql);
    return rows[0];
  }

  /**
   * Thống kê điểm du lịch theo tỉnh (từ view v_province_stats)
   */
  static async getProvinceStats() {
    const sql = `
      SELECT province_code, province_name,
        spot_count, featured_count, business_count, avg_rating
      FROM v_province_stats
      ORDER BY spot_count DESC
    `;
    const { rows } = await query(sql);
    return rows;
  }

  /**
   * Thống kê theo danh mục điểm du lịch
   */
  static async getSpotsByCategory() {
    const sql = `
      SELECT
        sc.id, sc.code, sc.name_vi, sc.color_hex, sc.icon_url,
        COUNT(ts.id) AS spot_count,
        ROUND(AVG(ts.rating_avg), 2) AS avg_rating
      FROM spot_categories sc
      LEFT JOIN tourism_spots ts ON ts.category_id = sc.id AND ts.status = 'active'
      WHERE sc.is_active = true
      GROUP BY sc.id, sc.code, sc.name_vi, sc.color_hex, sc.icon_url
      ORDER BY spot_count DESC
    `;
    const { rows } = await query(sql);
    return rows;
  }

  /**
   * Thống kê doanh nghiệp theo loại
   */
  static async getBusinessesByType() {
    const sql = `
      SELECT
        business_type,
        COUNT(*) AS count,
        ROUND(AVG(rating_avg), 2) AS avg_rating
      FROM businesses
      WHERE status = 'approved'
      GROUP BY business_type
      ORDER BY count DESC
    `;
    const { rows } = await query(sql);
    return rows;
  }

  /**
   * Top điểm du lịch theo rating
   */
  static async getTopRatedSpots(limit = 10) {
    const sql = `
      SELECT ts.id, ts.name_vi, ts.slug, ts.rating_avg, ts.rating_count,
        sc.name_vi AS category_name, p.name AS province_name
      FROM tourism_spots ts
      LEFT JOIN spot_categories sc ON ts.category_id = sc.id
      LEFT JOIN vn_units.provinces p ON ts.province_code = p.code
      WHERE ts.status = 'active' AND ts.rating_count >= 5
      ORDER BY ts.rating_avg DESC, ts.rating_count DESC
      LIMIT $1
    `;
    const { rows } = await query(sql, [limit]);
    return rows;
  }

  /**
   * Thống kê capacity hiện tại (tổng quan)
   */
  static async getCapacityOverview() {
    const sql = `
      SELECT
        COUNT(*) AS total_monitored,
        COUNT(*) FILTER (WHERE status = 'normal') AS normal_count,
        COUNT(*) FILTER (WHERE status = 'busy') AS busy_count,
        COUNT(*) FILTER (WHERE status = 'near_full') AS near_full_count,
        COUNT(*) FILTER (WHERE status = 'overloaded') AS overloaded_count,
        ROUND(AVG(capacity_pct), 2) AS avg_capacity_pct
      FROM v_current_capacity
    `;
    const { rows } = await query(sql);
    return rows[0];
  }

  /**
   * Thống kê đánh giá theo tháng
   */
  static async getRatingTrends(options = {}) {
    const { months = 12 } = options;
    const sql = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS period,
        COUNT(*) AS rating_count,
        ROUND(AVG(stars), 2) AS avg_stars
      FROM ratings
      WHERE created_at >= NOW() - INTERVAL '${months} months'
        AND status = 'published'
      GROUP BY period
      ORDER BY period ASC
    `;
    const { rows } = await query(sql);
    return rows;
  }

  /**
   * Thống kê bài viết cộng đồng (vlogs)
   */
  static async getVlogStats() {
    const sql = `
      SELECT
        COUNT(*) AS total_vlogs,
        COUNT(*) FILTER (WHERE status = 'published') AS published,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        SUM(view_count) AS total_views,
        SUM(like_count) AS total_likes,
        SUM(comment_count) AS total_comments
      FROM vlogs
    `;
    const { rows } = await query(sql);
    return rows[0];
  }
}

module.exports = StatisticsRepository;
