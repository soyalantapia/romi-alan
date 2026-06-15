// Comprime una imagen del celular antes de subirla (redimensiona + JPEG).
// Devuelve un dataURL listo para mandar al backend.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function compressImage(file, maxDim = 1600, quality = 0.82) {
  const img = await loadImage(file)
  let { width, height } = img
  const max = Math.max(width, height)
  if (max > maxDim) {
    const scale = maxDim / max
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}
