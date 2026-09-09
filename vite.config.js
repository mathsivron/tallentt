import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During `vite dev`, /api isn't served (that's Vercel's job). If you run the
// frontend with `npm run dev`, use `vercel dev` instead (or in parallel) so
// /api/* requests actually hit the serverless functions in ./api.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
