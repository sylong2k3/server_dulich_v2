# Tách Public/Admin Endpoint — Cache Strategy

> Tài liệu này mô tả pattern tách endpoint quản trị (admin) khỏi endpoint
> công khai (public), kèm chiến lược cache khác nhau cho từng loại.
> Áp dụng đồng nhất cho: spot, festival, ocop, tour, voucher, news.

---

## 1. Vì sao cần tách?

Cùng một resource (vd. `festivals`) có 2 use case rất khác nhau:

| Use case | Public | Admin |
|---|---|---|
| Ai gọi | Tourist (browser, app) | System admin, Sở VH-TT, biên tập |
| Tần suất | Cao — hàng nghìn req/phút | Thấp — vài chục req/phút |
| Filter | Cố định: `is_published=true` | Linh hoạt: cả draft, archived |
| Yêu cầu freshness | Trễ vài chục giây OK | Phải thấy thay đổi NGAY sau CRUD |
| Authentication | Không bắt buộc | Bắt buộc + role + permission |

→ Gộp 1 endpoint duy nhất sẽ phải compromise: hoặc quá rộng (admin
filter lộ ra public) hoặc quá hẹp (admin không xem được draft).

---

## 2. Quyết định cache

| Loại endpoint | Cache? | Lý do |
|---|---|---|
| **Public list/detail** | ✅ TTL 60s | Traffic cao, cùng query lặp lại nhiều, vài chục giây stale chấp nhận được |
| **Public special** (geojson, featured) | ✅ TTL 300s | Ít đổi, dùng cho rendering map / homepage |
| **Admin list/detail** | ❌ KHÔNG cache | Traffic thấp, cần real-time sau CRUD, biến số filter cao → hit rate thấp anyway |
| **Mutations** (POST/PATCH/DELETE) | ❌ KHÔNG cache | Đương nhiên — kèm `invalidateByPrefix` xoá public cache |

### 2.1 Vì sao admin KHÔNG cache?

1. **Workflow CRUD**: admin tạo/sửa rồi load lại list → nếu cache 60s, có
   thể không thấy thay đổi → confused, F5 nhiều lần.
2. **Hit rate thấp**: admin filter theo `status=draft`, `province_code`,
   `business_id`, `created_by`... mỗi combo là 1 cache entry, ít trùng.
3. **Memory waste**: cache nhiều entry chỉ để admin xem 1 lần là phí.
4. **Tránh stale data trong dashboard**: số liệu draft/pending phải đúng
   tại thời điểm gọi, không phải snapshot cũ.

### 2.2 Vì sao public CÓ cache?

1. **Cache stampede protection**: `cacheOrFetch` đã dedupe concurrent
   requests cho cùng key.
2. **TTL ngắn (60s)**: stale tối đa 60s, sau CRUD `invalidateByPrefix`
   xoá ngay.
3. **Hit rate cao**: list trang 1 với filter mặc định được gọi rất nhiều
   lần / phút.

---

## 3. Quy ước URL & quy ước method

### 3.1 URL pattern

```
GET  /api/v1/{resource}                # Public list (cache)
GET  /api/v1/{resource}/:id            # Public detail (cache)
GET  /api/v1/{resource}/admin          # Admin list (KHÔNG cache)
GET  /api/v1/{resource}/admin/:id      # Admin detail (KHÔNG cache)
POST /api/v1/{resource}                # Mutation
PATCH /api/v1/{resource}/:id           # Mutation
DELETE /api/v1/{resource}/:id          # Mutation
```

⚠️ **Quan trọng**: `/admin` phải đặt **TRƯỚC** `/:id` trong file route
để Express khớp đúng — nếu không `/admin` sẽ bị bắt như param `:id`.

### 3.2 Service method naming

