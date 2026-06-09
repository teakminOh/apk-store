export type AppRow = {
  category: string
  created_at: string
  description: string
  icon_url: string
  id: string
  listed: number
  name: string
  package_name: string
  slug: string
  summary: string
  tags_json: string
  updated_at: string
  latest_release_id?: string | null
  latest_version_name?: string | null
  latest_version_code?: number | null
  latest_size_bytes?: number | null
  latest_sha256?: string | null
  latest_published_at?: string | null
}

export type ReleaseRow = {
  apk_path: string
  app_id: string
  changelog: string
  created_at: string
  id: string
  original_file_name: string
  published_at: string | null
  sha256: string
  size_bytes: number
  status: 'draft' | 'published'
  updated_at: string
  version_code: number
  version_name: string
}

export function parseTags(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson)
    return Array.isArray(parsed) ? parsed.filter((tag) => typeof tag === 'string') : []
  } catch {
    return []
  }
}

export function serializeRelease(row: ReleaseRow, includeDownload = true) {
  return {
    id: row.id,
    appId: row.app_id,
    versionName: row.version_name,
    versionCode: row.version_code,
    changelog: row.changelog,
    sizeBytes: row.size_bytes,
    sha256: row.sha256,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    downloadUrl:
      includeDownload && row.status === 'published'
        ? `/api/releases/${row.id}/download`
        : null,
  }
}

export function serializeApp(row: AppRow) {
  const latestRelease =
    row.latest_release_id && row.latest_version_name && row.latest_version_code
      ? {
          id: row.latest_release_id,
          appId: row.id,
          versionName: row.latest_version_name,
          versionCode: row.latest_version_code,
          changelog: '',
          sizeBytes: row.latest_size_bytes || 0,
          sha256: row.latest_sha256 || '',
          status: 'published' as const,
          publishedAt: row.latest_published_at,
          createdAt: row.latest_published_at,
          updatedAt: row.latest_published_at,
          downloadUrl: `/api/releases/${row.latest_release_id}/download`,
        }
      : null

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    packageName: row.package_name,
    summary: row.summary,
    description: row.description,
    iconUrl: row.icon_url,
    category: row.category,
    tags: parseTags(row.tags_json),
    listed: Boolean(row.listed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    latestRelease,
  }
}
