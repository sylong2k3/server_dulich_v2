# Chatbot AI (NV-50 / NV-51)

Tài liệu mô tả hệ thống chatbot AI: trợ lý du lịch cho khách (`tourist` — "Nini") và trợ lý
phân tích thống kê cho nhà quản lý (`manager`). Chatbot dùng OpenAI function-calling để gọi
các tool truy vấn dữ liệu thật trong hệ thống và điều khiển bản đồ ở client.

## 1. Tổng quan

| Thành phần | File |
|------------|------|
| Route | `src/routes/chatbot.route.js` (mount tại `/chatbot`) |
| Controller | `src/controllers/chatbot.controller.js` |
| Service (vòng lặp hội thoại) | `src/services/chatbot.service.js` |
| Tool registry (function-calling) | `src/services/chatbot.tools.js` |
| Repository (DB) | `src/models/repositories/chatbot.repository.js` |
| Validators | `src/middlewares/validators/chatbot.validation.js` |
| Cấu hình OpenAI client | `src/configs/openai.js` |
| Schema bảng | `migrations/database_complete.sql` + `migrations/20260611_add_chat_messages_tool_calls_latency.sql` |

Hai loại phiên (`session_type`):

- **`tourist`** — nhân vật "Nini", người bạn đồng hành du lịch Ninh Bình. Trả lời tự nhiên,
  có cảm xúc, gọi tool lấy dữ liệu điểm đến / lễ hội / ẩm thực / OCOP / tin tức / lịch trình /
  khách sạn – nhà hàng, và tự gắn `map_actions` để điều hướng bản đồ. Cho phép cả khách ẩn danh.
- **`manager`** — trợ lý phân tích thống kê cho nhà quản lý. Trả lời có cấu trúc
  (**Tóm tắt → Số liệu → Nhận định → Đề xuất**) và được phép gọi thêm tool `get_statistics_summary`.
  **Bắt buộc đăng nhập** và có quyền phù hợp.

## 2. API Endpoints

Tất cả nằm dưới prefix toàn cục `/api/v1` → base `**/api/v1/chatbot**`. Mọi endpoint dùng
`optionalAuth`: chấp nhận **user đã đăng nhập (JWT)** hoặc **khách ẩn danh** (header
`x-anonymous-id` là UUID v4). Quyền truy cập phiên được kiểm tra ở service.

| Method | Path | Mô tả | Body / Query |
|--------|------|-------|--------------|
| `POST` | `/sessions` | Tạo phiên chat mới | `{ session_type?: 'tourist'\|'manager'='tourist', language?: 'vi'\|'en'='vi' }` |
| `GET` | `/sessions` | Danh sách phiên của actor | query `page?=1`, `limit?=20` (max 100) |
| `GET` | `/sessions/:sessionId` | Tin nhắn trong phiên (ASC theo thời gian) | param `sessionId` (UUID); query `page?=1`, `limit?=20` |
| `POST` | `/sessions/:sessionId/messages` | Gửi tin nhắn, nhận trả lời AI | `{ message: string (1–2000 ký tự) }` |
| `DELETE` | `/sessions/:sessionId` | Xóa phiên (cascade tin nhắn) | param `sessionId` (UUID) |

### Mô hình "actor" và quyền truy cập

`AuthMiddleware.resolveAuthActor(req)` trả về `{ userId }` (đã đăng nhập) hoặc `{ anonymousId }`
(từ header `x-anonymous-id`). Quy tắc `assertSessionAccess`:

- Phiên có `user_id` → chỉ chủ sở hữu (`userId` khớp) mới truy cập được, ngược lại `403`.
- Phiên ẩn danh (`user_id = null`) → so khớp `context.anon_id` với `anonymousId` của client.
- Phiên ẩn danh cũ chưa có `anon_id` → vẫn cho truy cập (backward-compat).
- Không tìm thấy phiên → `404`.

### Quota khách ẩn danh

