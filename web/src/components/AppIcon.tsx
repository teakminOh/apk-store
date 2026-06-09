import type { StoreApp } from '../types'
import { initials } from '../utils/format'

function AppIcon({
  app,
  large = false,
}: {
  app: Pick<StoreApp, 'iconUrl' | 'name'>
  large?: boolean
}) {
  const className = [
    'grid shrink-0 place-items-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 font-black text-emerald-300 shadow-[0_0_34px_rgba(16,185,129,0.12)]',
    large ? 'h-20 w-20 text-2xl sm:h-24 sm:w-24' : 'h-12 w-12 text-base',
  ].join(' ')

  if (app.iconUrl) {
    return (
      <img className={className} src={app.iconUrl} alt={`${app.name} icon`} />
    )
  }

  return (
    <span className={className}>
      {initials(app.name)}
    </span>
  )
}

export default AppIcon
