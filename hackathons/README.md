# Hackathons Platform

> A standalone hackathon management system for SR University Coding Club

## Overview

This is a **completely standalone application** that manages hackathons. It shares visual DNA with the main SR Coding Club project but has:

- ✅ Own backend (Express.js on port 3001)
- ✅ Own database (Separate Supabase project)
- ✅ Own authentication (Hidden admin login)
- ✅ Own frontend (Static HTML/CSS/JS)

## Quick Start

```bash
# Install dependencies
cd hackathons
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Supabase and SMTP credentials

# Start the server
npm start
```

## Structure

```
hackathons/
├── backend/          # Express.js API server
├── frontend/         # Static HTML, CSS, JS
├── database/         # SQL schemas and migrations
└── package.json      # Root dependencies
```

## Public Pages

| Page | URL | Description |
|------|-----|-------------|
| Index | `/hackathons/` | List all hackathons |
| Details | `/hackathons/hackathon.html?id=xxx` | Single hackathon view |
| Register | `/hackathons/register.html?hackathon=xxx` | Team registration |

## Admin Access

Admin login is accessible **only via direct URL**:
```
/hackathons/admin/login
```

No login links are visible on public pages.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JS
- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL + Auth)
- **Email:** Supabase SMTP (system) + Gmail SMTP (bulk)
