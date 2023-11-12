import path from 'node:path'
import fs from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    // Remove the 'lib' section, as we're not building a single bundled library
    rollupOptions: {
      // Define the input files for individual module building
      input: {
        // Dynamically include all Vue files in the src/vue directory
        ...Object.fromEntries(
          fs.readdirSync(path.resolve(__dirname, 'src/vue'))
            .filter(file => file.endsWith('.vue'))
            .map(file => [file.slice(0, -4), `src/vue/${file}`]),
        ),
      },
      // Explicitly set preserveEntrySignatures to 'strict' or 'allow-extension'
      preserveEntrySignatures: 'strict',
      external: ['vue'],
      output: {
        // Ensures each component is exported as a separate module
        format: 'esm',
        dir: 'dist',
        entryFileNames: '[name].js',
        preserveModules: true, // Important for tree-shakability
        preserveModulesRoot: 'src/vue',

      },
    },
  },
})
