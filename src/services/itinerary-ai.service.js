const { getOpenAIClient } = require('../configs/openai');
const { query } = require('../configs/database');
const ItineraryRepository = require('../models/repositories/itinerary.repository');
const { Api400Error } = require('../core/error.response');

class ItineraryAiService {
    /**
     * NV-28: Tạo lịch trình tự động bằng OpenAI.
     */
    async generate(params, userId) {
        const {
            num_days,
            preferences = [],
            budget_vnd,
            start_location,
            language = 'vi',
        } = params;

        if (!num_days || num_days < 1 || num_days > 14) {
            throw new Api400Error('Số ngày phải từ 1 đến 14');
        }

        // Lấy danh sách điểm du lịch + sức chứa hiện tại từ DB
        const spots = await this._fetchSpotsContext(preferences);

        const prompt = this._buildPrompt({ num_days, preferences, budget_vnd, start_location, language, spots });

        const openai = getOpenAIClient();

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Bạn là chuyên gia du lịch Ninh Bình. Hãy tạo lịch trình du lịch chi tiết dựa trên thông tin được cung cấp.
Phản hồi PHẢI là JSON hợp lệ theo schema sau, không có markdown code block:
{
  "title": "Tên lịch trình",
  "description": "Mô tả tổng quan",
  "days": [
    {
      "day_number": 1,
      "title": "Tên ngày",
      "notes": "Ghi chú ngày",
      "stops": [
        {
          "spot_id": "uuid hoặc null nếu tự tạo",
          "custom_name": "Tên địa điểm nếu spot_id là null",
          "planned_arrival": "HH:MM",
          "planned_duration_min": 60,
          "notes": "Ghi chú điểm dừng",
          "sort_order": 1
        }
      ]
    }
  ]
}`,
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 3000,
            response_format: { type: 'json_object' },
        });

        const rawContent = response.choices[0]?.message?.content;
        let plan;
        try {
            plan = JSON.parse(rawContent);
        } catch {
            throw new Api400Error('AI trả về dữ liệu không hợp lệ, vui lòng thử lại');
        }

        // Lưu vào DB
        const itinerary = await this._saveAiItinerary(plan, params, userId);
        return itinerary;
    }

    async _fetchSpotsContext(preferences = []) {
        const conditions = ["ts.status = 'active'"];
        const values = [];
        let idx = 1;

        if (preferences.length > 0) {
            conditions.push(`sc.name_vi ILIKE ANY($${idx++})`);
            values.push(preferences.map((p) => `%${p}%`));
        }

        const sql = `
            SELECT
                ts.id,
                ts.name_vi,
                ts.description_vi,
                ts.address_vi,
                ts.max_capacity,
                ts.alert_threshold_pct,
                sc.name_vi AS category,
                vc.capacity_pct,
                vc.status AS capacity_status
            FROM tourism_spots ts
            LEFT JOIN spot_categories sc ON sc.id = ts.category_id
            LEFT JOIN v_current_capacity vc ON vc.spot_id = ts.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY ts.rating_avg DESC NULLS LAST
            LIMIT 40
        `;
        const { rows } = await query(sql, values);
        return rows;
    }

    _buildPrompt({ num_days, preferences, budget_vnd, start_location, language, spots }) {
        const spotsInfo = spots
            .map((s) => {
                const capacity = s.capacity_pct != null ? ` [Tải: ${s.capacity_pct}%${s.capacity_status === 'overloaded' ? ' - QUÁ TẢI' : ''}]` : '';
                return `- ID: ${s.id} | ${s.name_vi} (${s.category || 'Tổng hợp'})${capacity}`;
            })
            .join('\n');

        const prefText = preferences.length ? `Sở thích: ${preferences.join(', ')}` : 'Không có sở thích đặc biệt';
        const budgetText = budget_vnd ? `Ngân sách: ${Number(budget_vnd).toLocaleString('vi-VN')} VNĐ` : 'Không giới hạn ngân sách';
        const startText = start_location ? `Điểm xuất phát: ${start_location}` : 'Điểm xuất phát: Thành phố Ninh Bình';

        return `Tạo lịch trình du lịch Ninh Bình ${num_days} ngày.
${prefText}
${budgetText}
${startText}
Ngôn ngữ output: ${language === 'en' ? 'tiếng Anh' : 'tiếng Việt'}

QUAN TRỌNG:
- Ưu tiên điểm có capacity_pct < 80%. TRÁNH điểm bị đánh dấu "QUÁ TẢI".
- Sử dụng đúng spot_id từ danh sách bên dưới khi có thể.
- Mỗi ngày 3-5 điểm dừng, sắp xếp theo thứ tự địa lý hợp lý.
- Đề xuất thời gian đến và thời lượng thực tế cho mỗi điểm.

Danh sách điểm du lịch:
${spotsInfo}`;
    }

    async _saveAiItinerary(plan, params, userId) {
        // Tạo itinerary header
        const itinerary = await ItineraryRepository.create({
            user_id: userId,
            title: plan.title || `Lịch trình Ninh Bình ${params.num_days} ngày`,
            description: plan.description || null,
            budget_vnd: params.budget_vnd || null,
            status: 'draft',
            ai_generated: true,
            ai_prompt: JSON.stringify({
                num_days: params.num_days,
                preferences: params.preferences,
                start_location: params.start_location,
            }),
        });

        // Tạo từng ngày và điểm dừng
        for (const dayData of (plan.days || [])) {
            const day = await ItineraryRepository.createDay({
                itinerary_id: itinerary.id,
                day_number: dayData.day_number,
                title: dayData.title || null,
                notes: dayData.notes || null,
            });

            for (const stop of (dayData.stops || [])) {
                await ItineraryRepository.createStop({
                    day_id: day.id,
                    spot_id: stop.spot_id || null,
                    custom_name: stop.custom_name || null,
                    sort_order: stop.sort_order || 1,
                    planned_arrival: stop.planned_arrival || null,
                    planned_duration_min: stop.planned_duration_min || null,
                    notes: stop.notes || null,
                });
            }
        }

        // Tính tổng khoảng cách
        const totalKm = await ItineraryRepository.calcTotalDistance(itinerary.id);
        if (totalKm !== null) {
            await ItineraryRepository.update(itinerary.id, { total_distance_km: totalKm });
        }

        // Trả về đầy đủ
        const saved = await ItineraryRepository.findById(itinerary.id);
        const days = await ItineraryRepository.getDays(itinerary.id);
        return { ...saved, days };
    }
}

module.exports = new ItineraryAiService();
