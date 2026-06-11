# Thay đổi phạm vi (scope) danh sách điểm du lịch

> Ngày: 2026-06-11
> File ảnh hưởng: `src/services/spot.service.js`
> Không có thay đổi schema DB, không thay đổi route/đường dẫn.

## 1. Bối cảnh & vấn đề

Khi **lữ hành (`travel_company`)** tạo tour và muốn thêm điểm dừng (tour stop), giao diện cần
gọi API danh sách điểm du lịch để chọn `spot_id`. Tuy nhiên danh sách trả về **rỗng**.

Nguyên nhân: hàm `_applyListScope` được **dùng chung** cho cả endpoint công khai và endpoint
quản trị. Với các role "sở hữu" (`spot_operator`, `travel_company`, `service_provider`), nó ép
lọc `created_by = user.id`. Lữ hành không tạo điểm du lịch nên danh sách luôn rỗng → không có
điểm nào để gắn vào tour stop.

Lưu ý mô hình dữ liệu: nhà hàng/khách sạn của `service_provider` được lưu trong bảng
`tourism_spots` (do họ tạo). Vì vậy `service_provider` **thực sự sở hữu** điểm và cần giữ
khả năng quản lý "điểm của mình" ở ngữ cảnh quản trị.

## 2. Giải pháp

Tách logic scope theo **ngữ cảnh** thay vì chỉ theo role:

- **Danh sách công khai** — thêm `_applyPublicListScope`, **không** lọc theo `created_by`.
  Mọi role đều duyệt được điểm `active` công khai.
- **Danh sách quản trị** — giữ nguyên `_applyListScope`, vẫn lọc theo `created_by` cho các
  role sở hữu.

## 3. API bị ảnh hưởng

| Endpoint | Method | Scope mới | Ghi chú |
|----------|--------|-----------|---------|
| `/spots` | GET | `_applyPublicListScope` | Danh sách công khai (optionalAuth) |
| `/spots/map` | GET | `_applyPublicListScope` | Dữ liệu bản đồ (optionalAuth) |
| `/spots/admin` | GET | `_applyListScope` (không đổi) | Danh sách quản trị, scope theo sở hữu |

> Không thay đổi request params, response format hay status code. Chỉ thay đổi **tập điểm trả về**
> tùy theo role của token gửi kèm.

## 4. Hành vi theo role

### `GET /spots` và `GET /spots/map` (công khai)

| Role / token | Trước | Sau |
|--------------|-------|-----|
| `travel_company` | Chỉ điểm `created_by = self` → **rỗng** | Tất cả điểm `active` |
| `service_provider` | Chỉ điểm `created_by = self` | Tất cả điểm `active` |
| `spot_operator` | Chỉ điểm `created_by = self` | Tất cả điểm `active` |
| `department_manager` | Điểm trong tỉnh (lỗi 400 nếu thiếu province) | Điểm trong tỉnh; nếu không xác định tỉnh → chỉ `active` |
| `ministry_manager` / `system_admin` | Tất cả (theo query) | Tất cả (theo query) |
| `tourist` / không đăng nhập | Điểm `active` | Điểm `active` (không đổi) |

### `GET /spots/admin` (quản trị) — KHÔNG đổi

| Role | Phạm vi |
|------|---------|
| `spot_operator` | Chỉ điểm do mình tạo (`created_by`) |
| `service_provider` | Chỉ điểm do mình tạo (nhà hàng/khách sạn) |
| `travel_company` | Rỗng (không tạo điểm) |
| `department_manager` | Điểm trong tỉnh quản lý |
| `ministry_manager` / `system_admin` | Tất cả |

## 5. Bảo mật

- Endpoint công khai luôn ép `status = 'active'` cho mọi role không phải quản lý cấp Bộ/Admin,
  nên **không lộ** điểm `draft`/`archived` của người khác.
- Quản lý "điểm của tôi" vẫn nằm ở `GET /spots/admin` (giữ scope `created_by`).
- Khi gán `spot_id` vào tour stop, `tour.service.addStop` vẫn kiểm tra qua `FKValidator.spot()`.

## 6. Hướng dẫn tích hợp (frontend)

- Form thêm/sửa tour stop của lữ hành nên gọi **`GET /spots`** (kèm token) để lấy danh sách
  điểm chọn. Có thể lọc thêm: `?province_code=`, `?category_id=`, `?search=`, `?page=`, `?limit=`.
- Không dùng `GET /spots/admin` cho picker của lữ hành (sẽ trả rỗng vì scope theo `created_by`).

## 7. Ví dụ

```http
GET /spots?status=active&province_code=37&search=Tràng An&page=1&limit=20
Authorization: Bearer <token lữ hành>
```

```json
{
  "message": "Lấy danh sách điểm du lịch thành công",
  "metadata": {
    "spots": [
      { "id": "…", "slug": "trang-an", "name": "Khu du lịch sinh thái Tràng An", "status": "active" }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
}
```
