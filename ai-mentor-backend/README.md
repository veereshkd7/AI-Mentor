# AI Mentor — Spring Boot Backend

Spring Boot 3.2 · Java 17 · H2 (dev) / PostgreSQL (prod)

## Prerequisites
- Java 17+ installed  (`java -version`)
- Maven 3.9+ **or** use the included `./mvnw` wrapper (no install needed)

## Quick Start

### Step 1 — Set environment variables

**Linux / macOS**
```bash
export ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxx
export JWT_SECRET=your-random-secret-at-least-32-chars
```

**Windows (Command Prompt)**
```cmd
set ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxx
set JWT_SECRET=your-random-secret-at-least-32-chars
```

**Windows (PowerShell)**
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxx"
$env:JWT_SECRET="your-random-secret-at-least-32-chars"
```

### Step 2 — Run

```bash
# Using Maven Wrapper (recommended — no Maven install needed)
./mvnw spring-boot:run

# OR using system Maven
mvn spring-boot:run
```

### Step 3 — Open in browser

| URL | Description |
|-----|-------------|
| http://localhost:8080/swagger-ui.html | Interactive API docs |
| http://localhost:8080/actuator/health | Health check |
| http://localhost:8080/h2-console      | H2 DB console (dev only) |

> **H2 Console settings:**
> - JDBC URL: `jdbc:h2:mem:aimentordb`
> - Username: `sa`
> - Password: *(leave blank)*

---

## Project Structure

```
backend/
├── pom.xml                                  Maven dependencies
├── mvnw                                     Maven wrapper (run without Maven install)
├── .env.example                             Environment variable template
├── Dockerfile                               Production Docker image
└── src/main/
    ├── resources/
    │   └── application.yml                  All configuration
    └── java/com/aimentor/
        ├── AiMentorApplication.java         Entry point
        ├── config/
        │   ├── SecurityConfig.java          Spring Security (CORS, JWT, filters)
        │   ├── JwtProperties.java           JWT config binding
        │   ├── AnthropicProperties.java     Anthropic API config binding
        │   └── OpenApiConfig.java           Swagger / OpenAPI setup
        ├── controller/
        │   ├── AuthController.java          POST /api/v1/auth/*
        │   └── MentorController.java        POST /api/v1/mentor/*
        ├── dto/
        │   ├── request/                     Validated request bodies
        │   └── response/                    API response shapes
        ├── entity/
        │   ├── User.java                    User (implements UserDetails)
        │   ├── MentorSession.java           Saved AI sessions
        │   ├── AuditLog.java                Security event log
        │   └── enums/SessionType.java
        ├── exception/
        │   └── GlobalExceptionHandler.java  Consistent error responses
        ├── filter/
        │   ├── JwtAuthFilter.java           Validates Bearer token
        │   ├── RateLimitFilter.java         Per-IP Bucket4j rate limiting
        │   └── SecurityHeadersFilter.java   CSP, nosniff, etc.
        ├── repository/                      Spring Data JPA repos
        ├── security/
        │   └── UserDetailsServiceImpl.java
        ├── service/
        │   ├── AuthService.java             Register / login / refresh / logout
        │   ├── AiMentorService.java         Builds prompts, calls Anthropic API
        │   ├── SessionService.java          History CRUD
        │   ├── AuditService.java            Async audit logging + cleanup
        │   └── InputSanitizationService.java XSS / injection prevention
        └── util/
            └── JwtUtil.java                 HS512 JWT generation & validation
```

---

## API Endpoints

### Authentication (public)
| Method | Path | Body |
|--------|------|------|
| POST | `/api/v1/auth/register` | `{ username, email, password }` |
| POST | `/api/v1/auth/login`    | `{ username, password }` |
| POST | `/api/v1/auth/refresh`  | `{ refreshToken }` |
| POST | `/api/v1/auth/logout`   | — (JWT header) |

### AI Mentor (JWT required — `Authorization: Bearer <token>`)
| Method | Path | Body |
|--------|------|------|
| POST | `/api/v1/mentor/roadmap`   | `{ topic, level }` |
| POST | `/api/v1/mentor/explain`   | `{ topic, level }` |
| POST | `/api/v1/mentor/interview` | `{ topic, level, questionCount }` |
| POST | `/api/v1/mentor/quiz`      | `{ topic, level, questionCount }` |
| GET  | `/api/v1/mentor/history`   | — |
| GET  | `/api/v1/mentor/history/{id}` | — |
| DELETE | `/api/v1/mentor/history/{id}` | — |

---

## Switch to PostgreSQL (Production)

In `src/main/resources/application.yml`, comment out the H2 block and uncomment the PostgreSQL block:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/aimentordb
    username: ${DB_USER}
    password: ${DB_PASSWORD}
```

Then set `DB_USER` and `DB_PASSWORD` as environment variables.

---

## Security Layers
1. HTTPS + HSTS headers
2. Content Security Policy (CSP)
3. CORS whitelist
4. Rate limiting — 60 general / 10 AI / 10 auth requests per minute per IP
5. JWT HS512 — 15-min access token, 7-day refresh token
6. `@PreAuthorize` method-level authorization
7. Input sanitization — XSS, SQL injection, prompt injection
8. Account lockout — 5 failed logins → 30-min lock
9. Async audit logging — every security event recorded
