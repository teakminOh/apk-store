import { useEffect, useState, type SubmitEvent } from 'react'
import {
  createAdminApp,
  getCurrentAdmin,
  listAdminApps,
  loginAdmin,
  logoutAdmin,
} from '../api'
import AdminAppEditor from '../admin/AdminAppEditor'
import AppMetadataFields from '../admin/AppMetadataFields'
import EmptyState from '../components/EmptyState'
import LoadingState from '../components/LoadingState'
import Notice from '../components/Notice'
import type { AdminApp, AdminUser } from '../types'
import { errorMessage } from '../utils/errors'
import { formToAppInput } from '../utils/forms'

const fieldClass =
  'mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10'

const labelClass = 'block text-sm font-medium text-zinc-300'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 disabled:cursor-not-allowed disabled:opacity-60'

const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/40 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/20'

function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [apps, setApps] = useState<AdminApp[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function refreshApps() {
    const nextApps = await listAdminApps()
    setApps(nextApps)
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const admin = await getCurrentAdmin()
        if (!cancelled) {
          setUser(admin)
          await refreshApps()
        }
      } catch {
        if (!cancelled) {
          setUser(null)
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

  async function handleLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    try {
      setError('')
      setMessage('')
      const admin = await loginAdmin(
        String(data.get('username') || ''),
        String(data.get('password') || ''),
      )
      setUser(admin)
      form.reset()
      await refreshApps()
    } catch (loginError) {
      setError(errorMessage(loginError))
    }
  }

  async function handleLogout() {
    await logoutAdmin()
    setUser(null)
    setApps([])
  }

  async function handleCreateApp(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    try {
      setError('')
      setMessage('')
      await createAdminApp(formToAppInput(new FormData(form)))
      form.reset()
      setMessage('App created.')
      await refreshApps()
    } catch (createError) {
      setError(errorMessage(createError))
    }
  }

  async function handleAppSaved() {
    setMessage('Changes saved.')
    await refreshApps()
  }

  async function handleReleaseChanged() {
    setMessage('Release updated.')
    await refreshApps()
  }

  if (loading) {
    return <LoadingState label="Checking admin session" />
  }

  if (!user) {
    return (
      <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-10">
        <form
          className="w-full max-w-md rounded-xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/25"
          onSubmit={handleLogin}
        >
          <p className="text-xs font-semibold uppercase text-emerald-300">
            Admin access
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-zinc-50">
            Sign in to manage releases.
          </h1>
          {error && <Notice tone="danger" message={error} />}
          <label className={`${labelClass} mt-6`}>
            <span>Username</span>
            <input className={fieldClass} name="username" autoComplete="username" required />
          </label>
          <label className={`${labelClass} mt-4`}>
            <span>Password</span>
            <input
              className={fieldClass}
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className={`${primaryButtonClass} mt-6 w-full`} type="submit">
            Sign in
          </button>
        </form>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-300">
            Admin dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50 sm:text-4xl">
            Apps and releases
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
            Create app records, upload APKs, and control publish state.
          </p>
        </div>
        <button className={secondaryButtonClass} type="button" onClick={handleLogout}>
          Sign out {user.username}
        </button>
      </div>

      {message && <Notice tone="success" message={message} />}
      {error && <Notice tone="danger" message={error} />}

      <form
        className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20 sm:grid-cols-2"
        onSubmit={handleCreateApp}
      >
        <div className="sm:col-span-2">
          <h2 className="text-xl font-semibold text-zinc-50">Create app</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Start with metadata, then add releases below.
          </p>
        </div>
        <AppMetadataFields />
        <button className={`${primaryButtonClass} w-full sm:w-fit`} type="submit">
          Create app
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-50">Manage catalog</h2>
        {apps.length === 0 ? (
          <EmptyState
            title="No apps yet"
            message="Create the first app record to upload an APK release."
          />
        ) : (
          apps.map((app) => (
            <AdminAppEditor
              key={app.id}
              app={app}
              onError={setError}
              onSaved={handleAppSaved}
              onReleaseChanged={handleReleaseChanged}
            />
          ))
        )}
      </section>
    </section>
  )
}

export default AdminPage
