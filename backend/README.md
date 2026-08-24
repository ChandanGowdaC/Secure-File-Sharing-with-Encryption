# Backend

Run from the `backend/` directory:

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Module ownership

| Router | Owner set | Requirements |
|--------|-----------|--------------|
| `routers/auth.py` | Set 1 | F.1–F.4 |
| `routers/transfers.py` | Set 2 & 3 | F.5–F.13 |
| `routers/admin.py` | Set 3 | F.15 |
| `middleware/errors.py` | Set 3 | F.16 |
