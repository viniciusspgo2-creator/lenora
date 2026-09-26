// Loja Lenora — Seed do catálogo
// Cria 6 categorias + 8 produtos com imagens reais (z-ai image-search) convertidas em WebP via sharp.
// Rodar:  bun run scripts/seed.ts

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import { db } from '../src/lib/db'
import { slugify } from '../src/lib/utils-lenora'

// ────────────────────────────────────────────────────────────────────────────
// Paths
// ────────────────────────────────────────────────────────────────────────────
// O script é invocado a partir da raiz do projeto (`bun run scripts/seed.ts`),
// então process.cwd() aponta para /home/z/my-project.
const PROJECT_ROOT = process.cwd()
const PUBLIC_UPLOADS = join(PROJECT_ROOT, 'public', 'uploads')
if (!existsSync(PUBLIC_UPLOADS)) mkdirSync(PUBLIC_UPLOADS, { recursive: true })

// ────────────────────────────────────────────────────────────────────────────
// image-search: chama o CLI `z-ai image-search` e parseia o JSON do stdout.
// O CLI imprime prefixo "🚀 Initializing..." + "🔎 Searching..." + "✅ Got N images"
// ANTES do JSON. Encontramos o primeiro `{` e parseamos dali até o final.
// ────────────────────────────────────────────────────────────────────────────
type SearchResult = {
  success: boolean
  query?: string
  count?: number
  results?: { original_url: string; caption?: string; source?: string }[]
}

function runImageSearch(query: string, count = 3): { original_url: string }[] {
  const args = [
    'image-search',
    '-q', query,
    '--count', String(count),
    '--gl', 'us',
    '--no-rank',
  ]
  console.log(`  [z-ai] searching: "${query}" (count=${count})`)
  let stdout: string
  try {
    stdout = execSync(`z-ai ${args.map(a => /\s/.test(a) ? `"${a}"` : a).join(' ')}`, {
      encoding: 'utf8',
      timeout: 120_000,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 16 * 1024 * 1024,
    })
  } catch (err: any) {
    console.warn(`  [z-ai] FAILED for "${query}": ${err.message}`)
    return []
  }
  const firstBrace = stdout.indexOf('{')
  if (firstBrace === -1) {
    console.warn(`  [z-ai] no JSON found in stdout for "${query}"`)
    return []
  }
  const jsonStr = stdout.slice(firstBrace)
  let parsed: SearchResult
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e: any) {
    console.warn(`  [z-ai] JSON.parse failed for "${query}": ${e.message}`)
    return []
  }
  if (!parsed.success || !parsed.results || parsed.results.length === 0) {
    console.warn(`  [z-ai] no results for "${query}" (success=${parsed.success})`)
    return []
  }
  console.log(`  [z-ai] got ${parsed.results.length} results`)
  return parsed.results.map(r => ({ original_url: r.original_url }))
}

// ────────────────────────────────────────────────────────────────────────────
// Download da imagem OSS via fetch nativo (Bun tem fetch global)
// ────────────────────────────────────────────────────────────────────────────
async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) {
      console.warn(`    [download] HTTP ${res.status} for ${url}`)
      return false
    }
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(destPath, buf)
    return true
  } catch (err: any) {
    console.warn(`    [download] FAILED for ${url}: ${err.message}`)
    return false
  }
}

