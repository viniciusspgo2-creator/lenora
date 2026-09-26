// PoliciesView (Loja Lenora) — página long-form de políticas com sidebar
// de navegação. Suporta emoji no título, parágrafos, listas de checagem e
// CTA inline (WhatsApp). Conteúdo único e exclusivo da Loja Lenora.
'use client'
import { motion } from 'framer-motion'
import { Check, MessageCircle } from 'lucide-react'
import type { SiteSettings } from '@/lib/settings'
import { useViewNav } from '@/lib/nav'

type Props = {
  settings: SiteSettings
  policy: string
}

type Section = {
  emoji?: string
  h: string
  p?: string | string[]
  list?: string[]
  p2?: string
  cta?: boolean
}

type Policy = {
  slug: string
  label: string
  title: string
  intro: string
}

const POLICIES: Policy[] = [
  {
    slug: 'trocas',
    label: 'Trocas e Devoluções',
    title: 'Trocas e Devoluções',
    intro:
      'Na Loja Lenora, queremos que você fique completamente satisfeita com suas compras 💖 Caso precise trocar um produto ou solicitar uma devolução, siga as orientações abaixo.',
  },
  {
    slug: 'vendas',
    label: 'Política de Vendas',
    title: 'Política de Vendas',
    intro:
      'Confira abaixo nossa Política de Vendas e entenda como funcionam nossos processos de compra ✨',
  },
  {
    slug: 'termos',
    label: 'Termos de Uso',
    title: 'Termos de Uso',
    intro:
      'Esta política de Termos de Uso é válida a partir de junho de 2026. Ao acessar nosso site, você concorda com as condições descritas abaixo.',
  },
  {
    slug: 'privacidade',
    label: 'Privacidade',
    title: 'Política de Privacidade',
    intro:
      'A Loja Lenora respeita a sua privacidade e se compromete a proteger seus dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018).',
  },
  {
    slug: 'cookies',
    label: 'Cookies',
    title: 'Política de Cookies',
    intro:
      'Esta política explica como a Loja Lenora utiliza cookies e tecnologias similares em seu site.',
  },
]

