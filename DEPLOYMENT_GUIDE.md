# Cloudflare Deployment Guide
### Fast Static Assets Deployment for Lighthouse School Visit

Follow these step-by-step instructions to deploy the platform to Cloudflare Pages or Cloudflare Workers Static Assets.

---

## Method 1: Cloudflare Pages (Recommended via Git)

1. **Create a GitHub Repository:**
   - Log into your GitHub account.
   - Create a new public or private repository (e.g. `lighthouse-school-visit` or `school-district`).
   - Push all project files into your repository.

2. **Connect to Cloudflare Pages:**
   - Log into the [Cloudflare Dashboard](https://dash.cloudflare.com).
   - Go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
   - Select your repository.

3. **Configure Build Settings:**
   - **Project name:** `lighthouse-school-visit` (use lowercase letters, numbers, and hyphens only).
   - **Production branch:** `main` (or your default branch).
   - **Framework preset:** `None`.
   - **Build command:** `npm run build` (or `node build.js`).
   - **Build output directory:** `dist`.
   - **Root directory:** `/` (leave as default).

4. **Deploy:**
   - Click **Save and Deploy**.
   - Cloudflare will run `npm run build`, audit all assets in `dist/` (all < 1 MiB), and publish your website in seconds!

---

## Method 2: Cloudflare Workers Static Assets (Direct CLI)

If you prefer using the Wrangler command-line tool:

1. **Install Wrangler (if not already installed):**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare:**
   ```bash
   npx wrangler login
   ```

3. **Run Production Build:**
   ```bash
   npm run build
   ```

4. **Deploy to Workers:**
   ```bash
   npm run deploy
   # OR: npx wrangler deploy
   ```

*The project is pre-configured with `wrangler.toml` pointing strictly to `./dist`, ensuring zero conflicts with `node_modules` or `workerd`.*

---

## Troubleshooting Common Errors

### Error: `Asset exceeds 25 MiB limit`
- **Cause:** Cloudflare assets directory was mistakenly pointed to the root folder `.` containing `node_modules/workerd`.
- **Fix:** Keep `directory = "./dist"` in `wrangler.toml`. Our `build.js` validates that every single file in `dist/` is under 1.0 MiB.

### Error: `Cannot use assets with a binding in an assets-only Worker`
- **Cause:** Adding `binding = "ASSETS"` without a Worker script.
- **Fix:** `wrangler.toml` has no `binding` and no `main` Worker entrypoint.

### Error: `Cloudflare 100324 Infinite Loop`
- **Cause:** Using a `_redirects` file with `/* /index.html 200`.
- **Fix:** Cloudflare SPA routing is handled natively via `not_found_handling = "single-page-application"` in `wrangler.toml`. No conflicting `_redirects` file exists.
