// Loja Lenora — Reseed Categories & Products
// Substitui TODAS as categorias e produtos por um novo conjunto (7 categorias + 8 produtos).
// Rodar:  bun run scripts/reseed-categories.ts
//
// Padrões:
//  - z-ai image-search CLI (saída JSON parseada do stdout)
//  - fetch para download das imagens (OSS-hosted)
//  - sharp para converter em WebP (resize 1400px, quality 82)
//  - Prisma nested writes para images/colors/sizes
//  - Ao final, cada categoria recebe `image` = main image do 1º produto

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { db } from '../src/lib/db'
import { slugify } from '../src/lib/utils-lenora'

// ────────────────────────────────────────────────────────────────────────────
// Paths
// ────────────────────────────────────────────────────────────────────────────
const PROJECT_ROOT = process.cwd()
const PUBLIC_UPLOADS = join(PROJECT_ROOT, 'public', 'uploads')
const TMP_DIR = '/tmp'
if (!existsSync(PUBLIC_UPLOADS)) mkdirSync(PUBLIC_UPLOADS, { recursive: true })

// ────────────────────────────────────────────────────────────────────────────
// image-search: chama o CLI `z-ai image-search` e parseia o JSON do stdout.
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
    '-o', `${TMP_DIR}/rs-${slugify(query)}.json`,
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
// Download da imagem OSS via fetch nativo
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
// sharp: converte para WebP, resize max 1400px largura, qualidade 82.
// ────────────────────────────────────────────────────────────────────────────
async function convertToWebP(srcPath: string, destPath: string): Promise<boolean> {
  try {
    await sharp(srcPath)
      .rotate()
      .resize({ width: 1400, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(destPath)
    return true
  } catch (err: any) {
    console.warn(`    [sharp] FAILED for ${srcPath}: ${err.message}`)
    return false
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Pipeline completo: search → download → sharp → retorna caminhos públicos.
// Inclui retry + fallback query: se a busca retornar 0, tenta a mesma query 1x,
// depois tenta a fallback. Mínimo 0 imagens (cria produto sem imagem se tudo falhar).
// ────────────────────────────────────────────────────────────────────────────
async function fetchProductImages(
  productSlug: string,
  query: string,
  fallbackQuery: string,
  count = 3,
): Promise<string[]> {
  let results = runImageSearch(query, count)
  if (results.length === 0) {
    // retry 1x mesma query
    console.log(`  [z-ai] retrying same query once...`)
    results = runImageSearch(query, count)
  }
  if (results.length === 0 && fallbackQuery) {
    // fallback query
    console.log(`  [z-ai] falling back to: "${fallbackQuery}"`)
    results = runImageSearch(fallbackQuery, count)
  }

  const savedPaths: string[] = []
  for (let i = 0; i < results.length; i++) {
    const url = results[i].original_url
    const tmpSrc = join(TMP_DIR, `rs-${productSlug}-${i + 1}.bin`)
    const webpPath = join(PUBLIC_UPLOADS, `rs-${productSlug}-${i + 1}.webp`)
    const publicPath = `/uploads/rs-${productSlug}-${i + 1}.webp`
    console.log(`    [image ${i + 1}/${results.length}] downloading ${url}`)
    const ok = await downloadImage(url, tmpSrc)
    if (!ok) continue
    const conv = await convertToWebP(tmpSrc, webpPath)
    try { unlinkSync(tmpSrc) } catch {}
    if (!conv) continue
    savedPaths.push(publicPath)
  }
  return savedPaths
}

// ────────────────────────────────────────────────────────────────────────────
// Novas categorias (7) — ordem exata conforme especificado
// ────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    name: 'CROPPED',
    slug: 'cropped',
    description: 'Cropped em tricot, viscose e tecidos fluidos para compor looks modernos',
    order: 1,
  },
  {
    name: 'BLUSA',
    slug: 'blusa',
    description: 'Blusas de seda, alfaiataria e modelagens elegantes do dia à noite',
    order: 2,
  },
  {
    name: 'BODY',
    slug: 'body',
    description: 'Bodys canelados e fluidos, básicos curingas do guarda-roupa feminino',
    order: 3,
  },
  {
    name: 'BLUSA CANELADA',
    slug: 'blusa-canelada',
    description: 'Blusas caneladas de gola alta e mangas longas, estrutura e estilo',
    order: 4,
  },
  {
    name: 'REGATA',
    slug: 'regata',
    description: 'Regatas frescas em viscose e modelagens leves para o dia a dia',
    order: 5,
  },
  {
    name: 'TOP - CANELADO',
    slug: 'top-canelado',
    description: 'Tops canelados com decotes variados, curingas e versáteis',
    order: 6,
  },
  {
    name: 'TOMARA QUE CAIA',
    slug: 'tomara-que-caia',
    description: 'Tomara que caixa em cetim e modelagens para festas e ocasiões especiais',
    order: 7,
  },
]

// ────────────────────────────────────────────────────────────────────────────
// Novos produtos (8)
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
  fallbackQuery: string
}

const PRODUCTS: ProductDef[] = [
  {
    name: 'Cropped Tricot com Botão',
    categorySlug: 'cropped',
    price: 119.90,
    compareAt: 149.90,
    featured: true,
    description: 'Cropped em tricot macio com botões em madrepérola. Versátil pra usar com calça ou saia.',
    colors: [
      { name: 'Preto', hex: '#0a0a0a' },
      { name: 'Off-white', hex: '#f6f4f0' },
    ],
    sizes: [
      { name: 'P', stock: 5 },
      { name: 'M', stock: 8 },
      { name: 'G', stock: 6 },
      { name: 'GG', stock: 3 },
    ],
    query: 'black knit crop top button detail woman fashion',
    fallbackQuery: 'black knit crop top woman fashion',
  },
  {
    name: 'Cropped Ombro a Ombro',
    categorySlug: 'cropped',
    price: 109.90,
    featured: false,
    description: 'Cropped decote ombro a ombro, tecido fluido. Para um look fresco e elegante.',
    colors: [
      { name: 'Branco', hex: '#ffffff' },
      { name: 'Preto', hex: '#0a0a0a' },
    ],
    sizes: [
      { name: 'P', stock: 5 },
      { name: 'M', stock: 7 },
      { name: 'G', stock: 4 },
    ],
    query: 'white off shoulder crop top woman fashion',
    fallbackQuery: 'off shoulder crop top woman',
  },
  {
    name: 'Blusa de Seda Manga Longa',
    categorySlug: 'blusa',
    price: 179.90,
    compareAt: 219.90,
    featured: true,
    description: 'Blusa em seda viscose, manga longa, toque sedoso e caimento impecável.',
    colors: [
      { name: 'Off-white', hex: '#f6f4f0' },
      { name: 'Preto', hex: '#0a0a0a' },
    ],
    sizes: [
      { name: 'P', stock: 6 },
      { name: 'M', stock: 9 },
      { name: 'G', stock: 5 },
      { name: 'GG', stock: 2 },
    ],
    query: 'white silk long sleeve blouse woman elegant',
    fallbackQuery: 'silk long sleeve blouse woman',
  },
  {
    name: 'Body Canelado Alça Fina',
    categorySlug: 'body',
    price: 89.90,
    featured: false,
    description: 'Body canelado de alça fina, modelagem justa e confortável. Básico curinga.',
    colors: [
      { name: 'Preto', hex: '#0a0a0a' },
      { name: 'Branco', hex: '#ffffff' },
    ],
    sizes: [
      { name: 'P', stock: 6 },
      { name: 'M', stock: 8 },
      { name: 'G', stock: 5 },
      { name: 'GG', stock: 2 },
    ],
    query: 'black ribbed tank bodysuit woman fashion',
    fallbackQuery: 'black ribbed bodysuit woman',
  },
  {
    name: 'Blusa Canelada Gola Alta',
    categorySlug: 'blusa-canelada',
    price: 99.90,
    compareAt: 129.90,
    featured: true,
    description: 'Blusa canelada de gola alta, mangas longas. Estrutura e estilo em uma peça só.',
    colors: [
      { name: 'Preto', hex: '#0a0a0a' },
      { name: 'Bordô', hex: '#6b2737' },
    ],
    sizes: [
      { name: 'P', stock: 5 },
      { name: 'M', stock: 8 },
      { name: 'G', stock: 5 },
      { name: 'GG', stock: 2 },
    ],
    query: 'black ribbed turtleneck long sleeve top woman',
    fallbackQuery: 'ribbed turtleneck long sleeve woman',
  },
  {
    name: 'Regata Viscose Fluida',
    categorySlug: 'regata',
    price: 89.90,
    featured: false,
    description: 'Regata de viscose fluida, fresca e leve. Permite composições infinitas.',
    colors: [
      { name: 'Bege', hex: '#d4c4a8' },
      { name: 'Preto', hex: '#0a0a0a' },
    ],
    sizes: [
      { name: 'P', stock: 6 },
      { name: 'M', stock: 8 },
      { name: 'G', stock: 5 },
      { name: 'GG', stock: 2 },
    ],
    query: 'beige viscose flowy tank top woman fashion',
    fallbackQuery: 'beige flowy tank top woman',
  },
  {
    name: 'Top Canelado Decote V',
    categorySlug: 'top-canelado',
    price: 79.90,
    compareAt: 99.90,
    featured: true,
    description: 'Top canelado com decote V, modelagem que valoriza. Pra usar por baixo ou à mostra.',
    colors: [
      { name: 'Preto', hex: '#0a0a0a' },
      { name: 'Branco', hex: '#ffffff' },
    ],
    sizes: [
      { name: 'P', stock: 5 },
      { name: 'M', stock: 7 },
      { name: 'G', stock: 4 },
    ],
    query: 'black ribbed v-neck crop top woman',
    fallbackQuery: 'black v-neck ribbed top woman',
  },
  {
    name: 'Tomara Que Caixa em Cetim',
    categorySlug: 'tomara-que-caia',
    price: 139.90,
    featured: true,
    description: 'Tomara que caixa em cetim com brilho sutil. Elegância pra festas e ocasiões especiais.',
    colors: [
      { name: 'Preto', hex: '#0a0a0a' },
      { name: 'Dourado', hex: '#c9a24b' },
      { name: 'Off-white', hex: '#f6f4f0' },
    ],
    sizes: [
      { name: 'P', stock: 4 },
      { name: 'M', stock: 6 },
      { name: 'G', stock: 4 },
      { name: 'GG', stock: 2 },
    ],
    query: 'black satin tube top bandeau woman elegant',
    fallbackQuery: 'black satin bandeau top woman',
  },
]

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Loja Lenora — Reseed Categorias & Produtos ===\n')

  // 1. Limpa banco (deleta filhos antes dos pais p/ FK constraints, cascade cuida do resto)
  console.log('[1/4] Limpando banco existente...')
  await db.favorite.deleteMany()
  await db.productImage.deleteMany()
  await db.productColor.deleteMany()
  await db.productSize.deleteMany()
  await db.product.deleteMany()
  await db.productReview.deleteMany()
  await db.category.deleteMany()
  console.log('  → tabelas limpas (favorite, productImage, productColor, productSize, product, productReview, category)\n')

  // 2. Cria as 7 novas categorias
  console.log('[2/4] Criando 7 novas categorias...')
  const categoryBySlug: Record<string, { id: string }> = {}
  for (const c of CATEGORIES) {
    const cat = await db.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        order: c.order,
        active: true,
      },
    })
    categoryBySlug[c.slug] = { id: cat.id }
    console.log(`  → [${c.order}] ${c.name} (${c.slug})`)
  }
  console.log()

  // 3. Cria 8 produtos com imagens (z-ai → download → sharp → webp)
  console.log('[3/4] Criando 8 produtos com imagens WebP...')
  const summary: { name: string; slug: string; imgs: number; colors: number; sizes: number }[] = []
  // Map: categorySlug → first product's main image URL (for category.image)
  const mainImageByCatSlug: Record<string, string | null> = {}

  for (const p of PRODUCTS) {
    const slug = slugify(p.name)
    const cat = categoryBySlug[p.categorySlug]
    if (!cat) {
      console.warn(`  ! categoria não encontrada para slug "${p.categorySlug}" — pulando ${p.name}`)
      continue
    }
    console.log(`\n  ▶ ${p.name}  [${slug}]  (cat: ${p.categorySlug})`)

    // Busca + download + conversão das imagens
    const imagePaths = await fetchProductImages(slug, p.query, p.fallbackQuery, 3)
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

    // Registra a primeira imagem (main) deste produto como candidato a category.image
    if (imagePaths.length > 0 && !(p.categorySlug in mainImageByCatSlug)) {
      mainImageByCatSlug[p.categorySlug] = imagePaths[0]
    }

    summary.push({
      name: product.name,
      slug: product.slug,
      imgs: imagePaths.length,
      colors: p.colors.length,
      sizes: p.sizes.length,
    })
    console.log(`  ✓ criado: ${product.id}  imgs=${imagePaths.length}  colors=${p.colors.length}  sizes=${p.sizes.length}`)
  }

  // 4. Seta category.image para a main image do 1º produto de cada categoria
  console.log('\n[4/4] Setando image de cada categoria (main image do 1º produto)...')
  for (const c of CATEGORIES) {
    const imgUrl = mainImageByCatSlug[c.slug]
    if (!imgUrl) {
      console.warn(`  ! nenhum produto com imagem para categoria "${c.slug}" — image ficará null`)
      continue
    }
    await db.category.update({
      where: { slug: c.slug },
      data: { image: imgUrl },
    })
    console.log(`  → ${c.name} (${c.slug}) → ${imgUrl}`)
  }

  console.log('\n=== Resumo ===')
  console.table(summary)
  console.log(
    `\nTotal: ${summary.length} produtos criados, ${summary.reduce((a, p) => a + p.imgs, 0)} imagens WebP`,
  )
  console.log(`Categorias: ${CATEGORIES.length}`)

  await db.$disconnect()
  console.log('\n✅ Reseed concluído.')
}

main().catch(async (err) => {
  console.error('\n❌ Erro fatal no reseed:', err)
  try { await db.$disconnect() } catch {}
  process.exit(1)
})
