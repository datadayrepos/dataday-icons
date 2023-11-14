import path from 'node:path'
import fs from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const vueDir = path.resolve(__dirname, 'src/vue') // Define the vueDir variable

export default defineConfig({
  plugins: [vue()],
  build: {
    // Remove the 'lib' section, as we're not building a single bundled library
    rollupOptions: {
      // Define the input files for individual module building
      input: {
        index: path.resolve(__dirname, 'src/vue/index.ts'), // Include index.ts as an entry point

        // Dynamically include all Vue files in the src/vue directory
        ...Object.fromEntries(
          fs.readdirSync(vueDir)
            .filter(dir => fs.statSync(path.join(vueDir, dir)).isDirectory())
            .map(dir => [dir, `src/vue/${dir}/index.vue`]),
        ),
      },
      // Explicitly set preserveEntrySignatures to 'strict' or 'allow-extension'
      preserveEntrySignatures: 'strict',
      external: ['vue'],
      output: {
        // Ensures each component is exported as a separate module
        format: 'esm',
        dir: 'dist',
        entryFileNames: (chunkInfo) => {
          // Place the main index.js file directly in the dist directory
          if (chunkInfo.name === 'index')
            return 'index.js'

          // Place other components in their respective directories
          return '[name]/index.js'
        },
        preserveModules: true, // Important for tree-shakability
        preserveModulesRoot: 'src/vue',

      },
    },
  },
})
