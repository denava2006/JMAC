# PROJECT_CONTEXT.md

# JMAC Enterprise Platform
---
# Project Overview

**Software Name:** JMAC

**Company:** JMAC Digital Enterprise

JMAC is a modern Enterprise Business Management Platform that integrates multiple business systems into one unified application.

Current Modules

- Human Resource Management System (HRMS)
- Point of Sale (POS)

Future Module

- Finance Management System (FMS)

The Finance Management System is currently under development and must NOT be integrated during this phase.

---

# Project Goal

Build ONE enterprise application.

The goal is NOT to merge multiple websites together.

The goal is to create a single enterprise platform where HRMS and POS become business modules.

Users should never feel like they are switching systems.

The application should resemble enterprise software such as

- Microsoft Dynamics 365
- SAP
- Oracle Fusion
- Odoo
- Workday

---

# Existing Projects

The folder

integration/

contains existing completed systems.

integration/

    hrms/

    pos/

    fms/

These projects are reference implementations.

Before creating any feature:

1. Inspect the existing implementation.
2. Reuse business logic.
3. Reuse services.
4. Reuse database queries.
5. Reuse validation.
6. Reuse types.
7. Reuse workflows.

Never recreate existing functionality.
---
# Reference Project Rules

The folders inside

integration/
must remain untouched.
Never rewrite them.
Never redesign them.
Never modify them unless explicitly requested.
The new enterprise application should reuse their logic while building an entirely new UI.
---
# UI Redesign

The new application must have a completely new enterprise interface.

Do NOT reuse

- Dashboard
- Sidebar
- Navigation
- Components
- CSS
- Landing Pages

Reuse only

- Database
- Business Logic
- Services
- Validation
- API Calls
- Types

---

# Enterprise Structure

JMAC
Dashboard
People
Sales
Reports
Administration
Settings

The application should behave as one product.
Do NOT create separate HRMS or POS applications.
---
# Navigation

Dashboard

People

    Recruitment

    Applicants

    Employees

    Attendance

    Leave

    Payroll

Sales

    Products

    Inventory

    Orders

    Sales

Reports
Administration
Settings
---
# Authentication

Use one Supabase Authentication system.

Only one login page.

Authentication Flow

Login

↓

Supabase Auth

↓

User

↓

Roles

↓

Permissions

↓

Dashboard
---
# User Roles

Current Roles
HR Manager
HR Staff
POS Manager
Cashier
Permissions
HR Manager
Dashboard
People
Reports
Settings
HR Staff
Dashboard
People
POS Manager
Dashboard
Sales
Reports
Settings
Cashier
Dashboard
Sales

Menus must only appear when the user has permission.
Never expose unauthorized modules.
---
# Shared Processes

HRMS owns

- Recruitment
- Employees
- Attendance
- Leave
- Payroll
- Employee Deployment

POS consumes

- Employee Records
- Attendance
- Leave
- Payroll

Never duplicate employee records.
Never duplicate user records.
---
# Employee Deployment

Workflow

Applicant

↓

Interview

↓

Hired

↓

Employee Record

↓

Assign Position

↓

Cashier

or

Manager

↓

Employee automatically becomes available inside POS.

---

# Attendance

Attendance belongs to HRMS.

POS employees use HRMS attendance.

Workflow

Employee

↓

Time In

↓

Attendance

↓

Payroll

---

# Leave

Leave belongs to HRMS.
Leave affects
Attendance
Payroll
Employee Status

POS users use the same leave records.
---
# Payroll

Payroll belongs entirely to HRMS.
Payroll covers
Cashier
Manager
Future

Finance will consume payroll.
Design payroll with future integration in mind.

---

# Careers

Recruitment remains inside HRMS.
Merge the HRMS public pages into the enterprise landing page.

Keep
Careers
Job Listings
Applicant Portal
Resume Upload
Application Tracking
Current Positions
Cashier
Manager

---

# Landing Page

There is only ONE landing page.
Sections
Hero
Features
Modules
Careers
Open Positions
About
Contact
Footer
Buttons
Login
Explore Platform
Careers

The landing page represents JMAC, not HRMS or POS.
---
# Dashboard