Khách chưa đăng nhập bị giới hạn tổng số tin nhắn `role='user'` trên tất cả phiên cùng `anon_id`.
Vượt ngưỡng → `403` với mã `ANONYMOUS_QUOTA_EXCEEDED`. Mặc định **10** câu, cấu hình qua
`CHATBOT_ANONYMOUS_LIMIT`. Khi vượt, tin nhắn mới **không** được lưu.

### Tạo phiên `manager`

Yêu cầu đăng nhập (`userId`). Người dùng phải có role ∈
`{system_admin, ministry_manager, department_manager}` **hoặc** quyền `analytics:read` / `governance:read`.
Không đạt → `403` (`AUTH_REQUIRED` hoặc `INSUFFICIENT_PERMISSIONS`).

## 3. Luồng xử lý `sendMessage`

```
sendMessage(sessionId, actor, message)
  ├─ findSession + assertSessionAccess (403/404)
  ├─ [anonymous] kiểm tra quota → 403 nếu vượt
  ├─ lưu tin nhắn user
  ├─ NDVI shortcut? → trả ảnh dự báo NDVI/LSTM, KHÔNG gọi OpenAI (xem §6)
  ├─ lấy HISTORY_LIMIT (10) tin gần nhất làm context
  ├─ ghép system prompt (theo session_type) + chỉ thị ngôn ngữ
  ├─ getToolDefinitions(session_type)  // manager mới có get_statistics_summary
  └─ chatbotQueue.run( runChatCompletion(...) )   // hàng đợi giới hạn đồng thời
        └─ vòng lặp function-calling (tối đa MAX_TOOL_ITERATIONS = 6)
  → lưu tin nhắn assistant (content, map_actions, token_usage, tool_calls, latency_ms)
  → trả { message, map_actions, follow_up_suggestions }
```

### Vòng lặp function-calling (`runChatCompletion`)

1. Gọi `chat.completions` với `tools` + `tool_choice: 'auto'`, `max_completion_tokens: 1200`.
2. Nếu model yêu cầu gọi tool → chạy song song tất cả `tool_calls` qua `callTool`, đẩy kết quả
   (`role: 'tool'`) vào messages, rồi gọi lại model với `tool_choice: 'none'`
   (`max_completion_tokens: 2000`) để buộc tổng hợp thành văn bản.
3. Lặp tối đa 6 lần; hết vòng vẫn đòi tool → ép kết thúc với nội dung hiện có.
4. Gom các địa điểm có toạ độ từ nhiều tool (dedupe theo `id`) → phát sinh `attach_items`
   và `map_actions` tự động (xem §7).

`token_usage` được cộng dồn qua tất cả lượt gọi model trong cùng một tin nhắn.

## 4. System prompt theo `session_type`

- **`tourist` ("Nini")**: giọng thân thiện, đời thường, có cảm xúc; nhớ ngữ cảnh hội thoại
  (đi cùng ai, ngân sách, sở thích); không nhắc "AI/chatbot"; chỉ gọi tool khi cần dữ liệu thật;
  không lặp lại địa chỉ/SĐT/toạ độ (UI đã có card); kết thúc bằng câu hỏi follow-up tự nhiên.
- **`manager`**: trả lời theo cấu trúc **Tóm tắt → Số liệu → Nhận định → Đề xuất**; bắt buộc
  gọi tool lấy số liệu thật trước khi nhận định; tool fail/empty thì nói rõ "chưa có số liệu",
  tuyệt đối không bịa số.

Chỉ thị ngôn ngữ được nối thêm theo `session.language` (`vi`/`en`).

## 5. Tool registry

Định nghĩa trong `chatbot.tools.js`. `getToolDefinitions(sessionType)` lọc:
phiên `tourist` **không** có `get_statistics_summary` (chỉ `manager` mới được).

