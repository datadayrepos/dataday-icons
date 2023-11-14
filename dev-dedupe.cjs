// dedupe script for findign dupes svgs

const fs = require('node:fs')
const path = require('node:path')

const svgDir = path.join(__dirname, 'src/svg')
const svgFiles = fs.readdirSync(svgDir)

const normalizeContent = content => content.replace(/\s/g, '')

const svgContents = svgFiles.map((file) => {
  const content = fs.readFileSync(path.join(svgDir, file), 'utf8')
  return { name: file, content: normalizeContent(content) }
})

svgContents.forEach((svg1, index) => {
  for (let i = index + 1; i < svgContents.length; i++) {
    const svg2 = svgContents[i]
    if (svg1.content === svg2.content)
      // eslint-disable-next-line no-console
      console.log(`Duplicate found: ${svg1.name} and ${svg2.name}`)
  }
})
