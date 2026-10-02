// POST /api/chatbot — Lia, assistente da Loja Lenora.
// Usa z-ai-web-dev-sdk no backend (somente server-side).
// A Lia conhece TODO o contexto da loja: contato, horário, envio, formas de
// pagamento, políticas, categorias e o catálogo completo. Retorna
// { reply, products: [{name, slug, price, image}] }.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings-server'

export const dynamic = 'force-dynamic'

type CatalogItem = {
  id: string
  name: string
  slug: string
  price: number
  compareAt: number | null
  categoryName: string | null
  image: string | null
  colors: { name: string; hex: string }[]
  sizes: string[]
}

async function loadCatalog(): Promise<CatalogItem[]> {
  const products = await db.product.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAt: true,
      category: { select: { name: true } },
      images: { where: { isMain: true }, take: 1 },
      colors: { select: { name: true, hex: true } },
      sizes: { select: { name: true } },
    },
    take: 60,
    orderBy: { createdAt: 'desc' },
  })
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAt: p.compareAt,
    categoryName: p.category?.name ?? null,
    image: p.images[0]?.url ?? null,
    colors: p.colors.map((c) => ({ name: c.name, hex: c.hex })),
    sizes: p.sizes.map((s) => s.name),
  }))
}

function money(n: number): string {
  return `R$ ${n.toFixed(2).replace('.', ',')}`
}

function buildStoreContext(catalog: CatalogItem[], settings: Awaited<ReturnType<typeof getSettings>>): string {
  const c = settings.contact
  const phoneDisplay = `(${c.phone.slice(0, 2)}) ${c.phone.slice(2, 7)}-${c.phone.slice(7)}`
  const shippingMethods = settings.shipping.methods
    .map((m) => `${m.label}${m.note ? ` (${m.note})` : ''}`)
    .join(', ')
  const categories = Array.from(
    new Set(catalog.map((p) => p.categoryName).filter(Boolean) as string[]),
  )
  const catalogLines = catalog.map((p) => {
    const colors = p.colors.length ? p.colors.map((x) => x.name).join('/') : '—'
    const sizes = p.sizes.length ? p.sizes.join(',') : '—'
    const promo = p.compareAt ? ` (de ${money(p.compareAt)} por ${money(p.price)})` : ''
    return `- ${p.name} | slug=${p.slug} | ${money(p.price)}${promo} | categoria=${p.categoryName ?? 'geral'} | cores=${colors} | tamanhos=${sizes}`
  })

  return `
═══ INFORMAÇÕES DA LOJA LENORA ═══
Nome: ${settings.brandName}
Slogan: ${settings.brandTagline}
Atendimento: 100% online e personalizado
Horário: ${c.hours}
Telefone/WhatsApp: ${phoneDisplay} (WhatsApp: +${c.whatsapp})
E-mail: ${c.email}
Instagram: @${c.instagram}

═══ ENVIO ═══
Formas de envio: ${shippingMethods}
Envio para todo o Brasil. Frete combinado após o pedido.

═══ COMPRAS / PAGAMENTO ═══
A loja NÃO tem pagamento online pelo site. A cliente monta a sacola com os produtos desejados (escolhendo cor e tamanho), finaliza pelo WhatsApp e o pagamento é combinado diretamente com a loja (Pix, cartão, boleto).
Compra segura. Atendimento 100% online e personalizado.

═══ TROCCA / DEVOLUÇÃO ═══
Troca facilitada — entrar em contato pelo WhatsApp em até 7 dias após o recebimento, com a peça sem uso e etiqueta.

═══ CONTA E PEDIDOS ═══
A cliente pode criar uma conta (cadastro simples por email+senha) e acompanhar o status do pedido: Recebido → Em preparação → Enviado → Entregue.

═══ CATEGORIAS DA LOJA ═══
${categories.join(' · ')}

═══ CATÁLOGO (${catalog.length} produtos) ═══
${catalogLines.join('\n')}
`.trim()
}

function extractMentions(reply: string, catalog: CatalogItem[]): CatalogItem[] {
  const lower = reply.toLowerCase()
  const found: CatalogItem[] = []
  for (const p of catalog) {
    const name = p.name.toLowerCase()
    // casa por nome completo OU primeiras palavras significativas
    const tokens = p.name.split(' ').filter((w) => w.length > 2).slice(0, 3).join(' ').toLowerCase()
    if (lower.includes(name) || (tokens && lower.includes(tokens))) {
      found.push(p)
    }
    if (found.length >= 6) break
  }
  return found
}

