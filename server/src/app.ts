import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import staticPlugin from '@fastify/static'
import bcrypt from 'bcryptjs'
import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify'
import { createHash, randomUUID } from 'node:crypto'
import {
  createReadStream,
  createWriteStream,
  existsSync,
  unlinkSync,
} from 'node:fs'
import { mkdir, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { once } from 'node:events'
import { z } from 'zod'
import type { StoreConfig } from './config'
import type { StoreDb } from './db'
import {
  type AppRow,
  type ReleaseRow,
  serializeApp,
  serializeRelease,
} from './serializers'

const SESSION_COOKIE = 'apk_store_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

type MultipartFilePart = {
  type: 'file'
  fieldname: string
  filename: string
  mimetype: string
  file: AsyncIterable<Buffer | string>
}

type MultipartFieldPart = {
  type: 'field'
  fieldname: string
  value: unknown
}

type MultipartPart = MultipartFilePart | MultipartFieldPart

type AdminUserRow = {
  id: string
  username: string
  password_hash: string
}

const releaseStatusSchema = z.enum(['draft', 'published'])

const appCreateSchema = z.object({
  slug: z.string().trim().optional().default(''),
  name: z.string().trim().min(1),
  packageName: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  description: z.string().trim().min(1),
  iconUrl: z.string().trim().optional().default(''),
  category: z.string().trim().min(1).default('General'),
  tags: z.array(z.string().trim()).optional().default([]),
  listed: z.boolean().optional().default(true),
})

const appPatchSchema = appCreateSchema.partial()

const releasePatchSchema = z.object({
  versionName: z.string().trim().min(1).optional(),
  versionCode: z.coerce.number().int().positive().optional(),
  changelog: z.string().trim().optional(),
  status: releaseStatusSchema.optional(),
})

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
})

export async function buildServer(
  config: StoreConfig,
  db: StoreDb,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    bodyLimit: 2 * 1024 * 1024,
  })

  await app.register(cookie, { secret: config.sessionSecret })
  await app.register(multipart, {
    limits: {
      fileSize: config.maxApkBytes,
      files: 1,
    },
  })

  registerPublicRoutes(app, db, config)
  registerAdminRoutes(app, db, config)

  if (existsSync(config.publicDir)) {
    await app.register(staticPlugin, {
      root: config.publicDir,
      prefix: '/',
    })

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.code(404).send({ error: 'Not found' })
      }

      return (reply as FastifyReply & { sendFile: (file: string) => FastifyReply })
        .sendFile('index.html')
    })
  }

  return app
}

