# Tài liệu Thiết kế & Tích hợp: Tách biệt OCOP và Truy vấn Địa lý lân cận Spot

Tài liệu này hướng dẫn chi tiết về các thay đổi kiến trúc cơ sở dữ liệu (Database), API OCOP GeoJSON công cộng và hướng dẫn thiết kế tích hợp tính năng **OCOP lân cận theo địa lý** tại trang chi tiết Điểm du lịch (Spot Detail).

---

## 1. Thay đổi cơ bản của Thực thể OCOP (OCOP Changes)

Để tăng tính linh hoạt và giảm phụ thuộc chéo, sản phẩm OCOP đã được **tách rời hoàn toàn khỏi liên kết cứng (`spot_id`)** của Điểm du lịch. Mỗi sản phẩm OCOP hiện tại sở hữu tọa độ địa lý độc lập của chính nó.

### Cập nhật Cơ sở dữ liệu (Database Update)
- Trường `spot_id` trên tất cả các dòng dữ liệu trong bảng `ocop_products` đã được cập nhật thành `NULL`.
- Cột hình học PostGIS `geom` của mỗi sản phẩm OCOP đã được gán tọa độ ngẫu nhiên nằm **hoàn toàn bên trong ranh giới tỉnh Ninh Bình**:
  - Kinh độ (Longitude): `[105.75, 106.05]`
  - Vĩ độ (Latitude): `[20.10, 20.35]`

### Cập nhật API GeoJSON (`GET /api/v1/ocop/geojson`)
- **Tối ưu hóa Truy vấn**: Lược bỏ hoàn toàn liên kết `INNER JOIN/LEFT JOIN` với bảng `tourism_spots` trong luồng lấy GeoJSON. Geometries được tính toán trực tiếp từ `o.geom` của sản phẩm OCOP.
- **Hỗ trợ đa ngôn ngữ động**: Hỗ trợ tham số `lang` (`vi` hoặc `en`) để tự động dịch trường tên (`name`).

#### Cú pháp gọi API:
```http
GET /api/v1/ocop/geojson?lang=en&page=1&limit=50
```

#### Cấu trúc phản hồi (Response Schema):
```json
{
  "status": "success",
  "message": "Lấy GeoJSON sản phẩm OCOP thành công",
  "metadata": {
    "type": "FeatureCollection",
    "name": "ocop_products",
    "totalFeatures": 12,
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [105.809468585, 20.205283385]
        },
        "properties": {
          "id": "550cb000-e29b-41d4-a716-000000000010",
          "name": "Ninh Binh Ramie Leaf Sticky Rice Cake",
          "name_vi": "Bánh Gai Ninh Bình",
          "star_rating": 4,
          "cover_image_url": "https://example.com/banh-gai.jpg",
          "producer_name": "Cơ sở Bánh Gai Truyền Thống",
          "price_vnd": "35000"
        }
      }
    ]
  }
}
```

---

## 2. Thiết kế tính năng OCOP lân cận Điểm du lịch (Spot Detail Proximity)

Khi người dùng xem trang chi tiết một Điểm du lịch (Spot Detail), giao diện có thể hiển thị danh sách các sản phẩm OCOP đặc trưng **nằm trong bán kính xung quanh điểm du lịch đó** để quảng bá mua sắm địa phương.

### Cú pháp gọi API Spot Detail:
Hỗ trợ cả 2 endpoint chi tiết (theo ID và theo Slug):
- **Theo ID**: `GET /api/v1/spots/id/:id?ocop=true&radius_km=10&lang=vi`
- **Theo Slug**: `GET /api/v1/spots/:slug?ocop=true&radius_km=10&lang=vi`

#### Tham số truy vấn (Query Params):
| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `ocop` | Boolean | `false` | Bật/tắt tính năng truy vấn sản phẩm OCOP lân cận. Truyền `true` để lấy danh sách. |
| `radius_km` | Number | `10` | Bán kính quét tìm kiếm địa lý (tính bằng Kilômét). Giới hạn `[0.1 - 100]`. |
| `lang` | String | `'vi'` | Ngôn ngữ hiển thị (`vi` hoặc `en`). |