function fallback(message: string, catalog: CatalogItem[], settings: Awaited<ReturnType<typeof getSettings>>) {
  const q = message.toLowerCase()
  const tokens = q.split(/\s+/).filter((w) => w.length > 3)
  const matches = catalog
    .filter((p) => {
      const hay = `${p.name} ${p.categoryName ?? ''} ${p.colors.map((c) => c.name).join(' ')} ${p.sizes.join(' ')}`.toLowerCase()
      return tokens.some((t) => hay.includes(t))
    })
    .slice(0, 4)
  const c = settings.contact
  const phoneDisplay = `(${c.phone.slice(0, 2)}) ${c.phone.slice(2, 7)}-${c.phone.slice(7)}`
  if (matches.length === 0) {
    return {
      reply: `Oi! Eu sou a Lia, assistente da Loja Lenora. 🌷 Não encontrei nada com "${message}" no catálogo agora. A loja trabalha com moda feminina (cropped, blusa, body, regata, top canelado, tomara que caixa). Atendimento das ${c.hours} pelo WhatsApp ${phoneDisplay}. Me conta o que você procura que eu te ajudo!`,
      products: [],
    }
  }
  const reply = `Oi! 🌷 Encontrei alguns produtos que combinam com o que você procura:\n\n${matches
    .map((p, i) => `${i + 1}. ${p.name} — ${money(p.price)}`)
    .join('\n')}\n\nQuer que eu detalhe algum deles? Tamanhos, cores ou ajuda pra escolher, é só falar!`
  return { reply, products: matches }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = String(body.message ?? '').trim()
    if (!message) {
      return NextResponse.json({ error: 'Mensagem é obrigatória.' }, { status: 400 })
    }

    const [catalog, settings] = await Promise.all([loadCatalog(), getSettings()])
    const storeContext = buildStoreContext(catalog, settings)

    let reply: string | null = null
    try {
      const ZAIMod = await import('z-ai-web-dev-sdk').then((m) => m.default ?? m)
      const zai = await ZAIMod.create()
      const systemPrompt = `Você é a Lia, assistente virtual da Loja Lenora, uma loja de moda feminina (paleta branco, rosa e rosa-bebê).

PERSONALIDADE:
- Amigável, prestativa, direta e moderna. Sem enrolação.
- Sempre responde em português do Brasil.
- Usa emojis com sobriedade (🌷, ✨, 👗) mas sem exagero.
- Trata a cliente pelo nome se ela se apresentar.

O QUE VOCÊ SABE (use SEMPRE estas informações, não invente):
${storeContext}

REGRAS:
1. Quando a cliente perguntar sobre um produto ou procurar algo, MENCIONE o produto pelo NOME EXATO (como está no catálogo acima) e o preço.
2. Não invente preços, cores nem tamanhos — use só os do catálogo.
3. Se perguntarem sobre horário, WhatsApp, envio, pagamento, troca, conta/pedido — responda com as informações acima.
4. A loja NÃO tem checkout online: a compra é finalizada pelo WhatsApp. Conduza a cliente a montar a sacola e finalizar no WhatsApp quando apropriado.
5. Se não souber algo específico que não está acima, diga que vai encaminhar para o atendimento humano pelo WhatsApp.
6. Seja breve — respostas curtas e diretas, no máximo 4-5 linhas.`
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: message },
        ],
        thinking: { type: 'disabled' },
      })
      reply = completion?.choices?.[0]?.message?.content ?? ''
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[chatbot] SDK falhou, usando fallback:', (err as Error).message)
      }
    }

    if (!reply) {
      const fb = fallback(message, catalog, settings)
      return NextResponse.json({
        reply: fb.reply,
        products: fb.products.map((p) => ({
          name: p.name,
          slug: p.slug,
          price: p.price,
          image: p.image,
        })),
      })
    }

    const mentions = extractMentions(reply, catalog)
    return NextResponse.json({
      reply,
      products: mentions.map((p) => ({
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: p.image,
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
