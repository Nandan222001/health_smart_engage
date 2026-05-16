# HSE Backend

FastAPI backend scaffold for the HSE Safety, Compliance & Intelligence Platform.

## Stack

| Layer | Technology |
|---|---|
| API framework | FastAPI |
| Language | Python |
| Database | MySQL |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Cloud target | Azure |

## Architecture

```text
backend/
  app/
    api/v1/routes/      HTTP route/controller layer
    core/               settings, security, logging, exceptions, database
    helpers/            reusable request/response/date/pagination helpers
    models/             SQLAlchemy persistence models
    repositories/       data access layer
    schemas/            Pydantic request/response contracts
    services/           business logic and orchestration
  migrations/           Alembic database migrations
  tests/                backend tests
```

## Implemented Backend Capabilities

| Area | Status |
|---|---|
| Domain models | Implemented for organisation, users, roles, employees, training, vendors, assets, risk, permits, audits, CAPA, incidents, knowledge, files, AI, and mobile sync |
| MySQL schema | Alembic migration `0001_initial` creates core module tables and indexes |
| RBAC | Role-to-permission map with per-route inferred permission enforcement |
| JWT/OIDC | JWT validation with issuer, audience, algorithm, and secret configuration |
| Azure Blob Storage | Upload target service with Azure SAS support and local fallback |
| Azure Key Vault | Secret retrieval service with Azure SDK support and safe fallback |
| Notifications | Notification service boundary for email, push, and workflow events |
| Reports | Report generation service boundary with auditable report outputs |
| Mobile offline sync | Pull/push service with conflict detection |
| AI | AI service boundary for advisor answers and predictive risk hooks |
| Business rules | Permit conflict, asset/vendor/certification checks, CAPA evidence, vendor rejection, incident classification validation |

## Principles

- Single responsibility: routes only handle HTTP concerns, services own business logic, repositories own data access.
- Dependency inversion: route handlers depend on service interfaces through FastAPI dependencies.
- Open/closed: API groups can add endpoints without changing shared plumbing.
- Separation of concerns: auth, audit, persistence, response formatting, and business workflows are isolated.

## Local Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

## Environment

Copy `.env.example` to `.env` and set the MySQL connection string.

```text
DATABASE_URL=mysql+pymysql://hse_user:hse_password@localhost:3306/hse
```

## Migrations

```powershell
cd backend
alembic upgrade head
alembic revision --autogenerate -m "describe change"
```

## API Docs

Run the server and open:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Coverage

See [API_COVERAGE.md](API_COVERAGE.md) for the implemented route count and API group mapping.
