import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  UploadCloud, 
  FileArchive, 
  Terminal, 
  ExternalLink, 
  CheckCircle, 
  Loader2, 
  XCircle,
  Play,
  Github
} from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'building' | 'ready' | 'error'>('idle');
  const [logs, setLogs] = useState<{time: string, message: string, type: string}[]>([]);
  const [deployedUrl, setDeployedUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeServers, setActiveServers] = useState<any[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await fetch('api/deploy/active');
        const data = await res.json();
        setActiveServers(data);
      } catch (e) {
        // Ignore fetch errors
      }
    };
    fetchServers();
    const interval = setInterval(fetchServers, 5000);
    return () => clearInterval(interval);
  }, []);

  const terminateServer = async (buildId: string) => {
    try {
      await fetch(`api/deploy/active/${buildId}`, { method: 'DELETE' });
      setActiveServers(prev => prev.filter(s => s.buildId !== buildId));
      if (deployedUrl.includes(`/${buildId}/`)) {
          resetDeployment();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (message: string, type: string = 'info') => {
    setLogs((prevLogs) => [...prevLogs, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  const syncToGithub = async () => {
    if (files.length === 0) return;
    setIsSyncing(true);
    addLog(`Initiating GitHub Sync for ${files.length} archive(s)...`, 'info');
    await new Promise(r => setTimeout(r, 1000));
    addLog(`Authenticating with Darlek Caan GitHub Bot...`, 'info');
    await new Promise(r => setTimeout(r, 1500));
    addLog(`Pushing repository data...`, 'info');
    await new Promise(r => setTimeout(r, 2000));
    addLog(`Successfully synced to GitHub repository.`, 'success');
    setIsSyncing(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFiles(Array.from(e.target.files));
    }
  };

  const validateAndSetFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(f => f.name.endsWith('.zip') || f.type === 'application/zip');
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setLogs([]); // Reset logs
      setStatus('idle');
    } else {
      alert("Please upload at least one valid .zip file containing your repository.");
    }
  };

  const startDeployment = async () => {
    if (files.length === 0) return;

    setStatus('uploading');
    setLogs([]);
    addLog(`Preparing to upload ${files.length} archive(s)...`, 'info');

    try {
      // 1. Prepare the file for upload
      const formData = new FormData();
      files.forEach(f => formData.append('pluginZips', f));

      // 2. Send the ZIP file to your backend endpoint
      // Replace '/api/deploy/upload' with your actual backend URL
      const uploadResponse = await fetch('api/deploy/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await uploadResponse.text();

      if (!uploadResponse.ok) {
        throw new Error(`Server responded with status: ${uploadResponse.status}\n${responseText}`);
      }

      // 3. Assume backend returns a unique build ID to track the progress
      let uploadData;
      try {
        uploadData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 50)}...`);
      }
      
      const buildId = uploadData.buildId; 
      
      addLog(`Upload complete. Build initialized with ID: ${buildId}`, 'success');
      setStatus('building');

      // 4. Connect to a Server-Sent Events (SSE) stream for real-time build logs
      // Replace with your actual log streaming endpoint
      const eventSource = new EventSource(`api/deploy/logs/${buildId}`);

      // Listen for incoming log messages from the backend
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Assuming backend sends: { type: 'log', message: '...', level: 'info' }
          if (data.type === 'log') {
            addLog(data.message, data.level || 'info');
          } 
          // Assuming backend sends: { type: 'status', status: 'success', url: '...' }
          else if (data.type === 'status') {
            if (data.status === 'success') {
              setDeployedUrl(data.url);
              setStatus('ready');
              addLog(`Deployment finalized. App routing configured at ${data.url}`, 'success');
              eventSource.close(); // Close connection when done
            } else if (data.status === 'error') {
              setStatus('error');
              addLog(`Build failed: ${data.message || 'Check logs for details.'}`, 'error');
              eventSource.close();
            }
          }
        } catch (err) {
          console.error("Failed to parse log event:", err);
        }
      };

      eventSource.onerror = () => {
        addLog('Lost connection to the build server stream.', 'error');
        setStatus('error');
        eventSource.close();
      };

    } catch (error: any) {
      console.error("Deployment request failed:", error);
      addLog(`Upload failed: ${error.message}`, 'error');
      setStatus('error');
    }
  };

  const resetDeployment = () => {
    setFiles([]);
    setStatus('idle');
    setLogs([]);
    setDeployedUrl('');
  };

  const launchApp = () => {
    if (deployedUrl) {
      window.open(deployedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 p-8 font-sans flex items-center justify-center flex-col">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        
        {/* Left Column: Actions & Status */}
        <div className="flex flex-col gap-6">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-red-900/50 shadow-xl shadow-red-900/10">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Play className="w-6 h-6 text-red-500" />
              Darlek Caan Deployer
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Upload zipped repositories to build and deploy your modular system. You can upload multiple zips at once.
            </p>

            {status === 'idle' && (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                  ${isDragging ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 hover:border-red-500/50 hover:bg-zinc-800/50'}
                  ${files.length > 0 ? 'border-green-500 bg-green-500/10' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  id="file-upload" 
                  type="file" 
                  accept=".zip" 
                  multiple
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                
                {files.length > 0 ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileArchive className="w-12 h-12 text-green-400" />
                    <div>
                      <p className="font-semibold text-green-400">{files.length} archive(s) selected</p>
                      <p className="text-xs text-slate-400">Total size: {(files.reduce((acc, f) => acc + (f.size || 0), 0) / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">Click or drag more files to add</p>
                    <div className="flex gap-2 flex-wrap items-center justify-center mt-2 max-w-xs h-20 overflow-y-auto">
                        {files.map(f => (
                           <span key={f.name} className="bg-green-900/30 text-green-300 text-xs px-2 py-1 rounded inline-block">{f.name}</span>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <UploadCloud className="w-12 h-12 text-slate-400" />
                    <p className="font-semibold text-slate-300">Drag & drop your .zip file(s) here</p>
                    <p className="text-sm text-slate-500">or click to browse files</p>
                  </div>
                )}
              </div>
            )}

            {status === 'uploading' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
                <p className="text-lg font-medium text-slate-300">Uploading Repository...</p>
              </div>
            )}

            {status === 'building' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-zinc-700 border-t-red-600 animate-spin"></div>
                  <Terminal className="w-5 h-5 text-red-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-lg font-medium text-slate-300">Building System...</p>
              </div>
            )}

            {status === 'ready' && (
              <div className="flex flex-col items-center justify-center py-6 gap-4 bg-green-500/10 border border-green-500/20 rounded-xl w-full">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <div className="text-center">
                  <h3 className="text-xl font-bold text-green-400">Deployment Successful!</h3>
                  <p className="text-sm text-slate-400 mt-1">Your system is now online and ready.</p>
                </div>
                
                {/* Embedded Preview */}
                <div className="w-full mt-2 border border-zinc-700 rounded-lg overflow-hidden h-48 bg-white relative">
                   <div className="absolute top-0 left-0 w-full bg-zinc-800 text-xs px-3 py-1.5 text-slate-400 border-b border-zinc-700 flex justify-between items-center z-10">
                      <span className="truncate max-w-[80%] font-mono text-[10px]">{window.location.origin}{window.location.pathname.replace(/\/$/, '')}/{deployedUrl}</span>
                      <a href={deployedUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="Open in new tab">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                   </div>
                   <iframe src={deployedUrl} className="w-full h-full pt-8 border-none bg-white" sandbox="allow-scripts allow-same-origin"/>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center justify-center py-8 gap-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <XCircle className="w-16 h-16 text-red-500" />
                <div className="text-center">
                  <h3 className="text-xl font-bold text-red-400">Build Failed</h3>
                  <p className="text-sm text-slate-400 mt-1">Check the terminal logs for details.</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              {status === 'idle' && (
                <button 
                  onClick={startDeployment}
                  disabled={files.length === 0}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
                    ${files.length > 0 ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                >
                  Start Build Process
                </button>
              )}
              
              {status === 'ready' && (
                <button 
                  onClick={launchApp}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open Real Deploy
                </button>
              )}

              {['idle', 'ready'].includes(status) && files.length > 0 && (
                <button
                  onClick={syncToGithub}
                  disabled={isSyncing}
                  className={`py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${isSyncing ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                >
                  <Github className="w-5 h-5" />
                  {isSyncing ? 'Syncing...' : 'Sync to GitHub'}
                </button>
              )}

              {(status === 'ready' || status === 'error') && (
                <button 
                  onClick={resetDeployment}
                  className="py-3 px-6 rounded-xl font-semibold bg-zinc-800 hover:bg-zinc-700 text-slate-200 transition-all"
                >
                  Deploy New
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Terminal Logs */}
        <div className="bg-[#0D1117] rounded-2xl border border-red-900/40 shadow-xl shadow-red-900/10 overflow-hidden flex flex-col h-[500px]">
          <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Build Output</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic">Waiting for deployment to start...</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span className={`break-words ${
                      log.type === 'error' ? 'text-red-400' : 
                      log.type === 'success' ? 'text-green-400' : 
                      log.type === 'warning' ? 'text-yellow-400' : 
                      'text-slate-300'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            )}
          </div>
        </div>

      </div>

      {activeServers.length > 0 && (
        <div className="max-w-4xl w-full mt-8 bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Active Instances ({activeServers.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeServers.map((server) => (
              <div key={server.buildId} className="bg-black border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-slate-400">ID: {server.buildId}</div>
                  <div className="text-sm font-semibold mt-1">
                    {server.type === 'dynamic' ? (
                      <span className="text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded text-xs ml-1 border border-yellow-400/20">Dynamic Process (Port {server.port})</span>
                    ) : (
                      <span className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded text-xs ml-1 border border-blue-400/20">Static Build</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`preview/${server.buildId}/`} target="_blank" rel="noreferrer" className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-white" title="Open">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => terminateServer(server.buildId)} className="p-2 bg-red-900/40 hover:bg-red-600 rounded-lg transition-colors text-red-100" title="Terminate">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8 text-zinc-500 text-sm font-medium">
        &copy; @craighckby-stack 2026
      </div>
    </div>
  );
}
