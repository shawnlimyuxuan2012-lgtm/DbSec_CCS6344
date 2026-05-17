# AssessHub - Secure Student Assessment Platform

A full-stack academic assessment platform with PDPA-safe controls for students, lecturers, and admins.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router v6
- **Backend**: Node.js + Express + Microsoft SQL Server via `mssql`
- **Auth**: JWT + bcrypt
- **Upload**: Multer (PDF, DOCX, ZIP, max 10MB)

## Getting Started

### Requirements

- Node.js 18+
- SQL Server / Azure SQL

### 1. Clone the repository

```bash
git clone https://github.com/shawnlimyuxuan2012-lgtm/DbSec_CCS6344.git
cd DbSec_CCS6344
```

### 2. Install dependencies

From the repository root:

```bash
npm install
```

### 3. Database setup

Create the database and run the SQL schema.

```sql
CREATE DATABASE SecureStudentDB;
```

Then execute the SQL schema file located at:

```bash
backend/config/schema.sql
```

### 4. Backend setup

Create a backend environment file:

```bash
cd backend
cp .env.example .env
```

Update the DB connection values and JWT secret.

Start the backend:

```bash
npm run dev
```

Default backend URL: `http://localhost:5000`

### 5. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL: `http://localhost:5173`

## Demo Accounts

Use the following test accounts to log in quickly:

- **Admin**
  - Email: `admin@assessment.com`
  - Password: `password123`
- **Lecturer**
  - Email: `lecturer@assessment.com`
  - Password: `password123`
- **Student**
  - Email: `student@assessment.com`
  - Password: `password123`

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in values.

Required values:

- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DB_SERVER`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USER`
- `DB_PASSWORD`
- `DB_ENCRYPT`
- `DB_TRUST_CERT`
- `SQL_AUDIT_FILEPATH`
- `CLIENT_URL`
- `MAX_FILE_SIZE`
- `UPLOAD_PATH`

## Notes

- Backend health check: `http://localhost:5000/api/health`
- Frontend entry: `http://localhost:5173`
- `backend/uploads/` is ignored by Git and used for uploaded files.

## Security & PDPA Features

- Role-based access control: `student`, `lecturer`, `admin`
- JWT authentication and password hashing
- File upload validation and storage controls
- Audit logs for actions and grade access
- Student data export and deletion request functionality
- PDPA policy page available at `/pdpa-policy`
