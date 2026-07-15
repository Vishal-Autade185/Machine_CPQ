# Project Context & Change Log - ApexConfig

This file logs all architectural decisions, actions taken, and changes made to the project.

## Current Project Status
- **Initial Setup**: Completed.
- **Git Repository**: Initialized and linked to [Vishal-Autade185/Machine_CPQ](https://github.com/Vishal-Autade185/Machine_CPQ).
- **Project Structure**: Created `frontend/` (Vite + React) and `backend/` (Node.js + Express) directory skeletons.

## Change Log

### [2026-07-15] Initial Repository and Skeleton Setup
- Created and committed root `.gitignore` to prevent tracking of `node_modules` and local environment files.
- Initialized local git repository, committed initial files, and pushed to remote main branch on GitHub.
- Created `frontend/` subdirectory containing Vite + React base template.
- Updated implementation plan to incorporate Authentication & RBAC (JWT + roles) and Referential Integrity via soft deletes on inventory.

### [2026-07-15] Backend API & Security Layer Implementation
- Installed Express server, node-postgres, JWT, bcryptjs, Multer, and Cloudinary dependencies.
- Created `db/index.js` PG Pool connection to manage PostgreSQL querying on Supabase.
- Implemented JWT authentication and role checking middleware (`requireAuth`, `requireRole`) to lock down endpoints.
- Developed Auth endpoints (Login, Bootstrap Registration) and keep-alive health checks.
- Created Customer intake, Inventory CRUD (with soft deletes), Machine layouts, and Quotes endpoints.
- Set up Cloudinary buffer stream upload and Vercel routing configurations.
