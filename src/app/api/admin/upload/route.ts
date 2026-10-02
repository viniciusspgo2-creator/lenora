// POST /api/admin/upload — upload de imagens do painel (produtos, categorias etc).
// Recebe FormData com um ou mais campos "file", converte para WebP (máx 1600px
// de largura, qualidade 82) e armazena:
//   • Vercel Blob — quando BLOB_READ_WRITE_TOKEN está definido (produção)
//   • public/uploads/ — em desenvolvimento local
// Resposta: { urls: string[] }
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import sharp from 'sharp'
import { put } from '@vercel/blob'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_FILES = 20
const MAX_SIZE_MB = 10
const MAX_WIDTH = 1600

function sanitizeBase(name: string): string {
  const base = name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || 'img'
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard) return guard

  const token = process.env.BLOB_READ_WRITE_TOKEN

  // Em produção (Vercel) sem Blob conectado o filesystem é read-only:
  // avisa com instrução clara em vez de falhar com erro genérico.
  if (!token && process.env.VERCEL === '1') {
    return NextResponse.json(
      {
        error:
          'Armazenamento não configurado: conecte o Vercel Blob ao projeto (Dashboard → Storage → Blob) e faça o redeploy para liberar o upload de imagens.',
      },
      { status: 507 },
    )
  }

  try {
    const fd = await req.formData()
    const files = fd.getAll('file').filter((v): v is File => v instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Máximo de ${MAX_FILES} imagens por vez.` },
        { status: 400 },
      )
    }

    const urls: string[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        throw new Error(`"${file.name}" não é uma imagem.`)
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        throw new Error(`"${file.name}" excede o limite de ${MAX_SIZE_MB}MB.`)
      }

      const buf = Buffer.from(await file.arrayBuffer())
      const webp = await sharp(buf)
        .rotate() // respeita orientação EXIF
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()

      const filename = `uploads/${Date.now()}-${crypto
        .randomUUID()
        .slice(0, 8)}-${sanitizeBase(file.name)}.webp`

      if (token) {
        const blob = await put(filename, webp, {
          access: 'public',
          addRandomSuffix: false,
          token,
        })
        urls.push(blob.url)
      } else {
        const dir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(dir, { recursive: true })
        await writeFile(path.join(dir, path.basename(filename)), webp)
        urls.push(`/uploads/${path.basename(filename)}`)
      }
    }

    return NextResponse.json({ urls })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