// ────────────────────────────────────────────────────────────────────────────
// sharp: converte para WebP, resize max 1400px de largura, qualidade 82.
// ────────────────────────────────────────────────────────────────────────────
async function convertToWebP(srcPath: string, destPath: string): Promise<boolean> {
  try {
    await sharp(srcPath)
      .rotate()                  // respeita EXIF orientation
      .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(destPath)
    return true
  } catch (err: any) {
    console.warn(`    [sharp] FAILED for ${srcPath}: ${err.message}`)
    return false
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Pipeline completo: search → download → sharp → retorna caminho público /uploads/...
// ────────────────────────────────────────────────────────────────────────────
async function fetchProductImages(
  productSlug: string,
  query: string,
  count = 3,
): Promise<string[]> {
  const results = runImageSearch(query, count)
  const savedPaths: string[] = []
  for (let i = 0; i < results.length; i++) {
    const url = results[i].original_url
    const tmpSrc = join(PUBLIC_UPLOADS, `_tmp-${productSlug}-${i + 1}.bin`)
    const webpPath = join(PUBLIC_UPLOADS, `seed-${productSlug}-${i + 1}.webp`)
    const publicPath = `/uploads/seed-${productSlug}-${i + 1}.webp`
    console.log(`    [image ${i + 1}/${results.length}] downloading ${url}`)
    const ok = await downloadImage(url, tmpSrc)
    if (!ok) continue
    const conv = await convertToWebP(tmpSrc, webpPath)
    // remove tmp file
    try { unlinkSync(tmpSrc) } catch {}
    if (!conv) continue
    savedPaths.push(publicPath)
  }
  return savedPaths
}

// ────────────────────────────────────────────────────────────────────────────
// Catálogo: categorias
// ────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Vestidos',              slug: 'vestidos',   description: 'Vestidos midi e longos para todas as ocasiões', order: 1 },
  { name: 'Blusas & Camisas',      slug: 'blusas',     description: 'Blusas e camisas de seda, alfaiataria e tricô',   order: 2 },
  { name: 'Calças & Pantacurtas',  slug: 'calcas',     description: 'Calças pantalona, reta e pantacurtas',           order: 3 },
  { name: 'Saias',                 slug: 'saias',       description: 'Saias midi, plissadas e lápis',                  order: 4 },
  { name: 'Conjuntos',             slug: 'conjuntos',  description: 'Conjuntos de blazer + calça coordenados',         order: 5 },
  { name: 'Acessórios',            slug: 'acessorios', description: 'Lenços, echarpes e acessórios finos',            order: 6 },
]

// ────────────────────────────────────────────────────────────────────────────
// Catálogo: produtos (8)
// ────────────────────────────────────────────────────────────────────────────
type ColorDef = { name: string; hex: string }
type SizeDef = { name: string; stock?: number }
type ProductDef = {
  name: string
  categorySlug: string
  price: number
  compareAt?: number
  featured: boolean
  description: string
  colors: ColorDef[]
  sizes: SizeDef[]
  query: string
}

const PRODUCTS: ProductDef[] = [
  {
    name: 'Vestido Midi Plissado Preto',
    categorySlug: 'vestidos',
    price: 289.90,
    compareAt: 369.90,
    featured: true,
    description: 'Vestido midi em crepe plissado, com decote V e fenda lateral. Peça elegante para ocasiões especiais.',
    colors: [
      { name: 'Preto', hex: '#0a0a0a' },
      { name: 'Bordô', hex: '#6b2737' },
    ],
    sizes: [
      { name: 'P', stock: 5 },
      { name: 'M', stock: 8 },
      { name: 'G', stock: 6 },
      { name: 'GG', stock: 3 },
    ],
    query: 'elegant black pleated midi dress woman fashion studio',
  },
  {
    name: 'Vestido Florido Estampa Tropical',
    categorySlug: 'vestidos',
    price: 249.90,
    featured: true,
    description: 'Vestido longo fluido com estampa tropical exclusiva. Modelagem soltinha, alça fina regulável.',
    colors: [
      { name: 'Estampado', hex: '#2d5a3d' },
      { name: 'Verde', hex: '#4a7c59' },
    ],
    sizes: [
      { name: 'P', stock: 4 },
      { name: 'M', stock: 7 },
      { name: 'G', stock: 5 },
      { name: 'GG', stock: 2 },
      { name: 'EXG', stock: 1 },
    ],
    query: 'long floral tropical print dress woman summer',
  },
  {
    name: 'Blusa de Seda Off-White',
    categorySlug: 'blusas',
    price: 179.90,
    compareAt: 219.90,
    featured: true,
    description: 'Blusa em seda viscose, toque sedoso, gola careca. Versátil para o dia e a noite.',
    colors: [
      { name: 'Off-white', hex: '#f5f1e8' },
      { name: 'Preto', hex: '#0a0a0a' },
    ],
    sizes: [
      { name: 'P', stock: 6 },
      { name: 'M', stock: 9 },
      { name: 'G', stock: 5 },
      { name: 'GG', stock: 2 },
    ],
    query: 'white silk blouse woman elegant',
  },
  {
    name: 'Camisa Botão Bege Alfaiataria',
    categorySlug: 'blusas',
    price: 159.90,
    featured: false,
    description: 'Camisa de alfaiataria em tecido estruturado, botões em madrepérola.',
    colors: [
      { name: 'Bege', hex: '#d4c4a8' },
      { name: 'Branco', hex: '#ffffff' },
    ],
    sizes: [
      { name: 'P', stock: 5 },
      { name: 'M', stock: 8 },
      { name: 'G', stock: 4 },
      { name: 'GG', stock: 2 },
    ],
    query: 'beige tailored button shirt woman fashion',
  },
  {
    name: 'Calça Pantalona Cintura Alta',
    categorySlug: 'calcas',
    price: 199.90,
    compareAt: 249.90,
    featured: true,
    description: 'Calça pantalona de cintura alta, perna larga, em tergal com toque de seda.',
    colors: [
      { name: 'Preto', hex: '#0a0a0a' },
      { name: 'Areia', hex: '#c9b48a' },
    ],
    sizes: [
      { name: '36', stock: 4 },
      { name: '38', stock: 7 },
      { name: '40', stock: 6 },
      { name: '42', stock: 3 },
      { name: '44', stock: 2 },
    ],
    query: 'high waist wide leg trousers woman elegant black',
  },
  {
    name: 'Saia Midi Plissada Dourada',
    categorySlug: 'saias',
    price: 169.90,
    featured: false,
    description: 'Saia midi plissada com elástico na cintura, brilho sutil.',
    colors: [
      { name: 'Dourado', hex: '#c9a24b' },
      { name: 'Preto', hex: '#0a0a0a' },
    ],
    sizes: [
      { name: 'P', stock: 4 },
      { name: 'M', stock: 6 },
      { name: 'G', stock: 3 },
    ],
    query: 'gold pleated midi skirt woman fashion',
  },
  {
    name: 'Conjunto Blazer + Calça',
    categorySlug: 'conjuntos',
    price: 399.90,
    compareAt: 489.90,
    featured: true,
    description: 'Conjunto blazer alfaiataria + calça reta combinando. Tecido com caimento impecável.',
    colors: [
      { name: 'Preto', hex: '#0a0a0a' },
      { name: 'Areia', hex: '#c9b48a' },
    ],
    sizes: [
      { name: 'P', stock: 3 },
      { name: 'M', stock: 6 },
      { name: 'G', stock: 4 },
      { name: 'GG', stock: 2 },
    ],
    query: 'black blazer suit set woman elegant',
  },
  {
    name: 'Lenço Seda Estampa Animal',
    categorySlug: 'acessorios',
    price: 89.90,
    featured: false,
    description: 'Lenço em seda 100% com estampa animal exclusiva. 90x90cm. Diversas formas de usar.',
    colors: [
      { name: 'Estampado', hex: '#b8860b' },
      { name: 'Bordeaux', hex: '#5e1f2e' },
    ],
    sizes: [
      { name: 'Único', stock: 20 },
    ],
    query: 'silk scarf print animal woman accessory',
  },
]

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Loja Lenora — Seed ===\n')

  // 1. Limpa o banco (cascade cuida de images/colors/sizes/reviews/favorites)
  console.log('[1/3] Limpando banco existente...')
  await db.productImage.deleteMany()
  await db.productColor.deleteMany()
  await db.productSize.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  console.log('  → tabelas limpas\n')

  // 2. Cria categorias
  console.log('[2/3] Criando categorias...')
  const categoryBySlug: Record<string, { id: string }> = {}
  for (const c of CATEGORIES) {
    const cat = await db.category.create({
      data: { name: c.name, slug: c.slug, description: c.description, order: c.order, active: true },
    })
    categoryBySlug[c.slug] = { id: cat.id }
    console.log(`  → ${c.name} (${c.slug})`)
  }
  console.log()

  // 3. Cria produtos com imagens
  console.log('[3/3] Criando produtos com imagens WebP...')
  const summary: { name: string; slug: string; imgs: number; colors: number; sizes: number }[] = []

  for (const p of PRODUCTS) {
    const slug = slugify(p.name)
    const cat = categoryBySlug[p.categorySlug]
    if (!cat) {
      console.warn(`  ! categoria não encontrada para slug "${p.categorySlug}" — pulando ${p.name}`)
      continue
    }
    console.log(`\n  ▶ ${p.name}  [${slug}]`)

    // Busca imagens
    const imagePaths = await fetchProductImages(slug, p.query, 3)
    if (imagePaths.length === 0) {
      console.warn(`  ! nenhuma imagem obtida para ${p.name} — criando produto sem imagem`)
    }

    // Cria o produto com nested writes (images, colors, sizes)
    const product = await db.product.create({
      data: {
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        compareAt: p.compareAt ?? null,
        status: 'active',
        featured: p.featured,
        categoryId: cat.id,
        sku: `LEN-${slug.toUpperCase().replace(/-/g, '').slice(0, 12)}`,
        tags: p.featured ? 'destaque' : null,
        images: {
          create: imagePaths.map((url, i) => ({
            url,
            isMain: i === 0,
            order: i + 1,
          })),
        },
        colors: {
          create: p.colors.map(c => ({
            name: c.name,
            hex: c.hex,
            stock: 10,
          })),
        },
        sizes: {
          create: p.sizes.map(s => ({
            name: s.name,
            stock: s.stock ?? 5,
          })),
        },
      },
    })

    summary.push({
      name: product.name,
      slug: product.slug,
      imgs: imagePaths.length,
      colors: p.colors.length,
      sizes: p.sizes.length,
    })
    console.log(`  ✓ criado: ${product.id}  imgs=${imagePaths.length}`)
  }

  console.log('\n=== Resumo ===')
  console.table(summary)
  console.log(`\nTotal: ${summary.length} produtos criados, ${summary.reduce((a, p) => a + p.imgs, 0)} imagens WebP`)

  await db.$disconnect()
  console.log('\n✅ Seed concluído.')
}

main().catch(async (err) => {
  console.error('\n❌ Erro fatal no seed:', err)
  try { await db.$disconnect() } catch {}
  process.exit(1)
})
