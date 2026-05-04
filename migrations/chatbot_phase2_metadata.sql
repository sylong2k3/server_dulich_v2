-- Phase 2: thêm metadata cho chatbot (auto-title, tool_calls, latency, feedback).
-- Idempotent: dùng IF NOT EXISTS / DO blocks để có thể chạy lại.

ALTER TABLE ai_chat_sessions
    ADD COLUMN IF NOT EXISTS title VARCHAR(160);

ALTER TABLE ai_chat_messages
    ADD COLUMN IF NOT EXISTS tool_calls JSONB,
    ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
    ADD COLUMN IF NOT EXISTS feedback   VARCHAR(10);

-- Ràng buộc giá trị feedback hợp lệ
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_chat_messages_feedback'
    ) THEN
        ALTER TABLE ai_chat_messages
            ADD CONSTRAINT chk_ai_chat_messages_feedback
            CHECK (feedback IS NULL OR feedback IN ('up', 'down'));
    END IF;
END $$;

-- Index hỗ trợ truy vấn phân tích chất lượng
CREATE INDEX IF NOT EXISTS idx_chat_messages_feedback
    ON ai_chat_messages(feedback) WHERE feedback IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_latency
    ON ai_chat_messages(latency_ms) WHERE latency_ms IS NOT NULL;
