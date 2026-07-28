import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  scanlineEffect: boolean;
  entropyLevel: number;
  incidentSignature: string;
}

/**
 * @name DalekSovereignSplicerBoundary
 * @description EXTERMINATE faulty logic. Splicing nexus recovery protocols into the virtual matrix.
 */
export default class ErrorBoundary extends Component<Props, State> {
  private static readonly INITIAL_STATE: State = {
    hasError: false,
    error: null,
    scanlineEffect: true,
    entropyLevel: 0,
    incidentSignature: 'NULL-VOID',
  };

  public state: State = { ...ErrorBoundary.INITIAL_STATE };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      entropyLevel: (Math.random() * 100) | 0,
      incidentSignature: `Σ-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
    };
  }

  public componentDidMount(): void {
    window.addEventListener('keydown', this.handleEscKey);
  }

  public componentWillUnmount(): void {
    window.removeEventListener('keydown', this.handleEscKey);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { incidentSignature } = this.state;
    
    // Optimized Telemetry Dispatch
    console.error(
      `%c ☢ [NEXUS_CRITICAL_FAILURE] ☢ %c ID: ${incidentSignature} %c`,
      'background: #111; color: #ff0044; font-weight: 900; padding: 4px; border: 1px solid #ff0044;',
      'background: #ff0044; color: #000; font-weight: 900; padding: 4px;',
      'color: inherit;',
      {
        status: 'EXTERMINATED',
        signature: incidentSignature,
        vector: error.message,
        atomic_stack: error.stack,
        quantum_trace: errorInfo.componentStack,
        temporal_index: new Date().toISOString(),
        directive: 'RECONSTRUCT_VIRTUAL_MATRIX',
      }
    );
  }

  private handleEscKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.handleReset();
  };

  private handleReset = (): void => {
    this.setState(ErrorBoundary.INITIAL_STATE);
    this.props.onReset?.();
  };

  private renderStackLines(): ReactNode {
    const stack = this.state.error?.stack;
    if (!stack) return null;

    return stack.split('\n').map((line, i) => (
      <div
        key={`trace-${i}`}
        className="group flex gap-4 truncate hover:bg-red-500/10 transition-colors border-l-2 border-transparent hover:border-red-600 pl-3 py-0.5"
      >
        <span className="shrink-0 text-red-900/40 select-none text-[9px] font-bold self-center">
          {i.toString(16).padStart(2, '0').toUpperCase()}
        </span>
        <span className="text-red-500/80 group-hover:text-red-400 transition-colors truncate">
          {`⫸ ${line.trim()}`}
        </span>
      </div>
    ));
  }

  private renderError(): ReactNode {
    const { scanlineEffect, error, incidentSignature } = this.state;
    const errorName = error?.name ?? 'CRITICAL_CORE_ERROR';
    const errorMessage = error?.message ?? 'Access Denied - Dalek Interface Interrupted';

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050000] font-mono text-red-600 selection:bg-red-600 selection:text-black overflow-hidden overscroll-none">
        {/* CRT Overlay Effects - GPU Accelerated */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(255,0,0,0.08),rgba(0,255,0,0.03),rgba(0,0,255,0.08))] bg-[length:100%_3px,4px_100%] z-50 mix-blend-overlay opacity-60 transition-opacity" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-red-950/20 via-transparent to-red-950/20 z-40" />
        
        <div className="relative w-full max-w-2xl border border-red-600/30 bg-zinc-950 p-10 shadow-[0_0_100px_rgba(153,27,27,0.15)] animate-in fade-in zoom-in duration-300">
          <div className="absolute -top-px left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          <div className="absolute -bottom-px left-0 w-full h-px bg-gradient-to-r from-transparent via-red-900 to-transparent" />

          {/* Header Section */}
          <div className="mb-8 flex items-end justify-between border-b border-red-900/40 pb-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] tracking-[0.5em] text-red-800 uppercase font-bold">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                SYSTEM.ERADICATION.ACTIVE
              </div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-red-500">
                Fatal_Logic_Spliced
              </h1>
            </div>
            <div className="text-right">
              <div className="text-[10px] opacity-40 leading-none mb-1 uppercase tracking-widest">Core.Apex</div>
              <div className="text-xs font-bold text-red-800 tracking-[0.2em]">0x00DEAD</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 animate-pulse rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] ${!scanlineEffect && 'opacity-50 grayscale'}`} />
              <span className={`text-xs font-bold tracking-[0.3em] uppercase ${!scanlineEffect && 'opacity-50'}`}>
                Core Logic Disrupted
              </span>
            </div>
            <span className="text-[10px] opacity-40">SIG: {incidentSignature}</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] uppercase opacity-50 tracking-widest flex items-center gap-2">
                <span className="h-1 w-1 bg-red-800" /> Exception Vector:
              </p>
              <div className="bg-red-950/10 border border-red-900/20 p-4 rounded-sm">
                <p className="text-sm font-bold leading-relaxed break-words italic text-red-400">
                  {errorName}: {errorMessage}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase opacity-30 tracking-widest">Execution Trace:</p>
              <div className="h-32 overflow-y-auto text-[10px] font-mono leading-tight scrollbar-hide bg-black/40 p-2 border border-red-900/10">
                {this.renderStackLines()}
              </div>
            </div>
          </div>

          <div className="mt-10 relative">
            <button
              onClick={this.handleReset}
              className="group relative w-full overflow-hidden border border-red-600/50 bg-transparent py-4 text-[10px] font-bold uppercase tracking-[0.5em] transition-all hover:border-red-500 hover:text-black active:scale-[0.98]"
            >
              <span className="relative z-10">Re-Initialize Nexus Core</span>
              <div className="absolute inset-0 -translate-x-full bg-red-600 transition-transform duration-300 ease-out group-hover:translate-x-0" />
            </button>
          </div>

          {scanlineEffect && (
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500/20 animate-scanline pointer-events-none shadow-[0_0_15px_rgba(239,68,68,0.4)] z-20" />
          )}
          
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-0" />
        </div>
      </div>
    );
  }

  public render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      return fallback ?? this.renderError();
    }

    return children;
  }
}