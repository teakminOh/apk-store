function LoadingState({ label }: { label: string }) {
  return (
    <div className="inline-flex w-fit items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-emerald-300" />
      {label}
    </div>
  )
}

export default LoadingState
