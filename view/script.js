window.copyToClipboard = (text) => {
  // Replace HTML entities with their respective characters
  const formattedText = text.replace(/&apos;/g, '\'').replace(/&amp;/g, '&')

  navigator.clipboard.writeText(formattedText)
  // .then(() => alert('Copied to clipboard!'))
    .catch(err => console.error('Error copying text: ', err))
}

window.copySvgToClipboard = (encodedText) => {
  const text = decodeURIComponent(encodedText)
  navigator.clipboard.writeText(text)
    // .then(() => alert('Copied to clipboard!'))
    .catch(err => console.error('Error copying text: ', err))
}
