import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEV_URL = 'http://localhost:5173'

/**
 * Writes a build/hot file while the dev server runs, so the WordPress theme
 * (functions.php) can detect dev mode and load assets from the Vite server.
 */
function wpHotFile() {
  const hotFile = resolve(__dirname, 'build/hot')
  const clean = () => {
    try { fs.unlinkSync(hotFile) } catch { /* noop */ }
  }
  return {
    name: 'nxtc-wp-hot-file',
    apply: 'serve',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        fs.mkdirSync(resolve(__dirname, 'build'), { recursive: true })
        fs.writeFileSync(hotFile, DEV_URL)
      })
      process.once('SIGINT', () => { clean(); process.exit(0) })
      process.once('SIGTERM', () => { clean(); process.exit(0) })
      process.once('exit', clean)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), wpHotFile()],
  // Assets are served under /wp-content/themes/nxtc/build/ — use relative base
  // so URLs resolve regardless of the site's domain/subpath.
  base: '',
  build: {
    manifest: true,
    outDir: 'build',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/main.tsx'),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    cors: true,
    origin: DEV_URL,
    hmr: { host: 'localhost', port: 5173 },
  },
})
