interface PromotionModalProps {
  color: 'W' | 'B';
  onSelect: (pieceChar: string) => void;
  onCancel: () => void;
}

const PROMOTION_PIECES = [
  { char: 'Q', label: 'Queen', white: '♕', black: '♛' },
  { char: 'R', label: 'Rook', white: '♖', black: '♜' },
  { char: 'B', label: 'Bishop', white: '♗', black: '♝' },
  { char: 'N', label: 'Knight', white: '♘', black: '♞' },
] as const;

export default function PromotionModal({ color, onSelect, onCancel }: PromotionModalProps) {
  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="promo-title" 
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
    >
      <div className="bg-[#0c0202] border border-red-900/40 rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
        <h3 id="promo-title" className="text-base font-bold text-red-200 tracking-wide uppercase mb-1">
          Pawn Promotion
        </h3>
        <p className="text-[11px] text-slate-400 mb-4">Choose which piece your pawn should promote to.</p>
        
        <div className="grid grid-cols-4 gap-2">
          {PROMOTION_PIECES.map(({ char, label, white, black }) => (
            <button
              key={char}
              onClick={() => onSelect(char)}
              aria-label={`Promote to ${label}`}
              className="bg-[#150404] hover:bg-red-950 border border-red-900/20 text-white p-3 rounded transition flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <span className="text-3xl font-sans text-red-100" aria-hidden="true">
                {color === 'W' ? white : black}
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-red-200 uppercase">
                {label}
              </span>
            </button>
          ))}
        </div>

        <button 
          onClick={onCancel}
          className="mt-6 text-[10px] text-red-500 hover:text-red-400 font-mono uppercase tracking-wider block mx-auto"
        >
          Cancel Promotion
        </button>
      </div>
    </div>
  );
}