| Tool | Dùng cho | Mô tả ngắn | Tham số chính |
|------|----------|------------|----------------|
| `search_spots` | both | Tìm điểm du lịch (mặc định sort theo `rating_avg DESC`) | `keyword`, `category_id`, `province_code`, `rating_min`, `is_featured`, `lat/lng`, `radius_km`, `limit≤20` |
| `get_spot_detail` | both | Chi tiết 1 điểm theo `id` hoặc `slug` | `id` (UUID) hoặc `slug` |
| `get_random_spot` | both | 1 điểm ngẫu nhiên (loại hạ tầng `parent_id=3`) | `min_rating=4`, `featured_only=false` |
| `search_tours` | both | Tìm **tuyến/tour có sẵn** (gói tour nhiều điểm dừng). `random=true` → 1 tuyến ngẫu nhiên | `keyword`, `is_featured`, `random`, `duration_days`, `price_max`, `limit≤20` |
| `get_tour_detail` | both | Chi tiết 1 tuyến + các điểm dừng theo ngày; server tự vẽ `draw_route` | `id` (UUID) hoặc `slug` |
| `get_spot_capacity` | both | Sức chứa / cảnh báo quá tải hiện tại | `spot_id` (required) |
| `search_festivals` | both | Tìm lễ hội | `keyword`, `festival_type`, `upcoming`, `limit≤20` |
| `search_culinary` | both | Tìm món ăn / đặc sản | `keyword`, `category`, `is_speciality`, `limit≤20` |
| `search_ocop_products` | both | Tìm sản phẩm OCOP | `keyword`, `category`, `star_rating(3–5)`, `province_code`, `limit≤20` |
| `search_vlogs` | both | Tìm vlog/video review | `keyword`, `limit≤10` |
| `search_news` | both | Tìm tin tức du lịch | `keyword`, `tag`, `is_featured`, `limit≤10` |
| `suggest_itinerary` | both | Sinh lịch trình nhiều ngày bằng AI (tạo mới) | `num_days(1–14)` (required), `preferences[]`, `budget_vnd`, `start_location` |
| `get_route_between` | both | Khoảng cách đường thẳng giữa các điểm | `points[]={slug\|id\|name}` (≥2) **hoặc** `coordinates[[lng,lat]]`, `unit='km'` |
| `search_nearby_services` | both | Tìm khách sạn / nhà hàng quanh một điểm | `service_type='hotel'\|'restaurant'\|'all'`, `near_spot={...}`, `lat/lng`, `radius_km=8`, `keyword`, `limit≤20` |
| `get_statistics_summary` | **manager** | Thống kê tổng hợp (điểm hoạt động, DN duyệt, lễ hội sắp tới) | `province_code`, `from_date`, `to_date` |
| `navigate_map` | both | Điều khiển bản đồ client | `action` (required) + tham số theo action |

Mỗi tool trả về dạng `{ items? | item?, count?, map_hint?, error? }`. Handler gọi các service
domain (`SpotService`, `FestivalService`, ...) chứ không truy vấn DB tuỳ tiện. Tool lỗi trả
`{ error }` thay vì throw, để vòng lặp vẫn tiếp tục.

## 6. NDVI / LSTM shortcut

Trước khi gọi OpenAI, service phát hiện câu hỏi về **dự báo NDVI/LSTM** (`isNdviForecastQuestion`).
Nếu khớp, trả thẳng nội dung markdown kèm ảnh từ `NDVI_LSTM_REGION_IMAGES` cho 3 khu vực
(**Cúc Phương**, **Hoa Lư**, **Xuân Thủy**) — **không** tốn lượt gọi model. Nếu chưa rõ khu vực,
bot liệt kê 3 lựa chọn để người dùng chọn.

## 7. `map_actions` và `attach_items`

Server tự sinh hành động bản đồ để client render (không bắt người dùng thao tác thủ công).

- `attach_items` — danh sách card địa điểm (spot/festival) có toạ độ, trích từ kết quả tool
  qua `extractAttachableItems` (chỉ `search_spots`, `get_spot_detail`, `get_random_spot`,
  `search_nearby_services`, `search_festivals`, và các điểm dừng của `get_tour_detail`). Card spot gồm tên, slug, ảnh, rating, giá vé,
  cờ `has_vr_360` / `has_audio_guide`; bản detail có thêm mô tả, giờ mở cửa, SĐT, website.
