import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ngrokQr } from 'ngrok-qr-vite-plugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(),
      mode === 'tunnel' ? ngrokQr({ port: 5173, protocol: 'http', authtoken: env.NGROK_AUTHTOKEN }) : null,
    ].filter(Boolean),
    server: {
      ...(mode === 'tunnel' && { allowedHosts: true as const }),
    },
  }
})
