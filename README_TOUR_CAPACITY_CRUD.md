# Tài liệu Quản lý Sức chứa Tour (Tour Capacity CRUD)

Tài liệu này mô tả chi tiết cách thức hoạt động, danh sách các API endpoints, cấu trúc dữ liệu gửi/nhận, và cơ chế phân quyền (RBAC) liên quan đến tính năng **Tour Capacity** (Quản lý sức chứa tối đa của các Tour du lịch).

---

## 1. Tổng quan (Overview)

Tính năng **Tour Capacity** cho phép:
- Quản trị viên (`system_admin`) hoặc các **Công ty lữ hành** (`travel_company`) cấu hình số lượng khách tối đa (`max_guests`) cho một gói tour du lịch.
- Hệ thống tự động tính toán, dự báo và tổng hợp mật độ tải thực tế hiện tại trên toàn bộ tuyến du lịch (các điểm dừng nằm trên tour) để đưa ra các cảnh báo sớm về nguy cơ quá tải.

---

## 2. Phân quyền theo Vai trò (Role-based Access Control - RBAC)

Các vai trò (`Roles`) trong hệ thống được phân quyền cụ thể đối với tính năng Capacity như sau:

| Vai trò | Code | Quyền Xem (Read) | Quyền Ghi Log (Log) | Cấu hình Điểm (Spot Settings) | Cấu hình Tour (Tour Settings) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Quản trị hệ thống** | `system_admin` | Đầy đủ | Đầy đủ | Đầy đủ | Đầy đủ |
| **Bộ VHTTDL** | `ministry_manager` | Toàn quốc | Không | Không | Không |
| **Sở VHTTDL** | `department_manager` | Trong tỉnh quản lý | Không | Không | Không |
| **Công ty lữ hành** | `travel_company` | Xem của mình & công khai | Không | Không | **Chỉ tour của mình sở hữu** |
| **Vận hành điểm du lịch** | `spot_operator` | Xem của mình & công khai | **Chỉ điểm của mình sở hữu** | **Chỉ điểm của mình sở hữu** | Không |
| **Khách du lịch / Public** | *N/A* | Chỉ xem công khai | Không | Không | Không |

---

## 3. Danh sách API Endpoints

### 3.1. Cấu hình sức chứa tối đa của Tour
Dùng để thiết lập giới hạn số lượng khách tối đa mà Tour có thể tiếp nhận.

*   **Endpoint:** `PATCH /api/v1/capacity/tours/:tourId/settings`
*   **Phương thức:** `PATCH`
*   **Xác thực:** Yêu cầu Token (`Bearer Token`)
*   **Quyền hạn:** `capacity:update` (Được gán cho `travel_company`, `system_admin`)
*   **Điều kiện bổ sung:** Phải là người sở hữu tour (`tour.owner_id === user.id`).
*   **Mẫu Payload gửi (Request Body):**
    ```json
    {
      "max_guests": 80
    }
    ```
*   **Mẫu phản hồi (Response Body):**
    ```json
    {
      "status": "success",
      "message": "Cập nhật sức chứa tour thành công",
      "data": {
        "max_guests": 80
      }
    }
    ```

---

### 3.2. Xóa cấu hình sức chứa tối đa của Tour
Dùng để reset giới hạn sức chứa tối đa về mặc định (`NULL`).

*   **Endpoint:** `DELETE /api/v1/capacity/tours/:tourId/settings`
*   **Phương thức:** `DELETE`
*   **Xác thực:** Yêu cầu Token (`Bearer Token`)
*   **Quyền hạn:** `capacity:delete` (Được gán cho `travel_company`, `system_admin`)
*   **Điều kiện bổ sung:** Phải là người sở hữu tour.
*   **Mẫu phản hồi (Response Body):**
    ```json
    {
      "status": "success",
      "message": "Xóa cấu hình sức chứa tour thành công",
      "data": {
        "max_guests": null
      }
    }
    ```

---

### 3.3. Xem tải trọng thực tế hiện tại của Tour (Tổng hợp)
Tổng hợp thông tin lượng khách thực tế từ các điểm dừng trên tour để tính mật độ tải trọng toàn tuyến.

*   **Endpoint:** `GET /api/v1/capacity/tours/:tourId/current`
*   **Phương thức:** `GET`
*   **Xác thực:** Không yêu cầu (Public)
*   **Mẫu phản hồi (Response Body):**
    ```json
    {
      "status": "success",
      "message": "Chi tiết tải trọng tuyến du lịch",
      "data": {
        "tour": {
          "id": "7bf3b683-149d-472e-8367-152e008c2a9c",
          "tour_name": "Khám phá Tràng An - Bái Đính",
          "status": "published",
          "max_guests": 80,
          "province_code": "35"
        },
        "summary": {
          "total_stops": 3,
          "spot_stop_count": 3,
          "capacity_tracked_stops": 3,
          "total_current_visitors": 240,
          "total_max_capacity": 500,
          "route_capacity_pct": 48.00,
          "avg_capacity_pct": 45.30,
          "bottleneck_stop": {
            "stop_id": "9a6ef210-9b48-4fb4-a5ef-f52e391b101d",
            "spot_id": "5fa23d11-5369-4e7a-bb48-e8cb9b519e91",
            "name_vi": "Khu du lịch sinh thái Tràng An",
            "capacity_pct": 85.00,
            "capacity_status": "near_full"
          },
          "status": "busy"
        },
        "stops": [
          {
            "stop_order": 1,
            "spot_name_vi": "Khu du lịch sinh thái Tràng An",
            "visitor_count": 170,
            "max_capacity": 200,
            "capacity_pct": 85.00,
            "capacity_status": "near_full"
          },
          {
            "stop_order": 2,
            "spot_name_vi": "Chùa Bái Đính",
            "visitor_count": 70,
            "max_capacity": 300,
            "capacity_pct": 23.33,
            "capacity_status": "normal"
          }
        ]
      }
    }
    ```

---

## 4. Kiểm tra mã nguồn (Code references)

1.  **Định tuyến API:** Các API route được đăng ký và gán middleware phân quyền tại [capacity.route.js](file:///c:/Users/SunSun/Documents/DuAN_20226/server_dulich_v2/src/routes/capacity.route.js#L48-L52).
2.  **Validator Schemas:** Ràng buộc tham số và kiểu dữ liệu đầu vào nằm trong [capacity.validation.js](file:///c:/Users/SunSun/Documents/DuAN_20226/server_dulich_v2/src/middlewares/validators/capacity.validation.js#L35-L42).
3.  **Controllers:** Điểm tiếp nhận request và trả về response nằm tại [capacity.controller.js](file:///c:/Users/SunSun/Documents/DuAN_20226/server_dulich_v2/src/controllers/capacity.controller.js#L52-L61).
4.  **Service Business Logic:** Logic xử lý lưu dữ liệu, xóa cache và kiểm soát quyền sở hữu (`_ensureTourAccess`) nằm tại [capacity.service.js](file:///c:/Users/SunSun/Documents/DuAN_20226/server_dulich_v2/src/services/capacity.service.js#L309-L355).
