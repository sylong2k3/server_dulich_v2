# API Điểm Du Lịch (Tourism Spots)

Tài liệu mô tả các endpoint API quản lý và tra cứu điểm du lịch, bao gồm danh sách công khai, trang quản trị nội bộ và bản đồ.

**Base path:**

```http
/api/v1/spots
```

---

## Mục tiêu thiết kế

- Tách API danh sách điểm du lịch cho **3 nhu cầu riêng biệt**:
  - Danh sách/thẻ công khai (public list/card).
  - Quản trị nội bộ (admin/backoffice).
  - Bản đồ — hỗ trợ lọc theo GPS và sắp xếp theo khoảng cách.
- Hỗ trợ `lang=vi|en` để frontend lấy field hiển thị theo ngôn ngữ.
- Áp dụng **scope dữ liệu** tự động theo role:

| Role | Dữ liệu được truy cập |
|---|---|
| `tourist` / không token | Chỉ điểm đã duyệt (`status = active`) |
| `system_admin`, `ministry_manager` | Toàn bộ theo filter truyền vào |
| `department_manager` | Chỉ theo `province_code` của Sở |
| `spot_operator`, `travel_company`, `service_provider` | Chỉ điểm do chính user tạo (`created_by = user.id`) |

---

## Bảng có cột ngôn ngữ trong DB

Đã kiểm tra `information_schema.columns`, các bảng/view hiện có cột `_vi` / `_en`:

| Schema | Bảng/View | Cột ngôn ngữ |
|---|---|---|
| `auth` | `permissions` | `name_vi` |
| `auth` | `roles` | `name_vi`, `name_en` |
| `public` | `businesses` | `description_vi`, `description_en`, `address_vi` |
| `public` | `cuisine_items` | `name_vi`, `name_en`, `description_vi`, `recipe_vi` |
| `public` | `festivals` | `name_vi`, `name_en`, `description_vi` |
| `public` | `map_basemaps` | `name_vi`, `name_en` |
| `public` | `map_categories` | `name_vi`, `name_en` |
| `public` | `map_layers` | `name_vi`, `name_en` |
| `public` | `notifications` | `title_vi`, `body_vi` |
| `public` | `ocop_products` | `name_vi`, `name_en`, `description_vi` |
| `public` | `services` | `service_name_vi`, `service_name_en`, `description_vi` |
| `public` | `spot_categories` | `name_vi`, `name_en` |
| `public` | `spot_media` | `title_vi`, `title_en` |
| `public` | `tour_package_stops` | `title_vi`, `description_vi` |
| `public` | `tour_packages` | `name_vi`, `name_en`, `description_vi`, `start_location_vi`, `end_location_vi` |
| `public` | `tourism_spots` | `name_vi`, `name_en`, `description_vi`, `description_en`, `address_vi`, `address_en` |
| `public` | `v_current_capacity` | `name_vi` |
| `public` | `v_spots_full` | `name_vi`, `name_en`, `description_vi`, `description_en`, `address_vi`, `address_en` |
| `public` | `vouchers` | `title_vi`, `description_vi` |
| `public` | `vr_hotspots` | `label_vi`, `label_en` |
| `vn_units` | `administrative_regions` | `name_en`, `code_name_en` |
| `vn_units` | `administrative_units` | `full_name_en`, `short_name_en`, `code_name_en` |
| `vn_units` | `provinces` | `name_en`, `full_name_en` |
| `vn_units` | `wards` | `name_en`, `full_name_en` |

---

## Endpoints

### 1. Danh sách công khai

```http
GET /api/v1/spots
```

Dùng cho màn hình danh sách / thẻ điểm du lịch công khai. Cho phép xác thực tùy chọn (`optionalAuth`).

Nếu không có token hoặc role là `tourist`, API luôn ép:

```
status = 'active'
```

**Query params:**

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `lang` | string | `vi` hoặc `en`, mặc định `vi` |
| `page` | number | Mặc định `1` |
| `limit` | number | Mặc định `20`, tối đa `100` |
| `search` | string | Tìm theo tên hoặc mô tả |
| `category_id` | number | ID danh mục điểm du lịch — số nguyên, VD: `?category_id=3` |
| `province_code` | string | Mã tỉnh/thành |
| `status` | string | Chỉ có tác dụng với role được phép xem nội bộ |
| `is_featured` | boolean | Lọc điểm nổi bật |
| `rating_min` | number | Từ `0` đến `5` |
| `capacity` | boolean | Trả thêm thông tin sức chứa hiện tại |
| `sortBy` | string | `created_at`, `name`, `rating_avg`, `view_count`, `distance_m` |
| `sortOrder` | string | `ASC` hoặc `DESC` |
| `lat` | number | Vĩ độ — bắt buộc đi kèm `lng` |
| `lng` | number | Kinh độ — bắt buộc đi kèm `lat` |
| `radius_km` | number | Bán kính lọc GPS, `0.1` đến `100` |

