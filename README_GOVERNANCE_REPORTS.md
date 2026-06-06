# 🏛️ Hướng dẫn API Báo cáo Sở & Báo cáo Doanh nghiệp (Governance Reports)

Tài liệu này hướng dẫn chi tiết về các API phục vụ quản trị hành chính du lịch, cụ thể là **Báo cáo cấp Sở (Sở VH-TT&DL)** và **Báo cáo hoạt động Doanh nghiệp**.

> **Base URL**: `http://localhost:8881/api/v1/governance`  
> **Xác thực**: Cần gửi Access Token trong Header: `Authorization: Bearer <token>`

---

## 🔒 Phân quyền truy cập (Role & Permission)

| Vai trò | Role Code | Quyền hạn trên API Báo cáo |
| :--- | :--- | :--- |
| **Quản trị Sở** | `department_manager` | Tạo, xem, gửi báo cáo cấp Sở |
| **Đại diện Doanh nghiệp** | `spot_operator`, `travel_company`, `service_provider` | Tạo và xem báo cáo hoạt động của chính Doanh nghiệp mình |
| **Quản trị hệ thống** | `system_admin` | Toàn quyền xem và quản lý tất cả báo cáo |

---

## 1. 🏢 API Báo cáo Hoạt động Doanh nghiệp (Enterprise Reports)

Phần này dành cho các cơ sở kinh doanh, điểm du lịch, công ty lữ hành báo cáo doanh thu, số lượt khách và tải trọng định kỳ.

### 1.1. Tạo mới Báo cáo hoạt động Doanh nghiệp
* **Endpoint**: `POST /enterprise/reports`
* **Quyền yêu cầu**: Đăng nhập, Role thuộc nhóm Doanh nghiệp, Permission: `governance:create`.
* **Request Body** (JSON):

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `business_id` | `UUID` | **Có** | ID của Doanh nghiệp thực hiện báo cáo. |
| `report_period` | `String` | **Có** | Chu kỳ báo cáo. Chỉ chấp nhận: `month`, `quarter`, `year`, `custom`. |
| `period_from` | `String (Date)`| **Có** | Ngày bắt đầu chu kỳ (định dạng ISO, ví dụ: `2026-05-01`). |
| `period_to` | `String (Date)`| **Có** | Ngày kết thúc chu kỳ (phải `>= period_from`). |
| `total_revenue_vnd` | `Number` | Không | Tổng doanh thu trong kỳ (mặc định: `0`). |
| `total_bookings` | `Integer` | Không | Tổng số lượt đặt chỗ/đăng ký dịch vụ (mặc định: `0`). |
| `total_visitors` | `Integer` | Không | Tổng lượt khách phục vụ trong kỳ (mặc định: `0`). |
| `avg_capacity_pct` | `Number` | Không | Phần trăm tải công suất trung bình trong kỳ (`0.00` - `100.00`). |
| `notes` | `String` | Không | Ghi chú hoặc nội dung giải trình bổ sung (tối đa 5000 ký tự). |
| `status` | `String` | Không | Trạng thái gửi. Chấp nhận: `submitted` (mặc định), `reviewed`, `approved`, `rejected`. |

* **Ví dụ Request Payload**:
```json
{
  "business_id": "87e35b71-12f5-442a-a92c-15db5c612c6a",
  "report_period": "month",
  "period_from": "2026-05-01T00:00:00.000Z",
  "period_to": "2026-05-31T23:59:59.000Z",
  "total_revenue_vnd": 150000000,
  "total_bookings": 340,
  "total_visitors": 1250,
  "avg_capacity_pct": 68.5,
  "notes": "Báo cáo hoạt động kinh doanh tháng 5 của Khu nghỉ dưỡng An Bình."
}
```

* **Phản hồi thành công (`201 Created`)**:
```json
{
  "status": "success",
  "message": "Tạo báo cáo hoạt động doanh nghiệp thành công",
  "metadata": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "business_id": "87e35b71-12f5-442a-a92c-15db5c612c6a",
    "report_period": "month",
    "period_from": "2026-05-01T00:00:00.000Z",
    "period_to": "2026-05-31T23:59:59.000Z",
    "total_revenue_vnd": "150000000",
    "total_bookings": 340,
    "total_visitors": 1250,
    "avg_capacity_pct": "68.50",
    "notes": "Báo cáo hoạt động kinh doanh tháng 5 của Khu nghỉ dưỡng An Bình.",
    "status": "submitted",
    "submitted_by": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "created_at": "2026-06-05T23:45:00.000Z"
  }
}
```

---

