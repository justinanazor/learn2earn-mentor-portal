# Learn2Earn Mentor Portal (MERN)

A MERN-stack application for managing Group A and Group B fellow records, group-based mentor access, daily monitoring, project progress, structured assessments, weekly reviews, follow-up actions and KPI visibility.

## Current seed roster

- 43 Group B fellows are seeded from the supplied list.
- Justin is assigned 22 fellows.
- Valentine is assigned 21 fellows.
- 45 Group A fellows are seeded from the supplied list.
- Moses is assigned 23 fellows and Wisdom is assigned 22.
- The Group A split alternates through the supplied roster because individual mentor assignments were not provided. Administrators can change assignments in the Fellow Register.
- Mentors are assigned to one or more groups by an administrator. A mentor can see fellows and records from their assigned groups; administrators can switch groups in the roster and record pages.
- Adding fellows is restricted to administrators.

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

Edit `server/.env` and set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, and a unique `ADMIN_PASSWORD` of at least 12 characters. These values are required; do not commit `.env`.

### 2. Install dependencies and seed the database

```bash
npm install
npm run seed
```

The seed command creates an administrator, four mentor accounts and both group rosters. Run it against the same `MONGODB_URI` used by the API after adding or changing the seed roster; starting the API alone does not insert the roster. The administrator password is read from `.env`. Mentor passwords are generated randomly and are not printed or displayed; sign in as the administrator and set unique passwords for mentor accounts in User Management before sharing access.

The seed command sets the administrator password from `ADMIN_PASSWORD` each time it runs. Existing mentor accounts keep their current passwords when seeding; reset any previously seeded development passwords before deployment. Mentor accounts are scoped to their assigned groups in the API. The administrator account can access both groups and manage mentor group assignments.

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

- **Dashboard:** group-aware roster size, mentor allocation, standing counts, inactive LMS count, blocked projects, open actions and recent assessments.
- **My profile:** update your name and email, and change your password after verifying the current password.
- **User management (administrators):** create mentor or administrator accounts, assign mentor groups, edit roles, deactivate/reactivate accounts, delete accounts with assignment safeguards, and reset credentials. New and reset passwords must be at least 12 characters.
- **Mentor progress (administrators):** compare each mentor’s active roster, fellow standing, project outcomes, reporting activity, assessment scores and open actions.
- **Fellow Register:** administrators can create fellows individually or import a CSV with `Fellow name` and `Assigned mentor` columns; other fellow fields and the `Group` column are optional. Users can edit, archive, search, filter, assign mentors within a group and export CSV. Group selection is restricted to the signed-in mentor's assigned groups.
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
Mentor accounts store their assigned groups. Fellow mentor assignments use the name of an active mentor account assigned to the same group.

## API overview

- `POST /api/auth/login`
- `GET|PATCH /api/auth/me`
- `GET /api/auth/mentors`
- `GET /api/dashboard`
- `GET|POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/mentor-progress`
- `GET|POST /api/fellows` (fellow creation is administrator-only; group filters are access-checked)
- `GET|PATCH|DELETE /api/fellows/:id`
- `GET /api/fellows/:id/history`
- `GET|POST|PATCH|DELETE /api/records/daily`
- `GET|POST|PATCH|DELETE /api/records/assessments`
- `GET|POST|PATCH|DELETE /api/records/weekly`
- `GET|POST|PATCH|DELETE /api/records/actions`

All endpoints other than login and health check require a JWT bearer token.

## Before production deployment

1. Replace all development passwords and use a strong random JWT secret.
2. Add email-based account invitations and audit history.
3. Configure HTTPS, production CORS origins, MongoDB backups and deployment secrets.
4. Confirm the official assessment framework, reporting fields and data retention policy with Learn2Earn management.
5. Add pagination and server-side CSV/PDF report generation for larger campuses.

## Replicating for another campus

Change the seed roster and mentor allocation in `server/src/seed.js`. The Fellow model stores campus and group fields, and the roster editor supports assignment changes. For a multi-campus deployment, add campus-level authorization and filters before onboarding another campus.
