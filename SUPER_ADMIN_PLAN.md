# DocqFlow - Bug Report & Super Admin Architecture Plan

## Super Admin Credentials

| Field    | Value                         |
|----------|-------------------------------|
| Email    | `superadmin@docqflow.com`     |
| Password | `DocqFlow@Super2026!`         |
| Role     | `super_admin`                 |
| Login    | Use the standard `/auth` page |

> After running the migration (`migrations/001_super_admin.sql`), log in at `/auth` with the above credentials.
> You will be automatically redirected to the **Super Admin Panel** at `/admin`.

---

## Table of Contents
1. [Current System Architecture](#current-system-architecture)
2. [Bugs & Issues Identified](#bugs--issues-identified)
3. [Super Admin Architecture Plan](#super-admin-architecture-plan)

---

## Current System Architecture

### Tech Stack
```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  React 18 + TypeScript + Vite                           │
│  UI: shadcn/ui + Tailwind CSS + Radix UI               │
│  Routing: React Router v6                               │
│  State: React Context (Auth, AppSettings)               │
│  HTTP: Native fetch (via lib/api.ts)                    │
│  Mobile: Capacitor (Android - client-only app)          │
└─────────────────┬───────────────────────────────────────┘
                  │ REST API (JSON)
┌─────────────────▼───────────────────────────────────────┐
│                      BACKEND                            │
│  Plain PHP (no framework)                               │
│  Auth: Custom JWT (HS256, helpers/jwt.php)              │
│  DB: PDO (MySQL/MariaDB)                                │
│  Email: Custom SMTP (helpers/email.php)                 │
│  File Upload: Local filesystem (uploads/)               │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                     DATABASE                            │
│  MariaDB 10.4 (MySQL-compatible)                        │
│  UUID primary keys (varchar(36))                        │
│  InnoDB with foreign keys                               │
└─────────────────────────────────────────────────────────┘
```

### Current Role Hierarchy
```
┌──────────┐
│   Firm   │  ← Self-registers, owns one firm
│  Owner   │  ← Manages accountants, clients, settings
└────┬─────┘
     │ invites & manages
     ▼
┌────────────┐     ┌──────────┐
│ Accountant │────▶│  Client  │  ← Invited by firm
│            │     │          │  ← Uploads documents
└────────────┘     └──────────┘
  Reviews docs       Responds to
  Sends clarif.      clarifications
```

### Database Schema (Entity Relationships)
```
users ──────┬──── user_roles (firm | accountant | client)
            │
            ├──── firms (owner_id → users.id)
            │       │
            │       ├──── firm_accountants (firm_id, accountant_id)
            │       │
            │       ├──── clients (firm_id, user_id, assigned_accountant_id)
            │       │       │
            │       │       ├──── companies (client_id)
            │       │       │
            │       │       └──── documents (client_id, company_id)
            │       │               │
            │       │               ├──── chat_messages (document_id)
            │       │               ├──── chat_participants (document_id)
            │       │               └──── notifications (document_id)
            │       │
            │       ├──── invite_tokens (firm_id)
            │       ├──── app_settings (firm_id)
            │       └──── reminders (firm_id)
            │
            ├──── sessions (user_id, token)
            └──── password_reset_tokens (user_id)
```

### API Endpoint Map
```
/api/auth/
  ├── signup.php      POST   - Register new user (firm self-register)
  ├── login.php       POST   - Sign in
  ├── logout.php      POST   - Sign out
  ├── session.php     GET    - Get current session
  ├── forgot-password.php  POST  - Request password reset
  ├── reset-password.php   POST  - Reset password with token
  └── check-token.php      GET   - Validate reset token

/api/firms/         GET/POST        - Get/create firm
/api/clients/       GET/POST/PUT    - Manage clients
/api/clients/assigned.php  GET      - Get assigned clients (accountant)
/api/accountants/   GET/POST        - Manage accountants
/api/documents/     GET/POST/PUT    - Manage documents
/api/documents/assigned.php GET     - Get assigned docs (accountant)
/api/companies/     GET/POST/DELETE - Manage companies
/api/invites/       GET/POST/PUT    - Manage invite tokens
/api/notifications/ GET/POST/PUT    - Manage notifications
/api/reminders/     GET/POST/DELETE - Manage reminders
/api/reminders/process.php GET      - Process due reminders
/api/clarifications/ GET/POST       - Clarification messages
/api/upload/        POST            - File upload
/api/settings/      GET/POST        - App settings (per-firm)
```

---

## Bugs & Issues Identified

### BUG 1: TypeScript Type Error - Missing `isNotification` Property
**Severity:** Medium (TypeScript compilation warning)
**Files:**
- `src/components/dashboard/DashboardLayout.tsx` (lines 21-25, 116)
- `src/components/dashboard/AccountantDashboard.tsx` (line 47)

**Problem:** The `NavItem` interface does not include `isNotification`, but it's used in the AccountantDashboard nav items and accessed in DashboardLayout:

```typescript
// DashboardLayout.tsx - Interface missing isNotification
interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  // ❌ Missing: isNotification?: boolean;
}

// AccountantDashboard.tsx - Uses isNotification
{ icon: Bell, label: "Notifications", href: "/dashboard/notifications", isNotification: true }

// DashboardLayout.tsx line 116 - Accesses it
{item.isNotification && unreadCount > 0 && ( ... )}
```

**Fix:** Add `isNotification?: boolean` to the `NavItem` interface.

---

### BUG 2: CORS Completely Disabled in Production
**Severity:** HIGH (Security Vulnerability)
**File:** `config/cors.php` (line 10)

**Problem:** The CORS check is bypassed with `|| true`:
```php
if (in_array($origin, ALLOWED_ORIGINS) || true) { // true for development
    header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
}
```
This means ANY website can make authenticated requests to your API. Combined with `Access-Control-Allow-Credentials: true`, this is a serious security risk - any malicious site could steal user data.

**Fix:** Remove `|| true` and properly validate origins.

---

### BUG 3: Exposed SMTP Credentials in `.env.example`
**Severity:** HIGH (Security - Credential Leak)
**File:** `.env.example` (line 48)

**Problem:** Real Gmail App Password is committed to git:
```
SMTP_PASS=efso ukcp lgeb pdxj
```
Anyone with access to this repo can send emails from your account or use it for spam.

**Fix:** Replace with placeholder: `SMTP_PASS=your-smtp-password-here`

---

### BUG 4: Signup Endpoint Allows Arbitrary Role Assignment
**Severity:** HIGH (Security - Privilege Escalation)
**File:** `api/auth/signup.php` (lines 39-43)

**Problem:** The signup endpoint accepts any role from the request body:
```php
$role = $input['role'] ?? 'client';

if (!in_array($role, ['firm', 'accountant', 'client'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid role']);
    exit;
}
```
While the frontend only sends `role=firm` for self-registration, anyone can POST directly:
```bash
curl -X POST /api/auth/signup.php \
  -d '{"email":"attacker@evil.com","password":"123456","role":"accountant"}'
```
This creates an accountant user without an invite, bypassing the firm's control.

**Fix:** Only allow `role=firm` for self-registration. Accountant/client creation should require a valid invite token.

---

### BUG 5: No Authorization on Data Endpoints (IDOR Vulnerability)
**Severity:** HIGH (Security - Insecure Direct Object Reference)
**Files:**
- `api/clients/index.php` (lines 23-31)
- `api/invites/index.php` (lines 57-76)
- Multiple other endpoints

**Problem:** Any authenticated user can access any firm's data by passing a `firm_id`:
```php
// api/clients/index.php - No ownership check
if ($firmId) {
    $stmt = $db->prepare("
        SELECT c.*, u.email, u.full_name, u.phone
        FROM clients c
        JOIN users u ON c.user_id = u.id
        WHERE c.firm_id = ?
    ");
    $stmt->execute([$firmId]);  // ❌ No check: does this user own this firm?
}
```

Similarly, the invites POST endpoint lets any authenticated user create invites for any firm:
```php
// api/invites/index.php - No firm ownership verification
$stmt->execute([
    $inviteId, $token,
    $input['firm_id'],    // ❌ User could pass any firm_id
    $input['email'],
    $input['role'],
    $user['user_id'],
    $expiresAt
]);
```

**Fix:** Add ownership/membership verification on every endpoint that accepts `firm_id`.

---

### BUG 6: Duplicate Guard Check in FirmDashboard
**Severity:** Low (Code Smell)
**File:** `src/components/dashboard/FirmDashboard.tsx` (lines 214, 245)

**Problem:** `firmId` is checked twice in `handleInvite`:
```typescript
const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmId) { ... return; }  // Line 214 - First check
    // ... email validation ...
    if (!user) return;
    if (!firmId) { ... return; }  // Line 245 - Duplicate check (unreachable)
```

**Fix:** Remove the second duplicate check.

---

### BUG 7: Console.log Pollution in Production
**Severity:** Low (Code Quality)
**File:** `src/components/dashboard/DashboardLayout.tsx` (line 99)

**Problem:** Debug logging on every render cycle:
```typescript
navItems.map((item, index) => {
    console.log(`[DashboardLayout][${title}] Rendering nav item:`, index, item.label, item.href);
```
This runs on every re-render for every nav item, polluting the browser console.

**Fix:** Remove the console.log or wrap in `if (import.meta.env.DEV)`.

---

### BUG 8: Sessions Never Invalidated or Cleaned
**Severity:** Medium (Security + Performance)
**Files:**
- `helpers/jwt.php` (lines 28-49)
- `api/auth/login.php` (lines 84-88)

**Problem:** The JWT verification (`verifyJWT`) only checks signature + expiry. It does NOT check the `sessions` table. This means:
1. Logging out doesn't actually invalidate the token (it just deletes from localStorage)
2. The `sessions` table grows unbounded (no cleanup of expired sessions)
3. A stolen token works until its natural expiry even after the user "logs out"

```php
// verifyJWT only checks signature + timestamp, NOT sessions table
function verifyJWT($token) {
    // ... signature check ...
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return false;
    }
    return $payload;  // ❌ Never checks if session was revoked
}
```

**Fix:** Add session table validation in `verifyJWT` or `getAuthUser`, and add a cron job or cleanup mechanism.

---

### BUG 9: Real User Data Committed to Git
**Severity:** HIGH (Data Privacy / Compliance Risk)
**File:** `database.sql`

**Problem:** The SQL dump contains:
- Real email addresses (harrisagar@ontomatrix.com, lemonappservice@gmail.com, etc.)
- Bcrypt password hashes (can be brute-forced offline)
- Active JWT session tokens
- Invite tokens
- Chat messages

This violates data privacy best practices and potentially GDPR/regulations.

**Fix:** Either remove `database.sql` from git, or replace with a schema-only dump (no data) plus seed data with fake emails.

---

### BUG 10: MySQL Timezone Configuration May Fail
**Severity:** Low (Potential Runtime Error)
**File:** `config/database.php` (lines 113-115)

**Problem:**
```php
$timezone = defined('TIMEZONE') ? TIMEZONE : '+00:00';
$this->connection->exec("SET time_zone = '" . $timezone . "'");
```
The env sets `TIMEZONE=Asia/Colombo`. MySQL only supports named timezones (like `Asia/Colombo`) if the `mysql.time_zone_name` table has been populated via `mysql_tzinfo_to_sql`. Many MySQL/MariaDB installations don't have this by default, causing a silent failure or error.

**Fix:** Use UTC offset format (`+05:30` for Asia/Colombo) as fallback, or handle the error gracefully.

---

## Super Admin Architecture Plan

### New Role Hierarchy
```
┌────────────────┐
│  SUPER ADMIN   │  ← Platform owner (you)
│  (new role)    │  ← Manages ALL firms, users, platform settings
└───────┬────────┘
        │ manages all
        ▼
┌──────────┐
│   Firm   │  ← Self-registers, owns one firm
│  Owner   │  ← Manages their accountants, clients, settings
└────┬─────┘
     │ invites & manages
     ▼
┌────────────┐     ┌──────────┐
│ Accountant │────▶│  Client  │
└────────────┘     └──────────┘
```

### Database Changes

#### 1. Update `user_roles` enum to include `super_admin`
```sql
ALTER TABLE user_roles
  MODIFY COLUMN role ENUM('super_admin', 'firm', 'accountant', 'client') NOT NULL;
```

#### 2. New table: `platform_settings` (global, not per-firm)
```sql
CREATE TABLE platform_settings (
  id VARCHAR(36) PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type ENUM('string','text','json','boolean','number') DEFAULT 'string',
  category VARCHAR(50) DEFAULT 'general',
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);
```

#### 3. New table: `firms` additions (status tracking)
```sql
ALTER TABLE firms
  ADD COLUMN status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
  ADD COLUMN suspended_at TIMESTAMP NULL,
  ADD COLUMN suspended_by VARCHAR(36) NULL,
  ADD COLUMN max_clients INT DEFAULT NULL,
  ADD COLUMN max_accountants INT DEFAULT NULL,
  ADD COLUMN max_storage_mb INT DEFAULT NULL,
  ADD COLUMN plan VARCHAR(50) DEFAULT 'free',
  ADD COLUMN notes TEXT NULL;
```

#### 4. New table: `audit_logs`
```sql
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),       -- 'firm', 'user', 'document', 'setting'
  entity_id VARCHAR(36),
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

#### 5. Seed the Super Admin user
```sql
-- Create super admin user (password will be set via setup script)
INSERT INTO users (id, email, password_hash, full_name, email_verified_at)
VALUES (UUID(), 'admin@docqflow.com', '<bcrypt_hash>', 'Super Admin', NOW());

INSERT INTO user_roles (id, user_id, role)
VALUES (UUID(), '<super_admin_user_id>', 'super_admin');
```

### Backend API Architecture

#### New Super Admin API Endpoints
```
/api/admin/
  ├── dashboard.php     GET     - Platform-wide statistics
  ├── firms/
  │   ├── index.php     GET     - List all firms (with filters, pagination)
  │   ├── index.php     POST    - Create firm on behalf of user
  │   ├── index.php     PUT     - Update firm (suspend, change plan, etc.)
  │   └── index.php     DELETE  - Delete firm and all associated data
  ├── users/
  │   ├── index.php     GET     - List all users (with filters, pagination)
  │   ├── index.php     PUT     - Update user (reset password, change role, ban)
  │   └── index.php     DELETE  - Delete user
  ├── settings/
  │   ├── index.php     GET     - Get platform settings
  │   └── index.php     POST    - Update platform settings
  └── audit/
      └── index.php     GET     - View audit logs
```

#### Authorization Middleware
```
┌──────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                               │
│                                                              │
│  Request ──▶ CORS ──▶ JWT Verify ──▶ Role Check ──▶ Handler │
│                                         │                    │
│                              ┌──────────┴──────────┐        │
│                              │                     │         │
│                        super_admin?           firm/acct?     │
│                              │                     │         │
│                         Allow all            Check firm      │
│                         admin APIs           ownership       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

New helper function:
```php
// helpers/jwt.php - New function
function requireSuperAdmin() {
    $user = requireAuth();
    if (!isset($user['role']) || $user['role'] !== 'super_admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Super Admin access required']);
        exit;
    }
    return $user;
}
```

### Frontend Architecture

#### New Routes
```
/admin                → Super Admin Login (separate from /auth)
/admin/dashboard      → Platform overview stats
/admin/firms          → Firm management table
/admin/firms/:id      → Individual firm detail/edit
/admin/users          → User management table
/admin/settings       → Platform-wide settings
/admin/audit          → Audit log viewer
```

#### Component Structure
```
src/
├── pages/
│   ├── admin/
│   │   ├── AdminLogin.tsx          ← Separate login page
│   │   └── AdminDashboard.tsx      ← Main admin page (routes internally)
│   └── ... (existing pages)
│
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx         ← Admin sidebar + header layout
│   │   ├── AdminOverview.tsx       ← Platform stats cards + charts
│   │   ├── AdminFirmsPage.tsx      ← Firms table with CRUD
│   │   ├── AdminFirmDetail.tsx     ← Single firm view (users, docs, settings)
│   │   ├── AdminUsersPage.tsx      ← All users table with filters
│   │   ├── AdminSettingsPage.tsx   ← Platform settings management
│   │   └── AdminAuditPage.tsx      ← Audit log table with filters
│   └── ... (existing components)
│
├── contexts/
│   └── AuthContext.tsx              ← Updated: add 'super_admin' to UserRole
│
└── lib/
    └── api.ts                      ← Updated: add adminApi section
```

#### Auth Flow for Super Admin
```
┌──────────┐     ┌──────────────┐     ┌───────────────┐
│  /admin   │────▶│ AdminLogin   │────▶│ POST          │
│  (route)  │     │ (email+pass) │     │ /api/auth/    │
│           │     │              │     │ login.php     │
└──────────┘     └──────┬───────┘     └───────┬───────┘
                        │                     │
                        │     role=super_admin │
                        │◀────────────────────┘
                        │
                        ▼
               ┌────────────────┐
               │ /admin/        │
               │ dashboard      │  ← AdminDashboard component
               │ (protected)    │  ← Checks userRole === 'super_admin'
               └────────────────┘
```

#### Updated `AuthContext.tsx` Types
```typescript
// Before
type UserRole = "firm" | "accountant" | "client" | null;

// After
type UserRole = "super_admin" | "firm" | "accountant" | "client" | null;
```

#### Updated `Dashboard.tsx` Routing
```typescript
switch (userRole) {
  case "super_admin":
    return <Navigate to="/admin/dashboard" replace />;  // New
  case "firm":
    return <FirmDashboard />;
  case "accountant":
    return <AccountantDashboard />;
  case "client":
    return <ClientDashboard />;
  default:
    return null;
}
```

### Super Admin Dashboard - Feature Breakdown

#### 1. Platform Overview Page
```
┌─────────────────────────────────────────────────────────┐
│  Super Admin Dashboard                                   │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│  Total   │  Total   │  Total   │  Total   │  Storage    │
│  Firms   │  Users   │  Docs    │  Active  │  Used       │
│    5     │    32    │   147    │ Sessions │  2.3 GB     │
│          │          │          │    12    │             │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│                                                          │
│  Recent Activity        │  Firms by Plan                 │
│  ┌────────────────┐     │  ┌─────────────────┐          │
│  │ User X logged  │     │  │ Free: 3         │          │
│  │ Firm Y created │     │  │ Pro: 1          │          │
│  │ Doc Z uploaded │     │  │ Enterprise: 1   │          │
│  └────────────────┘     │  └─────────────────┘          │
└─────────────────────────┴────────────────────────────────┘
```

#### 2. Firms Management Page
```
┌─────────────────────────────────────────────────────────┐
│  Firms Management                          [+ Add Firm] │
├─────────────────────────────────────────────────────────┤
│  Search: [____________]  Status: [All ▼]  Plan: [All ▼] │
├──────┬─────────┬──────────┬────────┬───────┬────────────┤
│ Name │  Owner  │ Clients  │  Plan  │Status │  Actions   │
├──────┼─────────┼──────────┼────────┼───────┼────────────┤
│ ABC  │ john@.. │   12     │  Pro   │Active │ [Edit][Sus]│
│ XYZ  │ jane@.. │    3     │  Free  │Active │ [Edit][Sus]│
│ DEF  │ bob@..  │    0     │  Free  │Susp.  │ [Edit][Act]│
└──────┴─────────┴──────────┴────────┴───────┴────────────┘
```

#### 3. Users Management Page
```
┌─────────────────────────────────────────────────────────┐
│  Users Management                                        │
├─────────────────────────────────────────────────────────┤
│  Search: [____________]  Role: [All ▼]  Firm: [All ▼]   │
├──────────┬──────────┬──────┬───────────┬────────────────┤
│  Name    │  Email   │ Role │   Firm    │    Actions     │
├──────────┼──────────┼──────┼───────────┼────────────────┤
│ John     │ john@..  │ firm │ ABC Firm  │ [Edit][Reset]  │
│ Jane     │ jane@..  │ acct │ ABC Firm  │ [Edit][Reset]  │
│ Bob      │ bob@..   │ clnt │ ABC Firm  │ [Edit][Reset]  │
└──────────┴──────────┴──────┴───────────┴────────────────┘
```

#### 4. Platform Settings Page
```
┌─────────────────────────────────────────────────────────┐
│  Platform Settings                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  General                                                 │
│  ├── Platform Name: [DocqFlow        ]                   │
│  ├── Support Email: [support@docq..]                     │
│  └── Default Theme: [Navy ▼]                             │
│                                                          │
│  Limits (Defaults for new firms)                         │
│  ├── Max Clients per Firm: [50       ]                   │
│  ├── Max Accountants per Firm: [10   ]                   │
│  └── Max Storage per Firm (MB): [5000]                   │
│                                                          │
│  Email / SMTP                                            │
│  ├── SMTP Host: [smtp.gmail.com      ]                   │
│  ├── SMTP Port: [587                 ]                   │
│  └── From Name: [DocqFlow            ]                   │
│                                                          │
│                                    [Save Settings]       │
└─────────────────────────────────────────────────────────┘
```

### Implementation Order

```
Phase 1: Foundation (Backend)
  ├── 1.1 Database migration (new role, tables, columns)
  ├── 1.2 requireSuperAdmin() middleware
  ├── 1.3 Admin dashboard API (stats)
  ├── 1.4 Admin firms CRUD API
  ├── 1.5 Admin users CRUD API
  └── 1.6 Admin platform settings API

Phase 2: Frontend Admin Dashboard
  ├── 2.1 AdminLayout component (sidebar, header)
  ├── 2.2 AdminLogin page (or reuse /auth with redirect)
  ├── 2.3 AdminOverview page (stats + charts)
  ├── 2.4 AdminFirmsPage (table + CRUD dialogs)
  ├── 2.5 AdminUsersPage (table + edit/reset dialogs)
  ├── 2.6 AdminSettingsPage (platform config form)
  └── 2.7 Route protection + AuthContext updates

Phase 3: Bug Fixes & Hardening
  ├── 3.1 Fix CORS (remove || true)
  ├── 3.2 Fix signup role escalation
  ├── 3.3 Fix IDOR on all endpoints
  ├── 3.4 Fix TypeScript NavItem type
  ├── 3.5 Remove exposed credentials
  ├── 3.6 Add session invalidation
  ├── 3.7 Remove console.logs
  └── 3.8 Add audit logging

Phase 4: Polish
  ├── 4.1 Firm suspension/activation flow
  ├── 4.2 Audit log viewer
  ├── 4.3 Plan/quota enforcement
  └── 4.4 Super Admin seed script
```

### File Changes Summary

| Area | Files to Create | Files to Modify |
|------|----------------|-----------------|
| Database | `migrations/001_super_admin.sql` | - |
| Backend API | `api/admin/dashboard.php`, `api/admin/firms/index.php`, `api/admin/users/index.php`, `api/admin/settings/index.php`, `api/admin/audit/index.php` | `helpers/jwt.php`, `config/cors.php`, `api/auth/signup.php`, `api/clients/index.php`, `api/invites/index.php` |
| Frontend Pages | `src/pages/admin/AdminDashboard.tsx` | `src/App.tsx`, `src/pages/Dashboard.tsx` |
| Frontend Components | `src/components/admin/AdminLayout.tsx`, `src/components/admin/AdminOverview.tsx`, `src/components/admin/AdminFirmsPage.tsx`, `src/components/admin/AdminUsersPage.tsx`, `src/components/admin/AdminSettingsPage.tsx`, `src/components/admin/AdminAuditPage.tsx` | `src/contexts/AuthContext.tsx`, `src/lib/api.ts` |
| Config | - | `.env.example`, `src/components/dashboard/DashboardLayout.tsx` |