Dashboard widgets depend on user permissions.

HR
Employees
Attendance
Leave
Applicants
Payroll
POS Manager
Revenue
Inventory
Orders
Sales
Cashier
Today's Sales
Orders
Products
---
# Database

Continue using the current Supabase project.
Shared Tables
users
employees
roles
permissions
departments
branches
attendance
leave_requests
payroll
notifications
activity_logs
HRMS Tables
job_postings
applicants
interviews
deployments
POS Tables
products
inventory
sales
orders
customers

Never duplicate users.
Never duplicate employees.

---

# Design System

The entire application must use one design language.

## Color Palette

Primary
#0F172A
Primary Hover
#1D4ED8
Accent
#38BDF8
Background
#F8FAFC
Cards
#FFFFFF
Borders
#E2E8F0
Headings
#0F172A
Body
#64748B
Success
#22C55E
Warning
#F59E0B
Error
#EF4444
---
# Design Principles

The UI should be
Modern
Minimal
Professional
Corporate
Enterprise
Responsive
Fast
Reference
Microsoft 365
Stripe
Linear
Atlassian
SAP Fiori
Oracle Fusion
Avoid
Glassmorphism
Heavy Gradients
Neon Colors
Large Shadows
Inconsistent Spacing
Different Styles Between Modules
---
# Shared Components

Create reusable components.

shared/

components/

layouts/

hooks/

services/

types/

utils/

Every module should use these shared components.
---
# Technology Stack

Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- React Hook Form
- Zod
- TanStack Query
- TanStack Table
- Framer Motion
- shadcn/ui

Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security
- Edge Functions
- Storage

Deployment

- GitHub
- Vercel
---
# Development Workflow

For every requested feature:

1. Search the HRMS implementation.
2. Search the POS implementation.
3. Reuse existing logic whenever possible.
4. Build the new enterprise UI.
5. Keep everything modular.
6. Do not duplicate logic.
7. Do not duplicate components.
---
---
# Future Expansion

The architecture must allow seamless integration of

- Finance Management System (FMS)
- CRM
- Procurement
- Warehouse
- Asset Management
- Supplier Portal
- Customer Portal

without requiring major architectural changes.
---
# Final Objective

Deliver a production-quality enterprise application called **JMAC**.

The application should provide:

- One Login
- One Dashboard
- One Design System
- One Authentication System
- One User Management System
- One Shared Database
- One Enterprise Experience

HRMS and POS are business modules within JMAC.

The platform must be scalable, maintainable, modular, and ready for future enterprise expansion.


## AI Workflow

Before implementing any task:

1. Understand the request fully before changing code.
2. Inspect the relevant implementation inside:
   - `integration/hrms`
   - `integration/pos`
   - shared application code under `src`
3. Identify reusable business logic, services, hooks, utilities, database queries, components, and existing patterns before creating new implementations.
4. Reuse existing implementations whenever appropriate instead of duplicating logic.
5. Build new UI using the existing shared design system and current visual patterns.
6. Preserve existing colors, spacing conventions, typography, and layout unless the task explicitly requires a redesign.
7. Keep changes modular, focused, and limited to files relevant to the current task.
8. Avoid unrelated refactors, formatting changes, renames, or architectural changes.
9. Explain major architectural decisions before performing large-scale refactors.
10. Preserve backward compatibility between POS and HRMS whenever possible.
11. FMS is currently under development and is not part of the active integration unless explicitly requested.
12. Do not build, modify, or assume FMS functionality unless the task specifically requires it.

### Agent Responsibilities

Claude Code is the primary implementation agent by default.

Codex is primarily used for:
- code review
- bug detection
- security review
- architecture review
- Playwright/test failure analysis
- backup implementation when Claude is unavailable, reaches usage limits, or explicitly hands off the task

Only one AI agent may actively modify the working tree at a time.

Claude and Codex must never edit the same files simultaneously.

When one agent is actively implementing, the other agent should remain read-only unless a handoff has been explicitly performed.

### Handoff Rules

Before handing work from Claude to Codex or from Codex to Claude:

1. Update `AI_HANDOFF.md`.
2. Include:
   - current task and goal
   - completed work
   - unfinished work
   - exact files modified
   - important architectural decisions
   - known bugs
   - open Codex/Claude review findings
   - test results
   - Playwright results
   - database/auth/RLS risks
   - exact recommended next steps
3. The receiving agent must read:
   - `PROJECT_CONTEXT.md`
   - `AI_HANDOFF.md`
4. The receiving agent must inspect:
   - `git status`
   - `git diff`
5. Verify the previous agent's claims against the actual code before continuing.
6. Do not redo work that is already complete.
7. Do not blindly apply review findings; verify each finding against the current implementation first.

### Database and Data Safety

Do not reset, recreate, wipe, or reseed the database unless the user explicitly requests it.

Preserve existing data.

Before modifying:
- migrations
- Supabase configuration
- RLS policies
- authentication
- roles
- permissions
- database functions
- triggers

inspect the existing implementation and explain why the change is required.

Database changes should be:
- forward-only where possible
- compatible with existing data
- scoped to the current module
- safe for POS and HRMS integration

Do not weaken security policies simply to make a feature work.

### POS / HRMS Integration

Treat POS and HRMS as separate business modules that share common platform infrastructure.

Prefer shared infrastructure for:
- authentication
- user identity
- roles and permissions
- navigation
- audit logging
- Supabase/database access
- design system components
- common utilities

Keep module-specific business logic isolated.

Examples:

POS owns:
- products
- inventory
- sales
- checkout
- stock movement
- POS reporting

HRMS owns:
- employees
- recruitment
- interviews
- attendance
- leave
- payroll-related HR data
- HR reporting

Do not tightly couple POS-specific logic to HRMS-specific logic.

Prepare architecture so future FMS integration remains possible without prematurely implementing FMS.

### Testing Workflow

After meaningful code changes, run the relevant validation commands when available.

Typical checks include:
- TypeScript/typecheck
- lint
- unit tests
- build
- Playwright end-to-end tests

Do not claim a task is complete if required tests are failing without clearly reporting the failures.

For Playwright:
- use existing tests before creating duplicates
- keep tests deterministic
- avoid assumptions based on random or unstable data
- preserve screenshots, traces, and reports for failed tests when useful
- analyze the root cause before changing production code

When Playwright finds an issue:

1. Verify whether the test or the application is incorrect.
2. Inspect the relevant code.
3. Review any Codex/Claude findings.
4. Fix only the confirmed root cause.
5. Rerun the affected test.
6. Run broader regression tests when appropriate.


### Completion Requirements

Before reporting a task as complete:

1. Verify the requested behavior.
2. Check the current Git diff.
3. Run relevant tests.
4. Ensure no unrelated files were changed.
5. Update `AI_HANDOFF.md` if another agent may continue the work.
6. List modified files.
7. Explain any remaining risks or unresolved issues.
8. Stop without committing or pushing.


## Critical AI Rules

- Only one AI agent may modify files at a time.
- Claude is the primary implementer; Codex is the primary reviewer and backup implementer.
- Read `PROJECT_CONTEXT.md` and `AI_HANDOFF.md` before taking over a task.
- Inspect `git status` and `git diff` before editing.
- Never commit or push; the user controls Git.
- Never reset or wipe the database.
- Preserve POS and HRMS behavior.
- Do not implement FMS unless explicitly requested.
- Verify review findings before fixing them.
- Run relevant tests before declaring work complete.
### Context / Token Limit Rule
When the active AI agent reaches approximately 90% context or usage:

1. Stop starting new implementation work immediately.
2. Do not begin another feature, refactor, or large bug fix.
3. Finish only the current safe atomic operation if stopping midway would leave the code in an invalid state.
4. Update `AI_HANDOFF.md` with the complete current state.
5. Include:
   - current task
   - completed work
   - unfinished work
   - exact files modified
   - important decisions
   - known issues
   - review findings
   - tests already run
   - Playwright results/failures
   - current git status
   - exact next steps for the receiving agent
6. Do not commit or push.
7. Stop after the handoff is complete.

This rule applies to both Claude and Codex.

The receiving agent must read `PROJECT_CONTEXT.md` and `AI_HANDOFF.md`, then inspect `git status` and `git diff` before continuing.