# TimePlanner Backend

REST API của TimePlanner, xây dựng bằng Spring Boot, Spring Security, JPA,
Flyway và PostgreSQL.

## Tính năng

- Đăng ký, đăng nhập và xác thực bằng JWT
- Quản lý task, event, habit và time block
- Lưu tùy chọn người dùng
- Trợ lý AI hỗ trợ OpenRouter, OpenAI hoặc Gemini
- Kết nối và đọc dữ liệu Google Calendar
- Migration database tự động bằng Flyway

## Yêu cầu

- Java 21
- PostgreSQL 16

Không cần cài Maven riêng vì dự án có Maven Wrapper.

## Database

Tạo database:

```sql
CREATE DATABASE timeplanner;
```

Cấu hình kết nối được đọc từ `backend/.env`:

```text
URL:      jdbc:postgresql://localhost:5432/timeplanner
Username: postgres
Password: giá trị DB_PASSWORD
```

Khi backend khởi động, Flyway tự động áp dụng các migration trong
`src/main/resources/db/migration`.

## Biến môi trường

Tạo file `.env` từ file mẫu khi cần Google Calendar hoặc AI:

```powershell
Copy-Item .env.example .env
```

Mở `.env`, chọn `ASSISTANT_PROVIDER` và điền khóa của provider tương ứng.
Đồng thời điền `DB_PASSWORD` và một `JWT_SECRET` ngẫu nhiên có ít nhất 32 byte.
Nếu không có AI API key hợp lệ, trợ lý sẽ dùng bộ phân tích quy tắc có sẵn.

Google OAuth cần đăng ký redirect URI sau trong Google Cloud Console:

```text
http://localhost:8080/api/v1/integrations/google/callback
```

## Chạy backend

Trên Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Trên macOS hoặc Linux:

```bash
./mvnw spring-boot:run
```

API chạy tại `http://localhost:8080`. Kiểm tra trạng thái:

```text
GET http://localhost:8080/api/v1/health
GET http://localhost:8080/actuator/health
```

## API chính

| Nhóm | Endpoint |
| --- | --- |
| Xác thực | `/api/v1/auth/*`, `/api/v1/me` |
| Task | `/api/v1/tasks` |
| Event | `/api/v1/events` |
| Habit | `/api/v1/habits` |
| Time block | `/api/v1/time-blocks` |
| Tùy chọn | `/api/v1/preferences` |
| Trợ lý | `/api/v1/assistant/chat` |
| Google Calendar | `/api/v1/integrations/google/*` |

Ngoại trừ đăng ký, đăng nhập, health check và Google callback, các endpoint yêu
cầu access token:

```http
Authorization: Bearer <access-token>
```

## Kiểm tra và đóng gói

```powershell
.\mvnw.cmd test
.\mvnw.cmd clean package
```

## Bảo mật

Không commit file `.env` hoặc khóa bí mật. Trước khi triển khai production, cần
đổi JWT secret, tài khoản database, tắt SQL debug và giới hạn CORS theo domain
frontend thực tế.
