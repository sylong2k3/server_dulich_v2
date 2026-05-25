# DuLichV2 Server — API Documentation

> Base URL: `http://localhost:8881/api/v1`  
> Auth: `Authorization: Bearer <token>`  
> Health: `GET /health`

---

## 🔐 Auth — `/api/v1/auth`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/register` | Đăng ký tài khoản | Public |
| POST | `/login` | Đăng nhập | Public |
| POST | `/logout` | Đăng xuất | Required |
| POST | `/refresh` | Làm mới access token | Public |
| POST | `/forgot-password` | Gửi email reset mật khẩu | Public |
| POST | `/reset-password` | Đặt lại mật khẩu | Public |
| POST | `/verify-email` | Xác minh email | Public |
| GET | `/google` | OAuth Google | Public |
| GET | `/google/callback` | Callback Google OAuth | Public |
| POST | `/2fa/enable` | Bật xác thực 2 bước | Required |
| POST | `/2fa/verify` | Xác minh OTP 2FA | Required |
| POST | `/2fa/disable` | Tắt 2FA | Required |
| POST | `/push-token` | Cập nhật FCM/APNS token | Required |

---

## 👤 Users — `/api/v1/users`

| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/` | Danh sách users | `users:read` |
| GET | `/me` | Thông tin user đang đăng nhập | Required |
| PATCH | `/me` | Cập nhật thông tin cá nhân | Required |
| GET | `/:id` | Chi tiết user | `users:read` |
| PATCH | `/:id` | Cập nhật user | `users:update` |
| DELETE | `/:id` | Vô hiệu hoá tài khoản | `users:delete` |
| PATCH | `/:id/role` | Đổi role user | `users:update` |

---

## 🏷️ Roles — `/api/v1/roles`

| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/` | Danh sách roles | `roles:read` |
| POST | `/` | Tạo role | `roles:create` |
| PATCH | `/:id` | Cập nhật role | `roles:update` |
| DELETE | `/:id` | Xóa role | `roles:delete` |

---

## 📍 Spots (Điểm du lịch) — `/api/v1/spots`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách public (có cache 60s) | Optional |
| GET | `/admin` | Danh sách admin (no cache) | `spots:read` |
| GET | `/admin/:id` | Chi tiết admin | `spots:read` |
| GET | `/featured` | Điểm nổi bật | Public |
| GET | `/nearby` | Điểm gần vị trí | Public |
| GET | `/bbox` | Điểm theo bbox bản đồ | Public |
| GET | `/geojson` | GeoJSON cho bản đồ | Public |
| GET | `/map` | Danh sách cho map | Public |
| GET | `/:slug` | Chi tiết theo slug | Optional |
| POST | `/` | Tạo điểm DL | `spots:create` |
| PATCH | `/:id` | Cập nhật | `spots:update` |
| DELETE | `/:id` | Xóa | `spots:delete` |
| POST | `/:id/media` | Upload media | `spots:update` |
| DELETE | `/:id/media/:mediaId` | Xóa media | `spots:update` |
| POST | `/:id/media/batch` | Upload nhiều file | `spots:update` |

---

## 🗂️ Spot Categories — `/api/v1/spot-categories`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách danh mục | Public |
| GET | `/:id` | Chi tiết | Public |
| POST | `/` | Tạo danh mục | `spot_categories:create` |
| PATCH | `/:id` | Cập nhật | `spot_categories:update` |
| DELETE | `/:id` | Xóa | `spot_categories:delete` |

---

## 🎪 Festivals (Lễ hội) — `/api/v1/festivals`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách public (có cache) | Public |
| GET | `/admin` | Danh sách admin (no cache) | `festivals:read` |
| GET | `/admin/:id` | Chi tiết admin | `festivals:read` |
| GET | `/:id` | Chi tiết public | Public |
| POST | `/` | Tạo lễ hội | `festivals:create` |
| PATCH | `/:id` | Cập nhật | `festivals:update` |
| DELETE | `/:id` | Xóa | `festivals:delete` |

---

## 🛍️ OCOP (Sản phẩm OCOP) — `/api/v1/ocop`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách public (có cache) | Optional |
| GET | `/admin` | Danh sách admin (no cache) | `ocop:read` |
| GET | `/admin/:id` | Chi tiết admin | `ocop:read` |
| GET | `/categories` | Danh mục OCOP | Public |
| GET | `/:id` | Chi tiết public | Optional |
| POST | `/` | Tạo sản phẩm | `ocop:create` |
| PATCH | `/:id` | Cập nhật | `ocop:update` |
| DELETE | `/:id` | Xóa | `ocop:delete` |

