import type {
  AdminApp,
  AdminUser,
  AppInput,
  AppRelease,
  ReleaseStatus,
  StoreApp,
} from './types'

const API_BASE = import.meta.env.VITE_API_URL || ''

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: FormData | Record<string, unknown>
}

async function requestJson<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const isForm = options.body instanceof FormData
  const hasBody = options.body !== undefined
  const requestBody: BodyInit | undefined = hasBody
    ? isForm
      ? options.body as FormData
      : JSON.stringify(options.body)
    : undefined

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(hasBody && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    body: requestBody,
  })

  const payload = await parseJsonResponse<unknown>(response)

  if (!response.ok) {
    throw new Error(
      isErrorPayload(payload) && payload.error
        ? payload.error
        : `Request failed with ${response.status}`,
    )
  }

  return payload as T
}

function isErrorPayload(value: unknown): value is { error?: string } {
  return typeof value === 'object' && value !== null && 'error' in value
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()

  if (!contentType.includes('application/json')) {
    const preview = text.trim().slice(0, 80)
    throw new Error(
      `Expected JSON from the API but received ${contentType || 'unknown content'}. ` +
        `Make sure the backend is running on port 8080. Response started with: ${preview}`,
    )
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('The API returned invalid JSON.')
  }
}

export async function listApps(): Promise<StoreApp[]> {
  const payload = await requestJson<{ apps: StoreApp[] }>('/api/apps', {
    method: 'GET',
    body: undefined,
  })
  return payload.apps
}

export async function getApp(slug: string): Promise<StoreApp> {
  const payload = await requestJson<{ app: StoreApp }>(`/api/apps/${slug}`, {
    method: 'GET',
    body: undefined,
  })
  return payload.app
}

export async function getAppReleases(slug: string): Promise<AppRelease[]> {
  const payload = await requestJson<{ releases: AppRelease[] }>(
    `/api/apps/${slug}/releases`,
    {
      method: 'GET',
      body: undefined,
    },
  )
  return payload.releases
}

export async function getCurrentAdmin(): Promise<AdminUser> {
  const payload = await requestJson<{ user: AdminUser }>('/api/admin/me', {
    method: 'GET',
    body: undefined,
  })
  return payload.user
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<AdminUser> {
  const payload = await requestJson<{ user: AdminUser }>('/api/admin/login', {
    method: 'POST',
    body: { username, password },
  })
  return payload.user
}

export async function logoutAdmin(): Promise<void> {
  await requestJson<{ ok: true }>('/api/admin/logout', {
    method: 'POST',
  })
}

export async function listAdminApps(): Promise<AdminApp[]> {
  const payload = await requestJson<{ apps: AdminApp[] }>('/api/admin/apps', {
    method: 'GET',
    body: undefined,
  })
  return payload.apps
}

export async function createAdminApp(input: AppInput): Promise<StoreApp> {
  const payload = await requestJson<{ app: StoreApp }>('/api/admin/apps', {
    method: 'POST',
    body: input,
  })
  return payload.app
}

export async function updateAdminApp(
  appId: string,
  input: Partial<AppInput>,
): Promise<StoreApp> {
  const payload = await requestJson<{ app: StoreApp }>(`/api/admin/apps/${appId}`, {
    method: 'PATCH',
    body: input,
  })
  return payload.app
}

export async function createRelease(
  appId: string,
  formData: FormData,
): Promise<AppRelease> {
  const payload = await requestJson<{ release: AppRelease }>(
    `/api/admin/apps/${appId}/releases`,
    {
      method: 'POST',
      body: formData,
    },
  )
  return payload.release
}

export async function updateRelease(
  releaseId: string,
  input: { status?: ReleaseStatus; changelog?: string },
): Promise<AppRelease> {
  const payload = await requestJson<{ release: AppRelease }>(
    `/api/admin/releases/${releaseId}`,
    {
      method: 'PATCH',
      body: input,
    },
  )
  return payload.release
}

export async function deleteRelease(releaseId: string): Promise<void> {
  await requestJson<{ ok: true }>(`/api/admin/releases/${releaseId}`, {
    method: 'DELETE',
    body: undefined,
  })
}
