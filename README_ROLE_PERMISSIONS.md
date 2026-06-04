# Phân quyền Admin theo Role

Tài liệu này mô tả quyền admin theo từng role trong hệ thống du lịch. Mục tiêu là làm rõ role nào được vào admin, được thao tác gì, và bị giới hạn dữ liệu theo phạm vi nào.

Hệ thống phân quyền theo 3 lớp:

1. **Role**: nhóm người dùng, ví dụ `system_admin`, `department_manager`, `tourist`.
2. **Permission**: quyền thao tác dạng `resource:action`, ví dụ `spots:read`, `tours:update`.
3. **Phạm vi dữ liệu**: cùng có quyền `read`, nhưng mỗi role chỉ được xem/sửa trong phạm vi phù hợp. Ví dụ Bộ xem toàn quốc, Sở xem theo tỉnh, doanh nghiệp xem dữ liệu của mình.

Backend bảo vệ API bằng:

- `authenticateToken`: yêu cầu đăng nhập.
- `checkPermission(resource, action)`: kiểm tra permission của role.
- `requireRole([...])`: giới hạn trực tiếp theo role code.
- Service scope: giới hạn dữ liệu theo role, `province_code`, `business_id`, `owner_id`, hoặc `created_by`.

## Role Codes

| Code | Vai trò |
|---|---|
| `system_admin` | Quản trị hệ thống |
| `ministry_manager` | Bộ VHTTDL |
| `department_manager` | Sở VHTTDL |
| `spot_operator` | Đơn vị vận hành điểm DL |
| `travel_company` | Công ty lữ hành |
| `service_provider` | Đơn vị cung cấp dịch vụ |
| `tourist` | Du khách |

## Nguyên tắc chung

| Role | Nguyên tắc quyền |
|---|---|
| `system_admin` | Toàn quyền hệ thống, bypass permission. |
| `ministry_manager` | Giám sát cấp Bộ, ưu tiên xem toàn quốc và duyệt/điều phối nghiệp vụ. |
| `department_manager` | Quản lý cấp Sở, thao tác trong phạm vi tỉnh được gán bằng `province_code`. |
| `spot_operator` | Quản lý điểm du lịch, sức chứa, dịch vụ/voucher liên quan đơn vị mình. |
| `travel_company` | Quản lý doanh nghiệp lữ hành, tour, lịch trình, dịch vụ/voucher của mình. |
| `service_provider` | Quản lý dịch vụ du lịch, OCOP, voucher, rating của doanh nghiệp mình. |
| `tourist` | Người dùng cuối, không được truy cập khu vực admin. |

## `system_admin` - Quản trị hệ thống

`system_admin` là role cao nhất. Trong model user, role này được bypass toàn bộ kiểm tra permission.

Được làm:

- Quản lý tài khoản: `users:read`, `users:create`, `users:update`, `users:delete`.
- Quản lý role: `roles:read`, `roles:create`, `roles:update`, `roles:delete`.
- Quản lý permission: `permissions:read`, `permissions:create`, `permissions:update`.
- Gán role cho user khác.
- Quản trị bản đồ/API key/layer/category: `map_admin:read`, `map_admin:create`, `map_admin:update`, `map_admin:delete`.
- Quản trị toàn bộ điểm du lịch, tour, OCOP, lễ hội, ẩm thực, tin tức, vlog, phản ánh, sức chứa.
- Xem audit log, thống kê, analytics, tích hợp hệ thống.

Không bị giới hạn:

- Không giới hạn theo tỉnh.
- Không giới hạn theo doanh nghiệp.
- Không giới hạn theo người tạo dữ liệu.

## `ministry_manager` - Bộ VHTTDL

`ministry_manager` là role giám sát cấp quốc gia. Role này nên thiên về xem, thống kê, duyệt và điều phối, không phải quản trị kỹ thuật hệ thống.

Được làm:

