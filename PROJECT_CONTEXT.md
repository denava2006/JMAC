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

# Claude Skills

Use installed Claude Skills whenever applicable.

Priority

1. UI/UX Design
2. React
3. TypeScript
4. Tailwind CSS
5. shadcn/ui
6. Supabase
7. PostgreSQL
8. Documentation
9. Refactoring
10. Performance Optimization

Always prioritize skill-based solutions over generic generation.

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

1. Understand the request.
2. Inspect the relevant implementation inside `integration/hrms` or `integration/pos`.
3. Identify reusable business logic, services, and database queries.
4. Reuse existing implementations whenever appropriate.
5. Build new UI using the shared design system.
6. Keep changes modular and avoid unrelated modifications.
7. Explain major architectural decisions before making large-scale refactors.