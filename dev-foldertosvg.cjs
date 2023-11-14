// Dev helper to transpose icon vue fiels thatare in a folder with an icon name and have files called index.vue
// IMPORTANT: This operation is irreversible and will delete the folder and everything in it.
// Ensure you have backups or are certain about this operation before running the script.
const fs = require('node:fs')
const path = require('node:path')

const baseDir = path.join(__dirname, 'dev/folder')
const svgDir = path.join(__dirname, 'src/svg')

if (!fs.existsSync(svgDir))
  fs.mkdirSync(svgDir, { recursive: true })

fs.readdirSync(baseDir, { withFileTypes: true }).forEach((dirent) => {
  if (dirent.isDirectory()) {
    const folderName = dirent.name
    const vueFilePath = path.join(baseDir, folderName, 'index.vue')
    const svgFilePath = path.join(svgDir, `${folderName}.svg`)

    if (fs.existsSync(svgFilePath)) {
      // eslint-disable-next-line no-console
      console.log(`SVG file already exists, skipping: ${svgFilePath}`)
      return
    }

    if (fs.existsSync(vueFilePath)) {
      const content = fs.readFileSync(vueFilePath, 'utf8')
      const svgMatch = content.match(/<template>([\s\S]*?)<\/template>/i)

      if (svgMatch && svgMatch[1]) {
        const svgContent = svgMatch[1]
          .replace(/<!--[\s\S]*?-->/g, '')
          .trim()

        fs.writeFileSync(svgFilePath, svgContent)
        // eslint-disable-next-line no-console
        console.log(`Created SVG file: ${svgFilePath}`)

        // Delete the original folder and its contents
        const folderPath = path.join(baseDir, folderName)
        fs.rmdirSync(folderPath, { recursive: true })
        // eslint-disable-next-line no-console
        console.log(`Deleted original folder: ${folderPath}`)
      }
    }
  }
})