- Xem dashboard, báo cáo và số liệu quản trị toàn quốc: `governance:read`.
- Xem cảnh báo, thống kê và dữ liệu sức chứa toàn quốc: `capacity:read`.
- Xem điểm du lịch toàn hệ thống: `spots:read`.
- Xem tour toàn hệ thống: `tours:read`.
- Xem OCOP toàn hệ thống: `ocop:read`.
- Xem danh sách doanh nghiệp và hồ sơ đăng ký.
- Duyệt hoặc từ chối doanh nghiệp nếu nghiệp vụ cấp Bộ cho phép.
- Xem và xử lý phản ánh ở cấp giám sát: `feedbacks:read`, `feedbacks:update`.
- Xem báo cáo từ Sở và doanh nghiệp.

Không nên được làm:

- Không quản lý users, roles, permissions.
- Không quản trị map admin/API key/layer.
- Không xóa dữ liệu hệ thống.
- Không ghi nhận hoặc cập nhật cấu hình sức chứa. Code hiện tại đang giới hạn Bộ chỉ được xem `capacity`.
- Không sửa dữ liệu doanh nghiệp/điểm/tour nếu không có quy trình duyệt rõ ràng.

Phạm vi dữ liệu:

- Được xem toàn quốc.
- Không bị giới hạn theo `province_code`.
- Chủ yếu là quyền đọc và giám sát.

## `department_manager` - Sở VHTTDL

`department_manager` là role quản lý địa phương. Dữ liệu phải được giới hạn theo `province_code` của user.

Được làm:

- Xem dashboard, báo cáo cấp Sở: `governance:read`.
- Tạo/gửi báo cáo cấp Sở: `governance:create`, `governance:update`.
- Xem doanh nghiệp, điểm du lịch, tour, OCOP trong tỉnh.
- Duyệt hoặc từ chối doanh nghiệp trong tỉnh.
- Xử lý phản ánh trong tỉnh: `feedbacks:read`, `feedbacks:update`.
- Kiểm duyệt rating/review khi cần: `ratings:delete` hoặc quyền moderation tương ứng.
- Xem, tạo, cập nhật điểm du lịch trong tỉnh: `spots:read`, `spots:create`, `spots:update`.
- Xem, cập nhật tour trong tỉnh: `tours:read`, `tours:update`.
- Xem, cập nhật OCOP trong tỉnh: `ocop:read`, `ocop:update`.
- Xem, ghi nhận, cập nhật dữ liệu sức chứa trong tỉnh: `capacity:read`, `capacity:create`, `capacity:update`.

Không nên được làm:

- Không quản trị users, roles, permissions toàn hệ thống.
- Không quản trị map admin/API key/layer.
- Không xem hoặc sửa dữ liệu ngoài tỉnh.
- Không gán role cấp ngang hoặc cao hơn mình.
- Không xóa dữ liệu quan trọng nếu chưa có quy trình duyệt/xác nhận.

Phạm vi dữ liệu:

- Dựa vào `user.province_code`.
- Nếu thiếu `province_code`, các API cần chặn hoặc yêu cầu bổ sung để tránh xem nhầm dữ liệu toàn quốc.

## `spot_operator` - Đơn vị vận hành điểm du lịch

`spot_operator` là role vận hành điểm du lịch. Role này chỉ quản lý dữ liệu do mình tạo hoặc dữ liệu liên kết với doanh nghiệp/điểm của mình.

Được làm:

- Đăng ký doanh nghiệp vận hành điểm du lịch.
- Xem và cập nhật doanh nghiệp của mình.
- Quản lý điểm du lịch mình vận hành: `spots:read`, `spots:create`, `spots:update`.
- Quản lý media, VR, hotspot của điểm mình vận hành. Các route này dùng `spots:update`.
- Xem và ghi nhận sức chứa tại điểm mình quản lý: `capacity:read`, `capacity:create`, `capacity:update`.
- Cấu hình cảnh báo sức chứa cho điểm cụ thể mình có quyền.
- Quản lý dịch vụ/voucher thuộc doanh nghiệp của mình.
- Quản lý OCOP thuộc doanh nghiệp hoặc điểm mình vận hành: `ocop:read`, `ocop:create`, `ocop:update`, `ocop:delete`.
- Xem dashboard doanh nghiệp: `governance:read`.
- Tạo báo cáo hoạt động doanh nghiệp: `governance:create`.
- Cập nhật thông tin doanh nghiệp của mình: `governance:update`.

Không nên được làm:

