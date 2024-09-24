// build script that should be run for all new svg files or when republishing the package
const fs = require('node:fs')
const path = require('node:path')

const svgDir = path.join(__dirname, 'src/svg')
const vueDir = path.join(__dirname, 'src/vue')

// Ensure the Vue directory exists
if (!fs.existsSync(vueDir))
  fs.mkdirSync(vueDir, { recursive: true })

// Create a directory for each SVG file and an index.vue file inside
fs.readdirSync(svgDir).forEach((file) => {
  if (path.extname(file) === '.svg') {
    const baseName = path.basename(file, '.svg')
    const svgFilePath = path.join(svgDir, file)

    // Create a directory for each component in the vueDir
    const componentVueDir = path.join(vueDir, baseName)
    if (!fs.existsSync(componentVueDir))
      fs.mkdirSync(componentVueDir, { recursive: true })

    const vueFilePath = path.join(componentVueDir, 'index.vue')

    // Read SVG content and write the Vue file
    const svgContent = fs.readFileSync(svgFilePath, 'utf8')
    const vueContent = `<template>\n${svgContent}\n</template>\nx`
    fs.writeFileSync(vueFilePath, vueContent) //  pnpm typecheckVue

    // eslint-disable-next-line no-console
    console.log(`Created Vue file: ${vueFilePath}`)
  }
})

// Generate index file
let indexContent = ''
fs.readdirSync(vueDir).forEach((dir) => {
  if (fs.statSync(path.join(vueDir, dir)).isDirectory())
    indexContent += `export { default as ${dir} } from './${dir}/index.vue';\n`
})
fs.writeFileSync(path.join(vueDir, 'index.ts'), indexContent)
// eslint-disable-next-line no-console
console.log('Generated index.ts')

/*
updatePackageJsonExports()

function updatePackageJsonExports() {
  const packageJsonPath = path.join(__dirname, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  // Initialize the exports object
  const exports = {
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.mjs',
      require: './dist/index.cjs',
    },
  }
  // Update package.json
  packageJson.exports = exports
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  // Populate exports for each component

  fs.readdirSync(vueDir).forEach((dir) => {
    if (fs.statSync(path.join(vueDir, dir)).isDirectory()) {
      exports[`./${dir}`] = {
        types: `./dist/${dir}/index.d.ts`,
        import: `./dist/${dir}/index.mjs`,
        require: `./dist/${dir}/index.cjs`,

      }
    }
  })

  //  console.log('Updated package.json exports')
}
*/
/* DEPRECATED  - legacy this creates a moduler package.son with each file listed
function updatePackageJsonExports() {
  const packageJsonPath = path.join(__dirname, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  // Initialize the exports object
  const exports = {
    '.': {
      module: './dist/index.js',
      types: './dist/index.d.ts',
    },
  }

  // Populate exports for each component
  fs.readdirSync(vueDir).forEach((dir) => {
    if (fs.statSync(path.join(vueDir, dir)).isDirectory()) {
      exports[`./${dir}`] = {
        module: `./dist/${dir}/index.js`,
        types: `./dist/${dir}/index.vue.d.ts`,
      }
    }
  })

  // Update package.json
  packageJson.exports = exports
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  // eslint-disable-next-line no-console
  console.log('Updated package.json exports')
}
*/
