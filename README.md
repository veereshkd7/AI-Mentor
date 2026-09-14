# 🤖 AI Mentor

An AI-powered learning platform that helps you master any technical topic — generate roadmaps, deep explanations, interview prep, and quizzes instantly.

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring%20AI-1.0.0-6DB33F?style=flat&logo=spring&logoColor=white)](https://spring.io/projects/spring-ai)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## What Is AI Mentor?

AI Mentor is a full-stack application where you type a topic and skill level, and get back structured, AI-generated learning content in seconds — powered by **Google Gemini 2.0 Flash** (free tier).

### Four things it generates

| Mode | What you get |
|------|-------------|
| **Roadmap** | Phased learning plan with timelines, resources, and milestones |
| **Explanation** | Deep concept breakdown with analogies, code examples, pros and cons |
| **Interview Prep** | Q&A pairs with model answers, follow-ups, and tips |
| **Quiz** | Multiple-choice questions with correct answers and explanations |

Every session is saved so you can revisit, browse history, or delete old sessions.

---

## How It Works

```
You type a topic + skill level
        ↓
React frontend sends request with your JWT token
        ↓
Spring Boot validates token, rate-limits the request
        ↓
Spring AI sends prompt to Google Gemini (free API key)
        ↓
Structured JSON response saved to PostgreSQL + Cloudinary
        ↓
Result displayed on screen, available in history forever
```

---

## Tech

**Backend** — `ai-mentor-backend/`
- Java 21 + Spring Boot 3.5
- Spring AI 1.0.0 (Google Gemini via OpenAI-compatible endpoint)
- PostgreSQL + Spring Data JPA
- JWT authentication with refresh token rotation
- Per-IP rate limiting (Bucket4j)
- Cloudinary for session storage

**Frontend** — `ai-mentor-frontend/`
- React 18 + Vite
- JWT-aware API client with silent token refresh

---

## Getting Started

### Prerequisites
- Java 21, Maven 3.9+
- Node.js 18+, npm
- PostgreSQL 15+ (or Docker)
- Free Gemini API key → [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Backend

```bash
cd ai-mentor-backend
cp .env.example .env       # fill in your values
./mvnw spring-boot:run
# → http://localhost:8080
# → http://localhost:8080/swagger-ui.html
```

### Frontend

```bash
cd ai-mentor-frontend
cp .env.example .env       # set VITE_API_BASE_URL=http://localhost:8080/api/v1
npm install
npm run dev
# → http://localhost:5173
```

### Required environment variables (backend)

```
GEMINI_API_KEY          ← free from aistudio.google.com
JWT_SECRET              ← openssl rand -hex 32
DB_HOST / DB_NAME / DB_PASSWORD
CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
```

---

## Project Structure

```
ai-mentor/
├── ai-mentor-backend/
│   ├── src/main/java/com/aimentor/
│   │   ├── config/        # Spring AI, Security, JWT, Cloudinary
│   │   ├── controller/    # Auth, Mentor, User endpoints
│   │   ├── service/       # AI generation, auth, sessions, audit
│   │   ├── entity/        # User, MentorSession, AuditLog
│   │   └── filter/        # JWT, rate limiting, security headers
│   └── Dockerfile
├── ai-mentor-frontend/
│   ├── src/
│   │   ├── pages/         # Login, Register, Dashboard
│   │   ├── components/    # UI components
│   │   └── context/       # Auth context
│   └── Dockerfile
└── README.md
```

---

## License

MIT
