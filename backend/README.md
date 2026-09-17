# DevTrack Backend API

Production-ready, modular REST API server for DevTrack — Developer Analytics & GitHub Activity Platform.

---

## 📁 Architecture & Directory Structure

```text
backend/
│
├── src/
│   │
│   ├── server.js                  # Express app entrypoint & configuration
│   │
│   ├── config/
│   │   ├── database.js            # PostgreSQL connection pool & automatic migration (with in-memory fallback)
│   │   └── github.js              # GitHub OAuth & API configurations
│   │
│   ├── routes/
│   │   ├── auth.routes.js         # OAuth login, callback, /me, demo, logout
│   │   ├── user.routes.js         # User profile and stats
│   │   ├── repository.routes.js   # Repositories, details, commits, PRs, issues, sync
│   │   ├── activity.routes.js     # Activity feed, weekly commits, heatmap
│   │   └── analytics.routes.js    # Dashboard aggregations, languages, rankings, PR/issue rates
│   │
│   ├── controllers/
│   │   ├── auth.controller.js     # Authentication flow controllers
│   │   ├── user.controller.js     # User profile handlers
│   │   ├── repository.controller.js # Repository & sync handlers
│   │   ├── activity.controller.js # Activity and heatmap handlers
│   │   └── analytics.controller.js# Analytics metrics handlers
│   │
│   ├── services/
│   │   ├── github.service.js      # GitHub REST API client & token exchange
│   │   ├── repository.service.js  # Repository business logic & sync engine
│   │   ├── activity.service.js    # Activity stream & weekly processor
│   │   └── analytics.service.js   # Developer Activity Score algorithm & metrics aggregator
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT verification, cookie parsing, demo fallback
│   │   ├── error.middleware.js    # Centralized error handler & 404 catcher
│   │   └── rateLimit.middleware.js# Express rate limiter (API & Auth)
│   │
│   ├── models/
│   │   ├── user.model.js          # Users schema & CRUD queries
│   │   ├── repository.model.js    # Repositories schema & queries
│   │   ├── commit.model.js        # Commits schema & queries
│   │   ├── pullRequest.model.js   # Pull requests schema & queries
│   │   └── issue.model.js         # Issues schema & queries
│   │
│   └── utils/
│       ├── github.utils.js        # GitHub payload normalizers & transformers
│       └── analytics.utils.js     # Activity score, percentage calculators, weekly binning
│
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore file
├── package.json                   # Dependencies & scripts
└── README.md                      # Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (Optional: Server automatically falls back to consistent In-Memory Store if Postgres is offline during local dev).

### 2. Installation
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Create or edit `.env`:
```env
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# PostgreSQL Config (optional for offline dev)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/devtrack

# GitHub OAuth App Credentials
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=http://localhost:5001/api/auth/github/callback

# JWT Secret
JWT_SECRET=devtrack_super_secret_jwt_key_2026
```

### 4. Running the Server
```bash
# Development mode with hot-reload (nodemon)
npm run dev

# Production mode
npm start
```

---

## 📡 Complete API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/github` | Redirects to GitHub OAuth login |
| `GET` | `/api/auth/github/callback` | OAuth callback, creates user & issues JWT cookie |
| `POST` | `/api/auth/demo` | Instant demo login without GitHub keys |
| `GET` | `/api/auth/me` | Get currently logged in user profile |
| `POST` | `/api/auth/logout` | Clears auth token and logs out |

### 👤 User (`/api/user`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user` | Get profile info (name, bio, repos count, avatar) |
| `GET` | `/api/user/stats` | Quick summary of total stars, forks, repos |

### 📊 Dashboard (`/api/dashboard`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Clean aggregated payload for the React dashboard with top languages, weekly commits, activity score, and repo highlights |

### 📁 Repositories (`/api/repositories`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/repositories` | List all repositories |
| `POST` | `/api/repositories/sync` | Trigger GitHub API sync to update database |
| `GET` | `/api/repositories/:id` | Detailed repo view (info, commits, PRs, issues, languages) |
| `GET` | `/api/repositories/:id/commits` | Get commits list for a repository |
| `GET` | `/api/repositories/:id/pull-requests` | Get pull requests list for a repository |
| `GET` | `/api/repositories/:id/issues` | Get issues list for a repository |

### ⚡ Activity Stream (`/api/activity`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/activity` | Unified timeline stream of commits, PRs, and issues |
| `GET` | `/api/activity/weekly` | Weekly commit distribution (Mon–Sun) |
| `GET` | `/api/activity/heatmap` | Year-long daily contribution heatmap data |

### 📈 Analytics Engine (`/api/analytics`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics` | Complete analytics overview |
| `GET` | `/api/analytics/languages` | Top programming languages distribution (%) |
| `GET` | `/api/analytics/repositories` | Repository rankings by activity score |
| `GET` | `/api/analytics/pull-requests` | PR counts & merge rate % |
| `GET` | `/api/analytics/issues` | Issue counts & resolution rate % |

---

## 🧮 Developer Activity Score Algorithm

The DevTrack custom algorithm computes a standardized **0–100 Activity Score**:

$$\text{Raw Score} = (\text{Commits} \times 1) + (\text{Merged PRs} \times 3) + (\text{Closed Issues} \times 2)$$

$$\text{Developer Activity Score} = \min\left(100, \text{round}\left(\frac{\text{Raw Score}}{1.2}\right)\right)$$
