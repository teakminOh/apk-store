import { useEffect, useMemo, useState } from 'react'
import { listApps } from '../api'
import AppCard from '../components/AppCard'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import Notice from '../components/Notice'
import type { StoreApp } from '../types'
import { errorMessage } from '../utils/errors'

const fieldClass =
  'mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10'
const labelClass = 'text-sm font-medium text-zinc-300'

function CatalogPage() {
  const [apps, setApps] = useState<StoreApp[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError('')
        const nextApps = await listApps()
        if (!cancelled) {
          setApps(nextApps)
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
  }, [])

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(apps.map((app) => app.category))).sort()]
  }, [apps])

  const filteredApps = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return apps.filter((app) => {
      const matchesCategory = category === 'All' || app.category === category
      const searchable = [
        app.name,
        app.packageName,
        app.summary,
        app.category,
        app.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase()

      return matchesCategory && (!needle || searchable.includes(needle))
    })
  }, [apps, category, query])

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="mb-3 text-xs font-bold uppercase text-emerald-300">
            Android release portal
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold text-zinc-50 sm:text-5xl lg:text-6xl">
            Install the latest APKs with clear version metadata.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Browse published apps, verify checksums, and download release builds
            directly from this store.
          </p>
        </div>
        <div className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20 sm:w-44">
          <strong className="block text-4xl font-semibold text-emerald-300">{apps.length}</strong>
          <span className="text-sm text-zinc-500">listed apps</span>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[minmax(0,1fr)_240px]">
        <label className={labelClass}>
          Search
          <input
            className={fieldClass}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, package, or tag"
          />
        </label>
        <label className={labelClass}>
          Category
          <select
            className={fieldClass}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <LoadingState label="Loading apps" />}
      {error && <Notice tone="danger" message={error} />}
      {!loading && !error && filteredApps.length === 0 && (
        <EmptyState
          title="No apps found"
          message="Publish an app from the admin dashboard or adjust the filters."
        />
      )}
      {!loading && !error && filteredApps.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </section>
  )
}

export default CatalogPage
