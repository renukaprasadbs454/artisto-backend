# Artisto — Freelance Services Marketplace

A modern full-stack freelance services marketplace featuring real-time messaging, secure JWT authentication, and portfolio management.

## 📁 Project Structure

```
artisto-frontend/
├── frontend/                     # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   ├── public/
│   ├── .env                      # Configured for localhost:4000
│   └── package.json
│
├── backend/                      # Express + TypeScript + Prisma + Socket.io + Supabase
│   ├── src/
│   ├── prisma/
│   ├── .env                      # Configured with Supabase DB, Storage & JWT Secrets
│   └── package.json
│
└── Docs & Guides
    ├── 00-prd.md
    ├── 01-system-design.md
    ├── 02-backend-build-guide.md
    └── 03-frontend-build-guide.md
```

---

## 🚀 Getting Started

### 1️⃣ Start the Backend Server (Port `4000`)
In your first terminal window:
```bash
cd backend
npm run dev
```
- **REST API:** `http://localhost:4000/api/v1`
- **WebSockets:** `http://localhost:4000`

---

### 2️⃣ Start the Frontend Application (Port `5173`)
In a second terminal window:
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application!
