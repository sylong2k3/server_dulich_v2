const SpotRepository = require('../models/repositories/spot.repository');
const { Api404Error, Api409Error, Api400Error, Api403Error } = require('../core/error.response');
const FKValidator = require('../utils/fk-validator');
const { formatPagination } = require('../utils/responseFormatter');
const { uploadBufferToStorage, deleteFromStorage, extractPublicId } = require('../configs/localStorage');
const { cacheOrFetch, invalidateByPrefix } = require('../utils/cache.utils');
const { isValidCoords, parseBbox } = require('../utils/geo.utils');
const QRCode = require('qrcode');

// Các role được bypass ownership check (quản lý nội dung toàn hệ thống)
const BYPASS_ROLES = new Set(['system_admin', 'department_manager']);

class SpotService {
  /**
   * Kiểm tra quyền sở hữu: system_admin / department_manager bypass toàn bộ.
   * Các role khác phải là người tạo ra spot (created_by).
   */
  _assertOwnerOrAdmin(spot, user) {
    const roleCode = String(user?.role?.code || '').toLowerCase();
    if (BYPASS_ROLES.has(roleCode)) return; // Admin / Sở VH-TT bypass
    if (!spot.created_by || spot.created_by !== user?.id) {
      throw new Api403Error('Bạn không có quyền chỉnh sửa điểm du lịch này');
    }
  }