const SECTIONS: Record<string, Section[]> = {
  trocas: [
    {
      emoji: '📦',
      h: 'Devoluções',
      p: 'Por se tratar de venda no atacado e varejo, as trocas e devoluções são aceitas apenas em casos de:',
      list: ['Defeito de fabricação', 'Produto enviado incorretamente'],
      p2: 'O prazo para devolução é de até 7 dias corridos após o recebimento.',
    },
    {
      emoji: '💬',
      h: 'Como solicitar',
      p: 'Clique no botão abaixo e envie os dados do seu pedido pelo WhatsApp:',
      list: [
        'Número do pedido',
        'Nome completo',
        'CPF',
        'Motivo da troca ou devolução',
      ],
      p2: 'Nosso time vai te atender rapidinho 😊',
      cta: true,
    },
  ],

  vendas: [
    {
      emoji: '📝',
      h: 'Cadastro',
      p: 'Para realizar compras em nosso site, é necessário possuir um e-mail válido. Basta preencher o cadastro com os dados solicitados de forma correta e atualizada.',
    },
    {
      emoji: '💰',
      h: 'Preços e formas de pagamento',
      list: [
        'As compras podem ser parceladas em até 2x no cartão de crédito',
        'Aceitamos cartões de crédito, débito e pix',
        'Os preços podem ser alterados a qualquer momento, sem aviso prévio',
        'Será considerado o valor exibido no momento da finalização da compra',
        'As condições do site podem ser diferentes do Instagram ou WhatsApp',
      ],
    },
    {
      emoji: '🚚',
      h: 'Entrega',
      list: [
        'O prazo de postagem é de 1 a 5 dias úteis após a confirmação do pagamento',
        'O prazo de entrega varia conforme a região e segue as condições dos Correios',
        'O valor do frete é calculado automaticamente com base no peso e quantidade de itens do pedido',
      ],
    },
    {
      emoji: '📍',
      h: 'Postagem e rastreamento',
      p: 'Após o envio do pedido, você receberá um código de rastreamento por e-mail. Você pode acompanhar a entrega de duas formas:',
      list: [
        'Através do site dos Correios com o código enviado',
        'Ou diretamente pela sua conta em nosso site (Meus pedidos)',
      ],
      p2:
        'Recomendamos acompanhar o rastreio regularmente para garantir o recebimento. Serão realizadas até 2 tentativas de entrega; após isso, o pedido retorna ao remetente e o custo de reenvio será de responsabilidade da cliente.',
    },
    {
      emoji: '📋',
      h: 'Termos e condições de compra',
      list: [
        'Buscamos fidelidade nas imagens, podendo haver pequenas variações de cor',
        'Cada produto adicionado à sacola exibe descrição, valor e frete',
        'A cliente pode revisar todas as informações antes de finalizar a compra',
      ],
    },
  ],

  termos: [
    {
      emoji: '📑',
      h: 'Sobre os termos',
      p: 'A Loja Lenora, pessoa jurídica de direito privado, estabelece neste documento as regras de uso do site lojalenora.com.br e demais plataformas operadas pela marca. Caso você não concorde com os termos, recomendamos que não utilize o site nem forneça seus dados.',
    },
    {
      emoji: '🔃',
      h: 'Atualizações',
      list: [
        'Os Termos de Uso podem ser atualizados a qualquer momento',
        'As alterações serão publicadas nesta página com data revisada',
        'O uso contínuo do site após mudanças significa que você aceita os novos termos',
      ],
    },
    {
      emoji: '🙍',
      h: 'Usuária',
      p: 'Ao utilizar este site, você automaticamente assume a condição de usuária e concorda com todas as regras aqui descritas.',
    },
    {
      emoji: '🛡️',
      h: 'Privacidade',
      p: 'O uso deste site também implica na aceitação da nossa Política de Privacidade.',
    },
    {
      emoji: '🔑',
      h: 'Acesso e cadastro',
      list: [
        'O acesso ao site é gratuito',
        'Algumas funções podem exigir cadastro com login e senha',
        'A usuária deve fornecer informações verdadeiras e atualizadas',
        'O compartilhamento de dados de acesso é de responsabilidade da usuária',
      ],
    },
    {
      emoji: '🗨️',
      h: 'Conteúdo da usuária',
      p: 'Não é permitido publicar conteúdos ofensivos, ilegais ou que infrinjam direitos de terceiros. Ao publicar conteúdos, você concede à Loja Lenora o direito de uso, reprodução e divulgação sem restrições.',
    },
    {
      emoji: '⚙️',
      h: 'Cookies',
      p: 'Utilizamos cookies para melhorar sua experiência, personalizar conteúdos e analisar o uso do site. Você pode desativar os cookies no seu navegador, mas isso pode afetar o funcionamento do site.',
    },
    {
      emoji: '🏷️',
      h: 'Propriedade intelectual',
      p: 'Todos os conteúdos da Loja Lenora são protegidos por direitos autorais e não podem ser utilizados sem autorização.',
    },
    {
      emoji: '⚡',
      h: 'Funcionamento',
      p: 'O site pode ser alterado, a qualquer momento, sem aviso prévio.',
    },
    {
      emoji: '🛡️',
      h: 'Dados pessoais',
      p: 'Os dados coletados são tratados conforme nossa Política de Privacidade.',
    },
    {
      emoji: '✉️',
      h: 'Contato',
      p: 'Em caso de dúvidas, entre em contato pelo e-mail: Lojalenorah@gmail.com',
    },
  ],

  privacidade: [
    {
      h: 'Dados que coletamos',
      p: [
        'Coletamos apenas os dados necessários para o processamento do seu pedido: nome, telefone, email, CEP e endereço de entrega, informados no checkout via WhatsApp.',
        'Em caso de criação de conta, armazenamos também email e senha (com hash seguro) para que você acompanhe seus pedidos.',
      ],
    },
    {
      h: 'Como utilizamos seus dados',
      p: [
        'Para confirmar pedidos, combinar envio, enviar atualizações de status e oferecer um atendimento personalizado.',
        'Não vendemos nem cedemos seus dados a terceiros. Compartilhamos apenas com transportadoras e meios de pagamento, conforme necessário para a entrega.',
      ],
    },
    {
      h: 'Seus direitos (LGPD)',
      p: [
        'Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados a qualquer momento, pelo WhatsApp ou email.',
        'Para solicitações de exclusão, atenderemos em até 15 dias corridos, salvo retenção obrigatória por lei.',
      ],
    },
    {
      h: 'Retenção',
      p: 'Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas, salvo obrigações legais de guarda.',
    },
    {
      h: 'Contato',
      p: 'Em caso de dúvidas sobre privacidade, fale com a gente pelo WhatsApp ou email informados no rodapé do site.',
    },
  ],

  cookies: [
    {
      h: 'O que são cookies',
      p: 'Cookies são pequenos arquivos de texto armazenados no seu navegador para guardar preferências e permitir o funcionamento do site.',
    },
    {
      h: 'Cookies que utilizamos',
      p: [
        'Cookies essenciais: permitem o funcionamento da sacola, favoritos e sessão da conta. Sem eles, recursos do site não operam corretamente.',
        'Cookies de desempenho: registram estatísticas de visita anônimas para que possamos melhorar a curadoria e a experiência.',
      ],
    },
    {
      h: 'Cookies de terceiros',
      p: 'Não utilizamos cookies publicitários de rastreamento de terceiros. Eventuais ferramentas de analytics são anonimizadas.',
    },
    {
      h: 'Gerenciar cookies',
      p: 'Você pode desativar cookies nas configurações do seu navegador. Recursos como sacola e conta podem deixar de funcionar.',
    },
  ],
}

