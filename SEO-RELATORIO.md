# Relatório SEO Enterprise — Loja Lenora

Data: 24/09/2026
Stack: Next.js 16 (App Router) + TypeScript + Prisma (SQLite)
Paleta: preto / branco / dourado

---

## 1. Auditoria Inicial — Problemas Encontrados

| # | Problema | Severidade | Status |
|---|----------|------------|--------|
| 1 | Home sem H1 crawlable (hero virou imagem com texto "Seja Bem-vinda" embutido — Google não lia) | 🔴 Alta | ✅ Corrigido |
| 2 | Sem `generateMetadata` dinâmico — todas as páginas tinham o mesmo title/description | 🔴 Alta | ✅ Corrigido |
| 3 | Sem canonical URLs (risco de conteúdo duplicado) | 🔴 Alta | ✅ Corrigido |
| 4 | Sem sitemap.xml (Google não descobria as páginas de produto/categoria) | 🔴 Alta | ✅ Corrigido |
| 5 | robots.txt estático genérico (não bloqueava admin/api, não citava sitemap) | 🟡 Média | ✅ Corrigido |
| 6 | JSON-LD mínimo (só ClothingStore básico inline) — sem Organization, WebSite, Product, Breadcrumb, FAQ, ItemList | 🔴 Alta | ✅ Corrigido |
| 7 | Hero sem `width`/`height`/`fetchpriority` → CLS + LCP lento | 🟡 Média | ✅ Corrigido |
| 8 | Views privadas (cart/favorites/account/admin) sem `noindex` → rastreáveis indevidamente | 🟡 Média | ✅ Corrigido |
| 9 | Sem SEO local (LocalBusiness com endereço, geo, horários) | 🟡 Média | ✅ Corrigido |
| 10 | Sem GA4/GTM (sem analytics/tracking) | 🟡 Média | ✅ Preparado (injeção condicional) |
| 11 | Sem headers de segurança (HSTS, X-Frame, Referrer, Permissions) | 🟡 Média | ✅ Corrigido |
| 12 | Descrição SEO antiga no DB (vestidos/calças — categorias não existem mais) | 🟡 Média | ✅ Corrigido |

---

## 2. Implementação — O que foi feito

### 2.1 Metadata dinâmica por view (`src/app/page.tsx` → `generateMetadata`)
Cada view agora tem **title, description e canonical únicos**:

| View | Title (exemplo) | Canonical |
|------|-----------------|-----------|
| Home | `Loja Lenora — Moda Feminina Premium \| Catálogo Online` | `/?view=home` |
| Shop | `Catálogo de Moda Feminina` | `/?view=shop` |
| Shop + categoria | `Cropped — Coleção` | `/?view=shop&category=cropped` |
| Shop + novidades | `Novidades — Moda Feminina` | `/?view=shop&sort=newest` |
| Shop + destaques | `Destaques — Moda Feminina` | `/?view=shop&sort=featured` |
| **Produto** | `Cropped Tricot com Botão — R$ 119,90` | `/?view=product&slug=cropped-tricot-com-botao` |
| Contato | `Contato` | `/?view=contact` |
| Políticas | `Trocas e Devoluções` / `Política de Vendas` / `Termos de Uso` etc. | `/?view=policies&policy=...` |
| Busca (`?q=`) | `Busca: termo` | noindex (não indexável) |
| Cart / Favorites / Account / Admin | — | **noindex, nofollow** (privadas) |

- Title template: `%s | Loja Lenora` (adiciona a marca automaticamente)
- OG image dinâmico: produtos usam a foto principal; outras páginas usam o banner do hero
- OG type: `website` (válido para Next.js)
- robots: `index, follow, max-image-preview:large` nas indexáveis; `noindex, nofollow` nas privadas

### 2.2 Meta tags avançadas (`src/app/layout.tsx`)
Base metadata enriquecida com:
- `metadataBase` dinâmico (do `settings.seo.siteUrl`)
- `keywords` (lista semântica)
- `authors`, `creator`, `publisher`, `applicationName`, `category`
- `formatDetection` (telefone/email)
- `theme-color` = cor de destaque (dourado)
- `author`, `language: Portuguese`
- **Geo tags**: `geo.region=BR-GO`, `geo.placename=Goiânia`, `geo.position=lat;lng`, `ICBM=lat, lng`
- `robots` com `googleBot: { max-image-preview: large, max-snippet: -1, max-video-preview: -1 }`
- OpenGraph completo: title, description, siteName, type, locale=pt_BR, url, **images com width/height/alt/type**
- Twitter Cards: `summary_large_image`, `site=@loja.lenora`, title, description, images

