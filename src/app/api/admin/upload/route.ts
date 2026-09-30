// POST /api/admin/upload — recebe imagens do painel, converte para WebP
// e armazena de forma persistente.
//
// Em produção na Vercel, public/ é somente leitura. Por isso usamos Vercel Blob.
// Em desenvolvimento local, mantemos o fallback para public/uploads.
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_FILES = 20
const MAX_WIDTH = 1600
const WEBP_QUALITY = 82

async function persistImage(filename: string, output: Buffer) {
  // Produção/preview da Vercel: o filesystem do deployment (/var/task) é read-only.
  // Vercel Blob é persistente e devolve uma URL pública apropriada para o catálogo.
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    const blob = await put(`products/${filename}`, output, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    })
    return blob.url
  }

  // Desenvolvimento local: grava normalmente dentro de public/uploads.
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), output)
  return `/uploads/${filename}`
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const formData = await req.formData()
    const files = formData
      .getAll('file')
      .filter((entry): entry is File => entry instanceof File)

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma imagem foi enviada.' },
        { status: 400 },
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Envie no máximo ${MAX_FILES} imagens por vez.` },
        { status: 400 },
      )
    }

    const invalid = files.find((file) => !file.type.startsWith('image/'))
    if (invalid) {
      return NextResponse.json(
        { error: `O arquivo "${invalid.name}" não é uma imagem válida.` },
        { status: 400 },
      )
    }

    const urls: string[] = []

    for (const file of files) {
      const input = Buffer.from(await file.arrayBuffer())
      const output = await sharp(input)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()

      const filename = `${randomUUID()}.webp`
      const url = await persistImage(filename, output)
      urls.push(url)
    }

    return NextResponse.json({ urls })
  } catch (error) {
    console.error('[admin/upload]', error)

    const raw = error instanceof Error ? error.message : 'Falha no upload.'
    const lower = raw.toLowerCase()

    // Mensagem amigável para o caso mais comum após publicar na Vercel.
    if (
      lower.includes('blob') ||
      lower.includes('token') ||
      lower.includes('store') ||
      lower.includes('oidc')
    ) {
      return NextResponse.json(
        {
          error:
            'O armazenamento de imagens ainda não está conectado. Na Vercel, abra Storage > Blob, crie/conecte um Blob público a este projeto e faça um novo deploy.',
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { error: `Não foi possível enviar a imagem. ${raw}` },
      { status: 500 },
    )
  }
}
