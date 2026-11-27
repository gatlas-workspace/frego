# Nghiên cứu: hệ thống tìm đường và thuật toán (cho bản đồ chuyến Frego)

Ngày: 27/11/2026 · Mục đích: thay đường thẳng nối điểm đi – điểm đến bằng đường đi thật theo đường phố.

## 1. Các ứng dụng gọi xe đang dùng gì

| Ứng dụng / hãng | Bản đồ và tìm đường | Ghi chú |
| --- | --- | --- |
| **Grab** | **GrabMaps** của Grab, xây trên dữ liệu OpenStreetMap rồi bổ sung dữ liệu riêng (tài xế ghi hẻm, đường thiếu). Từ quý 3/2022 Grab chạy hoàn toàn bằng bản đồ của mình. Tìm đường có chế độ **xe máy**. Bán ra ngoài qua Amazon Location Service (vùng Singapore, Malaysia) | Trước đó Grab dùng OSM và HERE. Xe hai bánh là phương tiện chính ở Đông Nam Á nên chế độ xe máy là điểm khác biệt |
| **Google Maps Platform** (nhiều app dùng) | Routes API, có chế độ **TWO_WHEELER** (xe máy) và **Việt Nam nằm trong danh sách hỗ trợ** | Chế độ xe hai bánh đang là beta, giá cao hơn chế độ ô tô; Google khuyên hiện cảnh báo cho người dùng |
| **Goong** (Việt Nam) | Directions API, tham số `vehicle`: `car`, `bike`, `taxi`, `truck`, `hd` (xe gọi) | Khoảng 2,00–2,50 USD / 1.000 lượt (Google: 4–5 USD) |
| Be, Xanh SM | Không công bố. Thường là bản đồ thương mại (Google/Goong…) cộng dữ liệu riêng | Chưa xác minh |

Ngoài thuật toán, các hãng lớn hơn nhau ở **dữ liệu giao thông thời gian thực** (vị trí GPS của hàng triệu tài xế) và **mô hình học máy dự báo thời gian đến (ETA)**. Ví dụ Google dự báo ETA bằng mạng nơ-ron đồ thị cùng DeepMind; Uber có DeepETA. Bộ tìm đường mã nguồn mở không có dữ liệu giao thông, nên thời gian chỉ là ước tính.

## 2. Thuật toán tìm đường tối ưu hiện nay

Bài toán: tìm đường ngắn nhất (theo thời gian) trên đồ thị đường phố hàng chục triệu cạnh, trả lời trong vài mili-giây.

| Thuật toán | Ý tưởng | Dùng ở đâu |
| --- | --- | --- |
| Dijkstra / A* | Duyệt dần từ điểm đi; A* thêm ước lượng khoảng cách tới đích để duyệt ít hơn | Nền tảng; quá chậm cho bản đồ quốc gia nếu không tiền xử lý |
| **Contraction Hierarchies (CH)** | Tiền xử lý: "rút" lần lượt các nút ít quan trọng, thêm cạnh tắt. Truy vấn hai chiều chỉ đi lên các nút quan trọng hơn → nhanh gấp hàng nghìn lần Dijkstra | OSRM (chế độ CH), GraphHopper |
| **Customizable Route Planning / Multi-Level Dijkstra (CRP/MLD)** | Chia đồ thị nhiều tầng; khi trọng số đổi (kẹt xe) chỉ "tùy biến" lại vài giây, không tiền xử lý lại từ đầu | Microsoft Bing Maps (nguồn gốc CRP), OSRM (chế độ MLD) |
| **Customizable Contraction Hierarchies (CCH)** | CH với thứ tự rút độc lập trọng số → cập nhật giao thông nhanh. Khảo sát 2025 của KIT: CCH là lựa chọn tốt nhất cho truy vấn đường đi cả tĩnh lẫn động | Nghiên cứu, RoutingKit |
| Hub Labeling | Mỗi nút lưu sẵn "nhãn" khoảng cách tới các nút trung tâm → truy vấn gần như tức thì, tốn bộ nhớ | Nhanh nhất cho truy vấn khoảng cách tĩnh; cập nhật trọng số động kém |
| A* hai chiều trên đồ thị phân tầng theo ô (tile) | Đồ thị chia ô theo cấp đường, có mô hình chi phí theo phương tiện | **Valhalla** (có chi phí `motorcycle`, `motor_scooter`) |

Kết luận cho Frego: không cần tự cài thuật toán. Dùng một bộ tìm đường có sẵn (đã cài CH/MLD/A* phân tầng) với dữ liệu OSM Việt Nam, chọn chế độ **xe máy** cho xe máy và **ô tô** cho ô tô 4 và 6–7 chỗ.

## 3. Đo thử từ mạng Việt Nam (27/11/2026, Landmark 81 → Chợ Bến Thành)