### 2.3 JSON-LD / Schema.org (`src/lib/seo.ts` + injeção por view)
Biblioteca com 9 geradores de schema, todos cross-referenciados por `@id`:

| Schema | Onde é injetado | Props |
|--------|----------------|-------|
| **Organization** | layout (global) | name, url, logo, contactPoint (WhatsApp/email), sameAs (Instagram) |
| **WebSite** (com SearchAction) | layout (global) | name, url, potentialAction SearchAction → `/?view=shop&q={query}` (sitelinks search box) |
| **LocalBusiness / ClothingStore** | layout (global) | address (PostalAddress BR/GO), geo (GeoCoordinates lat/lng), openingHours, areaServed, telephone, email, taxId (CNPJ), priceRange |
| **Product** | view=product | name, image[], description, sku, brand, category, color, offers (price BRL, InStock, url, MerchantReturnPolicy 7 dias), hasMerchantReturnPolicy |
| **Offer** | aninhado no Product | price, priceCurrency=BRL, availability=InStock, url |
| **BreadcrumbList** | product/shop/contact/policies/home | trilha Início > [Categoria] > [Item] |
| **ItemList** | home + shop | lista de produtos com position + url |
| **WebPage** | home + product | name, description, url, isPartOf, publisher |
| **FAQPage** | policies (cada política) | Q&A extraído das políticas (trocas/vendas/termos/privacidade/cookies) |
| **ContactPage** | view=contact | email, telephone |

Validado: 7+ schemas JSON-LD na home, 9+ na página de produto.

### 2.4 Sitemap dinâmico (`src/app/sitemap.ts`)
`/sitemap.xml` gerado automaticamente (Next.js metadata route). **25 entradas**:
- 1 home (prioridade 1.0, daily)
- 1 shop + 2 variantes de ordenação (0.9-0.8, weekly)
- 7 categorias (0.8, weekly, lastmod=updatedAt)
- **8 produtos** (0.7, weekly, lastmod=updatedAt) — cada um com `<image:image>` apontando pro WebP absoluto
- 1 contato (0.5, monthly)
- 5 políticas (0.3, monthly)

Atualização automática: quando produtos/categorias mudam no admin, o sitemap reflete na próxima requisição.

### 2.5 Robots.txt dinâmico (`src/app/robots.ts`)
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /?view=admin
Disallow: /?view=account
Crawl-delay: 1
Host: https://lojalenora.com.br
Sitemap: https://lojalenora.com.br/sitemap.xml
```
Bloqueia áreas administrativas e API. Referência ao sitemap.

### 2.6 H1 crawlable na home (`src/components/views/home-view.tsx`)
O banner hero é uma imagem com texto "Seja Bem-vinda" embutido — Google não lia como H1. Adicionado:
- `<h1 class="sr-only">` com headline otimizada: *"Loja Lenora — Moda Feminina: cropped, blusa, body, regata, top canelado e tomara que caixa. Peças com curadoria, compra segura, envio para todo Brasil e atendimento 100% online e personalizado."*
- Bloco SEO `<div class="sr-only">` com 2 parágrafos de conteúdo crawlable (categorias, atendimento, envio, status de pedido) — dá ao Google texto real pra indexar.
- Heading hierarchy: H1 (home) → H2 (seções: Compre por categoria, Produtos em destaque, Novidades, Promoções, Newsletter) ✓

### 2.7 Core Web Vitals — Imagens
- Hero banner (elemento LCP): `fetchPriority="high"`, `width=1600 height=686`, `decoding="async"`, `aspect-square md:aspect-[1600/686]` → **zero CLS** + LCP rápido
- `<picture>` responsivo: mobile carrega quadrado, desktop carrega wide (dimensões reservadas via `aspect-ratio` por breakpoint)
- Imagens de produto: `aspect-[3/4]` (reserva o espaço), `loading="lazy"`, `alt` descritivo
- Todas as WebP (lossless hero, q82 produtos) — formato moderno, leves

### 2.8 Analytics (`src/app/layout.tsx`)
Injeção condicional (só se configurado no admin via `settings.analytics`):
- **Google Analytics 4**: `gtag.js` com `send_page_view: true`
- **Google Tag Manager**: script no `<head>` + `<noscript><iframe>` no `<body>`
- **Meta Pixel / Facebook**: `fbevents.js` + `PageView`
- Default: IDs vazios = nenhum script injetado (zero tracking até configurar). Para ativar: preencher `analytics.ga4Id` / `gtmId` / `facebookPixelId` na tabela Setting.

### 2.9 Headers de segurança (`next.config.ts`)
Em todas as rotas (incluindo /sitemap.xml e /robots.txt):
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` (clickjacking)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-DNS-Prefetch-Control: on` (DNS prefetch mais rápido)
- **HSTS** (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`) — só em produção
- **CSP** (Content-Security-Policy) — só em produção (não bloqueia dev)

