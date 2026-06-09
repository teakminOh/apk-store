import path from 'node:path'

export type StoreConfig = {
  apksDir: string
  dataDir: string
  dbPath: string
  isProduction: boolean
  maxApkBytes: number
  port: number
  publicDir: string
  sessionSecret: string
}

export function loadConfig(): StoreConfig {
  const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), 'data')
  const maxApkMb = Number(process.env.MAX_APK_MB || 300)

  return {
    apksDir: process.env.APKS_DIR || path.join(dataDir, 'apks'),
    dataDir,
    dbPath: process.env.DB_PATH || path.join(dataDir, 'store.db'),
    isProduction: process.env.NODE_ENV === 'production',
    maxApkBytes: maxApkMb * 1024 * 1024,
    port: Number(process.env.PORT || 8080),
    publicDir:
      process.env.PUBLIC_DIR || path.resolve(process.cwd(), '..', 'web', 'dist'),
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
  }
}
