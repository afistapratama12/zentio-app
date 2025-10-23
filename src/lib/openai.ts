import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('Missing OpenAI API key')
}

export const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true, // Note: In production, API calls should be made from server-side
})

// Configuration constants
export const OPENAI_CONFIG = {
  visionModel: 'gpt-4o', // Updated model name for vision
  textModel: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2000,
} as const
