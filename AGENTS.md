# AGENTS.md

## Cursor Cloud specific instructions

This is the **Focalyt** monorepo (also referenced as MiPie / Mentorry): an education / skilling / career-placement platform.

### Services and how to run them (development)

| Service | Directory | Dev command | Port | Notes |
|---------|-----------|-------------|------|-------|
| MongoDB | (system) | `mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017` | 27017 | Required. Backend calls `process.exit(1)` if it cannot connect. |
| Backend API | `backend/` | `npm start` (nodemon `mmt.js`) | 8080 (`MIPIE_PORT`) | Express + Socket.io + EJS admin (`/admin`) + in-process cron schedulers. |
| Frontend SPA | `frontend/` | `npm start` (Create React App) | 3000 | Reads backend URL from `REACT_APP_MIPIE_BACKEND_URL`. |
| Android app | `androidApp/` | `npm start` / `npm run android` | 8081 (Metro) | React Native; needs an emulator/device. Not set up in the cloud VM. |

Root convenience: `npm start` at the repo root runs backend + frontend together via `concurrently`.

### Non-obvious setup / run caveats

- **`npm install` must use `--legacy-peer-deps` in `backend/` and `frontend/`.** The backend has an intentional peer-dependency conflict (`mongoose-auto-increment` pins `mongoose@^4` while the project uses `mongoose@8`). A plain `npm install` fails with `ERESOLVE`. The root `package.json` installs fine without the flag. This is handled by the startup update script.
- **Environment files are gitignored and must exist locally.** `backend/.env` and `frontend/.env` are required. Minimum working values for local dev:
  - `backend/.env`: `MIPIE_MONGODB_URI=mongodb://127.0.0.1:27017/mmt`, `MIPIE_PORT=8080`, `COOKIE_SECRET=...`, `MIPIE_JWT_SECRET=...`, `STORAGE_TYPE=local`, `BASE_URL=http://localhost:8080`.
  - `frontend/.env`: `REACT_APP_MIPIE_BACKEND_URL=http://localhost:8080`, `REACT_APP_WEBSOCKET_URL=http://localhost:8080`.
- **The database starts empty.** The `backend npm run seed` command is a no-op (`seed/index.js` is fully commented out). Create test data through the app or the API.
- **OTP flows require MSG91 (external SMS) and do not work offline.** All `send-otp` style endpoints call MSG91 and will error without credentials/network. However, OTP *verification* accepts the hardcoded test OTP `"2025"` (dev bypass). Because the send step still fails, the UI signup/OTP-login screens cannot complete in the cloud VM.
  - **Reliable local auth path:** the institute (college) `POST /college/register` and `POST /college/login` endpoints are pure password flows (no OTP) and work fully offline. Valid `College.type` enum values: `School`, `College`, `Computer Center`, `University`, `Private University`. Register email must have a real TLD (Joi `.email()` rejects e.g. `.test`).
- **Uploads:** with `STORAGE_TYPE=local`, files are written under `backend/public/upload` (auto-created). AWS S3 is only used in production.
- **Storage/AI/WhatsApp/Razorpay/Google integrations are optional** and gate specific features; core login/CRUD works without them.

### Lint / test / build

- Backend lint: `cd backend && npm run lint` runs, but reports tens of thousands of pre-existing violations because the pinned ESLint 5 config predates modern syntax (optional chaining) used in the code. Treat existing noise as the baseline.
- Frontend lint: runs automatically via `react-scripts` during `npm start` / `npm run build` (warnings only).
- Automated tests: there are effectively none. Backend has no Jest test files. The frontend has only the default CRA `App.test.js`, which currently fails on an axios ESM transform issue (pre-existing). Validate changes by running the app end to end.
- Backend has no build step (`npm run build` just echoes). Frontend production build: `cd frontend && npm run build`.
