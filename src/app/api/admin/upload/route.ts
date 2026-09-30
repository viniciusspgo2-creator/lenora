// POST /api/admin/upload — recebe imagens do painel, converte para WebP e salva em public/uploads.
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_FILES = 20
const MAX_WIDTH = 1600
const WEBP_QUALITY = 82

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

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const urls: string[] = []

    for (const file of files) {
      const input = Buffer.from(await file.arrayBuffer())
      const output = await sharp(input)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()

      const filename = `${randomUUID()}.webp`
      await writeFile(join(uploadDir, filename), output)
      urls.push(`/uploads/${filename}`)
    }

    return NextResponse.json({ urls })
  } catch (error) {
    console.error('[admin/upload]', error)

    const message = error instanceof Error ? error.message : 'Falha no upload.'
    return NextResponse.json(
      { error: `Não foi possível enviar a imagem. ${message}` },
      { status: 500 },
    )
  }
}
