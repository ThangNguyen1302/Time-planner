# Kịch bản kiểm thử chatbot

Các kịch bản dưới đây dùng để kiểm thử thủ công trên giao diện chatbot. Trước
khi chạy nhóm sửa/xóa, hãy tạo dữ liệu bằng đúng các câu ở nhóm tạo.

## Task

| # | Câu nhập | Kết quả mong đợi |
| --- | --- | --- |
| T1 | `Tạo task nộp báo cáo deadline ngày mai 17h, 45 phút, ưu tiên gấp` | Tạo task `nop bao cao`, deadline ngày mai 17:00, thời lượng 45 phút, priority 5 |
| T2 | `Tạo task đọc sách 30 phút` | Tạo task `doc sach`, thời lượng 30 phút |
| T3 | `Sửa task nộp báo cáo thành nộp báo cáo cuối kỳ` | Đổi tên đúng task đã tạo |
| T4 | `Đánh dấu task đọc sách hoàn thành` | Status của task thành `completed` |
| T5 | `Đổi deadline task nộp báo cáo cuối kỳ sang ngày mai 20h` | Deadline đổi sang ngày mai 20:00 |
| T6 | `Xóa task đọc sách` | Task bị xóa và biến mất khỏi danh sách/lịch |
| T7 | `Tạo task` | Chatbot hỏi tên task, không tạo dữ liệu rỗng |
| T8 | `Xóa task không tồn tại` | Chatbot báo không tìm thấy, không xóa task khác |

## Event

| # | Câu nhập | Kết quả mong đợi |
| --- | --- | --- |
| E1 | `Tạo event họp nhóm ngày mai 9h đến 10h` | Tạo event ngày mai từ 09:00 đến 10:00 |
| E2 | `Tạo lịch gọi khách hàng hôm nay 15h đến 15h30` | Tạo event hôm nay từ 15:00 đến 15:30 |
| E3 | `Sửa lịch họp nhóm sang ngày mai 14h đến 15h` | Event chuyển sang 14:00-15:00 |
| E4 | `Xóa lịch gọi khách hàng` | Event bị xóa và biến mất khỏi lịch |
| E5 | `Tạo event họp khách hàng` | Chatbot hỏi thời gian, chưa tạo event |
| E6 | `Xóa lịch không tồn tại` | Chatbot báo không tìm thấy, không xóa event khác |

## Trường hợp an toàn

| # | Câu nhập | Kết quả mong đợi |
| --- | --- | --- |
| S1 | Tạo hai task có tên chứa `học backend`, rồi nhập `Xóa task học backend` | Chatbot báo có nhiều task khớp và không xóa |
| S2 | `Hôm nay tôi nên làm gì?` | Chatbot không tự tạo/sửa/xóa dữ liệu |
| S3 | `Delete task weekly report` | Nhận diện thao tác xóa task tiếng Anh |
| S4 | `Remove event team meeting` | Nhận diện thao tác xóa event tiếng Anh |

## Chạy test tự động

Các test này không cần database hoặc API key:

```powershell
cd backend
.\mvnw.cmd test "-Dtest=AssistantRuleParserTest,AssistantActionExecutorTest"
```

Các lớp chính:

- `AssistantRuleParserTest`: kiểm tra chatbot hiểu câu lệnh và trích đúng dữ liệu.
- `AssistantActionExecutorTest`: kiểm tra gọi đúng service và chặn thao tác nguy hiểm.

Kết quả hiện tại: `17` test, `0` failure, `0` error.

Lệnh `.\mvnw.cmd test` chạy toàn bộ suite, trong đó `BackendApplicationTests`
vẫn cần cấu hình PostgreSQL hợp lệ vì nó khởi động toàn bộ Spring context.
