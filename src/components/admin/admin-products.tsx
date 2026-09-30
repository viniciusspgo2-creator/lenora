// Loja Lenora — Admin Products.
// Lista produtos + editor completo (Sheet grande à direita) com upload de
// imagens (converte para WebP no servidor), cores, tamanhos, etc.
'use client'
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  ImagePlus,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Upload,
  Save,
  Folder,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import type { SiteSettings } from '@/lib/settings'
import { formatBRL, slugify } from '@/lib/utils-lenora'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Category = {
  id: string
  name: string
  slug: string
  productCount?: number
  active?: boolean
}

type ProductRow = {
  id: string
  name: string
  slug: string
  status: string
  price: number
  compareAt?: number | null
  featured: boolean
  sku?: string | null
  tags?: string | null
  description: string
  categoryId: string
  category?: { name: string; slug: string }
  _count?: { images: number; colors: number; sizes: number }
  images?: { id: string; url: string; isMain: boolean; order: number }[]
  colors?: { id: string; name: string; hex: string; stock: number }[]
  sizes?: { id: string; name: string; stock: number }[]
  createdAt?: string
}

type ImageDraft = { url: string; isMain: boolean; order: number }
type ColorDraft = { name: string; hex: string; stock: number }
type SizeDraft = { name: string; stock: number }

type ProductForm = {
  name: string
  slug: string
  description: string
  price: string
  compareAt: string
  sku: string
  status: 'active' | 'draft' | 'archived'
  featured: boolean
  categoryId: string
  tags: string
  images: ImageDraft[]
  colors: ColorDraft[]
  sizes: SizeDraft[]
}

const EMPTY_FORM: ProductForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  compareAt: '',
  sku: '',
  status: 'active',
  featured: false,
  categoryId: '',
  tags: '',
  images: [],
  colors: [],
  sizes: [],
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  draft: 'Rascunho',
  archived: 'Arquivado',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-900',
  draft: 'bg-amber-100 text-amber-900',
  archived: 'bg-rose-100 text-rose-900',
}

