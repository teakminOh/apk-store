import { buildServer, seedAdminUser } from './app'
import { loadConfig } from './config'
import { openDatabase } from './db'

async function main() {
  const config = loadConfig()
  const db = openDatabase(config)
  seedAdminUser(db)

  const app = await buildServer(config, db)
  await app.listen({ host: '0.0.0.0', port: config.port })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
