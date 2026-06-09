import type { StoreApp } from '../types'

const fieldClass =
  'mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10'

const labelClass = 'block text-sm font-medium text-zinc-300'

function AppMetadataFields({ app }: { app?: StoreApp }) {
  return (
    <>
      <label className={labelClass}>
        <span>Name</span>
        <input className={fieldClass} name="name" defaultValue={app?.name || ''} required />
      </label>
      <label className={labelClass}>
        <span>Slug</span>
        <input
          className={fieldClass}
          name="slug"
          defaultValue={app?.slug || ''}
          placeholder="my-app"
        />
      </label>
      <label className={labelClass}>
        <span>Package name</span>
        <input
          className={fieldClass}
          name="packageName"
          defaultValue={app?.packageName || ''}
          placeholder="com.example.app"
          required
        />
      </label>
      <label className={labelClass}>
        <span>Category</span>
        <input
          className={fieldClass}
          name="category"
          defaultValue={app?.category || 'General'}
          required
        />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        <span>Summary</span>
        <input className={fieldClass} name="summary" defaultValue={app?.summary || ''} required />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        <span>Description</span>
        <textarea
          className={fieldClass}
          name="description"
          defaultValue={app?.description || ''}
          rows={4}
          required
        />
      </label>
      <label className={labelClass}>
        <span>Icon URL</span>
        <input
          className={fieldClass}
          name="iconUrl"
          defaultValue={app?.iconUrl || ''}
          placeholder="https://..."
        />
      </label>
      <label className={labelClass}>
        <span>Tags</span>
        <input
          className={fieldClass}
          name="tags"
          defaultValue={app?.tags.join(', ') || ''}
          placeholder="utility, beta"
        />
      </label>
      <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm font-medium text-zinc-300 sm:col-span-2">
        <input
          className="h-4 w-4 accent-emerald-400"
          name="listed"
          type="checkbox"
          defaultChecked={app?.listed ?? true}
        />
        <span>Show this app in the public catalog</span>
      </label>
    </>
  )
}

export default AppMetadataFields
