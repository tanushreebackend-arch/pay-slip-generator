import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const ALLOWED_EXT = new Set(['png', 'jpg', 'jpeg', 'webp'])
const MAX_BYTES = 2 * 1024 * 1024

async function persistAssetUrl(prefix: 'logo' | 'signature', url: string) {
  const existing = await prisma.settings.findFirst()
  const data = prefix === 'logo' ? { logoUrl: url } : { signatureUrl: url }

  if (existing) {
    await prisma.settings.update({ where: { id: existing.id }, data })
    return
  }

  await prisma.settings.create({ data })
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const prefixRaw = String(formData.get('prefix') || '')
    const prefix = prefixRaw === 'signature' ? 'signature' : prefixRaw === 'logo' ? 'logo' : null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!prefix) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Logo/signature must be a PNG, JPG, or WebP image' },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image must be 2 MB or smaller' }, { status: 400 })
    }

    let ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXT.has(ext)) {
      ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/jpeg' ? 'jpg' : 'png'
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let url: string

    // Vercel serverless filesystem is read-only (except /tmp), so files written
    // to public/uploads are lost and usually throw EROFS. Store inline instead.
    if (process.env.VERCEL) {
      url = `data:${file.type};base64,${buffer.toString('base64')}`
    } else {
      const filename = `${prefix}-${Date.now()}.${ext}`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'company')
      await mkdir(uploadDir, { recursive: true })
      await writeFile(path.join(uploadDir, filename), buffer)
      url = `/uploads/company/${filename}`
    }

    await persistAssetUrl(prefix, url)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('Settings upload failed', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
