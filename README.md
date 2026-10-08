# Akki Study

Free batches, high-definition video lectures, chapter-wise notes, and Daily Practice Problems (DPP) platform.

## Cloudflare Compatibility

Akki Study is engineered for full **Cloudflare Pages** and **Cloudflare Workers** compatibility:
- **Runtime**: Runs natively on Cloudflare's Edge runtime using the `nodejs_compat` flag.
- **SSR & Bundling**: Bundled via TanStack Start & Nitro with the `cloudflare-pages` preset.
- **Edge Entry Point**: Server handler in `src/server.ts` complies with standard Cloudflare fetch handlers (`export default { async fetch(request, env, ctx) ... }`).
- **Configuration**: `wrangler.json` is configured with project name `akki-study` and output directory `dist`.

---

## Build & Deploy Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
```bash
npm run dev
```
Starts the local development server at `http://localhost:3000`.

### 3. Production Build for Cloudflare
```bash
npm run build
```
Compiles TypeScript, processes Tailwind CSS, and outputs the production bundle to `./dist` ready for Cloudflare Pages with `_worker.js` and `_routes.json`.

### 4. Local Cloudflare Pages Preview
```bash
npm run preview:cf
# Or directly via wrangler:
npx wrangler pages dev dist
```
Simulates Cloudflare's edge environment locally on your machine with full worker routing and static asset serving.

### 5. Deploy to Cloudflare via Wrangler CLI
```bash
# Build and deploy in one command:
npm run deploy:prod

# Or deploy an already built `dist` folder:
npm run deploy
# Which runs:
npx wrangler pages deploy dist
```

### 6. Cloudflare Dashboard Git Integration (CI/CD)
When connecting your Git repository directly in the Cloudflare Dashboard:
- **Framework Preset**: `None` (or `Custom`)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Environment variables**:
  - `NODE_VERSION`: `20` (or higher)
  - `NITRO_PRESET`: `cloudflare-pages` (default)
- **Compatibility flag**: `nodejs_compat` (configured in `wrangler.json`)

---

## Frontend Routes & API Architecture

```
/
  → /batches/$batchId                          (Batch details & subjects)
  → /batches/$batchId/subject/$subjectId       (Subject chapters & topics)
  → /batches/…/topic/$topicId                  (Topic lectures, notes, DPPs, tests)
  → /batches/…/lecture/$lectureId              (HLS Video player & materials)
```

### Environment Variables
Configure the following in your Cloudflare Pages project settings (under **Settings** > **Environment variables**):
- `PW_TOKEN`: (Optional) Student session token for upstream PW API access and protected notes/videos.

## Development

Prefer working locally? You need Node.js and npm:

```sh
npm install
npm run dev
```
