// Loja Lenora — page.tsx (server component)
// Roteia por query param `view` para cada uma das views do storefront.
// Busca dados iniciais via Prisma e os passa como props para as views client-side.
// SEO: generateMetadata dinâmico por view + JSON-LD injetado por view.
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings-server'
import { SiteShell } from '@/components/site-shell'
import { QueryProvider } from '@/components/providers/query-provider'
import { HomeView, type CategoryData } from '@/components/views/home-view'
import { ShopView, type ShopQuery } from '@/components/views/shop-view'
import { ProductView, type ProductDetail } from '@/components/views/product-view'
import { CartView } from '@/components/views/cart-view'
import { FavoritesView } from '@/components/views/favorites-view'
import { AccountView, type CustomerInfo } from '@/components/views/account-view'
import { PoliciesView } from '@/components/views/policies-view'
import { ContactView } from '@/components/views/contact-view'
import { getCurrentCustomer } from '@/lib/auth'
import {
  absUrl,
  productSchema,
  breadcrumbSchema,
  itemListSchema,
  webPageSchema,
  faqSchema,
  contactPageSchema,
} from '@/lib/seo'
import type { ProductCardData } from '@/components/product-card'
import type { SiteSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SP = Record<string, string | string[] | undefined>

function pick(sp: SP, key: string): string | undefined {
  const v = sp[key]
  return Array.isArray(v) ? v[0] : v
}

// ───────────────────────── SEO METADATA POR VIEW ─────────────────────────
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>
}): Promise<Metadata> {
  const sp = await searchParams
  const settings = await getSettings()
  const view = pick(sp, 'view') ?? 'home'
  const slug = pick(sp, 'slug')
  const category = pick(sp, 'category')
  const policy = pick(sp, 'policy')
  const q = pick(sp, 'q')
  const sort = pick(sp, 'sort')

  // Views privadas/internas → noindex
  const noindexViews = ['cart', 'favorites', 'account', 'admin']
  const isNoindex = noindexViews.includes(view)

  const baseCanonical = (query: string) => {
    if (!query || query === '/') return absUrl(settings, '/')
    const q = query.startsWith('?') ? query : `?${query}`
    return absUrl(settings, `/${q}`)
  }

  let title: string | { default: string; template: string } = settings.seo.title
  let description = settings.seo.description
  let canonical = '/'
  let ogImage: string | undefined
  let noindex = isNoindex

  if (view === 'product' && slug) {
    const p = await db.product
      .findUnique({
        where: { slug },
        select: { name: true, description: true, price: true, compareAt: true, images: { where: { isMain: true }, take: 1 } },
      })
      .catch(() => null)
    if (p) {
      title = `${p.name} — R$ ${p.price.toFixed(2).replace('.', ',')}`
      description =
        (p.description?.slice(0, 155) ?? settings.seo.description) +
        ` ${p.name} na Loja Lenora. Compre pelo WhatsApp.`
      canonical = `?view=product&slug=${slug}`
      ogImage = p.images[0]?.url
    }
  } else if (view === 'shop') {
    if (category) {
      const c = await db.category.findUnique({ where: { slug: category }, select: { name: true } }).catch(() => null)
      title = c ? `${c.name} — Coleção` : 'Catálogo de Moda Feminina'
      description = `Coleção de ${c?.name ?? 'moda feminina'} na Loja Lenora. Cropped, blusa, body, regata e mais. Compra segura, envio para todo Brasil.`
      canonical = `?view=shop&category=${category}`
    } else if (sort === 'newest') {
      title = 'Novidades — Moda Feminina'
      description = 'Recém-chegadas na Loja Lenora: as últimas peças de moda feminina. Cropped, blusa, body, regata, top e tomara que caixa.'
      canonical = `?view=shop&sort=newest`
    } else if (sort === 'featured') {
      title = 'Destaques — Moda Feminina'
      description = 'Produtos em destaque na Loja Lenora. Selecionados pra você com curadoria e elegância.'
      canonical = `?view=shop&sort=featured`
    } else {
      title = 'Catálogo de Moda Feminina'
      description = 'Explore o catálogo de moda feminina da Loja Lenora. Filtre por categoria, preço, cor e tamanho. Compra segura via WhatsApp.'
      canonical = `?view=shop`
    }
  } else if (view === 'contact') {
    title = 'Contato'
    description = 'Fale com a Loja Lenora pelo WhatsApp, e-mail ou Instagram. Atendimento 100% online das 9h às 17h. Envio para todo Brasil.'
    canonical = `?view=contact`
  } else if (view === 'policies') {
    const titles: Record<string, string> = {
      trocas: 'Trocas e Devoluções',
      vendas: 'Política de Vendas',
      termos: 'Termos de Uso',
      privacidade: 'Política de Privacidade',
      cookies: 'Política de Cookies',
    }
    title = titles[policy ?? 'trocas'] ?? 'Políticas'
    description = `${title} da Loja Lenora. Tire suas dúvidas sobre compras, envio, trocas, privacidade e termos de uso.`
    canonical = `?view=policies&policy=${policy ?? 'trocas'}`
  } else if (q) {
    title = `Busca: ${q}`
    description = `Resultados de busca por "${q}" na Loja Lenora — moda feminina premium.`
    canonical = `?view=shop&q=${encodeURIComponent(q)}`
    noindex = true // páginas de busca não indexáveis
  } else {
    canonical = `?view=home`
  }

  const finalOg = ogImage
    ? absUrl(settings, ogImage)
    : absUrl(settings, settings.seo.ogImage || '/uploads/hero-desktop.webp')

  return {
    title: title as string,
    description,
    alternates: { canonical: baseCanonical(canonical) },
    openGraph: {
      title: title as string,
      description,
      siteName: settings.brandName,
      type: 'website',
      locale: 'pt_BR',
      url: baseCanonical(canonical),
      images: [{ url: finalOg, width: 1600, height: 686, alt: settings.brandName, type: 'image/webp' }],
    },
    twitter: {
      card: 'summary_large_image',
      site: settings.seo.twitterHandle ? `@${settings.seo.twitterHandle}` : undefined,
      title: title as string,
      description,
      images: [finalOg],
    },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true, 'max-image-preview': 'large' as const },
  }
}

