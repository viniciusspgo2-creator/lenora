// Loja Lenora — Admin Coupons.
// Lista cupons + cria/edita/exclui. Tipos: percent (%) e fixed (R$).
'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Ticket, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { formatBRL } from '@/lib/utils-lenora'

type Coupon = {
  id: string
  code: string
  type: string // percent | fixed
  value: number
  minSubtotal: number
  maxUses: number
  usedCount: number
  validFrom: string | null
  validTo: string | null
  active: boolean
  createdAt: string
}

type FormData = {
  code: string
  type: 'percent' | 'fixed'
  value: string
  minSubtotal: string
  maxUses: string
  validFrom: string
  validTo: string
  active: boolean
}

const EMPTY: FormData = {
  code: '',
  type: 'percent',
  value: '',
  minSubtotal: '',
  maxUses: '',
  validFrom: '',
  validTo: '',
  active: true,
}

function toInputDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function AdminCoupons() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteCode, setDeleteCode] = useState('')

  const listQ = useQuery<{ items: Coupon[] }>({
    queryKey: ['admin', 'coupons'],
    queryFn: () =>
      fetch('/api/admin/coupons', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('coupons')),
      ),
    staleTime: 15_000,
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const body: any = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value) || 0,
        minSubtotal: Number(form.minSubtotal) || 0,
        maxUses: Number(form.maxUses) || 0,
        validFrom: form.validFrom || null,
        validTo: form.validTo || null,
        active: form.active,
      }
      const url = editId
        ? `/api/admin/coupons/${editId}`
        : '/api/admin/coupons'
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
      toast.success(editId ? 'Cupom atualizado' : 'Cupom criado')
      qc.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      setOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Falha ao excluir')
      return data
    },
    onSuccess: () => {
      toast.success('Cupom excluído.')
      setDeleteId(null)
      qc.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY })
    setOpen(true)
  }
  function openEdit(c: Coupon) {
    setEditId(c.id)
    setForm({
      code: c.code,
      type: c.type as 'percent' | 'fixed',
      value: String(c.value),
      minSubtotal: String(c.minSubtotal),
      maxUses: String(c.maxUses),
      validFrom: toInputDate(c.validFrom),
      validTo: toInputDate(c.validTo),
      active: c.active,
    })
    setOpen(true)
  }

  const items = listQ.data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Promoções
          </p>
          <h2 className="font-serif text-2xl">Cupons</h2>
        </div>
        <Button
          onClick={openNew}
          className="btn-gold h-10 gap-2 border-0 px-4 text-xs uppercase tracking-[0.2em]"
        >
          <Plus className="size-4" />
          Novo cupom
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        {listQ.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Ticket className="size-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Nenhum cupom cadastrado.
            </p>
            <Button
              onClick={openNew}
              className="btn-gold mt-1 h-10 gap-2 border-0 text-xs uppercase tracking-[0.2em]"
            >
              <Plus className="size-4" />
              Criar primeiro cupom
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pl-4 pr-3">Código</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3">Valor</th>
                  <th className="px-3 py-3 hidden md:table-cell">
                    Mínimo
                  </th>
                  <th className="px-3 py-3 hidden sm:table-cell">Usos</th>
                  <th className="px-3 py-3 hidden lg:table-cell">
                    Validade
                  </th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="py-3 pl-4 pr-3">
                      <p className="font-mono font-medium text-foreground">
                        {c.code}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.type === 'percent'
                          ? 'Percentual'
                          : 'Valor fixo'}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline">
                        {c.type === 'percent' ? '%' : 'R$'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-medium">
                      {c.type === 'percent'
                        ? `${c.value}%`
                        : formatBRL(c.value)}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      {c.minSubtotal
                        ? formatBRL(c.minSubtotal)
                        : '—'}
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                      {c.usedCount}
                      {c.maxUses > 0 ? `/${c.maxUses}` : ' / ∞'}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell text-[11px] text-muted-foreground">
                      {c.validFrom || c.validTo
                        ? `${toInputDate(c.validFrom) || '—'} → ${toInputDate(c.validTo) || '∞'}`
                        : 'Sem limite'}
                    </td>
                    <td className="px-3 py-3">
                      {c.active ? (
                        <span className="inline-flex rounded bg-emerald-100 px-2 py-1 text-[10px] uppercase tracking-wider text-emerald-900">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex rounded bg-rose-100 px-2 py-1 text-[10px] uppercase tracking-wider text-rose-900">
                          Inativo
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
                            setDeleteCode(c.code)
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
              {editId ? 'Editar cupom' : 'Novo cupom'}
            </DialogTitle>
            <DialogDescription>
              Cupons podem ser percentuais ou valor fixo em R$.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Código *
                </Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="VERAO10"
                  className="h-11 font-mono"
                  autoFocus
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Tipo
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      type: v as 'percent' | 'fixed',
                    }))
                  }
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">
                      Percentual (%)
                    </SelectItem>
                    <SelectItem value="fixed">
                      Valor fixo (R$)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Valor *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                  placeholder={form.type === 'percent' ? '10' : '20.00'}
                  className="h-11"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Subtotal mínimo (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.minSubtotal}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minSubtotal: e.target.value,
                    }))
                  }
                  placeholder="0"
                  className="h-11"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Máx. usos (0 = ilimitado)
                </Label>
                <Input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxUses: e.target.value }))
                  }
                  placeholder="100"
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
                    {form.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Válido de
                </Label>
                <Input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, validFrom: e.target.value }))
                  }
                  className="h-11"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wider">
                  Válido até
                </Label>
                <Input
                  type="date"
                  value={form.validTo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, validTo: e.target.value }))
                  }
                  className="h-11"
                />
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
              disabled={
                saveMut.isPending ||
                !form.code.trim() ||
                !form.value
              }
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

      {/* DELETE */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              {`O cupom "${deleteCode}" será removido permanentemente.`}
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
