# Hướng Dẫn Frontend: Tải Tuyến Du Lịch

Tài liệu này mô tả cách frontend tích hợp API tải hiện tại của tuyến du lịch.

## Endpoint

```http
GET /api/v1/capacity/tours/:tourId/current
```

Ví dụ:

```http
GET /api/v1/capacity/tours/550ea000-e29b-41d4-a716-100000000005/current
```

Xác thực: Public.

API chỉ trả dữ liệu cho tour đã xuất bản (`status = 'published'`). Nếu tour không tồn tại hoặc chưa xuất bản, backend trả lỗi `404`.

## Mục Đích

API này giúp frontend hiển thị mức tải của cả tuyến/tour bằng cách tổng hợp tải hiện tại từ các điểm dừng trong tour.

Frontend có thể dùng API này cho:

- Trang chi tiết tour.
- Bản đồ tuyến du lịch.
- Bảng điều khiển cảnh báo quá tải.
- Gợi ý tránh tuyến có điểm dừng quá đông.
- Nhãn trạng thái như "Bình thường", "Đông", "Sắp đầy", "Quá tải".

## Phản Hồi Chính

Backend trả dữ liệu trong `metadata` theo định dạng chuẩn của server.

Ví dụ phản hồi rút gọn:

```json
{
  "statusCode": 200,
  "message": "Lấy tải trọng tuyến du lịch thành công",
  "metadata": {
    "tour": {
      "id": "550ea000-e29b-41d4-a716-100000000005",
      "name_vi": "Tour Tràng An - Bái Đính",
      "name_en": null,
      "slug": "tour-trang-an-bai-dinh",
      "status": "published",
      "duration_days": 1,
      "max_guests": 30,
      "province_code": "35"
    },
    "summary": {
      "total_stops": 3,
      "spot_stop_count": 3,
      "capacity_tracked_stops": 2,
      "stops_without_capacity_data": 1,
      "stops_without_max_capacity": 1,
      "total_current_visitors": 1200,
      "total_observed_visitors": 1350,
      "total_max_capacity": 2000,
      "route_capacity_pct": 60,
      "avg_capacity_pct": 72.5,
      "bottleneck_capacity_pct": 90,
      "bottleneck_stop": {
        "stop_id": "uuid",
        "spot_id": "uuid",
        "name_vi": "Khu du lịch sinh thái Tràng An",
        "capacity_pct": 90,
        "capacity_status": "near_full"
      },
      "status": "near_full"
    },
    "stops": []
  }
}
```

## Ý Nghĩa Các Chỉ Số

| Field | Ý nghĩa |
|---|---|
| `summary.total_stops` | Tổng số điểm dừng của tour, gồm cả stop là doanh nghiệp/dịch vụ |
| `summary.spot_stop_count` | Số stop gắn với điểm du lịch (`spot_id`) |
| `summary.capacity_tracked_stops` | Số điểm có `max_capacity > 0`, đủ điều kiện tính tải tuyến |
| `summary.stops_without_capacity_data` | Số điểm chưa có bản ghi tải mới nhất |
| `summary.stops_without_max_capacity` | Số điểm chưa cấu hình sức chứa tối đa |
| `summary.total_current_visitors` | Tổng khách hiện tại của các điểm đủ dữ liệu sức chứa |
| `summary.total_observed_visitors` | Tổng khách quan sát được, kể cả điểm chưa có `max_capacity` |
| `summary.total_max_capacity` | Tổng sức chứa tối đa của các điểm đủ dữ liệu |
| `summary.route_capacity_pct` | Phần trăm tải tổng hợp của tuyến |
| `summary.avg_capacity_pct` | Trung bình phần trăm tải của các điểm có dữ liệu |
| `summary.bottleneck_stop` | Điểm dừng đang tải cao nhất |
| `summary.status` | Trạng thái tổng hợp của tuyến |

## Trạng Thái Tải

Backend trả `summary.status` theo các giá trị:

| Status | Nhãn gợi ý | Màu gợi ý | Ý nghĩa |
|---|---|---|---|
| `normal` | Bình thường | Xanh lá | Tải thấp, tuyến an toàn |
| `busy` | Đông | Vàng | Tuyến bắt đầu đông |
| `near_full` | Sắp đầy | Cam | Cần cảnh báo người dùng |
| `overloaded` | Quá tải | Đỏ | Nên hạn chế gợi ý hoặc khuyến nghị đổi tuyến |
| `unknown` | Chưa có dữ liệu | Xám | Chưa đủ dữ liệu tải để đánh giá |

Gợi ý mapping frontend:

```js
const capacityStatusMap = {
  normal: { label: 'Bình thường', color: '#16a34a' },
  busy: { label: 'Đông', color: '#ca8a04' },
  near_full: { label: 'Sắp đầy', color: '#ea580c' },
  overloaded: { label: 'Quá tải', color: '#dc2626' },
  unknown: { label: 'Chưa có dữ liệu', color: '#6b7280' },
};
```

