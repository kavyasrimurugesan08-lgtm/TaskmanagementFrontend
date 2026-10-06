# ApexTask Enterprise | Multi-Company Real-Time Task & Time Management SaaS

ApexTask Enterprise is a production-ready, full-stack, multi-tenant task management, weekly calendar scheduling, employee work tracking, and time management web application.

---

## 🌟 Key Architecture & Capabilities

### 1. Multi-Company Multi-Tenant SaaS
- **Strict Tenant Scoping:** Every database query enforces `company_id` isolation across Tasks, Submissions, Employees, Managers, Departments, Attendance, Notifications, Reports, Settings, and Audit Logs.
- **Pre-seeded Organizations:**
  - **Apex Digital Dynamics:** (Tech enterprise with Engineering, UI/UX Design, QA, Operations).
  - **Vanguard Retail & Media:** (Separate retail enterprise to demonstrate multi-tenant data isolation).

### 2. Role-Based Access Control (RBAC) & Passwordless Employee Links
- **Admin:**
  - Full company workspace management, departments, managers, employees.
  - Create, reschedule (with drag-and-drop on weekly calendar), edit, delete tasks.
  - Review submitted deliverables (Approve or Request Rework).
  - Generate, regenerate, and revoke cryptographically secure employee access link tokens.
  - Audit log stream & Company configuration.
- **Manager:**
  - Scoped supervisor permissions for their authorized employees & departments.
  - Create tasks, view employee weekly schedules, inspect deliverables, download attached files, approve work, request rework with mandatory instructions.
- **Employee (Zero-Password Secure Token Link):**
  - Employees access their portal via unique, cryptographically secure URLs: `/#/employee/<TOKEN>`.
  - No passwords required!
  - Immediate revocation: if an Admin revokes or regenerates a token, previous links stop working immediately.
  - Employee portal displays: Today's tasks, upcoming tasks, submitted tasks, approved tasks, rework alerts.
  - One-click "Start Task" (`Assigned -> In Progress`).
  - "Submit Completed Task" modal with multi-file upload (PDF, Word, Excel, images, camera captures, ZIP).
  - Prominent manager rework instructions when revisions are required.
  - Separate Clock In / Clock Out attendance module with live work duration stopwatch.

### 3. Strict Task Workflow (No Percentage Progress)
Statuses only:
- `Assigned`
- `In Progress`
- `Submitted`
- `Approved`
- `Rework Required`
- `Overdue`
- `Cancelled`

### 4. Interactive Weekly Calendar Tracker
- **Default View:** Week view (Monday - Sunday) with vertical time slots: 8:00 AM, 9:00 AM, 10:00 AM, 11:00 AM, 12:00 PM, 1:00 PM, 2:00 PM, 3:00 PM, 4:00 PM, 5:00 PM, 6:00 PM, 7:00 PM.
- **Drag-and-Drop Rescheduling:** Drag cards to new dates or time slots to update the database immediately.
- **Visual Cards:** Priority indicators, status chips, assignee avatars, and time windows.
- **Day / Week / Month switcher** and date picker.

### 5. Time & Attendance Module
- Independent work time tracking (separate from scheduled task duration).
- Present, Late, Absent, Half Day, Leave status tracking.
- Daily clock-in/out timestamps and work duration calculation.

### 6. Reports & Executive Exports
- Aggregated throughput metrics across departments and personnel.
- One-click exports to **CSV**, **Excel (.xlsx)**, and **PDF (.pdf)**.

### 7. Real-Time Synchronization (WebSockets)
- Room-based Socket.IO notifications for instant updates when tasks are assigned, rescheduled, started, submitted, or reviewed.
- Real-time toast notification system with interactive dismissals.

---

## 🚀 Quick Start & Access Credentials

### Local Ports
- **Backend API & Production Server:** `http://localhost:5000`
- **Vite Dev Server:** `http://localhost:5174` (or `http://localhost:5173`)

### Demo Accounts

| Role | Name | Email | Password | Access Method |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Eleanor Vance | `admin@apex.com` | `password123` | Login Form |
| **Manager** | Sarah Jenkins | `sarah.jenkins@apex.com` | `password123` | Login Form |
| **Manager** | Marcus Vance | `marcus.vance@apex.com` | `password123` | Login Form |
| **Admin (Org 2)** | Julian Ross | `admin@vanguard.com` | `password123` | Login Form (Multi-tenant) |
| **Employee 1** | Alex Rivera | `alex.rivera@apex.com` | *Passwordless* | `/#/employee/token_alex_rivera_apex_98234` |
| **Employee 2** | Elena Rostova | `elena.rostova@apex.com` | *Passwordless* | `/#/employee/token_elena_rostova_apex_47192` |
| **Employee 3** | David Kim | `david.kim@apex.com` | *Passwordless* | `/#/employee/token_david_kim_apex_81729` |
| **Employee 4** | Priya Patel | `priya.patel@apex.com` | *Passwordless* | `/#/employee/token_priya_patel_apex_33451` |

*(Tip: You can also use the **"Switch Role"** dropdown button in the top navigation bar to switch between any persona in one click!)*

---

## 🧪 Automated Test Suite

A complete verification test suite is included in `test_workflow.js`:
```bash
node test_workflow.js
```
Runs 19 automated tests validating logins, passwordless tokens, multi-tenant isolation, calendar rescheduling, task lifecycle, rework loops, approvals, attendance, and search.
