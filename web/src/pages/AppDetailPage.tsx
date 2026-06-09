import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApp, getAppReleases } from '../api'
import AppIcon from '../components/AppIcon'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import Notice from '../components/Notice'
import ReleaseItem from '../components/ReleaseItem'
import type { AppRelease, StoreApp } from '../types'
import { errorMessage } from '../utils/errors'
import { formatBytes, formatDate } from '../utils/format'

function AppDetailPage() {
  const { slug = '' } = useParams()
  const [app, setApp] = useState<StoreApp | null>(null)
  const [releases, setReleases] = useState<AppRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError('')
        const [nextApp, nextReleases] = await Promise.all([
          getApp(slug),
          getAppReleases(slug),
        ])
        if (!cancelled) {
          setApp(nextApp)
          setReleases(nextReleases)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(errorMessage(loadError))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return <LoadingState label="Loading app details" />
  }

  if (error || !app) {
    return (
      <section className="space-y-4">
        <Notice tone="danger" message={error || 'App not found'} />
        <Link
          className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07]"
          to="/"
        >
          Back to catalog
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <Link className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200" to="/">
        Back to catalog
      </Link>

      <div className="grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <AppIcon app={app} large />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-4xl font-semibold text-zinc-50 sm:text-5xl">
              {app.name}
            </h1>
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
              {app.category}
            </span>
          </div>
          <p className="mt-2 break-all font-mono text-xs text-zinc-500">{app.packageName}</p>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">{app.description}</p>
        </div>
        {app.latestRelease?.downloadUrl && (
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-400 px-5 text-sm font-semibold text-black transition hover:bg-emerald-300"
            href={app.latestRelease.downloadUrl}
          >
            Download latest
          </a>
        )}
      </div>

      <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-3">
        <div>
          <span className="block text-xs font-medium text-zinc-500">Latest version</span>
          <strong className="mt-1 block text-zinc-100">
            {app.latestRelease?.versionName || 'None'}
          </strong>
        </div>
        <div>
          <span className="block text-xs font-medium text-zinc-500">Release size</span>
          <strong className="mt-1 block text-zinc-100">
            {app.latestRelease ? formatBytes(app.latestRelease.sizeBytes) : 'No APK'}
          </strong>
        </div>
        <div>
          <span className="block text-xs font-medium text-zinc-500">Published</span>
          <strong className="mt-1 block text-zinc-100">
            {formatDate(app.latestRelease?.publishedAt || null)}
          </strong>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-zinc-50">Screenshots</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="min-h-56 rounded-xl border border-dashed border-white/15 bg-white/[0.03]" />
          <div className="min-h-56 rounded-xl border border-dashed border-white/15 bg-white/[0.03]" />
          <div className="min-h-56 rounded-xl border border-dashed border-white/15 bg-white/[0.03]" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-zinc-50">Release history</h2>
        {releases.length === 0 ? (
          <EmptyState
            title="No releases published"
            message="Published APK releases will appear here."
          />
        ) : (
          releases.map((release) => (
            <ReleaseItem key={release.id} release={release} publicView />
          ))
        )}
      </section>
    </section>
  )
}

export default AppDetailPage
