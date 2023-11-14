const fs = require('node:fs')
const path = require('node:path')

const svgDir = path.join(__dirname, 'src/svg')
const viewDir = path.join(__dirname, 'view')
const indexPath = path.join(viewDir, 'index.html')

if (!fs.existsSync(viewDir))
  fs.mkdirSync(viewDir, { recursive: true })

let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles.css">
    <title>Icon Viewer</title>
</head>
<body>
    <table>
`

fs.readdirSync(svgDir).forEach((file) => {
  if (path.extname(file) === '.svg') {
    const iconName = path.basename(file, '.svg')
    const svgContent = fs.readFileSync(path.join(svgDir, file), 'utf8')
    // Assuming svgContent holds our raw SVG string
    const encodedSvgContent = encodeURIComponent(svgContent)
    htmlContent += `
        <tr>
            <td class="icon-cell" style=" color: white; ">${svgContent}</td>
            <td>${iconName}</td>
            <td><button onclick="copyToClipboard(&apos;import {${iconName}} from &amp;apos;@datadayrepos/icons&amp;apos;&apos;)">Import Statement</button></td>
            <td><button onclick="copyToClipboard(&apos;${iconName}: defineAsyncComponent(() =&gt; import(&amp;apos;@datadayrepos/icons/${iconName}&amp;apos;))&apos;)">Dynamic Import</button></td>
            <td><button onclick="copySvgToClipboard('${encodedSvgContent}')">Copy SVG</button></td>
            </tr>
    `
  }
})

htmlContent += `
    </table>
    <script src="script.js"></script>
</body>
</html>
`

fs.writeFileSync(indexPath, htmlContent)
// eslint-disable-next-line no-console
console.log(`Created HTML file: ${indexPath}`)
