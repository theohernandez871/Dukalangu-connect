import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/** Group heavy dependencies into stable vendor chunks (Rolldown fn form). */
function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  if (/[\\/]react(-dom|-router-dom)?[\\/]/.test(id)) return 'react-vendor';
  if (id.includes('@tanstack') || id.includes('@supabase')) return 'data-vendor';
  if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) return 'form-vendor';
  if (id.includes('apexcharts')) return 'chart-vendor';
  if (id.includes('jspdf') || id.includes('qrcode') || id.includes('jsbarcode')) return 'voucher-vendor';
  if (id.includes('framer-motion')) return 'motion-vendor';
  return undefined;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: { manualChunks },
    },
  },
});
