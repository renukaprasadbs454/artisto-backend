Render / Production environment variables and instructions

Use this file as a copy/paste reference when configuring the Render service's Environment settings.

Required (minimum for server to start):
- NODE_ENV=production
- PORT=4000
- DATABASE_URL=<postgres-connection-string>
- JWT_ACCESS_SECRET=<long-random-secret> OR JWT_ACCESS_PRIVATE_KEY and JWT_ACCESS_PUBLIC_KEY (for RSA)
- JWT_REFRESH_SECRET=<long-random-secret>
- FRONTEND_URL=https://<your-frontend-domain>
- REFRESH_COOKIE_SAMESITE=none

Recommended / Optional:
- VITE_API_URL=https://<your-backend-domain>/api/v1
- VITE_WS_URL=wss://<your-backend-domain> (or https:// if using http polling)
- TMDB_API_KEY=<tmdb-key>
- SUPABASE_URL=<supabase-url>
- SUPABASE_KEY=<supabase-service-key>
- SUPABASE_STORAGE_BUCKET=artisto-uploads
- RAZORPAY_KEY_ID=<razorpay-key-id>
- RAZORPAY_KEY_SECRET=<razorpay-secret>
- MASTER_ADMIN_KEY=<master-admin-key-for-scripts>
- ARGON_TIME=3
- ARGON_MEMORY=65536
- ARGON_PARALLELISM=1
- ACCESS_TOKEN_EXPIRY=15m
- PASSWORD_RESET_TOKEN_EXPIRY=15m
- REFRESH_TOKEN_EXPIRY_MS=2592000000

Render-specific notes
- Do NOT commit `.env` to the repo. Use Render's Environment tab to set production values.
- For RSA private/public keys, Render's UI supports multiline values but some UIs require you to replace newlines with "\\n". If you must paste a single-line escaped key, ensure the server code calls `.replace(/\\n/g, '\n')` (already handled in this repo).
- Example Render Build & Start (when not using Dockerfile):
  - Build command: `npm ci && npx prisma generate && npm run build`
  - Start command: `npm run migrate:prod && npm run start`

Applying changes locally
1. Copy `backend/.env.example` to `backend/.env` and fill in values for local development.
2. Never git-add the `.env` file:
```bash
cd backend
git rm --cached .env || true
echo ".env" >> .gitignore
``` 
3. Push only the `.env.example` and other non-secret files to GitHub. Configure production secrets in Render.

Running Prisma migrations on Render
- After adding `DATABASE_URL` in Render, either:
  - Run migrations from Render Shell:
    ```bash
    cd backend
    npx prisma migrate deploy
    npx prisma db seed   # optional
    ```
  - Or allow the Start command to run `npm run migrate:prod` before starting the server (we recommend manual run first to inspect output).

If you want, I can:
- Create the sanitized `.env.example` (done), and
- Remove any accidentally committed `.env` from the git history (requires force-push; I can prepare commands and you should confirm), or
- Walk you through setting each Render env var now.
