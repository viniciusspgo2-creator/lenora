// Loja Lenora — Seed local (offline)
// Cria 4 categorias + 8 produtos usando as imagens JÁ EXISTENTES em public/uploads
// (padrão rs-<slug>-<n>.webp). Não baixa nada da internet.
// Rodar:  bun run scripts/seed-lenora.ts

import { db } from '../src/lib/db'
import { DEFAULT_SETTINGS, withPaletteVersion } from '../src/lib/settings'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const UPLOADS = join(process.cwd(), 'public', 'uploads')

function imgs(slug: string): string[] {
  const out: string[] = []
  for (let i = 1; i <= 3; i++) {
    const p = `/uploads/rs-${slug}-${i}.webp`
    if (existsSync(join(UPLOADS, `rs-${slug}-${i}.webp`))) out.push(p)
  }
  return out
}

async function main() {
  console.log('→ Limpando dados antigos…')
  await db.orderItem.deleteMany()
  await db.financialEntry.deleteMany()
  await db.order.deleteMany()
  await db.favorite.deleteMany()
  await db.session.deleteMany()
  await db.productReview.deleteMany()
  await db.productImage.deleteMany()
  await db.productColor.deleteMany()
  await db.productSize.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.coupon.deleteMany()

  console.log('→ Criando categorias…')
  const blusas = await db.category.create({
    data: { name: 'Blusas', slug: 'blusas', description: 'Blusas com modelagem fluida e tecidos que valorizam o corpo.', order: 1, image: '/uploads/rs-blusa-canelada-gola-alta-1.webp' },
  })
  const croppeds = await db.category.create({
    data: { name: 'Croppeds', slug: 'croppeds', description: 'Croppeds versáteis do dia à noite, com caimento perfeito.', order: 2, image: '/uploads/rs-cropped-ombro-a-ombro-1.webp' },
  })
  const bodies = await db.category.create({
    data: { name: 'Bodies & Regatas', slug: 'bodies-regatas', description: 'Bodies e regatas de segunda pele — a base do look perfeito.', order: 3, image: '/uploads/rs-body-canelado-alca-fina-1.webp' },
  })
  const tops = await db.category.create({
    data: { name: 'Tops', slug: 'tops', description: 'Tops e peças acetinadas para ocasiões especiais.', order: 4, image: '/uploads/rs-tomara-que-caixa-em-cetim-1.webp' },
  })

  // Cores padrão da paleta rosa da loja
  const ROSA = { name: 'Rosa', hex: '#db2777' }
  const ROSA_BEBE = { name: 'Rosa Bebê', hex: '#f3c6d8' }
  const PRETO = { name: 'Preto', hex: '#1a1a1a' }
  const OFFWHITE = { name: 'Off-white', hex: '#f5f1e8' }
  const BORDO = { name: 'Bordô', hex: '#6b2737' }
  const AREIA = { name: 'Areia', hex: '#d4c4a8' }

  const sizesPM = (stock = 6) =>
    ['P', 'M', 'G', 'GG'].map((name, i) => ({ name, stock: Math.max(2, stock - i) }))

  type P = {
    slug: string; name: string; description: string; price: number
    compareAt?: number; featured?: boolean; tags?: string
    category: string; colors: { name: string; hex: string }[]
  }

  const products: P[] = [
    {
      slug: 'blusa-canelada-gola-alta',
      name: 'Blusa Canelada Gola Alta',
      description:
        'A blusa canelada de gola alta é aquele coringa que toda mulher precisa no armário. Malha canelada de alta elasticidade que abraça o corpo sem marcar, gola alta estruturada e punhos firmes. Combina com calça de alfaiataria, jeans e saias — do escritório ao happy hour.',
      price: 89.9, compareAt: 109.9, featured: true, tags: 'destaque', category: blusas.id,
      colors: [ROSA, PRETO, OFFWHITE],
    },
    {
      slug: 'blusa-de-seda-manga-longa',
      name: 'Blusa de Seda Manga Longa',
      description:
        'Elegância em cada movimento. Confeccionada em viscose de toque acetinado (efeito seda), com manga longa e caimento fluido que desliza no corpo. Peça sofisticada para jantares, eventos e composições alfaiataria. Decote discretamente transpassado com acabamento delicado.',
      price: 139.9, featured: true, tags: 'destaque', category: blusas.id,
      colors: [AREIA, PRETO, ROSA_BEBE],
    },
    {
      slug: 'body-canelado-alca-fina',
      name: 'Body Canelado Alça Fina',
      description:
        'O body canelado de alça fina é a base perfeita para qualquer look. Malha canelada macia com alta elasticidade, alças ajustáveis e fechamento prático na parte íntima. Use com jeans, saias ou por baixo de blazers — modelagem que valoriza a silhueta.',
      price: 79.9, featured: true, category: bodies.id,
      colors: [PRETO, ROSA, OFFWHITE],
    },
    {
      slug: 'regata-viscose-fluida',
      name: 'Regata Viscose Fluida',
      description:
        'Regata em viscose premium com caimento super fluido e leve. Alças finas discretas e decote suave — peça versátil que funciona sozinha no calor ou como base de camadas nos dias mais frios. Tecido que não amassa e acompanha o corpo com elegância.',
      price: 69.9, category: bodies.id,
      colors: [OFFWHITE, ROSA_BEBE, PRETO],
    },
    {
      slug: 'cropped-ombro-a-ombro',
      name: 'Cropped Ombro a Ombro',
      description:
        'O cropped ombro a ombro que virou queridinho. Modelagem com ombros à mostra, manga curta bufante discreta e barra reta. Malha estruturada que sustenta o formato sem escorregar. Perfeito com calça de cintura alta ou saia midi.',
      price: 89.9, compareAt: 99.9, featured: true, tags: 'destaque', category: croppeds.id,
      colors: [ROSA, OFFWHITE, PRETO],
    },
    {
      slug: 'cropped-tricot-com-botao',
      name: 'Cropped Tricot com Botão',
      description:
        'Cropped de tricot canelado com fechamento frontal em botões forrados. Textura macia e quentinha, ideal para o meio de ano. Use fechado como blusa ou aberto como sobreposição sobre bodies e regatas. Um clássico que nunca sai de moda.',
      price: 99.9, category: croppeds.id,
      colors: [AREIA, ROSA_BEBE, BORDO],
    },
    {
      slug: 'top-canelado-decote-v',
      name: 'Top Canelado Decote V',
      description:
        'Top canelado com decote V profundo e alças largas com sustentação. Malha firme com boa compressão que modela sem apertar. Peça coringa para sobreposições, looks casuais ou produção mais elaborada com blazer.',
      price: 59.9, compareAt: 79.9, category: tops.id,
      colors: [PRETO, ROSA, OFFWHITE],
    },
    {
      slug: 'tomara-que-caixa-em-cetim',
      name: 'Tomara que Caixa em Cetim',
      description:
        'Para os momentos especiais: tomara que caixa em cetim de altíssima qualidade com brilho acetinado. Modelagem estruturada com bojo removível e fecho nas costas. Caimento impecável que valoriza o colo e a silhueta — perfeito para formaturas, casamentos e eventos.',
      price: 129.9, compareAt: 159.9, featured: true, tags: 'destaque', category: tops.id,
      colors: [ROSA, PRETO, BORDO],
    },
  ]

  console.log('→ Criando produtos…')
  for (const p of products) {
    const images = imgs(p.slug)
    if (images.length === 0) {
      console.warn(`  ⚠ sem imagens para ${p.slug} — pulando`)
      continue
    }
    const created = await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAt: p.compareAt ?? null,
        featured: p.featured ?? false,
        tags: p.tags ?? null,
        sku: `LEN-${p.slug.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
        status: 'active',
        categoryId: p.category,
        images: {
          create: images.map((url, i) => ({ url, isMain: i === 0, order: i + 1 })),
        },
        colors: {
          create: p.colors.map((c) => ({ ...c, stock: 8 })),
        },
        sizes: { create: sizesPM(7) },
      },
    })
    console.log(`  ✔ ${p.name} (${images.length} imgs)`)
    void created
  }

  console.log('→ Criando avaliações…')
  const reviews: [string, string, number, string][] = [
    ['blusa-canelada-gola-alta', 'Mariana S.', 5, 'Tecido incrível, super confortável e a cor rosa é linda! Comprei mais duas outras cores.'],
    ['blusa-canelada-gola-alta', 'Camila R.', 5, 'Caimento perfeito, veste muito bem. Recebi elogios no primeiro dia de uso!'],
    ['cropped-ombro-a-ombro', 'Juliana P.', 5, 'Qualidade excelente, o tecido é firme e não escorrega. Entrega rápida também.'],
    ['tomara-que-caixa-em-cetim', 'Fernanda L.', 5, 'Usei num casamento e todo mundo perguntou de onde era. Cetim de ótima qualidade!'],
    ['body-canelado-alca-fina', 'Patrícia M.', 4, 'Ótimo body, veste bem e o tecido é macio. Recomendo!'],
  ]
  for (const [slug, author, rating, comment] of reviews) {
    const prod = await db.product.findUnique({ where: { slug } })
    if (prod) {
      await db.productReview.create({ data: { productId: prod.id, author, rating, comment, approved: true } })
    }
  }

  console.log('→ Criando cupom de boas-vindas…')
  await db.coupon.create({
    data: {
      code: 'BEMVINDA10',
      type: 'percent',
      value: 10,
      minSubtotal: 0,
      maxUses: 0,
      active: true,
    },
  })

  console.log('→ Gravando a paleta rosa oficial nas configurações…')
  // Garante que o site nunca abra com paleta antiga (ex.: dourada) em bancos
  // reaproveitados — o valor já vai carimbado com a versão da paleta.
  await db.setting.upsert({
    where: { key: 'colors' },
    update: { value: JSON.stringify(withPaletteVersion(DEFAULT_SETTINGS.colors)) },
    create: {
      key: 'colors',
      value: JSON.stringify(withPaletteVersion(DEFAULT_SETTINGS.colors)),
    },
  })

  const counts = {
    categorias: await db.category.count(),
    produtos: await db.product.count(),
    imagens: await db.productImage.count(),
    avaliacoes: await db.productReview.count(),
  }
  console.log('✅ Seed concluído:', counts)
}

main()
  .catch((e) => {
    console.error('❌ Falha no seed:', e)
    process.exit(1)
  })
  .finally(() => process.exit(0))
