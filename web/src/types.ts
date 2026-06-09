export type ReleaseStatus = 'draft' | 'published'

export type AppRelease = {
  id: string
  appId: string
  versionName: string
  versionCode: number
  changelog: string
  sizeBytes: number
  sha256: string
  status: ReleaseStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  downloadUrl: string | null
}

export type StoreApp = {
  id: string
  slug: string
  name: string
  packageName: string
  summary: string
  description: string
  iconUrl: string
  category: string
  tags: string[]
  listed: boolean
  createdAt: string
  updatedAt: string
  latestRelease: AppRelease | null
}

export type AdminApp = StoreApp & {
  releases: AppRelease[]
}

export type AppInput = {
  slug?: string
  name: string
  packageName: string
  summary: string
  description: string
  iconUrl: string
  category: string
  tags: string[]
  listed: boolean
}

export type AdminUser = {
  id: string
  username: string
}
