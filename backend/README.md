# BelieversFlow API

FastAPI backend for the BelieversFlow Christian task manager.

## Deploy to Vercel

1. Fork/push this repo to GitHub
2. Go to [vercel.com/import](https://vercel.com/import)
3. Select your GitHub repo
4. Set Root Directory to `backend`
5. Add Environment Variable: `GROQ_API_KEY` = your GROQ key
6. Click Deploy

Your API URL will be `https://your-app.vercel.app`.

## Local Development

```bash
cd backend
pip install -r requirements.txt
GROQ_API_KEY=your_key uvicorn main:app --reload
```

## API Endpoints

- `GET /api/health` — Health check
- `POST /api/chat` — AI chat via GROQ