---

## 📰 News (Tin tức) — `/api/v1/news`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách public (có cache) | Public |
| GET | `/admin/all` | Danh sách admin (no cache) | `news:read` |
| GET | `/admin/:id` | Chi tiết admin | `news:read` |
| PATCH | `/admin/:id/publish` | Đặt trạng thái publish | `news:update` |
| GET | `/:slug` | Chi tiết theo slug | Public |
| POST | `/` | Tạo tin tức | `news:create` |
| PATCH | `/:id` | Cập nhật | `news:update` |
| DELETE | `/:id` | Xóa | `news:delete` |
| GET | `/:id/comments` | Danh sách bình luận | Public |
| POST | `/:id/comments` | Đăng bình luận | Required |
| PATCH | `/:id/comments/:commentId` | Sửa bình luận | Required |
| DELETE | `/:id/comments/:commentId` | Xóa bình luận | Required |
| PATCH | `/:id/comments/:commentId/approval` | Duyệt bình luận | `news:update` |

---

## 🍜 Culinary (Ẩm thực) — `/api/v1/culinary`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách ẩm thực | Public |
| GET | `/categories` | Danh mục ẩm thực | Public |
| GET | `/:id` | Chi tiết | Public |
| POST | `/` | Tạo | `culinary:create` |
| PATCH | `/:id` | Cập nhật | `culinary:update` |
| DELETE | `/:id` | Xóa | `culinary:delete` |

---

## 📊 Capacity (Sức chứa điểm DL) — `/api/v1/capacity`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/current` | Tải hiện tại tất cả điểm | Public |
| GET | `/current/geojson` | GeoJSON tải điểm | Public |
| GET | `/stream` | SSE stream real-time | Public |
| GET | `/spots/:spotId/history` | Lịch sử tải | Public |
| GET | `/spots/:spotId/stats` | Thống kê tải | Public |
| GET | `/spots/:spotId/alternatives` | Gợi ý điểm thay thế | Public |
| POST | `/spots/:spotId/log` | Ghi nhận tải mới | `capacity:create` |
| GET | `/configs` | Cấu hình cảnh báo | `capacity:read` |
| POST | `/configs` | Tạo/cập nhật cấu hình | `capacity:create` |

### 💡 Hướng dẫn Cấu hình Sức chứa & Cảnh báo

#### 1. Phân biệt hai chỉ số Phần trăm (`capacity_pct` vs `alert_threshold_pct`):
* **`capacity_pct` (Tỷ lệ tải trọng THỰC TẾ - Hệ thống Tự tính)**:
  * Phản ánh **thực tế** lượng du khách đang có mặt tại địa điểm so với sức chứa tối đa.
  * Tự động tính toán khi ghi nhận lượng khách: `capacity_pct = (visitor_count / max_capacity) * 100`.
  * Biến động liên tục theo thời gian thực (từ 0% đến 100%+).
* **`alert_threshold_pct` (Ngưỡng cảnh báo GIỚI HẠN - Bạn Tự cài đặt)**:
  * Là **vạch định mức an toàn** do người quản trị tự thiết lập thủ công cho điểm du lịch (ví dụ: `50%` hoặc `80%`).
  * Có giá trị cố định. Khi tỷ lệ thực tế `capacity_pct` vượt quá ngưỡng `alert_threshold_pct` này, hệ thống sẽ tự động đổi màu cảnh báo nổi bật trên bản đồ và AI sẽ hạn chế gợi ý điểm này vào lịch trình tour để giảm tải.

#### 2. Phân biệt 2 loại API Cấu hình Sức chứa:
* **Cấu hình Sức chứa Cơ bản (`PATCH /spots/:spotId/settings`)**:
  * Lưu trữ trực tiếp trong bảng `tourism_spots`.
  * Dùng để thiết lập:
    * `max_capacity`: Sức chứa tối đa của điểm du lịch (phục vụ làm mẫu số tính tải trọng).
    * `alert_threshold_pct`: Ngưỡng cảnh báo an toàn cơ bản/hiển thị bản đồ/lọc AI.