**Ví dụ:**

```http
GET /api/v1/spots?page=1&limit=20&province_code=37
```

```http
GET /api/v1/spots?lang=en&lat=20.25&lng=105.97&radius_km=10&category_id=3
```

---

### 2. Danh sách Admin (quản trị nội bộ)

```http
GET /api/v1/spots/admin
```

Dùng cho màn hình quản trị / backoffice. **Không cache** — admin cần thấy dữ liệu thay đổi ngay sau CRUD.

**Middleware yêu cầu:**

```js
authenticateToken
requireRole([
  'system_admin',
  'ministry_manager',
  'department_manager',
  'spot_operator',
  'travel_company',
  'service_provider'
])
checkPermission('spots', 'read')
```

> `tourist` không được gọi route này dù có permission `spots:read`.

**Query params:**

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `lang` | string | `vi` hoặc `en`, mặc định `vi` |
| `page` | number | Mặc định `1` |
| `limit` | number | Mặc định `20`, tối đa `100` |
| `search` | string | Tìm theo tên hoặc mô tả |
| `category_id` | number | ID danh mục điểm du lịch — số nguyên, VD: `?category_id=3` |
| `province_code` | string | Bắt buộc thực tế với `department_manager` |
| `status` | string | `active`, `inactive`, `pending` |
| `is_featured` | boolean | Lọc điểm nổi bật |
| `rating_min` | number | Từ `0` đến `5` |
| `capacity` | boolean | Trả thêm thông tin sức chứa hiện tại |
| `sortBy` | string | `created_at`, `name`, `rating_avg`, `view_count` |
| `sortOrder` | string | `ASC` hoặc `DESC` |

> Không nhận `lat`, `lng`, `radius_km`. Nếu client gửi thừa, validator sẽ strip bỏ.

**Ví dụ:**

```http
GET /api/v1/spots/admin?lang=vi&province_code=37&status=pending&page=1&limit=20
```

**Scope dữ liệu theo role:**

| Role | Dữ liệu trả về |
|---|---|
| `system_admin` | Toàn bộ theo filter |
| `ministry_manager` | Toàn bộ theo filter |
| `department_manager` | Chỉ theo `province_code` |
| `spot_operator` | Chỉ record có `created_by = user.id` |
| `travel_company` | Chỉ record có `created_by = user.id` |
| `service_provider` | Chỉ record có `created_by = user.id` |

---

### 3. Danh sách Bản đồ

```http
GET /api/v1/spots/map
```

Dùng cho màn hình bản đồ. Cho phép xác thực tùy chọn. Giới hạn tối đa `1000` records.

**Query params:**

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `lang` | string | `vi` hoặc `en`, mặc định `vi` |
| `page` | number | Mặc định `1` |
| `limit` | number | Mặc định `500`, tối đa `1000` |
| `search` | string | Tìm theo tên hoặc mô tả |
| `category_id` | number | ID danh mục điểm du lịch (số nguyên) |
| `province_code` | string | Mã tỉnh/thành |
| `status` | string | Chỉ có tác dụng với role được phép xem nội bộ |
| `is_featured` | boolean | Lọc điểm nổi bật |
| `rating_min` | number | Từ `0` đến `5` |
| `capacity` | boolean | Trả thêm thông tin sức chứa hiện tại |
| `sortBy` | string | `created_at`, `name`, `rating_avg`, `view_count`, `distance_m` |
| `sortOrder` | string | `ASC` hoặc `DESC` |
| `lat` | number | Vĩ độ — bắt buộc đi kèm `lng` |
| `lng` | number | Kinh độ — bắt buộc đi kèm `lat` |
| `radius_km` | number | Bán kính lọc GPS, `0.1` đến `100` |

Khi có `lat` và `lng`:
- API lọc điểm trong bán kính `radius_km`.
- Response có thêm trường `distance_m`.
- Nếu không truyền `sortBy`, API mặc định sắp xếp `distance_m ASC`.

