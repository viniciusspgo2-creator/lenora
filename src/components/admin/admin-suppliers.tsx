// Loja Lenora — Admin Suppliers.
// CRUD de fornecedores (nome, contato, telefone, email, CNPJ, notas).
'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  Truck,
  Loader2,
  Save,
  Phone,
  Mail,
  User,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import type { SiteSettings } from '@/lib/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

type Supplier = {
  id: string
  name: string
  contact?: string | null
  phone?: string | null
  email?: string | null
  cnpj?: string | null
  notes?: string | null
  entriesCount?: number
  createdAt: string
}

type FormData = {
  name: string
  contact: string
  phone: string
  email: string
  cnpj: string
  notes: string
}

const EMPTY: FormData = {
  name: '',
  contact: '',
  phone: '',
  email: '',
  cnpj: '',
  notes: '',
}

export function AdminSuppliers({ settings }: { settings: SiteSettings }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')

  const listQ = useQuery<{ items: Supplier[] }>({
    queryKey: ['admin', 'suppliers'],
    queryFn: () =>
      fetch('/api/admin/suppliers', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('suppliers')),
      ),
    staleTime: 15_000,
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        contact: form.contact.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        cnpj: form.cnpj.trim() || null,
        notes: form.notes.trim() || null,
      }
      const url = editId
        ? `/api/admin/suppliers/${editId}`
        : '/api/admin/suppliers'
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
      toast.success(editId ? 'Fornecedor atualizado' : 'Fornecedor criado')
      qc.invalidateQueries({ queryKey: ['admin', 'suppliers'] })
      setOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/suppliers/${id}`, {
        method: 'DELETE',
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha ao excluir')
      return data
    },
    onSuccess: () => {
      toast.success('Fornecedor excluído.')
      setDeleteId(null)
      qc.invalidateQueries({ queryKey: ['admin', 'suppliers'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY })
    setOpen(true)
  }

  function openEdit(s: Supplier) {
    setEditId(s.id)
    setForm({
      name: s.name,
      contact: s.contact ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      cnpj: s.cnpj ?? '',
      notes: s.notes ?? '',
    })
    setOpen(true)
  }

  const suppliers = listQ.data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Cadastros
          </p>
          <h2 className="font-serif text-2xl">Fornecedores</h2>
        </div>
        <Button
          onClick={openNew}
          className="btn-gold h-10 gap-2 border-0 px-4 text-xs uppercase tracking-[0.2em]"
        >
          <Plus className="size-4" />
          Novo
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        {listQ.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Truck className="size-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Nenhum fornecedor cadastrado.
            </p>
            <Button
              onClick={openNew}
              className="btn-gold mt-1 h-10 gap-2 border-0 text-xs uppercase tracking-[0.2em]"
            >
              <Plus className="size-4" />
              Cadastrar fornecedor
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pl-4 pr-3">Nome</th>
                  <th className="px-3 py-3 hidden sm:table-cell">Contato</th>
                  <th className="px-3 py-3">Telefone</th>
                  <th className="px-3 py-3 hidden md:table-cell">E-mail</th>
                  <th className="px-3 py-3 hidden lg:table-cell">CNPJ</th>
                  <th className="px-3 py-3">Lanç.</th>
                  <th className="px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="py-3 pl-4 pr-3">
                      <p className="font-medium text-foreground">{s.name}</p>
                      {s.notes && (
                        <p className="line-clamp-1 text-[11px] text-muted-foreground">
                          {s.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-xs">
                      {s.contact ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-xs">{s.phone ?? '—'}</td>
                    <td className="px-3 py-3 hidden md:table-cell text-xs">
                      {s.email ?? '—'}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell text-xs">
                      {s.cnpj ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      <Badge className="bg-muted text-foreground">
                        {s.entriesCount ?? 0}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          aria-label="Editar"
                          className="grid size-9 place-items-center rounded-md text-foreground hover:bg-muted"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(s.id)
                            setDeleteName(s.name)
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

      {/* DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editId ? 'Editar fornecedor' : 'Novo fornecedor'}
            </DialogTitle>
            <DialogDescription>
              {editId
                ? 'Atualize os dados do fornecedor.'
                : 'Cadastre um novo fornecedor para vincular a lançamentos.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                Nome / Empresa *
              </Label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ex: Distribuidora Tecidos LTDA"
                  className="h-11 pl-10"
                  autoFocus
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Pessoa de contato
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.contact}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contact: e.target.value }))
                    }
                    placeholder="Ex: Mariana"
                    className="h-11 pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  CNPJ
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.cnpj}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cnpj: e.target.value }))
                    }
                    placeholder="00.000.000/0001-00"
                    className="h-11 pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Telefone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="(00) 0000-0000"
                    className="h-11 pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="contato@fornecedor.com"
                    className="h-11 pl-10"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                Notas
              </Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                placeholder="Observações internas"
                className="resize-y"
              />
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
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Tem certeza que deseja excluir "${deleteName}"?`}
              <br />
              Fornecedores com lançamentos financeiros não podem ser removidos.
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

      <p className="text-center text-[11px] text-muted-foreground">
        {settings.brandName} · Cadastro de fornecedores
      </p>
    </div>
  )
}
