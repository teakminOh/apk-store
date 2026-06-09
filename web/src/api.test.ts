import { afterEach, describe, expect, it, vi } from 'vitest'
import { listApps } from './api'
import type { StoreApp } from './types'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the public app catalog', async () => {
    const apps: StoreApp[] = [
      {
        category: 'Tools',
        createdAt: '2026-01-01T00:00:00.000Z',
        description: 'Demo app',
        iconUrl: '',
        id: 'app-1',
        latestRelease: null,
        listed: true,
        name: 'Demo',
        packageName: 'com.example.demo',
        slug: 'demo',
        summary: 'A demo app',
        tags: ['demo'],
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ apps })))

    await expect(listApps()).resolves.toEqual(apps)
    expect(fetch).toHaveBeenCalledWith(
      '/api/apps',
      expect.objectContaining({ credentials: 'include', method: 'GET' }),
    )
  })

  it('uses API error messages from failed JSON responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: 'Admin login required' }, 401)),
    )

    await expect(listApps()).rejects.toThrow('Admin login required')
  })

  it('explains when the API route returns HTML instead of JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<!doctype html>', {
          headers: { 'Content-Type': 'text/html' },
          status: 200,
        }),
      ),
    )

    await expect(listApps()).rejects.toThrow('Expected JSON from the API')
  })
})