* **Cấu hình Cảnh báo Nâng cao (`POST /configs`)**:
  * Lưu trữ trong bảng `capacity_alert_configs`.
  * Dùng để thiết lập các ngưỡng chi tiết và cấu hình thông báo:
    * `threshold_busy` / `threshold_near` / `threshold_over`: Các mức % tải trọng tương ứng với trạng thái Đông đúc, Sắp đầy và Quá tải.
    * `notify_roles` (Mảng ID): Danh sách các ID vai trò (Roles) trong hệ thống sẽ nhận tin nhắn đẩy (Push, Websocket, SSE) trực tiếp khi lượng khách thực tế vượt ngưỡng để kịp thời xử lý.

---

## 🏢 Businesses (Doanh nghiệp) — `/api/v1/businesses`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/public` | Danh sách đã duyệt (public) | Public |
| GET | `/vouchers/nearby` | Voucher gần vị trí | Public |
| POST | `/vouchers/validate` | Kiểm tra voucher | Public |
| GET | `/me` | Thông tin DN của tôi | Owner roles |
| POST | `/` | Đăng ký doanh nghiệp | Owner roles |
| GET | `/` | Tất cả DN (admin) | `businesses:read` |
| GET | `/:businessId` | Chi tiết DN | Optional |
| PATCH | `/:businessId` | Cập nhật DN | Owner roles |
| PATCH | `/:businessId/status` | Duyệt/từ chối DN | Reviewer roles |
| GET | `/:businessId/services` | Danh sách dịch vụ | Public |
| POST | `/:businessId/services` | Thêm dịch vụ | Owner roles |
| PATCH | `/:businessId/services/:serviceId` | Sửa dịch vụ | Owner roles |
| DELETE | `/:businessId/services/:serviceId` | Xóa dịch vụ | Owner roles |
| GET | `/:businessId/vouchers` | Danh sách voucher | Owner roles |
| POST | `/:businessId/vouchers` | Tạo voucher | Owner roles |
| PATCH | `/:businessId/vouchers/:voucherId` | Sửa voucher | Owner roles |
| DELETE | `/:businessId/vouchers/:voucherId` | Vô hiệu hoá voucher | Owner roles |

---

## 🗺️ Tours — `/api/v1/tours`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách public (có cache) | Optional |
| GET | `/admin` | Danh sách admin (no cache) | `tours:read` |
| GET | `/admin/:id` | Chi tiết admin | `tours:read` |
| GET | `/:id` | Chi tiết public | Optional |
| GET | `/:slug` | Chi tiết theo slug | Optional |
| POST | `/` | Tạo tour | `tours:create` |
| PATCH | `/:id` | Cập nhật | `tours:update` |
| DELETE | `/:id` | Xóa | `tours:delete` |
| GET | `/:id/stops` | Danh sách điểm dừng | Public |
| POST | `/:id/stops` | Thêm điểm dừng | `tours:update` |
| PATCH | `/:id/stops/:stopId` | Sửa điểm dừng | `tours:update` |
| DELETE | `/:id/stops/:stopId` | Xóa điểm dừng | `tours:update` |

---

## 🗺️ Itineraries (Lịch trình) — `/api/v1/itineraries`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/public` | Lịch trình công khai | Public |
| GET | `/my` | Lịch trình của tôi | Required |
| POST | `/` | Tạo lịch trình | Required |
| GET | `/:id` | Chi tiết | Optional |
| PATCH | `/:id` | Cập nhật | Required |
| DELETE | `/:id` | Xóa | Required |
| POST | `/:id/days` | Thêm ngày | Required |
| PATCH | `/:id/days/:dayId` | Sửa ngày | Required |
| DELETE | `/:id/days/:dayId` | Xóa ngày | Required |
| POST | `/:id/days/:dayId/activities` | Thêm hoạt động | Required |
| PATCH | `/:id/days/:dayId/activities/:actId` | Sửa hoạt động | Required |
| DELETE | `/:id/days/:dayId/activities/:actId` | Xóa hoạt động | Required |
| GET | `/:id/export/pdf` | Xuất PDF | Required |

---

## 🏛️ Governance (Quản trị hành chính) — `/api/v1/governance`

