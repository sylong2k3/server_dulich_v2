-- ============================================================
-- Phase 5: Permission seed chuẩn hóa theo route nghiệp vụ
-- Dự án: Du Lịch Ninh Bình WebGIS/MobileGIS
--
-- Mục tiêu:
-- 1. Seed đầy đủ các permission đang được route middleware checkPermission(resource, action) sử dụng.
-- 2. Gán permission theo role mới: system_admin, ministry_manager,
--    department_manager, spot_operator, travel_company, service_provider, tourist.
-- 3. Giữ compatibility với resource/action cũ vì runtime hiện kiểm tra theo cặp
--    auth.permissions(resource, action), không dùng tên permission dạng chuỗi.
--
-- Chạy an toàn nhiều lần (idempotent).
-- ============================================================

BEGIN;

-- ============================================================
-- 1) Upsert canonical permissions từ route hiện tại
-- ============================================================

WITH permission_seed(resource, action, name_vi, description) AS (
    VALUES
        ('analytics', 'read', 'Xem phân tích thống kê', 'Xem dashboard, báo cáo, thống kê hệ thống và nghiệp vụ'),
        ('audit_logs', 'read', 'Xem nhật ký kiểm toán', 'Tra cứu audit logs phục vụ quản trị và giám sát'),

        ('businesses', 'read', 'Xem doanh nghiệp', 'Xem danh sách và chi tiết doanh nghiệp du lịch'),
        ('businesses', 'update', 'Cập nhật/duyệt doanh nghiệp', 'Cập nhật trạng thái, phê duyệt hoặc quản trị thông tin doanh nghiệp'),

        ('capacity', 'create', 'Ghi nhận sức chứa', 'Tạo dữ liệu sức chứa/lượt khách tại điểm du lịch'),
        ('capacity', 'read', 'Xem sức chứa', 'Xem dữ liệu sức chứa và cảnh báo quá tải'),

        ('culinary', 'create', 'Tạo đặc sản/ẩm thực', 'Tạo nội dung ẩm thực, đặc sản địa phương'),
        ('culinary', 'update', 'Cập nhật đặc sản/ẩm thực', 'Cập nhật nội dung ẩm thực, đặc sản địa phương'),
        ('culinary', 'delete', 'Xóa đặc sản/ẩm thực', 'Xóa hoặc ẩn nội dung ẩm thực, đặc sản địa phương'),

        ('feedbacks', 'read', 'Xem phản ánh', 'Xem phản ánh, góp ý của người dân/du khách'),
        ('feedbacks', 'update', 'Xử lý phản ánh', 'Cập nhật trạng thái, phản hồi và xử lý phản ánh'),
        ('feedbacks', 'delete', 'Xóa phản ánh', 'Xóa hoặc đóng phản ánh không hợp lệ'),

        ('festivals', 'create', 'Tạo lễ hội/sự kiện', 'Tạo nội dung lễ hội và sự kiện du lịch'),
        ('festivals', 'update', 'Cập nhật lễ hội/sự kiện', 'Cập nhật nội dung lễ hội và sự kiện du lịch'),
        ('festivals', 'delete', 'Xóa lễ hội/sự kiện', 'Xóa hoặc ẩn lễ hội và sự kiện du lịch'),

        ('governance', 'create', 'Tạo dữ liệu quản trị', 'Tạo cấu hình/dữ liệu nghiệp vụ quản trị'),
        ('governance', 'read', 'Xem dữ liệu quản trị', 'Xem dữ liệu governance, cấu hình và metadata hệ thống'),
        ('governance', 'update', 'Cập nhật dữ liệu quản trị', 'Cập nhật cấu hình/dữ liệu governance'),

        ('integrations', 'create', 'Tạo tích hợp', 'Tạo cấu hình tích hợp hệ thống ngoài'),
        ('integrations', 'read', 'Xem tích hợp', 'Xem cấu hình và trạng thái tích hợp'),
        ('integrations', 'update', 'Cập nhật tích hợp', 'Cập nhật cấu hình tích hợp'),
        ('integrations', 'delete', 'Xóa tích hợp', 'Xóa hoặc vô hiệu hóa tích hợp'),

        ('map_admin', 'create', 'Tạo cấu hình bản đồ', 'Tạo layer, basemap, API key hoặc cấu hình bản đồ'),
        ('map_admin', 'read', 'Xem cấu hình bản đồ', 'Xem cấu hình WebGIS/MobileGIS'),
        ('map_admin', 'update', 'Cập nhật cấu hình bản đồ', 'Cập nhật layer, basemap hoặc cấu hình bản đồ'),
        ('map_admin', 'delete', 'Xóa cấu hình bản đồ', 'Xóa hoặc vô hiệu hóa cấu hình bản đồ'),

        ('news', 'create', 'Tạo tin tức', 'Tạo nội dung tin tức/bài viết du lịch'),
        ('news', 'read', 'Xem tin tức quản trị', 'Xem tin tức ở giao diện quản trị/duyệt nội dung'),
        ('news', 'update', 'Cập nhật tin tức', 'Cập nhật hoặc xuất bản tin tức'),
        ('news', 'delete', 'Xóa tin tức', 'Xóa hoặc ẩn tin tức'),

        ('notifications', 'create', 'Gửi thông báo', 'Tạo và gửi thông báo đến người dùng/nhóm vai trò'),

        ('ocop', 'create', 'Tạo OCOP', 'Tạo sản phẩm OCOP'),
        ('ocop', 'update', 'Cập nhật OCOP', 'Cập nhật sản phẩm OCOP'),
        ('ocop', 'delete', 'Xóa OCOP', 'Xóa hoặc vô hiệu hóa sản phẩm OCOP'),

        ('permissions', 'create', 'Tạo permission', 'Tạo permission mới trong hệ thống RBAC'),
        ('permissions', 'read', 'Xem permission', 'Xem danh sách permission RBAC'),

        ('ratings', 'read', 'Xem đánh giá quản trị', 'Xem đánh giá cần quản lý/duyệt/phản hồi'),
        ('ratings', 'update', 'Phản hồi đánh giá', 'Phản hồi hoặc cập nhật nội dung liên quan đánh giá'),
        ('ratings', 'delete', 'Duyệt/xóa đánh giá', 'Duyệt trạng thái hoặc xóa đánh giá theo quyền'),

        ('roles', 'create', 'Tạo vai trò', 'Tạo role RBAC'),
        ('roles', 'read', 'Xem vai trò', 'Xem danh sách và chi tiết role'),
        ('roles', 'update', 'Cập nhật vai trò', 'Cập nhật role và gán permission'),
        ('roles', 'delete', 'Xóa vai trò', 'Xóa role RBAC'),

        ('spot_categories', 'create', 'Tạo danh mục điểm du lịch', 'Tạo danh mục phân loại điểm du lịch'),
        ('spot_categories', 'read', 'Xem danh mục điểm du lịch', 'Xem danh mục phân loại điểm du lịch'),
        ('spot_categories', 'update', 'Cập nhật danh mục điểm du lịch', 'Cập nhật danh mục phân loại điểm du lịch'),
        ('spot_categories', 'delete', 'Xóa danh mục điểm du lịch', 'Xóa danh mục phân loại điểm du lịch'),

        ('spots', 'create', 'Tạo điểm du lịch', 'Tạo điểm du lịch và dữ liệu media liên quan'),
        ('spots', 'read', 'Xem điểm du lịch quản trị', 'Xem điểm du lịch ở giao diện quản trị'),
        ('spots', 'update', 'Cập nhật điểm du lịch', 'Cập nhật điểm du lịch, media, VR hotspot'),
        ('spots', 'delete', 'Xóa điểm du lịch', 'Xóa hoặc vô hiệu hóa điểm du lịch'),

        ('tours', 'create', 'Tạo tour', 'Tạo tour/chương trình du lịch'),
        ('tours', 'update', 'Cập nhật tour', 'Cập nhật tour và các điểm dừng'),
        ('tours', 'delete', 'Xóa tour', 'Xóa hoặc vô hiệu hóa tour'),

        ('users', 'create', 'Tạo người dùng', 'Tạo tài khoản người dùng'),
        ('users', 'read', 'Xem người dùng', 'Xem danh sách và chi tiết người dùng'),
        ('users', 'update', 'Cập nhật người dùng', 'Cập nhật người dùng, trạng thái hoặc vai trò'),
        ('users', 'delete', 'Xóa người dùng', 'Xóa hoặc vô hiệu hóa người dùng'),

        ('vlogs', 'read', 'Xem vlog quản trị', 'Xem vlog ở giao diện kiểm duyệt/quản trị'),
        ('vlogs', 'update', 'Duyệt/cập nhật vlog', 'Cập nhật trạng thái kiểm duyệt vlog')
)
INSERT INTO auth.permissions (resource, action, name_vi, description)
SELECT resource, action, name_vi, description
FROM permission_seed
ON CONFLICT (resource, action) DO UPDATE SET
    name_vi = EXCLUDED.name_vi,
    description = EXCLUDED.description;