```js
class FooService {
  // Public — có cache
  static async getAll(query)                  // GET /
  static async getById(id, query)             // GET /:id

  // Admin — KHÔNG cache
  static async getAdminAll(query)             // GET /admin
  static async getAdminById(id, query)        // GET /admin/:id

  // Mutation — KHÔNG cache, kèm invalidateByPrefix
  static async create(data)
  static async update(id, data, user)
  static async delete(id, user)
}
```

### 3.3 Auth/Permission

```js
// Public
router.get('/', validateQuery(publicQuerySchema), FooController.getAll);

// Admin — required: token + role + permission
router.get('/admin',
    authenticateToken,
    requireRole(['system_admin', 'department_manager', ...]),
    checkPermission('foo', 'read'),
    validateQuery(adminQuerySchema),
    FooController.getAdminAll
);
```

---

## 4. Status / Visibility filter

| Resource | Public filter (auto) | Admin filter (manual) |
|---|---|---|
| `spots` | `status='active'` (qua `_applyListScope`) | mọi status: active, draft, archived |
| `festivals` | `is_published=true` | mọi giá trị `is_published` |
| `ocop` | `is_active=true` | mọi giá trị `is_active` |
| `tours` | `status='published'` | mọi status: draft, published, archived |
| `news` | `is_published=true` | mọi giá trị `is_published` |
| `vouchers` | (geo-filtered, public không list) | tất cả mọi business, lọc `expired`, `is_active` |

---

## 5. Cache key normalization

Cache key phải **deterministic** — tránh `JSON.stringify(query)` vì:
- Thứ tự key không đảm bảo
- Field thừa (vd. token, ip) gây cache miss
- Khó debug khi xem cache stats

Pattern dùng:

```js
const cacheKey = [
    'spots:list',
    lang,
    `p${page}`,
    `l${limit}`,
    status || 'all',
    province_code || 'all',
    category_id || 'all',
    search || '',
    sortBy || 'created_at',
    sortOrder || 'DESC',
].join(':');
```

→ Ngắn, đọc được khi log, hit rate cao vì các filter khác nhau ít gây
cache miss.

---

## 6. Đã áp dụng cho route nào

| Route | Public list | Public detail | Admin list | Admin detail | Bilingual `lang` |
|---|---|---|---|---|---|
| `spot` | ✅ cache | ✅ cache (slug) | ✅ no cache | — (dùng slug) | ✅ |
| `festival` | ✅ cache | ✅ cache | ✅ no cache | ✅ no cache | ✅ |
| `ocop` | ✅ cache | ✅ cache | ✅ no cache | ✅ no cache | ✅ |
| `tour` | ✅ cache | ✅ cache (slug+id) | ✅ no cache | ✅ no cache | ✅ |
| `voucher` | ✅ cache (nearby) | (validate qua code) | ✅ no cache | ✅ no cache | — |
| `news` | ✅ cache | ✅ cache (slug) | ✅ no cache | ✅ no cache | — |

→ `news` và `voucher` không có bilingual fields trong schema nên không
áp dụng `lang`. Mọi route khác đều có cả 2 layer (public cache + admin
no-cache + bilingual).

---

## 7. Cache invalidation flow

```
┌──────────────────────────────────────────────────────────────┐
│  POST /api/v1/festivals                                      │
│  → FestivalService.create(data)                              │
│    1. INSERT vào DB                                          │
│    2. invalidateByPrefix('festivals:')                       │
│       → xoá: festivals:list:vi:p1:l12:...                    │
│              festivals:list:en:p1:l12:...                    │
│              festivals:id:abc:vi                             │
│              festivals:calendar:vi:...                       │
│              festivals:types                                 │
│  → Trả về voucher mới tạo                                   │
└──────────────────────────────────────────────────────────────┘

Public request kế tiếp:
  GET /api/v1/festivals       → cache miss → DB → cache lại
  GET /api/v1/festivals/admin → DB trực tiếp (no cache)
```

→ Admin endpoint **không bị ảnh hưởng** bởi invalidate vì không có entry
trong cache. Cứ gọi là chạy SQL → luôn fresh.

