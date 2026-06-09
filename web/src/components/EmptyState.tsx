function EmptyState({ message, title }: { message: string; title: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
      <h2 className="text-xl font-semibold text-zinc-50">{title}</h2>
      <p className="mt-2 text-sm text-zinc-500">{message}</p>
    </div>
  )
}

export default EmptyState
