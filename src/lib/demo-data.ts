// Loja Lenora — dados demonstrativos (categorias + produtos).
// Usados por seedDemo() (src/lib/demo-seed.ts). As imagens já estão no repo
// em public/uploads/rs-<slug>-1..3.webp.

export type DemoColor = { name: string; hex: string }
export type DemoSize = { name: string; stock?: number }
export type DemoProduct = {
  name: string
  categorySlug: string
  price: number
  compareAt?: number
  featured: boolean
  description: string
  colors: DemoColor[]
  sizes: DemoSize[]
}

export const DEMO_CATEGORIES = [
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

export const DEMO_PRODUCTS: DemoProduct[] = [
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
  },
  {
    name: 'Tomara Que Caixa em Cetim',
    categorySlug: 'tomara-que-caia',
    price: 139.90,
    featured: true,
    description: 'Tomara que caixa em cetim com brilho sutil. Elegância pra festas e ocasiões especiais.',
    colors: [
      { name: 'Preto', hex: '#0a0a0a' },
      { name: 'Rosa', hex: '#db2777' },
      { name: 'Off-white', hex: '#f6f4f0' },
    ],
    sizes: [
      { name: 'P', stock: 4 },
      { name: 'M', stock: 6 },
      { name: 'G', stock: 4 },
      { name: 'GG', stock: 2 },
    ],
  },
]
