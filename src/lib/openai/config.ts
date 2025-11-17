/**
 * OpenAI API Configuration
 * Safely loads API key from environment variables
 */

/**
 * Get OpenAI API key from environment
 * Falls back to empty string if not set (for graceful degradation)
 */
export function getOpenAIApiKey(): string {
  // @ts-ignore - Vite env is available
  const apiKey = import.meta.env?.VITE_OPENAI_API_KEY || ''
  
  if (!apiKey) {
    console.warn('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env file.')
  }
  
  return apiKey
}

/**
 * Check if OpenAI API is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!getOpenAIApiKey()
}

