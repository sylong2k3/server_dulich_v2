-- ============================================================
-- Chuẩn hoá dữ liệu thông báo theo từng VAI TRÒ (role)
--
-- Nguyên tắc loại thông báo hợp lệ theo role:
--   system_admin       : system, system_report
--   ministry_manager   : system_report, capacity_alert
--   department_manager : system_report, capacity_alert, business_registration, feedback_new
--   spot_operator      : capacity_alert, feedback_new, feedback_status_updated, system_report
--   travel_company     : congestion, festival, promo, system_report
--   service_provider   : business_*, feedback_status_updated, system_report
--   tourist            : weather, festival, promo, congestion, alert, system, feedback_status_updated
--
-- Việc chính:
--   1) Chuyển các thông báo dành cho KHÁCH DU LỊCH bị gán nhầm cho ADMIN
--      sang đúng tài khoản khách du lịch (dữ liệu Ninh Bình vẫn giữ nguyên).
--   2) Xoá các thông báo broadcast rác / sai địa bàn (test, Tam Chúc - Hà Nam).
--   3) Bổ sung vài thông báo đúng vai trò quản trị cho admin.
-- ============================================================

DO $$
DECLARE
    v_admin   UUID := 'f4f1919a-bc43-4266-8f7c-89045c58cd86';  -- admin@gmail.com
    v_tourist UUID := '50637b3e-0a86-4795-96d6-608391a2b59a';  -- kakabui17@gmail.com (khách du lịch)
BEGIN
    -- ── 1) Chuyển thông báo tiêu dùng từ admin sang khách du lịch ──────────────
    -- Các loại hoàn toàn không thuộc vai trò admin.
    UPDATE notifications
    SET user_id = v_tourist
    WHERE user_id = v_admin
      AND type IN ('weather', 'festival', 'promo', 'congestion', 'alert', 'feedback_status_updated');

    -- 'system' kiểu chào mừng / cập nhật app (do admin tự tạo lúc seed demo) là dành cho
    -- người dùng cuối → chuyển sang khách. Giữ lại 'system' vận hành (sao lưu CSDL...).
    UPDATE notifications
    SET user_id = v_tourist
    WHERE user_id = v_admin
      AND type = 'system'
      AND triggered_by = v_admin::text;

    -- ── 2) Xoá broadcast rác / sai địa bàn ────────────────────────────────────
    DELETE FROM notifications
    WHERE user_id IS NULL
      AND type = 'feedback_new'
      AND (
            title_vi ILIKE '%test%'
         OR title_vi ILIKE '%tam chúc%'   -- chùa Tam Chúc thuộc Hà Nam, không phải Ninh Bình
      );

    -- ── 3) Bổ sung thông báo đúng vai trò ADMIN (idempotent qua triggered_by) ──
    IF NOT EXISTS (
        SELECT 1 FROM notifications WHERE triggered_by = 'seed_admin_20260611'
    ) THEN
        INSERT INTO notifications
            (user_id, type, title_vi, body_vi, data, sent_at, delivery_status, read_at, triggered_by, created_at)
        VALUES
        (v_admin, 'system',
         '🔐 Cập nhật phân quyền vai trò "Công ty lữ hành"',
         'Vai trò Công ty lữ hành vừa được cấp thêm quyền xem sức chứa điểm du lịch. Thay đổi đã được ghi vào nhật ký kiểm toán.',
         '{"link":"audit_log","resource":"role_permission"}'::jsonb,
         NOW() - INTERVAL '5 hours', 'sent', NULL, 'seed_admin_20260611', NOW() - INTERVAL '5 hours'),

        (v_admin, 'system',
         '👥 6 tài khoản đơn vị mới được kích hoạt',
         'Trong tuần có 6 tài khoản doanh nghiệp/đơn vị tại Ninh Bình được phê duyệt và kích hoạt. Vui lòng rà soát phân quyền nếu cần.',
         '{"link":"user_management","count":6}'::jsonb,
         NOW() - INTERVAL '1 day', 'sent', NULL, 'seed_admin_20260611', NOW() - INTERVAL '1 day'),

        (v_admin, 'system',
         '🩺 Tình trạng hệ thống ổn định (uptime 99,98%)',
         'Báo cáo sức khỏe hệ thống 7 ngày qua: uptime 99,98%, không có sự cố nghiêm trọng. Sao lưu tự động hoạt động bình thường.',
         '{"link":"system_health","uptime":"99.98"}'::jsonb,
         NOW() - INTERVAL '2 days', 'sent', NOW() - INTERVAL '1 day 20 hours', 'seed_admin_20260611', NOW() - INTERVAL '2 days');
    END IF;

    RAISE NOTICE '[normalize_notifications_by_role] Hoàn tất chuẩn hoá thông báo theo vai trò.';
END $$;
