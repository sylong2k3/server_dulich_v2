-- ============================================================
-- Dọn dữ liệu: XÓA các thông báo báo cáo có tiêu đề thô
--
-- Tiêu đề thô dạng:
--   "Báo cáo monthly (Mon Jun 01 2026 00:00:00 GMT-0500
--    (Central Daylight Time) - Sun Jun 28 2026 ...)"
--
-- Nguyên nhân gốc: governance.service.sendDepartmentReport nội
-- suy thẳng Date của JS + report_type tiếng Anh vào title.
-- Đã sửa trong code; migration này xóa các bản ghi cũ bị lỗi.
-- ============================================================

DELETE FROM notifications
WHERE
    type = 'system_report'
    AND (title_vi LIKE '%GMT%' OR title_vi LIKE '%Daylight Time%');
