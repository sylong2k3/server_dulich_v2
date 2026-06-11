# Enterprise Role Dashboards

Tài liệu mô tả thay đổi: tách dashboard thống kê dùng chung thành **dashboard đặc trưng theo từng role doanh nghiệp**.

## 1. Vấn đề cũ

Trước thay đổi, cả 3 role doanh nghiệp:

- `spot_operator` (nhà điều hành điểm tham quan)
- `travel_company` (công ty lữ hành)
- `service_provider` (nhà cung cấp dịch vụ: lưu trú/ăn uống/vận chuyển...)

đều gọi chung endpoint:

```
GET /enterprise/businesses/:businessId/dashboard
```

và nhận **cùng một bộ số liệu** từ `GovernanceRepository.getBusinessDashboardSummary()` — gộp tất cả services,
tours, OCOP, vouchers, capacity, ratings vào một `summary` chung. Hệ quả: không role nào thấy đúng số liệu đặc
trưng nghiệp vụ của mình.

## 2. Kiến trúc mới (Strategy pattern)

Giữ nguyên route, controller signature và cơ chế phân quyền. Phần thay đổi nằm trong service layer.

```
Controller.getBusinessDashboard
  └─ GovernanceService.getBusinessDashboard
       ├─ findBusinessById + kiểm tra 404 / 403 (giữ nguyên)
       ├─ resolvePeriodRange (giữ nguyên)
       ├─ DashboardResolver.resolveVariant(user, business, override?)  → variant
       ├─ DashboardResolver.getProvider(variant)                        → provider
       └─ Promise.all([
            provider.build(ctx),            // số liệu ĐẶC TRƯNG theo role
            SharedDashboardSection.build(ctx) // khối DÙNG CHUNG
          ])
```

### Thành phần mới (`src/services/dashboard/`)

| File | Trách nhiệm |
|------|-------------|
| `dashboard-resolver.js` | Hàm thuần ánh xạ (user + business) → variant; trả provider tương ứng |
| `shared-section.js` | Sinh khối dùng chung `{ business, period, reported_metrics }` |
| `dashboard-utils.js` | `toNonNegativeNumber`, `toNullableNumber`, `safeQuery`, `safeRedemptionRate` |
| `providers/spot-operator.provider.js` | Số liệu điểm tham quan & sức chứa |
| `providers/travel-company.provider.js` | Số liệu tour & booking |
| `providers/service-provider.provider.js` | Số liệu dịch vụ, voucher & OCOP |

Các truy vấn SQL mới được thêm vào `GovernanceRepository` (đều **tham số hoá** và **read-only**):
`getReportedMetricsSummary`, `getSpotOperatorStats`, `getSpotVisitTrend`, `getTopSpotsByCapacity`,
`getTravelCompanyStats`, `getReportedTrend`, `getTopTours`, `getServiceProviderStats`,
`getServiceCategoryBreakdown`.

## 3. Quy tắc resolve variant

Theo thứ tự ưu tiên (`DashboardResolver.resolveVariant`):

1. Nếu `user.role.code` ∈ `{spot_operator, travel_company, service_provider}` → dùng chính role đó (bất kể `business_type`).
2. Nếu người gọi là **admin** (`system_admin`) và có query `variant` hợp lệ → dùng `variant` đó (override).
3. Ngược lại suy ra từ `business.business_type`:
   - `travel_company` → `travel_company`
   - `spot_operator` → `spot_operator`
   - còn lại (`hotel`, `restaurant`, `transport`, giá trị lạ, rỗng) → **`service_provider`** (mặc định an toàn)

Hàm là pure (không truy vấn DB), không bao giờ trả `null`/`undefined`.

## 4. Bộ metric theo từng role

### `spot_operator` — `summary`
`managed_spot_count`, `current_visitors`, `avg_capacity_pct`, `peak_capacity_pct`, `capacity_alert_count`,
`spot_rating_avg`, `spot_rating_count`, `ticket_price_range { min, max }`,
`experience_features { vr360, ar, audio }`.
Kèm `trend` (lượt khách theo tháng từ `user_visit_history`) và `highlights` (top spot theo sức chứa).

