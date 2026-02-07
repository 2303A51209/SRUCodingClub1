# SR University Coding Club Platform

A modern, secure, and visually premium web platform for the SR University Coding Club.

## 🚀 Features

- **Role-Based Dashboards**: Admin, Team, and Member dashboards
- **Secure Authentication**: JWT + HttpOnly cookies with refresh token rotation
- **Modern UI/UX**: Glassmorphism, animations, dark/light themes
- **PWA Support**: Offline-capable with service worker
- **Responsive Design**: Mobile-first approach

## 🛠️ Tech Stack

### Frontend
- Vanilla HTML5, CSS3, JavaScript (ES Modules)
- CSS Custom Properties for theming
- No heavy frameworks

### Backend
- Node.js + Express
- Supabase (PostgreSQL + Auth)
- JWT authentication

## 📁 Project Structure

```
├── frontend/
│   ├── public/          # Public HTML pages
│   ├── dashboards/      # Role-based dashboard pages
│   ├── css/             # Modular CSS architecture
│   ├── js/              # JavaScript modules
│   ├── assets/          # Static assets
│   └── pwa/             # PWA files
├── backend/
│   └── src/             # Express application
├── database/
│   ├── migrations/      # SQL migrations
│   └── seeds/           # Seed data
└── docs/                # Documentation
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd ALLNEW2
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Run database migrations (in Supabase SQL Editor)
```sql
-- Run each file in database/migrations/ in order
```

5. Start the development server
```bash
npm run dev
```

6. Serve frontend (using Live Server or similar)
```bash
# Open frontend/public/index.html with VS Code Live Server
```

## 🔐 Security Features

- ✅ JWT with refresh token rotation
- ✅ HttpOnly secure cookies
- ✅ Role-Based Access Control (RBAC)
- ✅ Row Level Security (RLS)
- ✅ Rate limiting
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Secure password handling

## 📝 License

MIT License

---

Built with ❤️ by SR University Coding Club
