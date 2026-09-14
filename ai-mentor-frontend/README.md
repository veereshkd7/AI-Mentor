# AI Mentor — React Frontend

React 18 · Vite 5 · React Router 6 · Axios

## Prerequisites
- Node.js 18+ installed  (`node -v`)
- npm 9+  (`npm -v`)

## Quick Start

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Configure backend URL (optional)

The file `.env.local` is already created pointing to `http://localhost:8080`.
Change it only if your backend runs on a different port:

```
VITE_API_URL=http://localhost:8080
```

### Step 3 — Start the dev server
```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

> Make sure the Spring Boot backend is running on port 8080 first!

---

## Build for Production

```bash
npm run build       # outputs to dist/
npm run preview     # preview the production build locally
```

---

## Project Structure

```
frontend/
├── index.html                          HTML entry point
├── vite.config.js                      Vite config + /api proxy to backend
├── package.json                        Dependencies
├── .env.local                          Backend URL (pre-configured)
├── .env.example                        Environment variable template
├── nginx.conf                          nginx config (for Docker deployment)
├── Dockerfile                          Production Docker image
└── src/
    ├── main.jsx                        React entry point
    ├── App.jsx                         Router + Toaster setup
    ├── styles/
    │   └── globals.css                 Design system (CSS variables + animations)
    ├── services/
    │   └── api.js                      Axios instance with auto token-refresh
    ├── context/
    │   └── AuthContext.jsx             Global auth state (login/logout/register)
    ├── hooks/
    │   └── useMentor.js                AI generation + session history logic
    ├── pages/
    │   ├── LoginPage.jsx               Sign-in form
    │   ├── RegisterPage.jsx            Registration + password strength meter
    │   └── DashboardPage.jsx           Main app shell (sidebar + content area)
    └── components/
        ├── UI.jsx                      Shared components (Button, Input, Card…)
        ├── InputPanel.jsx              Topic / level / count form
        ├── HistoryPanel.jsx            Session history list with reload/delete
        └── results/
            ├── RoadmapResult.jsx       Phase cards with milestones
            ├── ExplainResult.jsx       Concepts, code blocks, pros/cons
            ├── InterviewResult.jsx     Expandable accordion Q&A
            └── QuizResult.jsx          Timed MCQ with live scoring
```

---

## Pages & Features

| Page | Route | Description |
|------|-------|-------------|
| Login    | `/login`     | JWT login, show/hide password |
| Register | `/register`  | Account creation, live password-strength bar |
| Dashboard | `/dashboard` | Collapsible sidebar, all 4 AI modes + history |

| Feature | Component | Notes |
|---------|-----------|-------|
| Roadmap   | `RoadmapResult`   | Phased cards, milestones, career paths |
| Explain   | `ExplainResult`   | Concepts, analogies, code blocks |
| Interview | `InterviewResult` | Accordion Q&A, red flags, follow-ups |
| Quiz      | `QuizResult`      | Countdown timer, per-question explanations |
| History   | `HistoryPanel`    | Reload or delete any past session |

---

## How Token Refresh Works

`src/services/api.js` uses an Axios response interceptor:

1. Every request automatically attaches `Authorization: Bearer <access_token>`
2. On a **401** response, it silently calls `/api/v1/auth/refresh`
3. The new access token is stored and the original request is retried
4. If refresh also fails, the user is redirected to `/login`

This means the user stays logged in for 7 days without any interruption.
