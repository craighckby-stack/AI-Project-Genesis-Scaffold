interface PromotionModalProps {
  color: 'W' | 'B';
  onSelect: (pieceChar: string) => void;
  onCancel: () => void;
}

export default function PromotionModal({ color, onSelect, onCancel }: PromotionModalProps) {
  const pieces = [
    { char: 'Q', label: 'Queen', symbol: color === 'W' ? '♕' : '♛' },
    { char: 'R', label: 'Rook', symbol: color === 'W' ? '♖' : '♜' },
    { char: 'B', label: 'Bishop', symbol: color === 'W' ? '♗' : '♝' },
    { char: 'N', label: 'Knight', symbol: color === 'W' ? '♘' : '♞' },
  ];

  return (
    <div id="promo-modal" className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#0c0202] border border-red-900/40 rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
        <h3 className="text-base font-bold text-red-200 tracking-wide uppercase mb-1">Pawn Promotion</h3>
        <p className="text-[11px] text-slate-400 mb-4">Choose which piece your pawn should promote to.</p>
        <div className="grid grid-cols-4 gap-2">
          {pieces.map((item) => (
            <button
              key={item.char}
              onClick={() => onSelect(item.char)}
              className="bg-[#150404] hover:bg-red-950 border border-red-900/20 text-white p-3 rounded transition flex flex-col items-center gap-1 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <span className="text-3xl font-sans text-red-100">{item.symbol}</span>
              <span className="text-[9px] font-semibold tracking-wider text-red-200 uppercase">{item.label}</span>
            </button>
          ))}
        </div>
        <button 
          onClick={onCancel}
          className="mt-4 text-[10px] text-red-500 hover:text-red-400 font-mono uppercase tracking-wider block mx-auto"
        >
          Cancel Promotion
        </button>
      </div>
    </div>
  );
}