export function PoliciesView({ settings, policy }: Props) {
  const nav = useViewNav()
  const slug = POLICIES.find((p) => p.slug === policy) ? policy : 'trocas'
  const current = POLICIES.find((p) => p.slug === slug)!
  const sections = SECTIONS[slug] ?? []
  const wa = settings.contact.whatsapp.replace(/\D/g, '')

  // Mensagem pré-preenchida para a política de trocas
  const trocasMessage = encodeURIComponent(
    'Olá, Loja Lenora! 💖 Gostaria de solicitar troca/devolução.\n\nVou informar os dados:\n• Número do pedido:\n• Nome completo:\n• CPF:\n• Motivo da troca ou devolução:'
  )

  return (
    <div className="fade-in">
      {/* Header */}
      <section className="border-b border-border bg-secondary/40">
        <div className="container-lenora flex flex-col gap-3 py-12 text-center md:py-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            Políticas
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {current.title}
          </h1>
          <div className="gold-line w-20" />
        </div>
      </section>

      <div className="container-lenora py-10 md:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
          {/* Sidebar nav */}
          <aside className="lg:sticky lg:top-36 lg:self-start">
            <nav className="flex flex-row gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
              {POLICIES.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => nav({ view: 'policies', policy: p.slug })}
                  className={`flex h-11 shrink-0 items-center rounded-md px-4 text-xs font-semibold uppercase tracking-widest transition-colors lg:h-auto lg:py-2.5 lg:text-left ${
                    p.slug === slug
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground/80 hover:bg-muted hover:text-accent'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <article className="max-w-none">
            <motion.p
              key={`${slug}-intro`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 text-lg font-medium leading-relaxed text-foreground"
            >
              {current.intro}
            </motion.p>

            <motion.div
              key={`${slug}-sections`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-7"
            >
              {sections.map((s, i) => {
                return (
                  <section key={i} className="space-y-3">
                    <h2 className="flex items-center gap-3 text-xl font-bold text-foreground sm:text-2xl">
                      {s.emoji && (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/12 text-lg">
                          {s.emoji}
                        </span>
                      )}
                      {s.h}
                    </h2>
                    {s.p && (
                      <>
                        {Array.isArray(s.p) ? (
                          s.p.map((pp, k) => (
                            <p
                              key={k}
                              className="text-sm leading-relaxed text-muted-foreground sm:text-base"
                            >
                              {pp}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                            {s.p}
                          </p>
                        )}
                      </>
                    )}
                    {s.list && (
                      <ul className="space-y-2 pl-1">
                        {s.list.map((item, k) => (
                          <li
                            key={k}
                            className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90 sm:text-base"
                          >
                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {s.p2 && (
                      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {s.p2}
                      </p>
                    )}
                    {s.cta && (
                      <a
                        href={`https://wa.me/${wa}?text=${trocasMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gold mt-2 inline-flex h-12 items-center gap-2 rounded-md px-7 text-sm font-semibold uppercase tracking-[0.16em]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Solicitar troca pelo WhatsApp
                      </a>
                    )}
                  </section>
                )
              })}
            </motion.div>

            {/* Footer / contato */}
            <div className="mt-10 rounded-md border border-accent/40 bg-accent/5 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
                Dúvidas?
              </p>
              <p className="mt-1 text-lg font-bold text-foreground">
                Fale com a gente pelo WhatsApp
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Atendemos de segunda a sexta, das 9h às 17h, com carinho e
                atenção a cada detalhe.
              </p>
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold mt-4 inline-flex h-11 items-center gap-2 rounded-md px-6 text-xs font-semibold uppercase tracking-widest"
              >
                <MessageCircle className="h-4 w-4" />
                Falar no WhatsApp
              </a>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
