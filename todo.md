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

## 2. Backend Development
- [ ] ⚪ Install dependencies (`express`, `cors`, `dotenv`, `pg`, `multer`, `cloudinary`)
- [ ] ⚪ Setup environment variables configuration (`.env.example`)
- [ ] ⚪ Setup PostgreSQL client pool connection (Supabase)
- [ ] ⚪ Create health check endpoint `GET /api/health` (For DB ping cron jobs)
- [ ] ⚪ Setup Cloudinary upload middleware using `multer`
- [ ] ⚪ Implement Customer API routes (`GET /api/customers`, `POST /api/customers`)
- [ ] ⚪ Implement Inventory API routes (`GET`, `POST`, `PUT`, `DELETE` on `/api/inventory`)
- [ ] ⚪ Implement Machines API routes (`GET`, `POST`, `PUT`, `DELETE` on `/api/machines`)
- [ ] ⚪ Implement Quotes API routes (`GET`, `POST` on `/api/quotes`)

## 3. Frontend Development (React + Vite)
- [ ] ⚪ Set up React Router and main layout
- [ ] ⚪ Implement UI state store (Active session, active customer, machine configurations)
- [ ] ⚪ Implement Customer Intake & Registration screens (Launchpad tabs)
- [ ] ⚪ Implement Machine Catalog selection grid
- [ ] ⚪ Implement Interactive Visual Configurator:
  - [ ] ⚪ Canvas overlay mapping for absolute percentage hotspot plotting
  - [ ] ⚪ Pulsing red/grey hotspots matching dynamic states
  - [ ] ⚪ Floating selection popovers linked to active coordinate nodes
  - [ ] ⚪ Sidebar calculation board reflecting totals in real-time
- [ ] ⚪ Implement Quote Preview overlay with print/A4 styles
- [ ] ⚪ Implement Control Center (Admin dashboard):
  - [ ] ⚪ Inventory CRUD tables
  - [ ] ⚪ Image Mapping Studio: Click-to-add hotspots & define dropdown mappings
  - [ ] ⚪ Pipeline summary cards & Quote History log

## 4. Verification & Deployment
- [ ] ⚪ E2E manual and automated checkouts
- [ ] ⚪ Validation check: Guardrail blocking quote generation until all mandatory parts turn green
- [ ] ⚪ Cloudinary file upload verification
- [ ] ⚪ Database latency and health checks
- [ ] ⚪ Final push and build validation
