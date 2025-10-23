import { defineNitroConfig } from 'nitropack/config'

export default defineNitroConfig({
  preset: 'netlify',
  compatibilityDate: '2025-10-23',
  serveStatic: true,
})
