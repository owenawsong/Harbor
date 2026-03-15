/**
 * Generate Harbor extension icons using Canvas
 * Run with: node generate-icons.js
 */

const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const sizes = [16, 48, 128]

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background - rounded rect
  const radius = size * 0.2
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.lineTo(size - radius, 0)
  ctx.quadraticCurveTo(size, 0, size, radius)
  ctx.lineTo(size, size - radius)
  ctx.quadraticCurveTo(size, size, size - radius, size)
  ctx.lineTo(radius, size)
  ctx.quadraticCurveTo(0, size, 0, size - radius)
  ctx.lineTo(0, radius)
  ctx.quadraticCurveTo(0, 0, radius, 0)
  ctx.closePath()

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#4f5fe8')
  grad.addColorStop(1, '#3240ad')
  ctx.fillStyle = grad
  ctx.fill()

  // Letter "H"
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.round(size * 0.6)}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('H', size / 2, size / 2)

  return canvas.toBuffer('image/png')
}

for (const size of sizes) {
  const buffer = generateIcon(size)
  const outputPath = path.join(__dirname, 'public', 'icons', `icon${size}.png`)
  fs.writeFileSync(outputPath, buffer)
  console.log(`Generated ${outputPath}`)
}

console.log('Icons generated successfully!')
