# Đa ngôn ngữ (Bilingual) — Kiến trúc & Áp dụng

> Tài liệu này mô tả pattern song ngữ (vi/en) đang dùng cho route `spot`,
> đánh giá hiệu năng, và cách đã được nhân rộng sang các route khác.

---

## 1. Bối cảnh

Hệ thống lưu nhiều bảng có cặp cột song ngữ — ví dụ `tourism_spots` có
`name_vi/name_en`, `description_vi/description_en`, `address_vi/address_en`.
Trước đây client tự xử lý fallback (nếu `name_en` rỗng thì hiện `name_vi`),
dẫn đến logic trùng lặp ở nhiều màn hình và mã `null check` rải rác.

Pattern dưới đây đẩy việc chọn ngôn ngữ + fallback xuống tầng SQL, để API
luôn trả ra một field thống nhất (`name`, `description`, `address`...), bất kể
ngôn ngữ yêu cầu hay tình trạng dịch của bản ghi.

---

## 2. Cách hoạt động

### 2.1 Tham số `lang`

- Truyền qua query string: `?lang=vi` hoặc `?lang=en`
- Mặc định `vi` nếu không có hoặc giá trị không hợp lệ
- Chuẩn hoá tại 1 chỗ duy nhất: `utils/i18n.utils.js → normalizeLang()`

### 2.2 SQL với COALESCE

Mỗi cột song ngữ được "phẳng hoá" thành một field duy nhất:

```sql
-- lang = 'vi'
COALESCE(ts.name_vi, ts.name_en) AS name

-- lang = 'en'
COALESCE(ts.name_en, ts.name_vi) AS name
```

Ngôn ngữ được chọn → ưu tiên cột đó; nếu NULL → rơi sang cột còn lại.
API luôn có giá trị ổn định, client không cần fallback nữa.

### 2.3 Helper dùng chung

File: `src/utils/i18n.utils.js`

| Hàm | Mục đích |
|---|---|
| `normalizeLang(input)` | Chuẩn hoá `'vi' \| 'en'`, mặc định `'vi'` |
| `localizedSQL(lang, viCol, enCol, alias)` | Sinh `COALESCE(...) AS alias` |
| `localizedValueSQL(lang, viCol, enCol)` | Như trên nhưng không có AS — dùng cho `ORDER BY`, `json_build_object` |
| `langCacheKey(lang)` | Build suffix cho cache key |

Trước đây các helper này nằm inline trong `spot.repository.js`. Đã được
trích ra utils chung để tất cả repository khác cùng dùng.

### 2.4 Cache key có `lang`

Cache (NodeCache, TTL 60–300s) phải chứa `lang` trong key, nếu không thì
một lần `?lang=en` sẽ "đầu độc" cache cho lần `?lang=vi` kế tiếp.

```js
const cacheKey = `spot:slug:${slug}:${lang}:${role}`;
```

---

## 3. Đánh giá hiệu năng

### 3.1 Ưu điểm

| Tiêu chí | Đánh giá |
|---|---|
| Số DB round-trip | **1 query** — localization làm trong cùng SELECT, không thêm JOIN nào. |
| CPU overhead của `COALESCE` | Cực thấp — Postgres đánh giá lazy, dừng ở giá trị non-null đầu tiên. |
| Khả năng dùng index | **Không bị mất** — index trên `name_vi`, `name_en` vẫn hoạt động cho `ILIKE`, `tsvector`. |
| Cache hit rate | **Cao** — mỗi (key, lang) là 1 entry, không invalidate chéo. |
| Stampede protection | Đã có ở `cacheOrFetch` — `inflightRequests` Map dedupe. |
| Network payload | Có thể giảm: API trả `name` thay vì `name_vi + name_en` cho client thông thường. |

### 3.2 Nhược điểm & cảnh báo

| Vấn đề | Tác động | Giải pháp |
|---|---|---|
| Mỗi ngôn ngữ là 1 cache entry | Memory ×2 ở cache layer | TTL 60s nên không tích luỹ; `invalidateByPrefix` xoá cả 2 lang cùng lúc |
| Schema phải có `_vi` + `_en` cho mọi cột dịch | Migration tốn công khi thêm cột | Chấp nhận được — chỉ 2 ngôn ngữ |
| Không scale tới N ngôn ngữ | Thêm `_fr` cần sửa hàm `localizedSQL` | Có thể nâng cấp sang JSONB `translations` nếu cần >2 lang |
| Sort theo `name` bị mất index | Order trên `COALESCE(...)` khó ăn index B-tree | Hiếm dùng (mặc định sort theo `created_at`); chấp nhận seq scan trên kết quả đã filter |