export function AdminProducts({ settings }: { settings: SiteSettings }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [search, setSearch] = useState('')
  const [seeding, setSeeding] = useState(false)

  async function loadDemo() {
    setSeeding(true)
    try {
      const r = await fetch('/api/admin/seed-demo', { method: 'POST' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Falha ao carregar demonstrativos')
      toast.success(`${j.productsCreated} produtos e ${j.categoriesCreated} categorias carregados`)
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSeeding(false)
    }
  }

  // Lista de produtos (admin)
  const productsQuery = useQuery<{ items: ProductRow[] }>({
    queryKey: ['admin', 'products'],
    queryFn: () =>
      fetch('/api/admin/products', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('products')),
      ),
    staleTime: 15_000,
  })

  // Lista de categorias (admin) — inclui inativas
  const categoriesQuery = useQuery<{ items: Category[] }>({
    queryKey: ['admin', 'categories'],
    queryFn: () =>
      fetch('/api/admin/categories', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('categories')),
      ),
    staleTime: 30_000,
  })

  const categories = categoriesQuery.data?.items ?? []

  // Mutation salvar
  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        compareAt: form.compareAt ? Number(form.compareAt) : null,
        sku: form.sku.trim() || null,
        status: form.status,
        featured: form.featured,
        categoryId: form.categoryId,
        tags: form.tags.trim() || null,
        images: form.images.map((im, i) => ({
          url: im.url,
          isMain: i === 0 ? true : im.isMain,
          order: i,
        })),
        colors: form.colors
          .filter((c) => c.name.trim() && c.hex)
          .map((c) => ({
            name: c.name.trim(),
            hex: c.hex,
            stock: Number(c.stock) || 0,
          })),
        sizes: form.sizes
          .filter((s) => s.name.trim())
          .map((s) => ({
            name: s.name.trim(),
            stock: Number(s.stock) || 0,
          })),
      }
      const url = editId
        ? `/api/admin/products/${editId}`
        : '/api/admin/products'
      const method = editId ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha ao salvar')
      return data
    },
    onSuccess: () => {
      toast.success(editId ? 'Produto atualizado ✨' : 'Produto criado ✨')
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      setOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Mutation delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha ao excluir')
      return data
    },
    onSuccess: () => {
      toast.success('Produto excluído.')
      setDeleteId(null)
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Abrir editor para NOVO
  function newProduct() {
    setEditId(null)
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ?? '',
    })
    setOpen(true)
  }

  // Abrir editor para EDITAR — busca detalhes via /api/products/[slug]
  async function editProduct(p: ProductRow) {
    setEditId(p.id)
    setForm({
      name: p.name ?? '',
      slug: p.slug ?? '',
      description: p.description ?? '',
      price: String(p.price ?? ''),
      compareAt: p.compareAt != null ? String(p.compareAt) : '',
      sku: p.sku ?? '',
      status: (p.status as ProductForm['status']) ?? 'active',
      featured: !!p.featured,
      categoryId: p.categoryId,
      tags: p.tags ?? '',
      images: (p.images ?? []).map((i) => ({
        url: i.url,
        isMain: i.isMain,
        order: i.order,
      })),
      colors: (p.colors ?? []).map((c) => ({
        name: c.name,
        hex: c.hex,
        stock: c.stock,
      })),
      sizes: (p.sizes ?? []).map((s) => ({
        name: s.name,
        stock: s.stock,
      })),
    })
    // Se não vieram images/colors/sizes do list, busca o detalhe público:
    if (!p.images && !p.colors && !p.sizes) {
      try {
        const r = await fetch(`/api/products/${p.slug}`, {
          cache: 'no-store',
        })
        if (r.ok) {
          const data = await r.json()
          const prod = data.product
          if (prod) {
            setForm((f) => ({
              ...f,
              description: prod.description ?? f.description,
              images: (prod.images ?? []).map((i: any) => ({
                url: i.url,
                isMain: i.isMain,
                order: i.order ?? 0,
              })),
              colors: (prod.colors ?? []).map((c: any) => ({
                name: c.name,
                hex: c.hex,
                stock: c.stock ?? 0,
              })),
              sizes: (prod.sizes ?? []).map((s: any) => ({
                name: s.name,
                stock: s.stock ?? 0,
              })),
            }))
          }
        }
      } catch {
        /* ignore */
      }
    }
    setOpen(true)
  }

  const filtered = useMemo(() => {
    const list = productsQuery.data?.items ?? []
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q),
    )
  }, [productsQuery.data, search])

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Catálogo
          </p>
          <h2 className="font-serif text-2xl">Produtos</h2>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, slug ou SKU…"
            className="h-10 sm:w-64"
          />
          <Button
            onClick={newProduct}
            className="btn-gold h-10 gap-2 border-0 px-4 text-xs uppercase tracking-[0.2em] hover:brightness-110"
          >
            <Plus className="size-4" />
            Novo
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border border-border bg-surface">
        {productsQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Folder className="size-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {search.trim()
                ? 'Nenhum produto encontrado para a busca.'
                : 'Ainda não há produtos cadastrados.'}
            </p>
            <Button
              onClick={newProduct}
              className="btn-gold mt-1 h-10 gap-2 border-0 text-xs uppercase tracking-[0.2em]"
            >
              <Plus className="size-4" />
              Criar primeiro produto
            </Button>
            {!search.trim() && (
              <Button
                variant="outline"
                onClick={loadDemo}
                disabled={seeding}
                className="h-10 gap-2 text-xs uppercase tracking-[0.2em]"
              >
                {seeding ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Carregar produtos demonstrativos
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pl-4 pr-3">Produto</th>
                  <th className="px-3 py-3 hidden md:table-cell">Categoria</th>
                  <th className="px-3 py-3">Preço</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 hidden sm:table-cell">Estoque</th>
                  <th className="px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const img = p.images?.[0]?.url
                    ? `${p.images[0].url}`
                    : null
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-muted">
                            {img ? (
                              <img
                                src={img}
                                alt={p.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <ImagePlus className="size-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {p.name}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {p.slug}
                              {p.sku ? ` · ${p.sku}` : ''}
                            </p>
                            {p.featured && (
                              <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-accent">
                                <Star className="size-3 fill-accent" />
                                Destaque
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {p.category?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{formatBRL(p.price)}</p>
                        {p.compareAt ? (
                          <p className="text-[11px] text-muted-foreground line-through">
                            {formatBRL(p.compareAt)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded px-2 py-1 text-[10px] uppercase tracking-wider ${STATUS_COLORS[p.status] ?? 'bg-muted'}`}
                        >
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                        {p._count?.colors ?? 0} cores · {p._count?.sizes ?? 0}{' '}
                        tamanhos
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => editProduct(p)}
                            aria-label="Editar"
                            className="grid size-9 place-items-center rounded-md text-foreground hover:bg-muted"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteId(p.id)
                              setDeleteName(p.name)
                            }}
                            aria-label="Excluir"
                            className="grid size-9 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDITOR SHEET */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-2xl lg:max-w-3xl"
        >
          <SheetHeader className="flex flex-row items-center justify-between border-b border-border p-5">
            <div>
              <SheetTitle className="font-serif text-2xl">
                {editId ? 'Editar produto' : 'Novo produto'}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {editId
                  ? 'Atualize os campos abaixo e salve.'
                  : 'Preencha os campos e crie um novo item no catálogo.'}
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5">
            <ProductEditor
              form={form}
              setForm={setForm}
              categories={categories}
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border bg-surface p-5">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-11 px-6 text-xs uppercase tracking-[0.2em]"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending ||
                !form.name.trim() ||
                !form.categoryId ||
                !form.price
              }
              className="btn-gold h-11 gap-2 border-0 px-6 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {editId ? 'Salvar alterações' : 'Criar produto'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* DELETE CONFIRM */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <b>{deleteName}</b> do catálogo?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="h-11 bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ───────────────────────── PRODUCT EDITOR ─────────────────────────
function ProductEditor({
  form,
  setForm,
  categories,
}: {
  form: ProductForm
  setForm: React.Dispatch<React.SetStateAction<ProductForm>>
  categories: Category[]
}) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Atualiza slug automaticamente quando muda o nome (apenas se slug vazio ou igual ao slug do nome antigo)
  useEffect(() => {
    if (
      form.name &&
      (!form.slug || form.slug === slugify(form.name.slice(0, -1)))
    ) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }))
    }
  }, [form.name])

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (arr.length === 0) return
    if (form.images.length + arr.length > 20) {
      toast.error('Máximo de 20 imagens por produto.')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      arr.forEach((f) => fd.append('file', f))
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const contentType = r.headers.get('content-type') ?? ''

      if (!contentType.includes('application/json')) {
        // Evita o erro confuso "Unexpected token '<'" quando o servidor
        // responde uma página HTML (por exemplo, 404/500 do Next.js).
        await r.text()
        throw new Error(
          r.status === 404
            ? 'A rota de upload não foi encontrada no servidor.'
            : `Falha no upload (HTTP ${r.status}).`,
        )
      }

      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha no upload')
      const urls: string[] = data.urls ?? []
      setForm((f) => ({
        ...f,
        images: [
          ...f.images,
          ...urls.map<ImageDraft>((url, i) => ({
            url,
            isMain: f.images.length === 0 && i === 0,
            order: f.images.length + i,
          })),
        ],
      }))
      toast.success(`${urls.length} imagem(s) enviada(s).`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  function removeImage(idx: number) {
    setForm((f) => {
      const imgs = [...f.images]
      imgs.splice(idx, 1)
      if (imgs.length && !imgs.some((i) => i.isMain)) imgs[0].isMain = true
      return { ...f, images: imgs.map((im, i) => ({ ...im, order: i })) }
    })
  }

  function setMainImage(idx: number) {
    setForm((f) => ({
      ...f,
      images: f.images.map((im, i) => ({ ...im, isMain: i === idx })),
    }))
  }

  function moveImage(idx: number, dir: -1 | 1) {
    setForm((f) => {
      const arr = [...f.images]
      const ni = idx + dir
      if (ni < 0 || ni >= arr.length) return f
      ;[arr[idx], arr[ni]] = [arr[ni], arr[idx]]
      return {
        ...f,
        images: arr.map((im, i) => ({ ...im, order: i })),
      }
    })
  }

  function addColor() {
    setForm((f) => ({
      ...f,
      colors: [...f.colors, { name: '', hex: '#0a0a0a', stock: 0 }],
    }))
  }
  function updateColor(idx: number, patch: Partial<ColorDraft>) {
    setForm((f) => ({
      ...f,
      colors: f.colors.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }))
  }
  function removeColor(idx: number) {
    setForm((f) => ({
      ...f,
      colors: f.colors.filter((_, i) => i !== idx),
    }))
  }

  function addSize() {
    setForm((f) => ({
      ...f,
      sizes: [...f.sizes, { name: '', stock: 0 }],
    }))
  }
  function updateSize(idx: number, patch: Partial<SizeDraft>) {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }))
  }
  function removeSize(idx: number) {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.filter((_, i) => i !== idx),
    }))
  }

  const field =
    'h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'

  return (
    <div className="space-y-6">
      {/* BÁSICO */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 font-serif text-lg">Informações básicas</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              Nome *
            </Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="Ex: Vestido midi translúcido"
              className="h-11"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              Slug (URL)
            </Label>
            <Input
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
              }
              placeholder="gerado-automaticamente"
              className="h-11"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              SKU (opcional)
            </Label>
            <Input
              value={form.sku}
              onChange={(e) =>
                setForm((f) => ({ ...f, sku: e.target.value }))
              }
              placeholder="VL-0001"
              className="h-11"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              Descrição *
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={4}
              placeholder="Tecido, modelagem, ocasião…"
              className="min-h-24 resize-y"
            />
          </div>
        </div>
      </section>

      {/* PREÇO E STATUS */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h3 className="mb-4 font-serif text-lg">Preço e organização</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              Preço (R$) *
            </Label>
            <Input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              placeholder="0,00"
              className="h-11"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              Preço de (riscado)
            </Label>
            <Input
              type="number"
              step="0.01"
              value={form.compareAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, compareAt: e.target.value }))
              }
              placeholder="opcional"
              className="h-11"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              Status
            </Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  status: v as ProductForm['status'],
                }))
              }
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              Categoria
            </Label>
            <Select
              value={form.categoryId}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, categoryId: v }))
              }
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    Nenhuma categoria cadastrada
                  </SelectItem>
                ) : (
                  categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.active === false ? ' (inativa)' : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              Tags (separadas por vírgula)
            </Label>
            <Input
              value={form.tags}
              onChange={(e) =>
                setForm((f) => ({ ...f, tags: e.target.value }))
              }
              placeholder="verão, festa, manga longa"
              className="h-11"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">
              Destaque
            </Label>
            <div className="flex h-11 items-center gap-3 rounded-md border border-border bg-background px-4">
              <Switch
                checked={form.featured}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, featured: v }))
                }
              />
              <span className="text-xs text-muted-foreground">
                Marcar como produto em destaque
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* IMAGENS */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg">Imagens</h3>
            <p className="text-[11px] text-muted-foreground">
              Máx. 20 · convertidas para WebP (1600px) no upload.
            </p>
          </div>
          {form.images.length > 0 && (
            <Badge className="bg-accent text-accent-foreground">
              {form.images.length}
            </Badge>
          )}
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files.length > 0) {
              uploadFiles(e.dataTransfer.files)
            }
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition ${
            dragOver
              ? 'border-accent bg-accent/10'
              : 'border-border hover:border-accent/50'
          }`}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files)
              e.currentTarget.value = ''
            }}
          />
          {uploading ? (
            <>
              <Loader2 className="size-6 animate-spin text-accent" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Enviando…
              </span>
            </>
          ) : (
            <>
              <Upload className="size-6 text-accent" />
              <p className="text-sm font-medium">
                Arraste imagens ou clique para enviar
              </p>
              <p className="text-[11px] text-muted-foreground">
                WebP automático · máx 1600px de largura
              </p>
            </>
          )}
        </label>

        {form.images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {form.images.map((im, i) => (
              <div
                key={i}
                className={`group relative overflow-hidden rounded-md border bg-muted ${
                  im.isMain ? 'border-accent ring-2 ring-accent/40' : 'border-border'
                }`}
              >
                <div className="relative aspect-square">
                  <img
                    src={im.url}
                    alt={`Imagem ${i + 1}`}
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
                  {/* Ações */}
                  <div className="absolute right-1 top-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label="Remover"
                      className="grid size-7 place-items-center rounded bg-black/60 text-white hover:bg-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-1 left-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      aria-label="Mover esquerda"
                      className="grid size-7 place-items-center rounded bg-black/60 text-white disabled:opacity-30"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, 1)}
                      disabled={i === form.images.length - 1}
                      aria-label="Mover direita"
                      className="grid size-7 place-items-center rounded bg-black/60 text-white disabled:opacity-30"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center justify-center gap-1.5 border-t border-border py-1 text-[10px] uppercase tracking-wider">
                  <input
                    type="radio"
                    name="main-image"
                    checked={im.isMain}
                    onChange={() => setMainImage(i)}
                    className="accent-accent"
                  />
                  {im.isMain ? (
                    <span className="text-accent">Principal</span>
                  ) : (
                    <span className="text-muted-foreground">Capa</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CORES */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg">Cores & estoque</h3>
            <p className="text-[11px] text-muted-foreground">
              Cada cor vira swatch na ficha do produto.
            </p>
          </div>
          <Button
            type="button"
            onClick={addColor}
            variant="outline"
            className="h-9 gap-1.5 px-3 text-xs"
          >
            <Plus className="size-3.5" />
            Cor
          </Button>
        </div>
        {form.colors.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma cor adicionada.
          </p>
        ) : (
          <div className="space-y-2">
            {form.colors.map((c, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-md border border-border bg-background p-2 sm:flex-row sm:items-center"
              >
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => updateColor(i, { hex: e.target.value })}
                  className="size-11 shrink-0 cursor-pointer rounded border border-border bg-transparent p-1"
                  aria-label="Cor"
                />
                <Input
                  value={c.name}
                  onChange={(e) => updateColor(i, { name: e.target.value })}
                  placeholder="Nome (Preto, Off-white, Vinho…)"
                  className="h-11 flex-1"
                />
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Estoque
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={c.stock}
                    onChange={(e) =>
                      updateColor(i, { stock: Number(e.target.value) || 0 })
                    }
                    className="h-11 w-24"
                  />
                  <button
                    type="button"
                    onClick={() => removeColor(i)}
                    aria-label="Remover cor"
                    className="grid size-11 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* TAMANHOS */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg">Tamanhos & estoque</h3>
            <p className="text-[11px] text-muted-foreground">
              P, M, G, GG, EXG ou personalizado.
            </p>
          </div>
          <Button
            type="button"
            onClick={addSize}
            variant="outline"
            className="h-9 gap-1.5 px-3 text-xs"
          >
            <Plus className="size-3.5" />
            Tamanho
          </Button>
        </div>
        {form.sizes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum tamanho adicionado.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {form.sizes.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border border-border bg-background p-2"
              >
                <Input
                  value={s.name}
                  onChange={(e) => updateSize(i, { name: e.target.value })}
                  placeholder="P / M / G / GG / EXG"
                  className="h-11 flex-1"
                />
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Estoque
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={s.stock}
                  onChange={(e) =>
                    updateSize(i, { stock: Number(e.target.value) || 0 })
                  }
                  className="h-11 w-24"
                />
                <button
                  type="button"
                  onClick={() => removeSize(i)}
                  aria-label="Remover tamanho"
                  className="grid size-11 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <Check className="size-3 text-accent" />
        {form.featured
          ? 'Produto marcado como destaque.'
          : 'Sem marcação de destaque.'}
      </p>
    </div>
  )
}
