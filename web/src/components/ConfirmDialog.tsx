function ConfirmDialog({
  confirmLabel = 'Confirm',
  message,
  onCancel,
  onConfirm,
  title,
}: {
  confirmLabel?: string
  message: string
  onCancel: () => void
  onConfirm: () => void
  title: string
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <section
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black"
        role="dialog"
      >
        <h2 className="text-xl font-semibold text-zinc-50" id="confirm-dialog-title">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07]"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 px-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmDialog
