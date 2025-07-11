/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // New: A standard Vitest configuration for a React project
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts', // A conventional place for test setup
  },
  server: {
    host: true, // expose server to network
  },
})
