// Gera os favicons da Loja Lenora (paleta rosa):
//  - src/app/favicon.ico   (32×32 PNG embutido em ICO)
//  - src/app/icon.png      (256×256)
//  - src/app/apple-icon.png(180×180)
//  - public/logo.svg       (SVG vetorial atualizado)
// Rodar: bun run scripts/make-favicon.ts
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

// Monograma "L" geométrico + ponto da marca, sobre quadrado rosa arredondado
const SVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ec4899"/>
      <stop offset="0.55" stop-color="#db2777"/>
      <stop offset="1" stop-color="#9d174d"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="496" height="496" rx="112" fill="url(#g)"/>
  <rect x="8" y="8" width="496" height="496" rx="112" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="10"/>
  <!-- L -->
  <rect x="146" y="112" width="92" height="288" rx="20" fill="#ffffff"/>
  <rect x="146" y="308" width="196" height="92" rx="20" fill="#ffffff"/>
  <!-- ponto da marca -->
  <circle cx="396" cy="354" r="34" fill="#ffd6e8"/>
</svg>`

async function png(size: number): Promise<Buffer> {
  return sharp(Buffer.from(SVG), { density: 384 })
    .resize(size, size)
    .png()
    .toBuffer()
}

// Empacota um PNG dentro de um contêiner ICO (1 imagem)
function pngToIco(pngBuf: Buffer): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reservado
  header.writeUInt16LE(1, 2) // tipo: ícone
  header.writeUInt16LE(1, 4) // nº de imagens
  const entry = Buffer.alloc(16)
  entry.writeUInt8(32, 0) // largura (32 = 32px)
  entry.writeUInt8(32, 1) // altura
  entry.writeUInt8(0, 2) // paleta
  entry.writeUInt8(0, 3) // reservado
  entry.writeUInt16LE(1, 4) // planos
  entry.writeUInt16LE(32, 6) // bpp
  entry.writeUInt32LE(pngBuf.length, 8) // tamanho do PNG
  entry.writeUInt32LE(22, 12) // offset (6 + 16)
  return Buffer.concat([header, entry, pngBuf])
}

const [ico32, icon256, apple180] = await Promise.all([png(32), png(256), png(180)])

writeFileSync('/home/z/my-project/src/app/favicon.ico', pngToIco(ico32))
writeFileSync('/home/z/my-project/src/app/icon.png', icon256)
writeFileSync('/home/z/my-project/src/app/apple-icon.png', apple180)
writeFileSync('/home/z/my-project/public/logo.svg', SVG.trim())
console.log('✅ favicons gerados: favicon.ico (32), icon.png (256), apple-icon.png (180), logo.svg')
