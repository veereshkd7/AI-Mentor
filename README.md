# AI-Mentor
AI-powered learning assistance to authenticated users

# 🤖 AI Mentor

An AI-powered learning API that generates roadmaps, concept explanations, interview Q&A, and quizzes — built with Spring Boot and Google Gemini.

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring%20AI-1.0.0-6DB33F?style=flat&logo=spring&logoColor=white)](https://spring.io/projects/spring-ai)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

---

## What It Does

Send a topic + skill level → get structured AI content back.

| Endpoint | What you get |
|----------|-------------|
| `POST /api/v1/mentor/roadmap` | Phased learning plan with resources and milestones |
| `POST /api/v1/mentor/explain` | Deep explanation with analogies and code examples |
| `POST /api/v1/mentor/interview` | Interview Q&A pairs with model answers |
| `POST /api/v1/mentor/quiz` | Multiple-choice quiz with explanations |
| `GET /api/v1/mentor/history` | Browse and reload past sessions |

Every response is stored in **Cloudinary** (full JSON) and **PostgreSQL** (preview), so sessions persist across restarts.

---

## Stack

- **Spring Boot 3.5 + Java 21** — core framework
- **Spring AI 1.0.0** — provider-agnostic LLM abstraction (`ChatClient`)
- **Google Gemini 2.0 Flash** — free tier via OpenAI-compatible endpoint
- **PostgreSQL + Spring Data JPA** — users, sessions, audit logs
- **JWT (HS256)** — 5h access token + 30d refresh token with silent rotation
- **Bucket4j** — per-IP rate limiting
- **Cloudinary** — AI session result storage
- **Docker** — multi-stage, non-root image

---

## Quick Start

**Prerequisites:** Java 21, Maven 3.9+, PostgreSQL (or Docker), free [Gemini API key](https://aistudio.google.com/app/apikey)

```bash
# 1. Start PostgreSQL
docker run -d --name pg -e POSTGRES_DB=aimentordb -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15-alpine

# 2. Set required env vars
export GEMINI_API_KEY=your_key_here
export JWT_SECRET=$(openssl rand -hex 32)
export CLOUDINARY_CLOUD_NAME=your_cloud
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_secret

# 3. Run
./mvnw spring-boot:run
```

Swagger UI → `http://localhost:8080/swagger-ui.html`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Free key from [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `JWT_SECRET` | ✅ | 64-char hex string for JWT signing |
| `DB_HOST` / `DB_NAME` / `DB_PASSWORD` | ✅ | PostgreSQL connection |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | ✅ | Cloudinary credentials |
| `GEMINI_MODEL` | No | Default: `gemini-2.0-flash` |

Copy `.env.example` → `.env` and fill in your values.

---

## API — Quick Reference

**Register / Login**
```bash
POST /api/v1/auth/register   body: { username, email, password }
POST /api/v1/auth/login      body: { username, password }
# → returns { accessToken, refreshToken, expiresIn }
```

**Generate content** (Bearer token required)
```bash
POST /api/v1/mentor/roadmap
body: { "topic": "Spring Boot", "level": "intermediate", "questionCount": 10 }
# → { success, sessionId, content, cloudinaryUrl, durationMs }
```

**Token management**
```bash
POST /api/v1/auth/silent-refresh   # rotate tokens without re-login
GET  /api/v1/auth/token-status     # seconds remaining + warn/urgent flags
POST /api/v1/auth/logout
```

---

## Security Highlights

- BCrypt (strength 12) password hashing
- Brute-force protection — locks account after 5 failed attempts for 30 min
- Refresh token rotation — old token invalidated on every use
- Rate limiting — 10 req/min on auth + AI endpoints, 60 req/min general
- Strict CSP + HSTS headers on every response
- Full audit log — every auth event and AI call recorded to DB

---

## Docker

```bash
docker build -t ai-mentor-backend .

docker run -d -p 8080:8080 \
  -e GEMINI_API_KEY=your_key \
  -e JWT_SECRET=your_secret \
  -e DB_HOST=your_host \
  -e DB_PASSWORD=your_password \
  -e CLOUDINARY_CLOUD_NAME=your_cloud \
  -e CLOUDINARY_API_KEY=your_key \
  -e CLOUDINARY_API_SECRET=your_secret \
  ai-mentor-backend
```

Health check → `GET /actuator/health`

---

## Project Structure

```
src/main/java/com/aimentor/
├── config/        AiConfig, SecurityConfig, JwtProperties, CloudinaryConfig
├── controller/    AuthController, MentorController, UserController
├── service/       AiMentorService, AuthService, SessionService, UserService
├── entity/        User, MentorSession, AuditLog
├── filter/        JwtAuthFilter, RateLimitFilter, SecurityHeadersFilter
├── dto/           Request and response DTOs
├── repository/    Spring Data JPA interfaces
└── exception/     GlobalExceptionHandler + custom exceptions
```

---

> Built with 2 years of hands-on experience · Java 21 · Spring Boot 3.5 · Spring AI 1.0.0
