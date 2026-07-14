# Tattoo Convention Operations System

A bilingual operations dashboard for tattoo studios that attend multiple conventions. It gives managers and artists one place to coordinate events, appointments, travel, accommodation, orders, and finances.

## The problem

Convention work is usually split across spreadsheets, chat threads, calendars, and payment notes. That makes it easy to double-book artists, lose customer requirements, miss travel details, or discover profitability only after the event.

This project models the workflow as one shared system with separate manager and artist views.

## What is included

### Manager workspace

- Convention planning and event details
- Artist and appointment coordination
- Order tracking
- Accommodation and travel records
- Convention-level financial reporting
- Dashboard summaries for active work

### Artist workspace

- Assigned conventions and schedules
- Appointment details
- Accommodation information
- Personal dashboard for upcoming work

### Product foundations

- English and French interfaces
- Light and dark themes
- Responsive navigation
- Supabase authentication, database, storage, and realtime integration
- SQL migrations for the initial schema and later feature additions
- Optional AI-provider configuration

## Technology

- React 18 and TypeScript
- Vite and Tailwind CSS
- Supabase
- Zustand
- React Router
- i18next

## Run locally

Requirements: Node.js 20+ and a Supabase project.

```bash
npm install
cp .env.example .env
npm run dev
```

Configure the values in `.env` before signing in:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_API_KEY=
VITE_OPENROUTER_API_KEY=
```

The AI-related keys are optional unless the corresponding integration is used. Never commit real credentials.

## Verification

```bash
npm run check
npm run build
```

The repository currently passes TypeScript checking and the production build. Static-analysis cleanup and bundle splitting remain engineering follow-ups before treating the project as a production release.

## Project status

This is a functional product prototype and portfolio case study, not a hosted SaaS service. Before a production deployment, complete the following for the target studio:

- Review Supabase row-level security and storage policies
- Add automated tests for critical booking and finance flows
- Configure monitoring, backups, and recovery procedures
- Split the main JavaScript bundle
- Complete accessibility and browser testing
- Confirm privacy, retention, and payment requirements for the operating country

## Custom development

The architecture can be adapted for a studio's real convention workflow, including custom roles, deposits, customer intake, flash inventory, artist commissions, and reporting. Commercial deployment should begin with a short workflow audit and a fixed-scope pilot rather than a large rewrite.