| Máy chủ | Phương tiện | Quãng đường | Thời gian | Ghi chú |
| --- | --- | --- | --- | --- |
| OSRM demo `router.project-osrm.org` | ô tô | 5,84 km | 9 phút | Khớp 5,8 km của thiết kế; thời gian không tính kẹt xe nên quá ngắn |
| FOSSGIS OSRM `routing.openstreetmap.de` | ô tô | 5,84 km | 9 phút | |
| **FOSSGIS Valhalla** `valhalla1.openstreetmap.de` | ô tô (`auto`) | 5,88 km | 17 phút | Hướng dẫn tiếng Việt ("Lái về phía tây nam.") |
| FOSSGIS Valhalla | **xe máy (`motorcycle`)** | 5,87 km | 17 phút | Hợp xe máy Grab/Be |
| FOSSGIS Valhalla | xe tay ga nhỏ (`motor_scooter`) | 7,44 km | 21 phút | Tránh đường tốc độ cao, đi vòng; không hợp |

Cả ba máy chủ đều vào được qua DNS của VNPT (khác `openstreetmap.org`, bị DNS VNPT chặn).

**Điều kiện dùng máy chủ công cộng** (FOSSGIS, OSRM demo): chỉ để phát triển/thử nghiệm, tối đa 1 lượt/giây mỗi người dùng; FOSSGIS khuyên không ghi cứng địa chỉ máy chủ trong app. Không dùng cho bản chính thức.

## 4. Lựa chọn cho bản chính thức

| Phương án | Chi phí | Ưu | Nhược |
| --- | --- | --- | --- |
| **Tự chạy Valhalla** với dữ liệu OSM Việt Nam (Geofabrik) trên một máy chủ nhỏ | Tiền máy chủ (vài GB RAM), không tính theo lượt | Có xe máy, hướng dẫn tiếng Việt, tọa độ người dùng không ra ngoài Frego | Phải vận hành, tự cập nhật dữ liệu OSM; không có kẹt xe |
| Goong Directions (`vehicle=bike/car`) | ~2–2,5 USD / 1.000 lượt | Dữ liệu Việt Nam tốt, có xe máy | Gửi tọa độ cho bên thứ ba; cần key, hợp đồng |
| Google Routes API (`TWO_WHEELER`, beta) | Đắt nhất | Có dữ liệu giao thông | Gửi tọa độ cho Google; giá xe hai bánh cao hơn |
| GrabMaps qua AWS | Theo AWS | Dữ liệu xe máy tốt nhất khu vực | Dữ liệu của đối thủ cạnh tranh trực tiếp (Grab là hãng Frego so giá); vùng AWS ngoài VN |

Đề xuất: **giai đoạn này dùng FOSSGIS Valhalla** (thử nghiệm, chế độ `motorcycle`/`auto`), địa chỉ máy chủ đặt trong biến môi trường. **Trước khi ra mắt, tự chạy Valhalla**, chỉ cần đổi biến môi trường. Nếu không muốn vận hành máy chủ thì dùng Goong.

Quyền riêng tư: gửi tọa độ điểm đi/đến cho máy chủ tìm đường là chia sẻ dữ liệu vị trí. Phải nói rõ trong Chính sách dữ liệu; tự chạy Valhalla thì không có vấn đề này.

## Nguồn

- [How GrabMaps knows the fastest routes in Southeast Asia (Grab)](https://www.grab.com/inside-grab/stories/how-grabmaps-knows-the-fastest-routes-in-southeast-asia/)
- [Building hyperlocal GrabMaps (Grab Engineering)](https://engineering.grab.com/building-hyperlocal-grabmaps)
- [Grab to be fully powered by its own mapping technology by Q3 2022](https://www.grab.com/sg/press/tech-product/grab-to-be-fully-powered-by-its-own-mapping-technology-by-q3-2022/)
- [Amazon Location Service now supports GrabMaps (03/2026)](https://aws.amazon.com/about-aws/whats-new/2026/03/amazon-location-service-grabmaps)
- [GrabMaps – Amazon Location Service](https://docs.aws.amazon.com/location/previous/developerguide/grab.html)
- [Google Routes API – vùng hỗ trợ xe hai bánh](https://developers.google.com/maps/documentation/routes/coverage-two-wheeled)
- [Google Routes API – tuyến xe hai bánh](https://developers.google.com/maps/documentation/routes/route_two_wheel?authuser=8)
- [Goong Directions API](https://docs.goong.io/rest/directions) · [Bảng giá Goong](https://goong.io/pricing-plans/)
- [FOSSGIS – điều kiện dùng máy chủ](https://fossgis.de/arbeitsgruppen/osm-server/nutzungsbedingungen) · [OSM wiki FOSSGIS Server Policy](https://wiki.openstreetmap.org/wiki/FOSSGIS/Server/Policy) · [OSRM API Usage Policy](https://github.com/Project-OSRM/osrm-backend/wiki/API%20Usage%20Policy)
- [Customizable Contraction Hierarchies – A Survey (KIT, 2025)](https://arxiv.org/pdf/2502.10519) · [Customizable Hub Labeling](https://arxiv.org/pdf/2208.08709)
