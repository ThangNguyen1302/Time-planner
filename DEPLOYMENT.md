# TimePlanner deployment guide

Huong dan nay dung luong de trien khai don gian nhat:

- MySQL va backend Spring Boot tren Railway.
- Frontend Next.js tren Vercel.

Ban can co tai khoan GitHub, Railway, Vercel va da push repo len GitHub.

## 1. Kiem tra truoc khi deploy

Tai thu muc `backend`:

```powershell
.\mvnw.cmd test
```

Tai thu muc `frontend`:

```powershell
npm run lint
npm run typecheck
npm run build
```

Neu cac lenh nay qua, hay bat dau deploy.

## 2. Tao database MySQL tren Railway

1. Vao Railway va tao project moi.
2. Chon `Add Service`.
3. Chon `Database`.
4. Chon `MySQL`.
5. Mo tab `Variables` cua MySQL service va ghi lai cac bien:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`

Backend se dung cac gia tri nay de tao JDBC URL.

## 3. Deploy backend tren Railway

1. Trong cung Railway project, chon `Add Service`.
2. Chon `GitHub Repo`.
3. Chon repo `calendar`.
4. Dat root directory la:

```text
backend
```

5. Cau hinh build/start:

Build command:

```bash
./mvnw clean package -DskipTests
```

Start command:

```bash
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

6. Them environment variables cho backend:

```env
DB_URL=jdbc:mysql://${{MYSQLHOST}}:${{MYSQLPORT}}/${{MYSQLDATABASE}}?useSSL=true&serverTimezone=UTC
DB_USERNAME=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}

JWT_SECRET=<chuoi-bi-mat-random-it-nhat-32-byte>

FRONTEND_URL=http://localhost:3000

ASSISTANT_PROVIDER=gemini
GEMINI_API_KEY=<api-key-neu-co>
GEMINI_MODEL=gemini-2.5-flash
```

Neu Railway khong tu thay the bien theo cu phap `${{...}}`, copy gia tri that tu MySQL service va dien truc tiep vao `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.

7. Deploy backend.
8. Mo domain backend Railway, kiem tra:

```text
https://<backend-domain>/api/v1/health
https://<backend-domain>/actuator/health
```

Neu health endpoint tra ve OK, backend da chay. Flyway se tu tao bang trong MySQL khi backend khoi dong.

## 4. Deploy frontend tren Vercel

1. Vao Vercel.
2. Chon `Add New Project`.
3. Import repo `calendar`.
4. Dat root directory la:

```text
frontend
```

5. Vercel se tu nhan Next.js. Giu build command mac dinh hoac dat:

```bash
npm run build
```

6. Them environment variables:

```env
NEXT_PUBLIC_BACKEND_URL=https://<backend-domain>
BACKEND_URL=https://<backend-domain>
```

7. Deploy frontend.

## 5. Cap nhat CORS backend

Sau khi Vercel tao domain frontend, quay lai Railway backend va sua bien:

```env
FRONTEND_URL=https://<frontend-domain>.vercel.app,http://localhost:3000
```

Sau do redeploy backend.

`http://localhost:3000` chi can giu lai neu ban van muon frontend local goi backend production de test.

## 6. Neu dung Google Calendar

Trong backend Railway, them:

```env
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URI=https://<backend-domain>/api/v1/integrations/google/callback
```

Trong Google Cloud Console, vao OAuth Client va them Authorized redirect URI:

```text
https://<backend-domain>/api/v1/integrations/google/callback
```

Sau do redeploy backend.

## 7. Test sau khi deploy

Mo frontend production va test theo thu tu:

1. Dang ky tai khoan moi.
2. Dang nhap.
3. Tao task.
4. Tao event.
5. Tao habit.
6. Goi assistant.
7. Neu co Google Calendar, bam ket noi va thu dong bo.

Neu frontend bao loi ket noi backend, hay kiem tra:

- `NEXT_PUBLIC_BACKEND_URL` tren Vercel co dung domain backend khong.
- `FRONTEND_URL` tren Railway co dung domain frontend khong.
- Backend health endpoint co truy cap duoc khong.
- Database variables co dung khong.

## 8. Luu y ve Java version

Backend hien cau hinh Java 26 trong `backend/pom.xml`. Neu Railway bao loi khong co Java 26, co 2 cach:

1. Doi sang host ho tro Java 26 hoac dung Docker image Java 26.
2. Neu code khong dung tinh nang rieng cua Java 26, ha `java.version` ve Java 21 va build lai.

Nen thu deploy truoc. Chi doi Java version khi build log bao loi ro rang ve JDK.