export function seedAdminUser(db: StoreDb): void {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM admin_users').get() as {
    count: number
  }

  if (existing.count > 0) {
    return
  }

  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    return
  }

  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO admin_users (id, username, password_hash, created_at)
     VALUES (@id, @username, @passwordHash, @createdAt)`,
  ).run({
    id: randomUUID(),
    username: process.env.ADMIN_USERNAME || 'admin',
    passwordHash: bcrypt.hashSync(password, 12),
    createdAt: now,
  })
}

function registerPublicRoutes(
  app: FastifyInstance,
  db: StoreDb,
  config: StoreConfig,
) {
  app.get('/api/health', async () => ({
    ok: true,
    service: 'apk-store',
    time: new Date().toISOString(),
  }))

  app.get('/api/apps', async () => {
    const rows = db
      .prepare(
        `
        SELECT
          a.*,
          r.id AS latest_release_id,
          r.version_name AS latest_version_name,
          r.version_code AS latest_version_code,
          r.size_bytes AS latest_size_bytes,
          r.sha256 AS latest_sha256,
          r.published_at AS latest_published_at
        FROM apps a
        LEFT JOIN releases r ON r.id = (
          SELECT id
          FROM releases
          WHERE app_id = a.id AND status = 'published'
          ORDER BY published_at DESC, version_code DESC
          LIMIT 1
        )
        WHERE a.listed = 1
        ORDER BY a.name COLLATE NOCASE ASC
      `,
      )
      .all() as AppRow[]

    return { apps: rows.map(serializeApp) }
  })

  app.get('/api/apps/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const row = db
      .prepare(
        `
        SELECT
          a.*,
          r.id AS latest_release_id,
          r.version_name AS latest_version_name,
          r.version_code AS latest_version_code,
          r.size_bytes AS latest_size_bytes,
          r.sha256 AS latest_sha256,
          r.published_at AS latest_published_at
        FROM apps a
        LEFT JOIN releases r ON r.id = (
          SELECT id
          FROM releases
          WHERE app_id = a.id AND status = 'published'
          ORDER BY published_at DESC, version_code DESC
          LIMIT 1
        )
        WHERE a.slug = ? AND a.listed = 1
      `,
      )
      .get(slug) as AppRow | undefined

    if (!row) {
      return reply.code(404).send({ error: 'App not found' })
    }

    return { app: serializeApp(row) }
  })

  app.get('/api/apps/:slug/releases', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const appRow = db
      .prepare('SELECT id FROM apps WHERE slug = ? AND listed = 1')
      .get(slug) as { id: string } | undefined

    if (!appRow) {
      return reply.code(404).send({ error: 'App not found' })
    }

    const rows = db
      .prepare(
        `
        SELECT *
        FROM releases
        WHERE app_id = ? AND status = 'published'
        ORDER BY published_at DESC, version_code DESC
      `,
      )
      .all(appRow.id) as ReleaseRow[]

    return { releases: rows.map((row) => serializeRelease(row)) }
  })

  app.get('/api/releases/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string }
    const row = db
      .prepare(
        `
        SELECT r.*
        FROM releases r
        INNER JOIN apps a ON a.id = r.app_id
        WHERE r.id = ? AND r.status = 'published' AND a.listed = 1
      `,
      )
      .get(id) as ReleaseRow | undefined

    if (!row) {
      return reply.code(404).send({ error: 'Release not found' })
    }

    const filePath = safeApkPath(config.apksDir, row.apk_path)
    if (!existsSync(filePath)) {
      return reply.code(404).send({ error: 'APK file is missing' })
    }

    recordDownloadEvent(db, config, row.id, request)

    return reply
      .header('Content-Type', 'application/vnd.android.package-archive')
      .header('Content-Length', String(row.size_bytes))
      .header(
        'Content-Disposition',
        `attachment; filename="${sanitizeFileName(row.original_file_name)}"`,
      )
      .send(createReadStream(filePath))
  })
}

function registerAdminRoutes(
  app: FastifyInstance,
  db: StoreDb,
  config: StoreConfig,
) {
  const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getSessionUser(db, request)
    if (!user) {
      return reply.code(401).send({ error: 'Admin login required' })
    }
  }

  app.post('/api/admin/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Username and password are required' })
    }

    const user = db
      .prepare('SELECT * FROM admin_users WHERE username = ?')
      .get(parsed.data.username) as AdminUserRow | undefined

    if (!user || !bcrypt.compareSync(parsed.data.password, user.password_hash)) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const token = createSession(db, user.id)
    reply.setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: config.isProduction,
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    })

    return { user: { id: user.id, username: user.username } }
  })

  app.post('/api/admin/logout', async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE]
    if (token) {
      db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(hashSession(token))
    }

    reply.clearCookie(SESSION_COOKIE, { path: '/' })
    return { ok: true }
  })

  app.get('/api/admin/me', async (request, reply) => {
    const user = getSessionUser(db, request)
    if (!user) {
      return reply.code(401).send({ error: 'Admin login required' })
    }

    return { user: { id: user.id, username: user.username } }
  })

  app.get(
    '/api/admin/apps',
    { preHandler: requireAdmin },
    async () => {
      const rows = db
        .prepare(
          `
          SELECT
            a.*,
            r.id AS latest_release_id,
            r.version_name AS latest_version_name,
            r.version_code AS latest_version_code,
            r.size_bytes AS latest_size_bytes,
            r.sha256 AS latest_sha256,
            r.published_at AS latest_published_at
          FROM apps a
          LEFT JOIN releases r ON r.id = (
            SELECT id
            FROM releases
            WHERE app_id = a.id AND status = 'published'
            ORDER BY published_at DESC, version_code DESC
            LIMIT 1
          )
          ORDER BY a.created_at DESC
        `,
        )
        .all() as AppRow[]

      const apps = rows.map((row) => {
        const releases = db
          .prepare(
            `SELECT * FROM releases WHERE app_id = ? ORDER BY created_at DESC`,
          )
          .all(row.id) as ReleaseRow[]

        return {
          ...serializeApp(row),
          releases: releases.map((release) => serializeRelease(release)),
        }
      })

      return { apps }
    },
  )

  app.post(
    '/api/admin/apps',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const parsed = appCreateSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid app metadata' })
      }

      const now = new Date().toISOString()
      const id = randomUUID()
      const slug = uniqueSlug(db, parsed.data.slug || parsed.data.name)

      db.prepare(
        `
        INSERT INTO apps (
          id, slug, name, package_name, summary, description, icon_url,
          category, tags_json, listed, created_at, updated_at
        )
        VALUES (
          @id, @slug, @name, @packageName, @summary, @description, @iconUrl,
          @category, @tagsJson, @listed, @createdAt, @updatedAt
        )
      `,
      ).run({
        id,
        slug,
        name: parsed.data.name,
        packageName: parsed.data.packageName,
        summary: parsed.data.summary,
        description: parsed.data.description,
        iconUrl: parsed.data.iconUrl || '',
        category: parsed.data.category || 'General',
        tagsJson: JSON.stringify(cleanTags(parsed.data.tags)),
        listed: parsed.data.listed ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      })

      const row = db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as AppRow
      return reply.code(201).send({ app: serializeApp(row) })
    },
  )

  app.patch(
    '/api/admin/apps/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const existing = db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as
        | AppRow
        | undefined

      if (!existing) {
        return reply.code(404).send({ error: 'App not found' })
      }

      const parsed = appPatchSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid app metadata' })
      }

      const next = {
        slug:
          parsed.data.slug !== undefined && parsed.data.slug !== existing.slug
            ? uniqueSlug(db, parsed.data.slug || existing.name, id)
            : existing.slug,
        name: parsed.data.name ?? existing.name,
        packageName: parsed.data.packageName ?? existing.package_name,
        summary: parsed.data.summary ?? existing.summary,
        description: parsed.data.description ?? existing.description,
        iconUrl: parsed.data.iconUrl ?? existing.icon_url,
        category: parsed.data.category ?? existing.category,
        tagsJson:
          parsed.data.tags !== undefined
            ? JSON.stringify(cleanTags(parsed.data.tags))
            : existing.tags_json,
        listed:
          parsed.data.listed !== undefined
            ? parsed.data.listed
              ? 1
              : 0
            : existing.listed,
        updatedAt: new Date().toISOString(),
      }

      db.prepare(
        `
        UPDATE apps
        SET slug = @slug,
            name = @name,
            package_name = @packageName,
            summary = @summary,
            description = @description,
            icon_url = @iconUrl,
            category = @category,
            tags_json = @tagsJson,
            listed = @listed,
            updated_at = @updatedAt
        WHERE id = @id
      `,
      ).run({ ...next, id })

      const row = db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as AppRow
      return { app: serializeApp(row) }
    },
  )

  app.post(
    '/api/admin/apps/:id/releases',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const appRow = db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as
        | AppRow
        | undefined

      if (!appRow) {
        return reply.code(404).send({ error: 'App not found' })
      }

      let upload: Awaited<ReturnType<typeof readReleaseUpload>>
      try {
        upload = await readReleaseUpload(request, config)
      } catch (uploadError) {
        return reply.code(400).send({ error: errorMessage(uploadError) })
      }

      if (!upload.file) {
        return reply.code(400).send({ error: 'APK file is required' })
      }

      const parsed = z
        .object({
          versionName: z.string().trim().min(1),
          versionCode: z.coerce.number().int().positive(),
          changelog: z.string().trim().default(''),
          status: releaseStatusSchema.default('draft'),
        })
        .safeParse(upload.fields)

      if (!parsed.success) {
        await rm(upload.file.tempPath, { force: true })
        return reply.code(400).send({ error: 'Invalid release metadata' })
      }

      const releaseId = randomUUID()
      const now = new Date().toISOString()
      const relativeDir = appRow.slug
      const finalName = `${parsed.data.versionCode}-${releaseId}.apk`
      const relativePath = path.posix.join(relativeDir, finalName)
      const finalDir = path.join(config.apksDir, relativeDir)
      const finalPath = safeApkPath(config.apksDir, relativePath)

      await mkdir(finalDir, { recursive: true })
      await rename(upload.file.tempPath, finalPath)

      db.prepare(
        `
        INSERT INTO releases (
          id, app_id, version_name, version_code, changelog, apk_path,
          original_file_name, size_bytes, sha256, status, published_at,
          created_at, updated_at
        )
        VALUES (
          @id, @appId, @versionName, @versionCode, @changelog, @apkPath,
          @originalFileName, @sizeBytes, @sha256, @status, @publishedAt,
          @createdAt, @updatedAt
        )
      `,
      ).run({
        id: releaseId,
        appId: appRow.id,
        versionName: parsed.data.versionName,
        versionCode: parsed.data.versionCode,
        changelog: parsed.data.changelog,
        apkPath: relativePath,
        originalFileName: sanitizeFileName(upload.file.originalFileName),
        sizeBytes: upload.file.sizeBytes,
        sha256: upload.file.sha256,
        status: parsed.data.status,
        publishedAt: parsed.data.status === 'published' ? now : null,
        createdAt: now,
        updatedAt: now,
      })

      const row = db
        .prepare('SELECT * FROM releases WHERE id = ?')
        .get(releaseId) as ReleaseRow

      return reply.code(201).send({ release: serializeRelease(row) })
    },
  )

  app.patch(
    '/api/admin/releases/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const existing = db
        .prepare('SELECT * FROM releases WHERE id = ?')
        .get(id) as ReleaseRow | undefined

      if (!existing) {
        return reply.code(404).send({ error: 'Release not found' })
      }

      const parsed = releasePatchSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid release metadata' })
      }

      const status = parsed.data.status ?? existing.status
      const publishedAt =
        status === 'published'
          ? existing.published_at || new Date().toISOString()
          : null

      db.prepare(
        `
        UPDATE releases
        SET version_name = @versionName,
            version_code = @versionCode,
            changelog = @changelog,
            status = @status,
            published_at = @publishedAt,
            updated_at = @updatedAt
        WHERE id = @id
      `,
      ).run({
        id,
        versionName: parsed.data.versionName ?? existing.version_name,
        versionCode: parsed.data.versionCode ?? existing.version_code,
        changelog: parsed.data.changelog ?? existing.changelog,
        status,
        publishedAt,
        updatedAt: new Date().toISOString(),
      })

      const row = db.prepare('SELECT * FROM releases WHERE id = ?').get(id) as ReleaseRow
      return { release: serializeRelease(row) }
    },
  )

  app.delete(
    '/api/admin/releases/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const existing = db
        .prepare('SELECT * FROM releases WHERE id = ?')
        .get(id) as ReleaseRow | undefined

      if (!existing) {
        return reply.code(404).send({ error: 'Release not found' })
      }

      db.prepare('DELETE FROM releases WHERE id = ?').run(id)
      await rm(safeApkPath(config.apksDir, existing.apk_path), { force: true })
      return { ok: true }
    },
  )
}

function createSession(db: StoreDb, userId: string): string {
  const token = randomUUID() + randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString()

  db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(now.toISOString())
  db.prepare(
    `INSERT INTO admin_sessions (id, user_id, expires_at, created_at)
     VALUES (?, ?, ?, ?)`,
  ).run(hashSession(token), userId, expiresAt, now.toISOString())

  return token
}

function getSessionUser(db: StoreDb, request: FastifyRequest): AdminUserRow | null {
  const token = request.cookies[SESSION_COOKIE]
  if (!token) {
    return null
  }

  const row = db
    .prepare(
      `
      SELECT u.*
      FROM admin_sessions s
      INNER JOIN admin_users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ?
    `,
    )
    .get(hashSession(token), new Date().toISOString()) as AdminUserRow | undefined

  return row || null
}

function hashSession(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'app'
  )
}

function uniqueSlug(db: StoreDb, input: string, existingId?: string): string {
  const base = slugify(input)
  let slug = base
  let index = 2

  while (true) {
    const row = db.prepare('SELECT id FROM apps WHERE slug = ?').get(slug) as
      | { id: string }
      | undefined

    if (!row || row.id === existingId) {
      return slug
    }

    slug = `${base}-${index}`
    index += 1
  }
}

function cleanTags(tags: string[]): string[] {
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
  )
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'app.apk'
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong'
}

function safeApkPath(apksDir: string, relativePath: string): string {
  const resolved = path.resolve(apksDir, relativePath)
  const root = path.resolve(apksDir)
  if (!resolved.startsWith(root + path.sep)) {
    throw new Error('Unsafe APK path')
  }

  return resolved
}

async function readReleaseUpload(
  request: FastifyRequest,
  config: StoreConfig,
): Promise<{
  fields: Record<string, string>
  file: null | {
    originalFileName: string
    sha256: string
    sizeBytes: number
    tempPath: string
  }
}> {
  const fields: Record<string, string> = {}
  let file:
    | null
    | {
        originalFileName: string
        sha256: string
        sizeBytes: number
        tempPath: string
      } = null

  const uploadDir = path.join(config.dataDir, 'tmp')
  await mkdir(uploadDir, { recursive: true })

  const parts = (request as FastifyRequest & {
    parts: () => AsyncIterable<MultipartPart>
  }).parts()

  for await (const part of parts) {
    if (part.type === 'field') {
      fields[part.fieldname] = String(part.value ?? '')
      continue
    }

    if (part.fieldname !== 'apk') {
      throw new Error('APK file field must be named apk')
    }

    if (file) {
      throw new Error('Only one APK file can be uploaded')
    }

    if (!part.filename.toLowerCase().endsWith('.apk')) {
      throw new Error('Uploaded file must use the .apk extension')
    }

    if (
      part.mimetype &&
      ![
        'application/octet-stream',
        'application/vnd.android.package-archive',
        'application/java-archive',
      ].includes(part.mimetype)
    ) {
      throw new Error('Uploaded file does not look like an APK')
    }

    file = await saveUploadedFile(part, uploadDir, config.maxApkBytes)
  }

  return { fields, file }
}

async function saveUploadedFile(
  part: MultipartFilePart,
  uploadDir: string,
  maxBytes: number,
) {
  const tempPath = path.join(uploadDir, `${randomUUID()}.apk`)
  const hash = createHash('sha256')
  const output = createWriteStream(tempPath, { flags: 'wx' })
  let sizeBytes = 0

  try {
    for await (const chunk of part.file) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      sizeBytes += buffer.byteLength
      if (sizeBytes > maxBytes) {
        throw new Error('APK exceeds the configured size limit')
      }

      hash.update(buffer)
      if (!output.write(buffer)) {
        await once(output, 'drain')
      }
    }

    output.end()
    await once(output, 'finish')
  } catch (error) {
    output.destroy()
    try {
      unlinkSync(tempPath)
    } catch {
      // Ignore cleanup failures for temporary upload files.
    }
    throw error
  }

  return {
    originalFileName: part.filename,
    sha256: hash.digest('hex'),
    sizeBytes,
    tempPath,
  }
}

function recordDownloadEvent(
  db: StoreDb,
  config: StoreConfig,
  releaseId: string,
  request: FastifyRequest,
) {
  const forwarded = request.headers['x-forwarded-for']
  const ip =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim() || request.ip
      : request.ip
  const ipHash = createHash('sha256')
    .update(`${ip}:${config.sessionSecret}`)
    .digest('hex')

  db.prepare(
    `
    INSERT INTO download_events (id, release_id, occurred_at, ip_hash, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(
    randomUUID(),
    releaseId,
    new Date().toISOString(),
    ipHash,
    String(request.headers['user-agent'] || ''),
  )
}
