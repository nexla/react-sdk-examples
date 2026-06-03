import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The SDK calls your Nexla API directly — set the URL via VITE_NEXLA_API_BASE_URL and pass it
// to NexlaConnectProvider's apiBaseUrl (see src/App.tsx). No proxy needed.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, open: true },
});