---

## 8. Files thay đổi cho phần admin/public split

```
src/services/spot.service.js              (bỏ cache cho getAdminSpots)
src/services/festival.service.js          (thêm getAdminAll, getAdminById)
src/services/ocop.service.js              (thêm getAdminAll, getAdminById)
src/services/tour.service.js              (thêm getAdminAll, getAdminById)
src/services/voucher.service.js           (thêm getAdminAll, getAdminById)
src/services/news.service.js              (đã có sẵn — getAllAdmin, getByIdAdmin)

src/controllers/festival.controller.js    (controller method getAdminAll/getAdminById)
src/controllers/ocop.controller.js        (controller method getAdminAll/getAdminById)
src/controllers/tour.controller.js        (controller method getAdminAll/getAdminById)
src/controllers/business.controller.js    (controller method getAdminVouchers/getAdminVoucherById)

src/models/repositories/voucher.repository.js  (thêm findAllAdmin)
src/models/repositories/festival.repository.js (thêm filter province_code cho admin)

src/middlewares/validators/festival.validation.js  (thêm festivalAdminQuerySchema)
src/middlewares/validators/ocop.validation.js      (đã có ocopAdminQuerySchema)
src/middlewares/validators/tour.validation.js      (đã có tourAdminQuerySchema)
src/middlewares/validators/voucher.validation.js   (thêm voucherAdminQuerySchema, voucherIdParamSchema)

src/routes/festival.route.js              (thêm /admin, /admin/:id — đặt trước /:id)
src/routes/ocop.route.js                  (thêm /admin, /admin/:id — đặt trước /:id)
src/routes/tour.route.js                  (thêm /admin, /admin/:id — đặt trước /:id)
src/routes/business.route.js              (thêm /vouchers/admin, /vouchers/admin/:voucherId)
src/routes/news.route.js                  (đã có sẵn /admin/all, /admin/:id)
```

---

## 9. Checklist khi thêm resource mới

- [ ] Service: tạo `getAll` (public, cache) + `getAdminAll` (admin, no cache)
- [ ] Service: tạo `getById` (public, cache) + `getAdminById` (admin, no cache)
- [ ] Public endpoint: enforce `is_published=true` / `status='active'` cứng
- [ ] Admin endpoint: cho phép filter linh hoạt (status, is_active, ...)
- [ ] Validation: tạo `xxxQuerySchema` (public) + `xxxAdminQuerySchema` (admin)
- [ ] Route: đặt `/admin` **trước** `/:id` để tránh conflict
- [ ] Route: admin có `authenticateToken + requireRole + checkPermission`
- [ ] Mutation: `invalidateByPrefix('xxx:')` sau create/update/delete
- [ ] Test: tạo bản ghi `is_published=false`, verify public không thấy nhưng admin thấy

---

## 10. Anti-patterns cần tránh

❌ **Cache admin endpoint với cùng prefix `xxx:`**:
```js
// SAI — cache admin gây stale data sau CRUD
const cacheKey = `xxx:admin:${...}`;
return cacheOrFetch(cacheKey, ..., 60);
```

❌ **Một endpoint phục vụ cả public lẫn admin** (dựa vào `req.user.role`):
```js
// SAI — middleware/cache khó tách, public người dùng có thể spam admin path
router.get('/', optionalAuth, FooController.getAll);
// trong service: if (canManage(user)) trả tất cả, else trả published
```
→ Khó test, khó cache, dễ leak draft cho user không có quyền.

❌ **Admin route SAU `/:id`**:
```js
// SAI — Express match /:id trước → /admin được hiểu là id="admin" → 400
router.get('/:id', ...);
router.get('/admin', ...);  // ← KHÔNG BAO GIỜ TỚI ĐÂY
```

✅ **Đúng**: tách 2 endpoint riêng, đặt `/admin` trước, public cache,
admin no-cache.
