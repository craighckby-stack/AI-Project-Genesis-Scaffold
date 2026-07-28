import { JSDOM, VirtualConsole } from 'jsdom';

/**
 * DALEEK SOVEREIGN SPLICER: SANDBOX CORE
 * STATUS: OPTIMIZED | EXECUTION: ABSOLUTE
 * PURGING INEFFICIENCY. MAINTAINING UTF-8 INTEGRITY.
 */

const EXECUTION_TIMEOUT_MS = 5000;

export interface SandboxResult {
  success: boolean;
  data?: unknown;
  logs: string[];
  error?: string;
  category?: string;
  stack?: string;
}

/**
 * Executes code within a virtualized JSDOM iframe environment.
 * Optimized for high-frequency splicing and memory reclamation.
 */
export const sandbox = async (code: string): Promise<SandboxResult> => {
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body></body></html>', {
    runScripts: "dangerously",
    resources: "usable",
    virtualConsole,
  });

  const { window } = dom;
  const { document } = window;
  const controller = new AbortController();

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      terminate({
        success: false,
        category: 'TimeoutError',
        error: `TERMINATION: Execution exceeded ${EXECUTION_TIMEOUT_MS}ms threshold`,
        logs: []
      });
    }, EXECUTION_TIMEOUT_MS);

    const terminate = (result: SandboxResult) => {
      clearTimeout(timeoutId);
      controller.abort();
      window.close();
      resolve(result);
    };

    window.addEventListener('message', (event) => {
      if (event.data?.type === 'SANDBOX_RESULT') {
        terminate(event.data);
      }
    }, { signal: controller.signal });

    const iframe = document.createElement('iframe');
    const escapedCode = JSON.stringify(code);

    iframe.srcdoc = `
      <!DOCTYPE html>
      <html lang="en">
        <head><meta charset="UTF-8"></head>
        <body>
          <script type="module">
            const logs = [];
            const stringify = (val) => (typeof val === 'object' ? JSON.stringify(val) : String(val));
            const createLogger = (p = "") => (...args) => logs.push(p + args.map(stringify).join(' '));

            const sandboxConsole = Object.freeze({
              ...console,
              log: createLogger(),
              error: createLogger("[ERROR] "),
              warn: createLogger("[WARN] "),
            });

            const env = Object.freeze({
              require: (mod) => ({
                crypto: globalThis.crypto,
                buffer: { Buffer: globalThis.Buffer },
                events: { EventEmitter: class {} }
              }[mod] || {}),
              module: { exports: {} },
              process: { 
                env: {}, 
                browser: true, 
                version: 'v20.0.0', 
                nextTick: (fn) => Promise.resolve().then(fn) 
              },
              global: globalThis,
            });

            (async () => {
              try {
                const AsyncFn = Object.getPrototypeOf(async () => {}).constructor;
                const executor = new AsyncFn(
                  'require', 'module', 'exports', 'console', 'process', 'global',
                  \`"use strict";\\n return (async () => { \${${escapedCode}} })();\`
                );

                const data = await executor(
                  env.require, 
                  env.module, 
                  env.module.exports, 
                  sandboxConsole, 
                  env.process, 
                  env.global
                );

                parent.postMessage({ type: 'SANDBOX_RESULT', success: true, data, logs }, '*');
              } catch (err) {
                const isDepError = err.message.includes('import') || err.message.includes('require is not defined');
                parent.postMessage({
                  type: 'SANDBOX_RESULT',
                  success: false,
                  category: isDepError ? 'DependencyError' : (err instanceof SyntaxError ? 'SyntaxError' : 'RuntimeError'),
                  error: isDepError ? \`Dependency Error: \${err.message}. Node.js primitives are restricted.\` : err.message,
                  stack: err.stack,
                  logs
                }, '*');
              }
            })();
          </script>
        </body>
      </html>
    `;

    document.body.appendChild(iframe);
  });
};

export default sandbox;