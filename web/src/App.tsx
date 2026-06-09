import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import AppDetailPage from './pages/AppDetailPage'
import CatalogPage from './pages/CatalogPage'

function App() {
  return (
    <BrowserRouter>
      <StoreShell />
    </BrowserRouter>
  )
}

function StoreShell() {
  return (
    <div className="min-h-screen bg-[#020403] text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-3 text-zinc-50 no-underline" to="/">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-sm font-black text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.16)]">
              A
            </span>
            <span>
              <strong className="block text-sm font-semibold sm:text-base">APK Store</strong>
              <small className="block text-xs text-zinc-500">Public Android releases</small>
            </span>
          </Link>
          <nav className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
            <NavLink
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-emerald-400 text-black'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100',
                ].join(' ')
              }
              to="/"
            >
              Catalog
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-emerald-400 text-black'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100',
                ].join(' ')
              }
              to="/admin"
            >
              Admin
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/apps/:slug" element={<AppDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
