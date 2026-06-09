import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import type { StoreConfig } from './config'

export type StoreDb = Database.Database

export function openDatabase(config: StoreConfig): StoreDb {
  mkdirSync(path.dirname(config.dbPath), { recursive: true })
  mkdirSync(config.apksDir, { recursive: true })

  const db = new Database(config.dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      package_name TEXT NOT NULL,
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_url TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'General',
      tags_json TEXT NOT NULL DEFAULT '[]',
      listed INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
      version_name TEXT NOT NULL,
      version_code INTEGER NOT NULL,
      changelog TEXT NOT NULL,
      apk_path TEXT NOT NULL,
      original_file_name TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
      published_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS download_events (
      id TEXT PRIMARY KEY,
      release_id TEXT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
      occurred_at TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      user_agent TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_apps_listed ON apps(listed);
    CREATE INDEX IF NOT EXISTS idx_releases_app_status ON releases(app_id, status);
    CREATE INDEX IF NOT EXISTS idx_download_events_release ON download_events(release_id);
  `)

  return db
}
