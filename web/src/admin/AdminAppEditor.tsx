import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createRelease,
  deleteRelease,
  updateAdminApp,
  updateRelease,
} from '../api'
import AppIcon from '../components/AppIcon'
import ConfirmDialog from '../components/ConfirmDialog'
import ReleaseItem from '../components/ReleaseItem'
import type { AdminApp, AppRelease } from '../types'
import { errorMessage } from '../utils/errors'
import { formToAppInput } from '../utils/forms'
import AppMetadataFields from './AppMetadataFields'

const fieldClass =
  'mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-400 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-black hover:file:bg-emerald-300'

const labelClass = 'block text-sm font-medium text-zinc-300'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 disabled:cursor-not-allowed disabled:opacity-60'

const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/40 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/20'

const dangerButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:border-red-300/40 hover:bg-red-500/15 focus:outline-none focus:ring-2 focus:ring-red-300/20'

function AdminAppEditor({
  app,
  onError,
  onReleaseChanged,
  onSaved,
}: {
  app: AdminApp
  onError: (message: string) => void
  onReleaseChanged: () => Promise<void>
  onSaved: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [releaseToDelete, setReleaseToDelete] = useState<AppRelease | null>(null)
  const navigate = useNavigate()

  async function handleSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      onError('')
      await updateAdminApp(app.id, formToAppInput(new FormData(event.currentTarget)))
      await onSaved()
    } catch (saveError) {
      onError(errorMessage(saveError))
    }
  }

  async function handleUpload(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    try {
      onError('')
      await createRelease(app.id, formData)
      form.reset()
      await onReleaseChanged()
    } catch (uploadError) {
      onError(errorMessage(uploadError))
    }
  }

  async function handleStatus(release: AppRelease) {
    try {
      onError('')
      await updateRelease(release.id, {
        status: release.status === 'published' ? 'draft' : 'published',
      })
      await onReleaseChanged()
    } catch (statusError) {
      onError(errorMessage(statusError))
    }
  }

  async function confirmDeleteRelease() {
    if (!releaseToDelete) {
      return
    }

    try {
      onError('')
      await deleteRelease(releaseToDelete.id)
      setReleaseToDelete(null)
      await onReleaseChanged()
    } catch (deleteError) {
      onError(errorMessage(deleteError))
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <AppIcon app={app} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-zinc-50">{app.name}</h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                app.listed
                  ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20'
                  : 'bg-zinc-900 text-zinc-400 ring-white/10'
              }`}
            >
              {app.listed ? 'Listed' : 'Hidden'}
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-xs text-zinc-500">{app.packageName}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button
            className={secondaryButtonClass}
            type="button"
            onClick={() => navigate(`/apps/${app.slug}`)}
          >
            View
          </button>
          <button className={secondaryButtonClass} type="button" onClick={() => setOpen(!open)}>
            {open ? 'Close' : 'Manage'}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-6 border-t border-white/10 p-5">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSave}>
            <AppMetadataFields app={app} />
            <button className={`${primaryButtonClass} w-full sm:w-fit`} type="submit">
              Save metadata
            </button>
          </form>

          <form
            className="grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3"
            onSubmit={handleUpload}
          >
            <div className="sm:col-span-3">
              <h4 className="text-base font-semibold text-zinc-50">
                Upload APK release
              </h4>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                APK files are stored by the backend and checked with SHA-256.
              </p>
            </div>
            <label className={labelClass}>
              <span>Version name</span>
              <input className={fieldClass} name="versionName" placeholder="1.0.0" required />
            </label>
            <label className={labelClass}>
              <span>Version code</span>
              <input
                className={fieldClass}
                name="versionCode"
                type="number"
                min="1"
                placeholder="1"
                required
              />
            </label>
            <label className={labelClass}>
              <span>Status</span>
              <select className={fieldClass} name="status" defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label className={`${labelClass} sm:col-span-3`}>
              <span>Changelog</span>
              <textarea
                className={fieldClass}
                name="changelog"
                rows={3}
                placeholder="What changed?"
              />
            </label>
            <label className={`${labelClass} sm:col-span-3`}>
              <span>APK file</span>
              <input className={fieldClass} name="apk" type="file" accept=".apk" required />
            </label>
            <button className={`${primaryButtonClass} w-full sm:w-fit`} type="submit">
              Upload release
            </button>
          </form>

          <div className="space-y-3 border-t border-white/10 pt-6">
            <h4 className="text-base font-semibold text-zinc-50">Releases</h4>
            {app.releases.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-sm text-zinc-500">
                No releases uploaded.
              </p>
            ) : (
              app.releases.map((release) => (
                <div className="space-y-3" key={release.id}>
                  <ReleaseItem release={release} />
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={secondaryButtonClass}
                      type="button"
                      onClick={() => handleStatus(release)}
                    >
                      {release.status === 'published' ? 'Move to draft' : 'Publish'}
                    </button>
                    <button
                      className={dangerButtonClass}
                      type="button"
                      onClick={() => setReleaseToDelete(release)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {releaseToDelete && (
        <ConfirmDialog
          confirmLabel="Delete release"
          message={`This permanently removes ${releaseToDelete.versionName} and its APK file.`}
          onCancel={() => setReleaseToDelete(null)}
          onConfirm={confirmDeleteRelease}
          title="Delete this release?"
        />
      )}
    </article>
  )
}

export default AdminAppEditor
