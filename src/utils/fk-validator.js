/**
 * FK Validator — kiểm tra tính tồn tại của các foreign key trước khi INSERT/UPDATE.
 *
 * Mục tiêu:
 *  - Trả về lỗi 400 rõ ràng thay vì để DB throw FK constraint violation (500)
 *  - Dùng câu SELECT tối giản (SELECT 1) để không ảnh hưởng hiệu năng
 *  - Bỏ qua khi giá trị là undefined / null (optional FK)
 *
 * Cách dùng trong service:
 *   await FKValidator.spotCategory(data.category_id);
 *   await FKValidator.province(data.province_code);
 *   await FKValidator.ward(data.ward_code);
 */

const { query } = require('../configs/database');
const { Api400Error } = require('../core/error.response');

class FKValidator {
  // ─── Spot Category ─────────────────────────────────────────────────────────

  /**
   * Kiểm tra category_id tồn tại trong bảng spot_categories.
   * @param {number|null|undefined} categoryId
   */
  static async spotCategory(categoryId) {
    if (categoryId == null) return;
    const { rows } = await query(
      'SELECT 1 FROM spot_categories WHERE id = $1 LIMIT 1',
      [categoryId]
    );
    if (!rows.length) {
      throw new Api400Error(`Danh mục điểm du lịch không tồn tại (id = ${categoryId})`);
    }
  }

  // ─── Province ──────────────────────────────────────────────────────────────

  /**
   * Kiểm tra province_code tồn tại trong vn_units.provinces.
   * @param {string|null|undefined} provinceCode
   */
  static async province(provinceCode) {
    if (!provinceCode) return;
    const { rows } = await query(
      'SELECT 1 FROM vn_units.provinces WHERE code = $1 LIMIT 1',
      [provinceCode]
    );
    if (!rows.length) {
      throw new Api400Error(`Tỉnh/thành phố không tồn tại (code = "${provinceCode}")`);
    }
  }

  // ─── Ward ──────────────────────────────────────────────────────────────────

  /**
   * Kiểm tra ward_code tồn tại trong vn_units.wards.
   * Nếu truyền thêm provinceCode, kiểm tra ward phải thuộc đúng tỉnh.
   * @param {string|null|undefined} wardCode
   * @param {string|null|undefined} provinceCode - optional, để cross-validate
   */
  static async ward(wardCode, provinceCode = null) {
    if (!wardCode) return;

    if (provinceCode) {
      const { rows } = await query(
        'SELECT 1 FROM vn_units.wards WHERE code = $1 AND province_code = $2 LIMIT 1',
        [wardCode, provinceCode]
      );
      if (!rows.length) {
        throw new Api400Error(
          `Phường/xã không tồn tại hoặc không thuộc tỉnh này (ward_code = "${wardCode}")`
        );
      }
    } else {
      const { rows } = await query(
        'SELECT 1 FROM vn_units.wards WHERE code = $1 LIMIT 1',
        [wardCode]
      );
      if (!rows.length) {
        throw new Api400Error(`Phường/xã không tồn tại (ward_code = "${wardCode}")`);
      }
    }
  }

  // ─── Business ──────────────────────────────────────────────────────────────

  /**
   * Kiểm tra business_id tồn tại trong bảng businesses.
   * @param {string|null|undefined} businessId - UUID
   * @param {string} [statusRequired] - nếu truyền vào, chỉ chấp nhận business có đúng status này
   */
  static async business(businessId, statusRequired = null) {
    if (!businessId) return;

    let sql = 'SELECT status FROM businesses WHERE id = $1 LIMIT 1';
    const { rows } = await query(sql, [businessId]);

    if (!rows.length) {
      throw new Api400Error(`Doanh nghiệp không tồn tại (id = "${businessId}")`);
    }

    if (statusRequired && rows[0].status !== statusRequired) {
      throw new Api400Error(
        `Doanh nghiệp chưa được phê duyệt (trạng thái hiện tại: "${rows[0].status}")`
      );
    }
  }

  // ─── Spot ──────────────────────────────────────────────────────────────────

  /**
   * Kiểm tra spot_id tồn tại trong bảng tourism_spots.
   * @param {string|null|undefined} spotId - UUID
   */
  static async spot(spotId) {
    if (!spotId) return;
    const { rows } = await query(
      "SELECT 1 FROM tourism_spots WHERE id = $1 AND status != 'deleted' LIMIT 1",
      [spotId]
    );
    if (!rows.length) {
      throw new Api400Error(`Điểm du lịch không tồn tại (id = "${spotId}")`);
    }
  }

  // ─── Batch helper ──────────────────────────────────────────────────────────

  /**
   * Chạy nhiều kiểm tra song song (không phụ thuộc nhau).
   * Ném lỗi đầu tiên nếu có.
   * @param {Array<Promise>} checks - mảng các Promise từ các static method trên
   */
  static async all(checks) {
    await Promise.all(checks);
  }
}

module.exports = FKValidator;