### Bộ VHTTDL
| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/ministry/overview` | Tổng quan du lịch toàn quốc | `governance:read` |
| GET | `/ministry/capacity-alerts` | Cảnh báo quá tải | `governance:read` |
| GET | `/ministry/conservation-summary` | Giám sát khu bảo tồn | `governance:read` |

### Sở VHTTDL
| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/department/registrations/businesses` | Đăng ký doanh nghiệp chờ duyệt | `governance:read` |
| PATCH | `/department/registrations/businesses/:id` | Duyệt/từ chối doanh nghiệp | `governance:update` |
| GET | `/department/registrations/spots` | Đăng ký điểm DL chờ duyệt | `governance:read` |
| PATCH | `/department/registrations/spots/:id` | Duyệt/từ chối điểm DL | `governance:update` |
| GET | `/department/feedbacks` | Phản ánh người dân | `governance:read` |
| POST | `/department/reports` | Tạo báo cáo | `governance:create` |
| GET | `/department/reports` | Danh sách báo cáo | `governance:read` |
| POST | `/department/reports/:id/send` | Gửi báo cáo lên Bộ | `governance:update` |
| GET | `/department/capacity-alerts` | Cảnh báo quá tải (Sở) | `governance:read` |
| GET | `/department/conservation-summary` | Giám sát khu bảo tồn (Sở) | `governance:read` |

### Doanh nghiệp
| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| POST | `/enterprise/reports` | Tạo báo cáo hoạt động | `governance:create` |
| GET | `/enterprise/reports` | Danh sách báo cáo | `governance:read` |
| GET | `/enterprise/businesses/:businessId/dashboard` | Dashboard doanh thu/tải | `governance:read` |
| PATCH | `/enterprise/businesses/:businessId` | Cập nhật thông tin DN | `governance:update` |
| GET | `/enterprise/businesses/:businessId/feedbacks` | Phản ánh gần doanh nghiệp | `governance:read` |

### Quản trị hệ thống
| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/admin/dashboard` | Dashboard tổng quan hệ thống | `governance:read` |
| GET | `/admin/traffic` | Phân tích lưu lượng truy cập | `governance:read` |
| GET | `/admin/permissions` | Danh sách quyền hệ thống | `permissions:read` |
| POST | `/admin/permissions` | Tạo quyền mới | `permissions:create` |
| GET | `/admin/roles/:roleId/permissions` | Quyền của role | `roles:read` |
| PUT | `/admin/roles/:roleId/permissions` | Thay thế toàn bộ quyền của role | `roles:update` |

---

## 🗺️ Map Admin — `/api/v1/map-admin`

| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/categories` | Danh mục bản đồ | `map_admin:read` |
| POST | `/categories` | Tạo danh mục | `map_admin:create` |
| PATCH | `/categories/:id` | Sửa danh mục | `map_admin:update` |
| DELETE | `/categories/:id` | Xóa danh mục | `map_admin:delete` |
| GET | `/layers` | Lớp dữ liệu bản đồ | `map_admin:read` |
| POST | `/layers` | Tạo lớp | `map_admin:create` |
| PATCH | `/layers/:id` | Sửa lớp | `map_admin:update` |
| PATCH | `/layers/:id/toggle` | Bật/tắt lớp | `map_admin:update` |
| DELETE | `/layers/:id` | Xóa lớp | `map_admin:delete` |
| GET | `/apis` | Danh sách Map API | `map_admin:read` |
| POST | `/apis` | Tạo Map API | `map_admin:create` |
| PATCH | `/apis/:id` | Sửa Map API | `map_admin:update` |
| DELETE | `/apis/:id` | Xóa Map API | `map_admin:delete` |
| GET | `/apis/:id/permissions` | Quyền truy cập API | `map_admin:read` |
| PUT | `/apis/:id/permissions` | Cập nhật quyền API | `map_admin:update` |
| DELETE | `/apis/:id/permissions/:permissionId` | Xóa quyền API | `map_admin:delete` |
| GET | `/api-keys` | Danh sách API Keys | `map_admin:read` |
| POST | `/api-keys` | Tạo API Key | `map_admin:create` |
| PATCH | `/api-keys/:id/revoke` | Thu hồi API Key | `map_admin:update` |

---

## 💬 Citizen Feedback (Phản ánh người dân) — `/api/v1/feedbacks`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách phản ánh công khai | Public |
| GET | `/me` | Phản ánh của tôi | Required |
| GET | `/admin/all` | Tất cả phản ánh (admin/Sở) | `feedbacks:read` |
| GET | `/:id` | Chi tiết | Optional |
| POST | `/` | Gửi phản ánh | Required |
| PUT | `/:id` | Cập nhật phản ánh | Required |
| PATCH | `/:id/status` | Cập nhật trạng thái | `feedbacks:update` |
| PATCH | `/:id/moderation` | Kiểm duyệt | `feedbacks:update` |
| DELETE | `/:id` | Xóa | `feedbacks:delete` |