- Không xem/sửa điểm du lịch của đơn vị khác.
- Không duyệt doanh nghiệp.
- Không kiểm duyệt phản ánh cấp Sở/Bộ.
- Không quản lý users, roles, permissions.
- Không quản trị map admin.
- Không xem báo cáo toàn tỉnh hoặc toàn quốc.

Phạm vi dữ liệu:

- Theo `created_by` của điểm du lịch.
- Theo `business_id` hoặc quan hệ doanh nghiệp liên kết với điểm.
- Khi ghi dữ liệu sức chứa, bắt buộc kiểm tra quyền với `spot_id` cụ thể.

## `travel_company` - Công ty lữ hành

`travel_company` là role doanh nghiệp lữ hành. Trọng tâm là tour, lịch trình, booking, dịch vụ và voucher của doanh nghiệp mình.

Được làm:

- Đăng ký doanh nghiệp lữ hành.
- Xem và cập nhật doanh nghiệp của mình.
- Quản lý tour thuộc doanh nghiệp mình: `tours:read`, `tours:create`, `tours:update`, `tours:delete`.
- Quản lý điểm dừng, sắp xếp lịch trình tour. Các route này dùng `tours:update`.
- Xem điểm du lịch để xây dựng tour: `spots:read`.
- Quản lý dịch vụ/voucher của doanh nghiệp mình.
- Xem hoặc cập nhật sức chứa nếu có điểm/dịch vụ liên kết: `capacity:read`, `capacity:create`, `capacity:update`.
- Xem dashboard doanh nghiệp: `governance:read`.
- Tạo báo cáo hoạt động doanh nghiệp: `governance:create`.
- Cập nhật thông tin doanh nghiệp của mình: `governance:update`.
- Quản lý OCOP nếu sản phẩm thuộc doanh nghiệp mình.

Không nên được làm:

- Không sửa tour của doanh nghiệp khác.
- Không quản lý điểm du lịch không thuộc mình.
- Không duyệt doanh nghiệp.
- Không kiểm duyệt phản ánh/rating cấp quản lý.
- Không quản trị users, roles, permissions.
- Không quản trị map admin.

Phạm vi dữ liệu:

- Theo `business_id` của user.
- Tour, voucher, service, báo cáo chỉ nằm trong doanh nghiệp của mình.

## `service_provider` - Đơn vị cung cấp dịch vụ du lịch

`service_provider` là role doanh nghiệp dịch vụ như lưu trú, nhà hàng, vận chuyển, thuê xe, dịch vụ địa phương.

Được làm:

- Đăng ký doanh nghiệp dịch vụ.
- Xem và cập nhật doanh nghiệp của mình.
- Quản lý dịch vụ của doanh nghiệp mình.
- Quản lý voucher của doanh nghiệp mình.
- Quản lý OCOP/sản phẩm thuộc doanh nghiệp mình: `ocop:read`, `ocop:create`, `ocop:update`, `ocop:delete`.
- Xem rating của business mình và phản hồi rating: `ratings:read`, `ratings:update`.
- Xem dashboard doanh nghiệp: `governance:read`.
- Tạo báo cáo hoạt động doanh nghiệp: `governance:create`.
- Cập nhật thông tin doanh nghiệp của mình: `governance:update`.
- Xem/cập nhật sức chứa nếu dịch vụ có liên kết với điểm du lịch: `capacity:read`, `capacity:create`, `capacity:update`.

Không nên được làm:

- Không quản lý tour nếu hệ thống không muốn đơn vị dịch vụ bán tour.
- Không xem/sửa dữ liệu doanh nghiệp khác.
- Không duyệt doanh nghiệp.
- Không kiểm duyệt phản ánh/rating cấp quản lý.
- Không quản trị users, roles, permissions.
- Không quản trị map admin.

Phạm vi dữ liệu:

- Theo `business_id`.
- Chỉ service, voucher, OCOP, rating, báo cáo thuộc doanh nghiệp của mình.

## `tourist` - Du khách

`tourist` là người dùng cuối, không phải admin. Role này không được cấp quyền admin.

Được làm:

- Xem dữ liệu public: điểm du lịch active, tour published, OCOP active, lễ hội, tin tức.
- Tạo phản ánh của mình.
- Viết rating/review.
- Quản lý hồ sơ cá nhân.
- Sử dụng itinerary, chatbot, tính năng public/user-facing nếu có.

