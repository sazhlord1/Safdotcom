# Microwave Queue Manager - Telegram Mini App

A production-ready Telegram Mini App for managing a shared microwave queue inside a company. Built with React, TypeScript, TailwindCSS, Node.js, Express, PostgreSQL, Prisma, Socket.io, and the Telegram Mini App SDK.

## Features

- **Automatic Telegram Authentication** - Users are authenticated via Telegram with profile photo, name, and username display
- **Real-time Queue Management** - Socket.io powered live updates without page refresh
- **Smart Queue Timing** - Queue open 12:00-12:45 PM, 3-minute heating per person, live ETA calculation
- **Active User Countdown** - Animated circular countdown visible to all users
- **Queue Swap System** - Publish swap offers, request swaps, accept/reject with smooth animations
- **Admin Panel** - Dashboard with stats, logs, user management, queue controls, CSV export
- **Premium UI** - Telegram-native theme integration, dark/light mode, RTL support, Persian text
- **Smooth Animations** - Framer Motion powered transitions and queue reordering
- **Docker Ready** - One-command deployment with Docker Compose

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, TailwindCSS, Vite |
| UI | Framer Motion, Telegram Mini App SDK |
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL, Prisma ORM |
| Auth | Telegram initData HMAC-SHA256 validation, JWT |
| Deploy | Docker, Docker Compose |

## Project Structure

```
microwave-queue/
├── docker-compose.yml          # PostgreSQL + Server containers
├── .env.example                # Environment variables template
├── package.json                # Root workspace scripts
├── README.md
├── server/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (User, QueueEntry, SwapOffer, AuditLog)
│   └── src/
│       ├── index.ts             # Express + Socket.io entry point
│       ├── config.ts            # Environment configuration
│       ├── seed.ts              # Database seed script
│       ├── prisma/client.ts     # Prisma client singleton
│       ├── types/index.ts       # TypeScript interfaces
│       ├── middleware/
│       │   ├── auth.ts          # JWT + admin middleware
│       ├── routes/
│       │   ├── auth.ts          # POST /api/auth/validate
│       │   ├── queue.ts         # GET /api/queue/today, POST join/complete/leave
│       │   ├── swap.ts          # POST swap offer/request/respond
│       │   └── admin.ts         # Admin dashboard, logs, controls
│       ├── services/
│       │   ├── auth.service.ts  # Telegram initData validation + JWT
│       │   ├── queue.service.ts # Queue business logic
│       │   ├── swap.service.ts  # Swap system logic
│       │   └── admin.service.ts # Admin stats + controls
│       └── socket/
│           ├── index.ts         # Socket.io server setup
│           └── events.ts        # Event name constants
├── client/
│   ├── index.html               # RTL HTML with Telegram SDK + Vazirmatn font
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx              # Main app with auth + routing
│       ├── config.ts
│       ├── styles/globals.css   # TailwindCSS + Telegram CSS vars + RTL
│       ├── locales/fa.ts        # Persian translations
│       ├── api/
│       │   ├── client.ts        # Axios instance with auth
│       │   └── types.ts         # API response types
│       ├── hooks/
│       │   ├── useAuth.ts       # Auth state + Telegram login
│       │   ├── useQueue.ts      # Queue data + Socket.io
│       │   └── useSocket.ts     # Socket.io connection
│       ├── components/
│       │   ├── ui/              # Avatar, Button, Badge, Modal, Toast, Spinner
│       │   ├── queue/           # QueueCard, QueueList, QueueStatus, ActiveUserCard, CountdownTimer
│       │   ├── swap/            # SwapOfferCard, SwapOfferForm, SwapPopup
│       │   └── admin/           # AdminDashboard, AdminLogs, AdminControls
│       └── pages/
│           ├── Dashboard.tsx    # Main queue view
│           ├── AdminPage.tsx    # Admin panel with tabs
│           └── LoginPage.tsx    # Telegram login
```

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- A Telegram Bot (create via [@BotFather](https://t.me/BotFather))

## Quick Start

### 1. Clone & Configure

```bash
cp .env.example .env
# Edit .env and add your Telegram Bot Token from @BotFather
```

### 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 3. Setup Database

```bash
cd server
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 4. Start Development Servers

```bash
npm install
npm run dev
```

This starts both:
- **Server**: http://localhost:3001
- **Client**: http://localhost:5173

### 5. Configure Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Use `/mybots` > Select your bot > Bot Settings > Configure Mini App
3. Set the Mini App URL to your deployed URL (or use ngrok for testing)
4. Add a Menu Button pointing to your Mini App

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/validate` | Validate Telegram initData, returns JWT |
| GET | `/api/auth/me` | Get current user profile |

### Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queue/today` | Get today's queue with positions, ETAs |
| POST | `/api/queue/join` | Join the queue |
| POST | `/api/queue/complete` | Mark food as heated |
| POST | `/api/queue/leave` | Leave the queue |

### Swap

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/swap/offer` | Create swap offer `{ message }` |
| POST | `/api/swap/offer/cancel` | Cancel offer `{ offerId }` |
| POST | `/api/swap/request` | Request swap `{ offerId }` |
| POST | `/api/swap/respond` | Accept/reject `{ requestId, accepted }` |

### Admin (requires admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| POST | `/api/admin/remove-user` | Remove user `{ targetUserId }` |
| POST | `/api/admin/reorder` | Reorder queue `{ orderedIds }` |
| POST | `/api/admin/reset` | Reset today's queue |
| GET | `/api/admin/logs` | Audit logs (paginated) |
| GET | `/api/admin/export` | Export logs as CSV |

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `queue:subscribe` | Client → Server | Subscribe to queue updates |
| `queue:unsubscribe` | Client → Server | Unsubscribe |
| `queue:updated` | Server → Client | Full queue state update |
| `queue:timer` | Server → Client | Active user countdown tick |
| `swap:new-offer` | Server → Client | New swap offer published |
| `swap:request-received` | Server → Client | Swap request received |

## Database Schema

### User
- `telegramId` (unique), `firstName`, `lastName`, `username`, `photoUrl`, `isAdmin`

### QueueEntry
- `queueDate`, `position`, `status` (WAITING/ACTIVE/COMPLETED/LEFT), timestamps

### SwapOffer
- `message`, `status` (PENDING/ACCEPTED/REJECTED/CANCELLED)

### SwapRequest
- `status` (PENDING/ACCEPTED/REJECTED), linked to offer + requester

### AuditLog
- `action`, `details` (JSON), linked to user

## Business Rules

- Queue opens at **12:00 PM**, closes at **12:45 PM** (no new joins after)
- Each employee can join only **once** per day
- Each person takes exactly **3 minutes** to heat food
- Active user shows **"in heating food"** status with live countdown
- When a user completes, the next person is **automatically activated**
- Swap offers are visible below queue cards; users behind can request swaps
- All queue changes broadcast to all connected clients in real-time

## Production Deployment

### Environment Variables

```env
BOT_TOKEN=your_telegram_bot_token
JWT_SECRET=a_strong_random_secret
DATABASE_URL=postgresql://user:pass@host:5432/microwave_queue
CLIENT_URL=https://your-domain.com
```

### Build & Deploy

```bash
# Build client for production
cd client && npm run build

# The built files can be served by the server or a CDN
# Server serves API + Socket.io on PORT
```

### Docker Full Stack

```bash
docker compose up -d
```

## License

MIT
