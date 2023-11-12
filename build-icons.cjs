const fs = require('node:fs')
const path = require('node:path')

const svgDir = path.join(__dirname, 'src/svg')
const vueDir = path.join(__dirname, 'src/vue')
const outputDir = 'dist' // Assuming our build output directory is 'dist'

// Ensure the Vue directory exists
if (!fs.existsSync(vueDir))
  fs.mkdirSync(vueDir, { recursive: true })

// Function to generate exports.json
// Function to generate exports.json
function generateExportsJson() {
  const exportsObj = {}

  fs.readdirSync(vueDir).forEach((file) => {
    if (path.extname(file) === '.vue') {
      const componentName = path.basename(file, '.vue')
      // Point to the compiled JavaScript file in the output directory
      exportsObj[`./vue/${componentName}`] = `./${outputDir}/${componentName}.js`
    }
  })

  fs.writeFileSync('exports.json', JSON.stringify(exportsObj, null, 2))
  // eslint-disable-next-line no-console
  console.log('Generated exports.json')
}

fs.readdir(svgDir, (err, files) => {
  if (err) {
    console.error('Error reading SVG directory:', err)
    return
  }

  files.forEach((file) => {
    if (path.extname(file) === '.svg') {
      const svgFilePath = path.join(svgDir, file)
      const vueFilePath = path.join(vueDir, file.replace('.svg', '.vue'))

      // Skip if Vue file already exists
      if (!fs.existsSync(vueFilePath)) {
        const svgContent = fs.readFileSync(svgFilePath, 'utf8')
        const vueContent = `<template>\n${svgContent}\n</template>\n`

        fs.writeFileSync(vueFilePath, vueContent)
        // eslint-disable-next-line no-console
        console.log(`Created Vue file: ${vueFilePath}`)
      }
    }
  })

  generateExportsJson() // Call the function to generate exports.json
})