Không được làm:

- Không truy cập khu vực admin.
- Không có `users:*`.
- Không có `roles:*`.
- Không có `permissions:*`.
- Không có `governance:*`.
- Không có `map_admin:*`.
- Không có `capacity:*`.
- Không có `spots:create`, `spots:update`, `spots:delete`.
- Không có `tours:create`, `tours:update`, `tours:delete`.
- Không có quyền duyệt/xóa phản ánh, rating, nội dung.

## Permission resource dùng cho menu admin

Frontend admin nên ẩn/hiện menu theo permission của user. Các resource đang được route backend sử dụng gồm:

| Resource | Ý nghĩa | Action thường dùng |
|---|---|---|
| `users` | Quản lý người dùng | `read`, `create`, `update`, `delete` |
| `roles` | Quản lý vai trò | `read`, `create`, `update`, `delete` |
| `permissions` | Quản lý quyền hệ thống | `read`, `create`, `update` |
| `governance` | Dashboard, báo cáo, điều hành Bộ/Sở/Doanh nghiệp | `read`, `create`, `update` |
| `map_admin` | Quản trị bản đồ, layer, API, API key | `read`, `create`, `update`, `delete` |
| `spots` | Điểm du lịch, media, VR, hotspot | `read`, `create`, `update`, `delete` |
| `spot_categories` | Danh mục điểm du lịch | `read`, `create`, `update`, `delete` |
| `capacity` | Sức chứa, lịch sử, thống kê, cấu hình cảnh báo | `read`, `create`, `update` |
| `businesses` | Doanh nghiệp du lịch | `read` |
| `tours` | Tour, lịch trình, điểm dừng | `read`, `create`, `update`, `delete` |
| `ocop` | Sản phẩm OCOP | `read`, `create`, `update`, `delete` |
| `festivals` | Lễ hội | `read`, `create`, `update`, `delete` |
| `culinary` | Ẩm thực | `create`, `update`, `delete` |
| `news` | Tin tức, duyệt bình luận | `read`, `create`, `update`, `delete` |
| `vlogs` | Vlog, kiểm duyệt vlog | `read`, `update` |
| `feedbacks` | Phản ánh công dân/du khách | `read`, `update`, `delete` |
| `ratings` | Đánh giá, phản hồi, kiểm duyệt | `read`, `update`, `delete` |
| `notifications` | Tạo/gửi thông báo | `create` |
| `analytics` | Thống kê, AR session, data files | `read` |
| `audit_logs` | Nhật ký hệ thống | `read` |
| `integrations` | Tích hợp ngoài và đồng bộ | `read`, `create`, `update`, `delete` |

## Gợi ý ma trận quyền admin

| Role | Quyền nên cấp |
|---|---|
| `system_admin` | Tất cả permission. |
| `ministry_manager` | `governance:read`, `capacity:read`, `spots:read`, `tours:read`, `ocop:read`, `businesses:read`, `feedbacks:read`, `feedbacks:update`, `analytics:read`. |
| `department_manager` | `governance:read/create/update`, `capacity:read/create/update`, `spots:read/create/update`, `tours:read/update`, `ocop:read/update`, `businesses:read`, `feedbacks:read/update`, `ratings:delete`, `analytics:read`. |
| `spot_operator` | `governance:read/create/update`, `capacity:read/create/update`, `spots:read/create/update`, `ocop:read/create/update/delete`, `ratings:read/update`. |
| `travel_company` | `governance:read/create/update`, `capacity:read/create/update`, `spots:read`, `tours:read/create/update/delete`, `ocop:read/create/update/delete`, `ratings:read/update`. |
| `service_provider` | `governance:read/create/update`, `capacity:read/create/update`, `ocop:read/create/update/delete`, `ratings:read/update`. |
| `tourist` | Không cấp permission admin. |

Lưu ý: permission chỉ là điều kiện đầu tiên. Một API vẫn cần kiểm tra phạm vi dữ liệu trong service để tránh user thao tác dữ liệu ngoài tỉnh hoặc ngoài doanh nghiệp của mình.
