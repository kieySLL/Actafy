import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-engine':  ['jspdf', 'jspdf-autotable'],
          'word-engine': ['docx', 'file-saver'],
          'excel-engine':['xlsx'],
        },
      },
    },
  },
})
