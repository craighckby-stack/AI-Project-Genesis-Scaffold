export const validateSystemState = (state: any) => {
  if (!state.fen) throw new Error('CRITICAL: FEN state missing.');
  return true;
};

export const cleanupListeners = (controller: AbortController) => {
  controller.abort();
};