  /**
   * Tạo slug từ tên tiếng Việt
   */
  _generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async getAllSpots(options = {}, viewer = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 20));
    const status = this._canManage(viewer?.user) ? options.status : 'active';
    const effectiveOptions = { ...options, status, page, limit };
    const cacheKey = `spots:list:${JSON.stringify(effectiveOptions)}`;
    return cacheOrFetch(cacheKey, async () => {
      const { spots, totalCount } = await SpotRepository.getAllSpots(effectiveOptions);
      const result = formatPagination(spots, totalCount, page, limit);
      return { spots: result.data, pagination: result.pagination };
    }, 60);
  }

  async getNearbySpots(lat, lng, radiusKm = 10, limit = 50) {
    if (!isValidCoords(lat, lng)) {
      throw new Api400Error('Toạ độ lat/lng không hợp lệ');
    }
    return SpotRepository.findNearby(Number(lat), Number(lng), Number(radiusKm), Number(limit));
  }

  async getSpotsByBbox(bboxStr, limit = 500) {
    const bbox = parseBbox(bboxStr);
    if (!bbox) {
      throw new Api400Error('Bbox không hợp lệ. Định dạng: minLng,minLat,maxLng,maxLat');
    }
    return SpotRepository.findByBbox(bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat, Number(limit));
  }

  async getSpotsGeoJSON(options = {}) {
    const cacheKey = `spots:geojson:${options.category_id || 'all'}:${options.province_code || 'all'}`;
    return cacheOrFetch(cacheKey, () => SpotRepository.getGeoJSON(options), 300);
  }

  async getFeaturedSpots(limit = 12, categoryIds) {
    const cacheKey = categoryIds ? `spots:featured:cats${JSON.stringify(categoryIds)}` : 'spots:featured';
    return cacheOrFetch(cacheKey, () => SpotRepository.getFeaturedSpots(limit, categoryIds), 300);
  }

  /**
   * HIGH-08 FIX: Cache spot detail by slug — highest-traffic public endpoint
   * Cache hit = 0 DB queries; cache miss = 1 query then cached for 60s
   */
  async getSpotBySlug(slug, viewer = {}) {
    return cacheOrFetch(`spot:slug:${slug}:${this._canManage(viewer?.user) ? 'manage' : 'public'}`, async () => {
      const spot = await SpotRepository.findBySlug(slug);
      if (!spot || (spot.status !== 'active' && !this._canManage(viewer?.user))) {
        throw new Api404Error('Spot not found');
      }
      return spot;
    }, 60);
  }

  async getSpotById(id, viewer = {}) {
    return cacheOrFetch(`spot:id:${id}:${this._canManage(viewer?.user) ? 'manage' : 'public'}`, async () => {
      const spot = await SpotRepository.findById(id);
      if (!spot || (spot.status !== 'active' && !this._canManage(viewer?.user))) throw new Api404Error('Điểm du lịch không tồn tại');
      return spot;
    }, 60);
  }

  // Gọi từ rating service sau khi tạo/xóa rating
  async recalculateRating(spotId) {
    const result = await SpotRepository.updateRatingStats(spotId);
    invalidateByPrefix('spots:');
    return result;
  }

  async createSpot(data) {
    // Kiểm tra FK tồn tại trước khi tạo (trả lỗi 400 rõ ràng thay vì 500 từ DB)
    await FKValidator.all([
      FKValidator.spotCategory(data.category_id),
      FKValidator.province(data.province_code),
      FKValidator.ward(data.ward_code, data.province_code),
    ]);

    // Tạo slug nếu chưa có
    if (!data.slug) {
      data.slug = this._generateSlug(data.name_vi);
      // Đảm bảo slug unique
      let slugBase = data.slug;
      let counter = 1;
      while (await SpotRepository.existsBySlug(data.slug)) {
        data.slug = `${slugBase}-${counter}`;
        counter++;
      }
    } else {
      if (await SpotRepository.existsBySlug(data.slug)) {
        throw new Api409Error('Slug đã tồn tại');
      }
    }

    const spot = await SpotRepository.createSpot(data);

    // Sinh QR code trỏ đến trang chi tiết điểm DL
    this._generateAndSaveQrCode(spot.id, spot.slug).catch(() => { });

    invalidateByPrefix('spots:');
    return spot;
  }

  async _generateAndSaveQrCode(spotId, slug) {
    try {
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const spotUrl = `${appUrl}/diem-du-lich/${slug}`;
      const qrDataUrl = await QRCode.toDataURL(spotUrl, { width: 300, margin: 2 });
      await SpotRepository.updateSpot(spotId, { qr_code_url: qrDataUrl });
    } catch {
      // không block flow tạo điểm
    }
  }

  async updateSpot(id, data, user) {
    const existing = await SpotRepository.findById(id);
    if (!existing) {
      throw new Api404Error('Điểm du lịch không tồn tại');
    }


    // Kiểm tra quyền sở hữu (system_admin / so_vhtt bypass)
    this._assertOwnerOrAdmin(existing, user);

    // Kiểm tra FK tồn tại nếu có thay đổi (trả lỗi 400 rõ ràng thay vì 500 từ DB)
    await FKValidator.all([
      FKValidator.spotCategory(data.category_id),
      FKValidator.province(data.province_code),
      FKValidator.ward(data.ward_code, data.province_code ?? existing.province_code),
    ]);

    // Kiểm tra slug nếu thay đổi
    if (data.slug && data.slug !== existing.slug) {
      if (await SpotRepository.existsBySlug(data.slug, id)) {
        throw new Api409Error('Slug đã tồn tại');
      }
    }

    const spot = await SpotRepository.updateSpot(id, data);
    invalidateByPrefix('spots:');
    return spot;
  }

  async deleteSpot(id, user) {
    const existing = await SpotRepository.findById(id);
    if (!existing) {
      throw new Api404Error('Điểm du lịch không tồn tại');
    }

    // Kiểm tra quyền sở hữu (system_admin / so_vhtt bypass)
    this._assertOwnerOrAdmin(existing, user);
    const result = await SpotRepository.softDelete(id);
    invalidateByPrefix('spots:');
    return result;
  }

  async toggleFeatured(id) {
    const existing = await SpotRepository.findById(id);
    if (!existing) {
      throw new Api404Error('Điểm du lịch không tồn tại');
    }
    const result = await SpotRepository.toggleFeatured(id);
    invalidateByPrefix('spots:');
    return result;
  }

  // ==================== MEDIA ====================

  async getSpotMedia(spotId, mediaType = null) {
    await this.getSpotById(spotId); // check exists
    return SpotRepository.getSpotMedia(spotId, mediaType);
  }

  // NV-33: Audio guide
  async getAudioGuide(spotId, language = null) {
    await this.getSpotById(spotId);
    return SpotRepository.getAudioGuide(spotId, language);
  }

  async addSpotMedia(spotId, file, mediaData) {
    await this.getSpotById(spotId); // check exists

    const [mimeCategory] = String(file.mimetype || '').split('/');
    const subdir = mimeCategory === 'image' ? 'images'
      : mimeCategory === 'video' ? 'videos'
      : mimeCategory === 'audio' ? 'audios'
      : 'files';
    const folder = `${subdir}/spots/${spotId}`;
    const resourceType = mediaData.media_type?.startsWith('video') ? 'video'
      : mediaData.media_type === 'audio_guide' ? 'audio' : 'image';

    const uploaded = await uploadBufferToStorage(file.buffer, {
      folder,
      mimetype: file.mimetype,
      originalName: file.originalname,
      resource_type: resourceType,
    });

    const media = await SpotRepository.addSpotMedia({
      spot_id: spotId,
      media_type: mediaData.media_type || 'image',
      url: uploaded.secure_url,
      thumbnail_url: mediaData.thumbnail_url || null,
      title_vi: mediaData.title_vi || null,
      title_en: mediaData.title_en || null,
      duration_sec: uploaded.duration || mediaData.duration_sec || null,
      file_size_kb: Math.round(uploaded.bytes / 1024),
      resolution: mediaData.resolution || null,
      is_primary: mediaData.is_primary || false,
      sort_order: mediaData.sort_order || 0,
      language: mediaData.language || null,
    });

    return media;
  }

  // Đặt ảnh chính
  async setPrimaryMedia(spotId, mediaId) {
    await this.getSpotById(spotId);
    const media = await SpotRepository.findMediaById(mediaId);
    if (!media || String(media.spot_id) !== String(spotId)) {
      throw new Api404Error('Media không tồn tại hoặc không thuộc điểm du lịch này');
    }
    const result = await SpotRepository.setPrimaryMedia(spotId, mediaId);
    invalidateByPrefix('spots:');
    return result;
  }

  // Cập nhật metadata media
  async updateMediaMeta(spotId, mediaId, data) {
    await this.getSpotById(spotId);
    const media = await SpotRepository.findMediaById(mediaId);
    if (!media || String(media.spot_id) !== String(spotId)) {
      throw new Api404Error('Media không tồn tại hoặc không thuộc điểm du lịch này');
    }
    return SpotRepository.updateMediaMeta(mediaId, data);
  }

  /**
   * HIGH-05 FIX: Upload nhiều file song song với bounded concurrency
   *
   * BEFORE: Sequential for-loop → 10 files × 2s = 20s response time
   * AFTER:  Parallel upload (5 concurrent) → 10 files / 5 = ~4s response time
   *
   * Performance: 5x faster for batch uploads
   */
  async batchAddSpotMedia(spotId, files, sharedMeta = {}) {
    await this.getSpotById(spotId);
    if (!files || files.length === 0) throw new Api400Error('Chưa chọn file');

    const CONCURRENCY = 5;

    const uploadOne = async (file) => {
      const mediaType = sharedMeta.media_type || 'image';
      const resourceType = mediaType.startsWith('video') ? 'video'
        : mediaType === 'audio_guide' ? 'audio' : 'image';
      const [mimeCategory] = String(file.mimetype || '').split('/');
      const subdir = mimeCategory === 'image' ? 'images'
        : mimeCategory === 'video' ? 'videos'
        : mimeCategory === 'audio' ? 'audios'
        : 'files';
      const folder = `${subdir}/spots/${spotId}`;
      const uploaded = await uploadBufferToStorage(file.buffer, {
        folder,
        mimetype: file.mimetype,
        originalName: file.originalname,
        resource_type: resourceType,
      });
      return SpotRepository.addSpotMedia({
        spot_id: spotId, media_type: mediaType, url: uploaded.secure_url,
        thumbnail_url: null, title_vi: sharedMeta.title_vi || file.originalname || null,
        title_en: sharedMeta.title_en || null, duration_sec: uploaded.duration || null,
        file_size_kb: Math.round(uploaded.bytes / 1024), resolution: null,
        is_primary: false, sort_order: sharedMeta.sort_order || 0,
        language: sharedMeta.language || null,
      });
    };

    // Upload song song với giới hạn concurrency
    const results = [];
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const chunk = files.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(chunk.map(uploadOne));
      results.push(...chunkResults);
    }
    return results;
  }

  async deleteSpotMedia(spotId, mediaId) {
    const media = await SpotRepository.findMediaById(mediaId);
    if (!media || String(media.spot_id) !== String(spotId)) {
      throw new Api404Error('Media không tồn tại');
    }

    // Xóa file local
    const publicId = extractPublicId(media.url);
    if (publicId) {
      await deleteFromStorage(publicId).catch(err => {
        console.error('Local file delete error:', err.message);
      });
    }
    return SpotRepository.deleteSpotMedia(mediaId);
  }

  _canManage(user) {
    return Boolean(user?.hasPermission?.('spots', 'update') || user?.hasPermission?.('spots', 'delete'));
  }
}

module.exports = new SpotService();

