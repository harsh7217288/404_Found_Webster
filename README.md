# Vishanti --- Grievance Management Portal

Vishanti is a grievance-management portal designed to help students
submit complaints and help authorized campus staff review, manage, and
escalate them through a structured workflow.

> **Development/demo notice:** The accounts and password listed below
> are local demo credentials. They are not suitable for public
> deployment. Disable or replace them, rotate secrets, and configure
> production-grade authentication and permissions before exposing the
> application to the internet.

## Table of Contents

-   [Project Overview](#project-overview)
-   [Roles and Demo Accounts](#roles-and-demo-accounts)
-   [Technology Stack](#technology-stack)
-   [Architecture at a Glance](#architecture-at-a-glance)
-   [Prerequisites](#prerequisites)
-   [Run Locally](#run-locally)
-   [Open the Application](#open-the-application)
-   [Connect pgAdmin 4](#connect-pgadmin-4)
-   [Useful Database Queries](#useful-database-queries)
-   [Security Design and
    Demonstration](#security-design-and-demonstration)
-   [Troubleshooting](#troubleshooting)
-   [Before Public Deployment](#before-public-deployment)

## Project Overview

Vishanti provides a shared workflow for reporting and handling campus
grievances. Its intended users have different responsibilities:

-   **Students** submit complaints and review their ticket activity.
-   **Wardens** review and handle grievances within their assigned
    authority.
-   **Dean of Students** handles escalated grievances at a higher level.
-   **Registrar** handles higher-level escalations.
-   **Administrators** access administrative functions.

The precise actions permitted to each role depend on the authorization
rules implemented by the application. The landing routes below describe
where each demo account is expected to arrive after login; they do not,
by themselves, guarantee particular permissions.

### Core concepts

-   **Ticket/complaint:** A record representing a grievance submitted to
    the portal.
-   **Reference number:** A human-readable identifier, for example
    `VSH-000001`, used to locate a ticket.
-   **Status:** The ticket's current workflow state, such as `FILED`,
    `IN_PROGRESS`, or `CLOSED`, depending on configured states.
-   **Escalation:** Moving a grievance to a higher level of review when
    required.
-   **Audit ledger:** An append-only history mechanism intended to
    preserve a record of changes. Its actual guarantees depend on
    database triggers, permissions, and application implementation.

## Roles and Demo Accounts

All demo accounts share this password:

**Password:** `vishanti123`

  ---------------------------------------------------------------------------------
  Role                    Email                             Expected landing route
  ----------------------- --------------------------------- -----------------------
  Student                 `student1@vishanti.edu`           `/tickets`

  Warden (level 1)        `warden@vishanti.edu`             `/desk`

  Dean of Students (level `dean.of.students@vishanti.edu`   `/desk`
  2)                                                        

  Registrar (level 3)     `registrar@vishanti.edu`          `/desk`

  Administrator           `admin@vishanti.edu`              `/admin`
  ---------------------------------------------------------------------------------

### Suggested role-based smoke test

1.  Sign in as `student1@vishanti.edu` and check the student ticket
    interface.
2.  Sign out, then sign in as `warden@vishanti.edu` and check the staff
    desk.
3.  Repeat with the Dean of Students and Registrar accounts to review
    the escalation-level experience.
4.  Sign in as `admin@vishanti.edu` and check the administration
    interface.
5.  For each role, verify that actions outside its authority are
    rejected by the **backend**, not merely hidden by the frontend.

> These credentials are for local development only. Anyone who knows
> them may be able to sign in if the accounts are enabled and the
> application is reachable.

## Technology Stack

The project context indicates these components:

-   **Frontend:** React-based web application, using JavaScript and a
    Vite-style development workflow.
-   **Backend:** FastAPI (Python).
-   **Database:** PostgreSQL, using the `pgvector` PostgreSQL image in
    the Docker setup.
-   **Database access:** SQLAlchemy with asynchronous PostgreSQL
    connectivity (`asyncpg`).
-   **Migrations:** Alembic is part of the backend tooling.
-   **Background services:** Redis and worker/scheduler services are
    included in Docker Compose.
-   **Containerization:** Docker Compose.

Check the repository and `docker-compose.yml` for the definitive
versions and services enabled in your current checkout.

## Architecture at a Glance

``` text
Browser
  |
  v
React frontend (configured around http://localhost:3000)
  |
  | HTTP API requests
  v
FastAPI backend (commonly http://localhost:8000)
  |
  +---- PostgreSQL (Compose service: db, internal port 5432)
  |
  +---- Redis (Compose service: redis, internal port 6379)
  |
  +---- Background worker / scheduler
```

Within Docker Compose, backend services should generally connect to
PostgreSQL using hostname `db` and internal port `5432`. A desktop
application such as pgAdmin connects through a host-published port, if
configured.

The frontend API URL and backend CORS configuration must agree with the
ports actually used by the local setup. Verify them in Compose and the
frontend configuration rather than assuming defaults.

## Prerequisites

Install and verify:

1.  **Docker Desktop** with its Linux container engine running.
2.  **Node.js and npm** if running the frontend outside Docker.
3.  **Git** if cloning or collaborating through a repository.
4.  **pgAdmin 4** (optional) for inspecting PostgreSQL visually.

Useful PowerShell checks:

``` powershell
docker --version
docker compose version
node --version
npm --version
```

## Run Locally

Open PowerShell and move to the project root:

``` powershell
cd "D:\Vishanti Petition"
```

### 1. Start the database and Redis

``` powershell
docker compose up -d db redis
docker compose ps
```

### 2. Start the backend and background services

``` powershell
docker compose up -d api worker beat
docker compose logs --tail=100 api
```

The API is expected at `http://localhost:8000` only if Compose publishes
that port and the API starts successfully.

### 3. Start the frontend locally

If running the frontend outside Docker, open a second PowerShell
terminal:

``` powershell
cd "D:\Vishanti Petition\frontend"
npm install
npm run dev
```

Use the exact URL printed by the development server. The Compose
configuration has included port `3000`; Vite commonly uses `5173` by
default, so trust the terminal output.

If the frontend is configured as a Compose service, use:

``` powershell
cd "D:\Vishanti Petition"
docker compose up -d web
docker compose ps
```

Do not run both frontend modes on the same host port simultaneously.

### 4. Verify the API

Try opening the API documentation:

`http://localhost:8000/docs`

If it does not open, check the actual published port and logs:

``` powershell
docker compose ps
docker compose logs --tail=100 api
```

Do not assume a particular health endpoint exists unless it appears in
the API routes or OpenAPI documentation.

## Open the Application

1.  Start the database, Redis, backend, and frontend.
2.  Open the frontend URL printed by the development server or exposed
    by Compose.
3.  Sign in with one of the demo accounts above.
4.  Test the landing page and the permitted workflow for that role.
5.  Sign out before testing another role.

If login fails, verify that the demo accounts have been seeded and that
the frontend calls the correct API URL. Do not run demo seeding blindly:
this project has previously used a `--demo` option that can create 90
synthetic tickets.

## Connect pgAdmin 4

The current Compose configuration uses these internal PostgreSQL
settings:

-   Database: `vishanti`
-   Username: `vishanti`
-   Password: `vishanti`
-   Internal Docker hostname: `db`
-   Internal Docker port: `5432`

**Important:** `db` is the hostname for containers on the Compose
network. pgAdmin running directly on Windows should connect to
`127.0.0.1` and the published host port.

Check the mapping:

``` powershell
docker compose ps db
docker compose port db 5432
```

If the command returns a host mapping such as `0.0.0.0:5433`, use:

  pgAdmin setting        Value
  ---------------------- ----------------------------------------
  Host name/address      `127.0.0.1`
  Port                   `5433` (use the actual published port)
  Maintenance database   `vishanti`
  Username               `vishanti`
  Password               The configured database password

If there is no mapping, inspect the `db` service in
`docker-compose.yml`. If no host port is published, add this under `db`,
preserving its existing settings:

``` yaml
ports:
  - "5433:5432"
```

Then apply it:

``` powershell
docker compose up -d db
docker compose port db 5432
```

Use port `5433` in pgAdmin. This reduces the chance of colliding with
another PostgreSQL installation on Windows.

If authentication fails, verify the configured password and confirm
pgAdmin is connecting to the Docker instance rather than another server
on `localhost:5432`.

## Useful Database Queries

In pgAdmin, select the `vishanti` database, then choose **Tools → Query
Tool**. Run these read-only queries one at a time.

### Confirm the connection

``` sql
SELECT current_database() AS database_name,
       current_user AS connected_user;
```

### List public tables

``` sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Count tickets

``` sql
SELECT COUNT(*) AS total_tickets
FROM tickets;
```

### Show recent tickets

``` sql
SELECT ref, title, status, created_at
FROM tickets
ORDER BY created_at DESC
LIMIT 10;
```

### Count tickets by status

``` sql
SELECT status, COUNT(*) AS total
FROM tickets
GROUP BY status
ORDER BY total DESC;
```

These are inspection queries. Avoid `DELETE`, `TRUNCATE`, or `DROP`
during a demo unless you have a verified backup and understand the
consequences.

## Security Design and Demonstration

Vishanti's intended security story includes role-based access, backend
authorization, restricted database access, and an append-only audit
ledger. Demonstrate only controls verified in the current code and
database.

### Safe demonstration plan

1.  Log in with a student account and show the student-facing workflow.
2.  Log in with a staff account and show the staff desk.
3.  Attempt a restricted action using an account that should not have
    permission. Confirm the **API** rejects it; hiding a frontend button
    is not sufficient.
4.  Inspect PostgreSQL triggers and permissions for the audit ledger.
5.  Demonstrate ledger immutability only after verifying the actual
    trigger definition and testing safely in a disposable database.

### Security claims to avoid without evidence

-   Do not claim the system is "unhackable."
-   An append-only trigger on a ledger table does not automatically
    protect every table.
-   A trigger does not by itself prevent SQL injection.
-   Hiding a button in the frontend is not authorization.
-   A local demo password is not suitable for production.
-   Do not run destructive SQL against the active demo database to prove
    a security control.

### Controls to verify before claiming them

-   Passwords are stored using a secure password hash, not plaintext.
-   Backend routes enforce authentication and role-based authorization.
-   Database access uses parameterized queries/ORM safely.
-   Application database users have only required permissions.
-   Secrets are loaded from protected environment configuration.
-   Audit-ledger triggers cover intended mutation events.
-   CORS, rate limits, token/session expiry, and error handling are
    configured appropriately.
-   Authorization tests cover access to another user's tickets and
    unauthorized state transitions.

## Troubleshooting

### API is not reachable

``` powershell
docker compose ps
docker compose logs --tail=100 api
```

Check that the API container is running and its port is published.

### Database container is not running

``` powershell
docker compose ps db
docker compose logs --tail=100 db
```

### pgAdmin reports password authentication failure

1.  Verify that host and port point to the Docker database.
2.  Check `POSTGRES_USER`, `POSTGRES_DB`, and the configured password in
    Compose/environment settings.
3.  Test from inside the container:

``` powershell
docker compose exec db psql -U vishanti -d vishanti -c "SELECT current_database(), current_user;"
```

If this succeeds inside the container but pgAdmin fails, check the host
port, selected server, and saved pgAdmin password.

### Frontend opens but API calls fail

-   Confirm the backend is running.
-   Check the frontend API base URL.
-   Confirm backend CORS permits the frontend origin.
-   Use browser Developer Tools → **Console** and **Network** to inspect
    failed requests.
-   Check backend logs for the corresponding error.

### Avoid accidental demo reseeding

The backend has used an initialization command where
`python -m app.init_db --demo` seeds synthetic tickets. Inspect
`SEED_DEMO` and the startup script before restarting or reinitializing
if you need to preserve a specific set of records.

Do not use `docker compose down -v` as a generic troubleshooting step:
`-v` can remove named volumes and permanently delete local database
data.

## Before Public Deployment

Before exposing Vishanti to the internet:

-   Change or disable every demo account and the shared demo password.
-   Replace placeholder secrets, including `JWT_SECRET`, with strong
    unique secrets.
-   Never commit `.env` files or real credentials to version control.
-   Create separate least-privilege database credentials for application
    and migration tasks.
-   Disable demo seeding in production.
-   Use HTTPS and secure token/session handling.
-   Restrict CORS to trusted origins.
-   Add appropriate rate limiting and request-size limits.
-   Review file uploads, validation, logging, and error messages.
-   Back up the database and test recovery.
-   Run automated authorization, integration, and migration tests.
-   Perform a security assessment before handling real complaints or
    sensitive personal data.

------------------------------------------------------------------------

**Project:** Vishanti --- Grievance Management Portal\
**Environment covered:** Local development / hackathon demonstration\
**Credentials:** Demo-only; rotate or disable before public deployment
