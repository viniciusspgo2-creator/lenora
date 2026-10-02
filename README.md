# 👗 Loja Lenora — Catálogo Online feminino

Catálogo digital completo para a **Loja Lenora** (Goiânia/GO): vitrine de produtos,
painel administrativo, carrinho com finalização via **WhatsApp**, conta de cliente,
favoritos, avaliações, cupons de desconto, contador de coleções e chatbot de atendimento.

> 📦 **Este pacote já vem pronto para rodar**: o banco de dados (`db/custom.db`) está
> incluído e populado com 4 coleções, 8 produtos (24 fotos), avaliações aprovadas e o
> cupom `BEMVINDA10` (10% de desconto). Instalou, rodou — funciona.

---

## 🧰 Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui + Framer Motion |
| Back-end | API Routes do Next.js + Prisma ORM |
| Banco de dados | SQLite (local) · PostgreSQL (produção) — schemas prontos para os dois |
| Estado | Zustand (carrinho e favoritos) |
| Imagens | Otimização nativa do Next + upload via Vercel Blob no painel |
| Chatbot | API própria com IA (`/api/chatbot`) |

---

## 📁 Estrutura do projeto

```
loja-lenora/
├── db/
│   └── custom.db              ← banco SQLite JÁ POPULADO (loja pronta)
├── prisma/
│   ├── schema.prisma          ← schema SQLite (desenvolvimento local)
│   └── schema.postgres.prisma ← schema PostgreSQL (produção/Vercel)
├── public/
│   └── uploads/               ← fotos dos produtos (webp)
├── scripts/
│   ├── postinstall.js         ← gera o Prisma Client correto ao instalar
│   └── seed-lenora.ts         ← popula o banco com o catálogo inicial
├── src/
│   ├── app/                   ← páginas, APIs e SEO (sitemap, robots, favicon)
│   ├── components/            ← vitrine, painel admin, carrinho, footer…
│   └── lib/                   ← banco (db.ts), configurações, auth, helpers
├── .env                       ← variáveis de ambiente (já configurado p/ local)
├── .env.example               ← modelo documentado de configuração
└── package.json
```

---

## ✅ Requisitos

