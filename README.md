# Secure File Sharing with Encryption

IT-303 Project — NITK Surathkal

Web application for end-to-end encrypted file sharing using Diffie-Hellman key exchange, HKDF, and AES-256-GCM. The server stores only encrypted blobs, public keys, and transfer metadata.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + TypeScript |
| Backend | FastAPI (Python) |
| Client crypto | Shared `crypto/` module (browser-only) |
| API | REST over HTTPS (JSON) |

## Repository layout

```
├── backend/          # FastAPI REST API
├── frontend/         # React web UI
├── crypto/           # Shared client-side DH / HKDF / AES-GCM stubs
├── docs/openapi.yaml # API contract for team integration
└── docker-compose.yml
```

## Team module ownership

| Set | Owner area | Backend | Frontend | Requirements |
|-----|------------|---------|----------|--------------|
| **1** | Identity & keys | `routers/auth.py` | Register, Login pages | F.1–F.4 |
| **2** | Send & deliver | `routers/transfers.py` (upload/delivery) | Upload page | F.5–F.11 |
| **3** | Receive, audit, errors | `routers/admin.py`, `middleware/errors.py` | Inbox, Admin pages | F.12–F.16 |

## Quick start (local)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs
- Health: http://localhost:8000/health

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173 (proxies `/api` and `/health` to backend)

### Docker (optional)

```bash
docker compose up --build
```

## Development notes

- **Private keys** are generated and stored in the browser only (`crypto/src/keystore.ts`).
- **File encryption** happens client-side before upload; the server never sees plaintext.
- All endpoints return `501` until implemented — skeleton stubs raise `NotImplementedError`.
- Agree on `docs/openapi.yaml` and `crypto/src/constants.ts` before parallel implementation.