**Ví dụ:**

```http
GET /api/v1/spots/map?lang=en&lat=20.25&lng=105.97&radius_km=10&province_code=37
```

---

**Response rut gon cho ban do:**

```json
{
  "spots": [
    {
      "id": "uuid",
      "slug": "trang-an",
      "name": "Trang An",
      "geom": {
        "type": "Point",
        "coordinates": [105.97, 20.25]
      },
      "distance_m": 1234.56,
      "category_id": 3,
      "category_name": "Khu du lich sinh thai",
      "category_icon": "/uploads/icons/ecotourism.svg",
      "province_name": "Ninh Binh",
      "commune_name": "Xa Truong Yen",
      "max_capacity": 1000,
      "current_visitor_count": 650,
      "current_capacity_pct": "65.00",
      "capacity_status": "busy",
      "capacity_recorded_at": "2026-05-10T09:00:00.000Z",
      "alert_threshold_pct": "80.00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 500,
    "total": 100,
    "totalPages": 1
  }
}
```

---

### 4. Chi tiết theo slug

```http
GET /api/v1/spots/:slug
```

**Query params:**

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `lang` | string | `vi` hoặc `en`, mặc định `vi` |

**Ví dụ:**

```http
GET /api/v1/spots/trang-an?lang=en
```

---

### 5. Chi tiết Admin theo ID

```http
GET /api/v1/spots/admin/:id
```

Lấy toàn bộ thông tin chi tiết một điểm bất kỳ (kể cả chưa duyệt). Yêu cầu quyền `spots:read`.

---

## Cấu trúc Response

```json
{
  "spots": [
    {
      "id": "uuid",
      "slug": "trang-an",
      "name": "Tràng An",
      "description": "Mô tả theo ngôn ngữ yêu cầu...",
      "address": "Địa chỉ theo ngôn ngữ yêu cầu...",
      "rating_avg": "4.8",
      "rating_count": 120,
      "is_featured": true,
      "status": "active",
      "ticket_price_adult": "250000",
      "ticket_price_child": "120000",
      "ticket_currency": "VND",
      "opening_hours": {},
      "phone": "...",
      "website": "...",
      "has_vr_360": true,
      "has_ar_support": false,
      "has_audio_guide": true,
      "max_capacity": 1000,
      "geojson": {
        "type": "Point",
        "coordinates": [105.97, 20.25]
      },
      "longitude": 105.97,
      "latitude": 20.25,
      "distance_m": 1234.56,
      "category_id": 3,
      "category_name": "Khu du lịch sinh thái",
      "category_parent_id": 1,
      "category_parent_name": "Thiên nhiên",
      "province_name": "Ninh Bình",
      "commune_name": "Xã Trường Yên",
      "primary_image": "/uploads/images/trang-an.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

> `distance_m` chỉ có khi request truyền `lat` và `lng`.

**Các field đa ngôn ngữ:**

| Field response | Nguồn trong DB |
|---|---|
| `name` | `name_vi` hoặc `name_en` theo `lang` |
| `description` | `description_vi` hoặc `description_en` theo `lang` |
| `address` | `address_vi` hoặc `address_en` theo `lang` |
| `category_name` | `spot_categories.name_vi/name_en` |
| `province_name` | `provinces.name/name_en` |
| `commune_name` | `wards.name/name_en` |

> Response **không** trả các field gốc song ngữ như `name_vi`, `name_en`, `description_vi`, `description_en`, `address_vi`, `address_en`.

---

## Lưu ý dành cho Backend

- **Không dùng `district_id`** cho `tourism_spots` — bảng không có cột này.
- **`category_id`** là số nguyên đơn (integer). Ví dụ: `?category_id=3`.
- Role `department_manager` hiện chưa có `province_code` trong bảng `users`, nên frontend/BE caller cần truyền `province_code` khi gọi route admin/map cho Sở. Nếu sau này thêm `province_code` vào user profile, service đã có sẵn fallback để đọc từ `user.province_code`.
- Route cũ `/spots/nearby` vẫn giữ để tương thích ngược, nhưng màn hình bản đồ nên dùng `/spots/map`.
- Các route dùng chung `SpotRepository.getAllSpots` — cần cẩn thận khi sửa select/filter để không ảnh hưởng cả 3 màn hình (public, admin, map).
