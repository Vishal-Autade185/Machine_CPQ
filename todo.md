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
- [ ] ⚪ Install dependencies (`express`, `cors`, `dotenv`, `pg`, `multer`, `cloudinary`, `bcryptjs`, `jsonwebtoken`)
- [ ] ⚪ Setup environment variables configuration (`.env.example`)
- [ ] ⚪ Setup PostgreSQL client pool connection (Supabase)
- [ ] ⚪ Implement Auth routes (`POST /api/auth/login`, `POST /api/auth/register`)
- [ ] ⚪ Create auth middlewares (`requireAuth`, `requireRole`)
- [ ] ⚪ Create health check endpoint `GET /api/health` (For DB ping cron jobs)
- [ ] ⚪ Setup Cloudinary upload middleware using `multer`
- [ ] ⚪ Implement Customer API routes (`GET /api/customers`, `POST /api/customers` - Auth protected)
- [ ] ⚪ Implement Inventory API routes:
  - [ ] ⚪ `GET /api/inventory` (Only active parts)
  - [ ] ⚪ `GET /api/inventory/all` (Admin view)
  - [ ] ⚪ `POST`, `PUT` (Admin only)
  - [ ] ⚪ `DELETE /api/inventory/:id` (Soft delete -> `is_active = false`, Admin only)
- [ ] ⚪ Implement Machines API routes:
  - [ ] ⚪ `GET /api/machines`
  - [ ] ⚪ `POST`, `PUT`, `DELETE` (Admin only)
- [ ] ⚪ Implement Quotes API routes:
  - [ ] ⚪ `GET /api/quotes` (Admin only)
  - [ ] ⚪ `POST /api/quotes` (Auth protected)

## 3. Frontend Development (React + Vite)
- [ ] ⚪ Set up React Router, AuthContext, and main layout
- [ ] ⚪ Implement Login screen and credentials validator
- [ ] ⚪ Implement Frontend Route Guards (Redirect non-admins from `/admin`)
- [ ] ⚪ Implement Customer Intake & Registration screens (Launchpad tabs)
- [ ] ⚪ Implement Machine Catalog selection grid
- [ ] ⚪ Implement Interactive Visual Configurator:
  - [ ] ⚪ Canvas overlay mapping for absolute percentage hotspot plotting
  - [ ] ⚪ Pulsing red/grey hotspots matching dynamic states
  - [ ] ⚪ Floating selection popovers linked to active coordinate nodes
  - [ ] ⚪ Sidebar calculation board reflecting totals in real-time
- [ ] ⚪ Implement Quote Preview overlay with print/A4 styles
- [ ] ⚪ Implement Control Center (Admin dashboard):
  - [ ] ⚪ Inventory CRUD tables (including soft delete toggle)
  - [ ] ⚪ Image Mapping Studio: Click-to-add hotspots & define dropdown mappings
  - [ ] ⚪ Pipeline summary cards & Quote History log

## 4. Verification & Deployment
- [ ] ⚪ E2E manual and automated checkouts
- [ ] ⚪ RBAC validation check: Verify employee cannot modify inventory
- [ ] ⚪ Soft delete verification: Ensure deleted parts don't break existing machines
- [ ] ⚪ Cloudinary file upload verification
- [ ] ⚪ Database latency and health checks
- [ ] ⚪ Final push and build validation
