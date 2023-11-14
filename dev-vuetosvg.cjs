// dev helper for taking named vue files, extracting the svg, and saving them as svg files in src dir.
// IMPORTANT: This operation is irreversible and will delete the original file and everything in it.
// Ensure you have backups or are certain about this operation before running the script.
const fs = require('node:fs')
const path = require('node:path')

const devDir = path.join(__dirname, 'dev/single')
const svgDir = path.join(__dirname, 'src/svg')

if (!fs.existsSync(svgDir))
  fs.mkdirSync(svgDir, { recursive: true })

fs.readdirSync(devDir).forEach((file) => {
  if (path.extname(file) === '.vue') {
    const vueFilePath = path.join(devDir, file)
    const svgFilePath = path.join(svgDir, `${path.basename(file, '.vue')}.svg`)

    if (fs.existsSync(svgFilePath)) {
      // eslint-disable-next-line no-console
      console.log(`SVG file already exists, skipping: ${svgFilePath}`)
      return
    }

    const content = fs.readFileSync(vueFilePath, 'utf8')
    const svgMatch = content.match(/<template>([\s\S]*?)<\/template>/i)

    if (svgMatch && svgMatch[1]) {
      const svgContent = svgMatch[1]
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim()

      fs.writeFileSync(svgFilePath, svgContent)
      // eslint-disable-next-line no-console
      console.log(`Created SVG file: ${svgFilePath}`)

      // Delete the original Vue file
      fs.unlinkSync(vueFilePath)
      // eslint-disable-next-line no-console
      console.log(`Deleted original Vue file: ${vueFilePath}`)
    }
  }
})
