import type { AppRelease } from '../types'
import { formatBytes } from '../utils/format'

function ReleaseItem({
  publicView = false,
  release,
}: {
  publicView?: boolean
  release: AppRelease
}) {
  return (
    <article className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-zinc-50">{release.versionName}</h3>
          <span
            className={[
              'rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
              release.status === 'published'
                ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20'
                : 'bg-zinc-800 text-zinc-400 ring-white/10',
            ].join(' ')}
          >
            {release.status}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {release.changelog || 'No changelog provided.'}
        </p>
      </div>
      <dl className="grid gap-3 text-sm md:grid-cols-[150px_120px_minmax(0,1fr)]">
        <div>
          <dt className="text-xs font-medium text-zinc-500">Version code</dt>
          <dd className="mt-1 font-semibold text-zinc-100">{release.versionCode}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-zinc-500">Size</dt>
          <dd className="mt-1 font-semibold text-zinc-100">{formatBytes(release.sizeBytes)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-zinc-500">SHA-256</dt>
          <dd className="mt-1 break-all font-mono text-xs font-medium text-zinc-300">
            {release.sha256}
          </dd>
        </div>
      </dl>
      {publicView && release.downloadUrl && (
        <a
          className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
          href={release.downloadUrl}
        >
          Download APK
        </a>
      )}
    </article>
  )
}

export default ReleaseItem
