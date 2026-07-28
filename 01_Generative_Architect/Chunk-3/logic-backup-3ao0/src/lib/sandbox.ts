/**
 * A simple sandbox using an Iframe to test JS/HTML code.
 */
export async function testCodeInSandbox(code: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const timeout = setTimeout(() => {
      cleanup();
      resolve({ success: false, error: 'Execution Timeout' });
    }, 5000);

    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener('message', handleMessage);
      document.body.removeChild(iframe);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      if (event.data.type === 'SANDBOX_RESULT') {
        cleanup();
        resolve({ success: event.data.success, error: event.data.error });
      }
    };

    window.addEventListener('message', handleMessage);

    const sandboxHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <script type="module">
            try {
              const code = \`${code.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;
              const blob = new Blob([code], { type: 'text/javascript' });
              const url = URL.createObjectURL(blob);
              await import(url);
              URL.revokeObjectURL(url);
              window.parent.postMessage({ type: 'SANDBOX_RESULT', success: true }, '*');
            } catch (err) {
              window.parent.postMessage({ type: 'SANDBOX_RESULT', success: false, error: err.message }, '*');
            }
          </script>
        </body>
      </html>
    `;

    iframe.srcdoc = sandboxHtml;
  });
}
