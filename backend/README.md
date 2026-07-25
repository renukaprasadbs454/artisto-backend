# Artisto Backend API

Node.js / Express / Prisma / PostgreSQL backend powering the Artisto recruitment & creative talent platform.

## Server Details
- **Base URL**: `http://localhost:4000/api/v1`
- **Port**: `4000` (configured via `PORT` environment variable)
- **Environment**: Express + TypeScript + Prisma ORM + Socket.IO

---

## 🔒 Backend-Only Admin Administration

Per security architecture requirements, the Admin panel is **NOT accessible from the frontend UI**. Admin operations are strictly restricted to protected backend API routes accessible only by authenticated users holding the `ADMIN` role.

### Admin Authentication & Authorization
1. **Authentication**: All admin endpoints require a valid JWT Bearer Access Token in the `Authorization` header (`Authorization: Bearer <access_token>`).
2. **Role Check**: Admin routes are protected with `requireRole('ADMIN')` middleware. Non-admin users attempting to access these routes receive `403 Forbidden`.

### Admin Routes & Wiring (`/api/v1/admin`)

The admin routes are wired in [app.ts](file:///d:/artisto/backend/src/app.ts) via `router.use('/admin', adminRoutes)`:

| Method | Endpoint | Description | Auth Requirement |
|--------|----------|-------------|------------------|
| `GET` | `/api/v1/admin/stats` | System overview statistics (user count, orders, listings, revenue) | `requireAuth` + `requireRole('ADMIN')` |
| `PATCH` | `/api/v1/admin/users/:userId/suspend` | Suspend or unsuspend a user account | `requireAuth` + `requireRole('ADMIN')` |
| `GET` | `/api/v1/admin/tables/:tableName` | Inspect database table records with pagination | `requireAuth` + `requireRole('ADMIN')` |
| `DELETE` | `/api/v1/admin/tables/:tableName/:id` | Delete a specific database record by ID | `requireAuth` + `requireRole('ADMIN')` |

### How to Access Admin Functionality Programmatically
Admin actions can be performed via standard HTTP clients (Postman, cURL, or server-side scripts) by authenticating as an `ADMIN` user:

```bash
# 1. Login as Admin
POST http://localhost:4000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@artisto.com",
  "password": "AdminPassword123"
}

# 2. Access Admin Endpoints using returned accessToken
GET http://localhost:4000/api/v1/admin/stats
Authorization: Bearer <admin_access_token>
```
