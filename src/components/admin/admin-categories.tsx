// Loja Lenora — Admin Categories.
// Lista categorias (ativas + inativas) + cria/edita/exclui.
'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, FolderTree, Loader2, Save, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Skeleton } from '@/components/ui/skeleton'

type Category = {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  order: number
  active: boolean
  productCount?: number
}

type FormData = {
  name: string
  description: string
  image: string
  order: number
  active: boolean
}

const EMPTY: FormData = {
  name: '',
  description: '',
  image: '',
  order: 0,
  active: true,
}

export function AdminCategories() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Upload da foto de capa (converte para WebP no servidor via /api/admin/upload)
  async function uploadImage(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (arr.length === 0) return
    setUploading(true)
    try {
      const fd = new FormData()
      arr.slice(0, 1).forEach((f) => fd.append('file', f))
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const contentType = r.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        await r.text()
        throw new Error(
          r.status === 404
            ? 'A rota de upload não foi encontrada no servidor.'
            : `Falha no upload (HTTP ${r.status}).`,
        )
      }
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha no upload')
      const url: string | undefined = data.urls?.[0]
      if (!url) throw new Error('Servidor não retornou a URL da imagem.')
      setForm((f) => ({ ...f, image: url }))
      toast.success('Imagem enviada!')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const listQ = useQuery<{ items: Category[] }>({
    queryKey: ['admin', 'categories'],
    queryFn: () =>
      fetch('/api/admin/categories', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('cats')),
      ),
    staleTime: 15_000,
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        image: form.image.trim() || null,
        order: Number(form.order) || 0,
        active: form.active,
      }
      const url = editId
        ? `/api/admin/categories/${editId}`
        : '/api/admin/categories'
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
      toast.success(editId ? 'Categoria atualizada' : 'Categoria criada')
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
      setOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha ao excluir')
      return data
    },
    onSuccess: () => {
      toast.success('Categoria excluída.')
      setDeleteId(null)
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY, order: listQ.data?.items?.length ?? 0 })
    setOpen(true)
  }
  function openEdit(c: Category) {
    setEditId(c.id)
    setForm({
      name: c.name,
      description: c.description ?? '',
      image: c.image ?? '',
      order: c.order,
      active: c.active,
    })
    setOpen(true)
  }

  const cats = listQ.data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Organização
          </p>
          <h2 className="font-serif text-2xl">Categorias</h2>
        </div>
        <Button
          onClick={openNew}
          className="btn-gold h-10 gap-2 border-0 px-4 text-xs uppercase tracking-[0.2em]"
        >
          <Plus className="size-4" />
          Nova
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        {listQ.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : cats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FolderTree className="size-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria cadastrada.
            </p>
            <Button
              onClick={openNew}
              className="btn-gold mt-1 h-10 gap-2 border-0 text-xs uppercase tracking-[0.2em]"
            >
              <Plus className="size-4" />
              Criar primeira categoria
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pl-4 pr-3">Categoria</th>
                  <th className="px-3 py-3 hidden sm:table-cell">
                    Descrição
                  </th>
                  <th className="px-3 py-3">Produtos</th>
                  <th className="px-3 py-3">Ordem</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cats.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-muted">
                          {c.image ? (
                            <img
                              src={c.image}
                              alt={c.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <FolderTree className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {c.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                      {c.description ? (
                        <span className="line-clamp-1">
                          {c.description}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Badge className="bg-muted text-foreground">
                        {c.productCount ?? 0}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs">{c.order}</td>
                    <td className="px-3 py-3">
                      {c.active ? (
                        <span className="inline-flex rounded bg-emerald-100 px-2 py-1 text-[10px] uppercase tracking-wider text-emerald-900">
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex rounded bg-rose-100 px-2 py-1 text-[10px] uppercase tracking-wider text-rose-900">
                          Inativa
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          aria-label="Editar"
                          className="grid size-9 place-items-center rounded-md text-foreground hover:bg-muted"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(c.id)
                            setDeleteName(c.name)
                          }}
                          aria-label="Excluir"
                          className="grid size-9 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DIALOG CREATE/EDIT */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editId ? 'Editar categoria' : 'Nova categoria'}
            </DialogTitle>
            <DialogDescription>
              {editId
                ? 'Altere os campos abaixo e salve.'
                : 'Crie uma nova categoria para organizar o catálogo.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                Nome *
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ex: Vestidos midi"
                className="h-11"
                autoFocus
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                Descrição
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="Breve descrição exibida na home"
                className="resize-y"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                Foto da capa
              </Label>
              {form.image ? (
                <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                  <img
                    src={form.image}
                    alt="Capa da categoria"
                    className="size-14 shrink-0 rounded-md border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-muted-foreground">
                      {form.image}
                    </p>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image: '' }))}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-destructive transition-colors hover:text-destructive/80"
                    >
                      <X className="size-3" />
                      Remover imagem
                    </button>
                  </div>
                </div>
              ) : (
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
                      uploadImage(e.dataTransfer.files)
                    }
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed p-5 text-center transition ${
                    dragOver
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files) uploadImage(e.target.files)
                      e.currentTarget.value = ''
                    }}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="size-5 animate-spin text-accent" />
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        Enviando…
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-5 text-accent" />
                      <p className="text-sm font-medium">
                        Clique para enviar a foto da capa
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        JPG/PNG · convertida para WebP no upload
                      </p>
                    </>
                  )}
                </label>
              )}
              <Input
                value={form.image}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image: e.target.value }))
                }
                placeholder="Ou cole a URL da imagem (ex: /uploads/foto.webp)"
                className="mt-2 h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Ordem
                </Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      order: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-11"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Status
                </Label>
                <div className="flex h-11 items-center gap-2 rounded-md border border-border bg-background px-4">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, active: v }))
                    }
                  />
                  <span className="text-xs">
                    {form.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-11 px-6 text-xs uppercase tracking-[0.2em]"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || !form.name.trim()}
              className="btn-gold h-11 gap-2 border-0 px-6 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
            >
              {saveMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Tem certeza que deseja excluir "${deleteName}"?`}
              <br />
              Categorias com produtos vinculados não podem ser removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && delMut.mutate(deleteId)}
              className="h-11 bg-destructive text-white hover:bg-destructive/90"
            >
              {delMut.isPending ? (
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
