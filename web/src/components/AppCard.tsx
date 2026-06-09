import { Link } from 'react-router-dom'
import type { StoreApp } from '../types'
import { formatBytes, formatDate } from '../utils/format'
import AppIcon from './AppIcon'

function AppCard({ app }: { app: StoreApp }) {
  return (
    <article className="flex min-h-full flex-col gap-5 rounded-xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 transition hover:border-emerald-400/30 hover:bg-white/[0.055]">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
        <AppIcon app={app} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-50">{app.name}</h2>
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
              {app.category}
            </span>
          </div>
          <p className="mt-1 break-all font-mono text-xs text-zinc-500">{app.packageName}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{app.summary}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {app.tags.map((tag) => (
          <span
            className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-400 ring-1 ring-white/10"
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="grid gap-3 rounded-lg border border-white/10 bg-black/30 p-3 text-sm sm:grid-cols-3">
        {app.latestRelease ? (
          <>
            <div>
              <span className="block text-xs font-medium text-zinc-500">Latest</span>
              <strong className="mt-1 block text-zinc-100">{app.latestRelease.versionName}</strong>
            </div>
            <div>
              <span className="block text-xs font-medium text-zinc-500">Size</span>
              <strong className="mt-1 block text-zinc-100">{formatBytes(app.latestRelease.sizeBytes)}</strong>
            </div>
            <div>
              <span className="block text-xs font-medium text-zinc-500">Published</span>
              <strong className="mt-1 block text-zinc-100">{formatDate(app.latestRelease.publishedAt)}</strong>
            </div>
          </>
        ) : (
          <p className="text-zinc-500">No published release yet.</p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07]"
          to={`/apps/${app.slug}`}
        >
          Details
        </Link>
        {app.latestRelease?.downloadUrl && (
          <a
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
            href={app.latestRelease.downloadUrl}
          >
            Download APK
          </a>
        )}
      </div>
    </article>
  )
}

export default AppCard