// Renderiza array de schemas JSON-LD como scripts no SSR
function JsonLdScripts({ schemas }: { schemas: object[] }) {
  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  )
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const sp = await searchParams
  const settings = await getSettings()

  const view = pick(sp, 'view') ?? 'home'
  const slug = pick(sp, 'slug')
  const category = pick(sp, 'category')
  const q = pick(sp, 'q')
  const sort = pick(sp, 'sort')
  const minPrice = pick(sp, 'minPrice')
  const maxPrice = pick(sp, 'maxPrice')
  const color = pick(sp, 'color')
  const size = pick(sp, 'size')
  const page = pick(sp, 'page')
  const policy = pick(sp, 'policy')

  // Dados comuns
  const categories: CategoryData[] = await db.category
    .findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
    })
    .then((cs) => cs)
    .catch(() => [])

  let content: React.ReactNode = null
  // JSON-LD schemas injetados por view (SEO estruturado)
  const jsonLd: object[] = []

  if (view === 'shop') {
    const shopQuery: ShopQuery = {
      category,
      q,
      sort: sort ?? 'newest',
      minPrice,
      maxPrice,
      color,
      size,
      page,
    }

    // Replica exatamente a query da API para hidratar TanStack
    const where: any = { status: 'active' }
    if (category) where.category = { slug: category }
    if (q) {
      const ql = q.toLowerCase()
      where.OR = [
        { name: { contains: ql } },
        { description: { contains: ql } },
      ]
    }
    if (minPrice) {
      where.price = where.price ?? {}
      where.price.gte = Number(minPrice)
    }
    if (maxPrice) {
      where.price = where.price ?? {}
      where.price.lte = Number(maxPrice)
    }
    if (color) where.colors = { some: { hex: color } }
    if (size) where.sizes = { some: { name: size } }

    const orderBy: any =
      sort === 'price-asc'
        ? { price: 'asc' }
        : sort === 'price-desc'
          ? { price: 'desc' }
          : sort === 'featured'
            ? [{ featured: 'desc' }, { createdAt: 'desc' }]
            : { createdAt: 'desc' }

    const p = Math.max(1, Number(page ?? '1')) || 1
    const ps = 12

    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: (p - 1) * ps,
        take: ps,
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { order: 'asc' } },
          colors: true,
          sizes: true,
        },
      }),
      db.product.count({ where }),
    ]).catch(() => [[], 0] as [any[], number])

    const initialProducts: ProductCardData[] = (items as any[]).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAt: p.compareAt,
      featured: p.featured,
      category: p.category,
      images: p.images.map((i: any) => ({ url: i.url, isMain: i.isMain })),
      colors: p.colors.map((c: any) => ({ name: c.name, hex: c.hex })),
      sizes: p.sizes.map((s: any) => ({ name: s.name })),
    }))

    content = (
      <ShopView
        settings={settings}
        categories={categories}
        initialProducts={initialProducts}
        initialTotal={total}
        query={shopQuery}
      />
    )
    // SEO: ItemList (produtos listados) + Breadcrumb
    const crumb = category
      ? [{ name: 'Início', url: '?view=home' }, { name: categories.find((c) => c.slug === category)?.name ?? 'Categoria', url: `?view=shop&category=${category}` }]
      : [{ name: 'Início', url: '?view=home' }, { name: 'Catálogo', url: '?view=shop' }]
    jsonLd.push(
      itemListSchema(
        settings,
        initialProducts.map((p) => ({ name: p.name, url: `?view=product&slug=${p.slug}` })).slice(0, 12),
      ),
      breadcrumbSchema(settings, crumb),
    )
  } else if (view === 'product' && slug) {
    const product = await db.product
      .findUnique({
        where: { slug },
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { order: 'asc' } },
          colors: true,
          sizes: true,
          reviews: {
            where: { approved: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
      .catch(() => null)

    if (product) {
      const p: ProductDetail = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        compareAt: product.compareAt,
        featured: product.featured,
        tags: product.tags,
        category: product.category,
        images: product.images.map((i) => ({
          url: i.url,
          isMain: i.isMain,
          order: i.order,
        })),
        colors: product.colors.map((c) => ({
          id: c.id,
          name: c.name,
          hex: c.hex,
          stock: c.stock,
        })),
        sizes: product.sizes.map((s) => ({
          id: s.id,
          name: s.name,
          stock: s.stock,
        })),
        reviews: product.reviews.map((r) => ({
          id: r.id,
          author: r.author,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
        })),
      }
      content = <ProductView settings={settings} product={p} />
      // SEO: Product + Breadcrumb + WebPage schema
      jsonLd.push(
        productSchema(settings, {
          name: p.name,
          slug: p.slug,
          price: p.price,
          compareAt: p.compareAt,
          description: p.description,
          images: (p.images ?? []).map((i) => ({ url: i.url, isMain: !!i.isMain })),
          colors: (p.colors ?? []).map((c) => ({ name: c.name, hex: c.hex })),
          sizes: (p.sizes ?? []).map((s) => ({ name: s.name })),
          category: p.category,
          sku: p.id,
        }),
        breadcrumbSchema(settings, [
          { name: 'Início', url: '?view=home' },
          ...(p.category ? [{ name: p.category.name, url: `?view=shop&category=${p.category.slug}` }] : []),
          { name: p.name, url: `?view=product&slug=${p.slug}` },
        ]),
        webPageSchema(settings, {
          name: `${p.name} — Loja Lenora`,
          description: p.description.slice(0, 160),
          url: `?view=product&slug=${p.slug}`,
        }),
      )
    } else {
      content = <NotFoundView message="Produto não encontrado" />
    }
  } else if (view === 'cart') {
    content = <CartView settings={settings} />
  } else if (view === 'favorites') {
    // Favoritos: lê do cookie não é possível (client-side only). Aqui buscamos
    // todos os produtos ativos e deixamos o client filter pelo store.
    const all = await db.product
      .findMany({
        where: { status: 'active' },
        take: 200,
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { order: 'asc' } },
          colors: true,
          sizes: true,
        },
      })
      .catch(() => [] as any[])
    const products: ProductCardData[] = all.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAt: p.compareAt,
      featured: p.featured,
      category: p.category,
      images: p.images.map((i) => ({ url: i.url, isMain: i.isMain })),
      colors: p.colors.map((c) => ({ name: c.name, hex: c.hex })),
      sizes: p.sizes.map((s) => ({ name: s.name })),
    }))
    content = <FavoritesView settings={settings} products={products} />
  } else if (view === 'account') {
    const c = await getCurrentCustomer()
    const customer: CustomerInfo = c
      ? { id: c.id, name: c.name, email: c.email, phone: c.phone }
      : null
    content = <AccountView settings={settings} customer={customer} />
  } else if (view === 'policies') {
    content = <PoliciesView settings={settings} policy={policy ?? 'privacidade'} />
    // SEO: FAQPage + Breadcrumb (perguntas frequentes sobre cada política)
    const policyFaqs: Record<string, { q: string; a: string }[]> = {
      trocas: [
        { q: 'Qual o prazo para troca ou devolução?', a: 'Até 7 dias corridos após o recebimento, em casos de defeito de fabricação ou produto enviado incorretamente.' },
        { q: 'Como solicito uma troca?', a: 'Clique no botão “Solicitar troca pelo WhatsApp” e envie: número do pedido, nome completo, CPF e motivo.' },
      ],
      vendas: [
        { q: 'Quais formas de pagamento a Loja Lenora aceita?', a: 'Pix, cartão de crédito (até 2x), débito e boleto. Pagamento combinado no WhatsApp.' },
        { q: 'Qual o prazo de postagem?', a: '1 a 5 dias úteis após a confirmação do pagamento. Entrega via Correios conforme a região.' },
        { q: 'Como acompanho meu pedido?', a: 'Você recebe o código de rastreamento por e-mail e pode acompanhar na sua conta no site.' },
      ],
      termos: [
        { q: 'O site exige cadastro?', a: 'Não. O cadastro é opcional, apenas para acompanhar pedidos.' },
        { q: 'Como são tratados meus dados?', a: 'Conforme nossa Política de Privacidade e a LGPD (Lei nº 13.709/2018).' },
      ],
      privacidade: [
        { q: 'Quais dados a Loja Lenora coleta?', a: 'Nome, telefone, e-mail, CEP e endereço de entrega, informados no checkout via WhatsApp.' },
        { q: 'Posso excluir meus dados?', a: 'Sim. Solicite pelo WhatsApp ou e-mail; atendemos em até 15 dias corridos.' },
      ],
      cookies: [
        { q: 'A loja usa cookies?', a: 'Sim: essenciais (carrinho, favoritos, conta) e de desempenho (visitas anônimas).' },
        { q: 'Posso desativar cookies?', a: 'Sim, nas configurações do navegador. Recursos como carrinho podem deixar de funcionar.' },
      ],
    }
    const faqs = policyFaqs[policy ?? 'trocas'] ?? []
    const policyTitle = ({ trocas: 'Trocas e Devoluções', vendas: 'Política de Vendas', termos: 'Termos de Uso', privacidade: 'Política de Privacidade', cookies: 'Política de Cookies' } as Record<string, string>)[policy ?? 'trocas'] ?? 'Políticas'
    if (faqs.length) jsonLd.push(faqSchema(faqs.map((f) => ({ question: f.q, answer: f.a }))))
    jsonLd.push(
      breadcrumbSchema(settings, [
        { name: 'Início', url: '?view=home' },
        { name: policyTitle, url: `?view=policies&policy=${policy ?? 'trocas'}` },
      ]),
    )
  } else if (view === 'contact') {
    content = <ContactView settings={settings} />
    // SEO: ContactPage + Breadcrumb
    jsonLd.push(
      contactPageSchema(settings),
      breadcrumbSchema(settings, [
        { name: 'Início', url: '?view=home' },
        { name: 'Contato', url: '?view=contact' },
      ]),
    )
  } else {
    // Home: destaques, novidades, promoções
    const [featured, newProducts, onSale] = await Promise.all([
      db.product.findMany({
        where: { status: 'active', featured: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { order: 'asc' } },
          colors: true,
          sizes: true,
        },
      }),
      db.product.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { order: 'asc' } },
          colors: true,
          sizes: true,
        },
      }),
      db.product.findMany({
        where: {
          status: 'active',
          compareAt: { gt: 0 },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: { order: 'asc' } },
          colors: true,
          sizes: true,
        },
      }),
    ]).catch(() => [[], [], []] as [any[], any[], any[]])

    const map = (p: any): ProductCardData => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAt: p.compareAt,
      featured: p.featured,
      category: p.category,
      images: p.images.map((i: any) => ({ url: i.url, isMain: i.isMain })),
      colors: p.colors.map((c: any) => ({ name: c.name, hex: c.hex })),
      sizes: p.sizes.map((s: any) => ({ name: s.name })),
    })

    content = (
      <HomeView
        settings={settings}
        featured={featured.map(map)}
        categories={categories}
        newProducts={newProducts.map(map)}
        onSale={onSale.map(map)}
      />
    )
    // SEO: ItemList (produtos em destaque) + Breadcrumb (Home)
    jsonLd.push(
      itemListSchema(settings, featured.map((p) => ({ name: p.name, url: `?view=product&slug=${p.slug}` })).slice(0, 8)),
      breadcrumbSchema(settings, [{ name: 'Início', url: '?view=home' }]),
      webPageSchema(settings, { name: settings.seo.title, description: settings.seo.description, url: '?view=home' }),
    )
  }

  // O admin é uma app isolada com próprio shell (sidebar + top bar).
  // Para evitar o chrome do storefront (header/footer/cart drawer), envolve
  // apenas no QueryProvider (não no SiteShell).
  if (view === 'admin') {
    const AdminApp = (await import('@/components/admin/admin-app')).AdminApp
    return (
      <QueryProvider>
        <Suspense>
          <AdminApp settings={settings} tab={pick(sp, 'tab') ?? 'dashboard'} />
        </Suspense>
      </QueryProvider>
    )
  }

  return (
    <SiteShell settings={settings}>
      <JsonLdScripts schemas={jsonLd} />
      <Suspense>{content}</Suspense>
    </SiteShell>
  )
}

function NotFoundView({ message }: { message: string }) {
  return (
    <div className="container-lenora flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="font-serif text-4xl text-foreground">404</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <a
        href="/"
        className="btn-gold inline-flex h-12 items-center rounded-md px-7 text-sm uppercase tracking-widest"
      >
        Voltar ao início
      </a>
    </div>
  )
}