- Hành động bản đồ tự động: 1 điểm → `fly_to` (zoom 15); nhiều điểm → `fit_bounds` (padding 80).
  Riêng `get_tour_detail` còn phát sinh `draw_route` nối các điểm dừng của tuyến.
- Các action hỗ trợ (tool `navigate_map`): `fly_to`, `pan`, `zoom`, `highlight`, `add_marker`,
  `fit_bounds`, `draw_route`, `clear_markers`, `show_popup`, `filter_layer`.

## 8. `follow_up_suggestions`

Sau khi trả lời (chỉ phiên `tourist`), `buildFollowUpSuggestions` sinh các "quick reply" gợi ý
dựa trên tool đã gọi thành công (ví dụ sau `suggest_itinerary` → gợi ý tìm khách sạn / nhà hàng /
ẩm thực / tính khoảng cách). Phiên `manager` không có quick reply.

## 9. Schema dữ liệu

```sql
-- ai_chat_sessions
id              UUID PK
user_id         UUID NULL  -- NULL = phiên ẩn danh
session_type    VARCHAR(30) DEFAULT 'tourist'  -- 'tourist' | 'manager'
language        VARCHAR(10) DEFAULT 'vi'        -- 'vi' | 'en'
context         JSONB        -- { anon_id } cho phiên ẩn danh
created_at      TIMESTAMP
last_message_at TIMESTAMP    -- cập nhật mỗi lần lưu tin nhắn

-- ai_chat_messages
id          BIGSERIAL PK
session_id  UUID NOT NULL -> ai_chat_sessions(id) ON DELETE CASCADE
role        VARCHAR(20)  -- 'user' | 'assistant' | 'tool'
content     TEXT
map_actions JSONB        -- hành động bản đồ kèm tin nhắn assistant
token_usage JSONB        -- prompt/completion/total tokens
tool_calls  JSONB        -- trace [{ name, args, ok }]  (migration 20260611)
latency_ms  INTEGER      -- thời gian xử lý (migration 20260611)
created_at  TIMESTAMP
```

> Lưu ý: 2 cột `tool_calls` và `latency_ms` được bổ sung qua
> `migrations/20260611_add_chat_messages_tool_calls_latency.sql`. Thiếu chúng sẽ làm INSERT
> tin nhắn thất bại ("column does not exist").

## 10. Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `OPENAI_API_KEY` | — (bắt buộc) | Khoá OpenAI. Thiếu → trả thông báo "chatbot chưa được cấu hình" thay vì sập. |
| `OPENAI_CHATBOT_MODEL` | `gpt-4o-mini` | Model dùng cho chat completion. |
| `CHATBOT_ANONYMOUS_LIMIT` | `10` | Quota tin nhắn cho khách ẩn danh (theo `anon_id`). |
| `CHATBOT_CONCURRENCY_LIMIT` | `3` | Số lời gọi OpenAI chạy đồng thời (TaskQueue). |
| `CHATBOT_QUEUE_TIMEOUT_MS` | `20000` | Timeout chờ trong hàng đợi (ms). |

Hằng số nội bộ: `HISTORY_LIMIT = 10` (số tin nhắn ngữ cảnh), `MAX_TOOL_ITERATIONS = 6`.

## 11. Xử lý lỗi

- **Thiếu API key** (`MissingOpenAIKeyError`): lưu 1 tin assistant thông báo chưa cấu hình,
  trả `map_actions: []` — không ném lỗi ra client.
- **Hàng đợi quá tải** (`QUEUE_TIMEOUT`): lưu tin assistant báo lỗi, trả về `400`.
- **Lỗi runtime khác** (network, rate limit, model error): vẫn lưu 1 tin assistant báo lỗi thân
  thiện để UI không bị "mồ côi" tin nhắn user, rồi ném lỗi cho error handler chung.
- **Tool fail**: trả `{ error }` trong kết quả tool; vòng lặp tiếp tục, model tự diễn giải.
