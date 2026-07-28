/**
 * SubstrateEnvironmentValidator
 * Anchors the environment against entropy by enforcing schema validation
 * for the Dalek Caan Ω ecosystem.
 */
export const validateEnvironment = () => {
  const required = ['GEMINI_API_KEY', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`[SUBSTRATE_BREACH] Missing critical environment variable: ${key}`);
    }
  });
  return true;
};
