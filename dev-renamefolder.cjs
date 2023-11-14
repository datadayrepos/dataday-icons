// dev helper to rename folders. Purpose is to rename fodlers to a standardized nomenclature to be used as filenames later.
// IMPORTANT: This operation is irreversible and will permanently change the foldername.
// Ensure you have backups or are certain about this operation before running the script.

const fs = require('node:fs')
const path = require('node:path')

const baseDir = path.join(__dirname, 'dev/folder')

if (!fs.existsSync(baseDir)) {
  console.error('Base directory does not exist:', baseDir)
  process.exit(1)
}

fs.readdirSync(baseDir, { withFileTypes: true }).forEach((dirent) => {
  if (dirent.isDirectory()) {
    const folderName = dirent.name
    let newName = folderName

    // Ensure first character is capitalized
    if (newName.charAt(0) !== newName.charAt(0).toUpperCase())
      newName = newName.charAt(0).toUpperCase() + newName.slice(1)

    // Ensure it ends with 'Icon'
    if (!newName.endsWith('Icon')) {
      if (newName.endsWith('icon'))
        newName = `${newName.slice(0, -4)}Icon`

      else
        newName += 'Icon'
    }

    // Rename the folder if necessary
    if (newName !== folderName) {
      const oldPath = path.join(baseDir, folderName)
      const newPath = path.join(baseDir, newName)
      fs.renameSync(oldPath, newPath)
      // eslint-disable-next-line no-console
      console.log(`Renamed folder: ${folderName} -> ${newName}`)
    }
  }
})
