import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` must match the GitHub Pages sub-path (the repo name) in production,
// but stays '/' for local `npm run dev`.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Qualstate/' : '/',
  plugins: [react()],
  server: { host: true, port: 5173 },
}))
