# Tourism Spots API

Tai lieu nay mo ta phan API diem du lich sau khi tach route cho man quan tri, view danh sach va ban do.

Base path:

```http
/api/v1/spots
```

## Muc tieu

- Tach API danh sach diem du lich cho 3 nhu cau rieng:
  - View/list public.
  - Admin/quan tri noi bo.
  - Ban do co the truyen GPS de loc va sap xep theo khoang cach.
- Bo `district_id` vi bang `tourism_spots` khong co cot district.
- Ho tro `lang=vi|en` de frontend lay field hien thi theo ngon ngu.
- Ap dung scope du lieu theo role:
  - Public va `tourist`: chi xem diem da duyet, `status = active`.
  - `system_admin`, `ministry_manager`: xem toan bo theo filter truyen vao.
  - `department_manager`: chi xem du lieu theo `province_code`.
  - `spot_operator`, `travel_company`, `service_provider`: chi xem du lieu do chinh user tao, theo `created_by = req.user.id`.

## Bang co cot ngon ngu trong DB

Da kiem tra `information_schema.columns`, cac bang/view hien co cot `_vi`/`_en`:

| Schema | Bang/View | Cot ngon ngu |
| --- | --- | --- |
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

## Endpoints

### 1. Public list/view

```http
GET /api/v1/spots
```

Dung cho man danh sach/card public. Endpoint nay cho phep auth tuy chon.

Neu khong co token hoac role la `tourist`, API luon ep:

```js
status = 'active'
```

Query params:

| Param | Type | Ghi chu |
| --- | --- | --- |
| `lang` | string | `vi` hoac `en`, mac dinh `vi` |
| `page` | number | Mac dinh `1` |
| `limit` | number | Mac dinh `20`, toi da `100` |
| `search` | string | Tim theo ten/mo ta |
| `category_ids` | JSON array string | Vi du: `[1,2,3]` |
| `province_code` | string | Ma tinh/thanh |
| `status` | string | Chi co tac dung voi role duoc phep xem noi bo |
| `is_featured` | boolean | Loc diem noi bat |
| `rating_min` | number | Tu `0` den `5` |
| `capacity` | boolean | Tra them thong tin suc chua hien tai |
| `sortBy` | string | `created_at`, `name`, `rating_avg`, `view_count`, `distance_m` |
| `sortOrder` | string | `ASC` hoac `DESC` |
| `lat` | number | Neu truyen GPS thi phai co ca `lat` va `lng` |
| `lng` | number | Neu truyen GPS thi phai co ca `lat` va `lng` |
| `radius_km` | number | Ban kinh loc GPS, `0.1` den `100` |

Vi du:

```http
GET /api/v1/spots?page=1&limit=20&province_code=37
```

```http
GET /api/v1/spots?lang=en&lat=20.25&lng=105.97&radius_km=10
```

### 2. Admin list

```http
GET /api/v1/spots/admin
```

Dung cho man quan tri/backoffice.

Middleware:

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

`tourist` khong duoc goi route nay, du co permission `spots:read`.

Query params:

| Param | Type | Ghi chu |
| --- | --- | --- |
| `lang` | string | `vi` hoac `en`, mac dinh `vi` |
| `page` | number | Mac dinh `1` |
| `limit` | number | Mac dinh `20`, toi da `100` |
| `search` | string | Tim theo ten/mo ta |
| `category_ids` | JSON array string | Vi du: `[1,2,3]` |
| `province_code` | string | Bat buoc thuc te voi `department_manager` neu user chua co `province_code` |
| `status` | string | `active`, `inactive`, `pending` |
| `is_featured` | boolean | Loc diem noi bat |
| `rating_min` | number | Tu `0` den `5` |
| `capacity` | boolean | Tra them thong tin suc chua hien tai |
| `sortBy` | string | `created_at`, `name`, `rating_avg`, `view_count` |
| `sortOrder` | string | `ASC` hoac `DESC` |

Khong nhan `lat`, `lng`, `radius_km`. Neu client gui thua, validator se strip bo.

Vi du:

```http
GET /api/v1/spots/admin?lang=vi&province_code=37&status=pending&page=1&limit=20
```

Scope du lieu:

| Role | Du lieu tra ve |
| --- | --- |
| `system_admin` | Toan bo theo filter |
| `ministry_manager` | Toan bo theo filter |
| `department_manager` | Chi theo `province_code` |
| `spot_operator` | Chi record co `created_by = req.user.id` |
| `travel_company` | Chi record co `created_by = req.user.id` |
| `service_provider` | Chi record co `created_by = req.user.id` |

### 3. Map list

```http
GET /api/v1/spots/map
```

Dung cho man ban do. Endpoint nay cho phep auth tuy chon.

Query params:

| Param | Type | Ghi chu |
| --- | --- | --- |
| `lang` | string | `vi` hoac `en`, mac dinh `vi` |
| `page` | number | Mac dinh `1` |
| `limit` | number | Mac dinh `500`, toi da `1000` |
| `search` | string | Tim theo ten/mo ta |
| `category_ids` | JSON array string | Vi du: `[1,2,3]` |
| `province_code` | string | Ma tinh/thanh |
| `status` | string | Chi co tac dung voi role duoc phep xem noi bo |
| `is_featured` | boolean | Loc diem noi bat |
| `rating_min` | number | Tu `0` den `5` |
| `capacity` | boolean | Tra them thong tin suc chua hien tai |
| `sortBy` | string | `created_at`, `name`, `rating_avg`, `view_count`, `distance_m` |
| `sortOrder` | string | `ASC` hoac `DESC` |
| `lat` | number | Neu truyen GPS thi phai co ca `lat` va `lng` |
| `lng` | number | Neu truyen GPS thi phai co ca `lat` va `lng` |
| `radius_km` | number | Ban kinh loc GPS, `0.1` den `100` |

Neu co `lat` va `lng`:

- API loc diem trong ban kinh `radius_km`.
- Response co them `distance_m`.
- Neu khong truyen `sortBy`, API mac dinh sap xep `distance_m ASC`.

Vi du:

```http
GET /api/v1/spots/map?lang=en&lat=20.25&lng=105.97&radius_km=10&province_code=37
```

### 4. Detail by slug

```http
GET /api/v1/spots/:slug
```

Query params:

| Param | Type | Ghi chu |
| --- | --- | --- |
| `lang` | string | `vi` hoac `en`, mac dinh `vi` |

Vi du:

```http
GET /api/v1/spots/trang-an?lang=en
```

## Response chung

Dang response:

```json
{
  "spots": [
    {
      "id": "uuid",
      "slug": "trang-an",
      "name": "Trang An",
      "description": "...",
      "address": "...",
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
      "category_id": 1,
      "category_name": "Khu du lich",
      "province_name": "Ninh Binh",
      "commune_name": "...",
      "primary_image": "/uploads/images/..."
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

`distance_m` chi co khi request co `lat` va `lng`.

Field theo ngon ngu:

- `name`: lay tu `name_vi` hoac `name_en` theo `lang`.
- `description`: lay tu `description_vi` hoac `description_en` theo `lang`.
- `address`: lay tu `address_vi` hoac `address_en` theo `lang`.
- `category_name`, `category_parent_name`, `province_name`, `commune_name`: cung duoc localize theo `lang` neu bang co cot tieng Anh.
- Response doc cua `tourism_spots` khong tra cac field song ngu tho nhu `name_vi`, `name_en`, `description_vi`, `description_en`, `address_vi`, `address_en`.

## Luu y BE

- Khong dung `district_id` cho tourism spots.
- Role `department_manager` hien chua co `province_code` trong bang `auth.users`, nen frontend/backend caller can truyen `province_code` khi goi route admin/map cho So. Neu sau nay them `province_code` vao user profile, service da co san fallback de doc tu `user.province_code`.
- Route cu `/spots/nearby` van giu de tuong thich, nhung man ban do nen dung `/spots/map`.
- Cac route moi dung chung repository `SpotRepository.getAllSpots`, nen can can than khi sua select/filter de khong pha 3 man hinh.
