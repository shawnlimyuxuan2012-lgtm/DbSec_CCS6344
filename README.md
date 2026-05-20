# AssessHub - Secure Student Assessment Platform

A full-stack academic assessment platform with PDPA-safe controls for students, lecturers, and admins.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router v6
- **Backend**: Node.js + Express + Microsoft SQL Server via `mssql`
- **Auth**: JWT + PBKDF2-HMAC-SHA-256 password hashing (210k iterations)
- **Upload**: Multer (PDF, DOCX, ZIP, max 10MB)

## Getting Started

### Requirements

- Node.js 18+
- Microsoft SQL Server

### 1. Clone the repository

```bash
git clone https://github.com/shawnlimyuxuan2012-lgtm/DbSec_CCS6344.git
cd DbSec_CCS6344
```

### 2. Install dependencies

From the repository root:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Database setup

Create the database and run the SQL schema files.

```sql
CREATE DATABASE SecureStudentDB;
```

Then execute the SQL files in this order:

- `schema_setup.sql` (tables schema)
- `RBAC.sql` (role-based access control)
- `security_test.sql` (security configurations)
- `audit_config.sql` (audit logging setup)

### 4. Backend setup

Create a backend environment file:

```bash
cd backend
cp .env.example .env
cd ..
```

### 5. Running the App

```bash
npm start
```

Or start them individually:

- **Backend only**: `npm run start:backend` or `npm run dev:backend`
- **Frontend only**: `npm run start:frontend` or `npm run dev:frontend`

Default frontend URL: `http://localhost:5173`

## Demo Accounts

Use the following test accounts to log in quickly:

- **Admin**
  - Email: `admin@mmu.edu.my`
  - Password: `MmuPass2026!`
- **Lecturer**
  - Email: `lecturer@mmu.edu.my`
  - Password: `MmuPass2026!`
- **Student**
  - Email: `student@mmu.edu.my`
  - Password: `MmuPass2026!`

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in values.

Required values:

- `PORT` – Server port (default: 5000)
- `NODE_ENV` – Environment (development/production)
- `JWT_SECRET` – Secret key for signing JWT tokens
- `JWT_EXPIRES_IN` – Token expiration duration (e.g. 7d)
- `DB_SERVER` – SQL Server host/IP
- `DB_PORT` – SQL Server port (default: 1433)
- `DB_DATABASE` – Database name (falls back to `DB_NAME` if not set)
- `DB_USER` – Database user
- `DB_PASSWORD` – Database password
- `DB_ENCRYPT` – Enable TLS encryption (true/false)
- `DB_TRUST_CERT` – Trust self-signed certificates (true/false)
- `SQL_AUDIT_FILEPATH` – Path to SQL audit files (e.g. `C:\SQLAudits\*.sqlaudit`)
- `CLIENT_URL` – Frontend URL for CORS (e.g. `http://localhost:5173`)
- `MAX_FILE_SIZE` – Max upload file size in bytes (default: 10485760)
- `UPLOAD_PATH` – Directory for uploaded files (default: ./uploads)

## Notes

- Backend health check: `http://localhost:5000/api/health`
- Frontend entry: `http://localhost:5173`
- `backend/uploads/` is ignored by Git and used for uploaded files.

## Security & PDPA Features

- Role-based access control: `student`, `lecturer`, `admin`
- JWT authentication and PBKDF2-HMAC-SHA-256 password hashing
- File upload validation and storage controls
- Audit logs for actions and grade access
- Student data export and deletion request functionality
- PDPA policy page available at `/pdpa-policy`
