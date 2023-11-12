import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'dist/main.js', // Entry point of your library
      name: 'Icons',
      formats: ['es'], // Preferred module format
    },
    rollupOptions: {
      // Externalize peer dependencies
      external: ['vue'],
      output: {
        // Provide globals here
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
