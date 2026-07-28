export function generateUUID(): string {
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    typeof window.crypto.randomUUID === 'function'
  ) {
    try {
      return window.crypto.randomUUID();
    } catch (e) {
      console.warn("Native crypto.randomUUID failed, using fallback:", e);
    }
  }

  // Robust RFC4122 version 4 compliant fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
