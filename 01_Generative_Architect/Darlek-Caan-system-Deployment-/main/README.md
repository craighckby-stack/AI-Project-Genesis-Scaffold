# Darlek Caan Deployer

The **Darlek Caan Deployer** is a custom, modular cloud deployment system built to dynamically host, build, and serve zipped web applications and plugins exactly when you need them.

## 🚀 What It Does

This system acts as a mini Platform-as-a-Service (PaaS). It allows you to:
1. **Upload Repositories**: Drag and drop one or multiple `.zip` archives containing your codebase, plugins, or modular system components.
2. **Merge on the Fly**: If multiple zips are uploaded (e.g., a core system and 50 plugin zips), they are extracted and merged into a single deployment environment.
3. **Automated CI/CD Pipeline**:
   - Automatically detects `package.json`.
   - Cleans the environment (removing old `node_modules` or `.next` caches).
   - Installs dependencies using `npm install`.
   - Builds the application using `npm run build` (with special fallbacks to standard Webpack instead of experimental bundlers to prevent Next.js crashes).
4. **Real-time Telemetry**: Streams the build process logs back to your browser in real-time using Server-Sent Events (SSE), so you can watch exactly what the server is doing in the "Terminal" view.
5. **Instant Previews**: Once the build succeeds, it serves the output (`dist`, `build`, `out`, etc.) dynamically on a unique `/preview/<buildId>/` route and embeds it in a live iframe on your dashboard.

## 🏗️ Architecture & How It Works

### Stack
- **Frontend**: React 19, Tailwind CSS (v4), Lucide React (Icons).
- **Backend**: Node.js, Express, Vite (Middleware mode in dev), Multer (file parsing), Adm-zip (archive extraction).
- **Execution**: Node `child_process` (`spawn`) for executing build commands securely.

### The Lifecycle of a Deployment

1. **Upload & Ingestion (`POST /api/deploy/upload`)**:
   - You drop zips on the React UI.
   - The browser sends them as `multipart/form-data`.
   - Express uses `multer` to parse the payload and saves the files temporarily in `/uploads`.
   - A unique `buildId` is generated, and the HTTP response returns it immediately to the client.

2. **Real-Time Streaming (`GET /api/deploy/logs/:buildId`)**:
   - The React client connects to this endpoint to listen for Server-Sent Events.
   - The backend uses this persistent connection to stream stdout/stderr lines as they happen during the build.

3. **Extraction & Merging**:
   - The server unzips all uploaded archives into `/tmp/darlek-deployments/<buildId>`.
   - If the archive contains a single root folder (like GitHub zip downloads do), it intelligently shifts the working directory into that folder.

4. **Build Execution**:
   - The server spawns a shell to run `npm install --legacy-peer-deps` and `npm run build`. 
   - Environment variables are scrubbed and sanitized to ensure the child process builds cleanly in `production` mode, ignoring interactive prompts.

5. **Routing & Serving**:
   - The Express application has a catch-all route: `app.get("/preview/:buildId*", ...)`.
   - When a request hits this route, it checks the in-memory map of `buildId -> static folder path`.
   - It intercepts the request and serves the static files (e.g., `index.html`, JS bundles) directly from the extracted deployment folder.

## 🛠️ Modularity Support

You can select multiple zip files at once in the file picker. The extraction engine loops through all provided files and extracts them into the same root working directory. This makes it possible to upload a core architecture zip, alongside dozens of smaller "plugin" feature zips, which will all be evaluated together before the build step initiates. Be mindful of file overwriting—subsequent zips will overwrite files with the same name from previous zips.

---
*System built for Darlek Caan Evolution Cycle © @craighckby-stack 2026*
