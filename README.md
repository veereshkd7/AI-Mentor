# 🚀 Deployment Guide — AI Mentor (Mono-Repo)

---

## Repo Structure

Everything lives in one GitHub repository:

```
ai-mentor/
├── ai-mentor-backend/    ← Spring Boot
├── ai-mentor-frontend/   ← React + Vite
└── README.md
```

Backend deploys from **Railway**, frontend from **Vercel** — both pointed at the same repo, different root directories.

---

## Step 1 — Create the Mono-Repo

```bash
mkdir ai-mentor && cd ai-mentor

# Copy both project folders in
cp -r /path/to/ai-mentor-backend ./ai-mentor-backend
cp -r /path/to/ai-mentor-frontend ./ai-mentor-frontend

# Root .gitignore
cat > .gitignore << 'IGNORE'
# Backend
ai-mentor-backend/target/
ai-mentor-backend/.env

# Frontend
ai-mentor-frontend/node_modules/
ai-mentor-frontend/dist/
ai-mentor-frontend/.env
ai-mentor-frontend/.env.local

*.log
*.class
.DS_Store
IGNORE

git init
git add .
git commit -m "feat: initial mono-repo — AI Mentor backend + frontend"
```

---

## Step 2 — Push to GitHub

```bash
# Create a new repo on github.com first (name it: ai-mentor), then:

git remote add origin https://github.com/your-username/ai-mentor.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Deploy Backend on Railway

### 3.1 Create account + project
Go to **[railway.app](https://railway.app)** → sign in with GitHub

```
New Project → Deploy from GitHub repo → select ai-mentor
```

### 3.2 Set the root directory
Railway needs to know the backend is in a subfolder:

```
Service Settings → Source → Root Directory → ai-mentor-backend
```

### 3.3 Add PostgreSQL
```
In your project → + New → Database → Add PostgreSQL
```

Note the **Host, Port, Password** from the PostgreSQL service Variables tab.

### 3.4 Set environment variables
Go to **backend service → Variables** and add:

```
GEMINI_API_KEY          = your_key (aistudio.google.com/app/apikey)
JWT_SECRET              = (run: openssl rand -hex 32)
DB_HOST                 = (from Railway PostgreSQL → Host)
DB_PORT                 = (from Railway PostgreSQL → Port)
DB_NAME                 = railway
DB_USER                 = postgres
DB_PASSWORD             = (from Railway PostgreSQL → Password)
CLOUDINARY_CLOUD_NAME   = your_cloud_name
CLOUDINARY_API_KEY      = your_api_key
CLOUDINARY_API_SECRET   = your_api_secret
GEMINI_MODEL            = gemini-2.0-flash
```

### 3.5 Get your backend URL
```
Service Settings → Networking → Generate Domain
→ https://ai-mentor-backend-xxxx.railway.app
```
**Save this — you need it for the frontend.**

---

## Step 4 — Deploy Frontend on Vercel

### 4.1 Create account
Go to **[vercel.com](https://vercel.com)** → sign in with GitHub

### 4.2 Import the same repo
```
New Project → Import → select ai-mentor (same repo)
```

### 4.3 Set the root directory
Vercel also needs to know the frontend is in a subfolder:

```
Root Directory → ai-mentor-frontend
```

Confirm build settings:
```
Framework Preset : Vite
Build Command    : npm run build
Output Directory : dist
Install Command  : npm install
```

### 4.4 Set environment variable
```
VITE_API_BASE_URL = https://ai-mentor-backend-xxxx.railway.app/api/v1
```

### 4.5 Deploy
Click **Deploy** → Vercel gives you:
```
https://ai-mentor.vercel.app
```

---

## Step 5 — Fix CORS

Add your Vercel URL to the backend allowed origins.

In Railway → backend **Variables**, add or update:
```
cors.allowedorigins = https://ai-mentor.vercel.app,http://localhost:5173
```

Railway auto-redeploys after saving variables.

---

## Step 6 — Verify

```bash
# Backend health
curl https://ai-mentor-backend-xxxx.railway.app/actuator/health
# → {"status":"UP"}

# Open frontend
open https://ai-mentor.vercel.app
```

---

## How Future Deploys Work

```bash
# Make any change in either folder, then:
git add .
git commit -m "fix: your change here"
git push origin main

# Railway redeploys backend automatically (only if backend files changed)
# Vercel redeploys frontend automatically (only if frontend files changed)
```

Both platforms are smart enough to detect which subfolder changed.

---

## Final Checklist

```
Repo
  □ Both folders inside one repo (ai-mentor-backend/ and ai-mentor-frontend/)
  □ Root .gitignore covers both projects
  □ Pushed to GitHub

Railway (Backend)
  □ Root Directory set to ai-mentor-backend
  □ PostgreSQL service added
  □ All 11 environment variables set
  □ Backend URL copied

Vercel (Frontend)
  □ Same GitHub repo selected
  □ Root Directory set to ai-mentor-frontend
  □ VITE_API_BASE_URL set to Railway backend URL
  □ Deployed successfully

Connect
  □ Vercel URL added to cors.allowedorigins on Railway
  □ Health check passes
  □ Register + Login works end to end
```