### `travel_company` — `summary`
`tour_count`, `active_tour_count`, `featured_tour_count`, `avg_tour_price_vnd`, `total_listed_capacity`,
`avg_tour_duration_days`, `tour_rating_avg`, `tour_rating_count`, `reported_bookings`, `reported_revenue_vnd`.
Kèm `trend` (booking/doanh thu theo tháng) và `highlights` (top tour theo rating).

### `service_provider` — `summary`
`service_count`, `active_service_count`, `service_category_breakdown []`, `service_price_range { min, max }`,
`voucher_count`, `active_voucher_count`, `voucher_used_count`, `voucher_redemption_rate`,
`ocop_count`, `active_ocop_count`, `avg_ocop_stars`, `business_rating_avg`, `business_rating_count`,
`reported_revenue_vnd`. Kèm `trend` (doanh thu theo tháng).

> `voucher_redemption_rate` được tính an toàn (`safeRedemptionRate`): trả `0` khi `max_uses = 0`, không bao giờ chia 0.

## 5. Response shape mới

```jsonc
{
  "variant": "spot_operator | travel_company | service_provider",
  "period":  { "type": "month|quarter|year", "year": 2026, "from": "...", "to": "..." },
  "business": { /* bản ghi businesses */ },
  "reported_metrics": {
    "total_revenue_vnd": 0, "total_bookings": 0, "total_visitors": 0,
    "avg_capacity_pct": 0, "report_count": 0,
    "source": "business_activity_reports", "note": "..."
  },
  "summary": { /* đặc trưng theo variant */ },
  "trend": [ /* tuỳ variant: visits | booking/revenue */ ],
  "highlights": [ /* tuỳ variant: top spots | top tours */ ]
}
```

Đảm bảo:
- Các khối `period` và `business` **giữ nguyên** kiểu như trước (không phá frontend hiện có).
- Mọi field số trong `summary` mặc định `0` (không `null`/`undefined`); `*_range.{min,max}` có thể `null` khi không có dữ liệu.
- Một truy vấn con lỗi → log cảnh báo và trả phần số liệu rỗng, dashboard vẫn render (không sập).

## 6. Override variant cho admin

Chỉ tài khoản `system_admin` mới có thể truyền query param `variant` để xem dashboard theo biến thể khác (phục vụ
kiểm thử/giám sát). Với người dùng thường, param `variant` bị bỏ qua:

```
GET /enterprise/businesses/:businessId/dashboard?variant=travel_company   # chỉ có hiệu lực với admin
```

## 7. Bảo toàn phân quyền

- Vẫn `authenticateToken` + `checkPermission('governance', 'read')` ở route.
- Vẫn kiểm tra trong service: business không tồn tại → `Api404Error`; không sở hữu và không phải admin → `Api403Error`
  (không phụ thuộc variant).

## 8. Chạy test