### 2.10 SEO Local (Google Business Profile ready)
`settings.seo.local` com:
- Endereço: Goiânia/GO, CEP, país BR
- Geo: latitude/longitude (-16.6864, -49.2643)
- areaServed: Brasil + Goiânia/região
- openingHours: Seg-Sex 09:00-17:00
- taxId (CNPJ)
- Telefone + WhatsApp + email + Instagram no LocalBusiness schema
→ Estrutura pronta para sincronizar com Google Business Profile.

---

## 3. Performance / Core Web Vitals

| Métrica | Estado | Notas |
|---------|--------|-------|
| **LCP** (Largest Contentful Paint) | ✅ Otimizado | Hero com `fetchPriority="high"` + WebP lossless (1.3MB) serve primeiro; preload inteligente |
| **CLS** (Cumulative Layout Shift) | ✅ Zero | Todas as imagens com `aspect-ratio`/`width`/`height` reservando espaço |
| **INP** (Interaction to Next Paint) | ✅ Rápido | Poucos scripts bloqueantes; framer-motion não bloqueia main thread; toasts não intrusivos |
| Imagens | ✅ WebP | Hero lossless, produtos q82, total ~2MB |
| Cache | ✅ | `staleTime` 30s-5min no TanStack Query; settings cacheado 30s |
| Fontes | ✅ | Poppins `display: swap` (FOUT, não FOIT) |

---

## 4. Google Search Console Ready

Pronto para:
1. **Submeter o sitemap**: `https://lojalenora.com.br/sitemap.xml`
2. **Index coverage**: 25 URLs indexáveis (home, shop, categorias, produtos, contato, políticas)
3. **Rich Results** validáveis:
   - Product (preço, disponibilidade, imagem) — nas páginas de produto
   - BreadcrumbList — em todas as páginas
   - FAQPage — nas páginas de políticas
   - LocalBusiness / ClothingStore — global
   - Organization — global
   - Sitelinks Search Box (SearchAction) — global
4. **Páginas rastreáveis**: robots.txt libera as públicas, bloqueia as privadas

**Como validar (depois do deploy):**
- Google Rich Results Test: `https://search.google.com/test/rich-results`
- Google Search Console → Sitemaps → submeter `sitemap.xml`
- Google Search Console → URL Inspection → testar uma página de produto

---

## 5. E-E-A-T (Experience, Expertise, Authoritativeness, Trust)

| Pilar | Implementação |
|-------|---------------|
| **Experience** | LocalBusiness com endereço real, horário, telefone/WhatsApp funcionais; testimonials removidos (não tínhamos provas reais — melhor não inventar) |
| **Expertise** | Curadoria de moda feminina (categorias especializadas: cropped, blusa, body, regata, top canelado, tomara que caixa) |
| **Authoritativeness** | Organization + LocalBusiness schema; sameAs apontando pro Instagram; política de vendas/trocas transparente |
| **Trust** | HTTPS (HSTS em prod), headers de segurança, política de privacidade LGPD, dados de contato reais no rodapé, atendimento via WhatsApp rastreável |

**Recomendações para fortalecer E-E-A-T (próximos passos):**
- Adicionar página "Sobre" com a história da marca e da fundadora
- Coletar avaliações reais de clientes (ProductReview schema) — só com avaliações genuínas
- Publicar conteúdo de curadoria/looks (blog) para construir autoridade temática
- Registrar o Google Business Profile e sincronizar NAP (Name-Address-Phone)

---

## 6. SEO Off-Page / Autoridade (estrutura preparada)

Páginas altamente linkáveis já no site:
- **Políticas** (trocas/vendas/termos/privacidade/cookies) — conteúdo de referência
- **Contato** com canais oficiais
- **Catálogo** com filtros (útil pra ser citado)

