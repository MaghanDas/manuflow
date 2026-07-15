# ManuFlow — Manufacturing Order Tracker

A job-shop order tracker: clients submit manufacturing job orders, operators
run the production queue, and admins watch throughput on a live dashboard.
Status changes propagate in real time over Socket.io.

```
manuflow/
├── backend/          Django + Django REST Framework (Python)
├── frontend/          React 18 + Redux Toolkit (TypeScript)
├── notifications/      Node.js + Express + Socket.io
├── infra/aws/          Terraform (AWS: EC2 + RDS)
├── k8s/                 Kubernetes manifests (Minikube-friendly)
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Roles

| Role     | Can do |
|----------|--------|
| Client   | Submit job orders, track their own orders' live status |
| Operator | See the full production queue, advance orders through Pending → In Progress → Quality Check → Completed, leave notes |
| Admin    | Everything an operator can do, plus the analytics dashboard |

## Quickstart (Docker Compose)

```bash
docker compose up --build
```

This starts Postgres, the Django API, the Node notifications service, and
the frontend. The backend's entrypoint runs migrations and seeds demo data
automatically.

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Django admin: http://localhost:8000/admin/
- Notifications health check: http://localhost:4000/health

**Demo accounts** (also printed by the seed command):

| Username    | Password       | Role     |
|-------------|----------------|----------|
| `admin`     | `admin12345`   | Admin    |
| `operator1` | `operator12345`| Operator |
| `client1`   | `client12345`  | Client   |

## Running things locally without Docker

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then point POSTGRES_HOST at a local Postgres, or:
export USE_SQLITE_FOR_TESTS=True  # to skip Postgres entirely for local dev
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

Run the test suite:

```bash
USE_SQLITE_FOR_TESTS=True pytest
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev       # http://localhost:5173
npm test          # Jest + React Testing Library
npx tsc -b         # typecheck
npm run build      # production build
```

### Notifications service

```bash
cd notifications
npm install
npm run dev        # nodemon, http://localhost:4000
npm test           # Jest + supertest
```

## How the real-time updates work

1. An operator calls `POST /api/orders/{id}/status_transition/` on the
   Django API.
2. The API validates the transition (`orders/serializers.py`,
   `OrderStatusUpdateSerializer.VALID_TRANSITIONS`), persists the new
   status, writes a `StatusLog` row, then makes a fire-and-forget HTTP call
   to the Node service's `POST /broadcast/order-status`.
3. The Node service emits an `order:status` Socket.io event to the rooms
   for that order's client and for the `OPERATOR`/`ADMIN` roles.
4. The frontend's `useOrderStatusSocket` hook is subscribed to the right
   room and dispatches `applyLiveStatusUpdate` into the Redux `orders`
   slice — no refetch needed, the badge and production-line tracker update
   immediately.

If the notifications service is down, the status transition still succeeds
(the backend logs a warning and moves on) — the queue/orders pages also
poll every 20 seconds as a fallback.

## API overview

Token auth (`Authorization: Token <key>`), pagination, and filtering via
`django-filter` are wired in for the `orders` and `materials` endpoints.

| Endpoint | Method | Notes |
|---|---|---|
| `/api/auth/register/` | POST | Client or Operator only (not Admin) |
| `/api/auth/login/` | POST | Returns a token |
| `/api/auth/me/` | GET | Current user |
| `/api/materials/` | GET/POST | Operators/Admins can create materials |
| `/api/orders/` | GET/POST | Clients see only their own; filter by `?status=`, `?priority=`, `?material=`, `?deadline_after=`, `?deadline_before=` |
| `/api/orders/{id}/status_transition/` | POST | Operator/Admin only, enforces valid state transitions |
| `/api/orders/{id}/logs/` | GET | Status change audit trail |
| `/api/dashboard/` | GET | Operator/Admin only — order counts by status/priority, throughput, avg completion time |
| `/api/health/` | GET | Unauthenticated health check for load balancers / k8s probes |

## Testing

- **Backend**: pytest + pytest-django, 16 tests covering auth, role-scoped
  order visibility, status-transition validation, and dashboard analytics.
- **Frontend**: Jest + React Testing Library, covering the auth/orders
  Redux slices and key components (status badge, production-line tracker).
- **Notifications**: Jest + supertest, covering the health check and
  broadcast endpoint.
- All three run in CI on every push/PR (`.github/workflows/ci.yml`), followed
  by a Docker image build step for all three services.

## Deploying

- `docker-compose.yml` is the fastest path to a full local/demo stack.
- `infra/aws/` has Terraform for a single EC2 host + RDS Postgres — see
  `infra/README.md`.
- `k8s/` has plain manifests for Minikube or a small cluster — see
  `k8s/README.md`.

## What's intentionally out of scope

Payments, real file storage (job specs are tracked as metadata — name and
size — with no actual upload/storage), and anything beyond the four-stage
status pipeline (Pending → In Progress → Quality Check → Completed, with
Cancelled as a side exit). These were cut to keep the core loop — submit,
queue, update, watch it live — solid rather than spreading thin.