### 1.2. Lấy danh sách Báo cáo hoạt động Doanh nghiệp
* **Endpoint**: `GET /enterprise/reports`
* **Quyền yêu cầu**: Đăng nhập, Quyền `governance:read`. 
  * *Lưu ý: Doanh nghiệp thường chỉ được xem báo cáo của chính mình; Quản trị viên/Sở được xem tất cả.*
* **Query Parameters**:

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `page` | `Integer` | `1` | Số trang truy vấn. |
| `limit` | `Integer` | `10` | Số lượng bản ghi trên một trang (tối đa 100). |
| `business_id` | `UUID` | — | Lọc theo ID doanh nghiệp cụ thể. |
| `report_period`| `String` | — | Lọc theo chu kỳ: `month`, `quarter`, `year`, `custom`. |
| `status` | `String` | — | Lọc theo trạng thái: `submitted`, `reviewed`, `approved`, `rejected`. |

* **Phản hồi thành công (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Danh sách báo cáo hoạt động doanh nghiệp",
  "metadata": {
    "items": [
      {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "business_name": "Khu nghỉ dưỡng An Bình",
        "report_period": "month",
        "period_from": "2026-05-01",
        "period_to": "2026-05-31",
        "total_revenue_vnd": "150000000",
        "status": "submitted",
        "created_at": "2026-06-05T23:45:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## 2. 🏛️ API Báo cáo Cấp Sở (Department Reports)

Dành cho cán bộ Sở Du lịch quản lý và gửi báo cáo tổng hợp tình hình hoạt động của địa phương lên Bộ Văn hóa, Thể thao và Du lịch.

### 2.1. Tạo mới Báo cáo cấp Sở
Báo cáo Sở lưu trữ thông tin tóm tắt và đính kèm file thống kê chi tiết.
* **Endpoint**: `POST /department/reports`
* **Quyền yêu cầu**: Đăng nhập, Role `department_manager`, Permission `governance:create`.
* **Request Body** (JSON):

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `title` | `String` | **Có** | Tiêu đề báo cáo (độ dài 3-255 ký tự). |
| `report_type` | `String` | **Có** | Loại báo cáo (ví dụ: `Monthly_Tourism_Summary`, `Weekly_Status`). |
| `period_from` | `String (Date)`| **Có** | Ngày bắt đầu chu kỳ báo cáo (định dạng ISO). |
| `period_to` | `String (Date)`| **Có** | Ngày kết thúc chu kỳ (phải `>= period_from`). |
| `schedule_id` | `Integer` | Không | ID lịch tự động tạo báo cáo (nếu có). |
| `file_url` | `String (URI)` | Không | Liên kết tải tài liệu báo cáo (PDF, Excel,...) đã ký duyệt. |
| `file_format` | `String` | Không | Định dạng file: `pdf` (mặc định), `xlsx`. |
| `file_size_kb` | `Integer` | Không | Dung lượng file tính bằng KB. |
| `sent_to_roles` | `Array` | Không | Mảng ID các Role nhận báo cáo (mặc định: `[]`). |

* **Ví dụ Request Payload**:
```json
{
  "title": "Báo cáo Tổng kết Du lịch Tỉnh Ninh Bình tháng 05/2026",
  "report_type": "Monthly_Tourism_Summary",
  "period_from": "2026-05-01T00:00:00.000Z",
  "period_to": "2026-05-31T23:59:59.000Z",
  "file_url": "https://storage.tourismpj.pro.vn/reports/nb-2026-05.pdf",
  "file_format": "pdf",
  "file_size_kb": 1450,
  "sent_to_roles": [2]
}
```

* **Phản hồi thành công (`201 Created`)**:
```json
{
  "status": "success",
  "message": "Tạo báo cáo Sở thành công",
  "metadata": {
    "id": "e9b1d5c2-f3a4-4b8c-9a0d-2e1f3b4c5d6e",
    "title": "Báo cáo Tổng kết Du lịch Tỉnh Ninh Bình tháng 05/2026",
    "report_type": "Monthly_Tourism_Summary",
    "period_from": "2026-05-01T00:00:00.000Z",
    "period_to": "2026-05-31T23:59:59.000Z",
    "file_url": "https://storage.tourismpj.pro.vn/reports/nb-2026-05.pdf",
    "file_format": "pdf",
    "file_size_kb": 1450,
    "created_by": "b47ac10b-58cc-4372-a567-0e02b2c3d478",
    "generated_at": "2026-06-05T23:45:00.000Z"
  }
}
```

---

### 2.2. Lấy danh sách Báo cáo cấp Sở
* **Endpoint**: `GET /department/reports`
* **Quyền yêu cầu**: Đăng nhập, Quyền `governance:read`.
* **Query Parameters**:

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `page` | `Integer` | `1` | Số trang. |
| `limit` | `Integer` | `10` | Số lượng bản ghi trên một trang (tối đa 100). |
| `report_type` | `String` | — | Lọc theo loại báo cáo. |
| `created_by` | `UUID` | — | Lọc theo người tạo báo cáo. |

* **Phản hồi thành công (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Danh sách báo cáo Sở",
  "metadata": {
    "items": [
      {
        "id": "e9b1d5c2-f3a4-4b8c-9a0d-2e1f3b4c5d6e",
        "title": "Báo cáo Tổng kết Du lịch Tỉnh Ninh Bình tháng 05/2026",
        "report_type": "Monthly_Tourism_Summary",
        "period_from": "2026-05-01",
        "period_to": "2026-05-31",
        "file_url": "https://storage.tourismpj.pro.vn/reports/nb-2026-05.pdf",
        "generated_at": "2026-06-05T23:45:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 2.3. Gửi báo cáo lên cấp Bộ / Đơn vị quản lý
Chức năng này cho phép gửi thông báo (in-app, email, push notification) kèm liên kết báo cáo tới các tài khoản có vai trò đích (như Cán bộ quản lý cấp Bộ).
* **Endpoint**: `POST /department/reports/:id/send`
* **Quyền yêu cầu**: Đăng nhập, Role `department_manager`, Permission `governance:update`.
* **URL Parameters**:
  * `id`: `UUID` (ID của báo cáo Sở cần gửi).
* **Request Body** (JSON):

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `target_roles` | `Array (Integer)`| Không | Danh sách các ID vai trò nhận thông báo (ví dụ: `[2]` cho Bộ quản lý). |
| `title_vi` | `String` | Không | Tiêu đề thông báo tùy chỉnh (Mặc định: Tên báo cáo). |
| `body_vi` | `String` | Không | Nội dung thông báo tùy chỉnh. |

* **Ví dụ Request Payload**:
```json
{
  "target_roles": [2],
  "title_vi": "Kính gửi Bộ VHTTDL: Báo cáo du lịch tháng 5/2026",
  "body_vi": "Sở VH-TT&DL tỉnh Ninh Bình kính gửi Bộ báo cáo tổng kết tình hình kinh tế du lịch tháng 05/2026. File PDF đính kèm trong hệ thống."
}
```

* **Phản hồi thành công (`200 OK`)**:
```json
{
  "status": "success",
  "message": "Gửi báo cáo thành công",
  "metadata": {
    "report": {
      "id": "e9b1d5c2-f3a4-4b8c-9a0d-2e1f3b4c5d6e",
      "title": "Báo cáo Tổng kết Du lịch Tỉnh Ninh Bình tháng 05/2026",
      "report_type": "Monthly_Tourism_Summary"
    },
    "notification": {
      "notification_id": "5423",
      "sent_count": 1,
      "target_roles": [2]
    }
  }
}
```

---

## 3. Cấu trúc bảng Database tương ứng (Database Schema)

Dữ liệu của các API này được ánh xạ trực tiếp xuống PostgreSQL theo hai bảng trong schema `public`:

### 3.1. Bảng `generated_reports` (Báo cáo cấp Sở)
```sql
CREATE TABLE IF NOT EXISTS generated_reports (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id  INTEGER REFERENCES report_schedules(id),
    created_by   UUID REFERENCES auth.users(id),
    report_type  VARCHAR(50),
    period_from  DATE,
    period_to    DATE,
    title        VARCHAR(255),
    file_url     TEXT,
    file_format  VARCHAR(10),
    file_size_kb INTEGER,
    sent_to_roles INTEGER[],
    generated_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2. Bảng `business_activity_reports` (Báo cáo Doanh nghiệp)
```sql
CREATE TABLE IF NOT EXISTS business_activity_reports (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    report_period     VARCHAR(20) NOT NULL,
    period_from       DATE NOT NULL,
    period_to         DATE NOT NULL,
    total_revenue_vnd NUMERIC(18,0) DEFAULT 0,
    total_bookings    INTEGER DEFAULT 0,
    total_visitors    INTEGER DEFAULT 0,
    avg_capacity_pct  NUMERIC(5,2),
    notes             TEXT,
    status            VARCHAR(20) DEFAULT 'submitted',
    submitted_by      UUID REFERENCES auth.users(id),
    reviewed_by       UUID REFERENCES auth.users(id),
    reviewed_at       TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_business_report_period     CHECK (report_period IN ('month', 'quarter', 'year', 'custom')),
    CONSTRAINT chk_business_report_status     CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
    CONSTRAINT chk_business_report_date_range CHECK (period_to >= period_from)
);
```
