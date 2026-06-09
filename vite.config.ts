import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `base` must match the GitHub Pages sub-path (the repo name) in production,
// but stays '/' for local `npm run dev`.
//
// viteSingleFile inlines all JS and CSS directly into index.html so the app
// loads as a single document. On locked-down corporate networks that allow the
// page HTML but block or break separate .js asset requests, this lets the demo
// still render — there are no external asset requests left to block.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Qualstate/' : '/',
  plugins: [react(), viteSingleFile()],
  server: { host: true, port: 5173 },
}))
