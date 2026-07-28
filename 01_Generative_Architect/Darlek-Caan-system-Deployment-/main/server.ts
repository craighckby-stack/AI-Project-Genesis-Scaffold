import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import AdmZip from "adm-zip";
import fs from "fs";
import { spawn } from "child_process";
import os from "os";
import { createProxyMiddleware } from "http-proxy-middleware";

const upload = multer({ dest: 'uploads/' });

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // In-memory active builds for SSE
  const activeBuilds = new Map<string, express.Response[]>();
  const buildServePaths = new Map<string, string>();
  
  let nextPort = 4000;
  const activeServers = new Map<string, { port: number, proxy: any, proc?: any }>();

  app.get("/api/deploy/active", (req, res) => {
    const list: any[] = [];
    buildServePaths.forEach((path, buildId) => {
       const serverInfo = activeServers.get(buildId);
       list.push({
           buildId,
           type: serverInfo ? 'dynamic' : 'static',
           port: serverInfo?.port,
           path: path
       });
    });
    res.json(list);
  });

  app.delete("/api/deploy/active/:buildId", (req, res) => {
     const { buildId } = req.params;
     
     const serverInfo = activeServers.get(buildId);
     if (serverInfo && serverInfo.proc) {
         serverInfo.proc.kill();
     }
     activeServers.delete(buildId);
     buildServePaths.delete(buildId);
     activeBuilds.delete(buildId);
     
     res.json({ success: true });
  });

  app.post("/api/deploy/upload", (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        console.error("Multer Error:", err);
        return res.status(400).json({ error: err.message || "Upload error" });
      }
      next();
    });
  }, (req, res) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const buildId = Math.random().toString(36).substring(2, 15);
    activeBuilds.set(buildId, []);

    const files = req.files as Express.Multer.File[];
    const filePaths = files.map(f => f.path);
    
    const isMergeMode = req.body.isMergeMode === 'true';
    const baseMasterIndex = parseInt(req.body.baseMasterIndex || '0', 10) || 0;

    // Start background build process
    setTimeout(() => {
      runDeployment(buildId, filePaths, isMergeMode, baseMasterIndex).catch(err => {
         console.error("Deployment Error:", err);
         broadcastLog(buildId, { type: "status", status: "error", message: err.message });
      });
    }, 1000);

    res.json({ buildId });
  });

  app.get("/api/deploy/logs/:buildId", (req, res) => {
    const { buildId } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const clients = activeBuilds.get(buildId) || [];
    clients.push(res);
    activeBuilds.set(buildId, clients);

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      // Send SSE comment to keep the connection open without triggering a standard event
      res.write(`:\n\n`);
    }, 15000);

    // If client disconnects
    req.on("close", () => {
      clearInterval(heartbeat);
      const updatedClients = activeBuilds.get(buildId)?.filter((c) => c !== res) || [];
      activeBuilds.set(buildId, updatedClients);
    });
  });

  const broadcastLog = (buildId: string, payload: any) => {
    const clients = activeBuilds.get(buildId) || [];
    clients.forEach((client) => {
      client.write(`data: ${JSON.stringify(payload)}\n\n`);
    });
  };

  const runCommand = (command: string, args: string[], cwd: string, buildId: string) => {
    return new Promise<void>((resolve, reject) => {
      const cleanEnv = { ...process.env };
      // Remove npm/yarn vars that might interfere with child builds
      Object.keys(cleanEnv).forEach(key => {
        if (key.toLowerCase().startsWith('npm_') || key.toLowerCase().startsWith('yarn_')) {
          delete cleanEnv[key];
        }
      });
      cleanEnv.NODE_ENV = 'production';
      cleanEnv.CI = 'true'; // Ignore some interactive prompts
      cleanEnv.NEXT_PRIVATE_LOCAL_WEBPACK = 'true'; // Force Webpack over Turbopack to avoid experimental bugs
      cleanEnv.NEXT_TELEMETRY_DISABLED = '1';

      const proc = spawn(command, args, { cwd, shell: true, env: cleanEnv });

      proc.stdout.on("data", (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        lines.forEach((line: string) => broadcastLog(buildId, { type: "log", message: line, level: "info" }));
      });

      proc.stderr.on("data", (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        lines.forEach((line: string) => broadcastLog(buildId, { type: "log", message: line, level: "warning" }));
      });

      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Command ${command} ${args.join(' ')} failed with code ${code}`));
      });
    });
  };

  const runDeployment = async (buildId: string, zipPaths: string[], isMergeMode: boolean, baseMasterIndex: number) => {
    broadcastLog(buildId, { type: "log", message: `Extracting ${zipPaths.length} archives...`, level: "info" });
    
    // 1. Extract ALL zips into the deployment directory
    const deployPath = path.join(os.tmpdir(), "darlek-deployments", buildId);
    fs.mkdirSync(deployPath, { recursive: true });
    
    let servePath = deployPath;

    if (isMergeMode && zipPaths.length > 1) {
       broadcastLog(buildId, { type: "log", message: `Merge mode enabled. Base master index: ${baseMasterIndex + 1}`, level: "info" });
       
       // Step A: Extract master archive to a temp directory
       const masterZipPath = zipPaths[baseMasterIndex];
       const masterTemp = path.join(os.tmpdir(), `darlek-tmp-${buildId}-master`);
       fs.mkdirSync(masterTemp, { recursive: true });
       const masterZip = new AdmZip(masterZipPath);
       masterZip.extractAllTo(masterTemp, true);
       
       // GitHub zips usually have a single root folder inside. Let's find it.
       let masterRoot = masterTemp;
       const masterEntries = fs.readdirSync(masterTemp);
       if (masterEntries.length === 1 && fs.statSync(path.join(masterTemp, masterEntries[0])).isDirectory()) {
           masterRoot = path.join(masterTemp, masterEntries[0]);
       }
       
       // Move master root contents down to deployPath so other repos can inject evenly
       fs.cpSync(masterRoot, deployPath, { recursive: true });
       fs.rmSync(masterTemp, { recursive: true, force: true });
       fs.unlinkSync(masterZipPath);
       
       // Step B: Iterate over remaining zips and overlay them onto deployPath
       for (const [index, zipPath] of zipPaths.entries()) {
           if (index === baseMasterIndex) continue;
           broadcastLog(buildId, { type: "log", message: `Merging plugin ${index + 1}/${zipPaths.length} into system...`, level: "info" });
           
           const otherTemp = path.join(os.tmpdir(), `darlek-tmp-${buildId}-other-${index}`);
           fs.mkdirSync(otherTemp, { recursive: true });
           const otherZip = new AdmZip(zipPath);
           otherZip.extractAllTo(otherTemp, true);
           
           let otherRoot = otherTemp;
           const otherEntries = fs.readdirSync(otherTemp);
           if (otherEntries.length === 1 && fs.statSync(path.join(otherTemp, otherEntries[0])).isDirectory()) {
               otherRoot = path.join(otherTemp, otherEntries[0]);
           }
           
           // Inject contents over the base master
           fs.cpSync(otherRoot, deployPath, { recursive: true, force: true });
           fs.rmSync(otherTemp, { recursive: true, force: true });
           fs.unlinkSync(zipPath);
       }
       broadcastLog(buildId, { type: "log", message: `System successfully merged!`, level: "success" });

    } else {
       for (const [index, zipPath] of zipPaths.entries()) {
         broadcastLog(buildId, { type: "log", message: `Extracting archive ${index + 1}/${zipPaths.length}...`, level: "info" });
         const zip = new AdmZip(zipPath);
         zip.extractAllTo(deployPath, true);
         fs.unlinkSync(zipPath); // Clean up uploaded zip
       }
       
       // Check if there's a nested single root directory
       const entries = fs.readdirSync(deployPath);
       if (entries.length === 1 && fs.statSync(path.join(deployPath, entries[0])).isDirectory()) {
           servePath = path.join(deployPath, entries[0]);
       }
    }

    // 2. Build if package.json exists
    if (fs.existsSync(path.join(servePath, 'package.json'))) {
      broadcastLog(buildId, { type: "log", message: "Found package.json, resolving dependencies...", level: "info" });
      
      // Clean up previous dependencies to avoid React mismatch errors
      const nmPath = path.join(servePath, 'node_modules');
      const nextPath = path.join(servePath, '.next');
      const lock1 = path.join(servePath, 'package-lock.json');
      const lock2 = path.join(servePath, 'yarn.lock');
      const lock3 = path.join(servePath, 'pnpm-lock.yaml');
      if (fs.existsSync(nmPath)) fs.rmSync(nmPath, { recursive: true, force: true });
      if (fs.existsSync(nextPath)) fs.rmSync(nextPath, { recursive: true, force: true });
      if (fs.existsSync(lock1)) fs.rmSync(lock1, { force: true });
      if (fs.existsSync(lock2)) fs.rmSync(lock2, { force: true });
      if (fs.existsSync(lock3)) fs.rmSync(lock3, { force: true });

      try {
        await runCommand("npm", ["install", "--no-audit", "--no-fund"], servePath, buildId);
        broadcastLog(buildId, { type: "log", message: "Dependencies installed successfully.", level: "success" });
        
        const pkg = JSON.parse(fs.readFileSync(path.join(servePath, 'package.json'), 'utf-8'));
        if (pkg.scripts && pkg.scripts.build) {
           broadcastLog(buildId, { type: "log", message: "Executing build script (npm run build)...", level: "info" });
           
           let buildErred = false;
           try {
             await runCommand("npm", ["run", "build"], servePath, buildId);
             broadcastLog(buildId, { type: "log", message: "Build complete.", level: "success" });
           } catch (buildErr: any) {
             buildErred = true;
             broadcastLog(buildId, { type: "log", message: `Build failed: ${buildErr.message}. Attempting to persist anyway if static files exist...`, level: "warning" });
           }

           if (pkg.scripts && pkg.scripts.start) {
              broadcastLog(buildId, { type: "log", message: "Found start script, launching dynamic sub-process backend...", level: "info" });
              
              const backendPort = nextPort++;
              const cleanEnv = { ...process.env };
              Object.keys(cleanEnv).forEach(key => {
                if (key.toLowerCase().startsWith('npm_') || key.toLowerCase().startsWith('yarn_')) {
                  delete cleanEnv[key];
                }
              });
              cleanEnv.NODE_ENV = 'production';
              cleanEnv.PORT = backendPort.toString();
              
              const proc = spawn("npm", ["start"], { cwd: servePath, shell: true, env: cleanEnv });
              
              proc.stdout.on("data", (data) => {
                const lines = data.toString().split('\n').filter(Boolean);
                lines.forEach((line: string) => broadcastLog(buildId, { type: "log", message: `[SERVER] ${line}`, level: "info" }));
              });
              
              proc.stderr.on("data", (data) => {
                const lines = data.toString().split('\n').filter(Boolean);
                lines.forEach((line: string) => broadcastLog(buildId, { type: "log", message: `[SERVER] ${line}`, level: "warning" }));
              });
              
              const proxy = createProxyMiddleware({
                 target: `http://127.0.0.1:${backendPort}`,
                 changeOrigin: true,
                 ws: true,
              });

              activeServers.set(buildId, { port: backendPort, proxy, proc });
              broadcastLog(buildId, { type: "log", message: `Backend spawned on dynamic port ${backendPort}. Proxy engaged.`, level: "success" });
           } else {
              const originalServePath = servePath;
              
              if (fs.existsSync(path.join(servePath, 'dist'))) {
                 servePath = path.join(servePath, 'dist');
              } else if (fs.existsSync(path.join(servePath, 'build'))) {
                 servePath = path.join(servePath, 'build');
              } else if (fs.existsSync(path.join(servePath, 'out'))) {
                 servePath = path.join(servePath, 'out');
              } else if (fs.existsSync(path.join(servePath, '.next', 'server', 'app'))) {
                 servePath = path.join(servePath, '.next', 'server', 'app');
              }

              if (buildErred && servePath === originalServePath) {
                 throw new Error("Build failed and no output directories (dist, build, out, .next) were found.");
              }
           }
        }
      } catch (e: any) {
         broadcastLog(buildId, { type: "log", message: `Build error: ${e.message}`, level: "error" });
         broadcastLog(buildId, { type: "status", status: "error", message: e.message });
         return;
      }
    } else {
      broadcastLog(buildId, { type: "log", message: "No package.json found, serving static files directly.", level: "info" });
    }

    buildServePaths.set(buildId, servePath);

    broadcastLog(buildId, { type: "log", message: "Registering Darlek Caan routing...", level: "info" });
    broadcastLog(buildId, { type: "log", message: "System activated.", level: "success" });
    
    broadcastLog(buildId, { 
      type: "status", 
      status: "success", 
      url: `preview/${buildId}/` 
    });
  };

  // Proxy routing for active backends
  app.use('/preview', async (req, res, next) => {
      const match = req.url.match(/^\/([^\/]+)(.*)$/);
      if (match) {
          const buildId = match[1];
          const serverInfo = activeServers.get(buildId);
          if (serverInfo) {
              const targetUrl = match[2] || '/';
              
              if ((targetUrl === '/' || targetUrl === '/index.html') && req.method === 'GET') {
                  try {
                      const fetchUrl = `http://127.0.0.1:${serverInfo.port}${targetUrl}`;
                      const response = await fetch(fetchUrl);
                      const contentType = response.headers.get('content-type');
                      
                      if (contentType && contentType.includes('text/html')) {
                          let html = await response.text();
                          if (!html.includes('<base ')) {
                              html = html.replace(/<head[^>]*>/i, `$&<base href="/preview/${buildId}/">`);
                          }
                          return res.type('html').send(html);
                      }
                  } catch (e) {
                      // Silently fall back to proxying
                  }
              }
              
              req.url = targetUrl;
              return serverInfo.proxy(req, res, next);
          }
      }
      next();
  });

  // Safe fallback routing to serve the deployed files
  app.get("/preview/:buildId*", (req, res) => {
    const buildId = (req.params as any).buildId;
    const servePath = buildServePaths.get(buildId);
    if (!servePath) return res.status(404).send('Deployment not found or still building');

    const relativePath = req.params[0] || '/';
    const fullPath = path.join(servePath, relativePath);

    if (fs.existsSync(fullPath)) {
      if (fs.statSync(fullPath).isDirectory()) {
         const indexPath = path.join(fullPath, 'index.html');
         if (fs.existsSync(indexPath)) {
             let html = fs.readFileSync(indexPath, 'utf-8');
             if (!html.includes('<base ')) {
                 html = html.replace(/<head[^>]*>/i, `$&<base href="/preview/${buildId}/">`);
             }
             return res.type('html').send(html);
         }
      } else {
         return res.sendFile(fullPath);
      }
    }
    
    // Fallback for SPA routing if index.html exists
    const defaultIndexPath = path.join(servePath, 'index.html');
    if (fs.existsSync(defaultIndexPath)) {
         let html = fs.readFileSync(defaultIndexPath, 'utf-8');
         if (!html.includes('<base ')) {
             html = html.replace(/<head[^>]*>/i, `$&<base href="/preview/${buildId}/">`);
         }
         return res.type('html').send(html);
    }
    
    res.status(404).send('Not found');
  });

  // Intercept requests for assets that originated from a preview context via Referer
  app.use((req, res, next) => {
    const referer = req.headers.referer;
    if (referer && !req.path.startsWith('/preview/')) {
        try {
            const url = new URL(referer);
            const match = url.pathname.match(/^\/preview\/([^\/]+)/);
            if (match) {
                const buildId = match[1];
                const serverInfo = activeServers.get(buildId);
                
                if (serverInfo) {
                    return serverInfo.proxy(req, res, next);
                }

                const servePath = buildServePaths.get(buildId);
                if (servePath) {
                    const fullPath = path.join(servePath, req.path);
                    if (fs.existsSync(fullPath) && !fs.statSync(fullPath).isDirectory()) {
                        return res.sendFile(fullPath);
                    }
                }
            }
        } catch (e) {
            // Ignore
        }
    }
    next();
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  process.on('exit', () => {
    activeServers.forEach(info => {
      if (info.proc) info.proc.kill();
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
