# Cortex — Local Development & Running Guide

This guide explains how to spin up the Cortex workspace locally. The system is designed to connect directly to the remote Supabase database, allowing you to run the frontend, backend, and extensions locally without setting up a local database or pgvector instances.

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
* **Node.js** (v20 or higher recommended)
* **pnpm** (recommended for monorepo development, though `npm` or `yarn` work too)
* **Google Chrome** (for testing the Manifest V3 Extension)
* **GNOME Shell** (for testing the GNOME status widget, optional Linux only)

---

## ⚙️ Environment Setup

Before running the services, you must configure local environment variables pointing to the remote Supabase project.

### 1. Backend Configuration
1. Go to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Open `backend/.env` and fill in the values pointing to your remote project:
   ```env
   PORT=4000
   SUPABASE_URL=https://your-remote-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-remote-service-role-key-jwt
   SUPABASE_ANON_KEY=your-remote-anon-key-jwt
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-remote-anon-key-jwt
   FRONTEND_ORIGIN=http://localhost:3000
   GEMINI_API_KEY=your-google-gemini-api-key
   GEMINI_MODEL=gemini-flash-latest
   ```

### 2. Frontend Configuration
1. Go to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Open `frontend/.env.local` and configure the remote database endpoints and API URLs:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-remote-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-remote-anon-key-jwt
   SUPABASE_SERVICE_ROLE_KEY=your-remote-service-role-key-jwt
   GOOGLE_DRIVE_API_KEY=your-google-drive-api-key-optional
   EXPRESS_API_URL=http://localhost:4000
   NEXT_PUBLIC_EXPRESS_API_URL=http://localhost:4000
   ```

---

## 🚀 Running Frontend & Backend

There are two ways to spin up the servers:

### Option A: Running Both Simultaneously (Recommended)
We provide a helper script at the repository root that starts both the backend and frontend in a single shell session.

1. Ensure the script is executable:
   ```bash
   chmod +x ./bin/dev
   ```
2. Run the script:
   ```bash
   ./bin/dev
   ```
*This starts the backend on port `4000` and the frontend on port `3000` concurrently.*

---

### Option B: Running Separately

#### 1. Backend Server
1. Navigate to `/backend` and install dependencies:
   ```bash
   cd backend
   npm install # or pnpm install
   ```
2. Run the development server (runs `tsx watch` to auto-reload on changes):
   ```bash
   npm run dev # or pnpm dev
   ```
   *The backend will be available at `http://localhost:4000`.*

#### 2. Frontend App
1. Navigate to `/frontend` and install dependencies:
   ```bash
   cd frontend
   npm install # or pnpm install
   ```
2. Run the Next.js development server:
   ```bash
   npm run dev # or pnpm dev
   ```
   *The frontend client will be available at `http://localhost:3000`.*

---

## 🧩 Running the Chrome MV3 Extension

The Chrome extension monitors active tabs, blocks distracting domains, and syncs Pomodoro study timers with the local backend.

### 1. Build the Extension
1. Go to the `extension/` directory:
   ```bash
   cd extension
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the compiler in development mode (starts `esbuild` with `--watch` to rebuild assets on code changes):
   ```bash
   npm run dev
   ```

### 2. Load the Extension in Chrome
1. Open Google Chrome.
2. In the URL bar, go to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the entire `/extension` directory in the file browser.
6. The extension is now active and will sync with your running local frontend/backend!

---

## 🐧 Running the GNOME Shell Applet (Linux Only)

The GNOME extension resides in your status bar to display Pomodoro focus session minutes.

### 1. Install the Extension
Symlink or copy the `gnome-extension/` directory to your local GNOME extensions path using its UUID `tamatem@frey.dev`:

```bash
mkdir -p ~/.local/share/gnome-shell/extensions/
ln -s "$(pwd)/gnome-extension" ~/.local/share/gnome-shell/extensions/tamatem@frey.dev
```

### 2. Enable the Extension
Enable it using the command-line utility:
```bash
gnome-extensions enable tamatem@frey.dev
```
*(Alternatively, you can manage and enable it using the **Extensions** graphical app in GNOME).*

### 3. Development & Reloading
If you make changes to `gnome-extension/extension.js` or `stylesheet.css`, reload the extension:
* **GNOME 45+:** Go to the developer settings panel in the extension popup and click the **Reload Extension** button.
* **X11 Session (Older GNOME):** Press `Alt + F2`, type `r`, and hit `Enter` to restart GNOME Shell.
