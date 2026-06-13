# TimePlanner Frontend

Giao diện web của TimePlanner, xây dựng bằng Next.js, React và TypeScript.

## Tính năng

- Đăng ký và đăng nhập
- Dashboard quản lý task, event, habit và lịch
- Time blocking và theo dõi tiến độ
- Trợ lý lập kế hoạch
- Kết nối Google Calendar
- Giao diện sáng/tối và Live2D

## Yêu cầu

- Node.js 20 trở lên
- npm
- TimePlanner backend chạy tại `http://localhost:8080`

## Cấu hình

Tạo `.env.local` từ file mẫu:

```powershell
Copy-Item .env.example .env.local
```

Biến bắt buộc:

```dotenv
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:8080
```

Các khóa AI trong `.env.example` chỉ cần thiết nếu frontend sử dụng API route
AI cục bộ. Trợ lý của backend được cấu hình riêng trong `backend/.env`.

## Cài đặt và chạy

```powershell
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Scripts

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Chạy môi trường phát triển |
| `npm run build` | Tạo production build |
| `npm run start` | Chạy production build |
| `npm run lint` | Kiểm tra ESLint |
| `npm run typecheck` | Kiểm tra TypeScript |

## Kiểm tra trước khi đẩy code

```powershell
npm run lint
npm run typecheck
npm run build
```

## Bảo mật

Không commit `.env.local`, API key hoặc client secret. Biến có tiền tố
`NEXT_PUBLIC_` được đưa vào mã chạy trên trình duyệt, vì vậy không đặt thông tin
bí mật trong các biến này.
