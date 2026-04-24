# 🚀 CodeBoard – DevOps-Driven Developer Analytics Platform

![CodeBoard](https://img.shields.io/badge/CodeBoard-Developer%20Analytics-6366f1?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestrated-326CE5?style=for-the-badge&logo=kubernetes)
![CI/CD](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?style=for-the-badge&logo=githubactions)

CodeBoard is a full-stack, DevOps-enabled platform designed to track and visualize developers' coding activity across **GitHub** and **LeetCode**. It provides a unified dashboard where users can monitor progress, analyze performance trends, and maintain coding consistency.

## 🏗️ Architecture

```
Frontend (React + Vite)
        ↓ REST API
Backend API (Node.js + Express)
        ↓ SQL Queries
Database (PostgreSQL)
        ↑ Inserts data
Worker Service (Cron-scheduled fetcher)
        ↓ Fetches from
GitHub API + LeetCode GraphQL API
```

## 📁 Project Structure

```
CodeBoard/
├── frontend/              # React + Vite dashboard
│   ├── src/
│   │   ├── components/    # Layout, reusable UI
│   │   ├── pages/         # Dashboard, GitHub, LeetCode, Settings
│   │   ├── api.js         # API client
│   │   ├── AuthContext.jsx # Auth state management
│   │   └── index.css      # Design system
│   ├── Dockerfile         # Multi-stage (build + Nginx)
│   └── nginx.conf         # SPA routing + API proxy
│
├── backend/               # Express REST API
│   ├── src/
│   │   ├── config/        # Environment config
│   │   ├── db/            # PostgreSQL connection + migrations
│   │   ├── middleware/    # JWT auth middleware
│   │   ├── routes/        # Auth + Analytics routes
│   │   └── index.js       # Express server
│   └── Dockerfile
│
├── worker/                # Background data fetcher
│   ├── src/
│   │   ├── githubFetcher.js   # GitHub REST API v3
│   │   ├── leetcodeFetcher.js # LeetCode GraphQL API
│   │   ├── db.js              # DB connection
│   │   └── index.js           # Cron scheduler
│   └── Dockerfile
│
├── k8s/                   # Kubernetes manifests
│   ├── namespace.yml
│   ├── configmap.yml
│   ├── secrets.yml
│   ├── postgres.yml       # DB + PVC + Service
│   ├── backend.yml        # 2 replicas + health checks
│   ├── worker.yml         # 1 replica (cron jobs)
│   └── frontend.yml       # 2 replicas + LoadBalancer
│
├── .github/workflows/
│   ├── ci.yml             # Lint, test, build on push/PR
│   └── cd.yml             # Build & push Docker images
│
├── docker-compose.yml     # Local development (all services)
└── README.md
```

## 🔑 APIs Used

| Platform | API | Endpoint | Auth Required |
|----------|-----|----------|---------------|
| **GitHub** | REST API v3 | `api.github.com` | Optional (token for higher rate limits) |
| **GitHub** | Contributions API | `github-contributions-api.jogruber.de` | None |
| **LeetCode** | GraphQL API | `leetcode.com/graphql` | None (public profiles) |

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/codeboard.git
cd codeboard

# Start all services
docker-compose up --build

# Access the app
# Frontend: http://localhost
# Backend API: http://localhost:5000
# Database: localhost:5432
```

### Option 2: Local Development

```bash
# 1. Start PostgreSQL (must be running on port 5432)

# 2. Backend
cd backend
cp .env.example .env    # Edit with your settings
npm install
npm run migrate         # Create database tables
npm run dev             # Starts on port 5000

# 3. Worker (in another terminal)
cd worker
npm install
npm run dev             # Starts cron jobs

# 4. Frontend (in another terminal)
cd frontend
npm install
npm run dev             # Starts on port 5173
```

## 🐳 Where Docker is Used

| File | Purpose |
|------|---------|
| `frontend/Dockerfile` | Multi-stage build: Node.js builds React → Nginx serves static files |
| `backend/Dockerfile` | Runs Node.js API server with production dependencies |
| `worker/Dockerfile` | Runs background data fetcher service |
| `docker-compose.yml` | Orchestrates all 4 containers (frontend, backend, worker, postgres) |

## ⚙️ Where GitHub Actions is Used

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/ci.yml` | Every push/PR | Lints code, runs tests, builds Docker images |
| `.github/workflows/cd.yml` | Push to `main` | Builds & pushes images to GitHub Container Registry |

## ☸️ Where Kubernetes is Used

| Manifest | Purpose |
|----------|---------|
| `k8s/namespace.yml` | Isolated namespace for CodeBoard |
| `k8s/configmap.yml` | Non-sensitive configuration (DB host, port, etc.) |
| `k8s/secrets.yml` | Sensitive data (DB password, JWT secret, API tokens) |
| `k8s/postgres.yml` | PostgreSQL with PersistentVolumeClaim |
| `k8s/backend.yml` | 2-replica API server with health checks |
| `k8s/worker.yml` | Single replica background worker |
| `k8s/frontend.yml` | 2-replica Nginx with LoadBalancer service |

### Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/postgres.yml
kubectl apply -f k8s/backend.yml
kubectl apply -f k8s/worker.yml
kubectl apply -f k8s/frontend.yml

# Check status
kubectl get pods -n codeboard
kubectl get services -n codeboard
```

## 📊 Features

- 📊 **Unified Dashboard** — GitHub + LeetCode in one view
- 🔄 **Auto Data Fetching** — Worker runs every 6 hours
- 📈 **Visual Analytics** — Charts, rings, streaks, language bars
- 🔐 **JWT Authentication** — Secure API with token-based auth
- 🐳 **Containerized** — Every service has its own Docker image
- ⚙️ **CI/CD Pipeline** — Automated lint → test → build → push
- ☸️ **Kubernetes Ready** — Full manifests for cloud deployment
- 📱 **Responsive** — Works on desktop and mobile

## 🔐 Environment Variables
<h3>Atharva</h3>
<p>
Frontend Developer<br>
Backend Developer
</p>

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_NAME` | Database name | `codeboard` |
| `DB_USER` | Database user | `codeboard_user` |
| `DB_PASSWORD` | Database password | `codeboard_pass` |
| `JWT_SECRET` | JWT signing secret | — |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |

### Worker (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub PAT (optional, for higher API limits) | — |
| `FETCH_CRON` | Cron schedule for data fetching | `0 */6 * * *` |

## 📄 License

MIT License
