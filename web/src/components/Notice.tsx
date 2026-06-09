function Notice({
  message,
  tone,
}: {
  message: string
  tone: 'danger' | 'success'
}) {
  return (
    <div
      className={[
        'rounded-xl border px-4 py-3 text-sm font-semibold',
        tone === 'success'
          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
          : 'border-red-400/20 bg-red-500/10 text-red-300',
      ].join(' ')}
    >
      {message}
    </div>
  )
}

export default Notice
