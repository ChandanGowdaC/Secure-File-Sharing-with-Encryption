# Frontend

React + Vite + TypeScript UI for Secure File Sharing with Encryption.

## Run locally

```bash
npm install
npm run dev
```

Ensure the FastAPI backend is running on port 8000. Vite proxies `/api` and `/health` to the backend.

## Pages (by team set)

| Page | Path | Set | Requirements |
|------|------|-----|--------------|
| Register | `/register` | 1 | F.1 |
| Login | `/login` | 1 | F.2, F.3 |
| Send | `/upload` | 2 | F.4–F.9 |
| Inbox | `/inbox` | 3 | F.12, F.13 |
| Admin | `/admin` | 3 | F.15 |

## Shared crypto

Import from `@crypto` (alias to `../crypto/src`):

```ts
import { generateLongTermKeyPair, encryptFile } from '@crypto'
```
