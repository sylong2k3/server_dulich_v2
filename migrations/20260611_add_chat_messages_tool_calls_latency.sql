-- Bổ sung 2 cột mà code (chatbot.repository.js → saveMessage) đang ghi nhưng
-- schema gốc (database_complete.sql, migration 003) chưa có:
--   - tool_calls: trace các tool function-calling đã chạy cho tin nhắn assistant
--   - latency_ms: thời gian xử lý (ms) để theo dõi hiệu năng
-- Thiếu 2 cột này khiến INSERT tin nhắn thất bại ("column does not exist").

SET search_path TO public, auth;

BEGIN;

ALTER TABLE ai_chat_messages
ADD COLUMN IF NOT EXISTS tool_calls JSONB;

ALTER TABLE ai_chat_messages
ADD COLUMN IF NOT EXISTS latency_ms INTEGER;

COMMIT;