-- ============================================================
-- 2) Role-permission matrix
-- ============================================================

-- system_admin vẫn bypass trong code, nhưng vẫn gán full permission để minh bạch dữ liệu.
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth.roles r
CROSS JOIN auth.permissions p
WHERE r.code = 'system_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Bộ: quản lý/giám sát cấp cao, governance, analytics, cấu hình và phê duyệt nội dung.
WITH role_permission_seed(role_code, resource, action) AS (
    VALUES
        ('ministry_manager', 'analytics', 'read'),
        ('ministry_manager', 'audit_logs', 'read'),
        ('ministry_manager', 'businesses', 'read'),
        ('ministry_manager', 'businesses', 'update'),
        ('ministry_manager', 'capacity', 'read'),
        ('ministry_manager', 'culinary', 'create'),
        ('ministry_manager', 'culinary', 'update'),
        ('ministry_manager', 'culinary', 'delete'),
        ('ministry_manager', 'feedbacks', 'read'),
        ('ministry_manager', 'feedbacks', 'update'),
        ('ministry_manager', 'feedbacks', 'delete'),
        ('ministry_manager', 'festivals', 'create'),
        ('ministry_manager', 'festivals', 'update'),
        ('ministry_manager', 'festivals', 'delete'),
        ('ministry_manager', 'governance', 'create'),
        ('ministry_manager', 'governance', 'read'),
        ('ministry_manager', 'governance', 'update'),
        ('ministry_manager', 'integrations', 'read'),
        ('ministry_manager', 'map_admin', 'create'),
        ('ministry_manager', 'map_admin', 'read'),
        ('ministry_manager', 'map_admin', 'update'),
        ('ministry_manager', 'news', 'create'),
        ('ministry_manager', 'news', 'read'),
        ('ministry_manager', 'news', 'update'),
        ('ministry_manager', 'news', 'delete'),
        ('ministry_manager', 'notifications', 'create'),
        ('ministry_manager', 'ocop', 'create'),
        ('ministry_manager', 'ocop', 'update'),
        ('ministry_manager', 'ocop', 'delete'),
        ('ministry_manager', 'permissions', 'read'),
        ('ministry_manager', 'ratings', 'read'),
        ('ministry_manager', 'ratings', 'update'),
        ('ministry_manager', 'ratings', 'delete'),
        ('ministry_manager', 'roles', 'read'),
        ('ministry_manager', 'spot_categories', 'create'),
        ('ministry_manager', 'spot_categories', 'read'),
        ('ministry_manager', 'spot_categories', 'update'),
        ('ministry_manager', 'spot_categories', 'delete'),
        ('ministry_manager', 'spots', 'create'),
        ('ministry_manager', 'spots', 'read'),
        ('ministry_manager', 'spots', 'update'),
        ('ministry_manager', 'spots', 'delete'),
        ('ministry_manager', 'tours', 'create'),
        ('ministry_manager', 'tours', 'update'),
        ('ministry_manager', 'tours', 'delete'),
        ('ministry_manager', 'users', 'read'),
        ('ministry_manager', 'vlogs', 'read'),
        ('ministry_manager', 'vlogs', 'update'),

        -- Sở: quản lý vận hành/phê duyệt trong phạm vi địa phương (scope xử lý ở middleware/service).
        ('department_manager', 'analytics', 'read'),
        ('department_manager', 'businesses', 'read'),
        ('department_manager', 'businesses', 'update'),
        ('department_manager', 'capacity', 'create'),
        ('department_manager', 'capacity', 'read'),
        ('department_manager', 'culinary', 'create'),
        ('department_manager', 'culinary', 'update'),
        ('department_manager', 'culinary', 'delete'),
        ('department_manager', 'feedbacks', 'read'),
        ('department_manager', 'feedbacks', 'update'),
        ('department_manager', 'festivals', 'create'),
        ('department_manager', 'festivals', 'update'),
        ('department_manager', 'festivals', 'delete'),
        ('department_manager', 'governance', 'read'),
        ('department_manager', 'map_admin', 'read'),
        ('department_manager', 'news', 'create'),
        ('department_manager', 'news', 'read'),
        ('department_manager', 'news', 'update'),
        ('department_manager', 'notifications', 'create'),
        ('department_manager', 'ocop', 'create'),
        ('department_manager', 'ocop', 'update'),
        ('department_manager', 'ratings', 'read'),
        ('department_manager', 'ratings', 'update'),
        ('department_manager', 'ratings', 'delete'),
        ('department_manager', 'spot_categories', 'read'),
        ('department_manager', 'spot_categories', 'update'),
        ('department_manager', 'spots', 'create'),
        ('department_manager', 'spots', 'read'),
        ('department_manager', 'spots', 'update'),
        ('department_manager', 'tours', 'create'),
        ('department_manager', 'tours', 'update'),
        ('department_manager', 'users', 'read'),
        ('department_manager', 'vlogs', 'read'),
        ('department_manager', 'vlogs', 'update'),

        -- Đơn vị vận hành điểm du lịch: quản lý điểm/tour/sức chứa/review thuộc quyền sở hữu.
        ('spot_operator', 'capacity', 'create'),
        ('spot_operator', 'capacity', 'read'),
        ('spot_operator', 'ratings', 'read'),
        ('spot_operator', 'ratings', 'update'),
        ('spot_operator', 'spots', 'create'),
        ('spot_operator', 'spots', 'read'),
        ('spot_operator', 'spots', 'update'),
        ('spot_operator', 'tours', 'create'),
        ('spot_operator', 'tours', 'update'),

        -- Công ty lữ hành: quản lý tour và xem dữ liệu điểm phục vụ xây tuyến.
        ('travel_company', 'ratings', 'read'),
        ('travel_company', 'spots', 'read'),
        ('travel_company', 'tours', 'create'),
        ('travel_company', 'tours', 'update'),
        ('travel_company', 'tours', 'delete'),

        -- Đơn vị cung cấp dịch vụ: quản lý business/service/voucher/OCOP và phản hồi review của mình.
        ('service_provider', 'businesses', 'read'),
        ('service_provider', 'businesses', 'update'),
        ('service_provider', 'ocop', 'create'),
        ('service_provider', 'ocop', 'update'),
        ('service_provider', 'ratings', 'read'),
        ('service_provider', 'ratings', 'update'),
        ('service_provider', 'spots', 'read'),

        -- Tourist hiện chủ yếu dùng route authenticated/ownership, không cần checkPermission ở route.
        -- Giữ tối thiểu read nếu dùng UI quản lý danh mục/điểm có auth trong tương lai.
        ('tourist', 'spots', 'read'),
        ('tourist', 'spot_categories', 'read')
)
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_permission_seed seed
JOIN auth.roles r ON r.code = seed.role_code
JOIN auth.permissions p ON p.resource = seed.resource AND p.action = seed.action
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;
