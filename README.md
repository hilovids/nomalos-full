# Nomalos — Fullstack Overview

This repository contains the Nomalos web application (client + server). This README provides a concise but complete rundown of the code layout, responsibilities, how to run the app locally, and where to look for key functionality.

---

## Repo layout

- `/client` — Next.js React application (UI)
  - `src/app` — route-based pages (tournaments, leaderboard, game, profile, find-game, etc.)
  - `components` — shared UI pieces (Card, NavBar, badgesBox, profileView, etc.)
  - `lib/socket.ts` — Socket.IO client wrapper
  - `.next`, `public`, `static` — build / static assets
- `/server` — Express + Socket.IO API server
  - `index.ts` — app entry, Socket.IO setup, cron jobs, route wiring
  - `api/` — express routers: game.ts, user.ts, friend.ts, request.ts, gameRequest.ts, tournament.ts, badge.ts, health.ts
  - `database/` — DB access helpers & collections (mongodb.ts, games.ts, gameRequests.ts, users.ts, tournament.ts, etc.)
  - `nomalos/` — domain models & services (game, match, tournament, badge, user, gameService)
  - `middleware/` — auth helpers (jwt)
  - `utils/` — utilities (elo, tournamentUtils, encoding)
  - `public/` — static assets served by server if any

---

## Quick start (local)

Prereqs: Node.js (16+), npm, MongoDB instance.

1. Clone repo
2. Server
   - cd server
   - copy `.env.template` → `.env` and set variables (see below)
   - npm install
   - npm run dev (or npm start depending on scripts)
3. Client
   - cd client
   - copy `.env` from `.env.template` if provided and set `NEXT_PUBLIC_API_URL` to server API URL
   - npm install
   - npm run dev

Example Windows commands:
```powershell
cd c:\Users\davis\Desktop\nomalos-full\server
copy .env.template .env
# edit .env
npm install
npm run dev

cd ..\client
copy .env.example .env
# edit client .env (NEXT_PUBLIC_API_URL)
npm install
npm run dev
```

---

## Important environment variables

Server (`server/.env`):
- MONGO_URI — MongoDB connection string
- PORT — server port (default 5000)
- JWT_SECRET — JWT signing secret used by authenticate middleware
- CORS_ORIGIN — allowed origin(s) for CORS (pipe-separated)
- NEXT_PUBLIC_API_URL (for client) — set on client side to point to server

Client (`client/.env`):
- NEXT_PUBLIC_API_URL — e.g. `http://localhost:5000`

Check `.env.template` files for more details.

---

## Server: responsibilities & key places to look

- index.ts
  - Express app bootstrap
  - Socket.IO server initialization and connection handlers
  - Cron jobs (forfeiting inactive games, clearing stale game requests)
  - Wires routers under `/api/*`
- Routers (`server/api/*.ts`)
  - `game.ts` — endpoints to create/play games
  - `user.ts` — user CRUD, profile, ratings
  - `friend.ts` — friend relationships
  - `request.ts` / `gameRequest.ts` — invite/request flows
  - `tournament.ts` — tournament endpoints (list, join, leave, matches, report, award badges)
  - `badge.ts` — badges endpoints
- Database helpers (`server/database/*.ts`)
  - `mongodb.ts` — connection + getDb helper
  - `games.ts`, `gameRequests.ts`, `tournament.ts`, `users.ts` — read/write helpers
- Domain logic (`server/nomalos/*`)
  - Tournament, Match, GameService, ELO calculation, etc.
  - `tournamentUtils.ts` uses `tournament-pairings` to generate Swiss pairings
- Concurrency & updates
  - Tournament documents hold `players` / `matches` / `results`. Heavy subdocuments (matches) are stored in a separate `Matches` collection to avoid extremely large single documents and to ease updates.
  - Cron jobs and Socket.IO are used to notify users of updates (e.g. match created, game_over, participants update).

---

## Client: responsibilities & key places to look

- Next.js app with client and server rendering where appropriate.
- Pages of interest (`client/src/app/*`)
  - `/tournaments` — listing page (open / active / finished)
  - `/tournaments/[tournamentId]` — tournament detail page (join/leave, participants, pairings, results)
  - `/find-game` — quick matchmaking
  - `/game/[id]` — live game UI (socket-driven)
  - `/profile/[profileId]` — public profile and ratings
  - `/leaderboard` — standings
