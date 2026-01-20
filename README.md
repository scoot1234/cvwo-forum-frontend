# CVWO Forum Frontend

## Overview

The **CVWO Forum Frontend** is the React web app for the CVWO Forum. It provides the UI for browsing topics, posts, and nested comments, plus login/sign-up and CRUD actions for authenticated users.

- Browse topics → view posts → view comments (with replies)
- Log in / sign up (user is stored in local storage)
- Create topics, posts, and comments
- Edit your own posts/comments
- Delete your own content; **admin/moderator** can delete any posts/comments

---

## Tech Stack

- **React:** React 19
- **Routing / Framework:** React Router (framework build + server rendering)
- **UI Components:** Material UI (MUI) + Emotion
- **Styling:** Tailwind CSS (via `@import "tailwindcss"` in `app/app.css`)
- **HTTP Client:** Axios
- **Build Tooling:** Vite + TypeScript
- **Container (optional):** Docker (multi-stage build)

---

## Project Structure

```text
cvwo-forum-frontend/
├── app/
│   ├── routes.ts                # Route definitions
│   ├── root.tsx                 # App shell (ThemeProvider, fonts, <Outlet/>)
│   ├── theme.ts                 # MUI theme config
│   ├── app.css                  # Global styles + Tailwind import
│   ├── routes/
│   │   ├── home.tsx             # Topics list + search + create topic modal
│   │   ├── login.tsx            # Login page
│   │   ├── signup.tsx           # Sign up page
│   │   ├── posts.tsx            # Posts for a topic + create/edit/delete post
│   │   └── comments.tsx         # Post detail + nested comments + replies
│   └── lib/
│       ├── api/
│       │   ├── client.ts        # Axios instance + error helper
│       │   ├── auth.ts          # /auth/login + /auth/signup + localStorage helpers
│       │   ├── topics.ts        # /topics endpoints
│       │   ├── posts.ts         # /topics/:id/posts + /posts/:id endpoints
│       │   └── comments.ts      # /posts/:id/comments + /comments/:id endpoints
│       └── hooks/
│           └── useAuthUser.ts   # Auth state hook (reads/writes localStorage)
├── public/                      # Static assets (if any)
├── Dockerfile                   # Docker build + run
├── package.json                 # Scripts and dependencies
├── tsconfig.json                # TypeScript config
└── vite.config.*                # Vite config (if present)
```

---

## Routes

These are the main frontend routes:

| Path | Page |
|------|------|
| `/` | Topics home (list/search/create topic) |
| `/login` | Login |
| `/signup` | Sign up |
| `/topics/:topicId` | Posts under a topic |
| `/posts/:postId` | Post detail + comments thread |

---

## Backend API Integration

The frontend calls the backend REST API using Axios. The base URL is configured via an environment variable:

- `VITE_API_BASE_URL` (defaults to `http://localhost:8080`)

### Endpoints used (from the frontend API layer)

**Auth**
- `POST /auth/login`
- `POST /auth/signup`

**Topics**
- `GET /topics`
- `POST /topics`

**Posts**
- `GET /topics/:topicId/posts`
- `POST /topics/:topicId/posts`
- `GET /posts/:postId`
- `PATCH /posts/:postId`
- `DELETE /posts/:postId` (sends `{ userId }` in request body)

**Comments**
- `GET /posts/:postId/comments`
- `POST /posts/:postId/comments` (supports `parentCommentId` for replies)
- `PATCH /comments/:commentId`
- `DELETE /comments/:commentId` (sends `{ userId }` in request body)

---

## Setup

### Prerequisites
- Node.js (Dockerfile uses Node 20)
- A running backend server (by default: `http://localhost:8080`)

### Install

```bash
git clone https://github.com/scoot1234/cvwo-forum-frontend.git
cd cvwo-forum-frontend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Run (Dev)

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Run (Production)

After building:

```bash
npm run start
```

## Notes

- Auth state is stored in `localStorage` (so refresh keeps you logged in).
- Editing is restricted to content owners; deleting also allows **admin/moderator** roles.
- Comments support nested replies using `parentCommentId` and are rendered as a tree.

---