Property-based tests dùng [`fast-check`](https://github.com/dubzzz/fast-check) (devDependency) và test runner tích hợp
của Node (`node:test`).

```bash
npm test          # chạy toàn bộ test trong src/services/dashboard
npm run lint      # eslint
```

Các test bao gồm:
- `dashboard-resolver.test.js` — bảng quyết định + 3 property cho `resolveVariant`.
- `providers.test.js` — property: số mặc định ≥ 0 hữu hạn, `voucher_redemption_rate` an toàn khi `max_uses = 0`,
  và tập khoá `summary` của 3 variant đôi một khác nhau.
- `get-business-dashboard.test.js` — unit test service-level: nhánh 404/403, happy-path từng role, override
  admin-only, và khẳng định dashboard **không gọi method ghi** (read-only).

## 9. Lưu ý schema

Các truy vấn đã được khớp với schema thực tế trong `migrations/database_complete.sql`:
- `services.spot_id`, `services.category`, `services.price_from/price_to`, `services.is_active`.
- `tourism_spots.ticket_price_adult`, `has_vr_360`, `has_ar_support`, `has_audio_guide`.
- `tour_packages.price_from_vnd`, `max_guests`, `duration_days`, `rating_avg/rating_count`, `is_featured`, `status`.
- `vouchers.used_count`, `max_uses`, `is_active`.
- `ocop_products.star_rating`, `is_active`.
- `ratings.spot_id`/`business_id`, `stars`, `status`.
- `v_current_capacity (spot_id, name_vi, visitor_count, capacity_pct, status, recorded_at, max_capacity)`.
- `user_visit_history.visited_at`, `spot_id`.
- `business_activity_reports.period_from/period_to`, `total_revenue_vnd`, `total_bookings`, `total_visitors`, `avg_capacity_pct`.

## 10. Ví dụ response thực tế

Các ví dụ dưới đây minh hoạ đúng cấu trúc trả về của từng variant (giá trị mẫu).
Gọi: `GET /enterprise/businesses/:businessId/dashboard?period=month&year=2026`.

### 10.1. `spot_operator`

```json
{
  "variant": "spot_operator",
  "period": { "type": "month", "year": 2026, "from": "2026-01-01", "to": "2026-05-28" },
  "business": {
    "id": "b1a2c3d4-0000-0000-0000-000000000001",
    "business_name": "BQL Khu du lịch Tràng An",
    "business_type": "spot_operator",
    "province_code": "35",
    "province_name": "Ninh Bình",
    "ward_name": "Trường Yên",
    "owner_name": "Nguyễn Văn Minh",
    "status": "approved"
  },
  "reported_metrics": {
    "total_revenue_vnd": 2400000000,
    "total_bookings": 1250,
    "total_visitors": 6200,
    "avg_capacity_pct": 81.5,
    "report_count": 5,
    "source": "business_activity_reports",
    "note": "Số liệu doanh nghiệp tự báo cáo."
  },
  "summary": {
    "managed_spot_count": 4,
    "current_visitors": 5300,
    "avg_capacity_pct": 74.2,
    "peak_capacity_pct": 96.8,
    "capacity_alert_count": 2,
    "spot_rating_avg": 4.6,
    "spot_rating_count": 312,
    "ticket_price_range": { "min": 50000, "max": 250000 },
    "experience_features": { "vr360": 2, "ar": 1, "audio": 3 }
  },
  "trend": [
    { "period": "2026-01", "visits": 1820 },
    { "period": "2026-02", "visits": 2100 },
    { "period": "2026-03", "visits": 1650 },
    { "period": "2026-04", "visits": 2380 },
    { "period": "2026-05", "visits": 1990 }
  ],
  "highlights": [
    { "spot_id": "s-001", "name_vi": "Khu sinh thái Tràng An", "visitor_count": 1840, "capacity_pct": 96.8, "status": "near_full", "recorded_at": "2026-05-28T09:30:00.000Z" },
    { "spot_id": "s-002", "name_vi": "Hang Múa", "visitor_count": 920, "capacity_pct": 61.3, "status": "normal", "recorded_at": "2026-05-28T09:00:00.000Z" }
  ]
}
```

### 10.2. `travel_company`

```json
{
  "variant": "travel_company",
  "period": { "type": "month", "year": 2026, "from": "2026-01-01", "to": "2026-05-28" },
  "business": {
    "id": "b1a2c3d4-0000-0000-0000-000000000002",
    "business_name": "Công ty Lữ hành Ninh Bình Tourist",
    "business_type": "travel_company",
    "province_code": "35",
    "province_name": "Ninh Bình",
    "owner_name": "Trần Thị Hương",
    "status": "approved"
  },
  "reported_metrics": {
    "total_revenue_vnd": 1800000000,
    "total_bookings": 980,
    "total_visitors": 4200,
    "avg_capacity_pct": 78.0,
    "report_count": 5,
    "source": "business_activity_reports",
    "note": "Số liệu doanh nghiệp tự báo cáo."
  },
  "summary": {
    "tour_count": 18,
    "active_tour_count": 12,
    "featured_tour_count": 3,
    "avg_tour_price_vnd": 2500000,
    "total_listed_capacity": 640,
    "avg_tour_duration_days": 2.5,
    "tour_rating_avg": 4.5,
    "tour_rating_count": 287,
    "reported_bookings": 980,
    "reported_revenue_vnd": 1800000000
  },
  "trend": [
    { "period": "2026-01", "revenue_vnd": 320000000, "bookings": 165, "visitors": 720 },
    { "period": "2026-02", "revenue_vnd": 410000000, "bookings": 210, "visitors": 910 },
    { "period": "2026-03", "revenue_vnd": 290000000, "bookings": 150, "visitors": 640 },
    { "period": "2026-04", "revenue_vnd": 480000000, "bookings": 245, "visitors": 1100 },
    { "period": "2026-05", "revenue_vnd": 300000000, "bookings": 160, "visitors": 730 }
  ],
  "highlights": [
    { "id": "tour-1", "name_vi": "Tour khám phá Ninh Bình 2 ngày", "rating_avg": 4.9, "rating_count": 156, "price_from_vnd": 2400000, "status": "published", "is_featured": true },
    { "id": "tour-2", "name_vi": "Tour Tràng An - Bái Đính 1 ngày", "rating_avg": 4.6, "rating_count": 98, "price_from_vnd": 1200000, "status": "published", "is_featured": false }
  ]
}
```

### 10.3. `service_provider`

```json
{
  "variant": "service_provider",
  "period": { "type": "month", "year": 2026, "from": "2026-01-01", "to": "2026-05-28" },
  "business": {
    "id": "b1a2c3d4-0000-0000-0000-000000000003",
    "business_name": "Khách sạn Tam Cốc Garden",
    "business_type": "hotel",
    "province_code": "35",
    "province_name": "Ninh Bình",
    "owner_name": "Lê Văn Thành",
    "status": "approved"
  },
  "reported_metrics": {
    "total_revenue_vnd": 1500000000,
    "total_bookings": 1100,
    "total_visitors": 3800,
    "avg_capacity_pct": 82.3,
    "report_count": 5,
    "source": "business_activity_reports",
    "note": "Số liệu doanh nghiệp tự báo cáo."
  },
  "summary": {
    "service_count": 22,
    "active_service_count": 18,
    "service_category_breakdown": [
      { "category": "accommodation", "count": 8 },
      { "category": "food", "count": 9 },
      { "category": "transport", "count": 5 }
    ],
    "service_price_range": { "min": 50000, "max": 2500000 },
    "voucher_count": 9,
    "active_voucher_count": 6,
    "voucher_used_count": 240,
    "voucher_redemption_rate": 53.3,
    "ocop_count": 5,
    "active_ocop_count": 4,
    "avg_ocop_stars": 4.2,
    "business_rating_avg": 4.4,
    "business_rating_count": 168,
    "reported_revenue_vnd": 1500000000
  },
  "trend": [
    { "period": "2026-01", "revenue_vnd": 260000000, "bookings": 180, "visitors": 620 },
    { "period": "2026-02", "revenue_vnd": 340000000, "bookings": 230, "visitors": 810 },
    { "period": "2026-03", "revenue_vnd": 220000000, "bookings": 150, "visitors": 540 },
    { "period": "2026-04", "revenue_vnd": 420000000, "bookings": 280, "visitors": 980 },
    { "period": "2026-05", "revenue_vnd": 260000000, "bookings": 175, "visitors": 630 }
  ]
}
```

> Lưu ý: giá trị trên là mẫu minh hoạ cấu trúc. Khi chạy thật, số liệu lấy từ DB; nếu một truy vấn con lỗi
> hoặc không có dữ liệu, phần tương ứng trả về `0`/mảng rỗng và dashboard vẫn render bình thường.