### Cấu trúc phản hồi (Response Schema):
Khi truyền kèm `ocop=true`, đối tượng `spot` trả về sẽ chứa thêm mảng `ocop_products` được sắp xếp theo thời gian tạo mới nhất:

```json
{
  "status": "success",
  "message": "Lấy thông tin điểm du lịch thành công",
  "metadata": {
    "spot": {
      "id": "770ca000-e29b-41d4-a716-000000000002",
      "slug": "hang-van-ninh-binh",
      "name": "Hang Vân",
      "description": "Hang động tự nhiên hoang sơ tuyệt đẹp...",
      "lat": 20.245,
      "lng": 105.911,
      "rating_avg": "4.80",
      "rating_count": 15,
      "ticket_price_adult": "50000",
      "primary_image": "https://example.com/hang-van.jpg",
      
      "ocop_products": [
        {
          "id": "550cb000-e29b-41d4-a716-000000000002",
          "name": "Mắm Tép Gia Viễn Bà Quý",
          "category": "Thực phẩm",
          "description": "Mắm tép chưng thịt truyền thống thơm ngon...",
          "star_rating": 4,
          "certification_no": "OC-4892",
          "price_vnd": "75000",
          "unit": "Hũ 500g",
          "cover_image_url": "https://example.com/mam-tep.jpg",
          "producer_name": "Hộ kinh doanh Bà Quý",
          "province_code": "35",
          "lat": 20.246442,
          "lng": 105.874665
        },
        {
          "id": "550cb000-e29b-41d4-a716-000000000006",
          "name": "Thịt Dê Núi Ninh Bình Khô Tẩm Gia Vị",
          "category": "Đặc sản khô",
          "description": "Thịt dê núi chăn thả tự nhiên sấy khô hảo hạng...",
          "star_rating": 3,
          "price_vnd": "250000",
          "unit": "Gói 200g",
          "cover_image_url": "https://example.com/kho-de.jpg",
          "producer_name": "HTX Dê Núi Ninh Bình",
          "province_code": "35",
          "lat": 20.255683,
          "lng": 105.946733
        }
      ]
    }
  }
}
```

---

## 3. Gợi ý thiết kế Giao diện người dùng (UI/UX Guidelines)

1. **Bản đồ trực quan (Interactive Map)**: 
   - Trên bản đồ chi tiết của Điểm du lịch, vẽ tâm vòng tròn mờ đại diện cho bán kính quét (`radius_km`).
   - Hiển thị các sản phẩm OCOP lân cận dưới dạng các Marker hoặc ghim đặc thù (ví dụ: ghim màu vàng biểu tượng ngôi sao OCOP 3-5★) xung quanh ghim chính của Điểm du lịch.
2. **Danh sách sản phẩm nổi bật (Product Carousel/Grid)**:
   - Phía dưới phần thông tin mô tả chi tiết của Điểm du lịch, thiết kế một khu vực riêng biệt có tiêu đề *"Đặc sản OCOP lân cận"* dạng Carousel trượt ngang hoặc lưới thẻ (Grid).
   - Mỗi thẻ sản phẩm hiển thị ảnh bìa (`cover_image_url`), số sao chứng nhận OCOP (`star_rating` ★), giá tiền (`price_vnd`) và khoảng cách ước tính địa lý từ điểm du lịch tới sản phẩm (nếu cần thiết kế tính toán trên Client).
3. **Bộ lọc nhanh (Quick Filters)**:
   - Cho phép người dùng chuyển nhanh bán kính tìm kiếm OCOP (Ví dụ: `5km`, `10km`, `20km`) bằng cách gửi lại tham số `radius_km` tương ứng lên API để cập nhật tức thì danh sách sản phẩm hiển thị.
