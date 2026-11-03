# Cortex local development

Cortex uses Neon PostgreSQL, Neon Auth, and the Neon Data API. The Express backend checks access tokens and sends database requests with the user's token. PostgreSQL row-level security controls access to the data.

## Requirements

- Node.js 20 or later.
- pnpm or npm.
- A Neon project with Auth and the Data API enabled.
- A Google Gemini API key for AI features.

## Database setup

Apply the SQL files in `supabase/neon/migrations/` in numerical order to a new Neon database. Enable Neon Auth and the Data API first. The files in `supabase/migrations/` are the historical Supabase migrations; do not apply them to the Neon database. Test migrations on a separate branch before production use.

The original Cortex Supabase database is not available from the configured address. A fresh Neon database has no old accounts, notes, or resources. Restore those records only from a verified backup. Existing password accounts need a new sign-in method or account.

To set up the first administrator, first create the account in Cortex. Connect to the database as its owner and run the following command with that account's email address:

```sql
SELECT public.bootstrap_first_admin(id)
FROM public.profiles
WHERE email = 'admin@example.com';
```

This function works only through a direct database owner connection. It fails if an administrator already exists.

## Backend configuration

Copy `backend/.env.example` to `backend/.env`. Set these Neon values:

- `NEON_AUTH_BASE_URL`: the Neon Auth URL for the database.
- `NEON_AUTH_JWKS_URL`: the Auth URL with `/.well-known/jwks.json` appended.
- `NEON_AUTH_ISSUER`: the origin of the Auth URL, with no database or `/auth` path.
- `NEON_AUTH_AUDIENCE`: the same Auth URL origin.
- `NEON_DATA_API_URL`: the Neon Data API URL, including `/rest/v1`.

Set `FRONTEND_ORIGIN` to the frontend URL. Set `GEMINI_API_KEY` for AI features. Do not commit `.env` files or credentials.

## Frontend configuration

Copy `frontend/.env.example` to `frontend/.env.local`. Set `NEON_AUTH_BASE_URL` to the same Auth URL as the backend. Set `NEON_AUTH_COOKIE_SECRET` to a random secret of at least 32 characters. Set `NEXT_PUBLIC_EXPRESS_API_URL` to the Express backend URL. Configure the optional Google Drive and AI settings when those features are required.

## Run the applications

Start the backend in one terminal:

```bash
cd backend
pnpm install
pnpm dev
```

Start the frontend in another terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

The default backend URL is `http://localhost:4000`. The default frontend URL is `http://localhost:3000`.

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
