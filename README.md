# Learn2Earn Mentor Portal (MERN)

A MERN-stack application for managing Group B fellow records, mentor assignments, daily monitoring, project progress, structured assessments, weekly reviews, follow-up actions and KPI visibility.

## Current seed roster

- 43 Group B fellows are seeded from the supplied list.
- Justin is assigned 22 fellows.
- Valentine is assigned 21 fellows.
- Assignments are randomized once in `server/src/seed.js`, then stored in MongoDB. Administrators can change assignments in the Fellow Register.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB Community Server or a MongoDB Atlas connection

## Run locally

### 1. Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and set `MONGODB_URI`, `JWT_SECRET`, and a strong `ADMIN_PASSWORD`.

### 2. Install dependencies and seed the database

```bash
npm install
npm run seed
```

The seed command creates an administrator, mentor login accounts and the 43 Group B fellows. Initial development credentials are read from `.env`:

- Admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- Mentor accounts: `justin@learn2earn.local` and `valentine@learn2earn.local`
- Initial mentor password: `ChangeMe123!`

Change these credentials before sharing or deploying the application. Mentor accounts are scoped to their assigned fellows in the API. The administrator account can access the full campus roster. Change all development credentials before deployment.

### 3. Start the API

```bash
npm run dev
```

API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### 4. Start the React frontend (new terminal)

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## Main features

- **Dashboard:** roster size, mentor allocation, standing counts, inactive LMS count, blocked projects, open actions and recent assessments.
- **Fellow Register:** create, edit, archive, search, filter, assign mentor and export CSV.
- **Daily Monitoring:** attendance, daily objective, task completion, LMS activity, project work, 1–5 performance observations, blockers, interventions, evidence and escalation.
- **Project Tracking:** project status, development mode, AI/vibe-coded contribution and current standing.
- **Assessments:** eight 1–5 assessment dimensions; a provisional equal-weight score is calculated out of 100, with evidence and improvement plan fields.
- **Weekly Reviews:** weekly attendance, learning, milestones, strengths, gaps, interventions and next-week actions.
- **Action Register:** priority, action owner, due date, status, closure evidence and escalation.
- **CSV exports:** export the current fellow list and record views.

## Assessment rubric note

The eight assessment dimensions are equally weighted in this starter implementation. The score thresholds are provisional mentor aids, not an official Learn2Earn grading policy. Confirm the programme's approved rubric and thresholds before using scores for formal fellow decisions.

## Data model

MongoDB collections: `users`, `fellows`, `dailylogs`, `assessments`, `weeklyreviews`, `actions`.

## API overview

- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET|POST /api/fellows`
- `GET|PATCH|DELETE /api/fellows/:id`
- `GET /api/fellows/:id/history`
- `GET|POST|PATCH|DELETE /api/records/daily`
- `GET|POST|PATCH|DELETE /api/records/assessments`
- `GET|POST|PATCH|DELETE /api/records/weekly`
- `GET|POST|PATCH|DELETE /api/records/actions`

All endpoints other than login and health check require a JWT bearer token.

## Before production deployment

1. Replace all development passwords and use a strong random JWT secret.
2. Add password reset, account invitation and audit history.
3. Configure HTTPS, production CORS origins, MongoDB backups and deployment secrets.
4. Confirm the official assessment framework, reporting fields and data retention policy with Learn2Earn management.
5. Add pagination and server-side CSV/PDF report generation for larger campuses.

## Replicating for another campus

Change the seed roster and mentor allocation in `server/src/seed.js`. The Fellow model stores campus and group fields, and the roster editor supports assignment changes. For a multi-campus deployment, add campus-level authorization and filters before onboarding another campus.
