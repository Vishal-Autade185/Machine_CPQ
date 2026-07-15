# Implementation TODO List - ApexConfig

This file outlines the completed and pending implementations for the ApexConfig visual configurator and quoting portal.

---

## Status Key
- 🟢 **Done** (Implemented, tested, and verified)
- 🟡 **In Progress** (Under active development)
- ⚪ **Not Started** (Planned but pending)

---

## 1. Project Initialization & Setup
- [x] 🟢 Root `.gitignore` configuration
- [x] 🟢 Local Git Repository initialization
- [x] 🟢 Link and push initial skeleton to GitHub remote
- [x] 🟢 Initialize Frontend structure (React + Vite)
- [x] 🟢 Initialize Backend structure (Node.js + Express)

## 2. Backend Development (Node.js + Express)
- [x] 🟢 Install dependencies (`express`, `cors`, `dotenv`, `pg`, `multer`, `cloudinary`, `bcryptjs`, `jsonwebtoken`)
- [x] 🟢 Setup environment variables configuration (`.env.example`)
- [x] 🟢 Setup PostgreSQL client pool connection (Supabase)
- [x] 🟢 Implement Auth routes (`POST /api/auth/login`, `POST /api/auth/register`)
- [x] 🟢 Create auth middlewares (`requireAuth`, `requireRole`)
- [x] 🟢 Create health check endpoint `GET /api/health` (For DB ping cron jobs)
- [x] 🟢 Setup Cloudinary upload middleware using `multer`
- [x] 🟢 Implement Customer API routes (`GET /api/customers`, `POST /api/customers` - Auth protected)
- [x] 🟢 Implement Inventory API routes:
  - [x] 🟢 `GET /api/inventory` (Only active parts)
  - [x] 🟢 `GET /api/inventory/all` (Admin view)
  - [x] 🟢 `POST`, `PUT` (Admin only)
  - [x] 🟢 `DELETE /api/inventory/:id` (Soft delete -> `is_active = false`, Admin only)
- [x] 🟢 Implement Machines API routes:
  - [x] 🟢 `GET /api/machines`
  - [x] 🟢 `POST`, `PUT`, `DELETE` (Admin only)
- [x] 🟢 Implement Quotes API routes:
  - [x] 🟢 `GET /api/quotes` (Admin only)
  - [x] 🟢 `POST /api/quotes` (Auth protected)

## 3. Frontend Development (React + Vite)
- [x] 🟢 Set up React Router, AuthContext, and main layout
- [x] 🟢 Implement Login screen and credentials validator
- [x] 🟢 Implement Frontend Route Guards (Redirect non-admins from `/admin`)
- [x] 🟢 Implement Customer Intake & Registration screens (Launchpad tabs)
- [x] 🟢 Implement Machine Catalog selection grid
- [x] 🟢 Implement Interactive Visual Configurator:
  - [x] 🟢 Canvas overlay mapping for absolute percentage hotspot plotting
  - [x] 🟢 Pulsing red/grey hotspots matching dynamic states
  - [x] 🟢 Floating selection popovers linked to active coordinate nodes
  - [x] 🟢 Sidebar calculation board reflecting totals in real-time
- [x] 🟢 Implement Quote Preview overlay with print/A4 styles
- [x] 🟢 Implement Control Center (Admin dashboard):
  - [x] 🟢 Inventory CRUD tables (including soft delete toggle)
  - [x] 🟢 Image Mapping Studio: Click-to-add hotspots & define dropdown mappings
  - [x] 🟢 Pipeline summary cards & Quote History log

## 4. Verification & Deployment
- [ ] ⚪ E2E manual and automated checkouts
- [ ] ⚪ RBAC validation check: Verify employee cannot modify inventory
- [ ] ⚪ Soft delete verification: Ensure deleted parts don't break existing machines
- [ ] ⚪ Cloudinary file upload verification
- [ ] ⚪ Database latency and health checks
- [x] 🟢 Final push and build validation