---

## 🔔 Notifications — `/api/v1/notifications`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Thông báo của tôi | Required |
| GET | `/unread-count` | Số chưa đọc | Required |
| PATCH | `/:id/read` | Đánh dấu đã đọc | Required |
| PATCH | `/read-all` | Đánh dấu tất cả đã đọc | Required |
| DELETE | `/:id` | Xóa thông báo | Required |
| DELETE | `/` | Xóa tất cả | Required |
| POST | `/dispatch` | Gửi thông báo (admin) | `notifications:create` |

---

## ⭐ Ratings (Đánh giá) — `/api/v1/ratings`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/spots/:spotId` | Đánh giá điểm DL | Public |
| POST | `/spots/:spotId` | Gửi đánh giá | Required |
| PATCH | `/spots/:spotId/:ratingId` | Sửa đánh giá | Required |
| DELETE | `/spots/:spotId/:ratingId` | Xóa đánh giá | Required |

---

## 📋 Audit Logs (Nhật ký) — `/api/v1/audit-logs`

| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/` | Danh sách nhật ký | `audit_logs:read` |
| GET | `/visitor-statistics` | Thống kê lượt truy cập | `audit_logs:read` |

---

## 📈 Statistics — `/api/v1/statistics`

| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/data-files` | Danh sách file thống kê | `analytics:read` |
| GET | `/data-files/download/:filename` | Tải file thống kê | `analytics:read` |

---

## 🔍 Search — `/api/v1/search`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Tìm kiếm toàn văn (spots, tours, news...) | Public |

---

## 🌐 Geography — `/api/v1/geography`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/provinces` | Danh sách tỉnh/thành | Public |
| GET | `/districts` | Danh sách quận/huyện | Public |
| GET | `/wards` | Danh sách phường/xã | Public |

---

## 🤖 Chatbot AI — `/api/v1/chatbot`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/message` | Gửi tin nhắn chatbot | Optional |
| GET | `/history` | Lịch sử chat | Required |

### 📡 Chatbot AI Map Actions (`map_actions`) dành cho Frontend Design

Khi gửi tin nhắn đến Chatbot qua API `POST /message`, phản hồi trả về ngoài nội dung văn bản (`content`) còn có thể chứa mảng **`map_actions`**. Frontend sẽ tự động nhận diện các action này để điều phối, vẽ bản đồ và tương tác trực quan trên bản đồ Mapbox/OpenStreetMap của Client.

Các Action được thiết kế và hỗ trợ bao gồm:

| Action | Tham số mẫu (`payload`) | Ý nghĩa & Mô tả |
| :--- | :--- | :--- |
| **`fly_to`** | `{ "center": [lng, lat], "zoom": 15, "label": "Tràng An" }` | Bay camera đến vị trí tọa độ chỉ định (có hiệu ứng chuyển động mượt mà). |
| **`pan`** | `{ "center": [lng, lat] }` | Di chuyển tâm bản đồ đến tọa độ mà không thay đổi độ phóng to (zoom). |
| **`zoom`** | `{ "zoom": 14 }` | Thiết lập độ phóng to mong muốn của bản đồ (từ 1 đến 20). |
| **`highlight`** | `{ "spot_ids": ["uuid1", "uuid2"] }` | Làm nổi bật/tô sáng các điểm du lịch chỉ định trên bản đồ. |
| **`add_marker`** | `{ "center": [lng, lat], "label": "Điểm dừng chân", "color": "#FF0000" }` | Vẽ ghim (marker) mới lên bản đồ kèm nhãn và màu sắc tùy chỉnh. |
| **`fit_bounds`** | `{ "bounds": [[minLng, minLat], [maxLng, maxLat]], "padding": 50 }` | Tự động căn chỉnh và co dãn bản đồ để hiển thị trọn vẹn danh sách các địa điểm trong khung nhìn. |
| **`draw_route`** | `{ "coordinates": [[lng1, lat1], [lng2, lat2], ...], "color": "#0000FF", "label": "Tuyến đường gợi ý" }` | Vẽ tuyến đường đi nối giữa danh sách các điểm tọa độ chỉ định trên bản đồ. |
| **`clear_markers`** | `{ "scope": "ai" }` | Xóa các marker trên bản đồ. `scope: "ai"` để chỉ xóa các ghim do chatbot AI thêm, hoặc `"all"` để xóa toàn bộ. |
| **`show_popup`** | `{ "spot_id": "uuid", "center": [lng, lat], "html": "<b>Tràng An</b>" }` | Hiển thị bong bóng thông tin (popup) tại tọa độ cụ thể. |
| **`filter_layer`** | `{ "layers": ["festival", "ocop"], "visible": true }` | Bật/tắt các lớp dữ liệu bản đồ chỉ định (ví dụ: lớp lễ hội, sản phẩm OCOP). |

