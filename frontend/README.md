# Frontend (React + Vite)

## Setup

```bash
cd frontend
npm install
```

## Run (with API proxy)

Start the FastAPI backend on port **8000** first, then:

```bash
npm run dev
```

Open `http://localhost:5173`. Requests to `/api/*` are proxied to the backend (see `vite.config.js`).

## Build

```bash
npm run build
```