## Cách Gọi API

Ví dụ dùng `fetch`:

```js
async function getRouteCapacity(tourId) {
  const response = await fetch(`/api/v1/capacity/tours/${tourId}/current`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Không lấy được tải tuyến du lịch');
  }

  return payload.metadata;
}
```

Ví dụ dùng Axios:

```js
async function getRouteCapacity(tourId) {
  const response = await axios.get(`/api/v1/capacity/tours/${tourId}/current`);
  return response.data.metadata;
}
```

## Gợi Ý UI Trang Chi Tiết Tour

Nên hiển thị một khối "Tải tuyến hiện tại" gần phần thông tin tổng quan tour:

- Badge trạng thái: lấy từ `summary.status`.
- Thanh tiến trình: dùng `summary.route_capacity_pct`.
- Dòng phụ: `total_current_visitors / total_max_capacity khách`.
- Cảnh báo điểm nghẽn: nếu có `summary.bottleneck_stop`.
- Ghi chú thiếu dữ liệu: nếu `stops_without_capacity_data > 0` hoặc `stops_without_max_capacity > 0`.

Ví dụ logic hiển thị:

```js
const pct = summary.route_capacity_pct;
const showProgress = pct !== null && pct !== undefined;

const capacityText = showProgress
  ? `${pct}% sức chứa tuyến`
  : 'Chưa đủ dữ liệu sức chứa';
```

## Gợi Ý UI Bản Đồ

Mỗi item trong `stops` có thể có `geojson`:

```json
{
  "type": "Point",
  "coordinates": [105.9, 20.25]
}
```

Frontend có thể dùng dữ liệu này để:

- Vẽ marker từng điểm dừng.
- Tô màu marker theo `capacity_status`.
- Highlight `bottleneck_stop`.
- Hiển thị popup gồm tên điểm, số khách hiện tại, phần trăm tải và thời điểm ghi nhận.

## Xử Lý Dữ Liệu Thiếu

Một tuyến có thể có stop chưa đủ dữ liệu. Frontend cần xử lý các trường hợp:

- `route_capacity_pct = null`: không hiển thị progress bar theo phần trăm, hiển thị "Chưa đủ dữ liệu".
- `capacity_status = null`: marker dùng màu xám.
- `visitor_count = null`: hiển thị "Chưa ghi nhận".
- `max_capacity = null`: hiển thị "Chưa cấu hình sức chứa".
- `geojson = null`: không vẽ marker cho stop đó.

## Công Thức Tính

Backend đang tính:

```txt
route_capacity_pct = total_current_visitors / total_max_capacity * 100
```

Trong đó:

- `total_current_visitors` chỉ tính các điểm có `max_capacity > 0`.
- `total_max_capacity` chỉ cộng các điểm có cấu hình `max_capacity`.
- Stop gắn với doanh nghiệp hoặc dịch vụ không có `spot_id` vẫn nằm trong `stops`, nhưng không tham gia tính tải tuyến.

## Refresh Dữ Liệu

Vì dữ liệu tải thay đổi theo thời gian, frontend nên:

- Gọi lại API khi mở trang chi tiết tour.
- Refresh mỗi 30-60 giây nếu đang ở màn hình giám sát.
- Dừng polling khi component unmount.
- Có thể kết hợp SSE `/api/v1/capacity/stream` để biết khi nào cần reload dữ liệu tuyến.

Ví dụ polling:

```js
useEffect(() => {
  let mounted = true;

  async function load() {
    const data = await getRouteCapacity(tourId);
    if (mounted) setRouteCapacity(data);
  }

  load();
  const timer = setInterval(load, 60000);

  return () => {
    mounted = false;
    clearInterval(timer);
  };
}, [tourId]);
```

## Lỗi Thường Gặp

| HTTP | Nguyên nhân | Cách xử lý frontend |
|---|---|---|
| `400` | `tourId` không đúng UUID | Không gọi API nếu ID chưa hợp lệ |
| `404` | Tour không tồn tại hoặc chưa xuất bản | Hiển thị "Không tìm thấy tuyến du lịch" |
| `500` | Lỗi hệ thống hoặc DB | Hiển thị trạng thái lỗi và cho phép thử lại |

## Checklist Tích Hợp

- Lấy `tourId` từ route hoặc dữ liệu tour detail.
- Gọi `GET /api/v1/capacity/tours/:tourId/current`.
- Đọc dữ liệu từ `response.metadata`.
- Render `summary.status` thành badge.
- Render `summary.route_capacity_pct` thành progress bar nếu khác `null`.
- Render `summary.bottleneck_stop` nếu có.
- Render danh sách `stops` hoặc marker bản đồ nếu cần.
- Xử lý đầy đủ trạng thái `unknown` và dữ liệu `null`.