---

## 📡 Integrations (Tích hợp bên thứ 3) — `/api/v1/integrations`

| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/` | Danh sách tích hợp | `integrations:read` |
| POST | `/` | Tạo tích hợp | `integrations:create` |
| PATCH | `/:id` | Cập nhật | `integrations:update` |
| DELETE | `/:id` | Xóa | `integrations:delete` |

---

## 🗺️ Map Data — `/api/v1/map-data` (External API Key)

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/layers` | Lấy lớp dữ liệu bản đồ | API Key |
| GET | `/spots` | Dữ liệu điểm DL cho bản đồ | API Key |

---

## 📱 VR / AR

### VR Hotspots — `/api/v1/spots`
| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/:spotId/vr-hotspots` | Hotspot VR của điểm DL | Public |
| POST | `/:spotId/vr-hotspots` | Tạo hotspot | `spots:update` |
| PATCH | `/:spotId/vr-hotspots/:id` | Sửa hotspot | `spots:update` |
| DELETE | `/:spotId/vr-hotspots/:id` | Xóa hotspot | `spots:update` |

### AR Sessions — `/api/v1/ar-sessions`
| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/` | Bắt đầu phiên AR | Required |
| GET | `/me` | Lịch sử AR của tôi | Required |

---

## 📍 GPS & Offline

### GPS — `/api/v1/gps`
| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/track` | Ghi nhận vị trí GPS | Required |

### Offline — `/api/v1/offline`
| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/package/:spotId` | Tải gói offline cho điểm DL | Required |

---

## 🎬 Vlogs — `/api/v1/vlogs`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách vlog công khai | Public |
| GET | `/me` | Vlog của tôi | Required |
| GET | `/:id` | Chi tiết vlog | Optional |
| POST | `/` | Tạo vlog | Required |
| PATCH | `/:id` | Cập nhật | Required |
| DELETE | `/:id` | Xóa | Required |
| POST | `/:id/like` | Thích vlog | Required |
| DELETE | `/:id/like` | Bỏ thích | Required |

---

## 🏥 Health Check

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/health` | Trạng thái hệ thống (DB pool, cache, memory) | Token tùy chọn |

**Response mẫu:**
```json
{
  "status": "healthy",
  "database": { "healthy": true, "pool": { "utilization_pct": 12 } },
  "cache": { "hits": 450, "misses": 50, "hitRate": 90 },
  "memory": { "heap_used_mb": 128 },
  "warnings": { "critical": [], "warning": [] }
}
```

---

## ⚙️ Biến môi trường quan trọng

| Biến | Mô tả | Mặc định |
|---|---|---|
| `PORT` | Cổng HTTP | `8881` |
| `DB_HOST` | PostgreSQL host | — |
| `DB_POOL_MAX` | Max DB connections | `25` |
| `DB_SLOW_QUERY_MS` | Ngưỡng slow query log | `500` |
| `CLUSTER_WORKERS` | Số worker cluster | `floor(CPUs/2)` |
| `REPORT_CRON_WEEKLY` | Lịch báo cáo tuần | `0 7 * * 1` |
| `REPORT_CRON_MONTHLY` | Lịch báo cáo tháng | `0 7 1 * *` |
| `HEALTH_CHECK_TOKEN` | Token bảo vệ `/health` | — |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |

---

## 🔑 Role Codes

| Code | Vai trò |
|---|---|
| `system_admin` | Quản trị hệ thống |
| `ministry_manager` | Bộ VHTTDL |
| `department_manager` | Sở VHTTDL |
| `spot_operator` | Đơn vị vận hành điểm DL |
| `travel_company` | Công ty lữ hành |
| `service_provider` | Đơn vị cung cấp dịch vụ |
| `tourist` | Du khách |
