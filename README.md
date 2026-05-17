# AssessHub - Secure Student Assessment Platform

A full-stack PDPA-compliant academic assessment platform.

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + React Router v6
- **Backend**: Node.js + Express + MSSQL (mssql package)
- **Auth**: JWT (stored in localStorage) + bcrypt (cost 12)
- **Upload**: Multer (PDF, DOCX, ZIP, max 10MB)

## Quick Start

### 1. Database Setup
```sql
-- Run in SSMS / Azure Data Studio:
CREATE DATABASE AssessmentPlatform;
-- Then run: backend/config/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env          # edit DB credentials & JWT secret
npm install
npm run dev                   # starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                   # starts on http://localhost:5173
```

## Demo Accounts (password: `password123`)
| Role     | Email                      |
|----------|---------------------------|
| Admin    | admin@assessment.com      |
| Lecturer | lecturer@assessment.com   |
| Student  | student@assessment.com    |

## Project Structure
```
assessment-platform/
├── backend/
│   ├── config/
│   │   ├── db.js               # MSSQL connection pool
│   │   └── schema.sql          # Full T-SQL schema + seed data
│   ├── controllers/
│   │   ├── authController.js   # register, login, forgot/reset password
│   │   ├── studentController.js
│   │   ├── lecturerController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verify, RBAC, audit loggers
│   │   └── upload.js           # Multer config
│   ├── routes/
│   │   ├── auth.js
│   │   ├── student.js
│   │   ├── lecturer.js
│   │   └── admin.js
│   ├── uploads/                # File storage (gitignored)
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx       # Sidebar navigation
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state
    │   ├── pages/
    │   │   ├── Landing.jsx
    │   │   ├── PDPAPolicy.jsx
    │   │   ├── auth/            # Login, Register, ForgotPassword
    │   │   ├── student/         # Dashboard, Submit, History, Grades, Profile
    │   │   ├── lecturer/        # Dashboard, Assignments, Submissions, Grading
    │   │   └── admin/           # Dashboard, Users, Audit, Breach, Retention
    │   ├── utils/
    │   │   └── api.js           # Axios instance with JWT interceptor
    │   ├── App.jsx              # All routes (React Router v6)
    │   ├── main.jsx
    │   └── index.css            # Tailwind + design tokens
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Path                  | Description          |
|--------|-----------------------|----------------------|
| POST   | /register             | Student registration |
| POST   | /login                | Login → JWT          |
| POST   | /forgot-password      | Send reset token     |
| POST   | /reset-password       | Reset with token     |
| GET    | /logout               | Clear cookie         |
| GET    | /me                   | Current user info    |

### Student (`/api/student`) — requires student role
| Method | Path                        | Description           |
|--------|-----------------------------|-----------------------|
| GET    | /assignments                | List all assignments  |
| GET    | /assignments/:id            | Single assignment     |
| POST   | /submit-assignment/:id      | Submit (multipart)    |
| PUT    | /resubmit-assignment/:id    | Resubmit before deadline |
| GET    | /submissions                | My submissions        |
| GET    | /grades                     | My grades             |
| GET    | /download-data              | PDPA data export JSON |
| DELETE | /delete-account             | Request soft delete   |

### Lecturer (`/api/lecturer`) — requires lecturer role
| Method | Path                        | Description           |
|--------|-----------------------------|-----------------------|
| GET    | /courses                    | All assignments       |
| POST   | /assignments                | Create assignment     |
| PUT    | /assignments/:id            | Update assignment     |
| DELETE | /assignments/:id            | Soft delete           |
| GET    | /submissions/:assignmentId  | View submissions      |
| POST   | /grades                     | Enter grade           |
| PUT    | /grades/:id                 | Update grade          |

### Admin (`/api/admin`) — requires admin role
| Method | Path               | Description             |
|--------|--------------------|-------------------------|
| GET    | /users             | All users               |
| POST   | /users             | Create user             |
| PUT    | /users/:id         | Update user             |
| DELETE | /users/:id         | Soft delete user        |
| GET    | /audit-logs        | General + grade logs    |
| POST   | /breach-notify     | Send breach notification|
| DELETE | /purge-records     | PDPA data purge         |

## Security Features
- bcrypt password hashing (cost factor 12)
- JWT authentication with 7-day expiry
- Role-based access control (student / lecturer / admin)
- Comprehensive audit logging (all actions + grade access)
- File type & size validation (PDF, DOCX, ZIP ≤ 10MB)
- Soft deletes (no hard data deletion without admin action)
- PDPA: consent on registration, data download, deletion request

## PDPA Compliance
- Mandatory consent checkbox on registration
- "Download My Data" — JSON export of all user data
- "Request Account Deletion" — soft-delete workflow
- Admin audit log page for grade access review
- Breach notification page (simulated via console.log in dev)
- Data retention purge with configurable period
- PDPA Policy page at `/pdpa-policy`
