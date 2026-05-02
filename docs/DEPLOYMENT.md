# Deployment + Google Login

This repo is set up for a common split deployment:

- Backend: Render web service from `render.yaml`
- Frontend: Vercel project with root directory `frontend`

## Google OAuth

Create a Google Cloud OAuth 2.0 Web Client and copy its client ID into both apps.

Authorized JavaScript origins should include:

- `http://localhost:5173`
- your deployed Vercel frontend origin, for example `https://idealnest.vercel.app`

No redirect URI is needed for the current Google Identity Services button flow because the frontend receives an ID token directly and posts it to the backend.

## Backend Environment

Set these on Render:

```bash
DATABASE_URL=postgresql+psycopg2://...
CORS_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Render start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Health check:

```bash
GET /health
```

## Frontend Environment

Set these on Vercel:

```bash
VITE_API_BASE=https://your-render-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Vercel settings:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

## Local Run

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