- **Node.js 20 ou superior** — [nodejs.org](https://nodejs.org) (instale a versão LTS)
- npm (já vem com o Node) — ou [Bun](https://bun.sh), se preferir
- Não precisa instalar banco de dados: o SQLite é um arquivo que já vem no pacote

---

## 🚀 Rodar localmente (3 comandos)

Abra o terminal na pasta do projeto e execute:

```bash
# 1) Instalar as dependências (o Prisma Client é gerado automaticamente)
npm install

# 2) Rodar o site em modo desenvolvimento
npm run dev

# 3) Abrir no navegador
# http://localhost:3000
```

Se preferir usar **Bun**: `bun install` e `bun run dev`.

> ⚠️ Se o banco não existir ou quiser recomeçar do zero, rode `npm run db:push`
> (cria as tabelas) e depois `npm run db:seed` (popula o catálogo inicial).

---

## 🔑 Acessos importantes

| O quê | Onde | Como |
|---|---|---|
| **Painel admin** | `http://localhost:3000/?view=admin` (ou `/admin`) | Senha padrão: **`lenora2025`** |
| **Trocar a senha do admin** | Painel → Configurações | Campo "Senha do painel" — **troque antes de publicar!** |
| **Conta de cliente** | Botão "Conta" no site | Cadastro livre pelo site |
| **Cupom de teste** | Checkout | `BEMVINDA10` (10% off) |

No painel admin você gerencia: produtos (fotos, cores, tamanhos, estoque),
coleções/categorias, pedidos, financeiro (entradas/saídas, fornecedores),
avaliações, cupons, visitas e as configurações do site (cores, contato, SEO).

---

## 🗄️ Banco de dados — como funciona

O projeto usa **Prisma ORM** com dois schemas prontos:

- **Local/desenvolvimento → SQLite** (`prisma/schema.prisma`): os dados ficam no
  arquivo `db/custom.db`, que **já vem no pacote com a loja populada**. Nada para
  configurar.
- **Produção → PostgreSQL** (`prisma/schema.postgres.prisma`): os serviços de
  hospedagem (Vercel, por exemplo) não mantêm arquivos locais, então em produção
  usamos um PostgreSQL na nuvem. O projeto detecta o ambiente sozinho: no
  `npm install` dentro da Vercel o schema PostgreSQL é usado automaticamente
  (veja `scripts/postinstall.js`).

### Comandos úteis

```bash
npm run db:generate      # gera o Prisma Client (também roda sozinho no install)
npm run db:push          # cria/atualiza as tabelas do banco local (SQLite)
npm run db:seed          # repopula o catálogo inicial (limpa os dados antes!)
npm run db:migrate       # migrations em modo dev
npm run setup:postgres   # prepara o banco de PRODUÇÃO (generate + push + seed)
```

> 💡 O `db:seed` **limpa tudo** e recria categorias, produtos, avaliações e cupom.
> Use quando quiser voltar ao catálogo de exemplo.

---

## ☁️ Deploy na Vercel + Neon (grátis) — passo a passo

A Vercel é a hospedagem oficial do Next.js e tem plano gratuito. O Neon dá o
banco PostgreSQL gratuito. Juntos, seu site fica **online e de graça**.

### Passo 1 — Suba o código para o GitHub

1. Crie uma conta no [github.com](https://github.com) e um repositório novo
   (ex.: `loja-lenora`), **privado**.
2. Na pasta do projeto (já com o `.gitignore` incluído — ele protege o `.env`):
   ```bash
   git init
   git add .
   git commit -m "Loja Lenora — catálogo online"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/loja-lenora.git
   git push -u origin main
   ```

### Passo 2 — Crie o banco PostgreSQL no Neon

1. Crie uma conta em [neon.tech](https://neon.tech) (plano free).
2. Crie um projeto (ex.: `lenora`) e copie a **Connection String** — parece com:
   ```
   postgresql://usuario:senha@ep-xxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```
3. **Crie e popule o banco** direto do seu computador: no arquivo `.env` do projeto,
   comente a linha do SQLite e cole a sua string do Neon no `DATABASE_URL`, então:
   ```bash
   npm run setup:postgres
   ```
   Isso cria as tabelas e popula o catálogo no Neon. ✅

### Passo 3 — Importe o projeto na Vercel

1. Crie uma conta em [vercel.com](https://vercel.com) com o GitHub.
2. **Add New → Project** → selecione o repositório `loja-lenora` → **Import**.
3. Antes de clicar em Deploy, abra **Environment Variables** e adicione:
   | Nome | Valor |
   |---|---|
   | `DATABASE_URL` | a mesma string do Neon (Passo 2) |
4. Clique em **Deploy** e aguarde ~2 minutos.

Pronto! 🎉 A Vercel executa o `npm install` → o `postinstall` detecta a Vercel e
gera o Prisma Client PostgreSQL automaticamente → `next build` → site no ar em
`https://seu-projeto.vercel.app`.

### Passo 4 (opcional) — Upload de fotos pelo painel em produção

As fotos novas enviadas pelo painel admin usam o **Vercel Blob**. Na Vercel:
**Storage → Create Database → Blob** e conecte ao seu projeto — a variável
`BLOB_READ_WRITE_TOKEN` é adicionada sozinha. Sem isso, o site funciona
normalmente; apenas o envio de novas fotos pelo painel não funcionará
(as fotos já existentes continuam no ar).

### A cada alteração futura

Basta `git push` — a Vercel publica a nova versão automaticamente.

---

## 🖥️ Deploy alternativo — servidor próprio (VPS)

Em uma VPS (Ubuntu, por exemplo) com Node 20+:

```bash
npm install
npm run build
npm run start        # http://localhost:3000
```

Para manter rodando 24h, use o **PM2**: `npm i -g pm2 && pm2 start "npm run start" --name lenora`.
Nesse cenário dá até para seguir com SQLite (arquivo local), mas o backup deve
ser feito com frequência (copie o `db/custom.db`). Para tráfego maior, prefira
PostgreSQL (mesmo `setup:postgres` do passo anterior).

---

## 🎨 Personalização rápida

- **Cores do site**: painel admin → Configurações (rosa principal, rosa bebê,
  vinho) ou direto em `src/lib/settings.ts` e `src/app/globals.css`.
- **Produtos e coleções**: painel admin (fotos, preço, promoção, cores, tamanhos, estoque).
- **WhatsApp / Instagram / e-mail / horário**: painel admin → Configurações
  (o carrinho finaliza a compra no número cadastrado: **62 99322-0950**).
- **Textos das faixas deslizantes**: `src/components/announcement-bar.tsx` e
  `src/components/site-footer.tsx`.
- **Catálogo de exemplo**: edite `scripts/seed-lenora.ts` e rode `npm run db:seed`.

---

## 🧯 Solução de problemas

| Problema | Solução |
|---|---|
| `Erro P1001: can't reach database` (produção) | Confira se `DATABASE_URL` na Vercel aponta para o Neon e se o banco já foi criado/populado (`npm run setup:postgres`). |
| `Erro P1001` ou página sem produtos (local) | Rode `npm run db:push && npm run db:seed`. |
| `Prisma Client did not initialize yet` | Rode `npm run db:generate` (ou `npm install` de novo). |
| A porta 3000 está ocupada | `npm run dev -- -p 3001` e acesse a porta 3001. |
| Upload de foto falha no painel | Configure o Vercel Blob (produção) — passo 4 do deploy. Local, use as fotos de `public/uploads/`. |
| Quero zerar a loja | `npm run db:push` e depois `npm run db:seed`. |

---

## 📞 Contato da loja

**Loja Lenora** · Goiânia/GO · Loja online com envio para todo o Brasil
WhatsApp **(62) 99322-0950** · Instagram **@loja.lenora** · Lojalenorah@gmail.com
Atendimento de **9h às 17h** · Pagamento combinado no WhatsApp (Pix, cartão, boleto)
