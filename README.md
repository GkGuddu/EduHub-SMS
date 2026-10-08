# EduHub | School Management System

EduHub is a full-stack school management application built with the MERN stack and TypeScript. It provides separate dashboards for Admin, Teacher, Student, and Parent to manage academic activities, school records, and communication.

**Demo School:** Adiya

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, TypeScript, Tailwind CSS, React Router |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, HTTP-only cookies, bcryptjs |
| Validation | Zod |
| Real-time Communication | Socket.IO |
| UI and Animation | Lucide React, Framer Motion |

## Features

- School registration and OTP verification
- Role-based login and dashboards
- Student, teacher, and parent management
- Classes, sections, subjects, and teacher assignments
- Attendance tracking and summaries
- Fee structures, collection, concessions, and receipts
- Homework assignment, submission, feedback, and grading
- Tests, exams, marks entry, and result publishing
- Student report cards and academic progress
- Timetable management
- Notice board and study materials
- Real-time messaging
- Reports and financial summaries
- Admin-controlled teacher permissions
- Responsive public pages and dashboard layouts

## User Roles

| Role | Access |
| --- | --- |
| Admin | Manages school records, academic setup, fees, reports, and teacher permissions. |
| Teacher | Manages assigned classes and subjects according to permissions granted by Admin. |
| Student | Views personal attendance, assignments, timetable, fees, assessments, and published results. |
| Parent | Views attendance, results, fees, and progress for verified linked children. |

### Teacher Permissions

Admin can grant or revoke access to individual modules and actions, including attendance, homework, exams, marks entry, result publishing, and fee collection.

Permissions are enforced through backend authorization and reflected in the interface.

## Learning Extensions

The following extensions are part of the project scope. Their implementation status should be confirmed before listing them as completed features.

### Subject-wise Quizzes

- Subject selection and filtering
- Minimum 10 unique questions per published quiz
- Multiple Choice, True/False, Fill in the Blank, and Short Answer questions
- Timed attempts, saved answers, and submission history
- Scores and explanations based on review settings
- Teacher grading for answers requiring manual assessment

### AI Homework Hints

- Hints based on the assignment and student's current attempt
- Progressive clues, concept explanations, and suggested next steps
- Teacher controls for enabling hints
- Backend-only AI provider integration
- Usage limits and clear loading and error states
- Local mock mode for development

## Access Control

- School records are scoped by `schoolId`.
- Teachers access only their assigned classes and subjects.
- Students access only their own records.
- Parents access only verified linked children.
- Draft results and answer keys are restricted.
- Protected actions require backend authorization.

## Project Structure

```text
client/     React frontend
server/     Express backend
shared/     Shared TypeScript types and contracts
```

## Local Setup

### 1. Install Dependencies

From the project root:

```bash
npm install
```

### 2. Configure Environment Variables

Create the required `server/.env` and `client/.env` files using the project's environment examples.

Configure the MongoDB connection, authentication secrets, frontend URL, and any email or AI services used by your implementation.

Environment variable names must match the configuration read by the source code. Keep real credentials out of version control.

### 3. Start Development Servers

Using the root development script:

```bash
npm run dev
```

Default local addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

### 4. Optional Demo Data

If the configured seed script is available:

```bash
npm run seed
```

Review the script and target database before running it. Use a development database for demo records.

## Quality Checks

Run the scripts configured in the root `package.json`:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Use `npm run` to list available scripts. A successful build alone does not verify every application workflow.

## Main Workflows

1. Register a school and complete OTP verification.
2. Log in as Admin and configure classes, subjects, and staff.
3. Add students and link parent accounts.
4. Assign teachers and configure their permissions.
5. Manage attendance, homework, fees, and assessments.
6. Publish results for students and parents to view.

## Design

EduHub uses an orange/coral theme, light navigation, white cards, and responsive layouts. Attendance indicators use green for Present, amber for Late, and red for Absent.

## Author

**Guddu Kumar**

- [GitHub](https://github.com/GkGuddu)
- [LinkedIn](https://www.linkedin.com/in/guddukr73)