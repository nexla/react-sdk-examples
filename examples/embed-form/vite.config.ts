import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Calls Nexla directly using the API URL entered in the app or .env.local.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, open: true },
});