- Components (`client/components/*`)
  - `card.tsx` — layout card used across pages
  - `profileView.tsx`, `badgesBox.tsx`, `navBar.tsx`, `notificationBanner.tsx`
- Socket client: `src/lib/socket.ts` provides a getSocket(userId) helper. The client listens and emits events:
  - `online_count`, `game_over`, `tournament_participants_update`, etc.
- State & auth
  - Basic JWT-based auth: token stored in localStorage, sent in API Authorization header.
  - UI highlights the current logged-in user in tournament participants and shows badge if present.

---

## Tournaments specifics

- Model (server/nomalos/tournament.ts) maps to `tournaments` collection. It now uses `tournament-pairings` Player/Match structures:
  - players (Player[]) — id, score, rating, avoid, etc.
  - matches — `Matches` are stored in a `Matches` collection with fields: tournamentId, round, matchNumber, player1, player2, status, winner.
  - results: mapping userId → score (for quick lookups)
  - timing: "short" | "long" — determines which rating to use (shortRating vs longRating)
- Starting a tournament
  - `server/database/tournament.ts:startTournament` transitions `status: upcoming -> active`, computes `totalRounds = ceil(log2(n))`, sets `currentRound = 1`, generates Swiss pairings using `tournament-pairings`, inserts match docs, and notifies participants.
- Scoring
  - `reportMatchVictory` updates the match doc, and atomically updates tournament `results` (scores).
  - `reportAbandonedMatch` marks a match abandoned and assigns a configurable partial score (project uses 0.25 by default).
- Participant updates
  - Join/Leave endpoints update the tournament doc and emit `tournament_participants_update` to clients. Client fetches participants (with username + ratings) and sorts by the appropriate rating.

---

## Database collections

Common collections used:
- `Users` — users, username, id, shortRating/longRating, badges
- `Games` — live or archived games
- `GameRequests` — open game requests / queued invites
- `Matches` — tournament matches (each match is a document)
- `Tournaments` — tournament metadata; large state is split (matches in Matches collection)
- `Badges` — badge definitions and awardedTo lists
- `FriendRequests` — friend/invite state

Index important fields for performance (e.g., `_id`, `tournamentId`, `round`, `participants`).

---

## Notifications & realtime

- Socket.IO used for:
  - Live game events (moves, game_over)
  - Online counts
  - Tournament participants updates
  - Match assignment notifications
- Server emits from routers or DB job logic (make sure `io` instance is available where you emit)

---

## Cron jobs & housekeeping

- Server uses `node-cron` (see `index.ts`) to:
  - Forfeit inactive games (short vs long timing rules)
  - Clear stale game requests (e.g., every 10 minutes)
- Consider using a job queue (Bull, Agenda) if you need durable background jobs or retries.

---

## Testing & deployment notes

- There are no automated tests in the repo by default. Add unit tests for domain logic (ELO, tournament pairing, scoring).
- For production:
  - Ensure MONGO_URI is a managed DB.
  - Use process manager (pm2) or containerization for server.
  - Serve client as static build via Vercel or Next.js server build.
  - Secure JWT secret and set CORS origins.

---

## Developer notes / tips

- Use `tournament-pairings` for Swiss logic; its Player and Match objects are used throughout.
- Keep matches in a separate collection to avoid giant documents and frequent rewrites.
- Use atomic updates (`$set`, `$inc`, `$push`) to avoid race conditions. For competing updates consider a queue or MongoDB transactions for multi-document operations.
- When updating tournament participants/scores, emit socket events to keep UIs in sync.
- Document custom scoring (e.g., 0.25 for abandoned) so users and admins understand behavior.

---

## Where to start reading the code

1. `server/index.ts` — server bootstrap, sockets, cron jobs
2. `server/api/tournament.ts` — tournament REST endpoints and patterns used for other routers
3. `server/database/tournament.ts` — startTournament, match creation, scoring updates
4. `server/nomalos/*` — domain models used by the services
5. `client/src/app/tournaments/*` — tournament listing and detail UI
6. `client/lib/socket.ts` — socket helper used by client components

---