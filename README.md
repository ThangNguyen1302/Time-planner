# TimePlanner

TimePlanner là ứng dụng quản lý thời gian gồm lịch, công việc, sự kiện, thói quen,
time block, trợ lý AI và tích hợp Google Calendar.

## Cấu trúc dự án

```text
calendar/
├── backend/    # Spring Boot, Spring Security, JPA, Flyway và MySQL
└── frontend/   # Next.js, React và TypeScript
```

## Yêu cầu

- Java 26
- Node.js 20 trở lên
- MySQL 8
- Redis (chạy local qua Docker: `docker run -d -p 6379:6379 redis`)

## Chạy dự án

### 1. Chuẩn bị MySQL

Tạo database:

```sql
CREATE DATABASE timeplanner
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Backend mặc định kết nối bằng tài khoản `root` tại `localhost:3306`. Tạo
`backend/.env` từ `backend/.env.example`, sau đó điền `DB_PASSWORD` và
`JWT_SECRET` trước khi chạy.

### 2. Chạy backend

```powershell
cd backend
Copy-Item .env.example .env
.\mvnw.cmd spring-boot:run
```

Backend chạy tại `http://localhost:8080`. Flyway tự động chạy migration khi ứng
dụng khởi động.

### 3. Chạy frontend

Mở terminal khác:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Frontend chạy tại `http://localhost:3000`.

## Cấu hình tùy chọn

- Google Calendar: cấu hình `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` và
  `GOOGLE_REDIRECT_URI` trong `backend/.env`.
- Trợ lý AI: chọn một trong OpenRouter, OpenAI hoặc Gemini và cấu hình API key
  tương ứng trong `backend/.env`.

Xem hướng dẫn chi tiết tại [backend/README.md](backend/README.md) và
[frontend/README.md](frontend/README.md).

## Kiểm tra

```powershell
cd backend
.\mvnw.cmd test
```

```powershell
cd frontend
npm run lint
npm run typecheck
npm run build
```

## Bảo mật

Không commit `.env`, `.env.local`, API key, Google client secret, JWT secret
hoặc thông tin đăng nhập database. Chỉ commit các file mẫu như `.env.example`
với giá trị trống hoặc placeholder.