**Recomendações (não implementáveis em código):**
- Buscar backlinks de blogs de moda goiano, diretórios de lojas femininas, portals regionais
- Parcerias com influenciadoras locais (menções de marca, não backlinks artificiais)
- Digital PR: responder perguntas sobre moda em fóruns, Quora, Reddit
- **Nunca** comprar backlinks ou fazer spam — priorizar autoridade real

---

## 7. Próximos Passos Recomendados

### Curt prazo (após deploy)
1. **Configurar GA4/GTM**: criar as contas no Google, pegar os IDs (G-XXX / GTM-XXX), preencher no admin (`?view=admin&tab=settings`) → os scripts injetam automaticamente
2. **Submeter sitemap** no Google Search Console
3. **Configurar Google Business Profile**: usar os mesmos NAP/horários do `settings.seo.local`
4. **Trocar o CNPJ placeholder** (`00.000.000/0001-00`) pelo real no admin
5. **Trocar `seo.siteUrl`** se o domínio final for diferente de `lojalenora.com.br`

### Médio prazo (reforço orgânico)
6. Adicionar página "Sobre a Loja Lenora" (história, fundadora) — reforça E-E-A-T
7. Criar blog/lookbook com conteúdo de moda (cada post = nova URL indexável + keywords)
8. Coletar avaliações reais de pedidos confirmados (ProductReview schema)
9. Migração futura para URLs limpas (`/produtos/[slug]`) — hoje as URLs são `/?view=product&slug=...` (indexáveis com canonical, mas `/produtos/slug` seria ideal). Exigiria refatorar de single-route para multi-route.

### Longo prazo
10. Link building orgânico (parcerias, conteúdo de referência)
11. Programa de fidelidade / e-mail marketing (captura de leads)
12. Campanhas sazonais (Black Friday, Dia das Mães) com landing pages dedicadas

---

## 8. Limitações conhecidas (arquitetura single-route)

O projeto usa uma **rota única** (`/`) com navegação por query params (`?view=product&slug=...`). Para SEO:
- ✅ **Funciona**: cada query-param URL é indexável (com canonical + sitemap + metadata única). Google trata `/?view=product&slug=X` e `/?view=product&slug=Y` como páginas distintas.
- ⚠️ **Subótimo**: URLs ideais seriam `/produtos/cropped-tricot-com-botao` (sem query). A migração exigiria criar `src/app/produtos/[slug]/page.tsx` etc., o que conflita com a restrição atual de rota única do projeto.

A fundação implementada (canonical + sitemap + metadata + JSON-LD por view) torna as URLs atuais plenamente indexáveis e competitivas. A migração para URLs limpas pode ser feita depois sem reescrever o SEO.

---

## 9. Resumo do entregue

| Arquivo | Ação |
|---------|------|
| `src/lib/seo.ts` | **Criado** — 9 geradores de schema JSON-LD + `absUrl` |
| `src/app/sitemap.ts` | **Criado** — sitemap dinâmico (25 entradas + imagens) |
| `src/app/robots.ts` | **Criado** — robots dinâmico |
| `src/app/layout.tsx` | **Reescrito** — metadata enterprise + GA4/GTM/Pixel condicional + 3 schemas globais |
| `src/app/page.tsx` | **Reescrito** — `generateMetadata` por view + `JsonLdScripts` (Product/Breadcrumb/ItemList/FAQ/ContactPage/WebPage por view) |
| `src/components/views/home-view.tsx` | **Editado** — H1 crawlable sr-only + bloco SEO + hero img `fetchPriority/width/height/aspect-ratio` |
| `src/lib/settings.ts` | **Editado** — `seo.local` + `seo.siteUrl` + `seo.twitterHandle` + `analytics` (ga4Id/gtmId/fbPixelId) |
| `next.config.ts` | **Editado** — headers de segurança (nosniff/frame/referrer/permissions/dns/HSTS/CSP em prod) |
| `public/robots.txt` | **Removido** (substituído pelo dinâmico) |

**Lint:** EXIT 0 (1 warning cosmético sobre GTM inline).
**Verificado via curl + Agent Browser:** sitemap.xml ✓, robots.txt ✓, headers ✓, title/canonical/OG por view ✓, JSON-LD (Product/Offer/Breadcrumb/ItemList/FAQ/LocalBusiness/Organization/WebSite) ✓, noindex nas views privadas ✓, H1 crawlable ✓, hero LCP otimizado ✓.
