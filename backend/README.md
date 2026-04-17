# Backend (FastAPI)

JSON **REST-style** API: resource paths like `GET /api/zip-areas` (search) and `GET /api/zip-areas/{zip}` (detail), standard HTTP methods and status codes. OpenAPI schema at `/docs` or `/openapi.json`.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: replace YOUR_PASSWORD in DATABASE_URL with your RDS password (do not commit .env)
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API base: `http://127.0.0.1:8000`
- Interactive docs: `http://127.0.0.1:8000/docs`
- Health: `GET /health`

SQL for Milestone 3 queries 1–4 lives in `app/sql/milestone3.py` and is executed from `app/routers/zip_areas.py`. ZIP drill-down (queries 7–10) is `GET /api/zip-areas/{zip_code}`.