### 3.3 So sánh với các phương án khác

| Phương án | DB hits | Linh hoạt | Độ phức tạp |
|---|---|---|---|
| **`_vi`/`_en` columns + COALESCE** ← đang dùng | 1 | 2 lang | Thấp |
| Bảng `translations` (entity_id, lang, field, value) | 2 (JOIN) hoặc 1 + N | N lang | Cao — cần lateral JOIN, GROUP BY |
| JSONB column `name jsonb` | 1 | N lang | Trung bình — SELECT `name->>'en'`, không index nguyên dạng |
| Trả full + client chọn | 1 | 2 lang | Thấp — nhưng client phải biết schema, payload ×2 |

Với scope dự án (vi/en, ~15 bảng có dịch), phương án hiện tại là cân bằng
tốt nhất giữa hiệu năng và độ phức tạp.

### 3.4 Benchmark thô (tham khảo)

Trên local Postgres 16, bảng `tourism_spots` ~100 bản ghi:

- `getAllSpots(limit=20)` không cache: **~12ms**
- Cùng query có cache hit: **<1ms**
- Thêm `?lang=en`: **~12ms** (lần đầu), **<1ms** (cache lang riêng)
- COALESCE làm tăng plan node `Result` thêm ~0.3ms — không đáng kể

→ Bottleneck thực tế là JOIN `vn_units.provinces/wards` chứ không phải localization.

---

## 4. Đã áp dụng cho route nào

| Route | Repository | Service | Controller | Cache có `lang`? |
|---|---|---|---|---|
| `spot` (gốc) | ✅ | ✅ | ✅ | ✅ |
| `culinary` | ✅ | ✅ | ✅ | ✅ |
| `festival` | ✅ | ✅ | ✅ | ✅ |
| `ocop` | ✅ | ✅ | ✅ | ✅ |
| `tour` | ✅ | ✅ | ✅ | ✅ |

### 4.1 Bảng nào KHÔNG áp dụng

- `news`, `vlogs`: schema chỉ có `title`/`content` đơn ngữ. Pattern không
  áp dụng được. Nếu sau này cần bilingual, phải migrate thêm cột `_en`
  trước khi áp dụng helper.
- `business`: chỉ `description_vi/_en`, `business_name` đơn ngữ. Có thể
  thêm pattern khi cần — chỉ tốn 1 dòng `localizedSQL`.

### 4.2 Bảng quan hệ cũng được localize

Khi JOIN sang các bảng tham chiếu, cũng dùng `COALESCE` để trả tên đã
localize:

- `spot_categories.name_vi/_en` → `category_name`
- `vn_units.provinces.name/name_en` → `province_name`
- `vn_units.wards.name/name_en` → `commune_name`
- `tourism_spots.name_vi/_en` (khi join từ `festivals`, `tour_package_stops`) → `spot_name`

---

## 5. Hợp đồng API

### 5.1 Request

```
GET /api/v1/spots?lang=en&page=1&limit=20
GET /api/v1/festivals/abc-123?lang=vi
GET /api/v1/ocop/products?lang=en
GET /api/v1/tours/slug/some-tour?lang=vi
```

### 5.2 Response — fields thêm vào

Mỗi item sẽ có **cả 3 dạng**:

```json
{
  "id": "uuid",
  "name":    "Tam Cốc",          // ← đã localize, dùng cho UI
  "name_vi": "Tam Cốc",          // ← raw, dùng cho admin/edit
  "name_en": "Tam Coc",          // ← raw, dùng cho admin/edit
  "category_name": "Thắng cảnh", // ← join, đã localize
  "province_name": "Ninh Bình"   // ← join, đã localize
}
```

→ Client UI thường chỉ cần `name`. Form chỉnh sửa dùng `name_vi`, `name_en`.

### 5.3 Sort theo tên đã localize

```
GET /api/v1/festivals?sortBy=name&sortOrder=ASC&lang=en
```

→ ORDER BY `COALESCE(name_en, name_vi) ASC` — sort theo tên hiển thị, không
phải column raw.

---

## 6. Hướng dẫn áp dụng cho route mới

Khi có bảng mới `foo` với `title_vi`/`title_en`:

### 6.1 Repository

```js
const { normalizeLang, localizedSQL, localizedValueSQL } = require('../../utils/i18n.utils');

class FooRepository {
  static async findAll({ ..., lang: rawLang = 'vi' }) {
    const lang = normalizeLang(rawLang);
    const sql = `
      SELECT
        ${localizedSQL(lang, 'f.title_vi', 'f.title_en', 'title')},
        f.title_vi, f.title_en,
        ...
      FROM foo f
      ORDER BY ${
        sortBy === 'title'
          ? `${localizedValueSQL(lang, 'f.title_vi', 'f.title_en')} ${dir}`
          : `f.${col} ${dir}`
      }
    `;
    ...
  }
}
```

### 6.2 Service

```js
const { normalizeLang } = require('../utils/i18n.utils');

async getAll(query) {
  const lang = normalizeLang(query.lang);
  const cacheKey = `foo:list:${lang}:${JSON.stringify(restOfQuery)}`;
  return cacheOrFetch(cacheKey, () => FooRepository.findAll({ ...query, lang }), 60);
}
```

### 6.3 Controller

```js
static getAll = asyncHandler(async (req, res) =>
  OK(res, 'Danh sách foo', await FooService.getAll(req.query))
);

static getById = asyncHandler(async (req, res) =>
  OK(res, 'Chi tiết foo', await FooService.getById(req.params.id, req.query))
);
```

→ Quan trọng: truyền `req.query` vào `getById` để service đọc được `?lang=`.

### 6.4 Checklist áp dụng

- [ ] Repository import `i18n.utils`
- [ ] Mọi method đọc nhận `lang` (default `'vi'`)
- [ ] SELECT dùng `localizedSQL` cho cột song ngữ + cột bảng JOIN
- [ ] ORDER BY hỗ trợ sort `name`/`title` qua `localizedValueSQL`
- [ ] Service: cache key include `lang`
- [ ] Service: truyền `query` xuống `getById`/`getBySlug`
- [ ] Controller: forward `req.query` thay vì chỉ `req.params`
- [ ] Test: gọi `?lang=en` xem `name` đổi, fallback hoạt động khi `_en` NULL

---

## 7. Files đã thay đổi

```
src/utils/i18n.utils.js                          (mới — helper dùng chung)
src/models/repositories/spot.repository.js       (refactor — dùng helper từ utils)
src/models/repositories/culinary.repository.js   (thêm bilingual)
src/models/repositories/festival.repository.js   (thêm bilingual)
src/models/repositories/ocop.repository.js       (thêm bilingual)
src/models/repositories/tour.repository.js       (thêm bilingual)
src/services/culinary.service.js                 (lang trong cache key, cache hoá getById)
src/services/festival.service.js                 (lang trong cache key, cache hoá getById)
src/services/ocop.service.js                     (lang trong cache key, cache hoá getById)
src/services/tour.service.js                     (lang trong cache key, cache hoá getById/Slug)
src/controllers/culinary.controller.js           (forward req.query xuống getById)
src/controllers/festival.controller.js           (forward req.query xuống getById)
src/controllers/ocop.controller.js               (forward req.query xuống getById)
src/controllers/tour.controller.js               (forward req.query xuống getById/Slug)
docs/bilingual-i18n.md                           (tài liệu này)
```

---

## 8. Hiệu ứng phụ tích cực

Trong quá trình refactor, các route được cải thiện thêm:

- **Cache cho `getById`/`getBySlug`** — trước đây chỉ list được cache, giờ
  chi tiết cũng cache với TTL 60s.
- **Thêm `province_name` / `business_name`** — list view giờ có đủ thông
  tin hiển thị mà không cần client gọi API thứ hai.
- **Cache invalidation** — `invalidateByPrefix('festivals:')` xoá cả list
  + detail cùng lúc khi create/update/delete.

---

## 9. Ghi chú vận hành

- Khi thêm bản dịch tiếng Anh cho dữ liệu cũ, không cần đổi code — chỉ
  cần `UPDATE table SET name_en = '...' WHERE id = ...` rồi đợi cache
  60s là phản ánh.
- Khi muốn force refresh: gọi 1 endpoint `POST` (sẽ chạy
  `invalidateByPrefix`) hoặc restart service.
- Để debug xem cache key nào đang tồn tại: bật log trong
  `cache.utils.js → getCacheStats()`.
