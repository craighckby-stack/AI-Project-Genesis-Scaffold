/**
 * DARLEK CANN: Security Utility Layer
 * Siphoned from unitary-core and Microsoft/autogen patterns.
 */
export const validateAgentState = (state: any): boolean => {
  const required = ['schema_version', 'state', 'last_updated'];
  return required.every(key => Object.prototype.hasOwnProperty.call(state, key));
};

export const getSecurityHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'X-Agent-Version': '3.1.0'
});


